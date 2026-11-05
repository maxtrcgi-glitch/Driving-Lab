# A.5.2 reproducible verification

Use Node.js 22 or newer. No ZIP, Git bundle, tags, long clone history, server credentials, or hosted game is needed.

```bash
npm ci
npm run check:current
npx playwright install --with-deps --only-shell chromium
npm run check:browser
```

The first command installs the exact Playwright version from package-lock.json. The CPU/current suite does not launch a browser. The browser command launches a real Chromium process, creates its own loopback HTTP server and temporary browser profile, and tests real WebGL2, module/resource loading, the highway start screen, camera controls, live seat movement, persistence across reload, and Reset Position. It never replaces DOM or WebGL with mocks. Missing browser, missing/lost WebGL, exceptions, failed resources, timeouts, or failed assertions all produce exit 1. It writes `reports/browser/smoke.json` on failure too. Software rendering uses Chromium SwiftShader; this verifies rendering capability and startup, not hardware GPU performance, Safari, sensors or iPhone comfort.

On a platform with a separately installed Chromium, set `CHROMIUM_EXECUTABLE_PATH`. Advanced platform arguments can be supplied as a JSON string array in `CHROMIUM_EXTRA_ARGS`. The default CI uses Playwright's matching browser; an override is reported in smoke.json and is never selected silently.

`npm run check:current` runs all 12 original root commands plus syntax, static resources/integrity, infrastructure negative controls and the integration contract. It runs every independent command, writes each log and an explicit result in `reports/current/`, then exits nonzero if **any** command fails, times out, or is missing. It does not include the browser check: both are required for the merge gate. Tests within each original command retain their fail-fast `&&` ordering. A failed subtest does not imply its successors ran.

## Current contracts and historical diagnostics

| Command | Current required contract | Historical expectation moved out |
| --- | --- | --- |
| check:traffic-ai2 | NPC decision behavior, traffic-on/off player isolation on identical A52 road geometry (7,200 full-state ticks; speeds 50–250 km/h, both directions), player read-only observation, retained traffic benchmark/GC/object-reuse assertions | Every protected file must equal A.3.1. The accepted launch fix, later controls, model and road changes make this obsolete. Comparing player terrain against old road geometry is also no longer an invariant. |
| check:camera | Existing 30/60/120 FPS rig tests; camera cannot modify full Vehicle/controller state (4,800 ticks); camera clearance/projection and performance | Renderer/world/road must equal A.3.3, despite accepted Highway World 2.0. |
| check:calibration | Exact A.4.1 *reference camera* behavior where promised; real/synthetic acceleration and drift gaze, sign/amplitude/rate/return limits, FPS equivalence, persistence, no vehicle writes, reset/resume/preset continuity, safety/projection/performance | All protected road modules must equal A.4.1. Accepted A.5.1 geometry superseded that source freeze. |
| check:highway2 | Road shape/contact/frame and physical traffic coordinates; road observer/shadow assist cannot change player state (2,400 ticks); continuity quality, rig and streaming/object reuse/memory assertions | Every non-road file must equal A.4.2 and app.js must differ only in A.5.1 version strings. A.5.2 intentionally adds seat/UI code. |

All existing behavioral assertions after those obsolete source guards remain. The accepted A52 distribution is independently frozen by SHA-256 for **all 34 files**, including exact inventory. A future approved gameplay change must deliberately review/update that manifest along with appropriate behavioral tests; a changed source hash must not be treated as evidence of a behavioral regression by itself.

```bash
npm run check:legacy
```

This diagnostic retains the original four sets of historical byte-identity expectations as checked-in SHA-256 data with real source commit IDs. It lists **all** mismatches, writes `reports/legacy-identities.json`, and exits **1** when they differ. Current A52 is expected to differ in all four audits. The result is never renamed PASS, swallowed, or included in the required current aggregate. It needs no historical tags. These hashes preserve the actual old equality checks; they are not hashes recomputed from the new code.

Historical comparator modules still needed by useful current tests are content-addressed verified fixtures (see `tests/fixtures/README.md`). They preserve A51 zero-seat comparisons and 2,880 physics identity ticks, head inertia reference comparisons, launch negative controls and 5,760 moving-state ticks, and historical performance baselines. No test manufactures old tags or falls back to the current implementation if a fixture is missing.

The integration contract writes its new result to `reports/integration-contract.json`, leaving the archived CONTRACT_TEST_RESULTS.json unchanged. CPU logs and screenshots are generated output, ignored via reports/.

## GitHub Actions

`.github/workflows/a52-verification.yml` runs on PRs targeting main with checkout depth 1. The two required jobs are **Required current regression tests** and **Required real Chromium WebGL smoke**. **Required merge gate** succeeds only if both jobs completed successfully; a failed, skipped or cancelled required job cannot yield a green gate. Configure branch rules to require these checks if enforcement is desired; this task does not alter repository administration settings.

The explicitly named historical diagnostic job intentionally remains red on historical mismatches and uploads its report. It is **not** a required current regression gate. Thus the workflow can show a diagnostic failure while both current checks succeed; reviewers must inspect named job outcomes, not treat the historical red result as a new gameplay failure or hide it. Conversely a local pass or a prepared workflow is not proof that Actions ran.

Run locally without npm scripts if diagnosing a failure: each script command is listed verbatim in package.json. A Node/WebGL stub in app-bootstrap remains useful unit coverage, but never substitutes for check:browser.
