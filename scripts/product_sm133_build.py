"""P04B1 original SM-133 base visual approximation; current car is read-only fitting reference.
Run through scripts/blender.ps1. No external image/textures copied. Four visible strip regions;
2015 install evidence adapted to accepted 2024 mesh, not installation instructions/OEM CAD.
"""
import bpy,bmesh,math,pathlib,json,hashlib,sys
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=pathlib.Path(__file__).resolve().parents[1];sys.path.insert(0,str(P/'scripts'))
from vehicle_p04a1_validate import load
E=P/'director-kit/production/evidence/P04B1/artist';E.mkdir(parents=True,exist_ok=True)
OUT=P/'public/assets/products';OUT.mkdir(parents=True,exist_ok=True)
SOURCE=P/'assets/blender/products';SOURCE.mkdir(parents=True,exist_ok=True)
protected=[P/'assets/blender/vehicles/slingshot-p04a1.blend',P/'public/assets/vehicles/slingshot-p04a1.glb',P/'public/assets/vehicles/slingshot-p04a1-rear-rig.json']
hashes={str(p.relative_to(P)):hashlib.sha256(p.read_bytes()).hexdigest()for p in protected}
raw,g,car=load(protected[1]);v=[];f=[]
for n,m in car.items():
 if n.startswith(('front_','rear_','suspension_','shock_','belt_')):continue
 off=len(v);v.extend(m['v']);f.extend(m['f']+off)
fixed=BVHTree.FromPolygons(v,f,all_triangles=True)
# Read-only authoring source is retained as a hidden linked collection in .blend only.
bpy.ops.wm.read_factory_settings(use_empty=True)
with bpy.data.libraries.load(str(protected[0]),link=True) as (a,b):b.collections=[n for n in a.collections if n=='Collection']
refs=bpy.data.collections.new('READ_ONLY_CAR_FIT_REFERENCE');bpy.context.scene.collection.children.link(refs)
for c in b.collections:
 if c:refs.children.link(c)
refs.hide_render=True;refs.hide_viewport=True
root=bpy.data.objects.new('tricled_sm133_base',None);bpy.context.collection.objects.link(root)
root['productId']='tricled-sm133-base-rgb';root['photo_informed_approximation']=True;root['geometry_revision']=1

def mat(name,color,rough,emission=False):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=(*color,1);n.inputs['Roughness'].default_value=rough
 if emission:n.inputs['Emission Color'].default_value=(1,1,1,1);n.inputs['Emission Strength'].default_value=1
 return m
housing=mat('SM133_Housing',(0.015,0.018,0.021),.67);diffuser=mat('SM133_Diffuser',(.72,.73,.74),.38,True)
allparts=[];paths=[];mounts=[]
def cv(p):return Vector((p[0],-p[2],p[1]))
def mesh(name,verts,faces,ma):
 me=bpy.data.meshes.new(name);me.from_pydata([cv(p)for p in verts],[],faces);me.update();bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(me);bm.free();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);o.parent=root;me.materials.append(ma);allparts.append(o);return o

def ribbon(name,pts,width,top,bottom,ma):
 verts=[];faces=[]
 for i,p in enumerate(pts):
  d=Vector(pts[min(len(pts)-1,i+1)])-Vector(pts[max(0,i-1)]);d.y=0;d.normalize();a=Vector((d.z,0,-d.x))*width/2;p=Vector(p)
  for side,y in [(-1,top),(1,top),(1,bottom),(-1,bottom)]:verts.append(p+a*side+Vector((0,y,0)))
 for i in range(len(pts)-1):
  for j in range(4):faces.append((4*i+j,4*i+(j+1)%4,4*(i+1)+(j+1)%4,4*(i+1)+j))
 faces +=[(3,2,1,0),tuple(range(4*(len(pts)-1),4*len(pts)))];return mesh(name,verts,faces,ma)

def strip(name,xz):
 pts=[]
 for i,(x,z)in enumerate(xz):
  pp=xz[max(0,i-1)];pn=xz[min(len(xz)-1,i+1)];d=Vector((pn[0]-pp[0],0,pn[1]-pp[1])).normalized();a=Vector((d.z,0,-d.x))
  # Lowest actual underside ray across the complete strip width prevents edge penetration.
  h=[]
  for off in [-.0065,0,.0065]:
   xx=x+a.x*off;zz=z+a.z*off;hit=fixed.ray_cast(Vector((xx,-.05,zz)),Vector((0,1,0)),.5)
   if hit[0]is None:raise RuntimeError(('No fixed mounting underside',name,x,z,off))
   h.append(hit[0].y)
  y=min(h)-.0055;pts.append((x,y,z));mounts.append({'strip':name,'index':i,'position':[x,min(h),z],'housingTop':[x,y+.004,z],'gapM':.0015})
 ribbon(name+'_housing',pts,.013,.004,-.0015,housing)
 ribbon(name+'_diffuser',pts,.010,-.0015,-.0035,diffuser)
 # Visible molded end caps only, no fictitious long floating harness or receiver.
 for j,idx in enumerate([0,len(pts)-1]):
  p=Vector(pts[idx]);q=Vector(pts[1 if idx==0 else -2]);d=(p-q).normalized();ribbon(name+'_endcap_'+str(j),[p,p+d*.008],.015,.0045,-.004,housing)
 paths.append({'id':name,'parent':'chassis','points':[list(p)for p in pts],'visibleLengthM':sum((Vector(b)-Vector(a)).length for a,b in zip(pts,pts[1:])),'kind':'base frame-edge strip'if 'rail'in name else 'base lower splitter underside strip'})
