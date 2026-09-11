"""Preserve accepted export buffers through local Blender rear surgery; no generated replacement front meshes.
Requires existing authoring Python numpy/scipy. Grafts exact baseline attributes/materials for protected nodes.
Only the old body-polymer triangles removed by the Blender rear surgery are filtered out.
"""
from pathlib import Path
import json,struct,copy,hashlib,numpy as np
from scipy.spatial import cKDTree
P=Path.cwd();oldpath=P/'public/assets/vehicles/slingshot-p03a2.glb';newpath=P/'public/assets/vehicles/slingshot-p04a1.glb';E=P/'director-kit/production/evidence/P04A1/artist'
def load(p):
 r=p.read_bytes();n=struct.unpack_from('<I',r,12)[0];return json.loads(r[20:20+n]),bytearray(r[28+n:])
def arr(g,b,i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];dt={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']];w={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];sz=np.dtype(dt).itemsize;return np.ndarray((a['count'],w),dtype=dt,buffer=b,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',sz*w),sz)).copy()
g,b=load(newpath);o,ob=load(oldpath);before=hashlib.sha256(newpath.read_bytes()).hexdigest();on={n['name']:n for n in o['nodes']};nn={n['name']:n for n in g['nodes']}
name='body_static__Textured_Polymer';op=o['meshes'][on[name]['mesh']]['primitives'][0];np0=g['meshes'][nn[name]['mesh']]['primitives'][0]
ov=arr(o,ob,op['attributes']['POSITION']);nv=arr(g,b,np0['attributes']['POSITION']);oi=arr(o,ob,op['indices']).reshape(-1,3);ni=arr(g,b,np0['indices']).reshape(-1,3)
dist,_=cKDTree(nv).query(ov);keep=np.all(dist[oi]<1e-5,axis=1);assert int(keep.sum())==len(ni),(int(keep.sum()),len(ni));filtered=oi[keep].astype('<u4').reshape(-1)
# Retained old triangle vertices must account for every new retained vertex as well.
nd,_=cKDTree(ov[oi[keep].reshape(-1)]).query(nv);assert nd.max()<1e-5,float(nd.max())
while len(b)%4:b.append(0)
offset=len(b);b.extend(ob);bv0=len(g['bufferViews']);ac0=len(g['accessors'])
for v in o['bufferViews']:
 v=copy.deepcopy(v);v['buffer']=0;v['byteOffset']=v.get('byteOffset',0)+offset;g['bufferViews'].append(v)
for a in o['accessors']:
 a=copy.deepcopy(a);a['bufferView']+=bv0;g['accessors'].append(a)
def imagehash(gg,bb,im):
 v=gg['bufferViews'][im['bufferView']];return hashlib.sha256(bb[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]).hexdigest()
imap={};current={imagehash(g,b,im):i for i,im in enumerate(g.get('images',[]))}
for i,im in enumerate(o.get('images',[])):
 h=imagehash(o,ob,im)
 if h in current:imap[i]=current[h]
 else:im=copy.deepcopy(im);im['bufferView']+=bv0;imap[i]=len(g.setdefault('images',[]));g['images'].append(im)
def dedup(kind,item):
 xs=g.setdefault(kind,[])
 if item in xs:return xs.index(item)
 xs.append(item);return len(xs)-1
smap={i:dedup('samplers',x)for i,x in enumerate(o.get('samplers',[]))};tmap={}
for i,t in enumerate(o.get('textures',[])):
 t=copy.deepcopy(t);t['source']=imap[t['source']]
 if 'sampler'in t:t['sampler']=smap[t['sampler']]
 tmap[i]=dedup('textures',t)
def remaptextures(x):
 if isinstance(x,dict):
  for k,v in x.items():
   if k.lower().endswith('texture')and isinstance(v,dict)and'index'in v:v['index']=tmap[v['index']]
   else:remaptextures(v)
 elif isinstance(x,list):
  for v in x:remaptextures(v)
mmap={}
for i,m in enumerate(o.get('materials',[])):
 m=copy.deepcopy(m);remaptextures(m);mmap[i]=dedup('materials',m)
protected=[]
for name,n in on.items():
 if 'mesh'not in n or name.startswith('suspension_rear')or name not in nn:continue
 mesh=copy.deepcopy(o['meshes'][n['mesh']])
 for primitive in mesh['primitives']:
  primitive['attributes']={k:i+ac0 for k,i in primitive['attributes'].items()};primitive['indices']+=ac0;primitive['material']=mmap[primitive['material']]
 if name=='body_static__Textured_Polymer':
  while len(b)%4:b.append(0)
  vi=len(g['bufferViews']);g['bufferViews'].append({'buffer':0,'byteOffset':len(b),'byteLength':filtered.nbytes,'target':34963});b.extend(filtered.tobytes());ai=len(g['accessors']);g['accessors'].append({'bufferView':vi,'componentType':5125,'count':len(filtered),'type':'SCALAR','min':[int(filtered.min())],'max':[int(filtered.max())]});mesh['primitives'][0]['indices']=ai
 nn[name]['mesh']=len(g['meshes']);g['meshes'].append(mesh);protected.append(name)
g['buffers']=[{'byteLength':len(b)}];jb=json.dumps(g,separators=(',',':')).encode();jb+=b' ' *((-len(jb))%4);b+=b'\0'*((-len(b))%4);data=struct.pack('<III',0x46546c67,2,28+len(jb)+len(b))+struct.pack('<II',len(jb),0x4e4f534a)+jb+struct.pack('<II',len(b),0x004e4942)+b;newpath.write_bytes(data)
r={'method':'Exact baseline GLB attributes/material definitions for every unchanged node, plus exact old body-polymer vertex attributes with only the7148 Blender-removed rear triangles omitted. Nearest-position two-way1e-5m membership selects retained triangle indices; retained attributes themselves are not rounded. New mechanical/rear shell groups stay Blender exported. Existing images deduplicated by content hash.','beforeGraftSha256':before,'afterSha256':hashlib.sha256(data).hexdigest(),'protectedNodes':protected,'bodyTrianglesOld':len(oi),'bodyTrianglesRetained':int(keep.sum()),'removedTriangles':int((~keep).sum()),'maxRetainedNewPositionDifferenceM':float(nd.max()),'imageCount':len(g['images']),'note':'Unused old/new buffer data remains as a bounded export preservation overhead, not additional rendered geometry.'};(E/'candidate02-export-preservation.json').write_text(json.dumps(r,indent=2));print(json.dumps({k:v for k,v in r.items()if k!='protectedNodes'},indent=2))
