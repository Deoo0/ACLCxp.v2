# Mobile validation with the real API

Validated September 24, 2026 using headless Microsoft Edge, the actual Django
application and a temporary PostgreSQL database. Data was synthetic; API responses,
authentication and database writes were real. No network responses were intercepted
and no tokens were injected into the browser.

## Results

- Student pages: dashboard, events, merit sheet, stats and profile.
- Admin pages: overview, events, users, attendance and portal settings.
- All ten pages passed document-width overflow checks at 320, 375, 390, 430, 768
  and 1440 CSS pixels, with no displayed error alerts.
- Student and administrator signed in through the normal login form.
- API-generated QR images loaded and stayed square at all six widths.
- Event registration survived a reload; cancellation then succeeded.
- Student contact edits and administrator event venue edits survived reloads.
- Mobile admin navigation opened, navigated and closed successfully.
- 372 real API responses, no HTTP failures and no uncaught browser errors.
- TypeScript and production build passed. Vite still reports its existing
  large-chunk warning. Focused ESLint check of the changed panel component passed.

The populated dashboard exposed a 7px horizontal overflow at 320px. Adding
`min-w-0` to the shared Panel component allows its grid cells to shrink to the
available width. The complete live suite passed after that correction.

## Repeating the check

1. From `backend`, run `venv/Scripts/python.exe scripts/mobile_qa_server.py`.
   The configured PostgreSQL user needs permission to create a database. The
   script creates a unique `mobile_qa_*` database, applies migrations, seeds
   synthetic records and serves Django at `http://127.0.0.1:8001`.
2. In a separate terminal, start the frontend with `VITE_API_URL` set to
   `http://127.0.0.1:8001` and Vite arguments
   `--host 127.0.0.1 --port 5174 --strictPort`.
3. Set `QA_MANIFEST` to the temporary JSON path printed by the backend. Run
   `node frontend/scripts/mobile-live-check.cjs` from the project root.
   Set `PLAYWRIGHT_MODULE` to a local Playwright installation if it is not
   resolvable normally. The script uses the installed Microsoft Edge browser.
4. Create an empty file next to the manifest with the same name and a `.stop`
   extension. The backend drops its temporary database and removes the manifest
   and stop file. It also stops automatically after 20 minutes. Stop Vite afterward.

The manifest contains generated test credentials: do not commit or share it.
Use a fresh test database for each full run. The configured application database
is not modified by this harness.

## Remaining limits

This verifies the browser/API/database integration against controlled data, not
production data or a deployed service. It does not verify physical camera scanning,
hardware keyboards, mobile browser safe areas, screen-reader output, full WCAG
conformance, or PostgreSQL concurrency under load. QR image loading is not a
camera check-in test. Headless Edge does not substitute for iOS Safari testing.
