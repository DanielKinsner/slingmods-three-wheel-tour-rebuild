import {rykerWheels,visualWheel} from './ryker-contacts';
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {RaceWorld,VehicleTelemetry} from '../simulation';
import layout from '../../public/assets/slingshot-contact-layout.json';

export interface GroundSample {height:number;normal:THREE.Vector3}
export type GroundProbe=(origin:THREE.Vector3,distance:number,out:GroundSample)=>boolean;
/** Read the existing static collision surface. Dynamic cars never receive ground shadows. */
export function contactGround(world:RaceWorld):GroundProbe {
 const ray=new RAPIER.Ray({x:0,y:0,z:0},{x:0,y:-1,z:0});
 return(origin,distance,out)=>{
  Object.assign(ray.origin,origin);
  const hit=world.world.castRayAndGetNormal(ray,distance,false,undefined,undefined,undefined,undefined,c=>!c.parent()&&!c.isSensor());
  if(!hit||hit.normal.y<.55)return false;
  out.height=origin.y-hit.timeOfImpact;out.normal.copy(hit.normal);return true;
 };
}
const CORNERS=[[-1,-1],[-1,1],[1,1],[1,-1]] as const;
/** Soft contact occlusion in one shared draw, projected onto the actual road plane.
 * Authoritative telemetry is read-only. Airborne tires and overturned cars have no contact patch. */
export class DrivingContact {
 readonly mesh:THREE.Mesh;
 private positions:THREE.BufferAttribute;private opacity:THREE.BufferAttribute;
 private q=new THREE.Quaternion();private p=new THREE.Vector3();private right=new THREE.Vector3();private forward=new THREE.Vector3();
 private sample:GroundSample={height:0,normal:new THREE.Vector3(0,1,0)};
 private visiblePatches=0;
 constructor(scene:THREE.Scene,private ids:readonly string[],private probe:GroundProbe,readonly enabled=true){
  const count=ids.length*4,geometry=new THREE.BufferGeometry(),uv=[],indices=[];
  this.positions=new THREE.BufferAttribute(new Float32Array(count*12),3).setUsage(THREE.DynamicDrawUsage);
  this.opacity=new THREE.BufferAttribute(new Float32Array(count*4),1).setUsage(THREE.DynamicDrawUsage);
  for(let n=0;n<count;n++){uv.push(0,0,0,1,1,1,1,0);const i=n*4;indices.push(i,i+1,i+2,i,i+2,i+3)}
  geometry.setAttribute('position',this.positions);geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setAttribute('patchOpacity',this.opacity);geometry.setIndex(indices);
  const material=new THREE.ShaderMaterial({name:'DrivingContact',uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog]),vertexShader:`attribute float patchOpacity;varying vec2 vUv;varying float alpha;
   #include <fog_pars_vertex>
   void main(){vUv=uv;alpha=patchOpacity;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
   #include <fog_vertex>
   }`,fragmentShader:`varying vec2 vUv;varying float alpha;
   #include <fog_pars_fragment>
   void main(){float r=length((vUv-.5)*2.);float a=alpha*pow(max(0.,1.-r*r),2.);if(a<.003)discard;gl_FragColor=vec4(0.,0.,0.,a);
   #include <fog_fragment>
   }`,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,fog:true});
  this.mesh=new THREE.Mesh(geometry,material);this.mesh.name='shared-driving-contact';this.mesh.frustumCulled=false;this.mesh.userData.excludePresentationBounds=true;this.mesh.visible=false;scene.add(this.mesh);
 }
 update(field:Record<string,VehicleTelemetry>,player?:VehicleTelemetry){
  this.visiblePatches=0;
  for(let ci=0;ci<this.ids.length;ci++){
   const id=this.ids[ci],t=id==='player'&&player?player:field[id];
   const upright=t?1-2*(t.quaternion.x*t.quaternion.x+t.quaternion.z*t.quaternion.z):0;
   if(t){this.q.copy(t.quaternion);this.forward.set(0,0,1).applyQuaternion(this.q);this.forward.y=0;this.forward.normalize();this.right.set(this.forward.z,0,-this.forward.x)}
   for(let part=0;part<4;part++){
    const ryker=t?.vehicleId==='can-am-ryker-900',index=(ci*4+part)*4,w=t?.wheels[part],wheel=(ryker?rykerWheels:layout.wheels)[part];let alpha=0;
    if(this.enabled&&t&&upright>.35&&(part===3||w?.contact)){
     if(w)visualWheel(this.p,part,w.localCenter,ryker);else this.p.set(0,.6,-.1);
     this.p.applyQuaternion(this.q).add(t.position);this.p.y+=.08;
     if(this.probe(this.p,part===3?1.65:(wheel.radius+.42),this.sample)){
      const gap=part===3?t.position.y-this.sample.height:this.p.y-.08-wheel.radius-this.sample.height;
      alpha=(part===3?.25:.64)*(1-THREE.MathUtils.smoothstep(gap,part===3?.18:.025,part===3?.85:.24));
      alpha*=THREE.MathUtils.smoothstep(upright,.35,.8);
      const width=part===3?(ryker?.85:1.45):wheel.width*2.8,depth=part===3?(ryker?1.7:2.65):wheel.radius*2.2,n=this.sample.normal;
      for(let v=0;v<4;v++){const [sx,sz]=CORNERS[v],dx=this.right.x*sx*width/2+this.forward.x*sz*depth/2,dz=this.right.z*sx*width/2+this.forward.z*sz*depth/2;
       this.positions.setXYZ(index+v,this.p.x+dx,this.sample.height-(n.x*dx+n.z*dz)/n.y+.012,this.p.z+dz)}
     }
    }
    for(let v=0;v<4;v++)this.opacity.setX(index+v,alpha);
    if(alpha>.003)this.visiblePatches++;
   }
  }
  this.positions.needsUpdate=true;this.opacity.needsUpdate=true;this.mesh.visible=this.visiblePatches>0;
 }
 inspect(){return{enabled:this.enabled,cars:this.ids.length,visiblePatches:this.visiblePatches,capacity:this.ids.length*4,drawCalls:this.mesh.visible?1:0,method:'soft contact occlusion on static ground; no screen-space AO or extra render pass'}}
 dispose(){this.mesh.removeFromParent();this.mesh.geometry.dispose();(this.mesh.material as THREE.Material).dispose()}
}
