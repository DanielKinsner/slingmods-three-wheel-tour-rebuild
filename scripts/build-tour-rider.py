"""Original Tour Rider v1, built on the game's owned fit skeleton.
Run Blender in background: blender -b -t 4 --python scripts/build-tour-rider.py
No downloads, add-ons, paid assets, human likenesses, or changes to historical assets.
"""
import bpy, bmesh, math, pathlib, json, struct, hashlib
import numpy as np
from mathutils import Vector
P=pathlib.Path(__file__).resolve().parents[1]
OUT=P/'public/assets/drivers/tour-rider'; OUT.mkdir(parents=True,exist_ok=True)
SRC=P/'assets/blender/drivers/tour-rider.blend'
bpy.ops.wm.open_mainfile(filepath=str(P/'assets/blender/drivers/test-driver.blend'))
rig=bpy.data.objects['driver_rig']
# Preserve semantic joints, bind matrices and contact pivots exactly.
for ob in list(bpy.data.objects):
 if ob.type=='MESH' and (ob.name.startswith(('driver_helmet','driver_opaque','Jacket_sewn'))):
  bpy.data.objects.remove(ob,do_unlink=True)
meshes=[o for o in bpy.data.objects if o.type=='MESH']
jacket=bpy.data.objects['driver_jacket']
# Gentle compression folds follow the existing seated cut rather than inflating its silhouette.
for ob in [jacket,bpy.data.objects['driver_trousers']]:
 for v in ob.data.vertices:
  c=v.co
  if ob==jacket:
   envelope=math.exp(-((c.z-.565)/.095)**2)
   v.co+=v.normal*(.0026*envelope*math.sin(c.z*145+(c.x+.36)*18))
  else:
   envelope=math.exp(-((c.y-.13)/.08)**2)
   v.co+=v.normal*(.002*envelope*math.sin(c.y*140+c.x*20))
 ob.data.update()
# Keep the chest on the torso. The old nearest-three weighting let a reaching elbow pull
# vertices from the abdomen, especially on handlebars. Smooth sleeve transitions retain fit.
def smooth(x):
 x=max(0,min(1,x));return x*x*(3-2*x)
def segment_distance(p,bone):
 a=bone.head_local;b=bone.tail_local;d=b-a;t=max(0,min(1,(p-a).dot(d)/d.length_squared));return(p-a-d*t).length
for v in jacket.data.vertices:
 c=v.co;side='left'if c.x<-.36 else'right';sleeve=smooth((abs(c.x+.36)-.13)/.085)*smooth((c.z-.52)/.10)
 spine=smooth((c.z-.455)/.19);neck=.65*smooth((c.z-.934)/.075)
 weights={'driver_pelvis':(1-spine)*(1-sleeve),'driver_spine':spine*(1-neck)*(1-sleeve),'driver_head':spine*neck*(1-sleeve)}
 arm_names=['driver_upper_arm_'+side,'driver_forearm_'+side];aw=[1/(segment_distance(c,rig.data.bones[n])**2+.001)**2 for n in arm_names]
 for n,w in zip(arm_names,aw):weights[n]=sleeve*w/sum(aw)
 for group in jacket.vertex_groups:group.remove([v.index])
 best=sorted(weights.items(),key=lambda pair:pair[1],reverse=True)[:4];total=sum(w for n,w in best)
 for n,w in best:
  if w>1e-8:jacket.vertex_groups[n].add([v.index],w/total,'REPLACE')

def mesh(name,verts,faces,bone=None):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update()
 bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(me);bm.free()
 ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);ob.parent=rig
 for p in me.polygons:p.use_smooth=True
 if bone:
  g=ob.vertex_groups.new(name='driver_'+bone);g.add(list(range(len(verts))),1,'REPLACE')
 else:
  # Transfer the actual jacket weights to surface-following trim so seams deform with it.
  for g in jacket.vertex_groups:ob.vertex_groups.new(name=g.name)
  for v in me.vertices:
   ok,pt,n,idx=jacket.closest_point_on_mesh(v.co)
   poly=jacket.data.polygons[idx];verts=[jacket.data.vertices[i]for i in poly.vertices[:3]]
   a,b,c=[q.co for q in verts];ab=b-a;ac=c-a;ap=pt-a
   d00=ab.dot(ab);d01=ab.dot(ac);d11=ac.dot(ac);d20=ap.dot(ab);d21=ap.dot(ac);denom=d00*d11-d01*d01
   vb=(d11*d20-d01*d21)/denom if abs(denom)>1e-16 else 0;vc=(d00*d21-d01*d20)/denom if abs(denom)>1e-16 else 0
   weights={}
   for q,w in zip(verts,[1-vb-vc,vb,vc]):
    for g in q.groups:weights[g.group]=weights.get(g.group,0)+g.weight*max(0,w)
   best=sorted(weights.items(),key=lambda pair:pair[1],reverse=True)[:4];total=sum(w for group,w in best)
   for group,w in best:ob.vertex_groups[group].add([v.index],w/total,'REPLACE')
 mod=ob.modifiers.new('Semantic rider skeleton','ARMATURE');mod.object=rig
 meshes.append(ob);return ob

