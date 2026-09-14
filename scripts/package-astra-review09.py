from pathlib import Path
import json,hashlib,zipfile,subprocess,re
root=Path.cwd().resolve();assert str(root)==r'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'
b=Path('director-kit/production/evidence/P04B2');files={}
def add(p,name=None):
 p=Path(p);assert p.is_file();assert not any(x in p.parts for x in ['.git','node_modules','dist','__pycache__','.tools']);assert not p.name.startswith('.env') and p.suffix not in ['.blend1','.bak','.key','.pem'];files[name or p.as_posix()]=p
build=json.loads((b/'build-inputs.json').read_text())
for n,h in build['inputs'].items():
 assert hashlib.sha256(Path(n).read_bytes()).hexdigest()==h,n
 add(n)
for n in ['README.md','AGENTS.md','.gitignore','.gitattributes','director-kit/AGENTS.md']:add(n)
for p in Path('director-kit/director-addenda/review-08').rglob('*'):
 if p.is_file() and p.suffix in ['.md','.json'] and 'evidence'not in p.parts:add(p)
for p in b.rglob('*'):
 if p.is_file() and p.suffix in ['.md','.json','.log'] and not any(x in ['agent','raw-video'] for x in p.parts):add(p)
for p in (b/'final-stills').glob('*.png'):add(p)
add(b/'smoke-final/bay-installed.png');add(b/'video-final/night-drive-silent.mp4')
assert len([n for n in files if n.endswith('.png')])==8
add(b/'REVIEW-ME-FIRST.md','REVIEW-ME-FIRST.md');add(b/'STATE-EXCERPT.json','director-kit/production/state.json')
for n,p in files.items():
 if p.suffix in ['.ts','.mjs','.js','.json','.py','.md','.html','.css']:assert not re.search(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:sk-proj-|ghp_)[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}',p.read_text(encoding='utf-8-sig')),n
manifest={'root':str(root),'runtimeCommit':build['commit'],'packagingCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'files':{n:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for n,p in sorted(files.items())}}
out=root/'Astra-Review-09.zip';i=2
while out.exists():out=root/f'Astra-Review-09-{i}.zip';i+=1
with zipfile.ZipFile(out,'x',zipfile.ZIP_DEFLATED,compresslevel=6)as z:
 for n,p in sorted(files.items()):z.write(p,n)
 z.writestr('PACKAGE-MANIFEST.json',json.dumps(manifest,indent=2))
with zipfile.ZipFile(out)as z:
 assert z.testzip()is None
 for n,v in manifest['files'].items():assert hashlib.sha256(z.read(n)).hexdigest()==v['sha256']
print(json.dumps({'path':str(out),'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'runtimeCommit':build['commit'],'packagingCommit':manifest['packagingCommit'],'files':len(files)+1},indent=2))
