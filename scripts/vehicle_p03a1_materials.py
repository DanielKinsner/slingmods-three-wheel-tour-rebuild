"""P03A1 antialiased paint artwork and versioned map dependencies. Called only after surface review."""
import numpy as np,shutil
TEX=P/'public/assets/textures/p03a1';TEX.mkdir(parents=True,exist_ok=True)
# Preserve existing authored material maps as separate versioned source dependencies.
for im in bpy.data.images:
 if im.source!='FILE' or not im.filepath:continue
 src=pathlib.Path(bpy.path.abspath(im.filepath))
 if src.is_file():
  dest=TEX/src.name;shutil.copy2(src,dest);im.filepath=str(dest)
def grid(n):return np.meshgrid(np.linspace(0,1,n,endpoint=False),np.linspace(0,1,n,endpoint=False))
recipe=(P/'scripts/vehicle_p03a_materials.py').read_text()
recipe=recipe[recipe.index('# Radar Blue Fade'):recipe.index('rng=np.random.default_rng')]
# Analytic signed-distance coverage, confined to artwork boundaries. No map resize.
# ORM/normal have no graphic masks and stay untouched.
exec(recipe.replace('n=1024;','n=2048;'),globals())
def coverage(px,py,verts,sx=2048/2.04,sy=2048/3.84):
 inside=polygon_mask(px,py,verts);dist=np.full(px.shape,np.inf,dtype=np.float32)
 for i,(ax,ay) in enumerate(verts):
  bx,by=verts[(i+1)%len(verts)];dx=(bx-ax)*sx;dy=(by-ay)*sy
  vx=(px-ax)*sx;vy=(py-ay)*sy;t=np.clip((vx*dx+vy*dy)/(dx*dx+dy*dy),0,1)
  dist=np.minimum(dist,(vx-t*dx)**2+(vy-t*dy)**2)
 signed=np.sqrt(dist)*np.where(inside,1,-1)
 a=np.clip(.5+signed/1.5,0,1);return a*a*(3-2*a)
def lin(a):return np.where(a<=.04045,a/12.92,((a+.055)/1.055)**2.4)
base[:,:,0]=.018+.012*fade;base[:,:,1]=.26+.18*fade;base[:,:,2]=.60+.22*fade
rgb=lin(base)
black_cov=coverage(xx,y,[(.23,.49),(.54,.55),(.66,.86),(.73,1.22),(.49,1.77),(.43,1.77),(.60,1.18),(.52,.88)])
orange_cov=coverage(xx,y,[(.36,.60),(.51,.64),(.605,.87),(.673,1.19),(.602,1.30),(.614,1.13),(.56,.91)])
black_cov=np.maximum(black_cov,coverage(xx,y,[(.883,1.4),(.895,1.4),(.895-.045*.57,1.97),(.883-.045*.57,1.97)]))
orange_cov=np.maximum(orange_cov,coverage(xx,y,[(.895,1.4),(.938,1.4),(.938-.025*.57,1.97),(.895-.045*.57,1.97)]))
for ya,yb in [(-1.115,-1.008),(-.993,-.925),(-.91,-.877)]:
 orange_cov=np.maximum(orange_cov,coverage(y,xx,[(ya,.835),(yb,.814),(yb+.086,.773),(ya+.087,.773)],2048/3.84,2048/2.04))
for mask,col in [(black_cov,(.018,.035,.058)),(orange_cov,(.98,.245,.025))]:
 rgb=rgb*(1-mask[:,:,None])+lin(np.array(col))[None,None,:]*mask[:,:,None]
rgb=np.where(rgb<=.0031308,rgb*12.92,1.055*rgb**(1/2.4)-.055)
im=bpy.data.images.new('P03A1_radar_blue_coverage_AA',width=2048,height=2048,alpha=True);im.colorspace_settings.name='sRGB'
rgba=np.ones((2048,2048,4),np.float32);rgba[:,:,:3]=rgb;im.pixels.foreach_set(rgba.ravel());im.filepath_raw=str(TEX/'radar-blue_basecolor.png');im.file_format='PNG';im.save()
for node in paint.node_tree.nodes:
 if node.type=='TEX_IMAGE' and node.image and node.image.name.startswith('radar-blue_basecolor'):node.image=im
