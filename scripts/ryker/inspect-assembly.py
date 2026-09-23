import bpy,json,pathlib,sys,hashlib
from mathutils import Vector
sys.path.insert(0,str(pathlib.Path(__file__).parent))
from components import components
out=pathlib.Path('assets/ryker/evidence/complete');out.mkdir(parents=True,exist_ok=True)
report={}
for name in ['body_panels','front_suspension','rear_mechanical']:
 o=bpy.data.objects[name];labels,islands=components(o.data);rows=[]
 for key,faces in islands.items():
  pts=[o.matrix_world@o.data.vertices[i].co for i in {j for f in faces for j in o.data.polygons[f].vertices}];coords=[(p.x,p.z,-p.y) for p in pts]
  lo=[min(p[a] for p in coords) for a in range(3)];hi=[max(p[a] for p in coords) for a in range(3)]
  rows.append({'island':key,'faces':len(faces),'min':lo,'max':hi,'materials':sorted({o.data.materials[o.data.polygons[f].material_index].name for f in faces})})
 report[name]=sorted(rows,key=lambda r:-r['faces'])
(out/'source-islands.json').write_text(json.dumps(report,indent=2))
print(json.dumps({k:v[:32] for k,v in report.items()},indent=2))
