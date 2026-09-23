import bpy,pathlib,json
from mathutils import Vector
R=pathlib.Path(__file__).resolve().parents[2];bpy.ops.wm.open_mainfile(filepath=str(R/'.tools/spyder/Spyder-Game-Master.blend'));d={}
for o in bpy.context.scene.objects:
 if o.type!='MESH':continue
 for p in o.data.polygons:
  m=o.data.materials[p.material_index] if len(o.data.materials) else None
  if not m:continue
  a=d.setdefault(m.name,[])
  if m.name in ['paint_orange','paint_silver','black_metal','silver','chrome','tire','tire_without','rim','Gloss_Plastic','Leather']:continue
  for i in p.vertices:
   v=o.matrix_world@o.data.vertices[i].co;a.append([v.x,v.z,-v.y])
import numpy as np
print('BOUNDS',json.dumps({k:{'min':np.min(v,axis=0).tolist(),'max':np.max(v,axis=0).tolist()} for k,v in d.items() if v}),flush=True)
