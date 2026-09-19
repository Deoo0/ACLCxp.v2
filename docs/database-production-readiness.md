# Database readiness for 5,000 students

Reviewed repository models, migrations, API views and settings. No live database, data quality audit, query plans or infrastructure measurements were inspected. Recommendations below are proposed work, not implemented hardening or a capacity guarantee.

## Scope and capacity

A single well-configured PostgreSQL database is a reasonable starting architecture for 5,000 enrolled students. Enrollment is not simultaneous usage. For an illustrative 100 events with every student attending, budget for up to 500,000 registrations and 500,000 attendance rows, plus points and scan logs. Retention across school years matters more than the users table size. Do not introduce sharding or partitioning without measurements.

## Launch priorities

1. **Protect access.** REST_FRAMEWORK defaults to AllowAny. users.views.list_user and update_user have no overriding permission; houses.views.add_house has its admin permission commented out. Require authentication, enforce staff/admin permissions for management and ownership for profile edits, and explicitly allow only intended public endpoints. Test anonymous access, student-to-student edits and privilege escalation. Global pagination does not paginate list(users) in list_user: use explicit pagination or a generic list view with a capped page size.
2. **Implement core write workflows.** Event, attendance and result views currently contain placeholders. Build and test these before treating the schema as a working production system. Registration must lock the event row inside transaction.atomic before checking capacity and updating counts. Retried scans must return the existing attendance without a second points award. Account activation already uses atomic transactions and ticket/roster row locks; retain that pattern.
3. **Make points auditable and idempotent.** PointsTransaction lacks a unique source/idempotency key. Link participation awards to attendance and performance awards to results, with uniqueness matching the recipient and award rule. Do not broadly make (event, user) unique on the entire ledger: legitimate bonuses and adjustments may coexist. Define whether an entry credits the student, the house, or both, and preserve the credited house at award time. Prefer explicit compensating reversal entries with a unique reversal relationship. Treat House.total_points and stored ranks as rebuildable summaries; update atomically and regularly reconcile with approved, effective ledger entries.
4. **Add database constraints.** Validate existing rows before adding CheckConstraint/UniqueConstraint migrations. Constrain event capacity and registration counters to nonnegative values and current_registered <= capacity; registration closing time must follow opening time. Define overnight events before changing start/end scheduling, ideally to timezone-aware starts_at/ends_at. Require positive result ranks and valid year levels; enforce ticket redeemed status, redeemed_by and redeemed_at consistency. Constrain choice values where corruption would matter. Negative ledger points remain valid for penalties and reversals.
5. **Define result ownership.** EventResult supports TEAM and HOUSE types but has only user and team_name, with no house/team foreign key or team membership table. Introduce structured recipients and suitable per-event/category uniqueness after deciding ties, rounds and team scoring rules. Avoid a global unique event/rank rule if ties are allowed.
6. **Preserve history across years.** Add an academic season/term referenced by events, tickets and standings, and season-specific student/house membership if students can move houses. Avoid resetting lifetime totals to start a new season. Decide retention and deletion policies: current event/user CASCADE relationships can remove registrations, attendance or results; archive records or use appropriate PROTECT/SET_NULL relationships with historical snapshots.

## Query and index work

- Audit actual PostgreSQL indexes before removal. Several fields combine db_index or FK/unique indexing with explicit Meta indexes (users email/student_id/role/house, event date/status, attendance event/user/scanned_by). Attendance also repeats the (event, user) unique index as a normal index. Preserve unique constraints and useful indexes; remove only verified redundant ones using migrations.
- Candidate indexes to benchmark: points_transactions (user, created_at DESC), (house, created_at DESC), potentially partial indexes for approved non-reversed rows; scan_logs (event, attempted_at DESC). Existing registrations (event, status), attendance (user, scanned_at DESC), and notifications (user, is_read, created_at DESC) are useful starting points.
- Use SQL aggregation for leaderboard totals, select_related/prefetch_related for related records, and bounded pagination. Measure with QuerySet.explain() and production query statistics before and after each index change.
- Cache shared leaderboard responses briefly (for example 15–30 seconds, a proposed freshness tradeoff). Invalidate after committed score changes. Do not use cache values to decide authorization, remaining capacity or whether points were awarded.

## Deployment and operations

- Fix settings layering before deployment: production.py currently only sets DEBUG=False and does not import base; settings/__init__.py imports development. Create a complete production settings module and point the deployment explicitly at it. Run Django check --deploy against those settings.
- Use private database networking, TLS as supported by the provider, least-privilege application credentials and separate schema-migration credentials. Tune database connection limits against actual app workers/threads; conn_max_age=600 is connection reuse, not a connection pool. Choose pooling compatible with the deployed driver and WSGI/ASGI mode.
- Configure shared caching for multi-worker throttling, and queue email/report generation outside request transactions. Review anonymous IP throttles for many students sharing campus Wi-Fi; maintain abuse protection without blocking everyone behind one NAT.
- Enable automated backups and point-in-time recovery; rehearse restoring to a separate database. Set explicit recovery objectives with the school. Monitor database CPU, disk, connections, slow queries, lock waits and failed writes.
- Set retention for scan logs, email delivery payloads, audit logs and expired tokens. Avoid retaining raw QR credentials in logs; store safe fingerprints where possible. Review reset-token generation/storage and use Django's token mechanisms or hashed, expiring one-time secrets.

## Acceptance testing before claiming capacity

Seed staging with 5,000 synthetic students plus representative event/history volumes (e.g. 500,000 registrations and attendance rows). Ramp through 50, 100 and 250 active clients, then test the actual expected peak. If 5,000 simultaneous sessions are required, that is a separate explicit target and must be tested. Include login bursts, registration for the last available slot, simultaneous scanners for the same student, leaderboard refreshes, reports and reversal retries.

Proposed initial acceptance criteria: zero overbooking, duplicate attendance or double points; ordinary API p95 under 500 ms and scan p95 under 1 second at the agreed load; no sustained connection saturation; successful restore drill. These are targets, not measured results. SQLite cannot validate PostgreSQL row-lock concurrency.

## AI removal prepared in this change

- Removed AIRecommendation and AIChatMessage from runtime models and removed the unused /api/ai/ URL mount.
- Added apps/ai/migrations/0002_remove_ai_models.py to drop ai_recommendations and ai_chat_messages.
- Kept apps.ai installed and its historical initial migration intact, allowing existing databases to migrate correctly. This app is now migration-only.
- Validated Django system checks, AI model/migration consistency, initial-to-removal migration and the full fresh migration graph against isolated in-memory SQLite. No configured/live database was accessed or migrated.

Deployment sequence: inspect/export any AI records to retain, verify a backup, run the migration in a restored PostgreSQL staging copy, then review the production migrate --plan and apply through the normal deployment process. The migration deletes both tables and their contents. Reversing it recreates empty tables; deleted records require restoring a backup. Do not fake this migration or delete old migration files. Keep the migration-only app until every environment has advanced and a planned migration squash/retirement handles fresh installs.

## References

- Django database optimization: https://docs.djangoproject.com/en/6.0/topics/db/optimization/
- Django deployment checklist: https://docs.djangoproject.com/en/6.0/howto/deployment/checklist/
- PostgreSQL point-in-time recovery: https://www.postgresql.org/docs/current/continuous-archiving.html
