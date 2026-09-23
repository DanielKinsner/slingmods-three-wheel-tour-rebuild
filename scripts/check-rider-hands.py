"""Check authored finger sections: blender -b --python-exit-code 1 --python scripts/check-rider-hands.py."""
import bpy,json
from pathlib import Path
from mathutils import Vector
p=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(p/'assets/blender/drivers/tour-rider.blend'))
rows=[]
for ob in bpy.data.objects:
 if not ob.name.startswith('Curled_glove_finger_'):continue
 n=int(ob.get('gripRingSegments',10));vs=ob.data.vertices
 assert len(vs)%n==0
 axes=[]
 for start in range(0,len(vs),n):
  center=sum((v.co for v in vs[start:start+n]),Vector())/n
  axes.append((vs[start].co-center).normalized())
 for vertex in vs:
  groups=[g for g in vertex.groups if g.weight>.0001]
  assert len(groups)==1 and abs(groups[0].weight-1)<.0001,'fingers must not stretch with forearm weights'
  assert ob.vertex_groups[groups[0].group].name=='driver_hand_'+('left' if 'left' in ob.name else 'right')
 for polygon in ob.data.polygons:
  assert polygon.area>1e-10,'collapsed finger face'
 dots=[a.dot(b) for a,b in zip(axes,axes[1:])];rows.append({'finger':ob.name,'minAdjacentRingDot':min(dots),'rings':len(axes)})
print('HAND_GEOMETRY '+json.dumps(rows))
assert len(rows)==8,'eight complete fingers required'
assert all(r['minAdjacentRingDot']>.5 for r in rows),'finger cross-sections reverse: pinched/self-crossing geometry'
