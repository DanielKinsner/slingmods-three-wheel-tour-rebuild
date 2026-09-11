"""P03A surface construction. Opens accepted P01 read-only, saves only versioned P03A paths.
Background Blender: blender -b --python scripts/vehicle_p03a_build.py [-- --finish]
Primary forms use longitudinal Hermite lofts over shaped cross sections. No blanket subdivision.
"""
import bpy, bmesh, math, json, pathlib, sys, hashlib, collections
from mathutils import Vector, Matrix
P=pathlib.Path(__file__).resolve().parents[1]
EV=P/'director-kit/production/evidence/P03A/artist';EV.mkdir(parents=True,exist_ok=True)
FINISH='--finish' in sys.argv or '--maps-only' in sys.argv
bpy.ops.wm.open_mainfile(filepath=str(P/'assets/blender/vehicles/slingshot-p01.blend'))
root=bpy.data.objects['vehicle_root']; body=bpy.data.objects['body_static']; cockpit=bpy.data.objects['cockpit']
def material(n,c,r=.5,m=0,coat=0):
 o=bpy.data.materials.new(n);o.use_nodes=True;o.diffuse_color=(*c,1);bs=o.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*c,1);bs.inputs['Roughness'].default_value=r;bs.inputs['Metallic'].default_value=m;bs.inputs['Coat Weight'].default_value=coat;bs.inputs['Coat Roughness'].default_value=.12
 return o
paint=material('P03A_Radar_Blue',(.012,.045,.48) if FINISH else (.43,.46,.50),.28,.20,.72)
black=material('P03A_Textured_Polymer',(.026,.032,.04),.62)
rubber=material('P03A_Rubber',(.018,.023,.028),.83)
metal=material('P03A_Machined_Aluminum',(.50,.53,.58),.25,.86)
rim=material('P03A_Gloss_Black_Wheel',(.012,.016,.025),.22,.65)
upholstery=material('P03A_Seat_Charcoal',(.052,.057,.065),.80)
seataccent=material('P03A_Seat_Silver',(.25,.27,.29),.70)
orange=material('P03A_Orange_Accent',(.96,.14,.011) if FINISH else (.18,.20,.23),.28,.12,.5)
recess=material('P03A_Recess_Black',(.005,.009,.013),.75)
lens=material('P03A_Optical_Lens',(.66,.74,.81),.11,.1,.5)
tail=material('P03A_Tail_Lens',(.42,.006,.015),.16,.05,.7)
glass=material('P03A_Wind_Deflector',(.16,.23,.27),.11,0,.35)
gb=glass.node_tree.nodes.get('Principled BSDF');gb.inputs['Alpha'].default_value=.42 if FINISH else 1;gb.inputs['Transmission Weight'].default_value=0;glass.surface_render_method='DITHERED'
screen=material('P03A_Instrument_Glass',(.018,.045,.064),.21,.15,.5)
oldmap={'P01 neutral body clay':paint,'P01 dark structural clay':black,'P01 tire diagnostic':rubber,'P01 wheel face':metal,'P01 upholstery clay':upholstery,'Recesses':recess,'Unlit lamp lens':lens,'Unlit tail lens':tail,'Opaque diagnostic wind deflector':glass}
for o in list(bpy.data.objects):
 if hasattr(o.data,'materials'):
  for i,m in enumerate(o.data.materials):
   if m.name in oldmap:o.data.materials[i]=oldmap[m.name]
  if any(k in o.name for k in ['_rim','_hub']):o.data.materials[0]=rim
  if any(k in o.name for k in ['exposed_chassis_rail','_spring','rear_coil','single_sided_swingarm']):o.data.materials[0]=orange
remove=('hood_central_','sculpted_front_fender_','sculpted_sill_','front_side_scoop_','tail_shoulder_','rear_bucket_undertray_','dashboard_','seat_driver','seat_passenger','seat_bolster_','seat_trim_','wind_deflector','center_tunnel','console_facade','cockpit_front_bulkhead','rear_center_bulkhead','nose_cheek_','rear_deck','rear_seat_pod_','hood_louver','hood_scoop','gauge_cluster','gauge_bezel','ride_command_screen','screen_inactive','console_switch','center_tail_fin','autodrive_RND')
for o in list(bpy.data.objects):
 if o.name.startswith(remove):bpy.data.objects.remove(o,do_unlink=True)
def empty(n,par=root,loc=(0,0,0)):
 o=bpy.data.objects.new(n,None);bpy.context.collection.objects.link(o);o.parent=par;o.location=loc;return o
