"""Source-only Blender diagnostic. Browser comparisons are produced by the integrator."""
import bpy,pathlib,math
from mathutils import Vector
P=pathlib.Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(P/'assets/blender/vehicles/slingshot-p03a1.blend'))
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=20;s.cycles.use_denoising=True
s.render.resolution_x=1350;s.render.resolution_y=900;s.render.resolution_percentage=100
s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.25,.25,.25,1);s.world.node_tree.nodes['Background'].inputs[1].default_value=.55
bpy.ops.mesh.primitive_plane_add(size=100,location=(0,0,-.002));g=bpy.context.object
m=bpy.data.materials.new('P03A1 diagnostic floor');m.diffuse_color=(.16,.16,.16,1);g.data.materials.append(m)
for loc,power,size in [((2,4,5),550,4),((-4,1,3),350,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(Vector((0,0,.5))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;s.camera=cam;cam.data.type='PERSP';cam.data.sensor_fit='VERTICAL';cam.data.sensor_height=24
for name,loc,target,fov in [('front',(0,5.4,1.12),(0,.20,.62),30),('threequarter',(-5.2,5.5,2.15),(0,.05,.61),29),('wheel',(-2.3,2.25,1.05),(-.8775,1.3335,.36),34),('cockpit',(-1.4,-1.5,1.80),(-.15,.06,.66),43)]:
 cam.location=loc;cam.data.lens=cam.data.sensor_height/(2*math.tan(math.radians(fov/2)));cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(P/f'director-kit/production/evidence/P03A1/artist/source-{name}.png');bpy.ops.render.render(write_still=True)
