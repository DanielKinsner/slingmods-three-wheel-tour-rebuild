"""Original, editable triptych wall sculpture: contour relief, three routes, extruded lettering."""
import bpy,math,pathlib
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def v(p):return Vector((p[0],-p[2],p[1]))
def mat(name,color,metal=0,rough=.5,emission=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;s=m.node_tree.nodes.get('Principled BSDF');s.inputs['Base Color'].default_value=(*color,1);s.inputs['Metallic'].default_value=metal;s.inputs['Roughness'].default_value=rough
 if emission:s.inputs['Emission Color'].default_value=(*color,1);s.inputs['Emission Strength'].default_value=emission
 return m
graphite=mat('Relief_anodized_graphite',(.032,.043,.05),.6,.35);land=mat('Relief_cast_aluminium',(.15,.20,.22),.7,.4);edge=mat('Relief_brushed_champagne',(.42,.30,.15),.8,.32);red=mat('Relief_route_red',(.8,.015,.012),.2,.3,.7);ink=mat('Relief_letter_ivory',(.76,.79,.73),.1,.38,.25);dark=mat('Relief_shadow_gap',(.008,.011,.014),0,.85)
def finish(o,name,m):o.name=name;o.data.materials.append(m);return o
def box(name,p,size,m,bevel=.01):
 bpy.ops.mesh.primitive_cube_add(size=1,location=v(p));o=bpy.context.object;o.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);finish(o,name,m)
 if bevel:mod=o.modifiers.new('Milled edge','BEVEL');mod.width=bevel;mod.segments=2
 return o
def line(name,pts,r,m):
 cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.bevel_depth=r;cu.bevel_resolution=2;s=cu.splines.new('POLY');s.points.add(len(pts)-1)
 for a,p in zip(s.points,pts):a.co=(*v(p),1)
 o=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(o);return finish(o,name,m)
def text(name,body,p,size,m):
 cu=bpy.data.curves.new(name,'FONT');cu.body=body;cu.size=size;cu.extrude=.0015;cu.bevel_depth=.0005;cu.space_character=1.1;o=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(o);o.location=v(p);o.rotation_euler=(math.pi/2,0,0);finish(o,name,m)
box('Tour_relief_backing',(0,0,0),(4.1,2.16,.08),graphite,.025)
for x in [-2.04,2.04]:box('Brushed_frame',(x,0,.04),(.018,2.11,.018),edge,.003)
for y in [-1.06,1.06]:box('Brushed_frame',(0,y,.04),(4.09,.018,.018),edge,.003)
text('Gallery_heading','F I N D  Y O U R  L I N E',(-1.87,.78,.065),.158,ink)
text('Gallery_subtitle','THREE WHEELS.  EVERY ROAD.',(-1.86,.60,.065),.050,edge)
for tile,label in enumerate(['01   HARBOR','02   EXPRESS','03   SMOKY RIDGE']):
 cx=-1.30+tile*1.30;box('Route_shadow_tile',(cx,-.11,.057),(1.23,1.2,.035),dark,.009)
 def height(x,y):return .030+.021*math.sin(7*x+tile*.8+2*math.cos(4*y))+.012*math.sin(12*y-3*x)+.015*(x+.4)
 verts=[];faces=[];N=34
 for j in range(N+1):
  y=-.65+j*1.05/N
  for i in range(N+1):
   x=-.56+i*1.12/N;verts.append(tuple(v((cx+x,y,.10+height(x,y)))))
 for j in range(N):
  for i in range(N):a=j*(N+1)+i;faces.append((a,a+1,a+N+2,a+N+1))
 me=bpy.data.meshes.new('cast_landscape');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('Cast_topography_'+label,me);bpy.context.collection.objects.link(o);finish(o,o.name,land)
 # Sculpted contour lines describe the same relief, with shallow metallic highlights.
 for j in range(19):
  y=-.61+j*.052;pts=[]
  for i in range(65):x=-.54+i*1.08/64;yy=y+.012*math.sin(9*x+j*.5);pts.append((cx+x,yy,.105+height(x,yy)))
  line('Topographic_engraving',pts,.0011,edge)
 pts=[]
 for i in range(101):
  t=i/100;y=-.60+t*.94;x=.26*math.sin(t*math.tau*(1.1+tile*.22)+tile)+.08*math.sin(t*math.tau*3);pts.append((cx+x,y,.116+height(x,y)))
 line('Raised_red_route',pts,.007,red);text('Route_label',label,(cx-.55,-.86,.068),.065,ink)
text('Gallery_footer','SLINGMODS  /  THREE-WHEEL TOUR',(-1.85,-.99,.066),.042,edge)
# One static mesh with six materials: no lights, shadow maps, textures or per-frame work.
bpy.ops.object.select_all(action='SELECT');bpy.context.view_layer.objects.active=bpy.context.selected_objects[0];bpy.ops.object.convert(target='MESH');bpy.ops.object.join();bpy.context.object.name='Find_Your_Line_relief'
out=pathlib.Path('public/assets/ryker/complete');out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(pathlib.Path('assets/ryker/Showroom-Route-Relief.blend').resolve()))
bpy.ops.export_scene.gltf(filepath=str(out/'showroom-route-relief.glb'),export_format='GLB',export_apply=True,export_yup=True)
print('SHOWROOM_RELIEF_COMPLETE')
