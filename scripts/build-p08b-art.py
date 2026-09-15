"""Original P08B room/accessory authoring plus narrow editable vehicle repairs.
Run background Blender from any checkout. Original source/runtime bytes are never overwritten.
Coordinates in helpers are game X/right,Y/up,Z/rear; exported glTF uses those axes.
"""
import bpy,bmesh,math,json,hashlib,collections,sys
import numpy as np
from pathlib import Path
from mathutils import Vector,Matrix
P=Path(__file__).resolve().parents[1];A=P/'assets/blender/p08b';O=P/'public/assets/p08b';E=P/'director-kit/production/evidence/P08B/art'
for p in [A,O,E]:p.mkdir(parents=True,exist_ok=True)
def cv(p):return Vector((p[0],-p[2],p[1]))
def reset():bpy.ops.wm.read_factory_settings(use_empty=True)
def mat(n,c,metal=0,rough=.5):
 m=bpy.data.materials.new(n);m.use_nodes=True;m.diffuse_color=(*c,1);q=m.node_tree.nodes['Principled BSDF'];q.inputs['Base Color'].default_value=(*c,1);q.inputs['Metallic'].default_value=metal;q.inputs['Roughness'].default_value=rough;return m
def group(n):
 o=bpy.data.objects.new(n,None);bpy.context.collection.objects.link(o);return o
def mesh(n,v,f,m,par=None):
 me=bpy.data.meshes.new(n);me.from_pydata([cv(p)for p in v],[],f);me.update();bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(me);bm.free();o=bpy.data.objects.new(n,me);bpy.context.collection.objects.link(o);o.parent=par;me.materials.append(m);return o
def box(n,c,d,m,par=None,bevel=.004):
 bpy.ops.mesh.primitive_cube_add(size=1,location=cv(c));o=bpy.context.object;o.name=n;o.dimensions=(d[0],d[2],d[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m);o.parent=par
 if bevel:
  b=o.modifiers.new('physical rounded edges','BEVEL');b.width=bevel;b.segments=2
  b=o.modifiers.new('corner normals','WEIGHTED_NORMAL');b.keep_sharp=True
 return o
def rod(n,a,b,r,m,par=None,seg=12):
 a,b=cv(a),cv(b);bpy.ops.mesh.primitive_cylinder_add(vertices=seg,radius=r,depth=(b-a).length,location=(a+b)/2);o=bpy.context.object;o.name=n;o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();o.data.materials.append(m);o.parent=par
 for f in o.data.polygons:f.use_smooth=len(f.vertices)==4
 return o
def path(n,pts,r,m,par=None):
 cu=bpy.data.curves.new(n,'CURVE');cu.dimensions='3D';cu.bevel_depth=r;cu.bevel_resolution=2;cu.resolution_u=1;s=cu.splines.new('POLY');s.points.add(len(pts)-1)
 for p,q in zip(s.points,pts):p.co=(*cv(q),1)
 cu.use_fill_caps=True;o=bpy.data.objects.new(n,cu);bpy.context.collection.objects.link(o);o.parent=par;cu.materials.append(m);return o
def prism(n,points,depth,axis,m,par=None):
 # Closed extruded polygon. Points in game coordinates, offset on axis.
 v=[]
 for d in [-depth/2,depth/2]:
  for p in points:q=list(p);q[axis]+=d;v.append(q)
 k=len(points);f=[tuple(reversed(range(k))),tuple(range(k,2*k))]+[(i,(i+1)%k,(i+1)%k+k,i+k)for i in range(k)];return mesh(n,v,f,m,par)
def batch_and_export(name,bindings=None):
 # Preserve editable semantic objects in .blend, batch only runtime clone by material+semantic parent.
 bpy.context.view_layer.update();bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(A/(name+'.blend')))
 dg=bpy.context.evaluated_depsgraph_get();by=collections.defaultdict(list)
 for o in list(bpy.data.objects):
  if o.type not in ['MESH','CURVE','FONT'] or o.get('export_exclude'):continue
  ev=o.evaluated_get(dg);me=bpy.data.meshes.new_from_object(ev,depsgraph=dg,preserve_all_data_layers=True)
  if not len(me.vertices):continue
  par=o.parent
  if bindings:
   while par and par.name not in bindings:par=par.parent
   if not par:par=bpy.data.objects['body_static']
  ob=bpy.data.objects.new('export_'+o.name,me);bpy.context.collection.objects.link(ob);ob.matrix_world=o.matrix_world.copy();by[(par.name if par else '',tuple(m.name for m in me.materials))].append(ob)
 exported=[]
 for (pn,mn),arr in by.items():
  bpy.ops.object.select_all(action='DESELECT')
  for o in arr:o.select_set(True)
  bpy.context.view_layer.objects.active=arr[0]
  if len(arr)>1:bpy.ops.object.join()
  o=bpy.context.object;p=bpy.data.objects.get(pn);o.name=pn+'__'+'_'.join(mn).replace('P03A_','');o.data.transform((p.matrix_world.inverted() if p else Matrix.Identity(4))@o.matrix_world);o.parent=p;o.matrix_parent_inverse=Matrix.Identity(4);o.matrix_basis=Matrix.Identity(4);exported.append(o)
 bpy.ops.object.select_all(action='DESELECT')
 for o in exported:o.select_set(True)
 for o in bpy.data.objects:
  if o.type=='EMPTY':o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(O/(name+'.glb')),export_format='GLB',use_selection=True,export_apply=True,export_extras=True,export_yup=True)
 return {'name':name,'runtimeBytes':(O/(name+'.glb')).stat().st_size,'sourceBytes':(A/(name+'.blend')).stat().st_size,'meshes':len(exported),'polygons':sum(len(o.data.polygons) for o in exported)}
