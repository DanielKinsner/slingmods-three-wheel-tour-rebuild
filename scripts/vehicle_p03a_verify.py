"""Validate actual candidate GLB hierarchy, UV coverage, primitive census and baseline preservation."""
import pathlib,struct,json,hashlib,subprocess,importlib.util,math
P=pathlib.Path(__file__).resolve().parents[1];E=P/'director-kit/production/evidence/P03A/artist'
def load(path):
 data=path.read_bytes();magic,ver,n=struct.unpack_from('<III',data);assert magic==0x46546c67 and ver==2 and n==len(data);size,kind=struct.unpack_from('<II',data,12);assert kind==0x4e4f534a;return json.loads(data[20:20+size])
base=load(P/'public/assets/vehicles/slingshot.glb');j=load(P/'public/assets/vehicles/slingshot-p03a.glb');b={n['name']:n for n in base['nodes']};nodes={n['name']:n for n in j['nodes']}
layout=json.loads((P/'public/assets/slingshot-contact-layout.json').read_text());checks=[]
for name in ['vehicle_root','front_left_steer','front_left_spin','front_right_steer','front_right_spin','rear_spin']:
 n=nodes[name]
 for key,default in [('translation',[0,0,0]),('rotation',[0,0,0,1]),('scale',[1,1,1])]:assert n.get(key,default)==b[name].get(key,default),(name,key,n)
 checks.append(name+' transform preserved')
for name in b:
 if name.startswith(('mount_','camera_','rider_')):
  assert name in nodes
  for key,default in [('translation',[0,0,0]),('rotation',[0,0,0,1]),('scale',[1,1,1])]:assert nodes[name].get(key,default)==b[name].get(key,default)
checks.append('All original named mounts, camera and rider contact transforms retained')
prims=[p for m in j['meshes'] for p in m['primitives']];tris=sum(j['accessors'][p['indices']]['count']//3 for p in prims)
assert all('TEXCOORD_0' in p['attributes'] for p in prims);assert len(prims)<=70
checks.extend(['Every exported primitive contains UV0','Hero color primitive target <= 70 met'])
mapped=bool(j.get('images'))
material_channels=[]
if mapped:
 for prim in prims:
  mat=j['materials'][prim['material']];pbr=mat.get('pbrMetallicRoughness',{})
  for role,info in [('basecolor',pbr.get('baseColorTexture')),('metallicRoughness',pbr.get('metallicRoughnessTexture')),('normal',mat.get('normalTexture'))]:
   if info:
    coord='TEXCOORD_'+str(info.get('texCoord',0));assert coord in prim['attributes'],(mat['name'],role,coord)
    assert info['index']<len(j['textures']);material_channels.append({'material':mat['name'],'role':role,'uv':coord})
 for name in ['Radar_Blue','Rubber','Seat_Charcoal','Textured_Polymer','Machined_Aluminum']:
  mat=next(m for m in j['materials'] if m['name']=='P03A_'+name)
  assert all(k in mat['pbrMetallicRoughness'] for k in ['baseColorTexture','metallicRoughnessTexture']) and 'normalTexture' in mat,name
 assert 'KHR_materials_clearcoat' in j.get('extensionsUsed',[])
 assert any(m.get('alphaMode')=='BLEND' and 'Wind_Deflector' in m['name'] for m in j['materials'])
 checks.extend(['All five primary mapped materials export basecolor, metallic-roughness and tangent-space normal channels','Each texture channel references an exported UV set','Transparent windshield and clearcoat paint serialized'])
spec=importlib.util.spec_from_file_location('readonly_census',P/'scripts/report-p03a-asset.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
whole=mod.inspect(P/'public/assets/vehicles/slingshot-p03a.glb');prior=mod.inspect(P/'public/assets/vehicles/slingshot.glb')
assert all(abs(a/b-1)<.01 for a,b in zip(whole['bounds']['size'],prior['bounds']['size'])),whole['bounds']
checks.append('Whole exported GLB world bounds within 1 percent of accepted P01')
preserved=[]
for p in ['assets/blender/vehicles/slingshot-p01.blend','public/assets/vehicles/slingshot.glb','public/assets/slingshot-contact-layout.json']:
 current=subprocess.check_output(['git','hash-object',p],cwd=P,text=True).strip();tracked=subprocess.check_output(['git','rev-parse','HEAD:'+p],cwd=P,text=True).strip();assert current==tracked,p;preserved.append({'file':p,'gitBlob':current})
files={str(p.relative_to(P)).replace('\\','/'):{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in [P/'assets/blender/vehicles/slingshot-p03a.blend',P/'public/assets/vehicles/slingshot-p03a.glb',P/'scripts/vehicle_p03a_build.py',P/'scripts/vehicle_p03a_materials.py']}
r={'status':'PASS structural checks only','checks':checks,'wholeExportedWorldBounds':whole['bounds'],'primitives':len(prims),'triangles':tris,'materials':len(j.get('materials',[])),'images':len(j.get('images',[])),'uv0_primitives':sum('TEXCOORD_0' in p['attributes'] for p in prims),'preserved_baselines':preserved,'files':files,'extensions':j.get('extensionsUsed',[]),'runtimeAestheticApproval':'required separately'}
r['mappedMaterialChannels']=material_channels
(E/'export-validation.json').write_text(json.dumps(r,indent=2));print(json.dumps(r,indent=2))
