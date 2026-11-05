# GitHub import and verification status

The accepted integrated baseline is Driving Lab v0.14A.5.2. PR #1 imports the snapshot; the omitted seven highway integration reference files were restored in e73c9b5594f0265a6e94de4d77fb3de3937195e6. Visual V1.3 is not integrated.

Current tests use checked-in verified fixtures and explicit A52 behavior/integrity contracts. No archive, historical Git tags or source.bundle is required. See TESTING.md for current commands, diagnostic historical identities and the real-browser merge gate.

The original unchanged full A52 archive remains a separate provenance backup, SHA-256 06b7d0f07897f4e0c17375c4002093dd4e69288d002c197c03aec5c4272ad3f8. It was used only to author verified fixtures; CI never downloads or reads it.

The game remains a static buildless PWA. To run locally: python3 -m http.server 8000 --directory dist. No deployment or merge is performed by the verification workflow. Sensor/PWA device acceptance remains distinct from Chromium software-WebGL startup verification.
