"""P06 original modular Blender harbor and compact bay. Never writes accepted sources.
Blender --background --python scripts/p06_showcase_build.py -- --stage sample|full
Original deterministic atlas is baked into PNGs, packed into editable sources and GLBs.
"""
import bpy, bmesh, math, json, pathlib, hashlib, struct, sys, random
import numpy as np
from mathutils import Vector
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/showcase'; SRC=ROOT/'assets/blender/showcase'; E=ROOT/'director-kit/production/evidence/P06/artist'
for p in [OUT,SRC,E,OUT/'textures']:p.mkdir(parents=True,exist_ok=True)
stage='sample' if '--stage' not in sys.argv else sys.argv[sys.argv.index('--stage')+1]
routepath=ROOT/'public/assets/harbor/route.json'; routebytes=routepath.read_bytes(); route=json.loads(routebytes)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def fingerprint(o):return hashlib.sha256(json.dumps({'matrix':[list(r)for r in o.matrix_world],'v':[list(v.co)for v in o.data.vertices],'f':[list(p.vertices)for p in o.data.polygons]},sort_keys=True).encode()).hexdigest()
# Preserve semantic source objects before creating modules, including exact visible colliders.
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'assets/blender/harbor/harbor.blend'))
keep=[]; protected={}
for o in list(bpy.data.objects):
 if o.type!='MESH':continue
 retain=o.name in ['road_closed_asphalt','runoff_left','runoff_right','Harbor_land','curbs_exact_route_colliders','barriers_exact_route_colliders','finish_line_paint'] or o.name.startswith(('paint_edge_','Road_direction_arrow_','Lamp_','Quay_coping_','Gate_marker_','Freight_container_'))
 if retain:keep.append(o);protected[o.name]=fingerprint(o)
assert 'road_closed_asphalt' in protected and 'barriers_exact_route_colliders' in protected
for o in list(bpy.data.objects):
 if o not in keep:bpy.data.objects.remove(o,do_unlink=True)
for o in keep:assert fingerprint(o)==protected[o.name]
road=bpy.data.objects['road_closed_asphalt'];road_uv_hash=hashlib.sha256(json.dumps([list(d.uv)for d in road.data.uv_layers.active.data]).encode()).hexdigest();roadmat=road.data.materials[0].copy();roadmat.name='Showcase_Dry_Asphalt';road.data.materials[0]=roadmat
base_node=next(n for n in roadmat.node_tree.nodes if n.type=='TEX_IMAGE'and 'basecolor'in n.image.name);oldimage=base_node.image;newimage=oldimage.copy();newimage.name='showcase_asphalt_basecolor';pixels=np.array(oldimage.pixels[:],dtype=np.float32).reshape((-1,4));pixels[:,:3]*=np.array([.62,.76,.90]);newimage.pixels.foreach_set(pixels.ravel());newimage.filepath_raw=str(OUT/'textures/asphalt_basecolor.png');newimage.file_format='PNG';newimage.save();newimage.pack();base_node.image=newimage
road_material_proof={'sourceUVHash':road_uv_hash,'unchangedUVHash':hashlib.sha256(json.dumps([list(d.uv)for d in road.data.uv_layers.active.data]).encode()).hexdigest(),'worldRepeatMetres':2,'geometryHash':fingerprint(road),'material':'Showcase_Dry_Asphalt','baseColorLinearMultiplier':[.62,.76,.90],'newBaseColorMap':str(pathlib.Path(newimage.filepath_raw).relative_to(ROOT)),'baseColorSpace':newimage.colorspace_settings.name,'roughnessAndNormal':'Original accepted dry roughness and +Y tangent normal maps retained unchanged','physicalSurface':'Accepted route driving surface and coefficients unchanged','maps':[{'name':n.image.name,'colorSpace':n.image.colorspace_settings.name,'size':list(n.image.size)}for n in roadmat.node_tree.nodes if n.type=='TEX_IMAGE']}
assert road_material_proof['sourceUVHash']==road_material_proof['unchangedUVHash']and fingerprint(road)==protected[road.name]
bpy.context.scene['provenance']='Exact unchanged retained source meshes from assets/blender/harbor/harbor.blend; road, barriers, lamp targets remain authoritative.'
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'preserved-foundation.blend'))
# Spatially group retained lamp/marker pieces by material. The exact source remains unjoined.
groups={}
for o in list(bpy.data.objects):
 if o.type=='MESH':
  c=o.matrix_world@sum((v.co for v in o.data.vertices),Vector())/max(1,len(o.data.vertices));cell=(math.floor(c.x/70),math.floor(-c.y/70)) if o.name.startswith(('Lamp_','Gate_marker_','Quay_coping_')) else ('global',)
  groups.setdefault((cell,o.data.materials[0].name),[]).append(o)
for (cell,matname),obs in groups.items():
 bpy.ops.object.select_all(action='DESELECT')
 for o in obs:o.select_set(True)
 bpy.context.view_layer.objects.active=obs[0];bpy.ops.object.join();bpy.context.object.name='foundation_'+matname+'_'+str(cell)
