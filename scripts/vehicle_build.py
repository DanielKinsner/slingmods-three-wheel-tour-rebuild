"""P01 authored diagnostic clay, Blender 4.5.2. All primary surfaces are authored meshes.
Run from project root: blender -b --python scripts/vehicle_build.py
Sources/research-only imagery: director-kit/references/README.md. No image is exported.
"""
import bpy, math, json, pathlib
from mathutils import Vector
P=pathlib.Path(__file__).resolve().parents[1]
OUT=P/'public/assets/vehicles'; SRC=P/'assets/blender/vehicles'; EV=P/'director-kit/production/evidence/G1'
for d in (OUT,SRC,EV): d.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(n,c,rough=.6,metal=0):
 m=bpy.data.materials.new(n); m.diffuse_color=(*c,1); m.use_nodes=True
 b=m.node_tree.nodes.get('Principled BSDF'); b.inputs['Base Color'].default_value=(*c,1); b.inputs['Roughness'].default_value=rough; b.inputs['Metallic'].default_value=metal
 return m
clay=mat('P01 neutral body clay',(.49,.52,.55)); dark=mat('P01 dark structural clay',(.12,.14,.16)); rubber=mat('P01 tire diagnostic',(.055,.062,.068),.88); alloy=mat('P01 wheel face',(.39,.42,.44),.4,.3); seatmat=mat('P01 upholstery clay',(.22,.24,.26),.9); inset=mat('Recesses',(.035,.045,.055)); lens=mat('Unlit lamp lens',(.72,.76,.79),.25); red=mat('Unlit tail lens',(.30,.065,.075),.4); glass=mat('Opaque diagnostic wind deflector',(.18,.24,.27),.3)
def empty(n,p=None,loc=(0,0,0)):
 o=bpy.data.objects.new(n,None); bpy.context.collection.objects.link(o); o.parent=p; o.location=loc; return o
root=empty('vehicle_root'); body=empty('body_static',root); cockpit=empty('cockpit',root)
def mesh(n,v,f,ma=clay,p=body,bev=.008):
 me=bpy.data.meshes.new(n); me.from_pydata(v,[],f); me.update(); o=bpy.data.objects.new(n,me); bpy.context.collection.objects.link(o); o.parent=p; o.data.materials.append(ma)
 if bev:
  mod=o.modifiers.new('Panel edge radii','BEVEL'); mod.width=bev; mod.segments=2
  o.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL')
 return o
def panel(n,v,ma=clay,p=body,th=.016,bev=.005):
 o=mesh(n,v,[tuple(range(len(v)))],ma,p,0); s=o.modifiers.new('Panel wall','SOLIDIFY'); s.thickness=th
 if bev:
  s=o.modifiers.new('Panel soft edge','BEVEL'); s.width=bev; s.segments=2
 return o
def box(n,loc,size,ma=dark,p=body,bev=.02):
 x,y,z=loc; a,b,c=[i/2 for i in size]
 return mesh(n,[(x+i*a,y+j*b,z+k*c) for i,j,k in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]],[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],ma,p,bev)
def rod(n,a,b,r,ma=dark,p=body,verts=12):
 d=Vector(b)-Vector(a); bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=d.length,location=(Vector(a)+Vector(b))/2)
 o=bpy.context.object; o.name=n; o.rotation_euler=d.to_track_quat('Z','Y').to_euler(); o.data.materials.append(ma); o.parent=p
 for f in o.data.polygons:f.use_smooth=True
 return o
def path(n,pts,r,ma=dark,p=body):
 c=bpy.data.curves.new(n,'CURVE'); c.dimensions='3D'; c.resolution_u=1; c.bevel_depth=r; c.bevel_resolution=3
 s=c.splines.new('POLY'); s.points.add(len(pts)-1)
 for a,v in zip(s.points,pts):a.co=(*v,1)
 o=bpy.data.objects.new(n,c); bpy.context.collection.objects.link(o); o.parent=p; c.materials.append(ma); return o
