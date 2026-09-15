"""Restore the authentic evidence payloads to a NEW output directory."""
from pathlib import Path
import sys,json,gzip,hashlib
root=Path(__file__).resolve().parents[1];source=root/'director-kit/production/evidence/P08B/complete-data';dest=Path(sys.argv[1]).resolve();dest.mkdir(parents=True,exist_ok=False)
index=json.loads((source/'INDEX.json').read_text())
for name,row in index['files'].items():
 data=gzip.decompress((source/row['blob']).read_bytes());assert hashlib.sha256(data).hexdigest()==row['contentSHA256'];p=(dest/name).resolve();assert p.is_relative_to(dest);p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(gzip.compress(data,mtime=0)if row['sourceWasGzip']else data)
print('Restored',len(index['files']),'verified payloads to',dest)
