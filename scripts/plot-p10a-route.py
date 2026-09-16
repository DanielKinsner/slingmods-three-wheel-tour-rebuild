"""Plot measured authoritative station geometry, not a fabricated trajectory."""
import json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection
import numpy as np
root=Path(__file__).resolve().parents[1]/'director-kit/production/evidence/P10A';r=json.loads((root/'geometry-final-02/measurements.json').read_text(encoding='utf-8'));s=r['segments'];xyz=np.array([v['start']for v in s]);distance=np.array([v['station']for v in s]);grade=np.array([v['grade']for v in s])*100
fig,(a,b)=plt.subplots(1,2,figsize=(11,5),layout='constrained',gridspec_kw={'width_ratios':[1,1.6]});xy=xyz[:,[0,2]];segments=np.stack([xy,np.roll(xy,-1,axis=0)],axis=1);lc=LineCollection(segments,cmap='viridis',linewidth=4);lc.set_array(xyz[:,1]);a.add_collection(lc);a.autoscale();a.set_aspect('equal');a.invert_yaxis();a.set_xlabel('X (m)');a.set_ylabel('Z (m)');a.set_title('Actual sampled plan');fig.colorbar(lc,ax=a,label='Road elevation (m)');a.scatter([0],[0],color='#c82030',s=25,zorder=4);a.annotate('Paddock / start',(0,0),xytext=(15,10),textcoords='offset points',fontsize=8)
b.plot(np.r_[distance,3200],np.r_[xyz[:,1],0],color='#215d57',linewidth=2.4,label='Road elevation');b.fill_between(np.r_[distance,3200],np.r_[xyz[:,1],0],color='#215d57',alpha=.10);b.set_xlabel('Planar race station (m)');b.set_ylabel('Road elevation (m)');b.set_ylim(-8,105);b.set_title('84 m rise; actual 3D length 3,205.47 m');g=b.twinx();g.plot(distance,grade,color='#a64c25',linewidth=1.2,linestyle='--',label='Grade');g.set_ylim(-9,12);g.set_ylabel('Road grade (%)');g.axhline(7,color='#a64c25',alpha=.25,linewidth=.7);g.axhline(-7,color='#a64c25',alpha=.25,linewidth=.7);b.grid(alpha=.2)
for start,end,label in [(0,380,'Paddock'),(380,1400,'Wooded climb'),(1400,2130,'Overlook'),(2130,3200,'Descent')]:b.text((start+end)/2,98,label,ha='center',fontsize=8);b.axvline(start,color='#888',alpha=.2,linewidth=.7)
fig.suptitle('Smoky Ridge — measured geometry, Ridge layout v1',fontsize=14);fig.savefig(root/'geometry-final-02/route-profile.png',dpi=160);fig.savefig(root/'geometry-final-02/route-profile.svg');plt.close(fig)
