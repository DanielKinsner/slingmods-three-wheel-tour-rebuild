"""2026 owner-supplied Slingshot, preserved geometry with explicit game bindings.
Run: blender -b --python scripts/build-model02.py
Original source files are read-only. Helper coordinates: game +Y up, -Z forward.
"""
import bpy, math, json, hashlib, runpy, shutil, tempfile, subprocess
from pathlib import Path
from mathutils import Vector, Matrix
P=Path(__file__).resolve().parents[1]
D=P/'assets/source/model02/2026 model';J=P/'assets/source/model01/Slingshot-Build/textures'
A=P/'assets/blender/model02';O=P/'public/assets/model02'
for p in [A,O]:p.mkdir(parents=True,exist_ok=True)
subprocess.run(['python',str(P/'scripts/build-model02-textures.py')],check=True)
H=runpy.run_path(str(P/'scripts/build-p08b-art.py'));cv=H['cv'];group=H['group'];mat=H['mat'];rod=H['rod'];box=H['box']
original={p.name:hashlib.sha256(p.read_bytes()).hexdigest()for p in D.iterdir()if p.is_file()}
bpy.ops.wm.read_factory_settings(use_empty=True)
# The ZIP flattens its images, although the MTL references textures/. Repair only
# the temporary import layout; never rewrite the supplied OBJ/MTL or images.
with tempfile.TemporaryDirectory(prefix='slingmods-model02-') as staging:
 staging=Path(staging);(staging/'textures').mkdir()
 for p in D.iterdir():
  if p.is_file():shutil.copy2(p,staging/('textures/'+p.name if p.suffix.lower()in ['.png','.jpg'] else p.name))
 bpy.ops.wm.obj_import(filepath=str(staging/'Slingshot_2026_R_Manual.obj'),forward_axis='NEGATIVE_Z',up_axis='Y')
 bpy.ops.file.pack_all()
conversion=Matrix.Translation((0,.217,-.025))@Matrix.Rotation(math.pi,4,'Z')
source=list(bpy.data.objects)
for o in source:o.matrix_world=conversion@o.matrix_world
bpy.context.view_layer.update()

def parent(o,p):
 bpy.context.view_layer.update()
 w=o.matrix_world.copy();o.parent=p;o.matrix_world=w
def game(p):return Vector((p.x,p.z,-p.y))
def points(o,faces=None):
 ids={i for f in faces for i in o.data.polygons[f].vertices}if faces is not None else range(len(o.data.vertices))
 return [game(o.matrix_world@o.data.vertices[i].co)for i in ids]
def bounds(o,faces=None):
 pts=points(o,faces);return (Vector([min(p[a]for p in pts)for a in range(3)]),Vector([max(p[a]for p in pts)for a in range(3)]))
def subset(o,name,faces):
 me=o.data;polys=[me.polygons[i]for i in faces];ids=sorted({v for f in polys for v in f.vertices});mapping={v:i for i,v in enumerate(ids)}
 out=bpy.data.meshes.new(name);out.from_pydata([me.vertices[i].co for i in ids],[],[[mapping[v]for v in f.vertices]for f in polys]);out.update()
 for m in me.materials:out.materials.append(m)
 loops=[i for f in polys for i in f.loop_indices]
 for layer in me.uv_layers:
  uv=out.uv_layers.new(name=layer.name)
  for j,i in enumerate(loops):uv.data[j].uv=layer.data[i].uv
 for a,b in zip(out.polygons,polys):a.material_index=b.material_index;a.use_smooth=b.use_smooth
 out.normals_split_custom_set([me.corner_normals[i].vector for i in loops])
 obj=bpy.data.objects.new(name,out);bpy.context.collection.objects.link(obj);obj.matrix_world=o.matrix_world.copy();return obj
