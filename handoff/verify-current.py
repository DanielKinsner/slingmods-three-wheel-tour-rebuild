"""Read-only verification of current transferred inputs; no historical reports rewritten."""
from pathlib import Path
import hashlib,json,subprocess,sys
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'handoff/CURRENT-INPUTS.json').read_text(encoding='utf-8'))
failures=[];normalized=[]
for n,row in manifest['files'].items():
 p=root/n
 if not p.is_file():failures.append(n+': missing');continue
 b=p.read_bytes()
 if hashlib.sha256(b).hexdigest()==row['sha256']:continue
 if row.get('normalizedLFSHA256') and hashlib.sha256(b.replace(b'\r\n',b'\n')).hexdigest()==row['normalizedLFSHA256']:normalized.append(n)
 else:failures.append(n+': content differs')
print(json.dumps({'pass':not failures,'checkedCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'inputFiles':len(manifest['files']),'lineEndingOnlyDifferences':normalized,'failures':failures},indent=2))
sys.exit(bool(failures))
