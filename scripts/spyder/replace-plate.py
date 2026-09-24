"""Replace the purchased Spyder model's licence-plate texture (a German plate carrying the model
seller's "RS 3D" branding and logo) with an original SlingMods tour plate.

Keeps the source aspect (869x202) at 2x resolution so the plate's UVs are unchanged, and re-packs
the GLB binary so the old image bytes are dropped rather than orphaned. Idempotent: re-running
replaces whatever image the `plate` material currently uses.
Run: python scripts/spyder/replace-plate.py
"""
import io,pathlib,sys
from PIL import Image,ImageDraw,ImageFont

R=pathlib.Path(__file__).resolve().parents[2]
GLB=R/'public/assets/spyder/spyder-f3.glb'
FONT=R/'assets/fonts/barlow-condensed/BarlowCondensed-ExtraBold.ttf'
BOLD=R/'assets/fonts/barlow-condensed/BarlowCondensed-Bold.ttf'

def plate():
 W,H=1738,404;img=Image.new('RGB',(W,H),(236,238,236));d=ImageDraw.Draw(img)
 for y in range(H):                                   # faint embossed sheen
  g=int(6*(1-abs(y/H-.35)*2));d.line([(0,y),(W,y)],fill=(236+g,238+g,236+g))
 d.rounded_rectangle([10,10,W-11,H-11],radius=34,outline=(24,26,30),width=12)
 d.rounded_rectangle([34,34,W-35,98],radius=16,fill=(206,32,38))
 small=ImageFont.truetype(str(BOLD),50);big=ImageFont.truetype(str(FONT),232);tiny=ImageFont.truetype(str(BOLD),44)
 def centre(text,font,y,fill):
  box=d.textbbox((0,0),text,font=font);d.text(((W-(box[2]-box[0]))/2-box[0],y-box[1]),text,font=font,fill=fill)
 centre('SLINGMODS  ·  THREE-WHEEL TOUR',small,44,(250,250,250))
 centre('F3 TOUR',big,112,(22,30,52))
 centre('SLINGMODS.COM',tiny,H-80,(90,94,100))
 for x in [70,W-70]:                                  # mounting bolts
  d.ellipse([x-17,H/2-17,x+17,H/2+17],fill=(170,174,178),outline=(90,94,98),width=4)
 out=io.BytesIO();img.save(out,'JPEG',quality=90,optimize=True,progressive=False);return out.getvalue()

sys.path.insert(0,str(R/'scripts'))
from importlib import import_module
replace=import_module('replace-glb-image').replace

if __name__=='__main__':
 before=GLB.read_bytes();after=replace(before,'plate',plate());GLB.write_bytes(after)
 print(f'plate replaced: {len(before)} -> {len(after)} bytes')
