import hashlib
import json
import re

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from app.core.config import settings
from app.core.logging import logger
from .state import ResumeState
from .prompts import ANALYZE_SYSTEM, TAILOR_SYSTEM, VALIDATE_SYSTEM, EXTRACT_SYSTEM
from .parser import parse_resume
from .scorer import (
    keyword_match_score,
    semantic_similarity_score,
    section_coverage_score,
    compute_final_score,
    get_score_breakdown,
    _normalize,
)

def _extract_summary(resume_text: str) -> str:
    lines = [l.strip() for l in resume_text.split('\n') if l.strip()]
    bullets = [l for l in lines if l.startswith(('-', '*', '•')) or (len(l) > 15 and l[0].isdigit())]
    if len(bullets) >= 5:
        return "\n".join(bullets[:12])
    return "\n".join([l for l in lines if 20 < len(l) < 200][:15])


def _extract_ground_truth(resume_text: str) -> str:
    parsed = parse_resume(resume_text)
    skills = parsed.get("skills", [])
    metrics = parsed.get("metrics", [])
    titles = parsed.get("titles", [])
    sections = parsed.get("sections", {})
    parts = [
        f"SKILLS: {', '.join(skills)}" if skills else "SKILLS: (none detected)",
        f"METRICS: {', '.join(metrics[:5])}" if metrics else "METRICS: (none detected)",
        f"TITLES: {' | '.join(titles[:3])}" if titles else "TITLES: (none detected)",
    ]
    for sec_name in ["experience", "education", "projects", "certifications"]:
        content = sections.get(sec_name)
        if content:
            parts.append(f"{sec_name.upper()}:\n{content[:500]}")
    return "\n\n".join(parts)


class _AllModelsFailed(Exception):
    pass


def _get_llm(model: str):
    return ChatOpenAI(
        model=model,
        openai_api_key=settings.OPENROUTER_API_KEY,
        openai_api_base="https://openrouter.ai/api/v1",
        temperature=0.3,
        max_tokens=4096,
    )


def _extract_json(text: str) -> dict:
    text = re.sub(r'^```(?:json)?\s*|\s*```$', '', text.strip(), flags=re.DOTALL)
    brace_start = text.find("{")
    if brace_start >= 0:
        brace_count = 0
        for i in range(brace_start, len(text)):
            if text[i] == "{":
                brace_count += 1
            elif text[i] == "}":
                brace_count -= 1
                if brace_count == 0:
                    candidate = text[brace_start:i+1]
                    try:
                        return json.loads(candidate)
                    except json.JSONDecodeError:
                        pass
    raise json.JSONDecodeError("Could not extract valid JSON", text, 0)


def _cache_key(system: str, user: str) -> str:
    return hashlib.md5((system + user).encode()).hexdigest()


_CACHE: dict[str, dict] = {}
_CACHE_MAX = 64


def _call_llm_json(system: str, user: str) -> dict:
    key = _cache_key(system, user)
    if key in _CACHE:
        logger.debug("LLM cache hit")
        return _CACHE[key]

    models = settings.model_fallback_chain
    last_error = None
    for model in models:
        try:
            llm = _get_llm(model)
            msg = llm.invoke([
                SystemMessage(content=system),
                HumanMessage(content=user),
            ])
            text = (msg.content or "").strip()
            if not text:
                raise ValueError("Empty response from model")
            result = _extract_json(text)
            if len(_CACHE) >= _CACHE_MAX:
                _CACHE.clear()
            _CACHE[key] = result
            return result
        except Exception as e:
            logger.warning(f"Model '{model}' failed: {e}")
            last_error = e
            continue
    raise _AllModelsFailed(f"All {len(models)} models failed. Last error: {last_error}")


def call_extract_llm(state: ResumeState) -> dict:
    try:
        result = _call_llm_json(EXTRACT_SYSTEM, state["resume_text"])
        return {"extracted_resume": result}
    except Exception as e:
        logger.error(f"Resume extraction LLM failed: {e}")
        fallback = {
            "contact": {},
            "summary": "",
            "experiences": [],
            "education": [],
            "skills": [],
            "projects": [],
            "certifications": [],
            "languages": [],
        }
        return {"extracted_resume": fallback}


