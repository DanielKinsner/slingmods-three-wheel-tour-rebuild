"""Read-only final material/export/preservation validation. Run in ordinary Python."""
import json,struct,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'public/assets/showcase-quality'; E=ROOT/'director-kit/production/evidence/P06B/artist'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def gltf(p):
 b=p.read_bytes();assert b[:4]==b'glTF';return json.loads(b[20:20+struct.unpack_from('<I',b,12)[0]])
manifest=json.loads((OUT/'source-manifest.json').read_text(encoding='utf-8'));records=manifest['assets'];checks=[]
for r in records:
 if 'originalPath' in r:assert sha(ROOT/r['originalPath'])==r['originalSHA256']
 p=ROOT/r.get('derivedPath',r.get('runtimePath'));assert sha(p)==r['derivedSHA256'];assert r['license']=='CC0-1.0'
 checks.append({'id':r['id'],'channel':r['channel'],'hashMatches':True})
assets={}
for path in [OUT/'foundation.glb',OUT/'kit.glb']:
 j=gltf(path);used={pr['material']for m in j['meshes']for pr in m['primitives']};photo=[]
 for i,m in enumerate(j['materials']):
  assert i in used,('unused material',m['name'])
  if m.get('extras',{}).get('sourceAsset'):
   assert m.get('normalTexture') and m.get('occlusionTexture') and m['pbrMetallicRoughness'].get('baseColorTexture') and m['pbrMetallicRoughness'].get('metallicRoughnessTexture'),m
   bindings=json.loads(m['extras']['bindingHashes'])
   for channel,hashvalue in bindings.items():assert hashvalue==sha(OUT/'textures'/(m['extras']['sourceAsset']+'_'+channel+'.jpg'))
   photo.append({'name':m['name'],'source':m['extras']['sourceAsset'],'tileMetres':m['extras']['physicalTileMetres'],'allFourBindingsActive':True})
 assets[path.name]={'SHA256':sha(path),'bytes':path.stat().st_size,'materials':len(j['materials']),'images':len(j['images']),'photoBindings':photo}
layout=json.loads((OUT/'scene-layout.json').read_text());assert layout['routeSHA256']==sha(ROOT/'public/assets/harbor/route.json')
kit=gltf(OUT/'kit.glb');names={n['name'].split('__')[0][4:]for n in kit['nodes']if n.get('name','').startswith('kit_')}
for item in layout['instances']:assert item['module'] in names,item
for i in range(3):
 for suffix in ['', '_mid','_far']:assert 'palm'+str(i)+suffix in names
report={'version':'P06B-assets','sourceRecordCount':len(checks),'sourceAndDerivedHashesVerified':True,'routeHashUnchanged':True,'activePhotoBindings':assets,'allLayoutModulesExist':True,'truePalmLODModules':True,'physicalProof':'foundation-preservation.json','limitations':'This checks files and bindings, not visual acceptance or hardware performance. GLB glTF normal tangents tested through runtime screenshots.'}
(E/'asset-validation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
