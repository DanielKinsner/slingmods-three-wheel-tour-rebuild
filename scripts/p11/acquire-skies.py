"""Acquire original CC0 HDR radiance, with upstream MD5 and local SHA-256 receipts."""
from pathlib import Path
import requests,hashlib,json,time
OUT=Path(__file__).resolve().parents[2]/'public/assets/p11/skies'
OUT.mkdir(parents=True,exist_ok=True)
session=requests.Session();session.headers['User-Agent']='SlingMods-P11-AssetAuthor/1.0'
choices={'golden-hour':'qwantani_sunset_puresky','dusk':'qwantani_dusk_1_puresky','clear-night':'qwantani_moonrise_puresky','after-rain':'kloofendal_38d_partly_cloudy_puresky','marine-layer':'kloofendal_overcast_puresky'}
records=[]
for name,asset in choices.items():
 r=session.get('https://api.polyhaven.com/files/'+asset,timeout=90);r.raise_for_status();files=r.json()
 r=session.get('https://api.polyhaven.com/info/'+asset,timeout=90);r.raise_for_status();info=r.json()
 for resolution in ['8k','1k']:
  f=files['hdri'][resolution]['hdr'];p=OUT/(name+'-'+resolution+'.hdr')
  if not p.exists() or hashlib.md5(p.read_bytes()).hexdigest()!=f['md5']:
   print('Downloading',name,resolution,f['size'],flush=True)
   with session.get(f['url'],stream=True,timeout=180) as response:
    response.raise_for_status()
    with p.with_suffix('.part').open('wb') as target:
     for block in response.iter_content(1024*1024):target.write(block)
   p.with_suffix('.part').replace(p)
  assert hashlib.md5(p.read_bytes()).hexdigest()==f['md5'],p
  records.append({'preset':name,'file':p.name,'source':asset,'sourceURL':f['url'],'assetPage':'https://polyhaven.com/a/'+asset,'license':'CC0-1.0','licenseURL':'https://polyhaven.com/license','authors':info['authors'],'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size,'resolution':resolution,'prefiltered':False,'note':'Original equirectangular radiance. 1K is an input for runtime PMREM, not a prefiltered environment.'})
  (OUT/'provenance.json').write_text(json.dumps({'files':records,'selectionNotes':'Sky-only CC0 photographic candidates; not photographs of Southern California. Exact requested cloud formation, sun elevation and matching rig remain subject to inspection.'},indent=2), encoding="utf-8")
(OUT/'README.md').write_text('Equirectangular HDR radiance: backgrounds 8192x4096 (22.76 px/degree), lighting inputs 1024x512; CC0 provenance included; PMREM prefilter and rig calibration pending.\n', encoding="utf-8")
print('Verified all ten HDR files',flush=True)
