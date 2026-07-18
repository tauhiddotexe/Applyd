from typing import TypedDict, Optional


class ResumeState(TypedDict):
    resume_text: str
    job_description: str
    resume_summary: str
    keywords: list[str]
    before_score: int

    analysis_result: Optional[dict]
    improved_points: list[dict]
    suggestions: list[str]
    after_score: int
    improvement: int

    error: Optional[str]
    retries: int
    mode: str

    parsed_resume: Optional[dict]
    parsed_jd: Optional[dict]
    matched_keywords: list[str]
    missing_keywords: list[str]
    semantic_score: float
    keyword_score: int
    section_coverage: float
    score_breakdown: Optional[dict]
    structured_tailor: Optional[dict]
    extracted_resume: Optional[dict]
    structured_tailor_resume: Optional[dict]