def mesh(n,v,f,mat=paint,par=body,smooth=True):
 me=bpy.data.meshes.new(n);me.from_pydata(v,[],f);me.update();o=bpy.data.objects.new(n,me);bpy.context.collection.objects.link(o);o.parent=par;me.materials.append(mat)
 for face in me.polygons:face.use_smooth=smooth
 return o
def bevel(o,w=.005,segments=3):
 m=o.modifiers.new('Manufactured edge radius','BEVEL');m.width=w;m.segments=segments;m.limit_method='ANGLE';m.angle_limit=.6
 o.modifiers.new('Face-weighted hard edges','WEIGHTED_NORMAL');return o
def panel(n,v,mat=paint,par=body,th=.018,w=.006):
 o=mesh(n,v,[tuple(range(len(v)))],mat,par,False);m=o.modifiers.new('Physical panel section','SOLIDIFY');m.thickness=th;bevel(o,w);return o
def box(n,loc,size,mat=black,par=body,w=.012):
 x,y,z=loc;a,b,c=[q/2 for q in size];v=[(x+i*a,y+j*b,z+k*c) for i,j,k in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
 return bevel(mesh(n,v,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],mat,par,False),w)
def curve(n,pts,r,mat=black,par=body):
 if n.startswith(('seat_outer_bolster','seat_silver_shoulder','seat_stitched_edge')):pts=[hsample(pts,i/96) for i in range(97)]
 cu=bpy.data.curves.new(n,'CURVE');cu.dimensions='3D';cu.resolution_u=2;cu.bevel_depth=r;cu.bevel_resolution=3;sp=cu.splines.new('POLY');sp.points.add(len(pts)-1)
 for point,co in zip(sp.points,pts):point.co=(*co,1)
 o=bpy.data.objects.new(n,cu);bpy.context.collection.objects.link(o);o.parent=par;cu.materials.append(mat);return o
def lerp(a,b,t):return a+(b-a)*t
def hsample(values,t):
 # Cubic Hermite interpolation with shape-preserving derivative limiting per component.
 n=len(values);q=min(n-1.000001,max(0,t*(n-1)));i=int(q);u=q-i
 a=Vector(values[i]);b=Vector(values[i+1]);p=Vector(values[max(0,i-1)]);c=Vector(values[min(n-1,i+2)])
 m0=(b-p)*.5 if i else b-a;m1=(c-a)*.5 if i+2<n else b-a
 for k in range(len(a)):
  d=b[k]-a[k]
  if abs(d)<1e-10:m0[k]=m1[k]=0
  else:
   m0[k]=math.copysign(min(abs(m0[k]),3*abs(d)),d) if m0[k]*d>0 else 0
   m1[k]=math.copysign(min(abs(m1[k]),3*abs(d)),d) if m1[k]*d>0 else 0
 return tuple((2*u**3-3*u*u+1)*a+(u**3-2*u*u+u)*m0+(-2*u**3+3*u*u)*b+(u**3-u*u)*m1)
def lsample(values,t):
 q=min(len(values)-1.000001,max(0,t*(len(values)-1)));i=int(q);return tuple(lerp(Vector(values[i]),Vector(values[i+1]),q-i))
