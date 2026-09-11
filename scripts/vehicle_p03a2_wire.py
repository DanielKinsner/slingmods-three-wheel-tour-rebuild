"""Read-only master topology render; does not save over source."""
import bpy,pathlib,math
from mathutils import Vector
P=pathlib.Path(__file__).resolve().parents[1];bpy.ops.wm.open_mainfile(filepath=str(P/'assets/blender/vehicles/slingshot-p03a2-master01.blend'));master=bpy.data.objects['P03A2_left_brow_boundary_master']
for m in list(master.modifiers):master.modifiers.remove(m)
mat=bpy.data.materials.new('diagnostic_cage_edges');mat.diffuse_color=(.01,.016,.018,1);mat.use_nodes=True;mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.01,.016,.018,1)
cu=bpy.data.curves.new('actual_control_edges','CURVE');cu.dimensions='3D';cu.bevel_depth=.0011;cu.bevel_resolution=0
for e in master.data.edges:
 sp=cu.splines.new('POLY');sp.points.add(1)
 for point,vi in zip(sp.points,e.vertices):p=master.data.vertices[vi].co;point.co=(*p,1)
o=bpy.data.objects.new('actual_control_edges',cu);bpy.context.collection.objects.link(o);cu.materials.append(mat)
world=bpy.data.worlds.new('Topology world');bpy.context.scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.55,.60,.62,1);world.node_tree.nodes['Background'].inputs[1].default_value=.7
for pos,power,size in [((-2,2,4),220,3),((1,0,2),100,2)]:
 ld=bpy.data.lights.new('topology softbox','AREA');ld.energy=power;ld.shape='DISK';ld.size=size;ob=bpy.data.objects.new('topology softbox',ld);bpy.context.collection.objects.link(ob);ob.location=pos;ob.rotation_euler=(Vector((-.62,1.2,.70))-ob.location).to_track_quat('-Z','Y').to_euler()
cam=bpy.data.cameras.new('TopologyCamera');co=bpy.data.objects.new('TopologyCamera',cam);bpy.context.collection.objects.link(co);co.location=(-2.8,3.8,2.5);co.rotation_euler=(Vector((-.62,1.2,.70))-co.location).to_track_quat('-Z','Y').to_euler();cam.type='ORTHO';cam.ortho_scale=2.2
sc=bpy.context.scene;sc.camera=co;sc.render.engine='CYCLES';sc.cycles.samples=12;sc.render.resolution_x=1000;sc.render.resolution_y=900;sc.render.resolution_percentage=100;sc.render.filepath=str(P/'director-kit/production/evidence/P03A2/artist/proof01-topology.png');bpy.ops.render.render(write_still=True)
