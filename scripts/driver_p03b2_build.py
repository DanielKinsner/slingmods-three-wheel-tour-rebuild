"""Original Blender-authored P03B2 seated test driver. Separate asset; fit before fabric."""
import bpy,bmesh,pathlib,math,json,hashlib,collections,struct,os
FINISH=os.environ.get("DRIVER_FINISH")=="1"
from mathutils import Vector,Matrix
P=pathlib.Path(__file__).resolve().parents[1];E=P/'director-kit/production/evidence/P03B2/artist';E.mkdir(parents=True,exist_ok=True);O=P/'public/assets/drivers';O.mkdir(parents=True,exist_ok=True);B=P/'assets/blender/drivers';B.mkdir(parents=True,exist_ok=True)
protected=[P/'assets/blender/vehicles/slingshot-p03a2.blend',P/'public/assets/vehicles/slingshot-p03a2.glb']+list((P/'public/assets/textures/p03a1').glob('*.png'));frozen={str(p.relative_to(P)):hashlib.sha256(p.read_bytes()).hexdigest()for p in protected}
bpy.ops.wm.read_factory_settings(use_empty=True)
def material(name,color,rough,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;bs=m.node_tree.nodes['Principled BSDF'];bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal;return m
suit=material('Driver_Textile',(.055,.065,.073),.88);leather=material('Driver_Leather',(.022,.026,.029),.65);helmet=material('Driver_Helmet',(.12,.135,.15),.29);visor=material('Driver_Visor',(.008,.013,.018),.13,.25)
root=bpy.data.objects.new('driver_root',None);bpy.context.collection.objects.link(root)
arm=bpy.data.armatures.new('DriverArticulation');rig=bpy.data.objects.new('driver_rig',arm);bpy.context.collection.objects.link(rig);rig.parent=root;bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
centers={
 'pelvis':((-.36,-.285,.435),(-.36,-.38,.58),None),
 'spine':((-.36,-.38,.58),(-.36,-.515,.925),'pelvis'),
 'head':((-.36,-.515,.925),(-.36,-.50,1.22),'spine')}
for side,sx,ex,gx,hx in [('left',-.555,-.610,-.525,-.465),('right',-.165,-.110,-.195,-.255)]:
 centers['upper_arm_'+side]=((sx,-.455,.91),(ex,-.255,.67),'spine');centers['forearm_'+side]=((ex,-.255,.67),(gx,-.008,.71),'upper_arm_'+side);centers['hand_'+side]=((gx,-.008,.71),(gx,.062,.71),'forearm_'+side)
 centers['thigh_'+side]=((hx,-.25,.445),(hx,.13,.505),'pelvis');centers['shin_'+side]=((hx,.13,.505),(-.49 if side=='left'else-.28,.425,.245),'thigh_'+side);centers['foot_'+side]=((-.49 if side=='left'else-.28,.425,.245),(-.49 if side=='left'else-.28,.585,.205),'shin_'+side)
for name,(head,tail,parent)in centers.items():
 bone=arm.edit_bones.new('driver_'+name);bone.head=head;bone.tail=tail
 if parent:bone.parent=arm.edit_bones['driver_'+parent];bone.use_connect=(Vector(head)-bone.parent.tail).length<1e-6
bpy.ops.object.mode_set(mode='OBJECT');rig.select_set(False)
meshes=[]
def mesh(name,verts,faces,mat):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(me);bm.free();ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);me.materials.append(mat)
 for poly in me.polygons:poly.use_smooth=True
 meshes.append(ob);return ob
