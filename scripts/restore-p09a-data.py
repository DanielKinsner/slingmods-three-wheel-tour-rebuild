"""Restore lossless Review17 numerical evidence into a new, separate directory."""
from pathlib import Path
import sys,json,gzip,lzma,hashlib
root=Path(__file__).resolve().parents[1]
source=root/'director-kit/production/evidence/P09A/complete-data'
dest=Path(sys.argv[1]).resolve();dest.mkdir(parents=True,exist_ok=False)
index=json.loads((source/'INDEX.json').read_text())
for name,row in index['files'].items():
 blob=(source/row['blob']).resolve();assert blob.is_relative_to(source.resolve())
 data=(lzma.decompress if blob.suffix=='.xz' else gzip.decompress)(blob.read_bytes())
 assert hashlib.sha256(data).hexdigest()==row['contentSHA256'],name
 p=(dest/name).resolve();assert p.is_relative_to(dest)
 p.parent.mkdir(parents=True,exist_ok=True)
 p.write_bytes(gzip.compress(data,mtime=0) if row['sourceWasGzip'] else data)
print('Restored',len(index['files']),'verified numerical/text payloads to',dest)
