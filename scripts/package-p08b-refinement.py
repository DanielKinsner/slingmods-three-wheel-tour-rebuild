"""Refreshed Review16 packet. Complete project/evidence remains in verified private Git."""
from pathlib import Path
import json,hashlib,subprocess,zipfile,io
from PIL import Image,ImageDraw
r=Path(__file__).resolve().parents[1];old=r/'director-kit/production/evidence/P08B';new=r/'director-kit/production/evidence/P08B-Refinement'
receipt=json.loads((r/'handoff/P08B-REFINEMENT-VALIDATION.json').read_text());runtime=receipt['runtimeCommit'];head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=r,text=True).strip()
assert head==subprocess.check_output(['git','ls-remote','origin','refs/heads/feature/p08b-slingmods-experience'],cwd=r,text=True).split()[0]
assert not subprocess.check_output(['git','diff',runtime,'--','src','public','assets','tests','package.json','package-lock.json','demo-assets.json'],cwd=r)
payload={}
def add(n,d):
 assert n not in payload,n
 payload[n]=d
def put(p):
 n=p.relative_to(r).as_posix()
 if n not in payload:add(n,p.read_bytes())
tracked=subprocess.check_output(['git','ls-files'],cwd=r,text=True).splitlines()
for n in tracked:
 p=r/n
 if (n.startswith(('src/','tests/','scripts/'))and p.suffix in ['.ts','.js','.mjs','.py','.html','.css','.ps1','.json'])or n in ['package.json','package-lock.json','tsconfig.json','vite.config.ts','demo-assets.json','index.html','HANDOFF.md','AGENTS.md','RESUME.md','director-kit/production/state.json']or n.startswith('handoff/P08B-')or n.startswith('director-kit/director-addenda/review-16-owner-refinement/')and p.suffix in ['.md','.json']:put(p)
add('REVIEW-ME-FIRST.md',(r/'handoff/P08B-REFINEMENT-REVIEW.md').read_bytes())
add('owner-refinement.diff',subprocess.check_output(['git','diff','904f929a84dffb0cc7b9c3a44d3911d03be8108b',runtime,'--','src','tests','scripts','demo-assets.json'],cwd=r))
add('complete-P08B-runtime.diff',subprocess.check_output(['git','diff','ef592752741333faee496edff95b8abb68b76840',runtime,'--','src','tests','demo-assets.json'],cwd=r))
# Original accepted P08B evidence remains byte-identical; carry focused raw data and every compact report.
index=json.loads((old/'complete-data/INDEX.json').read_text());included={};omitted={};blobs=set()
full={'driving-matched-final','driving-matched-modified-final','legacy-regression','native-1080-02','native-stock720','native-express1080','career-final','preview-final-02','preservation-final-02','recovery-check'}
for n,row in index['files'].items():
 p=old/'complete-data'/row['blob'];failed=n.split('/')[0]in{'driving','driving-brake-trial02','driving-damper-trial01'}and'slingmods-sport-v1-brake'in n
 focused=n.split('/')[0]in{'driving-final','driving-modified-final'}and any(term in n for term in ['-launch.','-wall-reverse.','-bump.','-grass.'])
 if n.split('/')[0]in full or focused or failed or p.stat().st_size<200000:included[n]=row;blobs.add(row['blob'])
 else:omitted[n]=row
for n in sorted(blobs):put(old/'complete-data'/n)
add('director-kit/production/evidence/P08B/complete-data/INDEX.json',(json.dumps({**index,'files':included,'note':'Focused historical P08B evidence; full original index/blobs retained at exact remote paths.'},indent=2)+'\n').encode())
add('REMOTE-EVIDENCE-INDEX.json',(json.dumps({'commit':head,'repository':'https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild','basePath':'director-kit/production/evidence/P08B/complete-data','files':omitted,'retrieval':'Clone feature/p08b-slingmods-experience; checkout '+head+'; run python scripts/restore-p08b-data.py <NEW_OUTPUT_DIRECTORY>','note':'Old film/original recordings and dense deterministic per-tick race traces remain in Git. Fresh refinement numerical/text evidence is fully included below.'},indent=2)+'\n').encode())
for scope in [new,old/'showroom-refinement',*[p for p in old.glob('showroom-departure*')if p.is_dir()],old/'departure-visual-first']:
 if scope.exists():
  for p in scope.rglob('*'):
   if p.is_file()and p.suffix in ['.json','.md','.log','.txt','.svg']and p.name!='concat.txt':put(p)
for p in (r/'assets/source/showroom-refinement').glob('*'):
 if p.suffix in ['.json','.md']:put(p)
