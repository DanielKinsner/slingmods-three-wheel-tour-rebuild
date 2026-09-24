"""Six reference-based game approximations, authored in Blender. No manufacturer CAD claim."""
import bpy,math,pathlib,json
from mathutils.bvhtree import BVHTree
from mathutils import Vector
R=pathlib.Path(__file__).resolve().parents[2];O=R/'public/assets/spyder'
bpy.ops.wm.open_mainfile(filepath=str(R/'.tools/spyder/Spyder-Game-Master.blend'))
verts=[];faces=[]
for ob in bpy.context.scene.objects:
 if ob.type!='MESH' or not ('body_mesh' in ob.name or 'lower_arm' in ob.name):continue
 offset=len(verts);verts.extend([ob.matrix_world@v.co for v in ob.data.vertices]);faces.extend([tuple(offset+i for i in p.vertices) for p in ob.data.polygons])
surface=BVHTree.FromPolygons(verts,faces)
bpy.ops.wm.read_factory_settings(use_empty=True)
def v(p):return Vector((p[0],-p[2],p[1]))
def mat(name,col,metal=0,rough=.4,emission=False):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*col,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if emission:p.inputs['Emission Color'].default_value=(*col,1);p.inputs['Emission Strength'].default_value=1.5
 return m
black=mat('Spyder anodized black',(.012,.014,.017),.65,.3);silver=mat('Spyder machined alloy',(.56,.60,.65),.85,.24);red=mat('Elka red adjuster',(.55,.015,.009),.6,.3);led=mat('Spyder LED diffuser',(.6,.01,.005),0,.27,True);springMat=mat('Elka black spring',(.008,.01,.012),.45,.25)
def group(name,parent=None):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.parent=parent;return o
root=group('spyder_products');parts={n:group('spyder_mod_'+n,root) for n in ['throttle','front','rear','sway','underglow','wheels']}
def finish(o,name,parent,material):
 o.name=name;o.parent=parent;o.data.materials.append(material)
 if o.type=='MESH':
  for p in o.data.polygons:p.use_smooth=len(p.vertices)==4
 return o
def cyl(name,a,b,r,parent,material):
 a,b=v(a),v(b);bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=r,depth=(b-a).length,location=(a+b)/2);o=bpy.context.object;o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return finish(o,name,parent,material)
def tube(name,pts,r,parent,material):
 d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.bevel_depth=r;d.bevel_resolution=3;sp=d.splines.new('POLY');sp.points.add(len(pts)-1)
 for q,p in zip(sp.points,pts):q.co=(*v(p),1)
 o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.parent=parent;d.materials.append(material);return o
def box(name,pos,size,parent,material):
 bpy.ops.mesh.primitive_cube_add(size=1,location=v(pos));o=bpy.context.object;o.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);bevel=o.modifiers.new('Soft machined edge','BEVEL');bevel.width=.003;bevel.segments=3;return finish(o,name,parent,material)
mounts=[]
for i,(a,b) in enumerate([([-.22,.54,-.855],[-.53,.23,-.855]),([.22,.54,-.855],[.53,.23,-.855]),([0,.59,.46],[0,.37,.47])]):
 parent=parts['rear' if i==2 else 'front'];a,b=Vector(a),Vector(b);delta=b-a;axis=delta.normalized();u=axis.cross(Vector((0,0,1))).normalized();w=axis.cross(u);r=.023 if i==2 else .018
 groups={n:group(f'elka_{i}_{n}',parent) for n in ['body','shaft','spring']}
 for n,g in groups.items():g['spyderMotion']={'kind':'shock','channel':i,'part':n,'upper':list(a),'lower':list(b)}
 cyl('Elka billet body',a,a+delta*.55,r,groups['body'],black);cyl('Polished piston',a+delta*.40,b,r*.35,groups['shaft'],silver)
 cyl('Upper eye',a-u*.022,a+u*.022,.013,groups['body'],silver);cyl('Lower eye',b-u*.021,b+u*.021,.012,groups['shaft'],silver)
 # Stage 4 remote/piggyback reservoir, preload collar and independent red low-speed / rebound adjusters.
 offset=u*.037;cyl('Elka reservoir',a+offset+axis*.015,a+offset+axis*.105,r*.88,groups['body'],black);cyl('Compression adjuster',a+offset+axis*.003,a+offset+axis*.017,r*.9,groups['body'],red)
 cyl('Manual preload collar',a+delta*.22,a+delta*.27,r*1.4,groups['body'],red);cyl('Rebound adjuster',b-axis*.025,b-axis*.012,r*.67,groups['shaft'],red)
 points=[]
 for j in range(257):
  t=j/256;at=a+delta*(.28+t*.60)+(u*math.cos(t*math.pi*18)+w*math.sin(t*math.pi*18))*r*1.3;points.append(at)
 tube('Elka spring',points,.0045,groups['spring'],springMat);mounts.append({'channel':i,'upper':list(a),'lower':list(b)})
# ULTRA three-piece bar and one pair of end-links, no duplicate paid dependency.
tube('Baja Ron torsion bar',[[-.40,.25,-.77],[-.31,.25,-.67],[.31,.25,-.67],[.40,.25,-.77]],.012,parts['sway'],black)
for sign in [-1,1]:
 cyl('Baja Ron billet arm',[sign*.31,.25,-.67],[sign*.45,.25,-.86],.015,parts['sway'],silver)
 cyl('SM-18298 end link',[sign*.45,.25,-.86],[sign*.49,.34,-.86],.008,parts['sway'],red)
 for y in [.25,.34]:cyl('Link bearing',[sign*.48,y,-.872],[sign*.48,y,-.848],.013,parts['sway'],silver)
