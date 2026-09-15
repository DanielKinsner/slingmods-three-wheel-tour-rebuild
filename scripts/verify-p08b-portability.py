"""Verify current runtime and editable inputs from a normal clone; no ignored assets required."""
import hashlib, json, subprocess, sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'handoff/P08B-ASSET-MANIFEST.json').read_text(encoding='utf-8'))
tracked=set(subprocess.check_output(['git','ls-files'],cwd=root,text=True).splitlines())
fail=[]
for name,row in manifest['files'].items():
 p=root/name
 if name not in tracked or not p.is_file():fail.append(name+': missing/untracked');continue
 data=p.read_bytes();actual=hashlib.sha256(data).hexdigest()
 if actual!=row['sha256'] and hashlib.sha256(data.replace(b'\r\n',b'\n')).hexdigest()!=row.get('normalizedLFSHA256'):fail.append(name+': hash differs')
result={'pass':not fail,'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'files':len(manifest['files']),'failures':fail,'method':'Required runtime/editable paths tracked by Git and verified against binary SHA-256 or explicit LF-normalized text reference. No assets copied from another checkout.'}
print(json.dumps(result,indent=2));sys.exit(bool(fail))
