import bpy,pathlib,json
from mathutils import Vector
P=pathlib.Path(__file__).resolve().parents[1];bpy.ops.wm.open_mainfile(filepath=str(P/'assets/blender/vehicles/slingshot-p03a.blend'))
loc=Vector((-1.4,-2.3,2.4));q=(Vector((-.15,.05,.7))-loc).to_track_quat('-Z','Y');right=q@Vector((1,0,0));up=q@Vector((0,1,0));direction=q@Vector((0,0,-1));dg=bpy.context.evaluated_depsgraph_get();out=[]
for px,py in [(637,350),(630,344),(778,303),(767,304),(645,344),(790,295),(625,360)]:
 origin=loc+right*((px/1400-.5)*2.3)+up*((.5-py/900)*2.3*900/1400);hit,p,n,idx,obj,m=bpy.context.scene.ray_cast(dg,origin,direction)
 out.append({'pixel':[px,py],'object':obj.name if obj else None,'hit':list(p),'face':idx})
(P/'director-kit/production/evidence/P03A/artist/cowl-ray-probe.json').write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2))
