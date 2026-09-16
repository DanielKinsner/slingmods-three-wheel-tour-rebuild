"""Scenic land triangulation tied to exact physical-bank boundary vertices.
Python 3.13 + numpy/scipy pinned in p10a-art-requirements.txt. No scene support plane.
"""
import json,math
import numpy as np
from scipy.spatial import Delaunay
from pathlib import Path
root=Path(__file__).resolve().parents[1];source=json.loads((root/'assets/blender/ridge/ridge-authoritative-surfaces.json').read_text(encoding='utf-8'));route=source['route'];p=np.array(route['centerline']);n=np.roll(p,-1,axis=0);d=n-p;l=np.linalg.norm(d,axis=1);stations=np.array(source['stations']);e=np.array(route['elevations']);en=np.roll(e,-1)
def project(x,z):
 q=np.array([x,z]);t=np.clip(np.sum((q-p)*d,axis=1)/l**2,0,1);pts=p+d*t[:,None];dist=np.linalg.norm(q-pts,axis=1);i=int(np.argmin(dist));return float(dist[i]),float(stations[i]+l[i]*t[i]),float(e[i]+(en[i]-e[i])*t[i]),float(np.dot(q-pts[i],[-d[i,1]/l[i],d[i,0]/l[i]]))
def height(x,z):
 dist,s,y,offset=project(x,z);ad=min(60,abs(offset));fade=min(1,max(0,(ad-9)/35));bank=math.sin(s/3200*math.pi*4)*.55+(.45 if offset>0 else-.45);near=y-.075+fade*(ad-9)*bank*.47+math.sin(s*.035)*fade*1.3;far=-25+50*math.exp(-((x-400)/600)**2-((z+750)/900)**2)+12*math.sin(x*.006)*math.cos(z*.006);blend=max(0,min(1,(dist-60)/160));blend=blend*blend*(3-2*blend);return near*(1-blend)+far*blend

verts=[]
for j in [0,5]:
 v=source['surfaces']['terrain'][j]['vertices'];column=0 if j==0 else 1
 for i in range(len(p)):verts.append(v[i*6+column*3:i*6+column*3+3])
for x in range(-440,1150,24):
 for z in range(-1400,601,24):
  if project(x,z)[0]>83:verts.append([x,height(x,z),z])
xy=np.array([[v[0],v[2]]for v in verts]);tri=Delaunay(xy);faces=[]
for face in tri.simplices:
 a,b,c=xy[face];checks=[(a+b+c)/3,(a+b)/2,(b+c)/2,(c+a)/2]
 if any(project(*q)[0]<58.5 for q in checks):continue
 # XZ positive signed area is downward in Y-up coordinates.
 cross=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);f=face.tolist();faces.extend(f[::-1]if cross>0 else f)
out={'vertices':[round(x,6)for v in verts for x in v],'indices':faces,'uv':[round(x/9,6)for v in verts for x in[v[0],v[2]]],'source':'scripts/author-p10a-land.py; exact bank boundary, scenic beyond60m; no collider'}
path=root/'public/assets/ridge/ridge-land.json';path.write_text(json.dumps(out,separators=(',',':')),encoding='utf-8');print(path,len(verts),'vertices',len(faces)//3,'triangles')
