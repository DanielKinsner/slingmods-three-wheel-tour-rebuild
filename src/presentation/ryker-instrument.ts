import * as THREE from 'three';
import type {VehicleTelemetry} from '../simulation';
import {displayValues} from './instrument-values';

/** Original SIM graphics on the purchased screen, with freshly projected UVs. */
export class RykerInstrument {
 readonly canvas=document.createElement('canvas');
 readonly texture:THREE.CanvasTexture;
 readonly mesh:THREE.Mesh;
 private original:THREE.Material|THREE.Material[];
 private material:THREE.MeshBasicMaterial;
 private ctx:CanvasRenderingContext2D;
 private power=true;
 private values={speed:0,units:'mph',rpm:0,gear:'N'};
 private key='';private lastUpload=-Infinity;private uploads=0;
 private center=new THREE.Vector3();private eye=new THREE.Vector3();private normal=new THREE.Vector3();private projected=new THREE.Vector3();
 constructor(car:THREE.Object3D){
  const screen=car.getObjectByName('instrument_screen');
  if(!(screen instanceof THREE.Mesh)||!screen.geometry.getAttribute('uv'))throw Error('Ryker instrument requires the validated screen and its projected UVs');
  this.mesh=screen;this.original=screen.material;
  this.canvas.width=512;this.canvas.height=256;this.ctx=this.canvas.getContext('2d')!;
  this.texture=new THREE.CanvasTexture(this.canvas);this.texture.colorSpace=THREE.SRGBColorSpace;this.texture.flipY=false;
  this.texture.generateMipmaps=false;this.texture.minFilter=THREE.LinearFilter;
  this.material=new THREE.MeshBasicMaterial({map:this.texture,toneMapped:false});screen.material=this.material;
  screen.geometry.computeBoundingBox();screen.geometry.boundingBox!.getCenter(this.center);this.draw();
 }
 setPower(on:boolean){if(this.power!==on){this.power=on;this.key='';this.draw()}}
 update(t:VehicleTelemetry,camera:THREE.Camera,now:number){
  if(!this.power||now-this.lastUpload<100)return;
  this.mesh.updateWorldMatrix(true,false);
  const at=this.projected.copy(this.center).applyMatrix4(this.mesh.matrixWorld);
  camera.getWorldPosition(this.eye).sub(at);
  // Screen normal in the asset's local Y-up coordinates (15 degree rearward tilt).
  this.normal.set(0,.258819,.965926).transformDirection(this.mesh.matrixWorld);
  if(this.eye.lengthSq()>16||this.normal.dot(this.eye)<=0)return;
  at.project(camera);if(Math.abs(at.x)>1.05||Math.abs(at.y)>1.05||Math.abs(at.z)>1)return;
  const values=displayValues(t),key=JSON.stringify(values);
  if(key===this.key)return;this.values=values;this.key=key;this.lastUpload=now;this.draw();
 }
 private draw(){
  const c=this.ctx;c.fillStyle='#080e10';c.fillRect(0,0,512,256);
  if(this.power){
   c.fillStyle='#b1c4bd';c.font='600 18px Arial';c.fillText('SIM',30,35);
   c.fillStyle='#e1efe7';c.font='600 106px Arial';c.fillText(String(this.values.speed),28,145);
   c.font='500 22px Arial';c.fillText(this.values.units.toUpperCase(),34,176);
   c.strokeStyle='#3c5249';c.lineWidth=2;c.beginPath();c.moveTo(337,53);c.lineTo(337,183);c.stroke();
   c.fillStyle='#adc2b6';c.font='500 17px Arial';c.fillText('GEAR',382,67);
   c.fillStyle='#e1efe7';c.font='600 80px Arial';c.fillText(this.values.gear,389,143);
   c.fillStyle='#273d33';c.fillRect(32,203,446,7);
   c.fillStyle='#a6c7b3';c.fillRect(32,203,446*Math.min(1,this.values.rpm/8500),7);
   c.font='500 18px Arial';c.fillText(`${this.values.rpm} RPM`,32,237);
  }
  this.texture.needsUpdate=true;this.uploads++;
 }
 inspect(){return {kind:'ryker-sim',power:this.power,values:{...this.values},pixels:[512,256],uploads:this.uploads,thumbnailCaptures:0,method:'Original SIM graphics on supplied fixed screen. Actual game speed/RPM/gear, including reverse. Fresh planar UVs; at most 10Hz changed-value uploads nearby and in view. Not OEM artwork.'}}
 dispose(){this.mesh.material=this.original;this.material.dispose();this.texture.dispose()}
}