def preprocess(state: ResumeState) -> dict:
    resume = state["resume_text"].replace("{", "{{").replace("}", "}}")
    jd = state["job_description"].replace("{", "{{").replace("}", "}}")

    parsed_resume = parse_resume(resume)
    jd_text = jd

    kw_score, matched_kw, missing_kw = keyword_match_score(resume, jd_text)
    sem_score = semantic_similarity_score(resume, jd_text)
    sec_cvg = section_coverage_score(parsed_resume.get("sections", {}))

    jd_kw_set = _normalize(jd_text)
    keywords = sorted(list(jd_kw_set), key=len, reverse=True)[:12]

    before = compute_final_score(kw_score, sem_score, 0, sec_cvg)
    llm_score_placeholder = min(kw_score, int(sem_score * 100))

    return {
        "resume_summary": _extract_summary(resume),
        "parsed_resume": parsed_resume,
        "keywords": keywords,
        "matched_keywords": matched_kw,
        "missing_keywords": missing_kw,
        "keyword_score": kw_score,
        "semantic_score": sem_score,
        "section_coverage": sec_cvg,
        "before_score": before,
    }


def extract_ground_truth(state: ResumeState) -> dict:
    gt = _extract_ground_truth(state["resume_text"])
    return {"resume_summary": gt}


def call_analyze_llm(state: ResumeState) -> dict:
    try:
        parsed = state.get("parsed_resume", {})
        sections_text = ""
        if parsed:
            sections_text = "\n\nResume Sections:\n" + json.dumps(
                {k: v[:200] for k, v in parsed.get("sections", {}).items()},
                indent=2,
            )
        user = (
            f"Resume Summary:\n{state['resume_summary']}\n\n"
            f"Detected Skills: {', '.join(state['matched_keywords'][:20])}\n\n"
            f"Missing JD Keywords: {', '.join(state['missing_keywords'][:15])}\n\n"
            f"Job Description Keywords: {', '.join(state['keywords'])}\n\n"
            f"Full Resume:\n{state['resume_text']}\n\n"
            f"Full Job Description:\n{state['job_description']}"
            f"{sections_text}"
        )
        result = _call_llm_json(ANALYZE_SYSTEM, user)
        llm_score = result.get("match_score", 0)
        if not isinstance(llm_score, (int, float)):
            llm_score = 0

        final = compute_final_score(
            state.get("keyword_score", 0),
            state.get("semantic_score", 0.0),
            llm_score,
            state.get("section_coverage", 0.0),
        )
        breakdown = get_score_breakdown(
            state.get("keyword_score", 0),
            state.get("semantic_score", 0.0),
            llm_score,
            state.get("section_coverage", 0.0),
            final,
        )
        return {
            "analysis_result": result,
            "before_score": final,
            "score_breakdown": breakdown,
        }
    except Exception as e:
        logger.error(f"Analyze LLM failed: {e}")
        existing = state.get("before_score", 0)
        return {
            "analysis_result": {
                "match_score": existing,
                "summary": "AI analysis unavailable. Showing embedding + keyword score.",
                "strengths": [],
                "missing_keywords": state.get("missing_keywords", [])[:10],
                "improvements": ["AI analysis temporarily unavailable. Try again later."],
            }
        }


def _structured_to_flat_text(structured: dict) -> str:
    lines = []
    summary = structured.get("summary", "")
    if summary:
        lines.append(f"SUMMARY\n  {summary}")
    for exp in structured.get("experiences", []):
        title = exp.get("job_title", "")
        company = exp.get("company", "")
        if title or company:
            lines.append(f"{title} @ {company}".strip("@ "))
        for b in exp.get("bullets", []):
            lines.append(f"  - {b}")
    for proj in structured.get("projects", []):
        name = proj.get("name", "")
        if name:
            lines.append(f"PROJECT: {name}")
        for b in proj.get("bullets", []):
            lines.append(f"  - {b}")
    skills = structured.get("skills", [])
    if skills:
        lines.append(f"SKILLS: {', '.join(skills)}")
    for edu in structured.get("education", []):
        degree = edu.get("degree", "")
        school = edu.get("school", "")
        if degree or school:
            lines.append(f"{degree} - {school}".strip(" -"))
    return "\n".join(lines)


