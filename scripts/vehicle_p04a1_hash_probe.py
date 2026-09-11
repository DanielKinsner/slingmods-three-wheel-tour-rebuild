import bpy,pathlib,json,hashlib,struct
P=pathlib.Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(P/'assets/blender/vehicles/slingshot-p03a2.blend'))
o=bpy.data.objects['autodrive_console_shell']
print('MODIFIERS',[(m.name,m.type,str(getattr(m,'object',None)))for m in o.modifiers])
for step in range(2):
 if step:bpy.context.view_layer.update()
 ev=o.evaluated_get(bpy.context.evaluated_depsgraph_get());me=ev.to_mesh();me.calc_loop_triangles();h=hashlib.sha256()
 for v in me.vertices:h.update(struct.pack('<3f',*v.co))
 for t in me.loop_triangles:h.update(struct.pack('<3I',*t.vertices))
 for layer in me.uv_layers:
  for a in layer.data:h.update(struct.pack('<2f',*a.uv))
 print('BASE',step,len(me.vertices),len(me.loop_triangles),h.hexdigest());ev.to_mesh_clear()
