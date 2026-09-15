import bpy,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(root/'assets/blender/vehicles/slingshot-p04a1.blend'))
rows=[]
for o in bpy.data.objects:
 if any(k in o.name.lower() for k in ['damper','spring','shock','suspension_front']):
  rows.append(dict(name=o.name,type=o.type,parent=o.parent.name if o.parent else None,position=list(o.matrix_world.translation),dimensions=list(o.dimensions)))
p=root/'director-kit/production/evidence/P08A';p.mkdir(exist_ok=True,parents=True)
(p/'stock-hardware-inspection.json').write_text(json.dumps(rows,indent=2))
print(json.dumps(rows))
