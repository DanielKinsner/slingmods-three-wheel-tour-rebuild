import bpy, sys, pathlib, json, os, numpy as np
from mathutils import Matrix, Vector
sys.path.insert(0,str(pathlib.Path(__file__).parent));from render import studio
out=pathlib.Path(sys.argv[sys.argv.index('--')+1])
objs=[o for o in bpy.data.objects if o.type=='MESH']
def bounds(o):
 a=np.array([o.matrix_world@v.co for v in o.data.vertices]);return a.min(axis=0),a.max(axis=0)
centers={i:(sum(bounds(bpy.data.objects[f'Part___{i}']))/2) for i in (1,2,3)}
scale=1.709/(centers[3][1]-(centers[1][1]+centers[2][1])/2)
mid=(centers[3][1]+(centers[1][1]+centers[2][1])/2)/2;ground=min(bounds(o)[0][2] for o in objs)
transform=Matrix.Diagonal(Vector((-scale,-scale,scale,1)))@Matrix.Translation(Vector((0,-mid,-ground)))
for o in objs:o.data.transform(transform@o.matrix_world);o.matrix_world=Matrix.Identity(4)
for o in list(bpy.data.objects):
 if o.type!='MESH':bpy.data.objects.remove(o,do_unlink=True)
for m in bpy.data.materials:
 m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF')
 if p:
  p.inputs['Base Color'].default_value=m.diffuse_color;p.inputs['Roughness'].default_value=.4;p.inputs['Metallic'].default_value=.7 if any(s in m.name.lower() for s in ('metal','steel','chrome','brass')) else 0
report={'scale':scale,'source_y_mid':mid,'source_ground':ground,'matrix':[list(row) for row in transform],'wheel_centers_source':{str(k):v.tolist() for k,v in centers.items()},'wheel_centers_blender':{str(k):list(transform@Vector(v)) for k,v in centers.items()}}
(out/'transform.json').write_text(json.dumps(report,indent=2));bpy.ops.wm.save_as_mainfile(filepath=str(out/'source-normalized.blend'))
if os.environ.get('RYKER_SKIP_RENDERS')!='1':studio(out/'renders','source-pbr');studio(out/'renders','source-clay',True)
