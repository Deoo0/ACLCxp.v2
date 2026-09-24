# Ticket QR scanning

## Re-download existing tickets

Administrators can use **Students & access → Activation tickets → Re-download
available tickets** to download `available-activation-tickets.csv`. The export
contains the original ticket numbers and QR tokens for all available tickets in
the current season, independently of table pagination or search. It excludes
disabled, redeemed, and previously assigned tickets, and never regenerates tokens.
Keep the file private and distribute each ticket only to its intended student.

The export requires administrator access and sends `Cache-Control: no-store`.
Missing seasons and empty exports return a helpful validation error. Three Django
tests verify access restrictions, season/status filtering, original values
(including leading zeroes), repeated exports, and empty/missing seasons. These
export tests use an isolated SQLite test database; the new download button has
not been browser-tested.

## Accepted QR contents

The registration scanner accepts two QR payloads:

- The exact printed 6- or 12-digit ticket number, including leading zeroes.
- The opaque token from a system-generated ticket QR.

For an external generator such as QRCode Monkey, choose **Text** and enter only
the ticket number. Do not choose URL or prefix the number with a label. Scanning
does not create a ticket: the number must already exist and be available in the
current season, with registration open or the season active.

Previously every decoded QR was submitted as `qr_token`, so a number-only QR
failed even when manual entry of that same number succeeded. The frontend now
recognizes number-only payloads and submits `ticket_number` without converting
the string to a number. Other payloads still use `qr_token`. All existing backend
season, ownership and redemption checks remain in place.

The camera is stopped before verification completes. If verification fails,
the scanner returns to the method chooser, keeping the server's error visible
and allowing another scan or manual entry. Server `detail` errors, including
closed registration, are now displayed instead of a generic failure.

## Validation

`frontend/scripts/ticket-qr-live-check.cjs` uses generated QR video frames as the
browser camera input, the actual html5-qrcode decoder, the actual registration
page and a real Django API backed by isolated PostgreSQL. API responses and
decoder callbacks are not mocked. The suite verified:

- 12-digit text with leading zeroes.
- 6-digit text with leading zeroes.
- Surrounding whitespace trimmed without altering the number.
- System-generated opaque QR tokens.
- Unknown tickets rejected, followed by successful camera retry and manual recovery.
- Already-redeemed tickets rejected, followed by successful retry and manual recovery.

All six scenarios, TypeScript, focused RegisterPage lint and the production build
passed. The existing Vite chunk-size warning remains. Physical-phone autofocus,
lighting, camera permissions and the user's particular QR artwork were not tested.

To repeat, follow the isolated server/Vite setup in `mobile-live-validation.md`,
then run this script with `QA_MANIFEST` pointing to the server's temporary file
and `PLAYWRIGHT_MODULE` pointing to a local Playwright installation when needed.
The backend Python environment must include the project's qrcode and Pillow
dependencies. Generated camera files are confined to a temporary directory and
removed after the run. Stop the QA server using its `.stop` file afterward.
