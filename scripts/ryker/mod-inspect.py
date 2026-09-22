import bpy,sys,json,pathlib
sys.path.insert(0,str(pathlib.Path(__file__).parent))
from components import components
from mathutils import Vector
report={}
for name in ['front_suspension','grille','body_panels','mechanical','rear_mechanical']:
 o=bpy.data.objects[name];labels,groups=components(o.data);rows=[]
 for k,faces in groups.items():
  ids={i for f in faces for i in o.data.polygons[f].vertices};vs=[o.matrix_world@o.data.vertices[i].co for i in ids];vs=[Vector((v.x,v.z,-v.y)) for v in vs]
  lo=[round(min(v[a] for v in vs),4) for a in range(3)];hi=[round(max(v[a] for v in vs),4) for a in range(3)]
  if len(faces)>30:rows.append(dict(id=k,faces=len(faces),bounds=[lo,hi],materials=list({o.data.materials[o.data.polygons[f].material_index].name for f in faces})))
 report[name]=sorted(rows,key=lambda r:-r['faces'])
pathlib.Path(sys.argv[sys.argv.index('--')+1]).write_text(json.dumps(report,indent=2))
