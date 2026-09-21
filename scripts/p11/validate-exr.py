import bpy,numpy as np,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];records=[]
for p in sorted((ROOT/'public/assets/p11/skies').glob('*-pmrem.exr')):
 im=bpy.data.images.load(str(p));a=np.asarray(im.pixels[:],dtype=np.float32);assert np.isfinite(a).all(),p;assert a.max()>0,p
 records.append({'file':p.name,'pixels':list(im.size),'finite':True,'minimum':float(a.min()),'maximum':float(a.max())});bpy.data.images.remove(im)
assert len(records)==5
(ROOT/'assets/p11/exr-validation.json').write_text(json.dumps(records,indent=2), encoding="utf-8");print('All five prefiltered EXRs contain finite nonzero radiance')
