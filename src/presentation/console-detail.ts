import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

/** Static trim only: no input handlers, selected gear, or drivetrain binding. */
export function restoreConsoleDetail(car:THREE.Object3D){
 const insert=car.getObjectByName('Model02_AutoDrive_insert');
 if(!insert?.parent||car.getObjectByName('console_rndm_detail'))return;
 car.traverse(o=>{if(o.name.startsWith('Model02_AutoDrive_key'))o.visible=false});
 const pod=new THREE.Group();pod.name='console_rndm_detail';pod.position.copy(insert.position);pod.position.y+=.016;insert.parent.add(pod);
 const rim=new THREE.MeshStandardMaterial({color:'#72777c',metalness:.75,roughness:.3}),cap=new THREE.MeshStandardMaterial({color:'#202429',metalness:.1,roughness:.47});
 rim.userData.vehicleRole='metal';cap.userData.vehicleRole='interior';
 const rimGeometry=new RoundedBoxGeometry(.042,.006,.029,2,.0025),capGeometry=new RoundedBoxGeometry(.034,.009,.024,2,.003);
 for(const [i,letter]of ['R','N','D','M'].entries()){
  const button=new THREE.Group();button.name='console_selector_'+letter;button.position.z=-.045+i*.030;pod.add(button);
  const edge=new THREE.Mesh(rimGeometry,rim),key=new THREE.Mesh(capGeometry,cap);edge.position.y=.003;key.position.y=.0065;button.add(edge,key);
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const context=canvas.getContext('2d')!;
  context.fillStyle='#f5f6f7';context.font='bold 100px Arial, sans-serif';context.textAlign='center';context.textBaseline='middle';context.fillText(letter,64,69);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const ink=new THREE.MeshStandardMaterial({map:texture,transparent:true,roughness:.65,depthWrite:false});ink.userData.vehicleRole='interior';
  const label=new THREE.Mesh(new THREE.PlaneGeometry(.018,.018),ink);label.name='console_selector_label_'+letter;label.rotation.x=-Math.PI/2;label.position.y=.0112;button.add(label);
 }
}
