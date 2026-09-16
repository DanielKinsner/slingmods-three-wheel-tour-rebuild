"""Read-only packed Blender room survey. Coordinates reported in game XYZ."""
import bpy,json,hashlib
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parents[1]
source=P/'assets/blender/p08b/showroom-refinement/signature-showroom-refined.blend'
bpy.ops.wm.open_mainfile(filepath=str(source))
def xyz(v):return [round(v.x,6),round(v.z,6),round(-v.y,6)]
rows=[]
for o in bpy.data.objects:
 if o.type=='MESH' and any(s in o.name for s in ['wall','cabinet','lift','worktop','bay_door']):
  pts=[xyz(o.matrix_world@Vector(p)) for p in o.bound_box]
  rows.append({'name':o.name,'min':[min(p[k]for p in pts)for k in range(3)],'max':[max(p[k]for p in pts)for k in range(3)]})
out=P/'director-kit/production/evidence/P10B/studio';out.mkdir(parents=True,exist_ok=True)
(out/'room-survey.json').write_text(json.dumps({'source':str(source.relative_to(P)),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'units':'inferred game metres; not real set measurements','meshes':rows},indent=2),encoding='utf8')
print(json.dumps(rows[:40]))
