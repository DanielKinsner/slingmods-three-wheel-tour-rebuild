"""P03A1 local reconstruction; P03A is opened read-only. Background Blender only."""
import bpy,bmesh,math,json,pathlib,sys,collections,hashlib
from mathutils import Vector,Matrix
P=pathlib.Path(__file__).resolve().parents[1]
EV=P/'director-kit/production/evidence/P03A1/artist';EV.mkdir(parents=True,exist_ok=True)
FINISH='--finish' in sys.argv
bpy.ops.wm.open_mainfile(filepath=str(P/'assets/blender/vehicles/slingshot-p03a.blend'))
root=bpy.data.objects['vehicle_root'];body=bpy.data.objects['body_static'];cockpit=bpy.data.objects['cockpit']
paint=bpy.data.materials['P03A_Radar_Blue'];black=bpy.data.materials['P03A_Textured_Polymer'];rim=bpy.data.materials['P03A_Gloss_Black_Wheel'];metal=bpy.data.materials['P03A_Machined_Aluminum'];rubber=bpy.data.materials['P03A_Rubber'];recess=bpy.data.materials['P03A_Recess_Black'];upholstery=bpy.data.materials['P03A_Seat_Charcoal'];seataccent=bpy.data.materials['P03A_Seat_Silver'];lens=bpy.data.materials['P03A_Optical_Lens']
# Reuse proven mesh/UV utility definitions and export batching, not the rejected surfaces.
prior=(P/'scripts/vehicle_p03a_build.py').read_text()
exec(prior[prior.index('def empty('):prior.index('# CROWN + WINGS:')],globals())
def drop(prefixes):
 for o in list(bpy.data.objects):
  if o.name.startswith(prefixes):bpy.data.objects.remove(o,do_unlink=True)
def cage(n,rows,mat=paint,parent=body,levels=2):
 count=len(rows[0]);v=[p for row in rows for p in row]
 faces=[(j*count+i,j*count+(i+1)%count,(j+1)*count+(i+1)%count,(j+1)*count+i) for j in range(len(rows)-1)for i in range(count)]
 faces += [tuple(reversed(range(count))),tuple((len(rows)-1)*count+i for i in range(count))]
 o=mesh(n,v,faces,mat,parent)
 bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(o.data);bm.free()
 if levels:
  mod=o.modifiers.new('Local supported subdivision cage','SUBSURF');mod.levels=levels;mod.render_levels=levels
 o['construction']='Closed connected section cage; support loops, local Catmull-Clark only'
 return o
def supported(rows):
 return [rows[0],[tuple(Vector(a).lerp(Vector(b),.035))for a,b in zip(rows[0],rows[1])]]+rows[1:-1]+[[tuple(Vector(a).lerp(Vector(b),.965))for a,b in zip(rows[-2],rows[-1])],rows[-1]]
def sectional(n,controls,mat=paint,parent=body):
 # Deliberate top/front/return strips with independently controlled corner normals.
 # No subdivision shrinkage or globally smoothed normals across design breaks.
 count=len(controls[0]);steps=(len(controls)-1)*4
 rows=[[hsample([r[k]for r in controls],i/steps)for k in range(count)]for i in range(steps+1)]
 o=cage(n,rows,mat,parent,levels=0);me=o.data;me.update()
 normals=[]
 for fi,poly in enumerate(me.polygons):
  if fi>=steps*count:normals.extend([tuple(poly.normal)]*len(poly.loop_indices));continue
  row,k=divmod(fi,count)
  for li in poly.loop_indices:
   vi=me.loops[li].vertex_index;vr,vk=divmod(vi,count)
   features={0,3,4,5,6,9}if count==10 else set(range(count))
   ks=[k] if vk in features else [(vk-1)%count,vk]
   adj=[me.polygons[j*count+kk].normal for j in [vr-1,vr]if 0<=j<steps for kk in ks]
   normals.append(tuple(sum(adj,Vector()).normalized()))
 me.normals_split_custom_set(normals)
 o['construction']='Connected top/front/return sectional mesh; split design-break normals; no subdivision'
 return o
