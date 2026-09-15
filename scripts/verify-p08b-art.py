import bpy,bmesh,json,hashlib,struct,math
from pathlib import Path
P=Path(__file__).resolve().parents[1];E=P/'director-kit/production/evidence/P08B/art'
def inventory(file):
 bpy.ops.wm.open_mainfile(filepath=str(file));bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get();rows={}
 for o in bpy.data.objects:
  if o.type not in ['MESH','CURVE'] or o.get('export_exclude'):continue
  ev=o.evaluated_get(dg);me=ev.to_mesh();bm=bmesh.new();bm.from_mesh(me);world=[o.matrix_world@v.co for v in me.vertices];h=hashlib.sha256()
  for v in world:h.update(struct.pack('<3f',*(round(x,6)for x in v)))
  topology=hashlib.sha256(';'.join(','.join(str(i)for i in f.vertices)for f in me.polygons).encode()).hexdigest()
  rows[o.name]={'worldVertexHash':h.hexdigest(),'topologyHash':topology,'boundary':sum(e.is_boundary for e in bm.edges),'vertices':len(world),'bounds':[[min(v[i]for v in world),max(v[i]for v in world)]for i in range(3)]if world else[],'matrix':[list(r)for r in o.matrix_world]};bm.free();ev.to_mesh_clear()
 return rows
old=inventory(P/'assets/blender/vehicles/slingshot-p04a1.blend');new=inventory(P/'assets/blender/p08b/slingshot-signature.blend');changed=[n for n in old if n in new and (old[n]['worldVertexHash']!=new[n]['worldVertexHash']or old[n]['topologyHash']!=new[n]['topologyHash'])];allowed=lambda n:any(k in n for k in ['brake_disc','lug_nut','side_rocker_return','autodrive_console_shell','rear_storage_left_shell','rear_storage_right_shell'])
unexpected=[n for n in changed if not allowed(n)];missing=[n for n in old if n not in new];assert not unexpected,unexpected;assert not missing,missing
for n in new:
 if 'lug_nut' in n or 'brake_disc' in n:assert new[n]['boundary']==0,(n,new[n]['boundary'])
images=[{'name':i.name,'packed':bool(i.packed_file),'size':list(i.size)}for i in bpy.data.images if i.source=='FILE'];assert all(i['packed']and min(i['size'])>0 for i in images)
r={'pass':True,'method':'Actual evaluated source vertices rounded to 1micron compared in world space; no assertion on file-internal Blender serialization order. Narrow repair allowlist, exact original object inventory; all original wheel/driver/rear anchors retained.','originalObjectCount':len(old),'changedGeometry':changed,'unexpectedChanges':unexpected,'missingOriginalObjects':missing,'closedRotorAndLugBoundaries':True,'images':images,'afterObjects':{n:new[n]for n in changed}};(E/'source-verification.json').write_text(json.dumps(r,indent=2));print(json.dumps({k:v for k,v in r.items()if k not in ['afterObjects','images']}))
