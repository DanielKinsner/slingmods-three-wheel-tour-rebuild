import RAPIER from '@dimforge/rapier3d-compat';
import layout from '../../public/assets/slingshot-contact-layout.json';
import { PAD, surfaceAt } from './pad';
import {AutoDrive,DRIVETRAIN} from './drivetrain';
export {PAD} from './pad';
export type Vec3={x:number;y:number;z:number};
export type Quat=Vec3&{w:number};
/** Positive steer is LEFT; body forward is -Z. Controls are sanitized each tick. */
export interface VehicleControl { throttle:number; brake:number; steer:number; reverse:boolean; tractionControl?:boolean }
export interface WheelTelemetry {id:string;contact:boolean;load:number;travel:number;slipRatio:number;slipAngle:number;spin:number;steer:number;localCenter:Vec3;surface:string;longitudinalForce:number;lateralForce:number;gripLimit:number;driveTorque:number}
export interface VehicleTelemetry {time:number;position:Vec3;quaternion:Quat;velocity:Vec3;angularVelocity:Vec3;speed:number;rpm:number;gear:number;shifting:boolean;shiftRemaining:number;steer:number;throttle:number;brake:number;reversePending:boolean;wheels:WheelTelemetry[]}
export const FIXED_DT=1/60;
export const SPEC={mass:850,comHeight:0.46,frontSpring:28000,rearSpring:48000,damperFront:3800,damperRear:6500,restLength:0.24,travel:0.15,...DRIVETRAIN,provenance:'Provisional simulation estimates, including loaded mass, CG, spring rates, damping, torque curve, gearing and tire coefficients. Dimensional contact geometry comes solely from shared P01 layout.'} as const;
const v=(x=0,y=0,z=0):Vec3=>({x,y,z});
const add=(a:Vec3,b:Vec3)=>v(a.x+b.x,a.y+b.y,a.z+b.z);
const scale=(a:Vec3,n:number)=>v(a.x*n,a.y*n,a.z*n);
const dot=(a:Vec3,b:Vec3)=>a.x*b.x+a.y*b.y+a.z*b.z;
const clamp=(x:number,a:number,b:number)=>Math.min(b,Math.max(a,x));
const finite=(x:number)=>Number.isFinite(x)?x:0;
const rotate=(a:Vec3,q:Quat):Vec3=>{const tx=2*(q.y*a.z-q.z*a.y),ty=2*(q.z*a.x-q.x*a.z),tz=2*(q.x*a.y-q.y*a.x);return v(a.x+q.w*tx+q.y*tz-q.z*ty,a.y+q.w*ty+q.z*tx-q.x*tz,a.z+q.w*tz+q.x*ty-q.y*tx)};
const normalized=(a:Vec3)=>scale(a,1/Math.max(1e-9,Math.hypot(a.x,a.y,a.z)));
let initialized:Promise<void>|undefined;

