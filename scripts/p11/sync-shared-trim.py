"""Re-point prop GLBs at the current trim sheets after build-atlases.py changes them.

share-glb-textures.py names shared PNGs by content hash, so an edited trim-*.png leaves every GLB referencing the old
pixels. Hash names have a fixed length, which lets the GLB JSON chunk be patched in place with no re-chunking.
Order: build-atlases -> this -> compress -> finalize-metadata.
"""
from pathlib import Path
import json,hashlib,shutil
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'public/assets/p11';SHARED=OUT/'shared-textures';PROPS=OUT/'trackside-props'
recorded={item['path']:item['sha256'] for item in json.loads((OUT/'manifest.json').read_text(encoding='utf-8'))['assets']} if (OUT/'manifest.json').exists() else {}
changes={}
for p in sorted(PROPS.glob('trim-*.png')):
 new=hashlib.sha256(p.read_bytes()).hexdigest();old=recorded.get(p.relative_to(OUT).as_posix())
 if old and old!=new and (SHARED/(old+'.png')).exists():changes[old]=new;shutil.copyfile(p,SHARED/(new+'.png'))
patched=0
for glb in OUT.rglob('*.glb'):
 raw=glb.read_bytes();out=raw
 for old,new in changes.items():out=out.replace(old.encode(),new.encode())
 if out!=raw:assert len(out)==len(raw);glb.write_bytes(out);patched+=1
for old in changes:
 for stale in SHARED.glob(old+'.*'):stale.unlink()
print('Trim sheets changed:',len(changes),'| GLBs re-pointed:',patched)
