# ACLCxp

ACLCxp (ACLC Experience) is an event and house competition platform for ACLC College of Tacloban. Students access events, QR passes, attendance history, and merit records; staff record attendance; administrators manage seasons and competition results.

## Features

- Season lifecycle: draft, registration, active, and closed stages, with current-season ticket access and closed-season archive downloads.
- Enrollment: eligible student rosters, ticket generation and redemption, and existing-account access to new seasons.
- Events: registration, capacity and visibility controls, teams, artwork uploads, and attendance modes.
- Attendance: QR student passes, identity confirmation, daily and event attendance, and reports.
- Competitions: matchups, tournament brackets, results, point corrections, house standings, and student merit sheets.
- Annual championship: seasons linked to the same academic year contribute to combined house and student standings; tickets and attendance remain season-specific.
- Administration: users, houses, portal settings, leaderboard visibility, audit logs, and import/export tools.

AI recommendations and a Gemini chatbot are not active features. The AI app remains installed for migration compatibility.

## Stack and structure

| Layer | Repository dependencies |
| --- | --- |
| Backend | Django 6.0.1, Django REST Framework 3.16.1, SimpleJWT |
| Frontend | React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4 |
| Routing and data | React Router 7, TanStack Query 5, Axios |
| Database | PostgreSQL for normal development/deployment; isolated SQLite tests |
| Media | Local uploads in development; database-backed storage in production |

The backend deployment pins Python 3.13. Use Node.js 22.12+ for the frontend.

```text
backend/apps/             Django applications and tests
backend/config/settings/  Development, production, and test settings
backend/render_build.py   Deployment build script
frontend/src/             React pages, components, routes, and API services
frontend/vercel.json      SPA routing configuration
docs/                     Feature and operational guides
```

## Local setup

Run these PowerShell commands from the repository root. Install Python 3.13, Node.js, and PostgreSQL first, and create an empty development database.

### Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` with your own values. Replace the example's secret and credentials:

```dotenv
DEBUG=True
SECRET_KEY=<your-generated-private-secret>
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<database>
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Generate a secret using `.\venv\Scripts\python.exe -c "import secrets; print(secrets.token_urlsafe(64))"`, then initialize the database:

```powershell
.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py seed_houses
.\venv\Scripts\python.exe manage.py createsuperuser
.\venv\Scripts\python.exe manage.py runserver
```

The API runs at `http://localhost:8000/api/`; Django administration is at `http://localhost:8000/admin/`. Development settings are selected by default. They override the environment's CORS list with values in `backend/config/settings/development.py`; update that file for another frontend port or LAN address.

### Frontend

In a second terminal, from the repository root:

```powershell
cd frontend
npm ci
```

Create or edit `frontend/.env.local` to include:

```dotenv
VITE_API_URL=http://localhost:8000
```

Run `npm run dev` and open `http://localhost:5173`. `VITE_API_URL` is the backend origin without `/api`; the client appends `/api` itself. Restart Vite after changing environment variables.

### First administrator workflow

Sign in to the frontend with the superuser account. Use **Admin → Seasons** to create a season, open registration, populate the eligible student roster, and generate/distribute season tickets. Start the season to unlock enrolled students' dashboards.

Students require an eligible roster entry and a valid redeemed ticket for the current season. Registration permits restricted enrollment access; draft and closed seasons lock student access. Staff and administrators can still sign in. See [Season administration](seasons.md) for the full workflow.

## Roles and houses

| Role | Frontend access |
| --- | --- |
| Student | Season-gated dashboard, events, QR pass, profile, statistics, and merit sheet |
| Staff | Attendance workspace |
| Organizer | Attendance workspace |
| Administrator | Admin console and attendance workspace |

The seed command creates **Giallio** (yellow), **Vierrdy** (green), **Azul** (blue), **Cahel** (orange), and **Roxxo** (red). Manage house details and logos in the admin console.

## Validation

From `backend`, with dependencies and required environment values configured:

```powershell
.\venv\Scripts\python.exe manage.py check
.\venv\Scripts\python.exe manage.py test --settings=config.settings.test
```

Test settings use an in-memory SQLite database. For PostgreSQL-specific behavior, set `TEST_DATABASE_URL` to a dedicated test server and use `--settings=config.settings.test_postgres`. Django creates and destroys a separate test database; the database user needs permission to create it.

From `frontend`:

```powershell
npm run lint
npm run build
```

## Deployment

The repository includes a [Vercel + Render + Neon testing deployment guide](free-testing-deployment.md), a backend build script, and Vercel SPA rewrites. Deployment status, automatic deployment rules, and capacity depend on the configured hosting projects.

Select `config.settings.production` for the backend, configure private database and secret values plus allowed frontend origins, and set the frontend's `VITE_API_URL` before building. Production media uses database-backed storage. Review [Database production readiness](database-production-readiness.md) and [Event photos](event-photos.md) before deployment.

## Feature guides

- [Season lifecycle, access, and annual championship](seasons.md)
- [Student pass and leaderboard](student-pass-and-leaderboard.md)
- [Events and registration API](events-registration-api.md)
- [Admin console](admin-console.md)
- [Attendance usability](admin-attendance-usability.md)
- [Ticket QR validation](ticket-qr-validation.md)
- [Tournament brackets](tournament-brackets.md)
- [Event photos](event-photos.md)
- [Performance improvements](performance-improvements.md)

Some older documents describe earlier designs. Check current source and feature-specific guides when details differ.
