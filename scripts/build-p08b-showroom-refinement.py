"""Bounded reference-led showroom refinement. Background Blender; original sources untouched."""
import bpy, importlib.util, math, json, hashlib
import numpy as np
from pathlib import Path
P=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('p08b_art',P/'scripts/build-p08b-art.py');h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
A=P/'assets/blender/p08b/showroom-refinement';O=P/'public/assets/p08b/showroom-refinement';E=P/'director-kit/production/evidence/P08B/showroom-refinement'
for d in [A,O,E]:d.mkdir(parents=True,exist_ok=True)
h.A=A;h.O=O;h.E=E
source=P/'assets/blender/p08b/signature-showroom.blend';original=hashlib.sha256(source.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(source))
bpy.context.preferences.filepaths.save_version=0
base=bpy.data.objects['signature_showroom']
def image(name,data,noncolor=False):
 im=bpy.data.images.new(name,width=data.shape[1],height=data.shape[0],alpha=True)
 if noncolor:im.colorspace_settings.name='Non-Color'
 im.pixels.foreach_set(data.astype(np.float32).ravel());im.filepath_raw=str(O/(name+'.png'));im.file_format='PNG';im.save();im.pack();return im
# Single 0.5m tile: diagonal chevron ribs create four triangular direction fields.
# Fine transverse support bridges form ventilated slots. Texture is authored, not a pasted photo.
n=1024;u,v=np.meshgrid((np.arange(n)+.5)/n,(np.arange(n)+.5)/n);x=u-.5;y=v-.5
d=(abs(x)+abs(y))/math.sqrt(2);pitch=1/38;phase=(d/pitch)%1
rib=np.sqrt(np.maximum(0,1-((phase-.5)/.32)**2))
cross=np.where(abs(x)>abs(y),v,u);support=(np.abs(((cross*12)%1)-.5)<.045).astype(float)
rim=(np.minimum.reduce([u,v,1-u,1-v])<.006).astype(float)
height=np.maximum(rib*.0025,np.maximum(support*.0009,rim*.0028))
dx=(np.roll(height,-1,axis=1)-np.roll(height,1,axis=1))/(1/n)
dy=(np.roll(height,-1,axis=0)-np.roll(height,1,axis=0))/(1/n)
norm=np.stack([-dx,-dy,np.ones_like(dx)],axis=-1);norm/=np.linalg.norm(norm,axis=-1,keepdims=True)
normal=image('vented-tile-normal',np.concatenate([norm*.5+.5,np.ones((n,n,1))],axis=-1),True)
rough=np.clip(.57+.21*(1-rib)+.04*np.sin(u*251)*np.sin(v*241),.45,.9)
orm=image('vented-tile-orm',np.stack([.36+.64*np.maximum(rib,support*.7),rough,np.zeros_like(u),np.ones_like(u)],axis=-1),True)
materials={}
for key,color in [('gray',(.23,.241,.249)),('charcoal',(.075,.086,.096)),('red',(.43,.014,.021))]:
 shade=.52+.48*np.maximum(rib,np.maximum(support*.15,rim));arr=np.ones((n,n,4));arr[:,:,:3]=shade[:,:,None]*np.array(color)[None,None,:]
 albedo=image('vented-tile-'+key,arr)
 m=h.mat('Refined_vented_'+key,color,0,.68);q=m.node_tree.nodes['Principled BSDF'];nodes=m.node_tree.nodes;links=m.node_tree.links
 t=nodes.new('ShaderNodeTexImage');t.image=albedo;links.new(t.outputs['Color'],q.inputs['Base Color'])
 t=nodes.new('ShaderNodeTexImage');t.image=normal;nm=nodes.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.95;links.new(t.outputs['Color'],nm.inputs['Color']);links.new(nm.outputs['Normal'],q.inputs['Normal'])
 t=nodes.new('ShaderNodeTexImage');t.image=orm;sep=nodes.new('ShaderNodeSeparateColor');links.new(t.outputs['Color'],sep.inputs[0]);links.new(sep.outputs['Green'],q.inputs['Roughness']);materials[key]=m