def components(o):
 # Coincident seam vertices join for classification only. Source topology and
 # supplied corner normals remain untouched in each selected-face copy.
 keys={};ids=[]
 for v in o.data.vertices:ids.append(keys.setdefault(tuple(round(c,5)for c in v.co),len(keys)))
 roots=list(range(len(keys)))
 def root(i):
  while roots[i]!=i:roots[i]=roots[roots[i]];i=roots[i]
  return i
 for f in o.data.polygons:
  a=root(ids[f.vertices[0]])
  for i in f.vertices[1:]:roots[root(ids[i])]=a
 result={}
 for f in o.data.polygons:result.setdefault(root(ids[f.vertices[0]]),[]).append(f.index)
 return list(result.values())
def split(o,choose):
 bins={}
 for faces in components(o):
  lo,hi=bounds(o,faces);key=choose(lo,hi,faces)
  bins.setdefault(key,[]).extend(faces)
 result={k:subset(o,o.name+'_'+k,faces)for k,faces in bins.items()};bpy.data.objects.remove(o,do_unlink=True);return result
def node(name,p=(),at=None):
 o=group(name)
 if at is not None:o.matrix_world=Matrix.Translation(cv(at))
 if p:parent(o,p)
 return o
def normal_image(material,path,uv=None,strength=1):
 tree=material.node_tree;q=tree.nodes.get('Principled BSDF');texture=tree.nodes.new('ShaderNodeTexImage');texture.image=bpy.data.images.load(str(path),check_existing=True);texture.image.colorspace_settings.name='Non-Color'
 normal=tree.nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=strength;tree.links.new(texture.outputs['Color'],normal.inputs['Color']);tree.links.new(normal.outputs['Normal'],q.inputs['Normal'])
 if uv:
  channel=tree.nodes.new('ShaderNodeUVMap');channel.uv_map=uv;normal.uv_map=uv;tree.links.new(channel.outputs['UV'],texture.inputs['Vector'])
 return texture
def srgb(c):return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4

# Reconstruct physically meaningful maps from the supplied MTL. map_Bump here
# contains tangent normals, not a grayscale height map. Flat placeholder normals
# are deliberately skipped. Decal opacity uses its actual alpha/opacity texture.
definitions={};current=None
for line in (D/'Slingshot_2026_R_Manual.mtl').read_text().splitlines():
 if line.startswith('newmtl '):current=line[7:];definitions[current]={}
 elif current and line and not line.startswith('#'):
  key,_,value=line.partition(' ');definitions[current][key]=value.strip()
