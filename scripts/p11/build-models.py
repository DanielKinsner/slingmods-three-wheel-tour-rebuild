"""Background Blender authoring. Metres, ground-centred pivots, preserved brand input.
Run using scripts/blender.ps1 -Script scripts/p11/build-models.py.
"""
import bpy, math, json, random, numpy as np, bmesh
import runpy
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'public/assets/p11'
SOURCE=ROOT/'assets/p11'
random.seed(2111)
bpy.ops.wm.read_factory_settings(use_empty=True)
def material(name,color,metal=0,rough=.6,emission=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
 return m
steel=material('Galvanized steel',(.37,.42,.47),.85,.32)
dark=material('Graphite metal',(.035,.043,.052),.7,.38)
red=material('Signal red enamel',(.73,.012,.022),.25,.23)
white=material('Aged white',(.77,.76,.69),0,.72)
concrete=material('Concrete',(.42,.43,.42),0,.94)
rubber=material('Tire rubber',(.013,.015,.017),0,.91)
orange=material('Safety orange',(.94,.15,.018),0,.6)
wood=material('Weathered cedar',(.34,.22,.12),0,.87)
bind_pbr=runpy.run_path(str(ROOT/'scripts/p11/blender-materials.py'))['bind_pbr']
bind_pbr(wood,OUT/'wooden-sign','cedar')
lamp=material('Warm sodium diffuser',(1,.44,.09),0,.3,5)
glow=material('Emissive red ring',(.9,.005,.013),.2,.25,3)
gold=material('Gold rim',(.82,.48,.11),.9,.27)
redchrome=material('Red chrome rim',(.5,.018,.03),.95,.2)
leaf=material('Planter foliage',(.07,.16,.027),0,.8)
trim=material('Shared 4K trackside trim',(1,1,1));bind_pbr(trim,OUT/'trackside-props','trim')
trim_rows={steel.name:0,dark.name:1,concrete.name:2,rubber.name:3,red.name:4,white.name:5,wood.name:6,orange.name:7,gold.name:0,redchrome.name:4}
chain=material('Alpha-tested chain link',(.6,.6,.6));cp=chain.node_tree.nodes.get('Principled BSDF');ct=chain.node_tree.nodes.new('ShaderNodeTexImage');ct.image=bpy.data.images.load(str(OUT/'trackside-props/chain-link.png'));chain.node_tree.links.new(ct.outputs['Color'],cp.inputs['Base Color']);chain.node_tree.links.new(ct.outputs['Alpha'],cp.inputs['Alpha']);chain.surface_render_method='DITHERED';chain.use_backface_culling=False
def clear():
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def finish(obj,name,mat):
 obj.name=name;obj.data.materials.append(mat);return obj
def box(name,loc,dim,mat,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.dimensions=dim;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);finish(o,name,mat)
 if bevel:
  m=o.modifiers.new('Manufactured edges','BEVEL');m.width=bevel;m.segments=1;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=m.name)
 return o
def cyl(name,loc,r,depth,mat,n=12):
 bpy.ops.mesh.primitive_cylinder_add(vertices=n,radius=r,depth=depth,location=loc);return finish(bpy.context.object,name,mat)
def tube(name,a,b,r,mat,n=8):
 a,b=Vector(a),Vector(b);o=cyl(name,(a+b)/2,r,(b-a).length,mat,n);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
def torus(name,loc,major,minor,mat,n=24,m=4):
 bpy.ops.mesh.primitive_torus_add(major_segments=n,minor_segments=m,location=loc,major_radius=major,minor_radius=minor);return finish(bpy.context.object,name,mat)
def tri_count():
 return sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in bpy.context.scene.objects if o.type=='MESH')
