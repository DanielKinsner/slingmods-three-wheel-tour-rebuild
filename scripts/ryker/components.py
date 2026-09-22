import bpy,json,sys,pathlib,numpy as np
out=pathlib.Path(sys.argv[sys.argv.index('--')+1])
def components(mesh):
 parent=list(range(len(mesh.vertices)))
 def root(i):
  while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
  return i
 for edge in mesh.edges:
  a,b=edge.vertices;ra,rb=root(a),root(b)
  if ra!=rb:parent[rb]=ra
 labels=np.array([root(i) for i in range(len(parent))]);groups={}
 for p in mesh.polygons:groups.setdefault(int(labels[p.vertices[0]]),[]).append(p.index)
 return labels,groups
if __name__=='__main__':
 report={}
 for n in [7,8,9,10,13,14,15,17,18]:
  o=bpy.data.objects[f'Part___{n}'];labels,groups=components(o.data);co=np.array([v.co for v in o.data.vertices]);rows=[]
  for k,faces in groups.items():
   inds=np.where(labels==k)[0];v=co[inds];mats={}
   for i in faces:
    p=o.data.polygons[i];name=o.material_slots[p.material_index].name;mats[name]=mats.get(name,0)+len(p.vertices)-2
   rows.append({'id':k,'triangles':sum(mats.values()),'bounds':[v.min(axis=0).tolist(),v.max(axis=0).tolist()],'materials':mats})
  report[str(n)]=sorted(rows,key=lambda r:-r['triangles']);print(n,len(rows))
 (out/'components.json').write_text(json.dumps(report,indent=2))
