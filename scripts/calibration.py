import bpy, math, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene; scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
def mat(name,color,rough=.5,metal=0,coat=0,emission=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;p.inputs['Coat Weight'].default_value=coat;p.inputs['Coat Roughness'].default_value=.12
 if emission:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
 return m
paint=mat('clearcoat_red',(.38,.025,.035),.25,.35,1);rubber=mat('rubber',(.022,.026,.031),.87);em=mat('emissive_patch',(.85,.5,.12),.3,emission=3);metal=mat('brushed_alloy',(.4,.46,.49),.29,.9);floor=mat('neutral_floor',(.35,.39,.41),.76)
def cube(name,loc,scale,material,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material)
 if bevel:mod=o.modifiers.new('Edge radii','BEVEL');mod.width=bevel;mod.segments=4;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o
cube('calibration_floor',(0,0,-.07),(14,14,.14),floor)
cube('metre_cube',(-1.65,0,.5),(1,1,1),paint,.09)
cube('rubber_patch',(0,0,.1),(1,1,.2),rubber,.03)
cube('emissive_patch',(1.5,0,.1),(1,1,.2),em,.03)
for name,pos,color in [('axis_x',(1,2,.05),(1,.05,.05)),('axis_y',(0,3,.05),(.05,.6,.1)),('axis_z',(0,2,1.05),(.03,.1,1))]:
 cube(name,pos,(.13,.13,.13),mat(name+'_color',color))
cube('axis_origin',(0,2,.05),(.08,.08,.08),metal)
pivot=bpy.data.objects.new('wheel_spin',None);scene.collection.objects.link(pivot);pivot.location=(0,-1.6,.42)
bpy.ops.mesh.primitive_torus_add(major_radius=.31,minor_radius=.10,major_segments=48,minor_segments=12,rotation=(0,math.pi/2,0));t=bpy.context.object;t.name='calibration_tire';t.data.materials.append(rubber);t.parent=pivot
for a in range(6):
 angle=a*math.pi/3;o=cube('spoke_'+str(a),(0,math.sin(angle)*.14,math.cos(angle)*.14),(.1,.055,.3),metal,.015);o.rotation_euler.x=-angle;o.parent=pivot
pivot.rotation_mode='XYZ';pivot.rotation_euler.x=0;pivot.keyframe_insert(data_path='rotation_euler',frame=1);pivot.rotation_euler.x=math.pi*2;pivot.keyframe_insert(data_path='rotation_euler',frame=121)
if pivot.animation_data and pivot.animation_data.action:
 for fc in pivot.animation_data.action.fcurves:
  for key in fc.keyframe_points:key.interpolation='LINEAR'
scene.frame_start=1;scene.frame_end=121;scene.render.fps=60;scene.frame_set(1)
out=ROOT/'public/assets/calibration.glb';blend=ROOT/'assets/blender/calibration.blend'
bpy.ops.wm.save_as_mainfile(filepath=str(blend));bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',export_yup=True,export_animations=True,export_apply=True)
(ROOT/'director-kit/production/evidence/G0/blender-manifest.json').write_text(json.dumps({'blender_version':bpy.app.version_string,'basis':'Blender (x,y,z) to glTF (x,z,-y)','units':'metres','source':str(blend),'export':str(out),'nodes':[o.name for o in scene.objects]},indent=2))
print('CALIBRATION_EXPORT_COMPLETE',out)
