"""Original deterministic particle simulation rendered to exact-frame RGBA flipbooks.
No source image manipulation. Analytic smoke fields, ballistic particles, periodic
distortion fields and a periodic 3D noise volume. Python/numpy/Pillow.
"""
from pathlib import Path
import numpy as np,json,math
from PIL import Image
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'public/assets/p11/vfx';OUT.mkdir(parents=True,exist_ok=True)
N=256;yy,xx=np.mgrid[:N,:N].astype(np.float32);x=(xx+.5)/N*2-1;y=(yy+.5)/N*2-1
rng=np.random.default_rng(2119);records=[]
def save(name,a):Image.fromarray(np.uint8(np.clip(a,0,1)*255+.5)).save(OUT/name)
def noise(x,y,t=0):
 return (np.sin(x*17+y*11+t)*np.sin(x*9-y*19-t*.7)+.5*np.sin(x*31+y*23+t*1.3)+.25*np.cos(x*59-y*37-t*.5))/1.75
def normal(height):
 dy,dx=np.gradient(height);a=np.stack([-dx*6,-dy*6,np.ones_like(dx)],axis=-1);a/=np.linalg.norm(a,axis=-1,keepdims=True);return a*.5+.5
def atlas(name,render,frames=64,loop=False,normal_map=False,fps=30):
 sheet=np.zeros((2048,2048,4),np.float32);ns=np.zeros((2048,2048,3),np.float32) if normal_map else None
 for i in range(frames):
  t=i/frames if loop else i/(frames-1);rgb,alpha=render(t);alpha=np.clip(alpha,0,1)
  # Transparent guard band prevents inter-frame bleed before mip padding.
  edge=np.minimum(1,np.maximum(0,(.96-np.maximum(abs(x),abs(y)))*20));alpha*=edge
  cy,cx=divmod(i,8);sl=(slice(cy*N,(cy+1)*N),slice(cx*N,(cx+1)*N))
  sheet[sl][:,:,:3]=rgb;sheet[sl][:,:,3]=alpha
  if ns is not None:ns[sl]=normal(alpha)
 save(name+'.png',sheet)
 if ns is not None:save(name+'-normal.png',ns)
 records.append({'name':name,'file':name+'.png','frames':frames,'columns':8,'rows':8,'framePixels':[256,256],'fps':fps,'loop':loop,'alpha':'straight','frameOrder':'left-to-right, top-to-bottom','normal':name+'-normal.png' if ns is not None else None})
 print('Rendered',name,frames,'frames',flush=True)
centres=rng.uniform(-.6,.6,(16,2));radii=rng.uniform(.13,.28,16)
def smoke(t,color=(.72,.73,.74),loop=False,dust=False):
 field=np.zeros_like(x)
 for i,(cx,cy) in enumerate(centres):
  age=(t+i/16)%1 if loop else t
  size=radii[i]*(.2+age*1.9);px=cx*(.1+age*.8);py=cy*.3-age*.2
  d=((x-px)/size)**2+((y-py)/size)**2
  turbulent=np.clip(1+noise(x*1.8,y*1.8,t*4+i)*.45,0,2)
  field+=np.exp(-d*1.9)*turbulent*(1-age)**1.5
 envelope=1 if loop else np.sin(np.pi*t)**.65
 alpha=(1-np.exp(-field*(1.1 if dust else .8)))*envelope
 brightness=.83+.17*noise(x*.6,y*.6,t*2)
 rgb=np.stack([brightness*c for c in color],axis=-1)
 return rgb,alpha
