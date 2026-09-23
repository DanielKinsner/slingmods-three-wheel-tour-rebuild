"""Spyder-only derivative: sleeve weights for the tall, wide purchased handlebars."""
import bpy,pathlib,math,json
R=pathlib.Path(__file__).resolve().parents[2]
bpy.ops.wm.open_mainfile(filepath=str(R/'assets/blender/drivers/tour-rider.blend'))
rig=bpy.data.objects['driver_rig'];jacket=bpy.data.objects['driver_jacket']
def smooth(x):
 x=max(0,min(1,x));return x*x*(3-2*x)
def dist(p,b):
 a=b.head_local;d=b.tail_local-a;t=max(0,min(1,(p-a).dot(d)/d.length_squared));return (p-a-d*t).length
changed=0
for v in jacket.data.vertices:
 c=v.co;side='left' if c.x<-.36 else 'right';names=['driver_upper_arm_'+side,'driver_forearm_'+side];ds=[dist(c,rig.data.bones[n]) for n in names]
 # In the seated rest mesh, underside sleeve vertices fall below the torso's height mask.
 # Preserve torso weights; only rebind the geometrically lateral arm tube.
 if (abs(c.x+.36)<.205 and c.y<-.32) or min(ds)>.105:continue
 weights=[1/(d*d+.00015)**3 for d in ds];total=sum(weights)
 for g in jacket.vertex_groups:g.remove([v.index])
 for n,w in zip(names,weights):jacket.vertex_groups[n].add([v.index],w/total,'REPLACE')
 changed+=1
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(R/'.tools/spyder/Spyder-Rider.blend'))
bpy.ops.export_scene.gltf(filepath=str(R/'public/assets/spyder/spyder-rider.glb'),export_format='GLB',export_extras=True,export_yup=True)
(R/'assets/spyder/evidence/rider-weights.json').write_text(json.dumps({'changedVertices':changed,'source':'assets/blender/drivers/tour-rider.blend','scope':'Spyder only; physical skeleton and gloves unchanged'}))
