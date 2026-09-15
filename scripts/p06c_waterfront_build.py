"""P06C additive editable construction. Background Blender4.5.2; --stage sample|full.
Reads retained P06B sources, exports the active library; never executes the P06B writer.
"""
import ast, bisect, hashlib, json, math, pathlib, sys
import bpy, bmesh
from mathutils import Vector

ROOT=pathlib.Path(__file__).resolve().parents[1]
SRC=ROOT/'assets/blender/showcase-quality'; OUT=ROOT/'public/assets/showcase-quality'
E=ROOT/'director-kit/production/evidence/P06C'
stage=sys.argv[sys.argv.index('--stage')+1] if '--stage' in sys.argv else 'sample'
routepath=ROOT/'public/assets/harbor/route.json'; routebytes=routepath.read_bytes();route=json.loads(routebytes)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
points=[Vector(p) for p in route['centerline']];dist=[0]
for i,p in enumerate(points):dist.append(dist[-1]+(points[(i+1)%len(points)]-p).length)
def at(s):
 i=min(len(points)-1,bisect.bisect_right(dist,s%dist[-1])-1);a=points[i];b=points[(i+1)%len(points)]
 return a.lerp(b,(s-dist[i])/(dist[i+1]-dist[i])),(b-a).normalized()
def distance_to_route(x,z):
 p=Vector((x,z));result=1e9
 for i,a in enumerate(points):
  b=points[(i+1)%len(points)];v=b-a;t=max(0,min(1,(p-a).dot(v)/v.length_squared));result=min(result,(p-a-v*t).length)
 return result

# Retain exact physical surface geometry, change only UVs/material and vertex tone.
bpy.ops.wm.open_mainfile(filepath=str(SRC/'quality-foundation.blend'))
road=bpy.data.objects['road_closed_asphalt'];positions=[tuple(v.co) for v in road.data.vertices]
mat=road.data.materials[0];mat['physicalTileMetres']=.75
for node in mat.node_tree.nodes:
 if node.type=='TEX_IMAGE':
  channel=node.label
  if channel in ['Diffuse','nor_gl','Rough','AO']:
   node.image=bpy.data.images.load(str(OUT/'textures'/f'p06c_asphalt_{channel}.jpg'),check_existing=True)
   node.image.colorspace_settings.name='sRGB' if channel=='Diffuse' else 'Non-Color';node.image.pack()
mat['bindingHashes']=json.dumps({c:sha(OUT/'textures'/f'p06c_asphalt_{c}.jpg') for c in ['Diffuse','nor_gl','Rough','AO']},sort_keys=True)
mat['P06C']='Fine source aggregate separated from restrained authored route-scale tone; physical road unchanged'
for uv in road.data.uv_layers.active.data:uv.uv*=2
for attribute in list(road.data.color_attributes):road.data.color_attributes.remove(attribute)
colors=road.data.color_attributes.new(name='RoadTone',type='FLOAT_COLOR',domain='POINT')
for v,c in zip(road.data.vertices,colors.data):
 x,z=v.co.x,-v.co.y
 # Three broad maintenance zones, deliberately not equidistant random decals.
 tone=1.0-.055*math.exp(-((x-112)/54)**2-((z+260)/18)**2)-.035*math.exp(-((x-241)/24)**2-((z+161)/45)**2)-.045*math.exp(-((x-267)/20)**2-((z-78)/52)**2)
 c.color=(tone,tone,tone,1)
