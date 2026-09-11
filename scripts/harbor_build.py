"""Original Blender harbor course, authoritative route and matching visible collider boxes."""
import bpy,bmesh,math,json,pathlib,hashlib,struct,os,sys
DRESSED=os.environ.get("HARBOR_DRESS")=="1"
from mathutils import Vector
P=pathlib.Path(__file__).resolve().parents[1];O=P/'public/assets/harbor';B=P/'assets/blender/harbor';E=P/'director-kit/production/evidence/P04A/artist'
for p in [O,B,E]:p.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
verts=[Vector(p) for p in [(0,-260),(190,-260),(270,-150),(190,-60),(270,30),(270,145),(60,145),(0,65)]]
radii=[60,65,70,40,45,55,60,60]
raw=[];effective=[]
# Independent straight tangents and exact circular fillets; no spline teleport logic.
for i,v in enumerate(verts):
 prev=verts[i-1];nxt=verts[(i+1)%len(verts)];din=(v-prev).normalized();dout=(nxt-v).normalized();turn=math.atan2(din.x*dout.y-din.y*dout.x,din.dot(dout));r=radii[i];trim=min(r*math.tan(abs(turn)/2),(v-prev).length*.40,(nxt-v).length*.40);r=trim/math.tan(abs(turn)/2);effective.append(r)
 start=v-din*trim;end=v+dout*trim;sgn=1 if turn>0 else -1;normal=Vector((-din.y,din.x))*sgn;center=start+normal*r;ang=math.atan2(start.y-center.y,start.x-center.x);arc=[center+Vector((math.cos(ang+turn*j/max(1,math.ceil(abs(turn)*r))),math.sin(ang+turn*j/max(1,math.ceil(abs(turn)*r)))))*r for j in range(max(1,math.ceil(abs(turn)*r))+1)]
 raw.extend(arc)
# Densify straight gaps first, then rotate by exact finish insertion on x=0 straight.
dense=[]
for i,a in enumerate(raw):
 b=raw[(i+1)%len(raw)];n=max(1,math.ceil((b-a).length));dense.extend(a.lerp(b,j/n)for j in range(n))
finish=Vector((0,0));k=min(range(len(dense)),key=lambda i:(dense[i]-finish).length);assert (dense[k]-finish).length<1
# x=0 initial straight goes toward negative z.
dense=[finish]+dense[k+1:]+dense[:k];ds=[0]
for i in range(len(dense)):ds.append(ds[-1]+(dense[(i+1)%len(dense)]-dense[i]).length)
length=ds[-1];n=math.ceil(length/2)
def at(s):
 s%=length
 import bisect
 i=min(len(dense)-1,bisect.bisect_right(ds,s)-1);a=dense[i];b=dense[(i+1)%len(dense)];return a.lerp(b,(s-ds[i])/(ds[i+1]-ds[i])),(b-a).normalized()
points=[at(length*i/n)[0]for i in range(n)];length=sum((points[(i+1)%n]-p).length for i,p in enumerate(points));assert 1000<=length<=1400,length
# Consistent measures resampled from final authoritative centerline.
cl=points;ds=[0]
for i,p in enumerate(cl):ds.append(ds[-1]+(cl[(i+1)%n]-p).length)
length=ds[-1];dense=cl
start,tan=at(length-5);gates=[]
for i in range(round(length/75)):
 s=length*i/round(length/75);p,t=at(s);gates.append(dict(id='finish'if i==0 else 'cp%02d'%i,x=round(p.x,6),z=round(p.y,6),dx=t.x,dz=t.y,halfWidth=8.5,distance=s))
coll=[]
for i in range(math.ceil(length/6)):
 s=(i+.5)*length/math.ceil(length/6);p,t=at(s);normal=Vector((-t.y,t.x));yaw=math.atan2(t.x,t.y);seg=length/math.ceil(length/6)
 for side in [-1,1]:
  q=p+normal*(5.70*side);coll.append(dict(id=f'curb-{i}-{side}',center=[q.x,.03,q.y],size=[.35,.06,seg*.96],yaw=yaw))
# Setback continuous low barriers; outside the entire three-metre runoff strip.
for i in range(math.ceil(length/10)):
 s=(i+.5)*length/math.ceil(length/10);p,t=at(s);normal=Vector((-t.y,t.x));yaw=math.atan2(t.x,t.y);seg=length/math.ceil(length/10)
 for side in [-1,1]:
  q=p+normal*(10.0*side);coll.append(dict(id=f'barrier-{i}-{side}',center=[q.x,.40,q.y],size=[.46,.8,seg*.94],yaw=yaw))
route=dict(id='biscayne-harbor',version='1',name='Biscayne Harbor — Shakedown',width=11,runoff=3,length=length,centerline=[[round(p.x,6),round(p.y,6)]for p in cl],start=dict(x=start.x,z=start.y,y=.025,yaw=math.atan2(-tan.x,-tan.y)),checkpoints=gates,colliders=coll,ground=dict(center=[130,-.125,-50],size=[620,.25,720]),lamps=[])
(O/'route.json').write_text(json.dumps(route,indent=2))
def mat(name,color,rough=1):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;bs=m.node_tree.nodes['Principled BSDF'];bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=rough;return m
asphalt=mat('Harbor_Asphalt',(.11,.12,.13));runoff=mat('Harbor_Runoff',(.37,.34,.28));ground=mat('Harbor_Ground',(.19,.23,.16));concrete=mat('Harbor_Concrete',(.56,.57,.54));paint=mat('Harbor_Road_Paint',(.83,.82,.74))
objects=[]
def mesh(name,v,f,m):
 me=bpy.data.meshes.new(name);me.from_pydata(v,[],f);me.update();ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);me.materials.append(m);objects.append(ob);return ob
