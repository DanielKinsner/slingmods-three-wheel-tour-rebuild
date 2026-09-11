"""Actual Blender diagnostic images; never substituted for runtime evidence."""
import bpy,pathlib,math,sys
from mathutils import Vector
P=pathlib.Path(__file__).resolve().parents[1]
lab='--lab' in sys.argv
bpy.ops.wm.open_mainfile(filepath=str(P/('assets/blender/vehicles/slingshot-p03a-material-lab.blend' if lab else 'assets/blender/vehicles/slingshot-p03a.blend')))
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=24;s.cycles.use_denoising=True
s.render.resolution_x=1400;s.render.resolution_y=900;s.render.resolution_percentage=100
s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.23,.25,.29,1);s.world.node_tree.nodes['Background'].inputs[1].default_value=.4
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.007));ground=bpy.context.object
m=bpy.data.materials.new('P03A diagnostic floor');m.diffuse_color=(.16,.18,.21,1);ground.data.materials.append(m)
for loc,power,size in [((3,4,7),1300,5),((-4,1,4),950,4),((0,-4,5),1300,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,.5))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();c=bpy.context.object;s.camera=c;c.data.type='ORTHO'
for name,loc,scale,target in [('threequarter',(4.5,6,3.0),4.9,(0,.18,.55)),('front',(0,7,1.18),2.65,(0,.2,.58)),('side',(7,0,1.25),4.5,(0,.15,.62)),('rearquarter',(3.9,-5.8,2.6),4.1,(0,-.12,.60)),('cockpit',(-1.4,-2.3,2.4),2.3,(-.15,.05,.7))]:
 c.location=loc;c.data.ortho_scale=scale;c.rotation_euler=(Vector(target)-c.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(P/f'director-kit/production/evidence/P03A/artist/blender-{"material-" if lab else ""}{name}.png');bpy.ops.render.render(write_still=True)