def patch(n,rows,mat=paint,par=body,steps=56,cross=14,th=.020,flip=False,ruled=False):
 # Each row is a cross-section poly-control line; build bicubic sampled quad grid.
 v=[]
 for i in range(steps+1):
  row=[hsample([r[k] for r in rows],i/steps) for k in range(len(rows[0]))]
  for j in range(cross+1):v.append((lsample if ruled else hsample)(row,j/cross))
 f=[]
 for i in range(steps):
  for j in range(cross):a=i*(cross+1)+j;f.append((a,a+1,a+cross+2,a+cross+1) if not flip else (a+cross+1,a+cross+2,a+1,a))
 o=mesh(n,v,f,mat,par)
 # Natural surface UVs; longer axis follows manufactured panel, no random smart project distortion.
 uv=o.data.uv_layers.new(name='SurfaceUV')
 for poly in o.data.polygons:
  for li in poly.loop_indices:
   idx=o.data.loops[li].vertex_index;uv.data[li].uv=((idx%(cross+1))/cross,(idx//(cross+1))/steps)
 if th:
  m=o.modifiers.new('Returned section thickness','SOLIDIFY');m.thickness=th;m.offset=-1;m.use_even_offset=False
  bevel(o,.003,2)
 if ruled:
  # Split normals exactly at designed cross-section crease boundaries. Longitudinal curvature remains smooth.
  for edge in o.data.edges:
   a,b=edge.vertices
   if a%(cross+1)==b%(cross+1) and (a%(cross+1))%max(1,cross//(len(rows[0])-1))==0:edge.use_edge_sharp=True
 o['construction']='Ruled transverse faces with explicit crease normals and curved longitudinal tension' if ruled else 'Shape-preserving cubic longitudinal/cross-sectional quad loft; explicit returned thickness'
 return o
def solidloft(n,rows,mat=black,par=body,steps=64,ruled=False):
 # Closed rings keep shells volumetric and avoid intersecting decorative sheets.
 count=len(rows[0]);v=[]
 for i in range(steps+1):
  for k in range(count):v.append((lsample if ruled else hsample)([r[k] for r in rows],i/steps))
 f=[(i*count+k,i*count+(k+1)%count,(i+1)*count+(k+1)%count,(i+1)*count+k) for i in range(steps) for k in range(count)]
 f.extend([tuple(reversed(range(count))),tuple(steps*count+k for k in range(count))])
 o=mesh(n,v,f,mat,par)
 bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(o.data);bm.free()
 m=o.modifiers.new('Section boundary radius','BEVEL');m.width=.006;m.segments=3;m.limit_method='ANGLE';m.angle_limit=.7
 o['construction']='Closed cross-section shell with explicit longitudinal feature lines';return o
# CROWN + WINGS: separate designed crease lines and continuous curvature between them.
stations=[(.34,.355,.756,.671,.716,.675),(.62,.345,.785,.712,.825,.735),(.98,.345,.81,.73,.87,.785),(1.30,.405,.801,.730,.920,.817),(1.61,.456,.747,.686,.943,.821),(1.82,.414,.686,.638,.956,.789),(1.90,.389,.649,.628,.95,.773)]
for s,label in [(-1,'left'),(1,'right')]:
 rows=[];wings=[]
 for y,w,zc,ze,ow,oz in stations:
  rows.append([(0,y,zc-.016),(s*w*.23,y,zc-.015),(s*w*.57,y,zc-.014),(s*w*.82,y,lerp(zc-.014,ze,.52)),(s*w,y,ze)])
  wings.append([(s*(w+.003),y,ze+.001),(s*lerp(w,ow,.26),y,lerp(ze,oz,.30)),(s*lerp(w,ow,.63),y,lerp(ze,oz,.77)),(s*(ow-.035),y,oz+.002),(s*ow,y,oz)])
 patch('hood_crown_'+label,rows,steps=60,cross=16,flip=s<0,ruled=True)
 # New transition joins the central hood boundary to the lamp-aperture cheek.
 patch('hood_lamp_transition_'+label,[[(s*.238,1.902,.648),(s*.31,1.902,.642),(s*.389,1.902,.628)],[(s*.235,1.976,.648),(s*.30,1.989,.592),(s*.347,2.018,.568)],[(s*.235,2.014,.647),(s*.225,2.05,.581),(s*.296,2.075,.549)]],paint,steps=24,cross=12,th=.020,flip=s<0)
 # wings flow from pronounced front brow to cowl rather than a handful of planar facets.
 wings.extend([[(s*.347,2.018,.568),(s*.47,2.01,.63),(s*.70,1.995,.704),(s*.905,1.976,.757),(s*.94,1.966,.748)],[(s*.296,2.075,.549),(s*.415,2.047,.596),(s*.65,2.012,.682),(s*.899,1.973,.748),(s*.931,1.968,.739)]])
 patch('front_wing_'+label,wings,steps=70,cross=20,th=.021,flip=s<0,ruled=True)
 # Side sill section: sculpted outer shell, curved boarding dip, inward turned top and enclosed floor edge.
 stationsS=[(-1.17,.69,.755,.26),(-.91,.724,.705,.20),(-.63,.746,.538,.176),(-.29,.752,.353,.17),(.02,.739,.332,.18),(.32,.718,.443,.213),(.66,.635,.642,.27)]
 rows=[]
 for y,x,z,b in stationsS:
  rows.append([(s*x,y,z),(s*(x+.003),y,lerp(b,z,.72)),(s*(x+.004),y,lerp(b,z,.40)),(s*(x-.012),y,b+.012),(s*(x-.085),y,b),(s*(x-.073),y,z-.055),(s*(x-.028),y,z-.018)])
 solidloft('boarding_sill_shell_'+label,rows,black,steps=60,ruled=True)
 # Forward triangular recess and its integrated rocker return remain deliberately planar.
 panel('side_triangular_intake_'+label,[(s*.648,.60,.563),(s*.710,.23,.304),(s*.716,.49,.284)],recess,body,.012,.006)
 panel('side_rocker_return_'+label,[(s*.722,.48,.274),(s*.731,.14,.280),(s*.722,-.04,.218),(s*.718,.48,.238)],black,body,.020,.007)
 # Rear shoulder returns into a thick but curved wedge following reference boarding line.
 # Explicit broad downward-pointing planar fairing wedge, not an interpolated armrest section.
 v=[]
 for y,x,zt,zb in [(-1.30,.645,.883,.840),(-1.14,.728,.909,.754),(-.85,.756,.855,.623),(-.49,.747,.751,.565),(-.18,.651,.596,.574)]:
  v.extend([(s*x,y,zt),(s*(x-.023),y,zb),(s*(x-.085),y,zb+.019),(s*(x-.125),y,zt-.016)])
 faces=[(j*4+k,j*4+(k+1)%4,(j+1)*4+(k+1)%4,(j+1)*4+k) for j in range(4) for k in range(4)]+[(0,3,2,1),(16,17,18,19)]
 shoulder=mesh('rear_shoulder_wedge_'+label,v,faces,paint,body,False)
 bm=bmesh.new();bm.from_mesh(shoulder.data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bmesh.ops.triangulate(bm,faces=bm.faces);bm.to_mesh(shoulder.data);bm.free();bevel(shoulder,.003,2)
 shoulder['construction']='20-vertex explicit planar fairing wedge with tapered downward silhouette and 8mm edge radius'
 # Concave lower air scoop with shaped exterior lip.
 rows=[]
 for y,x,z in [(.18,.694,.27),(.34,.704,.318),(.55,.662,.427),(.76,.607,.571)]:
  rows.append([(s*x,y,z),(s*(x+.054),y,z-.017),(s*(x+.073),y,z-.042),(s*(x-.058),y,z-.055)])
 patch('side_intake_return_'+label,rows,black,steps=25,cross=8,th=.022,flip=s<0)
 # Closed inner front wheelhouse joins rocker to hood; exposed wishbones remain outboard.
 patch('inner_wheelhouse_'+label,[[(s*.59,.64,.255),(s*.60,.64,.48),(s*.625,.64,.662)],[(s*.60,.98,.438),(s*.58,.98,.57),(s*.62,.98,.676)],[(s*.53,1.52,.598),(s*.52,1.52,.62),(s*.56,1.52,.64)]],black,steps=25,cross=12,th=.018,flip=s<0,ruled=True)
 # Rear undertray bulges around wheel well, closes at inner wall and terminates in a real bottom return.
 rows=[]
 for z,y,outer,inner in [(.235,-1.036,.49,.205),(.34,-1.13,.655,.215),(.57,-1.20,.683,.215),(.80,-1.27,.639,.198),(.862,-1.277,.57,.18)]:
  rows.append([(s*inner,y+.035,z),(s*(inner+.055),y-.006,z),(s*(outer-.04),y-.020,z),(s*outer,y+.025,z),(s*(outer-.018),y+.085,z)])
 patch('rear_undertray_curved_'+label,rows,black,steps=40,cross=12,th=.026,flip=s>0)
 # Front painted cheek sweeps in section between inboard intake and outboard lamp socket.
 rows=[]
 for z,xi,xo,y in [(.205,.615,.90,2.036),(.245,.494,.87,2.051),(.315,.445,.647,2.060),(.433,.367,.557,2.073),(.532,.295,.52,2.071)]:
  rows.append([(s*xi,y,z),(s*lerp(xi,xo,.32),y+.008,z+.004),(s*lerp(xi,xo,.75),y+.004,z+.012),(s*xo,y-.018,z+.016)])
 patch('front_fascia_cheek_'+label,rows,paint,steps=38,cross=10,th=.025,flip=s>0)
# Full cockpit bulkhead and a continuous dash top, with separate passenger storage surface.
box('cockpit_firewall',(0,.44,.39),(1.25,.095,.47),black,cockpit,.025)
box('rear_firewall',(0,-1.105,.60),(.48,.13,.54),black,body,.028)
rows=[]
for x,z in [(-.665,.677),(-.48,.736),(-.28,.723),(-.16,.753),(0,.781),(.17,.753),(.36,.724),(.54,.704),(.665,.663)]:
 rows.append([(x,.20,z-.085),(x,.23,z-.021),(x,.285,z),(x,.395,z-.012),(x,.410,z-.055)])
dash=patch('dashboard_continuous',rows,black,cockpit,steps=82,cross=20,th=.025,flip=True)
bpy.context.view_layer.update()
dash_eval=dash.evaluated_get(bpy.context.evaluated_depsgraph_get())
# Console backbone with integrated side transitions (not a vertical decorative tile).
rows=[]
for y,z,width in [(-.59,.36,.107),(-.35,.413,.117),(-.08,.452,.122),(.17,.51,.128),(.245,.666,.153),(.295,.735,.145)]:
 rows.append([(-width,y,z-.09),(-width,y,z-.025),(-width*.81,y,z),(width*.81,y,z),(width,y,z-.025),(width,y,z-.09)])
solidloft('autodrive_console_shell',rows,paint,cockpit,58)
# Replace slab seats with continuous cupped center upholstery and closed supporting shell.
for s,label in [(-1,'driver'),(1,'passenger')]:
 rows=[]
 for y,z,w,bolster in [(.11,.295,.203,.045),(-.06,.311,.220,.044),(-.29,.331,.220,.040),(-.46,.421,.228,.056),(-.57,.657,.212,.062),(-.655,.899,.185,.047),(-.69,1.054,.137,.025),(-.70,1.091,.098,.012)]:
  upright=max(0,min(1,(z-.35)/.28));dy=bolster*upright;dz=bolster*(1-upright)
  rows.append([(s*.36-w,y+dy,z+dz),(s*.36-w*.78,y+dy*.7,z+dz*.7),(s*.36-w*.40,y-.009,z),(s*.36+w*.40,y-.009,z),(s*.36+w*.78,y+dy*.7,z+dz*.7),(s*.36+w,y+dy,z+dz)])
 seat=patch('seat_cupped_'+label,rows,upholstery,cockpit,steps=66,cross=24,th=.066,flip=True)
 for side in (-1,1):
  curve('seat_outer_bolster_'+label,[(s*.36+side*w,y,z) for y,z,w in [(.105,.337,.199),(-.1,.371,.218),(-.33,.391,.213),(-.453,.52,.212),(-.524,.77,.192),(-.601,.947,.16),(-.651,1.068,.11)]],.025,black,cockpit)
  curve('seat_stitched_edge_'+label,[(s*.36+side*w,y,z) for y,z,w in [(-.423,.48,.172),(-.518,.65,.159),(-.593,.855,.141),(-.635,1.03,.105)]],.0025,seataccent,cockpit)
 # Distinct silver shoulder cap around sport headrest.
 curve('seat_silver_shoulder_'+label,[(s*.36-.130,-.634,1.048),(s*.36-.104,-.636,1.085),(s*.36-.065,-.638,1.098),(s*.36+.065,-.638,1.098),(s*.36+.104,-.636,1.085),(s*.36+.130,-.634,1.048)],.013,seataccent,cockpit)
 box('seat_lower_cushion_'+label,(s*.36,-.13,.321),(.30,.32,.048),upholstery,cockpit,.035)
 # Panel behind seat is a supported molded pod, with returned edges.
 patch('seat_rear_pod_'+label,[[(s*.36-.18,-.78,.875),(s*.36,-.81,.945),(s*.36+.18,-.78,.875)],[(s*.36-.18,-1.04,.872),(s*.36,-1.03,.894),(s*.36+.18,-1.04,.872)],[(s*.36-.13,-1.24,.87),(s*.36,-1.25,.888),(s*.36+.13,-1.24,.87)]],black,body,steps=28,cross=14,th=.018)
# A curved transverse windscreen, mildly swept back, with bottom hem. Not an opaque planar plank.
rows=[]
for x in [-.61,-.45,-.25,0,.25,.45,.61]:
 curveY=.31+.065*(abs(x)/.61)**2; top=.991-.034*(abs(x)/.61)**3
 hit,hitco,_,_=dash_eval.ray_cast(Vector((x,curveY,2)),Vector((0,0,-1)))
 assert hit, 'Glass foot must contact evaluated dashboard'
 foot=hitco.z+.004
 rows.append([(x,curveY,foot),(x,curveY-.018,lerp(foot,top,.2)),(x,curveY-.085,lerp(foot,top,.67)),(x,curveY-.14,top)])
patch('windshield_curved',rows,glass,cockpit,steps=64,cross=16,th=.005)
curve('windshield_lower_seal',[hsample([row[0] for row in rows],i/64) for i in range(65)],.012,black,cockpit)
# Single continuous dash supports the glass seal. The redundant overlapping cowl patch
# caused thin intersections; the prior white triangles were the console upper return,
# identified by per-pixel source raycasts and already lowered independently.
patch('rear_deck_continuous',[[(-.64,-.94,.88),(-.30,-.96,.898),(0,-.965,.913),(.30,-.96,.898),(.64,-.94,.88)],[(-.65,-1.14,.893),(-.30,-1.16,.913),(0,-1.16,.923),(.30,-1.16,.913),(.65,-1.14,.893)],[(-.60,-1.28,.89),(-.30,-1.29,.91),(0,-1.29,.916),(.30,-1.29,.91),(.65,-1.28,.89)]],black,steps=24,cross=30,th=.022,flip=True)
# Connected hood-inlet housing: sculpted shoulders meet the crown, roof/lip surround an actual throat.
patch('hood_inlet_roof',[[(-.07,.57,.784),(0,.57,.79),(.07,.57,.784)],[(-.12,.77,.847),(0,.77,.855),(.12,.77,.847)],[(-.139,.96,.864),(0,.96,.871),(.139,.96,.864)],[(-.143,1.07,.866),(0,1.07,.872),(.143,1.07,.866)]],paint,steps=35,cross=18,th=.014)
for s,label in [(-1,'left'),(1,'right')]:
 patch('hood_inlet_shoulder_'+label,[[(s*.07,.57,.784),(s*.08,.57,.782),(s*.09,.57,.781)],[(s*.12,.77,.847),(s*.145,.77,.818),(s*.185,.77,.799)],[(s*.139,.96,.864),(s*.169,.96,.828),(s*.192,.96,.812)],[(s*.143,1.07,.866),(s*.169,1.07,.824),(s*.185,1.07,.81)]],paint,steps=35,cross=12,th=.014,flip=s<0)
panel('hood_inlet_dark_throat',[(-.119,1.019,.812),(.119,1.019,.812),(.126,1.019,.850),(-.126,1.019,.850)],recess)
panel('hood_inlet_lower_return',[(-.166,1.07,.811),(.166,1.07,.811),(.119,1.019,.812),(-.119,1.019,.812)],black)
# Proper binnacle sits forward of dash face, preventing half-buried instrument rings.
box('instrument_binnacle',(-.36,.148,.712),(.305,.085,.167),black,cockpit,.030)
box('instrument_lens',(-.36,.099,.710),(.269,.014,.123),screen,cockpit,.023)
for x in (-.435,-.285):
 curve('instrument_ring',[(x+math.cos(i*math.tau/48)*.047,.087,.714+math.sin(i*math.tau/48)*.047) for i in range(49)],.0033,metal,cockpit)
box('ride_command_housing',(0,.207,.651),(.252,.045,.194),black,cockpit,.014)
box('ride_command_lens',(0,.178,.665),(.216,.008,.147),screen,cockpit,.007)
box('console_switch_housing',(0,.192,.530),(.242,.045,.076),rim,cockpit,.008)
for i in range(3):
 x=-.024+i*.059
 box('console_switch_recess',(x,.165,.530),(.048,.012,.059),recess,cockpit,.004)
 box('console_switch',(x,.155,.530),(.026,.013,.039),metal,cockpit,.004)
curve('console_start_ring',[(-.083+.022*math.cos(i*math.tau/40),.160,.530+.022*math.sin(i*math.tau/40))for i in range(41)],.0035,metal,cockpit)
box('console_start_center',(-.083,.166,.530),(.030,.010,.029),black,cockpit,.012)
# Recessed AutoDrive switch island, round selector and storage pocket, without painted fake readouts.
panel('console_recessed_switch_island',[(-.058,-.377,.421),(.058,-.377,.421),(.058,-.10,.468),(-.058,-.10,.468)],recess,cockpit,.018,.004)
for i in range(3):
 y=-.16-i*.072;z=.448+.17*(y+.24);button=box('autodrive_button',(0,y,z),(.064,.047,.011),black,cockpit,.003)
 for vert in button.data.vertices:vert.co.z+=.17*(vert.co.y-y)
curve('console_round_control',[(.036*math.cos(i*math.tau/40),-.066+.036*math.sin(i*math.tau/40),.461) for i in range(41)],.008,metal,cockpit)
box('console_round_control_center',(0,-.066,.457),(.059,.059,.020),rim,cockpit,.027)
# Cut the actual console surface, then provide cavity floor and four walls. Cutter is source-only.
cutter=box('source_only_console_pocket_cutter',(0,.078,.50),(.168,.152,.19),recess,cockpit,.007)
cutter['export_exclude']=True;cutter.hide_render=True;cutter.display_type='WIRE'
modifier=bpy.data.objects['autodrive_console_shell'].modifiers.new('Real open storage cavity','BOOLEAN');modifier.operation='DIFFERENCE';modifier.solver='EXACT';modifier.object=cutter
box('console_pocket_floor',(0,.078,.411),(.165,.148,.008),recess,cockpit,.004)
for x in (-.079,.079):box('console_pocket_wall',(x,.078,.447),(.009,.147,.079),black,cockpit,.003)
for y in (.006,.150):box('console_pocket_wall',(0,y,.447),(.16,.009,.079),black,cockpit,.003)
# Broad molded center fin has an actual tapered cross section and root rather than a thin triangle.
solidloft('rear_center_fin_housing',[[(-.085,-1.25,.891),(.085,-1.25,.891),(.067,-1.25,.943),(-.067,-1.25,.943)],[(-.073,-1.06,.915),(.073,-1.06,.915),(.055,-1.06,1.018),(-.055,-1.06,1.018)],[(-.052,-.855,.914),(.052,-.855,.914),(.025,-.855,1.135),(-.025,-.855,1.135)],[(-.042,-.72,.876),(.042,-.72,.876),(.025,-.72,.942),(-.025,-.72,.942)]],black,body,steps=24,ruled=True)
# Front rail now tucks inside the sealed entry shell; it no longer crosses the exterior opening.
for o in list(bpy.data.objects):
 if o.name.startswith('exposed_chassis_rail') and o.type=='CURVE':
  s=-1 if 'left' in o.name else 1
  for point in o.data.splines[0].points:point.co.x=s*(abs(point.co.x)-.055);point.co.z-=.035
# Better optical separation: lenses live inside recess housings, same independent lamp families.
for o in list(bpy.data.objects):
 if o.name.startswith('lights_head'):
  # Retain separate lens objects; model housing sidewalls from existing lens perimeter.
  if o.type=='MESH':
   dup=o.copy();dup.data=o.data.copy();bpy.context.collection.objects.link(dup);dup.name='lamp_bezel_'+o.name;dup.data.materials.clear();dup.data.materials.append(rim)
   for v in dup.data.vertices:v.co.y-=.008
 if o.name.startswith('screen_inactive'):o.data.materials[0]=screen
# UV-complete editable source. Primary panels already have controlled parameterization.
for o in list(bpy.data.objects):
 if o.type=='MESH' and not o.data.uv_layers:
  uv=o.data.uv_layers.new(name='SurfaceUV')
  for poly in o.data.polygons:
   axis=max(range(3),key=lambda k:abs(poly.normal[k]));axes=[a for a in range(3) if a!=axis]
   for li in poly.loop_indices:
    v=o.data.vertices[o.data.loops[li].vertex_index].co;uv.data[li].uv=(v[axes[0]],v[axes[1]])
root['stage']='P03A surface candidate' if not FINISH else 'P03A mapped candidate';root['source_baseline']='P01 retained unchanged';root['surface_method']='Hermite loft patches and closed cross-section shells'
# Finish functions are added only after the neutral/reflection checkpoint.
if FINISH:
 exec(compile((P/'scripts/vehicle_p03a_materials.py').read_text(),str(P/'scripts/vehicle_p03a_materials.py'),'exec'),globals())
 if '--maps-only' in sys.argv:
  bpy.ops.wm.save_as_mainfile(filepath=str(P/'assets/blender/vehicles/slingshot-p03a-material-lab.blend'));print('P03A_MAP_LAB_ONLY: candidate GLB unchanged');sys.exit(0)
bpy.context.scene.unit_settings.system='METRIC'
# Explicit source collections keep geometry editable. No batching is saved over the source file.
for o in list(bpy.data.objects):
 if o.type in {'MESH','CURVE'}:o['source_role']='editable P03A authored component'
source=P/'assets/blender/vehicles/slingshot-p03a.blend'
editable=[o for o in bpy.data.objects if o.type in {'MESH','CURVE'} and not o.get('export_exclude')]
source_count=len(editable);dg=bpy.context.evaluated_depsgraph_get()
preflight=[];points=[]
for o in editable:
 ev=o.evaluated_get(dg);me=ev.to_mesh();vs=[o.matrix_world@p.co for p in me.vertices]
 if vs:
  bb=[[min(p[k] for p in vs),max(p[k] for p in vs)]for k in range(3)]
  if any(abs(a)>4 for axis in bb for a in axis):preflight.append({'object':o.name,'bounds':bb})
  points.extend(vs)
 ev.to_mesh_clear()
assert not preflight,'Out-of-scale evaluated SOURCE object: '+json.dumps(preflight)
sizes=[max(p[k]for p in points)-min(p[k]for p in points)for k in range(3)]
assert all(abs(a/b-1)<.01 for a,b in zip(sizes,[1.996,3.799,1.3127319813])),'Whole evaluated source bounds outside 1% P01: '+str(sizes)
if FINISH:
 # Physical visibility gate, not a material-presence test: no opaque filled sheet
 # may precede either bank or the center projector. Clear optical covers are expected.
 optical=[]
 for px,pz in [(.04,.601),(-.705,.627),(.705,.627)]:
  hits=[]
  for o in editable:
   if 'clear_cover' in o.name:continue
   ev=o.evaluated_get(dg);me=ev.to_mesh()
   if me:
    inv=o.matrix_world.inverted();orig=inv@Vector((px,5,pz));end=inv@Vector((px,-5,pz))
    hit,co,_,_=ev.ray_cast(orig,(end-orig).normalized())
    if hit:hits.append({'object':o.name,'position':list(o.matrix_world@co)})
   ev.to_mesh_clear()
  hits.sort(key=lambda p:-p['position'][1]);optical.append({'rayXZ':[px,pz],'firstOpaque':hits[0],'following':hits[1:4]})
  assert any(k in hits[0]['object']for k in ['_reflector_cell','_projector_eye']),'Occluded optical assembly: '+json.dumps(optical[-1])
 (EV/'source-optical-visibility.json').write_text(json.dumps({'status':'PASS','rays':optical},indent=2))
bpy.ops.file.make_paths_relative()
bpy.ops.wm.save_as_mainfile(filepath=str(source))
# Preserve semantic bindings, and batch only components sharing a material and local space.
binds={n:bpy.data.objects[n] for n in ['body_static','cockpit','steering_control','front_left_steer','front_right_steer','front_left_spin','front_right_spin','rear_spin','suspension_front_left','suspension_front_right','suspension_rear']}
for n in ['lights_head','lights_brake','lights_signals','stock_exhaust']:
 if n not in bpy.data.objects:binds[n]=empty(n)
 else:binds[n]=bpy.data.objects[n]
def binding(o):
 if o.name.startswith(('lights_head','lamp_bezel_')):return binds['lights_head']
 if o.name.startswith(('lights_brake','rear_tail_lamp')):return binds['lights_brake']
 if o.name.startswith('lights_signals'):return binds['lights_signals']
 p=o.parent
 while p:
  if p.name in binds:return p
  p=p.parent
 return body
groups=collections.defaultdict(list)
for o in editable:
 ev=o.evaluated_get(dg);me=bpy.data.meshes.new_from_object(ev,depsgraph=dg,preserve_all_data_layers=True)
 if not me.vertices:bpy.data.meshes.remove(me);continue
 tmp=bpy.data.objects.new('export_'+o.name,me);bpy.context.collection.objects.link(tmp);par=binding(o);tmp.matrix_world=o.matrix_world.copy()
 # All editable components currently use one material; evaluated modifier indices remain intact.
 material_names=tuple(m.name for m in me.materials);groups[(par.name,material_names)].append(tmp)
exported=[]
for (parname,mats),objects in groups.items():
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0]
 if len(objects)>1:bpy.ops.object.join()
 o=bpy.context.view_layer.objects.active;o.name=parname+'__'+('_'.join(mats)).replace('P03A_','')
 # Bake arbitrary first-component rotations into vertices. Every batch uses its binding's
 # exact local space; this keeps renderer Box3 bounds tight and avoids rotated AABB inflation.
 par=binds[parname];local=par.matrix_world.inverted()@o.matrix_world;o.data.transform(local)
 o.parent=par;o.matrix_parent_inverse=Matrix.Identity(4);o.matrix_basis=Matrix.Identity(4);exported.append(o)
bpy.ops.object.select_all(action='DESELECT')
for o in exported:o.select_set(True)
for o in bpy.data.objects:
 if o.type=='EMPTY':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(P/'public/assets/vehicles/slingshot-p03a.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_extras=True,export_image_format='AUTO')
tri=0;verts=[]
for o in exported:
 o.data.calc_loop_triangles();tri+=len(o.data.loop_triangles);verts.extend([o.matrix_world@v.co for v in o.data.vertices])
bounds=[[min(v[k] for v in verts),max(v[k] for v in verts)] for k in range(3)]
report={'stage':'mapped' if FINISH else 'surface checkpoint','baseline_unmodified':True,'source_objects':source_count,'export_meshes':len(exported),'export_color_primitives':sum(len(o.data.materials) for o in exported),'triangles':tri,'bounds_blender_m':bounds,'dimensions_m':{'width':bounds[0][1]-bounds[0][0],'length':bounds[1][1]-bounds[1][0],'height':bounds[2][1]-bounds[2][0]},'materials':[m.name for m in bpy.data.materials if m.name.startswith('P03A_')],'batches':[{'name':o.name,'binding':o.parent.name,'triangles':len(o.data.loop_triangles)} for o in exported],'source':str(source.relative_to(P)),'maps':[{'name':im.name,'width':im.size[0],'height':im.size[1]} for im in bpy.data.images if im.filepath.startswith('//') or '/p03a/' in im.filepath.replace('\\','/')],'limits':['No rider or G3 readiness claim','Actual runtime light-sweep review required','Panel vertices are reference estimates, not OEM CAD','Hardware performance is not inferred from asset census']}
(EV/'asset-census.json').write_text(json.dumps(report,indent=2));print('P03A_EXPORT '+json.dumps(report))
