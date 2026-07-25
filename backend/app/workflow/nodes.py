import hashlib
import json
import re

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from app.core.config import settings
from app.core.logging import logger
from app.services.model_selection import LlmPurpose, resolve_fallback_chain
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


class _AllModelsFailed(Exception):
    pass


def _get_llm(model: str, temperature: float = 0.3):
    return ChatOpenAI(
        model=model,
        openai_api_key=settings.active_llm_api_key,
        openai_api_base=settings.active_llm_base_url,
        temperature=temperature,
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


def _call_llm_json(system: str, user: str, purpose: LlmPurpose = LlmPurpose.SCORING, temperature: float = 0.3) -> dict:
    key = _cache_key(system + purpose.value, user)
    if key in _CACHE:
        logger.debug("LLM cache hit")
        return _CACHE[key]

    models = resolve_fallback_chain(purpose)
    last_error = None
    for model in models:
        try:
            llm = _get_llm(model, temperature)
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
        result = _call_llm_json(EXTRACT_SYSTEM, state["resume_text"], purpose=LlmPurpose.EXTRACT)
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

    has_salary = state.get("has_salary", True)

    return {
        "parsed_resume": parsed_resume,
        "keywords": keywords,
        "matched_keywords": matched_kw,
        "missing_keywords": missing_kw,
        "keyword_score": kw_score,
        "semantic_score": sem_score,
        "section_coverage": sec_cvg,
        "has_salary": has_salary,
    }


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
            f"CANDIDATE PROFILE:\n"
            f"Skills: {', '.join(state['matched_keywords'][:20])}\n\n"
            f"Full Resume:\n{state['resume_text']}\n\n"
            f"JOB LISTING:\n{state['job_description']}"
            f"{sections_text}"
        )
        result = _call_llm_json(ANALYZE_SYSTEM, user, purpose=LlmPurpose.SCORING)
        llm_score = result.get("match_score", 0)
        if not isinstance(llm_score, (int, float)):
            llm_score = 0
        llm_score = max(0, min(100, int(round(llm_score))))

        has_salary = state.get("has_salary", True)
        penalize = settings.PENALIZE_MISSING_SALARY
        penalty_val = settings.MISSING_SALARY_PENALTY
        final = compute_final_score(
            llm_score,
            has_salary=has_salary,
            penalize_missing_salary=penalize,
            missing_salary_penalty=penalty_val,
        )

        salary_penalty_applied = penalize and not has_salary
        breakdown = get_score_breakdown(
            state.get("keyword_score", 0),
            state.get("semantic_score", 0.0),
            llm_score,
            state.get("section_coverage", 0.0),
            final,
            salary_penalty_applied=salary_penalty_applied,
        )
        return {
            "analysis_result": result,
            "before_score": final,
            "score_breakdown": breakdown,
        }
    except Exception as e:
        logger.error(f"Analyze LLM failed: {e}")
        return {
            "analysis_result": {
                "match_score": 0,
                "reason": "AI analysis unavailable.",
                "strengths": [],
                "missing_keywords": state.get("missing_keywords", [])[:10],
                "improvements": ["AI analysis temporarily unavailable. Try again later."],
            },
            "before_score": 0,
        }