def lathe(n,profile,ma,p,segments=64):
 v=[(x,r*math.sin(i*2*math.pi/segments),r*math.cos(i*2*math.pi/segments)) for x,r in profile for i in range(segments)]
 f=[(j*segments+i,j*segments+(i+1)%segments,(j+1)*segments+(i+1)%segments,(j+1)*segments+i) for j in range(len(profile)-1) for i in range(segments)]
 o=mesh(n,v,f,ma,p,0)
 for f in o.data.polygons:f.use_smooth=True
 return o
def wheel(n,c,r,w,rr,par=root):
 steer=empty(n+'_steer',par,c) if n!='rear' else None; spin=empty(n+'_spin',steer or par,(0,0,0) if steer else c)
 lathe(n+'_tire',[(-w*.5,rr),(-w*.52,r*.90),(-w*.44,r*.985),(-w*.32,r),(w*.32,r),(w*.44,r*.985),(w*.52,r*.90),(w*.5,rr)],rubber,spin)
 lathe(n+'_rim',[(-w*.49,rr*.96),(-w*.49,rr),(-w*.37,rr*1.02),(w*.37,rr*1.02),(w*.49,rr),(w*.49,rr*.96)],alloy,spin)
 lathe(n+'_hub',[(-w*.49,0),(-w*.49,.067),(w*.49,.067),(w*.49,0)],alloy,spin)
 for face in (-1,1):
  for i in range(10):
   a=i*math.tau/10
   # swept angular spoke faces, not radial cylinders
   v=[]
   for rad,angle in [(.053,a-.24),(rr*.96,a+.06),(rr*.96,a+.14),(.085,a+.23)]:v.append((face*w*.48,rad*math.sin(angle),rad*math.cos(angle)))
   panel(n+'_machined_spoke',v,alloy,spin,.016,.003)
  lathe(n+'_brake_disc',[(face*w*.30,.073),(face*w*.30,rr*.74)],dark,spin)
 return steer,spin
layout=json.loads((P/'public/assets/slingshot-contact-layout.json').read_text())
for w in layout['wheels']:
 x,z,ny=w['center']; wheel(w['id'],(x,-ny,z),w['radius'],w['width'],.2286 if w['id']!='rear' else .254)
