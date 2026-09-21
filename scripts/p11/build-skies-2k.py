"""2K runtime skies from the 8K masters. Plain Python + OpenCV + NumPy.

The 8K HDRs (60-77 MB each) stay as masters; the game and the hosted build load these 2048x1024 Radiance files, the same
resolution as the existing day sky. Area-averaged in linear light, so the sun keeps its energy instead of aliasing.
The sun/moon direction is re-measured from each 2K file, since the lighting rig must agree with what is on screen.
"""
from pathlib import Path
import json,hashlib,os
os.environ['OPENCV_IO_ENABLE_OPENEXR']='1'
import cv2,numpy as np
SKIES=Path(__file__).resolve().parents[2]/'public/assets/p11/skies';W,H=2048,1024
records=[]
for name in ['golden-hour','dusk','after-rain']:  # the looks that ship; Night keeps the validated analytic sky
 source=SKIES/f'{name}-8k.hdr';image=cv2.imread(str(source),cv2.IMREAD_UNCHANGED|cv2.IMREAD_ANYDEPTH)
 assert image is not None and image.dtype==np.float32,source
 small=cv2.resize(image,(W,H),interpolation=cv2.INTER_AREA);out=SKIES/f'{name}-2k.hdr';assert cv2.imwrite(str(out),small)
 rgb=small[...,::-1];luminance=rgb@np.array([.2126,.7152,.0722],np.float32);upper=luminance[:H//2];y,x=np.unravel_index(int(np.argmax(upper)),upper.shape)
 longitude=((x+.5)/W-.5)*2*np.pi;latitude=(.5-(y+.5)/H)*np.pi;direction=[float(np.cos(latitude)*np.cos(longitude)),float(np.sin(latitude)),float(np.cos(latitude)*np.sin(longitude))]
 records.append({'preset':name,'file':out.name,'pixels':[W,H],'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'source':source.name,'brightestDirection':direction,'elevationDegrees':float(np.degrees(latitude)),'medianLuminance':float(np.median(luminance)),'p95Luminance':float(np.percentile(luminance,95)),'horizonColorLinear':[float(v) for v in rgb[H//2-24:H//2-4].reshape(-1,3).mean(0)],'zenithColorLinear':[float(v) for v in rgb[:H//8].reshape(-1,3).mean(0)]})
 print(name,round(out.stat().st_size/1e6,1),'MB  elevation',round(records[-1]['elevationDegrees'],1),'median',round(records[-1]['medianLuminance'],3),'p95',round(records[-1]['p95Luminance'],3))
(SKIES/'skies-2k.json').write_text(json.dumps({'generator':'scripts/p11/build-skies-2k.py','resample':'INTER_AREA in linear light','skies':records},indent=2)+'\n',encoding='utf-8')
