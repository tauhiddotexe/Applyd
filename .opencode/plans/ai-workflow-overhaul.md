# AI Workflow Overhaul — LangGraph + OpenRouter + PDF

## Summary

Replace Google Gemini with OpenRouter (free models) and a LangGraph workflow for resume tailoring. Add PDF download of tailored resumes.

---

## Files to Create

### 1. `backend/app/workflow/__init__.py`
Empty init.

### 2. `backend/app/workflow/state.py`

```python
from typing import TypedDict, Optional

class ResumeState(TypedDict):
    resume_text: str
    job_description: str
    file_bytes: bytes
    filename: str

    resume_summary: str
    keywords: list[str]
    before_score: int

    analysis_result: Optional[dict]
    tailored_bullets: list[str]
    improved_points: list[dict]
    suggestions: list[str]
    after_score: int
    improvement: int

    error: Optional[str]
    retries: int
    mode: str  # "analyze" | "tailor" | "both"
```

### 3. `backend/app/workflow/prompts.py`

Three prompt templates:

- **ANALYZE_PROMPT** — ATS analysis: match_score, strengths, missing_keywords, improvements
- **TAILOR_PROMPT** — Resume bullet rewriting with ground truth constraint
- **VALIDATE_PROMPT** — Check each tailored bullet against ground truth for hallucinations

Each prompt explicitly includes:
- The `GROUND_TRUTH` fact sheet
- The exact JSON schema expected
- The "NEVER invent" constraint

### 4. `backend/app/workflow/nodes.py`

| Function | Type | Input | Output state fields |
|---|---|---|---|
| `preprocess(state)` | Sync | resume_text, job_desc | resume_summary, keywords, before_score |
| `extract_ground_truth(state)` | Sync | resume_text | Returns skill/tool/metric lists (injected into prompts) |
| `call_analyze_llm(state)` | LLM | resume_summary, keywords | analysis_result: {match_score, strengths, missing_keywords, improvements} |
| `call_tailor_llm(state)` | LLM | resume_summary, keywords, ground_truth | improved_points[], suggestions[] |
| `validate_tailored(state)` | LLM | improved_points vs ground_truth | Sets error if hallucination found, increments retries |
| `score_final(state)` | Sync | tailored bullets, keywords | after_score, improvement |

### 5. `backend/app/workflow/graph.py`

```
analyze_graph = StateGraph(ResumeState)
  preprocess → call_analyze_llm → END

tailor_graph = StateGraph(ResumeState)
  preprocess → extract_ground_truth → call_tailor_llm
  call_tailor_llm → score_final → END
  call_tailor_llm → validate_tailored → call_tailor_llm (if retries < 2)
                                        → score_final (if retries >= 2)
```

### 6. `backend/app/services/pdf_service.py`

Class `ResumePDF` using `fpdf2`:
- `build(resume_text, tailored_points, font_size=10)` → Returns `BytesIO` PDF
- Parses resume text into sections: Header, Summary, Experience, Education, Skills
- Replaces original bullets with tailored ones
- Outputs clean, ATS-friendly PDF (Helvetica, no columns, standard margins)
- Adds subtle "Tailored with Applyd AI" watermark/footer

---

## Files to Modify

### 7. `backend/app/core/config.py`

Replace:
```python
GOOGLE_API_KEY: str | None = None
GEMINI_MODEL: str = "gemini-2.0-flash"
```

With:
```python
OPENROUTER_API_KEY: str | None = None
OPENROUTER_MODEL: str = "mistralai/mistral-7b-instruct:free"
```

Remove unused `OPENAI_API_KEY` / `OPENAI_MODEL`.

### 8. `backend/app/api/v1/routes/ai.py`

Major rewrite:

**Remove:**
- `import google.generativeai as genai`
- `from google.api_core import exceptions as google_exceptions`
- Gemini configuration block
- `call_gemini_unified()` function
- `analyze_resume_with_gemini()` / `tailor_resume_with_gemini()` wrappers

**Add:**
- `from openai import OpenAI` — for direct OpenRouter calls
- `from app.workflow.graph import analyze_graph, tailor_graph` — LangGraph instances
- `from app.services.pdf_service import ResumePDF`

