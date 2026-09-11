import bpy,pathlib,json,hashlib,struct
from mathutils import Vector
P=pathlib.Path(__file__).resolve().parents[1];E=P/'director-kit/production/evidence/P04A1/artist';E.mkdir(parents=True,exist_ok=True);bpy.ops.wm.open_mainfile(filepath=str(P/'assets/blender/vehicles/slingshot-p03a2.blend'));dg=bpy.context.evaluated_depsgraph_get();out=[]
for o in bpy.data.objects:
 if o.type not in {'MESH','CURVE'}:continue
 ev=o.evaluated_get(dg);me=ev.to_mesh();me.calc_loop_triangles();v=[o.matrix_world@p.co for p in me.vertices];bounds=[[min(p[k]for p in v),max(p[k]for p in v)]for k in range(3)];h=hashlib.sha256()
 for p in me.vertices:h.update(struct.pack('<3f',*p.co))
 for t in me.loop_triangles:h.update(struct.pack('<3I',*t.vertices))
 for layer in me.uv_layers:
  for a in layer.data:h.update(struct.pack('<2f',*a.uv))
 row={'name':o.name,'parent':o.parent.name if o.parent else None,'boundsRuntime':[[bounds[0][0],bounds[2][0],-bounds[1][1]],[bounds[0][1],bounds[2][1],-bounds[1][0]]],'materials':[m.name for m in me.materials],'triangles':len(me.loop_triangles),'evaluatedMeshUVHash':h.hexdigest(),'matrixWorld':[list(r)for r in o.matrix_world]};out.append(row);ev.to_mesh_clear()
(E/'source-inventory.json').write_text(json.dumps(out,indent=2))
for r in out:
 if any(k in r['name']for k in ['rear','swingarm','drive_belt','shock','tail','seat_rear','chassis_rail']):print(json.dumps(r))
