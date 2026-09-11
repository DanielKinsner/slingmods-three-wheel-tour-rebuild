"""Idempotent local P04A1 rear surgery. Loads CURRENT P03A2 master, never regenerates older car chain."""
import bpy,bmesh,pathlib,json,math,hashlib,struct,collections
from mathutils import Vector,Matrix
P=pathlib.Path(__file__).resolve().parents[1];EV=P/'director-kit/production/evidence/P04A1/artist';base=P/'assets/blender/vehicles/slingshot-p03a2.blend';source=P/'assets/blender/vehicles/slingshot-p04a1.blend';cfg=json.loads((P/'public/assets/vehicles/slingshot-p04a1-rear-rig.json').read_text())
protected=[base,P/'public/assets/vehicles/slingshot-p03a2.glb',P/'public/assets/slingshot-contact-layout.json']+list((P/'public/assets/textures/p03a1').glob('*.png'));hashes={str(p.relative_to(P)):hashlib.sha256(p.read_bytes()).hexdigest()for p in protected}
bpy.ops.wm.open_mainfile(filepath=str(base));root=bpy.data.objects['vehicle_root'];body=bpy.data.objects['body_static'];black=bpy.data.materials['P03A_Textured_Polymer'];orange=bpy.data.materials['P03A_Orange_Accent'];metal=bpy.data.materials['P03A_Machined_Aluminum'];paint=bpy.data.materials['P03A_Radar_Blue'];dark=bpy.data.materials['P03A_Gloss_Black_Wheel']
def fingerprint(o):
 dg=bpy.context.evaluated_depsgraph_get();ev=o.evaluated_get(dg);me=ev.to_mesh();me.calc_loop_triangles();h=hashlib.sha256()
 for v in me.vertices:h.update(struct.pack('<3f',*v.co))
 for t in me.loop_triangles:h.update(struct.pack('<3I',*t.vertices))
 for layer in me.uv_layers:
  for a in layer.data:h.update(struct.pack('<2f',*a.uv))
 ev.to_mesh_clear();return h.hexdigest()

initial_hashes={o.name:fingerprint(o)for o in bpy.data.objects if o.type in {'MESH','CURVE'}}
removed=['rear_firewall','rear_undertray_curved_left','rear_undertray_curved_right','single_sided_swingarm','drive_belt','rear_shock','rear_coil']
for n in removed:bpy.data.objects.remove(bpy.data.objects[n],do_unlink=True)
def cv(p):return Vector((p[0],-p[2],p[1]))
def empty(n,pos=(0,0,0)):
 o=bpy.data.objects.new(n,None);bpy.context.collection.objects.link(o);o.parent=root;o.location=cv(pos);return o
groups={k:empty(v)for k,v in cfg['groups'].items()};storage=empty('rear_storage_static');rearbody=empty('rear_body_static')
for name,p in [('rear_arm_pivot',cfg['armPivot']),('rear_hub',cfg['wheelCenter']),('shock_upper',cfg['shockUpper']),('shock_lower',cfg['shockLower'])]:empty(name,p)
for old,key in [('rear_axle','axle'),('rear_stationary_caliper','caliper')]:
 o=bpy.data.objects[old];world=o.matrix_world.copy();o.parent=groups[key];o.matrix_world=world
created=[]
def mesh(name,v,f,mat=black,par=rearbody,smooth=False):
 me=bpy.data.meshes.new(name);me.from_pydata([cv(p)for p in v],[],f);me.update();bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(me);bm.free();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);o.parent=par;me.materials.append(mat)
 for p in me.polygons:p.use_smooth=smooth
 created.append(o);return o
def bevel(o,width=.008,segments=2):
 m=o.modifiers.new('Molded edge return','BEVEL');m.width=width;m.segments=segments;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=m.name);return o
def box(name,lo,hi,mat=black,par=rearbody,bevelwidth=.008):
 a,b,c=lo;d,e,f=hi;v=[(a,b,c),(d,b,c),(d,b,f),(a,b,f),(a,e,c),(d,e,c),(d,e,f),(a,e,f)];o=mesh(name,v,[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)],mat,par);return bevel(o,bevelwidth)if bevelwidth else o
def boolean(a,b,mode):
 m=a.modifiers.new('Closed storage '+mode,'BOOLEAN');m.operation=mode;m.solver='EXACT';m.object=b;bpy.context.view_layer.objects.active=a;bpy.ops.object.modifier_apply(modifier=m.name);created.remove(b);bpy.data.objects.remove(b,do_unlink=True)
