"""Calibrate and selectively simplify purchased components. Source remains in .tools.
Run audit.py first. Coordinates below are measured in the imported mesh LOCAL frame.
"""
import bpy, numpy as np, json, pathlib, math, sys
from mathutils import Matrix, Vector
ROOT=pathlib.Path(__file__).resolve().parents[2];WORK=ROOT/'.tools/spyder';OUT=ROOT/'public/assets/spyder';OUT.mkdir(parents=True,exist_ok=True)
EVID=ROOT/'assets/spyder/evidence';EVID.mkdir(parents=True,exist_ok=True)
BASE=next((ROOT/'.tools/spyder-kit/Spyder_Road_Codex_Kit/work').glob('preflight-*/Spyder-Imported-Baseline.blend'))
bpy.ops.wm.open_mainfile(filepath=str(BASE))
S=1.709/(118.1129+81.95799);CX=-18.25837;CY=(118.1129-81.95799)/2;BOTTOM=-70.3365
def point(v):return Vector((-(v[0]-CX)*S,-(v[1]-CY)*S,(v[2]-BOTTOM)*S))
def game(v):p=point(v);return [p.x,p.z,-p.y]
front=[(-98.5465,-81.964,-32.45885),(62.0298,-81.964,-32.45885)]
# Left is game negative X; source has opposite X after the native import transform.
front=front[::-1];rear=(-18.2584,118.1129,-32.45885)
contacts=[game(v) for v in [*front,rear]];radius=37.87765*S
manifest={'vehicleId':'can-am-spyder-f3','revision':'spyder-f3-v1','visualYear':None,'referenceYear':2023,'referenceTrim':'US base F3 SE6','scale':S,'sourceToRuntime':[[-S,0,0,CX*S],[0,0,S,-BOTTOM*S],[0,S,0,-CY*S],[0,0,0,1]],'wheelbase':1.709,'wheels':[{'id':n,'center':c,'radius':radius,'width':w*S} for n,c,w in zip(['front_left','front_right','rear'],contacts,[23.9049,23.9049,31.9761])],'notes':['Uniform wheelbase calibration; source custom tires radius 0.3236 m differs from nominal OEM front 0.28125 / rear 0.303 m.','Native importer rotates original XY by 180 degrees; transformation applied once to local vertices.','No unused LOD or compression decoder.']}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
for o in list(bpy.context.scene.objects):
 if o.name=='Plane02':bpy.data.objects.remove(o,do_unlink=True)
palette={'paint_orange':(.95,.19,.018,1),'paint_silver':(.84,.86,.87,1),'silver':(.43,.46,.49,1),'chrome':(.68,.72,.76,1),'rim':(.42,.45,.49,1),'black_metal':(.025,.03,.034,1),'Gloss_Plastic':(.017,.020,.024,1),'Leather':(.055,.037,.027,1),'red_plastic':(.32,.015,.009,1),'tire':(.025,.026,.029,1),'tire_without':(.025,.026,.029,1),'mirror':(.75,.78,.8,1)}
for m in bpy.data.materials:
 m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF')
 if not p:continue
 # Retain diffuse UV artwork, not legacy reflection/specular/alpha maps as PBR data.
 for name in ['Alpha','Metallic','Roughness','Specular IOR Level','Normal']:
  for link in list(p.inputs[name].links):m.node_tree.links.remove(link)
 p.inputs['Alpha'].default_value=1;p.inputs['Metallic'].default_value=.85 if m.name in ['silver','chrome','rim','break','black_metal','mirror'] else 0
 p.inputs['Roughness'].default_value=.24 if m.name.startswith('paint') else .68 if m.name in ['Leather','tire','tire_without'] else .29
 if m.name in palette:
  if m.name not in ['Leather','tire']:
   for link in list(p.inputs['Base Color'].links):m.node_tree.links.remove(link)
  p.inputs['Base Color'].default_value=palette[m.name]
 m.diffuse_color=tuple(p.inputs['Base Color'].default_value)
 if m.name=='paint_orange':m['vehicleRole']='paint'
 if m.name=='paint_silver':m['vehicleRole']='accent'
 if 'glass' in m.name:
  p.inputs['Metallic'].default_value=.08;p.inputs['Roughness'].default_value=.2
 for node in m.node_tree.nodes:
  if node.type=='TEX_IMAGE' and node.image:node.image.colorspace_settings.name='sRGB'