bpy.ops.export_scene.gltf(filepath=str(OUT/'foundation.glb'),export_format='GLB',export_yup=True,export_animations=False)
(E/'foundation-preservation.json').write_text(json.dumps({'source':str((ROOT/'assets/blender/harbor/harbor.blend').relative_to(ROOT)),'sourceSHA256':sha(ROOT/'assets/blender/harbor/harbor.blend'),'routeSHA256':sha(routepath),'routeBytesUnchanged':True,'retainedObjectHashes':protected,'roadMaterialCalibration':road_material_proof,'method':'Exact source object matrix/vertices/faces before grouping; no collider or source-file mutation. One new asphalt basecolor map, original UV/normal/roughness retained.'},indent=2))
bpy.ops.wm.read_factory_settings(use_empty=True)
# Original shared 4x4 atlas: mineral render, powdercoat, timber, foliage, stone, red, glass,
# cladding, hull, rubber, service yellow, epoxy, dark trim, sand, warm windows and light trim.
N=2048; T=N//4; rng=np.random.default_rng(606)
palette=[(.64,.66,.63),(.17,.22,.24),(.42,.29,.17),(.16,.29,.095),(.46,.48,.44),(.52,.025,.032),(.23,.36,.41),(.39,.44,.44),(.79,.81,.76),(.07,.085,.09),(.69,.47,.09),(.26,.29,.30),(.11,.13,.15),(.54,.49,.36),(.71,.46,.21),(.7,.73,.72)]
base=np.ones((N,N,4),np.float32); orm=np.ones_like(base); normal=np.ones_like(base); normal[:,:,:2]=.5
yy,xx=np.mgrid[:T,:T]; noise=rng.normal(0,1,(T,T)).astype(np.float32)
for tile,col in enumerate(palette):
 row,colidx=divmod(tile,4); ys=slice(row*T,(row+1)*T);xs=slice(colidx*T,(colidx+1)*T)
 grain=noise*.012
 if tile==2:grain+=.028*np.sin(xx*.09+np.sin(yy*.013)*2)+.008*np.sin(xx*.7)
 elif tile==3:grain+=.022*np.sin(xx*.05)+.014*np.cos(yy*.04)
 elif tile==7:grain+=np.where(xx%64<3,-.055,0)
 elif tile==11:grain=noise*.007+np.where(noise>2.2,.055,0)
 elif tile==4:grain+=np.where((xx%128<2)|(yy%128<2),-.05,0)
 base[ys,xs,:3]=np.clip(np.array(col)[None,None,:]+grain[:,:,None],0,1)
 rough=.78 if tile not in [1,6,8,12,14,15] else {1:.53,6:.28,8:.49,12:.5,14:.65,15:.5}[tile]
 orm[ys,xs,1]=np.clip(rough+noise*.018,.2,.98);orm[ys,xs,2]=.38 if tile in [1,12] else 0
 dx=(np.roll(grain,-1,1)-np.roll(grain,1,1));dy=(np.roll(grain,-1,0)-np.roll(grain,1,0));normal[ys,xs,0]=.5-dx*.7;normal[ys,xs,1]=.5-dy*.7
def image(name,arr,space):
 im=bpy.data.images.new(name,width=N,height=N,alpha=True);im.colorspace_settings.name=space;im.pixels.foreach_set(np.clip(arr,0,1).ravel());im.filepath_raw=str(OUT/'textures'/(name+'.png'));im.file_format='PNG';im.save();im.pack();return im
