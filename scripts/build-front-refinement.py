"""Owner-directed front fascia refinement. Background Blender; preserve reviewed originals."""
import bpy,runpy,json,hashlib,math
from pathlib import Path
P=Path(__file__).resolve().parents[1]
H=runpy.run_path(str(P/'scripts/build-p08b-art.py'))
A=P/'assets/blender/front-refinement';O=P/'public/assets/front-refinement';E=P/'director-kit/production/evidence/Front-Refinement'
for p in [A,O,E]:p.mkdir(parents=True,exist_ok=True)
source=P/'assets/blender/p08b/slingshot-signature.blend'
bpy.ops.wm.open_mainfile(filepath=str(source))
def digest(o):
 return hashlib.sha256(repr(([tuple(v.co)for v in o.data.vertices],[tuple(f.vertices)for f in o.data.polygons],list(map(tuple,o.matrix_world)),[m.name for m in o.data.materials])).encode()).hexdigest()
before={o.name:digest(o)for o in bpy.data.objects if o.type=='MESH'}
body=bpy.data.objects['body_static'];black=bpy.data.materials['P03A_Textured_Polymer'];lens=bpy.data.materials['P03A_Optical_Lens']
removed=[];changed=[]
for o in list(bpy.data.objects):
 if o.name.startswith('P03A1_grille_inset_slat') or o.name.startswith('lights_head_upper_') and any(n in o.name for n in ['projector_eye','reflector_cell']):
  removed.append(o.name);bpy.data.objects.remove(o,do_unlink=True)
for side in ['left','right']:
 o=bpy.data.objects['lights_head_upper_'+side+'_clear_cover'];o.data.materials.clear();o.data.materials.append(lens);changed.append(o.name)
 # The diffuser occupies the existing fitted lens envelope; no discrete bulbs under it.
 o['owner_refinement']='Continuous opaque optical diffuser; original center lamp unchanged'
def solid(name,points,depth=.035):
 return H['prism'](name,[(x,z,-y)for x,y,z in points],depth,2,black,body)
for s,side in [(-1,'left'),(1,'right')]:
 # Follow the brow, lamp pod, painted cheek and lower ledge. Existing black sockets
 # remain proud of this recessed solid backing; the front suspension stays behind it.
 solid('front_fascia_closed_return_'+side,[(s*x,y,z)for x,y,z in [
  (.292,2.024,.520),(.482,2.037,.578),(.615,2.020,.512),(.902,1.943,.593),
  (.902,1.943,.305),(.862,1.966,.272),(.687,2.008,.263),(.542,2.031,.260),(.402,2.037,.442)]],.045)
 # Fill the previously see-through shelf between grille, cheek and lower splitter.
 solid('front_lower_airdam_'+side,[(s*x,y,z)for x,y,z in [
  (0,2.035,.302),(.398,2.035,.302),(.547,2.020,.186),(.885,1.950,.222),
  (.937,1.940,.200),(.867,2.040,.175),(.493,2.100,.171),(.273,2.084,.233),(0,2.084,.233)]],.062)
 # An actual top return closes the line of sight down into the chassis.
 solid('front_splitter_shelf_'+side,[(s*x,y,z)for x,y,z in [
  (0,2.075,.232),(.275,2.075,.232),(.493,2.093,.174),(.882,2.025,.178),
  (.870,1.918,.232),(.480,1.955,.282),(0,1.973,.288)]],.020)
# Recessed center cavity wall closes the oblique see-through beneath the existing
# untouched center lamp. This is housing geometry, not a change to its optics.
solid('front_center_cavity_return',[(-.29,1.885,.66),(.29,1.885,.66),(.31,1.885,.46),(-.31,1.885,.46)],.022)
# Pointy-top hexagonal cells, shared edges deduplicated. Deep square-section ribs
# have real holes and sidewalls; existing recessed backing remains behind the mesh.
verts=[];faces=[];edges=set();radius=.014;pitch=math.sqrt(3)*radius;cells=0
for row in range(10):
 z=.310+row*radius*1.5
 for col in range(-18,19):
  x=(col+(row%2)*.5)*pitch
  pts=[(x+radius*math.cos(math.radians(30+60*i)),z+radius*math.sin(math.radians(30+60*i)))for i in range(6)]
  if not all(.295<=zz<=.473 and abs(xx)<.267+(.479-zz)/.189*.115-.009 for xx,zz in pts):continue
  cells+=1
  for a,b in zip(pts,pts[1:]+pts[:1]):
   key=tuple(sorted((tuple(round(v,6)for v in a),tuple(round(v,6)for v in b))))
   if key in edges:continue
   edges.add(key);dx,dz=b[0]-a[0],b[1]-a[1];length=math.hypot(dx,dz);nx,nz=-dz/length*.0015,dx/length*.0015;n=len(verts)
   for y in [2.033,2.020]:
    for xx,zz in [(a[0]+nx,a[1]+nz),(b[0]+nx,b[1]+nz),(b[0]-nx,b[1]-nz),(a[0]-nx,a[1]-nz)]:verts.append((xx,zz,-y))
   faces.extend(tuple(n+i for i in f)for f in [(0,1,2,3),(7,6,5,4),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)])
H['mesh']('front_honeycomb_open_mesh',verts,faces,black,body)
after={o.name:digest(o)for o in bpy.data.objects if o.type=='MESH'}
preserved=[n for n,h in before.items() if n not in removed+changed and after.get(n)==h]
assert len(preserved)==len(before)-len(removed)-len(changed),'Non-target geometry changed'
assert all(after[n]==h for n,h in before.items() if 'center_lamp' in n or 'central_lamp' in n or 'lights_head_center' in n)
binds={o.name for o in bpy.data.objects if o.type=='EMPTY'}
H['batch_and_export'].__globals__.update({'A':A,'O':O})
report=H['batch_and_export']('slingshot-front-refined',binds)
preserve=runpy.run_path(str(P/'scripts/preserve-front-runtime.py'))['preserve_runtime']
report.update(preserve(P/'public/assets/p08b/slingshot-signature.glb',O/'slingshot-front-refined.glb'))
report.update({'source':str(source.relative_to(P)),'sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'removed':removed,'materialOnly':changed,'preservedOriginalMeshes':len(preserved),'allOtherOriginalMeshesUnchanged':True,'honeycombCells':cells,'honeycombUniqueRibs':len(edges),'centerLampUnchanged':True,'method':'Named bounded solid fascia additions; continuous upper optical diffuser; existing lower continuous lenses retained; open geometric hex ribs. No physics/collision edits. Photo-estimated shapes, not OEM CAD.'})
(E/'build.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
