"""Background Blender: editable original-logo sign placements and exact retained bay source."""
from pathlib import Path
import bpy,json,math,hashlib
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/brand';SRC=ROOT/'assets/blender/showcase-quality';E=ROOT/'director-kit/production/evidence/P07A'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
# Preserve the original editable source and retain only the exact bay objects in a NEW file.
bpy.ops.wm.read_factory_settings(use_empty=True)
with bpy.data.libraries.load(str(SRC/'built-waterfront.blend'),link=False) as (available,loaded):
 loaded.objects=[name for name in available.objects if name.startswith('bay_')]
assert loaded.objects,'Exact source bay objects required'
for obj in loaded.objects:bpy.context.scene.collection.objects.link(obj)
bpy.context.scene['source']='Exact bay objects and dependencies from retained P06C built-waterfront.blend. Runtime bay.glb is a byte-preserving GLB dependency extraction, not a new export.'
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'showcase-bay-exact.blend'))
bay_names=[o.name for o in loaded.objects]
bpy.ops.wm.read_factory_settings(use_empty=True)
image=bpy.data.images.load(str(OUT/'slingmods-logo-main.png'));image.pack()
ratio=image.size[1]/image.size[0]
material=bpy.data.materials.new('Official_SlingMods_Artwork');material.use_nodes=True
bsdf=material.node_tree.nodes.get('Principled BSDF');tex=material.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image
material.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color']);material.node_tree.links.new(tex.outputs['Alpha'],bsdf.inputs['Alpha'])
bsdf.inputs['Roughness'].default_value=.72;bsdf.inputs['Metallic'].default_value=0
material.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Emission Color']);bsdf.inputs['Emission Strength'].default_value=.18
material.surface_render_method='DITHERED';material.use_backface_culling=True
mesh=bpy.data.meshes.new('Artwork_Aspect_Exact');mesh.from_pydata([(-.5,0,-ratio/2),(.5,0,-ratio/2),(.5,0,ratio/2),(-.5,0,ratio/2)],[],[(0,1,2,3)]);mesh.materials.append(material)
uv=mesh.uv_layers.new(name='ArtworkUV')
for loop,coord in zip(uv.data,[(0,0),(1,0),(1,1),(0,1)]):loop.uv=coord
template=bpy.data.objects.new('Official_SlingMods_Logo',mesh);bpy.context.collection.objects.link(template)
template['sourceURL']='https://www.slingmods.com/image/catalog/slingmods-logo-main.png';template['originalSHA256']=sha(OUT/'slingmods-logo-main.png')
# Export one shared textured unit plane, retaining exact original source image.
bpy.context.view_layer.objects.active=template;template.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'slingmods-sign.glb'),export_format='GLB',use_selection=True,export_yup=True,export_materials='EXPORT',export_extras=True)
layout=json.loads((ROOT/'public/assets/showcase-quality/scene-layout.json').read_text())
placements=[{'id':'garage-hero','scene':'bay','position':[-.7,1.5,6.525],'yaw':math.pi,'width':3.6}, {'id':'start-finish','scene':'harbor','position':[0,4.6,-21.665],'yaw':0,'width':3.0}]
for station in [594,875]:
 p=next(p for p in layout['instances'] if p.get('station')==station);yaw=p['yaw'];local_z=4.76;local_x=6.0
 placements.append({'id':f'service-{station}','scene':'harbor','position':[p['position'][0]+math.sin(yaw)*local_z+math.cos(yaw)*local_x,3.47,p['position'][2]+math.cos(yaw)*local_z-math.sin(yaw)*local_x],'yaw':yaw,'width':2.4,'station':station})
for p in placements:
 obj=template.copy();obj.data=mesh;bpy.context.collection.objects.link(obj);obj.name=p['id'];x,y,z=p['position'];obj.location=(x,-z,y);obj.rotation_euler.z=p['yaw'];obj.scale=(p['width'],)*3;obj['runtimeScene']=p['scene']
template.hide_viewport=True;template.hide_render=True
bpy.context.scene['scope']='Four original-artwork signs, exact aspect/palette/transparency. No new shadows, collision or lights. Existing approximate bay/gantry lettering suppressed only in presentation.'
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'showcase-branding.blend'))
record={'version':1,'aspectRatio':image.size[0]/image.size[1],'placements':placements,'sourceImageSHA256':sha(OUT/'slingmods-logo-main.png'),'editableSource':'assets/blender/showcase-quality/showcase-branding.blend','runtimeAsset':'public/assets/brand/slingmods-sign.glb','lighting':'Neutral material with restrained .18 logo-color emission; no new light/shadow/collision.'}
(OUT/'sign-layout.json').write_text(json.dumps(record,indent=2))
(E/'brand-source.json').write_text(json.dumps({'layout':record,'baySourceObjects':bay_names,'hashes':{p.relative_to(ROOT).as_posix():sha(p) for p in [SRC/'showcase-bay-exact.blend',SRC/'showcase-branding.blend',OUT/'slingmods-sign.glb',OUT/'sign-layout.json']}},indent=2))
print('P07A exact bay source and four editable logo placements saved')
