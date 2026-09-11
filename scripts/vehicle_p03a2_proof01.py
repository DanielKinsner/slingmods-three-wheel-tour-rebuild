"""P03A2 proof01: isolated boundary-controlled quad master, unilateral contextual export."""
import bpy,bmesh,math,pathlib,json,hashlib,collections
from mathutils import Vector,Matrix
P=pathlib.Path(__file__).resolve().parents[1];EV=P/'director-kit/production/evidence/P03A2/artist';EV.mkdir(parents=True,exist_ok=True)
OUT=P/'assets/blender/vehicles';before={str(p.relative_to(P)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [OUT/'slingshot-p03a1.blend',P/'public/assets/vehicles/slingshot-p03a1.glb']}
bpy.ops.wm.read_factory_settings(use_empty=True)
mat=bpy.data.materials.new('P03A2_Radar_Blue_LocalProof');mat.use_nodes=True;bs=mat.node_tree.nodes['Principled BSDF'];bs.inputs['Base Color'].default_value=(.43,.45,.47,1);bs.inputs['Metallic'].default_value=0;bs.inputs['Roughness'].default_value=.30
# Independently placed boundaries: coordinates are visual estimates in metres,
# Blender +Y forward. Left master is mirrored in X here, not duplicated to the car.
curves={
 'leading':[(.282,2.050,.523),(.387,2.067,.559),(.528,2.068,.610),(.692,2.030,.680),(.846,1.982,.739),(.943,1.953,.759)],
 'outer':[(.943,1.953,.759),(.970,1.740,.812),(.948,1.400,.837),(.875,.980,.795),(.825,.620,.748),(.690,.340,.685)],
 'inner':[(.282,2.050,.523),(.352,1.940,.588),(.445,1.730,.675),(.425,1.400,.725),(.345,.980,.730),(.345,.620,.712),(.355,.340,.676)],
 'trailing':[(.355,.340,.676),(.420,.331,.686),(.540,.335,.693),(.690,.340,.685)]}
def sample(points,t):
 # Chord-length parameterization avoids forcing unrelated boundaries into common Y stations.
 ps=[Vector(p) for p in points];lengths=[0]
 for a,b in zip(ps,ps[1:]):lengths.append(lengths[-1]+(b-a).length)
 times=[l/lengths[-1] for l in lengths];j=min(len(ps)-2,next((i for i in range(len(ps)-1) if t<=times[i+1]),len(ps)-2));dt=times[j+1]-times[j];q=(t-times[j])/dt
 tang=[]
 for i in [j,j+1]:
  lo=max(0,i-1);hi=min(len(ps)-1,i+1);tang.append((ps[hi]-ps[lo])/(times[hi]-times[lo]))
 return (2*q**3-3*q*q+1)*ps[j]+(q**3-2*q*q+q)*dt*tang[0]+(-2*q**3+3*q*q)*ps[j+1]+(q**3-q*q)*dt*tang[1]
def patch(u,v):
 lead=sample(curves['leading'],u);trail=sample(curves['trailing'],u);inner=sample(curves['inner'],v);outer=sample(curves['outer'],v)
 a=Vector(curves['leading'][0]);b=Vector(curves['leading'][-1]);c=Vector(curves['trailing'][0]);d=Vector(curves['trailing'][-1])
 p=(1-v)*lead+v*trail+(1-u)*inner+u*outer-((1-u)*(1-v)*a+u*(1-v)*b+(1-u)*v*c+u*v*d)
 ridge=u/.84 if u<=.84 else (1-u)/.16;p.z+=.012*ridge*math.sin(math.pi*v)
 p.x=-p.x;return p
us=[0,.016,.10,.30,.55,.78,.84,.88,.96,1];vs=[0,.008,.045,.13,.28,.46,.63,.80,.94,1];nu=len(us);nv=len(vs)
verts=[]
for bottom in [False,True]:
 for v in vs:
  for u in us:
   p=patch(u,v)
   if bottom:p.x-=.008*(1-2*u);p.y+=-.035*(1-v)+.012*v;p.z-=.025
   verts.append(tuple(p))
faces=[];count=nu*nv
for layer in [0,1]:
 for j in range(nv-1):
  for i in range(nu-1):
   a=layer*count+j*nu+i;f=(a,a+1,a+nu+1,a+nu);faces.append(f if layer==0 else tuple(reversed(f)))
perimeter=list(range(nu))+[j*nu+nu-1 for j in range(1,nv)]+[(nv-1)*nu+i for i in range(nu-2,-1,-1)]+[j*nu for j in range(nv-2,0,-1)]
# Three explicit intermediate rings build a continuous radiused lip/return.
# All strips share vertices. No cap polygons, triangle fans or detached face covers.
rings=[perimeter]
for t in [.16,.42,.72]:
 row=[]
 for k,index in enumerate(perimeter):
  p=Vector(verts[index]);q=Vector(verts[count+index]);prev=Vector(verts[perimeter[k-1]]);nxt=Vector(verts[perimeter[(k+1)%len(perimeter)]])
  tangent=(nxt-prev).normalized();out=Vector((tangent.y,-tangent.x,0)).normalized()
  co=p.lerp(q,t)+out*(.005*math.sin(math.pi*t));row.append(len(verts));verts.append(tuple(co))
 rings.append(row)
rings.append([count+i for i in perimeter])
for r0,r1 in zip(rings,rings[1:]):
 for i in range(len(perimeter)):j=(i+1)%len(perimeter);faces.append((r0[i],r1[i],r1[j],r0[j]))
me=bpy.data.meshes.new('P03A2_boundary_quad_cage');me.from_pydata(verts,[],faces);me.update();bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);assert all(e.is_manifold for e in bm.edges);bm.to_mesh(me);bm.free()
master=bpy.data.objects.new('P03A2_left_brow_boundary_master',me);bpy.context.collection.objects.link(master);me.materials.append(mat)
for poly in me.polygons:poly.use_smooth=True
uv=me.uv_layers.new(name='PaintUV')
for li in range(len(me.loops)):
 co=me.vertices[me.loops[li].vertex_index].co;uv.data[li].uv=((co.x+1.02)/2.04,(co.y+1.70)/3.84)
