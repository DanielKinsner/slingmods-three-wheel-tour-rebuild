from pathlib import Path
import json,math,hashlib
base=Path('director-kit/production/evidence/P05')
summary=[]
def stats(values):
 a=sorted(values)
 return {'count':len(a),'p50':a[int((len(a)-1)*.5)],'p95':a[int((len(a)-1)*.95)],'p99':a[int((len(a)-1)*.99)],'max':max(a),'over33_4':sum(v>33.400001 for v in a),'over50':sum(v>50 for v in a),'over100':sum(v>100 for v in a)} if a else None
for directory in sorted(base.glob('verified-scored-*')):
 path=directory/'run.json'
 if not path.exists():continue
 d=json.loads(path.read_text());p=d['profile'];rows=p['rows'];racing=[r for r in rows if r[10]==2];cost=p['crewCosts'];interval=stats([r[1] for r in racing]);allstats=stats([r[1] for r in rows]);assert p['overflow']==0;assert d['errors']==[];assert all(x['race']['playerResult']['valid'] for x in d['results']);assert len(d['attemptFinals'])==len(d['results']);assert all(x['status']=='finished' for a in d['attemptFinals'] for x in a['race']['standings']);assert p['worldSteps']==d['final']['ticks'];assert p['participants']==4
 timestamps=[abs(rows[i][0]-rows[i-1][0]-rows[i][1]) for i in range(1,len(rows))];assert max(timestamps,default=0)<.001
 outliers=[]
 prep=next(e for e in p['events'] if e['event']=='preparation-end')
 for i,r in enumerate(rows):
  if r[1]>100:
   startup=i==1 and r[4]==0 and r[10]==0 and rows[0][0]<prep['wall']
   outliers.append({'row':i,'data':r,'previousRAF':rows[max(0,i-1)][0],'preparationEndWall':prep['wall'],'preparationFirstRenderMs':next(x['ms']for x in p['preparation']['stages']if x['name']=='first-all-mesh-render'),'assessment':'Ready/startup interval; preceding RAF timestamp predates end of synchronous preparation render. Timing is consistent with that startup frame spanning warmup. No authoritative ticks or shader-count change; retained unmodified, not classified as a racing stall.' if startup else 'Requires additional investigation; do not discard.'})
 target=interval['p95']<=20 and interval['p99']<=33.4 and interval['over100']==0
 entry={'name':directory.name,'runtime':d['final']['commit'],'width':d['width'],'buffer':p['size'],'dpr':p['dpr'],'renderer':p['renderer'],'browser':d['browser'],'equipped':d['equipped'],'record':d['record'],'loadMs':p['loadMs'],'preparationMs':p['preparation']['ms'],'racingIntervals':interval,'allIntervals':allstats,'targetMet':target,'outliersOver100':outliers,'results':[x['race']['playerResult']for x in d['results']],'finalField':d['final']['race']['standings'],'attemptFinalFields':[a['race']['standings']for a in d['attemptFinals']],'programCounts':sorted(set(r[6]for r in rows)),'residentSpots':sorted(set(r[7]for r in rows)),'residentAreas':sorted(set(r[8]for r in rows)),'worldSteps':p['worldSteps'],'worldStepsEqualSessionTicks':True,'cpuFrame':stats([r[2]for r in racing]),'renderSubmissionCPU':stats([r[3]for r in racing]),'controlCPUperRAF':stats([r[1]for r in cost]),'physicsCPUperRAF':stats([r[2]for r in cost]),'collectorCPU':stats([r[9]for r in rows]),'crewCollectorCPU':stats([r[9]for r in cost]),'driverCPU':stats(d['driverCosts']),'callsRange':[min(r[5]for r in cost),max(r[5]for r in cost)],'trianglesRange':[min(r[6]for r in cost),max(r[6]for r in cost)],'geometryCounts':sorted(set(r[7]for r in cost)),'textureCounts':sorted(set(r[8]for r in cost)),'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest()}
 summary.append(entry)
(base/'performance-summary.json').write_text(json.dumps({'method':'Fresh isolated Windows Chromium D3D11 RTX4080, nativeRAF, DPR1, actual buffers, stable standard quality. Audio graph active; commandline output muted. No recorder, readback, diagnosticclock or fullinspection in scored racing loop. Virtual player input is disclosed. Driver/OS shader caches not cleared. All raw phases/outliers retained. CPU submission and resourcecounts are not GPU time or bytes. Loading includes preparation; do not sum overlappingdurations.','runs':summary},indent=2))
for r in summary: print(r['name'],r['racingIntervals'],r['targetMet'],r['programCounts'])
