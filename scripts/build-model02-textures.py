"""Preserve the 2026 decals/alpha, recoloring their red accent pixels only."""
from pathlib import Path
from PIL import Image
P=Path(__file__).resolve().parents[1]
D=P/'assets/source/model02/2026 model';O=P/'public/assets/model02';O.mkdir(parents=True,exist_ok=True)
palette={'blue-orange':(240,117,33),'black-red':(201,24,32),'white-graphite':(86,89,94),'graphite-red':(201,24,32)}
for part,name in [('front','257514552_HiddenWarmToneGray_R_Front.png'),('rear','257514551_HiddenWarmToneGray_R_Rear.png')]:
 image=Image.open(D/name).convert('RGBA');pixels=list(image.getdata());mask=[r>50 and r>g*1.45 and r>b*1.35 for r,g,b,a in pixels]
 for finish,tint in palette.items():
  out=Image.new('RGBA',image.size)
  out.putdata([(*[min(255,round(c*r/220))for c in tint],a)if use else(r,g,b,a)for(r,g,b,a),use in zip(pixels,mask)])
  out.save(O/f'decal-{part}-{finish}.png',optimize=True)
 print(part,'accent pixels',sum(mask),'native UV layout and alpha retained')
