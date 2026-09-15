"""Rebuild the corrected white/graphite atlas from preserved editable source masks."""
import bpy,numpy as np,json,re,hashlib
from pathlib import Path
r=Path(__file__).resolve().parents[1];out=r/'public/assets/p08b/showroom-refinement';out.mkdir(parents=True,exist_ok=True)
source=r/'assets/blender/p08b/slingshot-signature.blend';before=hashlib.sha256(source.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(source))
atlas=next(i for i in bpy.data.images if 'coverage_AA' in i.name)
reference=np.array(atlas.pixels[:],dtype=np.float32).reshape(atlas.size[1],atlas.size[0],4);rgb=reference[:,:,:3]
accent=(rgb[:,:,0]>.25)&(rgb[:,:,0]>rgb[:,:,1]*1.5)&(rgb[:,:,0]>rgb[:,:,2]*2)
paint=bpy.data.images.load(str(r/'public/assets/p08b/finish-white-graphite.png'),check_existing=False)
pixels=np.array(paint.pixels[:],dtype=np.float32).reshape(paint.size[1],paint.size[0],4)
palette=(r/'src/presentation/signature-palette.ts').read_text();hexcolor=re.search(r"'white-graphite':'(#[0-9a-f]{6})'",palette).group(1)
srgb=[int(hexcolor[i:i+2],16)/255 for i in (1,3,5)];linear=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in srgb]
result=pixels.copy();result[accent,:3]=linear;assert np.array_equal(result[~accent],pixels[~accent])
image=bpy.data.images.new('signature-white-graphite-corrected',width=paint.size[0],height=paint.size[1],alpha=True);image.pixels.foreach_set(result.ravel());image.filepath_raw=str(out/'finish-white-graphite.png');image.file_format='PNG';image.save()
assert hashlib.sha256(source.read_bytes()).hexdigest()==before
record={'source':source.relative_to(r).as_posix(),'sourceUnchanged':True,'previousWhiteAtlasUnchanged':True,'accentSRGB':hexcolor,'accentLinear':linear,'changedMaskPixels':int(accent.sum()),'outsideAccentMaskUnchanged':True,'output':image.filepath_raw.replace(str(r),'REPO'),'method':'Only original orange graphic mask in existing white paint atlas recolored. Original body/trim pixels and every mesh remain unchanged.'}
(r/'assets/source/showroom-refinement/finish-repair.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record))
