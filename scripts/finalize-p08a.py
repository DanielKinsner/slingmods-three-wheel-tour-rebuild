from pathlib import Path
import hashlib,json,subprocess,datetime
root=Path(__file__).resolve().parents[1];e=root/'director-kit/production/evidence/P08A'
implementation='ec6876551542ec39111fbf26253c4528c2290cfc';baseline='ed363b28ec6ba933dd82c576153bd73c80ea6619';branch='feature/p08a-build-matters'
def read(path):return json.loads((root/path).read_text(encoding='utf-8-sig'))
def write(path,value):
 p=root/path;p.parent.mkdir(exist_ok=True,parents=True);p.write_text(json.dumps(value,indent=2)+'\n',encoding='utf-8')
native={name:read('director-kit/production/evidence/P08A/'+name+'/summary.json') for name in ['native-equipped1080-repeat','native-stock720-repeat','native-duel720']}
functional=read('director-kit/production/evidence/P08A/loop-final-02/verification.json');assert functional['pass']
physics=read('director-kit/production/evidence/P08A/physics-final/physics-verification.json');assert len(set(physics['hashes'].values()))==1
video=read('director-kit/production/evidence/P08A/film/video-verification.json');assert video['pass']
native_pass=all(row['pass'] for report in native.values() for row in report['attempts'])
pointer=read('demo-current.json')
validation={'schemaVersion':1,'assignment':'P08A Build Matters','implementationCommit':implementation,'baselineCommit':baseline,'branch':branch,'privateRepository':'https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild','status':'INTERNAL_VALIDATED_DIRECTOR_REVIEW_PENDING' if native_pass else 'IMPLEMENTED_PERFORMANCE_HOLD_DIRECTOR_REVIEW_PENDING','tests':{'passed':144,'failed':0},'builds':{'normal':'PASS','demo':'PASS','output':pointer},'functional':{'pass':True,'evidence':'director-kit/production/evidence/P08A/loop-final-02','steps':functional['steps'],'earnedBalance':functional['final']['credits']},'physics':physics,'performance':native,'film':video,'independentReview':'director-kit/production/evidence/P08A/independent-review-final.md','knownLimits':['Game damping coefficients and hardware shape are estimates; no manufacturer performance claim.','Hardware inspection temporarily hides body and is labeled. Existing rear raycast/linkage approximation retained.','Historical repeat slowdown cause remains unknown. New runs do not diagnose old failures.','G3/G4, global fidelity, physical controllers/mobile/broad GPUs, human fun/listening and authentic exhaust remain held.','Public hosting is pending, not a P08A development blocker. No release or publication approved.'],'nextAction':'Director review of Astra-Review-15-Lean.zip and feature branch. Do not merge into main or publish before explicit approval.'}
write('handoff/P08A-VALIDATION.json',validation)
prefix=f'''# Current handoff — P08A Build Matters / Review15

## Resume here

Private repository: https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild
Feature branch: **{branch}**. Pushed implementation SHA: **{implementation}**. This is the exact game source used by the versioned candidate and final runtime validation. Later review-tooling/evidence/handoff commits do not change those game bytes; obtain the latest pushed branch tip with `git ls-remote origin refs/heads/{branch}`. Baseline main at assignment start: `{baseline}`. No force push or merge into main.

P08A implements a new one-lap Maya duel connecting the existing solo time trial and existing three-rival/two-lap crew race, distinct rewards, skippable dialogue, and verified SM-3223 suspension ownership/install/setup/removal. Career schema3 retains earlier progress and crew access. The prepared demo remains separate and keeps easy-entry crew racing. See handoff/P08A-DESIGN.md and handoff/P08A-VALIDATION.json for precise behavior, formulas, evidence and known limits. Review15 ZIP is a lean review packet; the full playable assets are recovered from Git.

## Cross-machine commands

Discover the actual checkout and preserve local changes before switching. For a fresh machine:

```text
git clone --branch {branch} https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild.git
cd slingmods-three-wheel-tour-rebuild
git status --short
git log -1 --oneline
python handoff/verify-p08a.py
npm ci
npm test
npm run build
npm run demo:build
npm run demo:preview
```

Open http://127.0.0.1:5188/. Choose **Continue Career** for Build Matters, or **Race the Harbor** for the preserved prepared demonstration. Close/reopen the browser at the same origin to retain the real career. Browser saves do not transfer through Git; included earned fixtures are isolated test data. A fresh clone needs no original-machine tools or copied node_modules. The old P07B CURRENT-INPUTS receipt is historical; use the new P08A verifier for this expansion.

Required binaries remain ordinary Git blobs, without LFS. `handoff/P08A-INPUTS.json` inventories all current source/tests/tooling/assets/public inputs. `demo-assets.json` declares runtime closure. New editable product: `assets/blender/products/ddmworks-sm3223-silver.blend`; new runtime model: `public/assets/products/ddmworks-sm3223-silver.glb`. Existing car, rear, driver, Harbor, world materials, branding, audio and original .blend sources remain tracked and unchanged. No re-export is needed to play.

Optional authoring, only for an authorized product edit: locate Blender4.5.2 on PATH or supply its path; run `blender --background --python scripts/build-p08a-suspension.py`. The script reads the accepted car source and writes only the separate product source/export. Do not rerun historical world/car generators. Headless browser tools: `npx playwright install chromium`.

Exact bounded checks (PowerShell; choose a NEW output folder each run):

```powershell
$env:EVIDENCE_DIR='director-kit/production/evidence/P08A/new-physics'
npx tsx scripts/verify-p08a-physics.ts
$env:BASE_URL='http://127.0.0.1:5188'
$env:EVIDENCE_DIR='director-kit/production/evidence/P08A/new-loop'
node scripts/validate-p08a-loop.mjs
$env:FIXTURE='director-kit/production/evidence/P08A/new-loop/earned-career.json'
$env:EVIDENCE_DIR='director-kit/production/evidence/P08A/new-native'
$env:WIDTH='1920'
$env:RACES='2'
$env:SUSPENSION='equipped'
Remove-Item Env:EVENT -ErrorAction SilentlyContinue
node scripts/profile-p08a.mjs
$env:EVIDENCE_DIR='director-kit/production/evidence/P08A/new-stock720'
$env:WIDTH='1280'
$env:SUSPENSION='stock'
node scripts/profile-p08a.mjs
$env:EVIDENCE_DIR='director-kit/production/evidence/P08A/new-duel720'
$env:RACES='1'
$env:SUSPENSION='equipped'
$env:EVENT='duel'
node scripts/profile-p08a.mjs
```

Controlled functional clock is not performance proof. Profile native runs separately with no concurrent recording, Blender, builds or tests. Film reproduction: use fresh EVIDENCE_DIR then `node scripts/record-p08a.mjs`; FFmpeg on PATH is needed for the final excerpt film. It is a silent capture explicitly labeled automated gameplay, not a listening evaluation.

## Results and next action

144 tests pass; normal/demo builds pass; final fresh-career chapter/retry/reload/demo-isolation loop passes. Four 4,200-row traces (accepted baseline/new stock/street/removed) are identical. Native performance status: **{'all measured active-race attempts pass retained thresholds' if native_pass else 'HOLD — inspect individual summaries; no broad performance claim'}**. The independent delivery reviewer recomputed all five attempts from raw samples. Initial ready-phase stalls of 183.4–200 ms remain in the raw data; this is no all-phase performance pass. See individual raw attempts in P08A-VALIDATION.json and independent-delivery-review.md. These are this host's observations, not destination-machine or hardware certification.

Local final candidate in this checkout is served at http://127.0.0.1:5195/ by owned PID28588; stop only that owned server with `Stop-Process -Id 28588` if it still exists and matches `scripts/serve-demo.mjs`. PIDs and local build outputs do not transfer. Fresh-machine commands above create a new output identity.

**Next action: director review of Astra-Review-15-Lean.zip and `{branch}`.** Do not merge into main, deploy, spend or claim G3/G4/final fidelity/hardware/release approval. P07B preflight/recovery was already complete; public hosting remains pending and is not a blocker for this completed development assignment. Historical evidence and original reviewed demo media/output records remain intact.

---

# Historical handoffs below — P08A directive above supersedes only its bounded expansion

'''
handoff=root/'HANDOFF.md';old=handoff.read_bytes();assert not old.startswith(b'# Current handoff \xe2\x80\x94 P08A');handoff.write_bytes(prefix.encode('utf-8')+old)
for name in ['RESUME.md','AUTONOMOUS_RESUME.md','DEPLOYMENT-READINESS.md']:
 p=root/name;p.write_bytes(f'''# Current pointer — P08A Build Matters / Review15

Read HANDOFF.md and handoff/P08A-VALIDATION.json. The current private feature branch is `{branch}`, with tested game implementation `{implementation}`. Use `python handoff/verify-p08a.py` for current inputs. P08A is complete for director review; no merge into main or publication is approved. P07B preflight/recovery below is historical and already complete. Hosting remains pending and does not block P08A. Preserve all current work and held G3/G4, fidelity, hardware and release gates.

---

# Historical record below

'''.encode('utf-8')+p.read_bytes())
agents=root/'AGENTS.md';agents.write_bytes(f'''# Current return point — P08A Build Matters / Review15

Dan's 2026-09-15 directive authorizes the bounded builder-racer expansion and ordinary feature-branch commits/push. Read HANDOFF.md, handoff/P08A-DESIGN.md and handoff/P08A-VALIDATION.json. Preserve the implementation and historical evidence; no automatic new assignment. Branch {branch}; game implementation {implementation}. No merge to main, deployment, spending, desktop takeover, account/site changes or G3/G4/final fidelity/hardware/release approval. Public hosting remains pending and is not a development blocker. One lead and one bounded independent reviewer; isolated browser tests and background Blender only. Older restriction headers below are historical and superseded only within P08A.

---

'''.encode()+agents.read_bytes())
state=read('director-kit/production/state.json');state.update(as_of=datetime.datetime.now(datetime.timezone.utc).isoformat(),branch=branch,commit=implementation,current_packet='P08A Build Matters',next_action=validation['nextAction']);state['commit_meaning']='Exact P08A implementation used by the versioned local candidate and final tests. Later evidence/tooling/handoff commits do not change game source. P07B remote recovery is historical, not rerun as P08A.';state['p08a']={k:validation[k] for k in ['status','implementationCommit','functional','independentReview','knownLimits']};state['verification']={'tests':'144/144 PASS','builds':'normal/demo PASS','browser':'fresh-career complete chapter, retry/reload and separate demo PASS','physics':'4 x4200 telemetry rows identical against accepted baseline','performance':'individual native summaries in handoff/P08A-VALIDATION.json','evidence':'production/evidence/P08A'};state['blockers']=['G3/G4, global fidelity and physical/human approval remain held.','Publication remains pending and is not a P08A development blocker.','Historical repeat slowdown cause remains unknown.'];write('director-kit/production/state.json',state)
# New manifest leaves the old P07B evidence untouched.
paths=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard'],cwd=root,text=True).splitlines();files={}
for name in sorted(set(paths)):
 if not (name.startswith(('src/','tests/','scripts/','assets/','public/')) or name in ['package.json','package-lock.json','tsconfig.json','vite.config.ts','index.html','demo-assets.json','handoff/verify-p08a.py']):continue
 p=root/name
 if not p.is_file():continue
 data=p.read_bytes();row={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
 if p.suffix in ['.ts','.mjs','.json','.md','.py','.ps1','.css','.html','.txt']:
  try:data.decode('utf-8');row['normalizedLFSHA256']=hashlib.sha256(data.replace(b'\r\n',b'\n')).hexdigest()
  except UnicodeDecodeError:pass
 files[name]=row
write('handoff/P08A-INPUTS.json',{'schemaVersion':1,'implementationCommit':implementation,'scope':'All current source/tests/scripts/runtime/editable assets, retaining original source inputs. Only UTF8 CRLF/LF normalization allowed for declared text; binaries exact.','files':files})
print(json.dumps({'validation':validation['status'],'inputFiles':len(files),'nativePass':native_pass}))
