# Driving Lab Simulator

**Stable imported baseline:** v0.14A.5.2 (Cockpit Seat Adjustment). This is the **integrated gameplay baseline**, not the experimental Visual Developer demo.

Mobile driving simulator using JavaScript and Three.js/WebGL, packaged as a buildless static PWA. Toyota GR86, custom vehicle dynamics, highway traffic, adjustable cockpit camera.

## Run locally

Requirements: Node.js 22+ (for tests) and any local static HTTP server.

```bash
python3 -m http.server 8000 --directory dist
```

Open <http://localhost:8000>. Do **not** use `file://` for ESM imports. iPhone sensors and PWA functionality require HTTPS and browser permissions.

## Tests

```bash
npm ci
npm run check:current
npx playwright install --with-deps --only-shell chromium
npm run check:browser
```

Both current checks and the real-browser smoke must pass for the merge gate. No archive or historical Git tags are needed. `npm run check:legacy` preserves historical source-identity diagnostics and intentionally returns nonzero for known A52 differences; it is not an active gameplay requirement. See [TESTING.md](TESTING.md) for contracts, fixtures, CI jobs, reports and limitations.

## Versioning and workflow

- `main`: accepted, integrated gameplay baseline.
- `core/*`: physics, controls, gameplay, world, camera.
- `visual/*`: 3D assets, textures, lighting. Visual development occurs separately until reviewed and integrated.
- `research/*`: experimental work.
- Create pull requests targeting `main`. Do not force-push or overwrite the stable deployment.

## Source baseline and provenance

The project was prepared from the full A.5.2 handoff archive. The original **unmodified backup** is maintained separately outside GitHub. See `PROJECT_STATE.md` and `DRIVING_LAB_A52_HANDOFF.md`. The present import does not publish to the game's existing website.

## License

Three.js bundled license: `dist/THREE-LICENSE.txt`. Other assets and source components require separate review before redistribution or commercial publication; this import is intended for the owner's private repository.
