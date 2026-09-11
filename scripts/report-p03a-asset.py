"""Read-only census of actual GLB meshes, materials, UVs, image bytes and transformed bounds."""
from pathlib import Path
import json,struct,hashlib,sys,math,itertools

def inspect(path):
 data=Path(path).read_bytes();length,kind=struct.unpack_from('<II',data,12);g=json.loads(data[20:20+length]);binary=data[28+length:];nodes=g.get('nodes',[])
 I=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]
 def mul(a,b):return [sum(a[k*4+r]*b[c*4+k] for k in range(4)) for c in range(4) for r in range(4)]
 def matrix(n):
  if 'matrix'in n:return n['matrix']
  x,y,z,w=n.get('rotation',[0,0,0,1]);s=n.get('scale',[1,1,1]);t=n.get('translation',[0,0,0]);m=[1-2*y*y-2*z*z,2*x*y+2*z*w,2*x*z-2*y*w,0,2*x*y-2*z*w,1-2*x*x-2*z*z,2*y*z+2*x*w,0,2*x*z+2*y*w,2*y*z-2*x*w,1-2*x*x-2*y*y,0,*t,1]
  for c in range(3):
   for r in range(3):m[c*4+r]*=s[c]
  return m
 results=[];worlds={};prim=tri=uv=0
 def walk(idx,parent):
  nonlocal prim,tri,uv
  n=nodes[idx];m=mul(parent,matrix(n));worlds[n.get('name',str(idx))]=m
  for p in g.get('meshes',[])[n['mesh']].get('primitives',[]) if 'mesh'in n else []:
   a=g['accessors'][p['attributes']['POSITION']];bv=g['bufferViews'][a['bufferView']];offset=bv.get('byteOffset',0)+a.get('byteOffset',0);stride=bv.get('byteStride',12)
   assert a['componentType']==5126 and a['type']=='VEC3'
   mn=[math.inf]*3;mx=[-math.inf]*3
   for vi in range(a['count']):
    v=struct.unpack_from('<fff',binary,offset+vi*stride)
    for r in range(3):
     value=sum(m[k*4+r]*v[k]for k in range(3))+m[12+r];mn[r]=min(mn[r],value);mx[r]=max(mx[r],value)
   count=g['accessors'][p['indices']]['count'] if 'indices'in p else a['count'];tri+=count//3;prim+=1;uv+=int('TEXCOORD_0'in p['attributes']);results.append({'node':n.get('name'), 'min':mn,'max':mx,'triangles':count//3,'material':g['materials'][p['material']]['name'] if 'material'in p else None})
  for child in n.get('children',[]):walk(child,m)
 for root in g['scenes'][g.get('scene',0)]['nodes']:walk(root,I)
 mn=[min(o['min'][i] for o in results)for i in range(3)];mx=[max(o['max'][i]for o in results)for i in range(3)];images=[]
 for im in g.get('images',[]):
  if 'bufferView'in im:
   bv=g['bufferViews'][im['bufferView']];b=binary[bv.get('byteOffset',0):bv.get('byteOffset',0)+bv['byteLength']];wh=struct.unpack('>II',b[16:24]) if b.startswith(b'\x89PNG') else (None,None);images.append({'name':im.get('name'), 'mimeType':im.get('mimeType'),'bytes':len(b),'width':wh[0],'height':wh[1]})
 return {'path':str(path),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),'primitives':prim,'triangles':tri,'uvPrimitives':uv,'bounds':{'min':mn,'max':mx,'size':[mx[i]-mn[i]for i in range(3)]},'materials':g.get('materials',[]),'images':images,'meshes':results,'nodeWorldMatrices':worlds}
if __name__=='__main__':
 base=inspect('public/assets/vehicles/slingshot.glb');candidate=inspect('public/assets/vehicles/slingshot-p03a.glb')
 names=['front_left_steer','front_left_spin','front_right_steer','front_right_spin','rear_spin']+[n for n in base['nodeWorldMatrices'] if n.startswith(('mount_','camera_','rider_'))]
 contract={n:n in candidate['nodeWorldMatrices'] and max(abs(a-b)for a,b in zip(base['nodeWorldMatrices'][n],candidate['nodeWorldMatrices'][n]))<1e-5 for n in names}
 report={'baseline':base,'candidate':candidate,'protectedTransforms':contract,'allProtectedTransformsMatch':all(contract.values()),'sizeWithinOnePercent':all(abs(a-b)/b<.01 for a,b in zip(candidate['bounds']['size'],base['bounds']['size']))}
 out=Path(sys.argv[1]) if len(sys.argv)>1 else None
 if out:out.write_text(json.dumps(report,indent=2),encoding='utf-8')
 print(json.dumps({k:v for k,v in report.items()if k not in ['baseline','candidate']}));print(json.dumps({k:candidate[k]for k in ['bytes','primitives','triangles','uvPrimitives','bounds']}))
 if not report['allProtectedTransformsMatch']or not report['sizeWithinOnePercent']:sys.exit(1)
