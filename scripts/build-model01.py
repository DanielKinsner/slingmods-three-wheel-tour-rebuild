"""Localized donor adaptation. Run with the repository's Blender 4.5.2.
Original owner inputs are never written. Geometry helpers use game X/Y-up/-Z-forward.
"""
import bpy, math, json, runpy, hashlib
from pathlib import Path
from mathutils import Matrix, Vector
P=Path(__file__).resolve().parents[1]
D=P/'assets/source/model01/Slingshot-Build'
A=P/'assets/blender/model01'; O=P/'public/assets/model01'
H=runpy.run_path(str(P/'scripts/build-p08b-art.py'))
cv=H['cv']; group=H['group']; box=H['box']; prism=H['prism']; rod=H['rod']; path=H['path']; mat=H['mat']
bpy.ops.wm.open_mainfile(filepath=str(D/'Slingshot.blend'))
original={p.relative_to(D).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in D.rglob('*') if p.is_file()}
donor=list(bpy.data.objects)
root=bpy.data.objects['Slingshot']
vehicle=set([root,*root.children_recursive])
for o in donor:
 if o not in vehicle:bpy.data.objects.remove(o,do_unlink=True)
bpy.context.view_layer.update()
worlds={o:o.matrix_world.copy() for o in vehicle}
conversion=Matrix.Translation((0,.233406,0))@Matrix.Rotation(math.pi,4,'Z')
for o in vehicle:
 o.parent=None;o.matrix_world=conversion@worlds[o]
root.name='josh_donor_foundation';root.matrix_world=Matrix.Identity(4)

def parent(o,p):
 w=o.matrix_world.copy();o.parent=p;o.matrix_world=w
def parts(o):
 adj=[set() for _ in o.data.vertices]
 for e in o.data.edges:
  a,b=e.vertices;adj[a].add(b);adj[b].add(a)
 seen=set();result=[]
 for i in range(len(adj)):
  if i in seen:continue
  todo=[i];s=set()
  while todo:
   v=todo.pop()
   if v in s:continue
   s.add(v);todo.extend(adj[v]-s)
  seen.update(s);result.append(s)
 return result
def subset(o,name,indices,face_filter=None):
 """Copy selected faces, UV loops and supplied split normals without a remesh."""
 me=o.data;polys=[p for p in me.polygons if all(i in indices for i in p.vertices) and (face_filter is None or face_filter(p))]
 ids=sorted({i for p in polys for i in p.vertices});remap={v:i for i,v in enumerate(ids)}
 n=bpy.data.meshes.new(name);n.from_pydata([me.vertices[i].co for i in ids],[],[[remap[i] for i in p.vertices] for p in polys]);n.update()
 for m in me.materials:n.materials.append(m)
 loops=[i for p in polys for i in p.loop_indices]
 for layer in me.uv_layers:
  dest=n.uv_layers.new(name=layer.name)
  for j,i in enumerate(loops):dest.data[j].uv=layer.data[i].uv
 for a,b in zip(n.polygons,polys):a.material_index=b.material_index;a.use_smooth=b.use_smooth
 if loops:n.normals_split_custom_set([me.corner_normals[i].vector for i in loops])
 ob=bpy.data.objects.new(name,n);bpy.context.collection.objects.link(ob);ob.matrix_world=o.matrix_world.copy();return ob
def split_regions(name,choose):
 o=bpy.data.objects[name];regions={}
 for s in parts(o):
  # Inspect in ORIGINAL donor Blender coordinates, as documented in the audit.
  pts=[worlds[o]@o.data.vertices[i].co for i in s]
  lo=Vector([min(v[a] for v in pts) for a in range(3)]);hi=Vector([max(v[a] for v in pts) for a in range(3)])
  role=choose(lo,hi)
  if role:regions.setdefault(role,set()).update(s)
 result={k:subset(o,k,v) for k,v in regions.items()}
 bpy.data.objects.remove(o,do_unlink=True);return result

