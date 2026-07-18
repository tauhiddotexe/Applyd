import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, HttpUrl, field_validator
from app.core.deps import get_current_user

router = APIRouter(prefix="/jobs", tags=["Jobs"])


class JobExtractRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def validate_url(cls, v):
        if len(v) > 2048:
            raise ValueError("URL too long")
        return v


class JobExtractResponse(BaseModel):
    company: str
    role: str
    location: str | None = None


@router.post("/extract", response_model=JobExtractResponse)
def extract_job(
    body: JobExtractRequest,
    user_id: uuid.UUID = Depends(get_current_user)
):
    if not body.url:
        raise HTTPException(status_code=400, detail="URL is required")

    domain = body.url.lower()
    company = "Unknown"
    if "linkedin" in domain:
        company = "LinkedIn Company"
    elif "indeed" in domain:
        company = "Indeed Company"
    elif "glassdoor" in domain:
        company = "Glassdoor Company"
    else:
        import re
        match = re.search(r"://(?:www\.)?([^/]+)", body.url)
        if match:
            company = match.group(1).split(".")[0].title()

    parts = body.url.rstrip("/").split("/")
    role = parts[-1].replace("-", " ").title() if parts[-1] else "Unknown Position"

    return JobExtractResponse(
        company=company,
        role=role,
    )