for n in ['NATIVE-SUMMARY.json','HOST.json','independent-review.md','UI-CRITIQUE.md','driving-and-express-review.md','tests-final-02.log','build-runtime.log']:put(old/n)
# Compact changed room and material/audio assets are useful to inspect; vehicle and .blend masters remain in Git.
for folder in ['public/assets/p08b/showroom-refinement','public/assets/audio/showroom']:
 for p in (r/folder).rglob('*'):
  if p.is_file():put(p)
put(r/'assets/blender/p08b/showroom-refinement/README.md')
film=new/'film-final-02/P08B-Signature-Experience.mp4';put(film)
shots=[('01-entry',new/'film-final-02/entry.png'),('02-floor',old/'showroom-refinement/runtime/floor-close.png'),('03-room',old/'showroom-refinement/runtime/refined-room.png'),('04-closed-bay',old/'showroom-refinement/runtime/bay-closed.png'),('05-lift',old/'showroom-refinement/runtime/lift-details.png'),('06-departure',new/'departure-static-final-02/02-car-leaving.png'),('07-return',new/'departure-static-final-02/03-returned-closed-showroom.png'),('08-red-swingarm',new/'finish-static/black-red.png'),('09-graphite-swingarm',new/'finish-static/white-graphite.png'),('10-lights',new/'film-final-02/lights.png'),('11-express',new/'film-final-02/express-42.png'),('12-results',new/'film-final-02/express-result.png')]
for label,p in shots:
 im=Image.open(p).convert('RGB');im.thumbnail((1920,1080));out=io.BytesIO();im.save(out,'JPEG',quality=91,optimize=True);add('screenshots/'+label+'.jpg',out.getvalue())
def sheet(label,items):
 canvas=Image.new('RGB',(1920,1128),'#181a1c');draw=ImageDraw.Draw(canvas)
 for i,(caption,p)in enumerate(items):
  im=Image.open(p).convert('RGB');im.thumbnail((960,540));x=(i%2)*960;y=(i//2)*564;canvas.paste(im,(x,y));draw.text((x+12,y+540),caption,fill='white')
 out=io.BytesIO();canvas.save(out,'JPEG',quality=91,optimize=True);add('screenshots/'+label+'.jpg',out.getvalue())
sheet('13-owner-references',[(p.stem,p)for p in sorted((r/'director-kit/director-addenda/review-16-owner-refinement/references').glob('*.png'))])
sheet('14-four-swingarm-finishes',[(n+' - actual matched camera',new/('finish-static/'+n+'.png'))for n in ['blue-orange','black-red','white-graphite','graphite-red']])
add('screenshots/README.md',b'Images 13 and14 are labeled composites of owner references and actual runtime captures respectively. Others are actual runtime frames. Art-only material views use neutral inspection lighting; UI/departure/film frames show integrated lighting. These are visual evidence, not performance measurements.\n')
assets=json.loads((r/'handoff/P08B-REFINEMENT-ASSETS.json').read_text());add('REMOTE-ASSETS.json',(json.dumps({'runtimeCommit':runtime,'packagingCommit':head,'files':assets['files'],'filmSources':receipt['film']['originalMedia'],'retrieval':'git clone --branch feature/p08b-slingmods-experience https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild.git; git checkout '+head,'note':'Runtime/editable assets and full original video/audio are tracked in private Git. No credential required for build or playback. Dependencies, browser saves, tools and generated static build output do not transfer.'},indent=2)+'\n').encode())
manifest={'runtimeCommit':runtime,'packagingCommit':head,'branch':'feature/p08b-slingmods-experience','files':{n:{'bytes':len(d),'sha256':hashlib.sha256(d).hexdigest()}for n,d in sorted(payload.items())},'note':'Every payload except this nonrecursive manifest. Historical records retain original commit labels; refinement records carry the new runtime identity.'};add('MANIFEST.json',(json.dumps(manifest,indent=2)+'\n').encode())
dest=r/'Astra-Review-16-Lean.zip'
with zipfile.ZipFile(dest,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9)as z:
 for n,d in sorted(payload.items()):z.writestr(n,d,compress_type=zipfile.ZIP_STORED if n.endswith(('.gz','.mp4','.jpg','.png','.glb','.mp3'))else zipfile.ZIP_DEFLATED)
with zipfile.ZipFile(dest)as z:
 assert z.testzip()is None and len(z.namelist())==len(set(z.namelist()))
 for n,row in manifest['files'].items():
  d=z.read(n);assert len(d)==row['bytes']and hashlib.sha256(d).hexdigest()==row['sha256'],n
assert dest.stat().st_size<=100000000
print(json.dumps({'path':str(dest),'bytes':dest.stat().st_size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'payloads':len(payload),'runtimeCommit':runtime,'packagingCommit':head,'includedHistoricalDataFiles':len(included),'omittedHistoricalDataFiles':len(omitted),'CRCAndPayloadHashes':'pass'},indent=2))