**New helper:**
```python
def call_llm_direct(system_prompt: str, user_prompt: str, json_schema: dict) -> dict:
    """Direct OpenRouter call for /analyze (no LangGraph needed)."""
    client = OpenAI(
        api_key=settings.OPENROUTER_API_KEY,
        base_url="https://openrouter.ai/api/v1",
    )
    response = client.chat.completions.create(
        model=settings.OPENROUTER_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
    )
    return json.loads(response.choices[0].message.content)
```

**Route changes:**
- `POST /analyze` → `call_llm_direct()` instead of `call_gemini_unified()`
- `POST /resume-tailor` → `tailor_graph.invoke(state)` instead of `call_gemini_unified()`
- `POST /optimize` → run both analyze and tailor sequentially
- `POST /download-tailored` → **NEW**: accepts `resume_text` + `tailored_points`, returns PDF `StreamingResponse`
- Keep `POST /resume-score` unchanged (local-only)
- Keep `POST /extract-resume` unchanged

### 9. `backend/requirements.txt`

Remove: `google-generativeai==0.8.3`

Add:
```
langgraph>=0.4.0
langchain-core>=0.3.0
langchain-openai>=0.3.0
openai>=1.60.0
fpdf2>=2.7.0
```

### 10. `backend/.env` and `backend/.env.example`

Replace:
```
GOOGLE_API_KEY=AIzaSyCK8NT5oXnXgC2UpvFiUYr_GQUl66VvA94
```

With:
```
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=mistralai/mistral-7b-instruct:free
```

### 11. `src/pages/ResumeAnalyzer.jsx`

Add "Tailor Resume" button after result renders:

```jsx
{result && (
  <button onClick={() => nav('/resume-tailor', {
    state: { resumeText, jobDesc, filename }
  })}>
    Tailor Resume with AI
  </button>
)}
```

Pass the extracted resume text + JD via router location state.

### 12. `src/pages/ResumeTailor.jsx`

Read pre-filled data from `location.state`:
- If state has `resumeText` and `jobDesc`, skip the upload step — show "ready to tailor"
- If no state (direct navigation), show the normal upload form

After tailor results, add **Download PDF** button:
```jsx
{result && (
  <button onClick={handleDownload}>
    Download Tailored Resume (PDF)
  </button>
)}
```

### 13. `src/services/api.js`

Add:
```js
downloadTailored: (resumeText, tailoredPoints) => {
  const fd = new FormData();
  fd.append('resume_text', resumeText);
  fd.append('tailored_points', JSON.stringify(tailoredPoints));
  return request('/ai/download-tailored', {
    method: 'POST',
    body: fd,
    headers: {},  // let browser set content-type for FormData
  });
},
```

---

## Data Flow

```
Resume Analyzer                          Resume Tailor
┌──────────────────┐                    ┌──────────────────────┐
│ Upload resume     │  state = {        │ Pre-filled JD        │
│ Paste JD          │ ── resumeText,    │ Pre-loaded resume    │
│ Click Analyze ────┤    jobDesc,       │ Click Tailor ────────┤
│ ┌──────────────┐  │    filename }     │ LangGraph workflow   │
│ │ Score 78%    │  │   router.push     │ → optimized bullets  │
│ │ Strengths    │  │                    │ → before/after score │
│ │ Missing KWs  │  │                    │ → Download PDF btn   │
│ │ [Tailor It]──┼──┘                    │                      │
│ └──────────────┘                      │  Back to Analysis    │
└──────────────────┘                    └──────────────────────┘
```

---

## Signup Required

User must:
1. Go to https://openrouter.ai/keys
2. Create free account (no credit card)
3. Generate API key
4. Paste into `backend/.env` as `OPENROUTER_API_KEY`

---

## Implementation Order

1. Create `backend/app/workflow/__init__.py`
2. Create `backend/app/workflow/state.py`
3. Create `backend/app/workflow/prompts.py`
4. Create `backend/app/workflow/nodes.py`
5. Create `backend/app/workflow/graph.py`
6. Create `backend/app/services/pdf_service.py`
7. Update `backend/app/core/config.py`
8. Rewrite `backend/app/api/v1/routes/ai.py`
9. Update `backend/requirements.txt`
10. Update `backend/.env` and `backend/.env.example`
11. Update `src/services/api.js`
12. Update `src/pages/ResumeAnalyzer.jsx`
13. Update `src/pages/ResumeTailor.jsx`
14. Build and verify frontend + backend
