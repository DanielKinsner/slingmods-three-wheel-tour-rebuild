"""Read-only physical relative-progress evidence, not controller intent counters."""
from pathlib import Path
import json,math
R=Path(__file__).resolve().parents[1];E=R/'director-kit/production/evidence/P07A'
rows=[]
for p in sorted(E.glob('verified-scored-*/run.json')):
 d=json.loads(p.read_text());changes=[];prior={}
 for sample in d['trace']:
  race=sample['race'];attempt=sample['attemptId']
  if race['phase']!='running' or race['elapsedMs']<3000:continue
  order=[r['id'] for r in race['standings']]
  if attempt in prior and order!=prior[attempt]:changes.append({'attempt':attempt,'wall':sample['wall'],'raceElapsedMs':race['elapsedMs'],'previousOrder':prior[attempt],'newOrder':order,'physicalStandings':race['standings'],'telemetry':sample.get('telemetry')})
  prior[attempt]=order
 rows.append({'path':p.relative_to(R).as_posix(),'runtime':d['final']['commit'],'actualOrderChanges':changes,'results':[s['race']['playerResult']for s in d['results']],'allFourFinishedEachAttempt':[all(s['status']=='finished'for s in a['race']['standings'])for a in d['attemptFinals']]})
adversarial=json.loads((E/'competition/adversarial-physical.json').read_text());blocked=next(c for c in adversarial['cases'] if c['scenario']=='blocked-line')
assert blocked['final']['jett']['position']['z']<-100 and blocked['controller']['retiredReason'] is None
crossing=None
for previous,current in zip(blocked['trace'],blocked['trace'][1:]):
 a=previous['telemetry'];b=current['telemetry']
 if a['jett']['position']['z']>=a['maya']['position']['z'] and b['jett']['position']['z']<b['maya']['position']['z']:
  crossing={'tick':current['tick'],'positions':{n:t['position']for n,t in b.items()},'lateralSeparationOnInitialStraight':abs(b['jett']['position']['x']-b['maya']['position']['x'])};break
assert crossing is not None
result={'method':'Order transitions from actual race standings at retained one-second trace samples after3s, not AI intent/pass counters. Discrete sampled changes may combine several close moves; raw standings preserve progress/ties for interpretation. Full frame timing and one-second field trace remain in each original run.','runs':rows,'blockedScenario':{'source':'competition/adversarial-physical.json','clock':'deterministic1/60 simulation, no rendering','method':'Physical Maya held on the line, Jett under unchanged production controller drives around and continues.25seconds; no pose teleport. Recovery verified by actual positions rather than pass intention. Invalid/reward semantics separately covered in pinned suite.','minDistance':blocked['minDistance'],'maxAbsWorldXAcrossCurvingCourse':blocked['maxSide'],'actualLeadCrossingOnInitialStraight':crossing,'finalPositions':{n:t['position']for n,t in blocked['final'].items()},'retiredReason':blocked['controller']['retiredReason']}}
(E/'field-verification.json').write_text(json.dumps(result,indent=2));print([(Path(r['path']).parent.name,len(r['actualOrderChanges']))for r in rows])
