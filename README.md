# nxzen Portfolio Office — Dashboard

React + FastAPI + PostgreSQL portfolio dashboard for the nxzen UK Portfolio Office.

## Stack

- **Backend:** FastAPI · SQLAlchemy 2 · Alembic · PostgreSQL 16 · JWT + bcrypt
- **Frontend:** Vite · React 18 · TypeScript · Tailwind CSS · Framer Motion · Recharts · Zustand
- **Theme:** Dark Premium (deep slate + indigo/cyan accents, animated KPIs, RAG pulse glow)

## Quickstart with Docker

```bash
cp .env.example .env       # then edit JWT_SECRET, POSTGRES_PASSWORD
docker compose up -d --build
```

Four containers come up:

| Service | Container | Host port | Notes |
|---|---|---|---|
| `db` (Postgres 16) | `portfolio_db` | **127.0.0.1:8023** → 5432 | Bound to loopback only — not reachable from the public internet. Use `psql -h 127.0.0.1 -p 8023` from the server itself. |
| `backend` (FastAPI) | `portfolio_backend` | **8022** → 8000 | Entrypoint waits for DB, runs `alembic upgrade head`, runs `seed.py` (idempotent), starts uvicorn |
| `frontend` (nginx) | `portfolio_frontend` | **8021** → 80 | Serves the built React SPA; proxies `/api/*` to `backend:8000` |
| `proxy` (nginx) | `portfolio_proxy` | **8024** → 80 | Public reverse proxy — single entry point routing `/` to frontend and `/api/*` to backend |

**Recommended public URL: `http://<host>:8024`** — one port, both SPA and API.
The 8021 and 8022 ports are useful for direct access / debugging.

Default login: `admin@nxzen.com / admin123`.

The two source Excel files (`Portfolio_Register_v4.xlsx`, `Portfolio Metric Catalogue v0.4.xlsx`) are bind-mounted into `/data` inside the backend container so `seed.py` can read them on first run.

To reset everything:

```bash
docker compose down -v   # removes the postgres volume too
```

### Deploying to the production host

Target: `http://149.102.158.71`

```bash
# 1. SSH to the server
ssh <user>@149.102.158.71

# 2. Get the code + Excel files into ~/Portfolio_Dashboard (scp / git pull)

# 3. Configure secrets
cd ~/Portfolio_Dashboard
cp .env.example .env
# Edit .env and set:
#   JWT_SECRET=<openssl rand -hex 48>
#   POSTGRES_PASSWORD=<strong-password>

# 4. Open the firewall (ufw example — adjust for your distro)
sudo ufw allow 8024/tcp        # public entry
sudo ufw allow 8021/tcp        # optional, direct frontend
sudo ufw allow 8022/tcp        # optional, direct API (Swagger at /docs)
# Do NOT open 8023 — DB is bound to localhost only

# 5. Bring the stack up
docker compose up -d --build

# 6. Tail logs
docker compose logs -f backend
```

After it's up:

- **Application:** <http://149.102.158.71:8024>
- **API Swagger:** <http://149.102.158.71:8022/docs>
- **Direct frontend:** <http://149.102.158.71:8021>

Set `RUN_SEED=0` in `.env` after the first successful boot if you don't want the seed to re-run on every restart (it's idempotent, so it's safe to leave on; just slightly slower).

### Alternative: direct SQL load (no Excel files needed on the server)

If you don't want to ship the two `.xlsx` source files to the server, you can apply the pre-generated dump at `data/seed.sql` instead. It contains all current rows — users, projects, weekly status, risks, CSAT, resources, resource-weeks, metric definitions — as plain `INSERT` statements with sequence resets, ~99 KB, 232 rows.

**One-time apply on a fresh DB:**

```bash
# 1. Disable the Excel-driven seed so the two paths don't fight
echo "RUN_SEED=0" >> .env

# 2. Bring up the schema only
docker compose up -d --build db backend

# 3. Apply seed.sql
./data/apply-seed.sh
#   (or directly:  docker exec -i portfolio_db psql -U portfolio -d portfolio_dashboard < data/seed.sql)

# 4. Start the rest
docker compose up -d frontend proxy
```

The script verifies row counts at the end. Apply only on an empty schema — the dump uses explicit IDs, so re-applying on a populated DB will error with primary-key collisions.