# Hood sculpted using mirrored cross-section stations. Narrow central prow, broad raised wheel wings.
stations=[(2.075,.295,.535,.55),(1.90,.39,.635,.62),(1.63,.45,.70,.675),(1.27,.40,.79,.72),(.85,.32,.80,.73),(.42,.36,.77,.68)]
for s,label in [(-1,'left'),(1,'right')]:
 v=[]
 for y,w,zc,ze in stations:v.extend([(0,y,zc),(s*w*.63,y,zc+.009),(s*w,y,ze)])
 f=[]
 for j in range(len(stations)-1):
  for k in range(2):
   # Leave a real central forward opening under the hood lip for the recessed lamp.
   if j==0 and k==0:continue
   i=j*3+k; f.append((i,i+1,i+4,i+3))
 o=mesh('hood_central_'+label,v,f,clay); so=o.modifiers.new('Hood thickness','SOLIDIFY'); so.thickness=.021
 # high sweeping eyebrow/wheel wing, free edge over open tire
 rows=[(2.045,.30,.53,.93,.755),(1.90,.39,.625,.955,.79),(1.62,.45,.675,.94,.825),(1.28,.40,.72,.89,.81),(.92,.32,.73,.84,.76),(.53,.36,.68,.76,.675),(.32,.44,.66,.68,.66)]
 v=[]
 for y,wi,zi,wo,zo in rows:v.extend([(s*wi,y,zi),(s*(wi*.42+wo*.58),y,(zi+zo)*.5+.03),(s*wo,y,zo)])
 f=[(j*3+k,j*3+k+1,(j+1)*3+k+1,(j+1)*3+k) for j in range(len(rows)-1) for k in range(2)]
 o=mesh('sculpted_front_fender_'+label,v,f,clay); so=o.modifiers.new('Fender inner wall','SOLIDIFY'); so.thickness=.019
 # triangular front face and lower pods are the 2020-24 fascia signature
 panel('nose_cheek_'+label,[(s*.30,2.075,.535),(s*.45,2.085,.27),(s*.65,2.06,.19),(s*.93,1.98,.23),(s*.90,1.97,.30),(s*.60,2.025,.31),(s*.52,2.04,.515)],clay)
 panel('lamp_recess_'+label,[(s*.43,2.055,.555),(s*.925,1.955,.745),(s*.90,1.982,.61),(s*.62,2.06,.51)],inset)
 panel('lights_head_upper_'+label,[(s*.53,2.068,.57),(s*.90,1.978,.705),(s*.87,1.994,.658),(s*.60,2.078,.551)],lens)
 panel('lower_vent_'+label,[(s*.60,2.015,.49),(s*.905,1.965,.575),(s*.90,1.963,.32),(s*.70,2.016,.31)],inset)
 panel('lights_head_diagonal_'+label,[(s*.62,2.042,.492),(s*.68,2.038,.48),(s*.83,2.011,.326),(s*.78,2.02,.314)],lens)
 for j in range(3):rod('vent_vane_'+label,(s*(.78+j*.045),1.99,.38),(s*(.75+j*.045),1.99,.515),.005,dark)
 panel('lights_signals_'+label,[(s*.925,1.955,.745),(s*.963,1.79,.753),(s*.963,1.80,.648),(s*.925,1.955,.647)],seatmat)
 # rocker has pronounced U-cut boarding opening, forward scoop and elevated tail shoulder
 panel('sculpted_sill_'+label,[(s*.64,.71,.66),(s*.79,.28,.28),(s*.78,-.32,.21),(s*.69,-.95,.18),(s*.72,-1.20,.42),(s*.77,-1.08,.78),(s*.73,-.77,.78),(s*.63,-.27,.39),(s*.63,.20,.39)],dark,th=.048,bev=.015)
 panel('front_side_scoop_'+label,[(s*.73,.76,.58),(s*.765,.27,.32),(s*.77,.02,.31),(s*.68,.30,.23),(s*.65,.64,.26)],clay)
 panel('tail_shoulder_'+label,[(s*.63,-.17,.60),(s*.75,-.42,.78),(s*.75,-1.09,.91),(s*.64,-1.30,.89),(s*.60,-1.17,.72),(s*.63,-.59,.58)],clay,th=.04,bev=.013)
 path('exposed_chassis_rail_'+label,[(s*.64,.63,.65),(s*.56,-.25,.35),(s*.63,-.75,.69)],.027,alloy)
 # true exposed wishbones underneath wing, grounded contact layout
 sus=empty('suspension_front_'+label,root)
 for z in (.23,.40):
  for y in (.94,1.61):rod('front_A_arm_'+label,(s*.34,y,z),(s*.83,1.3335,z+.035),.019,alloy,sus)
 rod('front_damper_'+label,(s*.48,1.31,.64),(s*.76,1.3335,.28),.029,dark,sus)
 a=Vector((s*.48,1.31,.64)); b=Vector((s*.76,1.3335,.28)); d=b-a; u=d.cross(Vector((0,1,0))).normalized(); t=d.normalized().cross(u)
 path('front_spring_'+label,[tuple(a+d*i/96 + .044*(math.cos(i/96*math.tau*7)*u+math.sin(i/96*math.tau*7)*t)) for i in range(97)],.008,alloy,sus)
 # tail undertray hangs around the exposed central wheel, not a covered car rear
 panel('rear_bucket_undertray_'+label,[(s*.20,-1.12,.83),(s*.64,-1.25,.87),(s*.69,-1.17,.26),(s*.40,-1.04,.19),(s*.20,-.95,.25)],dark,th=.023)
 panel('rear_tail_lamp_bed_'+label,[(s*.18,-1.29,.87),(s*.55,-1.34,.885),(s*.69,-1.30,.77),(s*.65,-1.29,.73),(s*.52,-1.325,.82),(s*.20,-1.29,.83)],seatmat)
 path('lights_brake_'+label,[(s*.20,-1.31,.86),(s*.52,-1.36,.865),(s*.60,-1.345,.84),(s*.67,-1.315,.758)],.013,red)
