import json
import asyncio
import re
import uuid
from datetime import datetime
from io import BytesIO

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status, Depends
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import StreamingResponse
from pypdf import PdfReader
import pdfplumber
import docx
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.config import settings
from app.core.logging import logger
from app.db.session import get_db
from app.services import user_service
from app.schemas import AIAnalyzeResponse, ResumeExtractionResponse, ResumeTailorResponse
from app.services.ai_limiter import ai_limiter
from app.workflow.graph import analyze_compiled, tailor_compiled
from app.workflow.scorer import has_salary_info
from app.models.models import Application
from app.services.pdf_service import ResumePDF


router = APIRouter(prefix="/ai", tags=["AI"])

MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_PDF_TYPES = {"application/pdf"}
ALLOWED_RESUME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
}

SYNONYMS = {
    "js": "javascript", "reactjs": "react", "node": "nodejs",
    "vuejs": "vue", "ts": "typescript", "postgres": "postgresql",
    "k8s": "kubernetes", "aws": "amazon web services",
    "gcp": "google cloud", "ml": "machine learning",
}

STOP_WORDS = {
    "and", "the", "to", "of", "a", "in", "for", "is", "on", "that", "by", "this", "with",
    "i", "you", "it", "not", "or", "be", "are", "from", "at", "as", "your", "an", "will",
    "we", "can", "have", "has", "but", "about", "if", "all", "so", "up", "out", "who", "which",
    "required", "requirements", "strong", "familiarity", "plus", "years", "experience",
    "development", "familiar", "knowledge", "skills", "ability", "proficient", "preferred",
    "understanding", "expert", "hands", "bonus", "role", "team", "work", "projects", "tools",
}


def normalize_and_tokenize(text: str) -> set:
    text = text.lower()
    for k, v in SYNONYMS.items():
        text = re.sub(r'\b' + re.escape(k) + r'\b', v, text)
    words = set(re.findall(r'\b[a-z0-9]+\b', text))
    return words - STOP_WORDS


def parse_jd(jd_text: str):
    text = jd_text.lower()
    optional_markers = ["nice to have", "bonus", "preferred", "optional", "plus"]
    required_text = text
    optional_text = ""
    for marker in optional_markers:
        if marker in text:
            parts = text.split(marker, 1)
            required_text = parts[0]
            optional_text = " " + parts[1]
            break
    return required_text, optional_text


def extract_text_sync(file_bytes: bytes, filename: str, content_type: str) -> str:
    file_stream = BytesIO(file_bytes)
    filename = filename.lower()
    if content_type == "application/pdf" or filename.endswith(".pdf"):
        with pdfplumber.open(file_stream) as pdf:
            pages = [page.extract_text() for page in pdf.pages if page.extract_text()]
            return "\n".join(pages)
    elif content_type in [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    ] or filename.endswith(".docx"):
        doc = docx.Document(file_stream)
        return "\n".join([para.text for para in doc.paragraphs])
    raise ValueError("Invalid file type")


async def validate_and_read_file(file: UploadFile, allowed_types: set[str]) -> bytes:
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {', '.join(allowed_types)} files are supported",
        )
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB",
        )
    return contents


@router.post("/extract-resume", response_model=ResumeExtractionResponse)
async def extract_resume(
    file: UploadFile = File(...),
    user_id: uuid.UUID = Depends(get_current_user),
):
    logger.info("AI: Extracting resume", extra={"extra_info": {
        "user_id": str(user_id), "filename": file.filename, "content_type": file.content_type,
    }})
    file_bytes = await validate_and_read_file(file, ALLOWED_PDF_TYPES)
    reader = PdfReader(BytesIO(file_bytes))
    resume_text = "\n".join((page.extract_text() or "") for page in reader.pages).strip()
    if not resume_text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not extract text from PDF")
    return {"resume_text": resume_text}