**Regenerating the dump** after you've made changes locally:

```bash
./data/dump-seed.sh   # captures current portfolio_db state into data/seed.sql
```

Commit the updated `data/seed.sql` so the server picks it up on the next deploy.

### Docker dev (hot-reload backend, Vite HMR for frontend)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
# in another terminal:
cd frontend && npm install && npm run dev
```

The dev overlay disables the `frontend` and `proxy` containers and runs uvicorn with `--reload` mounting `./backend`. Vite serves on `localhost:5173` with `/api` proxied to `localhost:8022`.

---

## Manual setup (no Docker)

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 14+ running locally

## 1. Database

Create a database and user:

```sql
CREATE USER portfolio WITH PASSWORD 'portfolio';
CREATE DATABASE portfolio_dashboard OWNER portfolio;
```

## 2. Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env   # edit JWT_SECRET, DATABASE_URL if needed
alembic upgrade head
python seed.py           # creates default users + imports 16 projects + metric catalogue
uvicorn app.main:app --reload --port 8000
```

API docs: <http://localhost:8000/docs>

### Default logins (seeded)

| Email | Password | Role |
|---|---|---|
| admin@nxzen.com | admin123 | admin |
| po@nxzen.com | po123 | portfolio_office |
| pm@nxzen.com | pm123 | pm |
| cp@nxzen.com | cp123 | cp |
| rm@nxzen.com | rm123 | rm |
| finance@nxzen.com | finance123 | finance |
| exec@nxzen.com | exec123 | exec_viewer (read-only) |

Change these in production.

## 3. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173> and sign in.

## Project layout

```
backend/
  app/
    auth/            JWT, bcrypt, role guards
    models/          SQLAlchemy models (one per entity)
    schemas/         Pydantic v2 request/response models
    routers/         API endpoints (auth, projects, weekly_status, risks_issues,
                     escalations, commercial, resources, csat, gov_checkpoints,
                     metrics, dashboard)
    config.py        Settings (env-driven)
    database.py      Engine + session
    main.py          FastAPI app wiring
  alembic/           Migrations
  seed.py            One-shot seed: users + metric catalogue + 16 projects + current
                     weekly status / risks / CSAT from Portfolio_Register_v4.xlsx
  requirements.txt
  .env.example

frontend/
  src/
    components/      Layout, KpiTile (animated), RagDot
    pages/           Login, Dashboard, Projects, WeeklyStatus, RisksIssues,
                     Escalations, Commercial, Resources, Csat, Governance
    lib/             API client, cn helper
    store/           Zustand auth store
    styles/          Tailwind globals + theme primitives
  tailwind.config.js Dark Premium theme tokens
  vite.config.ts     Dev proxy /api -> backend:8000
```

## MVP scope (from `Portfolio Metric Catalogue v0.4`)

19 MVP metrics are wired into `/api/dashboard/summary`:

- Portfolio Snapshot: Active Projects, Active Clients, Overall RAG, Overall RAG Red/Amber/Green %, On Time %, Projects Behind Schedule, Resource Gaps Flagged
- Resource & Utilisation: UK %, India %, Unassigned %, Unbillable %, Billable Utilisation %
- Delivery Health: Schedule RAG, Resource RAG, Open Risks, Open Issues, **Escalations & Decisions Required (new screen)**

REL 1 / REL 2 / REL 3 metrics are present in `metric_definitions` (seeded from the catalogue) but not yet on the dashboard — they will be added in later releases.

## Operating rhythm

- **Thursday EOD** — PMs complete Weekly Status, Risks & Issues, Escalations
- **Friday AM** — Portfolio Office validates
- **Friday PM** — Dashboard distributed
- **Tuesday** — Exec review (Mohamed Syedian)

## Notes

- Source-of-truth files (`Portfolio_Register_v4.xlsx`, `Portfolio Metric Catalogue v0.4.xlsx`) sit at the repo root; `seed.py` reads them on first run.
- Weekly tables use `(project_id, week_ending)` uniqueness — append-only history, sparklines fall out of the same data.
- Hard cut to the app: no parallel Excel input expected after seed.
- Auth is local email/password + JWT; Microsoft Entra ID can be layered on later.
