import bpy,json,pathlib,math
from mathutils import Vector
from mathutils.bvhtree import BVHTree
R=pathlib.Path(__file__).resolve().parents[2];bpy.ops.wm.open_mainfile(filepath=str(R/'.tools/spyder/Spyder-Game-Master.blend'))
dep=bpy.context.evaluated_depsgraph_get();ob=bpy.data.objects['spyder_front_left_spin_mesh'];tree=BVHTree.FromObject(ob,dep)
def v(p):return Vector((p[0],-p[2],p[1]))
rows=[]
for x in [.55,.565,.58,.595,.61,.625,.64,.655,.67,.685,.70,.715,.73,.745,.76]:
 for r in [.16,.175,.188,.20,.212,.224]:
  samples=[tree.find_nearest(ob.matrix_world.inverted()@v((-x,.32355+r*math.sin(j*math.pi/90),-.85455+r*math.cos(j*math.pi/90))))[3] for j in range(180)]
  rows.append({'x':x,'radius':r,'clearanceToSpin':min(samples)-.007})
(R/'.tools/spyder/ring-clearance-search.json').write_text(json.dumps(rows,indent=2));print('CLEAR',json.dumps([x for x in rows if x['clearanceToSpin']>.007]),flush=True)
