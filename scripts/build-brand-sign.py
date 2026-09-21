"""Background Blender: shared SlingMods logo plane from the owner's high-resolution wordmark.

Supersedes the sign half of p07a_brand_build.py (that script still owns showcase-bay-exact.blend). Same unit-width plane,
material and placements; only the artwork and its aspect change. Run scripts/build-brand-logo-wide.py first.
"""
from pathlib import Path
import bpy,json,hashlib
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/assets/brand';SRC=ROOT/'assets/blender/showcase-quality'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
layout=json.loads((OUT/'sign-layout.json').read_text());art=OUT/'slingmods-logo-wide.png'
bpy.ops.wm.read_factory_settings(use_empty=True)
image=bpy.data.images.load(str(art));image.pack();ratio=image.size[1]/image.size[0]
material=bpy.data.materials.new('Official_SlingMods_Artwork');material.use_nodes=True
bsdf=material.node_tree.nodes.get('Principled BSDF');tex=material.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image
material.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color']);material.node_tree.links.new(tex.outputs['Alpha'],bsdf.inputs['Alpha'])
bsdf.inputs['Roughness'].default_value=.72;bsdf.inputs['Metallic'].default_value=0
material.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Emission Color']);bsdf.inputs['Emission Strength'].default_value=.18
material.surface_render_method='DITHERED';material.use_backface_culling=True
mesh=bpy.data.meshes.new('Artwork_Aspect_Exact');mesh.from_pydata([(-.5,0,-ratio/2),(.5,0,-ratio/2),(.5,0,ratio/2),(-.5,0,ratio/2)],[],[(0,1,2,3)]);mesh.materials.append(material)
uv=mesh.uv_layers.new(name='ArtworkUV')
for loop,coord in zip(uv.data,[(0,0),(1,0),(1,1),(0,1)]):loop.uv=coord
template=bpy.data.objects.new('Official_SlingMods_Logo',mesh);bpy.context.collection.objects.link(template);template['artworkSHA256']=sha(art)
bpy.context.view_layer.objects.active=template;template.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'slingmods-sign.glb'),export_format='GLB',use_selection=True,export_yup=True,export_materials='EXPORT',export_extras=True)
# Harbor start gantry header is .75 m tall: artwork height leaves 12% of the face clear above and below.
for p in layout['placements']:
 if p['id']=='start-finish':p['width']=round(.75*(1-2*.12)/ratio,3)
 obj=template.copy();obj.data=mesh;bpy.context.collection.objects.link(obj);obj.name=p['id'];x,y,z=p['position'];obj.location=(x,-z,y);obj.rotation_euler.z=p['yaw'];obj.scale=(p['width'],)*3;obj['runtimeScene']=p['scene']
template.hide_viewport=True;template.hide_render=True
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'showcase-branding.blend'))
layout.update({'aspectRatio':image.size[0]/image.size[1],'sourceImageSHA256':sha(art),'sourceImage':'public/assets/brand/slingmods-logo-wide.png','generator':'scripts/build-brand-sign.py'})
(OUT/'sign-layout.json').write_text(json.dumps(layout,indent=2),encoding='utf-8');print('Brand sign rebuilt, aspect',layout['aspectRatio'])
