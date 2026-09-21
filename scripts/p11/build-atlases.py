"""PBR trim assembly and decal coordinate/channel authoring; preserve source PNGs."""
from pathlib import Path
from PIL import Image
import numpy as np,json
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'public/assets/p11'
props=OUT/'trackside-props'
def read(path):
 im=Image.open(path)
 if im.mode in ['I;16','I','F']:
  a=np.asarray(im,dtype=np.float32);a/=65535 if im.mode!='F' else max(float(a.max()),1)
  a=np.asarray(Image.fromarray(a).resize((2048,2048),Image.Resampling.LANCZOS));return np.repeat(np.clip(a*255,0,255)[:,:,None],3,axis=-1).astype(np.uint8)
 return np.asarray(im.convert('RGB').resize((2048,2048),Image.Resampling.LANCZOS))
def save(path,a):Image.fromarray(a.astype(np.uint8)).save(path)
# Each row is a 4m x .5m trim domain. Surfaces may repeat along U.
# Steel is galvanized guardrail: a metal's base colour IS its reflectance, so the raw rusty plate scan (about 3% linear)
# rendered near-black in engine. Graphite is powder-coat paint over steel, i.e. a dielectric, not bare metal.
bands=[('steel','metal',[.74,.76,.77]),('graphite','metal',[.12,.14,.16]),('concrete','concrete',None),('rubber','concrete',[.07,.075,.08]),('red','metal',[.9,.025,.04]),('white','metal',[.85,.85,.8]),('wood','cedar',None),('orange','metal',[.95,.21,.03])]
for channel in ['baseColor','normal','ORM','height']:
 atlas=np.zeros((4096,4096,3),np.uint8)
 for i,(name,source,tint) in enumerate(bands):
  directory=OUT/'wooden-sign' if source=='cedar' else props
  a=read(directory/(source+'-'+channel+'.png'));row=np.tile(a[256:768],(1,2,1)).astype(np.float32)
  if channel=='baseColor' and tint is not None:
   gray=np.mean(row,axis=-1,keepdims=True)/255;row=np.array(tint)[None,None,:]*255*(.78+gray*.3)
  if channel=='ORM':
   row[:,:,2]=255 if name=='steel' else 0;row[:,:,1]=np.clip(105+(row[:,:,1]-128)*.5,70,170) if name=='steel' else 115 if name in ['red','white','orange'] else 230 if name in ['concrete','rubber'] else row[:,:,1]
  # Duplicate four pixels at band edges to provide a small isolated mip gutter.
  row[:4]=row[4];row[-4:]=row[-5];atlas[i*512:(i+1)*512]=np.clip(row,0,255)
 save(props/('trim-'+channel+'.png'),atlas)