for side in [-1,1]:
 strip(('left'if side<0 else'right')+'_rail',[(side*.611,-.49+1.20*i/30)for i in range(31)])
 # Lower front return, never the upper spoiler/grille optional kit.
 anchors=[(.025,-2.103),(.24,-2.103),(.40,-2.095),(.61,-2.068),(.72,-2.024),(.91,-1.990)]
 xz=[]
 for a,b in zip(anchors,anchors[1:]):
  for j in range(8):xz.append((side*(a[0]+(b[0]-a[0])*j/8),a[1]+(b[1]-a[1])*j/8))
 xz.append((side*anchors[-1][0],anchors[-1][1]));strip(('left'if side<0 else'right')+'_front_lower',xz)
# Join by material into exactly two material batches. Keep markers as empty nodes.
for material in [housing,diffuser]:
 obs=[o for o in list(root.children) if o.type=='MESH' and o.data.materials[0]==material];bpy.ops.object.select_all(action='DESELECT')
 for o in obs:o.select_set(True)
 bpy.context.view_layer.objects.active=obs[0];bpy.ops.object.join();obs[0].name=material.name
bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
for o in root.children:o.select_set(True)
bpy.context.view_layer.objects.active=root
blend=SOURCE/'tricled-sm133-base.blend';glb=OUT/'tricled-sm133-base.glb'
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(blend));bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_extras=True)
# Inspect exact export, not a Blender estimate.
rr,gg,acc=load(glb);tris=sum(len(m['f'])for m in acc.values());prims=sum(len(m['primitives'])for m in gg['meshes']);av=np.concatenate([m['v']for m in acc.values()]);af=[];vv=[]
for m in acc.values():
 off=len(vv);vv.extend(m['v']);af.extend(m['f']+off)
atree=BVHTree.FromPolygons(vv,af,all_triangles=True);hits=[]
for n,m in car.items():
 if np.any(m['v'].max(0)<av.min(0))or np.any(m['v'].min(0)>av.max(0)):continue
 pairs=atree.overlap(BVHTree.FromPolygons(m['v'],m['f'],all_triangles=True))
 if pairs:hits.append({'carMesh':n,'trianglePairs':len(pairs)})
# Each rear assembly remains separated by X or Z for full accepted supported travel.
rear=[]
for n,m in car.items():
 if not n.startswith(('rear_spin','rear_pulley_visual','rear_arm_visual','belt_visual','rear_axle_visual','rear_caliper_visual','shock_')):continue
 for path in paths:
  pp=np.array(path['points']);lo=pp.min(0)-.016;hi=pp.max(0)+.016
  # Ignore Y: gives a continuous conservative separation irrespective of vertical travel.
  gap=max(float(m['v'][:,0].min()-hi[0]),float(lo[0]-m['v'][:,0].max()),float(m['v'][:,2].min()-hi[2]),float(lo[2]-m['v'][:,2].max()))
  rear.append({'mesh':n,'strip':path['id'],'xzBoxGapM':gap})
report={'geometryRevision':1,'blender':bpy.app.version_string,'protectedHashesBefore':hashes,'protectedHashesAfter':{str(p.relative_to(P)):hashlib.sha256(p.read_bytes()).hexdigest()for p in protected},'glbSha256':hashlib.sha256(rr).hexdigest(),'blendSha256':hashlib.sha256(blend.read_bytes()).hexdigest(),'glbBytes':len(rr),'triangles':tris,'primitives':prims,'materials':[m['name']for m in gg['materials']],'textures':len(gg.get('images',[])),'aabb':{'min':av.min(0).tolist(),'max':av.max(0).tolist()},'staticCarTriangleIntersections':hits,'restRoadY0ClearanceM':float(av[:,1].min()),'rearXZSeparation':rear,'mountRayCount':len(mounts),'mountingNote':'Actual fixed underside rays, 1.5mm adhesive tolerance; 2024 photo-informed game adaptation. Full old install strip lengths and hidden cable routing are not represented. No optional add-ons.'}
(E/'geometry01-report.json').write_text(json.dumps(report,indent=2));(E/'mount-rays.json').write_text(json.dumps(mounts,indent=2))
desc={'version':1,'productId':'tricled-sm133-base-rgb','asset':'/assets/products/tricled-sm133-base.glb','basis':'metres +X right +Y up -Z forward; all geometry in accepted vehicle root rest coordinates','parent':'vehicle_root/chassis','transform':{'position':[0,0,0],'quaternion':[0,0,0,1],'scale':[1,1,1]},'materials':{'housing':'SM133_Housing','diffuser':'SM133_Diffuser'},'strips':paths,'lightOrigins':[[-.61,.122,-.04],[.61,.122,-.04]],'lightsNote':'At most two non-shadow lights. Artist placement suggestion only; runtime receiver/occlusion approximation and road checks belong to presenter.','sourceUrl':'https://www.slingmods.com/polaris-slingshot-underglow-kit','installationSource':'https://www.youtube.com/watch?v=uuyfunQvgwc','referenceDate':'2026-09-11','approximation':'Four visible base mounting regions adapted to current mesh, not OEM strip lengths, complete cable routing or an installation tutorial.','excludedAddons':['upper front spoiler/grille','interior','rear swingarm','halo','wheel lights','Magic Tric/chaser'],'glbSha256':report['glbSha256'],'triangleCount':tris,'primitiveCount':prims}
(OUT/'tricled-sm133-base.attachment.json').write_text(json.dumps(desc,indent=2))
print(json.dumps({k:v for k,v in report.items()if k!='rearXZSeparation'},indent=2))
assert tris<10000 and prims<=4
assert not hits,hits
assert report['protectedHashesBefore']==report['protectedHashesAfter']
assert all(x['xzBoxGapM']>0 for x in rear)

