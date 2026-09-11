import bpy,pathlib,json
P=pathlib.Path(__file__).resolve().parents[1];bpy.ops.wm.open_mainfile(filepath=str(P/'assets/blender/vehicles/slingshot-p03a.blend'))
dg=bpy.context.evaluated_depsgraph_get();rows=[]
for o in bpy.data.objects:
 if o.type not in {'MESH','CURVE'}:continue
 ev=o.evaluated_get(dg);me=ev.to_mesh();v=[o.matrix_world@v.co for v in me.vertices]
 if v:
  bounds=[[min(p[k] for p in v),max(p[k] for p in v)] for k in range(3)]
  if any(abs(a)>4 for b in bounds for a in b):rows.append({'object':o.name,'evaluatedBounds':bounds,'modifiers':[m.name+':'+m.type for m in o.modifiers]})
 ev.to_mesh_clear()
o=bpy.data.objects['windshield_cowl_bridge'];o.modifiers[0].use_even_offset=False;bpy.context.view_layer.update();ev=o.evaluated_get(bpy.context.evaluated_depsgraph_get());me=ev.to_mesh();v=[o.matrix_world@p.co for p in me.vertices];ablation=[[min(p[k]for p in v),max(p[k]for p in v)]for k in range(3)];ev.to_mesh_clear()
r={'offenders':rows,'same_source_only_even_offset_disabled_bounds':ablation}
(P/'director-kit/production/evidence/P03A/artist/revision04-failed/offending-source.json').write_text(json.dumps(r,indent=2));print(json.dumps(r,indent=2))