nt=mat.node_tree;vertex=nt.nodes.new('ShaderNodeVertexColor');vertex.layer_name='RoadTone';multiply=nt.nodes.new('ShaderNodeMixRGB');multiply.blend_type='MULTIPLY';multiply.inputs[0].default_value=1
diffuse=next(n for n in nt.nodes if n.type=='TEX_IMAGE' and n.label=='Diffuse');nt.links.new(diffuse.outputs['Color'],multiply.inputs[1]);nt.links.new(vertex.outputs['Color'],multiply.inputs[2]);nt.links.new(multiply.outputs['Color'],nt.nodes.get('Principled BSDF').inputs['Base Color'])
assert positions==[tuple(v.co) for v in road.data.vertices]
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'built-waterfront-foundation.blend'))
# Retain the established foundation batching, including spatial light/marker cells.
foundation_groups={}
for o in list(bpy.data.objects):
 if o.type!='MESH':continue
 center=o.matrix_world@sum((v.co for v in o.data.vertices),Vector())/max(1,len(o.data.vertices))
 cell=(math.floor(center.x/70),math.floor(-center.y/70)) if o.name.startswith(('Lamp_','Gate_marker_','Quay_coping_')) else ('global',)
 foundation_groups.setdefault((cell,o.data.materials[0].name),[]).append(o)
for (cell,material),obs in foundation_groups.items():
 bpy.ops.object.select_all(action='DESELECT')
 for o in obs:o.select_set(True)
 bpy.context.view_layer.objects.active=obs[0];bpy.ops.object.join();bpy.context.object.name='foundation_'+material+'_'+str(cell)
bpy.ops.export_scene.gltf(filepath=str(OUT/'foundation.glb'),export_format='GLB',export_yup=True,export_animations=False,export_extras=True,export_vertex_color='ACTIVE',export_all_vertex_colors=False)
if '--foundation-only' in sys.argv:sys.exit(0)

bpy.ops.wm.open_mainfile(filepath=str(SRC/'quality-kit.blend'))
print('P06C loaded retained kit',flush=True)
layout=json.loads((SRC/'p06c-baseline-layout.json').read_text())
modules={p['module'] for p in layout['instances']}|{'bay'}|{n for k,v in layout['lod'].items() if k!='distancesMetres' and isinstance(v,list) for n in v}
modules={m for m in modules if isinstance(m,str)}
parts={};objects=[];module='';scales={}
names={'concrete':'Quality_Cast_Concrete','wall':'Quality_Quay_Concrete','plaster':'Quality_Mineral_Stucco','metal':'Quality_Aluminum','trim':'Quality_Powdercoat','white':'Quality_Painted_White','red':'Quality_Slingmods_Red','glass':'Quality_Glazing','foliage':'Quality_Leaflets','wood':'Quality_Dock_Timber','bark':'Quality_Palm_Bark','soil':'Quality_Planted_Ground','windows':'Showcase_Practical_Atlas','epoxy':'Quality_Showroom_Epoxy','water':'Showcase_Moving_Water','turf':'Quality_Maintained_Turf','asphalt':'Quality_Dry_Asphalt'}
mats={k:bpy.data.materials[n] for k,n in names.items()}
door=mats['trim'].copy();door.name='Waterfront_Marine_Paint';door.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.19,.26,.28,1);door.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.66;mats['door']=door
scales={m.name:m.get('physicalTileMetres',2) for m in mats.values()}
TILES={0:'plaster',1:'metal',2:'wood',3:'foliage',4:'concrete',5:'red',6:'glass',7:'metal',8:'white',9:'trim',10:'white',11:'epoxy',12:'trim',13:'soil',14:'windows',15:'white'}
# Reuse small mesh authoring helpers without executing the old assignment.
tree=ast.parse((ROOT/'scripts/p06b_quality_build.py').read_text())
for node in tree.body:
 if isinstance(node,ast.FunctionDef) and node.name in ['worlduv','rv','mesh','box','beam','text']:
  exec(compile(ast.Module(body=[node],type_ignores=[]),'<retained-mesh-helper>','exec'))
for o in list(bpy.data.objects):
 if o.type!='MESH':continue
 candidates=[m for m in modules if o.name.startswith(m+'_')]
 m=o.get('module') or (max(candidates,key=len) if candidates else None)
 if m is None:raise RuntimeError('Unclassified original mesh '+o.name)
 if m.startswith('palm') and 'continuous_tapered_bark' not in o.name:
  bpy.data.objects.remove(o,do_unlink=True);continue
 parts.setdefault(m,[]).append(o);o['module']=m;objects.append(o)
