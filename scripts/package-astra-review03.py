"""Package the focused P03A1 implementation and explicit evidence selection without overwriting."""
from pathlib import Path
import hashlib,json,subprocess,zipfile
ROOT=Path.cwd().resolve()
assert str(ROOT)==r"C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild"
files={}
def add(p,name=None):
 p=Path(p)
 assert p.is_file(),p
 assert not any(s in {'.git','node_modules','.tools','dist','__pycache__','video-temp'} or s.endswith('-frames') for s in p.parts),p
 assert not p.name.startswith('.env') and p.suffix not in {'.blend1','.bak','.key','.pem'},p
 files[name or p.as_posix()]=p
for folder in ['src','scripts','tests','public']:
 for p in Path(folder).rglob('*'):
  if p.is_file() and '__pycache__' not in p.parts:add(p)
for p in ['package.json','package-lock.json','index.html','vite.config.ts','tsconfig.json','README.md','AGENTS.md','.gitignore']:add(p)
for p in ['vehicles/slingshot-p03a.blend','vehicles/slingshot-p03a1.blend','inspection-bay-p03a1.blend','test-pad.blend','calibration.blend']:add(Path('assets/blender')/p)
for p in Path('director-kit').rglob('*'):
 if p.is_file() and 'evidence' not in p.parts and '__pycache__' not in p.parts and p.suffix.lower() in {'.md','.json','.py','.csv','.txt','.yaml','.yml'}:add(p)
base=Path('director-kit/production/evidence/P03A1')
selection=json.loads((base/'package-selection.json').read_text(encoding='utf-8-sig'))
for p in selection:add(base/p)
add(base/'REVIEW-ME-FIRST.md','REVIEW-ME-FIRST.md')
manifest={'commit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'root':str(ROOT),'files':{n:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for n,p in sorted(files.items())}}
output=ROOT/'Astra-Review-03.zip';version=2
while output.exists():output=ROOT/f'Astra-Review-03-{version}.zip';version+=1
with zipfile.ZipFile(output,'x',zipfile.ZIP_DEFLATED,compresslevel=6)as z:
 for name,p in sorted(files.items()):z.write(p,name)
 z.writestr('PACKAGE-MANIFEST.json',json.dumps(manifest,indent=2))
with zipfile.ZipFile(output)as z:
 assert z.testzip() is None
 for n,v in manifest['files'].items():assert hashlib.sha256(z.read(n)).hexdigest()==v['sha256'],n
print(json.dumps({'path':str(output),'bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'files':len(files)+1,'commit':manifest['commit']},indent=2))
