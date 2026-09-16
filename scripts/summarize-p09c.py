"""Summarize retained P09C evidence without filtering or rewriting native rows."""
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[1]
E=ROOT/'director-kit/production/evidence/P09C'
RUNTIME='5b2c99af2c567c04b5ea9d896765e7a6ddeec25e'
load=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
cases=[]
for width in [1280,1920]:
 for route in ['harbor','express']:
  for equipment in ['stock','equipped']:
   folder=f'native-{width}-{route}-{equipment}-final-01'
   report=load(E/folder/'summary.json')
   assert len(report['attempts'])==2 and report['overflow']==0 and not report['errors']
   assert all(a['result']['valid'] and all(f['status']=='finished' for f in a['allFinishers']) for a in report['attempts'])
   cases.append({'path':folder+'/summary.json',**report})
extras=[{'path':p.relative_to(E).as_posix(),**load(p)} for p in sorted(E.glob('native-extra-*/summary.json'))]
passed=sum(a['pass'] for c in cases for a in c['attempts'])
over=sum(a['activeOver100Ms'] for c in cases for a in c['attempts'])
native={'pass':passed==16,'passingAttempts':passed,'totalAttempts':16,'activeFramesOver100Ms':over,'cases':cases,'additionalCases':extras}
(E/'native-matrix.json').write_text(json.dumps(native,indent=2)+'\n',encoding='utf-8',newline='\n')
functional=['profile-entry-final-01','signature-integration-final-01','preparation-final-01','career-loop-final-01','ui-final-01','audio-final-03','finish-wait-final-04']
for folder in functional:
 report=load(E/folder/'verification.json');assert report.get('pass') is True or report.get('status')=='PASS',folder
remote=load(E/'remote-recovery/verification.json')
hosted=load(E/'hosted-final-01/verification.json')
receipt={'schemaVersion':1,'assignment':'P09C Freedom to Drive','branch':'main','runtimeCommit':RUNTIME,
 'remote':'https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild.git','repositoryVisibility':'PUBLIC',
 'functionalPass':True,'sourceTests':{'passed':250,'failed':0},'builds':['normal PASS','curated demo PASS','curated Vercel stage PASS'],
 'functionalEvidence':functional,'motion':load(E/'motion-final/summary.json'),'historicalV2':load(E/'historical-v2/verification.json'),
 'nativePerformance':native,'additionalCockpitPass':len(extras)>=2 and all(a['pass'] for c in extras for a in c['attempts']),
 'remoteRecovery':remote,'hosted':{'pass':hosted['pass'],'base':hosted['base'],'build':hosted['states']['provenance'],'evidence':'hosted-final-01/verification.json'},
 'film':load(E/'film-03/FILM-VERIFICATION.json'),'preservedAssets':'handoff/P09C-REQUIRED-ASSETS.json',
 'limitations':['Human driving enjoyment/listening, physical controllers, destination hardware, G3/G4 and final OEM fidelity remain unverified.',
 'Browser/Node derived-math differences below2e-11 are disclosed in matched capture comparison; bitwise equivalence is claimed only for retained v2 within its exact Node baseline test.',
 'Current-copy creates a session draft while preserving the original saved recipe; use Save build to retain the updated recipe as a named durable build.',
 'Engine/audio sources are unchanged from Review18; measured multi-RPM stock/Thermal recordings remain unavailable.',
 'Remote recovery uses a fresh network checkout on this same Windows host, sharing installed tools/package/browser caches; not another-machine hardware certification.',
 'Cross-document navigation can briefly interrupt audio; data, supported products and selected build are preserved.']}
if passed!=16:receipt['limitations'].append('Native performance HOLD: complete unfiltered matrix records the failing intervals.')
(ROOT/'handoff/P09C-VALIDATION.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8',newline='\n')
lines=['# P09C native performance','',f'**{passed}/16 matrix attempts pass**, with {over} active intervals over100ms. Every raw row is retained.','',
 '| Viewport | Route | Build | Attempt | p95 ms | p99 ms | Max ms | >100 ms | Result |','|---|---|---|---:|---:|---:|---:|---:|---|']
for c in cases+extras:
 for a in c['attempts']:lines.append(f"| {c['width']} {c['view']} | {c['route']} | {'equipped' if c['equipped'] else 'stock'} | {a['attempt']} | {a['p95Ms']:.2f} | {a['p99Ms']:.2f} | {a['maxMs']:.2f} | {a['activeOver100Ms']} | {'PASS' if a['pass'] else 'HOLD'} |")