material_decisions=[]
for m in list(bpy.data.materials):
 original_name=next((k for k in definitions if k[:63]==m.name),None)
 if not original_name:continue
 data=definitions[original_name];name=original_name.split('_',2)[-1];tree=m.node_tree;tree.nodes.clear();q=tree.nodes.new('ShaderNodeBsdfPrincipled');out=tree.nodes.new('ShaderNodeOutputMaterial');tree.links.new(q.outputs['BSDF'],out.inputs['Surface'])
 color=list(map(float,data.get('Kd','.1 .1 .1').split()));q.inputs['Base Color'].default_value=(*[srgb(c)for c in color],1)
 metal=0;rough=.48
 if any(k in name for k in ['Metal','Chrome','Aluminum','Steel','Titanium']):metal=.75;rough=.33
 if 'Chrome' in name or name=='Mirror':metal=.92;rough=.17
 if 'Gloss' in name:rough=.24
 if any(k in name for k in ['Rubber','Leather']):metal=0;rough=.73
 if 'Tire' in name:q.inputs['Base Color'].default_value=(.017,.019,.022,1);rough=.81
 if 'BodyPlastic' in name:q.inputs['Base Color'].default_value=(.025,.028,.032,1);rough=.48
 if 'PC_A30' in name:
  m.name='Model02_Radar_Blue_'+name;metal=.20;rough=.27;q.inputs['Base Color'].default_value=(srgb(.09),srgb(.42),srgb(.70),1)
 elif 'PC_930' in name:
  m.name='Model02_Orange_Accent_'+name;metal=.18;rough=.28;q.inputs['Base Color'].default_value=(srgb(.94),srgb(.23),srgb(.04),1)
 q.inputs['Metallic'].default_value=metal;q.inputs['Roughness'].default_value=rough
 for key,socket in [('map_Kd','Base Color')]:
  if key in data:
   image=tree.nodes.new('ShaderNodeTexImage');file=D/Path(data[key]).name
   if name in ['HiddenWarmToneGray_R_Front','HiddenWarmToneGray_R_Rear']:
    part='front'if name.endswith('Front')else'rear';file=O/f'decal-{part}-blue-orange.png';m.name='Model02_AccentDecal_'+part
   image.image=bpy.data.images.load(str(file),check_existing=True);tree.links.new(image.outputs['Color'],q.inputs[socket])
   # These images already contain their target color; multiplying their decal
   # pixels by a dark imported Kd would obscure the original markings.
   if 'map_d' in data and data['map_d']==data[key]:tree.links.new(image.outputs['Alpha'],q.inputs['Alpha'])
 if 'map_d' in data and data.get('map_Kd')!=data['map_d']:
  alpha=tree.nodes.new('ShaderNodeTexImage');alpha.image=bpy.data.images.load(str(D/Path(data['map_d']).name),check_existing=True);tree.links.new(alpha.outputs['Color'],q.inputs['Alpha'])
 if 'map_Bump' in data:
  file=D/Path(data['map_Bump']).name
  if file.stat().st_size>500:normal_image(m,file,strength=.65)
 if 'GlassPoly_Tinted' in name:q.inputs['Base Color'].default_value=(.18,.24,.28,1);q.inputs['Alpha'].default_value=.27;q.inputs['Roughness'].default_value=.13;m.surface_render_method='DITHERED'
 m.use_backface_culling=False
 material_decisions.append({'source':original_name,'runtime':m.name})

root=node('vehicle_root');root['model02']='Owner supplied 2026 R configurator reconstruction; game presentation adaptation'
body=node('body_static',root);foundation=node('model02_2026_foundation',body)
root['preserveFrontCarriers']=True
for o in source:
 if o.name=='back_top_Top_TRIs_0':bpy.data.objects.remove(o,do_unlink=True)
 else:parent(o,foundation)

# OBJ/MTL loses the configurator's clear instrument lens transparency. Restore
# only this lens; keep the native high-resolution 2026 dial artwork behind it.
cluster=bpy.data.objects['Dash_7'];lens=cluster.data.materials[0].copy();cluster.data.materials[0]=lens
lens.name='Model02_instrument_clear_lens';q=lens.node_tree.nodes.get('Principled BSDF')
q.inputs['Base Color'].default_value=(.12,.15,.18,1);q.inputs['Alpha'].default_value=.045
q.inputs['Metallic'].default_value=0;q.inputs['Roughness'].default_value=.18;lens.surface_render_method='DITHERED'
# The configurator's instrument atlas uses top-origin UVs; these two OBJ decal
# surfaces need a vertical flip. Other source UV layouts are already correct.
for name in ['Dash_4','Dash_6']:
 for uv in bpy.data.objects[name].data.uv_layers.active.data:uv.uv.y=1-uv.uv.y
labels=bpy.data.objects['Dash_6'].data.materials[0]
for texture in labels.node_tree.nodes:
 if texture.type=='TEX_IMAGE':texture.image=bpy.data.images.load(str(D/'251589615_Dash_DiffMask.jpg'),check_existing=True)
# The source LCD is unpowered artwork. Actual speed/RPM/gear remain on the
# existing telemetry display; do not put a static fabricated reading here.
lcd=bpy.data.objects['Dash_3'];lcd.data.materials.clear();lcd.data.materials.append(mat('Model02_native_cluster_LCD',(.007,.012,.015),0,.32))

