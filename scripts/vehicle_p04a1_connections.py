import pathlib,sys,json,hashlib,numpy as np
sys.path.insert(0,str(pathlib.Path('scripts').resolve()))
from vehicle_p04a1_validate import load,P,E
from mathutils import Vector
from mathutils.bvhtree import BVHTree
raw,g,meshes=load(P/'public/assets/vehicles/slingshot-p04a1.glb');cfg=json.loads((P/'public/assets/vehicles/slingshot-p04a1-rear-rig.json').read_text())
def tree(n):
 m=meshes[n];return BVHTree.FromPolygons([Vector(x)for x in m['v']],m['f'].tolist(),all_triangles=True)
fixed=tree('rear_body_static__Machined_Aluminum');deck=tree('body_static__Textured_Polymer');lower=tree('rear_arm_visual__Machined_Aluminum');r={'glbSha256':hashlib.sha256(raw).hexdigest(),'method':'Actual exported mesh ray intersections along pins and bracket/deck support columns; conceptual hardpoints remain author estimates','pins':[],'upperBracketDeck':[]}
for name,point,t,extent in [('upperShock',cfg['shockUpper'],fixed,[.228,.332]),('lowerShock',cfg['shockLower'],lower,[.23,.33]),('armPivot',cfg['armPivot'],fixed,[.16,.40])]:
 a=t.ray_cast(Vector((.1,point[1],point[2])),Vector((1,0,0)),.4);b=t.ray_cast(Vector((.5,point[1],point[2])),Vector((-1,0,0)),.4);assert a[0] and b[0],name;ends=[float(a[0].x),float(b[0].x)];assert abs(ends[0]-extent[0])<.001 and abs(ends[1]-extent[1])<.001,(name,ends);r['pins'].append({'name':name,'actualMeshAxialEnds':ends,'eyeOrPivotCenter':point,'connected':True})
for x in [.245,.315]:
 underside=deck.ray_cast(Vector((x,.7,1.025)),Vector((0,1,0)),.3)[0];top=fixed.ray_cast(Vector((x,1.,1.025)),Vector((0,-1,0)),.3)[0];assert underside and top and top.y>underside.y;r['upperBracketDeck'].append({'x':x,'actualBracketTopY':top.y,'actualDeckUndersideY':underside.y,'overlapM':top.y-underside.y})
# A conservative swept tire box contains every surface point for all intermediate travel/spin.
tire=meshes['rear_spin__Rubber'];lo=tire['v'].min(0);hi=tire['v'].max(0);lo[1]+=cfg['supportedHubY'][0]-cfg['wheelCenter'][1];hi[1]+=cfg['supportedHubY'][1]-cfg['wheelCenter'][1];lo-=1e-5;hi+=1e-5;candidates=[];minimum=99.
for n,m in meshes.items():
 if n.startswith(('rear_spin','rear_pulley_visual','rear_arm_visual','belt_visual','rear_axle_visual','rear_caliper_visual','shock_','front_','suspension_')):continue
 tri=m['v'][m['f']];gap=np.maximum(np.maximum(tri.min(1)-hi,lo-tri.max(1)),0);d=np.linalg.norm(gap,axis=1);minimum=min(minimum,float(d.min()))
 if (d==0).any():candidates.append({'name':n,'triangles':int((d==0).sum())})
r['conservativeContinuousTireEnvelope']={'min':lo.tolist(),'max':hi.tolist(),'fixedTriangleAabbCandidates':candidates,'minimumConservativeGapM':minimum,'note':'If zero candidates, every fixed triangle is separated from entire swept tire box, stronger than sampled tire-only overlaps. Does not certify full moving-mechanism continuous sweep.'};assert not candidates,candidates
(E/'geometry02-connections.json').write_text(json.dumps(r,indent=2));print(json.dumps(r,indent=2))
