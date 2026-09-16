import * as THREE from 'three';
import {vehicleContact} from './vehicle-contact';
import {fitInspectionCamera} from './inspection';
export function visibleBounds(root:THREE.Object3D){root.updateWorldMatrix(true,true);const bounds=new THREE.Box3();root.traverseVisible(o=>{if(o instanceof THREE.Mesh&&!o.userData.excludePresentationBounds){o.geometry.computeBoundingBox();if(o.geometry.boundingBox)bounds.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld))}});return bounds}
export interface SafeRegion {left:number;top:number;right:number;bottom:number}
/** Fit actual object corners into CSS safe space using the current camera projection.
 * View-offset recenters the composition without translating the car or changing orbit target. */
export function fitSafeCamera(camera:THREE.PerspectiveCamera,bounds:THREE.Box3,direction:THREE.Vector3,region:SafeRegion,width:number,height:number,margin=.88){
 const fov=camera.fov,w=Math.max(160,region.right-region.left),h=Math.max(120,region.bottom-region.top);
 camera.clearViewOffset();camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(fov/2))*h/height));camera.aspect=w/h;camera.updateProjectionMatrix();
 const target=fitInspectionCamera(camera,bounds,direction,margin);
 camera.fov=fov;camera.aspect=width/height;camera.setViewOffset(width,height,width/2-(region.left+region.right)/2,height/2-(region.top+region.bottom)/2,width,height);camera.updateProjectionMatrix();camera.lookAt(target);camera.updateMatrixWorld();return target;
}
/** Presentation-only result view in the existing world. No physics/pose/reward mutation. */
export class ResultCamera {
 private active=false;private contact:ReturnType<typeof vehicleContact>|undefined;
 constructor(private camera:THREE.PerspectiveCamera){}
 update(root:THREE.Object3D,show:boolean,width:number,height:number){
  if(!show){if(this.contact)this.contact.mesh.visible=false;if(this.active){this.camera.clearViewOffset();this.camera.updateProjectionMatrix();this.active=false}return}
  this.active=true;if(!this.contact){this.contact=vehicleContact();root.add(this.contact.mesh)}this.contact.mesh.visible=true;root.updateWorldMatrix(true,true);const direction=new THREE.Vector3(-5,1.65,-6).applyQuaternion(root.quaternion);
  const region=width>760?{left:Math.min(width*.36,480)+30,top:100,right:width-36,bottom:height-45}:{left:20,top:height*.4,right:width-20,bottom:height-30};
  fitSafeCamera(this.camera,visibleBounds(root),direction,region,width,height,.9);
 }
}