def sweep(name,rows,mat,segments=20):
 # Authored elliptical garment sections normal to the local centerline.
 vs=[]
 for i,(center,rx,ry)in enumerate(rows):
  tangent=(Vector(rows[min(i+1,len(rows)-1)][0])-Vector(rows[max(0,i-1)][0])).normalized();axis=Vector((1,0,0));axis=(axis-tangent*axis.dot(tangent)).normalized();other=tangent.cross(axis).normalized()
  for j in range(segments):
   a=math.tau*j/segments;fold=1+.018*math.sin(3*a+i*.8)+.013*math.sin(7*a-i*.7);v=Vector(center)+axis*(rx*math.cos(a)*fold)+other*(ry*math.sin(a)*fold);vs.append(tuple(v))
 fs=[(i*segments+j,i*segments+(j+1)%segments,(i+1)*segments+(j+1)%segments,(i+1)*segments+j)for i in range(len(rows)-1)for j in range(segments)];fs +=[tuple(reversed(range(segments))),tuple((len(rows)-1)*segments+j for j in range(segments))];return mesh(name,vs,fs,mat)
def apply(ob,modifier):
 bpy.context.view_layer.objects.active=ob;bpy.ops.object.modifier_apply(modifier=modifier.name)
def merge_remesh(name,objects,voxel,target):
 bpy.ops.object.select_all(action='DESELECT')
 for ob in objects:ob.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();ob=objects[0];ob.name=name
 for old in objects[1:]:
  if old in meshes:meshes.remove(old)
 re=ob.modifiers.new('Connected tailored garment union','REMESH');re.mode='VOXEL';re.voxel_size=voxel;re.use_smooth_shade=True;apply(ob,re)
 sm=ob.modifiers.new('Restrained cloth union smoothing','SMOOTH');sm.factor=.40;sm.iterations=3;apply(ob,sm);ob.data.calc_loop_triangles();tr=len(ob.data.loop_triangles)
 if tr>target:
  de=ob.modifiers.new('Local cloth production density','DECIMATE');de.ratio=target/tr;apply(ob,de)
 return ob
jacket=[]
rows=[((-.36,-.305,.415),.142,.094),((-.36,-.31,.44),.155,.096),((-.36,-.335,.50),.154,.096),((-.36,-.38,.575),.15,.095),((-.36,-.435,.69),.173,.11),((-.36,-.49,.815),.19,.115),((-.36,-.52,.875),.192,.109),((-.36,-.515,.915),.155,.091),((-.36,-.505,.95),.066,.064)]
jacket.append(sweep('Tailored_jacket_torso',rows,suit,28))
for side in ['left','right']:
 sh,el,_=centers['upper_arm_'+side];el,gr,_=centers['forearm_'+side];sh=Vector(sh);el=Vector(el);gr=Vector(gr)
 rows=[]
 for t,r in [(0,.074),(.15,.067),(.45,.061),(.73,.053),(.90,.058),(1,.052)]:rows.append((tuple(sh.lerp(el,t)),r,r*.88))
 for t,r in [(.08,.046),(.16,.058),(.25,.048),(.38,.051),(.68,.041),(.86,.035),(.89,.033)]:rows.append((tuple(el.lerp(gr,t)),r,r*.84))
 jacket.append(sweep('Shaped_sleeve_'+side,rows,suit,20))
 # Deltoid/armpit garment volume overlaps torso and sleeve by several centimetres.
 inward=.065 if side=='left'else-.065
 jacket.append(sweep('Integrated_jacket_shoulder_'+side,[(tuple(sh+Vector((inward,-.040,-.015))),.085,.071),(tuple(sh+Vector((inward*.5,-.020,.006))),.080,.070),(tuple(sh),.074,.065),(tuple(sh.lerp(el,.20)),.066,.060)],suit,24))

jacket.append(sweep('Connected_neck_gaiter',[((-.36,-.510,.92),.068,.064),((-.36,-.505,.955),.066,.061),((-.36,-.501,.982),.061,.057),((-.36,-.499,1.017),.060,.057)],suit,24))
jacket=merge_remesh('driver_jacket',jacket,.006,14500)
# Collar is a rolled fabric return at the actual jacket opening.
sweep('Jacket_protective_collar',[((-.36,-.507,.942),.074,.068),((-.36,-.507,.953),.077,.069),((-.36,-.504,.966),.070,.064)],leather,24)
# Raised sewn paths track the actual remeshed cloth surface, not a floating stencil.
for name,x,zs in [('zipper',-.36,[.455+i*.025 for i in range(19)]),('chest_left',-.46,[.68+i*.025 for i in range(8)]),('chest_right',-.26,[.68+i*.025 for i in range(8)])]:
 rows=[]
 for z in zs:
  hit,co,no,idx=jacket.ray_cast(Vector((x,1,z)),Vector((0,-1,0)))
  if hit:rows.append((tuple(co+no*.0028),.0033 if name=='zipper'else .0025,.0025))
 if len(rows)>1:
  ob=sweep('Jacket_sewn_'+name,rows,leather if name=='zipper'else suit,8);ob['atlas_accent']=name!='zipper'

