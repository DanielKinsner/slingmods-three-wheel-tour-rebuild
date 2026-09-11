import bpy,pathlib,json
from mathutils import Vector
P=pathlib.Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(P/'assets/blender/vehicles/slingshot-p03a.blend'))
dg=bpy.context.evaluated_depsgraph_get();report=[]
for x,z in [(0,.601),(-.705,.627),(.705,.627)]:
 hits=[]
 for o in bpy.data.objects:
  if o.type not in {'MESH','CURVE'} or o.get('export_exclude'):continue
  ev=o.evaluated_get(dg);me=ev.to_mesh()
  if not me:continue
  inv=o.matrix_world.inverted();orig=inv@Vector((x,5,z));end=inv@Vector((x,-5,z))
  hit,co,n,face=ev.ray_cast(orig,(end-orig).normalized())
  if hit:hits.append({'object':o.name,'position':list(o.matrix_world@co)})
  ev.to_mesh_clear()
 report.append({'rayXZ':[x,z],'hits':sorted(hits,key=lambda p:-p['position'][1])[:10]})
(P/'director-kit/production/evidence/P03A/artist/optical-ray-probe.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
