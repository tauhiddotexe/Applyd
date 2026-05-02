import json
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
    genai.configure(api_key=settings.GOOGLE_API_KEY)

router = APIRouter(prefix="/ai", tags=["AI"])


# Removed extract_response_text as Gemini SDK handles it better


def analyze_resume_with_gemini(resume_text: str, job_description: str) -> dict:
    if not settings.GOOGLE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GOOGLE_API_KEY is not configured",
        )

    model = genai.GenerativeModel(
        model_name=settings.GEMINI_MODEL,
        generation_config={"response_mime_type": "application/json"}
    )
    
    prompt = (
        "You are an expert ATS system. Analyze how well the resume matches the job description.\n\n"
        "Be strict. Do not inflate scores.\n\n"
        "Return JSON only with the following schema:\n"
        "{\n"
        '  "match_score": number (0-100),\n'
        '  "summary": "short evaluation",\n'
        '  "strengths": ["point"],\n'
        '  "missing_keywords": ["keyword"],\n'
        '  "improvements": ["actionable suggestion"],\n'
        '  "resume_rewrite_suggestions": ["improved bullet point"]\n'
        "}\n\n"
        f"Resume:\n{resume_text}\n\n"
        f"Job Description:\n{job_description}"
    )

    try:
        response = model.generate_content(prompt)
        if not response.text:
            raise ValueError("Empty response from Gemini")
        return json.loads(response.text)
    except google_exceptions.ResourceExhausted:
        logger.error("Gemini API quota exceeded")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="AI service is currently busy (quota exceeded). Please try again in a minute.",
        )
    except Exception as exc:
        logger.error(f"Gemini API error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI analysis failed: {str(exc)}",
        )


def tailor_resume_with_gemini(resume_text: str, job_description: str) -> dict:
    if not settings.GOOGLE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GOOGLE_API_KEY is not configured",
        )

    model = genai.GenerativeModel(
        model_name=settings.GEMINI_MODEL,
        generation_config={"response_mime_type": "application/json"}
    )
    
    # Extract keywords from JD to explicitly guide the AI
    jd_keywords = list(normalize_and_tokenize(job_description))[:15]
    
    prompt = (
        "You are a senior recruiter optimizing a resume for ATS and hiring managers. "
        "Based on the Job Description provided, rewrite the key bullet points from the Resume to match the JD requirements.\n\n"
        "STRICT STYLE RULES:\n"
        "* Each bullet point MUST start with a strong action verb (e.g., Developed, Orchestrated, Optimized, Engineered).\n"
        "* Include measurable impact (%, numbers, scale, or specific tools) for EVERY point.\n"
        "* Be concise (1–2 lines max).\n"
        "* Be specific: AVOID vague words like 'helped', 'worked on', 'assisted', 'responsible for', 'involved in'.\n"
        "* Prioritize impact and results over just listing tasks.\n"
        "* DO NOT invent fake experience; only enhance and quantify existing content.\n"
        "* Align wording precisely with these job description keywords: " + ", ".join(jd_keywords) + ".\n"
        "* MAX 5-7 bullet points total.\n\n"
        "EXAMPLE TRANSFORMATION:\n"
        "Input: 'Worked on a React project'\n"
        "Output: 'Developed a React-based web application improving load performance by 25% and enhancing user engagement'\n\n"
        "FORCE STRUCTURE:\n"
        "1. Improved Experience Points: The rewritten list of high-impact statements.\n"
        "2. Key Improvements: A short list of specific strategic changes made (e.g., 'Added quantification', 'Aligned with X keyword').\n\n"
        "Return JSON only with the following schema:\n"
        "{\n"
        '  "improved_points": ["Action Verb + Task + Quantified Result"],\n'
        '  "suggestions": ["Concise improvement strategy 1", "Concise improvement strategy 2"]\n'
        "}\n\n"
        f"Resume:\n{resume_text}\n\n"
        f"Job Description:\n{job_description}"
    )


    try:
        response = model.generate_content(prompt)
        if not response.text:
            raise ValueError("Empty response from Gemini")
        
        result = json.loads(response.text)
        
        # Post-processing
        raw_points = result.get("improved_points", [])
        vague_phrases = ["helped", "worked on", "assisted", "responsible for", "participated in", "involved in"]
        
        processed_points = []
        seen = set()
        for p in raw_points:
            p = p.strip().strip("*").strip("-").strip()
            if not p or p.lower() in seen:
                continue
            
            # Remove points containing vague phrases
            if any(phrase in p.lower() for phrase in vague_phrases):
                continue
                
            # Basic action verb check (first word usually ends in 'ed' or 'ing' or is a known verb)
            # We'll trust the prompt mostly but can filter out obviously bad ones if needed.
            
            seen.add(p.lower())
            processed_points.append(p)
            
        result["improved_points"] = processed_points[:7]
        result["suggestions"] = [s.strip() for s in result.get("suggestions", [])][:5]
        
        return result
    except google_exceptions.ResourceExhausted:
        logger.error("Gemini API quota exceeded")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="AI service is currently busy (quota exceeded). Please try again in a minute.",
        )
    except Exception as exc:
        logger.error(f"Gemini API error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI tailoring failed: {str(exc)}",
        )



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

    return analyze_resume_with_gemini(resume_text, job_description.strip())


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

    result = tailor_resume_with_gemini(resume_text, job_description.strip())
    
    # 2. Deduct credit
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