# Remove only old optical inserts; retain mirrors, badge, fin and rear trim.
split_regions('Slingshot_BodyDetail1',lambda lo,hi:'Josh_body_detail_retained' if hi.y>-.7 else None)
split_regions('Slingshot_Glass',lambda lo,hi:'Josh_windshield' if hi.y>-.7 else None)
# Retain cockpit tub/side trim and good seat topology; remove the old manual dash.
seats=split_regions('Slingshot_Interior',lambda lo,hi:('signature_seat_'+('driver' if lo.x>0 else 'passenger')) if lo.y>.10 and hi.x-lo.x<.55 and lo.z<.46 and hi.y<.90 else ('Josh_cockpit_tub' if lo.z<.60 else None))
# Seat cushions are kept, adjusted locally for the current driver/cockpit frame.
for name,o in seats.items():
 if name.startswith('signature_seat'):
  to_local=o.matrix_world.inverted()
  for v in o.data.vertices:
   p=o.matrix_world@v.co;t=max(0,min(1,(p.z-.38)/.70));p.y-=(-.05+.18*t);p.z-=.065;v.co=to_local@p
# Remove only the vintage dashboard triangles from the joined cockpit tubs.
tub=seats['Josh_cockpit_tub'];inv=conversion.inverted()
def keep_tub_face(f):
 p=inv@tub.matrix_world@f.center
 return not((p.z>.57 and p.y<.13 and abs(p.x)<.67) or (p.y>.64 and .25<p.z<.84 and .18<abs(p.x)<.63))
clean=subset(tub,'Josh_cockpit_tub_clean',set(range(len(tub.data.vertices))),keep_tub_face);bpy.data.objects.remove(tub,do_unlink=True)
# Later-generation compartment/drive cover comes from the current target assembly.
bpy.data.objects.remove(bpy.data.objects['SlingShot_RearBody_01'],do_unlink=True)
for name in ['Slingshot_InteriorDetail1','Slingshot_PhoneHolder','Slingshot_Suspension1','Slingshot_FBrakes_01','Slingshot_FBrakes_02','Slingshot_RBrakes_01']:
 bpy.data.objects.remove(bpy.data.objects[name],do_unlink=True)
# Keep wheel rubber and its UV/normal detail. Target-specific machined R rims and
# separately bound calipers/rotors are transplanted below.
tires={}
for source,target in [('Slingshot_WheelLF','front_left'),('Slingshot_WheelRF','front_right'),('Slingshot_WheelRear','rear')]:
 o=bpy.data.objects[source];ids={v for p in o.data.polygons if 'Tires' in o.data.materials[p.material_index].name for v in p.vertices}
 t=subset(o,'Josh_'+target+'_tire',ids);tires[target]=t;bpy.data.objects.remove(o,do_unlink=True)
for o in list(bpy.data.objects):
 if o.name.startswith('Steering_'):bpy.data.objects.remove(o,do_unlink=True)

# Neutral AO drives recolorable paint; the supplied graphite/trim maps stay intact.
paint=bpy.data.materials['Paint | SlingMods Red'];paint.name='Josh_Radar_Blue_NeutralAO'
ao=bpy.data.images.load(str(D/'textures/Slingshot_BodyAO.png'),check_existing=True)
for n in paint.node_tree.nodes:
 if n.type=='TEX_IMAGE':n.image=ao
q=paint.node_tree.nodes.get('Principled BSDF');q.inputs['Metallic'].default_value=.24;q.inputs['Roughness'].default_value=.3
# The source's so-called InteriorAO includes red upholstery inserts. Neutralize
# only those red pixels for the target black seats; all UVs and other pixels stay.
import numpy as np
upholstery=bpy.data.materials['Interior | Upholstery']
for n in upholstery.node_tree.nodes:
 if n.type=='TEX_IMAGE':
  source=n.image;pixels=np.array(source.pixels[:],dtype=np.float32).reshape(-1,4)
  red_pixels=(pixels[:,0]>pixels[:,1]*1.8)&(pixels[:,0]>pixels[:,2]*1.8)
  gray=np.max(pixels[red_pixels,:3],axis=1)*.26;pixels[red_pixels,:3]=gray[:,None]
  image=bpy.data.images.new('Josh_target_black_upholstery',width=source.size[0],height=source.size[1],alpha=True)
  image.pixels.foreach_set(pixels.ravel());image.pack();n.image=image
trim=bpy.data.materials['Interior | Red trim'];trim.name='Josh_Orange_Accent'
for n in trim.node_tree.nodes:
 if n.type=='TEX_IMAGE':n.image=bpy.data.images.load(str(D/'textures/Slingshot_InteriorAO.png'),check_existing=True)
# Source decal plane still contains supplied logos; no year/OEM provenance invented.

