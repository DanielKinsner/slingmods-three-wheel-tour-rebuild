"""Blender diagnostic renders only. Runtime gate captures are separate."""
import bpy, pathlib, math
from mathutils import Vector
P=pathlib.Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(P/'assets/blender/vehicles/slingshot-p01.blend'))
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=24
s.render.resolution_x=1200;s.render.resolution_y=800;s.render.resolution_percentage=100
s.world.color=(.4,.4,.4)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.009)); ground=bpy.context.object
m=bpy.data.materials.new('diagnostic floor');m.diffuse_color=(.28,.30,.32,1);ground.data.materials.append(m)
for loc,power,size in [((3,4,7),1600,5),((-4,1,4),1000,4),((0,-4,5),1400,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,.5))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(4.5,6,3.4));camera=bpy.context.object;s.camera=camera;camera.data.type='ORTHO';camera.data.ortho_scale=5.4
for name,loc,scale,target in [('threequarter',(4.5,6,3.4),5.1,(0,.2,.5)),('rear',(0,-7,1.6),3,(0,-.1,.6)),('side',(7,0,1.5),4.6,(0,.1,.58)),('cockpit',(-1.7,-2.4,2.6),2.5,(-.14,.1,.66))]:
 camera.location=loc;camera.data.ortho_scale=scale;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(P/f'director-kit/production/evidence/G1/blender-diagnostic-{name}.png');bpy.ops.render.render(write_still=True)
