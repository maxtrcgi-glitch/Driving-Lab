# Verified historical fixtures

Authoring source: original source.bundle from Driving_Lab_v014A52_Seat_Adjustment_All_In_One(1).zip, SHA-256 `06b7d0f07897f4e0c17375c4002093dd4e69288d002c197c03aec5c4272ad3f8`. The archive was CRC-verified during A52 verification. The archive and Git history are **not** runtime or test dependencies and are not committed here.

`baseline-modules.json` records the actual historical commit for each ref name and both Git blob SHA and SHA-256 for every module alias. 9 distinct modules (115,182 bytes total) live in `blobs/*.txt`; they are source fixtures, not executable entrypoints. Modules that were already byte-identical to accepted dist reuse that file with the **historical fixed hash** verified before each read. Missing aliases, missing files and modified bytes throw; there is no fallback. Test code may rewrite relative imports into isolated temporary modules exactly as it did with git-show output.

`historical-identities.json` stores the obsolete four source freezes independently of the current runtime, including the A42 app with the original version-only A51 substitution. The diagnostic compares those original expectations and deliberately exits nonzero for differences. It does not compare A52 against itself.

`a52-dist.json` freezes the accepted 34-file A52 inventory and SHA-256 values from PR #1 HEAD `e73c9b5594f0265a6e94de4d77fb3de3937195e6`. It protects the unchanged game while this PR repairs test infrastructure. Do not regenerate baselines automatically in CI to make failures disappear. For future accepted gameplay updates, review baseline changes explicitly.

The tests retain the bundled Three.js license in dist/THREE-LICENSE.txt; source fixture provenance does not imply any additional redistribution permission.
