"""Painted timber sign face for the Smoky Ridge start gantry. Plain Python + Pillow + NumPy; run BEFORE author-p10a-ridge.py.

The official logo is printed INTO cream-painted planks (multiply), never laid over them, so grain, seams and wear
read through the ink. The logo keeps its exact aspect and sits centred with 12% of the board width clear each side.
Board dimensions here are the single source for the Blender kit script (gantry-sign.json).
"""
from pathlib import Path
import json, hashlib
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
TEXTURES=ROOT/'public/assets/showcase-quality/textures';LOGO=ROOT/'public/assets/brand/slingmods-logo-main.png'
OUT=ROOT/'assets/source/ridge';OUT.mkdir(parents=True,exist_ok=True)
BOARD=(8.4,2.1);SIZE=(2048,512);PADDING=.12;PLANKS_ACROSS=7;SOURCE_PLANKS=13
def tiled(name,mode):
 # Scale the seamless plank photo so exactly seven boards span the sign, then repeat it along the length.
 source=Image.open(TEXTURES/name).convert(mode);scale=SIZE[1]/(source.height*PLANKS_ACROSS/SOURCE_PLANKS);tile=source.resize((round(source.width*scale),round(source.height*scale)),Image.LANCZOS)
 sheet=Image.new(mode,SIZE)
 for x in range(0,SIZE[0],tile.width):sheet.paste(tile,(x,0))
 return np.asarray(sheet,dtype=np.float32)/255
wood=tiled('weathered_brown_planks_Diffuse.jpg','RGB');wood_rough=tiled('weathered_brown_planks_Rough.jpg','L')
grain=wood.mean(axis=2);grain=np.clip(grain/grain.mean(),.35,1.6)
# Low-frequency wear: paint thins toward board ends and in a few blotches, showing raw timber.
# One noise row per plank, smooth along the board only, so wear follows each plank like real weathering.
rng=np.random.default_rng(3500);coarse=Image.fromarray((rng.random((PLANKS_ACROSS,18))*255).astype(np.uint8)).resize((SIZE[0],PLANKS_ACROSS),Image.BICUBIC).resize(SIZE,Image.NEAREST);wear=np.asarray(coarse,dtype=np.float32)/255
edge=np.minimum(np.linspace(0,1,SIZE[0])[None,:],np.linspace(1,0,SIZE[0])[None,:])*2;edge=np.clip(edge*9,0,1)
bare=np.clip((wear-.66)*3.0,0,1)*.40+(1-edge)*.35;bare=np.clip(bare+np.clip(.75-grain,0,1)*.9,0,1)[...,None]
paint=np.array([.80,.765,.655],dtype=np.float32)*(0.50+0.50*grain[...,None])
face=paint*(1-bare)+wood*1.15*bare
# Fit the artwork: 12% clear on the limiting axis, exact aspect, centred.
logo=Image.open(LOGO).convert('RGBA');aspect=logo.width/logo.height
fit_w=min(BOARD[0]*(1-2*PADDING),BOARD[1]*(1-2*PADDING)*aspect);fit_h=fit_w/aspect
px=(round(fit_w/BOARD[0]*SIZE[0]),round(fit_h/BOARD[1]*SIZE[1]));art=np.asarray(logo.resize(px,Image.LANCZOS),dtype=np.float32)/255
x0=(SIZE[0]-px[0])//2;y0=(SIZE[1]-px[1])//2;ink=np.ones((SIZE[1],SIZE[0],3),np.float32);cover=np.zeros((SIZE[1],SIZE[0],1),np.float32)
ink[y0:y0+px[1],x0:x0+px[0]]=art[...,:3];cover[y0:y0+px[1],x0:x0+px[0]]=art[...,3:]
cover*=.94*(1-bare*.6)  # ink wears away with the paint under it
face=face*(1-cover+cover*ink)  # multiply: white artwork leaves the painted grain untouched
Image.fromarray((np.clip(face,0,1)*255).astype(np.uint8)).save(OUT/'gantry-sign-color.png')
# glTF packing: G roughness, B metallic (0). Ink is a touch glossier than chalky paint; bare timber is driest.
darkness=1-ink.mean(axis=2,keepdims=True)
rough=np.clip(.70+.14*(wood_rough[...,None]-.5)+.16*bare-.12*cover*darkness,0,1)
orm=np.concatenate([np.ones_like(rough),rough,np.zeros_like(rough)],axis=2)
Image.fromarray((orm*255).astype(np.uint8)).save(OUT/'gantry-sign-orm.png')
record={'boardMetres':BOARD,'texture':SIZE,'padding':PADDING,'logoMetres':[fit_w,fit_h],'clearMetres':[(BOARD[0]-fit_w)/2,(BOARD[1]-fit_h)/2],'logoAspect':aspect,'blend':'multiply over painted plank grain; ink coverage .94 reduced by wear','logoSHA256':hashlib.sha256(LOGO.read_bytes()).hexdigest(),'generator':'scripts/build-ridge-gantry-sign.py'}
(OUT/'gantry-sign.json').write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8')
print('Ridge gantry sign face',record['logoMetres'],'m logo on',BOARD,'m board')
