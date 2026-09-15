"""Explicit build/edit/test input selection, not a blanket directory backup."""
from pathlib import Path
import subprocess,json,hashlib
root=Path(__file__).resolve().parents[1]
paths=subprocess.check_output(['git','ls-files','src','tests','scripts','assets','public'],cwd=root,text=True).splitlines()
paths+=['package.json','package-lock.json','index.html','tsconfig.json','vite.config.ts','demo-assets.json','handoff/verify-current.py']
files={};text_suffix={'.ts','.js','.mjs','.py','.ps1','.css','.html','.json','.md','.txt','.csv','.sh','.svg'}
for n in sorted(set(paths)):
 p=root/n
 if not p.is_file() or p.suffix=='.pyc' or '__pycache__'in p.parts:continue
 b=p.read_bytes();row={'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
 if p.suffix.lower() in text_suffix:
  try:b.decode('utf-8');row['normalizedLFSHA256']=hashlib.sha256(b.replace(b'\r\n',b'\n')).hexdigest()
  except UnicodeDecodeError:pass
 files[n]=row
out=root/'handoff/CURRENT-INPUTS.json'
out.write_text(json.dumps({'schemaVersion':1,'review14Runtime':'758c2b291a9b5bd525fe9acd1425537657fadf70','scope':'All tracked src/tests/scripts/assets/public and named build configs/current verifier. Runtime, original/derived authoring dependencies and license records included. Receipt-only docs and historical evidence are separately transferred Git files, not this input hash contract.','normalization':'Strict binary hashes. UTF-8 source/config/authoring text may differ only by CRLF/LF; no historical evidence is normalized or rewritten.','files':files},indent=2),encoding='utf-8')
print('Indexed',len(files),'inputs')
