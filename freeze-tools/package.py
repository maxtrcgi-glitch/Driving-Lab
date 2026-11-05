import pathlib,subprocess,json,hashlib,zipfile,os
root=pathlib.Path.cwd(); out=root.parent/'release-output';out.mkdir(exist_ok=True)
sha='2cd72beceeddb2ada569bc9e7e69582f0c925cc8';tag='gameplay-baseline/v0.14A.5.2'
assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==sha
files=subprocess.check_output(['git','ls-files','-z']).decode().split('\0');files=[p for p in files if p]
hashes={p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in files}
expected=json.loads((root/'tests/fixtures/a52-dist.json').read_text())['files']
assert all(hashes['dist/'+n]==v for n,v in expected.items())
results=json.loads((root/'reports/current/results.json').read_text())['results'];assert len(results)==16 and all(r['status']=='PASS' for r in results)
browser=json.loads((root/'reports/browser/smoke.json').read_text());assert browser['status']=='PASS' and not browser['stub']
manifest={'version':'0.14A.5.2','commit':sha,'tag':tag,'files':hashes,'dist':expected,'scope':'251 tracked source files; manifest excludes itself and ZIP to avoid recursive hashes'}
(out/'A52_RELEASE_MANIFEST.json').write_text(json.dumps(manifest,indent=2)+'\n')
guide=f"""# A52 Recovery Guide
Stable commit: {sha}
Tag: {tag}

## Restore source (read only, no history rewriting)
git clone https://github.com/maxtrcgi-glitch/Driving-Lab.git
cd Driving-Lab
git checkout --detach {tag}
git rev-parse HEAD
The result must equal {sha}.
npm ci
npm run check:current
npx playwright install --with-deps --only-shell chromium
npm run check:browser
npm run check:static
python3 -m http.server 8000 --directory dist
Open http://localhost:8000 (file:// is unsupported).

Backup ZIP is an independent source snapshot without Git history. Extract it into a NEW directory.
Read A52_RELEASE_MANIFEST.json; compute SHA-256 for every files entry relative to that directory and require equality.
Run the same npm/test/HTTP commands; tag checkout applies only to the Git restore.
Do not merge an old source tree over a newer working tree.

## Git rollback
Prefer a new branch from the stable tag, then a reviewed PR restoring the desired stable files.
Do not force-push main, delete/move this tag or reset shared history.
Only Director may authorize merging a rollback PR.

## Published site rollback (a separate operation)
Main URL: https://max-driving-lab.maxtrcgi.chatgpt.site
Read-only Sites metadata checked before this freeze: published Site version 27.
Source handoff labels it A52; live deployed bytes have not been independently fully compared in this task.
The site and its deployment are not changed by checking out the Git tag.
After explicit Director authorization, restore the tagged source, verify all dist SHA-256 and current/browser tests, then use the existing Sites project appgprj_6ac3ab6964a8819180ced6a4738c6759 to save and deploy that exact dist.
Do not create a replacement site or publish experimental visual files.
Alternatively restore a previously saved verified Sites version using its actual version ID, after inspecting metadata; version numbers alone are not opaque version IDs.
Verify deployment completion, served version/resources and WebGL after any authorized publication.
Re-publishing or reverting the site always requires separate Director permission. Neither is performed here.

## Limits
Historical source-identity diagnostics remain FAIL (four known differences); current/browser/merge gate passed in CI run 42027051987.
Real software Chromium WebGL is tested; iPhone/Safari/PWA lifecycle, hardware FPS and visual acceptance are not proved.
Diagnostic screenshot capture may time out; JSON assertions are not screenshot proof.
"""
(out/'A52_RECOVERY_GUIDE.md').write_text(guide)
release=os.environ.get('RELEASE_URL','')
report=f"""# A52 Stable Release Report
Status: stable baseline, recovery verified.
Repository: https://github.com/maxtrcgi-glitch/Driving-Lab
Main and tag target SHA: {sha}
Annotated tag: {tag}
Release: {release}
Release assets: see this release's assets list; URLs are recorded in release-assets.json after upload.
Version: Driving Lab v0.14A.5.2 — Stable Baseline.
Includes Vehicle Physics/Steering, Highway World A51, Traffic AI/Continuity, DriverView Hybrid, Unified Chase Camera, Cockpit Seat Adjustment and persistence, integrated WebGL/PWA dist. Visual V1.3 not integrated.

Recovery: actions/checkout fetched the release tag from GitHub into a separate recovered/ directory (depth 1). HEAD equality checked; all {len(files)} source paths hashed; all {len(expected)} dist SHA-256 match the accepted A52 manifest. No existing local working tree was used.
npm ci: PASS.
npm run check:current: {len(results)}/16 PASS (all 12 original npm commands included).
npm run check:browser: PASS, real Chromium {browser['browser']}, WebGL2/SwiftShader, UI seat movement/reload/reset, zero critical JS/resource errors.
Historical source identities: known diagnostic FAIL; not a claim that all GitHub Actions are green.
Original mandatory CI: https://github.com/maxtrcgi-glitch/Driving-Lab/actions/runs/42027051987
Fresh recovery run: https://github.com/maxtrcgi-glitch/Driving-Lab/actions/runs/{os.environ['GITHUB_RUN_ID']}

Main site: https://max-driving-lab.maxtrcgi.chatgpt.site
Sites metadata: published version 27. No publication, rollback, main changes or gameplay edits performed.
See A52_RECOVERY_GUIDE.md for separate Git and deployment restoration procedures and Director approvals.
See A52_RELEASE_MANIFEST.json for exact source/dist hashes.
"""
(out/'A52_STABLE_RELEASE_REPORT.md').write_text(report)
with zipfile.ZipFile(out/'Driving_Lab_v014A52_Stable_Backup.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in files:z.write(root/p,p)
 for name in ['A52_RECOVERY_GUIDE.md','A52_RELEASE_MANIFEST.json']:z.write(out/name,name)
p=out/'Driving_Lab_v014A52_Stable_Backup.zip'
(out/'BACKUP_SHA256.txt').write_text(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n')
with zipfile.ZipFile(p) as z:assert z.testzip() is None
print(json.dumps({'sourceFiles':len(files),'distFiles':len(expected),'currentTests':len(results),'browser':'PASS','zipSHA256':hashlib.sha256(p.read_bytes()).hexdigest()}))
