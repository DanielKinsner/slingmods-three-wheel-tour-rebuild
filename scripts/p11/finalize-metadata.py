from pathlib import Path
import json,math,hashlib
from PIL import Image
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'public/assets/p11'
rigfile=OUT/'skies/lighting-rigs.json';doc=json.loads(rigfile.read_text(encoding="utf-8"))
for r in doc['rigs']:
 red,green,blue=r['colorLinear'];X=.4124*red+.3576*green+.1805*blue;Y=.2126*red+.7152*green+.0722*blue;Z=.0193*red+.1192*green+.9505*blue
 x=X/(X+Y+Z);y=Y/(X+Y+Z);n=(x-.3320)/(y-.1858) if abs(y-.1858)>.0001 else 0
 cct=-449*n**3+3525*n*n-6823.3*n+5520.33
 r['colorTemperatureKelvin']=round(max(1500,min(25000,cct)));r['temperatureMethod']='Approximate McCamy CCT from measured source RGB assuming linear sRGB primaries; not calibrated photometry.'
 r['elevationDegrees']=math.degrees(math.asin(r['direction'][1]));r['lightKind']='moon' if r['preset']=='clear-night' else 'dominant sky' if r['preset'] in ['dusk','marine-layer'] else 'sun'
 r['suggestedDirectionalIntensity']={'golden-hour':3.2,'dusk':.15,'clear-night':.08,'after-rain':2.2,'marine-layer':.25}[r['preset']]
 r['intensityNote']='Art-direction starting value for Three.js; scene exposure and retained HDR sun energy require integration review.'
doc['notes']='Source-matched measured directions/colors, estimated Kelvin and suggested intensity. Golden-hour source sun elevation is measured, not guaranteed 8 degrees. Prefilters are genuine Three.js CubeUV EXRs with 1024px atlas height.'
rigfile.write_text(json.dumps(doc,indent=2), encoding="utf-8")
(OUT/'skies/README.md').write_text('8K equirectangular HDR skies (22.76px/degree), 1K inputs and genuine 768×1024 CubeUV PMREM EXRs; CC0 provenance; measured directions/colors plus estimated Kelvin and suggested rig intensity; source sun elevation differs from exact 8° brief.\n', encoding="utf-8")
for p in [OUT/'models.json',OUT/'ridge-trees/trees.json']:
 d=json.loads(p.read_text(encoding="utf-8"));d['pending']=['In-game visual, performance and distance-readability review; use supplied runtime helpers.'];p.write_text(json.dumps(d,indent=2), encoding="utf-8")
p=OUT/'wooden-sign/logo-bounds.json';d=json.loads(p.read_text(encoding="utf-8"));d['pending']='Runtime scenery wiring/re-export is separate because another task is changing the existing signs.';d['paintFinish']='Derived paint-on-grain texture with sparse flaking, original logo untouched';p.write_text(json.dumps(d,indent=2), encoding="utf-8")
(OUT/'wooden-sign/README.md').write_text('Board 2.4m×0.9m / five planks / 2K weathered-wood PBR; painted and 3mm routed variants with 2 LODs; grain/flaking derivative preserves original logo; tested ≥12% padding; existing scenery integration remains separate.\n', encoding="utf-8")
(OUT/'harbor-water/README.md').write_text('Swell 2048²/16m = 128px/m; chop 2048²/2m = 1024px/m; foam 1024²; caustics 512²; LUT 256×1; create-material.mjs uses same-camera opaque depth and a CubeTexture; in-game shoreline/night calibration remains.\n', encoding="utf-8")
# Full immutable-by-hash asset index; generated sources remain distinguishable.
groups=[('race-asphalt','01'),('road-decals','02'),('harbor-water','03'),('ridge-trees','04'),('ground-cover','05'),('trackside-props','06'),('wooden-sign','07'),('ui-hud','08'),('vfx','09'),('skies','10'),('points-token','11')]
assets=[]
for p in sorted(OUT.rglob('*')):
 if not p.is_file() or p.name=='manifest.json':continue
 data=p.read_bytes();item={'path':p.relative_to(OUT).as_posix(),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
 if p.suffix=='.png':
  with Image.open(p)as im:item.update({'pixels':list(im.size),'mode':im.mode})
  item['ktx2']=p.with_suffix('.ktx2').relative_to(OUT).as_posix() if p.with_suffix('.ktx2').exists() else None
 assets.append(item)
manifest={'schemaVersion':1,'stage':'Authored asset pack; integration and visual acceptance pending','assetRoot':'/assets/p11/','sourceRequest':'assets/p11/REQUEST.md','kits':[{'prompt':number,'directory':name,'files':sum(a['path'].startswith(name+'/') for a in assets)} for name,number in groups],'assets':assets,'preservation':'Historical asset directories and current game scene code were not changed by this task.','generatedAtlasResolution':'1254px AI sources retained; 4096px runtime atlases are disclosed Lanczos resamples, not native generated 4K detail.','licensing':'Original authored models/code, CC0 Poly Haven scans/skies, SIL OFL Barlow Condensed, original proprietary SlingMods artwork.'}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2), encoding="utf-8");print('Indexed',len(assets),'files;',sum(a['bytes'] for a in assets),'bytes')
