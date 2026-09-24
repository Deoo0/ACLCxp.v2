# Season access regression validation

## Defect and behavior

Draft seasons are not selected as current until registration opens or the season
starts. Previously, the absence of a current season bypassed middleware checks and
returned `can_access: true`. Login and refresh also lacked lifecycle checks, and
membership existence alone granted access regardless of ticket validity.

Student login and refresh now fail when no current season exists or it is Draft
or Closed. Existing sessions cannot use protected APIs. Registration permits a
restricted enrollment session only, so returning students can redeem their new
season ticket. Active-season participation requires a membership linked to a
redeemed ticket for the same season and the same eligible student roster record.
Staff and administrator login remain available.

First-season adoption no longer grants blanket student access. A data migration
links legacy memberships only when ownership, season, redemption and roster
eligibility can all be verified. Apply migrations with the backend deployment.

## Verification

- SQLite: 116 tests passed, with two PostgreSQL-only concurrency tests skipped.
- PostgreSQL: 78 targeted authentication, season, event, attendance, user and
  result tests passed, including both concurrency tests. A unique temporary
  database was created and destroyed for the run.
- Real browser + Django + isolated PostgreSQL: Draft login rejected with no
  browser tokens stored; Registration rendered only the season gate and denied
  direct summary/QR API calls; Active with a valid ticket unlocked the dashboard;
  Closed denied existing access, refresh and new login, and removed the mounted
  student workspace through the access refresh.
- TypeScript, focused frontend lint and production build passed. Vite's existing
  large-chunk warning remains.
- A broader PostgreSQL run encountered three image-upload test errors
  (`connection already closed`). These were not addressed by this change.
  The temporary database left by that run was removed explicitly.

New regressions live in `backend/apps/seasons/test_access.py`. They cover absent
and Draft seasons, closed sessions, registration-only access, valid enrollment,
missing/disabled/unredeemed/wrong-owner/old-season tickets, roster eligibility,
replacement redemption, staff access, cross-season activation receipts, legacy
ticket linking and first-season adoption without a ticket.

For the real-browser lifecycle check, start
`backend/scripts/mobile_qa_server.py --draft`, follow the isolated frontend setup
in `mobile-live-validation.md`, then run `frontend/scripts/season-live-check.cjs`
with `QA_MANIFEST` and `PLAYWRIGHT_MODULE` configured as described there. No API
responses are mocked and both accounts sign in through the regular login form.