for o in list(bpy.data.objects):
 if o.name.startswith('studio_checker_tile'):
  old=o.data.materials[0].name;key='red' if 'red' in old else 'gray' if 'gray' in old else 'charcoal';o.data.materials.clear();o.data.materials.append(materials[key])
  uv=o.data.uv_layers.active or o.data.uv_layers.new(name='UVMap')
  for poly in o.data.polygons:
   for li in poly.loop_indices:
    co=o.data.vertices[o.data.loops[li].vertex_index].co;uv.data[li].uv=(co.x/.498+.5,-co.y/.498+.5)
# Remove only the existing camera-left side wall and replace it with a real doorway opening.
for o in list(bpy.data.objects):
 if o.name=='studio_right_wall' or o.name.startswith(('left_lift','lift_foot')):bpy.data.objects.remove(o,do_unlink=True)
white=bpy.data.materials['studio_warm_white'];metal=bpy.data.materials['studio_handle_brushed'];cab=bpy.data.materials['studio_graphite_cabinet'];red=bpy.data.materials['studio_slingmods_red'];yellow=h.mat('utility_safety_yellow',(.68,.43,.055),0,.6);steel=h.mat('rollup_galvanized_gray',(.24,.29,.32),.65,.4);rubber=h.mat('utility_rubber',(.014,.018,.02),0,.88)
for z,length in [(-2.7,2.6),(4.6,4.8)]:h.box('left_bay_wall_pier',(6,2.1,z),(.18,4.2,length),white,base)
h.box('left_bay_wall_header',(6,3.75,.4),(.18,.9,3.6),white,base)
for z,length in [(-2.7,2.6),(4.6,4.8)]:h.box('left_wall_yellow_safety_stripe',(5.894,1.47,z),(.022,.13,length),yellow,base,.001)
# Animated curtain local origin at the sill. 27 named rigid slats can rise and collect at the header.
door=h.group('bay_door');door.parent=base;door.location=h.cv((5.965,0,.4));door['openingWidth']=3.6;door['openingHeight']=3.25;door['axis']='Y';door['closedPosition']=[5.965,0,.4];door['exitPoint']=[9,0,.4];door['presentationOnly']=True
curtain=h.group('bay_door_curtain');curtain.parent=door;curtain['openOffset']=[0,3.35,0];curtain['openScaleY']=.025
slats=27;pitch=3.24/slats
for i in range(slats):
 g=h.group('bay_door_slat_%02d'%i);g.parent=curtain;g.location=h.cv((0,(i+.5)*pitch,0));g['slatIndex']=i;g['closedY']=(i+.5)*pitch
 h.box('door_ribbed_panel',(0,0,0),(.043,pitch-.006,3.53),steel,g,.003)
 for sy in [-.037,.037]:h.box('door_rolled_rib',(-.023,sy,0),(.025,.012,3.50),metal,g,.004)
 if i==0:
  h.box('door_bottom_weather_seal',(0,-pitch*.43,0),(.063,.024,3.55),rubber,g,.004)
  for z in [-1.0,1.0]:h.path('door_pull_handle',[(-.05,-.018,z-.10),(-.11,-.018,z-.10),(-.11,-.018,z+.10),(-.05,-.018,z+.10)],.012,metal,g)
for z in [-1.42,2.22]:
 h.box('rollup_door_track',(5.92,1.65,z),(.14,3.35,.105),metal,base)
 h.box('yellow_door_jamb_guard',(5.82,.57,z),(.11,1.12,.13),yellow,base,.008)
h.box('rollup_header_cover',(5.82,3.42,.4),(.42,.34,3.91),white,base,.015)
h.box('bay_threshold',(5.92,.003,.4),(.42,.014,3.56),metal,base,.002)
# Closed bay backed by a small exterior apron: no new playable destination.
h.box('cinematic_exterior_apron',(10,-.035,.4),(8,.05,4.5),bpy.data.materials['studio_charcoal_tile'],base,0)
# Reference-style empty four-post lift, with runways, crossbars, safety racks and hydraulic controls.
lift=h.group('reference_left_lift');lift.parent=base
for x in [3.36,5.62]:
 for z in [3.48,6.45]:
  h.box('lift_column',(x,1.47,z),(.15,2.94,.17),cab,lift,.01);h.box('lift_base_plate',(x,.038,z),(.44,.076,.39),metal,lift,.005)
  h.box('lift_lock_ladder',(x-.082,1.37,z),(.018,2.35,.085),metal,lift,.002)
  for yy in [.4+i*.16 for i in range(13)]:h.box('lift_lock_tooth',(x-.097,yy,z),(.025,.05,.071),rubber,lift,.001)
  for xx in [-.14,.14]:
   for zz in [-.11,.11]:h.rod('lift_anchor_bolt',(x+xx,.075,z+zz),(x+xx,.09,z+zz),.015,metal,lift,6)