def _sections_to_text(sections: list[dict]) -> str:
    lines = []
    for sec in sections:
        name = sec.get("name", "")
        improved_bullets = sec.get("improved_bullets")
        improved = sec.get("improved")
        if improved_bullets:
            lines.append(name.upper())
            for b in improved_bullets:
                lines.append(f"  - {b}")
        elif improved:
            lines.append(name.upper())
            lines.append(f"  {improved}")
    return "\n".join(lines)


def _structured_to_old_sections(structured: dict) -> list[dict]:
    sections = []
    summary = structured.get("summary", "")
    if summary:
        sections.append({"name": "Summary", "original": "", "improved": summary})
    for exp in structured.get("experiences", []):
        title = exp.get("job_title", "")
        company = exp.get("company", "")
        dates = f"{exp.get('start_date', '')} - {exp.get('end_date', '')}"
        name = f"{title} @ {company}" if title and company else (title or company or "Experience")
        original = f"{title} at {company} ({dates})" if title and company else dates
        bullets = exp.get("bullets", [])
        if bullets:
            sections.append({
                "name": name,
                "original": original,
                "original_bullets": bullets,
                "improved_bullets": list(bullets),
            })
    skills = structured.get("skills", [])
    if skills:
        sections.append({"name": "Skills", "original": ", ".join(skills), "improved": ", ".join(skills)})
    for edu in structured.get("education", []):
        degree = edu.get("degree", "")
        school = edu.get("school", "")
        dates = f"{edu.get('start_date', '')} - {edu.get('end_date', '')}"
        name = f"{degree} @ {school}" if degree and school else (degree or school or "Education")
        original = f"{degree} at {school} ({dates})" if degree and school else dates
        sections.append({"name": name, "original": original, "improved": original})
    for proj in structured.get("projects", []):
        name = proj.get("name", "Project")
        bullets = proj.get("bullets", [])
        if bullets:
            sections.append({"name": name, "original_bullets": bullets, "improved_bullets": list(bullets)})
    certs = structured.get("certifications", [])
    if certs:
        sections.append({"name": "Certifications", "original": ", ".join(certs), "improved": ", ".join(certs)})
    return sections


def call_tailor_llm(state: ResumeState) -> dict:
    gt = _extract_ground_truth(state["resume_text"])
    system = TAILOR_SYSTEM.replace("{ground_truth}", gt)
    jd_keywords = state.get("keywords", [])
    matched = state.get("matched_keywords", [])
    missing = state.get("missing_keywords", [])

    extracted = state.get("extracted_resume") or {}
    resume_json = _resume_to_prompt_text(extracted)
    jd_for_prompt = state["job_description"]

    user = (
        f"Job Description:\n{jd_for_prompt}\n\n"
        f"Top JD Keywords: {', '.join(jd_keywords)}\n\n"
        f"Already-matched keywords: {', '.join(matched[:10])}\n\n"
        f"Missing keywords to incorporate (if truthful): {', '.join(missing[:10])}\n\n"
        f"Structured Resume to Tailor:\n{resume_json}\n\n"
        f"Return the COMPLETE tailored resume JSON following the schema. "
        f"Preserve all metadata. Only improve the descriptive content."
    )
    try:
        result = _call_llm_json(system, user)
        improved_points = []
        for exp in result.get("experiences", []):
            for b in exp.get("bullets", []):
                improved_points.append({"original": "", "improved": b})
        for proj in result.get("projects", []):
            for b in proj.get("bullets", []):
                improved_points.append({"original": "", "improved": b})
        summary = result.get("summary", "")
        if summary:
            improved_points.append({"original": "", "improved": summary})

        old_sections = _structured_to_old_sections(result)

        return {
            "improved_points": improved_points,
            "structured_tailor": {"sections": old_sections, "suggestions": result.get("suggestions", []), "summary": result.get("tailoring_strategy", "")},
            "structured_tailor_resume": result,
            "suggestions": result.get("suggestions", []),
        }
    except Exception as e:
        logger.error(f"Tailor LLM failed: {e}")
        return {
            "improved_points": [],
            "structured_tailor": None,
            "structured_tailor_resume": None,
            "suggestions": ["Tailoring temporarily unavailable. Try again later."],
            "error": str(e),
        }