def export(folder,name,lods=3,animate=False):
 dest=OUT/folder;dest.mkdir(parents=True,exist_ok=True)
 objects=list(bpy.context.scene.objects)
 for o in objects:
  o['asset']=name;o['metres']=True
  if o.type=='MESH' and not o.data.uv_layers:
   bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(island_margin=.02);bpy.ops.object.mode_set(mode='OBJECT');o.select_set(False)
 if folder=='trackside-props':
  for o in objects:
   if o.type!='MESH' or not o.data.materials:continue
   mat=o.data.materials[0]
   if mat.name in trim_rows:
    row=trim_rows[mat.name]
    for uv in o.data.uv_layers.active.data:uv.uv.y=1-(row+.01+(1-uv.uv.y)*.98)/8
    o.data.materials.clear();o.data.materials.append(trim)
 for im in bpy.data.images:
  if im.source=='FILE':
   absolute=bpy.path.abspath(im.filepath)
   if im.packed_file:im.unpack(method='REMOVE')
   im.filepath=bpy.path.relpath(absolute,start=str(SOURCE))
 bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/(name+'.blend')),compress=True)
 records=[]
 for lod in range(lods):
  mods=[]
  if lod:
   for o in objects:
    if o.type=='MESH' and len(o.data.polygons)>24:
     mod=o.modifiers.new('LOD reduction','DECIMATE');mod.ratio=[1,.5,.2][lod];mods.append((o,mod))
  file=f'{name}-lod{lod}.glb';bpy.ops.export_scene.gltf(filepath=str(dest/file),export_format='GLB',export_yup=True,export_apply=True,export_extras=True,export_animations=animate,export_animation_mode='ACTIONS')
  dg=bpy.context.evaluated_depsgraph_get();tris=sum(sum(len(p.vertices)-2 for p in o.evaluated_get(dg).data.polygons) for o in objects if o.type=='MESH');records.append({'file':file,'triangles':tris})
  for o,m in mods:o.modifiers.remove(m)
 return records
records={}
# Signs: separate plank surfaces preserve actual gaps. Official image bytes are packed unchanged.
brand=bpy.data.images.load(str(ROOT/'public/assets/brand/slingmods-logo-main.png'));brand.pack()
aspect=brand.size[0]/brand.size[1];boardW,boardH=2.4,.9
logoW=min(boardW*.755,boardH*.755*aspect);logoH=logoW/aspect
brand_pixels=np.asarray(brand.pixels[:],dtype=np.float32).reshape(brand.size[1],brand.size[0],4)
brand_carve_alpha=np.maximum.reduce([np.roll(np.roll(brand_pixels[:,:,3],dy,axis=0),dx,axis=1) for dy in [-1,0,1] for dx in [-1,0,1]])
def carve_depth(x,z):
 u=x/logoW+.5;v=(z-1.35)/logoH+.5
 if not 0<=u<1 or not 0<=v<1:return 0
 return float(brand_carve_alpha[min(brand.size[1]-1,int(v*brand.size[1])),min(brand.size[0]-1,int(u*brand.size[0]))])*.003
def carved_surface(name,x0,x1,z0,z1,mat,paint_layer=False):
 nx,nz=(160,12) if not paint_layer else (144,12);vertices=[];faces=[]
 for j in range(nz+1):
  z=z0+(z1-z0)*j/nz
  for i in range(nx+1):
   x=x0+(x1-x0)*i/nx;vertices.append((x,-.10515 if paint_layer else -.105+carve_depth(x,z),z))
 for j in range(nz):
  for i in range(nx):a=j*(nx+1)+i;faces.append((a,a+1,a+nx+2,a+nx+1))
 me=bpy.data.meshes.new(name);me.from_pydata(vertices,[],faces);me.materials.append(mat);uv=me.uv_layers.new(name='Projected original artwork' if paint_layer else 'Wood metres')
 for poly in me.polygons:
  for li in poly.loop_indices:
   x,_,z=vertices[me.loops[li].vertex_index];uv.data[li].uv=(x/logoW+.5,(z-1.35)/logoH+.5) if paint_layer else (x/1.8,z/1.8)
 ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);return ob
