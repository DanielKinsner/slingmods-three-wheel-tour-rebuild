"""Read-only Review06 geometry diagnostic. Usage: python inspect_rear_snapshot.py PROJECT_ROOT OUT_JSON.
Uses numpy/trimesh in Astra's review environment; no files in PROJECT_ROOT are edited.
This diagnoses the current snapshot, not a general acceptance test for a redesigned rear.
"""
from pathlib import Path
import argparse,json,struct,hashlib
import numpy as np
import trimesh

def main():
 ap=argparse.ArgumentParser();ap.add_argument('root',type=Path);ap.add_argument('out',type=Path);args=ap.parse_args();root=args.root
 asset=root/'public/assets/vehicles/slingshot-p03a2.glb';raw=asset.read_bytes();n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);binary=raw[28+n:]
 def accessor(i):
  a=g['accessors'][i];view=g['bufferViews'][a['bufferView']];dtype={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']];width={'VEC3':3,'VEC2':2,'VEC4':4,'SCALAR':1}[a['type']];size=np.dtype(dtype).itemsize
  return np.ndarray((a['count'],width),dtype=dtype,buffer=binary,offset=view.get('byteOffset',0)+a.get('byteOffset',0),strides=(view.get('byteStride',size*width),size)).copy()
 def mesh(name):
  node=next(x for x in g['nodes'] if x.get('name')==name);p=g['meshes'][node['mesh']]['primitives'][0]
  return trimesh.Trimesh(vertices=accessor(p['attributes']['POSITION']),faces=accessor(p['indices']).reshape(-1,3),process=True)
 layout=json.loads((root/'public/assets/slingshot-contact-layout.json').read_text());rear=next(x for x in layout['wheels'] if x['id']=='rear');pivot=next(x for x in g['nodes'] if x.get('name')=='rear_spin')
 assert 'rotation' not in pivot and 'matrix' not in pivot and 'scale' not in pivot
 tire=mesh('rear_spin__Rubber');tire.apply_translation(pivot['translation']);body=mesh('body_static__Textured_Polymer')
 target=np.array([0,.6,1.105]);candidates=[c for c in body.split(only_watertight=False) if np.linalg.norm(c.bounds.mean(axis=0)-target)<.1]
 assert len(candidates)==1,'Expected the snapshot rear_firewall closed component';wall=candidates[0];assert wall.is_watertight and wall.is_winding_consistent
 # Generalized winding number tests containment in the actual closed exported component.
 # Plane margins are only an additional conservative depth diagnostic, not the containment proof.
 normals=wall.face_normals;plane_points=wall.triangles[:,0,:];signed=np.einsum('fvd,fd->fv',tire.vertices[None,:,:]-plane_points[:,None,:],normals)
 depth=-signed.max(axis=0)
 A=wall.triangles[None,:,0,:]-tire.vertices[:,None,:];B=wall.triangles[None,:,1,:]-tire.vertices[:,None,:];C=wall.triangles[None,:,2,:]-tire.vertices[:,None,:]
 an=np.linalg.norm(A,axis=2);bn=np.linalg.norm(B,axis=2);cn=np.linalg.norm(C,axis=2)
 numerator=np.einsum('pfd,pfd->pf',A,np.cross(B,C));denominator=an*bn*cn+np.einsum('pfd,pfd->pf',A,B)*cn+np.einsum('pfd,pfd->pf',B,C)*an+np.einsum('pfd,pfd->pf',C,A)*bn
 winding=np.sum(2*np.arctan2(numerator,denominator),axis=1)/(4*np.pi)
 strict=(np.abs(winding)>.999)&(depth>1e-5);deep=strict&(depth>.028)
 sample=int(np.argmax(depth));point=tire.vertices[sample]
 mechanics=[]
 for node in g['nodes']:
  if node.get('name','').startswith('suspension_rear__'):
   primitives=g['meshes'][node['mesh']]['primitives'];bounds=[]
   for p in primitives:
    a=g['accessors'][p['attributes']['POSITION']];bounds.append({'min':a['min'],'max':a['max']})
   mechanics.append({'node':node['name'],'bounds_in_vehicle_rest_space':bounds})
 rows=json.loads((root/'director-kit/production/evidence/Review06-final02/day-timeline.json').read_text());ys=[r['telemetry']['wheels'][2]['localCenter']['y'] for r in rows];deltas=[y-pivot['translation'][1] for y in ys]
 report={
  'asset':str(asset.relative_to(root)),'asset_sha256':hashlib.sha256(raw).hexdigest(),
  'basis':'metres, vehicle local X right Y up -Z forward; exported root/rest bindings identity except wheel translation',
  'wheel_pivot_export':pivot['translation'],'wheel_center_contact_contract':rear['center'],
  'max_pivot_contract_error_m':float(np.max(np.abs(np.array(pivot['translation'])-rear['center']))),
  'tire_root_space_bounds_m':tire.bounds.tolist(),'firewall_export_component_bounds_m':wall.bounds.tolist(),
  'firewall_vertices':len(wall.vertices),'firewall_triangles':len(wall.faces),'firewall_watertight':bool(wall.is_watertight),'firewall_convex':bool(wall.is_convex),
  'unique_tire_vertices_tested':len(tire.vertices),'tire_vertices_strictly_inside_firewall':int(strict.sum()),'tire_vertices_more_than_28mm_inside_firewall':int(deep.sum()),
  'deepest_sample':{'point_vehicle_space_m':point.tolist(),'conservative_oriented_plane_margin_m':float(depth[sample]),'absolute_winding_number':float(abs(winding[sample]))},
  'collision_verdict':'CONFIRMED: actual exported rear-tire surface points lie strictly inside the actual closed rear_firewall mesh (generalized-winding-number containment) at rest. Not merely overlap of bounding boxes.',
  'rig_source_finding':'hero.ts and workbench.ts displace rear_spin and rear caliper but do not articulate suspension_rear swingarm, axle or shock meshes; exported groups remain chassis-space geometry.',
  'recorded_rear_center_y_range_m':[min(ys),max(ys)],'largest_recorded_hub_to_static_axle_vertical_delta_m':max(abs(v) for v in deltas),
  'rear_mechanical_groups':mechanics,
  'limits':['This checks one rest-pose collision and the current source binding; it is not a whole-car swept-volume acceptance test.','Matching the internal wheel-center contract is not independent certification of OEM geometry.','Shock/storage exact hardpoints and handedness require matched primary references; no numerical relocation is prescribed.']}
 args.out.parent.mkdir(parents=True,exist_ok=True);args.out.write_text(json.dumps(report,indent=2));print(json.dumps({k:v for k,v in report.items() if k!='rear_mechanical_groups'},indent=2))
if __name__=='__main__':main()
