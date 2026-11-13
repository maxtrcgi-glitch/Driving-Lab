# R4.3 highway showcase

The Actions workflow verifies the SHA-256 of the R4.1c checkpoint and opens a separate Blender working copy. The original R4.1c master and asset provenance live in Actions run 42480836413, artifact 13617741101.

To open an exported checkpoint, keep index.html, viewer.js, highway.glb, scene.json, vendor/ and utils/ in one directory. Serve that directory over HTTP locally or HTTPS for a device. For example, run python3 -m http.server 8173 from the directory and open http://localhost:8173/.

For a reproducible local material checkpoint, run:

    blender -b r43-working.blend -t 8 --python-exit-code 1 --python export.py -- evidence --stage a
    python3 pack_glb.py evidence/highway.glb

Copy index.html and viewer.js from this directory and vendor/ and utils/ from the repository's experiments/asset-poc-r2/viewer directory into evidence/. Start an HTTP server in evidence/. Use test.cjs with Playwright Chromium to capture the driver image and verify that a missing GLB produces a visible error.
