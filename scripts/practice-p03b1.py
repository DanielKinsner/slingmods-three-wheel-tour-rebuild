"""Small non-colliding practice marker kit; shared pad assets and physics are untouched."""
from pathlib import Path
import bpy,json,math
R=Path(__file__).resolve().parents[1];bpy.ops.wm.read_factory_settings(use_empty=True)
def mat(name,c):
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True;m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*c,1);m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.78;return m
orange=mat('Practice_cone_orange',(.82,.13,.018));white=mat('Practice_marking_cream',(.8,.82,.74));black=mat('Practice_cone_rubber',(.04,.045,.043))
def box(name,x,z,y,sx,sy,sz,m):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(x,-z,y));o=bpy.context.object;o.name=name;o.dimensions=(sx,sz,sy);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
def cone(x,z,i):
 box(f'Cone{i:02}_base',x,z,.028,.48,.056,.48,black)
 for name,r1,r2,depth,height,m in [('body',.20,.037,.48,.30,orange),('band',.123,.100,.064,.365,white)]:
  bpy.ops.mesh.primitive_cone_add(vertices=20,radius1=r1,radius2=r2,depth=depth,location=(x,-z,height));o=bpy.context.object;o.name=f'Cone{i:02}_{name}';o.data.materials.append(m)
centers=[(0,87),(0,72),(-4,59),(-2,43),(-3,29),(-4,17),(-1,5)]
points=[(x+d,z) for x,z in centers for d in [-3,3]]+[(x,z) for x in [-2.4,3.6] for z in [-4,6]]
for i,(x,z) in enumerate(points):cone(x,z,i)
for z in [86,72]:box('Launch_crossline',0,z,.011,5.8,.012,.12,white)
for x in [-2.4,3.6]:box('Stop_box_side',x,1,.013,.12,.012,10,white)
for z in [-4,6]:box('Stop_box_end',.6,z,.013,6,.012,.12,white)
for label,x,z in [('LAUNCH',0,90),('SLALOM',-1,68),('SWEEP',-3,24),('STOP',.6,3)]:
 bpy.ops.object.text_add(location=(x,-z,.018));o=bpy.context.object;o.name='Practice_label_'+label;o.data.body=label;o.data.align_x='CENTER';o.data.size=.65;o.data.extrude=0;o.data.materials.append(white);bpy.ops.object.convert(target='MESH')
bpy.context.scene.unit_settings.system='METRIC';bpy.ops.wm.save_as_mainfile(filepath=str(R/'assets/blender/practice-p03b1.blend'))
# Batch by material for runtime; the saved authoring file retains each editable marker.
for material in [orange,white,black]:
 bpy.ops.object.select_all(action='DESELECT');objs=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.data.materials and o.data.materials[0]==material]
 for o in objs:o.select_set(True)
 bpy.context.view_layer.objects.active=objs[0];bpy.ops.object.join()
bpy.ops.export_scene.gltf(filepath=str(R/'public/assets/practice-p03b1.glb'),export_format='GLB',export_yup=True,export_cameras=False,export_lights=False)
(R/'public/assets/practice-p03b1.json').write_text(json.dumps({'start':{'x':0,'z':88,'yaw':0},'cones':points,'coneCount':18,'nonColliding':True,'route':'launch, moderate slalom, broad sweeper, stop box','boundsXZ':[-7,3.6,-4,90],'physicsChanges':False,'tuning':'Route sized from unchanged model at approximately5.5-6m/s; visual guides only, no automatic steering/path constraint'},indent=2),encoding='utf-8')