# Controller mounted below the custom bar, reachable without covering source dials.
box('Pedal Commander case',[-.12,1.007,-.33],[.077,.015,.046],parts['throttle'],black)
box('Pedal Commander face',[-.12,1.017,-.33],[.067,.006,.038],parts['throttle'],silver)
for j in range(4):box('Mode indicator',[-.143+j*.015,1.021,-.33],[.008,.002,.005],parts['throttle'],red)
# TricLED install manual: two inner-grill, two upper-headlamp, two side-frame,
# two lower A-arm strips. Fit each sampled centerline to the actual custom mesh.
strip_report=[]
def mounted(name,points,parent):
 fitted=[];gaps=[]
 for i in range(len(points)-1):
  for k in range(13):
   target=v(Vector(points[i]).lerp(Vector(points[i+1]),k/12));at,n,idx,d=surface.find_nearest(target);direction=(target-at).normalized() if d>.0001 else n
   at+=direction*.003;fitted.append((at.x,at.z,-at.y));gaps.append(d)
 tube(name,fitted,.003,parent,led);strip_report.append({'name':name,'centers':fitted,'surfaceOffset':.003,'maxAdaptation':max(gaps)})
# The side-frame strips stick to the UNDERSIDE of the upper frame rail and shine down on the engine.
# Nearest-surface snapping jumped between rail, engine covers and brackets (up to 10 cm) and drew a
# zigzag through the engine bay, so these follow the rail axis measured from the master mesh
# (camera ray survey, 42 mm rail) and meet its underside with upward rays only.
FRAME_TUBE_AXIS=[(.156,.551,-.068),(.205,.560,-.154),(.244,.569,-.225),(.273,.576,-.291),(.292,.584,-.359),(.307,.588,-.429)]
FRAME_TUBE_RADIUS=.021
def under_tube(name,axis,parent):
 fitted=[];gaps=[]
 for i in range(len(axis)-1):
  for k in range(12 if i<len(axis)-2 else 13):
   c=Vector(axis[i]).lerp(Vector(axis[i+1]),k/12);start=v((c.x,c.y-FRAME_TUBE_RADIUS-.02,c.z))
   at,n,idx,d=surface.ray_cast(start,Vector((0,0,1)),FRAME_TUBE_RADIUS+.02)
   expected=c.y-FRAME_TUBE_RADIUS;y=at.z if at is not None and abs(at.z-expected)<.012 else expected
   gaps.append(abs(y-expected));fitted.append((c.x,y-.0035,c.z))
 # light smoothing so mesh facets do not ripple the strip
 fitted=[fitted[0]]+[(p[0],(fitted[j-1][1]+p[1]+fitted[j+1][1])/3,p[2]) for j,p in enumerate(fitted[1:-1],1)]+[fitted[-1]]
 tube(name,fitted,.003,parent,led);strip_report.append({'name':name,'centers':fitted,'surfaceOffset':.0035,'maxAdaptation':max(gaps),'method':'rail-axis underside rays'})
for sign in [-1,1]:
 mounted('F3 upper headlight strip',[(sign*.05,.88,-.835),(sign*.15,.885,-.82),(sign*.27,.865,-.80)],parts['underglow'])
 under_tube('F3 tubular frame strip',[(sign*x,y,z) for x,y,z in FRAME_TUBE_AXIS],parts['underglow'])
 mounted('F3 inner grill strip',[(sign*.04,.205,-1.192),(sign*.19,.195,-1.13),(sign*.295,.265,-1.02)],parts['underglow'])
 arm=group('F3 lower A arm strip '+str(sign),parts['underglow']);channel=0 if sign<0 else 1;arm['spyderMotion']={'kind':'link','channel':channel,'part':'link','travelRatio':1,'upper':[sign*.225,.187,-.853],'lower':[sign*.598,.187,-.853]}
 mounted('F3 lower A arm LED',[(sign*.275,.198,-.715),(sign*.41,.198,-.765),(sign*.555,.198,-.804)],arm)
# Stationary rings inside the source custom 24-inch-diameter rims, outboard of rotors.
for i,sign in enumerate([-1,1]):
 g=group('spyder_wheel_light_'+str(i),parts['wheels']);g['spyderCarrier']=i
 x=sign*.685;cy=.32355;cz=-.85455
 pts=[(x,cy+.220*math.sin(j*2*math.pi/96),cz+.220*math.cos(j*2*math.pi/96)) for j in range(97)];tube('Wheel black support ring',pts,.007,g,black)
 for q in range(4):
  pts=[(x+sign*.005,cy+.224*math.sin((q/4+j/128)*2*math.pi),cz+.224*math.cos((q/4+j/128)*2*math.pi)) for j in range(30)];tube('Wheel LED arc',pts,.004,g,led)
 tube('Brembo carrier bracket',[(sign*.62,.36,-.77),(x,.39,-.75),(x,.46,-.74)],.006,g,black)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.convert(target='MESH');bpy.ops.wm.save_as_mainfile(filepath=str(R/'.tools/spyder/Spyder-Products.blend'))
bpy.ops.export_scene.gltf(filepath=str(O/'spyder-products.glb'),export_format='GLB',export_extras=True)
(O/'product-mounts.json').write_text(json.dumps({'kind':'reference-based game approximations','shocks':mounts,'ringRadius':.224,'minimumSampledSpinClearance':.03011,'clearanceSamples':180,'stripMounts':strip_report,'linksIncludedWithSway':2,'fitment':'2023 base F3; custom physical fit unverified'},indent=2))
