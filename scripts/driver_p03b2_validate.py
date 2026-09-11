"""Read-only driver GLB census and fit-to-finish preservation verification."""
import pathlib,json,struct,hashlib,math
P=pathlib.Path(__file__).resolve().parents[1];E=P/'director-kit/production/evidence/P03B2/artist'
def read(p):
 raw=p.read_bytes();n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);off=20+n;size=struct.unpack_from('<I',raw,off)[0];return g,raw[off+8:off+8+size]
def access(g,blob,idx):
 a=g['accessors'][idx];v=g['bufferViews'][a['bufferView']];off=v.get('byteOffset',0)+a.get('byteOffset',0);c={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];fmt={5126:'f',5125:'I',5123:'H',5121:'B'}[a['componentType']];size=struct.calcsize('<'+fmt*c);stride=v.get('byteStride',size);return [struct.unpack_from('<'+fmt*c,blob,off+i*stride)for i in range(a['count'])]
old,ob=read(E/'fit02/test-driver.glb');g,b=read(P/'public/assets/drivers/test-driver.glb');checks=[];count=0
for om,m in zip(old['meshes'],g['meshes']):
 for op,p in zip(om['primitives'],m['primitives']):
  for name in ['POSITION','NORMAL','JOINTS_0','WEIGHTS_0']:
   oa=access(old,ob,op['attributes'][name]);na=access(g,b,p['attributes'][name]);oi=access(old,ob,op['indices']);ni=access(g,b,p['indices']);equal=[oa[i[0]] for i in oi]==[na[i[0]] for i in ni];checks.append({'mesh':m['name'],'attribute':name,'exactEqual':equal});assert equal,(m['name'],name)
  assert len(access(old,ob,op['indices']))==len(access(g,b,p['indices']))
  uv=access(g,b,p['attributes']['TEXCOORD_0']);assert all(math.isfinite(v)and 0<=v<=1 for row in uv for v in row)
  count+=len(uv)
oldc=json.loads((E/'fit02/test-driver-attachment.json').read_text());c=json.loads((P/'public/assets/drivers/test-driver-attachment.json').read_text())
for k in ['arms','eye','feet','boneRest','exportedBoneLocalTRS','seatAnchor']:assert oldc[k]==c[k],k
assert len(g['images'])==3
r={'status':'PASS source-to-finish geometry/rig preservation; visible material review separate','geometryAttributeChecks':checks,'checkedUVVertices':count,'finiteUVInUnitSquare':True,'exactTriangleCornerAttributeEquality':True,'vertexSplitNote':'Helmet stripe introduces UV-only vertex splits; expanded triangle position/normal/joint/weight attributes remain byte-value identical','exactAttachmentKeys':['arms','eye','feet','boneRest','exportedBoneLocalTRS','seatAnchor'],'images':len(g['images']),'textures':len(g.get('textures',[])),'samplers':g.get('samplers',[]),'exportWarningExplanation':'Exporter reported multiple texture nodes per shared atlas texture. Every node uses identical Linear interpolation and default repeat sampling; exported shared samplers are recorded here. No invalid mesh warning.'}
(E/'material01-validation.json').write_text(json.dumps(r,indent=2));print(json.dumps(r))
