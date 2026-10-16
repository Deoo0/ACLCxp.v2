<div align="center">

```text
 █████╗   ██████╗ ██╗       ██████╗ ██╗  ██╗ ██████╗
██╔══██╗ ██╔════╝ ██║      ██╔════╝ ╚██╗██╔╝ ██╔══██╗
███████║ ██║      ██║      ██║       ╚███╔╝  ██████╔╝
██╔══██║ ██║      ██║      ██║       ██╔██╗  ██╔═══╝
██║  ██║ ╚██████╗ ███████╗ ╚██████╗ ██╔╝ ██╗ ██║
╚═╝  ╚═╝  ╚═════╝ ╚══════╝  ╚═════╝ ╚═╝  ╚═╝ ╚═╝
```

### ACLC College of Tacloban · Event Management System

**Event registration. QR attendance. House competitions. One platform.**

[![Django](https://img.shields.io/badge/Django-6.0.1-092E20?style=for-the-badge&logo=django&logoColor=white)](backend/requirements.txt)
[![React](https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react&logoColor=white)](frontend/package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](frontend/package.json)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](backend/config/settings/base.py)

[Getting Started](#local-setup) · [Features](#features) · [API Guide](docs/events-registration-api.md) · [Report a Bug](https://github.com/Deoo0/ACLCxp.v2/issues) · [Request a Feature](https://github.com/Deoo0/ACLCxp.v2/issues/new)

</div>

---

## What is ACLCxp?

ACLCxp (ACLC Experience) is a campus event management and house competition platform developed for ACLC College of Tacloban. It brings event registration, QR attendance, student access verification, competition results, and championship standings into one system.

---

## The problem we're solving

| Operational challenge | ACLCxp approach |
| --- | --- |
| Attendance recorded on separate paper lists | QR passes and centralized attendance records |
| Event information and participant lists scattered across tools | Event pages, registration, and participant management |
| House scores calculated and reconciled manually | Recorded results, point transactions, and championship standings |
| Participation history difficult to retrieve | Student merit sheets and attendance reports |
| Access needs to be verified for each competition season | Roster eligibility checks and season-specific tickets |

---

## 🏠 The five houses

Five houses compete across campus events. Administrators can manage their details and logos. These colors match the initial seed data.

| CAHEL | GIALLIO | VIERRDY | ROXXO | AZUL |
| :---: | :---: | :---: | :---: | :---: |
| Orange | Yellow | Green | Red | Blue |
| `#DB5609` | `#FEF74E` | `#008330` | `#E20F16` | `#0884FE` |

Approved points from seasons linked to the same academic year contribute to championship standings. See the [season guide](docs/seasons.md) for scoring scope and lifecycle rules.

---

<a id="features"></a>

## 🚀 Features

### QR attendance

Student QR passes support identity confirmation and attendance recording. Staff can record daily and event attendance, while administrators can review attendance reports.

### Event management

Manage events with registration, capacity limits, visibility controls, teams, and uploaded artwork. Students can browse available events and register where required.

### Competitions and standings

Manage matchups, tournament brackets, results, and point corrections. House standings and student merit records reflect approved points, including combined championship totals for seasons linked to the same academic year.

### Seasons and student access

Manage draft, registration, active, and closed seasons. Eligible students redeem season-specific tickets to access the workspace using their existing accounts. Closed seasons can be exported for archival reporting.

### Administrator tools

Manage users, student rosters, houses, tickets, portal settings, and leaderboard visibility. Dashboards, audit logs, and import/export tools support daily operations and reporting.

---

## 🛠️ Tech stack

| Layer | Repository dependencies |
| --- | --- |
| Backend | Django 6.0.1, Django REST Framework 3.16.1, SimpleJWT |
| Frontend | React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4 |
| Routing and data | React Router 7, TanStack Query 5, Axios |
| Database | PostgreSQL for normal development/deployment; isolated SQLite tests |
| Media | Local uploads in development; database-backed storage in production |

The backend deployment pins Python 3.13. Use Node.js 22.12+ for the frontend.

## Repository structure

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

Sign in to the frontend with the superuser account. Use **Admin → Seasons** to create a season, open registration, populate the eligible student roster, and generate/distribute season tickets. Start the season to unlock dashboards for students with verified season access.

Students require an eligible roster entry and a valid redeemed ticket for the current season. The registration stage permits restricted ticket-redemption access; draft and closed seasons lock student access. Staff and administrators can still sign in. See [Season administration](docs/seasons.md) for the full workflow.

## User roles

| Role | Frontend access |
| --- | --- |
| Student | Season-gated dashboard, events, QR pass, profile, statistics, and merit sheet |
| Staff | Attendance workspace |
| Organizer | Attendance workspace |
| Administrator | Admin console and attendance workspace |

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

## 🚢 Deployment

The included [testing deployment guide](docs/free-testing-deployment.md) uses the following architecture:

| Component | Deployment target |
| --- | --- |
| React frontend | Vercel |
| Django API | Render |
| PostgreSQL database | Neon |
| Uploaded media | Database-backed storage through Django |

The repository provides `backend/render_build.py` for the backend build and `frontend/vercel.json` for client-side routing. Hosting targets describe the documented setup; automatic deployments and backups depend on the hosting project configuration.

Select `config.settings.production` for the backend, configure private database and secret values plus allowed frontend origins, and set the frontend's `VITE_API_URL` before building. Production media uses database-backed storage. Review [Database production readiness](docs/database-production-readiness.md) and [Event photos](docs/event-photos.md) before deployment.

## Documentation

- [Understanding the whole system: architecture, workflows, and learning path](docs/SYSTEM_OVERVIEW.md)
- [Season lifecycle, access, and annual championship](docs/seasons.md)
- [Student pass and leaderboard](docs/student-pass-and-leaderboard.md)
- [Events and registration API](docs/events-registration-api.md)
- [Admin console](docs/admin-console.md)
- [Attendance usability](docs/admin-attendance-usability.md)
- [Ticket QR validation](docs/ticket-qr-validation.md)
- [Tournament brackets](docs/tournament-brackets.md)
- [Event photos](docs/event-photos.md)
- [Performance improvements](docs/performance-improvements.md)

Feature-specific guides describe the operational workflows in more detail. Some older design documents may differ from the current implementation.

## Contributing

1. Open an issue describing the bug or proposed improvement.
2. Create a branch for your change.
3. Keep the implementation focused and update any affected documentation.
4. Run the relevant backend checks or frontend lint/build commands listed above.
5. Open a pull request explaining the change and how you verified it.

---

<div align="center">

**Built for campus events · Powered by Django and React**

CAHEL &nbsp;|&nbsp; GIALLIO &nbsp;|&nbsp; VIERRDY &nbsp;|&nbsp; ROXXO &nbsp;|&nbsp; AZUL

*ACLC College of Tacloban*

</div>
