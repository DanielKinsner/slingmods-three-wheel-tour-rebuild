"""Focused Review04 package; no historical archive, dependency download, secret or backup payload."""
from pathlib import Path
import hashlib,json,subprocess,zipfile,re
ROOT=Path.cwd().resolve();assert str(ROOT)==r'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'
files={}
def add(p,name=None):
 p=Path(p);assert p.is_file(),p
 assert not any(s in {'.git','node_modules','.tools','dist','__pycache__','video-temp'} or s.endswith('-frames') for s in p.parts),p
 assert not p.name.startswith('.env') and p.suffix not in {'.blend1','.bak','.key','.pem'},p
 files[name or p.as_posix()]=p
for folder in ['src','scripts','tests','public']:
 for p in Path(folder).rglob('*'):
  if p.is_file() and '__pycache__' not in p.parts:add(p)
for p in ['package.json','package-lock.json','index.html','vite.config.ts','tsconfig.json','README.md','AGENTS.md','.gitignore']:add(p)
# Editable new parts, integrated candidate and direct construction/source dependencies.
for p in ['vehicles/slingshot-p03a1.blend','vehicles/slingshot-p03a2-master01.blend','vehicles/slingshot-p03a2-proof01.blend','vehicles/slingshot-p03a2.blend','practice-p03b1.blend','inspection-bay-p03a1.blend','test-pad.blend']:add(Path('assets/blender')/p)
for p in ['AGENTS.md','FRESH_START_POLICY.md','production/state.json']:add(Path('director-kit')/p)
for p in Path('director-kit/director-addenda/review-03').glob('*'):
 if p.is_file() and p.suffix in {'.md','.json','.txt'}:add(p)
for p in Path('director-kit/references/slingshot-2024').glob('*'):
 if p.is_file() and p.suffix in {'.md','.json','.csv'}:add(p)
base=Path('director-kit/production/evidence')
for folder in ['Review04-final','Review04-browser']:
 for p in (base/folder).glob('*'):
  if p.is_file() and p.suffix in {'.png','.mp4','.json','.md'} and p.name!='practice-ui.png':add(p)
for rel in ['P03A2/artist/notes.md','P03A2/artist/proof01.json','P03A2/artist/integration.json','P03A2/artist/integration-validation.json','P03A2/artist/integration-frozen-neighbors.json','P03A2/review-proof01.md','P03A2/review-integration.md','P03B1/review-input-checkpoint.md','P03B1/review-final.md','P03B1/camera-comparison-final.json']:
 add(base/rel)
add(base/'Review04-final/REVIEW-ME-FIRST.md','REVIEW-ME-FIRST.md')
assert len([n for n in files if n.startswith('director-kit/production/evidence') and n.endswith('.png')])<=6
for n,p in files.items():
 if p.suffix in {'.ts','.js','.mjs','.json','.md','.py','.txt','.html','.css'}:
  s=p.read_text(encoding='utf-8-sig');assert not re.search(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:sk-proj-|ghp_)[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}',s),n
build=json.loads((base/'Review04-final/build-inputs.json').read_text(encoding='utf-8'))
for n,h in build['inputs'].items():assert hashlib.sha256(Path(n).read_bytes()).hexdigest()==h,n
assert json.loads(Path('director-kit/production/state.json').read_text(encoding='utf-8'))['gates']['G3']['status']=='pending'
manifest={'runtimeCommit':build['commit'],'packagingCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'root':str(ROOT),'files':{n:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for n,p in sorted(files.items())}}
output=ROOT/'Astra-Review-04.zip';version=2
while output.exists():output=ROOT/f'Astra-Review-04-{version}.zip';version+=1
with zipfile.ZipFile(output,'x',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for n,p in sorted(files.items()):z.write(p,n)
 z.writestr('PACKAGE-MANIFEST.json',json.dumps(manifest,indent=2))
with zipfile.ZipFile(output) as z:
 assert z.testzip() is None
 for n,v in manifest['files'].items():assert hashlib.sha256(z.read(n)).hexdigest()==v['sha256'],n
print(json.dumps({'path':str(output),'bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'files':len(files)+1,'runtimeCommit':build['commit'],'packagingCommit':manifest['packagingCommit']},indent=2))
