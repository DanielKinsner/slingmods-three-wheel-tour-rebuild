"""Purchased source only. Run on source-normalized.blend; no external scripts/textures."""
import bpy,sys,pathlib,json,math,os,numpy as np
from mathutils import Vector,Matrix
sys.path.insert(0,str(pathlib.Path(__file__).parent));from components import components
from render import studio
args=sys.argv[sys.argv.index('--')+1:];out=pathlib.Path(args[0]);runtime=pathlib.Path(args[1]);out.mkdir(parents=True,exist_ok=True);runtime.mkdir(parents=True,exist_ok=True)
transform=json.loads((out/'transform.json').read_text());sources=[o for o in bpy.data.objects if o.type=='MESH']
def linear(x):return x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4
settings={
 'plastic':('Ryker_Plastic',(.13,.145,.15),.48,0,'interior'),
 'rubber':('Ryker_Rubber',(.095,.10,.105),.87,0,'rubber'),
 'brown_rubber':('Ryker_Seat',(.32,.25,.15),.83,0,'interior'),
 'orange':('Ryker_Paint',(.36,.48,.42),.3,.08,'paint'),
 '03___glossy_black':('Ryker_SatinBlack',(.075,.085,.09),.34,.25,'metal'),
 '03___glossy_gray':('Ryker_WheelMachining',(.50,.51,.51),.28,.82,'metal'),
 '01___metal':('Ryker_Aluminium',(.62,.65,.66),.3,.85,'metal'),
 'mirror_glass':('Ryker_MirrorGlass',(.72,.75,.77),.045,1,'mirror'),
 '01___chrome':('Ryker_Chrome',(.72,.74,.75),.18,.92,'metal'),
 'Steel':('Ryker_Steel',(.28,.30,.31),.48,.8,'metal'),
 'Steel2':('Ryker_SteelDark',(.2,.21,.22),.43,.8,'metal'),
 'Gray':('Ryker_Engine',(.18,.19,.2),.52,.65,'metal'),
 'Black':('Ryker_Recess',(.025,.03,.035),.62,0,'interior'),
 'chassis_color':('Ryker_RedTrim',(.68,.035,.025),.33,.18,'accent'),
 '02__blue':('Ryker_Display',(.035,.075,.09),.25,0,'display'),
 'glass_blue':('Ryker_Headlamp',(.74,.82,.84),.17,.15,'headlamp'),
 'orange_glass':('Ryker_AmberReflector',(.95,.30,.025),.26,0,'passive-reflector'),
 'red_glass':('Ryker_Taillamp',(.58,.025,.016),.22,0,'running-brake'),
 'brass':('Ryker_Brass',(.38,.31,.17),.38,.75,'metal'),
 'Brass':('Ryker_BrassBrake',(.38,.24,.13),.4,.7,'metal')}
materials={}
for key,(name,color,rough,metal,role) in settings.items():
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=tuple(linear(x) for x in color)+(1,);p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=m.diffuse_color;p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;m['vehicleRole']=role
 if role in ['headlamp','running-brake']:p.inputs['Emission Color'].default_value=m.diffuse_color;p.inputs['Emission Strength'].default_value=.12
 materials[key]=m
def empty(name,loc=(0,0,0),parent=None):
 o=bpy.data.objects.new(name,None);bpy.context.scene.collection.objects.link(o);o.location=loc
 if parent:o.parent=parent
 return o
root=empty('vehicle_root');root['materialBindingsVersion']=1;root['vehicleId']='canam_ryker_900';root['source']='Purchased markos3d Can-Am Ryker 900';root['physics']='Visual adaptation only; existing Slingshot contacts retained and mismatch reported.'
body=empty('body_static',parent=root);empty('ryker_foundation',parent=root)
centers={name:Vector(transform['wheel_centers_blender'][str(i)]) for i,name in [(1,'front_left'),(2,'front_right'),(3,'rear')]}
spins={};carriers={}
for name,c in centers.items():
 carrier=empty(name+'_steer' if name!='rear' else 'rear_carrier',c,root);carriers[name]=carrier;spins[name]=empty(name+'_spin',parent=carrier)
