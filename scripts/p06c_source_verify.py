"""Read-only Blender source/geometry verification, P06C-only evidence output."""
import bpy,json,pathlib,hashlib
from mathutils import Vector
from mathutils.bvhtree import BVHTree
R=pathlib.Path(__file__).resolve().parents[1];E=R/'director-kit/production/evidence/P06C';reports=[]
def geometry(o):
 return dict(matrix=[list(row) for row in o.matrix_world],positions=[list(v.co) for v in o.data.vertices],polygons=[list(p.vertices) for p in o.data.polygons])
bpy.ops.wm.open_mainfile(filepath=str(R/'assets/blender/showcase-quality/quality-foundation.blend'))
before={o.name:geometry(o) for o in bpy.data.objects if o.type=='MESH'}
bpy.ops.wm.open_mainfile(filepath=str(R/'assets/blender/showcase-quality/built-waterfront-foundation.blend'))
assert all(geometry(bpy.data.objects[n])==g for n,g in before.items()),'Physical foundation changed'
reports.append(dict(exactFoundationMeshes=len(before),positionsTopologyTransformsIdentical=True))
for name in ['built-waterfront-foundation.blend','built-waterfront.blend']:
 bpy.ops.wm.open_mainfile(filepath=str(R/'assets/blender/showcase-quality'/name))
 images=[im for im in bpy.data.images if im.users and im.source=='FILE'];assert all(im.packed_file for im in images)
 reports.append(dict(file=name,editableMeshes=sum(o.type=='MESH' for o in bpy.data.objects),packedImages=len(images)))
route=json.loads((R/'public/assets/harbor/route.json').read_text());layout=json.loads((R/'public/assets/showcase-quality/scene-layout.json').read_text());pts=[Vector(p) for p in route['centerline']]
# Actual new yard and cut landscape, evaluated in world space.
obs=[o for o in bpy.data.objects if o.type=='MESH' and (o.name.startswith('landscape_') or o.name=='waterfrontYards_connected_concrete')]
trees=[]
for o in obs:
 me=o.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh();trees.append(BVHTree.FromPolygons([o.matrix_world@v.co for v in me.vertices],[list(p.vertices) for p in me.polygons]));o.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh_clear()
bad=[];rays=0
for i,p in enumerate(pts):
 t=(pts[(i+1)%len(pts)]-pts[(i-1)%len(pts)]).normalized();n=Vector((-t.y,t.x))
 for offset in [-8.45,-5.4,0,5.4,8.45]:
  q=p+n*offset;rays+=1
  for tree in trees:
   if tree.ray_cast(Vector((q.x,-q.y,1)),Vector((0,0,-1)),2)[0] is not None:bad.append([q.x,q.y,offset])
assert not bad,('New ground in travel envelope',bad[:5])
reports.append(dict(roadRunoffRays=rays,unexpectedGroundHits=0))
# Dense transformed footprint boundary checks against every route segment.
def distance(q):
 best=1e9
 for i,a in enumerate(pts):
  v=pts[(i+1)%len(pts)]-a;f=max(0,min(1,(q-a).dot(v)/v.length_squared));best=min(best,(q-a-v*f).length)
 return best
footprints=[]
for p in layout['waterfrontEnsembles']:
 corners=[Vector(v) for v in p['footprint']];checks=[distance(a.lerp(corners[(i+1)%4],k/64)) for i,a in enumerate(corners) for k in range(65)]
 assert min(checks)>12.4,(p['station'],min(checks))
 footprints.append(dict(station=p['station'],minimumRouteDistance=min(checks),boundarySamples=len(checks)))
reports.append(dict(ensembleClearance=footprints,scope='World footprint boundary vs all road segments; existing barrier envelope retained. Does not claim human camera/sightline approval.'))
(E/'source-clearance.json').write_text(json.dumps(reports,indent=2));print('P06C editable sources, packed images, exact physical meshes and clearance PASS')
