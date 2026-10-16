# Ticket-free events and account activation

An account is permanent. A current-season redeemed ticket is required only for
events with `ticket_required=true`. Existing events retain that default.
Registration reservations remain a separate setting (`registration_required`).

## Activate without buying a ticket

1. Import or create the official student roster under Admin → Users → Student roster.
2. Verify the student's school ID against the roster, then choose **Issue activation code**.
3. Give the code only to that student. Codes expire after 24 hours. Issuing a new
   code or editing the roster record invalidates the previous code.
4. The student opens Activate account → **Activate without a ticket**, enters the
   student number and code, then chooses their Gmail address and password.

The student number alone cannot activate an account. Codes are bound to one
eligible roster record. Activation links that record to one account and cannot
be replayed. Code issuance is admin-only and audited without storing the code
in the audit log. This implements staff identity verification; no email OTP
delivery service is required or implemented.

The original ticket activation flow remains available. Existing accounts can
redeem a current-season ticket from the season access screen or the ticket
activation panel above their student workspace.

## IT/CS Days

Use an open current season. For each day's activity, choose:

- Ticket required: off.
- Require registration to attend: off.
- Attendance recording: Daily approval.
- Audience: Selected programs, using the school's IT and CS program codes.

Publish the activities and start the season. Eligible roster-linked students
can access their workspace and persistent QR pass without purchasing a ticket.
Staff use Daily approval to scan once for that day's eligible activities.
Ticketed activities in the same batch are skipped if the student lacks a ticket;
their ticket-free attendance can still be recorded. Points are awarded once per
activity, and repeated scans do not duplicate attendance or points.

This uses one event per day/activity; it does not introduce a single week-long
event with multiple daily attendance records. Open attendance does not create
reservations or automatically classify every eligible non-attendee as absent.

Ticket requirements cannot change after active reservations or check-ins exist.
Program, house, year-level, season, roster eligibility, and account checks remain
enforced. Paid events still require a valid current-season redeemed ticket.

## Deployment

Apply `events/0010_event_ticket_required` through the normal migration process
before running the updated application. Review the full migration plan for other
pending changes first. No application database was migrated during implementation.

Run backend tests with `--settings=config.settings.test` to use isolated SQLite.
PostgreSQL concurrency checks require the dedicated test PostgreSQL configuration.
