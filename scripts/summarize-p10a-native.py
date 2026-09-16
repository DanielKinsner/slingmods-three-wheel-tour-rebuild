"""Summarize every final native run without dropping failed rows or relaxing thresholds."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1];e=root/'director-kit/production/evidence/P10A';names=[]
for width in [1280,1920]:
 for light in ['day','night']:
  for build in ['stock','equipped']:names.append(f'native-{width}-ridge-{light}-{build}-final-01')
names += ['native-1920-ridge-night-cockpit-final-01','native-1920-harbor-equipped-final-01','native-1920-express-equipped-final-01']
runs=[]
for name in names:
 p=e/name/'summary.json';s=json.loads(p.read_text(encoding='utf-8'));raw=json.loads((p.parent/'run.json').read_text(encoding='utf-8'));s['directory']=name;s['renderer']=raw['initial']['renderer'];s['actualAudioEnabled']=raw['initial']['audio']['enabled'];s['cameraStates']=[v['data']['state']for v in raw['profile']['events']if v['event']=='phase-camera'];runs.append(s)
 if 'cockpit' in name:assert all(f'running/{i}/cockpit' in s['cameraStates']for i in [1,2]) and all(v.endswith('/cockpit')for v in s['cameraStates']if v.startswith('running/'))
assert all('4080' in s['renderer'] and 'ANGLE' in s['renderer'] for s in runs), 'Unexpected renderer: keep evidence and qualify host lane'
assert all(len(s['attempts'])==2 and not s['errors'] and s['overflow']==0 and s['actualAudioEnabled'] for s in runs)
assert all(a['pass'] and a['result']['valid'] and all(v['status']=='finished'for v in a['allFinishers']) for s in runs for a in s['attempts'])
result={'pass':True,'runs':runs,'host':json.loads((e/'regression-final/host.json').read_text(encoding='utf-8')),'attempts':sum(len(s['attempts'])for s in runs),'runtime':'28daf3a4dfb702e2b4829ffda683cffeb117c858','method':'All eleven configurations, two complete consecutive native races each. Unfiltered phase/tick data and retry epochs retained in each run.json and checkpoint.json. No capture, tracing, compression or other browser/Blender job during measurements. Audio graph enabled with host output muted. Numeric comparison tolerance 1e-6ms only.'}
(e/'native-matrix.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
lines=['# P10A native performance','',result['method'],'','Host: Windows 11 / i9-12900K / RTX4080 / 128GB; Chromium 153 ANGLE D3D11. These are same-host tests, not broad hardware qualification. Renderer string is retained for each run in native-matrix.json.','','| Configuration | Attempt | p95 ms | p99 ms | Max active ms | Result |','|---|---:|---:|---:|---:|---|']
for s in runs:
 for a in s['attempts']:lines.append(f"| {s['directory']} | {a['attempt']} | {a['p95Ms']:.3f} | {a['p99Ms']:.3f} | {a['maxMs']:.3f} | PASS, all four finish |")
lines += ['','Acceptance retained: p95<=20ms, p99<=33.4ms, max-active<=100ms. All 22 attempts pass. Frame pacing quantization near16.7ms is expected for the native 60 Hz lane. Loading/ready and instrumented lifecycle measurements are separate and not removed from their raw phase data.','','Geometry/texture/program counters are logical object counts, not GPU-memory estimates. The warm/cold preparation report uses a fresh browser HTTP context with existing OS/driver caches. No deliberate hardware-cache flush was performed. The film has capture overhead and is not a performance benchmark.']
(e/'PERFORMANCE.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(json.dumps({'pass':True,'attempts':result['attempts'],'maxP95':max(a['p95Ms']for s in runs for a in s['attempts']),'maxP99':max(a['p99Ms']for s in runs for a in s['attempts']),'maxFrame':max(a['maxMs']for s in runs for a in s['attempts'])},indent=2))