layout=json.loads((P/'public/assets/slingshot-contact-layout.json').read_text())
spins={};steers={};tire_notes=[]
tread=mat('Model02_Josh_tire_tread',(.017,.019,.022),0,.81)
normal_image(tread,J/'Slingshot_TireDisplacement.png','JoshTread',.78)
for wheel in layout['wheels']:
 id=wheel['id'];center=Vector(wheel['center']);side='left'if id=='front_left'else'right';rear=id=='rear'
 steer=node(id+'_steer',root,center)if not rear else None
 spin=node(id+'_spin',steer or root,center);spins[id]=spin
 if steer:steers[id]=steer
 tires=[o for o in list(bpy.data.objects)if o.type=='MESH' and o.name.startswith('SLR_Tire'if rear else'S_Tire')and(rear or (sum(bounds(o),Vector())[0]<0)==(side=='left'))]
 tire=tires[0];lo,hi=bounds(tire);old_center=(lo+hi)/2;old_size=hi-lo
 scale=Vector((wheel['width']/old_size.x,2*wheel['radius']/old_size.y,2*wheel['radius']/old_size.z))
 transform=Matrix.Translation(cv(center))@Matrix.Diagonal((scale.x,scale.z,scale.y,1))@Matrix.Translation(-cv(old_center))
 for o in list(bpy.data.objects):
  if o.type!='MESH':continue
  selected=o==tire or o.name.startswith(('R_Rear_Wheel','Rear_Sprocket'))if rear else o==tire or(o.name.startswith(('R_Front_Wheel','1913985_Brembo'))and(sum(bounds(o),Vector())[0]<0)==(side=='left'))
  if selected:o.matrix_world=transform@o.matrix_world;parent(o,spin)
  elif not rear and o.name.startswith('brakeCalipers')and(sum(bounds(o),Vector())[0]<0)==(side=='left'):o.matrix_world=transform@o.matrix_world;parent(o,steer)
 # Keep the newer tire mesh. A second cylindrical UV channel places Josh's
 # higher-resolution tread strip across the rubber tread; sidewalls sample the
 # neutral area, excluding the old tire branding and unused atlas islands.
 tire.data.materials.clear();tire.data.materials.append(tread);uv=tire.data.uv_layers.new(name='JoshTread')
 inverse=tire.matrix_world.inverted()
 for f in tire.data.polygons:
  vals=[]
  for li in f.loop_indices:
   p=game(tire.matrix_world@tire.data.vertices[tire.data.loops[li].vertex_index].co)-center
   u=(math.atan2(p.y,p.z)/math.tau)%1;across=p.x/(wheel['width']*.5)
   vals.append((li,u,.81+across*.085 if abs(across)<.82 else .5))
  if max(v[1]for v in vals)-min(v[1]for v in vals)>.5:vals=[(li,u+1 if u<.5 else u,v)for li,u,v in vals]
  for li,u,v in vals:uv.data[li].uv=(u,v)
 tire.name='Model02_'+id+'_tire';tire_notes.append({'id':id,'sourceCenter':list(old_center),'gameCenter':list(center),'localScale':list(scale),'texture':'Josh Slingshot_TireDisplacement.png, explicitly remapped tread only'})

# Preserve the actual 2026 steering wheel; its local pivot and tilt drive the
# existing hand-over-hand presenter. The driver shifts slightly into this seat.
steering=node('steering_control',body,(-.375,.824,-.147));steering.rotation_euler.x=-.34
for o in list(bpy.data.objects):
 if o.name.startswith('SteeringWheel_R'):parent(o,steering)
for o in list(bpy.data.objects):
 if o.name.startswith('SLR_Seat_'):
  o.name='signature_seat_'+('driver'if(sum(bounds(o),Vector())[0]<0)else'passenger')

# Native display opening receives the existing actual-telemetry screen.
bpy.data.objects.remove(bpy.data.objects['Ridecommand_1'],do_unlink=True)
display=node('display_mount',body,(0,.785,-.377));display.rotation_euler.x=-.085;display['width']=.155;display['height']=.096

