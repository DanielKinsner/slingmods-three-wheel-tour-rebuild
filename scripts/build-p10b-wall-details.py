"""Editable shallow frame, separate precise lettering and practical strips.
Run with scripts/blender.ps1. Original room remains byte-identical.
"""
import bpy,json,math,hashlib
from pathlib import Path
from mathutils import Vector,Matrix
P=Path(__file__).resolve().parents[1];A=P/'assets/blender/p10b';O=P/'public/assets/p10b';E=P/'director-kit/production/evidence/P10B/studio'
for d in [A,O,E]:d.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.context.preferences.filepaths.save_version=0
def cv(v):return Vector((v[0],-v[2],v[1]))
def mat(name,rgb,metal=0,rough=.6,emission=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*rgb,1);m.use_nodes=True;q=m.node_tree.nodes['Principled BSDF'];q.inputs['Base Color'].default_value=(*rgb,1);q.inputs['Metallic'].default_value=metal;q.inputs['Roughness'].default_value=rough
 if emission:q.inputs['Emission Color'].default_value=(*rgb,1);q.inputs['Emission Strength'].default_value=emission
 return m
frame=mat('matte graphite aluminum surround',(.025,.032,.039),.35,.58);letter=mat('satin warm silver individual lettering',(.72,.73,.70),.3,.35);wash=mat('warm concealed LED diffuser',(.85,.67,.42),0,.7,1.8)
def box(name,center,size,m):
 bpy.ops.mesh.primitive_cube_add(size=1,location=cv(center));o=bpy.context.object;o.name=name;o.dimensions=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m);be=o.modifiers.new('subtle edge bevel','BEVEL');be.width=.005;be.segments=2;return o
for y in [.61,3.59]:box('tour_wall_metal_horizontal_surround',(-5.83,y,1.2),(.07,.075,8.85),frame)
for z in [-3.225,5.625]:box('tour_wall_metal_vertical_surround',(-5.83,2.1,z),(.07,2.98,.075),frame)
box('tour_wall_base_trim',(-5.84,.45,1.2),(.1,.16,8.85),frame)
box('tour_wall_top_warm_diffuser',(-5.805,3.64,1.2),(.028,.028,8.4),wash)
box('tour_wall_soft_base_edge',(-5.80,.57,1.2),(.028,.018,8.4),wash)
font=bpy.data.fonts.load(str(P/'assets/fonts/barlow-condensed/BarlowCondensed-ExtraBold.ttf'))
rotation=Matrix(((0,0,1),(1,0,0),(0,1,0))).to_euler()
def text(name,body,y,z,width,depth):
 cu=bpy.data.curves.new(name,'FONT');cu.body=body;cu.font=font;cu.align_x='CENTER';cu.size=1;cu.extrude=depth;cu.bevel_depth=.0008;cu.bevel_resolution=1;cu.resolution_u=4
 o=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(o);o.location=cv((-5.795,y,z));o.rotation_euler=rotation;cu.materials.append(letter);bpy.context.view_layer.update();factor=width/max(max(v[0] for v in o.bound_box)-min(v[0] for v in o.bound_box),.01);o.scale=(factor,factor,1);return o
text('BUILT TO BE YOURS.','BUILT TO BE YOURS.',2.30,1.2,5.0,.012)
text('Coast to ridge. Build to drive.','Coast to ridge. Build to drive.',2.06,1.2,2.7,.003)
# The separate vector source maintains exact lettering independently of plate pixels.
(A/'tour-wall-lettering.svg').write_text('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8700 2900"><style>text{font-family:Barlow Condensed;font-weight:800;fill:#d9dad5;text-anchor:middle}</style><text x="4350" y="770" font-size="490">BUILT TO BE YOURS.</text><text x="4350" y="1010" font-size="160">Coast to ridge. Build to drive.</text></svg>''',encoding='utf8')
details=list(bpy.context.scene.objects)
# Packed full artwork scene is independently editable; runtime loads plate separately.
plateMaterial=mat('non-emissive matte printed landscape',(1,1,1),0,.93)
plateImage=bpy.data.images.load(str(A/'tour-wall-generated-master.png'));plateImage.pack();tex=plateMaterial.node_tree.nodes.new('ShaderNodeTexImage');tex.image=plateImage;plateMaterial.node_tree.links.new(tex.outputs['Color'],plateMaterial.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
bpy.ops.mesh.primitive_plane_add(size=2,location=cv((-5.855,2.1,1.2)));plate=bpy.context.object;plate.name='matte_coast_to_ridge_print';plate.rotation_euler=rotation;plate.scale=(4.35,1.45,1);plate.data.materials.append(plateMaterial)
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(A/'tour-wall-details.blend'))
bpy.ops.object.select_all(action='DESELECT')
for o in details:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(O/'tour-wall-details.glb'),export_format='GLB',export_yup=True,export_apply=True,export_extras=True,use_selection=True)
report={'chosen':{'sourceMesh':'studio_left_wall','gameBounds':{'min':[-6.09,0,-4],'max':[-5.91,4.2,7]},'normal':[1,0,0],'innerFaceX':-5.91,'panelCenter':[-5.855,2.1,1.2],'panelSize':[8.7,2.9],'offsetMetres':.055},'alternate':{'meshes':['left_bay_wall_pier','left_bay_wall_pier.001'],'sideX':5.91,'unbrokenRearWidth':4.8,'reasonRejected':'Moving aperture divides opposite side; lift overlaps rear pier. It cannot support an 8.7m panorama without door/lift obstruction.'},'cabinetWall':{'mesh':'studio_back_wall','zRange':[6.96,7.14],'preserved':True},'departure':{'openingZ':[-1.4,2.2],'curtainX':5.965,'untouched':True},'lettering':{'exactMain':'BUILT TO BE YOURS.','exactSecondary':'Coast to ridge. Build to drive.','separateMesh':True,'mainExtrusionMetres':.012,'font':'Barlow Condensed ExtraBold / SIL OFL 1.1'},'dimensionsCaveat':'Measured from inferred game geometry, not measured physical set','art':'Original generated flat landscape, separately editable letter/frame asset; W01 reference not mapped'}
(E/'WALL-PLACEMENT.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print(json.dumps(report))
