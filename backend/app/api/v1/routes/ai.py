import json
import asyncio
import string
import pdfplumber
import docx
from datetime import datetime
from io import BytesIO
from urllib import request as urllib_request
from urllib.error import HTTPError, URLError

import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
import uuid
from sqlalchemy.orm import Session
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status, Depends
from fastapi.concurrency import run_in_threadpool
from pypdf import PdfReader
from app.db.session import get_db
from app.core.deps import get_current_user
from app.services import user_service
from app.core.config import settings
from app.core.logging import logger
from app.schemas import AIAnalyzeResponse, ResumeExtractionResponse, ResumeTailorResponse

# Configure Gemini
if settings.GOOGLE_API_KEY:
    masked_key = f"{settings.GOOGLE_API_KEY[:8]}...{settings.GOOGLE_API_KEY[-4:]}"
    logger.info(f"Configuring Gemini with key: {masked_key}")
    genai.configure(api_key=settings.GOOGLE_API_KEY)
else:
    logger.warning("GOOGLE_API_KEY not found in settings")

router = APIRouter(prefix="/ai", tags=["AI"])


# Removed extract_response_text as Gemini SDK handles it better


from app.services.ai_limiter import ai_limiter

def extract_resume_summary(resume_text: str) -> str:
    """Extracts key experience points and skills to reduce token noise."""
    lines = [line.strip() for line in resume_text.split('\n') if line.strip()]
    # Priority: lines starting with bullets or numbers, or short impactful sentences
    bullet_points = [l for l in lines if l.startswith(('-', '*', '•')) or (len(l) > 15 and l[0].isdigit())]
    
    if len(bullet_points) >= 5:
        points = bullet_points[:12]
    else:
        # Fallback to meaningful lines
        points = [l for l in lines if 20 < len(l) < 200][:15]
    
    return "\n".join(points)

def extract_top_keywords_for_prompt(jd_text: str) -> str:
    """Extracts top 10-12 keywords for the prompt."""
    keywords = normalize_and_tokenize(jd_text)
    # Sort by length or frequency if we had it, but length is a decent proxy for 'meaningful' tech terms
    sorted_kws = sorted(list(keywords), key=len, reverse=True)
    return ", ".join(sorted_kws[:12])


def calculate_local_score(text: str, keywords: list) -> int:
    """Deterministic keyword-based scoring (fast, no AI)."""
    if not keywords:
        return 0
    text = text.lower()
    matched = sum(1 for kw in keywords if kw.lower() in text)
    return int((matched / len(keywords)) * 100)


