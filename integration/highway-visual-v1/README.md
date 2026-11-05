# Driving Lab — A.5.0 Highway Visual Integration Package

Read HIGHWAY_VISUAL_CONTRACT.md, then ROAD_COORDINATES.md, VISUAL_ASSET_SLOTS.json and PERFORMANCE_BUDGET.md. VISUAL_INTEGRATION_EXAMPLE.js is a detached renderer-only example using exact A.4.2 source modules in reference/. No changes were made to runtime dist/ and no new game build was published.

Run `npm test` (no dependencies) or `node tests/contract.mjs`. Optional local web preview: `python -m http.server 8000`, open example.html; a WebGL browser is required. Browser preview was not executed by Developer; CPU tests passed. Asset factories consume the supplied Three namespace and return descriptor/parts; host owns placements and lifetime. Only LOD0 is implemented in the example; LOD/bridges/new slots explicitly proposed.

A.4.2 accepted by Director/player. Immutable source tag gameplay-baseline/v0.14A.4.2 ->93e5e260977ca0b079ccd198e12ac9cc97fafa28. Original verified full archive Driving_Lab_v014A42_All_In_One.zip is retained separately (SHA256 a0145c2d65e23f2a6905866c0447829bccbb64f1509105657c51ff028aba4828). Restore the original source/native Git bundles and ready build for full rollback; Site version25 remains untouched. The integration package includes a current source Git bundle to preserve documentation and baseline refs without nesting the30MB archive again.

Contract1.0.0 is proposed integration API, not an existing game API. Source hashes, test results and handoff record distinguish facts from planned extensions. A.5.1 awaits Director. Copy this ZIP to Visual Developer; no messages were sent automatically.