for x in [3.69,5.29]:
 h.box('lift_runway',(x,1.75,4.94),(.52,.15,3.85),cab,lift,.014)
 for sx in [-.25,.25]:h.box('lift_runway_lip',(x+sx,1.86,4.94),(.025,.09,3.85),metal,lift,.004)
 h.box('lift_yellow_stop',(x,1.9,6.77),(.5,.20,.08),yellow,lift,.006)
 ramp=h.box('lift_access_ramp',(x,1.45,2.65),(.51,.08,.85),metal,lift,.005);ramp.rotation_euler.x=-.6
for z in [3.45,6.48]:h.box('lift_crossbeam',(4.49,1.68,z),(2.58,.23,.19),cab,lift,.008)
h.box('lift_hydraulic_motor',(5.78,.96,3.48),(.19,.39,.23),cab,lift,.025);h.box('lift_control_box',(5.74,1.47,3.42),(.10,.2,.13),metal,lift,.008);h.rod('lift_red_stop_button',(5.68,1.5,3.4),(5.64,1.5,3.4),.025,red,lift)
h.path('lift_hydraulic_line',[(5.79,1.0,3.42),(5.8,.54,3.4),(5.62,.34,3.4),(5.62,2.6,3.43)],.009,rubber,lift)
# Small rolling drawer cabinet and red compressor visible near the utility bay.
utility=h.group('bay_utility');utility.parent=base
h.box('utility_tool_chest',(5.22,.53,-2.35),(.59,.87,.94),cab,utility,.014)
for yy in [.24,.39,.54,.69,.83]:h.box('utility_drawer_pull',(4.909,yy,-2.35),(.027,.025,.79),metal,utility,.003)
for xx in [5.0,5.43]:
 for zz in [-2.68,-2.02]:h.rod('utility_caster',(xx-.025,.095,zz),(xx+.025,.095,zz),.068,rubber,utility)
h.rod('compressor_air_tank',(4.96,.24,-3.45),(5.46,.24,-3.45),.19,red,utility,24)
for x in [4.96,5.46]:h.rod('compressor_tank_end',(x-.01,.24,-3.45),(x+.01,.24,-3.45),.175,red,utility,24)
h.box('compressor_motor',(5.2,.51,-3.45),(.28,.23,.22),cab,utility,.04);h.path('compressor_hose',[(5.22,.57,-3.48),(5.55,.4,-3.6),(5.6,.08,-3.82),(5.25,.07,-3.86),(5.0,.10,-3.67)],.013,rubber,utility)
report=h.batch_and_export('signature-showroom-refined',bindings=['signature_showroom','bay_door_curtain']);report.update({'baselineSHA256':original,'door':{'group':'bay_door','curtain':'bay_door_curtain','slatPrefix':'bay_door_slat_','slatCount':slats,'pitch':pitch,'openingCenter':[6,1.625,.4],'width':3.6,'height':3.25,'exitPoint':[9,0,.4],'gameForwardYaw':-math.pi/2,'openOffset':[0,3.35,0],'openScaleY':.025},'floor':{'tileSizeMetres':.5,'mapSize':n,'pattern':'Rounded diagonal ribs at approx13mm pitch, four triangular chevron fields, transverse vent bridges','geometry':'original 624 thin tiles with corrected planar UVs','material':'original procedural albedo, tangent normal and roughness maps'},'limits':['Presentation rollup approximation; no new route or physical colliders','Room/lift dimensions are inferred from owner photos, not manufacturer specifications','Ribbed floor has mapped relief, not individually simulated holes']})
(E/'build.json').write_text(json.dumps(report,indent=2));assert hashlib.sha256(source.read_bytes()).hexdigest()==original
print(json.dumps(report))
