"""Current P06C integrity report; never writes historical evidence."""
from pathlib import Path
import json, hashlib, struct
ROOT=Path(__file__).resolve().parents[1];E=ROOT/'director-kit/production/evidence/P06C';A=ROOT/'public/assets/showcase-quality'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
baseline=json.loads((E/'baseline.json').read_text())
protected=[dict(path=p,identical=sha(ROOT/p)==h,sha256=sha(ROOT/p)) for p,h in baseline['protected'].items()]
assert all(p['identical'] for p in protected),[p for p in protected if not p['identical']]
sources=json.loads((A/'source-manifest.json').read_text())['assets']
for s in sources:
 assert s['license']=='CC0-1.0'
 for key,h in [('originalPath','originalSHA256'),('derivedPath','derivedSHA256')]:
  assert sha(ROOT/s.get(key,s.get('runtimePath')))==s[h]
road=json.loads((A/'p06c-road-provenance.json').read_text())
for c in road['channels']:
 assert sha(ROOT/c['original'])==c['originalSHA256'] and sha(ROOT/c['derived'])==c['derivedSHA256']
exports={}
for filename in ['foundation.glb','kit.glb']:
 b=(A/filename).read_bytes();g=json.loads(b[20:20+struct.unpack_from('<I',b,12)[0]])
 for image in g['images']:assert 'bufferView' in image and 'uri' not in image
 for mesh in g['meshes']:
  for p in mesh['primitives']:
   m=g['materials'][p['material']]
   if m.get('extras',{}).get('sourceAsset'):
    assert 'TEXCOORD_0' in p['attributes']
    assert m.get('normalTexture') and m.get('occlusionTexture') and m['pbrMetallicRoughness'].get('baseColorTexture') and m['pbrMetallicRoughness'].get('metallicRoughnessTexture')
 for m in g['materials']:
  if m['name']=='Quality_Leaflets':assert m.get('alphaMode','OPAQUE')=='OPAQUE' and m.get('doubleSided')
  if m['name']=='P06C_Palm_Frond':assert m['alphaMode']=='MASK' and abs(m['alphaCutoff']-.35)<1e-6 and m['doubleSided'] and m['pbrMetallicRoughness']['baseColorTexture']
 counts={}
 for n in g['nodes']:
  if n.get('name','').startswith('kit_') and 'mesh' in n:
   name=n['name'][4:].split('__')[0];counts[name]=counts.get(name,0)+sum(g['accessors'][p['indices']]['count']//3 for p in g['meshes'][n['mesh']]['primitives'])
 exports[filename]=dict(sha256=sha(A/filename),bytes=len(b),primitives=sum(len(m['primitives']) for m in g['meshes']),moduleTriangles=counts)
 if filename=='foundation.glb':
  asphalt=[p for m in g['meshes'] for p in m['primitives'] if g['materials'][p['material']]['name']=='Quality_Dry_Asphalt']
  assert asphalt and all('COLOR_0' in p['attributes'] for p in asphalt),'Authored road tone must actually export'
layout=json.loads((A/'scene-layout.json').read_text());assert layout['routeSHA256']==sha(ROOT/'public/assets/harbor/route.json')
for p in layout['instances']:assert p['module'] in exports['kit.glb']['moduleTriangles'],p
for n in ['palm0','palm1','palm2']:
 sizes=[exports['kit.glb']['moduleTriangles'][m] for m in layout['lod'][n]];assert sizes[0]>sizes[1]>sizes[2]>100,sizes
report=dict(baselineCommit=baseline['commit'],protected=protected,sourceRecordsVerified=len(sources),newRoadChannelsVerified=road,exports=exports,routeBytesUnchanged=True,visualApproval=False)
(E/'integrity.json').write_text(json.dumps(report,indent=2));print('P06C integrity PASS:',len(protected),'protected paths,',len(sources),'source records, all channels and module LODs')
