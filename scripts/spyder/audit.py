"""Private source audit; run with headless Blender, autoexec disabled."""
import bpy, json, pathlib, numpy as np, time
ROOT=pathlib.Path(__file__).resolve().parents[2]
WORK=ROOT/'.tools/spyder'; WORK.mkdir(exist_ok=True)
baseline=next((ROOT/'.tools/spyder-kit/Spyder_Road_Codex_Kit/work').glob('preflight-*/Spyder-Imported-Baseline.blend'))
bpy.ops.wm.open_mainfile(filepath=str(baseline))
rows=[]
for obj in bpy.context.scene.objects:
 if obj.type!='MESH' or obj.name=='Plane02': continue
 m=obj.data;n=len(m.vertices);parent=list(range(n))
 def find(a):
  while parent[a]!=a:
   parent[a]=parent[parent[a]];a=parent[a]
  return a
 edges=np.empty(len(m.edges)*2,dtype=np.int32);m.edges.foreach_get('vertices',edges)
 for a,b in edges.reshape(-1,2):
  a=find(int(a));b=find(int(b))
  if a!=b:parent[max(a,b)]=min(a,b)
 labels=np.array([find(i) for i in range(n)],dtype=np.int32)
 co=np.empty(n*3,dtype=np.float32);m.vertices.foreach_get('co',co);co=co.reshape(-1,3)
 np.savez_compressed(WORK/(obj.name+'.npz'),labels=labels)
 for key in np.unique(labels):
  pts=co[labels==key];lo=pts.min(axis=0);hi=pts.max(axis=0)
  rows.append(dict(object=obj.name,component=int(key),vertices=len(pts),min=lo.tolist(),max=hi.tolist(),center=((lo+hi)/2).tolist()))
 print(obj.name,'components',len(np.unique(labels)),flush=True)
(WORK/'islands.json').write_text(json.dumps(rows,indent=2))
print('ISLAND AUDIT COMPLETE',len(rows),flush=True)
