"""Check every current runtime input against the exact candidate used for native testing."""
from pathlib import Path
import json,hashlib
root=Path(__file__).resolve().parents[1];frozen=root/'director-kit/production/evidence/P10B/frozen-build-inputs.json';data=json.loads(frozen.read_text(encoding='utf-8'));checks=[]
for name,digest in data['inputs'].items():
 p=root/name;actual=hashlib.sha256(p.read_bytes()).hexdigest();checks.append({'path':name,'sha256':actual,'frozenSHA256':digest,'pass':actual==digest})
result={'pass':all(v['pass']for v in checks),'runtimeCommit':data['commit'],'buildRef':data['buildRef'],'checks':checks,'method':'Exact bytes of every source/test/config/runtime asset input compared with review-build.json from the static candidate used for all final native races. Later documentation, evidence and archive changes are outside runtime inputs.'}
(root/'director-kit/production/evidence/P10B/runtime-inputs-final.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');assert result['pass'];print(json.dumps({'pass':True,'checked':len(checks),'runtimeCommit':data['commit']}))
