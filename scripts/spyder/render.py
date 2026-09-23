import bpy,pathlib,sys
from mathutils import Vector
R=pathlib.Path(__file__).resolve().parents[2];O=R/'assets/spyder/evidence/matched';O.mkdir(parents=True,exist_ok=True)
variant=sys.argv[-1] if sys.argv[-1] in ['source','final'] else 'final'
bpy.ops.wm.open_mainfile(filepath=str(R/('.tools/spyder/Spyder-Calibrated-Master.blend' if variant=='source' else '.tools/spyder/Spyder-Game-Master.blend')))
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=12;s.cycles.use_denoising=True;s.render.resolution_x=1000;s.render.resolution_y=800;s.render.resolution_percentage=100
s.world=bpy.data.worlds.new('Audit world');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.18,.21,.25,1);s.world.node_tree.nodes['Background'].inputs[1].default_value=.6
for pos,power,size in [((3,4,5),850,4),((-3,1,3),650,3),((0,-4,3),900,3)]:
 d=bpy.data.lights.new('Studio','AREA');d.energy=power;d.size=size;o=bpy.data.objects.new('Studio',d);s.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,0,.5))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.008));f=bpy.context.object;m=bpy.data.materials.new('Floor');m.diffuse_color=(.14,.16,.19,1);f.data.materials.append(m)
d=bpy.data.cameras.new('Audit');cam=bpy.data.objects.new('Audit',d);s.collection.objects.link(cam);s.camera=cam;d.type='ORTHO'
specs={'hero':((3.2,4.2,2.5),(0,0,.55),3.35),'left':((-4,0,1.2),(0,0,.62),3.15),'right':((4,0,1.2),(0,0,.62),3.15),'rear':((-2.8,-4,2),(0,0,.6),3.3),'cockpit':((0,-1.9,2),(0,.15,1.05),1.35),'seat':((1.6,-1.4,2),(0,-.5,.83),1.4),'wheel':((-1.9,1.8,.85),(-.686,.855,.36),.95)}
clay=bpy.data.materials.new('Neutral clay');clay.diffuse_color=(.42,.42,.42,1)
for mode in ['pbr','clay']:
 s.view_layers[0].material_override=clay if mode=='clay' else None
 for name,(pos,target,size) in specs.items():
  cam.location=pos;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();d.ortho_scale=size;s.render.filepath=str(O/f'{variant}-{mode}-{name}.png');bpy.ops.render.render(write_still=True)