pants=[sweep('Trouser_hip_yoke',[((-.36,-.30,.385),.135,.095),((-.36,-.28,.425),.155,.11),((-.36,-.29,.465),.149,.095)],suit,24)]
for side in ['left','right']:
 hip,knee,_=centers['thigh_'+side];_,ankle,_=centers['shin_'+side];hip=Vector(hip);knee=Vector(knee);ankle=Vector(ankle);rows=[]
 for t,r in [(0,.090),(.12,.090),(.42,.082),(.70,.072),(1,.069)]:rows.append((tuple(hip.lerp(knee,t)),r,r*.85))
 for t,r in [(.16,.065),(.40,.061),(.68,.050),(.92,.043),(1,.041)]:rows.append((tuple(knee.lerp(ankle,t)),r,r*.81))
 pants.append(sweep('Tailored_trouser_leg_'+side,rows,suit,20))
pants=merge_remesh('driver_trousers',pants,.008,8000)
# Collar, cuffs and visible tailored panel seams have actual restrained geometry.
for side in ['left','right']:
 el,gr,_=centers['forearm_'+side];d=Vector(gr)-Vector(el);p=Vector(el)+d*.87;sweep('Glove_gauntlet_'+side,[(tuple(p-d.normalized()*.017),.037,.033),(tuple(p),.041,.035),(tuple(p+d.normalized()*.018),.035,.031)],leather,20)
# Gloves: shaped palm and four individually folded fingers, opposing thumb.
for side in ['left','right']:
 gr=Vector(centers['hand_'+side][0]);sgn=-1 if side=='left' else 1;el=Vector(centers['forearm_'+side][0]);back=(el-gr).normalized()
 palm=sweep('Gloved_palm_'+side,[(tuple(gr+back*.070),.030,.025),(tuple(gr+back*.042),.042,.030),(tuple(gr+back*.012),.044,.032),(tuple(gr+Vector((0,.008,0))),.039,.026)],leather,20)
 # Four finger lanes lie along the vertical tangent of the straight wheel grip.
 for j in range(4):
  zz=(j-1.5)*.019;rows=[]
  for x,y,z,r in [(sgn*.017,-.025,zz,.010),(sgn*.028,-.002,zz,.0105),(sgn*.022,.020,zz,.010),(sgn*.002,.025,zz,.009),(-sgn*.009,.009,zz,.0075)]:rows.append((tuple(gr+Vector((x,y,z))),r,r*.87))
  sweep('Curled_glove_finger_'+side+str(j),rows,leather,10)
 rows=[(tuple(gr+Vector((x,y,z))),r,r)for x,y,z,r in [(-sgn*.030,-.040,-.024,.014),(-sgn*.033,-.015,-.033,.013),(-sgn*.017,.008,-.035,.011),(.0,.010,-.025,.009)]];sweep('Opposed_thumb_'+side,rows,leather,12)
# Shaped boots have heel/instep/toe sections rather than cylinder feet.
for side in ['left','right']:
 x=-.49 if side=='left' else-.28
 sweep('Protective_boot_'+side,[((x,.401,.243),.043,.050),((x,.425,.223),.048,.057),((x,.470,.204),.052,.046),((x,.535,.203),.053,.039),((x,.595,.210),.044,.028),((x,.61,.212),.015,.013)],leather,20)
