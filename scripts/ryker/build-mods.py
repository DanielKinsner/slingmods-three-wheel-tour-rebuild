"""Original reference-based game accessories. Stock partitions preserve artist normals.
Run against Ryker-Game-Master.blend. Coordinates below are runtime X/Y-up/-Z-forward.
Retail photos remain private research references, never exported as textures.
"""
import bpy,sys,pathlib,math,json
from mathutils import Vector,Matrix
from mathutils.bvhtree import BVHTree
sys.path.insert(0,str(pathlib.Path(__file__).parent))
from components import components
args=sys.argv[sys.argv.index('--')+1:];out=pathlib.Path(args[0]);master=pathlib.Path(args[1])
def v(p):return Vector((p[0],-p[2],p[1]))
def empty(name):
 o=bpy.data.objects.new(name,None);bpy.context.scene.collection.objects.link(o);return o
root=empty('ryker_accessories');made=[root]
def group(name):
 o=empty(name);o.parent=root;made.append(o);return o
def mat(name,color,rough=.4,metal=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;return m
black=mat('Accessory_satin_polymer',(.025,.03,.033),.46);recess=mat('Accessory_recess',(.006,.008,.009),.75);red=mat('Elka_red_powdercoat',(.63,.009,.008),.32,.14);alloy=mat('Accessory_machined_aluminium',(.45,.48,.51),.28,.85);steel=mat('Treal_polished_stainless',(.58,.61,.64),.22,.92);weld=mat('Treal_weld_bronze',(.24,.16,.07),.37,.83);blue=mat('Treal_heat_tint',(.10,.14,.19),.33,.85)
def finish(o,name,parent,material):
 o.name=name;o.parent=parent;o.data.materials.append(material);made.append(o);return o
def mesh(name,verts,faces,parent,material,smooth=False):
 data=bpy.data.meshes.new(name);data.from_pydata([v(p) for p in verts],[],faces);data.update();o=bpy.data.objects.new(name,data);bpy.context.scene.collection.objects.link(o);finish(o,name,parent,material)
 for p in data.polygons:p.use_smooth=smooth
 return o
def tube(name,points,r,parent,material):
 cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.resolution_u=2;cu.bevel_depth=r;cu.bevel_resolution=3;s=cu.splines.new('POLY');s.points.add(len(points)-1)
 for p,co in zip(s.points,points):p.co=(*v(co),1)
 o=bpy.data.objects.new(name,cu);bpy.context.scene.collection.objects.link(o);finish(o,name,parent,material);return o
def cylinder(name,a,b,r,parent,material,vertices=48):
 a,b=v(a),v(b);bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=(b-a).length,location=(a+b)/2);o=bpy.context.object;o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();finish(o,name,parent,material)
 for p in o.data.polygons:p.use_smooth=len(p.vertices)==4
 bevel=o.modifiers.new('Machined edge','BEVEL');bevel.width=.001;bevel.segments=2;return o
