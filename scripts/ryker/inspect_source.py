import bpy, json, sys, pathlib, numpy as np
from mathutils import Vector
out=pathlib.Path(sys.argv[sys.argv.index('--')+1]); out.mkdir(parents=True,exist_ok=True)
report={'blender':bpy.app.version_string,'units':bpy.context.scene.unit_settings.system,'scale_length':bpy.context.scene.unit_settings.scale_length,'objects':[],'images':[{'name':i.name,'path':i.filepath,'source':i.source} for i in bpy.data.images]}
for o in bpy.data.objects:
 if o.type!='MESH': continue
 m=o.data; m.calc_loop_triangles(); co=np.array([o.matrix_world@v.co for v in m.vertices]); used=sorted(set(p.material_index for p in m.polygons))
 report['objects'].append({'name':o.name,'vertices':len(m.vertices),'polygons':len(m.polygons),'triangles':len(m.loop_triangles),'bounds':[co.min(axis=0).tolist(),co.max(axis=0).tolist()],'origin':list(o.location),'modifiers':[x.type for x in o.modifiers],'materials':[{'slot':i,'name':o.material_slots[i].name,'color':list(o.material_slots[i].material.diffuse_color)} for i in used],'uv_layers':len(m.uv_layers)})
report['materials']=[{'name':m.name,'diffuse':list(m.diffuse_color),'nodes':[{'name':n.name,'type':n.type, 'inputs':{i.name:list(i.default_value) if hasattr(i.default_value,'__len__') else i.default_value for i in n.inputs if hasattr(i,'default_value') and i.type in ['VALUE','RGBA']}} for n in m.node_tree.nodes] if m.node_tree else []} for m in bpy.data.materials]
(out/'source-inspection.json').write_text(json.dumps(report,indent=2));print(json.dumps(report['objects'],indent=2))
