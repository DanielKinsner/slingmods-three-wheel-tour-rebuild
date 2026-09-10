import bpy, math, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
def material(name,color,roughness):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=roughness;return m
asphalt=material('dry_test_asphalt',(.135,.15,.16),.89);line=material('warm_white_markings',(.69,.71,.68),.8);red=material('muted_safety_red',(.35,.045,.055),.8);concrete=material('pale_concrete',(.43,.46,.46),.9);gravel=material('low_grip_apron',(.23,.20,.155),.98);grass=material('test_field',(.18,.22,.16),1);wet=material('wet_asphalt',(.085,.095,.10),.27)
def box(name,location,dimensions,mat):
 bpy.ops.mesh.primitive_cube_add(size=1,location=location);o=bpy.context.object;o.name=name;o.dimensions=dimensions;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat);return o
# Newly authored diagnostic pad. Runtime loads this export rather than generating substitute environment meshes.
layout=json.loads((ROOT/'public/assets/pad-layout.json').read_text())
def from_runtime(item,mat):
 c=item['center'];s=item['size'];return box(item.get('id','ground'),(c[0],-c[2],c[1]),(s[0],s[2],max(s[1],.002)),mat)
# Four outer slabs leave the asphalt footprint open; no coplanar overlapping ground.
for x in [-202.5,202.5]:box('outer_field',(x,0,-.15),(295,700,.3),grass)
for y in [-230,230]:box('outer_field',(0,y,-.15),(110,240,.3),grass)
from_runtime(layout['asphalt'],asphalt)
for patch in layout['patches']:from_runtime(patch,wet if patch['id']=='wet' else gravel)
for obstacle in layout['obstacles']:from_runtime(obstacle,red if obstacle['id'] in ['curb','barrier'] else concrete)
for ramp in layout.get('ramps',[]):
 x,_,z=ramp['center'];w=ramp['width']/2;half=ramp['length']/2
 verts=[(x-w,-z-half,-.1),(x+w,-z-half,-.1),(x+w,-z+half,-.1),(x-w,-z+half,-.1),(x-w,-z-half,0),(x+w,-z-half,0),(x+w,-z+half,ramp['rise']),(x-w,-z+half,ramp['rise'])]
 faces=[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
 mesh=bpy.data.meshes.new(ramp['id']);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(ramp['id'],mesh);scene.collection.objects.link(o);o.data.materials.append(concrete)
for x in [-8,8]:box('straight_lane_edge',(x,40,.002),(.12,130,.004),line)
for y in range(-20,101,10):box('ten_metre_marker',(-6,y,.004),(4,.12,.008),line)
for radius in [10,20,30]:
 count=128;verts=[];faces=[]
 for i in range(count):
  a=i*2*math.pi/count
  for r in [radius-.065,radius+.065]:verts.append((r*math.cos(a),-65+r*math.sin(a),.003))
 for i in range(count):j=(i+1)%count;faces.append((2*i,2*j,2*j+1,2*i+1))
 mesh=bpy.data.meshes.new('skid_circle');mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new('skid_circle_'+str(radius),mesh);scene.collection.objects.link(o);o.data.materials.append(line)
for i,y in enumerate(range(10,100,15)):
 bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.45,depth=.016,location=(18 if i%2 else 22,y,.008));bpy.context.object.name='slalom_marker';bpy.context.object.data.materials.append(red)
out=ROOT/'public/assets/test-pad.glb';bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/blender/test-pad.blend'));bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',export_apply=True)
print('TEST_PAD_EXPORT_COMPLETE',out)
