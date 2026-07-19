# Applyd — Deployment Guide (Vercel + Render)

## ✅ Done

- **Vercel (Frontend):** Live at `https://applyd.vercel.app`
- **Config files:** `vercel.json`, `.vercelignore` — in repo
- **`backend/.python-version`** — pins Python 3.12 (Render requires this file)
- **`backend/runtime.txt`** — deleted (Render does NOT read this file)

---

## Step: Create Render Web Service (Backend)

1. Go to https://dashboard.render.com → **New +** → **Web Service**
2. Connect GitHub repo: `tauhiddotexe/Applyd`
3. Fill in:

   | Field | Value |
   |---|---|
   | **Root Directory** | `backend/` |
   | **Runtime** | `Python 3` |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `gunicorn app.main:app -w 1 -k uvicorn.workers.UvicornWorker --timeout 120` |
   | **Plan** | Free |

4. Click **Advanced** → **Add Environment Variable** — add these:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | `postgresql://postgres.mavnhukwcfbydbfvhxvs:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
   | `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173,https://applyd.vercel.app` |
   | `FRONTEND_URL` | `https://applyd.vercel.app` |
   | `DEV_MODE` | `false` |
   | `OPENROUTER_API_KEY` | (your key) |
   | `OPENROUTER_MODEL` | `openrouter/free` |
   | `OPENROUTER_FALLBACK_MODELS` | `meta-llama/llama-3.3-70b-instruct:free,nvidia/nemotron-3-nano-30b-a3b:free,qwen/qwen3-next-80b-a3b-instruct:free` |
   | `STRIPE_API_KEY` | (your Stripe secret) |
   | `STRIPE_WEBHOOK_SECRET` | (your webhook secret) |
   | `STRIPE_BASIC_PRICE_ID` | (price_xxx) |
   | `STRIPE_PRO_PRICE_ID` | (price_xxx) |
   | `AWS_ACCESS_KEY_ID` | (your AWS key) |
   | `AWS_SECRET_ACCESS_KEY` | (your AWS secret) |
   | `AWS_REGION` | `ap-south-1` |
   | `AWS_S3_BUCKET` | (your S3 bucket) |
   | `LOG_LEVEL` | `INFO` |

5. Click **Create Web Service**
6. **IMPORTANT:** If this is NOT the first deploy, go to **Settings** → **Build & Deploy** → **Clear build cache & deploy** (the previous failed build may have cached Python 3.14)
7. Wait for build + deploy to finish (first build takes a while — pip installs all deps including torch)

---

## After Render Is Live

Tell me the Render URL (e.g. `https://applyd-backend.onrender.com`) and I'll:

1. Update `vercel.json` with the correct proxy destination
2. Push to GitHub so Vercel auto-redeploys

---

## ⚠️ Key Render Gotchas

| Mistake | Fix |
|---|---|
| `runtime.txt` does NOT work on Render | Use `.python-version` in the service root (`backend/`) |
| Default Python is now **3.14** (alpha) — no wheels for most packages | `.python-version` with `3.12` forces a stable version |
| Build cache may retain old Python detection | Clear build cache in Render dashboard after changing Python version |
