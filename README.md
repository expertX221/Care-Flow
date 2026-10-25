# CareFlow

Government-hospital visitors can struggle to register, understand their queue, and find the room on their OPD slip. CareFlow demonstrates one connected journey using a fictional hospital and fictional visitors.

Built for patients, helpers, registration staff and waiting-room displays. The selected white/lavender, blue/coral interface uses an illustrated hospital plus a separate graph-driven floor plan.

## Run in VS Code

Use Node.js 22 or newer. Open this folder, run `npm ci`, then `npm run dev`, and open http://localhost:3000. For production: `npm run build` then `npm start`. Copy `.env.example` to `.env.local` and set a server-only Neon `DATABASE_URL` for connected queues. Without a working database, the browser demonstrates local state; shared staff actions need a connection. Never enter real patient information.

`STAFF_PIN` is **required for production** (minimum eight characters, never `2468`). A temporary `2468` fallback exists only when running the development server without a production environment. Real hospitals require individually authenticated staff, RBAC, retention policies, verified layouts, and audited access. This is a fictional demo, not clinical authentication.

## Screens

- Patient home: first-visit language choice, four main actions and a live token.
- Registration: five questions, retained Back answers, optional phone, department cards, help desk and assisted mode.
- Slip / My turn: QR, token, first name, department, room, doctor, queue estimate, read aloud, print and image download.
- Find: searchable three-floor SVG schematic, landmarks, Dijkstra routing, step-free toggle and lost-patient help card.
- Emergency: visible access before registration, emergency signs, route to Casualty, 112/108 links and a demo staff-review request.
- Settings: six languages, three text sizes, contrast, reduced motion, assisted mode, read aloud and browser alerts.
- `/staff`: PIN gate, eight queues, call/complete/no-show/end/transfer, doctor status/delay, occupancy and urgent flags.
- `/counter`: staff tools with assisted registration and printable slips.
- `/board`: now serving, next three tokens, doctor delays, spoken announcements and optional English/Hindi alternation.
- Demo controls: add 20 fictional visitors, automatic accelerated calls and reset this room.

Use **Connect another screen** to open the same room on patient, staff and board screens. Database transactions serialize changes; polling every 750 ms plus BroadcastChannel updates screens. Network latency means delivery within one second is a target, not a guarantee. Patient responses hide other visitors' names and private claim/session values; staff mutations require the room's staff cookie.

## Emergencies

Digital queues never determine clinical urgency or require a token for emergency care. Seek nearby qualified staff immediately. The prototype flags requests to another demo screen; it does not contact real hospital staff or dispatch emergency services. 112 is the national emergency number; ambulance service 108 is available in participating areas. Only qualified staff assess urgency.

## Design and estimates

Assisted mode increases text size, reads registration questions and defaults to step-free directions. Large controls, visible keyboard focus, icons with labels, language selection and landmark directions address different literacy and mobility needs. The map is a fictional schematic, not measured indoor positioning. Its graph supplies route distances; the decorative 3D image is not a navigable building model.

Displayed wait = people ahead × mean of the latest ten recorded consultations + configured doctor delay, rounded to five minutes and shown as “about”. Initial samples come from department data. Arrival aging reduces starvation of standard visits. The optional Python `/api/predict` example remains an EWMA demonstration and does not supply the primary displayed wait.

## Vercel from GitHub

1. Import `expertX221/Care-Flow`, select Next.js and repository root.
2. Install `npm ci`; build `npm run build`; leave Output Directory at framework default.
3. Set server-only `DATABASE_URL` and `STAFF_PIN` in the intended Preview/Production environments; production staff tools are unavailable without a strong `STAFF_PIN`.
4. Deploy and open the generated URL. Next.js owns `/staff`, `/counter`, `/board`, `/find`; no SPA catch-all rewrite is required, so direct page refresh works.
5. Never publish `.env.local`, CLI login files, `.vercel`, dependencies or generated builds.

The original Next.js/TypeScript/Neon stack was retained from the user's deployed project. This intentionally differs from the pasted checklist's alternative Vite/plain-JavaScript/no-backend starting recipe. Node API routes run with the app on Vercel; no separate Express server is required.

## Offline and device features