# Central grille and faceted splitter
panel('center_grille',[(-.32,2.06,.50),(.32,2.06,.50),(.40,2.075,.285),(-.40,2.075,.285)],inset)
for z in [.315,.345,.375,.405,.435,.465]:rod('grille_horizontal',(-.31,2.077,z),(.31,2.077,z),.005,dark)
# Trapezoidal cavity with actual setback, wall thickness, roof and internal lamp face.
panel('central_lamp_cavity_back',[(-.205,1.883,.546),(.205,1.883,.546),(.215,1.883,.646),(-.215,1.883,.646)],inset)
panel('central_lamp_cavity_floor',[(-.205,2.085,.533),(.205,2.085,.533),(.205,1.883,.546),(-.205,1.883,.546)],dark)
panel('central_lamp_cavity_roof',[(-.235,2.015,.649),(.235,2.015,.649),(.238,1.897,.647),(-.238,1.897,.647)],clay)
for s in (-1,1):
 panel('central_lamp_cavity_side',[(s*.205,2.085,.533),(s*.235,2.015,.649),(s*.215,1.883,.646),(s*.205,1.883,.546)],dark)
 panel('central_lamp_outer_cheek',[(s*.205,2.085,.533),(s*.295,2.075,.55),(s*.2457,1.90,.644),(s*.235,2.015,.649)],clay)
box('central_lamp_black_housing',(0,1.925,.602),(.355,.036,.066),inset,body,.004)
panel('lights_head_center',[(-.163,1.949,.575),(.163,1.949,.575),(.166,1.949,.627),(-.166,1.949,.627)],lens)
for x in (-.10,0,.10):rod('central_lamp_projector_division',(x,1.957,.577),(x,1.957,.625),.0035,dark)
# Broad flat splitter blade follows stepped fascia; 95mm fore/aft surface, not tubular trim.
outline=[(-.965,1.965,.172),(-.72,2.065,.144),(-.39,2.12,.144),(-.22,2.12,.217),(.22,2.12,.217),(.39,2.12,.144),(.72,2.065,.144),(.965,1.965,.172)]
v=[]
for x,y,z in outline:v.extend([(x,y,z),(x,y-.095,z)])
splitter=mesh('front_splitter_blade',v,[(i*2,i*2+1,i*2+3,i*2+2) for i in range(len(outline)-1)],dark,body,0)
mod=splitter.modifiers.new('Splitter blade thickness','SOLIDIFY');mod.thickness=.026
mod=splitter.modifiers.new('Splitter edge chamfer','BEVEL');mod.width=.004;mod.segments=2
# Raised forward-facing hood inlet: shaped roof and side walls over a recessed black throat.
panel('hood_scoop_roof',[(-.143,1.027,.882),(.143,1.027,.882),(.115,.82,.861),(.070,.63,.79),(-.070,.63,.79),(-.115,.82,.861)],clay,th=.017)
for s in (-1,1):panel('hood_scoop_side',[(s*.143,1.027,.882),(s*.169,1.027,.805),(s*.128,.80,.805),(s*.070,.63,.79),(s*.115,.82,.861)],clay)
panel('hood_scoop_recess',[(-.115,.963,.81),(.115,.963,.81),(.12,.963,.855),(-.12,.963,.855)],inset)
panel('hood_scoop_floor',[(-.144,1.028,.805),(.144,1.028,.805),(.115,.963,.81),(-.115,.963,.81)],dark)
for s in (-1,1):
 for j in range(3):panel('hood_louver',[(s*(.32+j*.06),.67,.758),(s*(.35+j*.06),.69,.762),(s*(.40+j*.06),.88,.777),(s*(.37+j*.06),.85,.78)],inset)
