from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from enum import Enum


class StatusEnum(str, Enum):
    wishlist = "wishlist"
    applied = "applied"
    interviewing = "interviewing"
    offer = "offer"
    rejected = "rejected"


class ApplicationCreate(BaseModel):
    company: str = Field(..., min_length=1, max_length=255)
    role: str = Field(..., min_length=1, max_length=255)
    status: StatusEnum = StatusEnum.applied
    link: str | None = None
    salary_min: int | None = Field(None, alias="salaryMin")
    salary_max: int | None = Field(None, alias="salaryMax")
    currency: str | None = None
    location: str | None = None
    recruiter: str | None = None
    notes: str | None = None
    follow_up: str | None = Field(None, alias="followUp")

    model_config = {"populate_by_name": True}


class ApplicationUpdate(BaseModel):
    company: str | None = Field(None, max_length=255)
    role: str | None = Field(None, max_length=255)
    status: StatusEnum | None = None
    link: str | None = None
    salary_min: int | None = Field(None, alias="salaryMin")
    salary_max: int | None = Field(None, alias="salaryMax")
    currency: str | None = None
    location: str | None = None
    recruiter: str | None = None
    notes: str | None = None
    follow_up: str | None = Field(None, alias="followUp")

    model_config = {"populate_by_name": True}


class ApplicationResponse(BaseModel):
    id: UUID
    user_id: UUID
    company: str
    role: str
    status: StatusEnum
    link: str | None = None
    salary_min: int | None = Field(None, serialization_alias="salaryMin")
    salary_max: int | None = Field(None, serialization_alias="salaryMax")
    currency: str | None = None
    location: str | None = None
    recruiter: str | None = None
    notes: str | None = None
    follow_up: str | None = Field(None, serialization_alias="followUp")
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}


class ApplicationEventResponse(BaseModel):
    id: UUID
    application_id: UUID = Field(serialization_alias="applicationId")
    type: str
    date: datetime
    notes: str | None = None

    model_config = {"from_attributes": True, "populate_by_name": True}


class ApplicationEventCreate(BaseModel):
    type: str = Field(..., min_length=1, max_length=255)
    date: datetime
    notes: str | None = None


class ApplicationDocumentResponse(BaseModel):
    id: UUID
    application_id: UUID = Field(serialization_alias="applicationId")
    name: str
    file_url: str = Field(serialization_alias="fileUrl")
    created_at: datetime = Field(serialization_alias="createdAt")

    model_config = {"from_attributes": True, "populate_by_name": True}


class ApplicationDetailResponse(ApplicationResponse):
    events: list[ApplicationEventResponse] = Field(default_factory=list)
    documents: list[ApplicationDocumentResponse] = Field(default_factory=list)


class DashboardRecentApplication(BaseModel):
    id: UUID
    company: str
    role: str
    status: StatusEnum
    created_at: datetime

    model_config = {"from_attributes": True}


class DashboardResponse(BaseModel):
    total_applications: int
    status_counts: dict[str, int]
    recent_applications: list[DashboardRecentApplication]


class AnalyticsMonthCount(BaseModel):
    month: str
    count: int


class AnalyticsResponse(BaseModel):
    total: int
    by_status: dict[str, int]
    by_month: list[AnalyticsMonthCount]
    recent: list[DashboardRecentApplication]


class ReminderResponse(BaseModel):
    id: UUID
    company: str
    role: str
    follow_up: str = Field(serialization_alias="followUp")
    status: StatusEnum

    model_config = {"from_attributes": True, "populate_by_name": True}


class ResumeExtractionResponse(BaseModel):
    resume_text: str = Field(serialization_alias="resumeText")

class ScoreBreakdown(BaseModel):
    keyword_match: int
    semantic_similarity: int
    llm_analysis: int
    section_coverage: int
    final: int

class AIAnalyzeResponse(BaseModel):
    match_score: int = Field(serialization_alias="matchScore")
    summary: str
    missing_keywords: list[str] = Field(serialization_alias="missingKeywords")
    strengths: list[str]
    improvements: list[str]
    resume_rewrite_suggestions: list[str] = Field(default_factory=list, serialization_alias="resumeRewriteSuggestions")
    score_breakdown: ScoreBreakdown | None = Field(default=None, serialization_alias="scoreBreakdown")

    model_config = {"populate_by_name": True}

class ResumeTailorResponse(BaseModel):
    improved_points: list[str] = Field(serialization_alias="improvedPoints")
    suggestions: list[str]
    before_score: int
    after_score: int
    improvement: int
    score_breakdown: ScoreBreakdown | None = Field(default=None, serialization_alias="scoreBreakdown")
    structured_tailor: dict | None = Field(default=None, serialization_alias="structuredTailor")
    resume_text: str = ""

    model_config = {"populate_by_name": True}

