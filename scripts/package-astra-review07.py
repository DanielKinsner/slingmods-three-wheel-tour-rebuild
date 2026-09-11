from pathlib import Path
import json,hashlib,zipfile,subprocess,re
ROOT=Path.cwd().resolve();assert str(ROOT)==r'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'
BASE=Path('director-kit/production/evidence');FINAL=BASE/'Review07-final';files={}
def add(p,name=None):
 p=Path(p);assert p.is_file(),p;assert not any(s in {'.git','node_modules','.tools','dist','__pycache__'}for s in p.parts);assert not p.name.startswith('.env') and p.suffix not in {'.blend1','.bak','.key','.pem'};files[name or p.as_posix()]=p
for folder in ['src','scripts','tests']:
 for p in Path(folder).rglob('*'):
  if p.is_file()and'__pycache__'not in p.parts:add(p)
for p in ['package.json','package-lock.json','index.html','vite.config.ts','tsconfig.json','README.md','AGENTS.md','.gitignore','.gitattributes','director-kit/AGENTS.md','director-kit/FRESH_START_POLICY.md']:add(p)
build=json.loads((FINAL/'build-inputs.json').read_text(encoding='utf-8'))
for p in build['inputs']:
 if p.startswith('public/'):add(p)
for p in Path('public/assets/textures/p03a1').glob('*.png'):add(p)
for p in ['assets/blender/vehicles/slingshot-p03a2.blend','assets/blender/vehicles/slingshot-p04a1.blend','public/assets/vehicles/slingshot-p03a2.glb','assets/blender/drivers/test-driver.blend','assets/blender/harbor/harbor.blend','assets/blender/harbor/harbor-p04a.blend']:add(p)
for p in Path('director-kit/director-addenda/review-06').rglob('*'):
 if p.is_file()and p.suffix in {'.md','.json','.txt','.py','.mjs'}:add(p)
for folder in ['Review07-final','Review07-rear','Review07-ui','Review07-performance']:
 for p in (BASE/folder).glob('*'):
  if p.is_file()and p.name not in {'STATE-EXCERPT.json','day-silent.mp4','night-silent.mp4'} and p.suffix in {'.md','.json','.png','.mp4'}:add(p)
for folder in ['P04A1','P04A2']:
 for p in (BASE/folder).rglob('*'):
  if p.is_file()and p.suffix in {'.md','.json','.log'} and not any(x in p.parts for x in ['before','references','reviewer-frames','candidate01-runtime','candidate02-runtime']):add(p)
add(FINAL/'REVIEW-ME-FIRST.md','REVIEW-ME-FIRST.md');add(FINAL/'STATE-EXCERPT.json','director-kit/production/state.json')
for name in ['03-day-waterfront.png','04-night-waterfront.png','05-day-corner.png','07-night-corner.png']:
 add(BASE/'Review06-final02'/name,'comparison-before/'+name)
add(BASE/'Review06-final02'/'build-inputs.json','comparison-before/build-inputs.json')
add(BASE/'Review06-final02'/'capture.json','comparison-before/capture.json')
for n,p in files.items():
 if p.suffix in {'.ts','.mjs','.js','.py','.md','.json','.txt','.css','.html'}:assert not re.search(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:sk-proj-|ghp_)[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}',p.read_text(encoding='utf-8-sig')),n
for p,h in build['inputs'].items():assert hashlib.sha256(Path(p).read_bytes()).hexdigest()==h,p
state=json.loads((FINAL/'STATE-EXCERPT.json').read_text(encoding='utf-8'));assert state['gates']['G3']['status']=='pending'and state['gates']['G4']['status']=='pending'
assert (BASE/'P04A1/review-final.md').is_file()
manifest={'root':str(ROOT),'runtimeCommit':build['commit'],'packagingCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'method':'Current rear/harbor implementation and authoring dependencies; fresh runtime stills, day/night laps, rear diagnostic motion and bay orbit, current state excerpt. Historical evidence retained in repository; four attributed matched before images included.','files':{n:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for n,p in sorted(files.items())}}
out=ROOT/'Astra-Review-07.zip';version=2
while out.exists():out=ROOT/f'Astra-Review-07-{version}.zip';version+=1
with zipfile.ZipFile(out,'x',zipfile.ZIP_DEFLATED,compresslevel=6)as z:
 for n,p in sorted(files.items()):z.write(p,n)
 z.writestr('PACKAGE-MANIFEST.json',json.dumps(manifest,indent=2))
with zipfile.ZipFile(out)as z:
 assert z.testzip()is None
 for n,v in manifest['files'].items():assert hashlib.sha256(z.read(n)).hexdigest()==v['sha256']
print(json.dumps({'path':str(out),'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'files':len(files)+1,'runtimeCommit':build['commit'],'packagingCommit':manifest['packagingCommit']},indent=2))