def tube(name,points,radius,bone=None,segments=8):
 vs=[];fs=[];previous=None
 for i,p in enumerate(points):
  tangent=(Vector(points[min(i+1,len(points)-1)])-Vector(points[max(0,i-1)])).normalized()
  axis=previous-tangent*previous.dot(tangent)if previous is not None else Vector((0,0,0))
  if axis.length<.01:
   reference=min([Vector((1,0,0)),Vector((0,1,0)),Vector((0,0,1))],key=lambda v:abs(v.dot(tangent)))
   axis=tangent.cross(reference)
  axis.normalize();previous=axis.copy();other=tangent.cross(axis)
  for j in range(segments):
   a=math.tau*j/segments;vs.append(Vector(p)+radius*(axis*math.cos(a)+other*math.sin(a)))
 for i in range(len(points)-1):
  for j in range(segments):a=i*segments+j;b=i*segments+(j+1)%segments;fs.append((a,b,b+segments,a+segments))
 fs +=[tuple(reversed(range(segments))),tuple((len(points)-1)*segments+j for j in range(segments))]
 return mesh(name,vs,fs,bone)

def surface_path(name,points,tile='thread',radius=.0011):
 ps=[]
 for x,z in points:
  ok,co,no,idx=jacket.ray_cast(Vector((x,1,z)),Vector((0,-1,0)))
  if ok:ps.append(co+no*.003)
 if len(ps)>1:
  ob=tube(name,ps,radius);ob['tile']=tile
  return ob

def patch(name,points,bone,tile):
 ob=mesh(name,points,[tuple(range(len(points)))],bone);ob['tile']=tile
 sol=ob.modifiers.new('Tailored panel thickness','SOLIDIFY');sol.thickness=.0015
 bpy.context.view_layer.objects.active=ob;bpy.ops.object.modifier_apply(modifier=sol.name)
 return ob

# Tailoring: a covered zip, pockets that follow the chest, double topstitching and back yoke.
surface_path('Jacket_zip_welt',[(-.36,.46+i*.017)for i in range(28)],'rubber',.0028)
for side in [-1,1]:
 for offset in [0,.004]:
  surface_path('Double_chest_topstitch', [(-.36+side*(.115+offset),.56+i*.021)for i in range(16)])
 surface_path('Chest_pocket_welt',[(-.36+side*(.052+i*.004),.817-i*.001)for i in range(20)],'rubber',.002)
 surface_path('Chest_pocket_stitch',[(-.36+side*(.052+i*.004),.809-i*.001)for i in range(20)])
 surface_path('Shoulder_yoke',[(-.36+side*(.02+i*.009),.883-i*.0015)for i in range(18)])
surface_path('Zip_pull',[(-.36,.827),(-.358,.810),(-.365,.805),(-.368,.823),(-.36,.827)],'metal',.0015)
# Precisely bounded chest yoke made from projected quad strips, with a continuous sewn edge.
points=[];faces=[]
for row in range(5):
 for col in range(41):
  x=-.53+col*.0085;edge=.861-.035*(abs(x+.36)/.17)**1.4;z=edge+row*.010
  ok,co,no,idx=jacket.ray_cast(Vector((x,1,z)),Vector((0,-1,0)))
  points.append(co+no*.0025 if ok else Vector((x,-.44,z)))
for row in range(4):
 for col in range(40):i=row*41+col;faces.append((i,i+1,i+42,i+41))
ob=mesh('Tailored_chest_yoke',points,faces);ob['tile']='panel'
surface_path('Yoke_bound_stitch',[(-.53+col*.0085,.856-.035*(abs(-.17+col*.0085)/.17)**1.4)for col in range(41)],'thread',.0011)
# Back panel piping, situated directly on the garment and weighted to the same nearby cloth.
ps=[]
for i in range(35):
 x=-.515+i*.009;z=.84-.045*(abs(x+.36)/.16)
 ok,co,no,idx=jacket.ray_cast(Vector((x,-1,z)),Vector((0,1,0)))
 if ok:ps.append(co+no*.0015)
