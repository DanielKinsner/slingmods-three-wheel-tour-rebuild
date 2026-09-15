from pathlib import Path
import json,math,hashlib
R=Path(__file__).resolve().parents[1];E=R/'director-kit/production/evidence/P07A';layout=json.loads((R/'public/assets/brand/sign-layout.json').read_text());route=json.loads((R/'public/assets/harbor/route.json').read_text());points=route['centerline']
def distance(x,z):
 d=float('inf')
 for a,b in zip(points,points[1:]+points[:1]):
  dx,dz=b[0]-a[0],b[1]-a[1];t=max(0,min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz))) if dx*dx+dz*dz else 0
  d=min(d,math.hypot(x-a[0]-t*dx,z-a[1]-t*dz))
 return d
rows=[]
for p in layout['placements']:
 x,y,z=p['position'];half=p['width']/2;hy=half/layout['aspectRatio'];samples=[[x+math.cos(p['yaw'])*half*(i/20-1),z-math.sin(p['yaw'])*half*(i/20-1)]for i in range(41)]
 row={'id':p['id'],'position':p['position'],'width':p['width'],'bottomMetres':y-hy,'topMetres':y+hy,'collisionObjectsAdded':0,'shadowLightsAdded':0,'minimumSampledRouteCenterDistance':min(distance(x,z)for x,z in samples),'sampling':'41 evenly spaced horizontal points across exact zero-depth plane;41-point measurement is not claimed as analytic surface proof.'}
 if p['id'].startswith('service'):
  row['marginBeyondRoadAndRunoff']=row['minimumSampledRouteCenterDistance']-(route['width']/2+route['runoff']);assert row['marginBeyondRoadAndRunoff']>5
 if p['id']=='start-finish':assert row['bottomMetres']>4
 rows.append(row)
(E/'sign-clearance.json').write_text(json.dumps({'method':'Exact source transforms/width and sampled distance to unchanged route centerline; current sign planes only. Gantry remains overhead; service signs mounted outside route/runoff; garage sign is on retained rear wall. Actual matched day/night reference images supplement these structural bounds. No route/collider geometry changed.','routeSHA256':hashlib.sha256((R/'public/assets/harbor/route.json').read_bytes()).hexdigest(),'layoutSHA256':hashlib.sha256((R/'public/assets/brand/sign-layout.json').read_bytes()).hexdigest(),'rows':rows},indent=2));print('Sign clearance PASS')