paint=material('Official logo paint',(1,1,1),0,.68)
p=paint.node_tree.nodes.get('Principled BSDF');tex=paint.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(OUT/'wooden-sign/paint-on-grain.png'))
paint.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color']);paint.node_tree.links.new(tex.outputs['Alpha'],p.inputs['Alpha']);paint.surface_render_method='DITHERED'
for variant in ['painted','routed']:
 clear()
 for x in [-.87,.87]:box('cedar post',(x,0,.88),(.12,.15,1.76),wood,.01)
 for i in range(5):
  z=1.35+(i-2)*.18
  plank=box('cedar plank '+str(i),(0,-.06,z),(2.4,.09,.171),wood,.004 if variant=='painted' else 0)
  if variant=='routed':
   bm=bmesh.new();bm.from_mesh(plank.data);bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.normal.y<-.9],context='FACES');bm.to_mesh(plank.data);bm.free()
   carved_surface('Routed cedar face '+str(i),-1.2,1.2,z-.0855,z+.0855,wood)
  for x in [-1.04,1.04]:
   bolt=cyl('rusted bolt',(x,-.112,z),.014,.009,dark,8);bolt.rotation_euler.x=math.pi/2
  low=max(z-.0855,1.35-logoH/2);high=min(z+.0855,1.35+logoH/2)
  if high>low:
   if variant=='routed':
    ob=carved_surface('LogoBounds_'+str(i),-logoW/2,logoW/2,low,high,paint,True);ob['carveDepthMetres']=.003;continue
   mesh=bpy.data.meshes.new('logo paint clipped to plank');depth=-.110 if variant=='painted' else -.108
   mesh.from_pydata([(-logoW/2,depth,low),(logoW/2,depth,low),(logoW/2,depth,high),(-logoW/2,depth,high)],[],[(0,1,2,3)])
   mesh.materials.append(paint);uv=mesh.uv_layers.new(name='Official artwork exact aspect')
   for l,coord in zip(uv.data,[(0,(low-1.35)/logoH+.5),(1,(low-1.35)/logoH+.5),(1,(high-1.35)/logoH+.5),(0,(high-1.35)/logoH+.5)]):l.uv=coord
   ob=bpy.data.objects.new('LogoBounds_'+str(i),mesh);bpy.context.collection.objects.link(ob)
   ob['boardWidth']=boardW;ob['boardHeight']=boardH;ob['paddingFraction']=.12
 records['sign-'+variant]=export('wooden-sign','sign-'+variant,2)
