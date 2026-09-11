from pathlib import Path
import json,hashlib,zipfile,subprocess,re
root=Path.cwd().resolve();assert str(root)==r'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'
b=Path('director-kit/production/evidence');f=b/'Review08-final';files={}
def add(p,name=None):
 p=Path(p);assert p.is_file(),p;assert not any(x in p.parts for x in ['.git','node_modules','dist','__pycache__','.tools']);assert not p.name.startswith('.env')and p.suffix not in ['.blend1','.bak','.key','.pem'];files[name or p.as_posix()]=p
build=json.loads((f/'build-inputs.json').read_text())
for folder in ['src','tests','scripts']:
 for p in Path(folder).rglob('*'):
  if p.is_file()and '__pycache__'not in p.parts:add(p)
for n in ['index.html','package.json','package-lock.json','tsconfig.json','vite.config.ts','README.md','AGENTS.md','.gitignore','.gitattributes','director-kit/AGENTS.md']:add(n)
for n,h in build['inputs'].items():
 assert hashlib.sha256(Path(n).read_bytes()).hexdigest()==h,n
 if n.startswith('public/'):add(n)
for n in ['assets/blender/products/tricled-sm133-base.blend','assets/blender/vehicles/slingshot-p04a1.blend']:add(n)
for p in Path('director-kit/director-addenda/review-07').rglob('*'):
 if p.is_file()and p.suffix in ['.md','.json']:add(p)
for folder in ['Review08-final','Review08-browser','Review08-ui','Review08-profile']:
 for p in (b/folder).glob('*'):
  if p.is_file()and p.suffix in ['.md','.json','.png','.mp4']and p.name not in ['night-silent.mp4','earned-storage-state.json','STATE-EXCERPT.json']:add(p)
for p in (b/'P04B1').rglob('*'):
 if p.is_file()and p.suffix in ['.md','.json','.log']and not any(x.startswith('browser')or x in ['reference-images','reviewer-frames']for x in p.relative_to(b/'P04B1').parts):add(p)
add(f/'REVIEW-ME-FIRST.md','REVIEW-ME-FIRST.md');add(f/'STATE-EXCERPT.json','director-kit/production/state.json')
assert (b/'P04B1/review-final.md').exists()
for n,p in files.items():
 if p.suffix in ['.ts','.mjs','.js','.json','.py','.md','.html','.css']:assert not re.search(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:sk-proj-|ghp_)[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}',p.read_text(encoding='utf-8-sig')),n
manifest={'root':str(root),'runtimeCommit':build['commit'],'packagingCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'method':'Review08 current inputs and curated ordinary UI/night evidence. Prior source/evidence retained locally. New accessory editable source includes current car source only because it is a linked fitting dependency.','files':{n:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for n,p in sorted(files.items())}}
out=root/'Astra-Review-08.zip';i=2
while out.exists():out=root/f'Astra-Review-08-{i}.zip';i+=1
with zipfile.ZipFile(out,'x',zipfile.ZIP_DEFLATED,compresslevel=6)as z:
 for n,p in sorted(files.items()):z.write(p,n)
 z.writestr('PACKAGE-MANIFEST.json',json.dumps(manifest,indent=2))
with zipfile.ZipFile(out)as z:
 assert z.testzip()is None
 for n,v in manifest['files'].items():assert hashlib.sha256(z.read(n)).hexdigest()==v['sha256']
print(json.dumps({'path':str(out),'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'runtimeCommit':build['commit'],'packagingCommit':manifest['packagingCommit'],'files':len(files)+1},indent=2))
