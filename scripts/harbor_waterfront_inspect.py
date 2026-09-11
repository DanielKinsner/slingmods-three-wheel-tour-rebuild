import bpy,pathlib,math
from mathutils import Vector
P=pathlib.Path(__file__).resolve().parents[1];E=P/'director-kit/production/evidence/P04A2';bpy.ops.wm.open_mainfile(filepath=str(P/'assets/blender/harbor/harbor.blend'))
world=bpy.data.worlds.new('P04A2 diagnostic world');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.55,.68,.8,1);world.node_tree.nodes['Background'].inputs[1].default_value=.6;bpy.context.scene.world=world
ld=bpy.data.lights.new('P04A2 diagnostic sun','SUN');ld.energy=2.7;lo=bpy.data.objects.new('P04A2 diagnostic sun',ld);bpy.context.collection.objects.link(lo);lo.rotation_euler=(.5,-.7,.2)
c=bpy.data.cameras.new('P04A2 diagnostic camera');ob=bpy.data.objects.new('P04A2 diagnostic camera',c);bpy.context.collection.objects.link(ob);bpy.context.scene.camera=ob;c.lens=48
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12;scene.render.resolution_x=1100;scene.render.resolution_y=750;scene.render.resolution_percentage=100
cv=lambda p:Vector((p[0],-p[2],p[1]))
for name,pos,target in [('palm-oblique',[-26,10,-201],[-17.2,7.3,-214.8]),('waterfront',[-19,7,16],[0,2,-65])]:
 ob.location=cv(pos);ob.rotation_euler=(cv(target)-ob.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(E/('artist-'+name+'.png'));bpy.ops.render.render(write_still=True)