sub=master.modifiers.new('Local boundary-supported quad interpolation','SUBSURF');sub.subdivision_type='CATMULL_CLARK';sub.levels=2;sub.render_levels=2
master['construction']='Coons patch from four independent chord-length boundaries; shared quad leading lip and returned underside, no planar end cap'
master['candidate']='P03A2 proof01 unilateral, not reviewed or promoted';master['control_loops_u']=us;master['control_loops_v']=vs
for name,points in curves.items():
 cu=bpy.data.curves.new('boundary_'+name,'CURVE');cu.dimensions='3D';sp=cu.splines.new('POLY');sp.points.add(len(points)-1)
 for dst,p in zip(sp.points,points):dst.co=(-p[0],p[1],p[2],1)
 ob=bpy.data.objects.new('P03A2_boundary_'+name,cu);bpy.context.collection.objects.link(ob);ob.hide_render=True;ob['export_exclude']=True
bpy.context.scene.unit_settings.system='METRIC';masterpath=OUT/'slingshot-p03a2-master01.blend';bpy.ops.wm.save_as_mainfile(filepath=str(masterpath))
# Only now load the retained full editable vehicle and append the isolated master.
bpy.ops.wm.open_mainfile(filepath=str(OUT/'slingshot-p03a1.blend'))
with bpy.data.libraries.load(str(masterpath),link=False) as (src,dst):dst.objects=['P03A2_left_brow_boundary_master']
master=dst.objects[0];bpy.context.collection.objects.link(master);body=bpy.data.objects['body_static'];master.parent=body
old=bpy.data.objects.get('P03A1_wing_brow_shell_left');assert old is not None;bpy.data.objects.remove(old,do_unlink=True)
root=bpy.data.objects['vehicle_root'];root['stage']='P03A2 proof01 unilateral diagnostic only; P03A1 retained visual HOLD'
source=OUT/'slingshot-p03a2-proof01.blend';bpy.ops.file.make_paths_relative();bpy.ops.wm.save_as_mainfile(filepath=str(source))
# Retained export-only batching and semantic binding contract, read-only reuse.
def empty(n):
 o=bpy.data.objects.new(n,None);bpy.context.collection.objects.link(o);o.parent=root;return o
FINISH=False;editable=[o for o in bpy.data.objects if o.type in {'MESH','CURVE'} and not o.get('export_exclude')];source_count=len(editable);dg=bpy.context.evaluated_depsgraph_get()
prior=(P/'scripts/vehicle_p03a_build.py').read_text();tail=prior[prior.index('# Preserve semantic bindings,'):].replace('slingshot-p03a.glb','slingshot-p03a2-proof01.glb');exec(compile(tail,'P03A2 retained export-only batcher','exec'),globals())
assert tri<=250000
for rel,h in before.items():assert hashlib.sha256((P/rel).read_bytes()).hexdigest()==h,rel
paths=[masterpath,source,P/'public/assets/vehicles/slingshot-p03a2-proof01.glb']
report={'candidate':1,'evaluatedCandidates':0,'unilateralSide':'left / runtime negative X','construction':'4 independent chord-length boundaries; Coons quad top/underside; 4 shared quad perimeter return strips; local supported subdivision2','cageVertices':2*nu*nv+3*len(perimeter),'cageQuads':len(faces),'nonQuadFaces':sum(len(f)!=4 for f in faces),'leadingDepthRange':max(p[1] for p in curves['leading'])-min(p[1] for p in curves['leading']),'frozenBaseline':before,'files':{str(p.relative_to(P)):{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in paths},'status':'READY FOR FIRST RUNTIME EVALUATION; no fidelity PASS'}
(EV/'proof01.json').write_text(json.dumps(report,indent=2));print('P03A2_PROOF '+json.dumps(report))
