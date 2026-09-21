"""Deterministic paint-on-grain finish from the unmodified official logo source."""
from pathlib import Path
from PIL import Image
import numpy as np,hashlib,json
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'public/assets/p11/wooden-sign';source=ROOT/'public/assets/brand/slingmods-logo-main.png'
im=Image.open(source).convert('RGBA');a=np.asarray(im,dtype=np.float32)/255;w,h=im.size
height=np.asarray(Image.open(OUT/'cedar-height.png'),dtype=np.float32)
if height.ndim==3:height=height.mean(axis=-1)
height=(height-height.min())/max(float(np.ptp(height)),1e-6)
grain=np.asarray(Image.fromarray(height).resize((w,h),Image.Resampling.LANCZOS),dtype=np.float32)
mask=a[:,:,3];edge=np.maximum(abs(np.roll(mask,1,0)-mask),abs(np.roll(mask,1,1)-mask));rng=np.random.default_rng(2107)
flake=(rng.random(mask.shape)>.991)&(grain<np.quantile(grain,.45));edgeflake=(edge>.1)&(grain<np.quantile(grain,.1))
a[:,:,:3]*=(.9+.1*grain[:,:,None]);a[:,:,3]*=~(flake|edgeflake)
Image.fromarray(np.uint8(np.clip(a,0,1)*255+.5)).save(OUT/'paint-on-grain.png')
(OUT/'paint-provenance.json').write_text(json.dumps({'source':'../../brand/slingmods-logo-main.png','sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'originalUntouched':True,'method':'Original logo RGBA multiplied by 90–100% sampled wood-height modulation; deterministic sparse alpha chips. No tracing, redrawing or aspect change.','output':'paint-on-grain.png','sourcePixels':[w,h]},indent=2), encoding="utf-8")