print('P06C retained modules and trunks',flush=True)

# Coherent folded fronds: broad central pinnae groups, serrated edge, actual ridge.
# Opaque material, same parent frond angles and length across LOD; no blend sorting.
leaf=mats['foliage'];leaf.use_backface_culling=False
leaf.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.09,.24,.045,1)
leaf['P06CRepresentation']='Ground planting matte green; palm uses separately authored masked pinnae bake'
frond=bpy.data.materials.new('P06C_Palm_Frond');frond.use_nodes=True;frond.use_backface_culling=False
nt=frond.node_tree;bs=nt.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.8
im=bpy.data.images.load(str(OUT/'textures/p06c-frond.png'),check_existing=True);im.colorspace_settings.name='sRGB';im.pack()
tex=nt.nodes.new('ShaderNodeTexImage');tex.image=im;tex.extension='EXTEND';nt.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
mask=nt.nodes.new('ShaderNodeMath');mask.operation='GREATER_THAN';mask.inputs[1].default_value=.35;nt.links.new(tex.outputs['Alpha'],mask.inputs[0]);nt.links.new(mask.outputs[0],bs.inputs['Alpha'])
frond['P06CRepresentation']='Original64 lanceolate pinnae coverage bake on folded parent frond; explicit greater-than0.35 mask, no blending; same texture/envelope across LOD'
mats['frond']=frond
bake=json.loads((SRC/'p06c-frond-layout.json').read_text());bake_collection=bpy.data.collections.new('P06C editable parent frond bake source');bpy.context.scene.collection.children.link(bake_collection)
for i,poly in enumerate(bake['polygons']):
 me=bpy.data.meshes.new('source_pinna_'+str(i));me.from_pydata([((x-.5)*1.7,y*3.65,0) for x,y in poly],[],[tuple(range(len(poly)))]);me.update();o=bpy.data.objects.new('BAKE_PINNA_'+str(i),me);bake_collection.objects.link(o);o.hide_render=True;o.hide_select=True;o.data.materials.append(leaf)
for variant in range(3):
 for lod in range(3):
  module='palm'+str(variant)+('' if lod==0 else '_mid' if lod==1 else '_far')
  top=Vector((.5+variant*.16,7.2+variant*.65,.22));fronds=20+variant
  for j in range(fronds):
   angle=j*2.399963+variant*.51;d=Vector((math.cos(angle),0,math.sin(angle)));side=Vector((-d.z,0,d.x))
   length=3.65+.5*math.sin(j*2.4);tier=j%4;lift=[2.0,1.35,.8,.35][tier];drop=[.45,1.1,1.8,2.45][tier]
   count=[16,10,6][lod];verts=[];faces=[]
   for k in range(count+1):
    t=k/count;mid=top+d*length*t+Vector((0,lift*math.sin(t*math.pi)-drop*t*t,0))
    width=.85
    droop=.10*math.sin(math.pi*t);lag=.19*math.sin(math.pi*t)
    verts.extend([tuple(mid-side*width+d*lag-Vector((0,droop,0))),tuple(mid+Vector((0,.045*math.sin(math.pi*t),0))),tuple(mid+side*width+d*lag-Vector((0,droop,0)))])
   for k in range(count):
    for a in range(2):faces.append((k*3+a,(k+1)*3+a,(k+1)*3+a+1,k*3+a+1))
   o=mesh('folded_parent_frond_%02d'%j,verts,faces,3,'frond',True)
   for polygon in o.data.polygons:
    for li in polygon.loop_indices:
     vi=o.data.loops[li].vertex_index;k,side_index=divmod(vi,3);o.data.uv_layers.active.data[li].uv=(side_index/2,1-k/count)
   o['anatomy']='Curved folded parent frond with original lanceolate pinnae coverage and central midrib';o['lod']=lod
print('P06C folded crowns authored',flush=True)