ob=tube('Back_yoke_topstitch',ps,.0011);ob['tile']='thread'
# Quiet reflective tab at nape; useful detail, no oversized badge or invented branding.
ps=[]
for i in range(9):
 x=-.392+i*.008
 ok,co,no,idx=jacket.ray_cast(Vector((x,-1,.893)),Vector((0,1,0)))
 if ok:ps.append(co+no*.002)
ob=tube('Nape_reflective_tab',ps,.0024);ob['tile']='reflective'

# Glove knuckle shells and stitched wrist closures; boots get toe caps, welt and actual soles.
for side in ['left','right']:
 hand=rig.data.bones['driver_hand_'+side].head_local.copy()
 s=-1 if side=='left' else 1
 for j in range(4):
  z=hand.z+(j-1.5)*.019
  ob=tube('Glove_knuckle_'+side+str(j),[(hand.x+s*.026,hand.y-.028,z-.006),(hand.x+s*.033,hand.y-.024,z),(hand.x+s*.030,hand.y-.013,z+.006)],.0045,'hand_'+side,8);ob['tile']='rubber'
 x=-.49 if side=='left' else -.28
 for z,r,tile in [(.175,.007,'rubber'),(.185,.002,'thread')]:
  ps=[(x+dx,y,z)for dx,y in [(-.038,.40),(-.05,.45),(-.052,.535),(-.038,.596),(0,.614),(.038,.596),(.052,.535),(.05,.45),(.038,.40),(-.038,.40)]]
  ob=tube('Boot_welt_'+side,ps,r,'foot_'+side);ob['tile']=tile
 # Sole fills the outline instead of leaving a floating ring.
 patch('Boot_sole_'+side,[(x+dx,y,.172)for dx,y in [(-.038,.40),(-.05,.45),(-.052,.535),(-.038,.596),(0,.614),(.038,.596),(.052,.535),(.05,.45),(.038,.40)]] ,'foot_'+side,'rubber')
 for y in [.442,.463,.484]:
  ob=tube('Boot_instep_stitch_'+side,[(x-.034,y,.237),(x,y+.003,.248),(x+.034,y,.237)],.0012,'foot_'+side);ob['tile']='thread'

# Full-face helmet: shaped chin bar, brow, gasket, visor curvature, hinge hardware and vent inlets.
head=Vector((-.36,-.50,1.132));lat=32;seg=64

def shellpoint(phi,a,extra=0):
 z=math.cos(phi);r=math.sin(phi);front=max(0,math.sin(a))
 chin=max(0,1-abs(z+.51)/.39)*front*.049
 jaw=1-.12*max(0,-z)
 return head+Vector(((.120+extra)*r*math.cos(a)*jaw,((.148+extra)*r+chin)*math.sin(a),(.154+extra)*z))
vs=[shellpoint(.012+(math.pi-.024)*i/lat,math.tau*j/seg)for i in range(lat+1)for j in range(seg)]
fs=[(i*seg+j,i*seg+(j+1)%seg,(i+1)*seg+(j+1)%seg,(i+1)*seg+j)for i in range(lat)for j in range(seg)]
fs +=[tuple(reversed(range(seg))),tuple(lat*seg+j for j in range(seg))]
helmet=mesh('Tour_helmet_shell',vs,fs,'head');helmet['tile']='paint';helmet['head']=True

def visorpoint(u,v,extra=0):
 a=math.pi/2-1.30+u*2.60
 # Lower sides lift to follow cheek profile. A real shield silhouette rather than a flat band.
 z=-.024+.096*v+.014*(abs(u-.5)*2)**3*(1-v)
 r=math.sqrt(1-(z/.158)**2)
 return head+Vector(((.123+extra)*r*math.cos(a),(.152+extra)*r*math.sin(a),z))
vs=[visorpoint(j/48,i/12)for i in range(13)for j in range(49)]
fs=[(i*49+j,i*49+j+1,(i+1)*49+j+1,(i+1)*49+j)for i in range(12)for j in range(48)]
visor=mesh('Tour_smoke_visor',vs,fs,'head');visor['tile']='visor';visor['head']=True
edge=[visorpoint(j/48,0,.001)for j in range(49)]+[visorpoint(1,i/12,.001)for i in range(1,13)]+[visorpoint(j/48,1,.001)for j in range(47,-1,-1)]+[visorpoint(0,i/12,.001)for i in range(11,-1,-1)]
ob=tube('Visor_rubber_gasket',edge,.0025,'head');ob['tile']='rubber';ob['head']=True
# Twin crown vent channels; short contour strips at the brow, never decorative horns.
for side in [-1,1]:
 a=math.pi/2+side*.30
 ob=tube('Crown_vent', [shellpoint(.38+i*.055,a,.0018)for i in range(10)],.004,'head');ob['tile']='rubber';ob['head']=True
 # Hinges are shallow, concentric discs oriented along the shell side.
 center=head+Vector((side*.119,.032,.028))
 for radius,tile,dx in [(.016,'rubber',0),(.009,'metal',side*.002)]:
  points=[center+Vector((dx,radius*math.cos(j*math.tau/32),radius*math.sin(j*math.tau/32)))for j in range(33)]
  ob=tube('Shield_pivot',points,.0025,'head');ob['tile']=tile;ob['head']=True
