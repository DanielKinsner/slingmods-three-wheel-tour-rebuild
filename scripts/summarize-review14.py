"""Read-only per-attempt scorer. Historical and failed raw files are never rewritten."""
from pathlib import Path
import json,math,hashlib,datetime,statistics
ROOT=Path(__file__).resolve().parents[1];BASE=ROOT/'director-kit/production/evidence/P07A'
def stats(values):
 a=sorted(values)
 return None if not a else {'count':len(a),'p50':a[math.ceil(len(a)*.5)-1],'p95':a[math.ceil(len(a)*.95)-1],'p99':a[math.ceil(len(a)*.99)-1],'max':a[-1],'over100':sum(x>100.000001 for x in a)}
def score(path):
 d=json.loads(path.read_text());p=d['profile'];rows=p['rows'];assert rows and not p['overflow'];assert not d['errors'];assert not d.get('record') and not d.get('diagnostic')
 assert all(abs(rows[i][0]-rows[i-1][0]-rows[i][1])<.001 for i in range(1,len(rows)))
 active=[r for r in rows if r[10]==2];groups=sorted({r[11]for r in active});assert len(groups)==len(d['results'])>0
 crew='attemptFinals'in d
 if crew:
  assert groups==list(range(1,len(groups)+1));assert len(d['attemptFinals'])==len(groups)
  assert p['worldSteps']==d['final']['ticks'] and p['participants']==4
 else:assert len(groups)==1
 attempts=[]
 hostpath=BASE/(path.parent.name+'-host.jsonl');host=[]
 if hostpath.exists():
  for line in hostpath.read_text(encoding='utf-8-sig').splitlines():
   row=json.loads(line);row['unixMs']=datetime.datetime.fromisoformat(row['utc'].replace('Z','+00:00')).timestamp()*1000;host.append(row)
 for group,result in zip(groups,d['results']):
  data=[r for r in active if r[11]==group];interval=stats([r[1]for r in data]);outcome=result['race']['playerResult'if crew else'result'];assert outcome['valid']
  if crew:
   end=d['attemptFinals'][group-1];assert end['attemptId']==outcome['attemptId'];assert all(s['status']=='finished'for s in end['race']['standings'])
  row={'attempt':group,'result':outcome,'intervals':interval,'renderSubmissionCPU':stats([r[3]for r in data]),'frameCPU':stats([r[2]for r in data]),'targetMet':interval['p95']<=20.000001 and interval['p99']<=33.400001 and interval['over100']==0,'firstRAF':data[0][0],'lastRAF':data[-1][0],'programs':sorted({r[6]for r in data})}
  if host and 'timeOrigin'in d:
   samples=[s for s in host if d['timeOrigin']+data[0][0]<=s['unixMs']<=d['timeOrigin']+data[-1][0] and s['intervalSeconds']>1]
   names={v['name'] for s in samples for v in s['processes']}
   row['host']={'samples':len(samples),'globalCPU':stats([s['globalCPUPercent']for s in samples]),'collectorWallMs':stats([s['collectionMs']for s in samples]),'processMeanHostPercent':sorted([{'name':n,'percent':sum(next((v['hostPercent']for v in s['processes'] if v['name']==n),0)for s in samples)/len(samples)}for n in names],key=lambda r:r['percent'],reverse=True),'interpretation':'Time-aligned observations, not proof of attribution. All process names are aggregates; no command lines or personal paths.'}
  attempts.append(row)
 return {'path':path.relative_to(ROOT).as_posix(),'rawSHA256':hashlib.sha256(path.read_bytes()).hexdigest(),'runtime':d['final']['commit'],'renderer':p.get('renderer'),'buffer':p.get('size'),'dpr':p.get('dpr'),'browser':d['browser'],'recorded':d.get('record',False),'timeOrigin':d.get('timeOrigin'),'attempts':attempts,'targetMet':all(a['targetMet']for a in attempts),'allPhases':stats([r[1]for r in rows]),'nonRacingOver100':[{'row':i,'values':r}for i,r in enumerate(rows)if r[10]!=2 and r[1]>100.000001],'events':p['events'],'method':'Nearest rank, complete independent attempts, p95<=20ms/p99<=33.4ms/zero active>100ms with 1e-6ms float tolerance. CPU wall durations are not GPU timings; all raw phases/outliers remain.'}
if __name__=='__main__':
 paths=sorted(BASE.glob('baseline-repeat-*/run.json'))+sorted(BASE.glob('verified-scored-*/run.json'))+sorted(BASE.glob('day-scored-*/run.json'))
 result={'schemaVersion':1,'runs':[score(p)for p in paths]}
 (BASE/'performance-summary.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
 for r in result['runs']:print(Path(r['path']).parent.name,[(a['attempt'],a['intervals']['p95'],a['intervals']['p99'],a['targetMet'])for a in r['attempts']])
