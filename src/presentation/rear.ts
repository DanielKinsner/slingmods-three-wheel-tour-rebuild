import * as THREE from 'three';
import type {WheelTelemetry} from '../simulation';

type V3=[number,number,number];
export interface RearRig {
 wheelCenter:V3;armPivot:V3;armHub:V3;shockUpper:V3;shockLower:V3;
 groups:{arm:string;belt:string;axle:string;caliper:string;shockBody:string;shockPiston:string;shockSpring:string};
 storageEnvelopes:Array<{name:string;min:V3;max:V3}>;
 drivePulley?:{node:string;center:V3;spinRatio:number};
}
const vector=(p:V3)=>new THREE.Vector3().fromArray(p);
/** Maps an authored link to its new endpoints. Only the link's own axis stretches. */
export function linkTransform(a:THREE.Vector3,b:THREE.Vector3,c:THREE.Vector3,d:THREE.Vector3,stretch=true,anchorEnd=false){
 const before=b.clone().sub(a),after=d.clone().sub(c),length=before.length();
 if(length<1e-6||after.length()<1e-6)throw Error('Degenerate rear link');
 const z=new THREE.Vector3(0,0,1),oldQ=new THREE.Quaternion().setFromUnitVectors(z,before.normalize()),newQ=new THREE.Quaternion().setFromUnitVectors(z,after.clone().normalize());
 const result=new THREE.Matrix4().makeTranslation(...(anchorEnd?d:c).toArray());
 result.multiply(new THREE.Matrix4().makeRotationFromQuaternion(newQ));
 result.multiply(new THREE.Matrix4().makeScale(1,1,stretch?after.length()/length:1));
 result.multiply(new THREE.Matrix4().makeRotationFromQuaternion(oldQ.invert()));
 result.multiply(new THREE.Matrix4().makeTranslation(...(anchorEnd?b:a).clone().negate().toArray()));
 return result;
}
/** Visual linkage accommodates the accepted vertical raycast wheel; no dynamics are changed. */
export function solveRear(rig:RearRig,center:THREE.Vector3){
 const delta=center.clone().sub(vector(rig.wheelCenter)),pivot=vector(rig.armPivot),restHub=vector(rig.armHub),hub=restHub.clone().add(delta);
 const arm=linkTransform(pivot,restHub,pivot,hub),upper=vector(rig.shockUpper),lower=vector(rig.shockLower).applyMatrix4(arm);
 return{delta,pivot,hub,upper,lower,arm,axle:new THREE.Matrix4().makeTranslation(...delta.toArray()),spring:linkTransform(upper,vector(rig.shockLower),upper,lower),body:linkTransform(upper,vector(rig.shockLower),upper,lower,false),piston:linkTransform(upper,vector(rig.shockLower),upper,lower,false,true),armLength:hub.distanceTo(pivot),restArmLength:restHub.distanceTo(pivot),shockLength:upper.distanceTo(lower)};
}
export class RearPresenter {
 private groups=new Map<keyof RearRig['groups'],{node:THREE.Object3D;rest:THREE.Matrix4}>();
 private drivePulley?:{node:THREE.Object3D;rest:THREE.Matrix4;spinRatio:number};
 private report:any;private points=new Map<string,THREE.Object3D>();private last?:{center:THREE.Vector3;spin:number;s:ReturnType<typeof solveRear>};
 constructor(readonly root:THREE.Object3D,readonly rig:RearRig){
  root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert();
  for(const [key,name]of Object.entries(rig.groups)){
   const node=root.getObjectByName(name);if(!node)throw Error('Missing rear group '+name);
   this.groups.set(key as keyof RearRig['groups'],{node,rest:inverse.clone().multiply(node.matrixWorld)});
  }
  for(const name of ['rear_arm_pivot','rear_hub','shock_upper','shock_lower']){const node=root.getObjectByName(name);if(!node)throw Error('Missing rear attachment '+name);this.points.set(name,node)}
  if(rig.drivePulley){
   const node=root.getObjectByName(rig.drivePulley.node);if(!node)throw Error('Missing drive pulley '+rig.drivePulley.node);
   this.drivePulley={node,rest:inverse.clone().multiply(node.matrixWorld),spinRatio:rig.drivePulley.spinRatio};
  }
  this.update({localCenter:{x:rig.wheelCenter[0],y:rig.wheelCenter[1],z:rig.wheelCenter[2]},spin:0});
 }
 private setAssetMatrix(node:THREE.Object3D,matrix:THREE.Matrix4){
  this.root.updateWorldMatrix(true,false);node.parent!.updateWorldMatrix(true,false);
  const local=node.parent!.matrixWorld.clone().invert().multiply(this.root.matrixWorld).multiply(matrix);
  // Keep the affine matrix intact: decomposing a rotated axial stretch can introduce shear error.
  node.matrixAutoUpdate=false;node.matrix.copy(local);node.matrixWorldNeedsUpdate=true;
 }
 private setPoint(name:string,point:THREE.Vector3){this.setAssetMatrix(this.points.get(name)!,new THREE.Matrix4().makeTranslation(...point.toArray()))}
 /** Poses the rear. With `report` (the default) the result is also measured; the race passes false every frame and the
  * measurement is then taken only when inspect() asks for it. */
 update(w:Pick<WheelTelemetry,'localCenter'|'spin'>,report=true){
  const center=new THREE.Vector3(w.localCenter.x,w.localCenter.y,w.localCenter.z),s=solveRear(this.rig,center);
  const transforms={arm:s.arm,belt:s.arm,axle:s.axle,caliper:s.axle,shockBody:s.body,shockPiston:s.piston,shockSpring:s.spring};
  for(const[key,b]of this.groups)this.setAssetMatrix(b.node,transforms[key].clone().multiply(b.rest));
  // Chassis input pulley turns on its own axis; suspension travel affects only
  // the rear sprocket. The ratio is visual, derived from the supplied radii.
  if(this.drivePulley){const p=this.drivePulley;this.setAssetMatrix(p.node,p.rest.clone().multiply(new THREE.Matrix4().makeRotationX(-w.spin*p.spinRatio)))}
  this.setPoint('rear_arm_pivot',s.pivot);this.setPoint('rear_hub',center);this.setPoint('shock_upper',s.upper);this.setPoint('shock_lower',s.lower);
  this.last={center,spin:w.spin,s};this.report=undefined;
  return report?this.measure():undefined;
 }
 private measure(){
  const {center,spin,s}=this.last!;
  this.root.updateWorldMatrix(true,true);
  const inverse=this.root.matrixWorld.clone().invert(),at=(node:THREE.Object3D)=>node.getWorldPosition(new THREE.Vector3()).applyMatrix4(inverse),point=(name:string)=>at(this.points.get(name)!);
  const wheel=this.root.getObjectByName('rear_spin')!,visibleCenter=wheel.getWorldPosition(new THREE.Vector3()).applyMatrix4(inverse);
  const groupPoint=(key:keyof RearRig['groups'],rest:V3)=>{const b=this.groups.get(key)!;return vector(rest).applyMatrix4(b.rest.clone().invert()).applyMatrix4(b.node.matrixWorld).applyMatrix4(inverse)};
  const axleCenter=groupPoint('axle',this.rig.wheelCenter),armEnd=groupPoint('arm',this.rig.armHub),armStart=groupPoint('arm',this.rig.armPivot),springUpper=groupPoint('shockSpring',this.rig.shockUpper),springLower=groupPoint('shockSpring',this.rig.shockLower),bodyUpper=groupPoint('shockBody',this.rig.shockUpper),pistonLower=groupPoint('shockPiston',this.rig.shockLower);
  this.report={wheelCenter:center.toArray(),visibleWheelCenter:visibleCenter.toArray(),wheelCenterError:visibleCenter.distanceTo(center),hub:point('rear_hub').toArray(),armPivot:point('rear_arm_pivot').toArray(),armHub:s.hub.toArray(),shockUpper:point('shock_upper').toArray(),shockLower:point('shock_lower').toArray(),axleCenter:axleCenter.toArray(),axleCenterError:axleCenter.distanceTo(center),armEndpointError:Math.max(armEnd.distanceTo(s.hub),armStart.distanceTo(s.pivot)),shockEndpointError:Math.max(springUpper.distanceTo(s.upper),springLower.distanceTo(s.lower),bodyUpper.distanceTo(s.upper),pistonLower.distanceTo(s.lower)),armLength:s.armLength,armLengthChange:s.armLength-s.restArmLength,armScale:s.armLength/s.restArmLength,shockLength:s.shockLength,wheelSpin:spin,groups:Object.fromEntries([...this.groups].map(([k,b])=>[k,b.node.matrix.toArray()]))};
  if(this.drivePulley)this.report.drivePulley={center:at(this.drivePulley.node).toArray(),centerError:at(this.drivePulley.node).distanceTo(vector(this.rig.drivePulley!.center)),angle:-spin*this.drivePulley.spinRatio};
  return this.report;
 }
 inspect():any{return this.report??(this.last&&this.measure())}
}