images={k:image('showcase_'+k,a,'sRGB' if k=='basecolor' else 'Non-Color')for k,a in [('basecolor',base),('orm',orm),('normal',normal)]}
def material(name,double=False,emit=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.use_backface_culling=not double;n=m.node_tree;bs=n.nodes.get('Principled BSDF');tex={}
 for k,im in images.items():t=n.nodes.new('ShaderNodeTexImage');t.image=im;tex[k]=t
 n.links.new(tex['basecolor'].outputs['Color'],bs.inputs['Base Color']);s=n.nodes.new('ShaderNodeSeparateColor');n.links.new(tex['orm'].outputs['Color'],s.inputs['Color']);n.links.new(s.outputs['Green'],bs.inputs['Roughness']);n.links.new(s.outputs['Blue'],bs.inputs['Metallic']);normal=n.nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.45;n.links.new(tex['normal'].outputs['Color'],normal.inputs['Color']);n.links.new(normal.outputs['Normal'],bs.inputs['Normal'])
 if emit:n.links.new(tex['basecolor'].outputs['Color'],bs.inputs['Emission Color']);bs.inputs['Emission Strength'].default_value=emit
 return m
mats={'atlas':material('Showcase_Shared_Atlas'),'foliage':material('Showcase_Foliage_Atlas',True),'windows':material('Showcase_Practical_Atlas',False,1.1)}
watermat=bpy.data.materials.new('Showcase_Moving_Water');watermat.use_nodes=True;wbs=watermat.node_tree.nodes.get('Principled BSDF');wbs.inputs['Base Color'].default_value=(.025,.13,.17,1);wbs.inputs['Roughness'].default_value=.38;wbs.inputs['Metallic'].default_value=.08
waterfield=.32*np.sin(xx*math.tau/T*5+np.sin(yy*math.tau/T*3))+.18*np.cos(yy*math.tau/T*6+xx*math.tau/T);waternormal=np.ones((T,T,4),np.float32);waternormal[:,:,0]=.5+(np.roll(waterfield,-1,1)-np.roll(waterfield,1,1))*3;waternormal[:,:,1]=.5+(np.roll(waterfield,-1,0)-np.roll(waterfield,1,0))*3
wi=bpy.data.images.new('showcase_water_normal',width=T,height=T,alpha=True);wi.colorspace_settings.name='Non-Color';wi.pixels.foreach_set(waternormal.ravel());wi.filepath_raw=str(OUT/'textures/water_normal.png');wi.file_format='PNG';wi.save();wi.pack();wt=watermat.node_tree.nodes.new('ShaderNodeTexImage');wt.image=wi;wn=watermat.node_tree.nodes.new('ShaderNodeNormalMap');wn.inputs['Strength'].default_value=.55;watermat.node_tree.links.new(wt.outputs['Color'],wn.inputs['Color']);watermat.node_tree.links.new(wn.outputs['Normal'],wbs.inputs['Normal']);mats['water']=watermat
parts={};module=''; objects=[]
def rv(p):return (p[0],-p[2],p[1])
def mesh(name,vertices,faces,tile,kind='atlas',smooth=False):
 me=bpy.data.meshes.new(name);me.from_pydata([rv(p)for p in vertices],[],faces);me.update();o=bpy.data.objects.new(module+'_'+name,me);bpy.context.collection.objects.link(o);me.materials.append(mats[kind]);objects.append(o);parts.setdefault(module,[]).append(o)
 bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(me);bm.free();uv=me.uv_layers.new(name='UVMap');tx=tile%4;ty=tile//4
 for poly in me.polygons:
  poly.use_smooth=smooth;axis=max(range(3),key=lambda a:abs(poly.normal[a]));axes=[a for a in range(3)if a!=axis];coords=[me.vertices[me.loops[l].vertex_index].co for l in poly.loop_indices];mins=[min(p[a]for p in coords)for a in axes];spans=[max(p[a]for p in coords)-mn for a,mn in zip(axes,mins)]
  for li,p in zip(poly.loop_indices,coords):uv.data[li].uv=((tx+.018+.964*(p[axes[0]]-mins[0])/max(spans[0],.001))/4,(ty+.018+.964*(p[axes[1]]-mins[1])/max(spans[1],.001))/4)
 o['atlasTile']=tile;o['module']=module;o['originalAuthoring']='Original deterministic P06 Blender kit; metres; UV atlas + tangent normal + ORM';return o
def box(name,p,s,tile=0,kind='atlas',bevel=0):
 v=[(p[0]+a*s[0]/2,p[1]+b*s[1]/2,p[2]+c*s[2]/2)for a,b,c in [(-1,-1,-1),(1,-1,-1),(1,-1,1),(-1,-1,1),(-1,1,-1),(1,1,-1),(1,1,1),(-1,1,1)]];o=mesh(name,v,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],tile,kind)
 if bevel:mod=o.modifiers.new('Small manufactured bevel','BEVEL');mod.width=bevel;mod.segments=2;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 return o
def beam(name,a,b,r,tile=1,sides=8):
 a,b=Vector(a),Vector(b);axis=(b-a).normalized();u=axis.cross(Vector((0,1,0)))
 if u.length<.01:u=axis.cross(Vector((1,0,0)))
 u.normalize();v=axis.cross(u);points=[tuple(p+r*(u*math.cos(j*math.tau/sides)+v*math.sin(j*math.tau/sides)))for p in [a,b]for j in range(sides)];return mesh(name,points,[(j,(j+1)%sides,(j+1)%sides+sides,j+sides)for j in range(sides)]+[tuple(reversed(range(sides))),tuple(range(sides,2*sides))],tile,smooth=True)
