"""Port of Astra's supplied read-only winding-number diagnostic using existing numpy only.
The supplied script needs unavailable trimesh; connected components/normal generation are implemented here.
"""
import pathlib,json,struct,hashlib,numpy as np
P=pathlib.Path(__file__).resolve().parents[1];E=P/'director-kit/production/evidence/P04A1/artist';raw=(P/'public/assets/vehicles/slingshot-p03a2.glb').read_bytes();n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);b=raw[28+n:]
def acc(i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];dt={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']];w={'VEC3':3,'VEC2':2,'VEC4':4,'SCALAR':1}[a['type']];s=np.dtype(dt).itemsize;return np.ndarray((a['count'],w),dtype=dt,buffer=b,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',s*w),s)).copy()
def get(name):
 no=next(x for x in g['nodes']if x.get('name')==name);p=g['meshes'][no['mesh']]['primitives'][0];v=acc(p['attributes']['POSITION']);f=acc(p['indices']).reshape(-1,3);u,inv=np.unique(np.round(v,7),axis=0,return_inverse=True);return u,inv[f]
v,f=get('body_static__Textured_Polymer');parent=list(range(len(v)))
def find(i):
 while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
 return i
for face in f:
 for j in face[1:]:parent[find(int(j))]=find(int(face[0]))
groups={}
for i,face in enumerate(f):groups.setdefault(find(int(face[0])),[]).append(i)
wall=None
for group in groups.values():
 ff=f[group];vv=v[np.unique(ff)];bb=np.array([vv.min(0),vv.max(0)])
 if np.linalg.norm(bb.mean(0)-np.array([0,.6,1.105]))<.1:wall=v[ff]
assert wall is not None
pivot=next(x for x in g['nodes']if x.get('name')=='rear_spin')['translation'];tv,tf=get('rear_spin__Rubber');tv=tv+np.array(pivot)
norm=np.cross(wall[:,1]-wall[:,0],wall[:,2]-wall[:,0]);norm/=np.linalg.norm(norm,axis=1)[:,None];depth=-np.einsum('fvd,fd->fv',tv[None,:,:]-wall[:,0,None,:],norm).max(0)
A=wall[None,:,0,:]-tv[:,None,:];B=wall[None,:,1,:]-tv[:,None,:];C=wall[None,:,2,:]-tv[:,None,:];an=np.linalg.norm(A,axis=2);bn=np.linalg.norm(B,axis=2);cn=np.linalg.norm(C,axis=2);num=np.einsum('pfd,pfd->pf',A,np.cross(B,C));den=an*bn*cn+np.einsum('pfd,pfd->pf',A,B)*cn+np.einsum('pfd,pfd->pf',B,C)*an+np.einsum('pfd,pfd->pf',C,A)*bn;wind=np.sum(2*np.arctan2(num,den),axis=1)/(4*np.pi);strict=(abs(wind)>.999)&(depth>1e-5)
r={'method':'Supplied Astra generalized winding-number containment ported to numpy; no trimesh installed/new dependency','sourceDiagnostic':'director-kit/director-addenda/review-06/tools/inspect_rear_snapshot.py','assetSha256':hashlib.sha256(raw).hexdigest(),'firewallTriangles':len(wall),'firewallBounds':[wall.min((0,1)).tolist(),wall.max((0,1)).tolist()],'uniqueTireVertices':len(tv),'strictlyContainedTireVertices':int(strict.sum()),'deepestConservativeMargin':float(depth.max()),'rearSpin':pivot,'status':'REPRODUCED actual old tire surface inside rear firewall'};assert int(strict.sum())==200,r;(E/'old-collision-reproduced.json').write_text(json.dumps(r,indent=2));print(json.dumps(r))
