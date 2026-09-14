"""P06B photo-PBR environment quality construction. Original accepted files are read-only.
Blender --background --python scripts/p06b_quality_build.py -- --stage sample|full
Worldscale material library and segmented mesh foliage, editable semantic components.
"""
import bpy,bmesh,math,json,pathlib,hashlib,struct,sys,random,bisect
import numpy as np
from mathutils import Vector
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/showcase-quality';SRC=ROOT/'assets/blender/showcase-quality';E=ROOT/'director-kit/production/evidence/P06B/artist'
for p in [OUT,SRC,E]:p.mkdir(parents=True,exist_ok=True)
stage='sample' if '--stage' not in sys.argv else sys.argv[sys.argv.index('--stage')+1]
routepath=ROOT/'public/assets/harbor/route.json';routebytes=routepath.read_bytes();route=json.loads(routebytes)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def fingerprint(o):return hashlib.sha256(json.dumps({'matrix':[list(r)for r in o.matrix_world],'v':[list(v.co)for v in o.data.vertices],'f':[list(p.vertices)for p in o.data.polygons]},sort_keys=True).encode()).hexdigest()
bpy.ops.wm.read_factory_settings(use_empty=True)
mats={}; scales={}; imagecache={}
def photo(name,asset,scale=2,normalstrength=.35,tint=None,roughness=None):
 m=bpy.data.materials.new(name);m.use_nodes=True;nt=m.node_tree;bs=nt.nodes.get('Principled BSDF')
 for channel in ['Diffuse','nor_gl','Rough','AO']:
  path=OUT/'textures'/(asset+'_'+channel+'.jpg')
  key=str(path)
  if key not in imagecache:
   im=bpy.data.images.load(key,check_existing=True);im.colorspace_settings.name='sRGB' if channel=='Diffuse' else 'Non-Color';im.pack();imagecache[key]=im
  im=imagecache[key];tex=nt.nodes.new('ShaderNodeTexImage');tex.image=im;tex.extension='REPEAT';tex.label=channel
  if channel=='Diffuse':
   if tint:
    mul=nt.nodes.new('ShaderNodeMixRGB');mul.blend_type='MULTIPLY';mul.inputs[0].default_value=1;mul.inputs[2].default_value=(*tint,1);nt.links.new(tex.outputs['Color'],mul.inputs[1]);nt.links.new(mul.outputs[0],bs.inputs['Base Color'])
   else:nt.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
  elif channel=='Rough':nt.links.new(tex.outputs['Color'],bs.inputs['Roughness'])
  elif channel=='nor_gl':
   normal=nt.nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=normalstrength;nt.links.new(tex.outputs['Color'],normal.inputs['Color']);nt.links.new(normal.outputs['Normal'],bs.inputs['Normal'])
  else:
   group=bpy.data.node_groups.get('glTF Material Output')
   if group is None:
    group=bpy.data.node_groups.new('glTF Material Output','ShaderNodeTree');group.interface.new_socket(name='Occlusion',in_out='INPUT',socket_type='NodeSocketFloat')
   node=nt.nodes.new('ShaderNodeGroup');node.node_tree=group;nt.links.new(tex.outputs['Color'],node.inputs['Occlusion'])
 m['physicalTileMetres']=scale;m['sourceAsset']=asset;m['bindingHashes']=json.dumps({c:sha(OUT/'textures'/(asset+'_'+c+'.jpg')) for c in ['Diffuse','nor_gl','Rough','AO']},sort_keys=True);scales[name]=scale;return m

def flat(name,col,rough=.6,metal=0,emit=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*col,1);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
 if emit:bs.inputs['Emission Color'].default_value=(*col,1);bs.inputs['Emission Strength'].default_value=emit
 return m
mats['asphalt']=photo('Quality_Dry_Asphalt','asphalt_02',1.5,.25)
mats['concrete']=photo('Quality_Cast_Concrete','concrete_pavement_02',2,.3)
mats['wall']=photo('Quality_Quay_Concrete','concrete_wall_006',2,.32)
mats['wood']=photo('Quality_Dock_Timber','weathered_brown_planks',2,.5)
mats['bark']=photo('Quality_Palm_Bark','palm_tree_bark',1.3,.6)
mats['soil']=photo('Quality_Planted_Ground','leafy_grass',2,.3)
mats['plaster']=photo('Quality_Mineral_Stucco','white_plaster_rough_01',2,.24)
# Mineral plaster photograph retains broad variation but a clean neutral tint, no atlas.
bs=mats['plaster'].node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.72,.70,.63,1)
mats['metal']=flat('Quality_Aluminum',(.22,.26,.27),.38,.7)
mats['trim']=flat('Quality_Powdercoat',(.045,.065,.073),.52,.1)
mats['white']=flat('Quality_Painted_White',(.72,.75,.73),.48)
mats['red']=flat('Quality_Slingmods_Red',(.38,.009,.014),.42)
mats['glass']=flat('Quality_Glazing',(.11,.19,.22),.22,.38)
mats['foliage']=flat('Quality_Leaflets',(.095,.21,.033),.78);mats['foliage'].use_backface_culling=False
mats['windows']=flat('Showcase_Practical_Atlas',(.85,.70,.43),.38,0,1.1)
mats['epoxy']=photo('Quality_Showroom_Epoxy','white_plaster_rough_01',2,.08)
ep=mats['epoxy'].node_tree;eb=ep.nodes.get('Principled BSDF');rough=next(n for n in ep.nodes if n.type=='TEX_IMAGE' and n.label=='Rough');rm=ep.nodes.new('ShaderNodeMath');rm.operation='MULTIPLY';rm.inputs[1].default_value=.58;ep.links.new(rough.outputs['Color'],rm.inputs[0]);ep.links.new(rm.outputs[0],eb.inputs['Roughness'])
mats['water']=flat('Showcase_Moving_Water',(.018,.115,.13),.24,.12)
# Reuse existing original water normal (not a material-library replacement).
im=bpy.data.images.load(str(ROOT/'public/assets/showcase/textures/water_normal.png'));im.colorspace_settings.name='Non-Color';im.pack();nt=mats['water'].node_tree;tex=nt.nodes.new('ShaderNodeTexImage');tex.image=im;normal=nt.nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.6;nt.links.new(tex.outputs[0],normal.inputs['Color']);nt.links.new(normal.outputs[0],nt.nodes.get('Principled BSDF').inputs['Normal'])
# Photo-based cleaned turf is derived from selected ground source in acquisition, not flat color.
mats['turf']=photo('Quality_Maintained_Turf','sparse_grass',2,.25)
TILES={0:'plaster',1:'metal',2:'wood',3:'foliage',4:'concrete',5:'red',6:'glass',7:'metal',8:'white',9:'trim',10:'white',11:'epoxy',12:'trim',13:'soil',14:'windows',15:'white'}