# Optical bindings use only the supplied lens surfaces, with no duplicate lamps.
for o in list(bpy.data.objects):
 if o.type!='MESH' or not o.data.materials:continue
 n=o.name;m=o.data.materials[0];mn=m.name
 head=(n.startswith('US_Headlight')and'GlassHeadlight' in mn)or(n.startswith('Front_LED_AccentPanel')and'GlassPoly' in mn)or n=='Noselight_low_1'
 brake=n=='US_Rear_Lighting_1'or n=='lightbar_0'
 if head or brake:
  copy=m.copy();o.data.materials[0]=copy;copy.name='Model02_Optical_Lens'if head else'Model02_Tail_Lens';q=copy.node_tree.nodes.get('Principled BSDF')
  q.inputs['Alpha'].default_value=1;q.inputs['Metallic'].default_value=.15;q.inputs['Roughness'].default_value=.21
  if not q.inputs['Base Color'].links:q.inputs['Base Color'].default_value=(.48,.55,.62,1)if head else(.3,.007,.012,1)
  q.inputs['Emission Color'].default_value=(.6,.75,1,1)if head else(.8,.008,.003,1);q.inputs['Emission Strength'].default_value=.10
  o.name=('lights_head__Optical_Lens_'if head else'lights_brake__Tail_Lens_')+n

# Front wishbones, uprights and tie rods are separated using connected source
# components. Fixed bolts stay with the chassis. No whole-assembly wheel spin.
front_mounts={}
for side,s in [('left',-1),('right',1)]:
 front_mounts[side]={'upper':[s*.501,.554,-1.314],'lower':[s*.726,.248,-1.310]}
 node('suspension_front_'+side,body)
root['frontShockMounts']=front_mounts
def link(o,side,a,b,steered=False):o['frontLink']={'side':side,'a':a,'b':b,'steered':steered};parent(o,body)
for o in list(bpy.data.objects):
 if o.name.startswith('front_susp_'):
  index=o.name.split('_')[-1]
  def region(lo,hi,faces):
   c=(lo+hi)/2;side='left'if c.x<0 else'right'
   if index=='2':return side+('_upper'if c.y>.35 else'_lower')
   if min(abs(lo.x),abs(hi.x))>.68:return side+'_upright'
   if index=='1'and abs(c.x)>.46:return side+'_lower'
   return 'fixed'
  for role,ob in split(o,region).items():
   if role=='fixed':parent(ob,body);continue
   side=role.split('_')[0];s=-1 if side=='left'else 1
   if role.endswith('upright'):parent(ob,steers['front_'+side]);continue
   upper=role.endswith('upper');link(ob,side,[s*(.445 if upper else .39),.477 if upper else .231,-1.319],[s*(.710 if upper else .815),.45 if upper else .235,-1.325])
 elif o.name.startswith('s_shock_front'):
  for side,ob in split(o,lambda lo,hi,f:'left'if(lo.x+hi.x)<0 else'right').items():
   mount=front_mounts[side];ob['frontLink']={'side':side,'a':mount['upper'],'b':mount['lower']};parent(ob,bpy.data.objects['suspension_front_'+side])
 elif o.name=='front_steering_1':
  for side,ob in split(o,lambda lo,hi,f:('left'if hi.x<-.4 else'right'if lo.x>.4 else'fixed')).items():
   if side=='fixed':parent(ob,body)
   else:
    s=-1 if side=='left'else 1;link(ob,side,[s*.453,.295,-1.42],[s*.823,.295,-1.42],True)