def rv(p):return(p[0],-p[2],p[1])
def strip(name,a,b,y,m):
 v=[];f=[]
 for i,p in enumerate(cl):
  t=(cl[(i+1)%n]-cl[i-1]).normalized();norm=Vector((-t.y,t.x))
  for width in [a,b]:q=p+norm*width;v.append((q.x,-q.y,y))
 for i in range(n):j=(i+1)%n;f.append((2*i,2*j,2*j+1,2*i+1))
 ob=mesh(name,v,f,m)
 # Metre-aware longitudinal UV for eventual original material tiling.
 uv=ob.data.uv_layers.new(name='UVMap')
 for poly in ob.data.polygons:
  for li in poly.loop_indices:
   vi=ob.data.loops[li].vertex_index;uv.data[li].uv=(ds[vi//2]/8,(a if vi%2==0 else b)/8)
 return ob
strip('road_closed_asphalt',-5.5,5.5,.002,asphalt)
strip('runoff_left',-8.5,-5.5,.001,runoff);strip('runoff_right',5.5,8.5,.001,runoff)
for sign in [-1,1]:strip('paint_edge_'+str(sign),5.07*sign,5.20*sign,.007,paint)
def boxes(name,boxes,m):
 v=[];f=[]
 for box in boxes:
  x,y,z=box['center'];sx,sy,sz=box['size'];c=math.cos(box['yaw']);s=math.sin(box['yaw']);base=len(v)
  for dx,dy,dz in [(-1,-1,-1),(1,-1,-1),(1,-1,1),(-1,-1,1),(-1,1,-1),(1,1,-1),(1,1,1),(-1,1,1)]:
   xx=dx*sx/2;zz=dz*sz/2;v.append(rv((x+c*xx+s*zz,y+dy*sy/2,z-s*xx+c*zz)))
  f.extend(tuple(base+j for j in q)for q in [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])
 return mesh(name,v,f,m)
boxes('curbs_exact_route_colliders',[c for c in coll if c['id'].startswith('curb')],concrete);boxes('barriers_exact_route_colliders',[c for c in coll if c['id'].startswith('barrier')],concrete)
boxes('venue_ground',[dict(**route['ground'],yaw=0)],ground)
boxes('finish_line_paint',[dict(center=[0,.009,0],size=[10.8,.003,.36],yaw=0),dict(center=[0,.009,1],size=[10.8,.003,.12],yaw=0)],paint)
extra_materials=[]
if DRESSED:
 sys.path.insert(0,str(P/"scripts"))
 from harbor_dress import dress
 extra_materials=dress(globals())
for ob in objects:
 bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(ob.data);bm.free()
 if not ob.data.uv_layers:
  uv=ob.data.uv_layers.new(name='UVMap')
  for poly in ob.data.polygons:
   for li in poly.loop_indices:
    p=ob.data.vertices[ob.data.loops[li].vertex_index].co;uv.data[li].uv=(p.x/4,p.y/4 if abs(poly.normal.z)>.5 else p.z/4)
 ob.data.validate(clean_customdata=False)
bpy.context.scene.unit_settings.system='METRIC';bpy.ops.wm.save_as_mainfile(filepath=str(B/'harbor.blend'))
# Export safely batched by material while the source retains semantically editable objects.
for m in [asphalt,runoff,ground,concrete,paint]+extra_materials:
 obs=[o for o in list(bpy.data.objects)if o.type=='MESH'and o.data.materials[0]==m];bpy.ops.object.select_all(action='DESELECT')
 if not obs:continue
 for o in obs:o.select_set(True)
 bpy.context.view_layer.objects.active=obs[0];bpy.ops.object.join();bpy.context.object.name=m.name
bpy.ops.export_scene.gltf(filepath=str(O/'harbor.glb'),export_format='GLB',export_yup=True,export_animations=False)
r=(O/'harbor.glb').read_bytes();g=json.loads(r[20:20+struct.unpack_from('<I',r,12)[0]])
report=dict(status='Dressed03 exact land corridor cut; awaiting matched runtime review' if DRESSED else 'Undressed route01 awaiting real-physics lap before dressing',length=length,samples=n,width=11,runoff=3,minimumFilletRadius=min(effective),filletRadii=effective,initialStraightMetres=200,colliderCount=len(coll),checkpoints=len(gates),triangles=sum(g['accessors'][p['indices']]['count']//3 for m in g['meshes']for p in m['primitives']),primitives=sum(len(m['primitives'])for m in g['meshes']),files={str(p.relative_to(P)):{'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size}for p in [B/'harbor.blend',O/'harbor.glb',O/'route.json']})
(E/('dressed03-export.json' if DRESSED else 'route01-export.json')).write_text(json.dumps(report,indent=2));print(json.dumps(report))