# Architecture prototypes: properly closed workshop mass with recessed roller doors,
# rhythm of piers and clerestories, overhanging gable roof, usable loading apron.
for variant in range(3):
 module='waterfrontHall'+str(variant);height=[5.4,7.0,4.6][variant];w=30;d=15;front=4.5;back=-10.5
 box('foundation',(0,.15,-3),(w,.30,d),4)
 box('rear_wall',(0,height/2,back+.15),(w,height,.3),0)
 for s in [-1,1]:
  box('end_wall',(s*14.85,height/2,-3),(.3,height,d),0)
  box('end_service_door',(s*15.015,1.2,-.4),(.05,2.4,1.3),0,'door')
  for z in [-1.08,.28]:box('end_door_jamb',(s*15.05,1.25,z),(.10,2.5,.09),1)
  box('end_door_head',(s*15.05,2.47,-.4),(.10,.09,1.5),1)
  box('end_louver_recess',(s*15.015,3.3,-5.5),(.05,1.0,2.8),9)
  for j in range(7):box('end_vent_slat',(s*15.06,2.88+j*.14,-5.5),(.10,.04,2.8),1)
  for z in [-8,-3,2]:box('end_vertical_panel_joint',(s*15.012,height/2,z),(.03,height-.25,.028),1)
 for x in [-14.7,-5,5,14.7]:box('front_pier',(x,height/2,front-.15),(.6,height,.35),0)
 box('front_header',(0,height-.8,front-.15),(30,1.6,.35),0)
 for x in [-10,0,10]:
  box('deep_loading_door',(x,(height-1.6)/2,front-.65),(9.3,height-1.6,.16),0,'door')
  for k in range(10):box('roller_slat',(x,.30+k*(height-2)/10,front-.54),(9.1,.025,.07),1)
  box('clerestory',(x,height-.64,front+.015),(7.8,.75,.04),6)
  for j in [-1,0,1]:box('window_bar',(x+j*2.6,height-.64,front+.05),(.07,.82,.08),1)
  box('door_jambL',(x-4.65,(height-1.6)/2,front-.25),(.14,height-1.6,.75),1)
  box('door_jambR',(x+4.65,(height-1.6)/2,front-.25),(.14,height-1.6,.75),1)
 # Gabled folded roof: geometric eaves and visible dark underside, not a billboard.
 for s in [-1,1]:
  roof=mesh('pitched_roof',[(s*15.7,height-.1,back-.7),(0,height+1.4,back-.7),(0,height+1.4,front+.9),(s*15.7,height-.1,front+.9)],[(0,1,2,3)],1)
  bm=bmesh.new();bm.from_mesh(roof.data);bm.normal_update();bmesh.ops.reverse_faces(bm,faces=[f for f in bm.faces if f.normal.z<0]);bm.to_mesh(roof.data);bm.free()
  bpy.context.view_layer.objects.active=roof;solid=roof.modifiers.new('Physical roof thickness','SOLIDIFY');solid.thickness=.12;bpy.ops.object.modifier_apply(modifier=solid.name)
  beam('eave_gutter',(s*15.5,height-.15,back-.7),(s*15.5,height-.15,front+.8),.09,1)
  beam('downpipe',(s*14.7,.1,front),(s*14.7,height-.1,front),.065,1)
 for z in [back+.15,front-.15]:
  mesh('closed_gable',[(-15,height-.1,z),(15,height-.1,z),(0,height+1.4,z)],[(0,1,2)],0)
 box('loading_canopy',(0,height-1.7,6.6),(30.5,.22,4.6),1)
 for x in [-14.4,-5,5,14.4]:
  beam('canopy_column',(x,.1,8.45),(x,height-1.7,8.45),.10,1)
  beam('diagonal_brace',(x,height-2.8,8.45),(x,height-1.72,7.35),.05,1)
 box('sign_band',(0,height-1.13,front+.14),(18,.60,.14),9)
 text('identity',['QUAYSIDE  REPAIR','HARBOR  WORKSHOPS','MARINE  STORES'][variant],(0,height-1.34,front+.23),.43)
 for x in [-10,10]:box('canopy_practical',(x,height-1.84,6.9),(1.4,.035,.30),14,'windows')
 # Broad grounded planters close ends without obscuring driving visibility.
 for x in [-14,14]:
  box('planter_enclosure',(x,.38,10.8),(1.5,.76,3.8),4)
  box('soil',(x,.76,10.8),(1.3,.025,3.6),13)
  for j in range(5):
   bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=1,location=rv((x,1.02,9.5+j*.65)))
   o=bpy.context.object;o.name=module+'_clipped_shrub';o.scale=(.59+.06*math.sin(j*1.8),.62+.11*math.sin(j*2.1),.45+.10*math.cos(j*1.7));bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
   for polygon in o.data.polygons:polygon.use_smooth=True
   o.data.materials.append(leaf);worlduv(o,2);o['module']=module;parts[module].append(o);objects.append(o)
 # Yard utility cabinet/backstop tied to loading frontage.
 box('equipment_cabinet',(-11,.75,6.4),(3,1.5,1.2),8)
 for x in [-12.5,-9.5]:beam('cabinet_guard',(x,.05,7.2),(x,1.2,7.2),.08,5)