The service worker caches the loaded shell, assets and static chunks; local storage retains the last known slip and queue. Offline position is explicitly stale. Offline registration is held locally with an idempotency key and sent after reconnecting. Staff mutations require a confirmed connection. Install is offered only when the browser exposes its install prompt. Full offline reload requires a successful prior online load and cache completion.

Camera QR scanning uses BarcodeDetector when available. Speech recognition, language voices, vibration, sound, notifications and installation depend on browser/device support and permission. Simulated SMS is an on-screen demonstration; no SMS or push provider is connected.

## Verification

`npm test`: automated queue, language, forecast, reminder, security and graph checks. `python -m unittest discover -s python -p 'test_*.py'`: six estimator checks. `npx tsc --noEmit` checks TypeScript. `npm run test:api` creates an isolated fictional room and checks 18 API scenario groups against `BASE_URL` (defaults to production); use `CAREFLOW_TEST_STAFF_PIN` if configured. No test deletes unrelated data. See `reports/problem-statement-coverage.md` for coverage and remaining limits.

## Next steps

Native-speaker and clinical review; full WCAG audit and patient usability sessions; hospital-verified layouts; individual staff authentication; measured load/latency and rate limits; real notification integration. This is a prototype, not a clinical deployment.

## Device and accessibility hardening

Camera failures release active tracks and show a translated token-entry fallback. Microphone errors show translated text and recording stops on step change or dialog close. Notifications use service-worker delivery on supported mobile browsers, with an in-app fallback; Settings includes a test alert. Read-aloud controls report missing language voices. Dialogs isolate background controls, registration steps announce headings and progress, and the map exposes keyboard-accessible places. Primary text, secondary text and emergency controls pass an automated palette contrast check. These checks do not constitute a complete WCAG certification or physical-device verification. SMS remains an in-app simulation by user choice.

## Room codes, voice stop and illustrated floor trails

Rooms use consistent alphanumeric codes (A101, A106, E107 and M204) in slips, staff/board screens and map directions. Existing token IDs remain unchanged. Stop speaking cancels current and queued speech and is available in the footer and dialogs. Selecting a floor changes the animated illustration trail, moving marker and destination label; reduced-motion settings retain a static route. The illustration remains a schematic preview; precise graph directions are in Find a place.


The language picker appears on every fresh opening/reload, even when a previous language preference is saved. The hospital image uses a clean asset without the old baked-in first-floor trail; the selected-floor route is drawn separately.

## Patient entry flow

Every fresh load asks for language, then presents Register a new visit or Log in to my visit. No patient token, assigned room, floor or personal dashboard is displayed before confirmation. Registering issues the patient’s own token; existing visits open through a saved server session or the private QR/code on the slip. Private codes include the original demo-room identifier for returning from another device. Seeded demo patients remain in staff/public queues but are never automatically assigned to a visitor. This is visit access, not an email/password account system. Emergency guidance stays accessible before entry.

## Floor-plan layout fix (October 2026)

The first-floor schematic previously rendered the washroom at `(12, 28)` and A101 at `(15, 25)`, so their visible SVG hit boxes overlapped. The floor-plan renderer now uses separate, non-overlapping screen coordinates in `src/data/floor-plan.mjs`. It draws shared right-angled corridors rather than diagonal star connections, and highlights the selected route along the same corridors. Small screens can scroll the SVG horizontally instead of shrinking labels to unreadable sizes. The underlying hospital graph and shortest-path logic remain unchanged; the floor drawing is illustrative, not a measured indoor map. `tests/floor-plan.test.mjs` checks node spacing and all same-floor segment paths.


## Upgrade release (2026-10-24)

This release adds sample-size-aware queue forecast bands (limited/moderate confidence), language-guided speaking, lift/landmark guidance, staff workload pressure, an on-device personal visit reminder, and a guided judge walkthrough. Forecasts and layouts are fictional, not medically validated. Device reminders work only while CareFlow is open in a supported browser; they are not hospital appointments, SMS or scheduled server notifications.

**Production safety requirement:** set a strong `STAFF_PIN` (minimum 8 characters, not `2468`) in Vercel Production and Preview before promoting this release. Production has no hard-coded fallback PIN. Staff and patient login attempts are throttled by a Postgres-backed fifteen-minute bucket. Staff sessions still use one shared PIN; real deployments should replace this with individual roles/SSO. The app is a prototype and must not handle real patient data.

