#!/usr/bin/env python3
"""Read-only inspection of Review08. No game files are changed."""
import json,hashlib,zipfile,pathlib,struct,math,statistics,argparse
parser=argparse.ArgumentParser();parser.add_argument('root',type=pathlib.Path);parser.add_argument('prior_zip',type=pathlib.Path);parser.add_argument('out',type=pathlib.Path);args=parser.parse_args()
ROOT=args.root; OUT=args.out; OUT.mkdir(parents=True,exist_ok=True)
load=lambda p:json.loads((ROOT/p).read_text())
def digest(data):return hashlib.sha256(data).hexdigest()
m=load('PACKAGE-MANIFEST.json');fail=[]
for name,item in m['files'].items():
 p=ROOT/name
 if not p.exists() or p.stat().st_size!=item['bytes'] or digest(p.read_bytes())!=item['sha256']:fail.append(name)
inputs=load('director-kit/production/evidence/Review08-final/build-inputs.json')['inputs']
input_bad=[n for n,h in inputs.items() if not (ROOT/n).exists() or digest((ROOT/n).read_bytes())!=h]
protected=load('director-kit/production/evidence/P04B1/protected-baseline.json');comparison={'compared':0,'missing_in_package':[],'different':[],'baseline_hash_different':[]}
with zipfile.ZipFile(args.prior_zip) as prior:
 for n,h in protected.items():
  if not (ROOT/n).exists() or n not in prior.namelist():comparison['missing_in_package'].append(n);continue
  comparison['compared']+=1
  if (ROOT/n).read_bytes()!=prior.read(n):comparison['different'].append(n)
  if digest((ROOT/n).read_bytes())!=h:comparison['baseline_hash_different'].append(n)
b=(ROOT/'public/assets/products/tricled-sm133-base.glb').read_bytes();j=json.loads(b[20:20+struct.unpack_from('<I',b,12)[0]])
primitives=[p for mesh in j['meshes'] for p in mesh['primitives']]
census={'bytes':len(b),'triangles':sum(j['accessors'][p['indices']]['count']//3 if 'indices'in p else j['accessors'][p['attributes']['POSITION']]['count']//3 for p in primitives),'primitives':len(primitives),'materials':len(j.get('materials',[])),'images':len(j.get('images',[])),'sha256':digest(b)}
night=load('director-kit/production/evidence/Review08-final/night-timeline.json');day=load('director-kit/production/evidence/Review08-final/day-timeline.json')
trajectory={'day_rows':len(day),'night_rows':len(night),'all_telemetry_equal':len(day)==len(night) and all(a['telemetry']==b['telemetry'] for a,b in zip(day,night)),'night_equipped_every_row':all(r['product']['equipped'] for r in night),'day_stock_every_row':all(not r['product']['equipped'] for r in day),'maximum_mph':max(r['telemetry']['speed'] for r in night)*2.2369362920544}
route=load('public/assets/harbor/route.json');changes=[];last=None
for r in night:
 p=r['telemetry']['position'];near=sorted((math.hypot(l['position'][0]-p['x'],l['position'][2]-p['z']),i) for i,l in enumerate(route['lamps']))[:4]
 count=sum(d<55 for d,i in near)
 if count!=last:changes.append({'logical_seconds':r['time'],'physics_ticks':r['ticks'],'active_practicals':count,'nearest_distances_m':[round(d,4) for d,i in near],'position':p});last=count
profile=load('director-kit/production/evidence/Review08-profile/profile.json');runs=[]
for r in profile['runs']:
 frames=r['final']['frameTimes'][len(r['initial']['frameTimes']):];before=0;stalls=[]
 for i,f in enumerate(frames):
  if f>50:stalls.append({'sample_index':i,'interval_ms':f,'elapsed_before_seconds':before/1000,'elapsed_after_seconds':(before+f)/1000})
  before+=f
 runs.append({'equipped':r['equipped'],'elapsed_seconds':r['elapsedSeconds'],'count':len(frames),'mean_ms':statistics.mean(frames),'max_ms':max(frames),'intervals_above_50ms':stalls,'starting_ticks':r['initial']['ticks'],'finishing_ticks':r['final']['ticks'],'renderer':r['final']['renderer']})
light={'width_m':.035,'height_m':1.3,'default_intensity':.6*14,'default_power_per_light_lm':.6*14*.035*1.3*math.pi,'default_total_lm':2*.6*14*.035*1.3*math.pi,'capture_intensity':.7*14,'capture_total_lm':2*.7*14*.035*1.3*math.pi,'qualification':'This is the Three.js power getter applied to code parameters, not measured real-product lumens; RGB/rendering can further change apparent luminance. Light normals from -Z rotated -pi/2 around X face -Y as intended.'}
result={'runtime_commit':m['runtimeCommit'],'manifest':{'checked':len(m['files']),'mismatches':fail},'capture_inputs':{'checked':len(inputs),'mismatches':input_bad},'protected_vs_review07':comparison,'accessory':census,'trajectory':trajectory,'profile':runs,'practical_visibility_from_recorded_trajectory':changes,'light_parameter_analysis':light,'limits':'Read-only analysis, no full-game render or hardware repro. Count-transition timing uses a separate controlled recorded trajectory, not the exact wall-clock pose at the stall. A shader compilation hypothesis remains unconfirmed until isolated profiling.'}
(OUT/'independent-inspection.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({**result,'practical_visibility_from_recorded_trajectory':changes[:8]},indent=2))
