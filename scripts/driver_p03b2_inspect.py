"""Read-only contextual Blender fit views; actual runtime fit remains independent."""
import bpy,pathlib,math
from mathutils import Vector
P=pathlib.Path(__file__).resolve().parents[1];E=P/'director-kit/production/evidence/P03B2/artist';bpy.ops.wm.open_mainfile(filepath=str(P/'assets/blender/vehicles/slingshot-p03a2.blend'))
with bpy.data.libraries.load(str(P/'assets/blender/drivers/test-driver.blend'),link=False)as(src,dst):dst.objects=list(src.objects)
for ob in dst.objects:bpy.context.collection.objects.link(ob)
world=bpy.data.worlds.new('Driver fit world');bpy.context.scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.35,.40,.46,1);world.node_tree.nodes['Background'].inputs[1].default_value=.55
for pos,power,size in [((-3,2,5),700,4),((2,-2,3),500,3)]:
 ld=bpy.data.lights.new('FitSoftbox','AREA');ld.energy=power;ld.shape='DISK';ld.size=size;ob=bpy.data.objects.new('FitSoftbox',ld);bpy.context.collection.objects.link(ob);ob.location=pos;ob.rotation_euler=(Vector((-.36,-.15,.75))-ob.location).to_track_quat('-Z','Y').to_euler()
cam=bpy.data.cameras.new('FitCamera');co=bpy.data.objects.new('FitCamera',cam);bpy.context.collection.objects.link(co);cam.lens=48
sc=bpy.context.scene;sc.camera=co;sc.render.engine='CYCLES';sc.cycles.samples=16;sc.render.resolution_x=960;sc.render.resolution_y=720;sc.render.resolution_percentage=100
for name,pos,target in [('threequarter',(-2.1,2.3,2.0),(-.30,-.02,.79)),('side',(-2.5,-.08,1.1),(-.32,-.04,.72)),('cockpit',(-.36,-.405,1.145),(-.36,4,1.05))]:
 for ob in dst.objects:
  if ob.name.startswith(('driver_helmet','driver_opaque')):ob.hide_render=name=='cockpit'
 co.location=pos;co.rotation_euler=(Vector(target)-co.location).to_track_quat('-Z','Y').to_euler();cam.lens=24 if name=='cockpit' else 48;sc.render.filepath=str(E/('blender-material01-'+name+'.png'));bpy.ops.render.render(write_still=True)