# Helmet shell with face-form/chin variation. Nontransparent visor overlays its front arc.
head=Vector((-.36,-.50,1.132));v=[];f=[];lat=22;seg=48
for i in range(lat+1):
 phi=.015+(math.pi-.03)*i/lat;z=math.cos(phi);ring=math.sin(phi)
 for j in range(seg):
  a=math.tau*j/seg;front=max(0,math.sin(a));chin=max(0,1-abs(z+.55)/.40)*front*.036
  v.append(tuple(head+Vector((.108*ring*math.cos(a),(.139*ring+chin)*math.sin(a),.148*z))))
for i in range(lat):
 for j in range(seg):f.append((i*seg+j,i*seg+(j+1)%seg,(i+1)*seg+(j+1)%seg,(i+1)*seg+j))
f +=[tuple(reversed(range(seg))),tuple(lat*seg+j for j in range(seg))];h=mesh('driver_helmet_shell',v,f,helmet)
v=[];f=[]
for i in range(8):
 z=-.028+i/7*.096;ring=math.sqrt(1-(z/.148)**2)
 for j in range(33):
  a=math.pi/2-1.1+j/32*2.2;v.append(tuple(head+Vector((.110*ring*math.cos(a),.142*ring*math.sin(a),z))))
for i in range(7):
 for j in range(32):a=i*33+j;f.append((a,a+1,a+34,a+33))
vi=mesh('driver_opaque_visor',v,f,visor);sol=vi.modifiers.new('Visor thickness','SOLIDIFY');sol.thickness=.003;apply(vi,sol)
# All authored mesh surfaces get valid UV islands now; texture polish waits for fit review.
def dist_segment(p,a,b):
 ab=b-a;t=max(0,min(1,(p-a).dot(ab)/ab.length_squared));return (p-a-ab*t).length
for ob in list(meshes):
 if ob.name not in bpy.data.objects:continue
 ob.data.validate(clean_customdata=True);ob.data.update()
 ob.parent=rig;bpy.context.view_layer.objects.active=ob;bpy.ops.object.select_all(action='DESELECT');ob.select_set(True);bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.0,island_margin=.015);bpy.ops.object.mode_set(mode='OBJECT')
 # Region-appropriate nearby-segment weights give connected elbow/knee deformation.
 if ob.name.startswith(('driver_helmet','driver_opaque')):allowed=['head']
 elif 'boot' in ob.name.lower():allowed=['foot_'+('left'if 'left'in ob.name else'right')]
 elif any(k in ob.name for k in ['palm','finger','thumb','gauntlet']):allowed=['hand_'+('left'if 'left'in ob.name else'right')]
 elif ob==pants:allowed=['pelvis']+['thigh_'+s for s in ['left','right']]+['shin_'+s for s in ['left','right']]
 else:allowed=['pelvis','spine','head']+['upper_arm_'+s for s in ['left','right']]+['forearm_'+s for s in ['left','right']]
 groups={n:ob.vertex_groups.new(name='driver_'+n)for n in allowed}
 for vertex in ob.data.vertices:
  ds=sorted((dist_segment(vertex.co,Vector(centers[n][0]),Vector(centers[n][1])),n)for n in allowed)[:3];ws=[1/(d*d+.001)**2 for d,n in ds];total=sum(ws)
  for (d,n),w in zip(ds,ws):groups[n].add([vertex.index],w/total,'REPLACE')
 mod=ob.modifiers.new('Driver semantic skeletal deformation','ARMATURE');mod.object=rig
# Save editable components before batching the two presentation nodes.
if FINISH:
 import sys
 sys.path.insert(0,str(P/"scripts"))
 from driver_p03b2_materials import finish_driver
 finish_driver(P,meshes,[suit,leather,helmet,visor])