def text(name,body,p,size,tile=15):
 c=bpy.data.curves.new(name,'FONT');c.body=body;c.align_x='CENTER';c.size=size;c.extrude=.003;o=bpy.data.objects.new(module+'_'+name,c);bpy.context.collection.objects.link(o);o.location=rv(p);o.rotation_euler=(math.pi/2,0,0);bpy.context.view_layer.objects.active=o;bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.ops.object.convert(target='MESH');o=bpy.context.object;o.data.materials.append(mats['atlas']);uv=o.data.uv_layers.new();
 for d in uv.data:d.uv=((tile%4+.5)/4,(tile//4+.5)/4)
 parts.setdefault(module,[]).append(o);objects.append(o)
def facade(w,d,h,service=False):
 box('stepped_plinth',(0,.22,0),(w+.6,.44,d+.6),4,bevel=.06);box('architectural_mass',(0,h/2,0),(w,h,d),0,bevel=.08)
 box('roof_shadow_gap',(0,h-.08,0),(w+.25,.18,d+.25),12);box('parapet_cap',(0,h+.2,0),(w+.7,.36,d+.7),1,bevel=.045)
 front=d/2
 for x in [-w*.32,0,w*.32]:
  box('recessed_opening',(x,h*.48,front+.025),(w*.27,h*.61,.04),9)
  box('setback_glazing',(x,h*.5,front+.05),(w*.24,h*.54,.035),6)
  for sg in [-1,1]:box('real_window_jamb',(x+sg*w*.135,h*.48,front+.14),(.12,h*.63,.22),1)
  for y in [h*.175,h*.79]:box('real_window_rail',(x,y,front+.14),(w*.28,.11,.22),1)
  box('window_mullion',(x,h*.48,front+.16),(.07,h*.61,.14),1)
 if service:
  box('loading_recess',(0,2,front+.05),(w*.38,4,.15),9)
  for i in range(10):box('roller_door_slats',(0,.3+i*.36,front+.17),(w*.34,.33,.06),7)
  box('loading_brow',(0,4.25,front+1.3),(w*.5,.24,2.8),1)
  for side in [-1,1]:
   for z in [-d*.36,-d*.12,d*.12,d*.36]:
    box('cladding_shadow_joint',(side*(w/2+.025),h*.49,z),(.025,h*.87,.04),12)
    box('clerestory_recess',(side*(w/2+.05),h*.76,z),(.045,h*.16,d*.18),9)
    box('clerestory_glazing',(side*(w/2+.075),h*.76,z),(.025,h*.13,d*.16),6)
    for yy in [h*.685,h*.835]:box('clerestory_frame',(side*(w/2+.085),yy,z),(.06,.055,d*.19),1)
 else:
  box('projecting_canopy',(0,h*.73,front+1.6),(w*.88,.24,3.4),1,bevel=.035)
  box('canopy_underside',(0,h*.73-.14,front+1.5),(w*.80,.035,2.8),15)
  for x in [-w*.28,0,w*.28]:box('warm_canopy_practical',(x,h*.73-.168,front+1.5),(w*.19,.025,1.75),14,'windows')
  for x in [-w*.39,w*.39]:beam('canopy_column',(x,0,front+2.7),(x,h*.73,front+2.7),.09)
module='terminal';facade(20,10,6.2)
box('entrance_apron',(0,.03,8.5),(25,.06,7),4);box('mounted_sign_panel',(0,5.68,5.19),(12,1.38,.20),12,bevel=.04);text('event_brand','SLINGMODS',(0,5.14,5.31),1.04);box('canopy_name_plate',(0,4.58,8.42),(8,.48,.08),1);text('terminal_name','HARBOR  INVITATIONAL',(0,4.43,8.47),.34)
for x in [-8.7,8.7]:box('entrance_red_blade',(x,2.6,5.18),(.15,4.8,.18),5)
module='gantry'
for x in [-11.8,11.8]:box('outside_barrier_post',(x,2.375,0),(.36,4.75,.4),1);box('base',(x,.2,0),(.9,.4,.9),4)
box('overhead_header',(0,4.60,0),(24,.75,.6),12);text('event_sign','SLINGMODS  /  HARBOR',(0,4.31,.32),.58)
for x in [-8,-4,0,4,8]:box('restrained_practical',(x,4.14,0),(.8,.05,.35),14,'windows')
module='paddock';box('roof',(0,2.8,0),(5.5,.16,5),1)
for x in [-2.5,2.5]:
 for z in [-2.2,2.2]:beam('leg',(x,0,z),(x,2.8,z),.05)
box('closed_equipment',(0,.6,-1.7),(3.3,1.2,.8),12);box('red_valance',(0,2.56,2.5),(5.5,.4,.04),5)
module='warehouse';facade(24,22,7.5,True)
for x in [-11.7,11.7]:box('side_roof_trim',(x,7.2,0),(.35,.6,23),7)
text('service_identity','MARINE  SERVICE',(0,5.3,11.19),.66)
module='dock';box('timber_deck',(0,-.02,0),(5.8,.24,4.5),2)
for x in [-2.55,2.55]:
 for z in [-1.85,1.85]:beam('pile',(x,-.7,z),(x,.65,z),.13,2);beam('bollard',(x,.2,z),(x,.58,z),.1);beam('cleat',(x-.21,.51,z),(x+.21,.51,z),.045)
for x in [-2,-1,0,1,2]:box('plank_joint',(x,.107,0),(.015,.007,4.35),9)
module='quay';box('paving',(0,.045,0),(14,.09,7.9),4)
for z in [-3.5,3.5]:beam('rail_post',(-6.6,.1,z),(-6.6,1.1,z),.042)
for h in [.62,1.1]:beam('rail',(-6.6,h,-3.95),(-6.6,h,3.95),.031)
module='skiff';rows=[(-4,.6,.35),(-3.6,1.35,.55),(0,1.5,.6),(2.8,1.1,.9),(4.4,.02,1.1)];v=[]
for z,w,h in rows:v.extend([(-w,h,z),(-w*.72,-.12,z),(w*.72,-.12,z),(w,h,z)])
mesh('sheer_hull',v,[(j*4+k,j*4+k+1,j*4+k+5,j*4+k+4)for j in range(4)for k in range(3)]+[(0,3,2,1),(16,17,18,19)],8)
box('open_cockpit',(0,.59,-.1),(2.3,.12,4.8),9);box('console',(0,1.14,.1),(.9,.95,1.05),8);box('windshield',(0,1.72,.2),(.98,.4,.05),6)
for z in [-2.2,1.65]:box('bench',(0,.83,z),(2.15,.32,.55),8)
beam('bimini_archL',(-1.1,.8,-1),(-1.1,2.1,1),.035);beam('bimini_archR',(1.1,.8,-1),(1.1,2.1,1),.035);box('canvas_shade',(0,2.15,0),(2.5,.07,3.4),1);box('outboard',(0,.15,-4.1),(.65,1.1,.7),12)
module='pavilion';box('floor',(0,.08,0),(12,.16,8),4)
for x in [-5.4,5.4]:
 for z in [-3.3,3.3]:beam('post',(x,0,z),(x,4,z),.1)
mesh('folded_roof',[(-6,4,-4),(0,5.1,-4),(6,4,-4),(-6,4,4),(0,5.1,4),(6,4,4)],[(0,1,4,3),(1,2,5,4)],1)
for z in [-2.8,2.8]:box('seating',(0,.55,z),(8,.18,.6),2)
module='planter';box('concrete_trough',(0,.36,0),(3.8,.72,1.4),4,bevel=.06);box('soil',(0,.72,0),(3.45,.025,1.1),9)
for i in range(6):
 x=-1.4+i*.56
 for j in range(5):
  angle=j*math.tau/5+i*.67;direction=Vector((math.cos(angle),0,math.sin(angle)));side=Vector((-direction.z,0,direction.x));root=Vector((x,.73,.05*math.sin(i)));v=[]
  for k in range(7):
   t=k/6;mid=root+direction*(.48*t)+Vector((0,.38*math.sin(t*math.pi*.72)+.05*t,0));w=.11*math.sin(math.pi*t)**.7;v.extend([tuple(mid-side*w),tuple(mid+Vector((0,.025,0))),tuple(mid+side*w)])
  mesh('curved_low_leaf',v,[(k*3+a,(k+1)*3+a,(k+1)*3+a+1,k*3+a+1)for k in range(6)for a in range(2)],3,'foliage',True)
module='drain';box('flush_frame',(0,.014,0),(.52,.028,1.1),1)
for i in range(9):box('drain_slot',(0,.03,-.44+i*.11),(.43,.008,.045),9)
module='patch';mesh('irregular_edge_repair',[(-.7,.011,-1.6),(.52,.011,-1.6),(.71,.011,-.4),(.61,.011,1.7),(-.65,.011,1.61),(-.74,.011,.2)],[(0,5,4,3,2,1)],9)
module='service';box('equipment_body',(0,.9,0),(2.8,1.8,1.3),10,bevel=.07);box('equipment_grille',(0,1,.665),(1.7,.7,.03),9)
for x in [-1.05,1.05]:
 for z in [-.61,.61]:beam('small_wheel',(x,.3,z-.09),(x,.3,z+.09),.3,9,12)
module='lift';beam('mastL',(-4,0,0),(-4,10,0),.2,10);beam('mastR',(4,0,0),(4,10,0),.2,10);beam('crossbeam',(-4,10,0),(4,10,0),.28,10);beam('lifting_line',(0,9.9,0),(0,5.7,0),.035);beam('hook',(0,5.7,0),(.35,5.4,0),.07)
for label in ['100','50']:
 module='board'+label;beam('post',(0,0,0),(0,1.7,0),.05);box('sign',(0,1.6,0),(1.6,1.1,.12),12);text('distance',label,(0,1.29,.075),.62)
module='fence'
for x in [-3,3]:beam('post',(x,0,0),(x,2.2,0),.045)
for h in [.3,1.15,2.05]:box('rail',(0,h,0),(6,.035,.04),1)
for x in [-2.4,-1.2,0,1.2,2.4]:box('vertical',(x,1.15,0),(.022,1.8,.026),1)
for variant in range(3):
 module='palm'+str(variant);h=7.2+variant*.65;top=Vector((.5+variant*.16,h,.22));last=Vector((0,0,0))
 for k in range(8):p=Vector((top.x*((k+1)/8)**1.8,h*(k+1)/8,.22*(k+1)/8));beam('tapered_ring'+str(k),last,p,.22-.013*k,2);last=p
 for j in range(15+variant):
  angle=j*math.tau/(15+variant)+variant*.51;d=Vector((math.cos(angle),0,math.sin(angle)));side=Vector((-d.z,0,d.x));length=3.15+.4*math.sin(j*2.4);lift=.7 if j<11 else 2.1;drop=1.4 if j<11 else .7;vs=[]
  for k in range(9):
   t=k/8;mid=top+d*length*t+Vector((0,lift*math.sin(t*math.pi)-drop*t*t,0));width=.58*math.sin(math.pi*t)**.65
   # A folded, tapered broad feather silhouette stays legible at normal camera distance.
   vs.extend([tuple(mid-side*width+Vector((0,-.08,0))),tuple(mid+Vector((0,.09,0))),tuple(mid+side*width+Vector((0,-.08,0)))])
  mesh('folded_tapered_frond'+str(j),vs,[(k*3+a,(k+1)*3+a,(k+1)*3+a+1,k*3+a+1)for k in range(8)for a in range(2)],3,'foliage',True)
for variant,(w,h,d)in enumerate([(22,10,16),(30,6.5,13),(14,16,15)]):
 module='shore'+str(variant);box('plinth',(0,.18,0),(w+.6,.36,d+.6),4);box('stucco_mass',(0,h/2,0),(w,h,d),0);box('roof_parapet',(0,h+.12,0),(w+.6,.24,d+.6),1)
 if variant==2:box('stepped_roof',(-2,h+1.4,0),(w*.6,2.5,d*.7),0)
 for level in range(1,int(h/3)):
  yy=level*3;box('floor_datum',(0,yy-.7,d/2+.14),(w+.1,.14,.3),4)
  for i in range(4):
   x=-w*.36+i*w*.24;box('inset_window',(x,yy+.25,d/2+.17),(w*.16,1.35,.04),14 if (i+level+variant)%3==0 else 6,'windows'if(i+level+variant)%3==0 else'atlas')
module='shoreland';outline=[(-48,-25),(-32,-34),(21,-31),(49,-17),(43,25),(5,35),(-37,25)];v=[(0,.18,0)]+[(x,.08,z)for x,z in outline]+[(x*1.04,-.7,z*1.04)for x,z in outline];faces=[]
for i in range(len(outline)):
 j=(i+1)%len(outline);faces.append((0,1+j,1+i));faces.append((1+i,1+j,1+j+len(outline),1+i+len(outline)))
mesh('irregular_quay_landform',v,faces,13)
module='water';water=mesh('marina_surface',[(-520,-.28,-410),(-28,-.28,-410),(-28,-.28,310),(-520,-.28,310)],[(0,3,2,1)],0,'water')
for poly in water.data.polygons:
 for li in poly.loop_indices:
  co=water.data.vertices[water.data.loops[li].vertex_index].co;water.data.uv_layers.active.data[li].uv=(co.x/12,co.y/12)
# Compact garage in the SAME origin: Blender XY -> runtime XZ. Rear wall at runtime +6.8.
module='bay';box('floor_slab',(0,-.08,0),(14,.15,15),11)
# Shared atlas repeated through real UV-mapped six-tenths-metre faces: no giant stretched floor map.
fv=[];ff=[]
for iz in range(25):
 for ix in range(24):
  x=-7+14*ix/24;z=-7.5+15*iz/25;j=len(fv);fv.extend([(x,0,z),(x+14/24,0,z),(x+14/24,0,z+.6),(x,0,z+.6)]);ff.append((j,j+3,j+2,j+1))
mesh('epoxy_aggregate_metres',fv,ff,11);box('rear_architecture',(0,2.3,6.8),(14,.2,4.6),12,bevel=.03)
for x in [-5.5,-2.8,0,2.8,5.5]:box('wall_reveal',(x,2.25,6.675),(.022,4.4,.028),9)
box('left_service_wall',(-6.85,2.3,2),( .18,4.6,9.5),12)
box('bench_top',(-4.35,1.05,5.85),(4.4,.12,1.1),2,bevel=.04)
for x in [-5.75,-4.35,-2.95]:box('closed_cabinet',(x,.49,5.85),(1.32,.95,1.02),1,bevel=.02);box('recessed_pull',(x,.85,5.30),(.48,.025,.035),15)
box('organized_service_panel',(-4.5,2.05,6.65),(3.9,1.3,.08),7);box('red_tool_rail',(-4.5,1.77,6.58),(3.9,.06,.09),5)
box('garage_brand_backing',(.8,2.8,6.64),(5,.9,.12),9,bevel=.03)
# Bay lettering faces toward centre (-Z), so reverse front-facing module text by rotating mesh.
text('garage_brand','SLINGMODS',(.8,2.56,6.55),.57)
for o in parts[module][-1:]:o.rotation_euler.z=math.pi
for x in [-2.5,2.8]:box('broad_ceiling_frame',(x,3.92,0),(1.35,.12,5.2),1,bevel=.035);box('broad_diffuser',(x,3.845,0),(1.18,.025,5.02),15,'windows')
# Service opening is framed glazed depth, with an original physical exterior courtyard vignette.
for z in [-2.9,1.1]:box('opening_post',(6.7,2.1,z),(.2,4.2,.18),1)
box('opening_lintel',(6.7,4.15,-.9),(.25,.2,4.2),1);box('exterior_courtyard',(9,-.08,-.9),(4,.16,5),4);box('exterior_context_wall',(11,1.8,-.9),(.16,3.6,5),7)
for z in [-2.7,-1.5,-.3,.9]:box('window_mullion',(6.73,2.15,z),(.06,4,.045),1)
box('subtle_red_datum',(0,.24,6.665),(13.5,.025,.025),5)
# Preserve editable semantic components, original maps packed in the source.
bpy.context.scene.unit_settings.system='METRIC';bpy.context.scene['provenance']='Original locally authored P06 showcase module family and deterministic UV atlas, no external imagery/assets.'
bpy.context.scene['module_origins']='All module geometry in metres; API places module origins using scene-layout.json; bay preserves car origin (0,0,0).'
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'showcase-kit.blend'))
# Export module primitives grouped by material, not global world-spanning batches.
for name,obs in parts.items():
 materialgroups=[(kind,[o for o in obs if len(o.data.materials)and o.data.materials[0]==m])for kind,m in mats.items()]
 for kind,selected in materialgroups:
  if not selected:continue
  bpy.ops.object.select_all(action='DESELECT')
  for o in selected:o.select_set(True)
  bpy.context.view_layer.objects.active=selected[0];bpy.ops.object.join();bpy.context.object.name='kit_'+name+'__'+kind
