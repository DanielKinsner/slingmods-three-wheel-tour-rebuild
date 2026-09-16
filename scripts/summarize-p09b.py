"""Collect existing evidence; does not replace or filter native samples."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
E = ROOT / 'director-kit/production/evidence/P09B'
RUNTIME = 'bf1297c9770357cf5a331288b14cae82d5510d86'
load = lambda p: json.loads(p.read_text(encoding='utf-8-sig'))
cases = []
for width in [1280, 1920]:
    for route in ['harbor', 'express']:
        for equipment in ['stock', 'equipped']:
            folder = f'native-{width}-{route}-{equipment}-final-01'
            report = load(E/folder/'summary.json')
            assert len(report['attempts']) == 2 and report['overflow'] == 0
            assert not report['errors']
            assert all(a['result']['valid'] and all(f['status']=='finished' for f in a['allFinishers']) for a in report['attempts'])
            cases.append({'path':folder+'/summary.json', **report})
extras = []
for p in sorted(E.glob('native-extra-*/summary.json')):
    extras.append({'path':p.relative_to(E).as_posix(), **load(p)})
passed = sum(a['pass'] for c in cases for a in c['attempts'])
over = sum(a['activeOver100Ms'] for c in cases for a in c['attempts'])
native = {'pass':passed==16, 'passingAttempts':passed, 'totalAttempts':16,
          'activeFramesOver100Ms':over, 'cases':cases, 'additionalCases':extras}
(E/'native-matrix.json').write_text(json.dumps(native,indent=2)+'\n',encoding='utf-8',newline='\n')
remote = load(E/'remote-recovery/verification.json')
receipt = {'schemaVersion':1,'assignment':'P09B Signature Finish','branch':'main',
    'runtimeCommit':RUNTIME,'mergedMainCommit':'ea58b4f9c1df98ab16629bce24721596b6a43e32',
    'remote':'https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild.git',
    'functionalPass':True,'sourceTests':{'passed':226,'failed':0},'builds':['release PASS','static-demo PASS'],
    'remoteRecovery':remote,'nativePerformance':native,
    'additionalCockpitPass':bool(extras) and all(a['pass'] for c in extras for a in c['attempts']),
    'diagnosticTrace':'director-kit/production/evidence/P09B/diagnostic-trace-01/chrome-trace.json.gz',
    'functionalEvidence':['integration-final-03','career-loop-final-01','preparation-final-02','demo-final-01','finish-wait-review-03','ui-validation-02','ui-scaling-02','audio/browser-03'],
    'film':load(E/'film-03/FILM-VERIFICATION.json'),
    'engineAB':load(E/'audio/engine-ab-03/level-matching.json'),
    'audioGeneration':{'apiCalls':0,'generatedSeconds':0,'spending':0,'method':'Local original synthesis and supplied owner recording; no verified prepaid allowance/key available.'},
    'preserved':'Sport v2 physics, current owner front/hoop/showroom art, routes/collision, rival identities, ownership, schema4 saves and prepared-demo isolation.',
    'limitations':['No G3/G4, final OEM fidelity, human listening, physical-device/controller or release approval.','Engine source is authored approximation plus narrow estimated-RPM owner texture; measured multi-RPM stock/Thermal recordings missing.','Remote recovery and native timing are same-host Chromium/RTX4080, not destination hardware certification.','Cross-document preparation can produce brief audio silence.','Native browser zoom is not certified;125/150 percent checks use effective viewport/DPR.']}
if passed !=16: receipt['limitations'].append('Native performance HOLD: see complete unchanged timing matrix and diagnosis.')
(ROOT/'handoff/P09B-VALIDATION.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8',newline='\n')
lines=['# P09B native performance','',f'Final matrix: **{passed}/16 passing attempts**, {over} active intervals over100ms. Every attempt and every raw row is retained.','',
'| Viewport | Route | Build | Attempt | p95 ms | p99 ms | Max ms | >100 ms | Result |','|---|---|---|---:|---:|---:|---:|---:|---|']
for c in cases:
    for a in c['attempts']:
        lines.append(f"| {c['width']} | {c['route']} | {'equipped' if c['equipped'] else 'stock'} | {a['attempt']} | {a['p95Ms']:.2f} | {a['p99Ms']:.2f} | {a['maxMs']:.2f} | {a['activeOver100Ms']} | {'PASS' if a['pass'] else 'HOLD'} |")
lines += ['', '## Method and attribution','',
'Windows / Intel i9-12900K / NVIDIA RTX4080, Chromium153.0.8010.12 ANGLE D3D11, DPR1. 720p uses the existing low quality preset;1080p uses standard, unchanged from prior matrix conventions. Native wall-clock RAF; complete real races with all three rivals and valid production gates, control-only evidence driver. First attempt and retry both included. Actual audio graph enabled; host output muted. No screenshot/video/trace capture during scored races. No unrelated processes stopped. Runtime '+RUNTIME+'. Packaging/docs commits do not change runtime inputs.',
'', 'Thresholds: p95<=20ms, p99<=33.4ms, maximum active interval<=100ms;1e-6ms numeric tolerance only. No spike exclusion or overflow. run.json retains ready/loading/countdown/results rows as well as scored running rows. Functional controlled-clock tests and instrumented traces never count as native performance.',
'', '## Baseline and bounded changes','',
'Current-art P09A baseline55ea675 was measured separately at1080p Express stock, two full races, both passing (p95~16.7/16.8,p99~16.8,max16.8/33.4ms). That is one matched baseline configuration, not a fresh eight-case baseline. It did not reproduce every historical Review17 stall. Presentation telemetry now reuses storage, and numerical HUD writes use cached nodes/diffed text at10Hz. Existing order/menu caches were already present. Display uploads are changed-value/visible-only at<=10Hz; selected-build thumbnail is captured only on build changes. Audio banks decode once per document and one-shot concurrency is capped at8. These reduce specific work; they do not prove that every historical stall was GC or host contention.',
'', '## Resources and feature costs','',
'preparation-final-02 proves four transitions and stable repeated Express173geometry/72texture and Harbor309geometry/81texture counts, one reachable active AudioContext per scene. These are renderer resource counts, not measured VRAM. Additional native cockpit and instrumented diagnostic cases are recorded in native-matrix.json and DIAGNOSTIC.md where available. GPU work cannot be separated into actual GPU execution time using CPU submission timings alone.']
for c in extras:
    lines += ['', 'Additional '+c['path']+': '+', '.join(f"attempt{a['attempt']} p95={a['p95Ms']:.2f}, p99={a['p99Ms']:.2f}, max={a['maxMs']:.2f}ms {'PASS' if a['pass'] else 'HOLD'}" for a in c['attempts'])]
(E/'PERFORMANCE.md').write_text('\n'.join(lines)+'\n',encoding='utf-8',newline='\n')
print(json.dumps({'passingAttempts':passed,'totalAttempts':16,'over100':over}))
