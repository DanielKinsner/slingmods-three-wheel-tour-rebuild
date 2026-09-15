"""Build a bounded, verifiable review packet from the pushed P08B checkout."""
from pathlib import Path
import gzip, hashlib, io, json, subprocess, zipfile
from PIL import Image, ImageDraw

root=Path(__file__).resolve().parents[1]
base=root/'director-kit/production/evidence/P08B'
runtime='6aa1dafaac03168525a1f7e69a6831ea886f45d2'
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
remote=subprocess.check_output(['git','ls-remote','origin','refs/heads/feature/p08b-slingmods-experience'],cwd=root,text=True).split()[0]
assert head==remote,'Push intended packaging commit before packaging'
assert not subprocess.check_output(['git','diff',runtime,'--','src','public','assets','tests','package.json','package-lock.json','demo-assets.json'],cwd=root),'Runtime differs from measured candidate'
files={}
def add(name,data):
 assert name not in files,name
 files[name]=data
def file(p):add(p.relative_to(root).as_posix(),p.read_bytes())
tracked=subprocess.check_output(['git','ls-files'],cwd=root,text=True).splitlines()
for name in tracked:
 p=root/name
 if (name.startswith(('src/','tests/','scripts/')) and p.suffix in ['.ts','.js','.mjs','.py','.html','.css','.ps1','.json']) or name in ['package.json','package-lock.json','tsconfig.json','vite.config.ts','demo-assets.json','index.html','HANDOFF.md','AGENTS.md','RESUME.md'] or name.startswith('handoff/P08B-') or name=='director-kit/production/state.json':file(p)
add('REVIEW-ME-FIRST.md',(root/'handoff/P08B-REVIEW-ME-FIRST.md').read_bytes())
add('P08B-runtime.diff',subprocess.check_output(['git','diff','ef592752741333faee496edff95b8abb68b76840',runtime,'--','src','tests','scripts','package.json','demo-assets.json'],cwd=root))
index=json.loads((base/'complete-data/INDEX.json').read_text())
included={};omitted={};blobs=set()
full={'driving-final','driving-modified-final','driving-matched-final','driving-matched-modified-final','driving-imperfect','legacy-regression','native-1080-02','native-stock720','native-express1080','career-final','preview-final-02','preservation-final-02','transfers-final','remote-recovery','race-ui-final-reviewed','ui-exact-runtime','ui-integration-final','recovery-check','product-link-live','film-01'}
for name,row in index['files'].items():
 p=base/'complete-data'/row['blob']
 failed_brake = name.split('/')[0] in {'driving','driving-brake-trial02','driving-damper-trial01'} and 'slingmods-sport-v1-brake' in name
 if name.split('/')[0] in full or failed_brake or p.stat().st_size<200000:
  included[name]=row;blobs.add(row['blob'])
 else:omitted[name]=row
for name in sorted(blobs):file(base/'complete-data'/name)
focused={**index,'files':included,'storedBytes':sum((base/'complete-data'/b).stat().st_size for b in blobs),'note':'Focused lean selection. Full original index and omitted blobs are verified in the pushed packaging commit; restore helper works on either index.'}
add('director-kit/production/evidence/P08B/complete-data/INDEX.json',(json.dumps(focused,indent=2)+'\n').encode())
add('REMOTE-EVIDENCE-INDEX.json',(json.dumps({'commit':head,'repository':'https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild','basePath':'director-kit/production/evidence/P08B/complete-data','files':omitted,'retrieval':'git clone --branch feature/p08b-slingmods-experience <repository>; git checkout '+head+'; python scripts/restore-p08b-data.py <NEW_OUTPUT_DIRECTORY>','reason':'Dense deterministic per-tick Express/Harbor traces and redundant intermediate comparisons remain losslessly available in Git. Every summary/failure record, complete native RAF samples and final handling comparisons are included in this ZIP.'},indent=2)+'\n').encode())
# Expose compact conclusions without requiring evidence restoration first.
for rel in ['NATIVE-SUMMARY.json','HOST.json','independent-review.md','UI-CRITIQUE.md','driving-and-express-review.md','tests-final-02.log','build-runtime.log','art/CRITIQUE.md','art/source-verification.json','product-link-live/verification.json','race-ui-final-reviewed/REVIEW.md','film-01/FILM-VERIFICATION.json','film-01/PACKET-VERIFICATION.json','film-01/VISUAL-REVIEW.md','film-01/ASSEMBLY-REPAIR.md','remote-recovery/asset-verification.json']:
 file(base/rel)