# Keep target-compatible controls/kinematic assemblies, not the previous car shell.
legacy=P/'assets/blender/hoop-refinement/slingshot-hoops-refined.blend'
# Library object names and their parents are evaluated after append so this script
# is reproducible on a fresh machine without the inspection scratch file.
before=set(bpy.data.objects)
with bpy.data.libraries.load(str(legacy),link=False) as (src,dst):dst.objects=list(src.objects)
appended=set(bpy.data.objects)-before
for o in appended:
 if not o.users_collection:bpy.context.collection.objects.link(o)
bpy.context.view_layer.update()
keep_groups={'front_left_steer','front_right_steer','front_left_spin','front_right_spin','rear_spin','rear_arm_visual','belt_visual','rear_axle_visual','rear_caliper_visual','shock_body_visual','shock_piston_visual','shock_spring_visual','rear_pulley_visual','suspension_front_left','suspension_front_right','steering_control','rear_storage_static','signature_storage_door_left','signature_storage_door_right'}
keep_names={'vehicle_root','cockpit','body_static','rear_arm_pivot','rear_hub','shock_upper','shock_lower','stock_exhaust','steering_column','autodrive_console_shell','dashboard_continuous','ride_command_lens','instrument_lens','console_round_control_center','console_start_center','console_switch_housing','rear_pivot_chassis_crossmember','rear_pivot_fixed_pin'}
prefixes=('console_','P03A1_AutoDrive','P03A1_centerstack','P03A1_instrument','rider_','mount_','shock_upper_chassis','shock_upper_cross','rear_lower_storage_return','rear_central_')
def wanted(o):
 if o.get('export_exclude') or o.name.startswith(('source_only','export_')):return False
 if o.name in keep_names or o.name in keep_groups or o.name.startswith(prefixes):return True
 a=o.parent
 while a:
  if a.name in keep_groups:
   return not ('_tire' in o.name or 'shoulder_sipe' in o.name)
  a=a.parent
 return False
kept={o for o in appended if wanted(o)}
for o in kept:
 if o.parent and o.parent not in kept:
  w=o.matrix_world.copy();o.parent=None;o.matrix_world=w
transplants=sorted(o.name for o in kept)
for o in appended-kept:bpy.data.objects.remove(o,do_unlink=True)
bpy.context.view_layer.update()
body=bpy.data.objects['body_static']
# Match the deeper target compartments to the donor's retained rear shoulder.
bpy.data.objects['rear_storage_static'].location.y+=.15
for o in kept:
 if o.name.startswith(('rear_lower_storage_return','rear_central_')):o.location.y+=.15
# Restore the machined R spoke faces independently of donor rubber and trim.
metal=bpy.data.materials.get('P03A_Machined_Aluminum')
if metal:
 q=metal.node_tree.nodes.get('Principled BSDF')
 for link in list(q.inputs['Base Color'].links):metal.node_tree.links.remove(link)
 q.inputs['Base Color'].default_value=(.40,.43,.47,1);q.inputs['Metallic'].default_value=.78;q.inputs['Roughness'].default_value=.28
for o in list(before):
 if o.name in bpy.data.objects and o.type=='MESH':parent(o,body)
for id,t in tires.items():
 wheel=next(w for w in json.loads((P/'public/assets/slingshot-contact-layout.json').read_text())['wheels'] if w['id']==id)
 pts=[t.matrix_world@v.co for v in t.data.vertices];lo=Vector([min(p[a] for p in pts) for a in range(3)]);hi=Vector([max(p[a] for p in pts) for a in range(3)]);center=(lo+hi)*.5;size=hi-lo
 scale=Matrix.Diagonal((wheel['width']/size.x,2*wheel['radius']/size.y,2*wheel['radius']/size.z,1))
 t.matrix_world=Matrix.Translation(cv(wheel['center']))@scale@Matrix.Translation(-center)@t.matrix_world
 parent(t,bpy.data.objects[id+'_spin'])