def rod(name,a,b,r,mat=metal,par=rearbody,seg=24):
 a,b=Vector(a),Vector(b);d=(b-a).normalized();x=d.cross(Vector((0,1,0)))
 if x.length<.01:x=d.cross(Vector((1,0,0)))
 x.normalize();y=d.cross(x).normalized();v=[]
 for p in [a,b]:
  for j in range(seg):v.append(p+r*(x*math.cos(j*math.tau/seg)+y*math.sin(j*math.tau/seg)))
 faces=[(j,(j+1)%seg,(j+1)%seg+seg,j+seg)for j in range(seg)]+[tuple(reversed(range(seg))),tuple(range(seg,2*seg))];o=mesh(name,v,faces,mat,par,True)
 for p in o.data.polygons[-2:]:p.use_smooth=False
 return o
def tube(name,points,r,mat,par,seg=8):
 v=[];f=[]
 for i,p in enumerate(points):
  p=Vector(p);d=(Vector(points[min(i+1,len(points)-1)])-Vector(points[max(i-1,0)])).normalized();axis=Vector((1,0,0));axis=(axis-d*axis.dot(d)).normalized();other=d.cross(axis).normalized()
  for j in range(seg):v.append(p+r*(axis*math.cos(j*math.tau/seg)+other*math.sin(j*math.tau/seg)))
 for i in range(len(points)-1):
  for j in range(seg):a=i*seg+j;f.append((a,i*seg+(j+1)%seg,(i+1)*seg+(j+1)%seg,(i+1)*seg+j))
 f +=[tuple(reversed(range(seg))),tuple((len(points)-1)*seg+j for j in range(seg))];return mesh(name,v,f,mat,par,True)
def ring(name,x,y,z,inner,outer,width,mat,par):
 v=[];f=[];n=64
 for xx,rr in [(x-width/2,inner),(x-width/2,outer),(x+width/2,outer),(x+width/2,inner)]:
  for j in range(n):a=j*math.tau/n;v.append((xx,y+rr*math.sin(a),z+rr*math.cos(a)))
 for k in range(4):
  for j in range(n):f.append((k*n+j,k*n+(j+1)%n,((k+1)%4)*n+(j+1)%n,((k+1)%4)*n+j))
 return mesh(name,v,f,mat,par,True)
# Genuine closed wall volumes around hollow behind-seat compartments.
left=box('rear_storage_left_shell',[-.625,.30,.745],[-.195,.865,1.285],black,storage,.018);c=box('left_inner_cavity',[-.610,.315,.760],[-.210,.850,1.270],black,storage,.009);boolean(left,c,'DIFFERENCE')
right=box('rear_storage_right_shell',[.435,.30,.745],[.645,.865,1.285],black,storage,.014);wing=box('right_upper_storage_wing',[.195,.585,.685],[.645,.865,.920],black,storage,.012);boolean(right,wing,'UNION');c=box('right_outboard_cavity',[.448,.313,.758],[.632,.852,1.272],black,storage,.006);c2=box('right_upper_cavity',[.208,.598,.698],[.632,.852,.907],black,storage,.006);boolean(c,c2,'UNION');boolean(right,c,'DIFFERENCE')
# Closed/access surfaces remain present: restrained door lip, inset panel, latch and hinge.
for side,x0,x1,z,y0 in [('left',-.604,-.216,.735,.328),('right',.213,.625,.675,.606)]:
 box('storage_access_lip_'+side,[x0,y0,z-.005],[x1,.846,z+.006],dark,storage,.009);box('storage_access_panel_'+side,[x0+.012,y0+.012,z-.010],[x1-.012,.833,z-.004],black,storage,.007);box('storage_access_latch_'+side,[(x0+x1)/2-.025,.785,z-.016],[(x0+x1)/2+.025,.810,z-.010],metal,storage,.004)
 rod('storage_bottom_hinge_'+side,[x0+.04,y0+.012,z-.011],[x1-.04,y0+.012,z-.011],.006,metal,storage,12)
for side,x0,x1 in [('left',-.625,-.205),('right',.445,.645)]:
 box('rear_lower_storage_return_'+side,[x0+.025,.225,1.15],[x1-.005,.31,1.27],black,rearbody,.010)
 for i in range(3):
  x=x0+.055+(x1-x0-.11)*i/2;box('rear_storage_rib_'+side+str(i),[x-.005,.36,1.282],[x+.005,.81,1.292],black,storage,.003)
# Forward bulkhead closes the cabin behind the central tunnel, ahead of the complete tire sweep.
box('rear_central_forward_bulkhead',[-.19,.30,.930],[.19,.877,.953],black,rearbody,.007)
box('rear_central_upper_header',[-.193,.851,.951],[.193,.88,1.27],black,rearbody,.007)
# Tapered single-sided arm: four sectional boxes, real bearing boss and pivot.
A,H,U,L=[Vector(cfg[k])for k in ['armPivot','armHub','shockUpper','shockLower']];d=(H-A).normalized();up=Vector((0,d.z,-d.y));v=[]
for t,w,h in [(0,.095,.115),(.15,.12,.11),(.70,.10,.085),(1,.13,.135)]:
 c=A.lerp(H,t)
 for xx,yy in [(-1,-1),(1,-1),(1,1),(-1,1)]:v.append(c+Vector((xx*w/2,0,0))+up*(yy*h/2))
