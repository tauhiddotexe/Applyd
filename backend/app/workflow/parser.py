import json
import re
from pathlib import Path

_SECTION_HEADERS = re.compile(
    r'(?:^|\n)(?:(?:##|###|\*\*)?\s*'
    r'(?:(?:summary|profile|objective|about me|professional summary)'
    r'|(?:experience|work experience|professional experience|employment|work history)'
    r'|(?:education|academic|academic background|qualifications|degrees)'
    r'|(?:skills|technical skills|core competencies|expertise|key skills)'
    r'|(?:projects|personal projects|side projects|open source)'
    r'|(?:certifications|certificates|licenses|credentials)'
    r'|(?:publications|research|papers|thesis)'
    r'|(?:languages|language)'
    r'|(?:awards|honors|achievements|recognition)'
    r'|(?:volunteering|volunteer|community)'
    r'|(?:leadership|leadership experience|leadership & involvement)'
    r'|(?:references|additional|miscellaneous)'
    r')\s*(?::|\n))',
    re.IGNORECASE | re.MULTILINE,
)

_SKILL_TAXONOMY: dict | None = None


def _load_taxonomy() -> dict:
    global _SKILL_TAXONOMY
    if _SKILL_TAXONOMY is not None:
        return _SKILL_TAXONOMY
    path = Path(__file__).parent / "skills.json"
    with open(path) as f:
        _SKILL_TAXONOMY = json.load(f)
    return _SKILL_TAXONOMY


def parse_sections(text: str) -> dict[str, str]:
    text = text.strip()
    lines = text.split("\n")
    header_positions = []
    for i, line in enumerate(lines):
        stripped = line.strip().rstrip(":")
        lower = stripped.lower()
        if lower in (
            "summary", "profile", "objective", "about me", "professional summary",
            "experience", "work experience", "professional experience", "employment", "work history",
            "education", "academic", "qualifications", "academic background", "degrees",
            "skills", "technical skills", "core competencies", "expertise", "key skills",
            "projects", "personal projects", "side projects", "open source",
            "certifications", "certificates", "licenses",
            "publications", "research", "papers",
            "languages", "language",
            "awards", "honors",
            "volunteering", "volunteer",
            "leadership", "leadership experience",
            "references", "additional", "miscellaneous",
        ):
            header_positions.append((i, stripped))
    if not header_positions:
        return {"full_text": text}

    sections = {}
    for idx, (start_idx, section_name) in enumerate(header_positions):
        end_idx = header_positions[idx + 1][0] if idx + 1 < len(header_positions) else len(lines)
        content = "\n".join(lines[start_idx + 1:end_idx]).strip()
        key = section_name.replace(" ", "_")
        sections[key] = content

    top = "\n".join(lines[:header_positions[0][0]]).strip()
    if top:
        sections["header"] = top

    return sections


def parse_resume(resume_text: str) -> dict:
    sections = parse_sections(resume_text)
    return {
        "sections": sections,
        "skills": extract_skills(sections),
        "metrics": extract_metrics(resume_text),
        "titles": extract_titles(sections),
    }


def extract_skills(sections: dict) -> list[str]:
    taxonomy = _load_taxonomy()
    all_terms = set()
    for cat in taxonomy.values():
        for term in cat:
            all_terms.add(term)

    text_lower = " ".join(sections.values()).lower() if sections else ""
    found = set()
    for term in all_terms:
        if term in text_lower:
            found.add(term)

    return sorted(found)


def extract_metrics(text: str) -> list[str]:
    metrics = []
    for match in re.finditer(r'\b\d+%?\b', text):
        metrics.append(match.group())
    return metrics[:10]


def extract_titles(sections: dict) -> list[str]:
    title_kw = {"engineer", "developer", "scientist", "analyst",
                "manager", "architect", "intern", "lead",
                "director", "head of", "consultant", "specialist",
                "coordinator", "associate", "administrator",
                "designer", "researcher", "officer", "president",
                "vp", "vice president", "principal", "staff"}
    titles = []
    for content in sections.values():
        for line in content.split("\n"):
            line = line.strip()
            if not line:
                continue
            lower = line.lower()
            if any(kw in lower for kw in title_kw):
                titles.append(line)
    return titles[:5]
