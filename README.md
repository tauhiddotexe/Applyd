<div align="center">
  <h1>Applyd</h1>
  <p><strong>AI-Powered Job Application & Resume Optimization Platform</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React 18">
    <img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white" alt="FastAPI">
    <img src="https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white" alt="Python 3.12">
    <img src="https://img.shields.io/badge/PostgreSQL-Supabase-3FCF8E?logo=supabase&logoColor=white" alt="Supabase PostgreSQL">
    <img src="https://img.shields.io/badge/Tailwind_CSS-v3-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
    <img src="https://img.shields.io/badge/Stripe-008CDD?logo=stripe&logoColor=white" alt="Stripe">
  </p>
</div>

---

## Overview

Applyd supercharges your job search by combining AI-powered resume optimization with a Kanban-style application tracker. Analyze and tailor your resume for any job description, track applications across stages, and gain actionable insights — all in one place.

## Features

- **Resume Optimization** — AI-driven keyword extraction and tailoring to match job descriptions
- **Application Tracking** — Kanban dashboard with drag-and-drop status management
- **Resume Scoring** — Compare your resume against job descriptions with detailed gap analysis
- **Analytics** — Visualize your job search progress and application metrics
- **Authentication** — Secure session management via Supabase Auth
- **Payment Integration** — Credit-based billing powered by Stripe
- **Dark Mode** — Full theme support with a polished design system

## Tech Stack

| Frontend | Backend | Infrastructure |
|---|---|---|
| React 18 + Vite 6 | FastAPI (Python 3.12) | Vercel (frontend) |
| Tailwind CSS 3 | SQLAlchemy 2.0 + Alembic | Render (backend) |
| React Router 6 | LangChain + LangGraph | Supabase PostgreSQL |
| GSAP | OpenRouter AI (multi-model) | AWS S3 (storage) |
| Phosphor Icons | Stripe | Supabase Auth |

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.12+
- A Supabase account
- An OpenRouter API key
- A Stripe account

### Frontend

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173`.

### Backend

```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API runs at `http://localhost:8000`. Interactive docs at `/docs`.

## Environment Variables

Copy the template below into your environment:

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe publishable key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase service role key |
| `SUPABASE_JWT_SECRET` | Supabase JWT secret |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `AWS_ACCESS_KEY_ID` | AWS S3 access key |
| `AWS_SECRET_ACCESS_KEY` | AWS S3 secret key |
| `AWS_S3_BUCKET_NAME` | AWS S3 bucket name |
| `AWS_REGION` | AWS region |
| `ENVIRONMENT` | `development` or `production` |

## Project Structure

```
src/                          # React frontend
├── components/               # Reusable UI components
├── pages/                    # Route-level pages
├── services/                 # API client layer
└── contexts/                 # Auth state management

backend/                      # FastAPI backend
├── app/
│   ├── api/v1/routes/        # API endpoints
│   ├── core/                 # Config, auth, dependencies
│   ├── db/                   # Database session
│   ├── models/               # SQLAlchemy models
│   ├── schemas/              # Pydantic schemas
│   ├── services/             # Business logic
│   └── workflow/             # LangGraph AI workflow
└── requirements.txt
```

## License

MIT
