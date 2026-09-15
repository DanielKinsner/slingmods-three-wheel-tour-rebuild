"""Assemble a lean review from explicit current evidence; never deletes prior reviews."""
from pathlib import Path
import hashlib,json,zipfile,subprocess,datetime
root=Path(__file__).resolve().parents[1]
evidence=root/'director-kit/production/evidence/P08A'
target=root/'Astra-Review-15-Lean.zip'
if target.exists():raise SystemExit('Refusing to overwrite an existing Review15 ZIP')
files={}
def add(path,arc=None):
 p=root/path
 if not p.is_file():raise RuntimeError('Missing review input '+str(p))
 files[arc or path]=p
for name in ['RESUME.md','AUTONOMOUS_RESUME.md','DEPLOYMENT-READINESS.md']:add(name)
for name in ['HANDOFF.md','AGENTS.md','handoff/P08A-DESIGN.md','handoff/P08A-VALIDATION.json','handoff/P08A-INPUTS.json','handoff/verify-p08a.py','handoff/P07B-VALIDATION.json','director-kit/production/state.json','director-kit/director-addenda/review-14/AUDIT.md','package.json','package-lock.json','tsconfig.json','vite.config.ts','index.html','demo-assets.json']:
 add(name)
for folder in ['src','tests']:
 for p in (root/folder).rglob('*'):
  if p.is_file():add(p.relative_to(root).as_posix())
for pattern in ['*p08a*','crew-evidence-agent.ts','crew-player-agent.ts','build-demo.mjs','serve-demo.mjs','static-demo.mjs','blender.ps1']:
 for p in (root/'scripts').glob(pattern):
  if p.is_file():add(p.relative_to(root).as_posix())
for name in ['assets/blender/products/ddmworks-sm3223-silver.blend','public/assets/products/ddmworks-sm3223-silver.glb','public/assets/harbor/route.json','public/assets/slingshot-contact-layout.json','public/assets/vehicles/slingshot-p04a1-rear-rig.json']:
 add(name)
for folder in ['loop-final-02','physics-final','native-equipped1080-repeat','native-stock720-repeat','native-duel720','hardware-views-final']:
 for p in (evidence/folder).rglob('*'):
  if p.is_file():add(p.relative_to(root).as_posix(),f'verification/{folder}/'+p.relative_to(evidence/folder).as_posix())
for name in ['independent-review-initial.md','independent-review-final.md','independent-delivery-review.md','tests-initial.log','tests-final-preflight.log','tests-final.log','build-final-preflight.log','demo-build-final.log','hardware-build.json','hardware-final.log','stock-hardware-inspection.json','preservation.json','new-blender-inspection.json','remote.json','machine.json']:
 add('director-kit/production/evidence/P08A/'+name,'verification/'+name)
for name in ['capture.json','edit-decisions.json','final.json','video-verification.json','Build-Matters-gameplay.mp4']:
 add('director-kit/production/evidence/P08A/film/'+name,('review-media/' if name.endswith('.mp4') else 'verification/film/')+name)
for folder in ['loop-01','loop-02','loop-final']:
 p=evidence/folder/'failure.json'
 if p.is_file():add(p.relative_to(root).as_posix(),'verification/retained-harness-failures/'+folder+'.json')
pointer=json.loads((root/'demo-current.json').read_text());add(pointer['output']+'/OUTPUT-MANIFEST.json','verification/OUTPUT-MANIFEST.json');add(pointer['output']+'/review-build.json','verification/review-build.json')
remote=json.loads((evidence/'remote.json').read_text());validation=json.loads((root/'handoff/P08A-VALIDATION.json').read_text())
intro=f'''# Astra Review15 — P08A Build Matters

## What became playable

The existing Harbor time trial and crew race are connected by a **new one-lap Maya duel**, distinct rewards and skippable dialogue. The verified **DDMWorks SM-3223 silver set of three** can be purchased, tuned, removed without losing ownership and reinstalled. The complete chapter survives retry and save/reload. Prepared demo state stays separate.

Existing time trial, crew simulation, vehicle/driver/world geometry and prior progress are retained. The stock equation path and accepted sampled telemetry are unchanged. No arbitrary grip/power bonuses or manufacturer performance claims.

## Identity and review entry

- Private repository: https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild
- Branch: **{remote['branch']}**
- Verified remote tip: **{remote['commit']}**
- Tested implementation/static runtime: **{validation['implementationCommit']}**
- Short film: `review-media/Build-Matters-gameplay.mp4` — silent native gameplay, real-speed excerpts, explicitly automated input. Full race/save evidence is separate.
- Start with `handoff/P08A-VALIDATION.json`, `handoff/P08A-DESIGN.md`, independent review, `verification/loop-final-02/verification.json`, then individual native summaries/raw runs.

This lean ZIP is a review packet, not the complete playable payload. Required large car/world/driver/textures/audio and their Blender sources remain in Git. `handoff/P08A-INPUTS.json` inventories recovery hashes, and `demo-assets.json` declares the current runtime closure. The new product .blend/.glb are included here. See HANDOFF.md for exact cross-machine commands.

## Evidence and limitations

144 tests passed. Four complete 4,200-tick traces compare accepted baseline, stock, installed street settings and removed suspension. Functional browser proof starts a fresh career and completes both new/existing events, upgrade, removal/reinstall, retry and reload; duplicate protection and storage failures have focused tests. Performance attempts are separately scored with full raw samples; consult their actual results and the validation receipt rather than assuming a universal frame rate.

The original historical performance failures remain in repository history. Their cause is still unknown. New observed passes do not diagnose that history. Hardware is an authored approximation; inspection views intentionally and visibly hide the body temporarily. Damping conversion is documented estimated simulation behavior, not manufacturer dyno data.

Public hosting remains pending and is not a P08A blocker. G3/G4, global car/world fidelity, hardware/mobile/controller certification, human fun/listening, authentic exhaust and release approval remain held. No spending, publication, account/site changes, force push or merge to main.
'''
extra={'REVIEW-ME-FIRST.md':intro.encode(),'REMOTE-IDENTITY.json':json.dumps(remote,indent=2).encode()}
inventory={}
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for arc,p in sorted(files.items()):
  data=p.read_bytes();z.writestr(arc,data);inventory[arc]={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
 for arc,data in extra.items():z.writestr(arc,data);inventory[arc]={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
 z.writestr('REVIEW-MANIFEST.json',json.dumps({'schemaVersion':1,'createdUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':inventory},indent=2))
assert target.stat().st_size<=100_000_000,'ZIP exceeds100MB'
with zipfile.ZipFile(target) as z:
 assert z.testzip() is None
 for arc,row in inventory.items():assert hashlib.sha256(z.read(arc)).hexdigest()==row['sha256']
result={'zip':str(target),'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'files':len(inventory)+1,'manifestVerified':True,'targetBytes':60_000_000,'maximumBytes':100_000_000}
(evidence/'zip-verification.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