def _resume_to_prompt_text(extracted: dict) -> str:
    lines = []
    contact = extracted.get("contact", {})
    if contact.get("name"):
        lines.append(f"Name: {contact['name']}")
    if contact.get("email"):
        lines.append(f"Email: {contact['email']}")
    summary = extracted.get("summary", "")
    if summary:
        lines.append(f"\nSUMMARY:\n{summary}")
    for exp in extracted.get("experiences", []):
        title = exp.get("job_title", "")
        company = exp.get("company", "")
        dates = f"{exp.get('start_date', '')} - {exp.get('end_date', '')}"
        lines.append(f"\n{title} @ {company} ({dates})")
        for b in exp.get("bullets", []):
            lines.append(f"  - {b}")
    skills = extracted.get("skills", [])
    if skills:
        lines.append(f"\nSKILLS: {', '.join(skills)}")
    for edu in extracted.get("education", []):
        degree = edu.get("degree", "")
        school = edu.get("school", "")
        dates = f"{edu.get('start_date', '')} - {edu.get('end_date', '')}"
        lines.append(f"\n{degree} - {school} ({dates})")
    for proj in extracted.get("projects", []):
        name = proj.get("name", "")
        lines.append(f"\nPROJECT: {name}")
        for b in proj.get("bullets", []):
            lines.append(f"  - {b}")
    certs = extracted.get("certifications", [])
    if certs:
        lines.append(f"\nCERTIFICATIONS: {', '.join(certs)}")
    langs = extracted.get("languages", [])
    if langs:
        lines.append(f"\nLANGUAGES: {', '.join(langs)}")
    return "\n".join(lines)


def validate_tailored(state: ResumeState) -> dict:
    gt = _extract_ground_truth(state["resume_text"])
    system = VALIDATE_SYSTEM.replace("{ground_truth}", gt)
    points_text = "\n".join(
        f"[{i}] {p.get('improved', p) if isinstance(p, dict) else p}"
        for i, p in enumerate(state["improved_points"])
    )
    user = f"Tailored bullet points to validate:\n{points_text}"
    try:
        result = _call_llm_json(system, user)
        if result.get("is_clean"):
            return {"retries": 0}
        retries = state.get("retries", 0) + 1
        logger.warning(f"Validation failed (attempt {retries}): {result.get('violations', [])}")
        if retries >= 2:
            logger.info("Max retries reached. Proceeding with current output.")
            return {"retries": retries}
        return {"retries": retries, "error": "validation_failed"}
    except Exception as e:
        logger.error(f"Validation LLM failed: {e}")
        return {"retries": 0}


def score_final(state: ResumeState) -> dict:
    parsed = state.get("parsed_resume", parse_resume(state["resume_text"]))
    sections = parsed.get("sections", {})

    structured_resume = state.get("structured_tailor_resume")
    if structured_resume:
        tailored_text = _structured_to_flat_text(structured_resume)
    else:
        structured = state.get("structured_tailor")
        if structured and structured.get("sections"):
            tailored_text = _sections_to_text(structured["sections"])
        else:
            points = state.get("improved_points", [])
            tailored_text = " ".join(
                p.get("improved", p) if isinstance(p, dict) else p
                for p in points
            )

    full_text = tailored_text if tailored_text.strip() else state["resume_text"]

    kw_score, matched_kw, missing_kw = keyword_match_score(full_text, state["job_description"])
    sem_score = semantic_similarity_score(full_text, state["job_description"])
    sec_cvg = section_coverage_score(sections)

    llm_val = state.get("analysis_result", {})
    llm_score = 0
    if isinstance(llm_val, dict):
        llm_score = llm_val.get("match_score", 0)
    if not isinstance(llm_score, (int, float)):
        llm_score = 0

    after = compute_final_score(kw_score, sem_score, llm_score, sec_cvg)
    imp = max(0, after - state.get("before_score", 0))

    breakdown = get_score_breakdown(kw_score, sem_score, llm_score, sec_cvg, after)

    return {
        "after_score": after,
        "improvement": imp,
        "score_breakdown": breakdown,
        "matched_keywords": matched_kw,
        "missing_keywords": missing_kw,
    }
