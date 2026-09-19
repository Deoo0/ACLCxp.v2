# Connected admin console

The admin console and student portal use the same Django API. Automatic MSW startup has been removed; an unavailable backend produces a visible error rather than fabricated data. The interface uses the student theme: neutral backgrounds, amber accents, house colors, rounded panels, responsive navigation, and animated accessible dialogs.

## Feature map

| Admin area | Implemented behavior | Student connection |
| --- | --- | --- |
| Overview | Actual students, events, registrations, attendance, points, standings and recent audit activity | Same ledger and registration records |
| Students & access | Search/pagination, identity and academic edits, house assignment/removal, roles, enabled state, password reset | Profile and access updates; password resets revoke existing JWT sessions |
| Student roster | Create/edit unused identities, CSV template and atomic import of up to 5,000 rows, delete unused records | Existing verified activation flow consumes these identities |
| Activation tickets | Generate/download up to 500 per batch, search, disable/enable unused tickets | Existing ticket verification and redemption flow |
| Events | Categories, draft creation, scheduling, audiences, capacity, registration windows, waitlist, publish/start/complete/cancel and registration roster | Eligible events, register/cancel/waitlist, own registration history |
| Houses | Create/edit, appearance, active state, actual members and ledger totals | Student profiles and standings |
| Attendance | Expiring signed QR pass or manual student number, confirmed registration requirement, duplicate protection, void/restore with reason, CSV export | Attendance history, participation merit, dashboard and house standings |
| Points & results | Idempotent manual awards/deductions, reversals, individual/team/house results, placement correction | Personal merit and aggregate house points |
| Portal settings | Announcement, support email, milestone size and registration switch | Shared safe settings; registration switch enforced server-side |
| Audit trail | Searchable paginated write outcomes | Records actor, route and response status without passwords, tokens or request bodies |

Admin mutations invalidate cached views. Other active sessions refresh on focus and every 30 seconds. This is polling, not a WebSocket notification service. No email delivery or student notification inbox is implemented here. Existing staff/organizer roles retain their API rules; this console requires ADMIN. Team results represent a named team credited to a house, not a team membership-management system.

## API and integrity

- Admin routes live under `/api/admin/`: `dashboard`, `users`, `roster`, `tickets`, `houses`, `attendance`, `points`, `results`, `settings`, and `audit`.
- Student routes live under `/api/portal/`: `summary`, `merit`, `attendance`, and `event-pass`. Event routes are documented separately.
- Lists use `{status, count, next, previous, data}` with bounded pagination and server search. Student ledger/history queries are scoped to the authenticated user.
- Attendance and result writes lock the event first. Points use unique source keys, and manual awards require a UUID idempotency key. Corrections preserve ledger history.
- Individual results require valid attendance and are unique per event/student. Placements 1–3 use the event's configured award values. A house assignment change does not transfer past points: each award keeps its original house.
- Participation reversals must go through attendance correction. Attendance corrections affect participation points only; judge-awarded results are corrected separately in Points & results.
- QR passes expire after five minutes and are returned with `Cache-Control: no-store`. A pass is an attendance credential; it does not bypass confirmed registration or event eligibility.
- Session refresh rotates and blacklists tokens. Password reset invalidates prior access and refresh tokens. Enabling password-revocation checks also requires existing pre-deployment sessions to sign in again.
- Audit entries summarize operations and outcomes, not field-by-field snapshots. Keep database backups for recovery.

## Configuration and deployment

No configured application database was migrated during this implementation. Browser checks used a separate temporary SQLite database with synthetic accounts.

1. Back up the database, restore a PostgreSQL staging copy, and inspect `manage.py migrate --plan`. Pending AI-removal migrations delete AI records. Event constraints validate existing counters/times before applying; duplicate individual event results must be resolved before the new unique constraint can be installed.
2. Install `backend/requirements.txt` (includes `qrcode==8.2`). Run migrations in staging, including `analytics/0002` for portal settings and `results/0002` for ledger source keys, house recipients and individual result uniqueness.
3. Set `DJANGO_SETTINGS_MODULE=config.settings.production`, a strong private `SECRET_KEY`, `DATABASE_URL`, explicit `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`. Review the production settings for proxy handling and HTTPS. Set `TRUST_PROXY_SSL_HEADER=true` only behind a trusted proxy that removes incoming forwarded headers.
4. Run `collectstatic` and `check --deploy` under the actual deployment configuration. Serve the API behind HTTPS with an application server. Configure durable backups, monitoring, shared throttling cache and appropriate database connections for the chosen worker count.
5. Build the frontend with `VITE_API_URL` set to the API origin (no `/api` suffix), or leave it empty for a same-origin reverse proxy. Configure SPA route fallback. Camera scanning requires HTTPS or localhost.
6. Event date/time fields currently use UTC, explicitly labeled in the admin editor. Registration timestamps are entered in the browser's local timezone and sent with UTC offsets. Review the school's scheduling convention before entering real events.

## Verification

From `backend`:

```powershell
./venv/Scripts/python.exe manage.py test apps.analytics.tests apps.users.tests apps.events.tests apps.authentication.tests --settings=config.settings.test --noinput
./venv/Scripts/python.exe manage.py makemigrations --check --dry-run --settings=config.settings.test
```

For PostgreSQL concurrency coverage, set `TEST_DATABASE_URL` to a dedicated non-production test server and replace the settings module with `config.settings.test_postgres`. Django creates and destroys its test database. Never use production credentials.

From `frontend`:

```powershell
npm run build
npm run lint
```

The frontend was checked with TypeScript, a production Vite build and targeted lint for changed console/student components. Browser checks covered desktop/mobile layouts, admin manual check-in, the connected student totals/leaderboard, and the scannable pass dialog. Physical camera scanning, PostgreSQL concurrency and a 5,000-student load test still require the deployment environment. Capacity is not certified by the SQLite tests.