(props/'trim.json').write_text(json.dumps({'size':[4096,4096],'physicalDomainMetres':[4,4],'pixelsPerMetre':1024,'bands':[{'name':b[0],'row':i,'uvBottomLeft':[0,1-(i+1)/8,1,1/8],'safeVInsetPixels':4,'tileMetres':[4,.5]} for i,b in enumerate(bands)],'source':'Matched CC0 scans: metal_plate, concrete_wall_006, weathered_brown_planks; original authored paint tints and roughness/metallic values.'},indent=2), encoding="utf-8")
# Chain link is an exact repeated geometric alpha pattern with 50mm diamonds.
y,x=np.mgrid[:1024,:1024].astype(np.float32)/1024
d1=abs(((x+y)*10+.5)%1-.5);d2=abs(((x-y)*10+.5)%1-.5)
wire=np.clip((.038-np.minimum(d1,d2))*400,0,1);rgb=np.full((1024,1024,4),170,np.uint8);rgb[:,:,3]=np.uint8(wire*255);save(props/'chain-link.png',rgb)
(props/'README.md').write_text('All model units metres, ground-centred pivots; shared 4096² trim = 1024px/m over 4m²; alpha chain link 1024² over 0.5m²; use manifest LODs and place-route.mjs.\n', encoding="utf-8")
# Decal atlas: preserve AI source, package 4K with transparent alpha.
dest=OUT/'road-decals';source=Image.open(dest/'baseColor-source.png').convert('RGBA');sourceSize=list(source.size);im=source.resize((4096,4096),Image.Resampling.LANCZOS);im.save(dest/'baseColor.png');a=np.asarray(im,dtype=np.float32)/255
names=['white-solid','white-dashed','yellow-edge','tar-snake-1','tar-snake-2','tar-snake-3','tar-snake-4','tar-snake-5','tar-snake-6','expansion-1','expansion-2','expansion-3','expansion-4','skid-lockup','skid-drift-1','paired-launch','single-rear-burnout','skid-narrow','skid-drift-2','racing-line','repair-1','repair-2','repair-3','repair-4','oil-drips','oil-stain','curb-red-white','start-finish','grid-slot','oil-streak','crack-chip-1','crack-chip-2','crack-chip-3','crack-chip-4','crack-chip-5','crack-chip-6']
rough=np.full((4096,4096),.8,np.float32);height=np.zeros_like(rough);tiles=[]
for i,name in enumerate(names):
 cy,cx=divmod(i,6);x0,x1=round(cx*4096/6),round((cx+1)*4096/6);y0,y1=round(cy*4096/6),round((cy+1)*4096/6);alpha=a[y0:y1,x0:x1,3]
 iy,ix=np.nonzero(alpha>.5)
 bx0,bx1=(int(ix.min()),int(ix.max()+1)) if len(ix) else (0,x1-x0);by0,by1=(int(iy.min()),int(iy.max()+1)) if len(iy) else (0,y1-y0)
 size=[1.5,3];r=.78;h=.0005
 if name.startswith(('white','yellow')):size=[.15,3]
 elif name.startswith('tar'):size=[.3,2];r=.13;h=.004
 elif name.startswith('expansion'):size=[3,.07];h=-.006
 elif name.startswith('repair'):size=[2,1.5];h=.002
 elif name.startswith('oil'):size=[.6,.8];r=.12;h=0
 elif name=='racing-line':size=[3,8];h=0
 elif name=='curb-red-white':size=[.5,2]
 elif name=='start-finish':size=[12,1]
 elif name=='grid-slot':size=[2.2,4]
 elif name=='single-rear-burnout':size=[2.8,3.2];h=0
 elif name.startswith('skid') or name=='paired-launch':size=[1.5,5];h=0
 rough[y0:y1,x0:x1]=r;height[y0:y1,x0:x1]=alpha*h
 tiles.append({'id':name,'uvRectBottomLeft':[(x0+bx0)/4096,1-(y0+by1)/4096,(bx1-bx0)/4096,(by1-by0)/4096],'cellPixelRect':[x0,y0,x1-x0,y1-y0],'realWorldSizeMetres':size,'tileableAlongLengthRequested':name in ['racing-line','curb-red-white'],'seamValidation':'pending' if name in ['racing-line','curb-red-white'] else 'not applicable','roughness':r})
dy,dx=np.gradient(height);n=np.stack([-dx*1024,dy*1024,np.ones_like(dx)],axis=-1);n/=np.linalg.norm(n,axis=-1,keepdims=True)
save(dest/'normal.png',np.dstack([(n*.5+.5)*255,a[:,:,3]*255]));save(dest/'roughness.png',rough*255)
orm=np.stack([np.ones_like(rough),rough,np.zeros_like(rough)],axis=-1);save(dest/'ORM.png',orm*255)
(dest/'atlas.json').write_text(json.dumps({'size':[4096,4096],'sourceSize':sourceSize,'resampling':'Lanczos from preserved generated source; not native 4K detail','normalMethod':'Authored thin decal height from alpha silhouette, not measured surface relief','uvOrigin':'bottom-left','tiles':tiles},indent=2), encoding="utf-8")
(dest/'README.md').write_text('4K RGBA atlas from 1254² generated source; individual physical sizes and tight-alpha UVs in atlas.json; normals OpenGL +Y, roughness linear; strips still need seam review.\n', encoding="utf-8")
print('Built shared trim, chain link, decal channels and UV/scale metadata')