def attach_apron(cheek):
 # Share the paint's actual boundary indices. No coplanar black sheet is laid over paint.
 me=cheek.data;count=6;last=len(me.vertices)//count-1;start=12
 vv=[tuple(v.co)for v in me.vertices];ff=[];norm=[]
 oldnorm=[tuple(n.vector)for n in me.corner_normals]
 for fi,poly in enumerate(me.polygons):
  if start*count<=fi<last*count and fi%count==5:continue
  ff.append(tuple(poly.vertices));norm.extend(oldnorm[i]for i in poly.loop_indices)
 whitefaces=len(ff);pairs=[]
 for row in range(start,last+1):
  a=Vector(vv[row*6]);b=Vector(vv[row*6+5]);x=abs(a.x)
  t=max(0,min(1,(x-.486)/(.889-.486)));z=.147+.007*t+.018;y=2.148-.068*t-.035
  if x>.889:
   t=min(1,(x-.889)/(.972-.889));z=.154+.044*t+.018;y=2.080-.107*t-.035
  ia=len(vv);vv.extend([(a.x,y,z),(b.x,y-.065,z)]);pairs.append((row*6,row*6+5,ia,ia+1))
 for i in range(len(pairs)-1):
  a,b,c,d=pairs[i];e,f,g,h=pairs[i+1];ff.extend([(a,c,g,e),(c,d,h,g),(d,b,f,h)])
 a,b,c,d=pairs[0];ff.append((a,b,d,c));a,b,c,d=pairs[-1];ff.append((a,c,d,b))
 me.clear_geometry();me.from_pydata(vv,[],ff);me.update();me.materials.append(black)
 for i,poly in enumerate(me.polygons):
  if i>=whitefaces:poly.material_index=1;poly.use_smooth=False;norm.extend([tuple(poly.normal)]*len(poly.loop_indices))
  else:poly.use_smooth=True
 me.normals_split_custom_set(norm)
 cheek['lower_return']='Shared paint/apron edge vertices, removed internal overlapping interface faces'
def aperture(n,outer,inner,depth,mat=paint,parent=body):
 # Continuous annular ring around the actual opening, with a returned inner tunnel.
 normal=Vector((0,1,0));a=[Vector(p)for p in outer];b=[Vector(p)for p in inner]
 rows=[a,[p.lerp(q,.10)for p,q in zip(a,b)],[p.lerp(q,.90)for p,q in zip(a,b)],b,[p-normal*depth for p in b],[p-normal*depth for p in a]]
 count=len(a);verts=[tuple(p)for row in rows for p in row]
 faces=[(j*count+k,j*count+(k+1)%count,((j+1)%len(rows))*count+(k+1)%count,((j+1)%len(rows))*count+k)for j in range(len(rows))for k in range(count)]
 o=mesh(n,verts,faces,mat,parent,False);bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(o.data);bm.free();bevel(o,.006,3);return o
# Replace complete wing/brow and cheek/lower-return assemblies, not sampled density.
drop(('front_wing_','hood_lamp_transition_','front_fascia_cheek_','central_lamp_outer_cheek','central_lamp_cavity_','central_lamp_black_housing','front_splitter_blade'))
for s,label in [(-1,'left'),(1,'right')]:
 rows=[]
 for y,wi,zi,wo,zo in [(.34,.355,.676,.69,.685),(.62,.345,.712,.825,.748),(.98,.345,.730,.875,.795),(1.40,.425,.725,.948,.837),(1.73,.445,.675,.970,.828),(1.94,.352,.588,.960,.778),(2.05,.282,.523,.931,.727)]:
  # Upper tensioned face, substantial forward lip and returned underside share vertices.
  dx=wo-wi;dz=zo-zi
  prof=[(wi,zi),(wi+.025,zi+.004),(wi+dx*.48,zi+dz*.53),(wo-.075,zo+.008),(wo,zo-.004),(wo-.003,zo-.030),(wo-.075,zo-.034),(wi+dx*.48,zi+dz*.53-.025),(wi+.025,zi-.023),(wi,zi-.020)]
  rows.append([(s*x,y,z)for x,z in prof])
 wing=sectional('P03A1_wing_brow_shell_'+label,rows)
 # Cheek curves into its painted lower ledge as a single closed volumetric component.
 rows=[]
 stations=[(.299,2.057,.507,.105,.075),(.387,2.072,.411,.116,.085),(.479,2.068,.284,.108,.105),(.567,2.070,.220,.085,.142),(.692,2.035,.227,.070,.150),(.867,1.992,.247,.050,.125),(.927,1.986,.249,.028,.095)]
 for i,(x,y,z,w,d) in enumerate(stations):
  a=stations[max(0,i-1)];b=stations[min(len(stations)-1,i+1)];normal=Vector((-(b[2]-a[2]),b[0]-a[0])).normalized()
  rows.append([(s*(x+normal.x*t*w),y+dep,z+normal.y*t*w)for t,dep in [(-.52,0),(.52,0),(.62,-.02),(.57,-d),(-.50,-d),(-.61,-.028)]])
 cheek=sectional('P03A1_cheek_to_lower_return_'+label,rows);attach_apron(cheek)
 # Upper lamp cavity inner wall follows the actual opening and terminates on a recessed back.
 inner=[(s*.504,2.054,.568),(s*.925,1.957,.727),(s*.901,1.977,.616),(s*.61,2.065,.513)]
 outer=[(s*.483,2.058,.571),(s*.943,1.953,.753),(s*.920,1.977,.599),(s*.601,2.073,.490)]
 aperture('P03A1_upper_light_socket_'+label,outer,inner,.041,rim)
 # Black vent housing has closed side walls, with existing real vanes left visible inside.
 inner=[(s*.636,2.023,.462),(s*.877,1.971,.548),(s*.870,1.977,.343),(s*.711,2.025,.333)]
 outer=[(s*.60,2.04,.494),(s*.909,1.963,.579),(s*.902,1.965,.316),(s*.694,2.041,.307)]
 aperture('P03A1_lower_vent_socket_'+label,outer,inner,.062,black)