import importlib.util
spec=importlib.util.spec_from_file_location('partition_stock',pathlib.Path(__file__).with_name('partition-stock.py'));partition_module=importlib.util.module_from_spec(spec);spec.loader.exec_module(partition_module)
partition_report=[]
for name in ['body_panels','front_suspension','rear_mechanical']:partition_report+=partition_module.partition(bpy.data.objects[name],group,made)
(pathlib.Path('assets/ryker/evidence/complete')/'partition-reconstruction.json').write_text(json.dumps(partition_report,indent=2))
# Panther fascia: formed side cheeks, raised central hood, deep rectangular opening and slatted grille.
body=group('ryker_mod_body');body['reference']='Panther Customs SM-8167; inferred game surfaces, not OEM CAD'
for side in [-1,1]:
 def S(points):return [(side*x+.003,y,z) for x,y,z in points]
 verts=S([(0,.615,-.60),(.158,.582,-.60),(.225,.494,-.91),(.215,.46,-1.055),(0,.486,-1.071),(0,.551,-.83),(.12,.518,-.88)])
 o=mesh('Panther_hood_'+str(side),verts,[(0,1,6,5),(1,2,6),(2,3,4,6),(4,5,6)],body,black);solid=o.modifiers.new('Molded thickness','SOLIDIFY');solid.thickness=.005;bevel=o.modifiers.new('Soft molded crease','BEVEL');bevel.width=.003;bevel.segments=3
 verts=S([(.225,.494,-.91),(.305,.435,-.975),(.295,.158,-1.01),(.198,.159,-1.078),(.225,.399,-1.073),(.215,.46,-1.055),(.28,.285,-.91)])
 o=mesh('Panther_fascia_cheek_'+str(side),verts,[(0,1,4,5),(1,2,3,4),(1,6,2)],body,black);solid=o.modifiers.new('Molded thickness','SOLIDIFY');solid.thickness=.007;bevel=o.modifiers.new('Rounded molded edges','BEVEL');bevel.width=.004;bevel.segments=3
 tube('Panther_opening_border',S([(.198,.16,-1.078),(.228,.405,-1.078),(0,.41,-1.088)]),.009,body,black)
 # Two dark recessed gills on each side of the hood.
 for j in range(2):
  z=-.75-j*.075;mesh('Panther_hood_gill',S([(.11,.563-j*.028,z),(.179,.537-j*.026,z-.01),(.193,.518-j*.025,z-.034),(.116,.548-j*.028,z-.028)]),[(0,1,2,3)],body,recess)
mesh('Panther_front_brow',[(-.212,.405,-1.080),(.218,.405,-1.080),(.218,.464,-1.057),(.003,.486,-1.072),(-.212,.464,-1.057)],[(0,1,2,3,4)],body,black)
mesh('Panther_grille_shadow',[(-.195,.167,-1.043),(.201,.167,-1.043),(.218,.402,-1.043),(-.212,.402,-1.043)],[(0,1,2,3)],body,recess)
for y in [.185,.23,.275,.32,.365,.405]:tube('Panther_grille_horizontal',[(-.20,y,-1.083),(.206,y,-1.083)],.006,body,black)
for x in [-.15,-.075,0,.075,.15]:tube('Panther_grille_vertical',[(x,.17,-1.087),(x,.409,-1.087)],.0045,body,black)
tube('Panther_lower_lip',[(-.20,.16,-1.081),(0,.153,-1.09),(.206,.16,-1.081)],.009,body,black)
# Small inset badge, without fabricating a manufacturer logo texture.
mesh('Panther_badge_surround',[(-.017,.505,-.999),(.022,.505,-.999),(.026,.509,-.981),(.003,.524,-.97),(-.021,.509,-.981)],[(0,1,2,3,4)],body,alloy)
mesh('Panther_badge_inset',[(-.012,.507,-.996),(.017,.507,-.996),(.020,.511,-.982),(.003,.522,-.973),(-.015,.511,-.982)],[(0,1,2,3,4)],body,recess)
# Recess details sit flush on the faceted hood instead of protruding at a seam.
hv=[];hf=[]
for o in body.children:
 if o.name.startswith('Panther_hood_') and 'gill' not in o.name:
  offset=len(hv);hv.extend([vert.co.copy() for vert in o.data.vertices]);hf.extend([[offset+i for i in face.vertices] for face in o.data.polygons])
hood_surface=BVHTree.FromPolygons(hv,hf)
for o in body.children:
 if 'gill' in o.name or 'badge' in o.name:
  for vert in o.data.vertices:
   loc,normal,_,_=hood_surface.find_nearest(vert.co)
   if normal.z<0:normal=-normal
   vert.co=loc+normal*(.0017 if 'inset' in o.name else .001)
  o.data.update()
