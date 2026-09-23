import * as THREE from 'three';
import {RYKER_DEFINITION} from '../simulation/vehicle-definition';
import type {VehicleTelemetry} from '../simulation';
type Motion={kind:'shock'|'arm'|'carrier'|'rear-arm';channel:number;part?:string;upper?:number[];lower?:number[];pivot?:number[]};
/** Canonical vehicle-space mount transforms. Only spring coils deform axially. */
export class RykerLinkage {
 private bindings:{node:THREE.Object3D;meta:Motion;rest:THREE.Matrix4;parentInverse:THREE.Matrix4}[]=[];
 private seen=new WeakSet<THREE.Object3D>();private scanRevision=-1;private report:any[]=[];
 constructor(private car:THREE.Object3D){}
 private bind(){
  const root=this.car.parent??this.car,revision=Number(root.userData.rykerAssemblyRevision??0)+Number(this.car.userData.rykerAssemblyRevision??0);
  if(this.scanRevision===revision)return;this.scanRevision=revision;root.updateWorldMatrix(true,true);
  const inverse=this.car.matrixWorld.clone().invert();root.traverse(node=>{const meta=node.userData.rykerMotion as Motion|undefined;if(!meta||this.seen.has(node))return;this.seen.add(node);this.bindings.push({node,meta,rest:inverse.clone().multiply(node.matrixWorld),parentInverse:inverse.clone().multiply(node.parent!.matrixWorld).invert()});node.matrixAutoUpdate=false});
 }
 pose(t:VehicleTelemetry){this.bind();this.report=[];const moves=t.wheels.map((w,i)=>w.localCenter.y-RYKER_DEFINITION.layout.wheels[i].center[1]);
  const point=(p:number[])=>new THREE.Vector3().fromArray(p),pivotTransform=(pivot:THREE.Vector3,q:THREE.Quaternion)=>new THREE.Matrix4().makeTranslation(...pivot.toArray()).multiply(new THREE.Matrix4().makeRotationFromQuaternion(q)).multiply(new THREE.Matrix4().makeTranslation(-pivot.x,-pivot.y,-pivot.z));
  for(const b of this.bindings){const m=b.meta,dy=moves[m.channel],D=new THREE.Matrix4();
   if(m.kind==='shock'){
    const a=point(m.upper!),z=point(m.lower!),rest=z.clone().sub(a),end=z.clone();
    if(m.channel<2){const pivot=new THREE.Vector3(m.channel===0?-.177:.193,.222,-.855),angle=Math.asin(THREE.MathUtils.clamp(dy/(m.channel===0?-.343:.346),-.95,.95));end.sub(pivot).applyAxisAngle(new THREE.Vector3(0,0,1),angle).add(pivot)}
    else{const pivot=new THREE.Vector3(0,.285,.075);end.sub(pivot).applyAxisAngle(new THREE.Vector3(1,0,0),-Math.asin(THREE.MathUtils.clamp(dy/.7795,-.95,.95))).add(pivot)}
    const next=end.clone().sub(a),q=new THREE.Quaternion().setFromUnitVectors(rest.clone().normalize(),next.clone().normalize());
    if(m.part==='shaft'){D.makeTranslation(...end.toArray()).multiply(new THREE.Matrix4().makeRotationFromQuaternion(q)).multiply(new THREE.Matrix4().makeTranslation(-z.x,-z.y,-z.z))}
    else {D.copy(pivotTransform(a,q));if(m.part==='spring'){const align=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),rest.clone().normalize());const stretch=new THREE.Matrix4().makeTranslation(...a.toArray()).multiply(new THREE.Matrix4().makeRotationFromQuaternion(align)).multiply(new THREE.Matrix4().makeScale(1,next.length()/rest.length(),1)).multiply(new THREE.Matrix4().makeRotationFromQuaternion(align.clone().invert())).multiply(new THREE.Matrix4().makeTranslation(-a.x,-a.y,-a.z));D.multiply(stretch)}}
    this.report.push({node:b.node.name,channel:m.channel,part:m.part,upper:a.toArray(),lower:end.toArray(),length:next.length(),stroke:rest.length()-next.length()});
   }else if(m.kind==='carrier'){const p=point(RYKER_DEFINITION.layout.wheels[m.channel].center);D.makeTranslation(0,dy,0).multiply(pivotTransform(p,new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),t.wheels[m.channel].steer)))}
   else {const rear=m.kind==='rear-arm',pivot=point(m.pivot!),angle=rear?-Math.asin(THREE.MathUtils.clamp(dy/.7795,-.95,.95)):Math.asin(THREE.MathUtils.clamp(dy/(m.channel===0?-.343:.346),-.95,.95));D.copy(pivotTransform(pivot,new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(rear?1:0,0,rear?0:1),angle)))}
   b.node.matrix.copy(b.parentInverse).multiply(D).multiply(b.rest);b.node.matrixWorldNeedsUpdate=true;
  }
 }
 inspect(){return {movingGroups:this.bindings.length,shocks:this.report,method:'Individual carriers, wishbones and swingarm; fixed upper/lower shock mounts with rigid telescoping body/shaft and axial spring deformation.'}}
}