def call_tailor_llm(state: ResumeState) -> dict:
    style = state.get("writing_style", {})
    tone = style.get("tone", "professional")
    formality = style.get("formality", "neutral")
    output_language = style.get("output_language", "en")

    extracted = state.get("extracted_resume") or {}
    profile_json = _resume_to_prompt_text(extracted)
    jd = state["job_description"]

    system = TAILOR_SYSTEM.replace("{job_description}", jd)
    system = system.replace("{profile_json}", profile_json)
    system = system.replace("{tone}", tone)
    system = system.replace("{formality}", formality)
    system = system.replace("{output_language}", output_language)

    user = (
        f"Job Description:\n{jd}\n\n"
        f"My Profile:\n{profile_json}\n\n"
        f"Generate headline, summary, and skills tailored to this job."
    )
    try:
        result = _call_llm_json(system, user, purpose=LlmPurpose.TAILORING, temperature=0.4)
        headline = result.get("headline", "")
        ai_summary = result.get("summary", "")
        ai_skills = result.get("skills", [])

        merged = _merge_tailored_with_original(extracted, headline, ai_summary, ai_skills)

        improved_points = []
        if ai_summary:
            improved_points.append({"original": extracted.get("summary", ""), "improved": ai_summary})
        for skill_group in ai_skills:
            for kw in skill_group.get("keywords", []):
                improved_points.append({"original": "", "improved": kw})

        return {
            "improved_points": improved_points,
            "structured_tailor_resume": merged,
            "structured_tailor": {
                "sections": [{"name": "Summary", "original": "", "improved": ai_summary}],
                "suggestions": [],
                "summary": f"Tailored with headline: {headline}",
            },
            "suggestions": [],
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


def _merge_tailored_with_original(
    original: dict, headline: str, ai_summary: str, ai_skills: list[dict]
) -> dict:
    merged = json.loads(json.dumps(original))
    merged["summary"] = ai_summary or original.get("summary", "")
    merged["headline"] = headline

    if ai_skills and isinstance(ai_skills, list):
        existing_skills = merged.get("skills", [])
        if existing_skills and isinstance(existing_skills, list):
            if existing_skills and isinstance(existing_skills[0], str):
                flat = []
                for group in ai_skills:
                    flat.extend(group.get("keywords", []))
                merged["skills"] = flat
            else:
                ai_by_name = {s.get("name", "").lower(): s.get("keywords", []) for s in ai_skills if isinstance(s, dict)}
                for item in existing_skills:
                    name = item.get("name", "").lower() if isinstance(item, dict) else ""
                    if name in ai_by_name:
                        item["keywords"] = ai_by_name[name]
                merged["skills"] = existing_skills
        else:
            merged["skills"] = ai_skills

    return merged


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
        if isinstance(skills, list) and skills and isinstance(skills[0], dict):
            for group in skills:
                name = group.get("name", "")
                keywords = group.get("keywords", [])
                if keywords:
                    lines.append(f"\n{name}: {', '.join(keywords)}")
        else:
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
    tailored = state.get("structured_tailor_resume")
    if not tailored:
        return {"retries": 0}
    summary = tailored.get("summary", "")
    user = f"Original resume content to check against. Verify this tailored summary does not fabricate information:\n\nTailored Summary: {summary}"
    try:
        result = _call_llm_json(VALIDATE_SYSTEM, user, purpose=LlmPurpose.TAILORING)
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
    structured = state.get("structured_tailor_resume")
    if not structured:
        return {
            "after_score": state.get("before_score", 0),
            "improvement": 0,
            "score_breakdown": state.get("score_breakdown"),
            "matched_keywords": state.get("matched_keywords", []),
            "missing_keywords": state.get("missing_keywords", []),
        }

    tailored_summary = structured.get("summary", "")
    tailored_skills = structured.get("skills", [])
    if isinstance(tailored_skills, list) and tailored_skills and isinstance(tailored_skills[0], dict):
        flat_skills = []
        for g in tailored_skills:
            flat_skills.extend(g.get("keywords", []))
    else:
        flat_skills = tailored_skills if isinstance(tailored_skills, list) else []

    tailored_text = (
        f"Summary: {tailored_summary}\n"
        f"Skills: {', '.join(flat_skills) if isinstance(flat_skills, list) else str(flat_skills)}"
    )

    kw_score, matched_kw, _ = keyword_match_score(tailored_text, state["job_description"])
    sem_score = semantic_similarity_score(tailored_text, state["job_description"])

    llm_val = state.get("analysis_result", {})
    llm_score = 0
    if isinstance(llm_val, dict):
        llm_score = llm_val.get("match_score", 0)
    if not isinstance(llm_score, (int, float)):
        llm_score = 0

    has_salary = state.get("has_salary", True)
    penalize = settings.PENALIZE_MISSING_SALARY
    penalty_val = settings.MISSING_SALARY_PENALTY
    after = compute_final_score(
        llm_score,
        has_salary=has_salary,
        penalize_missing_salary=penalize,
        missing_salary_penalty=penalty_val,
    )
    imp = max(0, after - state.get("before_score", 0))

    salary_penalty = penalize and not has_salary
    breakdown = get_score_breakdown(kw_score, sem_score, llm_score, 1.0, after, salary_penalty_applied=salary_penalty)

    return {
        "after_score": after,
        "improvement": imp,
        "score_breakdown": breakdown,
        "matched_keywords": matched_kw,
        "missing_keywords": state.get("missing_keywords", []),
    }
