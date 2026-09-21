"""Game-calibrated colour map for the P11 race asphalt. Plain Python + Pillow + NumPy.

The CC0 scan (asphalt_track) averages about 1.3% linear reflectance; real race asphalt is 4-12%, and under the game's
exposure the scan renders as a black hole. This writes race-asphalt/track-4m-baseColor.png: same 4 m / 4096 px aggregate,
linear gain to a 7.5% mean, half-way neutralised so the road does not read brown. The scan-faithful dry/wet maps are
untouched. Gain is applied BEFORE KTX2 encoding so the encoder spends its bits on the visible range.
Order: this -> compress.py -> finalize-metadata.py.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
ROAD=Path(__file__).resolve().parents[2]/'public/assets/p11/race-asphalt';TARGET=.075
to_linear=lambda a:np.where(a<=.04045,a/12.92,((a+.055)/1.055)**2.4);to_srgb=lambda a:np.where(a<=.0031308,a*12.92,1.055*a**(1/2.4)-.055)
linear=to_linear(np.asarray(Image.open(ROAD/'dry-4m-baseColor.png').convert('RGB'),dtype=np.float32)/255);before=float(linear.mean())
grey=linear.mean(axis=2,keepdims=True);linear=(linear*.5+grey*.5)*(TARGET/before)
Image.fromarray(np.uint8(np.clip(to_srgb(np.clip(linear,0,1)),0,1)*255+.5)).save(ROAD/'track-4m-baseColor.png',optimize=True)
(ROAD/'track-calibration.json').write_text(json.dumps({'file':'track-4m-baseColor.png','source':'dry-4m-baseColor.png','meanLinearBefore':before,'meanLinearAfter':float(np.clip(linear,0,1).mean()),'clippedShare':float((linear>1).mean()),'neutralised':.5,'reason':'Scan albedo is about a fifth of real asphalt; calibrated for in-game exposure. Normal, ORM and height are shared with dry-4m.','generator':'scripts/p11/calibrate-asphalt-albedo.py'},indent=2)+'\n',encoding='utf-8')
print('Track albedo',round(before,4),'->',TARGET)
