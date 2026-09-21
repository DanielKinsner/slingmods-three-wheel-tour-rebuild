"""Deterministic PBR channel authoring and runtime atlas packaging.
Original generated and CC0 source bytes are retained. Resampling never claims
new captured detail. ORM and OpenGL normals are linear numerical fields.
"""
from pathlib import Path
from PIL import Image
import numpy as np,json
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'public/assets/p11';records=[]
def save(path,a):
 path.parent.mkdir(parents=True,exist_ok=True)
 if a.dtype!=np.uint8:a=np.uint8(np.clip(a,0,1)*255+.5)
 Image.fromarray(a).save(path)
def load(path,n=None,mode='RGB'):
 source=Image.open(path)
 if mode=='L' and source.mode in ['I;16','I','F']:
  a=np.asarray(source,dtype=np.float32);a/=65535 if source.mode!='F' else max(float(a.max()),1)
  if n:a=np.asarray(Image.fromarray(a).resize((n,n),Image.Resampling.LANCZOS))
  return a
 im=source.convert(mode)
 if n:im=im.resize((n,n),Image.Resampling.LANCZOS)
 return np.asarray(im,dtype=np.float32)/255
def periodic_smooth(a,radius):
 fy=np.fft.fftfreq(a.shape[0])[:,None];fx=np.fft.rfftfreq(a.shape[1])[None,:]
 kernel=np.exp(-2*np.pi*np.pi*radius*radius*(fx*fx+fy*fy))
 return np.fft.irfft2(np.fft.rfft2(a)*kernel,s=a.shape).astype(np.float32)
def norm(h,strength):
 dx=(np.roll(h,-1,1)-np.roll(h,1,1))*strength;dy=(np.roll(h,-1,0)-np.roll(h,1,0))*strength
 a=np.stack([-dx,dy,np.ones_like(h)],axis=-1);a/=np.linalg.norm(a,axis=-1,keepdims=True);return a*.5+.5
# Road source is a 2m scan. Two repeats in each axis gives a 4m tile at 1024px/m.
road=OUT/'race-asphalt'
for channel in ['baseColor','normal','ORM','height']:
 a=load(road/('dry-'+channel+'.png'),2048,'L' if channel=='height' else 'RGB')
 tile=np.tile(a,(2,2) if a.ndim==2 else (2,2,1));save(road/('dry-4m-'+channel+'.png'),tile)
 del a,tile
