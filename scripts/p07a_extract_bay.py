"""Losslessly extract exact bay GLB dependencies; no mesh/texture transcoding."""
from pathlib import Path
import copy,json,struct,hashlib
ROOT=Path(__file__).resolve().parents[1]
def read(path):
 data=path.read_bytes();assert data[:4]==b'glTF';offset=12;j=None;binary=None
 while offset<len(data):
  length,kind=struct.unpack_from('<II',data,offset);part=data[offset+8:offset+8+length];offset+=8+length
  if kind==0x4e4f534a:j=json.loads(part)
  if kind==0x004e4942:binary=part
 return j,binary
def texture_refs(value):
 if isinstance(value,dict):
  for k,v in value.items():
   if k.endswith('Texture') and isinstance(v,dict) and 'index'in v:yield v
   else:yield from texture_refs(v)
 elif isinstance(value,list):
  for v in value:yield from texture_refs(v)
def extract(source,target):
 j,binary=read(source)
 assert not j.get('animations') and not j.get('skins') and not j.get('extensionsRequired')
 nodes=[i for i,n in enumerate(j['nodes']) if n.get('name','').startswith('kit_bay__')]
 assert nodes and all('children'not in j['nodes'][i] for i in nodes)
 assert all(i in j['scenes'][j.get('scene',0)]['nodes'] for i in nodes),'Only verified flat root-node source supported'
 meshes=sorted({j['nodes'][i]['mesh'] for i in nodes})
 primitives=[p for i in meshes for p in j['meshes'][i]['primitives']]
 assert all(not p.get('targets') and not p.get('extensions') for p in primitives)
 accessors=sorted({a for p in primitives for a in list(p['attributes'].values())+([p['indices']]if'indices'in p else [])})
 assert all('sparse'not in j['accessors'][i] for i in accessors)
 materials=sorted({p['material'] for p in primitives})
 textures=sorted({t['index'] for i in materials for t in texture_refs(j['materials'][i])})
 images=sorted({j['textures'][i]['source'] for i in textures})
 samplers=sorted({j['textures'][i]['sampler'] for i in textures if 'sampler'in j['textures'][i]})
 views=sorted({j['accessors'][i]['bufferView']for i in accessors}|{j['images'][i]['bufferView']for i in images})
 selections={'nodes':nodes,'meshes':meshes,'accessors':accessors,'materials':materials,'textures':textures,'images':images,'samplers':samplers,'bufferViews':views}
 maps={k:{old:new for new,old in enumerate(v)} for k,v in selections.items()}
 out={'asset':copy.deepcopy(j['asset']),'scene':0,'scenes':[{'name':'Exact P06C bay','nodes':list(range(len(nodes)))}]}
 for key,indices in selections.items():out[key]=[copy.deepcopy(j[key][i])for i in indices]
 for n in out['nodes']:n['mesh']=maps['meshes'][n['mesh']]
 for m in out['meshes']:
  for p in m['primitives']:
   p['attributes']={k:maps['accessors'][v] for k,v in p['attributes'].items()}
   if 'indices'in p:p['indices']=maps['accessors'][p['indices']]
   p['material']=maps['materials'][p['material']]
 for a in out['accessors']:a['bufferView']=maps['bufferViews'][a['bufferView']]
 for m in out['materials']:
  for t in texture_refs(m):t['index']=maps['textures'][t['index']]
 for t in out['textures']:
  t['source']=maps['images'][t['source']]
  if 'sampler'in t:t['sampler']=maps['samplers'][t['sampler']]
 for image in out['images']:image['bufferView']=maps['bufferViews'][image['bufferView']]
 packed=bytearray()
 for view,old in zip(out['bufferViews'],views):
  while len(packed)%4:packed.append(0)
  original=j['bufferViews'][old];assert original.get('buffer',0)==0
  begin=original.get('byteOffset',0);view['byteOffset']=len(packed);view['buffer']=0
  packed.extend(binary[begin:begin+original['byteLength']])
 out['buffers']=[{'byteLength':len(packed)}]
 if j.get('extensionsUsed'):out['extensionsUsed']=j['extensionsUsed']
 encoded=json.dumps(out,separators=(',',':')).encode();encoded+=b' '*(-len(encoded)%4);packed.extend(b'\0'*(-len(packed)%4))
 data=struct.pack('<4sII',b'glTF',2,28+len(encoded)+len(packed))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+struct.pack('<II',len(packed),0x004e4942)+packed
 target.write_bytes(data)
 # Compare every retained raw view and inverse-remap complete descriptors, not just vertex counts.
 actual,actual_bin=read(target)
 for old,new in maps['bufferViews'].items():
  a=j['bufferViews'][old];b=actual['bufferViews'][new]
  assert binary[a.get('byteOffset',0):a.get('byteOffset',0)+a['byteLength']]==actual_bin[b['byteOffset']:b['byteOffset']+b['byteLength']]
 for key in selections:
  for old,new in maps[key].items():
   expected=copy.deepcopy(j[key][old]);result=copy.deepcopy(actual[key][new])
   if key=='bufferViews':expected.pop('byteOffset',None);result.pop('byteOffset',None)
   elif key=='nodes':result['mesh']=meshes[result['mesh']]
   elif key=='meshes':
    for p in result['primitives']:
     p['attributes']={k:accessors[v] for k,v in p['attributes'].items()}
     if 'indices'in p:p['indices']=accessors[p['indices']]
     p['material']=materials[p['material']]
   elif key=='accessors':result['bufferView']=views[result['bufferView']]
   elif key=='materials':
    for t in texture_refs(result):t['index']=textures[t['index']]
   elif key=='textures':
    result['source']=images[result['source']]
    if 'sampler'in result:result['sampler']=samplers[result['sampler']]
   elif key=='images':result['bufferView']=views[result['bufferView']]
   assert expected==result,(key,old)
 return {'source':source.relative_to(ROOT).as_posix(),'sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'output':target.relative_to(ROOT).as_posix(),'outputSHA256':hashlib.sha256(data).hexdigest(),'beforeBytes':source.stat().st_size,'afterBytes':len(data),'retainedCounts':{k:len(v)for k,v in selections.items()},'exactDescriptorsAndBinaryViews':True,'method':'Dependency subset with integer-reference relocation only. All selected node transforms, accessor descriptors, raw views, materials, image bytes and samplers compared exactly after inverse remapping. No source mutation or texture/geometry recompression.'}
if __name__=='__main__':
 report=extract(ROOT/'public/assets/showcase-quality/kit.glb',ROOT/'public/assets/showcase-quality/bay.glb')
 (ROOT/'director-kit/production/evidence/P07A/bay-extraction.json').write_text(json.dumps(report,indent=2))
 print(json.dumps(report,indent=2))
