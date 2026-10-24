# Problem statement coverage and test record

Date: 24 October 2026. Fictional data only.

| Requested area | Prototype coverage |
|---|---|
| Simple registration | Implemented: five questions, Back preserves answers, optional mobile, eight department cards, help-desk route. |
| Native languages | Six dictionaries: English, Hindi, Tamil, Telugu, Malayalam, Kannada; registration, map labels, landmarks and core flows translated. Native-speaker review remains required. Some server errors and audit records remain English. |
| Accessibility | Three text sizes, assisted read-aloud questions, contrast, reduced motion, labelled controls, keyboard map actions, step-free routes. Formal WCAG AA certification and assistive-device usability testing are not complete. |
| Queue and estimates | Sequential tokens, first-name slips, last-ten consultation mean plus explicit delay, rounding to five minutes, support priority with aging, step-away/rejoin. |
| Alerts | Three-ahead banner, simulated SMS and supported browser vibration/speech/notification; called token screen. Physical device delivery and installed voices are unverified. |
| Hospital navigation | Three floors, all listed facilities, eight OPDs, wards 4–6, searchable graph-driven SVG, Dijkstra, landmarks, lift/ramp routing and lost-patient card. Fictional distances require hospital validation before real use. |
| Slip to destination | Token entry and genuine patient-claim QR links; scanner only on supported browsers; printable and downloadable image. Physical camera scanning/printing are not device-tested. |
| Emergency | Persistent entry, signs before registration, immediate Casualty route, no-token guidance, 112/108, review flag/acknowledgment. No diagnosis or automated clinical prioritization. |
| Real-time coordination | Neon row-locked updates, 750 ms polling, BroadcastChannel, reconnect and last-known local state. A strict one-second delivery guarantee is not established. |
| Staff dashboard | Eight queues, PIN-protected actions, call/complete/no-show/end/transfer, doctor availability and delay, waiting-area occupancy, flags and demo controls. Default PIN is public demo access only. |
| Counter and board | Dedicated URLs; register for a visitor and print; next three tokens, room, delay, announcements and optional English/Hindi alternation. |
| Weak-connection add-on | Local slip cache, service worker shell/static cache, stale banner, install prompt where supported, pending idempotent registration. Full offline/device installation testing remains incomplete. |
| Original selected design/stack | Preserved Next.js/React/TypeScript, Node and Neon deployment, optional Python estimator, selected 3D illustration. The checklist's alternative Vite/no-backend/no-download recipe was not adopted. |

## Automated evidence

- 20 Node test cases passed, including malformed inputs, state recovery, fairness, idempotent registration and all hospital-place pairs in normal and step-free modes.
- Six Python estimator cases passed.
- TypeScript passed after fixing callback syntax and inferred state types.
- Dependency audit reported zero known production dependency vulnerabilities at the time checked.
- 17 live API scenario groups passed on the expanded preview: assets, malformed input, concurrent registrations, authorization, name redaction, staff PIN, calls, breaks, completion, rejoin, assistance and feedback.
- Vercel successfully generated static pages and server functions; an invalid UTF-8 source file found by deployment was corrected.

## Browser evidence

Expanded preview: first-language selection; all five registration steps; age 67 support default; first-name slip A-026; OPD route; Ward 4 destination; lost-patient card redirects to help desk. Earlier baseline tests also exercised connected calls, break/resume, emergency acknowledgment, token filters and patient/board updates. These older results do not establish every new feature has been browser-tested.

Phone testing found a small footer/header overflow and the older illustration's distance mismatch; fixes were added. Final responsive results are recorded separately when available. No claim is made that every browser/device feature or all possible interactions are error-free.

## Three-minute judging demo

0:00–0:25: Open patient, staff and board using the same room link. Explain that all visitors and hospital details are fictional. This connects registration counters and consultation rooms.

0:25–1:05: Select Hindi, Register and assisted mode. Enter a fictional first name and age, continue through gender and optional mobile, choose General Medicine. Show the slip and explain OPD/token. This reduces language and digital-literacy barriers.

1:05–1:35: Open Guide me to my room, keep Avoid stairs on, inspect the lift route, then show Ward 4 and the bilingual lost-patient card. This addresses confusion after receiving a slip.

1:35–2:10: Unlock Staff with demo PIN 2468. Call patients while watching the patient's queue and board. Show the three-ahead alert using a standard-priority visitor behind at least four people. Show doctor break/delay and resume. This turns uncertain waiting into visible progress.

2:10–2:40: Open Emergency, show the no-token warning and Casualty route, request demo staff review, then acknowledge it on Staff. Explain that qualified staff alone assess urgency and the app never dispatches help.

2:40–3:00: Show occupancy, registration counter and the TV board. Explain local caching and limitations. Close with the practical benefit: one understandable journey from registration to the correct doctor.

## Demo risks and preparation

Use three tabs with the same room, confirm Cloud connected, set a fresh fictional room, unlock Staff, allow audio only after a user gesture, preload maps, keep a reliable connection and retain this source ZIP. Do not promise camera, voices, notifications, vibration or installation on an untested device. Default demo PIN and public source are not production hospital security. Do not enter real health or identity data.

Final browser additions: staff PIN unlock, emergency request visible in Staff and acknowledgment, Malayalam tablet wrap, saved language after reload, actual largest-text layout checks at 360/768/1440 across all six languages. A long Tamil now-serving label overflow was located and fixed. Camera/microphone permissions and physical notification delivery were not exercised.
