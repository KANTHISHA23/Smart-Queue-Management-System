# SmartQueue — Smart Queue Management System

A full-stack digital queue management platform with real-time updates, multi-organization support, admin analytics, and ML-based wait-time prediction.
| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS |
| **Backend** | Node.js, Express 4, Socket.io |
| **Database** | PostgreSQL (Neon / Render Postgres) |
| **Auth** | JWT (access + refresh tokens) |
| **ML** | Python, FastAPI, scikit-learn (Random Forest) |

---

## Features

- **Users** — Browse locations, book tokens remotely, track live queue position, cancel bookings, view history
- **Organizations** — Manage queues, call/skip/serve tokens, priority handling, analytics dashboard
- **Platform admin** — System-wide oversight, contact queries
- **Real-time** — Socket.io for live queue updates
- **ML wait prediction** — Random Forest model with heuristic fallback when ML is unavailable

---

## Repository structure

```
├── frontend/          Next.js web app  → deploy on Vercel
├── backend/           Express API + Socket.io  → deploy on Render
├── ml/                FastAPI inference service (optional)
├── render.yaml        One-click Render blueprint (backend + Postgres)
├── DEPLOYMENT.md      Step-by-step GitHub, Vercel & Render guide
└── README.md
```

---

## Local development

### Prerequisites

- Node.js 18+
- PostgreSQL (or a [Neon](https://neon.tech) connection string)
- Python 3.10+ (only if running the ML service)

### 1. Backend

```bash
cd backend
cp .env.example .env          # edit DATABASE_URL and JWT secrets
npm install
npm run setup                 # migrate + seed demo data
npm run dev
```

API: `http://localhost:5000` · Health: `http://localhost:5000/api/health`

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

App: `http://localhost:3000`

### 3. ML service (optional)

```bash
cd ml
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
python train_wait_model.py  # requires seeded DB
uvicorn app:app --host 0.0.0.0 --port 8001
```

Set `ML_SERVICE_URL=http://localhost:8001` in `backend/.env`.

---

## Demo credentials (after `npm run seed`)

| Role | Email | Password |
|------|-------|----------|
| Platform admin | `admin@smartqueue.com` | `password123` |
| User | `john@example.com` | `password123` |
| Organization | `hospital@provider.com` | `password123` |

---

## Deployment

**Recommended stack:** Vercel (frontend) + Render (backend + PostgreSQL).

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full checklist:

1. Push this repo to GitHub
2. Deploy backend with `render.yaml` (Blueprint)
3. Deploy frontend on Vercel (`frontend` as root directory)
4. Wire environment variables (`CLIENT_URL`, `NEXT_PUBLIC_API_URL`)

---

## License

MIT — free to use for personal and commercial projects.
