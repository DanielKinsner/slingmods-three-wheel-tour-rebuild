"""Summarize the complete native matrix without dropping failed intervals."""
from pathlib import Path
import json
r=Path(__file__).resolve().parents[1]
ev=r/'director-kit/production/evidence/P09A'
rows=[]
for width in [1920,1280]:
 for route in ['express','harbor']:
  for build in ['stock','equipped']:
   name=f'native-{width}-{route}-{build}-02'
   s=json.loads((ev/name/'summary.json').read_text())
   for a in s['attempts']:
    rows.append({'directory':name,'width':width,'route':route,'build':build,**a,
      'numericThresholdPass':a['p95Ms']<=20+1e-6 and a['p99Ms']<=33.4+1e-6 and a['maxMs']<=100+1e-6})
assert len(rows)==16
report={'runtimeCommit':s['sourceCommit'],'status':'PASS' if all(a['numericThresholdPass'] for a in rows) else 'HOLD',
 'method':'All 16 real-time races; no discarded intervals or outliers. 1e-6 ms arithmetic tolerance only. Original strict comparison remains in each summary.',
 'functionalPass':all(a['result']['valid'] and all(f['status']=='finished' for f in a['allFinishers']) for a in rows),
 'failedRaces':sum(not a['numericThresholdPass'] for a in rows),'activeOver100Ms':sum(a['activeOver100Ms'] for a in rows),
 'thresholds':s['thresholds'],'browser':s['browser'],'renderer':json.loads((ev/name/'run.json').read_text())['initial']['renderer'],'races':rows}
(ev/'native-matrix.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='races'},indent=2))
