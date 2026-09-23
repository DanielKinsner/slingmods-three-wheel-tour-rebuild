"""Private, explicit-scope local delivery. No upload, publication or owner-profile access."""
import pathlib,json,shutil,hashlib,subprocess,zipfile,datetime
R=pathlib.Path(__file__).resolve().parents[2];E=R/'assets/spyder/evidence';O=R/'local-handoffs/SPYDER01-Complete-Local-Handoff-2026-09-23'
if O.exists():raise SystemExit('Staging directory already exists; inspect it before choosing a new output.')
O.mkdir(parents=True)
def copy(src,dst):
 src=R/src;dst=O/dst;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
def tree(src,dst):
 for p in (R/src).rglob('*'):
  if p.is_file():copy(p.relative_to(R),pathlib.Path(dst)/p.relative_to(R/src))
build=json.loads((R/'demo-current.json').read_text())
review=json.loads((R/build['output']/'review-build.json').read_text())
for name,expected in review['inputs'].items():
 with (R/name).open('rb') as f:assert hashlib.file_digest(f,'sha256').hexdigest()==expected,'Build input changed: '+name
tree(pathlib.Path(build['output']),pathlib.Path('game'))
for p in (O/'game').rglob('*'):
 if p.suffix.lower() in ['.blend','.obj','.mtl','.zip']:raise RuntimeError('Private source in served game: '+str(p))
copy(pathlib.Path('scripts/spyder/handoff-serve.mjs'),pathlib.Path('serve.mjs'));copy(pathlib.Path('scripts/static-demo.mjs'),pathlib.Path('static-demo.mjs'));copy(pathlib.Path('handoff/SPYDER01-COMPLETE.md'),pathlib.Path('README.md'));copy(pathlib.Path('handoff/SPYDER-VALIDATION.json'),pathlib.Path('SPYDER-VALIDATION.json'))
(O/'LAUNCH.cmd').write_text('@echo off\r\ncd /d "%~dp0"\r\nwhere node >nul 2>nul\r\nif errorlevel 1 (echo Install Node.js 20 or newer, then run this file again. & pause & exit /b 1)\r\nnode serve.mjs --open\r\nif errorlevel 1 pause\r\n',encoding='ascii')
changed=subprocess.check_output(['git','diff','--name-only','HEAD','-z'],cwd=R).decode().strip('\0').split('\0');new=subprocess.check_output(['git','ls-files','--others','--exclude-standard','-z'],cwd=R).decode().strip('\0').split('\0')
allowed=['src/','tests/spyder-','scripts/spyder/','assets/spyder/','public/assets/spyder/','public/assets/game-feel/loading/garage-spyder.jpg','handoff/SPYDER']
selected=set(changed+[n for n in new if any(n.startswith(p) for p in allowed)])
accepted_dirs={'matched','assembled-final','audio','career-final','cockpit','mixed','packaged-controls','packaged-roads-final','performance-final','departure','delivery-smoke'}
accepted_files={'basic-glb.json','build-final.log','build-equivalence.json','components.json','full-tests-final.log','gltf-validator.json','reimport.json','rider-weights.json','source-hashes-final.log','typecheck.log','source-import.json','source-import.log','source-preflight.json','ring-clearance.json','surface-mounts.json','suspension-tests.log','rig-tests.log','rider-background-check.png'}
for n in sorted(selected):
 if n.startswith('assets/spyder/evidence/'):
  part=pathlib.PurePosixPath(n).parts[3]
  if part not in accepted_dirs and part not in accepted_files:continue
  if pathlib.Path(n).name=='failure.png':continue
 if (R/n).is_file():copy(pathlib.Path(n),pathlib.Path('source-overlay')/n)
(O/'changes.patch').write_bytes(subprocess.check_output(['git','diff','--binary','HEAD'],cwd=R))
for n in ['Spyder-Calibrated-Master','Spyder-Game-Master','Spyder-Products','Spyder-Rider']:copy(pathlib.Path('.tools/spyder')/(n+'.blend'),pathlib.Path('masters')/(n+'.blend'))
copy(pathlib.Path('assets/blender/drivers/tour-rider.blend'),pathlib.Path('masters/Tour-Rider-Source.blend'))
copy(pathlib.Path('Spyder_Road_Codex_Kit.zip'),pathlib.Path('private-source/Spyder_Road_Codex_Kit.zip'));copy(pathlib.Path('.tools/spyder-kit/Spyder_Road_Codex_Kit/source/SOURCE_RECEIPT.json'),pathlib.Path('private-source/SOURCE_RECEIPT.json'))
copy(pathlib.Path('demo-current.json'),pathlib.Path('SOURCE-BUILD.json'))
files={}
for p in sorted(O.rglob('*')):
 if p.is_file():files[p.relative_to(O).as_posix()]={'bytes':p.stat().st_size,'sha256':hashlib.file_digest(p.open('rb'),'sha256').hexdigest()}
manifest={'created':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baseline':build['commit'],'private':True,'files':files,'bytes':sum(f['bytes'] for f in files.values()),'excludes':['owner browser saves','credentials','node_modules','Git history','unrelated owner work','unused original download','Blender application'],'game':build}
(O/'HANDOFF-MANIFEST.json').write_text(json.dumps(manifest,indent=2))
zpath=O.with_suffix('.zip')
with zipfile.ZipFile(zpath,'w',zipfile.ZIP_DEFLATED,compresslevel=6,allowZip64=True) as z:
 for p in sorted(O.rglob('*')):
  if p.is_file():z.write(p,p.relative_to(O))
with zipfile.ZipFile(zpath) as z:
 assert z.testzip() is None
 assert set(z.namelist())==set(files)|{'HANDOFF-MANIFEST.json'}
 for name,record in files.items():
  with z.open(name) as f:assert hashlib.file_digest(f,'sha256').hexdigest()==record['sha256'],name
sha=hashlib.file_digest(zpath.open('rb'),'sha256').hexdigest();zpath.with_suffix('.zip.sha256').write_text(sha+'  '+zpath.name+'\n')
result={'status':'PASS','zip':str(zpath),'sha256':sha,'bytes':zpath.stat().st_size,'members':len(files)+1,'crcAndAllMemberHashesVerified':True}
zpath.with_suffix('.verified.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