(OUT/'wooden-sign/logo-bounds.json').write_text(json.dumps({'board':{'width':boardW,'height':boardH,'centerZ':1.35},'logo':{'width':logoW,'height':logoH,'sourceAspect':aspect},'minimumPadding':.12,'variants':{'painted':'Original image projected onto five separate PBR cedar planks.','routed':'3mm mesh relief sampled from original logo alpha, matching painted fill.'},'pending':'Subtle grain multiplication and paint flaking; scenery changes owned by concurrent task.'},indent=2), encoding="utf-8")
# Compact animated pickups. Neutral three-spoke glyph is intentionally not a new logo.
for value,rim in [(10,steel),(25,gold),(50,redchrome),(100,gold)]:
 clear();r=.3 if value!=100 else .39
 vertices=[];faces=[]
 for z,scale in [(-.0325,.94),(-.022,1),(.022,1),(.0325,.94)]:
  for j in range(16):
   angle=j*math.tau/16;rr=r*scale*(1 if j%2 else .96);vertices.append((rr*math.cos(angle),rr*math.sin(angle),z))
 for k in range(3):
  for j in range(16):faces.append((k*16+j,k*16+(j+1)%16,(k+1)*16+(j+1)%16,(k+1)*16+j))
 faces.extend([tuple(range(15,-1,-1)),tuple(range(48,64))]);me=bpy.data.meshes.new('beveled eight-tooth gear rim');me.from_pydata(vertices,[],faces);me.materials.append(rim);coin=bpy.data.objects.new('chamfered gear rim',me);bpy.context.collection.objects.link(coin);coin.location=(0,0,r+.12);coin.rotation_euler.x=math.pi/2
 for y in [-.037,.037]:
  face=cyl('red enamel face',(0,y,r+.12),r*.82,.012,red,20);face.rotation_euler.x=math.pi/2
  ring=torus('red luminous inset',(0,y*1.3,r+.12),r*.85,.009,glow,16,4);ring.rotation_euler.x=math.pi/2
  for a in [math.pi/2,math.pi/2+math.tau/3,math.pi/2+2*math.tau/3]:tube('neutral three spoke glyph',(0,y*1.6,r+.12),(math.cos(a)*r*.52,y*1.6,r+.12+math.sin(a)*r*.52),.013,dark,4)
 if value==100:
  ring=torus('orbit ring',(0,0,r+.12),r*1.3,.014,glow,16,4);ring.rotation_euler.x=.6
  for frame in [1,61,121]:ring.rotation_euler.z=(frame-1)/120*math.tau;ring.keyframe_insert(data_path='rotation_euler',frame=frame)
  ring.animation_data.action.name='Orbit'
 bpy.ops.object.empty_add(type='PLAIN_AXES',location=(0,0,r+.12));parent=bpy.context.object;parent.name='Token animation root'
 for o in list(bpy.context.scene.objects):
  if o!=parent:matrix=o.matrix_world.copy();o.parent=parent;o.matrix_world=matrix
 for frame,z,angle in [(1,r+.12,0),(31,r+.21,math.pi/2),(61,r+.12,math.pi),(91,r+.03,math.pi*1.5),(121,r+.12,math.tau)]:
  parent.location.z=z;parent.rotation_euler.z=angle;parent.keyframe_insert(data_path='location',frame=frame);parent.keyframe_insert(data_path='rotation_euler',frame=frame)
 parent.animation_data.action.name='Idle_spin_bob';bpy.context.scene.frame_end=121;bpy.context.scene.frame_set(1)
 tris=tri_count();assert tris<=800,(value,tris)
 records['points-'+str(value)]=export('points-token','points-'+str(value),1,True)
# Instancing-friendly modular trackside models.
def streetlight():
 cyl('9m tapered pole',(0,0,4.45),.085,8.9,steel);box('anchor plate',(0,0,.06),(.4,.4,.12),steel,.025)
 tube('outreach',(0,0,8.7),(0,1.4,8.85),.075,steel);box('sodium lamp housing',(0,1.4,8.86),(.42,.82,.25),dark,.05);box('separate emissive diffuser',(0,1.4,8.72),(.34,.69,.025),lamp)
def bollard():
 cyl('harbor light',(0,0,.44),.13,.88,dark,12);cyl('separate emissive lens',(0,0,.9),.12,.12,lamp);cyl('cap',(0,0,.98),.16,.04,dark)
def rail(curved=False):
 for x in [-1.7,0,1.7]:box('guardrail post',(x,.1,.55),(.11,.15,1.1),steel)
 for z in [.49,.64,.79]:
  for i in range(8 if curved else 1):
   x=-2+(i+.5)*(4/(8 if curved else 1));y=.17*(x*x) if curved else 0;o=box('formed armco beam',(x,y,z),(4/(8 if curved else 1),.1,.16),steel,.025)
   if curved:o.rotation_euler.z=math.atan(.34*x)
def jersey(painted=False):
 v=[]
 for x in [-1.5,1.5]:
  for y,z in [(-.32,0),(.32,0),(.32,.15),(.13,.48),(.1,.9),(-.1,.9),(-.13,.48),(-.32,.15)]:v.append((x,y,z))
 faces=[tuple(range(7,-1,-1)),tuple(range(8,16))]+[(i,(i+1)%8,(i+1)%8+8,i+8) for i in range(8)]
 me=bpy.data.meshes.new('jersey profile');me.from_pydata(v,[],faces);ob=bpy.data.objects.new('concrete jersey barrier',me);bpy.context.collection.objects.link(ob);me.materials.append(concrete)
 if painted:
  for i in range(6):box('alternating safety paint',(-1.25+i*.5,-.109,.67),(.49,.007,.39),red if i%2 else white)
