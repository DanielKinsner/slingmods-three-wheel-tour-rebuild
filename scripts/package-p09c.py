"""Review19 lean packet. Full runtime/editable inputs and original captures remain in Git."""
from pathlib import Path
import json,hashlib,subprocess,zipfile,tarfile,io,gzip
ROOT=Path(__file__).resolve().parents[1]
E=ROOT/'director-kit/production/evidence/P09C'
receipt=json.loads((ROOT/'handoff/P09C-VALIDATION.json').read_text(encoding='utf-8'))
assert receipt['functionalPass'] and receipt['remoteRecovery']['pass'] and receipt['hosted']['pass']
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
branch=subprocess.check_output(['git','branch','--show-current'],cwd=ROOT,text=True).strip()
assert branch=='main'
files={}
def add(p,dest=None):
 p=Path(p);files[dest or p.relative_to(ROOT).as_posix()]=p.read_bytes()
for tree in ['src','tests','director-kit/director-addenda/review-18']:
 for p in (ROOT/tree).rglob('*'):
  if p.is_file():add(p)
dependencies=['build-demo.mjs','build-vercel.mjs','stage-publish.mjs','serve-demo.mjs','static-demo.mjs','p08b-driving-evidence-agent.ts','p09a-driving-maneuvers.ts','p09b-integration.mjs','p09b-ui-validation.mjs']
for p in (ROOT/'scripts').iterdir():
 if p.is_file() and ('p09c' in p.name.lower() or p.name in dependencies):add(p)
for name in ['AGENTS.md','HANDOFF.md','README.md','package.json','package-lock.json','demo-assets.json','tsconfig.json','vite.config.ts','vercel.json','index.html','.gitattributes','.gitignore']:
 add(ROOT/name)
for p in (ROOT/'handoff').glob('P09C*'):
 if p.is_file() and p.name!='P09C-PACKET.json':add(p)
for name in ['REVIEW19-SUMMARY.md','P09C-AUDIT.md','PERFORMANCE.md']:
 add(E/name,'review/'+name)
add(E/'film-03/P09C-Freedom-to-Drive.mp4','media/P09C-Freedom-to-Drive.mp4')
add(E/'film-03/FILM-REVIEW.md','review/FILM-REVIEW.md')
screens=[('profile-entry-final-01/slingmods-sport-v2-current-copy.png','01-current-copy.png'),('signature-integration-final-01/06-cockpit-actual-motion.png','02-dashboard.png'),('film-03/05-reverse.png','03-reverse.png'),('film-03/07-race-cockpit.png','04-native-cockpit.png'),('film-03/08-race-result.png','05-race-result.png'),('film-03/09-same-build.png','06-same-build.png'),('hosted-root-final-02/root.png','07-hosted-root.png'),('hosted-final-02/04-same-build.png','08-hosted-return.png'),('motion-plots/matched-sweepers.png','09-matched-motion.png'),('motion-plots/cross50-held.png','10-crossing50mph.png')]
for source,name in screens:add(E/source,'screens/'+name)
buf=io.BytesIO();data_index={};member_names=set();payload_targets={}
with tarfile.open(fileobj=buf,mode='w:xz',preset=9) as tar:
 for p in sorted(E.rglob('*'),key=lambda p:(p.name,p.as_posix())):
  if not p.is_file() or p.suffix.lower() not in ['.json','.txt','.md','.csv','.gz','.html'] or 'raw-video' in p.parts:continue
  original=p.read_bytes();name=p.relative_to(E).as_posix();data=original;archived=name
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
files['verification/P09C-complete-data.tar.xz']=buf.getvalue()
files['verification/DATA-INDEX.json']=json.dumps(data_index,indent=2).encode()
files['START-HERE.md']=b'''# Astra Review19 - Freedom to Drive

Start with review/REVIEW19-SUMMARY.md and review/P09C-AUDIT.md. Watch media/P09C-Freedom-to-Drive.mp4: retained-v2/current-v3 matched continuous takes, ordinary driving and current race with actual game audio. The pad is a diagnostic fixture. The race is real; input automation and cuts are disclosed.

verification/P09C-complete-data.tar.xz contains all relevant numerical/verification data, including failed candidates and tests. Extract with Python tarfile or7-Zip. Original .json.gz members are expanded to .json before solid xz compression; no rows or values are removed. Byte-identical decoded files use standard TAR hardlinks: every path is present, with one stored payload for exact duplicates. DATA-INDEX.json maps and hashes original and extracted bytes and identifies links. The Git script scripts/verify-p09c-packet.py checks every logical member without extracting. Retrieve original compressed containers, raw videos and captured audio from Git if needed.

This is a review packet, not a standalone game distribution. Full runtime/editable assets and scripts are on main in the existing repository, which currently reports public. Follow HANDOFF.md and handoff/P09C-REQUIRED-ASSETS.json. Browser saves and installed tools/caches do not transfer with Git. No new account, spending, physical-device or final-fidelity approval is implied.
'''
manifest={'schemaVersion':1,'packet':'Astra-Review-19-Lean','branch':branch,'packagingCommit':head,'runtimeCommit':receipt['runtimeCommit'],'remote':receipt['remote'],'selfContainedBuild':False,'files':{n:{'bytes':len(d),'sha256':hashlib.sha256(d).hexdigest()} for n,d in files.items()}}
files['MANIFEST.json']=json.dumps(manifest,indent=2).encode()
output=ROOT/'Astra-Review-19-Lean.zip'
if output.exists():raise RuntimeError('Do not replace an existing final archive; resolve its identity first')
with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for n,data in files.items():z.writestr(n,data)
with zipfile.ZipFile(output) as z:
 assert z.testzip() is None
 for n,m in manifest['files'].items():assert hashlib.sha256(z.read(n)).hexdigest()==m['sha256']
assert output.stat().st_size<=100_000_000
result={'file':output.name,'bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'packagingCommit':head,'runtimeCommit':receipt['runtimeCommit'],'entries':len(files),'dataMembers':len(data_index)}
(ROOT/'handoff/P09C-PACKET.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps(result,indent=2))
