import json
import re
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

_SEMANTIC_WEIGHT = 0.35
_KEYWORD_WEIGHT = 0.25
_LLM_WEIGHT = 0.30
_SECTION_CVRG_WEIGHT = 0.10

_SKILL_TAXONOMY: dict | None = None

_STOP_WORDS = {
    "and", "the", "to", "of", "a", "in", "for", "is", "on", "that", "by", "this", "with",
    "i", "you", "it", "not", "or", "be", "are", "from", "at", "as", "your", "an", "will",
    "we", "can", "have", "has", "but", "about", "if", "all", "so", "up", "out", "who", "which",
    "required", "requirements", "strong", "familiarity", "plus", "years", "experience",
    "development", "familiar", "knowledge", "skills", "ability", "proficient", "preferred",
    "understanding", "expert", "hands", "bonus", "role", "team", "work", "projects", "tools",
}

_SYNONYMS = {
    "js": "javascript", "reactjs": "react", "node": "nodejs",
    "vuejs": "vue", "ts": "typescript", "postgres": "postgresql",
    "k8s": "kubernetes", "aws": "amazon web services",
    "gcp": "google cloud", "ml": "machine learning",
}


def _load_taxonomy() -> dict:
    global _SKILL_TAXONOMY
    if _SKILL_TAXONOMY is not None:
        return _SKILL_TAXONOMY
    path = Path(__file__).parent / "skills.json"
    with open(path) as f:
        _SKILL_TAXONOMY = json.load(f)
    return _SKILL_TAXONOMY


def _normalize(text: str) -> set:
    text = text.lower()
    for k, v in _SYNONYMS.items():
        text = re.sub(r"\b" + re.escape(k) + r"\b", v, text)
    words = set(re.findall(r"\b[a-z0-9]+\b", text))
    return words - _STOP_WORDS


def keyword_match_score(resume_text: str, jd_text: str) -> tuple[int, list[str], list[str]]:
    resume_kw = _normalize(resume_text)
    jd_kw = _normalize(jd_text)
    if not jd_kw:
        return 0, [], []
    matched = resume_kw & jd_kw
    missing = jd_kw - matched
    score = int((len(matched) / len(jd_kw)) * 100)
    return score, sorted(matched)[:20], sorted(missing)[:20]


def semantic_similarity_score(resume_text: str, jd_text: str, chunk_size: int = 2000) -> float:
    resume_chunks = [resume_text[i:i + chunk_size] for i in range(0, len(resume_text), chunk_size)]
    jd_chunks = [jd_text[i:i + chunk_size] for i in range(0, len(jd_text), chunk_size)]

    if not resume_chunks or not jd_chunks:
        return 0.0

    vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
    all_texts = resume_chunks + jd_chunks
    tfidf = vectorizer.fit_transform(all_texts)

    sim = cosine_similarity(tfidf[:len(resume_chunks)], tfidf[len(resume_chunks):])
    return float(sim.max())


def section_coverage_score(resume_sections: dict) -> float:
    expected = {"experience", "education", "skills"}
    keys_lower = {k.lower() for k in resume_sections}
    found = sum(1 for e in expected if any(e in k for k in keys_lower))
    return min(found / len(expected), 1.0)


def compute_final_score(
    keyword_score: int,
    semantic_score: float,
    llm_score: int,
    section_coverage: float,
) -> int:
    raw = (
        keyword_score * _KEYWORD_WEIGHT
        + semantic_score * 100 * _SEMANTIC_WEIGHT
        + llm_score * _LLM_WEIGHT
        + section_coverage * 100 * _SECTION_CVRG_WEIGHT
    )
    return max(0, min(100, int(round(raw))))


def get_score_breakdown(
    keyword_score: int,
    semantic_score: float,
    llm_score: int,
    section_cvg: float,
    final_score: int,
) -> dict:
    return {
        "keyword_match": keyword_score,
        "semantic_similarity": int(round(semantic_score * 100)),
        "llm_analysis": llm_score,
        "section_coverage": int(round(section_cvg * 100)),
        "final": final_score,
    }