def worlduv(o,scale):
 me=o.data;uv=me.uv_layers.active or me.uv_layers.new(name='UVMap')
 for poly in me.polygons:
  axis=max(range(3),key=lambda a:abs(poly.normal[a]));axes=[a for a in range(3)if a!=axis]
  for li in poly.loop_indices:
   co=o.matrix_world@me.vertices[me.loops[li].vertex_index].co;uv.data[li].uv=(co[axes[0]]/scale,co[axes[1]]/scale)

# Append accepted source objects. Only geometry fingerprint of physical surfaces matters.
with bpy.data.libraries.load(str(ROOT/'assets/blender/harbor/harbor.blend'),link=False) as (source,data):
 data.objects=[n for n in source.objects if n in ['road_closed_asphalt','runoff_left','runoff_right','curbs_exact_route_colliders','barriers_exact_route_colliders','finish_line_paint'] or n.startswith(('paint_edge_','Road_direction_arrow_','Lamp_','Quay_coping_','Gate_marker_','Freight_container_'))]
keep=[o for o in data.objects if o and o.type=='MESH'];protected={}
for o in keep:
 bpy.context.collection.objects.link(o);protected[o.name]=fingerprint(o);name=o.name
 kind='asphalt' if name=='road_closed_asphalt' else 'turf' if name=='Harbor_land' else 'plaster' if name.startswith(('curbs','barriers')) else 'wall' if name.startswith('Quay') else 'concrete' if name.startswith('runoff') else None
 if kind:o.data.materials.clear();o.data.materials.append(mats[kind]);worlduv(o,scales.get(mats[kind].name,2))
for o in keep:assert fingerprint(o)==protected[o.name]
bpy.context.scene['P06B physical preservation']='Source mesh positions/topology unchanged for driving surface and barriers; UV and visual materials replaced.'
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'quality-foundation.blend'))
groups={}
for o in keep:
 c=o.matrix_world@sum((v.co for v in o.data.vertices),Vector())/max(1,len(o.data.vertices));cell=(math.floor(c.x/70),math.floor(-c.y/70)) if o.name.startswith(('Lamp_','Gate_marker_','Quay_coping_')) else ('global',)
 groups.setdefault((cell,o.data.materials[0].name),[]).append(o)
for (cell,matname),obs in groups.items():
 bpy.ops.object.select_all(action='DESELECT')
 for o in obs:o.select_set(True)
 bpy.context.view_layer.objects.active=obs[0];bpy.ops.object.join();bpy.context.object.name='foundation_'+matname+'_'+str(cell)
bpy.ops.export_scene.gltf(filepath=str(OUT/'foundation.glb'),export_format='GLB',export_yup=True,export_animations=False,export_extras=True)
(E/'foundation-preservation.json').write_text(json.dumps({'routeSHA256':sha(routepath),'physicalMeshHashes':protected,'allRetainedMeshPositionsTopologyUnchanged':True,'decorativeGroundReplacement':'Original Harbor_land excluded from export; unified terrain has exact paving holes. Route ground collider unchanged.','renderChanges':'Worldscale planar UVs and photo PBR for asphalt, paved runoffs, barriers and land. Original materials elsewhere. No collider changes.'},indent=2))
for o in list(bpy.data.objects):bpy.data.objects.remove(o,do_unlink=True)
parts={};module='';objects=[]
def rv(p):return (p[0],-p[2],p[1])
def mesh(name,vertices,faces,tile,kind='atlas',smooth=False):
 me=bpy.data.meshes.new(name);me.from_pydata([rv(p)for p in vertices],[],faces);me.update();o=bpy.data.objects.new(module+'_'+name,me);bpy.context.collection.objects.link(o);kind=TILES[tile] if kind=='atlas' else kind;me.materials.append(mats[kind]);objects.append(o);parts.setdefault(module,[]).append(o)
 bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(me);bm.free();uv=me.uv_layers.new(name='UVMap');tx=tile%4;ty=tile//4
 for poly in me.polygons:
  poly.use_smooth=smooth
 worlduv(o,scales.get(mats[kind].name,2))
 o['surfaceFamily']=kind;o['module']=module;o['originalAuthoring']='P06B original Blender mesh; metre UV; source-bound CC0 PBR or physical scalar manufactured finish';return o
def box(name,p,s,tile=0,kind='atlas',bevel=0):
 v=[(p[0]+a*s[0]/2,p[1]+b*s[1]/2,p[2]+c*s[2]/2)for a,b,c in [(-1,-1,-1),(1,-1,-1),(1,-1,1),(-1,-1,1),(-1,1,-1),(1,1,-1),(1,1,1),(-1,1,1)]];o=mesh(name,v,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],tile,kind)
 if bevel:mod=o.modifiers.new('Small manufactured bevel','BEVEL');mod.width=bevel;mod.segments=2;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 return o
