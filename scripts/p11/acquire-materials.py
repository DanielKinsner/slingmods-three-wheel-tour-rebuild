"""Native-resolution CC0 matched PBR maps, owner-approved scan workflow.
Downloads originals without resampling or inventing normals from color.
"""
from pathlib import Path
import requests,hashlib,json,time
from concurrent.futures import ThreadPoolExecutor
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'public/assets/p11'
sets=[('race-asphalt','dry','asphalt_track','4k'),('ridge-trees','oak-bark','jolcham_oak_bark_01','2k'),('ridge-trees','sycamore-bark','bark_platanus','2k'),('ridge-trees','eucalyptus-bark','eucalyptus_bark','2k'),('ground-cover','leaf-litter','dry_decay_leaves','4k'),('ground-cover','canyon-dirt','dirt_floor','4k'),('ground-cover','dry-grass','withered_grass','4k'),('ground-cover','shaded-soil','forest_floor','4k'),('ground-cover','gravel-shoulder','gravel_road','4k'),('ground-cover','rocks','rock_boulder_dry','2k'),('wooden-sign','cedar','weathered_brown_planks','2k')]
headers={'User-Agent':'SlingMods-P11-AssetAuthor/1.0'}
sets.extend([('trackside-props','metal','metal_plate','2k'),('trackside-props','concrete','concrete_wall_006','2k')])
def get(url):
 for attempt in range(3):
  try:r=requests.get(url,headers=headers,timeout=180);r.raise_for_status();return r
  except requests.RequestException:
   if attempt==2:raise
   time.sleep(2**attempt)
def acquire(item):
 folder,prefix,asset,res=item;dest=OUT/folder;dest.mkdir(parents=True,exist_ok=True)
 info=get('https://api.polyhaven.com/info/'+asset).json();files=get('https://api.polyhaven.com/files/'+asset).json();records=[]
 for key,channel in [('Diffuse','baseColor'),('nor_gl','normal'),('arm','ORM'),('Displacement','height')]:
  f=files[key][res]['png'];p=dest/(prefix+'-'+channel+'.png')
  if not p.exists() or hashlib.md5(p.read_bytes()).hexdigest()!=f['md5']:
   print('Downloading',p.name,f['size'],flush=True);data=get(f['url']).content
   assert hashlib.md5(data).hexdigest()==f['md5'],p
   p.write_bytes(data)
  records.append({'file':p.name,'channel':channel,'transfer':'sRGB' if channel=='baseColor' else 'linear','normalConvention':'OpenGL +Y' if channel=='normal' else None,'packedChannels':'R occlusion / G roughness / B metallic' if channel=='ORM' else None,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size,'sourceURL':f['url']})
 record={'id':prefix,'sourceId':asset,'sourcePage':'https://polyhaven.com/a/'+asset,'license':'CC0-1.0','licenseURL':'https://polyhaven.com/license','authors':info['authors'],'sourceDimensionsMillimetres':info.get('dimensions'),'requestedResolution':res,'files':records,'notes':'Original matched scans, not AI-generated. Botanical/wood species are visual substitutes where source identity differs; source dimensions are retained for honest texel scale.'}
 (dest/(prefix+'-provenance.json')).write_text(json.dumps(record,indent=2), encoding="utf-8");return record
with ThreadPoolExecutor(max_workers=3) as pool:
 records=list(pool.map(acquire,sets))
(OUT/'material-library.json').write_text(json.dumps({'sets':records},indent=2), encoding="utf-8")
print('Verified',len(records),'native-resolution four-map PBR sets',flush=True)
