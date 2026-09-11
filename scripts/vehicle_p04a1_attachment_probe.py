import pathlib,sys,json
sys.path.insert(0,str(pathlib.Path('scripts').resolve()))
from vehicle_p04a1_validate import load,P,E
from mathutils import Vector
from mathutils.bvhtree import BVHTree
_,g,meshes=load(P/'public/assets/vehicles/slingshot-p04a1.glb');m=meshes['body_static__Textured_Polymer'];tree=BVHTree.FromPolygons([Vector(x)for x in m['v']],m['f'].tolist(),all_triangles=True)
for x in [.245,.315]:
 hit=tree.ray_cast(Vector((x,.70,1.025)),Vector((0,1,0)),.3);print('DECK',x,list(hit[0]) if hit[0] else None,'bracketTopY=.874')
