import bpy, math, pathlib
from mathutils import Vector

def studio(out, prefix, clay=False, views=None):
 out=pathlib.Path(out);out.mkdir(parents=True,exist_ok=True)
 sc=bpy.context.scene
 sc.render.engine='CYCLES';sc.cycles.samples=24;sc.cycles.use_denoising=True
 sc.render.resolution_x=1100;sc.render.resolution_y=850;sc.render.resolution_percentage=100
 sc.world=bpy.data.worlds.new('Review world');sc.world.use_nodes=True;sc.world.node_tree.nodes['Background'].inputs[0].default_value=(.17,.19,.22,1);sc.world.node_tree.nodes['Background'].inputs[1].default_value=.45
 sc.view_settings.view_transform='AgX'
 stage=[]
 def area(name,pos,power,size):
  d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;o=bpy.data.objects.new(name,d);sc.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,0,.5))-o.location).to_track_quat('-Z','Y').to_euler();stage.append(o)
 area('Key',(3,1,4),550,4);area('Fill',(-3,0,2),330,3);area('Rim',(0,-3,3),650,2)
 bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.007));floor=bpy.context.object;stage.append(floor)
 m=bpy.data.materials.new('Review floor');m.diffuse_color=(.16,.18,.2,1);floor.data.materials.append(m)
 d=bpy.data.cameras.new('Review camera');cam=bpy.data.objects.new('Review camera',d);sc.collection.objects.link(cam);sc.camera=cam;stage.append(cam);d.type='ORTHO';d.lens=50
 if clay:
  mat=bpy.data.materials.new('Neutral clay');mat.diffuse_color=(.42,.42,.42,1);sc.view_layers[0].material_override=mat
 specs={'front-quarter':((3.2,4.2,2.3),(0,0,.5),3.1),'left':((-4,0,1.2),(0,0,.53),2.9),'right':((4,0,1.2),(0,0,.53),2.9),'rear':((-2.8,-4,2),(0,0,.5),3.1),'cockpit':((.9,-.7,1.9),(0,.2,.86),1.45),'panel':((1.7,1.3,1.5),(0,.35,.57),1.45),'wheel':((1.8,1.8,.85),(.53,.85,.31),1.05)}
 for name,(pos,target,size) in specs.items():
  if views and name not in views:continue
  cam.location=pos;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();d.ortho_scale=size;sc.render.filepath=str(out/f'{prefix}-{name}.png');bpy.ops.render.render(write_still=True)
 sc.view_layers[0].material_override=None
 for o in stage:bpy.data.objects.remove(o,do_unlink=True)
