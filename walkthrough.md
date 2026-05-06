# Applyd Backend — Build Walkthrough

## Final Backend Structure

```
backend/
├── .env                          # DB connection + config (git-ignored)
├── .env.example                  # Template for new devs
├── requirements.txt              # Python dependencies
├── seed.py                       # Creates demo user for dev
├── alembic.ini                   # Alembic config
├── alembic/
│   ├── env.py                    # Async migration runner
│   ├── script.py.mako            # Migration template
│   └── versions/                 # Auto-generated migrations
└── app/
    ├── __init__.py
    ├── main.py                   # FastAPI app, CORS, lifespan, routes
    ├── core/
    │   ├── config.py             # Settings from .env (pydantic-settings)
    │   └── logging.py            # Structured logger
    ├── db/
    │   └── session.py            # Async engine, session factory, Base
    ├── models/
    │   └── models.py             # User + Application SQLAlchemy models
    ├── schemas/
    │   └── application.py        # Pydantic Create/Update/Response
    ├── services/
    │   └── application_service.py  # Business logic (CRUD)
    └── api/v1/routes/
        └── applications.py       # REST endpoints (POST/GET/PUT/DELETE)
```

---

## Architecture: Route → Service → DB

```
Frontend (React)
    ↓ HTTP
API Route (applications.py)     ← validates input, returns response
    ↓
Service (application_service.py) ← business logic, logging
    ↓
DB Session (session.py)          ← async SQLAlchemy + asyncpg
    ↓
Supabase PostgreSQL
```

---

## Setup Instructions

### 1. Prerequisites
- Python 3.12+
- Supabase project with PostgreSQL (or local PostgreSQL)

### 2. Configure Database

Edit `backend/.env`:
```env
DATABASE_URL=postgresql+asyncpg://postgres.YOUR_REF:YOUR_PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
LOG_LEVEL=INFO
```

> [!IMPORTANT]
> Use the **Session Mode** (port 5432) or **Transaction Mode** (port 6543) connection string from your Supabase dashboard → Settings → Database.

### 3. Install & Run

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate        # Windows
pip install -r requirements.txt

# Seed demo user
python seed.py

# Start server
uvicorn app.main:app --reload --port 8000
```

### 4. Verify
```bash
curl http://localhost:8000/health
# → {"status":"ok","service":"applyd-api"}
```

---

## API Endpoints

All routes are at `/api/v1/applications`.

### Create Application
```http
POST /api/v1/applications
Content-Type: application/json

{
  "company": "Stripe",
  "role": "Senior Product Designer",
  "status": "applied",
  "link": "https://stripe.com/jobs/123",
  "notes": "Referral from Jane",
  "followUp": "2024-11-15"
}
```

**Response (201):**
```json
{
  "id": "a1b2c3d4-...",
  "user_id": "00000000-0000-0000-0000-000000000001",
  "company": "Stripe",
  "role": "Senior Product Designer",
  "status": "applied",
  "link": "https://stripe.com/jobs/123",
  "notes": "Referral from Jane",
  "followUp": "2024-11-15",
  "created_at": "2024-10-28T12:00:00Z",
  "updated_at": "2024-10-28T12:00:00Z"
}
```

### List Applications
```http
GET /api/v1/applications
```

### Get Single
```http
GET /api/v1/applications/{id}
```

### Update
```http
PUT /api/v1/applications/{id}
Content-Type: application/json

{
  "status": "interviewing",
  "notes": "Phone screen scheduled for Tuesday"
}
```

### Delete
```http
DELETE /api/v1/applications/{id}
# → 204 No Content
```

### Error Response (404)
```json
{
  "detail": "Application not found"
}
```

---

## Auth Placeholder

Auth is **NOT implemented yet**. Currently:
- A hardcoded `DEMO_USER_ID` is used for all requests
- An optional `X-User-Id` header can override it
- When Supabase Auth is added, replace `get_current_user_id()` in `applications.py` with JWT token validation

---

## Migrations (Alembic)

```bash
# Generate migration from model changes
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head
```

> [!NOTE]
> On first startup, `main.py` auto-creates tables via `Base.metadata.create_all`. Alembic is for subsequent schema changes.

---

## What's Done vs Remaining

| Task | Status |
|---|---|
| Project structure | ✅ |
| Environment config | ✅ |
| Logging | ✅ |
| CORS | ✅ |
| Database connection (async) | ✅ |
| SQLAlchemy models (User, Application) | ✅ |
| Pydantic schemas | ✅ |
| CRUD service layer | ✅ |
| REST API routes | ✅ |
| Alembic migrations | ✅ |
| Demo seed script | ✅ |
| Health check endpoint | ✅ |
| **Supabase Auth integration** | ❌ Next |
| **Resume upload (S3)** | ❌ |
| **AI/LLM endpoints** | ❌ |
| **Dashboard aggregation API** | ❌ |
