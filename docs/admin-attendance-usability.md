# Admin attendance workspace

Attendance is available directly from the admin header on desktop and mobile,
and near the top of the sidebar. `/admin/attendance` opens daily approval.

The workspace separates three tasks:

- **Daily approval** (`?view=daily`): choose the Philippine attendance date,
  scan a live/downloaded pass or find a student by number, verify identity,
  and approve eligible daily events. Event coverage is expandable. Results
  show approved, existing, and skipped events, with a next-student scan action.
- **Event check-in** (`?view=event`): search/paginate ongoing events that use
  individual check-in, choose one, then find and verify a student. Status,
  participation points, and reservation requirements are displayed. Events
  that become unavailable disable check-in and explain the next step.
- **Records** (`?view=records`): search attendance, optionally filter by event,
  archive/year, house, program, year level, or status, and export every matching
  row to CSV. Phones display record cards; larger screens retain the table.
  Record details lead to void/restore corrections with a required reason.
  Displayed check-in times use Philippine time.

Identity verification is now a keyboard-accessible, focus-trapped dialog with
name, student number, house, and the date/event being approved. Cancel receives
initial focus to avoid accidentally recording attendance. Escape cancels.
Preview requests disable competing actions and date/event changes while running.
The existing signed confirmation receipt and attendance permission/eligibility
checks remain required. Scanning and saving still require internet.

The event list supports the validated `attendance_mode` query parameter
(`PER_EVENT`, `DAILY`, or `NONE`). Pagination replaces the previous 100-event
selection limit. Reports retain all modes and statuses unless filtered.

Workflow navigation uses normal links and preserves browser Back/Forward and
direct URLs. This workspace opts out of query-string route animations so a fast
workflow switch cannot remount a newly edited form after an exit animation.

Validation: 136 backend tests ran successfully (two database-specific skips),
TypeScript, focused ESLint, and production build passed. The Edge synthetic-API
check covers 320/375/768/1440px layouts, shortcuts, workflows, preview busy guards,
keyboard/cancel/confirm behavior, daily/event writes, unavailable events, event
pagination, filtered CSV export, and corrections. Existing QR-card download and
scanner-loading checks also pass. Physical cameras and screen-reader output were
not tested. No migration or new dependency is required.

To repeat UI checks, start Vite on port 5174 and run
`node scripts/admin-attendance-ui-check.cjs` from `frontend`. Set
`PLAYWRIGHT_MODULE` when Playwright is provided outside the project.
