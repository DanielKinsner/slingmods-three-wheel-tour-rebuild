from pathlib import Path
import json,hashlib,zipfile,subprocess,re,sys
root=Path(__file__).resolve().parents[1]
b=root/'director-kit/production/evidence/P06C';files={};sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def add(p,name=None):
 p=Path(p);assert p.is_file(),p
 assert not any(x in p.parts for x in ['.git','node_modules','dist','__pycache__','.tools','raw-video','agent','solo-agent','crew-agent'])
 assert not p.name.startswith('.env') and not re.search(r'\.blend\d+$',p.name) and p.suffix not in ['.bak','.key','.pem','.zip','.pyc']
 files[name or p.relative_to(root).as_posix()]=p
def tree(folder):
 for p in (root/folder).rglob('*'):
  if p.is_file() and not any(x in p.parts for x in ['__pycache__','node_modules']) and not re.search(r'\.blend\d+$',p.name):add(p)
build=json.loads((b/'build-inputs-verified.json').read_text(encoding='utf-8'))
amendment_path=b/'post-build-tool-amendments.json'
amendments=json.loads(amendment_path.read_text())['files'] if amendment_path.exists() else {}
allowed_amendments={'scripts/summarize-review13.py','scripts/package-astra-review13.py'}
assert set(amendments)<=allowed_amendments,'Only reviewed post-build scoring/packaging tools may differ'
for n,h in build['inputs'].items():
 actual=sha(root/n)
 if actual!=h:
  assert n in amendments and amendments[n]['beforeSHA256']==h and amendments[n]['afterSHA256']==actual,'Frozen runtime/build input changed: '+n
 add(root/n)
for folder in ['src','scripts','tests','public','assets/blender/showcase-quality']:tree(folder)
# Unchanged authoring dependency used for physical foundation; included for an offline rebuild.
add(root/'assets/blender/harbor/harbor.blend')
for n in ['index.html','package.json','package-lock.json','tsconfig.json','vite.config.ts','README.md','AGENTS.md','.gitignore','.gitattributes','RESUME.md','HANDOFF.md','director-kit/AGENTS.md']:add(root/n)
for p in (root/'director-kit/director-addenda/review-12').rglob('*'):
 if p.is_file() and 'evidence' not in p.parts and p.suffix in ['.json','.md']:add(p)
for n in ['director-kit/production/evidence/P04B2/fixtures/review08-earned.json','director-kit/production/evidence/P05/solo-before.json']:add(root/n)
for p in b.glob('*'):
 if p.is_file() and p.suffix in ['.json','.md','.log'] and not p.name.startswith(('package-','quality-build-sample','quality-build-benchmark')):add(p)
for folder in ['artist','full-visual-02','sample-foliage-02','matched-before','bay-before','bay-final','fresh-final','lifecycle-final','transitions-final','controller-final','audio-final','inspection-final','crew-ui-final','solo-ui-final','interface-final','video-final','day-final','foliage-final']:
 d=b/folder
 if d.exists():
  for p in d.glob('*'):
   if p.is_file() and p.suffix in ['.json','.md','.log','.png','.jpg']:add(p)
# Small representative revision set; full trials stay local.
for folder in ['sample-visual-01','sample-visual-02','sample-visual-03','full-visual-01']:
 for name in ['district-service-day.png','district-service-night.png','district-sample-apex-day.png','district-service-return-day.png','source-inputs.json','asset-provenance.json']:
  p=b/folder/name
  if p.exists():add(p)
for pattern in ['verified-scored-*','day-scored-*','heavy1080-followup']:
 for d in b.glob(pattern):
  if d.is_dir():
   for n in ['run.json','provenance.json','bay.json','interruption.json','warm-transitions.json']:
    if(d/n).is_file():add(d/n)
# Immutable before fixture and its original source receipt, retained for comparison provenance.
for n in ['director-kit/production/evidence/P06/full-art-review-02/fixture/scene.js','director-kit/production/evidence/P06/full-art-review-02/source-inputs.json']:add(root/n)
# Curated causal integrity/depth evidence, not the redundant trial archive.
for folder in ['water-diagnosis-02','depth-verification-02']:
 for p in (b/folder).glob('*'):
  if p.is_file() and p.suffix in ['.json','.md']:add(p)
# Historical telemetry fixture is an input for repeatable matched-camera captures, not current timing proof.
add(root/'director-kit/production/evidence/P06/baseline-stock720/run.json')
for p in [b/'video-final/complete-race-LIVE-AUDIO.mp4',b/'video-final/live-game-audio.webm',b/'day-final/complete-race-LIVE-AUDIO.mp4',b/'day-final/live-game-audio.webm']:add(p)
for p in (b/'setup').glob('*.log'):add(p)
add(b/'REVIEW-ME-FIRST.md','REVIEW-ME-FIRST.md');add(b/'STATE-EXCERPT.json','director-kit/production/state.json')
for n,p in files.items():
 if p.suffix in ['.ts','.mjs','.js','.json','.py','.md','.html','.css']:
  assert not re.search(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:sk-proj-|ghp_)[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}',p.read_text(encoding='utf-8-sig')),n
manifest={'root':str(root),'runtimeCommit':build['commit'],'packagingCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'runtimeInputManifest':'director-kit/production/evidence/P06C/build-inputs-verified.json','postBuildToolAmendments':'director-kit/production/evidence/P06C/post-build-tool-amendments.json','files':{n:{'bytes':p.stat().st_size,'sha256':sha(p)}for n,p in sorted(files.items())}}
if '--selection'in sys.argv:print(len(files),sum(p.stat().st_size for p in files.values()));sys.exit(0)
out=root/'Astra-Review-13.zip';i=2
while out.exists():out=root/f'Astra-Review-13-{i}.zip';i+=1
with zipfile.ZipFile(out,'x',zipfile.ZIP_DEFLATED,compresslevel=6)as z:
 for n,p in sorted(files.items()):z.write(p,n)
 z.writestr('PACKAGE-MANIFEST.json',json.dumps(manifest,indent=2))
with zipfile.ZipFile(out)as z:
 assert z.testzip()is None
 for n,v in manifest['files'].items():assert hashlib.sha256(z.read(n)).hexdigest()==v['sha256'] and len(z.read(n))==v['bytes']
result={'path':str(out),'bytes':out.stat().st_size,'sha256':sha(out),'runtimeCommit':build['commit'],'packagingCommit':manifest['packagingCommit'],'entries':len(files)+1,'verified':'Full CRC, every manifest SHA256 and length'};(b/'package-result.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result,indent=2))