# Central aperture: continuous manufactured ring and deep interior, open through the center.
for o in bpy.data.objects:
 if o.name.startswith('hood_crown_'):
  for v in o.data.vertices:
   t=max(0,min(1,(v.co.y-1.74)/.16));v.co.z+=.036*t*max(0,1-(abs(v.co.x)/.389)**2)
outer=[(-.282,2.050,.523),(-.389,1.900,.628),(-.278,1.900,.652),(0,1.900,.669),(.278,1.900,.652),(.389,1.900,.628),(.282,2.050,.523),(0,2.080,.506)]
inner=[(-.244,2.051,.532),(-.236,2.000,.583),(-.215,1.949,.636),(0,1.949,.636),(.215,1.949,.636),(.236,2.000,.583),(.244,2.051,.532),(0,2.051,.532)]
aperture('P03A1_center_lamp_surround',outer,inner,.055)
box('P03A1_center_lamp_back',(0,1.906,.596),(.415,.018,.105),recess,body,.004)
drop(('center_grille','grille_horizontal'))
panel('P03A1_grille_recess_back',[(-.267,2.011,.479),(.267,2.011,.479),(.382,2.018,.290),(-.382,2.018,.290)],recess,body,.010,.003)
for z in [.313,.342,.371,.400,.429,.458]:
 width=.267+(.479-z)/(.479-.290)*(.382-.267)-.020
 box('P03A1_grille_inset_slat',(0,2.027,z),(width*2,.011,.008),black,body,.002)
# One molded broad lower air dam with broad horizontal return, not a perimeter tube.
front=[(-.972,1.973,.198),(-.889,2.080,.154),(-.486,2.148,.147),(-.274,2.127,.214),(.274,2.127,.214),(.486,2.148,.147),(.889,2.080,.154),(.972,1.973,.198)]
rows=[]
for x,y,z in front:rows.append([(x,y,z),(x,y-.020,z+.018),(x,y-.106,z+.019),(x,y-.118,z-.010),(x,y-.021,z-.026)])
splitter=cage('P03A1_splitter_molded_blade',rows,black,levels=0)
for poly in splitter.data.polygons:poly.use_smooth=False
bevel(splitter,.004,2)
# Ten swept spokes share a master section: broad branching root, thin kinked tip, deep black channels.
def lathe(n,profile,mat,parent,segments=96):
 v=[(x,r*math.sin(i*math.tau/segments),r*math.cos(i*math.tau/segments))for x,r in profile for i in range(segments)]
 f=[(j*segments+i,j*segments+(i+1)%segments,(j+1)*segments+(i+1)%segments,(j+1)*segments+i)for j in range(len(profile)-1)for i in range(segments)]
 return mesh(n,v,f,mat,parent)
