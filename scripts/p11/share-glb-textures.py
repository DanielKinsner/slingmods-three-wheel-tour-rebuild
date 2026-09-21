"""Deduplicate embedded GLB PNGs into shared relative image dependencies.
Keeps geometry/animations byte-identical, and preserves bufferView indices.
"""
from pathlib import Path
import struct,json,hashlib
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'public/assets/p11';SHARED=OUT/'shared-textures';SHARED.mkdir(exist_ok=True)
count=0;saved=0
for p in OUT.rglob('*.glb'):
 raw=p.read_bytes();length,kind=struct.unpack_from('<II',raw,12);assert kind==0x4e4f534a
 doc=json.loads(raw[20:20+length]);images=[im for im in doc.get('images',[]) if 'bufferView' in im]
 changed=False
 for material in doc.get('materials',[]):
  if 'leaf card' in material.get('name','') or 'chain link' in material.get('name','').lower():
   changed|=material.get('alphaMode')!='MASK';material['alphaMode']='MASK';material['alphaCutoff']=.35
 if not images and not changed:continue
 bstart=20+length;blen,btype=struct.unpack_from('<II',raw,bstart);assert btype==0x004e4942
 binary=raw[bstart+8:bstart+8+blen];imageViews=set()
 for im in images:
  idx=im.pop('bufferView');view=doc['bufferViews'][idx];data=binary[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']];extension='.png' if im.get('mimeType')=='image/png' else '.jpg';name=hashlib.sha256(data).hexdigest()+extension;dest=SHARED/name
  if not dest.exists():dest.write_bytes(data)
  im['uri']='../shared-textures/'+name;imageViews.add(idx)
 new=bytearray()
 for idx,view in enumerate(doc['bufferViews']):
  offset=view.get('byteOffset',0);data=b'\0\0\0\0' if idx in imageViews else binary[offset:offset+view['byteLength']]
  while len(new)%4:new.append(0)
  view['byteOffset']=len(new);view['byteLength']=len(data);new.extend(data)
 while len(new)%4:new.append(0)
 doc['buffers'][0]['byteLength']=len(new);j=json.dumps(doc,separators=(',',':')).encode();j+=b' ' *((-len(j))%4)
 result=struct.pack('<III',0x46546c67,2,12+8+len(j)+8+len(new))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(new),0x004e4942)+new
 p.write_bytes(result);saved+=len(raw)-len(result);count+=1
print('Shared textures in',count,'GLBs; removed',saved,'duplicated embedded bytes')