# Source rear drive and brakes follow their own 2026 hardpoints. Physics and wheel
# contacts retain Sport v4; only these visible linkage matrices are adapted.
rig={'version':1,'asset':'/assets/model02/slingshot-2026.glb','basis':'game metres +X right +Y up -Z forward','wheelCenter':[0,.3455,1.3335],'armPivot':[.215,.35,.78],'armHub':[.215,.3455,1.3335],'shockUpper':[.215,.766,.982],'shockLower':[.215,.525,1.22],'groups':{'arm':'rear_arm_visual','belt':'belt_visual','axle':'rear_axle_visual','caliper':'rear_caliper_visual','shockBody':'shock_body_visual','shockPiston':'shock_piston_visual','shockSpring':'shock_spring_visual'},'storageEnvelopes':[],'authorEstimate':True,'provenance':'Measured visible 2026 source hardpoints adapted to unchanged game contacts; no physical suspension redesign'}
rear_groups={k:node(v,root)for k,v in rig['groups'].items()}
for name,key in [('rear_arm_pivot','armPivot'),('rear_hub','wheelCenter'),('shock_upper','shockUpper'),('shock_lower','shockLower')]:node(name,root,rig[key])
for o in list(bpy.data.objects):
 if o.name.startswith(('rear_susp_','Belt_Guard')):parent(o,rear_groups['arm'])
 elif o.name.startswith('rearCaliper'):parent(o,rear_groups['caliper'])
 elif o.name=='rearRotor_rearRotor_low_0':
  for role,ob in split(o,lambda lo,hi,f:'fixed'if hi.z<.9 else'rotor').items():parent(ob,body if role=='fixed'else spins['rear'])
 elif o.name=='rearRotor_rearRotor_low_1':parent(o,spins['rear'])
 elif o.name=='rearRotor_rearRotor_low_2':parent(o,rear_groups['belt'])
 elif o.name=='s_shock_rear_1':parent(o,rear_groups['shockSpring'])
 elif o.name=='s_shock_rear_0':
  for role,ob in split(o,lambda lo,hi,f:'body'if lo.y>.7 else'piston').items():
   # Lower cylinder follows its lower eye; top reservoir/eye remains rigid at
   # the upper mount. A separate overlapping shaft maintains visible closure.
   parent(ob,rear_groups['shockBody'if role=='body'else'shockPiston'])
chrome=mat('Model02_rear_shaft_metal',(.36,.39,.42),.8,.24)
upper=Vector(rig['shockUpper']);lower=Vector(rig['shockLower']);axis=lower-upper
rod('Model02_rear_telescoping_shaft',upper+axis*.06,upper+axis*.92,.009,chrome,rear_groups['shockBody'],16)
node('stock_exhaust',body)

# The actual compartment front panels hinge for the existing storage inspection.
back=bpy.data.objects['back_0'];doors={'left':[],'right':[]};keep=[]
for f in back.data.polygons:
 c=game(back.matrix_world@f.center);n=game(back.matrix_world.to_3x3()@f.normal)
 if abs(c.x)>.14 and .22<c.y<.90 and .43<c.z<.71 and n.z<-.45:doors['left'if c.x<0 else'right'].append(f.index)
 else:keep.append(f.index)
if any(doors.values()):
 cleaned=subset(back,'Model02_rear_storage_shell',keep);parent(cleaned,body)
 for side,faces in doors.items():
  door=node('signature_storage_door_'+side,body,((-.34 if side=='left'else .34),.23,.52))
  if faces:parent(subset(back,'Model02_storage_panel_'+side,faces),door)
 bpy.data.objects.remove(back,do_unlink=True)
else:
 for side in doors:node('signature_storage_door_'+side,body,((-.34 if side=='left'else .34),.23,.52))
# The same access panels also have an interior skin in the native cockpit tub.
# Hinge that skin with the corresponding door instead of leaving a second closed
# surface concealing the bags after the seat and outer panel move.
interior=bpy.data.objects['Interior_1'];inside={'left':[],'right':[]};keep=[]
for f in interior.data.polygons:
 c=game(interior.matrix_world@f.center);n=game(interior.matrix_world.to_3x3()@f.normal)
 if .14<abs(c.x)<.57 and .22<c.y<.90 and .45<c.z<.74 and abs(n.z)>.45:inside['left'if c.x<0 else'right'].append(f.index)
 else:keep.append(f.index)
if any(inside.values()):
 parent(subset(interior,'Model02_cockpit_tub',keep),body)
 for side,faces in inside.items():
  if faces:parent(subset(interior,'Model02_storage_inner_panel_'+side,faces),bpy.data.objects['signature_storage_door_'+side])
 bpy.data.objects.remove(interior,do_unlink=True)

