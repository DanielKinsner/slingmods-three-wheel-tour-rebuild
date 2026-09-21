"""Encode PNG sources to KTX2: UASTC linear normals/data, ETC1S sRGB color."""
from pathlib import Path
import subprocess,json,hashlib,struct,shutil
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'public/assets/p11';EXE=ROOT/'.tools/p11/basisu.exe'
assert EXE.exists(),'Install basis_universal 1.16.4-1 executable into .tools/p11 first.'
records=[]
roles={}
for glb in OUT.rglob('*.glb'):
 raw=glb.read_bytes();length=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+length])
 for m in doc.get('materials',[]):
  pbr=m.get('pbrMetallicRoughness',{})
  for ref,role in [(m.get('normalTexture'),'normal'),(pbr.get('metallicRoughnessTexture'),'data'),(m.get('occlusionTexture'),'data'),(pbr.get('baseColorTexture'),'color'),(m.get('emissiveTexture'),'color')]:
   if ref:
    image=doc['images'][doc['textures'][ref['index']]['source']]
    if 'uri' in image:roles[(glb.parent/image['uri']).resolve()]=role
encoded={}
for side in OUT.rglob('*.ktx2.json'):
 try:
  meta=json.loads(side.read_text(encoding="utf-8"));dest=side.with_suffix('')
  if dest.exists():encoded[(meta['sourceSha256'],meta['encoding'],meta['transfer'],meta.get('mipmaps'))]=(dest,meta)
 except (KeyError,ValueError):pass
for p in sorted(OUT.rglob('*.png')):
 if 'preview' in p.name:continue
 normal=roles.get(p.resolve())=='normal' or 'normal' in p.name.lower();data=normal or roles.get(p.resolve())=='data' or any(s in p.name.lower() for s in ['caustics','mask','height','rough','orm','translucency','noise','imposter-depth','foam'])
 dest=p.with_suffix('.ktx2');sha=hashlib.sha256(p.read_bytes()).hexdigest();sidecar=dest.with_suffix('.ktx2.json')
 if sidecar.exists() and dest.exists():
  old=json.loads(sidecar.read_text(encoding="utf-8"))
  if old.get('sourceSha256')==sha and old.get('encoding')==('UASTC' if data else 'ETC1S') and old.get('transfer')==('linear' if data else 'sRGB') and old.get('mipmaps')==(p.parent.name!='vfx'):continue
 mipmaps=p.parent.name!='vfx'
 key=(sha,'UASTC' if data else 'ETC1S','linear' if data else 'sRGB',mipmaps)
 if key in encoded and encoded[key][0].resolve()!=dest.resolve():
  existing,old=encoded[key];shutil.copyfile(existing,dest);record={**old,'source':p.name,'output':dest.name};sidecar.write_text(json.dumps(record,indent=2), encoding="utf-8");continue
 args=[str(EXE),'-file',str(p),'-ktx2','-output_file',str(dest),'-max_threads','4']
 if mipmaps:args+=['-mipmap']
 args+=['-uastc','-linear','-uastc_level','2'] if data else ['-q','200']
 if normal:args+=['-normal_map']
 print('Encoding',p.relative_to(OUT),flush=True)
 r=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
 if r.returncode:raise RuntimeError(r.stdout)
 assert dest.read_bytes()[:12]==b'\xabKTX 20\xbb\r\n\x1a\n'
 record={'sourceSha256':sha,'encoder':'Basis Universal 1.16.4, npm basis_universal 1.16.4-1','source':p.name,'output':dest.name,'encoding':'UASTC' if data else 'ETC1S','transfer':'linear' if data else 'sRGB','mipmaps':mipmaps,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest()}
 encoded[key]=(dest,record)
 sidecar.write_text(json.dumps(record,indent=2), encoding="utf-8");records.append(record)
print('Encoded',len(records),'new or changed textures')
