"""Exact local land cut: remove the shared road/runoff footprint, keep outside ground at y=0."""
import bpy,bmesh,json
from mathutils import Vector

def cut_land_corridor(land,route,evidence_dir):
 points=[Vector((p[0],p[1]))for p in route['centerline']];n=len(points);half=route['width']/2+route['runoff'];verts=[];faces=[]
 for i,p in enumerate(points):
  tangent=(points[(i+1)%n]-points[i-1]).normalized();normal=Vector((-tangent.y,tangent.x))
  for level in [-1.,1.]:
   for side in [-1,1]:
    q=p+normal*(side*half);verts.append((q.x,-q.y,level))
 for i in range(n):
  a=i*4;b=((i+1)%n)*4
  faces.extend([(a,b,b+1,a+1),(a+2,a+3,b+3,b+2),(a,a+2,b+2,b),(a+1,b+1,b+3,a+3)])
 me=bpy.data.meshes.new('Route_corridor_boolean_volume');me.from_pydata(verts,[],faces);me.update();cutter=bpy.data.objects.new('Route_corridor_boolean_volume',me);bpy.context.collection.objects.link(cutter)
 for ob in [cutter,land]:
  bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(ob.data);bm.free()
 bpy.context.view_layer.objects.active=land;mod=land.modifiers.new('Remove authoritative asphalt plus runoff footprint','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter;bpy.ops.object.modifier_apply(modifier=mod.name)
 bpy.data.objects.remove(cutter,do_unlink=True);bpy.data.meshes.remove(me)
 bm=bmesh.new();bm.from_mesh(land.data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bad=sum(not e.is_manifold for e in bm.edges);bm.to_mesh(land.data);bm.free();assert bad==0,bad
 land.data.validate(clean_customdata=False);land.data.update();land.data.calc_loop_triangles()
 # Source rays sample both road and runoff at every authoritative cross-section.
 failures=[];rays=0
 for i,p in enumerate(points):
  tangent=(points[(i+1)%n]-points[i-1]).normalized();normal=Vector((-tangent.y,tangent.x))
  for offset in [-8.49,-8,-7,-6,-5.5,-4,-2,0,2,4,5.5,6,7,8,8.49]:
   q=p+normal*offset;hit,co,no,idx=land.ray_cast(Vector((q.x,-q.y,1)),Vector((0,0,-1)));rays+=1
   if hit:failures.append([i,offset,list(co)])
 assert not failures,failures[:5]
 bounds=[[min(v.co[k]for v in land.data.vertices)for k in range(3)],[max(v.co[k]for v in land.data.vertices)for k in range(3)]]
 report={'method':'Single exact Blender Boolean difference with closed quad ring extruded from the authoritative road/runoff boundary; applied editable mesh, no elevation or physics change','halfWidth':half,'centerlineSamples':n,'landVertices':len(land.data.vertices),'landFaces':len(land.data.polygons),'landTriangles':len(land.data.loop_triangles),'nonManifoldEdges':bad,'sourceNoLandUnderCorridorRays':rays,'sourceRayHits':len(failures),'blenderBounds':bounds,'outsideLandTopRuntimeY':bounds[1][2],'outsideLandBottomRuntimeY':bounds[0][2]}
 (evidence_dir/'dressed03-land-construction.json').write_text(json.dumps(report,indent=2));print('LAND_CORRIDOR '+json.dumps(report))
