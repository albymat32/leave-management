# Leave Management MVP (FastAPI + Vite + Supabase Postgres)

Mobile-first leave management app for small smartphones.
- Session cookie auth (HttpOnly + Secure + SameSite=Lax)
- Admin + Employee roles
- One-time admin setup code
- Email notifications via SMTP (configurable at runtime)

## 1) Prerequisites
- Node 18+
- Python 3.11+
- A Supabase project (Postgres)

## 2) Supabase: get DATABASE_URL
In Supabase:
- Project Settings → Database → Connection string (URI)
- Use the **Transaction pooler** if Render needs it (often safer).
Set as `DATABASE_URL` in backend env.

Example:
`postgresql://USER:PASSWORD@HOST:6543/postgres?sslmode=require`

## 3) Backend env vars
Create `backend/.env` (local dev):
- DATABASE_URL=...
- ADMIN_SETUP_CODE=your-setup-code
- EMAIL_CRED_SECRET=32+ chars random
- SESSION_COOKIE_NAME=lm_session

## 4) Local run
### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# migrations
export DATABASE_URL="..."
alembic upgrade head

uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm i
npm run dev
```

Open: http://localhost:5173

## 5) Single-domain production (recommended)
In production, backend serves frontend build output.

Build frontend:
```bash
cd frontend
npm i
npm run build
```

Then run backend and it will serve `frontend/dist` at `/`.

## 6) Render deployment (free tier)
Create a Render **Web Service** (Python).

### Build Command (Render)
```bash
cd frontend && npm ci && npm run build && cd ../backend && pip install -r requirements.txt
```

### Start Command (Render)
```bash
cd backend && bash render-start.sh
```

### Environment variables (Render)
Set:
- DATABASE_URL
- ADMIN_SETUP_CODE
- EMAIL_CRED_SECRET

## 7) Zip the project
From the parent folder:
```bash
zip -r leave-management-mvp.zip backend frontend README.md
```

## Notes
- Employee login ambiguity is not handled (by your request): ensure name+DOB are unique enough in your org.
- Email config is optional; if disabled/invalid, the app keeps working and silently skips emails.