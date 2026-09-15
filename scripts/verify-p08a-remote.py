"""Verify this feature push and new asset bytes without repeating P07B clone recovery."""
from pathlib import Path
import subprocess,json,hashlib,base64
root=Path(__file__).resolve().parents[1]
branch='feature/p08a-build-matters';repo='DanielKinsner/slingmods-three-wheel-tour-rebuild'
def run(*args):return subprocess.check_output(args,cwd=root,text=True).strip()
commit=run('git','rev-parse','HEAD');remote=run('git','ls-remote','origin','refs/heads/'+branch).split()[0];assert commit==remote
private=json.loads(run('gh','repo','view',repo,'--json','isPrivate'))['isPrivate'];assert private
tree=json.loads(run('gh','api',f'repos/{repo}/git/trees/{commit}?recursive=1'));assert not tree.get('truncated');objects={r['path']:r for r in tree['tree'] if r['type']=='blob'}
assets=json.loads((root/'demo-assets.json').read_text())
required=['public/'+n for n in assets['assets']+assets['notices']]+[n for n in objects if n.startswith('assets/') and n.endswith('.blend')]
for name in required:assert name in objects and objects[name]['sha']==run('git','rev-parse',commit+':'+name)
downloaded=[]
for name in ['assets/blender/products/ddmworks-sm3223-silver.blend','public/assets/products/ddmworks-sm3223-silver.glb']:
 blob=json.loads(run('gh','api',f"repos/{repo}/git/blobs/{objects[name]['sha']}"));assert blob['encoding']=='base64';data=base64.b64decode(blob['content']);local=(root/name).read_bytes();assert data==local;downloaded.append({'path':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'gitBlob':objects[name]['sha'],'actualRemoteGetMatches':True})
report={'repository':'https://github.com/'+repo,'private':private,'branch':branch,'commit':commit,'implementationCommit':'ec6876551542ec39111fbf26253c4528c2290cfc','mainCommit':run('git','ls-remote','origin','refs/heads/main').split()[0],'requiredRuntimeAndBlenderFiles':len(required),'remoteTreeMatches':True,'newAssetsDownloaded':downloaded,'method':'Verified remote branch tip and remote GitHub tree, then actual authenticated GET/decode/hash of both new product blobs. Earlier P07B full-clone recovery was not repeated or claimed as a new milestone.'}
p=root/'director-kit/production/evidence/P08A/remote.json';p.write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
