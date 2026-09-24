# Season administration

Use **Admin → Seasons** for Intramurals, IT Days, ACLC Week, or any other sequential campus competition. Only one season can be current. Planned dates are informational: administrators explicitly change the stage.

## First setup

Deploy the backend and frontend together and run `python manage.py migrate` from `backend`. Migrations add the schema without deleting records. Student access fails closed until the school opens registration or starts a current season.

Create a season for the existing activities. When opening registration or starting it, confirm adoption of existing records and valid redeemed tickets. Existing students are enrolled only when their ticket belongs to their eligible roster entry. Accounts without a valid ticket must redeem one; an account or a membership row alone never grants access. Draft seasons do not unlock login or the student workspace.

## Normal workflow

1. Create a draft season with a unique name and optional dates.
2. Open registration after the preceding season is closed. Generate and distribute new tickets using Students & access. Existing students sign in with their existing account and redeem a current-season ticket. New students use the existing registration flow. Both require an eligible roster entry.
3. Start the season to unlock student dashboards. Only students with a valid redeemed current-season ticket linked to their own eligible roster entry can participate. Events, attendance, merit sheets, points, matchups, results, and tickets show the current season; previous activity does not contribute to new totals.
4. Finalize results and corrections, then close the season. Closing is permanent and locks student access and operational writes, including requests from existing sessions. It does not delete anything.
5. Download the closed season's ZIP. It contains JSON, CSV reports, available uploaded event artwork, and a manifest. Student account, house, category, and settings snapshots provide reference context. Passwords and authentication tokens are excluded. External image URLs remain references.
6. Check and safely store the ZIP. Optionally choose Purge records, type the exact season name, and confirm that the export was saved. The server checks that the export still matches the records and artwork before allowing deletion. Missing artwork blocks purge. Re-download after any changes or page reload.
7. Open the next season. Purging the previous season is optional; the new season starts with empty activity either way.

## What remains after purge

Student accounts, roster eligibility, house assignments, houses and logos, categories, portal settings, and the season's lifecycle record remain. Students need a new ticket each season, rather than another account. Season-specific events, registrations, matchups, results, attendance, points, tickets, memberships, notifications, and logs are removed. Event artwork not shared with another season is removed after the database transaction commits.

The export is a reporting archive, not a complete database backup, and there is no automatic import/restore feature. Keep a separate database and media backup when full recovery is required. Configure persistent media storage in production so uploaded event artwork remains available for export.

API writes and lifecycle transitions serialize using season row locks on PostgreSQL. SQLite tests cover behavior, but cannot verify PostgreSQL row-lock concurrency.

## Authentication and ticket enforcement

Run `python manage.py migrate` when deploying this update. The compatibility migration
links existing ticketless memberships only to verified, eligible, same-season redeemed
tickets belonging to that student. It does not enroll ticketless accounts or reuse old-season tickets.

- No current season, Draft, or Closed: student login and refresh are rejected; existing sessions cannot read or mutate protected student data. Staff and administrators can still sign in.
- Registration: students may authenticate only to the restricted enrollment screen and redeem a ticket. Dashboards, QR passes, events, profile changes, and attendance remain locked.
- Active: the workspace unlocks only for a valid current-season membership whose ticket is redeemed, belongs to that season, and belongs to the same eligible student. Students without it see the ticket-redemption screen.
- Ticket status, ownership, eligibility, and season membership are checked server-side on protected requests, not just at login. Disabled, unredeemed, missing, transferred, and previous-season tickets cannot grant workspace access. A valid replacement ticket can repair a legacy or invalid membership.
- The frontend handles access-denied responses by locking the workspace and refreshing season access; season login errors are displayed accurately instead of being reported as a disabled account.
