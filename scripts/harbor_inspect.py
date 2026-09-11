"""Read-only scene inspection, protected route comparison and asset census."""
import bpy,pathlib,json,math,struct,hashlib
from mathutils import Vector
P=pathlib.Path(__file__).resolve().parents[1];E=P/'director-kit/production/evidence/P04A/artist';r=json.loads((P/'public/assets/harbor/route.json').read_text());old=json.loads((E/'route01/route.json').read_text())
keys=['id','version','width','runoff','length','centerline','start','checkpoints','ground']
for k in keys:assert r[k]==old[k],k
assert r['colliders'][:len(old['colliders'])]==old['colliders']
def distance(x,z):
 p=Vector((x,z));best=1e9
 for i,q in enumerate(r['centerline']):
  a=Vector(q);b=Vector(r['centerline'][(i+1)%len(r['centerline'])]);d=b-a;t=max(0,min(1,(p-a).dot(d)/d.length_squared));best=min(best,(p-a-t*d).length)
 return best
minclear=1e9
for c in r['colliders'][len(old['colliders']):]:
 x,y,z=c['center'];sx,sy,sz=c['size'];yaw=c['yaw']
 for a,b in [(-1,-1),(-1,1),(1,-1),(1,1),(0,0)]:
  xx=x+math.cos(yaw)*a*sx/2+math.sin(yaw)*b*sz/2;zz=z-math.sin(yaw)*a*sx/2+math.cos(yaw)*b*sz/2;d=distance(xx,zz);minclear=min(minclear,d);assert d>8.5,(c['id'],d)
raw=(P/'public/assets/harbor/harbor.glb').read_bytes();g=json.loads(raw[20:20+struct.unpack_from('<I',raw,12)[0]])
report=dict(status='PASS unchanged route core/original colliders; new prop corners outside runoff; visual review separate',exactCoreKeys=keys,preservedOriginalColliders=len(old['colliders']),appendedColliders=len(r['colliders'])-len(old['colliders']),minimumNewColliderCornerCenterlineDistance=minclear,lamps=len(r['lamps']),primitives=sum(len(m['primitives'])for m in g['meshes']),images=len(g.get('images',[])),textures=len(g.get('textures',[])),materials=len(g['materials']),triangles=sum(g['accessors'][p['indices']]['count']//3for m in g['meshes']for p in m['primitives']))
(E/'dressed01-validation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
bpy.ops.wm.open_mainfile(filepath=str(P/'assets/blender/harbor/harbor.blend'));world=bpy.data.worlds.new('Artist diagnostic sky');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.63,.73,.91,1);world.node_tree.nodes['Background'].inputs[1].default_value=.7;bpy.context.scene.world=world
li=bpy.data.lights.new('Artist diagnostic sun','SUN');li.energy=2.5;ob=bpy.data.objects.new('Artist diagnostic sun',li);bpy.context.collection.objects.link(ob);ob.rotation_euler=(.6,-.5,.2)
c=bpy.data.cameras.new('Artist overview');ob=bpy.data.objects.new('Artist overview',c);bpy.context.collection.objects.link(ob);bpy.context.scene.camera=ob
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12;scene.render.resolution_x=1200;scene.render.resolution_y=800;scene.render.resolution_percentage=100
for name,pos,target in [('waterfront',[-58,22,38],[0,2,-88]),('industrial',[278,17,155],[154,2,137]),('overview',[142,620,-46],[142,0,-46])]:
 def cv(p):return Vector((p[0],-p[2],p[1]))
 ob.location=cv(pos);ob.rotation_euler=(cv(target)-ob.location).to_track_quat('-Z','Y').to_euler();c.type='ORTHO'if name=='overview'else'PERSP';c.ortho_scale=650;c.lens=32;scene.render.filepath=str(E/f'dressed01-blender-{name}.png');bpy.ops.render.render(write_still=True)