def beam(name,a,b,r,tile=1,sides=8):
 a,b=Vector(a),Vector(b);axis=(b-a).normalized();u=axis.cross(Vector((0,1,0)))
 if u.length<.01:u=axis.cross(Vector((1,0,0)))
 u.normalize();v=axis.cross(u);points=[tuple(p+r*(u*math.cos(j*math.tau/sides)+v*math.sin(j*math.tau/sides)))for p in [a,b]for j in range(sides)];return mesh(name,points,[(j,(j+1)%sides,(j+1)%sides+sides,j+sides)for j in range(sides)]+[tuple(reversed(range(sides))),tuple(range(sides,2*sides))],tile,smooth=True)
def text(name,body,p,size,tile=15):
 c=bpy.data.curves.new(name,'FONT');c.body=body;c.align_x='CENTER';c.size=size;c.extrude=.003;o=bpy.data.objects.new(module+'_'+name,c);bpy.context.collection.objects.link(o);o.location=rv(p);o.rotation_euler=(math.pi/2,0,0);bpy.context.view_layer.objects.active=o;bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.ops.object.convert(target='MESH');o=bpy.context.object;o.data.materials.append(mats[TILES[tile]]);uv=o.data.uv_layers.new();
 for d in uv.data:d.uv=((tile%4+.5)/4,(tile//4+.5)/4)
 parts.setdefault(module,[]).append(o);objects.append(o)
def facade(w,d,h,service=False):
 # Real wall openings: front is piers and spandrels around recessed glazing, not paint on a box.
 box('stepped_plinth',(0,.12,0),(w,.24,d),4,bevel=.035)
 box('rear_wall',(0,h/2,-d/2+.14),(w,h,.28),0)
 for sg in [-1,1]:box('side_wall',(sg*(w/2-.14),h/2,0),(.28,h,d),0)
 front=d/2;openingh=h*.62;bottom=.4;top=bottom+openingh;bayw=w*.27
 box('front_sill_wall',(0,bottom/2,front-.14),(w,bottom,.28),0)
 box('front_spandrel',(0,(h+top)/2,front-.14),(w,h-top,.28),0)
 for x in [-w*.48,-w*.16,w*.16,w*.48]:box('solid_front_pier',(x,(bottom+top)/2,front-.14),(w*.055,openingh,.28),0)
 box('roof_deck',(0,h-.13,0),(w,.26,d),0)
 box('roof_shadow_gap',(0,h+.02,0),(w+.1,.06,d+.1),12)
 box('parapet_cap',(0,h+.15,0),(w+.28,.19,d+.28),1,bevel=.028)
 for x in [-w*.32,0,w*.32]:
  if not(service and x==0):box('recessed_glazing',(x,(bottom+top)/2,front-.32),(bayw,openingh,.035),6)
  for sg in [-1,1]:box('extruded_jamb',(x+sg*bayw/2,(bottom+top)/2,front-.05),(.075,openingh,.23),1)
  for y in [bottom,top]:box('head_sill_extrusion',(x,y,front-.05),(bayw+.1,.085,.23),1)
  for sg in [-1,0,1]:box('window_mullion',(x+sg*bayw/3,(bottom+top)/2,front-.12),(.045,openingh,.10),1)
  box('transom',(x,top-1,front-.11),(bayw,.045,.11),1)
  box('interior_floor',(x,.29,front-1.4),(bayw,.06,2.4),4)
  box('interior_counter',(x,.81,front-1.0),(bayw*.6,1.04,.65),2)
 if service:
  # Central bay roll-up sits back behind the opening. Side shell remains on accepted bounds.
  for i in range(11):box('roller_door_section',(0,.48+i*.32,front-.40),(bayw*.95,.30,.035),7)
  box('loading_brow',(0,top+.12,front+.85),(bayw+1,.16,2.0),1)
  for side in [-1,1]:
   for z in [-d*.36,-d*.12,d*.12,d*.36]:
    box('cladding_seam',(side*(w/2+.012),h*.48,z),(.016,h*.9,.021),12)
    box('side_clerestory',(side*(w/2+.018),h*.76,z),(.025,h*.16,d*.18),6)
   box('eaves_drain',(side*w/2,h-.4,0),(.09,.09,d),1)
  for x in [-w*.46,w*.46]:beam('downpipe',(x,.15,front),(x,h-.3,front),.048,1,10)
 else:
  box('projecting_canopy',(0,h*.73,front+1.65),(w*.92,.22,3.4),1,bevel=.025)
  box('canopy_soffit',(0,h*.73-.13,front+1.6),(w*.88,.035,3.1),15)
  for x in [-w*.39,w*.39]:beam('canopy_column',(x,.12,front+2.7),(x,h*.73,front+2.7),.095,1,12)
  for x in [-w*.30,0,w*.30]:box('recessed_soffit_light',(x,h*.73-.16,front+1.5),(w*.15,.022,.24),14,'windows')
  # Tall blade screens and recessed twin entry handles add real foreground depth.
  for x in [-w*.46,w*.46]:
   for j in range(6):box('sunshade_blade',(x+j*.09,(bottom+top)/2,front+.32),(.035,openingh,.55),2)
  for x in [-.32,.32]:beam('entry_handle',(x,1.05,front-.015),(x,1.72,front-.015),.015,1,8)
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
module='dock'
for plank in range(24):box('individual_deck_plank',(-2.775+plank*.2413,-.025,0),(.23,.19,4.5),2,bevel=.005)
for x in [-2.55,0,2.55]:box('deck_stringer',(x,-.17,0),(.12,.16,4.7),2)
for x in [-2.55,2.55]:
 for z in [-1.85,1.85]:beam('pile',(x,-.7,z),(x,.65,z),.13,2);beam('bollard',(x,.2,z),(x,.58,z),.1);beam('cleat',(x-.21,.51,z),(x+.21,.51,z),.045)
for x in [-2.55,2.55]:
 for z in [-1.85,1.85]:
  beam('crossbrace',(x,-.62,z-.42),(x,.02,z+.42),.055,2)
module='quay';box('paving',(0,.045,0),(14,.09,7.9),4);q=box('waterline_retaining_wall',(-7.1,-.28,0),(.30,.80,7.98),4);q.data.materials[0]=mats['wall'];worlduv(q,2)
box('quay_cast_cap',(-7.1,.15,0),(.43,.12,7.98),4)
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
for z in [-2.8,2.8]:
 box('seating',(0,.55,z),(8,.18,.6),2)
 for x in [-3,3]:box('seat_support',(x,.28,z),(.16,.56,.5),1)
for x in [-5.4,-2.7,0,2.7,5.4]:beam('roof_rafter',(x,3.98,-3.8),(x,3.98,3.8),.065,2,6)
for z in [-3.85,3.85]:box('roof_fascia',(0,4,z),(12,.22,.10),1)
for x in [-5.4,5.4]:
 for z in [-3.3,3.3]:beam('knee_brace',(x,3.1,z),(x*.84,4,z),.04,1,6)
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
# Three growth variants each have true geometric near/mid/far foliage representations.
for variant in range(3):
 for lod in range(3):
  module='palm'+str(variant)+('' if lod==0 else '_mid' if lod==1 else '_far');h=7.2+variant*.65;top=Vector((.5+variant*.16,h,.22));last=Vector((0,0,0))
  segments=16 if lod==0 else 10;sides=12 if lod==0 else 8;trunkverts=[]
  for k in range(segments+1):
   t=k/segments;center=Vector((top.x*t**1.8,h*t,.22*t));radius=.23-.115*t+.025*math.exp(-t*12)
   trunkverts.extend([tuple(center+Vector((radius*math.cos(j*math.tau/sides),0,radius*math.sin(j*math.tau/sides))))for j in range(sides)])
  trunk=mesh('continuous_tapered_bark',trunkverts,[(k*sides+j,k*sides+(j+1)%sides,(k+1)*sides+(j+1)%sides,(k+1)*sides+j)for k in range(segments)for j in range(sides)],2,kind='bark',smooth=True)
  for poly in trunk.data.polygons:
   js=[trunk.data.loops[li].vertex_index%sides for li in poly.loop_indices];wrap=max(js)-min(js)>sides/2
   for li in poly.loop_indices:
    vi=trunk.data.loops[li].vertex_index;k,j=divmod(vi,sides);j=sides if wrap and j==0 else j;trunk.data.uv_layers.active.data[li].uv=(j/sides*1.35,(h*k/segments)/1.3)
  fronds=23+variant if lod<2 else 13
  for j in range(fronds):
   angle=j*math.tau/fronds+variant*.51;d=Vector((math.cos(angle),0,math.sin(angle)));side=Vector((-d.z,0,d.x));length=3.5+.55*math.sin(j*2.4);tier=j%3;lift=[1.8,1.0,.45][tier];drop=[.75,1.75,2.6][tier]
   def spine(t):return top+d*length*t+Vector((0,lift*math.sin(t*math.pi)-drop*t*t,0))
   last=spine(0)
   for k in range(8 if lod==0 else 5):
    t=(k+1)/(8 if lod==0 else 5);p=spine(t);beam('frond_rachis',last,p,.017*(1-t*.85),3,5);last=p
   leaflets=29 if lod==0 else 16 if lod==1 else 9
   verts=[];faces=[]
   for k in range(leaflets):
    t=.11+.84*k/leaflets;mid=spine(t);spread=.80*math.sin(math.pi*t)**.65
    for sg in [-1,1]:
     # Narrow folded ribbons have visible gaps and taper; their droop follows age along rachis.
     root=mid;end=mid+side*(sg*spread)+d*(.22+.22*t)+Vector((0,-.16-.24*t,0));ridge=root.lerp(end,.48)+Vector((0,.024,0));width=.034 if lod==0 else .049 if lod==1 else .078;i=len(verts)
     verts.extend([tuple(root-d*.018),tuple(ridge-d*width),tuple(ridge+Vector((0,.018,0))),tuple(ridge+d*width),tuple(end)])
     faces.extend([(i,i+1,i+2),(i,i+2,i+3),(i+1,i+4,i+2),(i+2,i+4,i+3)])
   mesh('segmented_leaflets',verts,faces,3,'foliage',False)
for variant,(w,h,d)in enumerate([(22,10,16),(30,6.5,13),(14,16,15)]):
 module='shore'+str(variant);box('plinth',(0,.18,0),(w+.6,.36,d+.6),4);box('stucco_mass',(0,h/2,0),(w,h,d),0);box('roof_parapet',(0,h+.12,0),(w+.6,.24,d+.6),1)
 if variant==2:box('stepped_roof',(-2,h+1.4,0),(w*.6,2.5,d*.7),0)
 for level in range(1,int(h/3)):
  yy=level*3;box('floor_datum',(0,yy-.7,d/2+.14),(w+.1,.14,.3),4)
  for i in range(4):
   x=-w*.36+i*w*.24;box('inset_window',(x,yy+.25,d/2+.17),(w*.16,1.35,.04),14 if (i+level+variant)%3==0 else 6,'windows'if(i+level+variant)%3==0 else'atlas')
module='shoreland';sv=[];rows=101
for iz in range(rows):
 z=-500+iz*10;front=-109+10*math.sin(z*.009)+4*math.sin(z*.037);endfade=min(1,iz/3,(rows-1-iz)/3)
 for x,y in [(front,-.60),(front-4,.08),(front-18,.23),(-390,.23)]:sv.append((x,-.60+(y+.60)*endfade,z))
shore=mesh('continuous_vegetated_farbank',sv,[(i,i+4,i+5,i+1)for iz in range(rows-1)for ix in range(3)for i in [iz*4+ix]],0,kind='turf')
bm=bmesh.new();bm.from_mesh(shore.data);bm.normal_update();bmesh.ops.reverse_faces(bm,faces=[f for f in bm.faces if f.normal.z<0]);bm.to_mesh(shore.data);bm.free()
module='water';water=mesh('marina_surface',[(-6000,-.28,-6000),(-28,-.28,-6000),(-28,-.28,6000),(-6000,-.28,6000)],[(0,3,2,1)],0,'water')
for poly in water.data.polygons:
 for li in poly.loop_indices:
  co=water.data.vertices[water.data.loops[li].vertex_index].co;water.data.uv_layers.active.data[li].uv=(co.x/12,co.y/12)
# Compact garage in the SAME origin: Blender XY -> runtime XZ. Rear wall at runtime +6.8.
module='bay';box('floor_slab',(0,-.08,0),(14,.15,15),11)
# One continuous plane, metre UVs and ordinary mip filtering. No per-face atlas jumps.
floor=mesh('epoxy_aggregate_metres',[(-7,0,-7.5),(7,0,-7.5),(7,0,7.5),(-7,0,7.5)],[(0,3,2,1)],0,'epoxy')
for poly in floor.data.polygons:
 for li in poly.loop_indices:
  co=floor.data.vertices[floor.data.loops[li].vertex_index].co;floor.data.uv_layers.active.data[li].uv=(co.x/2,co.y/2)
box('rear_architecture',(0,2.3,6.8),(14,4.6,.2),0,bevel=.03)
for x in [-5.5,-2.8,0,2.8,5.5]:box('wall_reveal',(x,2.25,6.675),(.022,4.4,.028),9)
box('left_service_wall',(-6.85,2.3,2),( .18,4.6,9.5),0)
box('bench_top',(-4.35,1.05,5.85),(4.4,.12,1.1),2,bevel=.04)
for x in [-5.75,-4.35,-2.95]:box('closed_cabinet',(x,.49,5.85),(1.32,.95,1.02),1,bevel=.02);box('recessed_pull',(x,.85,5.30),(.48,.025,.035),15)
box('organized_service_panel',(-4.5,2.05,6.65),(3.9,1.3,.08),7);box('red_tool_rail',(-4.5,1.77,6.58),(3.9,.06,.09),5)
box('garage_brand_backing',(-.7,1.5,6.64),(3.9,.72,.12),9,bevel=.03)
# Bay lettering faces toward centre (-Z), so reverse front-facing module text by rotating mesh.
text('garage_brand','SLINGMODS',(-.7,1.31,6.55),.44)
for o in parts[module][-1:]:o.rotation_euler.z=math.pi
for x in [-2.5,2.8]:box('broad_ceiling_frame',(x,3.92,0),(1.35,.12,5.2),1,bevel=.035);box('broad_diffuser',(x,3.845,0),(1.18,.025,5.02),15,'windows')
# Service opening is framed glazed depth, with an original physical exterior courtyard vignette.
for z in [-2.9,1.1]:box('opening_post',(6.7,2.1,z),(.2,4.2,.18),1)
box('opening_lintel',(6.7,4.15,-.9),(.25,.2,4.2),1);box('exterior_courtyard',(9,-.08,-.9),(4,.16,5),4);box('exterior_context_wall',(11,1.8,-.9),(.16,3.6,5),0);box('exterior_daylight_panel',(10.88,2,-.9),(.025,2.8,4.2),15,'windows')
for z in [-2.7,-1.5,-.3,.9]:box('window_mullion',(6.73,2.15,z),(.06,4,.045),1)
box('subtle_red_datum',(0,.24,6.665),(13.5,.025,.025),5)
# Finished bay construction: perimeter baseboards, floor control joints, ceiling beams and doorway depth.
for z in [-4,0,4]:box('slab_control_joint',(0,.002,z),(13.5,.003,.009),9)
for x in [-3.5,3.5]:box('slab_long_joint',(x,.002,0),(.009,.003,14.6),9)
box('rear_baseboard',(0,.10,6.66),(13.7,.20,.07),1)
box('left_baseboard',(-6.72,.10,2),(.07,.2,9.5),1)
for z in [-4,0,4]:box('roof_structural_beam',(0,4.3,z),(13.5,.22,.17),15)
box('side_door_threshold',(6.77,.012,-.9),(.35,.024,4.0),1)
for z in [-2.85,1.05]:box('deep_bay_reveal',(7.04,2.1,z),(.72,4.2,.13),0)
module='barrierseam'
for side in [-1,1]:
 box('cast_vertical_joint',(side*.231,.4,0),(.002,.795,.018),9)
 box('cap_reveal',(side*.231,.74,0),(.002,.010,1),9)
# Sparse individually modeled pebbled soil pockets and planting boundary live beyond collision walls.
module='plantingbed';verts=[(0,.045,0)]+[(3.2*math.cos(j*math.tau/12),.012,2.25*math.sin(j*math.tau/12)) for j in range(12)]
mesh('irregular_mulch_bed',verts,[(0,j+1,(j+1)%12+1)for j in range(12)],13)
# Complete planted groups: palmetto fan leaves, narrow grass blades and mulch base.
module='plantgroup'
mesh('rounded_planting_bed',[(0,.026,0)]+[(4.5*math.cos(j*math.tau/24),.013,2.6*math.sin(j*math.tau/24))for j in range(24)],[(0,j+1,(j+1)%24+1)for j in range(24)],13)
for cluster,(cx,cz) in enumerate([(-2,0),(.5,.4),(2.6,-.6)]):
 for frond in range(9):
  angle=frond*math.tau/9+cluster*.6;d=Vector((math.cos(angle),0,math.sin(angle)));side=Vector((-d.z,0,d.x));base=Vector((cx,.04,cz));hub=base+d*.42+Vector((0,.65,0));beam('palmetto_stem',base,hub,.016,3,5)
  for finger in range(7):
   a=(finger-3)*.14;end=hub+d*(.7-.06*abs(finger-3))+side*a+Vector((0,-.10-.065*abs(finger-3),0));ridge=hub.lerp(end,.5)+Vector((0,.07,0));ww=.036
   mesh('split_palmetto_fan',[tuple(hub),tuple(ridge-side*ww),tuple(ridge+Vector((0,.014,0))),tuple(ridge+side*ww),tuple(end)],[(0,1,2),(0,2,3),(1,4,2),(2,4,3)],3,'foliage')
 for blade in range(28):
  angle=blade*2.399;rr=.20+.02*(blade%7);base=Vector((cx+rr*math.cos(angle),.03,cz+rr*math.sin(angle)));d=Vector((math.cos(angle),0,math.sin(angle)));side=Vector((-d.z,0,d.x));mid=base+d*.18+Vector((0,.4+.12*math.sin(blade),0));end=base+d*.38+Vector((0,.32,0))
  mesh('arching_grass_blade',[tuple(base-side*.015),tuple(base+side*.015),tuple(mid+side*.012),tuple(end),tuple(mid-side*.012)],[(0,1,2,4),(4,2,3)],3,'foliage')
# One planar union for service paving, one cutout asphalt yard; no layered floor stacks.
PAVED=[(19,49,-50,-26),(50.5,59.5,-205.5,119.5),(54,102,-121,-113),(54,146,-17,-9),(54.5,123.5,91,99),(66.5,151.5,-298,-290),(305.5,314.5,-210,120),(309.5,354.5,-179,-171),(310.5,365.5,73,81),(46,48,-216,112)]
for x,z,w,d in [(82,-150,28,46),(126,-46,27,34),(104,63,34,30),(335,-210,34,54),(343,38,30,44),(105,-328,42,32)]:
 PAVED.append((x-(w+12)/2,x+(w+12)/2,z+4-(d+16)/2,z+4+(d+16)/2))
YARD=(48,162,-216,111)
def inside(x,z,r):return r[0]<x<r[1] and r[2]<z<r[3]
def upward(o):
 bm=bmesh.new();bm.from_mesh(o.data);bm.normal_update();bmesh.ops.reverse_faces(bm,faces=[f for f in bm.faces if f.normal.z<0]);bm.to_mesh(o.data);bm.free();return o
def rectunion(name,rects,material,subtract=[]):
 xs=sorted(set(v for r in rects+subtract for v in r[:2]));zs=sorted(set(v for r in rects+subtract for v in r[2:]));vv=[];ff=[]
 for za,zb in zip(zs,zs[1:]):
  for xa,xb in zip(xs,xs[1:]):
   x=(xa+xb)/2;z=(za+zb)/2
   if any(inside(x,z,r)for r in rects) and not any(inside(x,z,r)for r in subtract):
    i=len(vv);vv.extend([(xa,.002,za),(xb,.002,za),(xb,.002,zb),(xa,.002,zb)]);ff.append((i,i+3,i+2,i+1))
 return upward(mesh(name,vv,ff,0,kind=material))
module='pavingnetwork';rectunion('continuous_service_paving',PAVED,'concrete')
module='servicepaths'
for z in range(-185,113,24):box('service_center_dash',(55,.008,z),(.07,.003,3.5),15)
module='serviceyard';rectunion('yard_cut_around_paving',[YARD],'asphalt',PAVED)
for z in [-196,-178,-160,-142,-124,-106,-88,-70,-52,-34,-16,2,20,38,56,74,92]:
 for x in [145,156]:
  if not any(inside(x,z,r)for r in PAVED):box('workbay_edge',(x,.008,z),(.085,.003,8),15)
for x,z in [(130,-194),(145,-64),(68,22),(148,100)]:
 box('raised_island',(x,.11,z),(8,.22,3.5),4,bevel=.08);box('planting_soil',(x,.227,z),(7.6,.014,3.1),13)
module='boatcradle'
for x in [-1.35,1.35]:
 box('support_runner',(x,.12,0),(.18,.24,6.3),1)
 for z in [-2,2]:beam('angled_support',(x,.18,z),(x*.65,.90,z),.065,1,8)
for z in [-2,2]:box('rubber_hull_saddle',(0,.85,z),(1.7,.12,.4),9)
# Farland ties the inland skyline into an actual continuous terrain, outside physical bounds.
module='farland';vv=[];fx=25;fz=31
for iz in range(fz):
 z=-1100+iz*80
 for ix in range(fx):
  x=380+ix*80;fade=min(1,(x-380)/160);vv.append((x,-.06+fade*(1.4+.9*math.sin(x*.006)+.65*math.sin(z*.008)),z))
mesh('inland_horizon_ground',vv,[(i,i+fx,i+fx+1,i+1)for iz in range(fz-1)for ix in range(fx-1)for i in [iz*fx+ix]],0,kind='turf',smooth=True)
# Reuse the accepted exact road/runoff cut, then cut the paved union out of decorative land.
# This avoids a fresh approximation of the physical corridor and eliminates coplanar floors.
module='landscape'
with bpy.data.libraries.load(str(ROOT/'assets/blender/harbor/harbor.blend'),link=False) as (source,data):data.objects=['Harbor_land']
land=data.objects[0];bpy.context.collection.objects.link(land);land.name='landscape_unified_ground_with_exact_holes';land.data.materials.clear();land.data.materials.append(mats['turf'])
cutters=bpy.data.collections.new('P06B pavement boolean cutters');bpy.context.scene.collection.children.link(cutters)
# PAVED rectangles and YARD form one difference collection, including intersecting rectangles.
for xa,xb,za,zb in PAVED+[YARD]:
 bpy.ops.mesh.primitive_cube_add(size=1,location=rv(((xa+xb)/2,0,(za+zb)/2)));c=bpy.context.object;c.dimensions=(xb-xa,zb-za,2);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 for collection in list(c.users_collection):collection.objects.unlink(c)
 cutters.objects.link(c)
bpy.ops.object.select_all(action='DESELECT');land.select_set(True);bpy.context.view_layer.objects.active=land;mod=land.modifiers.new('Exact connected paving exclusion','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.operand_type='COLLECTION';mod.collection=cutters;bpy.ops.object.modifier_apply(modifier=mod.name)
for c in list(cutters.objects):bpy.data.objects.remove(c,do_unlink=True)
bpy.data.collections.remove(cutters)
# The farland starts exactly at380m; retain no overlapping large ground sheet beyond it.
bpy.ops.mesh.primitive_cube_add(size=1,location=rv((760,0,0)));c=bpy.context.object;c.dimensions=(760,1800,2);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
bpy.context.view_layer.objects.active=land;mod=land.modifiers.new('Meet inland horizon ground','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=c;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(c,do_unlink=True)
worlduv(land,2);parts.setdefault(module,[]).append(land);objects.append(land);land['physicalGround']='Retains original exactroad/runoffcut; route.json ground collider unchanged; exact unionpavingholes applied';land['pavingHoleRectangles']=len(PAVED)+1
# Prune unused orphan materials/images from the editable kit; exports reference only active maps.
usedm={m for o in bpy.data.objects if o.type=='MESH' for m in o.data.materials}
mats={k:m for k,m in mats.items() if m in usedm}
for m in list(bpy.data.materials):
 if m not in usedm:bpy.data.materials.remove(m)
for im in list(bpy.data.images):
 if im.users==0:bpy.data.images.remove(im)
# Preserve editable semantic components, original maps packed in the source.
bpy.context.scene.unit_settings.system='METRIC';bpy.context.scene['provenance']='P06B original authored geometry, photo PBR from selected CC0 Poly Haven sources. See source-manifest.json.'
bpy.context.scene['module_origins']='All module geometry in metres; API places module origins using scene-layout.json; bay preserves car origin (0,0,0).'
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'quality-kit.blend'))
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
place('water',0,0,district='water');place('landscape',0,0,district='landscape')
for c in route['colliders']:
 if c['id'].startswith('barrier'):
  place('barrierseam',c['center'][0],c['center'][2],c['yaw'],[1,1,c['size'][2]],district='foreground')
for x,z in [(17,-62),(18,-13),(-18,-25),(-18,-51)]:place('palm'+str(len(layout)%3),x,z,yaw=len(layout)*.71)
for z in [-68,-55,-20]:place('planter',13,z,math.pi/2)
for z in [-75,-110,-148,-185]:
 for x in [-31,-37,-43,-49]:place('dock',x,z,district='marina')
 place('skiff',-40-(abs(z)%3)*5,z+8,math.pi*.05,1.1,district='marina',y=-.30)
place('pavilion',-19,-116,math.pi/2,district='marina')
for z in range(-224,33,8):place('quay',-20,z,district='marina')
# The approach to the broad turn must reveal a marina layer ahead, not only boats behind.
for z in [-232,-240,-248]:place('quay',-20,z,district='marina')
for x in [-31,-37,-43]:place('dock',x,-253,district='marina')
place('skiff',-42,-239,.12,1.2,district='marina',y=-.30)
for i,(x,z)in enumerate(zip([-175,-208,-148,-219,-169,-245,-190,-228,-157,-225,-183,-242,-162,-204],[-278,-235,-218,-134,-92,-75,12,55,78,135,165,218,243,265])):place('shore'+str(i%3),x,z,math.pi/2+(.08 if i%2 else -.1),.65+(i%4)*.15,district='horizon')
place('shoreland',0,0,district='horizon')
for i,z in enumerate([-300,-242,-215,-132,-75,-15,68,128,186]):place('shore'+str(i%3),407+(i%2)*20,z,-math.pi/2,.65+(i%3)*.19,district='horizon')
for i,(x,z)in enumerate([(20,236),(54,250),(102,242),(170,260),(193,234),(266,252)]):place('shore'+str(i%3),x,z,math.pi,.72+(i%3)*.22,district='horizon')
for x,z,w,d,h in [(82,-150,28,46,8),(126,-46,27,34,7),(104,63,34,30,6),(335,-210,34,54,10),(343,38,30,44,8),(105,-328,42,32,9)]:
 place('warehouse',x,z,0,[w/24,h/7.5,d/22],district='service')
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
 place('palm'+str(i%3),q.x,q.y,i*.73,.87+(i%3)*.1,district=district);place('plantingbed',q.x,q.y,i*.73,district=district)
 if s>920 and i%2==0:place('planter',q.x+2,q.y,math.atan2(t.x,t.y),district=district)
for i,s in enumerate(range(18,1230,42)):
 p,t=at(s);n=Vector((-t.y,t.x));q=p+n*5.36;place('drain',q.x,q.y,math.atan2(t.x,t.y),district='foreground')
place('servicepaths',0,0,district='service')
# Planting strips along the maintained outer edge; open sightlines across every braking approach.
for i,ss in enumerate(range(25,1230,19)):
 p,t=at(ss);n=Vector((-t.y,t.x));sg=1 if i%4 else -1;q=p+n*(15.5+(i%3)*2.6)*sg
 if q.x<-26:continue
 district='terminal' if ss<65 else 'marina' if ss<300 else 'service' if ss<935 else 'promenade'
 place('plantgroup',q.x,q.y,math.atan2(t.x,t.y),.85+(i%3)*.10,district=district)
 if i%4==0:
  for j in range(2):
   pp=q+n*(5+j*3)*sg+t*(j*4-2);place('palm'+str((i+j)%3),pp.x,pp.y,i*.71+j,[.9+.1*j,.76+.12*j,.9+.1*j],district=district)
# Grouped trees ground the distantshore architecture and hide no drivable surfaces.
for i,z in enumerate(range(-310,301,30)):
 for j in range(3):place('palm'+str((i+j)%3),-135-j*12-9*math.sin(i),z+j*5,i*.63+j,.8+(i%3)*.1,district='horizon')
for x,z in [(-16,87),(-18,105),(-14,116),(-16,-105),(-20,-126),(19,-40),(19,-50)]:place('plantgroup',x,z,math.pi/2,district='promenade' if z>0 else 'terminal')
place('serviceyard',0,0,district='service');place('pavingnetwork',0,0,district='service');place('farland',0,0,district='horizon')
for x,z in [(145,-190),(145,-172),(155,-136),(146,35),(156,72)]:
 place('boatcradle',x,z,district='service');place('skiff',x,z,0,1,district='service',y=.94)
for x,z in [(130,-194),(145,-64),(68,22),(148,100)]:place('plantgroup',x,z,0,.85,district='service',y=.23)
for i,z in enumerate(range(-360,260,27)):
 for j in range(2):place('palm'+str((i+j)%3),365+j*35+9*math.sin(i),z+j*13,i*.68+j,.7+(i%4)*.12,district='horizon')
manifest={'version':'P06B-quality-1','stage':stage,'routeSHA256':sha(routepath),'routeLength':route['length'],'coordinateSystem':'runtime metres +Y up; module front +Z','districts':[{'id':'terminal','distance':[0,65]},{'id':'marina','distance':[65,300]},{'id':'service','distance':[300,935]},{'id':'promenade','distance':[935,route['length']]}],'instances':layout,'spatialChunkMetres':45,'lod':{'palm0':['palm0','palm0_mid','palm0_far'],'palm1':['palm1','palm1_mid','palm1_far'],'palm2':['palm2','palm2_mid','palm2_far'],'distancesMetres':[45,100],'policy':'same trunk/root and crown envelope; segmented leaves simplified at distance'},'collisionPolicy':'No new collider. Accepted route JSON unchanged. Physical road/barrier positions and topology retained; visual UV/materials and quay replaced. Planting beyond collision envelope; terrain excludes18m route corridor.','warehouseVisualReplacements':[{'center':[x,h/2,z],'oldColliderSize':[w,h,d],'newModule':'warehouse','newModuleScale':[w/24,h/7.5,d/22],'effect':'Original source warehouse hidden with old decorative batch. New closed glazed/roller frontage and wall shell align with original blocker dimensions; no drive-through visual holes. Canopy, trim and apron visual only.'}for x,z,w,d,h in [(82,-150,28,46,8),(126,-46,27,34,7),(104,63,34,30,6),(335,-210,34,54,10),(343,38,30,44,8),(105,-328,42,32,9)]],'garage':{'module':'bay','carOrigin':[0,0,0],'floorTop':0,'rearWallZ':6.8,'ceilingHeight':3.845,'bounds':[-7,7,-7.5,7.5],'lightFixtures':[[-2.5,3.845,0],[2.8,3.845,0]],'ordinaryCameraOrbitUnchanged':True}}
for replacement in manifest['warehouseVisualReplacements']:
 matches=[c for c in route['colliders']if c['center']==replacement['center']and c['size']==replacement['oldColliderSize']]
 assert len(matches)==1,('Warehouse visible replacement must match an existing collider exactly',replacement)
 replacement['preservedColliderId']=matches[0]['id']
(OUT/'scene-layout.json').write_text(json.dumps(manifest,indent=2));assert routepath.read_bytes()==routebytes
def census(path):
 raw=path.read_bytes();g=json.loads(raw[20:20+struct.unpack_from('<I',raw,12)[0]]);return {'bytes':len(raw),'sha256':sha(path),'triangles':sum(g['accessors'][p['indices']]['count']//3 for m in g.get('meshes',[])for p in m['primitives']),'primitives':sum(len(m['primitives'])for m in g.get('meshes',[])),'materials':[m['name']for m in g.get('materials',[])],'images':len(g.get('images',[])),'uvPrimitives':sum('TEXCOORD_0'in p['attributes']for m in g.get('meshes',[])for p in m['primitives'])}
(E/'asset-census.json').write_text(json.dumps({'stage':stage,'provenance':'Original Blender geometry plus selected Poly Haven CC0 photo PBR library; see source-manifest.json','blenderVersion':bpy.app.version_string,'exports':{p.name:census(p)for p in OUT.glob('*.glb')},'sources':{str(p.relative_to(ROOT)):{'bytes':p.stat().st_size,'sha256':sha(p)}for p in SRC.glob('*.blend')},'maps':{str(p.relative_to(ROOT)):{'bytes':p.stat().st_size,'sha256':sha(p)}for p in (OUT/'textures').glob('*.jpg')},'materials':{'mapping':'metre-scale planar UV; bark height1.3m; road1.5m clean mirroredcrop; concrete2m; timber2m','basecolorColorSpace':'sRGB','dataMaps':'Non-Color','normalDirection':'+Y tangent','occlusion':'glTF Material Output binds selected AO photo channel','sharedAcrossModules':True},'instances':len(layout),'acceptedRouteUnchanged':True,'warehouseVisibleColliderMatch':manifest['warehouseVisualReplacements']},indent=2))
print('P06B_QUALITY_EXPORT',stage,len(layout),'instances')