atlas('tire-smoke',lambda t:smoke(t),normal_map=True)
atlas('burnout-smoke',lambda t:smoke(t,loop=True),loop=True,normal_map=True)
atlas('dust-kickup',lambda t:smoke(t,(.58,.43,.27),dust=True),normal_map=True)
particles=[(rng.uniform(-1,1),rng.uniform(-1,1),rng.uniform(.45,1.2),rng.uniform(0,math.tau),rng.uniform(.015,.05)) for _ in range(48)]
def ballistic(t,kind='sparks',tint=(1,.4,.06),loop=False):
 rgb=np.zeros((N,N,3),np.float32);alpha=np.zeros_like(x)
 for i,(vx,vy,speed,phase,size) in enumerate(particles):
  age=(t+i/48)%1 if loop else t;px=vx*speed*age*.7;py=-abs(vy)*speed*age*.9+age*age*.5
  if kind=='spray':px*=.65;py=-speed*age*1.4+age*age*.95
  dx=x-px;dy=y-py;angle=phase+age*(7 if kind in ['leaf','confetti'] else 0);u=dx*np.cos(angle)+dy*np.sin(angle);v=-dx*np.sin(angle)+dy*np.cos(angle)
  if kind=='leaf':
   shape=np.clip(1-(u/(size*1.2))**2-(v/(size*.5))**2,0,1);col=np.array([.45+.22*np.sin(i),.23+.1*np.sin(i),.065]);fade=np.sin(np.pi*age)**.5
  elif kind=='confetti':
   shape=np.clip((1-np.maximum(abs(u)/(size*.5),abs(v)/(size*1.3)))*5,0,1);col=np.array([[.88,.02,.04],[.95,.95,.95],[.95,.55,.08]][i%3]);fade=np.sin(np.pi*age)**.4
  else:
   shape=np.exp(-(u/(size*.12))**2-(v/(size*(1+age*4)))**2);col=np.array(tint)*(1-age*.4)+age*.2;fade=(1-age)**1.3
  a=shape*fade;rgb+=a[:,:,None]*col;alpha=1-(1-alpha)*(1-a)
 rgb/=np.maximum(alpha[:,:,None],1e-5)
 return rgb,alpha
atlas('dry-leaf-burst',lambda t:ballistic(t,'leaf'))
atlas('water-rooster-tail',lambda t:ballistic(t,'spray',(.68,.85,.94)),normal_map=True)
atlas('brake-scrape-sparks',lambda t:ballistic(t,tint=(1,.55,.12)))
for name,col in [('white',(1,.95,.83)),('orange',(1,.32,.035)),('red',(.88,.012,.026))]:atlas('drift-sparks-'+name,lambda t,col=col:ballistic(t,tint=col))
def flame(t):
 pulse=np.sin(np.pi*t)**.5;shape=np.exp(-((x/(.1+pulse*.14))**2+((y+.1)/(.12+pulse*.5))**2)*2)*pulse
 shape*=np.clip(1+noise(x*3,y*3,t*9)*.35,0,2);core=np.clip(shape*2-0.5,0,1)
 rgb=np.stack([1-core*.72,.23+core*.42,.015+core*.98],axis=-1)
 return rgb,shape
atlas('exhaust-flame-pop',flame,frames=16,fps=40)
def speedlines(t):
 angle=np.arctan2(y,x);r=np.sqrt(x*x+y*y);spokes=np.maximum(0,np.cos(angle*37+np.sin(angle*11)))**50
 travelling=np.maximum(0,np.sin(r*13-t*math.tau))**4
 alpha=spokes*travelling*np.clip((r-.25)*1.6,0,1)
 return np.ones((N,N,3),np.float32),alpha
atlas('boost-speed-lines',speedlines,loop=True)
def pickup(t):
 rgb,a=ballistic(t,'confetti');r=np.sqrt(x*x+y*y);ring=np.exp(-((r-(.08+t*.76))/.018)**2)*(1-t)
 rgb=(rgb*a[:,:,None]+ring[:,:,None]*np.array([1,.11,.14]))/np.maximum((a+ring)[:,:,None],1e-5)
 return rgb,np.maximum(a,ring)