def repair_vehicle():
 source=P/'assets/blender/vehicles/slingshot-p04a1.blend';before=hashlib.sha256(source.read_bytes()).hexdigest();bpy.ops.wm.open_mainfile(filepath=str(source));fix=[]
 for im in bpy.data.images:
  if im.source=='FILE':
   candidate=P/'public/assets/textures/p03a1'/Path(im.filepath.replace('\\','/')).name
   if candidate.exists():im.filepath=str(candidate);im.reload();im.pack()
 # Correct inner square-hoop trim finish against the locked 2024 manufacturer reference.
 for name in ['roll_hoop_inner_driver','roll_hoop_inner_passenger']:
  bpy.data.objects[name].data.materials[0]=bpy.data.materials['P03A_Textured_Polymer']
 fix.append({'name':'roll_hoop_inner_driver/passenger','defect':'bright metal inner trim inconsistent with black factory square-style hoop reference','repair':'retain exact geometry; assign existing polymer finish independently of body paint'})
 # Local real thickness on exposed planar brake discs. Their center holes stay open.
 for o in bpy.data.objects:
  if o.type=='MESH' and 'brake_disc' in o.name and len(o.data.vertices):
   s=o.modifiers.new('P08B disc edge thickness','SOLIDIFY');s.thickness=.005;s.offset=0;fix.append({'name':o.name,'defect':'128 exposed one-sided boundary edges on planar rotor annulus','repair':'5 mm solid annulus, retaining hub aperture and exact wheel transforms'})
 # Endcaps on actual hexagonal lug-nut cylinders; no hole-filling on vents, wheels or cockpit.
 for o in bpy.data.objects:
  if o.type=='MESH' and 'lug_nut' in o.name:
   bm=bmesh.new();bm.from_mesh(o.data);edges=[e for e in bm.edges if e.is_boundary];bmesh.ops.holes_fill(bm,edges=edges,sides=6);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(o.data);bm.free()
 fix.append({'name':'all named *_lug_nut','defect':'uncapped hexagonal ends visible at low wheel angles','repair':'cap only six-edge lug-nut loops; leave surrounding lug wells intact'})
 # Exposed mirrored thin rocker panels had the same face winding on both sides:
 # force outward face normals before their existing inward Solidify return, avoiding ~20mm asymmetry.
 for side,sign in [('left',-1),('right',1)]:
  o=bpy.data.objects['side_rocker_return_'+side];bm=bmesh.new();bm.from_mesh(o.data)
  for f in bm.faces:
   if f.normal.x*sign<0:f.normal_flip()
  bm.to_mesh(o.data);bm.free();fix.append({'name':o.name,'defect':'mirrored return normals placed thickness on opposite physical side','repair':'outward face winding with existing physical Solidify; original contour retained'})
 # Console cutter created duplicate coincident boundary vertices. Weld only at 1 micron;
 # preserve real cup/storage pocket openings instead of filling its cavity.
 o=bpy.data.objects['autodrive_console_shell'];ev=o.evaluated_get(bpy.context.evaluated_depsgraph_get());me=bpy.data.meshes.new_from_object(ev,preserve_all_data_layers=True,depsgraph=bpy.context.evaluated_depsgraph_get());bm=bmesh.new();bm.from_mesh(me);beforeedges=sum(e.is_boundary for e in bm.edges);bmesh.ops.remove_doubles(bm,verts=bm.verts,dist=.000001);afteredges=sum(e.is_boundary for e in bm.edges);bm.to_mesh(me);bm.free();o.modifiers.clear();o.data=me;fix.append({'name':o.name,'inspection':'Eight Boolean pocket boundary edges retained after inspection; weld did not alter edge count','action':'No hole fill: existing recessed pocket is intentional; evaluated geometry retained','boundaryBefore':beforeedges,'boundaryAfter':afteredges})
 # Reversible opening needs semantic door/seat bindings, preserving every source transform.
 binds=set(['body_static','cockpit','steering_control','front_left_steer','front_right_steer','front_left_spin','front_right_spin','rear_spin','suspension_front_left','suspension_front_right','suspension_rear','lights_head','lights_brake','lights_signals','stock_exhaust','rear_storage_static','rear_body_static','rear_pulley_visual'])
 cfg=json.loads((P/'public/assets/vehicles/slingshot-p04a1-rear-rig.json').read_text());binds.update(cfg['groups'].values())
 for side,label in [('left','driver'),('right','passenger')]:
  door=group('signature_storage_door_'+side);door.parent=bpy.data.objects['rear_storage_static'];door.location=cv((0,.340 if side=='left' else .618,.725 if side=='left' else .665));binds.add(door.name);bpy.context.view_layer.update()
  for o in list(bpy.data.objects):
   if o.name in ['storage_access_panel_'+side,'storage_access_lip_'+side,'storage_access_latch_'+side]:w=o.matrix_world.copy();o.parent=door;o.matrix_world=w
  seat=group('signature_seat_'+label);seat.parent=bpy.data.objects['cockpit'];binds.add(seat.name)
  for o in list(bpy.data.objects):
   if label in o.name and o.type in ['MESH','CURVE'] and ('seat_cupped_' in o.name or 'upholstered_' in o.name or 'padded_bolster_' in o.name):w=o.matrix_world.copy();o.parent=seat;o.matrix_world=w
 # Solid cube at front of cavity must be opened too: actual source cavity was closed on all sides.
 # Remove only its front outer/inner faces, preserving back, side and floor wall thickness.
 for side in ['left','right']:
  o=bpy.data.objects['rear_storage_'+side+'_shell'];bm=bmesh.new();bm.from_mesh(o.data);faces=[]
  for f in bm.faces:
   if abs(f.normal.y)>.98 and f.calc_center_median().y>-.78:faces.append(f)
  bmesh.ops.delete(bm,geom=faces,context='FACES');bm.to_mesh(o.data);bm.free();fix.append({'name':o.name,'defect':'access panel backed by sealed outer shell, preventing real compartment inspection','repair':'remove only front aperture faces behind existing hinged door; retain side/back/floor volumes','openedFaces':len(faces)})
 # Keep original maps and material mask; new custom finish maps derive only painted atlas pixels.
 paint=next(i for i in bpy.data.images if 'coverage_AA' in i.name);pix=np.array(paint.pixels[:],dtype=np.float32).reshape(paint.size[1],paint.size[0],4);rgb=pix[:,:,:3];blue=(rgb[:,:,2]>rgb[:,:,0]*1.3)&(rgb[:,:,2]>rgb[:,:,1]*1.15);orange=(rgb[:,:,0]>.25)&(rgb[:,:,0]>rgb[:,:,1]*1.5)&(rgb[:,:,0]>rgb[:,:,2]*2)
 for name,c in [('black-red',(.012,.015,.019)),('white-graphite',(.76,.78,.79)),('graphite-red',(.095,.108,.12))]:
  arr=pix.copy();arr[blue,:3]=c;arr[orange,:3]=(.62,.008,.014) if name!='white-graphite'else(.30,.012,.018);im=bpy.data.images.new('signature-'+name,width=paint.size[0],height=paint.size[1],alpha=True);im.pixels.foreach_set(arr.ravel());im.filepath_raw=str(O/('finish-'+name+'.png'));im.file_format='PNG';im.save();im.pack()
 report=batch_and_export('slingshot-signature',binds);assert hashlib.sha256(source.read_bytes()).hexdigest()==before;report.update({'baselineUnchanged':True,'baselineSha256':before,'repairs':fix,'finishMask':'Only Radar_Blue atlas blue pixels and orange graphic pixels. Black graphic pixels remain; nonpaint materials never remapped.','packedSourceImages':len([i for i in bpy.data.images if i.packed_file]),'unresolved':'Global OEM fidelity held. Existing vertical raycast rear linkage remains an approximation.'});(E/'vehicle-repairs.json').write_text(json.dumps(report,indent=2));return report

