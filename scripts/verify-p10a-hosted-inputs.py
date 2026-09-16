"""Verify actual hosted curated provenance against committed Git blobs, without assuming READY is gameplay."""
from pathlib import Path
import json,hashlib,subprocess,urllib.request,sys
root=Path(__file__).resolve().parents[1];out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=False)
base=sys.argv[2] if len(sys.argv)>2 else 'https://slingmods-three-wheel-tour-rebuild.vercel.app'
with urllib.request.urlopen(base+'/review-build.json',timeout=60)as r: data=json.load(r)
commit=data['commit'];subprocess.check_call(['git','cat-file','-e',commit+'^{commit}'],cwd=root)
inputs=data['inputs'];checks=[];mismatches=[]
for name,expected in inputs.items():
 blob=subprocess.check_output(['git','show',commit+':'+name],cwd=root);digest=hashlib.sha256(blob).hexdigest();actual=expected if isinstance(expected,str)else expected.get('sha256');item={'path':name,'expectedHostedSHA256':actual,'gitBlobSHA256':digest,'pass':actual==digest};checks.append(item)
 if not item['pass']:mismatches.append(item)
(out/'verification.json').write_text(json.dumps({'pass':not mismatches,'base':base,'commit':commit,'provenance':data,'checks':checks,'mismatches':mismatches,'method':'Actual HTTPS review-build.json GET; compare every curated input with its exact committed Git blob. Run real browser gameplay separately. Provider-only vercel.json changes are outside runtime inputs.'},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'pass':not mismatches,'commit':commit,'checked':len(checks),'mismatches':mismatches},indent=2));sys.exit(1 if mismatches else 0)
