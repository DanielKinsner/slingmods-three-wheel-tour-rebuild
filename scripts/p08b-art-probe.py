import bpy,json,bmesh
from pathlib import Path
P=Path(__file__).resolve().parents[1];bpy.ops.wm.open_mainfile(filepath=str(P/'assets/blender/vehicles/slingshot-p04a1.blend'))
for n in ['side_rocker_return_left','side_rocker_return_right','boarding_sill_shell_left','boarding_sill_shell_right','autodrive_console_shell']:
 o=bpy.data.objects[n];print(n,[list(v.co)for v in o.data.vertices][:12]);print('mat',o.matrix_world)
for o in bpy.data.objects:
 if 'hoop' in o.name:print('HOOP',o.name,o.type,[m.name for m in o.data.materials] if o.type in ['MESH','CURVE']else '')
for i in bpy.data.images: print('IMAGE',i.name,i.filepath,i.has_data,bool(i.packed_file))
