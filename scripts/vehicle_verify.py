"""Inspect actual GLB contracts and hashes without Blender/renderer assumptions."""
import pathlib,json,struct,hashlib,math
P=pathlib.Path(__file__).resolve().parents[1]; evidence=P/'director-kit/production/evidence/G1'
def glb(path):
 data=path.read_bytes(); magic,version,length=struct.unpack_from('<III',data);assert magic==0x46546c67 and version==2 and length==len(data)
 n,kind=struct.unpack_from('<II',data,12);assert kind==0x4e4f534a
 return json.loads(data[20:20+n])
j=glb(P/'public/assets/vehicles/slingshot.glb'); nodes={n['name']:n for n in j['nodes']}; indices={n['name']:i for i,n in enumerate(j['nodes'])}
layout=json.loads((P/'public/assets/slingshot-contact-layout.json').read_text())
checks=[]
for n in ['vehicle_root','front_left_steer','front_left_spin','front_right_steer','front_right_spin','rear_spin']:
 node=nodes[n];assert node.get('rotation',[0,0,0,1])==[0,0,0,1];assert node.get('scale',[1,1,1])==[1,1,1];checks.append(n+' identity rotation and scale')
for w in layout['wheels']:
 n=w['id']+('_steer' if w['steer'] else '_spin'); actual=nodes[n]['translation'];assert all(abs(a-b)<1e-6 for a,b in zip(actual,w['center']));checks.append(n+' center matches shared layout < 1 micrometer')
 if w['steer']:
  assert indices[w['id']+'_spin'] in nodes[n]['children']; assert nodes[w['id']+'_spin'].get('translation',[0,0,0])==[0,0,0]
for n in ['body_static','cockpit','steering_control','mount_exhaust','mount_suspension_front_left','mount_suspension_front_right','mount_suspension_rear','mount_underglow_left','mount_underglow_right','camera_cockpit','camera_nose','rider_seat','rider_hand_left','rider_hand_right','rider_foot_left','rider_foot_right']: assert n in nodes
assert not j.get('images');checks.append('No reference images embedded in GLB')
asset=json.loads((evidence/'asset-manifest.json').read_text())
for dim in ['width','length','height']:assert abs(asset['dimensions_m'][dim]/layout[dim]-1)<.01
checks.append('Evaluated Blender bounds within proposed 1 percent of published dimensions')
blocks=glb(P/'public/assets/vehicles/scale-blockouts.glb');assert len([n for n in blocks['nodes'] if n.get('name','').endswith('_blockout')])==3
hashes={str(p.relative_to(P)).replace('\\','/'):{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in [P/'assets/blender/vehicles/slingshot-p01.blend',P/'assets/blender/vehicles/vehicles-scale-blockouts.blend',P/'public/assets/vehicles/slingshot.glb',P/'public/assets/vehicles/scale-blockouts.glb',P/'scripts/vehicle_build.py',P/'public/assets/slingshot-contact-layout.json']}
(evidence/'asset-contract-check.json').write_text(json.dumps({'status':'PASS numerical source/export contract checks only','checks':checks,'runtimeVisualApproval':'separate reviewer required','files':hashes},indent=2))
print(json.dumps({'status':'PASS','checks':len(checks),'files':hashes},indent=2))
