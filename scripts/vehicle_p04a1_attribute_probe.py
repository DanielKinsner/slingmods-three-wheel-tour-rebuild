import sys,pathlib
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent))
from vehicle_p04a1_validate import *
from collections import Counter
_,_,old=load(P/'public/assets/vehicles/slingshot-p03a2.glb');_,_,new=load(P/'public/assets/vehicles/slingshot-p04a1.glb')
for n in ['body_static__Radar_Blue','cockpit__Radar_Blue','rear_spin__Gloss_Black_Wheel']:
 a,b=old[n],new[n];print(n,list(a['attrs']),list(b['attrs']))
 for key in a['attrs']:
  aa=a['attrs'][key];bb=b['attrs'][key];ca=Counter(tuple(x)for x in np.round(aa,5));cb=Counter(tuple(x)for x in np.round(bb,5));print(key,aa.shape,bb.shape,'unique removed',len(set(ca)-set(cb)))