handle=empty('steering_control',(.005,.215,.954),root);handle['steerAxis']=[0,.968,-.251];handle['steerRatio']=1.0
ratios={1:.25,2:.25,3:.25,4:.65,5:.65,6:.65,7:.4,8:.4,9:.4,10:.32,11:.3,12:.18,13:.32,14:.8,15:.65,16:.10,17:.5,18:.24}
manifest={'source_triangles':2873168,'method':'Per-component collapse followed by nearest-surface transfer of authored split normals; baked editable meshes, no global smoothing, UV baking or compression. Untouched source is retained separately.','components':[],'wheels':{},'materials':[],'steering':{'node':'steering_control','axis':[0,.968,-.251],'ratio':1},'unit':'metres','basis':'+X right +Y up -Z forward','spec_url':'https://can-am.brp.com/content/dam/global/en/can-am-on-road/my21/documents/spec-sheets/ONRD-RYK-MY21-SPEC-Ryker-ENNA-LR.pdf'}
def make_part(source,name,face_ids,parent,ratio):
 sm=source.data;faces=[sm.polygons[i] for i in face_ids];ids=sorted({v for p in faces for v in p.vertices});remap={v:i for i,v in enumerate(ids)};verts=[tuple(sm.vertices[i].co) for i in ids];mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],[[remap[v] for v in p.vertices]for p in faces]);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.scene.collection.objects.link(o)
 for slot in source.material_slots:mesh.materials.append(materials[slot.name])
 for p,orig in zip(mesh.polygons,faces):p.material_index=orig.material_index;p.use_smooth=orig.use_smooth
 # Preserve authored split normals, including panel creases, before reduction.
 normals=[tuple(sm.corner_normals[j].vector) for p in faces for j in p.loop_indices]
 if normals:mesh.normals_split_custom_set(normals)
 o.parent=parent;bpy.context.view_layer.update();o.matrix_world=Matrix.Identity(4)
 before=sum(len(p.vertices)-2 for p in mesh.polygons)
 if ratio<1:
  mod=o.modifiers.new('Conservative component reduction','DECIMATE');mod.ratio=ratio;mod.use_collapse_triangulate=True;mod.delimit={'MATERIAL','NORMAL'}
  bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.modifier_apply(modifier=mod.name)
  # Reproject the artist's normals after collapsing edges; prevents a glossy panel from showing triangulation ripples.
  normal=o.modifiers.new('Source surface normals','DATA_TRANSFER');normal.object=source;normal.use_loop_data=True;normal.data_types_loops={'CUSTOM_NORMAL'};normal.loop_mapping='POLYINTERP_NEAREST'
  bpy.ops.object.modifier_apply(modifier=normal.name);o.select_set(False)
 o['sourceObject']=source.name;o['sourceTriangles']=before;o['reductionRatio']=ratio
 manifest['components'].append({'node':name,'source':source.name,'parent':parent.name,'source_triangles':before,'ratio':ratio})
 return o
for o in sources:
 n=int(o.name.split('___')[1]);groups={}
 if n in (7,8,9,10,15):
  labels,islands=components(o.data);co=np.array([v.co for v in o.data.vertices])
  for k,faces in islands.items():
   v=co[labels==k];lo,hi=v.min(axis=0),v.max(axis=0)
   if n in (7,8,9):
    wheel={7:'front_left',8:'front_right',9:'rear'}[n]
    # Rotor rings span almost the full brake diameter; hub is concentric. Caliper/pads/bolts occupy one sector.
    rotate=(hi[1]-lo[1]>.18) or (lo[1]<centers[wheel].y<hi[1] and lo[2]<centers[wheel].z<hi[2])
    name=wheel+('_rotor_hub' if rotate else '_caliper');parent=spins[wheel] if rotate else carriers[wheel]
   elif n==10:
    wheel='front_left' if (lo[0]+hi[0])<0 else 'front_right';name=wheel+'_fender';parent=carriers[wheel]
   else:
    fixed=k in (2167,12551);name='instrument_fixed' if fixed else 'handlebar_controls';parent=body if fixed else handle
   # Separate only the supplied optical faces; housings stay in the controls.
   if n==15:
    for face_id in faces:
     slot=o.material_slots[o.data.polygons[face_id].material_index].name
     optical='Mirrors_1' if slot=='01___chrome' and k in (255,10582) else 'instrument_screen' if slot=='02__blue' else name
     owner=body if optical=='instrument_screen' else parent
     groups.setdefault((optical,owner.name),[]).append(face_id)
   else:groups.setdefault((name,parent.name),[]).extend(faces)
 else:
  if n<=6:wheel={1:'front_left',2:'front_right',3:'rear',4:'front_left',5:'front_right',6:'rear'}[n];name=wheel+('_tire' if n<=3 else '_rim');parent=spins[wheel]
  else:name={11:'front_suspension',12:'grille',13:'body_panels',14:'headlights',16:'mechanical',17:'seat_body',18:'rear_mechanical'}[n];parent=body
  groups[(name,parent.name)]=list(range(len(o.data.polygons)))
 for (name,parent_name),faces in groups.items():
  part=make_part(o,name,faces,bpy.data.objects[parent_name],1 if name in ['Mirrors_1','instrument_screen'] else ratios[n])
  if name=='Mirrors_1':
   part['followSteering']=True;part['mirrorOpticalTilt']=.30;part.data.materials.clear();part.data.materials.append(materials['mirror_glass'])
   for poly in part.data.polygons:poly.material_index=0
  if name=='instrument_screen':
   # A fresh planar map for this flat screen only; never reuse collapsed source UVs.
   points=[v.co for v in part.data.vertices];up=Vector((0,math.sin(math.radians(15)),math.cos(math.radians(15))))
   x0=min(v.x for v in points);x1=max(v.x for v in points);y0=min(v.dot(up) for v in points);y1=max(v.dot(up) for v in points)
   uv=part.data.uv_layers.new(name='InstrumentProjection')
   for loop in part.data.loops:
    v=points[loop.vertex_index];uv.data[loop.index].uv=((v.x-x0)/(x1-x0),(v.dot(up)-y0)/(y1-y0))
   part['instrumentation']='Original SIM display; actual game speed, RPM and gear. Not OEM artwork.'
   manifest['instrument']={'node':name,'uv':'fresh planar projection','width':x1-x0,'height':y1-y0,'fixed':True}

 bpy.data.objects.remove(o,do_unlink=True)