def fence():
 for x in [-1.5,1.5]:tube('catch fence post',(x,0,0),(x,0,3.5),.045,steel)
 for z in [.1,1.75,3.4]:tube('catch fence rail',(-1.5,0,z),(1.5,0,z),.025,steel)
 me=bpy.data.meshes.new('chainlink alpha mesh');me.from_pydata([(-1.5,0,.1),(1.5,0,.1),(1.5,0,3.4),(-1.5,0,3.4)],[],[(0,1,2,3)]);me.materials.append(chain);uv=me.uv_layers.new(name='50mm diamonds')
 for loop,co in zip(uv.data,[(0,0),(6,0),(6,6.6),(0,6.6)]):loop.uv=co
 ob=bpy.data.objects.new('chain link alpha panel',me);bpy.context.collection.objects.link(ob)
def tires():
 for x in [-1.2,-.6,0,.6,1.2]:
  for z in [.13,.39,.65]:torus('stacked tire',(x,0,z),.21,.085,rubber,12,4)
def banner():
 for x in [-3,3]:tube('banner upright',(x,0,0),(x,0,2.4),.06,steel)
 for z in [1.3,2.3]:tube('banner rail',(-3,0,z),(3,0,z),.045,steel)
 box('swappable banner texture slot',(0,0,1.8),(5.9,.02,.94),white)
def distance(n):
 for x in [-.28,.28]:box('board post',(x,0,.55),(.06,.06,1.1),steel)
 box('distance board',(0,-.03,1.15),(.85,.04,.55),white,.015)
 bpy.ops.object.text_add(location=(0,-.056,.95),rotation=(math.pi/2,0,0));o=bpy.context.object;o.data.body=str(n);o.data.align_x='CENTER';o.data.size=.36;o.data.extrude=.001;o.data.materials.append(dark);bpy.ops.object.convert(target='MESH')
def marshal():
 box('marshal platform',(0,0,.12),(2.2,1.8,.24),dark)
 for x in [-1,1]:
  for y in [-.8,.8]:box('marshal post',(x,y,1.2),(.09,.09,2.4),steel)
 box('marshal roof',(0,0,2.4),(2.5,2.1,.1),red,.03);box('marshal front rail',(0,-.8,1.1),(2,.08,.08),steel)
def cone():
 box('cone foot',(0,0,.04),(.4,.4,.08),rubber,.04);bpy.ops.mesh.primitive_cone_add(vertices=12,radius1=.16,radius2=.025,depth=.6,location=(0,0,.38));finish(bpy.context.object,'orange cone',orange)
 bpy.ops.mesh.primitive_cone_add(vertices=12,radius1=.104,radius2=.081,depth=.1,location=(0,0,.4));finish(bpy.context.object,'reflective band',white)
def waterbarrier():
 box('moulded water barrier',(0,0,.45),(1.5,.5,.9),orange,.1)
 for x in [-.45,0,.45]:box('reflector',(x,-.255,.56),(.23,.008,.3),white)
 cyl('fill cap',(0,0,.92),.06,.025,dark)
def trailer():
 box('enclosed trailer body',(0,0,1.65),(2.35,4.8,2.35),white,.09);box('trailer chassis',(0,0,.45),(2.4,5,.14),dark)
 for x in [-1.2,1.2]:
  for y in [-.6,.6]:
   w=torus('trailer tire',(x,y,.43),.27,.12,rubber,12,4);w.rotation_euler.y=math.pi/2
   h=cyl('wheel hub',(x,y,.43),.19,.16,steel,12);h.rotation_euler.y=math.pi/2
 for x in [-.9,.9]:tube('tow A frame',(x,2.4,.5),(0,3.8,.5),.07,steel)
 box('rear door',(0,-2.415,1.62),(2.15,.03,2.1),steel,.025)
