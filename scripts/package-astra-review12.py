from pathlib import Path
import json,hashlib,zipfile,subprocess,re,sys
root=Path.cwd().resolve();assert str(root)==r'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'
b=root/'director-kit/production/evidence/P06B';files={};sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def add(p,name=None):
 p=Path(p);assert p.is_file(),p
 assert not any(x in p.parts for x in ['.git','node_modules','dist','__pycache__','.tools','raw-video','agent','solo-agent','crew-agent'])
 assert not p.name.startswith('.env') and not re.search(r'\.blend\d+$',p.name) and p.suffix not in ['.bak','.key','.pem','.zip','.pyc']
 files[name or p.relative_to(root).as_posix()]=p
def tree(folder):
 for p in (root/folder).rglob('*'):
  if p.is_file() and not any(x in p.parts for x in ['__pycache__','node_modules']) and not re.search(r'\.blend\d+$',p.name):add(p)
build=json.loads((b/'build-inputs-verified.json').read_text(encoding='utf-8'))
for n,h in build['inputs'].items():assert sha(root/n)==h,'Frozen build input changed: '+n;add(root/n)
for folder in ['src','scripts','tests','public','assets/blender/showcase-quality']:tree(folder)
# Unchanged authoring dependency used for physical foundation; included for an offline rebuild.
add(root/'assets/blender/harbor/harbor.blend')
for n in ['index.html','package.json','package-lock.json','tsconfig.json','vite.config.ts','README.md','AGENTS.md','.gitignore','.gitattributes','AUTONOMOUS_RESUME.md','director-kit/AGENTS.md']:add(root/n)
for p in (root/'director-kit/director-addenda/review-11').rglob('*'):
 if p.is_file() and 'evidence' not in p.parts and p.suffix in ['.json','.md']:add(p)
for n in ['director-kit/production/evidence/P04B2/fixtures/review08-earned.json','director-kit/production/evidence/P05/solo-before.json']:add(root/n)
for p in b.glob('*'):
 if p.is_file() and p.suffix in ['.json','.md','.log'] and not p.name.startswith(('package-','quality-build-sample','quality-build-benchmark')):add(p)
for folder in ['artist','final-visual','matched-before','bay-before','bay-final','fresh-final','lifecycle-final','transitions-final','controller-final','audio-final','crew-ui-final','solo-ui-final','interface-final','video-final','day-final']:
 d=b/folder
 if d.exists():
  for p in d.glob('*'):
   if p.is_file() and p.suffix in ['.json','.md','.log','.png','.jpg']:add(p)
for pattern in ['verified-scored-*']:
 for d in b.glob(pattern):
  if d.is_dir():
   for n in ['run.json','provenance.json','bay.json','interruption.json','warm-transitions.json']:
    if(d/n).is_file():add(d/n)
# Selected same-hardware P06 comparison. Historic failure reports remain local, cited explicitly.
for folder in ['verified-scored-equipped1080','verified-scored-stock720']:
 for n in ['run.json','provenance.json']:
  p=root/'director-kit/production/evidence/P06'/folder/n
  if p.exists():add(p)
for p in [b/'video-final/complete-race-LIVE-AUDIO.mp4',b/'video-final/live-game-audio.webm',b/'day-final/garage-day-SILENT.mp4']:add(p)
add(b/'REVIEW-ME-FIRST.md','REVIEW-ME-FIRST.md');add(b/'STATE-EXCERPT.json','director-kit/production/state.json')
for n,p in files.items():
 if p.suffix in ['.ts','.mjs','.js','.json','.py','.md','.html','.css']:
  assert not re.search(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:sk-proj-|ghp_)[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}',p.read_text(encoding='utf-8-sig')),n
manifest={'root':str(root),'runtimeCommit':build['commit'],'packagingCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'runtimeInputManifest':'director-kit/production/evidence/P06B/build-inputs-verified.json','files':{n:{'bytes':p.stat().st_size,'sha256':sha(p)}for n,p in sorted(files.items())}}
if '--selection'in sys.argv:print(len(files),sum(p.stat().st_size for p in files.values()));sys.exit(0)
out=root/'Astra-Review-12.zip';i=2
while out.exists():out=root/f'Astra-Review-12-{i}.zip';i+=1
with zipfile.ZipFile(out,'x',zipfile.ZIP_DEFLATED,compresslevel=6)as z:
 for n,p in sorted(files.items()):z.write(p,n)
 z.writestr('PACKAGE-MANIFEST.json',json.dumps(manifest,indent=2))
with zipfile.ZipFile(out)as z:
 assert z.testzip()is None
 for n,v in manifest['files'].items():assert hashlib.sha256(z.read(n)).hexdigest()==v['sha256'] and len(z.read(n))==v['bytes']
result={'path':str(out),'bytes':out.stat().st_size,'sha256':sha(out),'runtimeCommit':build['commit'],'packagingCommit':manifest['packagingCommit'],'entries':len(files)+1,'verified':'Full CRC, every manifest SHA256 and length'};(b/'package-result.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result,indent=2))
