# Performance improvements

These changes were implemented and checked in this order.

## 1. Selective API refreshes

The shared QueryClient no longer polls every query. `queryPolicy.ts` assigns:

- 30-second polling for live summary/standings, admin dashboard, season access,
  attendance approval/reports, and competitions.
- 60-second polling for event lists/team showcase and the student's attendance overview.
- Five-minute freshness with no polling for settings, categories, field limits,
  and filter options.
- One-minute freshness with no polling for other resources. Focus/reconnect
  refetching remains available when data is stale, as do explicit refresh buttons.

Writes invalidate related query families and audit records, rather than every
cached resource. Filtered lists and details share resource-prefix matching.
Season transitions/redeeming/purging retain broad invalidation because changing
the season changes all operational scopes. Exporting a season refreshes only
seasons and audit records. Authentication still clears user-specific cache.

## 2. Deferred scanner loading

Registration and attendance import `html5-qrcode` only when their camera UI opens.
Cancellation during loading prevents a camera from starting after unmount.
Student/admin layouts are also lazy-loaded so public pages avoid their controls.

The build puts the scanner library into a separate approximately 375 KB chunk
(111 KB gzip). The shared feedback chunk is approximately 1.2 KB instead of the
previous 335 KB. The main chunk is approximately 585 KB (193 KB gzip), compared
with the earlier 643 KB (210 KB gzip). These are bundle-size measurements, not
measured production loading-time improvements. Vite's large-chunk warning remains.

## 3. Summary queries

The summary resolves the season once, reads settings once, and aggregates only
approved, unreversed points for eligible active students. Students without awards
still count as zero; negative scores, ties, reversals, and academic-year scope
retain their semantics. House totals reuse the same season scope. Admin dashboard
aggregates also reuse their resolved season.

An isolated summary-view fixture now executes 7 queries instead of 11. Authentication
and middleware queries are outside that measurement. Negative-score ranking needs
one additional query for students without effective awards. Partial indexes on
`(season, user)` and `(season, house)` support effective-point aggregation.

Scores, identity verification, season access, and leaderboard visibility are not
server-cached; database checks still use current records.

## 4. Responsive image delivery

Existing UUID media routes accept `?width=320`, `640`, or `1280`. Variants preserve
aspect ratio, never upscale, handle EXIF orientation, retain transparency as PNG,
and encode opaque images as optimized progressive JPEG. Original uploads remain
unchanged. Public event cards, competition backgrounds, posters, and team photos
use responsive source sets; external URLs, static assets, and student QR images
are unchanged.

Each worker caches up to 32 variants of at most 512 KB each for one hour. This is
a bounded process-local cache, not shared infrastructure. Cold variants still read
storage and require image processing. UUID URLs have immutable browser caching
and variant-specific ETags; conditional requests avoid reading storage. Upload
replacements already generate new UUID filenames. Keep filenames immutable.

Object storage/CDN migration was not performed: it needs the deployment provider,
account configuration, and a plan for existing uploads. These improvements work
with the existing durable database storage without moving data.

## Validation and deployment

- All 134 backend tests ran successfully, with two database-specific tests skipped
  under SQLite. New tests cover rank edge cases, query count, original media,
  resizing/transparency, cached reads, and conditional requests.
- TypeScript, focused ESLint, and the production build passed.
- Node checks verify polling policies, targeted invalidation, and image URL/source
  sets, including preserving external/static/inline URLs.
- Edge integration with synthetic API responses verifies deferred scanner loading,
  cancellation, QR-card download/decoding, leaderboard states, and attendance
  identity confirmation. These checks do not use physical cameras.
- The wider suite also caught previous QR-release regressions: house selection
  now retains its logo field without exposing scores/rank, and season-attendance
  tests use the required identity preview receipt.

Run `python manage.py migrate` when deploying to create the two points indexes.
No dependencies or new hosting services are required. Production database query
plans, PostgreSQL concurrency, and deployed mobile loading times still need to be
measured; SQLite tests and synthetic browser checks do not establish those results.

Repeat frontend policy checks with `node scripts/query-policy-check.mjs` and
`node scripts/image-variants-check.mjs` from `frontend`. With Vite on port 5174,
run `node scripts/scanner-loading-check.cjs` and `node scripts/student-pass-ui-check.cjs`.
Set `PLAYWRIGHT_MODULE` if Playwright is provided outside the project.
