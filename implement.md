# Applyd — Deployment Guide: Render (Backend) + Vercel (Frontend)

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

No code changes. Files added: `vercel.json`, `.vercelignore`.

---

## Step 1: Create Render Web Service (Backend)

1. Go to https://dashboard.render.com → **New +** → **Web Service**
2. Connect your GitHub repo: `tauhiddotexe/Applyd`
3. Fill in:

   | Field | Value |
   |---|---|
   | **Root Directory** | `backend/` |
   | **Runtime** | `Python 3` |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `gunicorn app.main:app -w 1 -k uvicorn.workers.UvicornWorker --timeout 120` |
   | **Plan** | Free |

4. Add environment variables (click **Advanced** → **Add Environment Variable**):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | `postgresql://postgres.mavnhukwcfbydbfvhxvs:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
   | `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173,https://applyd.vercel.app` |
   | `FRONTEND_URL` | `https://applyd.vercel.app` |
   | `DEV_MODE` | `false` |
   | `OPENROUTER_API_KEY` | your OpenRouter key |
   | `OPENROUTER_MODEL` | `openrouter/free` |
   | `OPENROUTER_FALLBACK_MODELS` | `meta-llama/llama-3.3-70b-instruct:free,nvidia/nemotron-3-nano-30b-a3b:free,qwen/qwen3-next-80b-a3b-instruct:free` |
   | `STRIPE_API_KEY` | your Stripe secret key |
   | `STRIPE_WEBHOOK_SECRET` | your Stripe webhook secret |
   | `STRIPE_BASIC_PRICE_ID` | price_xxx |
   | `STRIPE_PRO_PRICE_ID` | price_xxx |
   | `AWS_ACCESS_KEY_ID` | your AWS access key |
   | `AWS_SECRET_ACCESS_KEY` | your AWS secret key |
   | `AWS_REGION` | `ap-south-1` |
   | `AWS_S3_BUCKET` | your S3 bucket name |
   | `LOG_LEVEL` | `INFO` |

5. Click **Create Web Service**
6. Wait for deploy to finish. Note the URL: `https://applyd-backend.onrender.com`

---

## Step 2: Update `vercel.json` with Render URL

Once Render gives you a URL, update the proxy destination in `vercel.json` (project root):

```json
{
  "rewrites": [
    {
      "source": "/api/v1/(.*)",
      "destination": "https://YOUR-RENDER-URL.onrender.com/api/v1/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Commit and push to GitHub:
```bash
git add vercel.json
git commit -m "update vercel.json with Render URL"
git push
```

---

## Step 3: Deploy Frontend to Vercel

1. Go to https://vercel.com → **Add New** → **Project**
2. Import your GitHub repo: `tauhiddotexe/Applyd`
3. It auto-detects **Vite** — leave defaults:

   | Setting | Value |
   |---|---|
   | Framework Preset | Vite |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |

4. Add environment variables:

   | Variable | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://mavnhukwcfbydbfvhxvs.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdm5odWt3Y2ZieWRiZnZoeHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjE1ODMsImV4cCI6MjA5MjkzNzU4M30.U6OJnRHdlK5Ga_eAV8UIvu5yR8VlOuZfj-kHmTK7mN4` |
   | `VITE_API_URL` | `/api/v1` |

5. Click **Deploy**
6. Note the Vercel URL: `https://applyd.vercel.app`

---

## Step 4: Update CORS on Render

After Vercel deploy completes, go to **Render Dashboard** → your web service → **Environment** → update:

| Variable | New Value |
|---|---|
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173,https://applyd.vercel.app` (replace with actual Vercel URL) |
| `FRONTEND_URL` | `https://applyd.vercel.app` (replace with actual Vercel URL) |

Click **Save Changes** → Render will redeploy automatically.

---

## Step 5: Verify

1. Open your Vercel URL
2. Log in, browse dashboard, applications, AI features
3. Check browser dev tools → Network tab → API calls should hit Render (no CORS errors)
4. Verify file uploads, resume scoring, everything works

---

## Rollback

- **Vercel**: Previous deployment is still live — go to project → Deployments → click previous deploy
- **Render**: Web service → Events → Deploy a previous version
