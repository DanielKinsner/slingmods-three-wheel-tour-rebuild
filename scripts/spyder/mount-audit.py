import bpy,json,pathlib,numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
R=pathlib.Path(__file__).resolve().parents[2];W=R/'.tools/spyder'
bpy.ops.wm.open_mainfile(filepath=str(W/'Spyder-Game-Master.blend'))
body=bpy.data.objects.get('spyder_body_mesh');deps=bpy.context.evaluated_depsgraph_get();tree=BVHTree.FromObject(body,deps)
def v(p):return Vector((p[0],-p[2],p[1]))
def g(p):return [round(p.x,5),round(p.z,5),round(-p.y,5)]
rows=[]
for side in [-1,1]:
 for tag,pts in [('head',[(side*.22,.81,-.67),(side*.35,.76,-.59),(side*.38,.73,-.56)]),('frame',[(side*.34,.43,-.32),(side*.34,.43,0),(side*.34,.43,.2)]),('arm',[(side*.28,.22,-.62),(side*.45,.22,-.65),(side*.61,.22,-.74)]),('grill',[(side*.04,.23,-1.12),(side*.2,.23,-1.1),(side*.3,.27,-1.02)])]:
  for p in pts:
   at,n,i,d=tree.find_nearest(v(p));rows.append({'tag':tag,'requested':p,'surface':g(at),'normal':g(n),'distance':d})
(W/'surface-mounts.json').write_text(json.dumps(rows,indent=2));print('SURFACE',json.dumps(rows),flush=True)
# Bounding boxes and radial range of actual rim vertices around the measured contact.
for side in ['front_left','front_right']:
 ob=bpy.data.objects.get('spyder_'+side+'_spin_mesh');verts=np.array([g(ob.matrix_world@x.co) for x in ob.data.vertices]);print('WHEEL',side,verts.min(0).tolist(),verts.max(0).tolist(),flush=True)
base=next((R/'.tools/spyder-kit/Spyder_Road_Codex_Kit/work').glob('preflight-*/Spyder-Imported-Baseline.blend'));bpy.ops.wm.open_mainfile(filepath=str(base))
islands=json.loads((W/'islands.json').read_text());out=[]
for r in islands:
 lo,hi=r['min'],r['max'];c=r['center']
 if c[1]<-35 and hi[0]-lo[0]>18 and hi[2]<10 and r['vertices']>300:
  o=bpy.data.objects[r['object']];labels=np.load(W/(o.name+'.npz'))['labels'];mats=set()
  for p in o.data.polygons:
   if labels[p.vertices[0]]==r['component']:mats.add(o.data.materials[p.material_index].name)
  r['materials']=list(mats);out.append(r)
(W/'front-islands.json').write_text(json.dumps(out,indent=2));print('FRONT',json.dumps(out),flush=True)
