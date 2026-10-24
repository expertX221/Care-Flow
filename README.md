# CareFlow

Government-hospital visitors can struggle to register, understand their queue, and find the room on their OPD slip. CareFlow demonstrates one connected journey using a fictional hospital and fictional visitors.

Built for patients, helpers, registration staff and waiting-room displays. The selected white/lavender, blue/coral interface uses an illustrated hospital plus a separate graph-driven floor plan.

## Run in VS Code

Use Node.js 22 or newer. Open this folder, run `npm ci`, then `npm run dev`, and open http://localhost:3000. For production: `npm run build` then `npm start`. Copy `.env.example` to `.env.local` and set a server-only Neon `DATABASE_URL` for connected queues. Without a working database, the browser demonstrates local state; shared staff actions need a connection. Never enter real patient information.

`STAFF_PIN` is optional; the prototype default is **2468**, shown on the login screen. A real hospital requires individual staff identities, appropriate permissions, retention rules and audited access. This public demo PIN is not clinical authentication.

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
3. Set server-only `DATABASE_URL` in the intended Preview/Production environments. Optionally set `STAFF_PIN`.
4. Deploy and open the generated URL. Next.js owns `/staff`, `/counter`, `/board`, `/find`; no SPA catch-all rewrite is required, so direct page refresh works.
5. Never publish `.env.local`, CLI login files, `.vercel`, dependencies or generated builds.

The original Next.js/TypeScript/Neon stack was retained from the user's deployed project. This intentionally differs from the pasted checklist's alternative Vite/plain-JavaScript/no-backend starting recipe. Node API routes run with the app on Vercel; no separate Express server is required.

## Offline and device features

The service worker caches the loaded shell, assets and static chunks; local storage retains the last known slip and queue. Offline position is explicitly stale. Offline registration is held locally with an idempotency key and sent after reconnecting. Staff mutations require a confirmed connection. Install is offered only when the browser exposes its install prompt. Full offline reload requires a successful prior online load and cache completion.

Camera QR scanning uses BarcodeDetector when available. Speech recognition, language voices, vibration, sound, notifications and installation depend on browser/device support and permission. Simulated SMS is an on-screen demonstration; no SMS or push provider is connected.

## Verification

`npm test`: 33 automated queue, input, storage and graph checks. `python -m unittest discover -s python -p 'test_*.py'`: six estimator checks. `npx tsc --noEmit` checks TypeScript. `npm run test:api` creates an isolated fictional room and checks 18 API scenario groups against `BASE_URL` (defaults to production); use `CAREFLOW_TEST_STAFF_PIN` if configured. No test deletes unrelated data. See `reports/problem-statement-coverage.md` for coverage and remaining limits.

## Next steps

Native-speaker and clinical review; full WCAG audit and patient usability sessions; hospital-verified layouts; individual staff authentication; measured load/latency and rate limits; real notification integration. This is a prototype, not a clinical deployment.

## Device and accessibility hardening

Camera failures release active tracks and show a translated token-entry fallback. Microphone errors show translated text and recording stops on step change or dialog close. Notifications use service-worker delivery on supported mobile browsers, with an in-app fallback; Settings includes a test alert. Read-aloud controls report missing language voices. Dialogs isolate background controls, registration steps announce headings and progress, and the map exposes keyboard-accessible places. Primary text, secondary text and emergency controls pass an automated palette contrast check. These checks do not constitute a complete WCAG certification or physical-device verification. SMS remains an in-app simulation by user choice.

## Room codes, voice stop and illustrated floor trails

Rooms use consistent alphanumeric codes (A101, A106, E107 and M204) in slips, staff/board screens and map directions. Existing token IDs remain unchanged. Stop speaking cancels current and queued speech and is available in the footer and dialogs. Selecting a floor changes the animated illustration trail, moving marker and destination label; reduced-motion settings retain a static route. The illustration remains a schematic preview; precise graph directions are in Find a place.


The language picker appears on every fresh opening/reload, even when a previous language preference is saved. The hospital image uses a clean asset without the old baked-in first-floor trail; the selected-floor route is drawn separately.

## Patient entry flow

Every fresh load asks for language, then presents Register a new visit or Log in to my visit. No patient token, assigned room, floor or personal dashboard is displayed before confirmation. Registering issues the patient’s own token; existing visits open through a saved server session or the private QR/code on the slip. Private codes include the original demo-room identifier for returning from another device. Seeded demo patients remain in staff/public queues but are never automatically assigned to a visitor. This is visit access, not an email/password account system. Emergency guidance stays accessible before entry.
