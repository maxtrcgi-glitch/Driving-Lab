# R2.3c — Highway realism production pass

**Verdict: NOT READY — SPECIFIC BLOCKERS.** A working experimental pass and separate HTTPS inspection route exist, but the matched images do not establish the requested substantial road realism improvement. Low-sun asphalt still exhibits prominent periodic bands; the setting remains flat and schematic. Wear, edge dirt, drainage, natural macro variation and motion verification are incomplete. No Director visual acceptance or iPhone performance claim is made.

## Implemented

- Preserved R2.3 at `r23/index.html`; R2.3c is `r23c/index.html`. Road plane now has 54 width subdivisions and a central crown: vertex height `-0.02 * abs(x)` relative to its centre. Two shoulder planes use approximately 4% outward crossfall, nominally starting at the 13.5 m roadway's edge height. Road remains one straight 300 m mesh; a streaming/segmented road is not implemented.
- Used the existing Poly Haven Asphalt Track 1K diffuse, GL normal and roughness maps: [source](https://polyhaven.com/a/asphalt_track), Dimitrios Savva, CC0; [manifest with SHA-256](../assets/asphalt-track/manifest.json). No new third-party assets, no new GLSL, Three.js MIT. Two isolated rectangular asphalt regions use the same base texture with a different tint and roughness; they are rudimentary placeholders, not validated believable repair decals. Wheel tracks, cracks, shoulder dirt and genuinely natural large-scale variation are not implemented.
- Roadside rail profile was changed from a rectangular beam to an extruded folded profile; posts and sparse roadside markers are instanced. These are approximate prototype geometry, not engineering-certified products. Changed the road marking material color and roughness; dimensions and positions remain from R2.3, with no wear texture. Lighting settings are unchanged to enable matched A/B comparison.
- Experimental camera motion accepts km/h in the scene API, defaults to 100 km/h, and the Drive button toggles it. The loop resets abruptly; the frame time is capped at 80 ms, so distance is not guaranteed to track wall-clock speed under load. No independent speed UI is provided.

## Real WebGL evidence

- [GitHub Actions run 42382941104](https://github.com/maxtrcgi-glitch/Driving-Lab/actions/runs/42382941104), tested branch SHA `842fd481c88b27aac90421651db32a39a331b8fe`; [A/B screenshot artifact](https://github.com/maxtrcgi-glitch/Driving-Lab/actions/runs/42382941104/artifacts/13579100234). ZIP SHA-256 `ae6cab492afb7ed0084fb3d0437e5a7f0e70e4f7c927cb3544fe51311290e5a9` matched downloaded archive.
- A is R2.3 and B is R2.3c. Both use the same 1280×800 resolution, FOV, camera positions, lighting and tone mapping. The existing `detail` and `barrier` test camera presets are roadside views at different locations, not true close-ups; they do not fully satisfy the required detail inspection. Geometry test asserted road centre height 0 and edge -0.135 m. It did **not** programmatically test shoulder joins, multiple longitudinal segments, marking offsets or streaming boundaries. The single continuous 300 m road has no internal chunk joins.
- Chromium WebGL2 with SwiftShader produced screenshots with zero recorded GL/HTTP/JS errors. In driver view A reported 42 draws / 1,924 triangles; B 48 draws / 2,410 triangles. Both report 3 textures. Across selected views B used 37–48 draws and 2,388–2,410 triangles. Three 1K RGBA8 textures with full mipmaps estimate ~16 MiB excluding overhead and other resources; actual GPU allocation and shader timing are unknown. No controlled frame-time benchmark was run; SwiftShader is not an iPhone performance measurement.
- The test also saves four camera-position screenshots at each nominal 100 and 200 km/h. These are manual spatial steps, not time-controlled video or proof of smooth motion. Texture swimming, flicker, shadow stability and real speed have not been established.

## Visual assessment and limitations

Review of matched driver, low-sun, roadside and overview images shows the left rail has a more detailed profile and markers are visible. The asphalt remains visibly dark and repeated bands remain prominent in grazing light; the 2 m scan is unchanged, so no material reduction in banding is demonstrated. Background, terrain, shoulders and markings remain overly simple. The screenshots do not support declaring photorealism or acceptance. No real photographic comparison was carried out in this pass.

The two region overlays sit approximately 3 mm above the road and can create z-fighting or flicker at distance; this has not been tested in continuous motion. The shared repeated texture also means overlay detail scale is not independently calibrated. Reflector boxes are simplified, shoulder transitions and edge contact were not verified quantitatively, and there are no properly designed median or drainage features. No proposed change to production highway code is implied.

## Preview and source provenance

[Standalone HTTPS preview](https://driving-lab-highway-r23.maxtrcgi.chatgpt.site/r23c/) is the existing owner-private visual Site; the stable gameplay site was not changed. Site deployment succeeded. The deployed `dist/r23c/index.html` was byte-compared to the tested GitHub scene file: SHA-256 `bec49bcd997ef31dcf2182eeac25bd078b5206a38788312c788a8d3f8ce232f6`. Site source commit is `d14cf7c5b93b1f1f64c2758f5b972fbed1e3f932`, distinct from the GitHub branch commit. Deployment success is confirmed, but actual mobile Safari behavior has not been independently verified. The original scene is retained at the same Site's `/r23/` path.

No main, stable dist, traffic, physics, camera dynamics or transmission was modified. Report commit SHA is obtained from Git history.
