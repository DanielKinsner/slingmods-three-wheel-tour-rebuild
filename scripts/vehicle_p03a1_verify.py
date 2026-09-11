"""Bounded actual GLB validation; visual approval remains independent."""
import pathlib,struct,json,hashlib,subprocess,importlib.util
P=pathlib.Path(__file__).resolve().parents[1];E=P/'director-kit/production/evidence/P03A1/artist'
def read(path):
 d=path.read_bytes();assert struct.unpack_from('<I',d,8)[0]==len(d);return json.loads(d[20:20+struct.unpack_from('<I',d,12)[0]])
a=read(P/'public/assets/vehicles/slingshot-p03a.glb');b=read(P/'public/assets/vehicles/slingshot-p03a1.glb')
aa={n['name']:n for n in a['nodes']};bb={n['name']:n for n in b['nodes']}
protected=[n for n in aa if n in ['vehicle_root','front_left_steer','front_left_spin','front_right_steer','front_right_spin','rear_spin','steering_control']or n.startswith(('mount_','camera_','rider_'))]
for n in protected:
 assert n in bb,n
 for k in ['translation','rotation','scale']:assert aa[n].get(k)==bb[n].get(k),(n,k)
assert 'suspension_rear__Brake_Caliper' in bb
prims=[p for m in b['meshes']for p in m['primitives']];tris=sum(b['accessors'][p['indices']]['count']//3 for p in prims)
assert tris<=250000 and len(prims)<=70
for p in prims:
 assert 'TEXCOORD_0' in p['attributes']
 mat=b['materials'][p['material']];pbr=mat.get('pbrMetallicRoughness',{})
 for tex in [pbr.get('baseColorTexture'),pbr.get('metallicRoughnessTexture'),mat.get('normalTexture')]:
  if tex:assert 'TEXCOORD_'+str(tex.get('texCoord',0)) in p['attributes'],mat['name']
preserved=[]
for f in ['assets/blender/vehicles/slingshot-p01.blend','assets/blender/vehicles/slingshot-p03a.blend','public/assets/vehicles/slingshot.glb','public/assets/vehicles/slingshot-p03a.glb','public/assets/slingshot-contact-layout.json']:
 cur=subprocess.check_output(['git','hash-object',f],cwd=P,text=True).strip();old=subprocess.check_output(['git','rev-parse','HEAD:'+f],cwd=P,text=True).strip();assert cur==old,f;preserved.append({'file':f,'blob':cur})
sp=importlib.util.spec_from_file_location('census',P/'scripts/report-p03a-asset.py');mod=importlib.util.module_from_spec(sp);sp.loader.exec_module(mod);whole=mod.inspect(P/'public/assets/vehicles/slingshot-p03a1.glb')
files={f:{'bytes':(P/f).stat().st_size,'sha256':hashlib.sha256((P/f).read_bytes()).hexdigest()}for f in ['assets/blender/vehicles/slingshot-p03a1.blend','public/assets/vehicles/slingshot-p03a1.glb','scripts/vehicle_p03a1_build.py','scripts/vehicle_p03a1_materials.py']}
r={'status':'PASS structural only','protectedTransforms':protected,'baselineBlobsPreserved':preserved,'worldBounds':whole['bounds'],'triangles':tris,'primitives':len(prims),'materials':len(b['materials']),'embeddedImages':len(b.get('images',[])),'uv0All':True,'textureChannelsHaveUV':True,'files':files,'limits':['No visual acceptance by census','Contact model unchanged; small visual body-envelope changes permitted by Astra','No hardware FPS or racing LOD claim']}
(E/'export-validation.json').write_text(json.dumps(r,indent=2));print(json.dumps(r,indent=2))