# Donor-matched front: preserve its painted hood/cheeks/splitter, remove vintage
# lamp pockets, add closed cheek returns with real cooling opening and new optics.
black=mat('MODEL01_fascia_graphite',(.018,.021,.025),.1,.36)
bezel=mat('MODEL01_lamp_housing',(.008,.012,.019),.35,.22)
lens=mat('MODEL01_Optical_Lens',(.38,.45,.53),.25,.2)
q=lens.node_tree.nodes['Principled BSDF'];q.inputs['Emission Color'].default_value=(.65,.8,1,1);q.inputs['Emission Strength'].default_value=.05
red=mat('MODEL01_Tail_Lens',(.3,.007,.012),.1,.26)
amber=mat('MODEL01_Amber',(.8,.16,.005),.05,.22)
accent=mat('Josh_Orange_Accent_fascia',(.94,.16,.015),.16,.3)
def poly(n,pts,m,depth=.024):return prism(n,pts,depth,2,m,body)
for s,side in [(-1,'left'),(1,'right')]:
 def pts(a):return [(s*x,y,z) for x,y,z in a]
 # Local fitted return behind the original fender wing, not a blanket underbody cap.
 poly('Josh_gap_filler_'+side,pts([(.46,.49,-1.925),(.51,.61,-1.893),(.84,.64,-1.771),(.87,.53,-1.719),(.84,.251,-1.868),(.62,.222,-1.977),(.50,.30,-1.988)]),black,.016)
 upper=[(.45,.587,-1.952),(.815,.696,-1.823),(.829,.625,-1.833),(.508,.539,-1.963)]
 poly('MODEL01_upper_lamp_housing_'+side,pts(upper),bezel,.028)
 optic=[(.475,.584,-1.970),(.800,.681,-1.843),(.805,.648,-1.853),(.514,.556,-1.980)]
 poly('lights_head__Optical_Lens_upper_'+side,pts(optic),lens,.012)
 lower=[(.559,.475,-1.963),(.596,.48,-1.951),(.774,.266,-1.939),(.739,.257,-1.957)]
 poly('MODEL01_lower_lamp_housing_'+side,pts([(.54,.496,-1.943),(.621,.504,-1.927),(.801,.249,-1.919),(.727,.234,-1.960)]),bezel,.018)
 poly('lights_head__Optical_Lens_lower_'+side,pts(lower),lens,.012)
 poly('MODEL01_amber_marker_'+side,pts([(.826,.687,-1.809),(.90,.706,-1.746),(.903,.661,-1.752),(.831,.645,-1.822)]),amber,.008)
 poly('Josh_splitter_return_'+side,pts([(.35,.217,-2.006),(.53,.16,-2.063),(.88,.170,-1.968),(.88,.192,-1.935),(.64,.214,-1.990)]),black,.014)
 poly('Josh_lower_accent_'+side,pts([(.55,.198,-2.059),(.82,.204,-1.987),(.77,.213,-1.987),(.57,.213,-2.046)]),accent,.004)
# Single rectangular LED center unit replaces old circular projector pair.
poly('MODEL01_center_housing',[(-.145,.64,-1.983),(.145,.64,-1.983),(.13,.522,-2.028),(-.13,.522,-2.028)],bezel,.035)
poly('lights_head__Optical_Lens_center',[(-.122,.612,-2.008),(.122,.612,-2.008),(.112,.548,-2.032),(-.112,.548,-2.032)],lens,.01)
for x in [-.081,-.027,.027,.081]:rod('center_LED_cell',(x,.554,-2.041),(x,.606,-2.018),.0025,bezel,body,6)
# Recessed grille is open hex rib geometry, with radiator depth behind it.
poly('MODEL01_radiator_recess',[(-.34,.25,-1.967),(.34,.25,-1.967),(.23,.48,-1.967),(-.23,.48,-1.967)],bezel,.014)
verts=[];faces=[]
for row in range(7):
 for col in range(-11,12):
  x=(col+(row%2)*.5)*.027;y=.275+row*.023
  if abs(x)>.34-(y-.25)*.45:continue
  for i in range(6):
   a=math.tau*i/6;b=math.tau*(i+1)/6
   px=x+math.cos(a)*.015;py=y+math.sin(a)*.015;qx=x+math.cos(b)*.015;qy=y+math.sin(b)*.015
   dx=qx-px;dy=qy-py;l=math.hypot(dx,dy);nx=-dy/l*.0012;ny=dx/l*.0012;n=len(verts)
   verts.extend([(px+nx,py+ny,-2.012),(qx+nx,qy+ny,-2.012),(qx-nx,qy-ny,-2.012),(px-nx,py-ny,-2.012)])
   faces.append((n,n+1,n+2,n+3))
