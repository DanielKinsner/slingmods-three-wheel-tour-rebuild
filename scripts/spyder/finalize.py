import bpy,pathlib,json,math
R=pathlib.Path(__file__).resolve().parents[2];bpy.ops.wm.open_mainfile(filepath=str(R/'.tools/spyder/Spyder-Game-Master.blend'))
# The donor glass winding faces forward; the rider sees the rear face. Preserve every
# vertex while orienting its optical surface toward the seated rider, exactly once.
glass=bpy.data.objects.get('Mirrors_1')
if glass:glass['mirrorOpticalTilt']=0
if glass and not glass.get('spyderMirrorFacingCorrected'):
 import bmesh
 bm=bmesh.new();bm.from_mesh(glass.data);bmesh.ops.reverse_faces(bm,faces=list(bm.faces));bm.to_mesh(glass.data);bm.free();glass.data.update();glass['spyderMirrorFacingCorrected']=True
for ob in bpy.context.scene.objects:
 if ob.type=='MESH' and ob.get('spyderMotion',{}).get('kind')=='link':del ob['spyderMotion']
for m in bpy.data.materials:
 if m.name in ['white_bump_glass','orange_rear_glass'] and m.get('vehicleRole') in ['headlamp','running-brake']:del m['vehicleRole']
head=bpy.data.materials['_323'].copy();head.name='Spyder native headlamp lens';head['vehicleRole']='headlamp'
tail=bpy.data.materials['orange_rear_glass'].copy();tail.name='Spyder native tail lens';tail['vehicleRole']='running-brake'
gauge=bpy.data.materials.get('Spyder native gauge glass') or bpy.data.materials['_323'].copy();gauge.name='Spyder native gauge glass'
bs=gauge.node_tree.nodes.get('Principled BSDF');bs.inputs['Metallic'].default_value=0;bs.inputs['Roughness'].default_value=.16;bs.inputs['Alpha'].default_value=.12;gauge.diffuse_color=(.72,.79,.84,.12)
gauge.surface_render_method='DITHERED'
screen=bpy.data.objects['instrument_screen'];screen.location=(0,.53,.997)
# Small original SIM faces cover the donor's static photographed needles in game.
# Purchased geometry/art remains below these additive, removable overlays.
for side,name in [(-1,'spyder_speed_dial'),(1,'spyder_rpm_dial')]:
 if bpy.data.objects.get(name):continue
 bpy.ops.mesh.primitive_circle_add(vertices=64,radius=.037,fill_type='NGON',location=(side*.066,.572,1.030))
 face=bpy.context.object;face.name=name;face.rotation_euler=(math.radians(65),0,0);face.parent=bpy.data.objects['spyder_foundation']
 layer=face.data.uv_layers.new(name='SIM planar UV')
 for p in face.data.polygons:
  for li in p.loop_indices:
   co=face.data.vertices[face.data.loops[li].vertex_index].co;layer.data[li].uv=(co.x/.074+.5,co.y/.074+.5)
for ob in bpy.context.scene.objects:
 if ob.type!='MESH':continue
 slots={}
 for p in ob.data.polygons:
  mat=ob.data.materials[p.material_index] if len(ob.data.materials) else None
  if not mat:continue
  at=ob.matrix_world@p.center;role=head if mat.name=='_323' and .74<at.z<.86 and .08<abs(at.x)<.23 and -at.y<-.79 else tail if mat.name=='orange_rear_glass' and -at.y>.70 else gauge if mat.name=='_323' and .97<at.z<1.08 and abs(at.x)<.14 and -.63<-at.y<-.54 else None
  if role:
   if role.name not in slots:slots[role.name]=len(ob.data.materials);ob.data.materials.append(role)
   p.material_index=slots[role.name]
bpy.ops.wm.save_as_mainfile(filepath=str(R/'.tools/spyder/Spyder-Game-Master.blend'))
bpy.ops.export_scene.gltf(filepath=str(R/'public/assets/spyder/spyder-f3.glb'),export_format='GLB',export_yup=True,export_extras=True,export_cameras=False,export_lights=False)
manifest=json.loads((R/'public/assets/spyder/manifest.json').read_text());triangles=0
for ob in bpy.context.scene.objects:
 if ob.type=='MESH':ob.data.calc_loop_triangles();triangles+=len(ob.data.loop_triangles)
manifest['triangles']=triangles;manifest['instrumentation']='Additive original SIM speed/RPM faces and LCD; original purchased dial art retained beneath overlays.'
(R/'public/assets/spyder/manifest.json').write_text(json.dumps(manifest,indent=2))
