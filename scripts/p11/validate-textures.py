from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib,struct,sys
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'public/assets/p11';errors=[];checked=[]
pending='--allow-pending-compression' in sys.argv
for p in sorted(OUT.rglob('*.png')):
 with Image.open(p)as im:
  size=im.size;im.verify()
 k=p.with_suffix('.ktx2');side=k.with_suffix('.ktx2.json')
 if not k.exists() or not side.exists():
  if not pending:errors.append('Missing KTX2: '+p.relative_to(OUT).as_posix())
  continue
 record=json.loads(side.read_text(encoding="utf-8"));data=k.read_bytes();sourceHash=hashlib.sha256(p.read_bytes()).hexdigest()
 if record['sourceSha256']!=sourceHash:
  if not pending:errors.append('Stale KTX2: '+p.relative_to(OUT).as_posix())
  continue
 if data[:12]!=b'\xabKTX 20\xbb\r\n\x1a\n':errors.append('Invalid KTX2 magic: '+str(k))
 if struct.unpack_from('<II',data,20)!=size:errors.append('KTX2 dimensions differ: '+str(k))
 if hashlib.sha256(data).hexdigest()!=record['sha256']:errors.append('KTX2 hash mismatch: '+str(k))
 checked.append({'file':p.relative_to(OUT).as_posix(),'pixels':list(size),'ktx2Encoding':record['encoding']})
height=np.asarray(Image.open(OUT/'race-asphalt/dry-4m-height.png'));assert np.ptp(height)>10,'Height field must not collapse during 16-bit conversion'
mask=np.asarray(Image.open(OUT/'race-asphalt/puddle-mask.png'),dtype=np.float32)/255;coverage=float(np.mean(mask>.5));assert .20<=coverage<=.30,coverage
dry=np.asarray(Image.open(OUT/'race-asphalt/dry-4m-baseColor.png'),dtype=np.float32)[::8,::8];wet=np.asarray(Image.open(OUT/'race-asphalt/wet-baseColor.png'),dtype=np.float32)[::8,::8];assert np.max(abs(wet-dry*.65))<=.51
orm=np.asarray(Image.open(OUT/'race-asphalt/wet-ORM.png'),dtype=np.float32)[::2,::2]/255;inside=mask>.995;assert np.any(inside);assert orm[:,:,1][inside].min()>=.045 and orm[:,:,1][inside].max()<=.26
for name in ['swell-normal','chop-normal']:
 a=np.asarray(Image.open(OUT/'harbor-water'/ (name+'.png')),dtype=np.float32)/127.5-1;length=np.linalg.norm(a,axis=-1);assert abs(float(length.mean())-1)<.01
 edge=float(np.mean(abs(a[:,0]-a[:,-1]))+np.mean(abs(a[0]-a[-1])));interior=float(np.mean(abs(a[:,1:]-a[:,:-1]))+np.mean(abs(a[1:]-a[:-1])));assert edge<interior*3,(name,edge,interior)
for item in json.loads((OUT/'vfx/flipbooks.json').read_text(encoding="utf-8"))['flipbooks']:
 im=Image.open(OUT/'vfx'/item['file']);assert im.size==(2048,2048);a=np.asarray(im);frames=[a[(i//8)*256:(i//8+1)*256,(i%8)*256:(i%8+1)*256] for i in range(item['frames'])];assert len({hashlib.sha256(f.tobytes()).hexdigest()for f in frames})>=item['frames']//2,item['name']
for species in ['oak','sycamore','eucalyptus']:
 data=json.loads((OUT/'ridge-trees'/(species+'-imposter.json')).read_text(encoding="utf-8"));assert len(data['views'])==8
 for channel in ['baseColor','normal','depth']:assert Image.open(OUT/'ridge-trees'/(species+'-imposter-'+channel+'.png')).size==(2048,1024)
result={'checkedPngKtxPairs':len(checked),'puddleCoverage':coverage,'dryHeightRange':[int(height.min()),int(height.max())],'wetColorMultiplier':.65,'normalUnitLengthAndPeriodicEdges':True,'flipbookDimensionsAndFrameVariation':True,'imposterViewsAndChannels':True,'errors':errors,'files':checked}
(ROOT/'assets/p11/texture-validation.json').write_text(json.dumps(result,indent=2), encoding="utf-8");print(json.dumps({k:v for k,v in result.items()if k!='files'},indent=2));assert not errors
