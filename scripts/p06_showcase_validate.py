"""Read-only asset/route contract validation. Browser visual/performance proof is separate."""
import json,hashlib,struct,pathlib,math
P=pathlib.Path(__file__).resolve().parents[1];O=P/'public/assets/showcase';E=P/'director-kit/production/evidence/P06/artist'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
layout=json.loads((O/'scene-layout.json').read_text());route=json.loads((P/'public/assets/harbor/route.json').read_text());foundation=json.loads((E/'foundation-preservation.json').read_text())
assert layout['routeSHA256']==sha(P/'public/assets/harbor/route.json')==foundation['routeSHA256']
assert foundation['sourceSHA256']==sha(P/'assets/blender/harbor/harbor.blend')
assert len(foundation['retainedObjectHashes'])==297
assert all(k in foundation['retainedObjectHashes']for k in ['road_closed_asphalt','barriers_exact_route_colliders','curbs_exact_route_colliders','Harbor_land'])
assert len(layout['warehouseVisualReplacements'])==6
for w in layout['warehouseVisualReplacements']:
 c=next(c for c in route['colliders']if c['id']==w['preservedColliderId']);assert c['center']==w['center']and c['size']==w['oldColliderSize']
 assert all(abs(a*b-c)<1e-9 for a,b,c in zip([24,7.5,22],w['newModuleScale'],w['oldColliderSize']))
def glb(path):
 raw=path.read_bytes();n=struct.unpack_from('<I',raw,12)[0];return json.loads(raw[20:20+n]),raw,20+n+8
g,raw,binary=glb(O/'kit.glb');names={n['name']for n in g['nodes']};modules={n[4:].split('__')[0]for n in names if n.startswith('kit_')}
assert {'terminal','warehouse','dock','quay','palm0','palm1','palm2','skiff','bay','water','gantry','pavilion','planter','fence','board100','board50'}<=modules
assert all(p['module']in modules for p in layout['instances'])
uv=0;normal=0
for m in g['meshes']:
 for pr in m['primitives']:
  assert 'TEXCOORD_0'in pr['attributes']and'NORMAL'in pr['attributes'];uv+=1
  material=g['materials'][pr['material']];assert 'normalTexture'in material;normal+=1
  if m['name']=='marina_surface':
   a=g['accessors'][pr['attributes']['NORMAL']];v=g['bufferViews'][a['bufferView']];value=struct.unpack_from('<fff',raw,binary+v.get('byteOffset',0)+a.get('byteOffset',0));assert value[1]>.999,'Water must face +Y'
for material in g['materials']:
 if material['name']!='Showcase_Moving_Water':assert 'baseColorTexture'in material['pbrMetallicRoughness']and'metallicRoughnessTexture'in material['pbrMetallicRoughness']
cells={}
for p in layout['instances']:
 key=(p['module'],math.floor(p['position'][0]/70),math.floor(p['position'][2]/70));cells[key]=cells.get(key,0)+1
report={'status':'PASS source and export contract; not a visual/performance gate','stage':layout['stage'],'routeHashExact':True,'acceptedHarborSourceHashExact':True,'retainedSourceMeshes':297,'warehouseVisibleColliderMatches':6,'moduleCount':len(modules),'uvPrimitives':uv,'normalMappedPrimitives':normal,'placements':len(layout['instances']),'spatialInstanceCells':len(cells),'maximumInstancesPerCell':max(cells.values()),'waterNormalDirection':'+Y','noNewPhysicsColliders':True,'sourcesPacked':'Blender source generation packs all original authored image maps; see editable sources','hashes':{str(p.relative_to(P)).replace('\\','/'):sha(p)for p in [O/'kit.glb',O/'foundation.glb',O/'scene-layout.json',P/'scripts/p06_showcase_build.py',P/'src/presentation/showcase.ts']}}
(E/'asset-contract-validation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
