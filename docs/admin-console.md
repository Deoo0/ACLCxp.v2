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

### Account filters and annual archives

Accounts support combined `role`, `house` (numeric ID or `unassigned`), `program`, `year_level`, `is_active`, and `search` parameters. Role cards show overall counts and toggle the role filter. Filter options come from `/api/admin/users/filter-options/`, across all records rather than the current page.

Events and admin attendance reports accept `archive=active|archived|all` (default `active`) and `year` (calendar year of the event). Attendance also accepts `event`, `house`, `program`, `year_level`, `is_valid`, and `search`. Its CSV export uses exactly the same filters across all pages. Academic and house filters describe current student profiles, not historical snapshots.

Admins can `POST {"archived": true}` or `{"archived": false}` to `/api/events/{id}/archive/`. Only completed/cancelled events may be archived; restoration does not reopen the event or change its status. `POST {"year": 2025}` to `/api/events/archive-year/` archives closed events in that year and reports `archived` and `kept_active` counts. Draft/published/ongoing events stay current. Repeated archive requests are safe.

Archive is an organizational view: attendance, registrations, results, student history, and lifetime points remain intact. It does not reset leaderboards or remove old accounts. Students keep their personal history; archived events leave the default event browsing list. Use **Archived events** or **All records** in admin Events/Attendance to retrieve or export past records. Archive and restore writes are audited.

Apply migration `events/0003_event_archived_at.py` before deploying these screens. Existing events start unarchived. No existing events are automatically archived by the migration.

- Admins can permanently delete unused student accounts and houses through their row's Delete action and confirmation dialog (`DELETE /api/admin/users/{id}/` or `/api/admin/houses/{id}/`). Student deletion is blocked for self/non-student/superuser accounts and accounts with registrations, attendance, scan logs, points, results, or organized events. A linked roster identity stays ineligible and redeemed tickets remain redeemed. Disable accounts with history instead.
- House deletion requires no assigned accounts (including disabled users), points, results, standings snapshots, or event audience references. Reassign students or clear their House field first; deactivate houses with historical records. Deletion checks and mutations are transactional, and event audience writes lock their referenced houses to coordinate with deletion.

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


## QA improvements: text, tickets, and action controls

Text limits are configured in `backend/apps/core/text_limits.py`. Change
`TEXT_LIMITS` to adjust long-text fields: event description 3,000, requirements
1,500, rules 3,000, prizes 1,000, category description 500, house description 1,000,
and profile bio 500 characters. Other editable model TextFields default to 2,000
via `DEFAULT_TEXT_LIMIT`. Existing longer values are preserved; an edited value
must fit the limit before saving. No truncation is performed.

Short text limits (event title/venue, names, program, etc.) come from each model's
`CharField(max_length=...)`. For example, event title and venue are defined in
`backend/apps/events/models.py` (200 characters each). After changing a model
field length, generate/apply its migration. Long-text API limit changes require
only a backend restart. `/api/admin/field-limits/` supplies current lengths to the
shared editor, including character counters and browser input limits, so there
is no second copy to maintain in the frontend. Action reasons remain limited to
1,000 characters in `backend/apps/analytics/console.py`.

Event and category URL-name inputs are removed. Identifiers remain internally
for compatibility, are generated on creation, and stay unchanged when renamed.

Under Accounts > Activation tickets:

- **Excel template** downloads an `.xlsx` workbook with a Tickets sheet and instructions.
- **Import Excel** accepts up to 5,000 rows / 5 MB using the `ticket_number` column.
  Numbers must be 6 or 12 digits. Keep cells as Text for leading zeros. QR tokens
  are generated automatically and downloaded with imported ticket numbers as CSV.
- Imports reject the entire workbook for invalid rows, formulas, duplicates,
  or ticket numbers already issued in any season.
- **Delete** removes an unused ticket after confirmation. Select checkboxes to
  **Delete selected**, up to 500 at once. Redeemed tickets remain protected; a
  redeemed, missing, or other-season ID rejects the entire batch.
- Routes: `GET /api/admin/tickets/template/`, multipart
  `POST /api/admin/tickets/import/` with `file`, `DELETE /api/admin/tickets/{id}/`,
  and `POST /api/admin/tickets/batch-delete/` with `{ "ids": [1, 2] }`.
  All require administrator access and respect existing season write rules.

Shared table actions stay visible while scrolling horizontally, wrap on desktop,
and stack on narrow screens. Edit/download buttons use blue, activation/import
uses green, primary saves use amber, and deletion/disable uses red, with text
labels and confirmation dialogs for destructive operations.
