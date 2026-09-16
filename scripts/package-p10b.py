"""Review21 lean packet. Full runtime/editable inputs and original captures remain in Git."""
from pathlib import Path
import json,hashlib,subprocess,zipfile,tarfile,io,gzip
ROOT=Path(__file__).resolve().parents[1]
E=ROOT/'director-kit/production/evidence/P10B'
receipt=json.loads((ROOT/'handoff/P10B-VALIDATION.json').read_text(encoding='utf-8'))
assert receipt['functionalPass'] and receipt['native']['pass'] and receipt['film']['pass'] and receipt['remoteRecovery']['pass'] and receipt['hosted']['pass']
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
branch=subprocess.check_output(['git','branch','--show-current'],cwd=ROOT,text=True).strip()
assert branch=='main'
files={}
def add(p,dest=None):
 p=Path(p);files[dest or p.relative_to(ROOT).as_posix()]=p.read_bytes()
for tree in ['src','tests','director-kit/director-addenda/review-20']:
 for p in (ROOT/tree).rglob('*'):
  if p.is_file():add(p)
dependencies=['build-demo.mjs','build-vercel.mjs','stage-publish.mjs','serve-demo.mjs','static-demo.mjs','p08b-driving-evidence-agent.ts','p09a-driving-maneuvers.ts','p09b-integration.mjs','p09b-ui-validation.mjs','p09c-career-driver.ts','p09c-finish-first-driver.ts','p09c-motion.ts','p09c-motion-protocol.ts','export-ridge-preview.ts','p10a-finish-wait-resume.mjs','p10a-career-loop.mjs']
for p in (ROOT/'scripts').iterdir():
 if p.is_file() and ('p10b' in p.name.lower() or p.name in dependencies):add(p)
for name in ['AGENTS.md','HANDOFF.md','README.md','package.json','package-lock.json','demo-assets.json','tsconfig.json','vite.config.ts','vercel.json','index.html','.gitattributes','.gitignore']:
 add(ROOT/name)
for p in (ROOT/'handoff').glob('P10B*'):
 if p.is_file() and p.name!='P10B-PACKET.json':add(p)
for name in ['REVIEW21-SUMMARY.md','P10B-AUDIT.md','PERFORMANCE.md']:
 add(E/name,'review/'+name)
film=receipt['film']['directory']
add(E/film/'P10B-Cinematic-Identity.mp4','media/P10B-Cinematic-Identity.mp4')
add(E/film/'FILM-REVIEW.md','review/FILM-REVIEW.md')
screens=[(v['source'],v['name']) for v in receipt['stills']]
for source,name in screens:add(E/source,'screens/'+name)
buf=io.BytesIO();data_index={};member_names=set();payload_targets={}
with tarfile.open(fileobj=buf,mode='w:xz',preset=6) as tar:
 for p in sorted(E.rglob('*'),key=lambda p:(p.name,p.as_posix())):
  if not p.is_file() or p.suffix.lower() not in ['.json','.txt','.md','.csv','.gz','.html','.log'] or 'raw-video' in p.parts:continue
  name=p.relative_to(E).as_posix()
  selected=receipt['packetDataDirectories']
  if p.parent!=E and name.split('/')[0] not in selected:continue
  original=p.read_bytes();data=original;archived=name
  # Decode JSON gzip containers before solid xz compression. Original gzip bytes
  # remain in Git; every JSON number/row is unchanged and separately hashed here.
  if name.endswith('.json.gz'):data=gzip.decompress(original);archived=name[:-3]
  assert archived not in member_names, 'Archive data path collision: '+archived
  member_names.add(archived)
  data_index[name]={'originalBytes':len(original),'originalSHA256':hashlib.sha256(original).hexdigest(),'member':archived,'memberBytes':len(data),'memberSHA256':hashlib.sha256(data).hexdigest()}
  info=tarfile.TarInfo(archived);info.mtime=0;digest=hashlib.sha256(data).hexdigest()
  if digest in payload_targets:
   # Standard TAR hardlinks preserve every logical file/path while storing
   # byte-identical payloads once. No numerical rows or precision are removed.
   info.type=tarfile.LNKTYPE;info.linkname=payload_targets[digest];tar.addfile(info)
   data_index[name]['hardlinkTarget']=info.linkname
  else:
   info.size=len(data);tar.addfile(info,io.BytesIO(data));payload_targets[digest]=archived
files['verification/P10B-complete-data.tar.xz']=buf.getvalue()
files['verification/DATA-INDEX.json']=json.dumps(data_index,indent=2).encode()
files['START-HERE.md']=b"""# Astra Review21 - Cinematic Identity

Read review/REVIEW21-SUMMARY.md, review/P10B-AUDIT.md and review/PERFORMANCE.md. Watch media/P10B-Cinematic-Identity.mp4: actual entry, orbit, Tour Wall, configuration, destination selection, continuous real-speed Smoky Ridge lap, results, same-build return and labeled Thermal departure excerpt with captured game audio. Automated control inputs and loading cuts are disclosed.

verification/P10B-complete-data.tar.xz contains all selected final numerical/verification data and material failures. DATA-INDEX.json maps original Git bytes to standard TAR members; .json.gz is expanded losslessly before XZ compression. Exact duplicate contents use standard TAR hardlinks. No timing rows/precision are discarded. scripts/verify-p10b-packet.py verifies every member without extracting. Review DELIVERY-INVENTORY.json for every original full/raw evidence file, including omitted exploratory data and raw video/audio, with exact Git paths/hashes. Original assets and all raw evidence are recovered through Git, not from this lean packet.

This is a review packet, not a standalone game distribution. Full runtime/editable assets, authoring scripts and preserved historical deliveries remain on main. Follow HANDOFF.md and handoff/P10B-REQUIRED-ASSETS.json and the referenced source manifests. Browser saves and installed tools/caches do not transfer with Git. No new account, spending, hardware or final-fidelity approval is implied.
"""
add(E/'DELIVERY-INVENTORY.json','review/DELIVERY-INVENTORY.json')
manifest={'schemaVersion':1,'packet':'Astra-Review-21-Lean','branch':branch,'packagingCommit':head,'runtimeCommit':receipt['runtimeCommit'],'remote':receipt['remote'],'selfContainedBuild':False,'files':{n:{'bytes':len(d),'sha256':hashlib.sha256(d).hexdigest()} for n,d in files.items()}}
files['MANIFEST.json']=json.dumps(manifest,indent=2).encode()
output=ROOT/'Astra-Review-21-Lean.zip'
if output.exists():raise RuntimeError('Do not replace an existing final archive; resolve its identity first')
with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for n,data in files.items():z.writestr(n,data)
with zipfile.ZipFile(output) as z:
 assert z.testzip() is None
 for n,m in manifest['files'].items():assert hashlib.sha256(z.read(n)).hexdigest()==m['sha256']
assert output.stat().st_size<=100_000_000
result={'file':output.name,'bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'packagingCommit':head,'runtimeCommit':receipt['runtimeCommit'],'entries':len(files),'dataMembers':len(data_index)}
(ROOT/'handoff/P10B-PACKET.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps(result,indent=2))
