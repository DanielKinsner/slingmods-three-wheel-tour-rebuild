from pathlib import Path
import json,math,hashlib
base=Path('director-kit/production/evidence/P06')
summary=[]
def stats(values):
 a=sorted(values)
 return {'count':len(a),'p50':a[math.ceil(len(a)*.5)-1],'p95':a[math.ceil(len(a)*.95)-1],'p99':a[math.ceil(len(a)*.99)-1],'max':max(a),'over33_4':sum(v>33.400001 for v in a),'over50':sum(v>50 for v in a),'over100':sum(v>100 for v in a)} if a else None
for directory in sorted(base.glob('verified-scored-*'))+[base/'stock720-followup',base/'heavy1080-followup']:
 path=directory/'run.json'
 if not path.exists():continue
 d=json.loads(path.read_text());p=d['profile'];rows=p['rows'];racing=[r for r in rows if r[10]==2];cost=p['crewCosts'];interval=stats([r[1] for r in racing]);allstats=stats([r[1] for r in rows]);assert p['overflow']==0;assert d['errors']==[];assert all(x['race']['playerResult']['valid'] for x in d['results']);assert len(d['attemptFinals'])==len(d['results']);assert all(x['status']=='finished' for a in d['attemptFinals'] for x in a['race']['standings']);assert p['worldSteps']==d['final']['ticks'];assert p['participants']==4
 timestamps=[abs(rows[i][0]-rows[i-1][0]-rows[i][1]) for i in range(1,len(rows))];assert max(timestamps,default=0)<.001
 outliers=[]
 prep=next(e for e in p['events'] if e['event']=='preparation-end')
 for i,r in enumerate(rows):
  if r[1]>100:
   startup=i==1 and r[4]==0 and r[10]==0 and rows[0][0]<prep['wall']
   outliers.append({'row':i,'data':r,'previousRAF':rows[max(0,i-1)][0],'previousRow':rows[max(0,i-1)],'clippedSimulationMs':max(0,r[1]-100)if r[10]==2 else 0,'preparationEndWall':prep['wall'],'preparationFirstRenderMs':next(x['ms']for x in p['preparation']['stages']if x['name']=='first-all-mesh-render'),'assessment':'Ready/startup interval; preceding RAF timestamp predates end of synchronous preparation render. Timing is consistent with that startup frame spanning warmup. No authoritative ticks or shader-count change; retained unmodified, not classified as a racing stall.' if startup else 'Requires additional investigation; do not discard.'})
 target=interval['p95']<=20 and interval['p99']<=33.4 and interval['over100']==0
 entry={'name':directory.name,'runtime':d['final']['commit'],'width':d['width'],'buffer':p['size'],'dpr':p['dpr'],'renderer':p['renderer'],'browser':d['browser'],'equipped':d['equipped'],'record':d['record'],'loadMs':p['loadMs'],'preparationMs':p['preparation']['ms'],'racingIntervals':interval,'allIntervals':allstats,'racingClippedSimulationMs':sum(max(0,r[1]-100)for r in racing),'targetMet':target,'outliersOver100':outliers,'results':[x['race']['playerResult']for x in d['results']],'finalField':d['final']['race']['standings'],'attemptFinalFields':[a['race']['standings']for a in d['attemptFinals']],'programCounts':sorted(set(r[6]for r in rows)),'residentSpots':sorted(set(r[7]for r in rows)),'residentAreas':sorted(set(r[8]for r in rows)),'worldSteps':p['worldSteps'],'worldStepsEqualSessionTicks':True,'cpuFrame':stats([r[2]for r in racing]),'renderSubmissionCPU':stats([r[3]for r in racing]),'controlCPUperRAF':stats([r[1]for r in cost]),'physicsCPUperRAF':stats([r[2]for r in cost]),'collectorCPU':stats([r[9]for r in rows]),'crewCollectorCPU':stats([r[9]for r in cost]),'driverCPU':stats(d['driverCosts']),'callsRange':[min(r[5]for r in cost),max(r[5]for r in cost)],'trianglesRange':[min(r[6]for r in cost),max(r[6]for r in cost)],'geometryCounts':sorted(set(r[7]for r in cost)),'textureCounts':sorted(set(r[8]for r in cost)),'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest()}
 summary.append(entry)
(base/'performance-summary.json').write_text(json.dumps({'method':'Fresh isolated Windows Chromium D3D11 RTX4080, native RAF, DPR1, actual buffers, stable standard quality. Audio graph active; commandline output muted. No recorder, readback, diagnostic clock or full inspection in scored racing loop. Virtual player input is disclosed. Driver/OS shader caches not cleared. All raw phases/outliers retained. CPU submission and resource counts are not GPU time or bytes. Loading includes preparation; do not sum overlapping durations. Percentiles use nearest rank. targetMet is a conservative mechanical check: p95<=20, p99<=33.4 and zero active intervals>100ms; the director asks that recurring stalls be absent and every outlier investigated. Neither clean followups nor this strict check overwrite the original matrix.','runs':[r for r in summary if r['name'].startswith('verified-scored-')],'followups':[r for r in summary if not r['name'].startswith('verified-scored-')]},indent=2))
for r in summary: print(r['name'],r['racingIntervals'],r['targetMet'],r['programCounts'])

# Observed passes are changes in actual pairwise race progress, never rival intent counters.
traffic=[]
for directory in sorted(base.glob('verified-scored-*'))+[base/'video-verified']:
 path=directory/'run.json'
 if not path.exists():continue
 d=json.loads(path.read_text());trace=d['trace'];events=[];encounters=[];previous=None
 for row in trace:
  if row['race']['phase']!='running':previous=None;continue
  player=row['field']['player'];standing={x['id']:x for x in row['race']['standings']}
  for name in ['maya','jett','nico']:
   peer=row['field'][name];gap=math.hypot(peer['position']['x']-player['position']['x'],peer['position']['z']-player['position']['z'])
   if gap<11:encounters.append({'elapsedMs':row['race']['elapsedMs'],'id':name,'centerDistanceM':gap,'playerSpeedMps':player['speed'],'playerBrake':player['brake'],'playerSteer':player['steer']})
   if previous and previous['attemptId']==row['attemptId'] and row['race']['elapsedMs']>3000:
    prior={x['id']:x for x in previous['race']['standings']};a=prior['player']['progress']-prior[name]['progress'];b=standing['player']['progress']-standing[name]['progress']
    if a*b<0 and all(x['status']=='running' for x in [standing['player'],standing[name],prior['player'],prior[name]]):events.append({'fromElapsedMs':previous['race']['elapsedMs'],'toElapsedMs':row['race']['elapsedMs'],'rival':name,'direction':'player passed rival' if b>0 else 'rival passed player','progressBeforeM':a,'progressAfterM':b,'centerDistanceAfterM':gap})
  previous=row
 traffic.append({'name':directory.name,'observedPairwiseOrderChanges':events,'closeEncounterSamples':encounters,'sampleMethod':'Actual approximately1Hz field/race telemetry, ordinary virtual player input and unchanged production rivals. Conservative observed progress-order crossings; does not infer unseen transient passes or equate controller intent counts with completed passes. Center distances are not bumper clearance.'})
(base/'traffic-review.json').write_text(json.dumps(traffic,indent=2))
