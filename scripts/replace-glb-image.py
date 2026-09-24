"""Swap one embedded image in a GLB, re-packing the binary so the old bytes are dropped.
Usage: python scripts/replace-glb-image.py <file.glb> <image name> <new image file>
"""
import json,pathlib,struct,sys

def replace(glb_bytes,image_name,new_bytes,mime='image/jpeg'):
 n=struct.unpack_from('<I',glb_bytes,12)[0];j=json.loads(glb_bytes[20:20+n]);bl=struct.unpack_from('<I',glb_bytes,20+n)[0];bin_=glb_bytes[28+n:28+n+bl]
 target=[i for i,im in enumerate(j['images']) if im.get('name')==image_name]
 if len(target)!=1:raise SystemExit(f'expected one image named {image_name}, found {len(target)}')
 view=j['images'][target[0]]['bufferView'];j['images'][target[0]]['mimeType']=mime
 order=sorted(range(len(j['bufferViews'])),key=lambda i:j['bufferViews'][i].get('byteOffset',0))
 out=bytearray()
 for i in order:
  bv=j['bufferViews'][i];data=new_bytes if i==view else bin_[bv.get('byteOffset',0):bv.get('byteOffset',0)+bv['byteLength']]
  while len(out)%4:out.append(0)
  bv['byteOffset']=len(out);bv['byteLength']=len(data);out+=data
 while len(out)%4:out.append(0)
 j['buffers'][0]['byteLength']=len(out)
 js=json.dumps(j,separators=(',',':')).encode();js+=b' '*((4-len(js)%4)%4)
 total=12+8+len(js)+8+len(out)
 return struct.pack('<4sII',b'glTF',2,total)+struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(out),b'BIN\x00')+bytes(out)


if __name__=='__main__':
 glb,name,image=sys.argv[1:4];path=pathlib.Path(glb);before=path.read_bytes()
 mime='image/png' if image.lower().endswith('.png') else 'image/jpeg'
 after=replace(before,name,pathlib.Path(image).read_bytes(),mime);path.write_bytes(after)
 print(f'{name} replaced in {glb}: {len(before)} -> {len(after)} bytes')