new=[]
stations=[(s,1) for s in [594,628,665,704,740]]
if stage=='full':stations=[(s,1) for s in [318,352,386,466,504,594,628,665,704,740,821]]+[(s,-1) for s in [535,574,620,701]]+[(400,-1),(875,-1),(915,1)]
for index,(s,side) in enumerate(stations):
 p,t=at(s);n=Vector((-t.y,t.x))*side;front=-n;yaw=math.atan2(front.x,front.y)
 # Move complete ensemble behind all nearby route segments, including the returning S bend.
 def world(x,z,offset):
  q=p+n*offset;return(q.x+x*math.cos(yaw)+z*math.sin(yaw),q.y-x*math.sin(yaw)+z*math.cos(yaw))
 offset=28
 for attempt in range(90):
  samples=[world(x,z,offset) for x in [-16,-8,0,8,16] for z in [-12,0,12.6]]
  if min(distance_to_route(x,z) for x,z in samples)>12.5:break
  offset+=1
 else:raise RuntimeError('No safe footprint at station '+str(s))
 q=p+n*offset
 new.append(dict(module='waterfrontHall'+str(2 if stage=='full' and s in [400,875,915] else index%3),position=[q.x,0,q.y],yaw=yaw,scale=1,district='service',station=s,offset=offset,footprint=[world(x,z,offset) for x,z in [(-16,-12.3),(16,-12.3),(16,12.3),(-16,12.3)]],minimumRouteDistance=min(distance_to_route(x,z) for x,z in samples)))
print('P06C ensemble plan',[(p['station'],p['offset']) for p in new],flush=True)

# Connected yard floor is a union, cut from every old ground sheet it meets.
# Exact boolean avoids coplanar overlaps. Saved cutters remain editable guides, excluded export.
cutters=bpy.data.collections.new('P06C locked yard footprints');bpy.context.scene.collection.children.link(cutters)
for i,p in enumerate(new):
 bpy.ops.mesh.primitive_cube_add(size=1,location=rv(p['position']));c=bpy.context.object;c.name='yard_footprint_'+str(p['station']);c.dimensions=(32,24.6,4);c.location.z=0;c.rotation_euler.z=p['yaw'];bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 # Blender XY rotation equals runtime Y rotation.
 for collection in list(c.users_collection):collection.objects.unlink(c)
 cutters.objects.link(c);c.hide_render=True;c.hide_select=True;c.display_type='WIRE'
