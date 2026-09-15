"""Verify every required runtime/editable asset from a remote checkout."""
from pathlib import Path
import hashlib,json,subprocess
r=Path(__file__).resolve().parents[1]
m=json.loads((r/'handoff/P09A-ASSETS.json').read_text())
tracked=set(subprocess.check_output(['git','ls-files'],cwd=r,text=True).splitlines())
for name,row in m['files'].items():
 assert name in tracked, f'Untracked required asset: {name}'
 data=(r/name).read_bytes()
 if row.get('normalizedLFSHA256'):
  assert hashlib.sha256(data.replace(b'\r\n',b'\n')).hexdigest()==row['normalizedLFSHA256'],name
 else:
  assert len(data)==row['bytes'] and hashlib.sha256(data).hexdigest()==row['sha256'],name
print(json.dumps({'pass':True,'assets':len(m['files']),'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=r,text=True).strip(),'method':'All paths tracked and byte/hash verified; declared text uses LF normalization only.'}))