def flood():
 box('generator',(0,0,.45),(1.2,1.8,.9),orange,.08)
 for x in [-1,1]:tube('outrigger',(0,0,.2),(x,.9,0),.045,dark)
 cyl('telescopic mast',(0,0,3.6),.06,6,steel);box('lamp crossbar',(0,0,6.6),(2,.12,.12),steel)
 for x in [-.75,-.25,.25,.75]:box('floodlight housing',(x,0,6.65),(.43,.25,.38),dark,.03);box('separate emissive flood lens',(x,-.14,6.65),(.37,.02,.31),lamp)
def stand():
 for i in range(5):
  box('grandstand tread',(0,i*.75,.3+i*.42),(6,.74,.1),steel)
  box('grandstand bench',(0,i*.75,.7+i*.42),(6,.27,.08),red,.02)
  for x in [-2.5,0,2.5]:box('stand support',(x,i*.75,(.3+i*.42)/2),(.08,.08,.3+i*.42),dark)
def container(color):
 mat=material('container paint '+str(color),color,.45,.6);box('shipping container',(0,0,1.295),(2.438,6.058,2.59),mat,.025)
 for x in [-1.23,1.23]:
  for i in range(30):box('corrugated panel',(x,-2.9+i*.2,1.3),(.025,.065,2.4),mat)
 for x in [-1.17,1.17]:
  for y in [-2.98,2.98]:box('corner casting',(x,y,1.3),(.1,.1,2.6),steel)
 for x in [-.6,.6]:box('container door',(x,-3.05,1.3),(1.15,.04,2.45),mat);tube('locking bar',(x,-3.09,.1),(x,-3.09,2.45),.02,steel)
def planter():
 box('palm planter',(0,0,.35),(1.5,1.5,.7),concrete,.04);box('planter soil',(0,0,.71),(1.35,1.35,.02),wood);cyl('palm trunk base',(0,0,1.45),.21,1.5,wood,10)
builders={'streetlight':streetlight,'bollard-light':bollard,'armco-straight':rail,'armco-curved':lambda:rail(True),'jersey-plain':jersey,'jersey-red-white':lambda:jersey(True),'catch-fence':fence,'tire-wall':tires,'banner-frame':banner,'distance-150':lambda:distance(150),'distance-100':lambda:distance(100),'distance-50':lambda:distance(50),'marshal-post':marshal,'traffic-cone':cone,'water-barrier':waterbarrier,'enclosed-trailer':trailer,'floodlight-tower':flood,'grandstand':stand,'container-red':lambda:container((.5,.025,.02)),'container-blue':lambda:container((.02,.15,.3)),'container-cream':lambda:container((.65,.58,.4)),'palm-planter':planter}
for name,build in builders.items():clear();build();records[name]=export('trackside-props',name)
# Six distinct rock forms, shared material, per-mesh LODs.
rock=material('Coastal weathered stone',(.28,.27,.23),0,.92)
bind_pbr(rock,OUT/'ground-cover','rocks')
for i,size in enumerate([2.5,1.7,1,.6,.3,.12]):
 clear();bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3,radius=1);o=bpy.context.object;finish(o,'rock '+str(i),rock)
 for v in o.data.vertices:
  v.co*=random.uniform(.82,1.12);v.co.x*=size*.5;v.co.y*=size*.38;v.co.z*=size*.34
 low=min(v.co.z for v in o.data.vertices)
 for v in o.data.vertices:v.co.z-=low
 records['rock-'+str(i)]=export('ground-cover','rock-'+str(i))
(OUT/'models.json').write_text(json.dumps({'units':'metres','up':'glTF +Y','provenance':'Original procedural geometry; official sign artwork preserved.','assets':records,'pending':['Shared PBR trim sheets','Sign wood PBR and true routed carving','Fence alpha texture','Token pickup/shatter animation','80m in-game token readability']},indent=2), encoding="utf-8")
print('P11 models exported:',len(records))
