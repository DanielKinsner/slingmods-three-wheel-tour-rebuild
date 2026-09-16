"""Hash actual HTTPS asset responses against the site's public provenance and Git."""
from pathlib import Path
import concurrent.futures, hashlib, json, subprocess, sys, urllib.request
root=Path(__file__).resolve().parents[1]
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=False)
base='https://slingmods-three-wheel-tour-rebuild.vercel.app'
def get(url):
    with urllib.request.urlopen(url,timeout=90) as r:return r.read(),r.headers.get('Content-Type')
provenance=json.loads(get(base+'/review-build.json')[0])
def check(item):
    name,expected=item
    blob=subprocess.check_output(['git','show',provenance['commit']+':'+name],cwd=root)
    data,mime=get(base+'/'+name.removeprefix('public/'))
    digest=hashlib.sha256(data).hexdigest()
    return dict(path=name,bytes=len(data),mime=mime,sha256=digest,expected=expected,gitSHA256=hashlib.sha256(blob).hexdigest(),passed=digest==expected==hashlib.sha256(blob).hexdigest())
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:checks=list(pool.map(check,provenance['inputs'].items()))
passed=all(c['passed'] for c in checks)
result={'pass':passed,'commit':provenance['commit'],'base':base,'checked':len(checks),'checks':checks,'method':'Actual GET bytes of every public asset compared with both hosted provenance and exact Git blob; no source/private files published.'}
(out/'verification.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps({'pass':passed,'checked':len(checks),'bytes':sum(c['bytes'] for c in checks),'commit':provenance['commit']}));assert passed
