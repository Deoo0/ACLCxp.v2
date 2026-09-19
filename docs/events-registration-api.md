# Permissions, events and registration API

Implemented backend workflow connected to the admin event console and student event pages. Attendance, merit points, results, and house standings now share the live API. See [Admin console and deployment](admin-console.md) for the complete feature map and remaining deployment checks.

## Access rules

- Default API permission is authenticated. Login, token refresh, ticket activation, health checks, house browsing, and eligible public event/category reads explicitly remain public.
- A school admin is an active user with role ADMIN or is_superuser. is_staff alone does not grant school administration permissions.
- GET /api/users/list/ is admin-only and paginated. PATCH /api/users/{id}/ permits admins to manage users and other authenticated users to edit only their own phone_number, contact_person, contact_number, bio and profile_photo. Identity, academic placement, house, role, email and password changes through this endpoint require an administrator. A student password-change endpoint with current-password verification is not part of this change.
- Admin password edits use Django password validation and set_password; passwords are write-only. Changing email clears verification. Profile changes and house counters run in a transaction with the target user row locked.
- House creation and the diagnostic echo endpoint are admin-only. Public house browsing is preserved.
- Event organizers manage only events they own. Admins manage all events. Clients cannot assign the organizer or edit counters/timestamps. Category writes are admin-only.

## Endpoints

All paths have trailing slashes. Protected requests use Authorization: Bearer <access_token>.

| Method | Path | Behavior |
| --- | --- | --- |
| GET, POST | /api/events/ | Browse visible events; create as admin/organizer |
| GET, PUT, PATCH, DELETE | /api/events/{id}/ | Read eligible event; owner/admin edits; delete unused drafts only |
| GET, POST | /api/events/categories/ | Read active categories; admin creates |
| GET, PUT, PATCH, DELETE | /api/events/categories/{id}/ | Read category; admin edits/deletes; referenced categories must be deactivated instead |
| POST | /api/events/{id}/register/ | Register signed-in student; empty JSON object body |
| POST | /api/events/{id}/cancel-registration/ | Cancel own registration; optional reason string |
| GET | /api/events/my-registrations/ | Own registrations including cancellations |
| GET | /api/events/{id}/registrations/ | Owner/admin registration roster |

Lists use {status, count, next, previous, data}. Default page_size is 20, capped at 100. Event listing accepts status and category (numeric ID). Detail/create/update return a serialized object. Registration actions return {status: "success", data: <registration>}. Errors use standard DRF detail/field errors. Unauthenticated writes return 401, forbidden roles/ownership 403, hidden/missing resources 404, validation errors 400, and state/capacity conflicts 409. A new registration or reactivation returns 201; an unchanged repeated registration returns 200.

## Example workflow

1. Admin creates a category:

```json
{"name": "Sports", "slug": "sports", "color_code": "#fbbf24"}
```

2. Organizer creates a draft using the returned category ID:

```json
{
  "title": "Campus chess",
  "slug": "campus-chess-2027",
  "description": "Inter-house chess tournament",
  "category": 1,
  "event_date": "2027-02-15",
  "start_time": "10:00:00",
  "end_time": "12:00:00",
  "venue": "Activity Hall",
  "capacity": 100,
  "status": "DRAFT",
  "visibility": "PUBLIC",
  "allow_waitlist": true
}
```

Use a future date and a real category ID. event_date/start_time/end_time are interpreted in Django TIME_ZONE (currently UTC); timestamp fields accept ISO 8601 with offsets. Overnight events are not supported by this same-day schema.

3. Organizer PATCHes {"status": "PUBLISHED"} to the event detail URL.
4. Student POSTs {} to register/. The response status is REGISTERED or WAITLISTED.
5. Student views my-registrations/ or POSTs {"reason": "Schedule conflict"} to cancel-registration/.
6. Organizer reads the event's registrations/ roster. To cancel the entire event, PATCH {"status": "CANCELLED"}; all active registrations are cancelled and history is retained.

## Business rules

- Allowed transitions: DRAFT -> PUBLISHED or CANCELLED; PUBLISHED -> ONGOING or CANCELLED; ONGOING -> COMPLETED. Finalized events cannot be edited or reopened. Moving to ONGOING/COMPLETED is an explicit organizer action, not an automatic scheduler.
- Only future PUBLISHED events accept registrations, within optional opening/closing timestamps. Cancellation is allowed before the event starts, even after registration closes. No waitlist promotion occurs outside the registration window.
- Each event/student pair has one database-unique registration. Retry registration/cancellation does not consume/release another slot. Re-registration after cancellation reuses the row and joins the back of the queue.
- Capacity and counter changes, cancellation, promotion and event edits lock the same event row within transaction.atomic. All future writers (including scanning, imports and admin tools) must follow this locking protocol. Avoid editing counters directly.
- Full events either return 409 or waitlist the student. Cancelling a confirmed seat or increasing capacity promotes eligible students ordered by registered_at then ID. Inactive/non-student/ineligible queued accounts are cancelled with a reason. waitlist_position is a queue-order marker that may contain gaps; it is not a continually renumbered live position.
- Restrictions are cumulative: allowed_programs uses program strings, allowed_houses uses integer House IDs, and allowed_year_levels uses positive integers. Empty/null lists mean unrestricted. PROGRAM/HOUSE visibility requires a corresponding nonempty list. Eligibility cannot change while active registrations exist. Existing legacy house-name JSON must be reviewed/mapped to IDs before use.
- PRIVATE events are visible only to the owner/admin and do not accept student registration; invitations are not implemented. Anonymous visitors see unrestricted PUBLIC events only. Signed-in users see eligible published lifecycle events. Drafts remain owner/admin-only.
- Published events cannot be hard-deleted. Unused drafts can be deleted; event history remains intact for cancellation and completion.

## Migration and testing

No configured database was migrated during implementation. events/0002 validates existing data before installing capacity/counter/time constraints. It stops with up to 20 event IDs if counters disagree with REGISTERED/ATTENDED/NO_SHOW rows, bounds are invalid, or times/windows are reversed. Review and repair those records explicitly; the migration does not silently overwrite data.

Back up and test migrations in a PostgreSQL staging copy first. Review the entire migrate --plan because the earlier AI-removal migration may also be pending and deletes AI records. Apply through the normal deployment process after reviewing the plan.

From the backend directory, run isolated API and regression tests:

```powershell
./venv/Scripts/python.exe manage.py test apps.analytics.tests apps.users.tests apps.events.tests apps.authentication.tests --settings=config.settings.test --noinput
./venv/Scripts/python.exe manage.py makemigrations --check --dry-run --settings=config.settings.test
```

SQLite tests do not access the configured application database. They use a development-only Python fallback for audience filtering; PostgreSQL uses JSON containment queries in SQL before pagination.

For PostgreSQL integration tests, supply TEST_DATABASE_URL pointing to a dedicated test PostgreSQL server and use --settings=config.settings.test_postgres. Django creates and destroys a separate test_<database> database; the test account must have permission to create it. Never supply production credentials. The same suite then runs simultaneous last-seat and duplicate-request tests instead of skipping them. PostgreSQL integration and 5,000-student load tests have not been run in this environment.

References: [DRF permissions](https://www.django-rest-framework.org/api-guide/permissions/) and [Django row locking](https://docs.djangoproject.com/en/6.0/ref/models/querysets/#select-for-update).