async def call_gemini_unified(resume_text: str, job_description: str, mode: str = "both") -> dict:
    """
    Unified Gemini caller optimized for token efficiency and deterministic scoring.
    """
    if not settings.GOOGLE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GOOGLE_API_KEY is not configured",
        )

    # Preprocessing
    resume_summary = extract_resume_summary(resume_text)
    keywords_set = normalize_and_tokenize(job_description)
    # Filter for quality
    valid_kws = sorted(list(keywords_set), key=len, reverse=True)[:12]
    top_keywords_str = ", ".join(valid_kws)

    # Calculate 'Before' score
    before_score = calculate_local_score(resume_summary, valid_kws)

    await ai_limiter.acquire()
    try:
        model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            generation_config={"response_mime_type": "application/json"}
        )
        
        base_context = (
            "Role: Senior recruiter optimizing resumes for ATS and hiring managers.\n\n"
            "Constraints:\n"
            "- Do NOT invent experience, tools, or metrics.\n"
            "- Use metrics ONLY if present or clearly implied.\n"
            "- Avoid generic phrases (e.g., 'worked on', 'helped').\n"
            "- Use strong action verbs.\n"
            "- Keep each bullet concise (max 2 lines).\n"
            "- Ensure natural language (no keyword stuffing).\n\n"
            "Focus:\n"
            "- Align resume content with job description keywords.\n"
            "- Emphasize impact, results, and relevance.\n"
        )

        if mode == "analyze":
            prompt = (
                f"{base_context}\nTask: Analyze how well the resume matches the JD.\n\n"
                f"Input:\nResume Summary:\n{resume_summary}\n\nTop JD Keywords: {top_keywords_str}\n\n"
                "Return JSON: {\"match_score\": 0-100, \"summary\": \"\", \"strengths\": [], \"missing_keywords\": [], \"improvements\": []}"
            )
        elif mode == "tailor":
            prompt = (
                f"{base_context}\nTask: Generate high-impact, ATS-optimized bullet points based on the resume and JD.\n\n"
                f"Input:\nResume Summary:\n{resume_summary}\n\nTop JD Keywords: {top_keywords_str}\n\n"
                "Return JSON only with this schema:\n"
                "{\n"
                "  \"summary\": \"a brief 2-3 sentence overview of the original resume\",\n"
                "  \"improved_points\": [\n"
                "    {\"original\": \"brief snippet of original point\", \"improved\": \"full rewritten bullet point\"}\n"
                "  ],\n"
                "  \"suggestions\": [\"short explanation of strategic changes\"]\n"
                "}"
            )
        else: # both
            prompt = (
                f"{base_context}\nTask: Perform ATS analysis and provide tailored bullet points.\n\n"
                f"Input:\nResume Summary:\n{resume_summary}\n\nTop JD Keywords: {top_keywords_str}\n\n"
                "Return JSON only with this schema:\n"
                "{\n"
                "  \"analysis\": {\"match_score\": 0-100, \"summary\": \"\", \"strengths\": [], \"missing_keywords\": [], \"improvements\": []},\n"
                "  \"tailoring\": {\n"
                "    \"summary\": \"...\",\n"
                "    \"improved_points\": [{\"original\": \"...\", \"improved\": \"...\"}],\n"
                "    \"suggestions\": []\n"
                "  }\n"
                "}"
            )

        # 3. Call Gemini with Retry
        max_retries = 3
        retry_delay = 2
        for attempt in range(max_retries):
            try:
                response = await run_in_threadpool(model.generate_content, prompt)
                if not response.text:
                    raise ValueError("Empty response from Gemini")
                result = json.loads(response.text)
                break
            except google_exceptions.ResourceExhausted:
                if attempt == max_retries - 1:
                    raise
                wait_time = retry_delay * (2 ** attempt)
                logger.warning(f"Gemini 429 (Quota Exceeded). Retrying in {wait_time}s... (Attempt {attempt+1}/{max_retries})")
                await asyncio.sleep(wait_time)
            except Exception as e:
                logger.error(f"Error during Gemini call: {e}")
                raise

        # Post-processing: Calculate 'After' score for tailoring modes
        if mode in ("tailor", "both"):
            tailor_data = result if mode == "tailor" else result.get("tailoring", {})
            raw_improved = tailor_data.get("improved_points", [])
            
            # Extract strings for the final response if they were objects
            if raw_improved and isinstance(raw_improved[0], dict):
                improved_strings = [p.get("improved", "") for p in raw_improved]
                tailor_data["improved_points"] = [s for s in improved_strings if s]
            
            improved_text = " ".join(tailor_data.get("improved_points", []))
            after_score = calculate_local_score(improved_text, valid_kws)
            
            # Boost after_score slightly if improvements were made
            improvement = max(0, after_score - before_score)
            
            score_data = {
                "before_score": before_score,
                "after_score": after_score,
                "improvement": improvement
            }
            
            if mode == "tailor":
                result.update(score_data)
            else:
                result["tailoring"].update(score_data)

        return result

    except google_exceptions.ResourceExhausted:
        logger.error("Gemini API quota exceeded (429)")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="The AI is currently at its free-tier limit. Please wait a few minutes before trying again.",
        )
    except Exception as exc:
        logger.error(f"Gemini API error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service encountered an error. Please try again shortly.",
        )
    finally:
        ai_limiter.release()


def analyze_resume_with_gemini(resume_text: str, job_description: str) -> dict:
    return asyncio.run(call_gemini_unified(resume_text, job_description, mode="analyze"))


def tailor_resume_with_gemini(resume_text: str, job_description: str) -> dict:
    return asyncio.run(call_gemini_unified(resume_text, job_description, mode="tailor"))



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

    return await call_gemini_unified(resume_text, job_description.strip(), mode="analyze")


@router.post("/resume-tailor", response_model=ResumeTailorResponse)
async def tailor_resume(
    resume_file: UploadFile = File(...),
    job_description: str = Form(...),
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    # 1. Check credits
    if not user_service.check_credits(db, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient credits. Please upgrade your plan.",
        )

    if not job_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description is required",
        )

    try:
        file_bytes = await resume_file.read()
        resume_text = await run_in_threadpool(
            extract_text_sync, file_bytes, resume_file.filename, resume_file.content_type
        )
    except Exception as e:
        logger.error(f"Tailoring extraction failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract text from resume. Ensure it is a valid PDF or DOCX.",
        )

    if not resume_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume text is empty",
        )

    result = await call_gemini_unified(resume_text, job_description.strip(), mode="tailor")
    
    # 2. Deduct credit
    user_service.deduct_credit(db, user_id)
    
    return result