# Three reservoir coilovers at the source model's existing eye positions.
shocks=group('ryker_mod_shocks');shocks['reference']='Elka Stage 3 front pair SM-5475 and solo rear SM-8178'
def shock(name,a,b,reservoirSide=1):
 a,b=Vector(a),Vector(b);axis=(b-a).normalized();length=(b-a).length;u=axis.cross(Vector((0,0,1))).normalized();w=axis.cross(u).normalized()
 def at(t):return tuple(a+(b-a)*t)
 cylinder(name+'_chrome_shaft',at(.02),at(.97),.009,shocks,alloy)
 cylinder(name+'_black_body',at(.12),at(.66),.018,shocks,black)
 for t in [.15,.20,.81,.86]:cylinder(name+'_spring_collar',at(t-.012),at(t+.012),.031,shocks,red)
 points=[]
 for i in range(321):
  t=i/320;angle=t*math.tau*9;points.append(tuple(a+(b-a)*(.20+.61*t)+.026*(math.cos(angle)*u+math.sin(angle)*w)))
 tube(name+'_red_coil',points,.0042,shocks,red)
 for t in [0,1]:
  c=a+(b-a)*t;cylinder(name+'_eye',tuple(c+Vector((0,0,-.013))),tuple(c+Vector((0,0,.013))),.018,shocks,black);cylinder(name+'_eye_bolt',tuple(c+Vector((0,0,-.015))),tuple(c+Vector((0,0,.015))),.009,shocks,alloy,6)
 offset=u*.062*reservoirSide;c=a+(b-a)*.18+offset;d=c+axis*min(.115,length*.38);cylinder(name+'_reservoir',tuple(c),tuple(d),.022,shocks,black);cylinder(name+'_red_adjuster',tuple(d),tuple(d+axis*.008),.02,shocks,red);tube(name+'_hose',[at(.17),tuple(c-axis*.02),tuple(c)],.005,shocks,black)
 for t in [.27,.35]:cylinder(name+'_body_ring',at(t-.004),at(t+.004),.019,shocks,alloy)
shock('Elka_front_left',[-.168,.416,-.855],[-.378,.176,-.855],-1)
shock('Elka_front_right',[.184,.416,-.855],[.394,.176,-.855],1)
shock('Elka_rear',[.002,.49,.078],[.002,.34,.415],1)
# Oval polished street muffler on the right, open 3-inch slash-cut rear outlet.
exhaust=group('ryker_mod_exhaust');exhaust['reference']='Treal TRP-RKR-SES Street, no silencer insert'
def oval(name,z0,z1,rx,ry,material):
 verts=[]
 for z in [z0,z1]:
  for i in range(64):a=math.tau*i/64;verts.append((.143+rx*math.cos(a),.247+ry*math.sin(a),z))
 return mesh(name,verts,[(i,(i+1)%64,(i+1)%64+64,i+64) for i in range(64)],exhaust,material,True)
oval('Treal_oval_silencer',.095,.426,.068,.077,steel)
for z in [.095,.426]:
 pts=[(.143+.068*math.cos(i*math.tau/64),.247+.077*math.sin(i*math.tau/64),z) for i in range(65)];tube('Treal_rolled_seam',pts,.0028,exhaust,steel)
 verts=[(.143+rx*math.cos(i*math.tau/64),.247+ry*math.sin(i*math.tau/64),z) for rx,ry in [(.068,.077),(.035,.035)] for i in range(64)]
 mesh('Treal_oval_end_cap',verts,[(i,(i+1)%64,(i+1)%64+64,i+64) for i in range(64)],exhaust,steel)
tube('Treal_inlet',[(.143,.247,.096),(.143,.247,.02),(.115,.28,-.06),(.05,.33,-.12)],.024,exhaust,steel)
# Actual wall thickness and slanted open end, with a dark cavity behind it.
verts=[]
for radius,z,slash in [(.035,.42,0),(.0381,.585,.018),(.0358,.585,.018),(.0327,.434,0)]:
 for i in range(64):a=i*math.tau/64;verts.append((.143+radius*math.cos(a),.247+radius*math.sin(a),z+slash*math.cos(a)))
mesh('Treal_slash_cut_outlet',verts,[(layer*64+i,layer*64+(i+1)%64,(layer+1)*64+(i+1)%64,(layer+1)*64+i) for layer in range(3) for i in range(64)],exhaust,steel,True)
cylinder('Treal_dark_inner_bore',(.143,.247,.43),(.143,.247,.433),.032,exhaust,recess)
for j in range(3):
 z=.453+j*.012;tube('Treal_colored_weld',[(.143+.037*math.cos(i*math.tau/64),.247+.037*math.sin(i*math.tau/64),z) for i in range(65)],.0016,exhaust,weld if j!=1 else blue)
