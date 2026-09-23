import * as THREE from 'three';
import type {VehicleDefinition} from '../simulation/vehicle-definition';
import type {VehicleTelemetry} from '../simulation';
/** Loaded only by the isolated controlled-clock evidence hook. Not part of player UI. */
export function contactEvidence(root:THREE.Object3D,definition:VehicleDefinition,t:VehicleTelemetry,visual:{wheels:{center?:number[]}[]}){
 const group=new THREE.Group();group.name='isolated-contact-evidence';group.userData.excludePresentationBounds=true;
 const line=(geometry:THREE.BufferGeometry,color:number)=>{const mesh=new THREE.LineSegments(new THREE.EdgesGeometry(geometry),new THREE.LineBasicMaterial({color,depthTest:false,transparent:true,opacity:.85}));mesh.renderOrder=999;group.add(mesh);geometry.dispose();return mesh};
 const body=line(new THREE.BoxGeometry(...definition.chassis.map(v=>v*2) as [number,number,number]),0x33aaff);body.position.set(definition.chassisOffset[0],definition.comHeight+definition.chassisOffset[1],definition.chassisOffset[2]);
 const errors=t.wheels.map((w,i)=>{const measured=visual.wheels[i].center!,expected=[w.localCenter.x,w.localCenter.y,w.localCenter.z],wheel=definition.layout.wheels[i];const sphere=line(new THREE.SphereGeometry(.022,12,8),0x00ff88);sphere.position.fromArray(expected);const guard=line(new THREE.CylinderGeometry(wheel.radius*.68,wheel.radius*.68,wheel.width,24),0x3399ff);guard.rotation.z=Math.PI/2;guard.position.fromArray(wheel.center);const ring=line(new THREE.CircleGeometry(wheel.radius,48),0x00ff88);ring.rotation.y=Math.PI/2+w.steer;ring.position.fromArray(expected);return {wheel:wheel.id,measured,expected,errorMetres:Math.hypot(...expected.map((v,j)=>v-measured[j]))}});
 root.add(group);return {report:{frame:'vehicle local, metres, +Y up/-Z forward',colors:'green: actual simulated wheel centers/envelopes; blue: body and wheel guard colliders',definition:definition.id,errors},dispose(){group.traverse(o=>{if(o instanceof THREE.LineSegments){o.geometry.dispose();(o.material as THREE.Material).dispose()}});group.removeFromParent()}};
}
