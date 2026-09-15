"""Losslessly retain all P08B numerical/text evidence once, deduplicating repeated traces."""
from pathlib import Path
import gzip, hashlib, json
root=Path(__file__).resolve().parents[1];base=root/'director-kit/production/evidence/P08B';dest=base/'complete-data';dest.mkdir(exist_ok=True);(dest/'blobs').mkdir(exist_ok=True)
index={};original=0
for p in sorted(base.rglob('*')):
 if not p.is_file() or dest in p.parents or p.suffix.lower()not in ['.json','.gz','.md','.log','.txt','.svg']:continue
 if 'concat.txt'==p.name:continue
 raw=p.read_bytes();data=gzip.decompress(raw)if p.suffix=='.gz' else raw;sha=hashlib.sha256(data).hexdigest();target=dest/'blobs'/(sha+'.gz')
 if not target.exists():target.write_bytes(gzip.compress(data,compresslevel=9,mtime=0))
 index[p.relative_to(base).as_posix()]={'blob':'blobs/'+target.name,'contentSHA256':sha,'contentBytes':len(data),'originalContainerBytes':len(raw),'sourceWasGzip':p.suffix=='.gz'};original+=len(raw)
report={'method':'All numeric/text evidence retained losslessly by decoded-content SHA-256. Repeated gzip traces stored once; gzip headers are canonicalized, payloads unchanged. Screenshots/media are selected separately. Original local files are preserved.','files':index,'sourceBytes':original,'storedBytes':sum(p.stat().st_size for p in (dest/'blobs').glob('*'))}
(dest/'INDEX.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items()if k!='files'}));print('Indexed',len(index),'files')