@router.post("/analyze", response_model=AIAnalyzeResponse)
async def analyze_resume(
    resume_file: UploadFile = File(...),
    job_description: str = Form(...),
    application_id: str = Form(None),
    penalize_missing_salary: bool = Form(False),
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    logger.info("AI: Analyzing resume", extra={"extra_info": {
        "user_id": str(user_id), "filename": resume_file.filename, "jd_length": len(job_description),
    }})

    file_bytes = await validate_and_read_file(resume_file, ALLOWED_PDF_TYPES)
    reader = PdfReader(BytesIO(file_bytes))
    resume_text = "\n".join((page.extract_text() or "") for page in reader.pages).strip()
    if not resume_text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not extract text from PDF")
    if not job_description.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Job description is required")

    has_credits = await run_in_threadpool(user_service.check_credits, db, user_id)
    if not has_credits:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient credits. Please upgrade your plan.")

    salary_detected = has_salary_info(job_description)

    await ai_limiter.acquire()
    try:
        state = {
            "resume_text": resume_text,
            "job_description": job_description.strip(),
            "resume_summary": "",
            "keywords": [],
            "before_score": 0,
            "analysis_result": None,
            "improved_points": [],
            "suggestions": [],
            "after_score": 0,
            "improvement": 0,
            "error": None,
            "retries": 0,
            "mode": "analyze",
            "has_salary": salary_detected,
            "writing_style": None,
        }
        result_state = await run_in_threadpool(analyze_compiled.invoke, state)
        analysis = result_state.get("analysis_result", {})
        await run_in_threadpool(user_service.deduct_credit, db, user_id)

        if application_id:
            try:
                app_uuid = uuid.UUID(application_id)
                app = db.query(Application).filter(
                    Application.id == app_uuid,
                    Application.user_id == user_id,
                ).first()
                if app:
                    app.suitability_score = result_state.get("before_score", 0)
                    app.suitability_reason = analysis.get("summary", "")
                    app.score_breakdown = result_state.get("score_breakdown")
                    db.commit()
            except Exception as persist_err:
                logger.warning(f"Failed to persist analysis to application {application_id}: {persist_err}")

        return {
            "match_score": analysis.get("match_score") or analysis.get("matchScore") or result_state.get("before_score", 0),
            "summary": analysis.get("summary", ""),
            "strengths": analysis.get("strengths", []),
            "missing_keywords": analysis.get("missing_keywords") or analysis.get("missingKeywords") or [],
            "improvements": analysis.get("improvements", []),
            "score_breakdown": result_state.get("score_breakdown"),
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Analyze failed: {e}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="AI service encountered an error. Please try again shortly.")
    finally:
        ai_limiter.release()


@router.post("/resume-tailor", response_model=ResumeTailorResponse)
async def tailor_resume(
    resume_file: UploadFile = File(None),
    job_description: str = Form(...),
    resume_text: str = Form(None),
    application_id: str = Form(None),
    tone: str = Form("professional"),
    formality: str = Form("neutral"),
    output_language: str = Form("en"),
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    logger.info("AI: Tailoring resume", extra={"extra_info": {
        "user_id": str(user_id), "jd_length": len(job_description),
    }})

    has_credits = await run_in_threadpool(user_service.check_credits, db, user_id)
    if not has_credits:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient credits. Please upgrade your plan.")
    if not job_description.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Job description is required")

    if resume_text:
        resume_text = resume_text.strip()
    elif resume_file:
        file_bytes = await validate_and_read_file(resume_file, ALLOWED_RESUME_TYPES)
        resume_text = await run_in_threadpool(
            extract_text_sync, file_bytes, resume_file.filename, resume_file.content_type
        )
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Either resume_file or resume_text is required")

    if not resume_text.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Resume text is empty")

    salary_detected = has_salary_info(job_description)

    await ai_limiter.acquire()
    try:
        state = {
            "resume_text": resume_text,
            "job_description": job_description.strip(),
            "resume_summary": "",
            "keywords": [],
            "before_score": 0,
            "analysis_result": None,
            "improved_points": [],
            "suggestions": [],
            "after_score": 0,
            "improvement": 0,
            "error": None,
            "retries": 0,
            "mode": "tailor",
            "parsed_resume": None,
            "parsed_jd": None,
            "matched_keywords": [],
            "missing_keywords": [],
            "semantic_score": 0.0,
            "keyword_score": 0,
            "section_coverage": 0.0,
            "score_breakdown": None,
            "structured_tailor": None,
            "extracted_resume": None,
            "structured_tailor_resume": None,
            "has_salary": salary_detected,
            "writing_style": {
                "tone": tone,
                "formality": formality,
                "output_language": output_language,
            },
        }
        result_state = await run_in_threadpool(tailor_compiled.invoke, state)
        await run_in_threadpool(user_service.deduct_credit, db, user_id)

        if application_id:
            try:
                app_uuid = uuid.UUID(application_id)
                app = db.query(Application).filter(
                    Application.id == app_uuid,
                    Application.user_id == user_id,
                ).first()
                if app:
                    structured = result_state.get("structured_tailor_resume") or {}
                    app.tailored_headline = structured.get("headline", "")
                    app.tailored_summary = structured.get("summary", "")
                    existing_skills = structured.get("skills", [])
                    if isinstance(existing_skills, list):
                        app.tailored_skills = {"skills": existing_skills}
                    elif isinstance(existing_skills, dict):
                        app.tailored_skills = existing_skills
                    app.tailored_resume_json = structured
                    app.suitability_score = result_state.get("after_score", 0)
                    app.score_breakdown = result_state.get("score_breakdown")
                    db.commit()
            except Exception as persist_err:
                logger.warning(f"Failed to persist tailoring to application {application_id}: {persist_err}")

        return {
            "improved_points": [
                p.get("improved", p) if isinstance(p, dict) else p
                for p in result_state.get("improved_points", [])
            ],
            "structured_tailor": result_state.get("structured_tailor"),
            "structured_tailor_resume": result_state.get("structured_tailor_resume"),
            "extracted_resume": result_state.get("extracted_resume"),
            "resume_text": resume_text,
            "before_score": result_state.get("before_score", 0),
            "after_score": result_state.get("after_score", 0),
            "improvement": result_state.get("improvement", 0),
            "summary": "",
            "suggestions": result_state.get("suggestions", []),
            "score_breakdown": result_state.get("score_breakdown"),
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Tailor failed: {e}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="AI service encountered an error. Please try again shortly.")
    finally:
        ai_limiter.release()


@router.post("/optimize")
async def optimize_resume(
    resume_file: UploadFile = File(...),
    job_description: str = Form(...),
    application_id: str = Form(None),
    tone: str = Form("professional"),
    formality: str = Form("neutral"),
    output_language: str = Form("en"),
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    logger.info("AI: Optimizing resume", extra={"extra_info": {
        "user_id": str(user_id), "filename": resume_file.filename, "jd_length": len(job_description),
    }})
    has_credits = await run_in_threadpool(user_service.check_credits, db, user_id)
    if not has_credits:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient credits.")
    if not job_description.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Job description is required")

    file_bytes = await validate_and_read_file(resume_file, ALLOWED_RESUME_TYPES)
    resume_text = await run_in_threadpool(
        extract_text_sync, file_bytes, resume_file.filename, resume_file.content_type
    )
    if not resume_text.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Resume text is empty")

    salary_detected = has_salary_info(job_description)

    await ai_limiter.acquire()
    try:
        analyze_state = {
            "resume_text": resume_text,
            "job_description": job_description.strip(),
            "resume_summary": "",
            "keywords": [],
            "before_score": 0,
            "analysis_result": None,
            "improved_points": [],
            "suggestions": [],
            "after_score": 0,
            "improvement": 0,
            "error": None,
            "retries": 0,
            "mode": "analyze",
            "has_salary": salary_detected,
            "writing_style": None,
        }
        analyze_result = await run_in_threadpool(analyze_compiled.invoke, analyze_state)
        analysis = analyze_result.get("analysis_result", {})

        tailor_state = {
            "resume_text": resume_text,
            "job_description": job_description.strip(),
            "resume_summary": "",
            "keywords": analyze_result.get("keywords", []),
            "before_score": analyze_result.get("before_score", 0),
            "analysis_result": None,
            "improved_points": [],
            "suggestions": [],
            "after_score": 0,
            "improvement": 0,
            "error": None,
            "retries": 0,
            "mode": "tailor",
            "has_salary": salary_detected,
            "writing_style": {
                "tone": tone,
                "formality": formality,
                "output_language": output_language,
            },
        }
        tailor_result = await run_in_threadpool(tailor_compiled.invoke, tailor_state)

        await run_in_threadpool(user_service.deduct_credit, db, user_id)

        if application_id:
            try:
                app_uuid = uuid.UUID(application_id)
                app = db.query(Application).filter(
                    Application.id == app_uuid,
                    Application.user_id == user_id,
                ).first()
                if app:
                    structured = tailor_result.get("structured_tailor_resume") or {}
                    app.tailored_headline = structured.get("headline", "")
                    app.tailored_summary = structured.get("summary", "")
                    existing_skills = structured.get("skills", [])
                    if isinstance(existing_skills, list):
                        app.tailored_skills = {"skills": existing_skills}
                    elif isinstance(existing_skills, dict):
                        app.tailored_skills = existing_skills
                    app.tailored_resume_json = structured
                    app.suitability_score = tailor_result.get("after_score", 0)
                    app.score_breakdown = tailor_result.get("score_breakdown")
                    db.commit()
            except Exception as persist_err:
                logger.warning(f"Failed to persist optimize results to application {application_id}: {persist_err}")

        return {
            "analysis": {
                "matchScore": analysis.get("match_score", analyze_result.get("before_score", 0)),
                "summary": analysis.get("summary", ""),
                "strengths": analysis.get("strengths", []),
                "missingKeywords": analysis.get("missing_keywords", []),
                "improvements": analysis.get("improvements", []),
            },
            "tailoring": {
                "improvedPoints": [
                    p.get("improved", p) if isinstance(p, dict) else p
                    for p in tailor_result.get("improved_points", [])
                ],
                "before_score": tailor_result.get("before_score", 0),
                "after_score": tailor_result.get("after_score", 0),
                "improvement": tailor_result.get("improvement", 0),
                "summary": "",
                "suggestions": tailor_result.get("suggestions", []),
            },
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Optimize failed: {e}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="AI service encountered an error. Please try again shortly.")
    finally:
        ai_limiter.release()


@router.post("/download-tailored")
async def download_tailored(
    tailored_points: str = Form(default="[]"),
    resume_file: UploadFile = File(None),
    resume_text: str = Form(None),
    edited_text: str = Form(None),
    user_id: uuid.UUID = Depends(get_current_user),
):
    logger.info("AI: Downloading tailored PDF", extra={"extra_info": {"user_id": str(user_id)}})
    try:
        if edited_text:
            pdf = ResumePDF()
            pdf_bytes = pdf.build_from_text(edited_text)
        elif tailored_points:
            data = json.loads(tailored_points)
            if isinstance(data, dict) and "structured_tailor_resume" in data:
                pdf = ResumePDF()
                pdf_bytes = pdf.build_structured(data["structured_tailor_resume"])
            elif isinstance(data, dict) and "sections" in data:
                pdf = ResumePDF()
                pdf_bytes = pdf.build_structured(data["sections"])
            elif isinstance(data, list):
                if resume_text:
                    text = resume_text
                elif resume_file:
                    file_bytes = await validate_and_read_file(resume_file, ALLOWED_RESUME_TYPES)
                    text = await run_in_threadpool(
                        extract_text_sync, file_bytes, resume_file.filename, resume_file.content_type
                    )
                else:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Resume text is required for legacy format")
                pdf = ResumePDF()
                pdf_bytes = pdf.build(text, data)
            else:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid tailored_points format")
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Either edited_text or tailored_points is required")
        return StreamingResponse(
            pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=tailored_resume.pdf"},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF generation failed: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate PDF.")


@router.post("/resume-score")
async def score_resume(
    resume_file: UploadFile = File(...),
    job_description: str = Form(...),
    penalize_missing_salary: bool = Form(False),
    user_id: uuid.UUID = Depends(get_current_user),
):
    logger.info("AI: Scoring resume", extra={"extra_info": {
        "user_id": str(user_id), "filename": resume_file.filename, "jd_length": len(job_description),
    }})
    if not job_description.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Job description cannot be empty")

    file_bytes = await validate_and_read_file(resume_file, ALLOWED_RESUME_TYPES)
    try:
        resume_text = await run_in_threadpool(
            extract_text_sync, file_bytes, resume_file.filename, resume_file.content_type
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file type. Only PDF and DOCX are supported.")
    except Exception as e:
        logger.error(json.dumps({
            "message": "Extraction failure",
            "payload": {"filename": resume_file.filename},
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e),
        }))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Extraction failure")

    if not resume_text.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not extract text from resume")

    required_text, optional_text = parse_jd(job_description)
    required_kw = normalize_and_tokenize(required_text)
    optional_kw = normalize_and_tokenize(optional_text)
    resume_kw = normalize_and_tokenize(resume_text)

    valid_kws = set(SYNONYMS.values())
    required_kw = {w for w in required_kw if len(w) > 2 or w in valid_kws}
    optional_kw = {w for w in optional_kw if len(w) > 2 or w in valid_kws}

    if not required_kw and not optional_kw:
        required_kw = normalize_and_tokenize(job_description)

    req_match = required_kw.intersection(resume_kw)
    opt_match = optional_kw.intersection(resume_kw)
    missing_req = required_kw - req_match

    total_weight = len(required_kw) * 2 + len(optional_kw)
    if total_weight == 0:
        total_weight = 1

    keyword_score = ((len(req_match) * 2 + len(opt_match)) / total_weight) * 100
    final_score = max(0, min(100, int(keyword_score)))

    if penalize_missing_salary and not has_salary_info(job_description):
        final_score = max(0, final_score - settings.MISSING_SALARY_PENALTY)

    suggestions = []
    if missing_req:
        top_missing = list(missing_req)[:3]
        suggestions.append(f"Add missing required skills: {', '.join(top_missing).title()}")
    if final_score < 60:
        suggestions.append("Strengthen experience with core requirements to improve ATS ranking.")
        suggestions.append("Ensure you use the exact terminology found in the job description.")
    elif final_score < 80:
        suggestions.append("Consider highlighting your achievements with the optional skills mentioned.")
        suggestions.append("Include more measurable achievements to stand out.")
    else:
        suggestions.append("Strong match! Ensure your bullet points are impactful and clear.")

    all_matched = sorted(list(req_match.union(opt_match)))[:15]
    all_missing = sorted(list(missing_req))[:15]

    return {
        "score": final_score,
        "matched_keywords": all_matched,
        "missing_keywords": all_missing,
        "suggestions": suggestions,
    }


@router.post("/select-projects")
async def select_projects(
    job_description: str = Form(...),
    projects_json: str = Form(...),
    desired_count: int = Form(3),
    user_id: uuid.UUID = Depends(get_current_user),
):
    from app.services.project_selection import select_projects as _select_projects

    logger.info("AI: Selecting projects", extra={"extra_info": {
        "user_id": str(user_id), "jd_length": len(job_description), "desired_count": desired_count,
    }})
    try:
        projects = json.loads(projects_json)
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid projects_json format")
    if not isinstance(projects, list):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="projects_json must be a JSON array")

    selected = _select_projects(job_description, projects, desired_count)
    return {"selected_project_ids": selected}
