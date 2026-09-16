"""Editable exact road/support scene from authoritative runtime export, Blender 4.5."""
import bpy,json
from pathlib import Path
root=Path(__file__).resolve().parents[1];out=root/'assets/blender/ridge';data=json.loads((out/'ridge-authoritative-surfaces.json').read_text(encoding='utf-8'))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for name,color in [('road',(.10,.11,.105,1)),('shoulder',(.40,.37,.29,1)),('terrain',(.27,.32,.18,1))]:
 m=bpy.data.materials.new(name);m.diffuse_color=color;m.use_nodes=True;m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=color
def surface(name,d,material):
 v=d['vertices'];verts=[(v[i],-v[i+2],v[i+1])for i in range(0,len(v),3)];f=d['indices'];faces=[f[i:i+3]for i in range(0,len(f),3)];mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.data.materials.append(bpy.data.materials[material]);o['source']='src/ridge/route.ts';o['support']='Exact runtime render/collider topology';uv=mesh.uv_layers.new(name='UVMap')
 for face in mesh.polygons:
  for loop in face.loop_indices:
   k=mesh.loops[loop].vertex_index;uv.data[loop].uv=(d['uv'][2*k],d['uv'][2*k+1])
for name,d in data['surfaces'].items():
 if name=='terrain':
  for i,x in enumerate(d):surface('physical_bank_'+str(i),x,'terrain')
 else:surface(name,d,'road'if name=='road'else'shoulder')
land=json.loads((root/'public/assets/ridge/ridge-land.json').read_text(encoding='utf-8'));surface('Scenic_land_no_collision',land,'terrain')
for b in data['route']['colliders']:
 x,y,z=b['center'];bpy.ops.mesh.primitive_cube_add(size=1,location=(x,-z,y));o=bpy.context.object;o.name=b['id'];o.dimensions=b['size'][0],b['size'][2],b['size'][1];o.rotation_euler.z=b.get('yaw',0);o.rotation_euler.x=b.get('pitch',0);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
bpy.context.scene['authoritative_source']='src/ridge/route.ts; exported by scripts/export-p10a-terrain.ts'
bpy.context.scene['route_length_m']=data['design']['lengthMetres'];bpy.context.scene['height_range_m']=84
bpy.ops.wm.save_as_mainfile(filepath=str(out/'ridge-road-terrain.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'ridge-road-terrain.glb'),export_format='GLB',export_apply=True,export_yup=True)
