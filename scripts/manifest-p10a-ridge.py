"""Hash closure for new Ridge runtime/editable files and their shared texture/sign inputs."""
import hashlib,json,re,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1]
files=set()
for folder in ['assets/blender/ridge','public/assets/ridge','src/ridge']:
 for p in (root/folder).rglob('*'):
  if p.is_file() and not p.name.endswith(('.blend1','.blend2')):files.add(p)
for name in ['author-p10a-ridge.py','author-p10a-land.py','author-p10a-terrain.py','export-p10a-terrain.ts','p10a-art-requirements.txt','manifest-p10a-ridge.py']:
 files.add(root/'scripts'/name)
asset_source=(root/'src/ridge/assets.ts').read_text(encoding='utf-8')
for literal in re.findall(r"'([^']+)'",asset_source):
 if literal.startswith('/assets/') and not literal.endswith('/'):files.add(root/'public'/literal.lstrip('/'))
 elif literal.endswith('.jpg'):files.add(root/'public/assets/showcase-quality/textures'/literal)
for name in ['source-manifest.json','p06c-road-provenance.json']:files.add(root/'public/assets/showcase-quality'/name)
rows=[]
for p in sorted(files):
 data=p.read_bytes();path=p.relative_to(root).as_posix();rows.append({'path':path,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'role':'runtime asset'if path.startswith('public/assets/ridge/')else'shared runtime/provenance'if path.startswith('public/')else'editable authoring/source'})
out=root/'handoff/P10A-RIDGE-ASSETS.json';out.write_text(json.dumps({'scope':'Complete new Ridge destination inputs plus reused texture/sign dependency closure. Existing vehicle/products/audio closure remains in the full project required-assets manifest. No backup .blend1 files are required.','manifestScript':'scripts/manifest-p10a-ridge.py','sourceHeadAtCapture':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'workingTreeInputs':True,'files':rows,'totalBytes':sum(r['bytes']for r in rows)},indent=2),encoding='utf-8');print(len(rows),'files;',sum(r['bytes']for r in rows),'bytes;',out)
