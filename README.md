# CareFlow

CareFlow is a fictional hospital queue and wayfinding app based on the selected bright blue, lavender and coral design. It uses Next.js, React, TypeScript, JavaScript, HTML through JSX, CSS, Node.js, Neon Postgres, and an optional Python estimator.

## Run in VS Code

Open this folder. Run `npm ci`, then `npm run dev`. Open http://localhost:3000. For a production server run `npm run build`, then `npm start`. This workspace already contains the local database configuration; it is excluded from Git and deployment uploads.

To configure a fresh checkout, copy `.env.example` to `.env.local` and set your own Neon `DATABASE_URL`. Never expose this as a NEXT_PUBLIC variable.

## Working features

- Patient, staff and waiting-room views, mobile navigation, keyboard controls, dialog focus management.
- Six-language primary patient workflows: English, Hindi, Tamil, Telugu, Malayalam and Kannada. Some error messages, audit entries, names and supplementary explanations remain English. Translations need native-speaker review.
- Three-step check-in, fictional patient names, department selection, assisted/support priority, voice input when the browser supports it.
- Unique sequential department tokens, genuine QR encoding, printable slip, token lookup, step-away and rejoin, post-visit rating.
- Four department queues; staff call-next, complete visits, skip/rejoin and doctor break/resume controls. Consultation durations update an EWMA estimate. Arrival aging limits starvation.
- Neon stores each shared demo room. Database row locks serialize simultaneous actions; five concurrent registrations were verified without lost updates or duplicate tokens.
- Patient, staff and board synchronize by polling every two seconds. Use Connect another screen to open the same opaque room link on another browser or device. This is polling, not a WebSocket service.
- The selected 3D illustration, pointer-driven perspective motion, floor controls, animated token changes, accessible route toggle and real Dijkstra graph directions for a fictional building. The picture is an illustration, not a true WebGL model or a measured indoor positioning system; its baked-in glowing route is decorative. Route steps and distances are computed separately.
- Emergency review requests, staff warning panel and acknowledgment. This app does not contact emergency services. Qualified staff determine urgency.
- Large type, contrast, assisted mode, reduced-motion controls and device vibration when supported. Read-aloud and voice input depend on browser permission, installed voices and language availability.
- Local slip/state cache; service worker caches a previously loaded shell and static assets. Offline staff mutations are not queued; reconnect before changing shared data. Offline reload depends on previously cached resources. No push/SMS service is connected.

## Demo in under five minutes

1. Open Patient. Select Hindi, choose New check-in, enter a fictional name, choose General Medicine, and confirm.
2. Show the QR slip, token and current waiting estimate. Select Guide me to my room and compare lift/stair directions.
3. Choose Connect another screen. Open Staff and Live board links alongside Patient with the same room ID.
4. In Staff, press Call next until your token is called. Patient and board update within two seconds; supported phones vibrate.
5. Pause/resume the doctor to change estimates. Request Emergency review and acknowledge it in Staff.

## Python estimates

Run `python python/predict.py` to start the optional standard-library service on port 8000. Set `PREDICTION_URL=http://127.0.0.1:8000` locally. The `/api/predict` Node endpoint validates input and proxies Python, with a Node EWMA fallback. On Vercel use an externally hosted HTTPS Python service or leave the variable unset. Python does not need a paid API.

## Deployment to Vercel

Framework: Next.js. Install: `npm ci`. Build: `npm run build`. Add `DATABASE_URL` in Vercel for Preview and Production. The secret must be entered as a server-only environment variable. `.vercelignore` excludes local secrets, generated builds, logs and dependencies.

Local production builds use `.careflow-build`; Vercel uses the standard `.next` directory. Set `CAREFLOW_DEV=1` to isolate development output from a production build when running both concurrently.

## Checks

`npm test` runs eight queue/routing tests. `npm run build` compiles and checks TypeScript. `node scripts/verify-database.mjs` verifies five simultaneous Neon registrations in a new fictional test room. The test deliberately retains that room; it does not delete data.

## Limits

This is a hackathon demonstration, not a clinical product. Room links act as demo access capabilities; anyone with a link can operate Staff controls. No real patient information should be entered. Clinical authentication, privacy retention, rate limits and hospital deployment review are required before a real rollout. No payment, geolocation, diagnosis, SMS, browser push or emergency dispatch is implemented. Public GitHub publication, pitch deck and recorded demo video are separate deliverables and have not been produced by this build.
