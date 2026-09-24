"""Sharpen the 2026 Slingshot's steering-wheel button icon atlas (64x64 -> 512x512, same layout so UVs are unchanged).
Every icon is redrawn as vector art in its original box and the START/STOP and ENGINE lettering is re-typeset in
Barlow, rendered 2x and downsampled for clean edges. Idempotent: always rebuilds from the preserved 64 px source.
Run: python scripts/model02/sharpen-cockpit-decals.py
"""
import io,pathlib,sys
from PIL import Image,ImageDraw,ImageFont,ImageFilter
R=pathlib.Path(__file__).resolve().parents[2];sys.path.insert(0,str(R/'scripts'))
from importlib import import_module
replace=import_module('replace-glb-image').replace
GLB=R/'public/assets/model02/slingshot-2026.glb';SRC=R/'assets/source/model02/HandControls_DECALS-64.png';NAME='251588728_HandControls_DECALS-lo'
S=8;W=64*S
def build():
 # Every icon is redrawn as vector art in its original 64 px box (x0,y0,x1,y1), so button UVs are unchanged.
 img=Image.new('L',(W*2,W*2),0);d=ImageDraw.Draw(img);K=S*2;lw=int(1.25*K)   # 2x supersampled, downsized at the end
 P=lambda x,y:(x*K,y*K)
 def speaker(x0,y0,x1,y1,waves):
  cy=(y0+y1)/2;h=y1-y0;d.polygon([P(x0,cy-h*.18),P(x0+2,cy-h*.18),P(x1-1,y0+.5),P(x1-1,y1-.5),P(x0+2,cy+h*.18),P(x0,cy+h*.18)],fill=255)
  for k in range(waves):r=2.2+k*2.3;d.arc([P(x1-1.5-r,cy-r),P(x1-1.5+r,cy+r)],-55,55,fill=255,width=lw)
 speaker(42,6,48,15,2);speaker(45,52,51,61,1)
 d.rounded_rectangle([P(39.8,20.6),P(47.2,31.4)],radius=1.6*K,outline=255,width=lw);d.line([P(42.4,29.6),P(44.6,29.6)],fill=255,width=lw)   # phone
 cx,cy,ro,ri=57,25,4.6,3.2
 teeth=[];import math
 for k in range(16):ang=k*math.pi/8;r=ro if k%2==0 else ri;teeth.append(P(cx+r*math.cos(ang+math.pi/16),cy+r*math.sin(ang+math.pi/16)))
 d.polygon(teeth,fill=255);d.ellipse([P(cx-1.6,cy-1.6),P(cx+1.6,cy+1.6)],fill=0)   # gear
 d.ellipse([P(7.4,36.6),P(13.6,42.8)],outline=255,width=lw);d.line([P(8,39.7),P(13,39.7)],fill=255,width=lw);d.line([P(10.5,39.7),P(10.5,42.6)],fill=255,width=lw)   # steering-wheel (driver assist)
 d.line([P(8.6,44.6),P(12.4,44.6)],fill=255,width=lw);d.line([P(9.2,46.4),P(11.8,46.4)],fill=255,width=lw)
 d.polygon([P(32,38.4),P(36.8,46.6),P(27.2,46.6)],outline=255,width=lw);d.polygon([P(32,41.6),P(34.4,45.4),P(29.6,45.4)],fill=255)   # hazard
 d.line([P(50,36.5),P(47.6,45.6)],fill=255,width=lw);d.line([P(58,36.5),P(60.4,45.6)],fill=255,width=lw)   # lane assist
 for y in(37.4,40.8,44.2):d.ellipse([P(53.2,y-.9),P(54.8,y+.9)],fill=255)
 d.polygon([P(15.6,52.6),P(7.6,56.2),P(11.2,57.4),P(12.4,61)],fill=255)   # navigation arrow
 d.line([P(29,53.6),P(35,52.2)],fill=255,width=int(1.6*K));d.line([P(29,53.6),P(29,59.6)],fill=255,width=lw);d.line([P(35,52.2),P(35,58.2)],fill=255,width=lw)   # music
 d.ellipse([P(26,58.2),P(29.6,61.6)],fill=255);d.ellipse([P(32,56.8),P(35.6,60.2)],fill=255)
 bold=str(R/'assets/fonts/barlow-condensed/BarlowCondensed-Bold.ttf')
 def text(t,cx,cy,h):
  f=ImageFont.truetype(bold,int(h*K*1.32));bb=d.textbbox((0,0),t,font=f);d.text((cx*K-(bb[0]+bb[2])/2,cy*K-(bb[1]+bb[3])/2),t,font=f,fill=255)
 text('ENGINE',17.5,12.5,2.6);text('START',18,17.6,4.2);text('STOP',18,22.4,4.2)
 alpha=img.resize((W,W),Image.LANCZOS)
 out=Image.new('RGBA',(W,W),(255,255,255,0));out.putalpha(alpha);buf=io.BytesIO();out.save(buf,'PNG',optimize=True);return buf.getvalue()
if __name__=='__main__':
 if not SRC.exists():                                             # preserve the original once, from the shipped model
  import json,struct
  b=GLB.read_bytes();n=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+n]);im=[i for i in j['images'] if i.get('name')==NAME][0];bv=j['bufferViews'][im['bufferView']]
  SRC.parent.mkdir(parents=True,exist_ok=True);SRC.write_bytes(b[28+n+bv.get('byteOffset',0):28+n+bv.get('byteOffset',0)+bv['byteLength']])
 png=build();before=GLB.read_bytes();after=replace(before,NAME,png,'image/png');GLB.write_bytes(after)
 (R/'.tools/claude-polish/cockpit/decals-512.png').write_bytes(png) if (R/'.tools').exists() else None
 print(f'{NAME}: 64 -> {W}px, {len(before)} -> {len(after)} bytes')
