"""Integrate independently reviewed P03A2 master, preserving P03A1 and every other source part/map."""
import bpy,bmesh,pathlib,collections,json,hashlib
from mathutils import Matrix
P=pathlib.Path(__file__).resolve().parents[1];EV=P/'director-kit/production/evidence/P03A2/artist';OUT=P/'assets/blender/vehicles'
frozen=[OUT/'slingshot-p03a1.blend',OUT/'slingshot-p03a2-master01.blend',OUT/'slingshot-p03a2-proof01.blend',P/'public/assets/vehicles/slingshot-p03a1.glb',P/'public/assets/vehicles/slingshot-p03a2-proof01.glb']+list((P/'public/assets/textures/p03a1').glob('*.png'));before={str(p.relative_to(P)):hashlib.sha256(p.read_bytes()).hexdigest() for p in frozen}
bpy.ops.wm.open_mainfile(filepath=str(OUT/'slingshot-p03a1.blend'));body=bpy.data.objects['body_static'];root=bpy.data.objects['vehicle_root'];paint=bpy.data.materials['P03A_Radar_Blue']
with bpy.data.libraries.load(str(OUT/'slingshot-p03a2-master01.blend'),link=False) as (src,dst):dst.objects=['P03A2_left_brow_boundary_master']
left=dst.objects[0];bpy.context.collection.objects.link(left);left.parent=body;left.data.materials.clear();left.data.materials.append(paint);right=left.copy();right.data=left.data.copy();right.name='P03A2_right_brow_boundary_master';bpy.context.collection.objects.link(right);right.data.transform(Matrix.Diagonal((-1,1,1,1)));bm=bmesh.new();bm.from_mesh(right.data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(right.data);bm.free()
for name in ['P03A1_wing_brow_shell_left','P03A1_wing_brow_shell_right']:bpy.data.objects.remove(bpy.data.objects[name],do_unlink=True)
for ob in [left,right]:
 uv=ob.data.uv_layers['PaintUV']
 for li in range(len(ob.data.loops)):
  co=ob.data.vertices[ob.data.loops[li].vertex_index].co;uv.data[li].uv=((co.x+1.02)/2.04,(co.y+1.70)/3.84)
 ob['candidate']='P03A2 integrated local-proof01 geometry; broader fidelity pending'
root['stage']='P03A2 mirrored local shell proof integration; G3 pending'
source=OUT/'slingshot-p03a2.blend';bpy.ops.file.make_paths_relative();bpy.ops.wm.save_as_mainfile(filepath=str(source))
def empty(n):
 o=bpy.data.objects.new(n,None);bpy.context.collection.objects.link(o);o.parent=root;return o
FINISH=True;editable=[o for o in bpy.data.objects if o.type in {'MESH','CURVE'} and not o.get('export_exclude')];source_count=len(editable);dg=bpy.context.evaluated_depsgraph_get();prior=(P/'scripts/vehicle_p03a_build.py').read_text();tail=prior[prior.index('# Preserve semantic bindings,'):].replace('slingshot-p03a.glb','slingshot-p03a2.glb');exec(compile(tail,'P03A2 retained export-only batcher','exec'),globals());assert tri<=250000
for rel,h in before.items():assert hashlib.sha256((P/rel).read_bytes()).hexdigest()==h,rel
files=[source,P/'public/assets/vehicles/slingshot-p03a2.glb'];report={'stage':'mirrored integration awaiting full-car review','localCandidatesEvaluated':1,'sourceProof':'slingshot-p03a2-master01.blend','frozenFiles':before,'files':{str(p.relative_to(P)):{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for p in files},'triangles':tri,'retainedLimits':['Rounded long-edge highlight and subdued ridge remain approximate','Tire groove/machining fidelity remains approximate','No whole-front or whole-vehicle fidelity PASS','No G3 or hardware performance claim']};(EV/'integration.json').write_text(json.dumps(report,indent=2));print('P03A2_INTEGRATION '+json.dumps(report))