/** Exactly three custom suspension/tire channels. Rapier owns all body integration and collisions. */
export class Simulation {
  private world:RAPIER.World;
  private body:RAPIER.RigidBody;
  private time=0;private steering=0;private drivetrain=new AutoDrive();
  private spin=[0,0,0];private overspeed=[0,0,0];private wheels:WheelTelemetry[]=[];
  private throttle=0;private brake=0;private disposed=false;
  static async create():Promise<Simulation>{initialized??=RAPIER.init();await initialized;return new Simulation()}
  private constructor(){
    this.world=new RAPIER.World(v(0,-9.81,0));this.world.timestep=FIXED_DT;
    for(const box of [PAD.ground,...PAD.obstacles])this.world.createCollider(RAPIER.ColliderDesc.cuboid(box.size[0]/2,box.size[1]/2,box.size[2]/2).setTranslation(box.center[0],box.center[1],box.center[2]).setFriction(0.45));
    for(const ramp of PAD.ramps){
      const points:number[]=[];for(const x of [-ramp.width/2,ramp.width/2])for(const z of [-ramp.length/2,ramp.length/2]){points.push(x,-0.1,z,x,z<0?ramp.rise:0,z)}
      const shape=RAPIER.ColliderDesc.convexHull(new Float32Array(points));if(!shape)throw new Error('Invalid ramp hull');
      this.world.createCollider(shape.setTranslation(ramp.center[0],ramp.center[1],ramp.center[2]).setFriction(0.45));
    }
    // Collider carries zero mass; explicit loaded mass/inertia makes the convention unambiguous.
    this.body=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0,SPEC.comHeight+0.04,35).setCanSleep(false).setCcdEnabled(true).setAngularDamping(0.12).setAdditionalMassProperties(SPEC.mass,v(),v(700,950,330),{x:0,y:0,z:0,w:1}));
    this.world.createCollider(RAPIER.ColliderDesc.cuboid(0.63,0.16,1.45).setTranslation(0,-0.1,0).setDensity(0).setFriction(0.35).setRestitution(0.05),this.body);
    // Wheel-shaped passive collision guards catch vertical curbs/barriers; support comes only from rays.
    for(const w of layout.wheels)this.world.createCollider(RAPIER.ColliderDesc.cylinder(w.width/2,w.radius*0.68).setRotation({x:0,y:0,z:Math.SQRT1_2,w:Math.SQRT1_2}).setTranslation(w.center[0],w.center[1]-SPEC.comHeight,w.center[2]).setDensity(0).setFriction(0.1),this.body);
    this.world.step();this.reset();
  }
  reset(pose:{x?:number;z?:number;y?:number;yaw?:number}={}):void {
    const yaw=pose.yaw??0;const q={x:0,y:Math.sin(yaw/2),z:0,w:Math.cos(yaw/2)};
    this.body.setTranslation(v(pose.x??0,(pose.y??0.04)+SPEC.comHeight,pose.z??35),true);this.body.setRotation(q,true);
    this.body.setLinvel(v(),true);this.body.setAngvel(v(),true);this.body.resetForces(true);this.body.resetTorques(true);
    this.time=0;this.steering=0;this.drivetrain.reset();this.spin=[0,0,0];this.overspeed=[0,0,0];this.throttle=0;this.brake=0;
    this.wheels=layout.wheels.map(w=>({id:w.id,contact:false,load:0,travel:0,slipRatio:0,slipAngle:0,spin:0,steer:0,localCenter:v(...w.center as [number,number,number]),surface:'air',longitudinalForce:0,lateralForce:0,gripLimit:0,driveTorque:0}));
  }
  step(control:VehicleControl,dt=FIXED_DT):void {
    if(this.disposed)throw new Error('Simulation disposed');
    if(Math.abs(dt-FIXED_DT)>1e-9)throw new Error('Authoritative simulation accepts only fixed 1/60 second ticks');
    this.throttle=clamp(finite(control.throttle),0,1);this.brake=clamp(finite(control.brake),0,1);
    const q=this.body.rotation(),p=this.body.translation(),up=rotate(v(0,1,0),q),forward=rotate(v(0,0,-1),q),velocity=this.body.linvel(),speed=dot(velocity,forward);
    const maxSteer=Math.min(0.53/(1+Math.abs(speed)*0.037),Math.atan(5.4*layout.wheelbase/Math.max(speed*speed,1)));
    const target=clamp(finite(control.steer),-1,1)*maxSteer;
    this.steering+=clamp(target-this.steering,-1.7*dt,1.7*dt);
    const driveState=this.drivetrain.step(speed,this.overspeed[2],layout.wheels[2].radius,this.throttle,this.brake,Boolean(control.reverse),dt);
    this.throttle=driveState.throttle;this.brake=driveState.brake;const engineForce=driveState.force;
    this.body.resetForces(true);this.body.resetTorques(true);
    const newWheels:WheelTelemetry[]=[];
    const samples=layout.wheels.map((wheel,i)=>{
      const rear=i===2,k=rear?SPEC.rearSpring:SPEC.frontSpring,weight=SPEC.mass*9.81*(rear?0.5:0.25),preload=weight/k;
      const hardLocal=v(wheel.center[0],wheel.center[1]+SPEC.restLength-preload-SPEC.comHeight,wheel.center[2]);
      const origin=add(p,rotate(hardLocal,q));
      const envelopeSteer=rear?0:Math.abs(this.steering)<1e-5?0:Math.atan(layout.wheelbase/(layout.wheelbase/Math.tan(this.steering)+wheel.center[0]));
      const envelopeForward=rotate(v(-Math.sin(envelopeSteer),0,-Math.cos(envelopeSteer)),q);
      // Five rays sample one tire's circular fore/aft envelope. Pick one support hit,
      // never sum five suspension forces. This anticipates a curb before the hub crosses it.
      let ray=new RAPIER.Ray(origin,scale(up,-1));
      let hit:ReturnType<RAPIER.World['castRayAndGetNormal']>=null;
      let length=SPEC.restLength+SPEC.travel;
      for(const fraction of [-0.85,-0.45,0,0.45,0.85]){
        const offset=fraction*wheel.radius,arc=Math.sqrt(wheel.radius**2-offset**2);
        const sampleRay=new RAPIER.Ray(add(origin,scale(envelopeForward,offset)),scale(up,-1));
        const sampleHit=this.world.castRayAndGetNormal(sampleRay,SPEC.restLength+SPEC.travel+arc,true,undefined,undefined,undefined,this.body);
        if(sampleHit&&dot(sampleHit.normal,up)>0.25&&sampleHit.timeOfImpact-arc<length){length=sampleHit.timeOfImpact-arc;hit=sampleHit;ray=sampleRay}
      }
      const contact=Boolean(hit);length=clamp(length,0,SPEC.restLength+SPEC.travel);
      const point=hit?ray.pointAt(hit.timeOfImpact):origin;
      const pointVel=this.body.velocityAtPoint(point);
      let load=contact?clamp(k*(SPEC.restLength-length)-(rear?SPEC.damperRear:SPEC.damperFront)*dot(pointVel,up),0,weight*4.5):0;
      if(contact&&length<0.055)load+=Math.min(weight*2,(0.055-length)*130000);
      return {wheel,rear,k,weight,preload,ray,hit,contact,length,point,pointVel,load};
    });
    // Bounded anti-roll transfers support between the two fronts; total support stays unchanged.
    if(samples[0].contact&&samples[1].contact){
      const transfer=clamp((samples[1].length-samples[0].length)*5500,-samples[0].load,samples[1].load);
      samples[0].load+=transfer;samples[1].load-=transfer;
    }
    for(let i=0;i<3;i++){
      const {wheel,rear,preload,hit,contact,length,point,pointVel}=samples[i];
      const travel=SPEC.restLength-preload-length;
      // Ackermann: inner front wheel has greater positive/negative lock.
      const steer=rear?0:Math.abs(this.steering)<1e-5?0:Math.atan(layout.wheelbase/(layout.wheelbase/Math.tan(this.steering)+wheel.center[0]));
      let load=0,fx=0,fy=0,slipAngle=0,slipRatio=0,muLimit=0,driveTorque=0,surface='air',long=speed;
      if(contact){
        const normal=hit!.normal;
        load=samples[i].load;
        this.body.addForceAtPoint(scale(up,load),point,true);
        const rawFwd=rotate(v(-Math.sin(steer),0,-Math.cos(steer)),q);
        const tireFwd=normalized(add(rawFwd,scale(normal,-dot(rawFwd,normal))));
        const tireRight=normalized(v(tireFwd.y*normal.z-tireFwd.z*normal.y,tireFwd.z*normal.x-tireFwd.x*normal.z,tireFwd.x*normal.y-tireFwd.y*normal.x));
        long=dot(pointVel,tireFwd);const lateral=dot(pointVel,tireRight);const surf=surfaceAt(point.x,point.z);surface=surf.id;
        muLimit=load*surf.mu;slipAngle=Math.atan2(lateral,Math.max(Math.abs(long),2));
        let drive=rear?engineForce:0;
        if(control.tractionControl!==false)drive=clamp(drive,-muLimit*0.92,muLimit*0.92);
        driveTorque=drive*wheel.radius;
        const share=rear?0.5:0.25;
        const stopLimit=Math.abs(long)*SPEC.mass*share*0.6/dt;
        const braking=Math.min(stopLimit,this.brake*SPEC.mass*9.81*(rear?0.3:0.35)+surf.rolling*load+(rear&&this.throttle<0.01?110:0));
        const request=drive-Math.sign(long)*braking;
        fy=-load*7*slipAngle;
        fy=clamp(fy,-Math.abs(lateral)*SPEC.mass*share/dt,Math.abs(lateral)*SPEC.mass*share/dt);
        // Smooth combined-slip ellipse saturation. Never add another controller's tire forces.
        const norm=Math.hypot(request,fy),sat=norm>muLimit?muLimit/Math.max(norm,1e-9):1;
        fx=request*sat;fy*=sat;
        this.body.addForceAtPoint(add(scale(tireFwd,fx),scale(tireRight,fy)),point,true);
        const excess=drive-fx-Math.sign(long)*braking;
        this.overspeed[i]=rear?clamp((this.overspeed[i]+excess*wheel.radius/2.8*dt)*Math.exp(-dt*5),-190,190):0;
        slipRatio=fx/Math.max(load*10,1)+this.overspeed[i]*wheel.radius/Math.max(Math.abs(long),3);
      }else if(rear){this.overspeed[i]=clamp(this.overspeed[i]+engineForce*wheel.radius/2.8*dt,-190,190);driveTorque=engineForce*wheel.radius}
      this.spin[i]+=(long/wheel.radius+this.overspeed[i])*dt;
      newWheels.push({id:wheel.id,contact,load,travel,slipRatio,slipAngle,spin:this.spin[i],steer,localCenter:v(wheel.center[0],wheel.center[1]+travel,wheel.center[2]),surface,longitudinalForce:fx,lateralForce:fy,gripLimit:muLimit,driveTorque});
    }
    this.wheels=newWheels;
    // Aerodynamic drag is a COM force. Load transfer is solely rigid-body response at tire contacts.
    const vmag=Math.hypot(velocity.x,velocity.y,velocity.z);this.body.addForce(scale(velocity,-0.43*vmag),true);
    this.world.step();this.time+=dt;
  }
  telemetry():VehicleTelemetry {
    const q=this.body.rotation(),p=this.body.translation(),velocity=this.body.linvel();
    return {time:this.time,position:add(p,rotate(v(0,-SPEC.comHeight,0),q)),quaternion:{...q},velocity:{...velocity},angularVelocity:{...this.body.angvel()},speed:dot(velocity,rotate(v(0,0,-1),q)),rpm:this.drivetrain.rpm,gear:this.drivetrain.gear,shifting:this.drivetrain.shiftRemaining>0,shiftRemaining:this.drivetrain.shiftRemaining,steer:this.steering,throttle:this.throttle,brake:this.brake,reversePending:this.drivetrain.reversePending,wheels:this.wheels.map(w=>({...w,localCenter:{...w.localCenter}}))};
  }
  dispose():void{if(!this.disposed){this.world.free();this.disposed=true}}
}

/** Bounded render-clock adapter. Background/pause transitions must call clear(). */
export class FixedClock {
  private accumulator=0;droppedSeconds=0;
  advance(elapsed:number,tick:()=>void):number{
    if(!Number.isFinite(elapsed)||elapsed<0)throw new Error('Invalid elapsed time');
    const accepted=Math.min(elapsed,0.1);this.droppedSeconds+=elapsed-accepted;this.accumulator+=accepted;
    while(this.accumulator+1e-10>=FIXED_DT){tick();this.accumulator-=FIXED_DT}
    return Math.max(0,this.accumulator/FIXED_DT);
  }
  clear():void{this.accumulator=0}
}




