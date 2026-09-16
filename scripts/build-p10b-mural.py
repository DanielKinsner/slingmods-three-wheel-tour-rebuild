"""Original text-free coast-to-ridge landscape print; no external photographs.
Background Blender. Deterministic editable terrain, trees, ocean and road.
The supplied W01 is a composition reference only and is never sampled.
"""
import bpy,math,random,json,hashlib
from pathlib import Path
from mathutils import Vector,noise
P=Path(__file__).resolve().parents[1];A=P/'assets/blender/p10b';O=P/'public/assets/p10b'
A.mkdir(parents=True,exist_ok=True);O.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.context.preferences.filepaths.save_version=0
random.seed(1021)
def mat(name,color,rough=.8):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;q=m.node_tree.nodes.get('Principled BSDF');q.inputs['Base Color'].default_value=(*color,1);q.inputs['Roughness'].default_value=rough;return m
rock=mat('original charcoal rock',(.16,.174,.181));forest=mat('original graphite forest',(.05,.06,.063));road=mat('quiet steel road',(.27,.29,.30));ocean=mat('brushed silver sea',(.26,.285,.30),.34)
q=rock.node_tree.nodes.get('Principled BSDF');n=rock.node_tree.nodes.new('ShaderNodeTexNoise');n.inputs['Scale'].default_value=4.7;n.inputs['Detail'].default_value=5;b=rock.node_tree.nodes.new('ShaderNodeBump');b.inputs['Strength'].default_value=.55;b.inputs['Distance'].default_value=.4;rock.node_tree.links.new(n.outputs['Fac'],b.inputs['Height']);rock.node_tree.links.new(b.outputs['Normal'],q.inputs['Normal'])
def coast(y):return -10+6*math.sin(y*.055)+2*math.sin(y*.16)
def height(x,y):
 edge=x-coast(y);land=max(0,min(1,edge/8));base=2.6+16*(.5+.5*math.sin(x*.08+y*.06))
 return max(-.45,land*(base+20*noise.fractal(Vector((x*.046,y*.046,3)),1.05,2.0,5)+max(0,y*.22))-.45)
N=300;M=220;verts=[]
for j in range(M+1):
 y=-30+j*150/M
 for i in range(N+1):
  x=-60+i*165/N;verts.append((x,y,height(x,y)))
faces=[]
for j in range(M):
 for i in range(N):
  a=j*(N+1)+i;faces.append((a,a+1,a+N+2,a+N+1))
me=bpy.data.meshes.new('original multi-octave ridge');me.from_pydata(verts,[],faces);me.update();ob=bpy.data.objects.new('coast_to_ridge_original_terrain',me);bpy.context.collection.objects.link(ob);me.materials.append(rock)
for p in me.polygons:p.use_smooth=True
bpy.ops.mesh.primitive_plane_add(size=800,location=(0,0,-.12));bpy.context.object.name='open_coast_water';bpy.context.object.data.materials.append(ocean)
q=ocean.node_tree.nodes.get('Principled BSDF');n=ocean.node_tree.nodes.new('ShaderNodeTexNoise');n.inputs['Scale'].default_value=1.3;n.inputs['Roughness'].default_value=.55;b=ocean.node_tree.nodes.new('ShaderNodeBump');b.inputs['Strength'].default_value=.18;b.inputs['Distance'].default_value=.12;ocean.node_tree.links.new(n.outputs['Fac'],b.inputs['Height']);ocean.node_tree.links.new(b.outputs['Normal'],q.inputs['Normal'])
# Shared layered conifer mesh, irregular silhouette; actual editable linked instances.
vs=[];fs=[]
for layer in range(6):
 z=layer*.37;r=(1-layer/7)*.67;start=len(vs)
 for k in range(9):
  a=k*math.tau/9;vs.append((math.cos(a)*r,math.sin(a)*r,z))
 vs.append((0,0,z+.92))
 for k in range(9):fs.append((start+k,start+(k+1)%9,start+9))
tm=bpy.data.meshes.new('layered silhouette conifer');tm.from_pydata(vs,[],fs);tm.materials.append(forest)
for i in range(2000):
 x=random.uniform(-10,92);y=random.uniform(-16,115)
 if x<coast(y)+5:continue
 tree=bpy.data.objects.new('ridge_conifer_%04d'%i,tm);bpy.context.collection.objects.link(tree);tree.location=(x,y,height(x,y));s=random.uniform(.5,1.45);tree.scale=(s,s,s);tree.rotation_euler.z=random.random()*math.tau
# A deliberately composed route is an original illustration, not game navigation.
route=[]
for i in range(400):
 t=i/399;y=-24+t*125;x=coast(y)+4+max(0,t-.28)*23+4*math.sin(t*math.pi*5)*t;route.append((x,y,height(x,y)+.20))
def curve(name,pts,r,material):
 cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.bevel_depth=r;cu.bevel_resolution=2;s=cu.splines.new('POLY');s.points.add(len(pts)-1)
 for p,v in zip(s.points,pts):p.co=(*v,1)
 o=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(o);cu.materials.append(material);return o
curve('original winding coast-to-ridge road',route,.32,road)
# The road motif is separately editable and exported as normalized vector points.
red=mat('single restrained red route',(.5,.012,.016),.6);curve('red route independent curve',[(x,y,z+.31)for x,y,z in route],.037,red)
(A/'route-source.json').write_text(json.dumps({'purpose':'Original conceptual coast-to-ridge illustration; not a navigable map','points':route},indent=2),encoding='utf8')
world=bpy.data.worlds.new('silver haze');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.46,.49,.50,1);world.node_tree.nodes['Background'].inputs[1].default_value=.65;bpy.context.scene.world=world
bpy.ops.object.light_add(type='SUN',location=(-40,-25,60));sun=bpy.context.object;sun.rotation_euler=(.52,-.6,-.7);sun.data.energy=2.3;sun.data.angle=.18
bpy.ops.object.camera_add(location=(-48,-84,27));cam=bpy.context.object;cam.rotation_euler=(Vector((25,42,13))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='PERSP';cam.data.lens=39;cam.data.clip_end=1000;bpy.context.scene.camera=cam
sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.samples=24;sc.cycles.use_denoising=True;sc.render.resolution_x=6144;sc.render.resolution_y=2048;sc.render.resolution_percentage=100;sc.view_settings.view_transform='AgX';sc.render.image_settings.file_format='PNG';sc.render.filepath=str(A/'tour-wall-master.png');sc.render.film_transparent=False
sc.use_nodes=True;nodes=sc.node_tree.nodes;links=sc.node_tree.links;rl=nodes.get('Render Layers');comp=nodes.get('Composite');sc.view_layers[0].use_pass_mist=True;world.mist_settings.start=105;world.mist_settings.depth=180;world.mist_settings.falloff='LINEAR';mix=nodes.new('CompositorNodeMixRGB');mix.blend_type='MIX';mix.inputs[2].default_value=(.30,.335,.355,1);links.new(rl.outputs['Mist'],mix.inputs[0]);links.new(rl.outputs['Image'],mix.inputs[1]);links.new(mix.outputs[0],comp.inputs[0])
bpy.ops.wm.save_as_mainfile(filepath=str(A/'tour-wall-landscape.blend'));bpy.ops.render.render(write_still=True)
im=bpy.data.images.load(str(A/'tour-wall-master.png'));im.scale(3072,1024);im.filepath_raw=str(A/'procedural-attempt-runtime.png');im.save()
print('P10B original artwork render complete')
