"""Read-only P08A recovery check. Keeps the historical P07B input receipt intact."""
from pathlib import Path
import hashlib,json,subprocess,sys
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'handoff/P08A-INPUTS.json').read_text(encoding='utf-8'))
failures=[];normalized=[]
for name,row in manifest['files'].items():
 p=root/name
 if not p.is_file():failures.append(name+': missing');continue
 data=p.read_bytes()
 if hashlib.sha256(data).hexdigest()==row['sha256']:continue
 if row.get('normalizedLFSHA256') and hashlib.sha256(data.replace(b'\r\n',b'\n')).hexdigest()==row['normalizedLFSHA256']:normalized.append(name)
 else:failures.append(name+': differs')
print(json.dumps({'pass':not failures,'checkoutCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'implementationCommit':manifest['implementationCommit'],'files':len(manifest['files']),'lineEndingOnly':normalized,'failures':failures},indent=2))
sys.exit(bool(failures))