# Preserve the manual source separately. The game uses its existing automatic
# controls, housed in the native console opening; only lever/clutch are removed.
for name in ['Manual_Shifter_Knob_Low_0','Manual_Shifter_Knob_Low_1','clutch-pedal_0']:
 if name in bpy.data.objects:bpy.data.objects.remove(bpy.data.objects[name],do_unlink=True)
panel=mat('Model02_AutoDrive_console',(.019,.022,.026),.1,.4);silver=mat('Model02_AutoDrive_keys',(.18,.20,.22),.5,.3)
box('Model02_AutoDrive_insert',(0,.581,-.119),(.105,.03,.13),panel,body,.012)
for x in [-.032,0,.032]:box('Model02_AutoDrive_key',(x,.602,-.12),(.026,.014,.06),silver,body,.005)
root['variant']='2026 R exterior; game AutoDrive console adaptation'

driver=json.loads((P/'public/assets/drivers/test-driver-attachment.json').read_text());offset=[-.015,.02,-.06];driver['rootOffset']=offset;driver['eye']=[a+b for a,b in zip(driver['eye'],offset)]
for arm in driver['arms'].values():
 arm['poleHint']=[a+b for a,b in zip(arm['poleHint'],offset)];arm['wheelGripLocal'][0]*=.175/.165
(O/'driver-attachment.json').write_text(json.dumps(driver,indent=2)+'\n');(O/'rear-rig.json').write_text(json.dumps(rig,indent=2)+'\n')

bpy.context.view_layer.update();bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(A/'slingshot-2026.blend'));bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(O/'slingshot-2026.glb'),export_format='GLB',use_selection=True,export_apply=True,export_extras=True,export_yup=True)
assert original=={p.name:hashlib.sha256(p.read_bytes()).hexdigest()for p in D.iterdir()if p.is_file()}
notes={'sourceFiles':original,'originalObjects':191,'originalTriangles':154524,'sourceUnchanged':True,'sourceIdentity':'Owner supplied 2026 R Manual configurator reconstruction, not CAD','bodyTransform':'Rigid 180 degree yaw, -0.217m longitudinal offset and -0.025m vertical offset; no body remesh or global scale','wheelAdaptation':tire_notes,'materials':material_decisions,'joshReuse':['Slingshot_TireDisplacement.png: remapped tread normal only, retaining 2026 tire geometry'],'retainedNativeTextures':'2026 decals, seat stitching, dashboard, steering controls, rear lamps, wheel caps and reflectors keep native UVs','rearRig':rig,'storageDoorTriangles':{k:len(v)for k,v in doors.items()},'gameControls':'Existing automatic driving preserved; local console insert replaces manual shifter and clutch'}
(A/'build-notes.json').write_text(json.dumps(notes,indent=2)+'\n')

# Existing retail models retain identity/options. This is a game mount adaptation;
# the UI must not silently claim their older fitment covers a 2026 vehicle.
bpy.ops.wm.open_mainfile(filepath=str(P/'assets/blender/p08b/signature-products.blend'))
bpy.data.objects['product_SM-26801'].location.y+=.04
bpy.data.objects['product_SM-28919'].location.y+=.25
bpy.data.objects['product_SM-7720'].location.y+=.22
bpy.context.view_layer.update()
for ob in bpy.data.objects['product_SM-28919'].children:
 pts=[game(ob.matrix_world@Vector(v))for v in ob.bound_box]
 center=sum(pts,Vector())/len(pts)
 ob.location.x+=.065 if center.x<0 else-.19
 ob.location.z+=.04
H['batch_and_export'].__globals__.update({'A':A,'O':O})
H['batch_and_export']('2026-mounted-products',{'product_SM-26801','product_SM-7720','product_SM-28919'})
print('MODEL02_DONE',len(original),'original files unchanged')
