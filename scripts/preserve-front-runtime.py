"""Retain reviewed runtime data; transplant only five owner-directed front batches."""
import json,struct,copy
from pathlib import Path
TARGETS={'body_static__Clear_Optical_Cover','body_static__Optical_Lens','body_static__Optical_Reflector','body_static__Recess_Black','body_static__Textured_Polymer'}
def read(path):
 b=Path(path).read_bytes();n=struct.unpack_from('<I',b,12)[0];return json.loads(b[20:20+n]),b[28+n:]
def preserve_runtime(original,refined):
 old,ob=read(original);new,nb=read(refined);binary=bytearray(ob);views={};accessors={};materials={m['name']:i for i,m in enumerate(old['materials'])}
 def acc(i):
  if i in accessors:return accessors[i]
  a=copy.deepcopy(new['accessors'][i]);v=a['bufferView']
  if v not in views:
   view=copy.deepcopy(new['bufferViews'][v]);start=view.get('byteOffset',0)
   while len(binary)%4:binary.append(0)
   view['byteOffset']=len(binary);view['buffer']=0;binary.extend(nb[start:start+view['byteLength']]);views[v]=len(old['bufferViews']);old['bufferViews'].append(view)
  a['bufferView']=views[v];accessors[i]=len(old['accessors']);old['accessors'].append(a);return accessors[i]
 incoming={n['name']:new['meshes'][n['mesh']] for n in new['nodes'] if 'mesh'in n};changed=[]
 for node in old['nodes']:
  if node['name'] not in TARGETS:continue
  mesh=copy.deepcopy(incoming[node['name']])
  for p in mesh['primitives']:
   p['attributes']={k:acc(v) for k,v in p['attributes'].items()}
   if 'indices'in p:p['indices']=acc(p['indices'])
   p['material']=materials[new['materials'][p['material']]['name']]
  old['meshes'][node['mesh']]=mesh;changed.append(node['name'])
 assert set(changed)==TARGETS
 while len(binary)%4:binary.append(0)
 old['buffers'][0]['byteLength']=len(binary);j=json.dumps(old,separators=(',',':')).encode();j+=b' '*((-len(j))%4)
 result=struct.pack('<III',0x46546c67,2,12+8+len(j)+8+len(binary))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(binary),0x004e4942)+binary;Path(refined).write_bytes(result)
 return {'transplantedRuntimeBatches':sorted(changed),'preservedRuntimeBatches':sum('mesh'in n for n in old['nodes'])-len(changed),'originalRuntimeBufferPrefixUnchanged':result[-len(binary):][:len(ob)]==ob,'runtimeBytes':len(result),'method':'Keep original glTF nodes/materials/UV data; append only changed front batch vertex/index buffers. Other original runtime meshes and their bytes retained exactly.'}