# Chin vent projected on the forward face of the shell.
for i in range(3):
 z=-.082+i*.008;phi=math.acos(z/.158)
 ob=tube('Chin_vent', [shellpoint(phi,math.pi/2-.24+j*.03,.002)for j in range(17)],.002,'head');ob['tile']='rubber';ob['head']=True
# Base seal follows the lower shell, a restrained satin-black trim.
ob=tube('Helmet_base_seal',[shellpoint(2.62,math.tau*j/64,.001)for j in range(65)],.003,'head');ob['tile']='rubber';ob['head']=True

# One shared PBR atlas: broad garment colour regions and fine woven/leather normal relief.
N=1024;yy,xx=np.mgrid[0:N,0:N];rng=np.random.default_rng(20260923)
noise=rng.normal(0,1,(N,N)).astype(np.float32);weave=np.sin(xx*math.pi/2)*np.sin(yy*math.pi/2)
base=np.ones((N,N,4),np.float32);orm=np.ones((N,N,4),np.float32);normal=np.ones((N,N,4),np.float32)
normal[:,:,:3]=[.5,.5,1];orm[:,:,2]=0
# Slots: four columns, four rows; two by two block reserved for the main jacket textile.
rects={'cloth':(.005,.495,.005,.495),'pants':(.505,.995,.005,.495),'leather':(.005,.245,.505,.745),'rubber':(.255,.495,.505,.745),'paint':(.505,.745,.505,.745),'visor':(.755,.995,.505,.745),'thread':(.005,.245,.755,.995),'metal':(.255,.495,.755,.995),'reflective':(.505,.745,.755,.995),'panel':(.755,.995,.755,.995)}
spec={'cloth':((112,123,108),.83,0,.025,.13),'pants':((49,54,59),.9,0,.026,.12),'leather':((36,38,37),.59,0,.035,.10),'rubber':((20,23,25),.74,0,.012,.025),'paint':((205,208,198),.30,.05,.001,.001),'visor':((30,44,51),.12,.48,.0005,0),'thread':((146,151,137),.83,0,.014,.06),'metal':((76,80,79),.34,.75,.003,.004),'reflective':((184,190,178),.42,.25,.006,.02),'panel':((42,49,46),.86,0,.018,.10)}
for tile,(u0,u1,v0,v1)in rects.items():
 # Fill complete padded cells; UVs stay inset to keep mip seams out of neighbouring materials.
 x0=int((u0-.005)*N+.01);x1=int((u1+.005)*N+.01);y0=int((v0-.005)*N+.01);y1=int((v1+.005)*N+.01)
 color,rough,metal,grain,amp=spec[tile];n=noise[y0:y1,x0:x1];w=weave[y0:y1,x0:x1]
 variation=1+grain*n+(.021*w if tile in ['cloth','pants','panel'] else 0)
 base[y0:y1,x0:x1,:3]=np.array(color)/255*variation[:,:,None]
 orm[y0:y1,x0:x1,1]=np.clip(rough+n*.014,0,1);orm[y0:y1,x0:x1,2]=metal
 nx=amp*np.cos(xx[y0:y1,x0:x1]*math.pi/2)*np.sin(yy[y0:y1,x0:x1]*math.pi/2)
 ny=amp*np.sin(xx[y0:y1,x0:x1]*math.pi/2)*np.cos(yy[y0:y1,x0:x1]*math.pi/2)
 normal[y0:y1,x0:x1,:3]=np.stack((nx*.5+.5,ny*.5+.5,np.sqrt(1-nx*nx-ny*ny)*.5+.5),axis=-1)
images={}
for name,arr,space in [('basecolor',base,'sRGB'),('normal',normal,'Non-Color'),('orm',orm,'Non-Color')]:
 im=bpy.data.images.new('Tour_Rider_'+name,width=N,height=N,alpha=True);im.colorspace_settings.name=space;im.pixels.foreach_set(np.clip(arr,0,1).astype(np.float32).ravel());im.filepath_raw=str(OUT/(name+'.png'));im.file_format='PNG';im.save();im.pack();images[name]=im
