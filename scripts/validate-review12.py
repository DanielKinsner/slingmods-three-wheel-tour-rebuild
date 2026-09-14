from pathlib import Path
import json,hashlib,struct,datetime
root=Path.cwd();base=root/'director-kit/production/evidence/P06B';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
baseline=json.loads((base/'baseline.json').read_text(encoding='utf-8'))
checks=[{'path':n,'before':h,'after':sha(root/n),'identical':sha(root/n)==h}for n,h in baseline['physicalAndGameInputs'].items()]
assert all(r['identical']for r in checks),'Protected physical/game input changed'
assets=root/'public/assets/showcase-quality';manifest=json.loads((assets/'source-manifest.json').read_text(encoding='utf-8'));sources=[]
for a in manifest['assets']:
 original=root/Path(a.get('originalPath',a.get('runtimePath')).replace('\\','/'));derived=root/Path(a.get('derivedPath',a.get('runtimePath')).replace('\\','/'));assert sha(original)==a['originalSHA256'];assert sha(derived)==a['derivedSHA256'];assert a['license']=='CC0-1.0';sources.append({'id':a['id'],'channel':a.get('channel'),'originalSHA256':sha(original),'derivedSHA256':sha(derived)})
exports=[]
for path in assets.glob('*.glb'):
 b=path.read_bytes();assert b[:4]==b'glTF';g=json.loads(b[20:20+struct.unpack_from('<I',b,12)[0]]);used={p['material']for m in g['meshes']for p in m['primitives']};materials=[]
 for i in used:
  m=g['materials'][i]
  if m.get('extras',{}).get('sourceAsset'):
   assert m['pbrMetallicRoughness'].get('baseColorTexture'),m['name'];assert m.get('normalTexture'),m['name'];assert m.get('occlusionTexture'),m['name'];assert m['pbrMetallicRoughness'].get('metallicRoughnessTexture'),m['name']
   materials.append({'name':m['name'],'source':m['extras'],'binding':m})
 for image in g.get('images',[]):assert 'bufferView'in image and 'uri'not in image,'Runtime maps must be packed'
 for mesh in g['meshes']:
  for p in mesh['primitives']:
   if g['materials'][p['material']].get('extras',{}).get('sourceAsset'):assert 'TEXCOORD_0'in p['attributes']
 exports.append({'path':str(path.relative_to(root)),'sha256':sha(path),'activePhotoMaterials':materials,'embeddedImages':len(g.get('images',[]))})
layout=json.loads((assets/'scene-layout.json').read_text(encoding='utf-8'));assert layout['routeSHA256']==sha(root/'public/assets/harbor/route.json')
route=json.loads((root/'public/assets/harbor/route.json').read_text(encoding='utf-8'))
for v in layout['warehouseVisualReplacements']:assert any(c['center']==v['center']and c['size']==v['oldColliderSize']for c in route['colliders'])
result={'created':datetime.datetime.now(datetime.timezone.utc).isoformat(),'physicalAndGameInputs':checks,'sourceRightsAndHashes':sources,'actualExportBindings':exports,'routeBytesUnchanged':True,'warehouseBoundsMatch':True,'visualApproval':False,'note':'Byte/graph integrity proves preserved systems and real material bindings, not artistic quality. See runtime images and scoped art review.'}
(base/'preservation-final.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print('Protected',len(checks),'source records',len(sources),'GLB bindings',len(exports),'PASS')
