"""Review18 evidence packet; required heavy assets remain recoverable from private Git."""
from pathlib import Path
import json, hashlib, subprocess, zipfile, tarfile, io
ROOT = Path(__file__).resolve().parents[1]
E = ROOT / 'director-kit/production/evidence/P09B'
receipt = json.loads((ROOT/'handoff/P09B-VALIDATION.json').read_text(encoding='utf-8'))
assert receipt['functionalPass'] and receipt['remoteRecovery']['pass']
head = subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
branch = subprocess.check_output(['git','branch','--show-current'],cwd=ROOT,text=True).strip()
assert branch == 'main', 'Owner requested verified main handoff'
files = {}
def add(p, dest=None):
    p = Path(p)
    files[dest or p.relative_to(ROOT).as_posix()] = p.read_bytes()
for tree in ['src','tests']:
    for p in (ROOT/tree).rglob('*'):
        if p.is_file(): add(p)
for p in (ROOT/'scripts').iterdir():
    if p.is_file() and ('p09' in p.name.lower() or p.name in ['build-demo.mjs','serve-demo.mjs','static-demo.mjs','p08b-driving-evidence-agent.ts','audio-authoring-requirements.txt']): add(p)
for name in ['AGENTS.md','HANDOFF.md','README.md','package.json','package-lock.json','demo-assets.json','tsconfig.json','vite.config.ts','index.html']:
    add(ROOT/name)
for p in (ROOT/'handoff').glob('P09B*'):
    if p.is_file() and p.name != 'P09B-PACKET.json': add(p)
for name in ['REVIEW18-SUMMARY.md','P09B-AUDIT.md','PERFORMANCE.md','DIAGNOSTIC.md','UI-REVIEW.md']:
    add(E/name, 'review/'+name)
for p in (ROOT/'public/assets/audio').rglob('*.json'):
    if 'p09b' in p.as_posix(): add(p)
add(E/'film-03/P09B-Signature-Finish.mp4','media/P09B-Signature-Finish.mp4')
add(E/'film-03/FILM-REVIEW.md','review/FILM-REVIEW.md')
for name in ['Engine-AB-level-matched.wav','LISTEN.html','level-matching.json','inputs.json']:
    add(E/'audio/engine-ab-03'/name,'media/engine-ab/'+name)
add(E/'audio/AUDIO-REVIEW.md','review/AUDIO-REVIEW.md')
screens = [
 ('ui-before/showroom-1280.png','01-before-showroom-720.png'),
 ('ui-after-03/showroom-1280.png','02-after-showroom-720.png'),
 ('ui-after-03/showroom-1920.png','03-showroom-1080.png'),
 ('ui-after-03/career-1280.png','04-career-720.png'),
 ('integration-final-03/01-display-on.png','05-display-on.png'),
 ('integration-final-03/02-display-off.png','06-display-off.png'),
 ('integration-final-03/06-cockpit-actual-motion.png','07-cockpit-telemetry.png'),
 ('film-03/05-thermal-departure.png','08-thermal-departure.png'),
 ('film-03/08-pause-settings.png','09-pause-settings.png'),
 ('film-03/10-race.png','10-race.png'),
 ('film-03/11-earned-result.png','11-earned-result.png'),
 ('film-03/12-earned-part.png','12-earned-workshop.png')]
for source,name in screens: add(E/source,'screens/'+name)
buf = io.BytesIO()
with tarfile.open(fileobj=buf,mode='w:xz',preset=6) as tar:
    for p in sorted(E.rglob('*')):
        if p.is_file() and p.suffix.lower() in ['.json','.txt','.md','.csv','.gz','.html'] and 'raw-video' not in p.parts:
            data=p.read_bytes(); info=tarfile.TarInfo(p.relative_to(E).as_posix()); info.size=len(data); info.mtime=0
            tar.addfile(info,io.BytesIO(data))
files['verification/P09B-complete-data.tar.xz']=buf.getvalue()
files['START-HERE.md']=b'''# Astra Review18 - Signature Finish

Start with review/REVIEW18-SUMMARY.md and review/P09B-AUDIT.md. Play media/P09B-Signature-Finish.mp4 for current game imagery and captured master audio. media/engine-ab/LISTEN.html labels the level-matched comparison. verification/P09B-complete-data.tar.xz retains complete relevant raw timing/validation, including failures and both native attempts. Python tarfile or 7-Zip can extract it.

This is a review packet, not a self-contained game. Full runtime/editable assets and pinned source are recoverable from private Git. Follow HANDOFF.md and handoff/P09B-REQUIRED-ASSETS.json for exact assets/hashes. Owner authorized merge to main after validation. No public deployment or account changes.
'''
manifest={'schemaVersion':1,'packet':'Astra-Review-18-Lean','branch':branch,'packagingCommit':head,'runtimeCommit':receipt['runtimeCommit'],'remote':'https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild.git','selfContainedBuild':False,'verification':receipt,'files':{n:{'bytes':len(d),'sha256':hashlib.sha256(d).hexdigest()} for n,d in files.items()}}
files['MANIFEST.json']=json.dumps(manifest,indent=2).encode()
output=ROOT/'Astra-Review-18-Lean.zip'
with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for n,data in files.items(): z.writestr(n,data)
with zipfile.ZipFile(output) as z:
    assert z.testzip() is None
    for n,m in manifest['files'].items(): assert hashlib.sha256(z.read(n)).hexdigest()==m['sha256']
assert output.stat().st_size <= 100_000_000
result={'file':str(output),'bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'packagingCommit':head,'runtimeCommit':receipt['runtimeCommit'],'entries':len(files)}
(ROOT/'handoff/P09B-PACKET.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,indent=2))