# cockpit is open, with floor wells, contoured buckets, instruments and AutoDrive console.
panel('cockpit_front_bulkhead',[(-.62,.49,.17),(.62,.49,.17),(.62,.47,.67),(-.62,.47,.67)],dark,cockpit,.028)
panel('rear_center_bulkhead',[(-.25,-1.08,.29),(.25,-1.08,.29),(.25,-1.21,.88),(-.25,-1.21,.88)],dark,body,.032)
for s,label in [(-1,'driver'),(1,'passenger')]:
 box('floor_'+label,(s*.38,-.13,.165),(.50,1.31,.045),dark,cockpit)
 # seat loft cross-sections with lifted side bolsters; seat bottom to shoulder to headrest
 rows=[(.12,.275,.20),(-.19,.32,.225),(-.46,.40,.235),(-.60,.65,.23),(-.68,.90,.205),(-.72,1.08,.14),(-.72,1.115,.11)]
 v=[]
 for y,z,w in rows:v.extend([(s*.36-w,y,z+.025),(s*.36-w*.73,y+.04,z),(s*.36+w*.73,y+.04,z),(s*.36+w,y,z+.025)])
 f=[(j*4+k,(j+1)*4+k,(j+1)*4+k+1,j*4+k+1) for j in range(len(rows)-1) for k in range(3)]
 o=mesh('seat_'+label,v,f,seatmat,cockpit,.016); so=o.modifiers.new('Bucket shell','SOLIDIFY');so.thickness=.065
 for side in (-1,1):path('seat_bolster_'+label,[(s*.36+side*.195,.08,.32),(s*.36+side*.215,-.19,.38),(s*.36+side*.20,-.52,.57),(s*.36+side*.17,-.65,.86),(s*.36+side*.125,-.69,1.06)],.029,dark,cockpit)
 path('seat_trim_'+label,[(s*.36-.11,-.675,1.065),(s*.36-.09,-.666,1.10),(s*.36+.09,-.666,1.10),(s*.36+.11,-.675,1.065)],.012,alloy,cockpit)
 # full height trapezoidal roll-hoops including rear supporting struts
 path('roll_hoop_'+label,[(s*.36-.22,-.87,.84),(s*.36-.135,-.83,1.295),(s*.36+.135,-.83,1.295),(s*.36+.22,-.87,.84)],.023,dark)
 path('roll_hoop_inner_'+label,[(s*.36-.16,-.855,.93),(s*.36-.105,-.85,1.238),(s*.36+.105,-.85,1.238),(s*.36+.16,-.855,.93)],.013,alloy)
 for side in (-1,1):rod('hoop_rear_brace_'+label,(s*.36+side*.13,-.83,1.27),(s*.36+side*.19,-1.17,.87),.018,dark)
 panel('rear_seat_pod_'+label,[(s*.36-.19,-.90,.88),(s*.36+.19,-.90,.88),(s*.36+.12,-1.19,.875),(s*.36-.12,-1.19,.875)],dark)
 box('dashboard_'+label,(s*.39,.38,.667),(.57,.20,.16),dark,cockpit,.025)
 # stalk and angular mirrors with separate reflective inset
 path('mirror_stalk_'+label,[(s*.70,.48,.68),(s*.82,.47,.895),(s*.885,.45,.895)],.013,dark,cockpit)
 box('mirror_'+label,(s*.88,.44,.91),(.18,.10,.08),dark,cockpit,.025)
 box('mirror_glass_'+label,(s*.88,.384,.915),(.145,.005,.055),alloy,cockpit,.016)
panel('wind_deflector',[(-.62,.32,.755),(-.58,.20,.986),(-.30,.155,1.006),(.30,.155,1.006),(.58,.20,.986),(.62,.32,.755)],glass,cockpit,.008,.003)
box('center_tunnel',(0,-.12,.31),(.215,1.06,.26),dark,cockpit,.032)
panel('console_facade',[(-.14,.24,.44),(.14,.24,.44),(.155,.27,.785),(-.155,.27,.785)],clay,cockpit,.035)
box('ride_command_screen',(0,.208,.65),(.222,.026,.149),inset,cockpit,.006)
box('screen_inactive_clay',(0,.191,.65),(.193,.006,.126),glass,cockpit,.003)
for i in range(4):box('console_switch',(-.086+i*.057,.186,.525),(.028,.022,.035),alloy,cockpit,.003)
for i in range(3):box('autodrive_RND',(0,-.075-i*.07,.453),(.07,.048,.014),alloy,cockpit,.004)
box('gauge_cluster',(-.36,.243,.724),(.28,.035,.14),inset,cockpit,.025)
for x in (-.435,-.285):
 pts=[(x+math.cos(i*math.tau/32)*.050,.218,.727+math.sin(i*math.tau/32)*.05) for i in range(33)];path('gauge_bezel',pts,.004,alloy,cockpit)