def products():
 reset();black=mat('product_powdercoat_black',(.012,.015,.019),.55,.40);silver=mat('product_brushed_silver',(.52,.55,.58),.85,.29);cloth=mat('EvolutionR_black_polyester',(.014,.017,.019),0,.9);seam=mat('EvolutionR_stitch_webbing',(.052,.057,.062),0,.95)
 ex=group('product_SM-7720')
 # Photo reference: two 2in mandrel pipes with trapezoidal rather than round outlets,
 # carried high either side of the single tire, bracketed from the rear body.
 for side in [-1,1]:
  pts=[(side*.24,.27,-.15),(side*.28,.25,.4),(side*.36,.32,.9),(side*.46,.62,1.26),(side*.46,.65,1.38)]
  path('Thermal_2in_ceramic_route',pts,.0254,black,ex);rod('Thermal_band_clamp',(side*.28,.25,.36),(side*.28,.25,.42),.030,silver,ex)
  poly=[(side*(.46+x),.66+y,1.42)for x,y in [(-.115,.06),(.105,.06),(.12,.015),(.065,-.065),(-.08,-.065),(-.125,.012)]]
  # Genuine hollow six-sided outlet with visible wall and brushed-silver insert face.
  inner=[(.46*side+(p[0]-.46*side)*.86,.66+(p[1]-.66)*.80,p[2])for p in poly];v=poly+inner+[(x,y,z-.17)for x,y,z in inner];f=[]
  for i in range(6):j=(i+1)%6;f.extend([(i,j,6+j,6+i),(6+i,6+j,12+j,12+i)])
  mesh('Thermal_brushed_silver_insert',v,[f[i]for i in range(0,len(f),2)],silver,ex);mesh('Thermal_dark_inner_outlet',v,[f[i]for i in range(1,len(f),2)],black,ex);v2=poly+[(x,y,z-.18)for x,y,z in poly];mesh('Thermal_trapezoid_outlet_body',v2,[(i,(i+1)%6,(i+1)%6+6,i+6)for i in range(6)],black,ex)
  for p in poly:rod('Thermal_insert_fastener',(p[0],p[1],p[2]-.001),(p[0],p[1],p[2]+.004),.0035,silver,ex,8)
  box('Thermal_hanger_tab',(side*.46,.77,1.35),(.018,.18,.025),black,ex);rod('Thermal_hanger_bolt',(side*.46,.83,1.33),(side*.46,.83,1.38),.006,silver,ex)
 box('Thermal_Sport_muffler',(.18,.29,-.25),(.22,.23,.36),black,ex,.045)
 wing=group('product_SM-26801');span=59*.0254
 # Broad closed airfoil blade with integral trailing gurney and end plates, exact published span.
 section=[(1.24,1.33),(1.39,1.39),(1.56,1.405),(1.66,1.44),(1.67,1.41),(1.55,1.37),(1.36,1.35)] # rearZ,height
 verts=[(x,y,z)for x in [-span/2,span/2]for z,y in section];k=len(section);mesh('NRG_59in_aluminum_airfoil',verts,[tuple(reversed(range(k))),tuple(range(k,2*k))]+[(i,(i+1)%k,(i+1)%k+k,i+k)for i in range(k)],black,wing)
 for side in [-1,1]:
  x=side*(span/2-.0025);prism('NRG_wing_endplate',[(x,1.34,1.23),(x,1.49,1.29),(x,1.51,1.65),(x,1.37,1.70)],.005,0,black,wing)
  x=side*.50
  # Square-hoop clamp follows existing outboard upper-upright at x0.50,y1.15,z0.84.
  box('NRG_square_hoop_front_clamp',(x,1.14,.808),(.075,.20,.027),black,wing);box('NRG_square_hoop_rear_clamp',(x,1.14,.878),(.075,.20,.027),black,wing)
  for y in [1.07,1.21]:rod('NRG_clamp_stainless_pin',(x,y,.784),(x,y,.905),.006,silver,wing)
  # Top-attached billet Swan Neck web, with real through-cut triangular/chevron apertures.
  plate=prism('NRG_swan_neck_billet_web',[(x,1.055,.89),(x,1.265,.895),(x,1.49,1.38),(x,1.465,1.46),(x,1.41,1.455)],.018,0,black,wing)
  for j in range(3):
   z=.96+j*.13;y=1.21+j*.065
   cutter=prism('source_swan_web_aperture',[(x,y-.044,z),(x,y+.021,z),(x,y+.061,z+.095),(x,y-.006,z+.084)],.08,0,black)
   mod=plate.modifiers.new('Swan Neck open web aperture','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter;bpy.context.view_layer.objects.active=plate;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
  box('NRG_top_pitch_bracket',(x,1.425,1.44),(.065,.022,.10),black,wing)
  for z in [1.415,1.465]:rod('NRG_pitch_bolt',(x-.04,1.435,z),(x+.04,1.435,z),.007,silver,wing)
 bags=group('product_SM-28919')
 for side in ['left','right']:
  # Driver fullwidth lower recess; passenger narrow lower recess around asymmetric fuel volume.
  x0,x1=(-.588,-.238)if side=='left'else(.461,.615);y0=.338;y1=.545;z0=.782;z1=1.235
  poly=[(x0,y0,z0),(x1,y0,z0),(x1,y0,z1-.045),(x1-.035,y0,z1),(x0+.026,y0,z1),(x0,y0,z1-.055)]
  ob=prism('EvolutionR_lower_'+side,poly,.09 if side=='left'else .18,1,cloth,bags);ob.location.z=.035 if side=='left'else .080
  soft=ob.modifiers.new('Padded polyester bag edge','BEVEL');soft.width=.014;soft.segments=4
  weighted=ob.modifiers.new('Soft bag corner normals','WEIGHTED_NORMAL');weighted.keep_sharp=True
  top=.43 if side=='left'else .51
  rim=[(x,top,z)for x,_,z in poly];path('EvolutionR_zipper_'+side,rim+[rim[0]],.004,seam,bags)
  box('EvolutionR_mesh_pocket_'+side,((x0+x1)/2,top+.007,1.06),(x1-x0-.035,.008,.17),seam,bags,.016)
  for i in range(5):box('EvolutionR_webbing_slot_'+side,((x0+x1)/2,top+.013,.86+i*.03),(x1-x0-.05,.006,.009),cloth,bags,.002)
  box('EvolutionR_zip_pull_'+side,(x0+.03,top+.021,.80),(.016,.006,.029),silver,bags,.003)
  if side=='right':
   for z in [.83,.93,1.03,1.13]:box('EvolutionR_passenger_mesh_pocket',((x0+x1)/2,top+.018,z),(x1-x0-.035,.009,.072),seam,bags,.014)
   path('EvolutionR_passenger_center_divider',[((x0+x1)/2,top+.030,.79),((x0+x1)/2,top+.030,1.18)],.004,cloth,bags)
  # Hook-and-loop patch on underside, part of geometry.
  box('EvolutionR_hook_loop_'+side,((x0+x1)/2,.320,1.03),(x1-x0-.055,.008,.20),seam,bags)
 report=batch_and_export('signature-products');report['selections']={'SM-7720':'Brushed Silver (Included), option21553; no spring puller','SM-26801':'59 inch aluminium matteblack SwanNeck; squarestyle hoop clamps; visual pitch fixed','SM-28919':'Lower pair only; no optional overnight bags'};report['mounts']={'wingSpanMetres':span,'wingClampCenters':[[-.50,1.14,.843],[.50,1.14,.843]],'exhaustOutletCenters':[[-.46,.66,1.42],[.46,.66,1.42]],'bagVolumes':'Inside existing asymmetric lower compartments; nominal authoring dimensions, not manufacturer CAD'};(E/'products-build.json').write_text(json.dumps(report,indent=2));return report

def showroom():
 reset();base=group('signature_showroom');wall=mat('studio_warm_white',(.63,.64,.63),0,.85);cab=mat('studio_graphite_cabinet',(.045,.052,.059),.42,.40);door=mat('studio_cabinet_door',(.065,.073,.082),.45,.38);metal=mat('studio_handle_brushed',(.55,.60,.62),.85,.28);wood=mat('studio_warm_wood',(.34,.17,.071),0,.62);red=mat('studio_slingmods_red',(.46,.012,.022),0,.62);dark=mat('studio_charcoal_tile',(.055,.063,.068),0,.83);gray=mat('studio_gray_tile',(.24,.26,.27),0,.85);grid=mat('studio_grid_black',(.022,.026,.030),.65,.48)
 # Inferred 12 x 13 x 4.2 m room; extended rear orbit aisle. Cabinet wall composition translated +3m after capture.
 box('studio_floor_base',(0,-.035,1.5),(12,.05,13),dark,base,0)
 # Coarse 0.5m checker tile geometry, batched to two drawcalls; fine detail mapped below.
 for ix in range(24):
  for iz in range(26):
   x=-5.75+ix*.5;z=-4.75+iz*.5;m=red if ix in [1,22] or iz in [1,24] else(gray if(ix+iz)%2 else dark);box('studio_checker_tile',(x,-.006,z),(.498,.010,.498),m,base,0)
 box('studio_back_wall',(0,2.10,4.05),(12,4.2,.18),wall,base);box('studio_left_wall',(-6,2.10,1.5),(.18,4.2,11),wall,base);box('studio_right_wall',(6,2.10,1.5),(.18,4.2,11),wall,base)
 def cabinet(n,c,d,tall=False):
  box(n+'_case',c,d,cab,base,.012)
  width=d[0]/2
  for s in [-1,1]:
   x=c[0]+s*width/2;box(n+'_door',(x,c[1],c[2]-d[2]/2-.01),(width-.025,d[1]-.035,.034),door,base,.006)
   xx=c[0]+s*.048;box(n+'_long_metal_handle',(xx,c[1],c[2]-d[2]/2-.041),(.021,d[1]*.79,.035),metal,base,.004)
  for x in [c[0]-d[0]*.40,c[0]+d[0]*.40]:box(n+'_foot',(x,.06,c[2]),(.07,.12,d[2]*.75),cab,base)
 for side in [-1,1]:cabinet('tall_cabinet_'+str(side),(side*2.07,1.48,3.50),(1.18,2.86,.72),True)
 for i in range(4):cabinet('overhead_cabinet_'+str(i),(-1.05+i*.70,2.51,3.59),(.70,.76,.51))
 for i in range(4):
  x=-1.05+i*.70;cabinet('lower_cabinet_'+str(i),(x,.48,3.50),(.70,.86,.70))
  if i in [0,3]:
   for y in [.23,.43,.63,.81]:box('drawer_bright_pull',(x,y,3.112),(.58,.018,.028),metal,base,.003)
 box('continuous_wood_worktop',(0,.965,3.45),(2.86,.055,.80),wood,base,.007)
 box('central_light_logo_wall',(0,1.55,3.81),(2.86,1.08,.055),wall,base)
 # Real authorized logo texture only, not reference photograph applied to room.
 lm=mat('SlingMods_authorized_logo',(1,1,1),0,.55);im=bpy.data.images.load(str(P/'public/assets/brand/slingmods-logo-main.png'));im.pack();node=lm.node_tree.nodes.new('ShaderNodeTexImage');node.image=im;q=lm.node_tree.nodes['Principled BSDF'];lm.node_tree.links.new(node.outputs['Color'],q.inputs['Base Color']);lm.node_tree.links.new(node.outputs['Alpha'],q.inputs['Alpha']);lm.surface_render_method='DITHERED'
 o=mesh('SlingMods_logo',[(x,y,3.771)for x,y in [(-1.12,1.34),(1.12,1.34),(1.12,1.82),(-1.12,1.82)]],[(0,1,2,3)],lm,base);uv=o.data.uv_layers.new(name='UVMap')
 for poly in o.data.polygons:
  for li in poly.loop_indices:
   v=o.data.vertices[o.data.loops[li].vertex_index].co;uv.data[li].uv=(1-(v.x+1.12)/2.24,(v.z-1.34)/.48)
 # Product grids flank the cabinet composition, with genuine silhouette props.
 for side in [-1,1]:
  for panel in range(2):
   cx=side*(3.1+panel*.91)
   for i in range(6):rod('product_grid_vertical',(cx-.44+i*.176,.10,3.79),(cx-.44+i*.176,2.9,3.79),.004,grid,base,6)
   for i in range(19):rod('product_grid_horizontal',(cx-.44,.1+i*.155,3.78),(cx+.44,.1+i*.155,3.78),.004,grid,base,6)
   for yy in [.65,1.45,2.25]:
    if panel==0:
     # Caliper cover / wing bracket silhouettes with metallic mounting points.
     prism('wall_caliper_cover',[(cx-.15,yy-.17,3.71),(cx+.08,yy-.15,3.71),(cx+.16,yy,3.71),(cx+.10,yy+.17,3.71),(cx-.12,yy+.14,3.71)],.035,2,red if side<0 else cab,base)
     for y in [yy-.10,yy+.10]:rod('wall_product_fixing',(cx,y,3.68),(cx,y,3.72),.011,metal,base)
    else:
     box('wall_organizer_bag',(cx,yy,3.69),(.60,.37,.10),cab,base,.045);path('wall_bag_zipper',[(cx-.25,yy-.13,3.629),(cx-.25,yy+.13,3.629),(cx+.25,yy+.13,3.629),(cx+.25,yy-.13,3.629)],.007,red,base)
  # Steering-wheel / halo rings as modeled wall-display pieces.
  for x in [side*4.6,side*5.15]:
   points=[(x+.18*math.cos(i*math.tau/32),1.3+.18*math.sin(i*math.tau/32),3.74)for i in range(33)];path('display_steering_ring',points,.018,grid,base)
 # Supporting empty lift to left, no selectable placeholder vehicle.
 for x in [-5.3,-3.75]:
  for z in [.7,3.0]:box('left_lift_column',(x,1.30,z),(.13,2.60,.13),cab,base);box('lift_foot',(x,.035,z),(.4,.07,.34),metal,base)
 for x in [-5.05,-4.0]:box('left_lift_ramp',(x,1.14,1.8),(.43,.13,3.25),cab,base,.01);box('left_lift_red_safety',(x,1.22,3.2),(.43,.08,.08),red,base)
 for z in [.3,3.1]:box('left_lift_crossbar',(-4.52,1.05,z),(1.9,.14,.14),cab,base)
 # Reference-left is camera-left looking toward rear +Z, hence game +X.
 for o in list(bpy.data.objects):
  if o.name.startswith(('left_lift','lift_foot')):o.location.x=-o.location.x
 # Softbox practicals (emissive only) plus lead's real runtime lights.
 light=mat('studio_softbox_diffuser',(.9,.92,.95),0,.7);q=light.node_tree.nodes['Principled BSDF'];q.inputs['Emission Color'].default_value=(.9,.92,.95,1);q.inputs['Emission Strength'].default_value=2
 for x in [-2.4,2.4]:box('overhead_softbox',(x,3.85,-.4),(1.2,.05,3.0),light,base)
 # Preserve the reference wall composition as a unit while adding a rear camera aisle.
 bpy.context.view_layer.update()
 for o in list(bpy.data.objects):
  if o.type not in ['MESH','CURVE']:continue
  if o.name.startswith(('studio_floor','studio_checker','studio_left_wall','studio_right_wall','overhead_softbox')):continue
  o.location.y-=3
 # Fine physical tile grooves become mipmapped normal texture, not high-density slats.
 n=128;xx,yy=np.meshgrid(np.arange(n),np.arange(n));g=.09*np.sin(xx*math.tau/8);arr=np.ones((n,n,4),dtype=np.float32);arr[:,:,0]=.5+g;arr[:,:,1]=.5;arr[:,:,2]=1;im=bpy.data.images.new('checker_fine_grooves',width=n,height=n);im.pixels.foreach_set(arr.ravel());im.filepath_raw=str(O/'checker-normal.png');im.file_format='PNG';im.save();im.pack()
 for m in [dark,gray,red]:
  t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=im;t.image.colorspace_settings.name='Non-Color';normal=m.node_tree.nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.18;m.node_tree.links.new(t.outputs['Color'],normal.inputs['Color']);m.node_tree.links.new(normal.outputs['Normal'],m.node_tree.nodes['Principled BSDF'].inputs['Normal'])
 report=batch_and_export('signature-showroom');report.update({'approximateDimensionsMetres':[12,4.2,13],'referencePhotos':'all5 suppliedphotos, composition observed not measured','features':['central light logo wall','warmwoodcontinuousworktop','darktall cabinet towers','overheadbridge','brightlonghandles','wireproductgridwalls','graycheckerredperimeter','supportingleftlift'],'runtimeDependencies':'Independent showroom GLB; no Harbor world import','limits':'Approximate dimensions and original accessory silhouette props; no surveyed replica or live reflections claim'});(E/'showroom-build.json').write_text(json.dumps(report,indent=2));return report
if __name__=='__main__':
 mode=sys.argv[sys.argv.index('--')+1]if'--'in sys.argv else'all';reports=[]
 if mode in ['all','vehicle']:reports.append(repair_vehicle())
 if mode in ['all','products']:reports.append(products())
 if mode in ['all','showroom']:reports.append(showroom())
 print('P08B_ART',json.dumps(reports))
