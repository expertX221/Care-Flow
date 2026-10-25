# Final audit — 25 October 2026

Baseline: supplied staff-workspace ZIP, including changes not yet present on GitHub main 1d53e30. Audit PDFs were treated as hypotheses and checked against source and tests.

## Implemented

- Removed impossible staff-tab TypeScript comparisons.
- Removed browser-side staff PIN fallback; fresh loads require explicit staff unlock. Server login distinguishes authentication failure from unavailable infrastructure; PIN comparison is constant-time.
- Shared default room, while preserving explicit and saved rooms.
- First-visit patient language picker only; board/staff direct loads are unobstructed.
- Names with initials/titles preserved; unused phone collection removed; unset gender remains unspecified.
- All eight departments bookable, final slot 13:30 IST.
- Delayed doctors can call; breaks block calls. Fast clicks no longer distort samples.
- One estimate/forecast range; assistance-priority aging revised and documented.
- Near-turn alert handles 5→2, shows actual count, avoids repeated alerts within threshold.
- Multiple patients may request review; requests do not assign medical priority.
- Dashboard uses the real route graph rather than fixed illustrated trails.
- Reset and automatic demo controls visible in Check-in.
- Appointment pool deadlock removed; failed reminder emails skipped within run, provider timeout added.
- Strict room/booking validation, cross-origin mutation checks, public write limits, private-state redaction and sanitized local snapshots.
- Feedback belongs to a finished visit and updates one rating per token; staff sees aggregate ratings.
- Service worker no longer caches unique navigation query URLs; baseline security headers and app icon added.
- README and coverage claims rewritten to match actual functionality; test discovery includes all test files.

## Evidence

- 93 Node tests passed, including 11 added regression/security tests.
- Ten database integration scenarios passed on isolated Neon branch br-raspy-feather-b4pl43e4. Includes concurrent registration, slot capacity, parallel private booking lookups, anonymous action rejection and session revocation. No production data was reset.
- Fresh Chrome live-site inspection showed a staff PIN gate after a blocking language popup. Anonymous dashboard bypass was not reproduced; existing staff-session reuse was a plausible explanation, not a confirmed cause.
- GitHub Actions run 40168919644 passed dependency installation, all 93 Node tests, six Python tests and a clean production build for commit 9dbb34efb896a0104c91234d18dd2904f61ed2fc. Vercel preview deployed successfully.
- Chrome preview verification: staff gate opens without a language popup, old 2468 PIN is rejected, K Ravi registers as token A-026 with name preserved, both wait panels agree at 20–40 minutes, and changing the destination from A101 to Pharmacy changes the floor, path and distance from 86m to 51m.
- Browser verification found misleading alert-step copy and unnecessary inner scrolling on the guide; corrected in the follow-up. Final build results are linked in the PR.

## Deferred / limits

This is not a claim that all ~55 report suggestions were implemented. Named staff roles/SSO, locked-phone push/SMS, email verification, family switching, booking-to-queue check-in, automatic no-show decisions, lift outages, actual 3D geometry, Bhashini, ABHA, retention automation and physical-device accessibility/load testing remain out of scope for this repair pass. Runtime schema initialization remains for compatibility; schema.sql is the deployment reference. No live production promotion is implied by a review branch or ZIP.

## Follow-up: local features, no external integrations

Implemented appointment-to-queue check-in (IST time window, private booking code, idempotent transaction, linked consultation completion), eight-visit family switching with bounded HttpOnly credentials, explicit forget-device action, staff recall plus a five-minute no-show response timer, shared lift availability with safe no-route guidance, collapsed lift steps, and an optional real Three.js schematic sharing the 2D geometry/path data. Existing staff-only demo utilities are no longer visible in the anonymous appointment panel.

109 automated tests pass, including 16 additional local/3D cases. Eleven new isolated database checks passed; see local-features-database-checks.json. These supersede the earlier deferrals of family switching, booking check-in, recall/no-show, lift outages and 3D geometry. Named staff roles, privacy-retention automation and full physical-device accessibility/load testing are still not implemented. External integrations remain excluded by user preference. Final clean build and browser results are recorded in the PR/handoff.