film=base/'film-01/P08B-Signature-Experience.mp4';file(film)
shots=[('01-entry','ui-exact-runtime/entry-1920.png'),('02-room','art/runtime/room.png'),('03-build','art/runtime/graphite-red-full.png'),('04-lights','ui-exact-runtime/lights-1920.png'),('05-suspension','ui-exact-runtime/suspension-1920.png'),('06-exhaust','ui-exact-runtime/exhaust-1920.png'),('07-wing','art/runtime/wing.png'),('08-storage-cutaway','art/runtime/storage.png'),('09-events','film-01/events.png'),('10-express-hud','race-ui-final-reviewed/hud-1280.png'),('11-pause-help','race-ui-final-reviewed/pause-help-1280.png'),('12-results','race-ui-final-reviewed/results-1920.png'),('13-low-front-repairs','art/runtime/low-front.png')]
for label,rel in shots:
 im=Image.open(base/rel).convert('RGB');im.thumbnail((1920,1080));out=io.BytesIO();im.save(out,'JPEG',quality=91,optimize=True);add('screenshots/'+label+'.jpg',out.getvalue())
sheet=Image.new('RGB',(1920,1128),'#181a1c');draw=ImageDraw.Draw(sheet)
for i,(label,name) in enumerate([('Graphite / red','graphite-red-full'),('Black / red','black-red'),('White / graphite','white-graphite'),('Blue / orange','blue-orange')]):
 im=Image.open(base/('art/runtime/'+name+'.png')).convert('RGB');im.thumbnail((960,540));x=(i%2)*960;y=(i//2)*564;sheet.paste(im,(x,y));draw.text((x+12,y+540),label+' - composite of actual runtime frames',fill='white')
out=io.BytesIO();sheet.save(out,'JPEG',quality=91,optimize=True);add('screenshots/14-four-finishes-contact-sheet.jpg',out.getvalue())
add('screenshots/README.md',b'Actual runtime screenshots. 14 is a labeled composite. 08 is a temporary labeled storage cutaway with seats hidden/doors open; normal visibility restores on exit. Art proof uses stronger neutral inspection lighting than the integrated Signature scene. All source screenshots remain in Git. Images are UI/visual evidence, not performance measurements.\n')
add('REMOTE-ASSETS.json',(json.dumps({'runtimeCommit':runtime,'packagingCommit':head,'requiredAssetsManifest':'handoff/P08B-ASSET-MANIFEST.json','fullFilmSources':['director-kit/production/evidence/P08B/film-01/raw-video/page@220a60144de5e3957912afaf06397ce0.webm']+[f'director-kit/production/evidence/P08B/film-01/{s}-audio.webm'for s in ['01-showroom','02-reverse-launch','03-express-race','04-original-harbor','05-returned-build']],'assetNote':'All listed runtime/editable files are tracked in the verified private remote. ZIP deliberately excludes large binaries and tools. Browser saves, dependencies and generated dist do not transfer.'},indent=2)+'\n').encode())
manifest={'runtimeCommit':runtime,'packagingCommit':head,'branch':'feature/p08b-slingmods-experience','files':{n:{'bytes':len(d),'sha256':hashlib.sha256(d).hexdigest()}for n,d in sorted(files.items())},'note':'Manifest describes every payload except itself; no recursive self-hash.'}
add('MANIFEST.json',(json.dumps(manifest,indent=2)+'\n').encode())
dest=root/'Astra-Review-16-Lean.zip'
with zipfile.ZipFile(dest,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9)as z:
 for n,d in sorted(files.items()):z.writestr(n,d,compress_type=zipfile.ZIP_STORED if n.endswith(('.gz','.mp4','.jpg'))else zipfile.ZIP_DEFLATED)
with zipfile.ZipFile(dest)as z:
 assert z.testzip()is None
 for n,row in manifest['files'].items():
  data=z.read(n);assert len(data)==row['bytes']and hashlib.sha256(data).hexdigest()==row['sha256'],n
assert dest.stat().st_size<=100000000
print(json.dumps({'zip':str(dest),'bytes':dest.stat().st_size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'payloads':len(files),'runtimeCommit':runtime,'packagingCommit':head,'includedDataFiles':len(included),'remoteDataFiles':len(omitted),'verification':'CRC and every payload SHA-256/size verified'},indent=2))
