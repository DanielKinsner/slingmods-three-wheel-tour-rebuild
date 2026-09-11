"""Bounded modular waterfront/industrial harbor; called only after route physics clearance."""
import bpy,math,random,json,pathlib
from mathutils import Vector

def dress(ctx):
 P,O,E=ctx['P'],ctx['O'],ctx['E'];route=ctx['route'];mesh,boxes,mat,rv=ctx['mesh'],ctx['boxes'],ctx['mat'],ctx['rv'];objects=ctx['objects'];concrete=ctx['concrete'];paint=ctx['paint'];rng=random.Random(405)
 kit=mat('Harbor_Modular_Atlas',(.4,.4,.4));dark=mat('Harbor_Dark_Rubber',(.027,.035,.039),.88);emit=mat('Harbor_Luminaire',(.88,.69,.35),.5);bs=emit.node_tree.nodes['Principled BSDF'];bs.inputs['Emission Color'].default_value=(1,.67,.28,1);bs.inputs['Emission Strength'].default_value=2.5
 # The broad physics ground remains a safety plane; visible land ends at the guarded quay.
 old=bpy.data.objects.get('venue_ground');objects.remove(old);bpy.data.objects.remove(old,do_unlink=True)
 land=boxes('Harbor_land',[dict(center=[206,-.125,-50],size=[468,.25,720],yaw=0)],kit);land['atlas_tile']=6
 from harbor_land_cut import cut_land_corridor
 cut_land_corridor(land,route,E)
 water=mesh('Marina_water', [rv(p)for p in [(-520,-.28,-410),(-28,-.28,-410),(-28,-.28,310),(-520,-.28,310)]],[(0,1,2,3)],kit);water['atlas_tile']=5
 # Atlas mapping uses per-module faces; long modules are divided into scale-aware bays.
 def box(name,center,size,tile=0,yaw=0,m=None,collision=False):
  record=dict(id=name,center=list(center),size=list(size),yaw=yaw);ob=boxes(name,[record],m or kit);ob['atlas_tile']=tile
  if collision:route['colliders'].append(record)
  return ob
 def line(name,a,b,r,tile=1,m=None,segments=8):
  a,b=Vector(a),Vector(b);d=(b-a).normalized();axis=d.cross(Vector((0,1,0)))
  if axis.length<.01:axis=d.cross(Vector((1,0,0)))
  axis.normalize();other=d.cross(axis).normalized();v=[]
  for p in [a,b]:
   for j in range(segments):v.append(rv(p+r*(axis*math.cos(math.tau*j/segments)+other*math.sin(math.tau*j/segments))))
  f=[(j,(j+1)%segments,(j+1)%segments+segments,j+segments)for j in range(segments)]+[tuple(reversed(range(segments))),tuple(range(segments,segments*2))];ob=mesh(name,v,f,m or kit);ob['atlas_tile']=tile;return ob
 def text(name,body,p,size=.8,yaw=0):
  cu=bpy.data.curves.new(name,'FONT');cu.body=body;cu.size=size;cu.align_x='CENTER';cu.extrude=.001;ob=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(ob);ob.location=rv(p);ob.rotation_euler=(math.pi/2,0,yaw);bpy.context.view_layer.objects.active=ob;bpy.ops.object.select_all(action='DESELECT');ob.select_set(True);bpy.ops.object.convert(target='MESH');ob=bpy.context.object;ob.data.materials.append(paint);objects.append(ob);return ob
 def palm(name,x,z,height=8,lean=.8,phase=0):
  v=[];f=[];rings=10;sides=7
  for i in range(rings):
   t=i/(rings-1);p=Vector((x+lean*t*t,height*t,z+.22*math.sin(t*2)));r=.18*(1-.55*t)
   for j in range(sides):v.append(rv(p+Vector((r*math.cos(j*math.tau/sides),0,r*math.sin(j*math.tau/sides)))))
  for i in range(rings-1):
   for j in range(sides):f.append((i*sides+j,i*sides+(j+1)%sides,(i+1)*sides+(j+1)%sides,(i+1)*sides+j))
  ob=mesh(name+'_tapered_trunk',v,f,kit);ob['atlas_tile']=3
  top=Vector((x+lean,height,z+.22*math.sin(2)));v=[];f=[]
  for j in range(10):
   a=phase+j*math.tau/10;direction=Vector((math.cos(a),0,math.sin(a)));side=Vector((-math.sin(a),0,math.cos(a)));length=3.4+(j%3)*.35
   # Swept midrib and paired folded leaflets create open, recognisable fronds.
   for k in range(8):
    t=(k+.4)/8;p=top+direction*(length*t)+Vector((0,.65*math.sin(t*math.pi)-1.4*t*t,0));q=top+direction*(length*(t+.08))+Vector((0,.65*math.sin((t+.08)*math.pi)-1.4*(t+.08)**2,0));width=.72*math.sin(math.pi*t)*(.85 if j%2 else 1)
    for sg in [-1,1]:
     off=len(v);v.extend([rv(p),rv(p+side*width*sg-direction*.15+Vector((0,-.14,0))),rv(q+side*width*.65*sg-direction*.06+Vector((0,-.18,0))),rv(q)]);f.append((off,off+1,off+2,off+3))
  ob=mesh(name+'_folded_fronds',v,f,kit);ob['atlas_tile']=4;kit.use_backface_culling=False
 # Protected waterfront promenade: modules behind existing road barrier, no drive corridor intrusion.
 for i,z in enumerate(range(-224,33,8)):
  box(f'Quay_paving_{i}',[-20,.075,z],[15,.15,8],m=concrete)
  box(f'Quay_coping_{i}',[-28,.0,z],[.70,.65,8],m=concrete,collision=True)
  for dz in [-3.5,3.5]:line(f'Quay_rail_post_{i}_{dz}',[-27.5,.12,z+dz],[-27.5,1.13,z+dz],.045)
  for h in [.65,1.12]:line(f'Quay_rail_{i}_{h}',[-27.5,h,z-4],[-27.5,h,z+4],.035)
 for i,z in enumerate([-15,-75,-135,-195]):
  for j,x in enumerate(range(-32,-86,-6)):
   box(f'Dock_plank_module_{i}_{j}',[x,-.05,z],[6,.28,6],3,collision=False)
   for sign in [-1,1]:line(f'Dock_pile_{i}_{j}_{sign}',[x,-.65,z+sign*2.7],[x,.70,z+sign*2.7],.13,3)
  # Low authored mooring bollards, direct human-scale detail visible from waterfront.
  for x in [-36,-54,-72]:line(f'Mooring_bollard_{i}_{x}',[x,.12,z+2.1],[x,.52,z+2.1],.13,1);line(f'Mooring_crossbar_{i}_{x}',[x-.25,.46,z+2.1],[x+.25,.46,z+2.1],.065,1)
 # Modest original hulls (no detailed yacht fleet), with sheer/raked bow instead of rectangular boats.
 for i,(x,z) in enumerate([(-43,-23),(-61,-84),(-47,-143),(-69,-202)]):
  v=[];f=[];rows=[(-3,.2,.15),(-2.4,.85,.38),(0,1.05,.42),(2.4,.68,.52),(3.5,.04,.72)]
  for zz,w,h in rows:
   for xx,yy in [(-w,h),(-w*.76,-.12),(w*.76,-.12),(w,h)]:v.append(rv((x+xx,yy,z+zz)))
  for j in range(len(rows)-1):
   for k in range(3):a=j*4+k;f.append((a,a+1,a+5,a+4))
  f.extend([(0,3,2,1),(16,17,18,19)]);ob=mesh(f'Marina_skiff_hull_{i}',v,f,paint)
  box(f'Skiff_cockpit_{i}',[x,.45,z],[1.35,.20,3.5],m=dark);box(f'Skiff_console_{i}',[x,.84,z+.45],[.72,.62,.7],m=paint);box(f'Skiff_outboard_{i}',[x,.24,z-3.1],[.55,.8,.40],m=dark)
 def warehouse(name,x,z,w,l,h,kind=0):
  # Concrete plinth, framed bays, pitched roof and offset loading canopy.
  box(name+'_body',[x,h*.5,z],[w,h,l],0,collision=True)
  box(name+'_plinth',[x,.30,z],[w+.35,.6,l+.35],m=concrete)
  for side in [-1,1]:
   for j in range(max(1,round(l/6))):
    zz=z-l/2+(j+.5)*l/max(1,round(l/6));box(f'{name}_side_panel_{side}_{j}',[x+side*(w/2+.04),h*.54,zz],[.09,h*.88,l/max(1,round(l/6))-.07],0)
    box(f'{name}_clerestory_{side}_{j}',[x+side*(w/2+.10),h*.78,zz],[.05,h*.16,3.4],7)
   for j in range(0,int(l)+1,6):line(f'{name}_column_{side}_{j}',[x+side*w/2,.6,z-l/2+j],[x+side*w/2,h,z-l/2+j],.10,1)
  rise=2.4 if kind!=1 else .8
  for j in range(max(1,round(l/6))):
   za=z-l/2+j*l/max(1,round(l/6));zb=z-l/2+(j+1)*l/max(1,round(l/6))
   for s in [-1,1]:
    v=[rv(p)for p in [(x,h+rise,za-.3),(x+s*(w/2+.75),h,za-.3),(x+s*(w/2+.75),h,zb+.3),(x,h+rise,zb+.3)]];ob=mesh(f'{name}_roof_{s}_{j}',v,[(0,1,2,3)],kit);ob['atlas_tile']=1
  for side in [-1,1]:
   zz=z+side*(l/2+.08);ob=mesh(f'{name}_gable_{side}',[rv(p)for p in [(x-w/2,h,zz),(x+w/2,h,zz),(x,h+rise,zz)]],[(0,1,2)],kit);ob['atlas_tile']=0
   box(f'{name}_door_recess_{side}',[x,2.2,zz+side*.02],[w*.42,4.4,.12],m=dark)
   for j in range(9):box(f'{name}_roller_door_{side}_{j}',[x,.34+j*.45,zz+side*.09],[w*.37,.415,.10],1)
   box(f'{name}_door_header_{side}',[x,4.65,zz+side*.1],[w*.48,.28,.25],2)
  box(name+'_loading_apron',[x,.08,z+l/2+5],[w+8,.16,10],m=concrete)
  # Canopy projects over loading access; building blocker encloses main volume only.
  box(name+'_loading_canopy',[x,4.8,z+l/2+2.6],[w*.7,.22,5.4],1)
  for s in [-1,1]:line(name+'_canopy_post_'+str(s),[x+s*w*.32,0,z+l/2+4.6],[x+s*w*.32,4.8,z+l/2+4.6],.10,1)
  text(name+'_identity',name.replace('_',' ').upper(),[x,5.1,z+l/2+.17],.8)
 for args in [('Harbor_works',82,-150,28,46,8,0),('Marine_service',126,-46,27,34,7,1),('Shakedown_paddock',104,63,34,30,6,2),('Cold_storage',335,-210,34,54,10,0),('Dock_supply',343,38,30,44,8,1),('Port_logistics',105,-328,42,32,9,0)]:warehouse(*args)
 # Containers and loading stacks enrich both sides of the industrial return.
 for i,(x,z) in enumerate([(74,-193),(110,-192),(161,-15),(163,12),(325,-130),(349,-121),(320,92),(362,93),(155,-318)]):
  for k in range(2 if i%3==0 else 1):
   tile=2 if(i+k)%3==0 else 1;box(f'Freight_container_{i}_{k}',[x,1.35+k*2.6,z],[6.1,2.6,2.45],tile,collision=True)
   for j in range(13):box(f'Container_rib_{i}_{k}_{j}',[x-3+j*.5,1.35+k*2.6,z-1.245],[.045,2.46,.045],tile)
 # Repeated lamps around the entire route: runtime pools a few real lights from these targets.
 for i in range(math.ceil(route['length']/32)):
  p,t=ctx['at'](route['length']*i/math.ceil(route['length']/32));normal=Vector((-t.y,t.x));sgn=1 if i%2 else -1;q=p+normal*(12.3*sgn);top=[q.x,7.1,q.y];aim=p+normal*(2.0*sgn);head=[q.x-normal.x*sgn*2.5,7.1,q.y-normal.y*sgn*2.5]
  line(f'Lamp_tapered_mast_{i}',[q.x,0,q.y],top,.075,1);line(f'Lamp_outreach_{i}',[q.x,6.55,q.y],head,.055,1);box(f'Lamp_hood_{i}',head,[.72,.20,1.25],1,yaw=math.atan2(t.x,t.y));box(f'Lamp_diffuser_{i}',[head[0],head[1]-.115,head[2]],[.53,.025,.92],m=emit,yaw=math.atan2(t.x,t.y));route['lamps'].append(dict(position=[head[0],6.98,head[2]],target=[aim.x,0,aim.y]));box(f'Lamp_base_{i}',[q.x,.2,q.y],[.48,.4,.48],m=concrete,collision=True)
 # Primary promenade palms; then balanced outside/inside route planting for coherent backside.
 for i,z in enumerate(range(-215,31,24)):palm('Promenade_palm_'+str(i),-18,z,7.5+(i%3)*.6,.8,phase=i*.4)
 for i in range(0,math.ceil(route['length']/25)):
  p,t=ctx['at'](route['length']*i/math.ceil(route['length']/25));normal=Vector((-t.y,t.x));sgn=1 if i%3 else -1;q=p+normal*(18+3*(i%3))*sgn
  if q.x<-24:continue
  palm('Circuit_palm_'+str(i),q.x,q.y,7+(i%4)*.6,(-1 if i%2 else 1)*.7,phase=i*.7)
 # Welded-mesh service fencing, set back from the route behind barriers.
 for name,x,z0,z1 in [('West_paddock_fence',42,-190,95),('East_service_fence',309,-260,130)]:
  for j in range(math.ceil((z1-z0)/5)):
   za=z0+j*5;zb=min(z1,za+5);line(name+'_post'+str(j),[x,0,za],[x,2.3,za],.045,1)
   for h in [.35,1.2,2.2]:line(name+f'_rail{j}_{h}',[x,h,za],[x,h,zb],.017,1)
   for k in range(9):
    zz=za+k*.55;line(name+f'_mesh{j}_{k}',[x,.2,zz],[x,2.15,min(zb,zz+1.3)],.007,1,segments=4)
 # Venue identity and practical braking chevrons use actual mesh lettering/signs.
 box('Start_identity_panel',[17,2.4,-11],[.18,3.3,10],1)
 # Surface-facing lettering is placed beside the start, no floating logo above the course.
 for i,(distance,label)in enumerate([(205,'BRAKE'),(710,'100'),(745,'50')]):
  p,t=ctx['at'](distance);normal=Vector((-t.y,t.x));q=p+normal*12.0;box(f'Brake_sign_panel_{i}',[q.x,1.7,q.y],[2.6,1.25,.15],2,yaw=math.atan2(-t.x,-t.y));line(f'Brake_sign_post_{i}',[q.x,0,q.y],[q.x,1.1,q.y],.05,1);text(f'Brake_sign_text_{i}',label,[q.x,1.5,q.y-.10],.55,yaw=math.atan2(-t.x,-t.y))
 text('Start_identity_text','BISCAYNE HARBOR',[16.895,2.6,-11],1.0,yaw=-math.pi/2)
 # Road paint arrows and compact numbered gate boards identify the ordered route.
 for i,g in enumerate(route['checkpoints']):
  p=Vector((g['x'],g['z']));t=Vector((g['dx'],g['dz']));normal=Vector((-t.y,t.x));q=p-t*8
  local=[(-.19,-1.4),(.19,-1.4),(.19,.35),(.60,.35),(0,1.5),(-.60,.35),(-.19,.35)]
  v=[rv((q.x+normal.x*x+t.x*z,.009,q.y+normal.y*x+t.y*z))for x,z in local];mesh(f'Road_direction_arrow_{i}',v,[tuple(range(7))],paint)
  for sg in [-1,1]:
   board=p+normal*10.5*sg;box(f'Gate_marker_{i}_{sg}',[board.x,.6,board.y],[.55,1.2,.32],2,yaw=math.atan2(t.x,t.y))
 # Assign atlas tiles only after all editable module geometry exists.
 for ob in objects:
  if ob.type!='MESH' or not len(ob.data.materials):continue
  if ob.data.materials[0]==kit:
   uv=ob.data.uv_layers.active or ob.data.uv_layers.new(name='UVMap');tile=int(ob.get('atlas_tile',0));tx=tile%4;ty=tile//4
   for poly in ob.data.polygons:
    normal=poly.normal;axis=max(range(3),key=lambda k:abs(normal[k]));axes=[k for k in range(3)if k!=axis];coords=[ob.data.vertices[ob.data.loops[li].vertex_index].co for li in poly.loop_indices];mins=[min(p[a]for p in coords)for a in axes];maxs=[max(p[a]for p in coords)for a in axes]
    for li,p in zip(poly.loop_indices,coords):
     u=(p[axes[0]]-mins[0])/max(.001,maxs[0]-mins[0]);v=(p[axes[1]]-mins[1])/max(.001,maxs[1]-mins[1]);uv.data[li].uv=((tx+.025+.95*u)/4,(ty+.02+.96*v)/2)
 from harbor_materials import author_materials
 author_materials(P,{'asphalt':(ctx['asphalt'],'asphalt'),'concrete':(concrete,'concrete'),'kit':(kit,'harbor')})
 # Same atlas/maps and geometry, separate shadow-policy groups for large receiving surfaces.
 landmat=kit.copy();landmat.name='Harbor_Land';watermat=kit.copy();watermat.name='Harbor_Water'
 land.data.materials[0]=landmat;water.data.materials[0]=watermat
 (O/'route.json').write_text(json.dumps(route,indent=2))
 return [kit,dark,emit,landmat,watermat]