tube('Treal_upper_bracket',[(.095,.31,.25),(.095,.34,.25),(.185,.34,.25),(.185,.31,.25)],.004,exhaust,steel)
for x in [.11,.175]:cylinder('Treal_mount_fastener',(x,.337,.25),(x,.35,.25),.007,exhaust,alloy,6)
exec(compile(pathlib.Path(__file__).with_name('refine-products.py').read_text(), 'refine-products.py','exec'))
# Separate kit asset so ProductPresenter can share its established lighting controls.
glow=group('ryker_mod_underglow');diffuser=mat('Ryker_TricLED_diffuser',(.7,.7,.7),.5);housing=mat('Ryker_TricLED_smoked_tube',(.012,.013,.015),.6)
paths=[]
headlight_surface=BVHTree.FromObject(bpy.data.objects['headlights'],bpy.context.evaluated_depsgraph_get())
for side in [-1,1]:
 paths.append([(side*.19,.311,-.923),(side*.32,.333,-.915),(side*.455,.35,-.889)])
 lamp=[]
 for point in [(side*.10,.638,-.636),(side*.158,.647,-.632),(side*.19,.668,-.617)]:
  loc,normal,_,_=headlight_surface.find_nearest(v(point));loc+=normal*.002;lamp.append((loc.x,loc.z,-loc.y))
 paths.append(lamp)
 paths.append([(side*.21,.20,-.962),(side*.23,.38,-.962)])
for i,points in enumerate(paths):
 mount=group('TricLED_mount_'+str(i));mount.parent=glow
 if i in [0,3]:mount['rykerMotion']={'kind':'arm','channel':0 if i==0 else 1,'pivot':[-.177 if i==0 else .193,.31,-.855]}
 if i in [2,5]:mount['stockGrilleLight']=True
 tube('TricLED_smoked_mount_'+str(i),points,.005,mount,housing);tube('TricLED_RGB_strip_'+str(i),[(x,y,z-.002) for x,y,z in points],.0027,mount,diffuser)
# Export only authored objects. The source .blend and runtime vehicle remain untouched.
for o in list(bpy.data.objects):
 if o not in made:bpy.data.objects.remove(o,do_unlink=True)
# Merge only identical rigid motion groups. Source partitions keep their semantic parents.
for parent in [body,exhaust,*shocks.children,*glow.children]:
 children=[o for o in parent.children if o.type in ['MESH','CURVE']]
 if not children:continue
 bpy.ops.object.select_all(action='DESELECT')
 for o in children:o.select_set(True)
 bpy.context.view_layer.objects.active=children[0];bpy.ops.object.convert(target='MESH');bpy.ops.object.join();bpy.context.object.name=parent.name+'_geometry'
# Static islands and islands with the same motion transform can share a draw.
for parent in list(root.children):
 if not (parent.name.startswith('stock_') or parent.name.startswith('retained_')):continue
 bins={}
 for o in list(parent.children):
  meta=o.get('rykerMotion');key=json.dumps(meta.to_dict() if meta else {},sort_keys=True);bins.setdefault(key,[]).append(o)
 for index,(key,children) in enumerate(bins.items()):
  bpy.ops.object.select_all(action='DESELECT')
  for o in children:o.select_set(True)
  bpy.context.view_layer.objects.active=children[0];bpy.ops.object.join();bpy.context.object.name=parent.name+'_motion_'+str(index)
bpy.ops.object.select_all(action='DESELECT');glow.select_set(True)
for o in glow.children_recursive:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(out/'ryker-underglow.glb'),export_format='GLB',use_selection=True,export_apply=True,export_extras=True,export_yup=True)
for o in [glow,*glow.children_recursive]:o.hide_render=True;o.hide_set(True)
bpy.ops.object.select_all(action='DESELECT')
for o in [root,*root.children_recursive]:
 if o!=glow and o not in glow.children_recursive:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(out/'ryker-accessories.glb'),export_format='GLB',use_selection=True,export_apply=True,export_extras=True,export_yup=True)
bpy.ops.wm.save_as_mainfile(filepath=str(master))
print('RYKER_MODS_COMPLETE')