old=bpy.data.images.get('radar-blue_basecolor')
if old is not None and old.users==0:bpy.data.images.remove(old)
# Broad upholstered inserts have fabric-like reflectance at readable medium gray.
bs=seataccent.node_tree.nodes['Principled BSDF'];bs.inputs['Base Color'].default_value=(.19,.205,.218,1);bs.inputs['Roughness'].default_value=.86
# Same-resolution tread reauthor: curved directional branches and a shallow ramp
# into the groove generate a real tangent-space slope, not a painted dark stripe.
def replace_map(name,rgb,color):
 image=bpy.data.images.get(name)
 image.colorspace_settings.name='sRGB' if color else 'Non-Color'
 rgba=np.ones((*rgb.shape[:2],4),np.float32);rgba[:,:,:3]=np.clip(rgb,0,1)
 image.pixels.foreach_set(rgba.ravel());image.filepath_raw=str(TEX/(name+'.png'));image.file_format='PNG';image.save()
u,v=grid(1024);d=np.abs(v-.5);tread=np.clip((.492-d)/.025,0,1)
# 36 broad swept repeats, extending across the rounded shoulders and two continuous center channels.
phase=np.mod(u*36+.85*(d/.492)**1.7,1)
distance=np.minimum(phase,1-phase)
branch=np.clip((.145-distance)/.055,0,1)
channel=np.maximum(np.clip((.018-np.abs(v-.35))/.007,0,1),np.clip((.018-np.abs(v-.65))/.007,0,1))
groove=np.maximum(branch,channel)*tread
height=-.0038*groove
shade=(.152+.068*tread)*(1-groove)+.054*groove
replace_map('road-tire_basecolor',np.dstack([shade*.94,shade*.99,shade*1.025]),True)
replace_map('road-tire_orm',np.dstack([np.ones_like(u),.77+.10*groove,np.zeros_like(u)]),False)
dy,dx=np.gradient(height,.225/1024,2.1/1024);normal=np.dstack([-dx,-dy,np.ones_like(u)]);normal/=np.linalg.norm(normal,axis=2)[:,:,None]
replace_map('road-tire_normal',normal*.5+.5,False)
for node in rubber.node_tree.nodes:
 if node.type=='NORMAL_MAP':node.inputs['Strength'].default_value=1.15
records=[]
for path in sorted(TEX.glob('*.png')):
 raw=path.read_bytes();w,h=__import__('struct').unpack('>II',raw[16:24]);records.append({'file':str(path.relative_to(P)),'width':w,'height':h,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'rgba8Bytes':w*h*4})
comparison=[]
for r in records:
 oldpath=P/'public/assets/textures/p03a'/pathlib.Path(r['file']).name
 oldbytes=oldpath.read_bytes();before=list(__import__('struct').unpack('>II',oldbytes[16:24]))
 comparison.append({'name':oldpath.name,'before':before,'after':[r['width'],r['height']],'contentChanged':hashlib.sha256(oldbytes).hexdigest()!=r['sha256']})
(EV/'texture-manifest.json').write_text(json.dumps({'maps':records,'comparisonToP03A':comparison,'changedDimensions':[r['name'] for r in comparison if r['before']!=r['after']],'changedContents':[r['name'] for r in comparison if r['contentChanged']],'pngFileBytes':sum(r['bytes'] for r in records),'method':'P03A authored maps preserved separately; paint basecolor at2048 with analytic signed-distance edge coverage blended in linear light; same1024 directional tire maps with36 broad continuous curved branches extended over the physical shoulder UVs','baseRGBA8Bytes':sum(r['rgba8Bytes']for r in records),'rgba8MipEstimateBytes':round(sum(r['rgba8Bytes']for r in records)*4/3),'runtimeAllocation':'Separate measurement required; texture objects can share image bytes but duplicate GPU allocations','noPhotographicTextures':True},indent=2))