f=[(k*4+j,k*4+(j+1)%4,(k+1)*4+(j+1)%4,(k+1)*4+j)for k in range(3)for j in range(4)]+[(3,2,1,0),(12,13,14,15)];bevel(mesh('rear_swingarm_cast_section',v,f,orange,groups['arm']),.012,3)
rod('rear_arm_pivot_boss',[.20,A.y,A.z],[.355,A.y,A.z],.078,orange,groups['arm']);rod('rear_arm_hub_boss',[.22,H.y,H.z],[.36,H.y,H.z],.079,orange,groups['arm']);ring('rear_hub_bearing',.355,H.y,H.z,.034,.059,.025,metal,groups['axle'])
# Rear pulley rotates with the unchanged rear wheel; belt/guard follows arm affine only.
wheel=bpy.data.objects['rear_spin'];pulley_group=empty('rear_pulley_visual');pulley_group.parent=wheel;pulley_group.location=(0,0,0);pulley=ring('rear_drive_pulley',.367,H.y,H.z,.150,.198,.027,dark,root)
# Mesh helper authors in vehicle space. Convert these new rotating parts into existing spin space.
def spin_parent(o):o.data.transform(wheel.matrix_world.inverted());o.parent=pulley_group
spin_parent(pulley)
for i in range(8):
 a=i*math.tau/8;p=Vector((.367,H.y+.045*math.sin(a),H.z+.045*math.cos(a)));q=Vector((.367,H.y+.155*math.sin(a),H.z+.155*math.cos(a)));ob=rod('rear_pulley_spoke_'+str(i),p,q,.014,metal,root,12);spin_parent(ob)
# Convex envelope of two circular pulleys gives real straight belt runs and wrapped ends.
pts=[]
for c,r in [(A,.080),(H,.198)]:
 for i in range(96):a=i*math.tau/96;pts.append((c.y+r*math.sin(a),c.z+r*math.cos(a)))
