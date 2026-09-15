import bpy,bmesh,json,math
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parents[1];E=P/'director-kit/production/evidence/P08B/art';E.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(P/'assets/blender/vehicles/slingshot-p04a1.blend'))
rows=[]
for o in bpy.data.objects:
 if o.type!='MESH':continue
 ev=o.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh();bm=bmesh.new();bm.from_mesh(m);v=[o.matrix_world@x.co for x in m.vertices];rows.append({'name':o.name,'materials':[x.name for x in m.materials],'boundaryEdges':sum(x.is_boundary for x in bm.edges),'vertices':len(v),'bounds':[[min(x[i] for x in v),max(x[i] for x in v)] for i in range(3)] if v else [],'modifiers':[x.type for x in o.modifiers]});bm.free();ev.to_mesh_clear()
(E/'vehicle-before-inventory.json').write_text(json.dumps(rows,indent=2))
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=24;s.render.resolution_x=1280;s.render.resolution_y=850;s.render.resolution_percentage=100;s.world.color=(.22,.22,.22)
for loc,power,size in [((2,4,5),1700,5),((-4,1,3),1300,4),((1,-4,4),1800,4)]:
 bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.data.energy=power;l.data.shape='DISK';l.data.size=size;l.rotation_euler=(Vector((0,0,.6))-l.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;s.camera=cam;cam.data.lens=48
for name,pos,target in [('threequarter',(3.6,5,2.5),(0,0,.5)),('rear',(3,-4,2),(0,-.5,.6)),('low',(3,4,.3),(0,0,.4)),('cockpit',(1.8,1.6,2.5),(0,-.3,.6))]:
 cam.location=pos;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(E/('vehicle-before-'+name+'.png'));bpy.ops.render.render(write_still=True)