@router.post("/optimize")
async def optimize_resume(
    resume_file: UploadFile = File(...),
    job_description: str = Form(...),
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    """Combined analysis and tailoring in one AI call."""
    if not user_service.check_credits(db, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient credits.",
        )

    file_bytes = await resume_file.read()
    resume_text = await run_in_threadpool(
        extract_text_sync, file_bytes, resume_file.filename, resume_file.content_type
    )
    
    result = await call_gemini_unified(resume_text, job_description.strip(), mode="both")
    user_service.deduct_credit(db, user_id)
    return result


import re

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

_embedding_model = None

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading sentence transformer model...")
            _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        except ImportError:
            logger.warning("sentence-transformers not installed. Semantic similarity will be skipped.")
            return None
    return _embedding_model

def cosine_sim(a, b):
    if HAS_NUMPY:
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return np.dot(a, b) / (norm_a * norm_b)
    else:
        # Pure python fallback
        dot_product = sum(x*y for x, y in zip(a, b))
        norm_a = sum(x*x for x in a) ** 0.5
        norm_b = sum(x*x for x in b) ** 0.5
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot_product / (norm_a * norm_b)

SYNONYMS = {
    "js": "javascript",
    "reactjs": "react",
    "node": "nodejs",
    "vuejs": "vue",
    "ts": "typescript",
    "postgres": "postgresql",
    "k8s": "kubernetes",
    "aws": "amazon web services",
    "gcp": "google cloud",
    "ml": "machine learning"
}

STOP_WORDS = {
    "and", "the", "to", "of", "a", "in", "for", "is", "on", "that", "by", "this", "with", 
    "i", "you", "it", "not", "or", "be", "are", "from", "at", "as", "your", "an", "will", 
    "we", "can", "have", "has", "but", "about", "if", "all", "so", "up", "out", "who", "which",
    "required", "requirements", "strong", "familiarity", "plus", "years", "experience", 
    "development", "familiar", "knowledge", "skills", "ability", "proficient", "preferred", 
    "understanding", "expert", "hands", "bonus", "role", "team", "work", "projects", "tools"
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
    optional_text = ""
    required_text = text
    for marker in optional_markers:
        if marker in text:
            parts = text.split(marker, 1)
            required_text = parts[0]
            optional_text += " " + parts[1]
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
        "application/msword"
    ] or filename.endswith(".docx"):
        doc = docx.Document(file_stream)
        return "\n".join([para.text for para in doc.paragraphs])
    else:
        raise ValueError("Invalid file type")

@router.post("/resume-score")
async def score_resume(
    resume_file: UploadFile = File(...),
    job_description: str = Form(...),
):
    logger.info(json.dumps({
        "message": "Processing resume scoring request",
        "payload": {"filename": resume_file.filename, "content_type": resume_file.content_type},
        "timestamp": datetime.utcnow().isoformat()
    }))

    if not job_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description cannot be empty"
        )
        
    try:
        file_bytes = await resume_file.read()
    except Exception as e:
        logger.error(f"Failed to read uploaded file: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to read file")

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
            "error": str(e)
        }))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Extraction failure")

    if not resume_text.strip():
        logger.error("Extracted resume text is empty")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not extract text from resume")

    # Keyword Scoring
    required_text, optional_text = parse_jd(job_description)
    required_kw = normalize_and_tokenize(required_text)
    optional_kw = normalize_and_tokenize(optional_text)
    resume_kw = normalize_and_tokenize(resume_text)

    # Some basic filtering to ensure we aren't just matching random small words as keywords
    # Let's assume a keyword is something that is > 2 chars or in SYNONYMS values
    valid_kws = set(SYNONYMS.values())
    required_kw = {w for w in required_kw if len(w) > 2 or w in valid_kws}
    optional_kw = {w for w in optional_kw if len(w) > 2 or w in valid_kws}
    
    if not required_kw and not optional_kw:
        # Fallback if somehow extraction fails
        required_kw = normalize_and_tokenize(job_description)

    req_match = required_kw.intersection(resume_kw)
    opt_match = optional_kw.intersection(resume_kw)

    missing_req = required_kw - req_match

    total_weight = len(required_kw) * 2 + len(optional_kw)
    if total_weight == 0:
        total_weight = 1

    keyword_score = ((len(req_match) * 2 + len(opt_match)) / total_weight) * 100

    # Semantic Similarity Scoring
    try:
        model = await run_in_threadpool(get_embedding_model)
        # SentenceTransformers can handle long texts but truncates them. 
        # We encode synchronously in threadpool to avoid blocking event loop.
        embeddings = await run_in_threadpool(model.encode, [job_description, resume_text])
        semantic_score = cosine_sim(embeddings[0], embeddings[1]) * 100
        semantic_score = max(0, min(100, semantic_score))
    except Exception as e:
        logger.error(f"Semantic scoring failed: {e}")
        # Fallback to pure keyword score if embeddings fail
        semantic_score = keyword_score

    # Final Score Combination
    final_score = int((keyword_score * 0.7) + (semantic_score * 0.3))
    final_score = max(0, min(100, final_score))

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

    all_matched = list(req_match.union(opt_match))
    all_missing = list(missing_req)
    
    # Limit to top 15 to keep UI clean
    all_matched = sorted(all_matched)[:15]
    all_missing = sorted(all_missing)[:15]

    return {
        "score": final_score,
        "matched_keywords": all_matched,
        "missing_keywords": all_missing,
        "suggestions": suggestions
    }