for name,w,r,rr in [('front_left',.225,.32985,.2286),('front_right',.225,.32985,.2286),('rear',.305,.3455,.254)]:
 parent=bpy.data.objects[name+'_spin'];drop((name+'_machined_spoke',name+'_rim',name+'_hub',name+'_machined_lip',name+'_tire'))
 tire=lathe(name+'_tire',[(-w*.50,rr),(-w*.51,rr+.02),(-w*.512,r*.89),(-w*.485,r*.954),(-w*.425,r*.989),(-w*.31,r),(-w*.15,r),(0,r),(w*.15,r),(w*.31,r),(w*.425,r*.989),(w*.485,r*.954),(w*.512,r*.89),(w*.51,rr+.02),(w*.50,rr)],rubber,parent,128)
 lathe(name+'_rim_barrel',[(-w*.49,rr*.91),(-w*.495,rr*.992),(-w*.46,rr*1.02),(-w*.39,rr*.998),(-w*.34,rr*.90),(w*.34,rr*.90),(w*.39,rr*.998),(w*.46,rr*1.02),(w*.495,rr*.992),(w*.49,rr*.91)],rim,parent)
 for side in [-1,1]:
  depth=side*w*.467
  lathe(name+'_rim_machined_channel',[(side*w*.465,rr*1.008),(side*w*.491,rr*.995),(side*w*.49,rr*.981)],metal,parent)
  # Section root is broad and cupped; tip hooks into the rim with an offset sweep.
  for i in range(10):
   angle=i*math.tau/10;outline=[(.058,-.25),(.077,-.27),(rr*.60,-.11),(rr*.95,.07),(rr*.99,.105),(rr*.99,.15),(rr*.88,.14),(rr*.52,.13),(.084,.19)]
   facepts=[]
   for rad,da in outline:
    dish=.026*(1-rad/rr);facepts.append((depth-side*dish,rad*math.sin(angle+da),rad*math.cos(angle+da)))
   op=panel(name+'_swept_spoke_core',facepts,rim,parent,.025,.003)
   cen=sum((Vector(p)for p in facepts),Vector())/len(facepts)
   face=[tuple(cen+(Vector(p)-cen)*.88+Vector((side*.0028,0,0)))for p in facepts]
   panel(name+'_swept_machined_face',face,metal,parent,.0018,.0012)
  hub=lathe(name+'_hub_recess',[(depth-side*.036,0),(depth-side*.036,.045),(depth-side*.027,.064),(depth-side*.008,.065),(depth,.038),(depth,0)],rim,parent,64)
  # Five actual lug wells: annular mouths and inset metal nuts, no logos.
  for i in range(5):
   a=i*math.tau/5;y=.050*math.sin(a);z=.050*math.cos(a)
   bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=.0105,depth=.09,location=(depth,y,z),rotation=(0,math.pi/2,0));cut=bpy.context.object;cut.name='source_only_P03A1_lug_cutter';cut.parent=parent;cut.hide_render=True;cut.display_type='WIRE';cut['export_exclude']=True
   mod=hub.modifiers.new('Actual inset lug well','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cut
   o=lathe(name+'_lug_well',[(depth+.001*side,.010),(depth-.018*side,.008)],recess,parent,16)
   for v in o.data.vertices:v.co.y+=y;v.co.z+=z
   o=lathe(name+'_lug_nut',[(depth-.010*side,.0055),(depth-.016*side,.0055)],metal,parent,6)
   for v in o.data.vertices:v.co.y+=y;v.co.z+=z
 # Restrained shoulder grooves: only dark shallow strips on the curved outer shoulder.
 for side in [-1,1]:
  for i in range(40):
   a=i*math.tau/40;v=[]
   for xfrac,rrfrac,da in [(.30,.999,0),(.385,.996,.030),(.44,.982,.072),(.48,.958,.100)]:
    for off in [-.008,.008]:v.append((side*w*xfrac,(r*rrfrac+.0001)*math.sin(a+da+off),(r*rrfrac+.0001)*math.cos(a+da+off)))
   mesh(name+'_shoulder_sipe',v,[(j*2,j*2+1,j*2+3,j*2+2)for j in range(3)],recess,parent)
# Steering wheel: actual D rim, broad polygonal hub and two thick side pods.
steer=bpy.data.objects['steering_control'];drop(('steering_rim','steering_spoke','steering_center','P03A1_steering'))
pts=[]
for i in range(129):
 a=i*math.tau/128;x=.165*math.cos(a);z=max(-.137,.165*math.sin(a));pts.append((x,-.023,z))
curve('P03A1_steering_D_grip',pts,.0195,upholstery,steer)
hub=[(-.066,-.042,.052),(-.033,-.046,.075),(.033,-.046,.075),(.066,-.042,.042),(.048,-.045,-.047),(0,-.050,-.072),(-.047,-.045,-.048)]
panel('P03A1_steering_polygon_hub',hub,black,steer,.045,.010)
for side in [-1,1]:
 panel('P03A1_steering_swept_spoke',[(side*.047,-.027,.031),(side*.15,-.023,.043),(side*.151,-.023,-.032),(side*.060,-.034,-.040)],metal,steer,.019,.006)
 box('P03A1_steering_switch_pod',(side*.106,-.044,.005),(.070,.032,.065),black,steer,.012)
 for j in range(3):box('P03A1_steering_static_switch',(side*(.09+.016*(j%2)),-.062,.017-.022*(j//2)),(.012,.006,.012),rim,steer,.003)
 panel('P03A1_steering_paddle',[(side*.129,.006,.102),(side*.157,.007,.094),(side*.153,.016,-.027),(side*.132,.015,-.028)],metal,steer,.005,.005)
# Remove inherited upholstery rails; grey is a broad inset upholstered surface.
drop(('seat_outer_bolster','seat_silver_shoulder','seat_stitched_edge','seat_lower_cushion'))
for label in ['driver','passenger']:
 seat=bpy.data.objects['seat_cupped_'+label];seat.data.materials[0]=upholstery
 for region,lo,hi,depth in [('squab',3,19,.023),('lumbar',21,35,.024),('back',37,62,.017)]:
  verts=[];faces=[]
  for i in range(lo,hi+1):
   for j in range(6,19):
    co=seat.data.vertices[i*25+j].co.copy();t=max(0,min(1,(co.z-.34)/.22));pad=depth*(.6+.4*math.sin((i-lo)/(hi-lo)*math.pi))*(.55+.45*math.sin((j-6)/12*math.pi));co.y+=pad*t;co.z+=pad*(1-t);verts.append(tuple(co))
  for i in range(hi-lo):
   for j in range(12):a=i*13+j;faces.append((a,a+1,a+14,a+13))
  o=mesh('P03A1_upholstered_'+region+'_'+label,verts,faces,seataccent,cockpit)
  sol=o.modifiers.new('Inset upholstery thickness','SOLIDIFY');sol.thickness=.015;sol.use_even_offset=False
 center=-.36 if label=='driver'else .36
 for side in [-1,1]:
  rows=[];st=[(.09,.324,.025),(-.12,.36,.041),(-.35,.402,.050),(-.50,.59,.047),(-.60,.85,.039),(-.657,1.033,.025)]
  for i,(y,z,w)in enumerate(st):
   a=st[max(0,i-1)];b=st[min(len(st)-1,i+1)];normal=Vector((b[1]-a[1],-(b[0]-a[0]))).normalized();x=center+side*(.186 if z<.8 else .16)
   rows.append([(x+dx*w,y+normal.x*dep,z+normal.y*dep)for dx,dep in [(-1,-.003),(-.7,.021),(.7,.025),(1,.006),(.8,-.025),(-.8,-.025)]])
  cage('P03A1_padded_bolster_'+label,rows,upholstery,cockpit,levels=1)
# Shaped instrument hood and center-stack bezel retain static/off display faces.
drop(('instrument_binnacle','ride_command_housing'))
hoodrows=[]
for x,top in [(-.528,.737),(-.49,.766),(-.36,.770),(-.23,.766),(-.192,.737)]:
 hoodrows.append([(x,.107,top-.016),(x,.123,top),(x,.19,top-.004),(x,.28,.728),(x,.30,.715)])
patch('P03A1_instrument_hood',hoodrows,black,cockpit,steps=22,cross=8,th=.020,flip=True)
for x in [-.528,-.192]:panel('P03A1_instrument_hood_side',[(x,.107,.65),(x,.107,.722),(x,.185,.736),(x,.284,.713),(x,.28,.652)],black,cockpit,.019,.005)
outer=[(-.146,.195,.558),(.146,.195,.558),(.153,.233,.735),(.127,.235,.770),(-.127,.235,.770),(-.153,.233,.735)]
inner=[(-.111,.181,.589),(.111,.181,.589),(.114,.188,.728),(.107,.188,.742),(-.107,.188,.742),(-.114,.188,.728)]
aperture('P03A1_centerstack_surround',outer,inner,-.045,black,cockpit)
# Compact R/N/D/M physical selector pod from exact AutoDrive cockpit photo.
drop(('autodrive_button','autodrive_label','console_recessed_switch_island'))
panel('P03A1_AutoDrive_pod',[(-.042,-.331,.433),(.042,-.331,.433),(.042,-.15,.464),(-.042,-.15,.464)],rim,cockpit,.019,.004)
for i,label in enumerate(['R','N','D','M']):
 y=-.173-i*.042;z=.448+.17*(y+.24);o=box('P03A1_AutoDrive_key',(0,y,z+.006),(.046,.028,.009),black,cockpit,.003)
 cu=bpy.data.curves.new('P03A1_label_'+label,'FONT');cu.body=label;cu.size=.012;cu.align_x='CENTER';cu.align_y='CENTER'
 ob=bpy.data.objects.new('P03A1_AutoDrive_label_'+label,cu);bpy.context.collection.objects.link(ob);ob.parent=cockpit;ob.location=(0,y,z+.012);ob.rotation_euler.x=.17;cu.materials.append(seataccent)
 bpy.ops.object.select_all(action='DESELECT');bpy.context.view_layer.objects.active=ob;ob.select_set(True);bpy.ops.object.convert(target='MESH');ob.select_set(False)
# UVs on all new editable mesh surfaces; material-specific projection follows below.
for o in list(bpy.data.objects):
 if o.type!='MESH':continue
 if not o.data.uv_layers:
  uv=o.data.uv_layers.new(name='SurfaceUV')
  for poly in o.data.polygons:
   axes=[k for k in range(3)if k!=max(range(3),key=lambda k:abs(poly.normal[k]))]
   for li in poly.loop_indices:
    co=o.data.vertices[o.data.loops[li].vertex_index].co;uv.data[li].uv=(co[axes[0]],co[axes[1]])
 if paint in list(o.data.materials):
  uv=o.data.uv_layers.get('PaintUV') or o.data.uv_layers.new(name='PaintUV')
  if o.name.startswith('P03A1_'):
   for li in range(len(o.data.loops)):
    co=o.matrix_world@o.data.vertices[o.data.loops[li].vertex_index].co;uv.data[li].uv=((co.x+1.02)/2.04,(co.y+1.70)/3.84)
 if o.name.endswith('_tire'):
  uv=o.data.uv_layers.get('TireUV') or o.data.uv_layers.new(name='TireUV');width=.305 if o.name.startswith('rear')else .225
  for poly in o.data.polygons:
   vals=[(li,(math.atan2(o.data.vertices[o.data.loops[li].vertex_index].co.y,o.data.vertices[o.data.loops[li].vertex_index].co.z)/math.tau)%1,o.data.vertices[o.data.loops[li].vertex_index].co.x/width+.5)for li in poly.loop_indices];wrap=max(v[1]for v in vals)-min(v[1]for v in vals)>.5
   for li,u,v in vals:uv.data[li].uv=(u+1 if wrap and u<.5 else u,v)
if not FINISH:
 bs=paint.node_tree.nodes.get('Principled BSDF')
 for key in ['Base Color','Roughness','Metallic','Normal']:
  for link in list(bs.inputs[key].links):paint.node_tree.links.remove(link)
 bs.inputs['Base Color'].default_value=(.43,.45,.47,1);bs.inputs['Roughness'].default_value=.30;bs.inputs['Metallic'].default_value=.05
else:
 exec(compile((P/'scripts/vehicle_p03a1_materials.py').read_text(),str(P/'scripts/vehicle_p03a1_materials.py'),'exec'),globals())
root['stage']='P03A1 neutral surface checkpoint' if not FINISH else 'P03A1 mapped candidate'
bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get()
editable=[o for o in bpy.data.objects if o.type in {'MESH','CURVE'}and not o.get('export_exclude')]
source_count=len(editable);points=[];triangle_count=0
for o in editable:
 ev=o.evaluated_get(dg);me=ev.to_mesh();me.calc_loop_triangles();triangle_count+=len(me.loop_triangles);points += [o.matrix_world@v.co for v in me.vertices];ev.to_mesh_clear()
assert triangle_count<=250000,triangle_count
assert all(abs(p.x)<1.06 and -.1<p.z<1.5 and -1.8<p.y<2.3 for p in points),'Unexpected evaluated bounds'
source=P/'assets/blender/vehicles/slingshot-p03a1.blend';bpy.ops.file.make_paths_relative();bpy.ops.wm.save_as_mainfile(filepath=str(source))
tail=prior[prior.index('# Preserve semantic bindings,'):].replace('slingshot-p03a.glb','slingshot-p03a1.glb')
exec(compile(tail,'P03A1 inherited export-only batching','exec'),globals())
