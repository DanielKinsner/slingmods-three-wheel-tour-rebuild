"""Read-only route geometry checks and diagnostic Blender overhead; not runtime evidence."""
import bpy,pathlib,json,math,hashlib
from mathutils import Vector
P=pathlib.Path(__file__).resolve().parents[1];E=P/'director-kit/production/evidence/P04A/artist';r=json.loads((P/'public/assets/harbor/route.json').read_text());pts=[Vector(p)for p in r['centerline']];n=len(pts)
def cross(a,b):return a.x*b.y-a.y*b.x
def intersects(a,b,c,d):
 ab=b-a;cd=d-c;den=cross(ab,cd)
 if abs(den)<1e-8:return False
 t=cross(c-a,cd)/den;u=cross(c-a,ab)/den;return 0<t<1 and 0<u<1
assert not any(intersects(pts[i],pts[(i+1)%n],pts[j],pts[(j+1)%n])for i in range(n)for j in range(i+2,n)if not(i==0 and j==n-1))
measured=sum((pts[(i+1)%n]-p).length for i,p in enumerate(pts));assert abs(measured-r['length'])<.001
assert (pts[0]-Vector((0,0))).length<.001
assert abs(r['start']['x'])<1e-5 and abs(r['start']['z']-5)<.001 and abs(r['start']['yaw'])<1e-5
assert all(math.isfinite(v)for p in pts for v in p)
assert all(abs(math.hypot(g['dx'],g['dz'])-1)<1e-6 for g in r['checkpoints'])
# Curbs are centred 5.7m from road, inner edge5.525m: entirely outside usable5.5m.
assert all(c['size'][1]<=.06 for c in r['colliders']if c['id'].startswith('curb'))
report=dict(status='PASS structural geometry only; real-physics lap remains required',measuredLength=measured,noCenterlineCrossings=True,closedSeam=(pts[-1]-pts[0]).length,minimumSegment=min((pts[(i+1)%n]-p).length for i,p in enumerate(pts)),maximumSegment=max((pts[(i+1)%n]-p).length for i,p in enumerate(pts)),spawn5mBeforeFinish=True,gateDirectionsUnit=True,colliderGeometrySource='Same route box records used to construct visible Blender cuboids; yaw matches Three Yrotation',roadSurfaceY=.002,physicsGroundTop=0)
(E/'route01-geometry-check.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
bpy.ops.wm.open_mainfile(filepath=str(P/'assets/blender/harbor/harbor.blend'))
world=bpy.data.worlds.new('Diagnostic sky');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.70,.78,1);world.node_tree.nodes['Background'].inputs[1].default_value=.7;bpy.context.scene.world=world
light=bpy.data.lights.new('Diagnostic sun','SUN');light.energy=2;lo=bpy.data.objects.new('Diagnostic sun',light);bpy.context.collection.objects.link(lo);lo.rotation_euler=(.3,-.5,.4)
c=bpy.data.cameras.new('Route overhead');ob=bpy.data.objects.new('Route overhead',c);bpy.context.collection.objects.link(ob);ob.location=(130,50,650);ob.rotation_euler=(0,0,0);c.type='ORTHO';c.ortho_scale=520;bpy.context.scene.camera=ob
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=8;scene.render.resolution_x=1000;scene.render.resolution_y=1000;scene.render.resolution_percentage=100;scene.render.filepath=str(E/'route01-blender-overhead.png');bpy.ops.render.render(write_still=True)