# One deliberately connected service apron follows the actual bend, joining the yards.
# Its inner edge is12.7m off centerline: beyond retained barrier/runoff, not a new road.
for lo,hi,side in ([(590,754,1)] if stage=='sample' else [(305,933,1),(522,714,-1),(384,418,-1),(859,893,-1)]):
 for station in range(lo,hi,4):
  a,t=at(station);b,u=at(min(hi,station+4.1));n=Vector((-t.y,t.x))*side;v=Vector((-u.y,u.x))*side
  outline=[a+n*12.7,a+n*22,b+v*22,b+v*12.7]
  me=bpy.data.meshes.new('connected_apron_cutter');me.from_pydata([(p.x,-p.y,h) for h in [-2,2] for p in outline],[],[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]);me.update()
  bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(me);bm.free()
  c=bpy.data.objects.new('apron_connection_'+str(station)+'_'+str(side),me);cutters.objects.link(c);c.hide_render=True;c.hide_select=True;c.display_type='WIRE'
for m in ['landscape','pavingnetwork','serviceyard','servicepaths']:
 for o in parts.get(m,[]):
  bpy.context.view_layer.objects.active=o
  mod=o.modifiers.new('P06C actual yard holes','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.operand_type='COLLECTION';mod.collection=cutters
  bpy.ops.object.modifier_apply(modifier=mod.name)
print('P06C ground cut complete',flush=True)
module='waterfrontYards'
source_cutters=list(cutters.objects);c=source_cutters[0]
yard=c.copy();yard.data=c.data.copy();bpy.context.collection.objects.link(yard);yard.hide_render=False;yard.hide_select=False;yard.name='yard_union_work';yard.data.materials.clear();yard.data.materials.append(mats['concrete'])
operands=bpy.data.collections.new('P06C union operands');bpy.context.scene.collection.children.link(operands)
for c in source_cutters[1:]:operands.objects.link(c)
bpy.context.view_layer.objects.active=yard;mod=yard.modifiers.new('Connected yard union','BOOLEAN');mod.operation='UNION';mod.solver='EXACT';mod.operand_type='COLLECTION';mod.collection=operands;bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.data.collections.remove(operands)
print('P06C yard union complete',flush=True)
# Keep only the top surface of the union, flatten to original ground elevation.
bm=bmesh.new();bm.from_mesh(yard.data);bm.normal_update();bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.normal.z<.9],context='FACES')
for v in bm.verts:v.co.z=.003
bm.to_mesh(yard.data);bm.free();yard.name='waterfrontYards_connected_concrete';yard['module']=module;worlduv(yard,2);parts[module]=[yard];objects.append(yard)

# Locked guide collection contains exact supplied route and every collider footprint.
guides=bpy.data.collections.new('P06C LOCKED actual route and collision guides');bpy.context.scene.collection.children.link(guides)
guide_cube=bpy.data.meshes.new('Locked collider unit box');guide_cube.from_pydata([(x*.5,y*.5,z*.5) for x,y,z in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]],[],[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]);guide_cube.update()
for c in route['colliders']:
 o=bpy.data.objects.new('LOCKED_'+c['id'],guide_cube);guides.objects.link(o);o.location=rv(c['center']);o.scale=(c['size'][0],c['size'][2],c['size'][1]);o.rotation_euler.z=c['yaw'];o.hide_render=True;o.hide_select=True;o.display_type='WIRE'
curve=bpy.data.curves.new('Actual route centerline','CURVE');curve.dimensions='3D';sp=curve.splines.new('POLY');sp.points.add(len(points)-1)
for v,p in zip(sp.points,points):v.co=(p.x,-p.y,.1,1)
sp.use_cyclic_u=True;o=bpy.data.objects.new('LOCKED route centerline',curve);guides.objects.link(o);o.hide_render=True;o.hide_select=True

# Named collections retain the module parts; assembly empties provide readable footprints.
for name,obs in parts.items():
 if not name.startswith(('waterfront','palm')):continue
 coll=bpy.data.collections.new('P06C '+name);bpy.context.scene.collection.children.link(coll)
 for o in obs:
  for old in list(o.users_collection):old.objects.unlink(o)
  coll.objects.link(o)
