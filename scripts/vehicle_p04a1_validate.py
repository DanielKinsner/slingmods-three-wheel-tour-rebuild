import pathlib,json,struct,hashlib,os,numpy as np
from mathutils import Vector,Matrix,Quaternion
from mathutils.bvhtree import BVHTree
P=pathlib.Path(__file__).resolve().parents[1];E=P/'director-kit/production/evidence/P04A1/artist'
def load(path):
 raw=path.read_bytes();n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);b=raw[28+n:]
 def acc(i):
  a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];dt={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']];w={'VEC3':3,'VEC2':2,'VEC4':4,'SCALAR':1}[a['type']];s=np.dtype(dt).itemsize;return np.ndarray((a['count'],w),dtype=dt,buffer=b,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',s*w),s)).copy()
 parents={c:i for i,n in enumerate(g['nodes'])for c in n.get('children',[])};cache={}
 def world(i):
  if i in cache:return cache[i]
  no=g['nodes'][i]
  if 'matrix'in no:m=Matrix(np.array(no['matrix']).reshape(4,4).T.tolist())
  else:
   q=no.get('rotation',[0,0,0,1]);m=Matrix.LocRotScale(Vector(no.get('translation',[0,0,0])),Quaternion((q[3],*q[:3])),Vector(no.get('scale',[1,1,1])))
  if i in parents:m=world(parents[i])@m
  cache[i]=m;return m
 out={}
 for i,no in enumerate(g['nodes']):
  if 'mesh'not in no:continue
  for j,p in enumerate(g['meshes'][no['mesh']]['primitives']):
   m=np.array(world(i));v=acc(p['attributes']['POSITION']);v=v@m[:3,:3].T+m[:3,3];f=acc(p['indices']).reshape(-1,3);name=no['name']+(':'+str(j)if j else'');out[name]={'v':v,'f':f,'attrs':{k:acc(a)for k,a in p['attributes'].items()},'node':i,'material':p.get('material'),'parent':g['nodes'][parents[i]].get('name')if i in parents else None}
 return raw,g,out
if __name__=='__main__':
 raw,g,meshes=load(P/'public/assets/vehicles/slingshot-p04a1.glb');cfg=json.loads((P/'public/assets/vehicles/slingshot-p04a1-rear-rig.json').read_text());A,H,U,L=[np.array(cfg[k])for k in ['armPivot','armHub','shockUpper','shockLower']];C=np.array(cfg['wheelCenter']);D=H-A;sd=L-U
 def affine(v,a,b,bb,scale=True):
  d=b-a;dd=bb-a;q=Vector(d).rotation_difference(Vector(dd));rot=np.array(q.to_matrix());x=v-a
  if scale:x=x+(x@d/np.dot(d,d))[:,None]*d*(np.linalg.norm(dd)/np.linalg.norm(d)-1)
  return x@rot.T+a
 def transform(name,v,y,spin=0):
  delta=np.array([0,y-C[1],0]);newH=H+delta;newL=affine(L[None,:],A,H,newH)[0]
  if name.startswith(('rear_arm_visual','belt_visual')):return affine(v,A,H,newH)
  if name.startswith(('rear_axle_visual','rear_caliper_visual')):return v+delta
  if name.startswith('shock_spring_visual'):return affine(v,U,L,newL)
  if name.startswith('shock_body_visual'):return affine(v,U,L,newL,False)
  if name.startswith('shock_piston_visual'):
   rot=np.array(Vector(sd).rotation_difference(Vector(newL-U)).to_matrix());return(v-L)@rot.T+newL
  if name.startswith(('rear_spin','rear_pulley_visual')):
   co,si=np.cos(spin),np.sin(spin);rot=np.array([[1,0,0],[0,co,-si],[0,si,co]]);return(v-C)@rot.T+C+delta
  return v
 def bvh(v,f):return BVHTree.FromPolygons([Vector(x)for x in v],[tuple(map(int,x))for x in f],all_triangles=True,epsilon=0)
 fixed={n:m for n,m in meshes.items()if not n.startswith(('rear_spin','rear_pulley_visual','rear_arm_visual','belt_visual','rear_axle_visual','rear_caliper_visual','shock_','front_','suspension_'))}
 fixed={n:m for n,m in fixed.items()if m['v'][:,2].max()>.58};trees={n:bvh(m['v'],m['f'])for n,m in fixed.items()};tire=meshes['rear_spin__Rubber'];ys=np.linspace(*cfg['supportedHubY'],41);recorded=os.environ.get('REAR_RECORDED_TIMELINE');ys=np.array(sorted(set(r['telemetry']['wheels'][2]['localCenter']['y'] for r in json.loads(pathlib.Path(recorded).read_text(encoding='utf-8'))))) if recorded else ys;issues=[];nearest=99.;nearestWhere=None
 for y in ys:
  for spin in [0,np.pi/2,np.pi,3*np.pi/2]:
   v=transform('rear_spin',tire['v'],y,spin);tree=bvh(v,tire['f'])
   for n,m in fixed.items():
    if np.any(v.max(0)<m['v'].min(0))or np.any(m['v'].max(0)<v.min(0)):continue
    hits=tree.overlap(trees[n])
    if hits:issues.append({'moving':'tire','fixed':n,'y':float(y),'spin':float(spin),'triangleIntersections':len(hits)})
   # The nearest vertex-surface measure complements triangle intersection; not an exact triangle distance.
   for p in v[::4]:
    for n in ['rear_storage_static__Textured_Polymer','rear_body_static__Textured_Polymer']:
     rr=trees[n].find_nearest(Vector(p))
     if rr and rr[3]<nearest:nearest=float(rr[3]);nearestWhere=[n,float(y),float(spin)]
 moving={n:m for n,m in meshes.items()if n.startswith(tuple(cfg['groups'].values())+('rear_pulley_visual',))};mech=[];reserved=[]
 for y in ys:
  for n,m in moving.items():
   v=transform(n,m['v'],y);tree=bvh(v,m['f'])
   for sn in ['rear_storage_static__Textured_Polymer','rear_body_static__Textured_Polymer']:
    hits=tree.overlap(trees[sn])
    if hits:mech.append({'moving':n,'fixed':sn,'y':float(y),'intersections':len(hits)})
   for envelope in cfg['storageEnvelopes']:
    lo=np.array(envelope['min']);hi=np.array(envelope['max']);inside=((v>lo)&(v<hi)).all(1)
    if inside.any():reserved.append({'moving':n,'volume':envelope['name'],'y':float(y),'vertices':int(inside.sum())})
 result={'glbSha256':hashlib.sha256(raw).hexdigest(),'sampledHubY':ys.tolist(),'tireSpinsDegrees':[0,90,180,270],'actualExportTireVsFixedTriangleIntersections':issues,'actualExportMovingVsRearShellIntersections':mech,'movingVerticesInsideReservedStorage':reserved,'tireToNewShellSampledVertexSurfaceMin':nearest,'nearestWhere':nearestWhere,'recordedTimeline':recorded,'notes':'Actual GLB world transforms. Every listed hub height x4 spins. BVH triangle overlap plus sampled nearest; this is not continuous analytic clearance proof.'};(E/('candidate02-recorded-clearance.json' if recorded else 'candidate02-swept-clearance.json')).write_text(json.dumps(result,indent=2));print(json.dumps({k:v for k,v in result.items()if k not in ['sampledHubY','actualExportTireVsFixedTriangleIntersections','actualExportMovingVsRearShellIntersections','movingVerticesInsideReservedStorage']}));print('ISSUES',len(issues),len(mech),len(reserved));print('FIRST',issues[:3],mech[:3],reserved[:3])
