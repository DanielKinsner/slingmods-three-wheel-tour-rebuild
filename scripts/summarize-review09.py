import json,statistics,sys
from pathlib import Path
base=Path('director-kit/production/evidence/P04B2')
reports=[]
for path in sorted(base.glob('*/run.json')):
 d=json.loads(path.read_text());p=d['profile'];rows=p['rows']; scored=[r for r in rows if len(r)>10 and r[10]==2]
 def stats(a):
  v=sorted(r[1] for r in a)
  if not v:return None
  return {'frames':len(v),'elapsedMs':sum(v),'p50':v[int((len(v)-1)*.5)],'p95':v[int((len(v)-1)*.95)],'p99':v[int((len(v)-1)*.99)],'max':max(v),'over33_4':sum(x>33.4 for x in v),'over50':sum(x>50 for x in v),'over100':sum(x>100 for x in v),'clampedCatchupMs':sum(max(0,x-100)for x in v),'meanCpuFrameMs':statistics.mean(r[2]for r in a),'maxCpuFrameMs':max(r[2]for r in a),'meanCollectorMs':statistics.mean(r[9]for r in a)}
 reports.append({'run':path.parent.name,'recorded':d['record'],'diagnostic':d['diagnostic'],'equipped':d['equipped'],'buffer':p['buffer'],'size':p['size'],'renderer':p['renderer'],'loadMs':p['loadMs'],'preparation':p.get('preparation'),'allFrames':stats(rows),'racing':stats(scored),'laps':[{'attempt':i,'stats':stats([r for r in scored if r[11]==i])}for i in sorted(set(r[11]for r in scored))],'programEvents':[e for e in p['events']if e['event']=='program-count'],'outliers':[{'rowIndex':i,'row':r,'precedingRow':rows[i-1]if i else None}for i,r in enumerate(rows)if r[1]>33.4],'meanDriverMs':statistics.mean(d['driverCosts']) if d['driverCosts']else None,'validResults':[r['race']['result']for r in d['results']],'errors':d['errors'],'overflow':p['overflow']})
(base/'performance-summary.json').write_text(json.dumps({'method':'All native RAF rows retained in each run.json. Racing includes phaseCode=2 only; all-frame and loading data are also reported. No outliers trimmed. CPU clocks are not GPU timing. Fresh browser processes do not clear OS/driver cache. No known workload ran concurrently with scored browser trials.','runs':reports},indent=2))
for r in reports:print(r['run'],r['racing'] or r['allFrames'])
