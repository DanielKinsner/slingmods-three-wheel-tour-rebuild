"""Index actual completed owner-refinement evidence. Does not generate test outcomes."""
from pathlib import Path
import json, hashlib, subprocess, datetime

r=Path(__file__).resolve().parents[1]
n=r/'director-kit/production/evidence/P08B-Refinement'
def read(p): return json.loads(p.read_text())
def hashed(p): return {'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
runtime='822ff5f5a9cc211775076074c7d106e8d372286a'
reports={}
for name in ['departure-static-final-02','remote-departure','finish-static','transfers-static','preservation-static']:
 p=n/name/'verification.json';d=read(p);assert d['pass'];reports[p.relative_to(r).as_posix()]=hashed(p)
native=read(n/'native-express/summary.json');assert native['sourceCommit']==runtime and all(a['pass'] for a in native['attempts']) and not native['errors']
film=n/'film-final-02';f=read(film/'FILM-VERIFICATION.json');assert f['pass'] and read(film/'verification.json')['pass']
assert read(film/'DECODE-AND-PACKETS.json')['pass']
remote=read(n/'remote-runtime-recovery.json');assert remote['pass'] and remote['commit']==runtime
for name in ['tests-runtime.log','remote-tests.log']:
 text=(n/name).read_text(encoding='utf-8-sig');assert 'pass 180' in text and 'fail 0' in text
media={}
for directory in [n/'film-final',film]:
 for p in directory.rglob('*.webm'):media[p.relative_to(r).as_posix()]=hashed(p)
required=read(r/'handoff/P08B-REFINEMENT-ASSETS.json')
receipt={
 'schemaVersion':1,'assignment':'P08B owner showroom refinement / refreshed Review16','generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'runtimeCommit':runtime,'branch':'feature/p08b-slingmods-experience','remote':'https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild.git',
 'mainUnchanged':'ed363b28ec6ba933dd82c576153bd73c80ea6619','packagingIdentity':'Exact pushed follow-up SHA is recorded in ZIP MANIFEST.json and REMOTE-ASSETS.json, avoiding a recursive commit hash.',
 'status':'Internal implementation, critique, repair, integration and bounded validation complete. Director review pending.',
 'tests':{'local':180,'remoteCheckout':180,'failed':0,'logs':['tests-runtime.log','remote-tests.log'],'build':'Static candidate 822ff5f5a9cc; 85 files / 133016713 bytes; builds passed locally and from remote. Normal Vite chunk-size advisory remains.'},
 'integratedReports':reports,'nativeRaces':native,'allPhases':read(n/'native-express/all-phases.json'),
 'film':{'path':(film/'P08B-Signature-Experience.mp4').relative_to(r).as_posix(),**hashed(film/'P08B-Signature-Experience.mp4'),'durationSeconds':f['duration'],'excludedSegments':f['excludedSegments'],'assemblyCommand':'python scripts/assemble-p08b-refinement-film.py director-kit/production/evidence/P08B-Refinement/film-final-02 --exclude=04-original-harbor --omit-sync-group=6','verification':(film/'FILM-VERIFICATION.json').relative_to(r).as_posix(),'maxAbsoluteMeasuredAVDriftMs':max(abs(c['measuredAVDriftMs']) for c in f['cuts']),'audio':f['decodedAudio'],'originalMedia':media,'method':f['method'],'retainedFailedAssembly':'First recording preserved in film-final; modal-obscured sync flashes prevented verified assembly. Second recording uses capture-only top-layer mirrors of real marker onset; no game clock/audio changes.'},
 'requiredAssets':{'manifest':'handoff/P08B-REFINEMENT-ASSETS.json','files':len(required['files']),'bytes':sum(v['bytes'] for v in required['files'].values()),'remoteRecovery':remote,'packedSourceAudit':{'objects':1083,'images':7,'unpacked':[],'log':'director-kit/production/evidence/P08B-Refinement/packed-source-recovery.log'}},
 'launch':{'url':'http://127.0.0.1:5197/','commands':['python scripts/verify-p08b-refinement.py','npm ci','npm test','npm run demo:build',"$env:PORT='5197'",'npm run demo:preview'],'preparedDemo':'http://127.0.0.1:5197/?scene=crew&play=demo','credentialRequired':False},
 'audioGeneration':{'provider':'ElevenLabs','model':'eleven_text_to_sound_v2','successfulCues':1,'providerCredits':35,'generatedDurationSeconds':3.5,'provenance':'assets/source/showroom-refinement/bay-door-provenance.json','credentialStored':False,'purchases':False,'accountChanges':False,'humanListeningApproval':False},
 'preservation':'Original vehicle/driver/rear, accepted stock dynamics, Harbor geometry/collision, products, P08A progression/reward ledger and prior reviewed output preserved. No simulation source edits in this owner refinement. Existing stock/full-loop evidence stays tied to its original commits.',
 'limits':['Mapped floor relief; inferred dimensions, not surveyed','Door slats gather by presentation transform; plain short exterior apron','Loading/ready interval 8266.3 ms retained outside running-phase result','Native performance verified on one Windows Chromium/RTX4080 host; capture timing is not native performance evidence','Human listening/fun, physical controllers/devices, final OEM/room fidelity and rear articulation remain held','G3/G4, release, hosting and publication remain pending separately','Browser saves, installed tools/dependencies and built output do not transfer in Git'],
 'nextAction':'Give refreshed Astra-Review-16-Lean.zip to Astra. Preserve feature branch; no main merge/publication.'
}
(r/'handoff/P08B-REFINEMENT-VALIDATION.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'runtime':runtime,'reports':len(reports),'filmSeconds':f['duration'],'requiredAssets':len(required['files']),'originalMediaFiles':len(media)}))