bpy.ops.export_scene.gltf(filepath=str(OUT/'kit.glb'),export_format='GLB',export_yup=True,export_animations=False,export_extras=True)
layout=[]
def place(kind,x,z,yaw=0,scale=1,district='terminal',y=0):layout.append(dict(module=kind,position=[x,y,z],yaw=yaw,scale=scale,district=district))
place('terminal',25,-38,-math.pi/2);place('gantry',0,-22,0);place('paddock',19,10,-math.pi/2);place('paddock',19,20,-math.pi/2)
place('paddock',22,-88,-math.pi/2,district='marina');place('service',20,-98,-math.pi/2,district='marina');place('warehouse',33,-150,-math.pi/2,.45,district='marina')
place('water',0,0,district='water')
for x,z in [(17,-62),(18,-13),(-18,-25),(-18,-51)]:place('palm'+str(len(layout)%3),x,z,yaw=len(layout)*.71)
for z in [-68,-55,-20]:place('planter',13,z,math.pi/2)
for z in [-75,-110,-148,-185]:
 for x in [-31,-37,-43,-49]:place('dock',x,z,district='marina')
 place('skiff',-40-(abs(z)%3)*5,z+8,math.pi*.05,1.1,district='marina')
place('pavilion',-19,-116,math.pi/2,district='marina')
for z in range(-224,33,8):place('quay',-20,z,district='marina')
# The approach to the broad turn must reveal a marina layer ahead, not only boats behind.
for z in [-232,-240,-248]:place('quay',-20,z,district='marina')
for x in [-31,-37,-43]:place('dock',x,-253,district='marina')
place('skiff',-42,-239,.12,1.2,district='marina')
for i,(x,z)in enumerate(zip([-175,-208,-148,-219,-169,-245,-190,-228,-157,-225,-183,-242,-162,-204],[-278,-235,-218,-134,-92,-75,12,55,78,135,165,218,243,265])):place('shore'+str(i%3),x,z,math.pi/2+(.08 if i%2 else -.1),.65+(i%4)*.15,district='horizon')
for z in [-260,-120,20,160,280]:place('shoreland',-205,z,0,[2.2,1,2.2],district='horizon')
for i,z in enumerate([-300,-242,-215,-132,-75,-15,68,128,186]):place('shore'+str(i%3),407+(i%2)*20,z,-math.pi/2,.65+(i%3)*.19,district='horizon')
for i,(x,z)in enumerate([(20,236),(54,250),(102,242),(170,260),(193,234),(266,252)]):place('shore'+str(i%3),x,z,math.pi,.72+(i%3)*.22,district='horizon')
for x,z,w,d,h in [(82,-150,28,46,8),(126,-46,27,34,7),(104,63,34,30,6),(335,-210,34,54,10),(343,38,30,44,8),(105,-328,42,32,9)]:place('warehouse',x,z,0,[w/24,h/7.5,d/22],district='service')
for x,z in [(74,-193),(110,-192),(161,-15),(163,12),(325,-130),(349,-121),(320,92)]:place('service',x+5,z,.4,district='service')
place('lift',319,-157,math.pi*.2,district='service');place('lift',309,104,0,district='service')
for x,za,zb in [(42,-180,84),(309,-252,132)]:
 for z in range(za,zb,12):place('fence',x,z,math.pi/2,[2,1,1],district='service')