atlas('points-pickup-burst',pickup)
atlas('podium-confetti',lambda t:ballistic(t,'confetti'))
sheet=np.zeros((2048,2048,3),np.float32)
for i in range(64):
 t=i/64*math.tau;h=np.sin(x*math.pi*4+t)*np.cos(y*math.pi*3-t)+.4*np.sin(x*math.pi*7+y*math.pi*5+t)
 cy,cx=divmod(i,8);sheet[cy*N:(cy+1)*N,cx*N:(cx+1)*N]=normal(h*.15)
save('heat-shimmer-normal.png',sheet);records.append({'name':'heat-shimmer','file':'heat-shimmer-normal.png','frames':64,'columns':8,'rows':8,'fps':30,'loop':True,'tileable':True,'normalConvention':'OpenGL +Y'})
soft=np.exp(-(x*x+y*y)*8);save('particle-soft.png',np.dstack([np.ones_like(x)]*3+[soft]))
streak=np.exp(-x*x*350-y*y*5);save('particle-streak.png',np.dstack([np.ones_like(x)]*3+[streak]))
n=2048;ly,lx=np.mgrid[:n,:n].astype(np.float32)/n;lens=np.zeros((n,n),np.float32)
for _ in range(75):
 cx,cy=rng.random(2);s=rng.uniform(.003,.016);lens+=np.exp(-((lx-cx)**2+(ly-cy)**2)/(s*s))*.13
save('lens-dirt.png',np.dstack([np.ones_like(lens)]*3+[np.clip(lens,0,1)]))
streak=np.exp(-((ly-.5)*160)**2)*np.exp(-((lx-.5)*3)**2);save('anamorphic-streak.png',np.dstack([np.ones_like(streak),np.ones_like(streak)*.72,np.ones_like(streak)*.43,streak]))
drop=np.zeros((n,n),np.float32)
for _ in range(90):
 cx,cy=rng.random(2);s=rng.uniform(.003,.018);dist=((lx-cx)/s)**2+((ly-cy)/(s*1.4))**2;drop+=np.sqrt(np.clip(1-dist,0,1))*.05
save('raindrops-lens-normal.png',normal(drop));save('raindrops-lens-mask.png',np.clip(drop*20,0,1))
# Truly periodic scalar 3D noise, 64 cubed; raw x-fastest and an 8x8 slice atlas.
z,y3,x3=np.mgrid[:64,:64,:64].astype(np.float32)/64;volume=np.zeros_like(x3)
for f,amp in [(1,.45),(2,.25),(4,.16),(8,.09),(16,.05)]:volume+=amp*np.sin(math.tau*(x3*f+y3*(f+1)+z*(f+2))+.73*f)*np.cos(math.tau*(x3*(f+2)-y3*f+z*(f+1)))
volume=np.uint8(np.clip(volume*.5+.5,0,1)*255);(OUT/'fog-noise-64x64x64.raw').write_bytes(volume.tobytes())
tile=np.zeros((512,512),np.uint8)
for i in range(64):cy,cx=divmod(i,8);tile[cy*64:(cy+1)*64,cx*64:(cx+1)*64]=volume[i]
Image.fromarray(tile).save(OUT/'fog-noise-slices.png')
(OUT/'flipbooks.json').write_text(json.dumps({'schemaVersion':1,'provenance':'Original deterministic analytic particle simulation and periodic shader fields; not edits of the AI smoke source.','flipbooks':records,'noiseVolume':{'file':'fog-noise-64x64x64.raw','dimensions':[64,64,64],'format':'R8_UNORM','order':'x fastest then y then z','wrap':'repeat all axes'},'sampling':'Inset UVs by half a pixel; avoid ordinary whole-atlas mipmaps bleeding between cells. Use per-frame textures or clamp LOD at distance.','pending':'In-game effect-size, exposure and timing review; these are authored particle renders, not fluid-sim cinematics.'},indent=2), encoding="utf-8")
(OUT/'README.md').write_text('Flipbooks 2048² / 8×8 / 256 px per frame; world size set by emitter, nominal smoke 1–3m; straight alpha; shader normals linear OpenGL +Y; exact durations in flipbooks.json.\n', encoding="utf-8")
print('VFX simulation render complete',flush=True)
