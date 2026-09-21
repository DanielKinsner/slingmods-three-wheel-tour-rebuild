"""Author periodic numerical water fields; normals use analytic metre-space slopes.
These are shader data, not AI image edits. Dependencies: numpy, Pillow.
"""
from pathlib import Path
import numpy as np
from PIL import Image
import json
OUT=Path(__file__).resolve().parents[2]/'public/assets/p11/harbor-water'
OUT.mkdir(parents=True,exist_ok=True)
def save(name,a):Image.fromarray(np.uint8(np.clip(a,0,1)*255+.5)).save(OUT/name)
def waves(n,metres,modes,name):
 y,x=np.mgrid[:n,:n].astype(np.float32);x/=n;y/=n;dx=np.zeros_like(x);dy=np.zeros_like(y)
 for fx,fy,amplitude,phase in modes:
  angle=2*np.pi*(fx*x+fy*y)+phase;c=np.cos(angle)*amplitude*2*np.pi/metres;dx+=fx*c;dy+=fy*c
 normal=np.stack([-dx,-dy,np.ones_like(dx)],axis=-1);normal/=np.linalg.norm(normal,axis=-1,keepdims=True)
 save(name,normal*.5+.5)
rng=np.random.default_rng(2103)
def spectrum(count,low,high,amplitude):
 modes=[]
 while len(modes)<count:
  fx,fy=rng.integers(-high,high+1,2)
  if low<=np.hypot(fx,fy)<=high:modes.append((int(fx),int(fy),float(amplitude*rng.uniform(.6,1.1)),float(rng.uniform(0,2*np.pi))))
 return modes
waves(2048,16,spectrum(32,4,8,.006),'swell-normal.png')
waves(2048,2,spectrum(40,7,20,.00035),'chop-normal.png')
colors=np.array([[47,181,168],[15,90,102],[7,34,46]],dtype=float)/255
lut=np.zeros((1,256,3));t=np.linspace(0,2,256)
for i in range(3):lut[0,:,i]=np.interp(t,[0,1,2],colors[:,i])
save('depth-color-lut.png',lut)
# Caustics are a periodic scalar shader field formed from intersecting wave ridges.
n=512;y,x=np.mgrid[:n,:n].astype(np.float32)/n
a=np.sin(2*np.pi*(3*x+2*y)+.8*np.sin(2*np.pi*4*y))
b=np.sin(2*np.pi*(2*x-3*y)+.6*np.sin(2*np.pi*3*x))
c=np.exp(-np.minimum(abs(a),abs(b))**2/0.006)
save('caustics.png',c)
meta={'units':'metres','normalConvention':'OpenGL +Y','maps':{'swell-normal.png':{'size':[2048,2048],'tileMetres':16,'wavelengthMetres':[2.5,3.9]},'chop-normal.png':{'size':[2048,2048],'tileMetres':2,'wavelengthMetres':[.13,.21]},'caustics.png':{'size':[512,512],'tileMetres':2},'depth-color-lut.png':{'size':[256,1],'colorSpace':'sRGB','depthMetres':[0,3,12]}},'seamMethod':'Integer-frequency analytic periodic functions sampled on [0,1); no duplicated border texels.'}
(OUT/'water.json').write_text(json.dumps(meta,indent=2), encoding="utf-8")
(OUT/'README.md').write_text('Swell 128 px/m at 16m tile; chop 1024 px/m at 2m tile; caustics 256 px/m; normals OpenGL +Y linear; LUT sRGB; foam and runtime integration pending.\n', encoding="utf-8")
print('Authored four numerical water textures.')