place('pavilion',-20,98,math.pi/2,district='promenade')
for i,z in enumerate([82,111]):place('palm'+str(i),-18,z,.5+i,district='promenade');place('planter',-15.5,z+4,0,district='promenade')
# Route-aware planting always outside the existing +/-10m barrier corridor.
points=[Vector(p)for p in route['centerline']];dist=[0]
for i,p in enumerate(points):dist.append(dist[-1]+(points[(i+1)%len(points)]-p).length)
import bisect
def at(s):
 i=min(len(points)-1,bisect.bisect_right(dist,s%dist[-1])-1);a=points[i];b=points[(i+1)%len(points)];t=(b-a).normalized();return a.lerp(b,(s-dist[i])/(dist[i+1]-dist[i])),t
for distance,label in [(205,'100'),(235,'50'),(710,'100'),(745,'50')]:
 p,t=at(distance);n=Vector((-t.y,t.x));q=p+n*11.5;place('board'+label,q.x,q.y,math.atan2(-t.x,-t.y),district='service')
for i,distance in enumerate([92,350,572,830,1068,1178]):
 p,t=at(distance);n=Vector((-t.y,t.x));q=p+n*4.10*(1 if i%2 else -1);place('patch',q.x,q.y,math.atan2(t.x,t.y),district='foreground')
