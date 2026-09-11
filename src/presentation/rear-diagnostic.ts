import * as THREE from 'three';
import type {RearPresenter} from './rear';
/** Opt-in isolated-test overlay, never part of the normal vehicle appearance. */
export class RearDiagnostic {
 readonly group=new THREE.Group();
 private points=new Map<string,THREE.Mesh>();
 constructor(readonly presenter:RearPresenter){
  this.group.name='rear_test_overlay';this.group.visible=false;presenter.root.add(this.group);
  for(const [name,color]of Object.entries({wheelCenter:0x66ffff,armPivot:0xffff66,armHub:0xff88ff,shockUpper:0xff6666,shockLower:0x66ff88})){
   const mesh=new THREE.Mesh(new THREE.SphereGeometry(.018,12,8),new THREE.MeshBasicMaterial({color,depthTest:false}));mesh.renderOrder=100;this.points.set(name,mesh);this.group.add(mesh);
  }
  for(const box of presenter.rig.storageEnvelopes){const helper=new THREE.Box3Helper(new THREE.Box3(new THREE.Vector3().fromArray(box.min),new THREE.Vector3().fromArray(box.max)),0x88baff);(helper.material as THREE.Material).depthTest=false;helper.renderOrder=99;this.group.add(helper)}
 }
 set(enabled:boolean){this.group.visible=enabled;const data=this.presenter.inspect();for(const[name,mesh]of this.points)mesh.position.fromArray(data[name]);return data}
}