height=load(road/'dry-4m-height.png',2048,'L');low=periodic_smooth(height,40)
threshold=np.quantile(low,.25);mask=np.clip((threshold-low)/max(float(low.std())*.22,.0001)+.5,0,1)
save(road/'puddle-mask.png',mask)
wet=load(road/'dry-4m-baseColor.png')*.65;save(road/'wet-baseColor.png',wet);del wet
orm=load(road/'dry-4m-ORM.png');mask4=np.asarray(Image.fromarray(np.uint8(mask*255)).resize((4096,4096),Image.Resampling.BILINEAR),dtype=np.float32)/255
low4=np.asarray(Image.fromarray(low).resize((4096,4096),Image.Resampling.BILINEAR));low4=(low4-low4.min())/max(float(np.ptp(low4)),1e-6)
orm[:,:,1]=orm[:,:,1]*(1-mask4)*.7+(.05+.2*low4)*mask4;save(road/'wet-ORM.png',orm);del orm,low4
n=load(road/'dry-4m-normal.png')*2-1;n[:,:,:2]*=(1-mask4[:,:,None]*.94);n/=np.linalg.norm(n,axis=-1,keepdims=True);save(road/'wet-normal.png',n*.5+.5);del n,mask4
Image.open(road/'dry-4m-height.png').save(road/'wet-height.png')
# Micro-aggregate data at a separate half-metre tile, analytically periodic.
y,x=np.mgrid[:2048,:2048].astype(np.float32)/2048
h=np.sin(2*np.pi*(83*x+61*y))*.2+np.sin(2*np.pi*(117*x-79*y))*.12+np.sin(2*np.pi*(171*x+139*y))*.07
save(road/'detail-normal.png',norm(h,1.5))
(road/'material.json').write_text(json.dumps({'dry':{'prefix':'dry-4m','size':4096,'tileMetres':[4,4],'pixelsPerMetre':1024,'source':'asphalt_track, CC0, native 4K 2m scan reduced to 2K and repeated 2x2 to preserve physical aggregate scale'},'wet':{'prefix':'wet','baseColorValueMultiplier':.65,'puddleRoughnessRange':[.05,.25],'puddleCoverage':float((mask>.5).mean()),'puddleMaskSize':2048},'detail':{'file':'detail-normal.png','size':2048,'tileMetres':[.5,.5],'authoring':'Original periodic numerical aggregate field'},'normalConvention':'OpenGL +Y','ORM':['occlusion','roughness','metallic']},indent=2), encoding="utf-8")
(road/'README.md').write_text('Dry/wet 4096² 4m tile = 1024px/m; detail normal 2048² 0.5m tile = 4096px/m; 2K puddle mask ~25% coverage; original CC0 scan and AI draft preserved.\n', encoding="utf-8")
# Pack generated card sources without adding invented detail. Numerical companion
# maps use flat-card normals and specified roughness/transmission, not inferred geometry.
for folder,prefix,src in [('ridge-trees',s+'-leaves',s+'-leaves-source.png') for s in ['oak','sycamore','eucalyptus']]+[('ground-cover','cards','cards-baseColor-source.png')]:
 dest=OUT/folder;im=Image.open(dest/src).convert('RGBA');sourceSize=list(im.size);im=im.resize((4096,4096),Image.Resampling.LANCZOS);im.save(dest/(prefix+'-baseColor.png'))
 alpha=np.asarray(im.getchannel('A'),dtype=np.float32)/255
 normal=np.zeros((4096,4096,4),np.uint8);normal[:,:,0:2]=128;normal[:,:,2]=255;normal[:,:,3]=np.uint8(alpha*255);save(dest/(prefix+'-normal.png'),normal);del normal
 save(dest/(prefix+'-roughness.png'),np.full(alpha.shape,.68,np.float32))
 save(dest/(prefix+'-translucency.png'),alpha*.58)
 records.append({'asset':prefix,'sourceFile':src,'sourcePixels':sourceSize,'runtimePixels':[4096,4096],'resampling':'Lanczos packaging; no new source detail','normal':'Flat +Z card normal, not measured leaf relief','roughness':.68,'translucency':.58,'cells':[4,3]})
# Foam is a material mask. Preserve source and create specified 1K runtime mask.
im=Image.open(OUT/'harbor-water/foam-source.png').convert('RGBA').resize((1024,1024),Image.Resampling.LANCZOS);a=np.asarray(im,dtype=np.float32)/255;grey=a[:,:,:3].mean(axis=-1)*a[:,:,3];save(OUT/'harbor-water/foam.png',np.dstack([grey,grey,grey,a[:,:,3]]))
# Shoulder weights: RGBA asphalt, gravel, dirt, litter. x is distance from edge.
y,x=np.mgrid[:1024,:1024].astype(np.float32)/1024;dist=x*6+.16*np.sin(y*2*np.pi*13)+.07*np.sin(y*2*np.pi*37)
centres=np.array([0,1.3,3,5.2]);w=np.exp(-((dist[:,:,None]-centres)/.85)**2);w/=w.sum(axis=-1,keepdims=True);save(OUT/'ground-cover/shoulder-blend-weights.png',w)
(OUT/'ground-cover/placement.json').write_text(json.dumps({'distanceBandsMetres':[[0,6],[6,20],[20,120]],'instancesPerSquareMetre':{'grass':[2,.3,0],'shrubs':[.08,.015,0],'flowers':[.07,.01,0],'rocks':[.03,.006,0]},'impostersBeyondMetres':20,'roadClearanceMetres':.35,'shoulderMask':{'file':'shoulder-blend-weights.png','channels':['asphalt','gravel','dirt','leaf-litter'],'xRangeMetres':[0,6],'yTileMetres':16},'groundMaterialTileMetres':[4,4],'note':'Scanned source scales differ slightly; see per-material provenance. Density is an initial authored recommendation, not a measured performance budget.'},indent=2), encoding="utf-8")
(OUT/'atlas-authoring.json').write_text(json.dumps({'generatedCards':records},indent=2), encoding="utf-8")
print('Prepared dry/wet asphalt, card companions, foam and shoulder data')