for i,s in enumerate(range(55,1220,31)):
 p,t=at(s);n=Vector((-t.y,t.x));sgn=1 if i%3 else -1;q=p+n*(17+(i%4)*2)*sgn
 if q.x<-26:continue
 district='terminal'if s<65 else'marina'if s<300 else'service'if s<935 else'promenade'
 place('palm'+str(i%3),q.x,q.y,i*.73,.87+(i%3)*.1,district=district)
 if s>920 and i%2==0:place('planter',q.x+2,q.y,math.atan2(t.x,t.y),district=district)
for i,s in enumerate(range(18,1230,42)):
 p,t=at(s);n=Vector((-t.y,t.x));q=p+n*5.36;place('drain',q.x,q.y,math.atan2(t.x,t.y),district='foreground')
manifest={'version':'P06-showcase-1','stage':stage,'routeSHA256':sha(routepath),'routeLength':route['length'],'coordinateSystem':'runtime metres +Y up; module front +Z','districts':[{'id':'terminal','distance':[0,65]},{'id':'marina','distance':[65,300]},{'id':'service','distance':[300,935]},{'id':'promenade','distance':[935,route['length']]}],'instances':layout,'spatialChunkMetres':70,'collisionPolicy':'No new collider. Accepted route JSON unchanged. Props outside bounded corridor; existing source visible road, barriers, quay and lamp masts retained exactly.','warehouseVisualReplacements':[{'center':[x,h/2,z],'oldColliderSize':[w,h,d],'newModule':'warehouse','newModuleScale':[w/24,h/7.5,d/22],'effect':'Original source warehouse body hidden with superseded legacy decorative batch; replacement primary mass has same original blocker dimensions. Recesses, glazing, canopy, trim and plinth are visual only.'}for x,z,w,d,h in [(82,-150,28,46,8),(126,-46,27,34,7),(104,63,34,30,6),(335,-210,34,54,10),(343,38,30,44,8),(105,-328,42,32,9)]],'garage':{'module':'bay','carOrigin':[0,0,0],'floorTop':0,'rearWallZ':6.8,'ceilingHeight':3.845,'bounds':[-7,7,-7.5,7.5],'lightFixtures':[[-2.5,3.845,0],[2.8,3.845,0]],'ordinaryCameraOrbitUnchanged':True}}
for replacement in manifest['warehouseVisualReplacements']:
 matches=[c for c in route['colliders']if c['center']==replacement['center']and c['size']==replacement['oldColliderSize']]
 assert len(matches)==1,('Warehouse visible replacement must match an existing collider exactly',replacement)
 replacement['preservedColliderId']=matches[0]['id']
