"""Purpose-built P03A1 material-inspection bay; authored geometry and exportable texture maps."""
import bpy, math, json
import numpy as np
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets'; MAPS=OUT/'textures/bay-p03a1'; MAPS.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
s=bpy.context.scene;s.unit_settings.system='METRIC';s.unit_settings.scale_length=1

def mat(name,color,rough=.7,metal=0,emission=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 if emission:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
 return m
floor=mat('Bay_microcement',(.34,.35,.34),.73);wall=mat('Bay_charcoal',(.10,.115,.13),.82);edge=mat('Bay_anodized_frame',(.1,.12,.14),.35,.6);light=mat('Bay_broad_fixture',(.9,.92,1),.4,0,4);accent=mat('SlingMods_C91820',(.584,.0091,.0144),.5);letter=mat('Bay_lettering',(.62,.66,.69),.5,.1)
N=512;rng=np.random.default_rng(803);noise=rng.normal(0,1,(N,N)).astype(np.float32)
# Deterministic low-contrast aggregate; no baked light or directional highlights.
for _ in range(3):noise=(noise+np.roll(noise,1,0)+np.roll(noise,-1,0)+np.roll(noise,1,1)+np.roll(noise,-1,1))/5
noise/=max(float(np.std(noise)),.001)

def image(name,rgb,data=False):
 im=bpy.data.images.new(name,width=N,height=N,alpha=True);rgba=np.ones((N,N,4),np.float32);rgba[:,:,:3]=rgb;im.pixels.foreach_set(rgba.ravel());im.filepath_raw=str(MAPS/(name+'.png'));im.file_format='PNG';im.save()
 if data:im.colorspace_settings.name='Non-Color'
 return im
base=np.clip(.42+noise*.008,0,1);baseim=image('microcement_base',np.stack([base*.98,base,base*.99],axis=-1))
rough=np.clip(.73+noise*.028,.6,.84);roughim=image('microcement_roughness',np.stack([rough]*3,axis=-1),True)
x=(np.roll(noise,-1,1)-np.roll(noise,1,1))*.008;y=(np.roll(noise,-1,0)-np.roll(noise,1,0))*.008
normal=np.stack([x+.5,y+.5,np.ones_like(x)],axis=-1);normalim=image('microcement_normal',normal,True)
p=floor.node_tree.nodes.get('Principled BSDF')
for im,socket in [(baseim,'Base Color'),(roughim,'Roughness'),(normalim,'Normal')]:
 tex=floor.node_tree.nodes.new('ShaderNodeTexImage');tex.image=im
 if socket=='Normal':norm=floor.node_tree.nodes.new('ShaderNodeNormalMap');norm.inputs['Strength'].default_value=.38;floor.node_tree.links.new(tex.outputs['Color'],norm.inputs['Color']);floor.node_tree.links.new(norm.outputs['Normal'],p.inputs[socket])
 else:floor.node_tree.links.new(tex.outputs['Color'],p.inputs[socket])

def box(name,loc,size,m,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:
  mod=o.modifiers.new('manufactured_edge','BEVEL');mod.width=bevel;mod.segments=3
  mod=o.modifiers.new('weighted_normals','WEIGHTED_NORMAL')
 return o
floorob=box('inspection_floor',(0,0,-.07),(14,15,.14),floor)
# XY projected UVs: one tile spans 0.6 m, so aggregate reads as material rather than large spots.
uv=floorob.data.uv_layers.active
for poly in floorob.data.polygons:
 for li in poly.loop_indices:
  co=floorob.data.vertices[floorob.data.loops[li].vertex_index].co;uv.data[li].uv=(co.x/.6,co.y/.6)
box('rear_wall',(0,-6.8,2.25),(14,.18,4.5),wall,.025)
box('wall_shadow_gap',(0,-6.67,.14),(14,.05,.06),edge,.007)
for x in [-5.4,-2.7,2.7,5.4]:box('wall_panel_joint',(x,-6.697,2.25),(.008,.01,4.35),edge)
box('restrained_red_accent',(-5.8,-6.685,1.85),(.045,.022,1.5),accent,.003)
for x in [-2.5,2.8]:
 box('overhead_frame',(x,0,3.9),(1.3,5.2,.095),edge,.025)
 box('overhead_diffuser',(x,0,3.845),(1.14,5.02,.025),light,.035)
# Text is actual Blender mesh, not a composited image or web overlay.
for name,text,size,loc,m in [('brand','SLINGMODS',.33,(-2.0,-6.68,2.55),letter),('bay_name','MATERIAL  /  INSPECTION',.095,(-2.0,-6.678,2.26),letter)]:
 c=bpy.data.curves.new(name,'FONT');c.body=text;c.size=size;c.extrude=.0015;c.bevel_depth=.0004;o=bpy.data.objects.new(name,c);s.collection.objects.link(o);o.location=loc;o.rotation_euler=(math.pi/2,0,math.pi);o.data.materials.append(m);bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
s['purpose']='P03A1 compact material inspection bay, not final interactive garage';s['maps']='Authored deterministic microcement maps, 512px, 0.6m repeat; tangent +Y normals'
path=ROOT/'assets/blender/inspection-bay-p03a1.blend';bpy.ops.wm.save_as_mainfile(filepath=str(path));bpy.ops.export_scene.gltf(filepath=str(OUT/'inspection-bay-p03a1.glb'),export_format='GLB',export_apply=True,export_extras=True)
print('BAY_EXPORT_COMPLETE',path)