Patient QR link credentials are now stored in the URL fragment rather than query parameters to reduce server/referrer exposure. The fragment still acts as a bearer secret: share QR slips only with their intended patient. Previously generated QR links containing query credentials are read for compatibility, then scrubbed after validation. Patient secrets are no longer written into the new localStorage snapshot; an ephemeral copy can exist in sessionStorage for same-tab slip access.

The queue refresh interval is reduced to three seconds when visible (from 750 ms), and background polling is paused. This trades some immediacy for lower DB traffic; re-open the page to refresh when returning from background.

## Database-backed demo appointment bookings (upgrade branch)

CareFlow now includes a **fictional** appointment-booking experience. Patients can select a department, date and 30-minute slot (09:00–16:30 IST), and create a record in the configured Neon Postgres database. Booking capacity is four per slot per department per CareFlow room. Transactions use PostgreSQL advisory locks to avoid oversubscribing a slot when two people book simultaneously. The hospital shown is not a real hospital: booking an appointment here does **not** create a visit in an actual clinic or guarantee a medical consultation. This prototype does not replace the OPD registration/queue workflow.

A booking returns a reference and a separate private booking code. Keep both: they are necessary to look up, reschedule, or cancel that booking. The browser stores the code for convenience only; copy it elsewhere for recovery after clearing browser data. Staff can view and mark demo bookings complete after authenticating. A private code is required to modify a patient booking even when a browser has a saved OPD session.

The calendar-export button downloads a `.ics` file with a one-day-ahead reminder that can be imported into a compatible calendar. In-app browser notifications are best effort while the web page remains open. **Actual email reminders** are optional and require `RESEND_API_KEY`, `REMINDER_FROM_EMAIL` (a verified sender), and `CRON_SECRET` configured as Vercel secrets. The Vercel daily cron runs at 02:30 UTC / 08:00 IST and sends a reminder for tomorrow's confirmed demo visits to people who explicitly opted in with an email address. This is demo-only transactional email; use fake addresses or controlled test accounts until real privacy and consent policies are established. No SMS or WhatsApp provider is connected.

Existing `DATABASE_URL` and private `STAFF_PIN` must remain configured. Do not expose any environment secrets in client-side code or Git. You can run `npm test` for validation and `npm run build` for a production build. Appointments are connected to the user's database through server-side API routes; they are **not** stored solely in browser localStorage.

## Final consolidated release

Includes patient live queue (counting currently served), six-language speech, accessible floor guide, staff analytics, booking/reschedule/cancel, calendar file and optional email reminder route. Staff requires a strong secret `STAFF_PIN` on production Vercel. Real email requires all three `RESEND_API_KEY`, verified `REMINDER_FROM_EMAIL` and `CRON_SECRET` and explicitly consenting email addresses. Without these, email sends are disabled and browser/calendar reminders remain. All examples are fictional and not real hospital appointments.

### Registration and dashboard behavior

- With a configured `DATABASE_URL`, registering a fictional patient creates a cloud-backed token and opens the dashboard. If the connected room loses its server connection, the attempt stays pending and does not claim to be confirmed.
- Without `DATABASE_URL` in local VS Code, the browser runs a **local-only fictional demo**: registration opens the dashboard immediately, clearly labels the token as unsynced, and can resume after refreshing the same browser tab. Local tokens are not shared between browsers/devices or Vercel.
- To test synchronized queues and demo appointment booking locally, put a **separate development database** connection in `.env.local`; never use real patient data.

## Staff queue controls (October 25, 2026)

- **Completed** tickets (for example A-026) remain in the history. Staff may select **Reopen visit** and confirm to return them to Waiting while preserving their token, department and access code.
- For Waiting tickets, staff can **Call to room A101** (or the assigned department room) only when the doctor is Available and the current consultation has been completed. Automatic **Call next** remains available.
- **Send to end** requeues a waiting or called token at the back of its priority queue. It never completes the patient's visit; staff must use **Complete visit** for that.
- Staff-only permissions are enforced on the server, with audit history. Existing completed tokens are not automatically reopened by deploying the fix.
