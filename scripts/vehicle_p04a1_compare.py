import sys,pathlib
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent))
from vehicle_p04a1_validate import *
from collections import Counter
raw0,g0,old=load(P/'public/assets/vehicles/slingshot-p03a2.glb');raw1,g1,new=load(P/'public/assets/vehicles/slingshot-p04a1.glb')
def canonical(m):
 a=m['attrs'];keys=sorted(a);data=np.concatenate([a[k].astype(float)for k in keys],axis=1);data=np.round(data,6);data[data==0]=0;rows=[]
 for face in m['f']:rows.append(b''.join(sorted(data[i].astype('<f8').tobytes()for i in face)))
 return Counter(rows)
checks=[]
for n,m in old.items():
 if n.startswith('suspension_rear'):continue
 if n not in new:checks.append({'name':n,'status':'MISSING'});continue
 aa=canonical(m);bb=canonical(new[n]);removed=sum((aa-bb).values());added=sum((bb-aa).values());allowed='rear additions'if n.startswith(('rear_spin__Machined','rear_spin__Gloss'))else'rear deletions'if n=='body_static__Textured_Polymer'else'none';ok=(removed==0 if allowed=='rear additions'else added==0 if allowed=='rear deletions'else added==removed==0);checks.append({'name':n,'oldTriangles':len(m['f']),'newTriangles':len(new[n]['f']),'removedCanonicalTriangles':removed,'addedCanonicalTriangles':added,'allowed':allowed,'status':'PASS'if ok else'FAIL'})
r={'method':'Canonical per-triangle corner POSITION/NORMAL/TANGENT/UV attribute tuples, rounded 1e-6, sorted corner order and triangle order. Retained full attributes, not AABB-only; deleted rear shell batch must be a strict subset, new rear pulley material batches strict supersets. Existing Boolean triangulation may have alternative coplanar diagonals.','oldSha256':hashlib.sha256(raw0).hexdigest(),'newSha256':hashlib.sha256(raw1).hexdigest(),'checks':checks};(E/'candidate02-export-protection.json').write_text(json.dumps(r,indent=2));print('CHECKS',len(checks),'FAIL',[x for x in checks if x['status']!='PASS'])

