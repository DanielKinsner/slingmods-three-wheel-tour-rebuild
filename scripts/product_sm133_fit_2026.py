"""SM-133 base underglow refitted to the 2026 Slingshot. Background Blender: scripts/blender.ps1 -Script scripts/product_sm133_fit_2026.py

The original kit (scripts/product_sm133_build.py) conformed each strip to the underside of the LEGACY car by ray casting.
The vehicle was later replaced by the 2026 model, whose floor sits 3-7 cm higher and whose splitter is a different shape,
so the old strips floated: front strips in open air ahead of the nose, rails running past the end of the floor.
Same method, current car: every strip point is ray cast up to the real bodywork and the strip hangs 5.5 mm below it.
Points with no bodywork above them are dropped, never invented. The report records the exact vehicle file fitted to;
tests/underglow-fit.test.mjs fails if the shipped vehicle changes without a refit.
Coordinates in this file are glTF (+X right, +Y up, -Z forward), converted to Blender only at the mesh boundary.
"""
import bpy,bmesh,json,hashlib,pathlib,re
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=pathlib.Path(__file__).resolve().parents[1];VEHICLE=P/'public/assets/model02/slingshot-2026.glb';OUT=P/'public/assets/model02';SOURCE=P/'assets/blender/products'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(VEHICLE))
# Fixed bodywork only: nothing that turns, steers or travels with the suspension may carry a strip.
MOVING=re.compile(r'wheel|tire|tyre|brake|rotor|caliper|hub|rim|suspension|shock|arm|driver|swing|belt|pulley|steer',re.I)
verts=[];faces=[];depsgraph=bpy.context.evaluated_depsgraph_get()
for o in [o for o in bpy.context.scene.objects if o.type=='MESH']:
 lineage=' '.join([o.name]+[p.name for p in (o.parent,o.parent.parent if o.parent else None) if p])
 if MOVING.search(lineage):continue
 mesh=o.evaluated_get(depsgraph).to_mesh();mesh.calc_loop_triangles();offset=len(verts);verts.extend(o.matrix_world@v.co for v in mesh.vertices);faces.extend(tuple(offset+i for i in t.vertices) for t in mesh.loop_triangles)
body=BVHTree.FromPolygons(verts,faces,all_triangles=True)
to_blender=lambda p:Vector((p[0],-p[2],p[1]))
def underside(x,z,reach=.34):
 """Height (glTF Y) of the lowest bodywork above ground point (x,z), or None when nothing is there."""
 hit=body.ray_cast(to_blender((x,-.02,z)),Vector((0,0,1)),reach);return None if hit[0] is None else hit[0].z
for o in list(bpy.context.scene.objects):bpy.data.objects.remove(o,do_unlink=True)
root=bpy.data.objects.new('tricled_sm133_base',None);bpy.context.collection.objects.link(root);root['productId']='tricled-sm133-base-rgb';root['fittedTo']='slingshot-2026.glb'
def material(name,color,rough,emission=False):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=(*color,1);n.inputs['Roughness'].default_value=rough
 if emission:n.inputs['Emission Color'].default_value=(1,1,1,1);n.inputs['Emission Strength'].default_value=1
 return m
housing=material('SM133_Housing',(0.015,0.018,0.021),.67);diffuser=material('SM133_Diffuser',(.72,.73,.74),.38,True)
def mesh(name,points,polygons,mat):
 me=bpy.data.meshes.new(name);me.from_pydata([to_blender(p) for p in points],[],polygons);me.update();bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(me);bm.free()
 o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);o.parent=root;me.materials.append(mat);return o
def ribbon(name,pts,width,top,bottom,mat):
 v=[];f=[]
 for i,p in enumerate(pts):
  d=Vector(pts[min(len(pts)-1,i+1)])-Vector(pts[max(0,i-1)]);d.y=0;d.normalize();a=Vector((d.z,0,-d.x))*width/2;p=Vector(p)
  for side,y in [(-1,top),(1,top),(1,bottom),(-1,bottom)]:v.append(p+a*side+Vector((0,y,0)))
 for i in range(len(pts)-1):
  for j in range(4):f.append((4*i+j,4*i+(j+1)%4,4*(i+1)+(j+1)%4,4*(i+1)+j))
 f+=[(3,2,1,0),tuple(range(4*(len(pts)-1),4*len(pts)))];return mesh(name,v,f,mat)
