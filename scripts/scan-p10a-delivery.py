"""Check intended Git changes for common credential literals; never print matching values."""
from pathlib import Path
import subprocess,re,json,sys
root=Path(__file__).resolve().parents[1]
names=subprocess.check_output(['git','diff','--name-only','63da7a0202a0216cea5e9a70bd55f63f5283cba4'],cwd=root,text=True).splitlines()
patterns={
 'private-key':re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
 'github-token':re.compile(r'gh[pousr]_[A-Za-z0-9]{30,}'),
 'service-secret':re.compile(r'\bsk[-_][A-Za-z0-9]{35,}'),
 'aws-access-key':re.compile(r'\bAKIA[A-Z0-9]{16}\b')}
checked=[];findings=[]
for name in names:
 p=root/name
 if not p.is_file() or p.suffix.lower() not in ['.ts','.mjs','.js','.py','.ps1','.json','.md','.txt','.html','.css','.toml','.yml','.yaml']:continue
 text=p.read_text(encoding='utf-8',errors='replace');checked.append(name)
 for kind,pattern in patterns.items():
  count=len(pattern.findall(text))
  if count:findings.append({'path':name,'kind':kind,'count':count})
result={'pass':not findings,'checked':checked,'findings':findings,'method':'Common credential-literal patterns on intended tracked/staged changes against origin/main. Matching values never emitted. This is a bounded hygiene check, not a comprehensive security audit.'}
(root/'director-kit/production/evidence/P10A/secret-scan.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps({'pass':not findings,'checked':len(checked),'findings':findings}))
sys.exit(1 if findings else 0)