H['mesh']('Josh_open_honeycomb',verts,faces,black,body)
# Newer rear LED ribbons fitted to donor shoulders, separate brake material binding.
for s,side in [(-1,'left'),(1,'right')]:
 rear_edge=[(s*.239,.954,1.381),(s*.278,.960,1.355),(s*.4,.949,1.247),(s*.469,.962,1.188),(s*.542,.918,1.098),(s*.598,.879,1.030),(s*.619,.840,.992)]
 path('MODEL01_rear_lamp_bed_'+side,[(x,y,z-.008)for x,y,z in rear_edge],.025,bezel,body)
 path('lights_brake__Tail_Lens_'+side,[(x,y,z+.024)for x,y,z in rear_edge],.013,red,body)
 # Wing clamps occupy the actual retained square hoop uprights (z=.802).
 anchor=group('mount_wing_'+side);anchor.location=cv((s*.50,1.14,.803));parent(anchor,body)
 anchor=group('mount_thermal_'+side);anchor.location=cv((s*.46,.83,1.35));parent(anchor,body)

# A stock side exhaust remains removable when Thermal is selected.
stock=group('stock_exhaust')
box('MODEL01_stock_muffler',(.42,.265,.28),(.23,.18,.46),black,stock,.04)
rod('MODEL01_stock_side_tip',(.53,.25,.36),(.68,.25,.42),.033,bezel,stock,20)

# Retained target front link geometry gets explicit endpoints for travel; stock
# damper/spring are removable independently of the wishbones for DDM installation.
for s,side in [(-1,'left'),(1,'right')]:
 sus=bpy.data.objects['suspension_front_'+side]
 for o in list(sus.children):
  if o.name.startswith('front_A_arm_'):
   w=o.matrix_world.copy();o.parent=body;o.matrix_world=w
   # Four authored rods are located by their world-space center, not suffix order.
   center=w@(sum((Vector(v) for v in o.bound_box),Vector())/8);z=.23 if center.z<.35 else .40
   front=.94 if -center.y<1.30 else 1.61
   o['model01FrontLink']={'side':side,'a':[s*.34,z,-front],'b':[s*.83,z+.035,-1.3335]}
  elif o.name.startswith(('front_damper_','front_spring_')):
   o['model01FrontLink']={'side':side,'a':[s*.48,.64,-1.31],'b':[s*.76,.28,-1.3335]}

# Export vehicle only, preserve individual donor meshes and semantic nodes.
for o in bpy.data.objects:
 if o.type=='MESH':
  for m in o.data.materials:
   if not m or not m.use_nodes:continue
   for n in m.node_tree.nodes:
    if n.type=='TEX_IMAGE' and n.image and not n.image.packed_file:
     name=Path(n.image.filepath.replace('\\','/')).name
     for folder in [D/'textures',P/'public/assets/textures/p03a1']:
      if (folder/name).exists():n.image.filepath=str(folder/name);break
bpy.context.view_layer.update();bpy.ops.file.pack_all()
root['model01']='Owner supplied 2015 foundation; localized 2024 R AutoDrive game adaptation'
bpy.ops.wm.save_as_mainfile(filepath=str(A/'slingshot-josh-adapted.blend'))
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(O/'slingshot-josh-adapted.glb'),export_format='GLB',use_selection=True,export_apply=True,export_extras=True,export_yup=True)
assert original=={p.relative_to(D).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in D.rglob('*') if p.is_file()}
(A/'build-notes.json').write_text(json.dumps({'donorFiles':original,'transplantedTargetObjects':transplants,'source':'slingshot-josh-adapted.blend','runtimeBytes':(O/'slingshot-josh-adapted.glb').stat().st_size,'sourceUnchanged':True,'basis':'Canonical game metres; root rotation only; local tires sized to unchanged contacts'},indent=2)+'\n')

# Separate derived accessory export: same catalog meshes, localized mount offsets.
bpy.ops.wm.open_mainfile(filepath=str(P/'assets/blender/p08b/signature-products.blend'))
bpy.data.objects['product_SM-26801'].location.y+=.04
bpy.data.objects['product_SM-7720'].location.y+=.14
bpy.data.objects['product_SM-28919'].location.y+=.15
# Match the retained rear cover attachment without an unsupported hanger in air.
for o in bpy.data.objects:
 if o.name.startswith(('Thermal_hanger_tab','Thermal_hanger_bolt')):o.location.y+=.15
H['batch_and_export'].__globals__.update({'A':A,'O':O})
H['batch_and_export']('josh-mounted-products',{'product_SM-26801','product_SM-7720','product_SM-28919'})