for name,c in centers.items():
 radius=(.2848 if name!='rear' else .2851);manifest['wheels'][name]={'center':[c.x,c.z,-c.y],'radius':radius,'spin':name+'_spin','carrier':carriers[name].name,'spin_axis':[1,0,0],'fender_behavior':'Steers with knuckle; never wheel spin' if name!='rear' else 'Fixed to rear mechanical assembly; cosmetic suspension not animated'}
# Required presenter attachment points. No fabricated replacement mechanical geometry.
for name in ['suspension_front_left','suspension_front_right','shock_body_visual','shock_piston_visual','shock_spring_visual']:empty(name,parent=body)
for name,loc in {'rear_arm_pivot':(0,-.12,.3),'rear_hub':centers['rear'],'shock_upper':(0,-.13,.54),'shock_lower':(0,-.4,.34)}.items():empty(name,loc,root)
# Suppress the Slingshot-only tablet without changing the source instrument. Its material stays addressable.
display=empty('display_mount',parent=body);display['width']=.001;display['height']=.001;display.hide_render=False;display['rykerHidden']=True
for m in materials.values():manifest['materials'].append({'name':m.name,'role':m['vehicleRole']})
bpy.context.scene.unit_settings.system='METRIC';bpy.context.scene.unit_settings.scale_length=1
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Ryker-Game-Master.blend'))
bpy.ops.export_scene.gltf(filepath=str(runtime/'ryker-900.glb'),export_format='GLB',export_apply=True,export_extras=True,export_animations=False,export_cameras=False,export_lights=False,export_texcoords=True,export_yup=True)
dg=bpy.context.evaluated_depsgraph_get();total=0
for row in manifest['components']:
 e=bpy.data.objects[row['node']].evaluated_get(dg);m=e.to_mesh();m.calc_loop_triangles();row['triangles']=len(m.loop_triangles);total+=row['triangles'];e.to_mesh_clear()
manifest['triangles']=total;manifest['bytes']=(runtime/'ryker-900.glb').stat().st_size
allco=np.concatenate([np.array([o.matrix_world@v.co for v in o.data.vertices]) for o in bpy.data.objects if o.type=='MESH']);lo,hi=allco.min(axis=0),allco.max(axis=0);manifest['dimensions_xyz_runtime']=[float(hi[0]-lo[0]),float(hi[2]-lo[2]),float(hi[1]-lo[1])]
manifest['physics_mismatch']={'retained_wheelbase':2.667,'asset_wheelbase':1.709,'retained_track':1.755,'asset_track':abs(centers['front_right'].x-centers['front_left'].x),'retained_front_radius':.32985,'note':'No scaling/distortion or contact relocation. This is a visual-only vehicle selection on existing Sport v5 physics, not certified Ryker handling. Contact positions differ substantially.'}
(runtime/'manifest.json').write_text(json.dumps(manifest,indent=2));(out/'conversion.json').write_text(json.dumps(manifest,indent=2))
rear={'wheelCenter':manifest['wheels']['rear']['center'],'armPivot':[0,.3,.12],'armHub':manifest['wheels']['rear']['center'],'shockUpper':[0,.54,.13],'shockLower':[0,.34,.4],'groups':{},'storageEnvelopes':[]}
(runtime/'rear-rig.json').write_text(json.dumps(rear,indent=2))
print('RYKER_RESULT',total,manifest['bytes'],flush=True)
from attachments import driver_attachment
driver_attachment(runtime)
if os.environ.get('RYKER_SKIP_RENDERS')!='1':studio(out/'renders','game-pbr');studio(out/'renders','game-clay',True)
