"""Original editable pinnate-frond coverage bake. No downloaded leaf imagery."""
from pathlib import Path
import math,json,hashlib
from PIL import Image,ImageDraw
R=Path(__file__).resolve().parents[1];S=R/'assets/blender/showcase-quality';O=R/'public/assets/showcase-quality/textures'
W,H,AA=512,1024,2
im=Image.new('RGBA',(W*AA,H*AA),(90,128,43,0));draw=ImageDraw.Draw(im);polygons=[]
for j in range(32):
 t=.08+.86*j/32;y=H*(.03+.94*t);spread=214*math.sin(math.pi*t)**.68
 for sign in [-1,1]:
  dx=spread*sign;dy=45+27*t;length=math.hypot(dx,dy);nx=-dy/length;ny=dx/length
  left=[];right=[]
  for k in range(17):
   u=k/16;center=(W/2+dx*u,y+dy*u+11*math.sin(math.pi*u));width=(10.4+.8*math.sin(j*1.7))*math.sin(math.pi*u)**.75
   left.append((center[0]+nx*width,center[1]+ny*width));right.append((center[0]-nx*width,center[1]-ny*width))
  poly=left+right[::-1];shade=.91+.12*math.sin(j*1.37+sign)
  draw.polygon([(round(x*AA),round(y*AA)) for x,y in poly],fill=tuple(round(v*shade) for v in [96,138,48])+(255,))
  polygons.append([[x/W,y/H] for x,y in poly])
draw.line([(W/2*AA,22*AA),(W/2*AA,995*AA)],fill=(104,145,53,255),width=5*AA)
im=im.resize((W,H),Image.Resampling.LANCZOS);target=O/'p06c-frond.png';im.save(target)
layout={'authorship':'Original parametric lanceolate pinnae and central rachis; editable polygons shared with Blender bake-source collection. No external foliage photo or PNG.','size':[W,H],'polygons':polygons,'alphaCutoff':.35,'runtimeTexture':'public/assets/showcase-quality/textures/p06c-frond.png','sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
(S/'p06c-frond-layout.json').write_text(json.dumps(layout,indent=2));print('Original frond baked',len(polygons),'pinnae')
