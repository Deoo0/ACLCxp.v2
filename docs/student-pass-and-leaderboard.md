# Student passes and leaderboard visibility

Students can open **QR Code** in the mobile navigation or desktop QR control and
choose **Download QR card (PNG)**. The saved card includes their account name,
student number, house, and a high-contrast QR with a quiet border. Save it before
losing connectivity; it can then be presented from Photos/Files or printed.

The payload contains a signed account reference, a random per-account credential,
and credential version. It contains no name, student number, email, or house.
The existing one-to-one QRCode record ensures one credential per account. Unlike
the former five-minute live pass, downloaded passes do not expire by age. The
server checks signature, credential/version, active QR record, optional expiry,
and active student account. Administrators can revoke a lost pass by disabling
its QRCode record, changing its code_data credential, or incrementing its version.
There is no new self-service credential rotation screen. Signing-key rotation
also invalidates cards unless the previous key remains configured as a fallback.

Both manual entry and QR scanning now retrieve current account details first.
Authorized staff see name, student number, and house and must explicitly confirm
identity and attendance. Compare with the person and their school ID: cards can
be copied, and card text can be edited. Trust the server's identity preview.
The preview issues a signed, student-bound, five-minute confirmation receipt;
attendance APIs reject missing, mismatched, or expired receipts. Event eligibility,
season membership, ticket requirements, and duplicate prevention still apply.
Clients integrating with these APIs must call `POST /api/attendance/preview/`
with `token` or `student_id`, then include the returned `identity_proof` when
submitting attendance after the operator confirms identity.

Students need no connectivity to present a previously saved card. Staff scanners
still need the API to validate credentials, retrieve current details, and record
attendance/points. Offline scanning would require a separate trusted roster and
credential cache, revocation/expiry handling, secure storage, a local attendance
queue, and duplicate-safe synchronization. That work is not included here.

Administrators use **Portal settings → Reveal leaderboard houses → Edit** to
choose Hidden or Revealed. The persisted setting defaults to Revealed to preserve
existing behavior. Hidden mode returns only positional neutral IDs/labels, ranks,
and actual approved points. Names, logos, colors, descriptions, mottos, and member
counts are omitted from leaderboard responses. Equal scores share a rank. The
student dashboard and statistics page share this response and rendering; regular
refresh/polling applies visibility changes. The public house-selection endpoint
returns house choices without scores/ranks so it cannot expose another branded
score table. Admin standings remain identified for management. This is leaderboard
anonymity, not secrecy of house membership or published event results; previously
seen scores or results may let viewers infer identities.

Deploy the migration with `python manage.py migrate` before using the new setting.

Validation:

- 36 focused backend tests cover existing attendance behavior, unique credentials,
  tampering, long-lived validity, revocation, pass access, preview permissions,
  confirmation enforcement, setting permissions/persistence, and visibility.
- TypeScript, focused ESLint, and the production build pass (existing chunk-size
  warning remains).
- `frontend/scripts/student-pass-ui-check.cjs` runs synthetic API fixtures in Edge
  at 375px: PNG download/dimensions, decoding the downloaded QR with the existing
  scanner library, both leaderboard states, and attendance preview/cancel/confirm.
  Start Vite on port 5174; run with `PLAYWRIGHT_MODULE` pointing to Playwright if
  it is not locally installed. Optional `QA_CARD_OUTPUT` selects the output PNG.
  This does not verify physical cameras or iOS Safari download behavior.
