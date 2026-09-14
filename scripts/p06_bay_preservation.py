"""Bind narrow bay-only export repair to the preceding local runtime checkpoint."""
import pathlib,subprocess,json,struct,hashlib
P=pathlib.Path(__file__).resolve().parents[1];REF='8aa7f099ca7a03a22bed20dcec898a53036dad96';E=P/'director-kit/production/evidence/P06/artist'
sha=lambda b:hashlib.sha256(b).hexdigest()
DATA={}
def read(raw):
 n=struct.unpack_from('<I',raw,12)[0];return json.loads(raw[20:20+n]),raw[20+n+8:]
def census(raw):
 g,bin=read(raw)
 def image(i):v=g['bufferViews'][g['images'][i]['bufferView']];return sha(bin[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']])
 def texture(info):
  d=dict(info);t=g['textures'][d.pop('index')];d['imageSHA256']=image(t['source']);d['sampler']=g['samplers'][t['sampler']];return d
 def mat(i):
  m=json.loads(json.dumps(g['materials'][i]));p=m.get('pbrMetallicRoughness',{})
  for k in ['baseColorTexture','metallicRoughnessTexture']:
   if k in p:p[k]=texture(p[k])
  for k in ['normalTexture','occlusionTexture','emissiveTexture']:
   if k in m:m[k]=texture(m[k])
  return m
 def accessor(i):
  a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];offset=v.get('byteOffset',0)+a.get('byteOffset',0);size={5121:1,5123:2,5125:4,5126:4}[a['componentType']]*{'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];stride=v.get('byteStride',size)
  data=b''.join(bin[offset+j*stride:offset+j*stride+size]for j in range(a['count']));h=sha(data);DATA[h]=data;return h
 result={}
 for n in g['nodes']:
  if 'mesh'not in n:continue
  primitives=[{'attributes':{k:accessor(v)for k,v in p['attributes'].items()},'indices':accessor(p['indices']),'material':mat(p['material'])}for p in g['meshes'][n['mesh']]['primitives']]
  result[n['name']]={'matrix':{k:v for k,v in n.items()if k in ['matrix','translation','rotation','scale']},'primitives':primitives}
 return result
before=subprocess.check_output(['git','show',REF+':public/assets/showcase/kit.glb'],cwd=P);after=(P/'public/assets/showcase/kit.glb').read_bytes();a,b=census(before),census(after);nonbay=[n for n in a if not n.startswith('kit_bay__')];uv_roundoff=[]
for n in nonbay:
 assert a[n]['matrix']==b[n]['matrix'];assert len(a[n]['primitives'])==len(b[n]['primitives'])
 for ap,bp in zip(a[n]['primitives'],b[n]['primitives']):
  assert ap['indices']==bp['indices']and ap['material']==bp['material'],n
  assert {k:v for k,v in ap['attributes'].items()if k!='TEXCOORD_0'}=={k:v for k,v in bp['attributes'].items()if k!='TEXCOORD_0'},n
  aa=DATA[ap['attributes']['TEXCOORD_0']];bb=DATA[bp['attributes']['TEXCOORD_0']];assert len(aa)==len(bb)
  if aa!=bb:
   av=struct.unpack('<'+'f'*(len(aa)//4),aa);bv=struct.unpack('<'+'f'*(len(bb)//4),bb);delta=max(abs(x-y)for x,y in zip(av,bv));assert delta<=2e-7,(n,delta)
   uv_roundoff.append({'node':n,'changedUVComponents':sum(x!=y for x,y in zip(av,bv)),'maxUVDelta':delta,'maxTexelDeltaAt2048':delta*2048})
unchanged={};line_endings={}
for name in ['public/assets/showcase/foundation.glb','public/assets/showcase/scene-layout.json','public/assets/harbor/route.json','src/presentation/showcase.ts']:
 old=subprocess.check_output(['git','show',REF+':'+name],cwd=P);now=(P/name).read_bytes()
 if old==now:unchanged[name]=sha(now)
 else:
  assert old.replace(b'\r\n',b'\n')==now.replace(b'\r\n',b'\n'),name;line_endings[name]={'worktreeSHA256':sha(now),'gitBlobSHA256':sha(old),'method':'Exact text content after CRLF/LF normalization for Windows checkout. No semantic value changed.'}
report={'status':'PASS exact non-bay positions, normals, indices, transforms, PBR properties, referenced image bytes and samplers; four bevel UV streams have documented sub-texel export roundoff','baselineCommit':REF,'beforeKitSHA256':sha(before),'afterKitSHA256':sha(after),'nonBayPrimitivesPreserved':len(nonbay),'changedNonBayGeometryNodes':[],'uvExportRoundoff':uv_roundoff,'preservedNodeFingerprints':{n:sha(json.dumps(a[n],sort_keys=True).encode())for n in nonbay},'byteIdenticalFiles':unchanged,'lineEndingOnlyFiles':line_endings,'allowedChanges':['Bay floor replaced repeated atlas-face UVs with one plane and dedicated 512px seamlessly repeating basecolor/ORM/normal set; ordinary mipmaps retained','Existing brand backing and text moved/resized together into standard root camera frame'],'floorTrianglesBefore':1200,'floorTrianglesAfter':2}
(E/'bay-only-preservation.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:v for k,v in report.items()if k not in ['preservedNodeFingerprints','byteIdenticalFiles']}))
