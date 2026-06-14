# Deployment Guide — GitHub + Vercel + Render

This guide gets SmartQueue live with minimal setup. No Docker required.

## Architecture

```
Browser  →  Vercel (Next.js frontend)
                ↓ REST + WebSocket
           Render (Express API + Socket.io)
                ↓
           Render PostgreSQL
                ↓ (optional)
           Render Python service (ML)
```

---

## Step 1 — Push to GitHub

### Install Git (if needed)

Download from [git-scm.com](https://git-scm.com/download/win) or run:

```powershell
winget install Git.Git
```

Restart your terminal after install.

### Create the repository

```powershell
cd path/to/Smart-Queue-Management-System

git init
git add .
git status   # confirm .env and node_modules are NOT listed
git commit -m "Initial commit"
```

On GitHub: **New repository** → name it e.g. `smart-queue-management-system` → **do not** add README (you already have one).

```powershell
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/smart-queue-management-system.git
git push -u origin main
```

> **Never commit** `backend/.env`, `frontend/.env.local`, or `node_modules/`. They are in `.gitignore`.

---

## Step 2 — Deploy backend on Render

### Database (Neon — free tier)

1. Sign up at [neon.tech](https://neon.tech) → create a project
2. Copy the **connection string** (include `?sslmode=require`)
3. You will paste this as `DATABASE_URL` on Render

### Option A — Blueprint (recommended)

1. [render.com](https://render.com) → **New** → **Blueprint**
2. Connect your GitHub repo
3. Render reads `render.yaml` and creates the API web service
4. In the dashboard, set:
   - **`DATABASE_URL`** — Neon connection string
   - **`CLIENT_URL`** — your Vercel URL (can update after Step 3)
5. Wait for deploy → note the URL, e.g. `https://smartqueue-api.onrender.com`

### Option B — Manual web service

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

**Environment variables:**

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `JWT_SECRET` | Long random string |
| `JWT_REFRESH_SECRET` | Another long random string |
| `CLIENT_URL` | Your Vercel frontend URL (no trailing slash) |
| `ML_PREDICTION_ENABLED` | `false` (unless you deploy ML) |

### Seed demo data (once)

Render → your API service → **Shell**:

```bash
npm run seed
```

Migrations run automatically on server start.

### Verify

Open `https://YOUR-API.onrender.com/api/health` — should return JSON with `"status":"ok"`.

---

## Step 3 — Deploy frontend on Vercel

1. [vercel.com](https://vercel.com) → **Add New Project** → import GitHub repo
2. **Root Directory** → set to **`frontend`** (important)
3. Framework: **Next.js** (auto-detected)
4. **Environment variables** (Production):

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-API.onrender.com/api` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://YOUR-API.onrender.com` |
| `NEXT_PUBLIC_APP_NAME` | `SmartQueue` |

5. Deploy

### Fix 404 on Vercel

If the root URL shows `404 NOT_FOUND`:

- Confirm **Root Directory** = `frontend`
- Redeploy after changing env vars

---

## Step 4 — Connect frontend and backend

1. Copy your Vercel URL, e.g. `https://smart-queue.vercel.app`
2. Render → API service → **Environment** → set `CLIENT_URL` to that URL
3. Redeploy the backend (CORS requires the exact frontend origin)

Test login with demo credentials from the README.

---

## Optional — ML service on Render

The app works without ML (heuristic wait-time fallback). To enable ML:

1. Train locally: `cd ml && python train_wait_model.py` (commits `ml/models/wait_time_rf.joblib`)
2. New Render **Web Service**:
   - Root Directory: `ml`
   - Runtime: **Python 3**
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn app:app --host 0.0.0.0 --port $PORT`
3. Backend env: `ML_SERVICE_URL=https://your-ml.onrender.com`, `ML_PREDICTION_ENABLED=true`

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS errors in browser | Set `CLIENT_URL` on Render to exact Vercel URL (https, no trailing slash) |
| Socket.io not connecting | Set `NEXT_PUBLIC_SOCKET_URL` to backend origin (no `/api`) |
| Render cold start (30s delay) | Free tier spins down; first request wakes the service |
| Database connection failed | Use Neon connection string with `?sslmode=require` in `DATABASE_URL` |
| Empty locations after deploy | Run `npm run seed` once in Render Shell |

---

## Environment variable cheat sheet

| Where | Variable | Purpose |
|-------|----------|---------|
| Backend | `DATABASE_URL` | PostgreSQL connection |
| Backend | `JWT_SECRET`, `JWT_REFRESH_SECRET` | Auth tokens |
| Backend | `CLIENT_URL` | Vercel frontend URL for CORS |
| Frontend | `NEXT_PUBLIC_API_URL` | Backend REST base (`…/api`) |
| Frontend | `NEXT_PUBLIC_SOCKET_URL` | Backend origin for WebSocket |
