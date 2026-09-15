"""Separate authored product; never saves or exports over the accepted vehicle source.
Front carrier objects are copied from the accepted .blend excluding only the two stock
damper/spring pairs because the accepted GLB merges those parts with the wishbones.
"""
import bpy,math,json,hashlib
from mathutils import Vector
from pathlib import Path
root=Path(__file__).resolve().parents[1]
source=root/'assets/blender/vehicles/slingshot-p04a1.blend'
before=hashlib.sha256(source.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(source))
keep=[]
for side in ['left','right']:
 parent=bpy.data.objects['suspension_front_'+side]
 for o in parent.children:
  if o.name not in ['front_damper_'+side,'front_spring_'+side]:keep.append(o)
# Preserve exact authored matrices, meshes and materials of remaining carriers.
for o in keep:
 matrix=o.matrix_world.copy();o.parent=None;o.matrix_world=matrix
for o in list(bpy.data.objects):
 if o not in keep:bpy.data.objects.remove(o,do_unlink=True)
for side in ['left','right']:
 group=bpy.data.objects.new('carrier_front_'+side,None);bpy.context.collection.objects.link(group)
 for o in keep:
  if side in o.name:o.parent=group
def material(name,color,metal,rough):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
silver=material('DDM_silver_anodized',(.57,.60,.63),.8,.3)
spring=material('DDM_silver_spring',(.66,.68,.69),.65,.34)
black=material('DDM_black_adjusters',(.025,.03,.035),.3,.4)
chrome=material('DDM_piston',(.75,.77,.78),.96,.19)
groups={}
for key in ['lower','upper','spring']:
 o=bpy.data.objects.new('ddm_'+key,None);bpy.context.collection.objects.link(o);groups[key]=o
def cylinder(name,r,depth,z,mat,group,xy=(0,0)):
 bpy.ops.mesh.primitive_cylinder_add(vertices=20,radius=r,depth=depth,location=(*xy,z));o=bpy.context.object;o.name=name;o.data.materials.append(mat);o.parent=groups[group]
 for p in o.data.polygons:p.use_smooth=True
 return o
def ring(name,r,t,z,mat,group):
 bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=t,major_segments=24,minor_segments=6,location=(0,0,z));o=bpy.context.object;o.name=name;o.data.materials.append(mat);o.parent=groups[group]
 for p in o.data.polygons:p.use_smooth=True
 return o
cylinder('threaded_twin_tube_body',.024,.26,.16,silver,'lower')
for i in range(15):ring('body_thread_%02d'%i,.024,.0014,.065+i*.009,silver,'lower')
for z in [.069,.081]:cylinder('preload_lock_collar',.040,.009,z,silver,'lower')
cylinder('lower_eye',.024,.023,.0,silver,'lower').rotation_euler.x=math.pi/2
cylinder('lower_bushing',.011,.026,.0,black,'lower').rotation_euler.x=math.pi/2
for x in [-.028,.028]:cylinder('compression_knob' if x<0 else 'rebound_knob',.009,.013,.044,black,'lower',(x,0))
cylinder('piston_shaft',.009,.22,.33,chrome,'upper')
cylinder('upper_eye',.023,.023,.45,silver,'upper').rotation_euler.x=math.pi/2
cylinder('upper_bushing',.011,.026,.45,black,'upper').rotation_euler.x=math.pi/2
cylinder('upper_spring_seat',.039,.008,.382,silver,'upper')
curve=bpy.data.curves.new('silver_coil','CURVE');curve.dimensions='3D';curve.bevel_depth=.005;curve.bevel_resolution=2
s=curve.splines.new('POLY');n=168;s.points.add(n)
for i,p in enumerate(s.points):
 t=i/n;p.co=(.034*math.cos(t*math.tau*7),.034*math.sin(t*math.tau*7),.0855+t*.2925,1)
o=bpy.data.objects.new('silver_coil',curve);bpy.context.collection.objects.link(o);o.data.materials.append(spring);o.parent=groups['spring']
# Join within semantic group and material to keep runtime draw cost bounded.
for parent in [o for o in bpy.data.objects if o.type=='EMPTY']:
 bymat={}
 for o in list(parent.children):
  if o.type not in ['MESH','CURVE']:continue
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
  bpy.ops.object.convert(target='MESH');bymat.setdefault(o.data.materials[0].name,[]).append(o)
 for name,objects in bymat.items():
  bpy.ops.object.select_all(action='DESELECT')
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();bpy.context.object.name=parent.name+'__'+name
asset=root/'assets/blender/products/ddmworks-sm3223-silver.blend';asset.parent.mkdir(exist_ok=True,parents=True)
bpy.data.orphans_purge(do_recursive=True);bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(asset))
out=root/'public/assets/products/ddmworks-sm3223-silver.glb'
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',export_yup=True,export_cameras=False,export_lights=False)
assert hashlib.sha256(source.read_bytes()).hexdigest()==before
receipt={'source':str(source.relative_to(root)),'sourceSha256':before,'originalUnchanged':True,'asset':str(asset.relative_to(root)),'runtime':str(out.relative_to(root)),'runtimeBytes':out.stat().st_size,'runtimeSha256':hashlib.sha256(out.read_bytes()).hexdigest(),'carrierPreservation':'Same authored front objects/matrices/materials, excluding front_damper_left/right and front_spring_left/right only. Separate derived export, accepted vehicle GLB untouched.','modelLimits':'Original authored approximation, silver standard option. Generic twin-tube/coil/adjuster construction, not CAD. Dimensions fit accepted mount endpoints. Rear accepted linkage approximation retained.'}
(root/'director-kit/production/evidence/P08A/hardware-build.json').write_text(json.dumps(receipt,indent=2))
print(json.dumps(receipt))
