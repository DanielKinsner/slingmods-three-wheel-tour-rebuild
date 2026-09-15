import bpy,json,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[1];asset=root/'assets/blender/products/ddmworks-sm3223-silver.blend';before=hashlib.sha256(asset.read_bytes()).hexdigest();bpy.ops.wm.open_mainfile(filepath=str(asset))
images=[]
for image in bpy.data.images:
 if image.source=='FILE':
  packed=bool(image.packed_file or image.packed_files);images.append({'name':image.name,'packed':packed,'size':list(image.size)});assert packed,'Unpacked dependency '+image.name;assert image.size[0]>0
for name in ['carrier_front_left','carrier_front_right','ddm_lower','ddm_upper','ddm_spring']:assert bpy.data.objects.get(name)
assert hashlib.sha256(asset.read_bytes()).hexdigest()==before
report={'pass':True,'source':asset.relative_to(root).as_posix(),'sha256':before,'images':images,'objects':len(bpy.data.objects),'Blender':bpy.app.version_string,'sourceUnchanged':True,'method':'Background read-only open of NEW product source, named groups and packed image dependencies verified; no source save and no re-export of existing vehicle/world.'}
(root/'director-kit/production/evidence/P08A/new-blender-inspection.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
