# Applyd — Deployment Plan: Render (Backend) + Vercel (Frontend)

## Architecture

```
User → Vercel CDN (SPA)
            │
            ├── /* → /index.html (SPA fallback)
            │
            └── /api/v1/* → Render backend (proxy)
                                │
                                └── Supabase DB
```

- No code changes required
- 1 new file: `vercel.json` at project root
- Env vars set via Vercel + Render dashboards

---

## Step 1: Backend → Render

Create a **Web Service** on [render.com](https://dashboard.render.com):

| Setting | Value |
|---|---|
| Source | Your GitHub repo (`tauhiddotexe/Applyd`) |
| Root Directory | `backend/` |
| Runtime | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `gunicorn app.main:app -w 1 -k uvicorn.workers.UvicornWorker --timeout 120` |
| Plan | Free |

### Environment Variables (set in Render dashboard → Environment)

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase connection string (same as current AWS) |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173,https://applyd.vercel.app` |
| `FRONTEND_URL` | `https://applyd.vercel.app` |
| `DEV_MODE` | `false` |
| `OPENROUTER_API_KEY` | your-key |
| `OPENROUTER_MODEL` | `openrouter/free` |
| `STRIPE_API_KEY` | your-key |
| `STRIPE_WEBHOOK_SECRET` | your-secret |
| `STRIPE_BASIC_PRICE_ID` | price-id |
| `STRIPE_PRO_PRICE_ID` | price-id |
| `AWS_ACCESS_KEY_ID` | aws-key |
| `AWS_SECRET_ACCESS_KEY` | aws-secret |
| `AWS_REGION` | `ap-south-1` |
| `AWS_S3_BUCKET` | your-bucket |
| `LOG_LEVEL` | `INFO` |

After deploy, note the URL: `https://applyd-backend.onrender.com`

---

## Step 2: Create `vercel.json` (project root)

```json
{
  "rewrites": [
    {
      "source": "/api/v1/(.*)",
      "destination": "https://applyd-backend.onrender.com/api/v1/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

First rule proxies API calls to Render (same-origin for browser = no CORS).  
Second rule enables SPA deep-linking (all paths serve `index.html`).

---

## Step 3: Frontend → Vercel

Import repo on [vercel.com](https://vercel.com):

| Setting | Value |
|---|---|
| Framework Preset | Vite (auto-detected) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Root Directory | `/` (project root) |

### Environment Variables (set in Vercel dashboard)

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://mavnhukwcfbydbfvhxvs.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | your-anon-key |
| `VITE_API_URL` | `/api/v1` |

---

## Step 4: Back-fill CORS

After Vercel gives you a URL (e.g. `applyd-xyz.vercel.app`), update Render:

| Variable | New Value |
|---|---|
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173,https://applyd-xyz.vercel.app` |
| `FRONTEND_URL` | `https://applyd-xyz.vercel.app` |

---

## Step 5: Verify

1. Open the Vercel URL
2. Login
3. Walk through: dashboard → applications → AI features → profile
4. Confirm API calls reach Render (no CORS errors, data loads)

---

## What stays the same

- **Supabase database** — shared between old and new backends
- **All application code** — zero modifications
- **All features** — auth, dashboard, AI analysis, resume scoring, everything
