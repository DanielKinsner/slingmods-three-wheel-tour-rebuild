"""Create a review-only ZIP from explicit source and evidence allowlists. No source mutation."""
from pathlib import Path
import hashlib,json,subprocess,zipfile
ROOT=Path.cwd().resolve()
EXPECTED=Path(r'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild')
assert ROOT==EXPECTED.resolve(),str(ROOT)
entries={}
def add(p,archive=None):
 p=Path(p)
 if not p.is_file():raise FileNotFoundError(p)
 parts=p.parts
 if any(x in {'.git','node_modules','.tools','dist','__pycache__','video-temp'} for x in parts):raise ValueError(p)
 if p.name.startswith('.env') or p.suffix in {'.blend1','.bak','.pem','.key'}:raise ValueError(p)
 entries[archive or p.as_posix()]=p
for folder in ['src','scripts','tests','public']:
 for p in Path(folder).rglob('*'):
  if p.is_file() and '__pycache__' not in p.parts:add(p)
for name in ['package.json','package-lock.json','index.html','vite.config.ts','tsconfig.json','README.md','AGENTS.md','.gitignore']:add(name)
for name in ['calibration.blend','test-pad.blend','inspection-bay-p03a.blend','vehicles/slingshot-p01.blend','vehicles/slingshot-p03a.blend','vehicles/vehicles-scale-blockouts.blend']:add(Path('assets/blender')/name)
# Include production guidance and current ledgers, but not research-photo binaries or full old evidence.
for p in Path('director-kit').rglob('*'):
 if not p.is_file() or 'evidence' in p.parts or '__pycache__' in p.parts:continue
 if p.suffix.lower() in {'.md','.json','.py','.csv','.txt','.yml','.yaml'}:add(p)
for gate in ['G0','G1','G2']:
 for p in (Path('director-kit/production/evidence')/gate).glob('review.*'):add(p)
addendum=Path('director-kit/production/evidence/G2-addendum-01')
for p in addendum.iterdir():
 if p.is_file():add(p)
p03=Path('director-kit/production/evidence/P03A')
for name in ['REVIEW-ME-FIRST.md','REVIEW.md','review-final.md','review-final.json','STATISTICS.md','final-test.log','final-build-02.log','final-asset-census.json','review-surface05.md','review-material04.md','CAPTURE-CORRECTION.md']:
 add(p03/name)
add(p03/'REVIEW-ME-FIRST.md','REVIEW-ME-FIRST.md')
for folder in ['final-02','verification-final-02']:
 for p in (p03/folder).iterdir():
  if p.is_file():add(p)
for name in ['turntable-runtime-stepped-SILENT.mp4','provenance.json']:add(p03/'final-02'/'turntable'/name)
for name in ['DIAGNOSIS.md','band-reproduced.png','keyboard-legacy-SILENT.webm','keyboard-repaired-SILENT.webm','keyboard-legacy.json','keyboard-repaired.json']:
 add(p03/'shadows'/name)
for name in ['texture-manifest.json','asset-census.json','export-validation.json','construction-checkpoints.md','source-optical-visibility.json']:
 add(p03/'artist'/name)
# Compact glossy surface checkpoint; older failed revisions remain in repository workspace.
for name in ['threequarter.png','cockpit.png','sweep-0.png','sweep-1.png','sweep-2.png','sweep-3.png','whole-asset-census.json']:
 add(p03/'surface-check-05'/name)
commit=subprocess.check_output(['git','rev-parse','HEAD'],text=True,cwd=ROOT).strip()
manifest={'commit':commit,'root':str(ROOT),'files':{n:{'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size}for n,p in sorted(entries.items())},'exclusions':'No Git database, dependencies, downloaded tools, dist, secrets, environment files, backups or redundant historical evidence. Historical gate validators require the full preserved local archive, intentionally omitted here.'}
output=ROOT/'Astra-Review-02.zip';i=2
while output.exists():output=ROOT/f'Astra-Review-02-{i}.zip';i+=1
with zipfile.ZipFile(output,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for n,p in sorted(entries.items()):z.write(p,n)
 z.writestr('PACKAGE-MANIFEST.json',json.dumps(manifest,indent=2))
with zipfile.ZipFile(output)as z:
 assert z.testzip() is None
 for n,info in manifest['files'].items():assert hashlib.sha256(z.read(n)).hexdigest()==info['sha256'],n
print(json.dumps({'path':str(output),'bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'files':len(entries)+1,'commit':commit},indent=2))
