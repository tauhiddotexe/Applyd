import json
from io import BytesIO
from urllib import request as urllib_request
from urllib.error import HTTPError, URLError

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from pypdf import PdfReader

from app.core.config import settings
from app.core.logging import logger
from app.schemas import AIAnalyzeResponse, ResumeExtractionResponse

router = APIRouter(prefix="/ai", tags=["AI"])


def extract_response_text(payload: dict) -> str:
    if payload.get("output_text"):
        return payload["output_text"]

    chunks: list[str] = []
    for item in payload.get("output", []):
        for content in item.get("content", []):
            if content.get("type") == "output_text" and content.get("text"):
                chunks.append(content["text"])
    return "".join(chunks)


def analyze_resume_with_openai(resume_text: str, job_description: str) -> dict:
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OPENAI_API_KEY is not configured",
        )

    body = {
        "model": settings.OPENAI_MODEL,
        "input": [
            {
                "role": "system",
                "content": "You are an expert ATS system.",
            },
            {
                "role": "user",
                "content": (
                    "Analyze how well the resume matches the job description.\n\n"
                    "Be strict. Do not inflate scores.\n\n"
                    "Return JSON only:\n\n"
                    "{\n"
                    '"match_score": number (0-100),\n'
                    '"summary": "short evaluation",\n'
                    '"strengths": ["point"],\n'
                    '"missing_keywords": ["keyword"],\n'
                    '"improvements": ["actionable suggestion"],\n'
                    '"resume_rewrite_suggestions": ["improved bullet point"]\n'
                    "}\n\n"
                    "Rules:\n"
                    "* No text outside JSON\n"
                    "* No hallucination\n"
                    "* Only use given data\n\n"
                    f"Resume:\n{resume_text}\n\n"
                    f"Job Description:\n{job_description}"
                ),
            },
        ],
        "text": {
            "format": {
                "type": "json_schema",
                "name": "resume_job_match",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "match_score": {"type": "integer", "minimum": 0, "maximum": 100},
                        "summary": {"type": "string"},
                        "missing_keywords": {
                            "type": "array",
                            "items": {"type": "string"},
                        },
                        "strengths": {
                            "type": "array",
                            "items": {"type": "string"},
                        },
                        "improvements": {
                            "type": "array",
                            "items": {"type": "string"},
                        },
                        "resume_rewrite_suggestions": {
                            "type": "array",
                            "items": {"type": "string"},
                        },
                    },
                    "required": [
                        "match_score",
                        "summary",
                        "missing_keywords",
                        "strengths",
                        "improvements",
                        "resume_rewrite_suggestions",
                    ],
                    "additionalProperties": False,
                },
            }
        },
    }

    req = urllib_request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib_request.urlopen(req, timeout=60) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        logger.error(f"OpenAI API HTTP error: {detail}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI analysis request failed",
        ) from exc
    except URLError as exc:
        logger.error(f"OpenAI API connection error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service unavailable",
        ) from exc

    text_output = extract_response_text(payload)
    if not text_output:
        logger.error(f"OpenAI response missing text: {payload}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI analysis returned no output",
        )

    try:
        return json.loads(text_output)
    except json.JSONDecodeError as exc:
        logger.error(f"OpenAI response JSON parse error: {text_output}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI analysis returned invalid data",
        ) from exc


@router.post("/extract-resume", response_model=ResumeExtractionResponse)
async def extract_resume(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF resumes are supported",
        )

    file_bytes = await file.read()
    reader = PdfReader(BytesIO(file_bytes))
    resume_text = "\n".join((page.extract_text() or "") for page in reader.pages).strip()

    if not resume_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract text from PDF",
        )

    return {"resume_text": resume_text}


@router.post("/analyze", response_model=AIAnalyzeResponse)
async def analyze_resume(
    resume_file: UploadFile = File(...),
    job_description: str = Form(...),
):
    if resume_file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF resumes are supported",
        )

    file_bytes = await resume_file.read()
    reader = PdfReader(BytesIO(file_bytes))
    resume_text = "\n".join((page.extract_text() or "") for page in reader.pages).strip()

    if not resume_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract text from PDF",
        )

    if not job_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description is required",
        )

    return analyze_resume_with_openai(resume_text, job_description.strip())