paths=[];report=[]
def strip(name,xz,kind):
 heights=[]
 for i,(x,z) in enumerate(xz):
  pp=xz[max(0,i-1)];pn=xz[min(len(xz)-1,i+1)];d=Vector((pn[0]-pp[0],0,pn[1]-pp[1])).normalized();a=Vector((d.z,0,-d.x))
  # Lowest real underside across the strip's width, so an edge can never poke into a panel.
  samples=[underside(x+a.x*off,z+a.z*off) for off in (-.0065,0,.0065)];heights.append(None if any(s is None for s in samples) else min(samples))
 # Keep the longest run that actually has bodywork above it.
 runs=[];start=None
 for i,h in enumerate(heights+[None]):
  if h is not None and start is None:start=i
  if h is None and start is not None:runs.append((start,i));start=None
 requested=len(xz);a,b=max(runs,key=lambda r:r[1]-r[0]);xz=xz[a:b];heights=heights[a:b]
 # A strip is a straight extrusion: over a recess it bridges at the height of the lower neighbours rather than climbing in.
 level=[min(heights[max(0,i-3):i+4]) for i in range(len(heights))];pts=[(x,h-.0055,z) for (x,z),h in zip(xz,level)]
 ribbon(name+'_housing',pts,.013,.004,-.0015,housing);ribbon(name+'_diffuser',pts,.010,-.0015,-.0035,diffuser)
 for j,idx in enumerate([0,len(pts)-1]):
  p=Vector(pts[idx]);q=Vector(pts[1 if idx==0 else -2]);d=(p-q).normalized();ribbon(name+'_endcap_'+str(j),[p,p+d*.008],.015,.0045,-.004,housing)
 gaps=[h-(p[1]+.004) for h,p in zip(heights,pts)]
 paths.append({'id':name,'parent':'chassis','points':[list(p) for p in pts],'visibleLengthM':sum((Vector(q)-Vector(p)).length for p,q in zip(pts,pts[1:])),'kind':kind})
 report.append({'strip':name,'requestedPoints':requested,'keptPoints':len(pts),'droppedForNoBodywork':requested-len(pts),'maxGapToBodyworkM':max(gaps),'meanGapToBodyworkM':sum(gaps)/len(gaps),'heightRangeM':[min(p[1] for p in pts),max(p[1] for p in pts)]})
for side in (-1,1):
 label='left' if side<0 else 'right'
 # Floor-edge rail: the flat frame edge of the 2026 floor runs z -0.60 .. 0.42 at x 0.611; beyond that the body rises away.
 strip(label+'_rail',[(side*.611,-.60+1.02*i/34) for i in range(35)],'base frame-edge strip')
 # Lower splitter return, 3-4 cm inboard of the 2026 splitter lip.
 anchors=[(.03,-2.06),(.20,-2.06),(.38,-2.055),(.55,-2.02),(.70,-2.00),(.80,-1.96),(.90,-1.88)];xz=[]
 for a,b in zip(anchors,anchors[1:]):
  for j in range(8):xz.append((side*(a[0]+(b[0]-a[0])*j/8),a[1]+(b[1]-a[1])*j/8))
 xz.append((side*anchors[-1][0],anchors[-1][1]));strip(label+'_front_lower',xz,'base lower splitter underside strip')
for mat in (housing,diffuser):
 parts=[o for o in root.children if o.type=='MESH' and o.data.materials[0]==mat];bpy.ops.object.select_all(action='DESELECT')
 for o in parts:o.select_set(True)
 bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();parts[0].name=mat.name
bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
for o in root.children:o.select_set(True)
bpy.context.view_layer.objects.active=root;bpy.context.preferences.filepaths.save_version=0
glb=OUT/'tricled-sm133-2026.glb';bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'tricled-sm133-2026.blend'))
bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_extras=True)
rail_y=[p[1] for path in paths if 'rail' in path['id'] for p in path['points']];light_y=sum(rail_y)/len(rail_y)-.012
descriptor={'version':2,'productId':'tricled-sm133-base-rgb','asset':'/assets/model02/tricled-sm133-2026.glb','basis':'metres +X right +Y up -Z forward; 2026 vehicle root rest coordinates','parent':'vehicle_root/chassis','transform':{'position':[0,0,0],'quaternion':[0,0,0,1],'scale':[1,1,1]},'materials':{'housing':'SM133_Housing','diffuser':'SM133_Diffuser'},'strips':paths,'lightOrigins':[[-.611,light_y,-.09],[.611,light_y,-.09]],
 'fit':{'vehicle':'public/assets/model02/slingshot-2026.glb','vehicleSha256':sha(VEHICLE),'glbSha256':sha(glb),'method':'Each strip point ray cast up to fixed 2026 bodywork; strip hangs 5.5 mm below the lowest hit across its width; points with no bodywork above are dropped.','strips':report,'generator':'scripts/product_sm133_fit_2026.py'},
 'approximation':'Photo-informed visual approximation of the base kit; not OEM CAD or installation instructions.'}
(OUT/'tricled-sm133-2026.attachment.json').write_text(json.dumps(descriptor,indent=2)+'\n',encoding='utf-8')
for r in report:print(r['strip'],'kept',r['keptPoints'],'max gap',round(r['maxGapToBodyworkM'],3),'mean',round(r['meanGapToBodyworkM'],3),'y',[round(v,3) for v in r['heightRangeM']])
assert all(r['keptPoints']>=20 for r in report),'a strip lost most of its length: the path no longer matches the car'