materials={}
for name in ['Tour_Rider_Garment','Tour_Rider_Shell','Tour_Rider_Shield']:
 mat=bpy.data.materials.new(name);mat.use_nodes=True;nt=mat.node_tree;bs=nt.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(1,1,1,1)
 ns={}
 for k,im in images.items():ns[k]=nt.nodes.new('ShaderNodeTexImage');ns[k].image=im
 nt.links.new(ns['basecolor'].outputs['Color'],bs.inputs['Base Color']);sep=nt.nodes.new('ShaderNodeSeparateColor');nt.links.new(ns['orm'].outputs['Color'],sep.inputs['Color']);nt.links.new(sep.outputs['Green'],bs.inputs['Roughness']);nt.links.new(sep.outputs['Blue'],bs.inputs['Metallic'])
 nm=nt.nodes.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.28;nt.links.new(ns['normal'].outputs['Color'],nm.inputs['Color']);nt.links.new(nm.outputs['Normal'],bs.inputs['Normal'])
 if name=='Tour_Rider_Shell':bs.inputs['Coat Weight'].default_value=.3;bs.inputs['Coat Roughness'].default_value=.24
 materials[name]=mat
for ob in meshes:
 name=ob.name
 if ob.get('tile'):tile=ob['tile']
 elif name=='driver_jacket':tile='cloth'
 elif name=='driver_trousers':tile='pants'
 else:tile='leather'
 ob.data.materials.clear();ob.data.materials.append(materials['Tour_Rider_Shell'if ob==helmet else'Tour_Rider_Shield'if ob==visor else'Tour_Rider_Garment'])
 bpy.context.view_layer.objects.active=ob;bpy.ops.object.select_all(action='DESELECT');ob.select_set(True)
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.0,island_margin=.015);bpy.ops.object.mode_set(mode='OBJECT')
 for poly in ob.data.polygons:
  region=tile
  u0,u1,v0,v1=rects[region]
  for li in poly.loop_indices:
   uv=ob.data.uv_layers.active.data[li].uv;uv.x=u0+uv.x*(u1-u0);uv.y=v0+uv.y*(v1-v0)
# Metadata is the opt-in contract; old assets keep their original pose behavior.
bpy.data.objects['driver_root']['riderMotionVersion']=1
bpy.data.objects['driver_root']['riderDesign']='Tour Rider / sage textile / porcelain shell'
bpy.context.scene.unit_settings.system='METRIC'
# Keep all individually editable garment components, weights and packed textures in the source.
bpy.ops.wm.save_as_mainfile(filepath=str(SRC),compress=True)
headparts=[o for o in meshes if o.get('head')];bodyparts=[o for o in meshes if not o.get('head')]
for name,obs in [('driver_head_visual',headparts),('driver_body_visual',bodyparts)]:
 bpy.ops.object.select_all(action='DESELECT')
 for ob in obs:ob.select_set(True)
 bpy.context.view_layer.objects.active=obs[0];bpy.ops.object.join();bpy.context.object.name=name
bpy.ops.object.select_all(action='DESELECT')
for ob in bpy.data.objects:ob.select_set(True)
file=OUT/'tour-rider.glb'
bpy.ops.export_scene.gltf(filepath=str(file),export_format='GLB',use_selection=True,export_yup=True,export_skins=True,export_animations=False,export_extras=True)
raw=file.read_bytes();n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);tri=sum(g['accessors'][pr['indices']]['count']//3 for m in g['meshes']for pr in m['primitives'])
report={'version':1,'source':'assets/blender/drivers/tour-rider.blend','asset':'/assets/drivers/tour-rider/tour-rider.glb','triangles':tri,'primitives':sum(len(m['primitives'])for m in g['meshes']),'materials':len(g['materials']),'textures':{'uniqueImages':len(g.get('images',[])),'size':N,'rgba8WithMipsMiB':3*N*N*4*4/3/1024/1024},'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'animation':'Runtime additive semantic-bone motion; applied before original control/foot IK. No baked clip dependency.','provenance':'Original repository-owned seated skeleton and garment base; original Blender-authored tailoring, protective gear, helmet and deterministic PBR atlas. No downloads or likeness.','baseSourceSha256':hashlib.sha256((P/'assets/blender/drivers/test-driver.blend').read_bytes()).hexdigest()}
(OUT/'manifest.json').write_text(json.dumps(report,indent=2)+'\n');print('TOUR_RIDER '+json.dumps(report))