original=list(bpy.context.scene.objects)
islands=json.loads((WORK/'islands.json').read_text());islandMap={(r['object'],r['component']):r for r in islands}
def semantic(name,r):
 lo,hi=np.array(r['min']),np.array(r['max']);c=(lo+hi)/2;x,y,z=c
 side='front_left' if x>CX else 'front_right'
 if name=='Plane14_pivot' or name=='Cylinder193_pivot':return 'rear_spin'
 if name=='Cylinder01' and r['component'] in [0,93684,95990,98296,100602,102908,105214,117416,119722,120282,192623,193019,195131,209807,211024]:return 'rear_spin'
 if name=='Cylinder13_pivot' and r['component']==316497:return 'rear_spin'
 if (name=='Cylinder01' and r['component']==179716) or (name=='Object68_pivot' and r['component'] in [26201,36639]) or (name=='Plane55' and r['component']==176837):return 'rear_swingarm'
 if name in ['Plane110_pivot','Plane94_pivot','objCylinder164_pivot']:return side+'_spin'
 if name=='Object06_pivot' and r['component'] in [158714,278428]:return side+'_upper_arm'
 if name=='Object06_pivot' and r['component'] in [160967,280681]:return side+'_lower_arm'
 if name=='Object06_pivot' and r['component'] in [157365,277079]:return side+'_tie_rod'
 if name=='Object58_pivot' or name=='objPlane09_pivot':return side+'_steer'
 # Axle-local bearings/hub hardware rotate, but brake calipers stay on carriers.
 if hi[2]<-5 and lo[2]>-58 and abs(y+81.96)<13 and abs(x-CX)>66 and name in ['Cylinder01','Cylinder13_pivot']:return side+'_spin'
 if name=='Helix04_pivot':return 'stock_'+side+'_spring' if y<0 else 'stock_rear_spring'
 if name=='Cylinder13_pivot' and r['component'] in [80524,222907]:return 'stock_'+side+'_shock'
 if name=='Cylinder13_pivot' and r['component'] in [121286,122798]:return 'stock_rear_shock'
 if lo[2]>60 or (name=='Object06_pivot' and r['component']==40237) or (name=='Cylinder13_pivot' and lo[2]>40 and hi[1]>-31):return 'steering_control'
 if name in ['Object11_pivot']:return 'mirrors'
 return 'body'
def empty(name,loc=(0,0,0),parent=None):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=loc;o.parent=parent;return o
root=empty('spyder_foundation');root['materialBindingsVersion']=1;nodes={'body':root}
for name,c in zip(['front_left','front_right','rear'],[*front,rear]):
 carrier=empty(name+'_steer' if name!='rear' else 'rear_carrier',point(c),root);spin=empty(name+'_spin',(0,0,0),carrier);nodes[name+'_spin']=spin;nodes[name+'_steer']=carrier
nodes['steering_control']=empty('steering_control',point((CX,-22,44)),root)
for n in ['front_left','front_right','rear']:
 for part in ['spring','shock']:nodes['stock_'+n+'_'+part]=empty('stock_'+n+'_'+part,parent=root)
for n in ['front_left','front_right']:
 for kind in ['upper_arm','lower_arm','tie_rod']:nodes[n+'_'+kind]=empty(n+'_'+kind,parent=root)
