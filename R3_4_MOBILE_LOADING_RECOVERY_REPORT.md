# R3.4 Mobile Loading Recovery

## Result and scope

The experimental showcase is deployed at https://driving-lab-r34-showcase.maxtrcgi.chatgpt.site . Deployment succeeded; actual iPhone Safari acceptance is **pending**. The stable gameplay site and main were not changed. No R3.5, gameplay or visual redesign was undertaken.

The implementation tested and packaged corresponds to GitHub commit `ac8efa395418f60d2826e0bfdf5b973f5b5b2872` on `visual/asset-poc-r2`; this report-only commit is its descendant. The hosting repository commit is `087a9b02c86c5243d1d6dc7c90f66ef62a94eefe`. All 27 bundled repository files in the deployed source were compared as Git blob hashes with the GitHub tree at the implementation commit; they matched. The hosting manifest and generated root redirect are site packaging files.

## Confirmed root cause

The old hosted bundle contained `viewer/vendor/GLTFLoader.js` but omitted its static dependency `viewer/utils/BufferGeometryUtils.js`. The original CI ran from the full repository where that dependency exists, then the packaging step copied only the vendor directory. Before repair, an authenticated request to the missing deployed path returned **HTTP 404**; Three.js module and loader URLs, representative texture and both original GLBs returned HTTP 200. The missing static import prevents module initialization and explains the reported blank page with perpetual Loading. The original five-resource Promise.all had no rejection UI, so a later asset failure could also have left the page stuck; it was a separate reliability defect, not an established cause of the observed failure.

Both original and mobile workflow packaging now copy viewer/utils. After the first corrected deployment, authenticated HEAD requests returned HTTP 200 with appropriate content types for the page, Three modules, GLTFLoader, BufferGeometryUtils, nine road textures and both mobile GLBs. The subsequent final deployment only changes two diagnostics/test source files and the final GitHub-matched package includes those same resources. This is HTTP verification, not a successful browser run against the protected deployed URL: the available cloud browser was presented with the owner sign-in gate. No bypass of its authentication was attempted.

## Loading behavior

The loader now reports stages, renderer initialization, loaded/total assets, elapsed time and named failures. It imposes a 30-second per-resource timeout, catches initialization and loading rejections, and provides a startup watchdog. Copy Diagnostics uses the Clipboard API, falling back to a visible selected text area when unavailable. Diagnostics include user agent and WebGL version and are only displayed/copied locally, with no telemetry collection.

Essential road surfaces load first. The road renders while guardrail and barrier load independently; either optional model can fail without blocking the other or hiding the road. Failures are visibly reported and no fake geometry is substituted. Essential texture failure stops initialization visibly rather than rendering a misleading incomplete road. Network-image failures may show generic event text, so the file name and load category are the reliable details, not always an HTTP status.

## Assets and estimates

Original source GLBs are preserved unchanged; mobile variants retain their geometry/materials and resize the eight embedded textures from 2048² to 512². The nine asphalt/gravel textures remain 1024².

| Model | Original GLB bytes | Mobile GLB bytes |
|---|---:|---:|
| Guardrail | 3,540,124 | 227,040 |
| Jersey barrier | 3,186,720 | 163,264 |

An illustrative uncompressed RGBA8 estimate for nine 1K and eight embedded textures changes from 164 MiB to 44 MiB at base level, or approximately 219 MiB to 59 MiB with full mip chains. These are calculated estimates, not measured GPU allocation; decoder, browser, texture formats, sharing, buffers and render targets can change actual memory. Reduced 512 textures may look softer close up; inspect on iPhone.

## Validation

[GitHub Actions: packaged WebGL recovery run 42418613191](https://github.com/maxtrcgi-glitch/Driving-Lab/actions/runs/42418613191) passed on implementation commit. It packaged the same folder layout as hosting and used Chromium WebGL 2 with ANGLE SwiftShader, not iPhone Safari. It verified full ready state (11/11), missing road texture and visible named error, missing guardrail with road still rendered, invalid GLB rejection with remaining road, 30-second timeout with visible named error, and clipboard fallback with selected diagnostic text. All scenarios passed. The earlier mobile run identified a missing packaging dependency; a subsequent run exposed a race in which another texture could overwrite a failure label; both were fixed and tested.

The initial verification on the previous recovery incorrectly equated successful source-directory CI and deployed files being a subset of the repository with a working deployment. It did not check transitive modules or run the deployed package in a browser.

## Remaining limits

Actual iPhone Safari, WebGL initialization on that device, memory pressure, long-session behavior, and access through the user's in-app browser remain unverified. CI validates a local server serving the same folder layout; it does not prove the private live HTTPS page rendered. User acceptance should open the experimental URL, reload if necessary, and report any visible diagnostics if loading fails. The scene remains an experiment and is not approved for production integration.