steering=empty('steering_control',cockpit,(-.36,.015,.71))
rod('steering_column',(-.36,.026,.71),(-.36,.27,.64),.027,dark,cockpit)
pts=[]
for i in range(65):
 a=i*math.tau/64; pts.append((.163*math.cos(a),0,max(-.134,.163*math.sin(a))))
path('steering_rim',pts,.016,dark,steering)
for a in (.20,math.pi-.2,-math.pi/2):rod('steering_spoke',(0,0,0),(.14*math.cos(a),0,.14*math.sin(a)),.016,alloy,steering)
box('steering_center',(0,-.005,0),(.10,.045,.088),dark,steering,.024)
for x in (-.115,.115):box('autodrive_paddle',(x,.028,.032),(.035,.017,.12),alloy,steering,.01)
panel('rear_deck',[(-.65,-1.23,.895),(.65,-1.23,.895),(.65,-.93,.87),(-.65,-.93,.87)],dark)
panel('center_tail_fin',[(-.02,-.68,.84),(0,-.85,1.135),(.02,-1.24,.91),(-.02,-1.24,.91)],dark,th=.038)
rear=empty('suspension_rear',root)
box('single_sided_swingarm',(.235,-.98,.29),(.13,.77,.13),alloy,rear,.035)
rod('rear_axle',(0,-1.3335,.3455),(.32,-1.3335,.3455),.045,alloy,rear)
path('drive_belt',[(.26,-1.3335+math.sin(a)*.224,.3455+math.cos(a)*.224) for a in [i*math.tau/64 for i in range(65)]],.016,dark,rear)
rod('rear_shock',(.28,-1.02,.36),(.28,-1.20,.79),.035,dark,rear)
path('rear_coil',[(.28+.052*math.cos(i/96*math.tau*7),-1.02-.18*i/96+.045*math.sin(i/96*math.tau*7),.36+.43*i/96) for i in range(97)],.008,alloy,rear)
for name,loc in {'mount_exhaust':(.45,-.75,.25),'mount_suspension_front_left':(-.48,1.31,.64),'mount_suspension_front_right':(.48,1.31,.64),'mount_suspension_rear':(.28,-1.20,.79),'mount_underglow_left':(-.67,-.1,.17),'mount_underglow_right':(.67,-.1,.17),'camera_cockpit':(-.36,-.57,1.12),'camera_nose':(0,1.82,.75),'rider_seat':(-.36,-.32,.38),'rider_hand_left':(-.49,.0,.71),'rider_hand_right':(-.23,.0,.71),'rider_foot_left':(-.49,.49,.22),'rider_foot_right':(-.28,.49,.22)}.items():empty(name,root,loc)
bpy.context.scene.unit_settings.system='METRIC'
root['vehicle_id']='slingshot_r_2024_autodrive';root['stage']='P01 diagnostic clay, not G3'; root['market']='US lighting, 2024 R AutoDrive, dimensions corroborated by CA published specs'
# Save source before applying export modifier stack.
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'slingshot-p01.blend'))
def export(path,objects):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_extras=True)
hero=list(bpy.data.objects); export(OUT/'slingshot.glb',hero)
deps=bpy.context.evaluated_depsgraph_get(); vv=[]; triangles=0
for o in hero:
 if o.type not in {'MESH','CURVE'}:continue
 ev=o.evaluated_get(deps); me=ev.to_mesh(); me.calc_loop_triangles();triangles+=len(me.loop_triangles);vv.extend([tuple(ev.matrix_world@v.co) for v in me.vertices]);ev.to_mesh_clear()
