"""Review17: current focused evidence, full originals recoverable at exact private Git paths."""
from pathlib import Path
import json,hashlib,subprocess,zipfile,gzip,io
from PIL import Image
r=Path(__file__).resolve().parents[1];ev=r/'director-kit/production/evidence/P09A'
receipt=json.loads((r/'handoff/P09A-VALIDATION.json').read_text());runtime=receipt['runtimeCommit']
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=r,text=True).strip()
branch='feature/p09a-own-the-build'
assert head==subprocess.check_output(['git','ls-remote','origin','refs/heads/'+branch],cwd=r,text=True).split()[0]
assert not subprocess.check_output(['git','diff',runtime,'--','src','public','assets','package.json','package-lock.json','demo-assets.json'],cwd=r)
tracked=subprocess.check_output(['git','ls-files'],cwd=r,text=True).splitlines();payload={}
def add(n,data):
 assert n not in payload,n
 payload[n]=data
def put(p):
 n=p.relative_to(r).as_posix()
 if n not in payload:add(n,p.read_bytes())
for n in tracked:
 p=r/n
 if n.startswith(('src/','tests/')) or n.startswith('scripts/') and (p.name.startswith(('p09','profile-p09','record-p09','assemble-p09','restore-p09','package-p09','analyze-p09')) or p.name in ['build-demo.mjs','serve-demo.mjs','static-demo.mjs','p08b-driving-evidence-agent.ts']):put(p)
 elif n in ['.gitattributes','package.json','package-lock.json','tsconfig.json','vite.config.ts','demo-assets.json','index.html','HANDOFF.md','AGENTS.md','RESUME.md','director-kit/production/state.json','public/assets/slingshot-contact-layout.json']:put(p)
 elif n.startswith('handoff/P09A-') or n=='handoff/verify-p09a.py' or n.startswith('director-kit/director-addenda/review-16/') and '/evidence/' not in n:put(p)
add('REVIEW-ME-FIRST.md',(r/'handoff/P09A-REVIEW.md').read_bytes())
add('P09A-source.diff',subprocess.check_output(['git','diff','51f34a341200cf76bf69106bdfae300590419e88',runtime,'--','src','tests','scripts','demo-assets.json'],cwd=r))
# Driving selection includes failed hypotheses, matched baselines/new tune, rough/noisy controls.
# Duplicate byte payloads are stored once; no sampling/rounding of numerical data.
lean=json.loads((ev/'driving-lean-index.json').read_text());selected={row['path']for row in lean['included']}
omitted={};index={};blobs={}
for p in sorted(ev.rglob('*')):
 if not p.is_file() or 'complete-data' in p.parts:continue
 n=p.relative_to(r).as_posix();rel=p.relative_to(ev).as_posix()
 if p.suffix not in ['.json','.gz','.md','.txt','.log']:
  if rel!=receipt['film']['relativePath']:
   omitted[n]={'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'reason':'Original capture/audio/image or intermediate film segment; final film and selected readable stills are included. Original bytes are tracked at the exact remote commit.'}
  continue
 include=n in selected or (not rel.startswith('driving-'))
 # Full final-loop data supersedes duplicate earlier successful iterations. Failures remain.
 if rel.startswith(('career-loop-05/','career-loop-07/')) and p.name=='verification.json':include=False
 if p.name=='checkpoint.json' and (p.parent/'run.json').exists():include=False
 raw=p.read_bytes();sha=hashlib.sha256(raw).hexdigest()
 if include:
  data=gzip.decompress(raw) if p.suffix=='.gz' else raw
  content=hashlib.sha256(data).hexdigest();blob='blobs/'+content+'.gz'
  if blob not in blobs:blobs[blob]=gzip.compress(data,compresslevel=9,mtime=0)
  index[rel]={'blob':blob,'contentSHA256':content,'sourceSHA256':sha,'sourceBytes':len(raw),'sourceWasGzip':p.suffix=='.gz'}
 else:omitted[n]={'bytes':len(raw),'sha256':sha,'reason':'Unchanged/duplicate historical comparison or superseded successful capture; final relevant trace and failures included.'}
for name,data in blobs.items():add('director-kit/production/evidence/P09A/complete-data/'+name,data)
add('director-kit/production/evidence/P09A/complete-data/INDEX.json',(json.dumps({'files':index,'method':'Lossless gzip and content-addressed deduplication; every selected original numerical/text byte restored. Gzip container metadata may normalize, content SHA256 is authoritative.','restore':'python scripts/restore-p09a-data.py NEW_OUTPUT_DIRECTORY'},indent=2)+'\n').encode())
add('REMOTE-EVIDENCE-INDEX.json',(json.dumps({'commit':head,'branch':branch,'files':omitted,'retrieval':'Clone the private repository, git checkout '+head+', then read each exact path.'},indent=2)+'\n').encode())
film=ev/receipt['film']['relativePath'];put(film)
for caption,name in receipt['reviewScreenshots']:
 im=Image.open(ev/name).convert('RGB');im.thumbnail((1600,2400));out=io.BytesIO();im.save(out,'JPEG',quality=90,optimize=True);add('screenshots/'+caption+'.jpg',out.getvalue())
add('screenshots/README.md',b'Actual game/UI frames. Automated input is disclosed in film/evidence. No generated promotional renders. Screenshots are visual evidence, not performance measurements.\n')
assets=json.loads((r/'handoff/P09A-ASSETS.json').read_text());add('REMOTE-ASSETS.json',(json.dumps({**assets,'retrievableCommit':head,'branch':branch,'retrieval':'git clone --branch '+branch+' https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild.git; git checkout '+head},indent=2)+'\n').encode())
manifest={'runtimeCommit':runtime,'packagingCommit':head,'testedRemoteCommit':receipt['testedRemoteCommit'],'branch':branch,'files':{n:{'bytes':len(d),'sha256':hashlib.sha256(d).hexdigest()}for n,d in sorted(payload.items())},'note':'All payloads except this nonrecursive manifest. The lean review packet is not a standalone game; all editable/runtime binaries and capture originals are in verified private Git.'}
add('MANIFEST.json',(json.dumps(manifest,indent=2)+'\n').encode());dest=r/'Astra-Review-17-Lean.zip'
with zipfile.ZipFile(dest,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9)as z:
 for n,d in sorted(payload.items()):z.writestr(n,d,compress_type=zipfile.ZIP_STORED if n.endswith(('.gz','.mp4','.jpg','.png')) else zipfile.ZIP_DEFLATED)
with zipfile.ZipFile(dest)as z:
 assert z.testzip()is None and len(z.namelist())==len(set(z.namelist()))
 for n,row in manifest['files'].items():
  d=z.read(n);assert len(d)==row['bytes']and hashlib.sha256(d).hexdigest()==row['sha256'],n
assert dest.stat().st_size<=100000000
print(json.dumps({'path':str(dest),'bytes':dest.stat().st_size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'runtimeCommit':runtime,'packagingCommit':head,'includedDataFiles':len(index),'omittedDataFiles':len(omitted),'verifiedPayloads':len(payload)},indent=2))
