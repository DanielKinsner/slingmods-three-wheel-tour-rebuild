import bpy,pathlib,json,math
from mathutils import Vector
R=pathlib.Path(__file__).resolve().parents[2];report={}
for name in ['spyder-f3','spyder-products','spyder-rider']:
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(R/f'public/assets/spyder/{name}.glb'))
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];tris=0;finite=True;uv=0
 for o in meshes:
  o.data.calc_loop_triangles();tris+=len(o.data.loop_triangles);uv+=bool(o.data.uv_layers);finite=finite and all(math.isfinite(c) for v in o.data.vertices for c in v.co)
 centers={}
 for n in ['front_left_steer','front_right_steer','rear_carrier']:
  if bpy.data.objects.get(n):
   p=bpy.data.objects[n].matrix_world.translation;centers[n]=[p.x,p.z,-p.y]
 report[name]={'triangles':tris,'meshes':len(meshes),'finite':finite,'uvMeshes':uv,'images':[{'name':i.name,'size':list(i.size),'packed':bool(i.packed_file)} for i in bpy.data.images],'contacts':centers,'stageMeshes':[o.name for o in meshes if o.name=='Plane02'],'status':'PASS' if finite and not any(o.name=='Plane02' for o in meshes) else 'FAIL'}
 if name=='spyder-f3':bpy.ops.wm.save_as_mainfile(filepath=str(R/'.tools/spyder/Spyder-Reimport-Check.blend'))
(R/'assets/spyder/evidence/reimport.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True)
