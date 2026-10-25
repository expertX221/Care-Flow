# CareFlow

A fictional, multilingual hospital queue and wayfinding demo. Never enter real patient information. The app is not clinical software and its maps are not a verified hospital layout.

## Run

Use Node 22 or newer. Run `npm ci`, `npm test`, `npm run build`, and `npm start`. Development: `npm run dev`. Copy `.env.example` to `.env.local` and configure server-only `DATABASE_URL` and a private `STAFF_PIN` of at least eight characters. Production rejects the development fallback PIN; the browser has no local staff bypass.

## Patient, staff and board

First-time visitors on `/`, `/staff`, `/counter`, and `/board` connect to one default demo room. `DEFAULT_ROOM_ID` can select an existing UUIDv4 room; otherwise the server creates a stable default room once. An explicit room invitation or previously saved room continues to work. Existing private rooms are not merged or deleted. Use the default URL in a fresh browser for the shared hospital demo.

Staff must explicitly unlock the workspace on a fresh page load. Server-side cookies, expiry, PIN rate limits and action authorization protect queue changes. Sign out revokes the session. A single shared staff PIN remains a prototype limitation; named accounts and roles are not implemented.

Patient login requires the token and private slip code. Treat the QR/slip as a bearer credential. Public queue responses redact names, demographics, credentials, audit logs and feedback. Browser snapshots do not persist other patients' names or demographics.

Registration preserves initials and titles such as K Ravi and Dr Ravi, while ordinary names retain the first name. No phone number is collected. Gender remains not stated unless selected. Browser alerts work while the app is open and depend on browser permission/support; no SMS or locked-phone push service is connected.

## Queue policy and estimates

Assistance priority contributes a 30-minute waiting-age bonus. Waiting age is capped at 120 minutes; equal scores use arrival time. Thus a long-waiting standard visitor can precede a newly arrived assistance-priority visitor. This is an explainable fictional demo policy, not a clinical triage rule. Emergency requests ask staff to review; they never automatically assign clinical priority.

Only doctor breaks block calls; delayed doctors can continue serving. Consultations shorter than 30 seconds are excluded from estimation so demo clicking does not collapse waits. Patient estimates and forecast bands use the same EWMA/uncertainty function over the latest ten samples with explicit delay. These are indicative ranges, not guarantees.

Visible screens refresh every 1.5 seconds and pause polling while hidden. BroadcastChannel prompts same-browser refresh. This does not guarantee one-second delivery or background notifications. Staff Check-in includes explicit reset and automatic-demo controls; reset invalidates visit tokens in that room.

## Navigation and appointments

The dashboard and Find use the same graph-driven floor guide, including destination-specific routes and step-free options. The landing-page hospital illustration is decorative, not an interactive 3D building. Room labels determine destinations; token prefixes are identifiers, not room directions.

All eight departments accept fictional bookings in 30-minute slots from 09:00 to 13:30 Asia/Kolkata, ending before the stated 14:00 closing time. Four bookings per room/department/slot are protected by transactional locks. Booking lookup/cancel/reschedule requires a private code. Staff can list and complete bookings. Bookings and walk-in queues remain separate.

Optional reminder email requires `RESEND_API_KEY`, `REMINDER_FROM_EMAIL` and `CRON_SECRET`, plus patient consent. Failed messages no longer stop the remainder of a reminder run. Email verification and production-grade anti-abuse controls remain future work. Do not enable this for unverified public addresses or real patients. Browser and calendar reminders do not imply email delivery.

## Security and verification

Mutations check same-origin browser requests. Public registrations, bookings, room creation and review requests have database-backed limits; authentication attempts have separate limits. These are demo protections, not a comprehensive abuse-prevention system. Only Vercel's forwarded client header is trusted on Vercel; other hosting needs an explicit trusted-proxy design.

`npm test` discovers every `tests/*.test.mjs` file. `npm run test:api` defaults to localhost; set `BASE_URL` and `CAREFLOW_TEST_STAFF_PIN` explicitly for a chosen test environment. It creates an isolated fictional room. Run `python -m unittest discover -s python -p "test_*.py"` for the legacy standalone estimator; the app does not use that Python estimator.

See `reports/final-audit.md` and `reports/final-database-checks.json` for this revision's evidence and limitations. Older test output is historical and not release sign-off.

## Deployment

Import expertX221/Care-Flow into Vercel as Next.js. Keep database and PIN secrets server-only. Build command: `npm run build`; no custom output directory or catch-all rewrite is needed. Review and test a preview before promoting to production. Do not commit `.env.local`, dependencies, generated builds, CLI credentials, or `.vercel`.
