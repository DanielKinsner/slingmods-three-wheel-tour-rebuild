import * as THREE from 'three';
import type {VehicleTelemetry} from '../simulation';
import {displayValues} from './instrument-values';
type Mark=[number,number];
/** Degrees read from native dial marks, including the supplied nonuniform scale. */
export function dialAngle(value:number,marks:Mark[]){
 const v=THREE.MathUtils.clamp(value,marks[0][0],marks.at(-1)![0]);
 for(let i=1;i<marks.length;i++)if(v<=marks[i][0]){const a=marks[i-1],b=marks[i];return THREE.MathUtils.degToRad(THREE.MathUtils.lerp(a[1],b[1],(v-a[0])/(b[0]-a[0])))}
 return 0;
}
export class NativeCluster {
 private needles:{node:THREE.Object3D;rest:THREE.Matrix4;center:THREE.Vector3;axis:THREE.Vector3;kind:'speed'|'rpm';marks:Mark[];value:number;angle:number}[]=[];
 private lcd?:THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>;private canvas?:HTMLCanvasElement;private texture?:THREE.CanvasTexture;private key='';private power=true;private reset=true;private lastTime?:number;private values={speed:0,units:'mph',rpm:0,gear:'N'};private uploads=0;
 constructor(private car:THREE.Object3D){
  car.updateWorldMatrix(true,true);const inverse=car.matrixWorld.clone().invert();
  for(const kind of ['speed','rpm']as const){const node=car.getObjectByName('native_'+kind+'_needle');if(node)this.needles.push({node,kind,rest:inverse.clone().multiply(node.matrixWorld),center:new THREE.Vector3().fromArray(node.userData.center),axis:new THREE.Vector3().fromArray(node.userData.axis).normalize(),marks:node.userData.scale,value:0,angle:0})}
  const mount=car.getObjectByName('native_cluster_lcd');if(!mount)return;
  this.canvas=document.createElement('canvas');this.canvas.width=512;this.canvas.height=256;this.texture=new THREE.CanvasTexture(this.canvas);this.texture.colorSpace=THREE.SRGBColorSpace;this.texture.generateMipmaps=false;this.texture.minFilter=THREE.LinearFilter;
  this.lcd=new THREE.Mesh(new THREE.PlaneGeometry(mount.userData.width,mount.userData.height),new THREE.MeshBasicMaterial({map:this.texture,toneMapped:false}));this.lcd.name='native_cluster_readout';mount.add(this.lcd);this.draw();
 }
 setPower(on:boolean){if(this.power===on)return;this.power=on;this.reset=true;this.key='';this.draw()}
 update(t:Pick<VehicleTelemetry,'speed'|'rpm'|'gear'|'time'>){
  if(!this.needles.length)return;const reset=this.reset||this.lastTime===undefined||t.time<this.lastTime,dt=reset?0:Math.min(.1,Math.max(0,t.time-this.lastTime!));this.lastTime=t.time;this.reset=false;
  const value=displayValues(t);this.values={...value,rpm:this.power?value.rpm:0};
  this.car.updateWorldMatrix(true,false);
  for(const n of this.needles){const target=this.power?(n.kind==='speed'?Math.abs(t.speed)*2.23694:t.rpm):0;n.value=reset?target:THREE.MathUtils.lerp(n.value,target,1-Math.exp(-14*dt));n.angle=dialAngle(n.value,n.marks)*(n.kind==='speed'?-1:1);
   const transform=new THREE.Matrix4().makeTranslation(...n.center.toArray()).multiply(new THREE.Matrix4().makeRotationAxis(n.axis,n.angle)).multiply(new THREE.Matrix4().makeTranslation(...n.center.clone().negate().toArray())).multiply(n.rest);
   n.node.parent!.updateWorldMatrix(true,false);n.node.matrixAutoUpdate=false;n.node.matrix.copy(n.node.parent!.matrixWorld.clone().invert().multiply(this.car.matrixWorld).multiply(transform));n.node.matrixWorldNeedsUpdate=true;
  }
  const key=JSON.stringify([this.power,this.power?value.speed:0,this.power?value.gear:'']);if(key!==this.key){this.key=key;this.draw()}
 }
 private draw(){if(!this.canvas||!this.texture)return;const c=this.canvas.getContext('2d')!;c.fillStyle=this.power?'#afbcb0':'#101715';c.fillRect(0,0,512,256);if(this.power){c.fillStyle='#10241b';c.textAlign='center';c.font='bold 102px monospace';c.fillText(String(this.values.speed),188,136);c.font='26px monospace';c.fillText('MPH',188,179);c.font='bold 80px monospace';c.fillText(this.values.gear,407,129);c.font='22px monospace';c.fillText('GEAR',407,169);c.fillRect(30,195,452,2);c.font='18px monospace';c.fillText('FUEL —   TEMP —',256,231)}this.texture.needsUpdate=true;this.uploads++}
 inspect(){return{bound:this.needles.length===2,power:this.power,values:this.values,needles:this.needles.map(n=>({kind:n.kind,value:n.value,angle:n.angle})),uploads:this.uploads,source:'Original needle geometry and face art; native MPH marks and RPM x1000. Unsupported fuel/temperature unavailable.'}}
 dispose(){for(const n of this.needles){n.node.parent!.updateWorldMatrix(true,false);n.node.matrix.copy(n.node.parent!.matrixWorld.clone().invert().multiply(this.car.matrixWorld).multiply(n.rest));n.node.matrixWorldNeedsUpdate=true}this.lcd?.removeFromParent();this.lcd?.geometry.dispose();this.lcd?.material.dispose();this.texture?.dispose()}
}