(OUT/'scene-layout.json').write_text(json.dumps(manifest,indent=2));assert routepath.read_bytes()==routebytes
def census(path):
 raw=path.read_bytes();g=json.loads(raw[20:20+struct.unpack_from('<I',raw,12)[0]]);return {'bytes':len(raw),'sha256':sha(path),'triangles':sum(g['accessors'][p['indices']]['count']//3 for m in g.get('meshes',[])for p in m['primitives']),'primitives':sum(len(m['primitives'])for m in g.get('meshes',[])),'materials':[m['name']for m in g.get('materials',[])],'images':len(g.get('images',[])),'uvPrimitives':sum('TEXCOORD_0'in p['attributes']for m in g.get('meshes',[])for p in m['primitives'])}
(E/'asset-census.json').write_text(json.dumps({'stage':stage,'provenance':'Original Blender mesh construction and deterministic numpy texture authoring, no download or external model','blenderVersion':bpy.app.version_string,'exports':{p.name:census(p)for p in OUT.glob('*.glb')},'sources':{str(p.relative_to(ROOT)):{'bytes':p.stat().st_size,'sha256':sha(p)}for p in SRC.glob('*.blend')},'maps':{str(p.relative_to(ROOT)):{'bytes':p.stat().st_size,'sha256':sha(p)}for p in (OUT/'textures').glob('*.png')},'atlas':{'dimensions':[2048,2048],'tiles':16,'basecolorColorSpace':'sRGB','ormAndNormalColorSpace':'linear Non-Color','normalDirection':'+Y tangent','packing':'R occlusion=1 / G roughness / B metallic','sharedAcrossAllModules':True},'instances':len(layout),'acceptedRouteUnchanged':True,'warehouseVisibleColliderMatch':manifest['warehouseVisualReplacements']},indent=2))
print('P06_SHOWCASE_EXPORT',stage,len(layout),'instances')