pts=sorted(set(pts))
def cross(o,a,b):return(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
lo=[];hi=[]
for p in pts:
 while len(lo)>=2 and cross(lo[-2],lo[-1],p)<=0:lo.pop()
 lo.append(p)
for p in reversed(pts):
 while len(hi)>=2 and cross(hi[-2],hi[-1],p)<=0:hi.pop()
 hi.append(p)
loop=lo[:-1]+hi[:-1];v=[];f=[]
for i,p in enumerate(loop):
 t=(Vector(loop[(i+1)%len(loop)])-Vector(loop[i-1])).normalized();n=Vector((t.y,-t.x))
 for xx,rr in [(-.017,-.004),(.017,-.004),(.017,.004),(-.017,.004)]:v.append((.369+xx,p[0]+n.x*rr,p[1]+n.y*rr))
for i in range(len(loop)):
 for j in range(4):f.append((i*4+j,i*4+(j+1)%4,((i+1)%len(loop))*4+(j+1)%4,((i+1)%len(loop))*4+j))
mesh('rear_continuous_drive_belt',v,f,black,groups['belt'])
# Narrow open guard follows the reference visible pulley edge, not a cover over the tire.
v=[];f=[];N=40
for i in range(N):
 a=math.radians(-35+220*i/(N-1))
 for x,rr in [(.399,.211),(.399,.239),(.410,.239),(.410,.211)]:v.append((x,H.y+rr*math.sin(a),H.z+rr*math.cos(a)))
for i in range(N-1):
 for j in range(4):f.append((i*4+j,i*4+(j+1)%4,(i+1)*4+(j+1)%4,(i+1)*4+j))
f +=[(3,2,1,0),tuple((N-1)*4+j for j in range(4))];mesh('rear_open_pulley_guard',v,f,paint,groups['arm'])
# Telescoping shock, fixed-length opposite-ended sleeves and separate spring.
sd=(L-U).normalized();rod('rear_shock_upper_sleeve',U+sd*.024,U+sd*.310,.027,black,groups['shockBody']);rod('rear_shock_piston',L-sd*.320,L-sd*.025,.012,metal,groups['shockPiston']);ring('rear_shock_upper_eye',U.x,U.y,U.z,.012,.026,.043,metal,groups['shockBody']);ring('rear_shock_lower_eye',L.x,L.y,L.z,.012,.026,.043,metal,groups['shockPiston'])
x=Vector((1,0,0));crossaxis=sd.cross(x);points=[]
for i in range(161):
 t=i/160;a=t*math.tau*7;p=U+sd*(.054+t*((L-U).length-.108))+.041*(x*math.cos(a)+crossaxis*math.sin(a));points.append(p)
tube('rear_coil_spring',points,.0065,orange,groups['shockSpring'],8)
for s in [-1,1]:box('shock_upper_chassis_bracket_'+str(s),[U.x+s*.035-.008,U.y-.023,U.z-.028],[U.x+s*.035+.008,.894,U.z+.027],metal,rearbody,.006)
# Geometry revision02: connect the actual shock eyes and swingarm pivot to supported chassis members.
rod('shock_upper_cross_pin',[U.x-.052,U.y,U.z],[U.x+.052,U.y,U.z],.011,metal,rearbody,24)
rod('shock_lower_cross_pin',[L.x-.05,L.y,L.z],[L.x+.05,L.y,L.z],.011,metal,groups['arm'],24)
rod('rear_pivot_chassis_crossmember',[-.58,.255,A.z],[.58,.255,A.z],.024,metal,rearbody,24)
for x in [.18,.38]:box('rear_pivot_chassis_lug_'+str(x),[x-.012,.245,A.z-.028],[x+.012,A.y+.024,A.z+.028],metal,rearbody,.006)
rod('rear_pivot_fixed_pin',[.16,A.y,A.z],[.40,A.y,A.z],.018,metal,rearbody,24)
# New parts only: complete UV layers reused by retained original material nodes.
for o in created:
 if o.name not in bpy.data.objects:continue
 o.data.update()
 for lname in ['SurfaceUV','PaintUV']:
  uv=o.data.uv_layers.get(lname)or o.data.uv_layers.new(name=lname)
  for p in o.data.polygons:
   axes=[k for k in range(3)if k!=max(range(3),key=lambda k:abs(p.normal[k]))]
   for li in p.loop_indices:
    co=o.data.vertices[o.data.loops[li].vertex_index].co;world=o.matrix_world@co;uv.data[li].uv=((world.x+1.02)/2.04,(world.y+1.70)/3.84)if lname=='PaintUV'else(co[axes[0]],co[axes[1]])
 o['source_role']='P04A1 local rear repair';o.data.validate(clean_customdata=False)
# Protected evaluated source hashes: every old component except explicit rear replacements/reparenting.
old=json.loads((EV/'source-inventory.json').read_text());checked=[]
for r in old:
 if r['name']in removed:continue
 o=bpy.data.objects[r['name']];assert fingerprint(o)==initial_hashes[r['name']],r['name'];assert[list(row)for row in o.matrix_world]==r['matrixWorld'],r['name'];assert[m.name for m in o.data.materials]==r['materials'];checked.append(r['name'])
root['rear_stage']='P04A1 candidate02; local clearance review pending';bpy.ops.file.make_paths_relative();bpy.ops.wm.save_as_mainfile(filepath=str(source))
# Retained batching logic extended only by semantic rear spaces. No old authoring chain is executed.
FINISH=True;editable=[o for o in bpy.data.objects if o.type in {'MESH','CURVE'}and not o.get('export_exclude')];source_count=len(editable);dg=bpy.context.evaluated_depsgraph_get();prior=(P/'scripts/vehicle_p03a_build.py').read_text();tail=prior[prior.index('# Preserve semantic bindings,'):].replace("'suspension_rear']","'suspension_rear']+list(cfg['groups'].values())+['rear_storage_static','rear_body_static','rear_pulley_visual']").replace('slingshot-p03a.glb','slingshot-p04a1.glb');exec(compile(tail,'P04A1 retained export-only batcher','exec'),globals())
for rel,h in hashes.items():assert hashlib.sha256((P/rel).read_bytes()).hexdigest()==h,rel
report={'status':'Candidate02 exported; not yet evaluated by runtime reviewer','protectedEvaluatedComponents':len(checked),'comparisonMethod':'Strict within-process evaluated vertex/triangle/UV bytes before and after rear surgery; old process hash order can differ for existing Boolean console','baselineProcessHashes':initial_hashes,'protectedNames':checked,'removedRearComponents':removed,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'glbSha256':hashlib.sha256((P/'public/assets/vehicles/slingshot-p04a1.glb').read_bytes()).hexdigest(),'triangles':tri,'frozenBaselineAndMaps':hashes};(EV/'candidate02-source-preservation.json').write_text(json.dumps(report,indent=2));print('REAR_CANDIDATE '+json.dumps({k:v for k,v in report.items()if k not in ['protectedNames','frozenBaselineAndMaps']}))
