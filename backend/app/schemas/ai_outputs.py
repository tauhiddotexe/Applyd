from pydantic import BaseModel, Field


class ScoreOutput(BaseModel):
    score: int = Field(..., ge=0, le=100)
    reason: str


class TailoringSkill(BaseModel):
    name: str
    keywords: list[str]


class TailoringOutput(BaseModel):
    headline: str = ""
    summary: str = ""
    skills: list[TailoringSkill] = []


class ProjectSelectionOutput(BaseModel):
    selected_project_ids: list[str] = []


class AnalyzeLLMOutput(BaseModel):
    match_score: int = Field(default=0, ge=0, le=100)
    summary: str = ""
    strengths: list[str] = []
    missing_keywords: list[str] = []
    improvements: list[str] = []


class ValidateOutput(BaseModel):
    is_clean: bool = False
    violations: list[str] = []
    clean_points: list[int] = []
    violating_points: list[int] = []