nodes['rear_swingarm']=empty('rear_swingarm',parent=root);nodes['mirrors']=root
counts=[];parts=[]
for obj in original:
 if obj.type!='MESH':continue
 m=obj.data;labels=np.load(WORK/(obj.name+'.npz'))['labels'];starts=np.empty(len(m.polygons),np.int32);sizes=starts.copy();mat=starts.copy()
 m.polygons.foreach_get('loop_start',starts);m.polygons.foreach_get('loop_total',sizes);m.polygons.foreach_get('material_index',mat)
 vids=np.empty(len(m.loops),np.int32);m.loops.foreach_get('vertex_index',vids);co=np.empty(len(m.vertices)*3,np.float32);m.vertices.foreach_get('co',co);co=co.reshape(-1,3)
 uv=np.empty(len(m.loops)*2,np.float32)
 if m.uv_layers:m.uv_layers.active.data.foreach_get('uv',uv)
 else:uv[:]=0
 uv=uv.reshape(-1,2)
 category={int(k):semantic(obj.name,islandMap[(obj.name,int(k))]) for k in np.unique(labels)}
 names=np.array([category[int(k)] for k in labels[vids[starts]]])
 for cat in np.unique(names):
  faceids=np.where(names==cat)[0];loopids=np.concatenate([np.arange(starts[i],starts[i]+sizes[i]) for i in faceids]);used,inverse=np.unique(vids[loopids],return_inverse=True)
  target=nodes[cat];origin=target.matrix_world.translation if target.parent else Vector((0,0,0))
  bpy.context.view_layer.update();origin=target.matrix_world.translation
  points=np.array([point(v)-origin for v in co[used]],dtype=np.float32)
  mesh=bpy.data.meshes.new(obj.name+'_'+cat);mesh.vertices.add(len(used));mesh.vertices.foreach_set('co',points.ravel());mesh.loops.add(len(loopids));mesh.loops.foreach_set('vertex_index',inverse)
  mesh.polygons.add(len(faceids));mesh.polygons.foreach_set('loop_start',np.r_[0,np.cumsum(sizes[faceids])[:-1]]);mesh.polygons.foreach_set('loop_total',sizes[faceids]);mesh.polygons.foreach_set('material_index',mat[faceids]);mesh.polygons.foreach_set('use_smooth',np.ones(len(faceids),dtype=bool))
  for ma in m.materials:mesh.materials.append(ma)
  layer=mesh.uv_layers.new();layer.data.foreach_set('uv',uv[loopids].ravel());mesh.update()
  piece=bpy.data.objects.new(obj.name+'_'+cat,mesh);bpy.context.collection.objects.link(piece);piece.parent=target;parts.append(piece)
  if cat=='mirrors':piece.name='Mirrors_1'
  counts.append({'source':obj.name,'target':piece.name,'channel':cat,'sourceTriangles':int(np.sum(sizes[faceids]-2))})
 bpy.data.objects.remove(obj,do_unlink=True)
bpy.context.view_layer.update();bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(WORK/'Spyder-Calibrated-Master.blend'))
# Distinct budgets by semantic surfaces; no smoothing modifier, no silhouette replacement.
for piece,row in zip(parts,counts):
 name=row['source'];tris=row['sourceTriangles'];ratio=.16
 if name in ['Object06_pivot','Object04','Object58_pivot']:ratio=.42
 elif name in ['Plane110_pivot','Plane14_pivot','Plane94_pivot']:ratio=.28
 elif name in ['Plane10_pivot','Shape03']:ratio=.38
 elif name=='Plane55':ratio=.08
 elif name in ['Cylinder01','Cylinder13_pivot','objPlane09_pivot']:ratio=.10
 if tris<2000:ratio=1
 if ratio<1:
  mod=piece.modifiers.new('Selective component reduction','DECIMATE');mod.ratio=ratio
  bpy.context.view_layer.objects.active=piece;bpy.ops.object.modifier_apply(modifier=mod.name)
 piece.data.calc_loop_triangles();row['runtimeTriangles']=len(piece.data.loop_triangles);row['ratio']=ratio
