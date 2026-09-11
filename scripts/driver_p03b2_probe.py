import bpy,pathlib,json
from mathutils import Vector
p=pathlib.Path(__file__).resolve().parents[1];bpy.ops.wm.open_mainfile(filepath=str(p/'assets/blender/vehicles/slingshot-p03a2.blend'))
rows=[]
for o in bpy.data.objects:
 if o.name.startswith(('rider_','camera_cockpit','steering_control','P03A1_steering','P03A1_upholstered','seat_clay','seat_shell','P03A1_padded','pedal','footwell')) or 'steering_rim' in o.name:
  bb=[o.matrix_world@Vector(x) for x in o.bound_box] if o.type=='MESH' else []
  rows.append({'name':o.name,'type':o.type,'location':list(o.matrix_world.translation),'rotation':list(o.rotation_euler),'bounds':[[min(v[k] for v in bb),max(v[k] for v in bb)] for k in range(3)]if bb else None})
print(json.dumps(rows,indent=2))
