import json
import re

from app.core.config import settings
from app.core.logging import logger
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

_SIGNAL_KEYWORDS = [
    "react", "typescript", "javascript", "node", "next",
    "python", "c++", "c#", "java", "go", "rust",
    "aws", "docker", "kubernetes", "sql", "mongodb", "redis",
    "graphql", "rest", "api", "frontend", "backend", "fullstack",
    "machine learning", "ai", "data", "devops", "ci/cd",
]


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
                    candidate = text[brace_start:i + 1]
                    try:
                        return json.loads(candidate)
                    except json.JSONDecodeError:
                        pass
    raise json.JSONDecodeError("Could not extract valid JSON", text, 0)


def _get_llm():
    return ChatOpenAI(
        model=settings.MODEL_TAILOR or settings.LLM_MODEL,
        openai_api_key=settings.active_llm_api_key,
        openai_api_base=settings.active_llm_base_url,
        temperature=0.3,
        max_tokens=2048,
    )


_PROJECT_SELECTION_SYSTEM = """You are a hiring expert selecting the most relevant projects from a candidate's portfolio for a specific job.

Return JSON:
{
  "selected_project_ids": ["<id_1>", "<id_2>", ...]
}

Pick up to {desired_count} projects that best demonstrate skills relevant to the job description.
Only return project IDs that are in the list provided. Never invent project IDs."""


def _build_prompt(job_description: str, projects: list[dict], desired_count: int) -> str:
    project_lines = []
    for p in projects:
        pid = p.get("id", "")
        name = p.get("name", "")
        summary = (p.get("description", "") or "")[:500]
        tags = ", ".join(p.get("keywords", []) or [])
        project_lines.append(f"ID: {pid} | Name: {name} | Tags: {tags} | Summary: {summary[:200]}")
    projects_text = "\n".join(project_lines)
    return (
        f"Job Description:\n{job_description}\n\n"
        f"Candidate Projects:\n{projects_text}\n\n"
        f"Select up to {desired_count} project IDs that best match this job."
    )


def _fallback_pick(job_description: str, projects: list[dict], desired_count: int) -> list[str]:
    jd_lower = job_description.lower()
    scored: list[tuple[int, str]] = []
    for p in projects:
        score = 0
        text = f"{p.get('name', '')} {p.get('description', '')} {' '.join(p.get('keywords', []) or [])}".lower()
        for signal in _SIGNAL_KEYWORDS:
            if signal in jd_lower and signal in text:
                score += 5
        if p.get("is_open_source"):
            score += 2
        if any(tag in text for tag in ["api", "backend", "frontend", "stack"]):
            score += 1
        scored.append((score, str(p.get("id", ""))))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [pid for _, pid in scored[:desired_count] if _ > 0]


def select_projects(
    job_description: str,
    projects: list[dict],
    desired_count: int = 3,
) -> list[str]:
    if not projects or desired_count < 1:
        return []

    system = _PROJECT_SELECTION_SYSTEM.replace("{desired_count}", str(desired_count))
    user = _build_prompt(job_description, projects, desired_count)
    eligible_ids = {str(p.get("id", "")) for p in projects}

    try:
        llm = _get_llm()
        msg = llm.invoke([
            SystemMessage(content=system),
            HumanMessage(content=user),
        ])
        text = (msg.content or "").strip()
        result = _extract_json(text)
        selected = result.get("selected_project_ids", [])
        valid = []
        seen = set()
        for sid in selected:
            sid_str = str(sid).strip()
            if sid_str and sid_str in eligible_ids and sid_str not in seen:
                valid.append(sid_str)
                seen.add(sid_str)
        if valid:
            return valid[:desired_count]
    except Exception as e:
        logger.warning(f"AI project selection failed, using fallback: {e}")

    return _fallback_pick(job_description, projects, desired_count)[:desired_count]
