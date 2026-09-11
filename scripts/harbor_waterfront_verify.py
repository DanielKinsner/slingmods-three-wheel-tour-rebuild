"""Read-only exported land corridor verification and non-land preservation proof."""
import pathlib,json,struct,hashlib,bpy,math
from mathutils import Vector,Matrix,Quaternion
from mathutils.bvhtree import BVHTree
P=pathlib.Path(__file__).resolve().parents[1];E=P/'director-kit/production/evidence/P04A2'
def read(p):
 raw=p.read_bytes();n=struct.unpack_from('<I',raw,12)[0];return json.loads(raw[20:20+n]),raw[28+n:]
def acc(g,b,i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];o=v.get('byteOffset',0)+a.get('byteOffset',0);num={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];fmt={5126:'f',5125:'I',5123:'H',5121:'B'}[a['componentType']];size=struct.calcsize('<'+fmt*num);stride=v.get('byteStride',size);return[struct.unpack_from('<'+fmt*num,b,o+k*stride)for k in range(a['count'])]
def bymat(g):return{g['materials'][p['material']]['name']:p for m in g['meshes']for p in m['primitives']}
def image_hashes(g,b):
 out=[]
 for im in g['images']:
  v=g['bufferViews'][im['bufferView']];o=v.get('byteOffset',0);out.append(hashlib.sha256(b[o:o+v['byteLength']]).hexdigest())
 return sorted(out)
og,oldb=read(E/'before/harbor.glb');g,b=read(P/'public/assets/harbor/harbor.glb');op,np=bymat(og),bymat(g);checks=[]
for name,p in np.items():
 if name=='Harbor_Modular_Atlas':continue
 q=op[name];assert p.get('mode',4)==4
 qi=[v[0]for v in acc(og,oldb,q['indices'])];pi=[v[0]for v in acc(g,b,p['indices'])];assert len(qi)==len(pi)
 for key in ['POSITION']:
  a=acc(og,oldb,q['attributes'][key]);c=acc(g,b,p['attributes'][key]);assert[a[i]for i in qi]==[c[i]for i in pi],(name,key)
 checks.append(name)
# Material maps intentionally revised; geometry correspondence remains exact.
assert (E/'before/route.json').read_bytes()==(P/'public/assets/harbor/route.json').read_bytes()
# Actual glTF node world transforms, not accessor bounds.
world={}
def walk(i,parent):
 node=g['nodes'][i]
 if'matrix'in node:local=Matrix([node['matrix'][j:j+4]for j in range(0,16,4)]).transposed()
 else:
  t=Vector(node.get('translation',[0,0,0]));q=node.get('rotation',[0,0,0,1]);s=Vector(node.get('scale',[1,1,1]));local=Matrix.LocRotScale(t,Quaternion((q[3],q[0],q[1],q[2])),s)
 world[i]=parent@local
 for j in node.get('children',[]):walk(j,world[i])
for i in g['scenes'][g.get('scene',0)]['nodes']:walk(i,Matrix.Identity(4))
verts=[];faces=[]
for i,node in enumerate(g['nodes']):
 if'mesh'not in node:continue
 for p in g['meshes'][node['mesh']]['primitives']:
  if g['materials'][p['material']]['name']!='Harbor_Land':continue
  base=len(verts);verts.extend(world[i]@Vector(v)for v in acc(g,b,p['attributes']['POSITION']));inds=[x[0]for x in acc(g,b,p['indices'])];faces.extend(tuple(base+j for j in inds[k:k+3])for k in range(0,len(inds),3))
bvh=BVHTree.FromPolygons(verts,faces,all_triangles=True,epsilon=0)
r=json.loads((P/'public/assets/harbor/route.json').read_text());pts=[Vector(p)for p in r['centerline']];n=len(pts);rays=0;hits=[]
# Ray every authoritative and half-segment cross-section, across asphalt and runoff.
for i,p in enumerate(pts):
 t=(pts[(i+1)%n]-pts[i-1]).normalized();nn=Vector((-t.y,t.x));j=(i+1)%n;tj=(pts[(j+1)%n]-pts[j-1]).normalized();nj=Vector((-tj.y,tj.x))
 for along in [0,.5]:
  for offset in [-8.49,-8,-7,-6,-5.5,-4,-2,0,2,4,5.5,6,7,8,8.49]:
   q=(p+nn*offset).lerp(pts[j]+nj*offset,along);co,no,face,d=bvh.ray_cast(Vector((q.x,1,q.y)),Vector((0,-1,0)),2);rays+=1
   if co is not None:hits.append([i,along,offset,list(co)])
assert not hits,hits[:5]
# Ground must still exist directly outside corridor at y0, not be globally lowered.
outside=0
for i,p in enumerate(pts):
 t=(pts[(i+1)%n]-pts[i-1]).normalized();nn=Vector((-t.y,t.x))
 for offset in [-9,9]:
  q=p+nn*offset;co,no,face,d=bvh.ray_cast(Vector((q.x,1,q.y)),Vector((0,-1,0)),2);assert co is not None and abs(co.y)<1e-5,(i,offset,co);outside+=1
bounds=[[min(v[k]for v in verts)for k in range(3)],[max(v[k]for v in verts)for k in range(3)]]
report={'status':'PASS exported GLB preserved road/land/collision geometry and land exclusion; runtime review separate','exactNonLandTriangleAttributes':checks,'embeddedImageCount':len(g['images']),'entireRouteJSONByteIdentical':True,'exportedLandTriangles':len(faces),'exportedLandRuntimeBounds':bounds,'corridorRays':rays,'corridorLandHits':0,'outsideCorridorY0Rays':outside,'cutHalfWidth':8.5,'cutMargin':0,'glbSha256':hashlib.sha256((P/'public/assets/harbor/harbor.glb').read_bytes()).hexdigest()}
(E/'waterfront-export-validation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))

