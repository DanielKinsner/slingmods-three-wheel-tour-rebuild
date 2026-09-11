"""Compact Review05 handoff: current assets and selected proof, without overwriting archives."""
from pathlib import Path
import json,hashlib,zipfile,subprocess,re
ROOT=Path.cwd().resolve();assert str(ROOT)==r'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'
BASE=Path('director-kit/production/evidence');FINAL=BASE/'Review05-final';files={}
def add(p,name=None):
 p=Path(p);assert p.is_file(),p
 assert not any(s in {'.git','node_modules','.tools','dist','__pycache__'} or s.endswith('-frames') for s in p.parts),p
 assert not p.name.startswith('.env') and p.suffix not in {'.blend1','.bak','.key','.pem'},p
 files[name or p.as_posix()]=p
for folder in ['src','scripts','tests']:
 for p in Path(folder).rglob('*'):
  if p.is_file() and '__pycache__'not in p.parts:add(p)
for p in ['package.json','package-lock.json','index.html','vite.config.ts','tsconfig.json','README.md','AGENTS.md','.gitignore','.gitattributes','director-kit/AGENTS.md','director-kit/FRESH_START_POLICY.md']:add(p)
build=json.loads((FINAL/'build-inputs.json').read_text(encoding='utf-8'))
for p in build['inputs']:
 if p.startswith('public/'):add(p)
# Current car's editable source and reused maps are direct anchor-inspection/source dependencies.
for p in Path('public/assets/textures/p03a1').glob('*.png'):add(p)
for p in ['assets/blender/vehicles/slingshot-p03a2.blend','assets/blender/drivers/test-driver.blend','public/assets/practice-p03b1.json','public/assets/calibration.glb']:add(p)
for p in Path('director-kit/director-addenda/review-04').glob('*'):
 if p.is_file() and p.suffix in {'.md','.json','.txt'}:add(p)
for name in ['CODEX_NEXT.md','FIRST_DRIVE_SPEC.md','EVIDENCE_REQUEST.md']:
 assert Path('director-kit/director-addenda/review-04',name).is_file()
for p in FINAL.glob('*'):
 if p.is_file() and p.name not in {'first-drive-video.mp4','first-drive-aligned.wav','STATE-EXCERPT.json'} and p.suffix in {'.md','.json','.png','.wav','.mp4'}:add(p)
add(FINAL/'REVIEW-ME-FIRST.md','REVIEW-ME-FIRST.md');add(FINAL/'STATE-EXCERPT.json','director-kit/production/state.json');add(BASE/'Review05-browser-final/audio-browser.json')
for p in ['P03B2/review-final.md','P03B2/final-diagnostics.json','P03B2/artist/construction.md','P03B2/artist/driver-final-manifest.json','P03B2/artist/material01-validation.json','P03B2/artist/texture-manifest.json','P03B2/tests-frozen.log','P03B2/input-rpm-frozen.log','P03B2/build-frozen.log']:add(BASE/p)
assert len([n for n in files if n.startswith('director-kit/production/evidence') and n.endswith('.png')])<=6
assert len([n for n in files if n.endswith('.mp4')])==1
for n,p in files.items():
 if p.suffix in {'.ts','.mjs','.js','.py','.md','.json','.txt','.css','.html'}:assert not re.search(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:sk-proj-|ghp_)[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}',p.read_text(encoding='utf-8-sig')),n
for p,h in build['inputs'].items():assert hashlib.sha256(Path(p).read_bytes()).hexdigest()==h,p
assert json.loads((FINAL/'STATE-EXCERPT.json').read_text(encoding='utf-8'))['gates']['G3']['status']=='pending'
manifest={'root':str(ROOT),'runtimeCommit':build['commit'],'packagingCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'method':'Current runtime assets; complete new driver authoring dependencies; six selected PNGs and one muxed film; historical comparison intermediates remain in full checkout. state.json is a current ledger excerpt.','files':{n:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for n,p in sorted(files.items())}}
out=ROOT/'Astra-Review-05.zip';version=2
while out.exists():out=ROOT/f'Astra-Review-05-{version}.zip';version+=1
with zipfile.ZipFile(out,'x',zipfile.ZIP_DEFLATED,compresslevel=6)as z:
 for n,p in sorted(files.items()):z.write(p,n)
 z.writestr('PACKAGE-MANIFEST.json',json.dumps(manifest,indent=2))
with zipfile.ZipFile(out)as z:
 assert z.testzip()is None
 for n,v in manifest['files'].items():assert hashlib.sha256(z.read(n)).hexdigest()==v['sha256'],n
print(json.dumps({'path':str(out),'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'files':len(files)+1,'runtimeCommit':build['commit'],'packagingCommit':manifest['packagingCommit']},indent=2))
