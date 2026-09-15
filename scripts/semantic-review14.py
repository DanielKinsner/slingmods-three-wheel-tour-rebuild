"""Independent selection/recovery assertions complement the supplied ZIP hash validator."""
from pathlib import Path
import zipfile,json,hashlib,subprocess
R=Path(__file__).resolve().parents[1];E=R/'director-kit/production/evidence/P07A';archive=R/'Astra-Review-14-Lean.zip'
with zipfile.ZipFile(archive) as z:
 names=set(z.namelist());load=lambda n:json.loads(z.read(n));snapshot=load('SOURCE-SNAPSHOT.json');bulk=load('BULK-ASSET-INDEX.json');evidence=load('EVIDENCE-INDEX.json')
 for folder in ['src','tests']:
  expected={p.relative_to(R).as_posix()for p in(R/folder).rglob('*')if p.is_file() and '__pycache__'not in p.parts}
  assert expected=={n for n in names if n.startswith(folder+'/')},folder
 final=['verified-scored-equipped1080-repeat','verified-scored-equipped720','verified-scored-equipped1080','verified-scored-stock720','verified-scored-stock1080','day-scored-equipped1080']
 required=['director-kit/production/evidence/P07A/'+n+'/run.json'for n in final+['baseline-repeat-01','baseline-repeat-02']]
 required+=['director-kit/production/evidence/P06C/'+n+'/run.json'for n in ['verified-scored-equipped1080-repeat','heavy1080-followup']]
 for n in required:assert n in names and z.read(n)==(R/n).read_bytes(),n
 summary=load('director-kit/production/evidence/P07A/performance-summary.json');runs=[r for r in summary['runs']if Path(r['path']).parent.name in final];assert len(runs)==6 and sum(len(r['attempts'])for r in runs)==7 and all(r['targetMet']for r in runs)
 assert load('director-kit/production/evidence/P07A/native-final-02/report.json')['complete']
 assert load('director-kit/production/evidence/P07A/hardening-final/report.json')['complete']
 assert len([n for n in names if n.startswith('review-images/')])==13
 assert [n for n in names if n.endswith(('.mp4','.webm'))]==['review-media/showcase-LIVE-AUDIO.mp4']
 assert not any(n.endswith(('.blend','.glb','.hdr','.wav','.zip'))for n in names)
 assert 'review-only'in z.read('REVIEW-ME-FIRST.md').decode().lower()
 head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=R,text=True).strip();assert snapshot['packagingCommit']==head
 assert snapshot['remoteAvailability']['result']=='LOCAL_ONLY'
 for row in bulk['files']:
  p=R/row['path'];assert p.is_file() and p.stat().st_size==row['bytes'];assert hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256'];assert row['recovery']['availability']=='LOCAL_ONLY' and row['recovery']['verifiedExistsAndHash']
 for row in snapshot['uncommittedExcluded']:assert hashlib.sha256((R/row['path']).read_bytes()).hexdigest()==row['sha256']
 for row in evidence['retainedRawMediaAndBinaryEvidence']:
  p=R/row['path'];assert p.is_file() and p.stat().st_size==row['bytes'] and hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256']
 report={'semanticSelection':'PASS','sourceTreesComplete':['src','tests'],'completeRequiredRawRuns':len(required),'finalRaceAndLapAttempts':7,'allFinalAttemptsTargetMet':True,'selectedStills':13,'continuousMovies':1,'omittedBinaryRecoveryVerified':len(bulk['files']),'retainedOriginalsVerified':len(evidence['retainedRawMediaAndBinaryEvidence']),'packagingCommit':head,'remoteAvailability':'LOCAL_ONLY','limitations':'This machine verifies retained local recovery; no remote fetchability or external hosting is asserted. Independent image/frame/audio review remains separately documented.'}
(E/'semantic-package-verification.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
