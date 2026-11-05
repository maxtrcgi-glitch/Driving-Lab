# Initial GitHub import — access pending

The ZIP contains only the current v0.14A.5.2 gameplay source snapshot, test suite, static distribution and selected documentation. There is **no Visual Developer V1.3 integration**.

## Critical status
The linked GitHub connector authenticated as `maxtrcgi-glitch`, but `get_repo(maxtrcgi-glitch/Driving-Lab)` and `README.md` returned 404. Repository listing was empty, and installation listing returned zero installations. **Nothing was uploaded.**

## Import instructions once access is fixed
1. Recheck read access, existing `main` and README, and write permissions.
2. Create branch `setup/initial-import` from the actual remote `main` SHA.
3. Import files from this package *without deleting unrelated files already in GitHub*.
4. Validate exact file list and build; do not push ZIPs or embedded Git bundles.
5. Commit `Initial import: Driving Lab stable baseline` and open a PR targeting `main`.
6. Never force-push.

## Test/history note
Certain original regression tests use `git show gameplay-baseline/v0.14A.5.1:...` to compare with the historical baseline. Running those tests requires the project's previous Git tags, which are available in the separate original `history/source.bundle` within the untouched full handoff ZIP. A fresh snapshot import **without tags** will not satisfy that historical precondition. Prefer importing history carefully into a known-empty repository with explicit permission or adapt the baseline tests in a separate reviewed commit. Do not silently claim they passed in a fresh snapshot.

## Local static run
`python3 -m http.server 8000 --directory dist`; open http://localhost:8000.

## Backup
Untouched original ZIP: `Driving_Lab_v014A52_Seat_Adjustment_All_In_One(1).zip` (kept separate).