bounds=[[min(v[a] for v in vv),max(v[a] for v in vv)] for a in range(3)]
manifest={'vehicle':'2024 Polaris Slingshot R AutoDrive','stage':'P01 diagnostic clay','basis':'Blender +X right +Y forward +Z up; glTF export +X right +Y up -Z forward','source':'assets/blender/vehicles/slingshot-p01.blend','runtime':'public/assets/vehicles/slingshot.glb','dimensions_m':{'width':bounds[0][1]-bounds[0][0],'length':bounds[1][1]-bounds[1][0],'height':bounds[2][1]-bounds[2][0]},'bounds_blender':bounds,'triangles':triangles,'objects':len(hero),'contact_layout':layout,'nodes':[o.name for o in hero],'mounts':{o.name:list(o.location) for o in hero if o.name.startswith(('mount_','rider_','camera_'))},'suspension_hardpoints_m_blender':{'front_left_chassis':[-.48,1.31,.64],'front_left_arm':[-.76,1.3335,.28],'front_right_chassis':[.48,1.31,.64],'front_right_arm':[.76,1.3335,.28],'rear_upper':[.28,-1.20,.79],'rear_lower':[.28,-1.02,.36]},'uncertainties':['Suspension hardpoints and panel/cockpit vertices are photo estimates, not CAD measurements','Nominal unloaded tires; radius not measured loaded','US LED exterior chosen; seed CA projector wording is not copied as US equipment','No G3 surface/LOD/rider readiness claim']}
(EV/'asset-manifest.json').write_text(json.dumps(manifest,indent=2))
# Cheap dimensional silhouette blockouts deliberately kept separate from the clay hero.
for o in hero:o.hide_set(True)
blockroot=empty('scale_blockouts')
for ident,off,wb,width,length,height,frontR,rearR in [('slingshot',-2.6,2.667,1.98,3.80,1.318,.32985,.3455),('spyder_f3t',0,1.709,1.497,2.596,1.241,.28125,.303),('ryker_rally',2.2,1.709,1.522,2.35204,1.090,.2902,.30325)]:
 group=empty(ident+'_blockout',blockroot,(off,0,0)); group['stage']='scale only';group['length_status']='provisional 92.6-inch conversion; original source conflict unresolved' if ident=='ryker_rally' else 'manufacturer dimensions'
 track=1.755 if ident=='slingshot' else width-(.165 if ident=='spyder_f3t' else .145)
 for n,x,y,r,w in [('front_left',-track/2,wb/2,frontR,.225 if ident=='slingshot' else .165),('front_right',track/2,wb/2,frontR,.225 if ident=='slingshot' else .165),('rear',0,-wb/2,rearR,.305 if ident=='slingshot' else .225)]:wheel(ident+'_'+n,(x,y,r),r,w,r*.73,group)
 bodywidth=width*.68 if ident=='slingshot' else .57
 # faceted volume loft narrowing at rear; simple but correctly distinguishes tandem vs side-by-side
 sections=[(length-wb/2-rearR,bodywidth*.45,.33),(.48,bodywidth*.5,.69),(-.38,bodywidth*.47,.57),(-wb/2,.22,.53)]
 v=[]
 for y,w,h in sections:v.extend([(-w,y,.16),(w,y,.16),(w,y,h),(-w,y,h)])
 f=[(j*4+k,j*4+(k+1)%4,(j+1)*4+(k+1)%4,(j+1)*4+k) for j in range(3) for k in range(4)]+[(0,1,2,3),(12,15,14,13)]
 mesh(ident+'_body_envelope',v,f,clay,group,.045)
 if ident=='slingshot':
  for x in (-.36,.36):box('scale_seat',(x,-.51,.76),(.34,.17,.54),dark,group)
  path('scale_roll_height',[(-.50,-.70,.8),(-.47,-.70,height-.02),(-.22,-.70,height-.02),(-.19,-.70,.8)],.02,dark,group)
 else:
  box('tandem_seat',(0,-.43,.68),(.40,.58,.15),dark,group)
  path('handlebars',[(-.44,.28,1.00),(0,.30,.92),(.44,.28,1.00)],.023,dark,group)
  if ident=='spyder_f3t':
   for x in (-.48,.48):box('f3t_luggage',(x,-.75,.53),(.28,.52,.36),clay,group,.06)
   panel('f3t_windshield',[(-.3,.42,.8),(-.23,.25,height),(.23,.25,height),(.3,.42,.8)],glass,group)
  else:rod('ryker_mirror_height',(-.44,.28,1),(-.44,.28,height),.024,dark,group)
blockobjects=[o for o in bpy.data.objects if o not in hero]
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'vehicles-scale-blockouts.blend')); export(OUT/'scale-blockouts.glb',blockobjects)
print('VEHICLE_MANIFEST '+json.dumps(manifest['dimensions_m'])+' triangles='+str(triangles))
