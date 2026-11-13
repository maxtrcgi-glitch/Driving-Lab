# R4.3 highway showcase

Use `python3 -m http.server 8173` from the folder containing index.html, viewer.js, instance.js, highway.glb, scene.json, vendor/ and utils/. Open http://localhost:8173/. For phone review use the isolated HTTPS site.

The Actions workflow downloads and verifies the R4.1c native master before opening a separate working copy. Run the same export locally with Blender and Pillow.

    blender -b r43-working.blend -t 6 --python-exit-code 1 --python export.py -- evidence --stage c
    python3 pack_glb.py evidence/highway.glb

Copy index.html, viewer.js and instance.js into evidence/. Copy vendor/ and utils/ from the existing asset-poc-r2 viewer. Serve evidence/ over HTTP. test.cjs uses Playwright Chromium for three camera captures and an injected missing-GLB check.
