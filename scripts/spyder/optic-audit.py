import bpy,pathlib,json,numpy as np
R=pathlib.Path(__file__).resolve().parents[2];W=R/'.tools/spyder';base=next((R/'.tools/spyder-kit/Spyder_Road_Codex_Kit/work').glob('preflight-*/Spyder-Imported-Baseline.blend'));bpy.ops.wm.open_mainfile(filepath=str(base));rows=json.loads((W/'islands.json').read_text());lookup={(r['object'],r['component']):r for r in rows};out=[]
for o in bpy.context.scene.objects:
 if o.type!='MESH' or o.name=='Plane02':continue
 labels=np.load(W/(o.name+'.npz'))['labels'];seen=set()
 for p in o.data.polygons:
  mat=o.data.materials[p.material_index].name;k=int(labels[p.vertices[0]])
  if (k,mat) in seen or mat not in ['_323','orange_rear_glass','white_bump_glass','_3___Default']:continue
  seen.add((k,mat));row=lookup[(o.name,k)].copy();row['material']=mat;out.append(row)
(W/'optic-islands.json').write_text(json.dumps(out,indent=2));print(json.dumps(out),flush=True)
