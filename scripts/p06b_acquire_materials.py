"""Bounded official Poly Haven CC0 acquisition for P06B. No credentials or site scraping."""
import requests, json, hashlib, datetime
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/showcase-quality'; SRC=ROOT/'assets/blender/showcase-quality/sources'
OUT.mkdir(parents=True,exist_ok=True); SRC.mkdir(parents=True,exist_ok=True)
(OUT/'textures').mkdir(exist_ok=True); (OUT/'sky').mkdir(exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
records=[]
assets={'asphalt_02':3.0,'concrete_pavement_02':2.0,'concrete_wall_006':2.0,'weathered_brown_planks':2.0,'palm_tree_bark':1.3,'leafy_grass':2.0,'sparse_grass':2.0,'white_plaster_rough_01':2.0}
s=requests.Session();s.headers['User-Agent']='SlingMods-local-art-production/1.0 bounded-CC0-acquisition'
for asset,scale in assets.items():
 metadata=s.get('https://api.polyhaven.com/files/'+asset,timeout=40); metadata.raise_for_status();j=metadata.json();(SRC/(asset+'-files.json')).write_text(json.dumps(j,indent=2))
 for channel in ['Diffuse','nor_gl','Rough','AO']:
  options=j[channel]['2k' if asset=='asphalt_02' else '1k'];fmt='jpg' if 'jpg' in options else 'png';info=options[fmt];target=SRC/(asset+'_'+channel+'.'+fmt)
  if not target.exists():
   response=s.get(info['url'],timeout=90);response.raise_for_status();target.write_bytes(response.content)
  assert hashlib.md5(target.read_bytes()).hexdigest()==info['md5'],target
  derived=OUT/'textures'/(asset+'_'+channel+'.jpg');im=Image.open(target).convert('RGB')
  notes='Game-size source; JPEG95 optimized. No baked illumination added.'
  if asset=='asphalt_02':
   # Clean source rectangle avoids visible dominant cracks; all PBR channels use same crop.
   im=im.crop((460,190,972,702))
   # Seamless reflection extension keeps the actual grain, without per-row correction bands.
   from PIL import ImageOps
   lr=ImageOps.mirror(im);ud=ImageOps.flip(im);both=ImageOps.flip(lr)
   if channel=='nor_gl':
    def invert_channels(img,channels):
     a=np.asarray(img).copy()
     for c in channels:a[:,:,c]=255-a[:,:,c]
     return Image.fromarray(a)
    lr=invert_channels(lr,[0]);ud=invert_channels(ud,[1]);both=invert_channels(both,[0,1])
   tiled=Image.new('RGB',(1024,1024));tiled.paste(im,(0,0));tiled.paste(lr,(512,0));tiled.paste(ud,(0,512));tiled.paste(both,(512,512));im=tiled
   if channel=='Diffuse':im=ImageEnhance.Contrast(im).enhance(.68);im=ImageEnhance.Brightness(im).enhance(.72)
   notes+=' Coordinated intact 512px crop(460,190,972,702); mirror extension with tangent normals corrected, 1.5m tile coverage. Cracked full source retained only in originals.'
  if asset=='white_plaster_rough_01' and channel=='Diffuse':
   a=np.asarray(im,dtype=float);gray=a.mean(axis=2);tone=np.clip(175+(gray-gray.mean())*.48,0,255)
   im=Image.fromarray(np.uint8(np.clip(tone[:,:,None]*np.array([1.02,1.015,1.0]),0,255)))
   notes+=' Neutral pale mineral finish derived from source plaster microvariation; removes brown tint, no illumination baked.'
  if asset=='leafy_grass' and channel=='Diffuse':
   a=np.asarray(im,dtype=float)*np.array([.50,.43,.38]);im=Image.fromarray(np.uint8(np.clip(a,0,255)))
   notes+=' Dark leaf-mulch calibration: RGB multipliers0.50/0.43/0.38 retain actual photographed leaf/soil structure in bounded planting beds, not pale whole-lawn discs.'
  if asset=='sparse_grass' and channel=='Diffuse':
   a=np.asarray(im,dtype=float)*np.array([.78,1.35,.78]);im=Image.fromarray(np.uint8(np.clip(a,0,255)))
   notes+=' Color-calibrated growing turf alternate: red/blue0.78 green1.35; original sparse grass photo structure retained.'
  im.save(derived,quality=95,optimize=True)
  records.append({'id':asset,'provider':'Poly Haven','assetPage':'https://polyhaven.com/a/'+asset,'downloadUrl':info['url'],'license':'CC0-1.0','licensePage':'https://polyhaven.com/license','acquired':datetime.datetime.now(datetime.timezone.utc).isoformat(),'originalPath':str(target.relative_to(ROOT)),'originalSHA256':sha(target),'derivedPath':str(derived.relative_to(ROOT)),'derivedSHA256':sha(derived),'resolution':list(im.size),'physicalTileMetres':1.5 if asset=='asphalt_02' else scale,'channel':channel,'colorSpace':'sRGB' if channel=='Diffuse' else 'Non-Color','normalConvention':'+Y OpenGL tangent' if channel=='nor_gl' else None,'notes':notes})
  print(asset,channel,target.stat().st_size,flush=True)
asset='kloofendal_48d_partly_cloudy_puresky';j=s.get('https://api.polyhaven.com/files/'+asset,timeout=40).json();info=j['hdri']['2k']['hdr'];target=OUT/'sky/day-puresky-2k.hdr'
if not target.exists():
 r=s.get(info['url'],timeout=90);r.raise_for_status();target.write_bytes(r.content)
assert hashlib.md5(target.read_bytes()).hexdigest()==info['md5']
records.append({'id':asset,'provider':'Poly Haven','assetPage':'https://polyhaven.com/a/'+asset,'downloadUrl':info['url'],'license':'CC0-1.0','licensePage':'https://polyhaven.com/license','acquired':datetime.datetime.now(datetime.timezone.utc).isoformat(),'originalSHA256':sha(target),'derivedSHA256':sha(target),'runtimePath':str(target.relative_to(ROOT)),'resolution':[2048,1024],'channel':'RGBE environment radiance','colorSpace':'linear HDR','notes':'Official 2K HDR game resolution. Runtime PMREM filtering; not indoor illumination.'})
(OUT/'source-manifest.json').write_text(json.dumps({'version':'P06B-source-library-1','assets':records,'rightsVerified':'Official Poly Haven license opened 2026-09-14. All downloadable asset files CC0; no website preview imagery used.','physicalScalePolicy':'Provider-stated 3m asphalt and 1.3m bark. Other tile sizes are intentionally chosen game metres, not provider measurement claims.'},indent=2))
