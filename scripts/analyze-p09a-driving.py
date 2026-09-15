from pathlib import Path
import json,gzip,math,hashlib
root=Path('.');base=root/'director-kit/production/evidence/P09A';report={'method':'Recomputed from complete matched traces. Start is first fixed tick at target minus0.05 m/s; stop is below0.2m/s body-forward speed. All acceleration/braking rows retained. Finite-step simulated engineering data, not OEM claims or human playtests.','variants':{},'final':{},'sourceHashes':{}}
for d in sorted(base.glob('driving-variant*')):
 j=json.loads((d/'summary.json').read_text());cases={}
 for name,case in j['profiles']['slingmods-sport-v2'].items():
  rows=json.loads(gzip.decompress((d/('slingmods-sport-v2-'+name+'.json.gz')).read_bytes()));brake=[r for r in rows if r['input']['brake']];contacts=[c for r in brake for c in r['diagnostics']['contacts']];cases[name]={'pathMetres':case['pathMetres'],'yawDegrees':case['yawRadians']*180/math.pi,'lateralMetres':case['finish']['position']['x']-case['entry']['position']['x'],'brakingTicks':len(brake),'saturatedTicks':sum(any(w['saturation']<.999 for w in r['diagnostics']['wheels']) for r in brake),'guardManifoldTicks':sum(any(c['kind']=='guard' for c in r['diagnostics']['contacts']) for r in brake),'maxReportedNormalImpulse':max([abs(p['normalImpulse']) for c in contacts for p in c['points']]+[0]),'minimumWheelLoad':min(w['load'] for r in brake for w in r['diagnostics']['wheels'])}
 report['variants'][d.name]=cases
for name in ['driving-matched','driving-matched-street','driving-matched-modified','driving-matched-removed','driving-compatibility-final','driving-imperfect','driving-rough']:
 j=json.loads((base/name/'summary.json').read_text());report['final'][name]=j
for name in ['src/simulation/index.ts','src/simulation/profile.ts','src/driving/input.ts','tests/p09a-driving.test.ts','tests/fixtures/p09a-baseline-digests.json','public/assets/slingshot-contact-layout.json']:
 b=(root/name).read_bytes();report['sourceHashes'][name]={'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'lfNormalizedSha256':hashlib.sha256(b.replace(b'\r\n',b'\n')).hexdigest()}
(base/'driving-analysis.json').write_text(json.dumps(report,indent=2))
files=[p for p in base.rglob('*') if p.is_file() and (p.parent.name.startswith('driving-') or p.name in ['baseline-equivalence.json','driving-analysis.json','driving-tests.log'])]
index={'files':[{'path':p.as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(files)]};(base/'driving-data-index.json').write_text(json.dumps(index,indent=2));print(len(files),'files',sum(p.stat().st_size for p in files),'bytes');print(json.dumps(report['variants'],indent=2))
