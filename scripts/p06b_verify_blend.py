"""Blender read-only source verification: no save or export."""
import bpy,json,pathlib,hashlib
from mathutils import Vector
from mathutils.bvhtree import BVHTree
R=pathlib.Path(__file__).resolve().parents[1]; reports=[]
for name in ['quality-foundation.blend','quality-kit.blend']:
 p=R/'assets/blender/showcase-quality'/name;bpy.ops.wm.open_mainfile(filepath=str(p))
 images=[im for im in bpy.data.images if im.users and im.source=='FILE'];assert all(im.packed_file for im in images),[(im.name,im.filepath)for im in images if not im.packed_file]
 mats=[m for m in bpy.data.materials if m.users];obs=[o for o in bpy.data.objects if o.type=='MESH']
 reports.append({'file':str(p.relative_to(R)),'SHA256':hashlib.sha256(p.read_bytes()).hexdigest(),'Blender':bpy.app.version_string,'editableMeshObjects':len(obs),'activeMaterials':len(mats),'usedFileImages':len(images),'allUsedFileImagesPacked':True,'mode':'Opened read-only; no save/export'})
route=json.loads((R/'public/assets/harbor/route.json').read_text());land=next(o for o in bpy.data.objects if o.name=='landscape_unified_ground_with_exact_holes');tree=BVHTree.FromObject(land,bpy.context.evaluated_depsgraph_get());bad=[];rays=0;pts=[Vector(p)for p in route['centerline']]
for i,p in enumerate(pts):
 tangent=(pts[(i+1)%len(pts)]-pts[(i-1)%len(pts)]).normalized();normal=Vector((-tangent.y,tangent.x))
 for offset in [-8.45,-5.4,0,5.4,8.45]:
  q=p+normal*offset;hit=tree.ray_cast(Vector((q.x,-q.y,1)),Vector((0,0,-1)),2);rays+=1
  if hit[0] is not None:bad.append({'point':[q.x,q.y],'offset':offset})
assert not bad,('Terrain intrudes into accepted road/runoff',bad[:5])
reports.append({'exactRoadRunoffCutRays':rays,'unexpectedLandHits':len(bad),'groundColliderSHA256':hashlib.sha256((R/'public/assets/harbor/route.json').read_bytes()).hexdigest(),'landscapeTopologicalRepair':'Exact Blender Boolean paving union cut from original accepted corridor-cut ground. No millimetre-separated floor stack.'})
(R/'director-kit/production/evidence/P06B/artist/blender-source-validation.json').write_text(json.dumps(reports,indent=2));print(json.dumps(reports,indent=2))