lines+=['','## Method','',
 'Windows11 Pro26200, i9-12900K16cores/24threads, RTX4080 driver32.0.16.1692. Hardware inventory and separate actual browser-backend probe retained. Each run records its browser version and runtime. 720p low /1080p standard, DPR1, same quality choices as Review18. Native wall-clock RAF, real control-only player input and shared-physics rivals/gates. Actual audio graph enabled; host output muted. No video, screenshots or tracing during scored races. No unrelated user jobs stopped.',
 '', 'Thresholds unchanged: p95<=20ms, p99<=33.4ms, max active interval<=100ms,1e-6ms numeric tolerance. All phase2/running rows for the corresponding attempt are scored; startup/countdown/results remain in full run.json. No outlier exclusions or overflow. CPU render-submission time is not actual GPU execution time.',
 '', 'Runtime '+RUNTIME+'. Later evidence/docs/ZIP commits do not change the game source/assets. Fresh-remote checks are separate. Passing current samples do not explain away every historical spike or guarantee other hardware.',
 '', 'Rivals and player use the same current profile. The native test driver uses ordinary inverse-mapped controls and real gates; no outcome or body transforms. The special first-finisher planner is confined to its separate controlled-clock functional regression and is not used in this native matrix.']
(E/'PERFORMANCE.md').write_text('\n'.join(lines)+'\n',encoding='utf-8',newline='\n')
summary=f'''# Astra Review19 — Freedom to Drive

## Play

- Local: http://127.0.0.1:5197/ (launch from the recovered checkout using HANDOFF.md).
- Verified hosted root: {hosted['base']}/. Exact checked deployment/build is in handoff/P09C-VALIDATION.json; archive-addition and later receipt commits are separate.
- Tested game source: `{RUNTIME}` on main. Complete source,128 required runtime/editable assets and raw evidence are recoverable from Git. This ZIP is a review packet, not the game distribution.
- Film: media/P09C-Freedom-to-Drive.mp4 — approximately three minutes, continuous matched comparisons and current gameplay with captured game master audio.

## Visible result

Sport v3 has more useful steering reserve, a smoother response and steering that remains available under braking. Fresh builds and new ordinary entries consistently use v3. Historical recipes retain v1/v2; Build Presets → Use current driving makes an updated draft and preserves the original. Save build retains the new version under a name. In-progress events/Cups stay frozen; ownership, credits, receipts and historical best-time provenance survive.

Review18's UI, action sounds, powered dashboard, Thermal departure, showroom/floor/closed bay, front and hoop refinements, paint/accent behavior and five freely previewable products are retained. No new vehicle, destination, product or audio generation.

## Proof

- 250 source tests pass; normal, curated and Vercel output builds pass.
- Matched50mph/90m and65mph/150m sweepers pass both directions for8 scored seconds. V3 RMS0.963/1.105m, peak<=1.316m, no brake required. Average steering demand66–72%. At65mph the same v2 protocol has5.573m RMS/7.246m peak. The50mph v2 case already passed; v3 adds command headroom there.
- V2 straight stopping retained:36.032m from60mph,116.366m from110mph;0–60 remains4.733333s. Historical v2 full telemetry matches the original source in3,600 ticks. V3 stock/removed/street setup equivalence, combined force bounds, transitions,110mph lane changes, reverse and actual severe-curb overturn/recovery are tested.
- Actual browser entry/profile matrix, complete earned chapter/Cup, purchases/removal/reload, preparation failure/retry, display/Thermal/audio and finish-before-rivals pause/resume pass. Original failed tests and tuning candidates are retained and explained.
- Native performance: **{passed}/16 matrix attempts pass**, {over} active intervals over100ms; two additional cockpit checks: **{'PASS' if receipt['additionalCockpitPass'] else 'HOLD'}**. Same sample rules and thresholds as Review18, no concurrent capture/trace.
- Fresh remote recovery: **{'PASS' if remote['pass'] else 'HOLD'}**. Actual hosted-root gameplay: **{'PASS' if hosted['pass'] else 'HOLD'}**. See complete receipts for checked identities and HTTP/media behavior.

## Review focus and limits

Judge ordinary steering and brake-turn freedom in the film and playable build, then try the new tune from a historical saved build. An endpoint screenshot can hide the old curve oscillation; use the continuous take and scored RMS/peak. Numerical data is in verification/P09C-complete-data.tar.xz with a complete original/extracted hash map.

The film uses a disclosed control-only driver for comparisons/racing, actual keyboard for free driving, and explicit restart; it does not fake a filmed rollover. Source tests cover the actual stress-case overturn/recovery. Human driving enjoyment/listening, physical controllers, destination-hardware behavior, G3/G4 and final OEM fidelity remain open. Current engine sources are unchanged; no new engine A/B is required for this driving-only pass.

Next action: Astra review of this packet and owner driving feedback. Do not restart an older phase or invent a further assignment.
'''
(E/'REVIEW19-SUMMARY.md').write_text(summary,encoding='utf-8',newline='\n')
print(json.dumps({'passingAttempts':passed,'totalAttempts':16,'over100':over,'cockpit':receipt['additionalCockpitPass']}))