# Merge only equal rigid motion channels, retaining material assignments and UVs.
for channel in set(r['channel'] for r in counts):
 objs=[o for o,r in zip(parts,counts) if r['channel']==channel]
 if len(objs)<2:continue
 bpy.ops.object.select_all(action='DESELECT')
 for o in objs:o.select_set(True)
 bpy.context.view_layer.objects.active=objs[0];bpy.ops.object.join();objs[0].name='Mirrors_1' if channel=='mirrors' else 'spyder_'+channel+'_mesh'
# Retained native control arms follow their measured outboard wheel travel.
for o in bpy.context.scene.objects:
 for i,side in enumerate(['front_left','front_right']):
  for kind,y in [('upper_arm',.475),('lower_arm',.187),('tie_rod',.378)]:
   if o.type=='EMPTY' and side+'_'+kind in o.name:
    sign=-1 if i==0 else 1;o['spyderMotion']={'kind':'link','channel':i,'part':'link','travelRatio':1,'upper':[sign*.225,y,-.853],'lower':[sign*.598,y,-.853]}
# Add a small telemetry LCD within the source gauge housing; source dial faces retained.
bpy.ops.mesh.primitive_plane_add(size=1,location=point((CX,-50.0,47.5)))
screen=bpy.context.object;screen.name='instrument_screen';screen.scale=(.082,.036,1);screen.rotation_euler=(math.radians(65),0,0);screen.parent=root
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(WORK/'Spyder-Game-Master.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'spyder-f3.glb'),export_format='GLB',export_yup=True,export_extras=True,export_cameras=False,export_lights=False)
(EVID/'components.json').write_text(json.dumps(counts,indent=2));manifest['triangles']=sum(r['runtimeTriangles'] for r in counts)+2
manifest['runtime']='/assets/spyder/spyder-f3.glb';manifest['masters']=['.tools/spyder/Spyder-Calibrated-Master.blend','.tools/spyder/Spyder-Game-Master.blend'];manifest['barPivot']=game((CX,-22,44));manifest['grips']=[game((38,-1.5,68)),game((-74,-1.5,68))]
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
# Sidecars are explicit; RearPresenter is never invoked for this belt-driven bike.
(OUT/'rear-rig.json').write_text(json.dumps({'groups':{},'kind':'spyder-belt','revision':1}))
d=json.loads((ROOT/'public/assets/model02/driver-attachment.json').read_text());d={k:d[k] for k in ['headVisualNode','arms','feet','legs']};d.update(handlebar=True,rootOffset=[.36,.34,-.15],handlebarPose={"lean":-.35,"extraLean":-.4,"twist":.65},eye=[0,1.50,.08])
for i,(side,a) in enumerate(d['arms'].items()):
 sign=-1 if side=='left' else 1;grip=manifest['grips'][0 if side=='left' else 1];a['wheelGripLocal']=[grip[j]-manifest['barPivot'][j] for j in range(3)];a['poleHint']=[sign*.5,1.06,.35]
for side,l in d['legs'].items():
 sign=-1 if side=='left' else 1;l['ankle']=[sign*.32,.30,-.04];l['pole']=[sign*.4,.67,.12];l['footPitch']=.04
d['headVisualNodes']=['Helmet_base_seal', 'Tour_helmet_shell', 'Tour_smoke_visor', 'Visor_rubber_gasket', 'Chin_vent', 'Chin_vent.001', 'Chin_vent.002', 'Crown_vent', 'Crown_vent.001', 'Shield_pivot', 'Shield_pivot.001', 'Shield_pivot.002', 'Shield_pivot.003', 'Nape_reflective_tab']
(OUT/'driver-attachment.json').write_text(json.dumps(d,indent=2));print('SPYDER BUILD',manifest,flush=True)