for p in new:
 empty=bpy.data.objects.new('ASSEMBLY station '+str(p['station']),None);bpy.context.collection.objects.link(empty);empty.location=rv(p['position']);empty.rotation_euler.z=p['yaw'];empty['module']=p['module'];empty['footprint']=json.dumps(p['footprint']);empty['minimumRouteDistance']=p['minimumRouteDistance'];empty.instance_type='COLLECTION';empty.instance_collection=bpy.data.collections['P06C '+p['module']]
bpy.context.scene['P06C stage']=stage;bpy.context.scene['P06C routeSHA256']=sha(routepath)
bpy.context.scene['P06C source']='Retained P06B base with new folded parent fronds and connected marine workshop/yard ensembles. No physics or accepted vehicle changes.'
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'built-waterfront.blend'))

# Export only runtime mesh parts, never guides. Merge per module/material to preserve loader contract.
exports=[]
for name,obs in parts.items():
 groups={}
 for o in obs:
  if len(o.data.polygons)==0:continue
  assert len(o.data.materials)==1,(o.name,len(o.data.materials))
  groups.setdefault(o.data.materials[0].name,[]).append(o)
 for material,selected in groups.items():
  bpy.ops.object.select_all(action='DESELECT')
  for o in selected:o.hide_select=False;o.select_set(True)
  bpy.context.view_layer.objects.active=selected[0];bpy.ops.object.join();o=bpy.context.object;o.name='kit_'+name+'__'+material;exports.append(o)
bpy.ops.object.select_all(action='DESELECT')
for o in exports:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'kit.glb'),export_format='GLB',export_yup=True,export_animations=False,export_extras=True,use_selection=True)
# Retire isolated sprigs where they intersect the constructed yards.
def in_footprint(pos,p):
 x,z=pos[0]-p['position'][0],pos[2]-p['position'][2];c,s=math.cos(p['yaw']),math.sin(p['yaw']);u=x*c-z*s;v=x*s+z*c
 return abs(u)<17 and abs(v)<14
def on_apron(pos):
 q=Vector((pos[0],pos[2]));best=(1e9,0,0)
 for i,a in enumerate(points):
  v=points[(i+1)%len(points)]-a;t=max(0,min(1,(q-a).dot(v)/v.length_squared));delta=q-a-v*t
  if delta.length<best[0]:best=(delta.length,dist[i]+v.length*t,delta.dot(Vector((-v.y,v.x)).normalized()))
 for lo,hi,side in ([(586,758,1)] if stage=='sample' else [(301,937,1),(518,718,-1),(380,422,-1),(855,897,-1)]):
  if lo<=best[1]<=hi and 8.5<=best[2]*side<=26.5:return True
 return False
layout['instances']=[p for p in layout['instances'] if not(p['module'] in ['plantgroup','plantingbed','palm0','palm1','palm2','service','fence'] and (any(in_footprint(p['position'],q) for q in new) or on_apron(p['position'])))]
layout['instances']+=new+[dict(module='waterfrontYards',position=[0,0,0],yaw=0,scale=1,district='service')]
layout['version']='P06C-built-waterfront-1';layout['stage']=stage;layout['waterfrontEnsembles']=new
layout['lod']['policy']='Same20–22 folded parent fronds and original pinnae coverage at all distances;16/10/6 longitudinal segments. Alpha MASK0.35, never alpha blending.'
(OUT/'scene-layout.json').write_text(json.dumps(layout,indent=2))
assert routepath.read_bytes()==routebytes
(E/('construction-'+stage+'.json')).write_text(json.dumps(dict(stage=stage,blender=bpy.app.version_string,routeSHA256=sha(routepath),ensembles=new,roadVerticesUnchanged=True,files={str(p.relative_to(ROOT)).replace('\\','/'):sha(p) for p in [SRC/'built-waterfront.blend',SRC/'built-waterfront-foundation.blend',OUT/'kit.glb',OUT/'foundation.glb',OUT/'scene-layout.json']}),indent=2))
print('P06C exported',stage,len(new),'ensembles')