bpy.context.scene.unit_settings.system='METRIC';source=B/'test-driver.blend';bpy.ops.wm.save_as_mainfile(filepath=str(source))
headparts=[o for o in meshes if o.name in bpy.data.objects and o.name.startswith(('driver_helmet','driver_opaque'))];bodyparts=[o for o in meshes if o.name in bpy.data.objects and o not in headparts]
for name,obs in [('driver_head_visual',headparts),('driver_body_visual',bodyparts)]:
 bpy.ops.object.select_all(action='DESELECT')
 for o in obs:o.select_set(True)
 bpy.context.view_layer.objects.active=obs[0];bpy.ops.object.join();bpy.context.object.name=name;bpy.context.object.data.validate(clean_customdata=True);bpy.context.object.data.update()
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.data.objects:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(O/'test-driver.glb'),export_format='GLB',use_selection=True,export_yup=True,export_skins=True,export_animations=False,export_extras=True)
# Runtime contract records factual source anchors and geometric limb lengths.
def runtime(p):return [round(p[0],7),round(p[2],7),round(-p[1],7)]
arms={}
for side in ['left','right']:
 sh,el,_=centers['upper_arm_'+side];_,gr,_=centers['forearm_'+side];wrist=Vector(gr)+(Vector(el)-Vector(gr)).normalized()*.045
 arms[side]={'upperBone':'driver_upper_arm_'+side,'lowerBone':'driver_forearm_'+side,'handBone':'driver_hand_'+side,'shoulder':runtime(sh),'elbow':runtime(el),'wrist':runtime(wrist),'contact':runtime(gr),'upperLength':(Vector(el)-Vector(sh)).length,'lowerLength':(Vector(gr)-Vector(el)).length,'poleHint':runtime((-.80 if side=='left'else .08,-.26,.58)),'wheelGripLocal':[-.165 if side=='left'else .165,0,.023],'contactPivotAtBoneHead':True}
config={'version':1,'asset':'/assets/drivers/test-driver.glb','rootNode':'driver_root','rigNode':'driver_rig','bodyNode':'driver_body_visual','headVisualNode':'driver_head_visual','basis':'runtime +X right,+Y up,-Z forward; coordinates already in vehicle space, scale1','seatAnchor':runtime((-.36,-.32,.38)),'eye':runtime((-.36,-.405,1.145)),'headCenter':runtime(head),'arms':arms,'feet':{s:{'bone':'driver_foot_'+s,'anchor':runtime((-.49 if s=='left'else-.28,.49,.22))}for s in ['left','right']},'boneRest':{bone.name:{'head':runtime(bone.head_local),'tail':runtime(bone.tail_local),'parent':bone.parent.name if bone.parent else None}for bone in arm.bones},'fitStatus':'fit02 geometry and material01 independently reviewed; final motion evidence remains separate' if FINISH else 'fit02 correction1 awaiting straight/locks/side/cockpit runtime review','limits':['Adult proportions chosen from actual seat/control scene; no human scan or likeness','Hand bone heads are wheel-contact pivots inside gloves; use actual displayed wheel matrix','Retain exported bind quaternions; do not assume bone local identity','Maximum two fit corrections before reporting residual blockers','No physical controller or hardware performance claim']}
(O/'test-driver-attachment.json').write_text(json.dumps(config,indent=2));raw=(O/'test-driver.glb').read_bytes();n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);config['exportedBoneLocalTRS']={node['name']:{k:node[k] for k in ['translation','rotation','scale'] if k in node}for node in g['nodes']if node['name'] in config['boneRest']};(O/'test-driver-attachment.json').write_text(json.dumps(config,indent=2));tri=sum(g['accessors'][pr['indices']]['count']//3 for m in g['meshes']for pr in m['primitives']);assert tri<=35000,tri;assert len(g['materials'])<=4
for rel,h in frozen.items():assert hashlib.sha256((P/rel).read_bytes()).hexdigest()==h
r={'status':'fit02 geometry reviewed; material01 exported pending runtime finish review' if FINISH else 'fit02 correction1 exported; fit/fabric not passed','triangles':tri,'primitives':sum(len(m['primitives'])for m in g['meshes']),'materials':len(g['materials']),'skins':len(g.get('skins',[])),'files':{str(p.relative_to(P)):{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for p in [source,O/'test-driver.glb',O/'test-driver-attachment.json']},'preserved':frozen};(E/('material01-export.json' if FINISH else 'fit02-export.json')).write_text(json.dumps(r,indent=2));print('DRIVER_EXPORT '+json.dumps(r))
