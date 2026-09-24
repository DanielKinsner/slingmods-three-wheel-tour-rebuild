import {handlingProfile,steeringLimit,type HandlingProfileId} from './profile';
export {HANDLING_PROFILES,CURRENT_HANDLING_PROFILE,handlingProfile,steeringLimit,steeringRequest,steeringDemandForAngle,type HandlingProfileId} from './profile';
import {suspensionParameters,type SuspensionSetup} from '../career/suspension';
import RAPIER from '@dimforge/rapier3d-compat';
import {SLINGSHOT_DEFINITION,type VehicleDefinition} from './vehicle-definition';
import {freshSpyderBuild,validSpyderBuild,spyderThrottle,type SpyderBuild} from '../signature/spyder-catalog';
import {SpyderSE6} from './spyder-se6';
import {RykerCVT} from './ryker-cvt';
import {PAD_ENVIRONMENT,type EnvironmentDefinition} from '../course/environment';
import {AutoDrive,DRIVETRAIN,wheelAngularSpeed} from './drivetrain';
export {PAD} from './pad';
export type Vec3={x:number;y:number;z:number};
export type Quat=Vec3&{w:number};
/** Positive steer is LEFT; body forward is -Z. Controls are sanitized each tick. */
export interface VehicleControl { throttle:number; brake:number; steer:number; reverse:boolean; tractionControl?:boolean }
export interface WheelTelemetry {id:string;contact:boolean;load:number;travel:number;slipRatio:number;slipAngle:number;spin:number;steer:number;localCenter:Vec3;surface:string;angularSpeed:number;longitudinalSpeed:number;longitudinalForce:number;lateralForce:number;gripLimit:number;driveTorque:number}
export interface VehicleTelemetry {vehicleId?:string;definitionId?:string;powertrain?:'five-speed'|'cvt'|'six-speed';cvtRatio?:number;time:number;position:Vec3;quaternion:Quat;velocity:Vec3;angularVelocity:Vec3;speed:number;rpm:number;engineWheelAngularSpeed:number;gear:number;shifting:boolean;shiftRemaining:number;steer:number;throttle:number;brake:number;reversePending:boolean;wheels:WheelTelemetry[]}
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
  private diagnosticEnabled=false;
  private forceDiagnostics:Record<string,unknown>[]=[];
  /** Read-only opt-in force/contact instrumentation. No forces or world settings are changed. */
  enableDiagnostics(enabled=true){this.diagnosticEnabled=enabled}
  diagnostics(){
    const contacts:Record<string,unknown>[]=[];
    if(this.diagnosticEnabled)for(let i=0;i<this.body.numColliders();i++){const collider=this.body.collider(i);this.world.contactPairsWith(collider,other=>this.world.contactPair(collider,other,(m,flipped)=>{
      const points=[];for(let j=0;j<m.numContacts();j++)points.push({distance:m.contactDist(j),normalImpulse:m.contactImpulse(j),tangentImpulseX:m.contactTangentImpulseX(j),tangentImpulseY:m.contactTangentImpulseY(j)});
      contacts.push({kind:i===0?'chassis':'guard',wheel:i?this.definition.layout.wheels[i-1].id:null,other:other.handle,normal:{...m.normal()},flipped,points});
    }))}
    return {time:this.time,wheels:this.forceDiagnostics.map(w=>({...w})),contacts};
  }
  private suspension:ReturnType<typeof suspensionParameters>|null=null;
  configureSuspension(setup:SuspensionSetup|null){if(this.time!==0)throw Error('Configure suspension before driving');if(this.definition.powertrain!=='five-speed'&&setup)throw Error('Slingshot suspension cannot be fitted to Ryker');this.suspension=setup?Object.freeze(suspensionParameters(setup)):null}
  suspensionConfig(){return this.definition.powertrain==='six-speed'?{vehicle:this.definition.id,build:structuredClone(this.spyder),calibration:'game-estimated'}:this.definition.powertrain==='cvt'?{vehicle:'can-am-ryker-900',elka:this.elka,calibration:'game-estimated'}:this.suspension?{...this.suspension}:null}
  private spyder:SpyderBuild=freshSpyderBuild();
  configureSpyder(build:SpyderBuild){if(this.time!==0||this.definition.powertrain!=='six-speed'||!validSpyderBuild(build))throw Error('Valid Spyder configuration required before driving');this.spyder=structuredClone(build)}
  private draft=0;
  /** Racecraft (RaceWorld.setRacecraft): share of aerodynamic drag removed by a slipstream, 0..0.4. Stays 0 unless a
   *  race opts in, so time trials and recorded runs are unchanged. */
  setDraft(share:number){this.draft=Math.max(0,Math.min(.4,share))}
  get draftShare(){return this.draft}
  /** Racecraft: rigid-body state read before a step and restored (partly) after a glancing car-to-car contact. */
  motion(){const l=this.body.linvel(),a=this.body.angvel(),t=this.body.translation(),q=this.body.rotation();return {lin:{x:l.x,y:l.y,z:l.z},ang:{x:a.x,y:a.y,z:a.z},pos:{x:t.x,y:t.y,z:t.z},forward:{x:-2*(q.x*q.z+q.w*q.y),z:-(1-2*(q.x*q.x+q.y*q.y))}}}
  setMotion(lin:Vec3,ang:Vec3){this.body.setLinvel(lin,true);this.body.setAngvel(ang,true)}
  /** True while any collider of this car is in contact with any collider of `other`. */
  touching(other:Simulation){let hit=false;for(let i=0;i<this.body.numColliders()&&!hit;i++)for(let j=0;j<other.body.numColliders()&&!hit;j++)this.world.contactPair(this.body.collider(i),other.body.collider(j),m=>{if(m.numContacts()>0)hit=true});return hit}
  private elka=false;
  configureRykerSuspension(elka:boolean){if(this.time!==0||this.definition.powertrain!=='cvt')throw Error('Ryker suspension must be configured before driving');this.elka=elka}
  private world:RAPIER.World;
  private owner?:RaceWorld;
  private body:RAPIER.RigidBody;
  private time=0;private steering=0;private drivetrain:AutoDrive|RykerCVT|SpyderSE6;
  private spin=[0,0,0];private overspeed=[0,0,0];private wheels:WheelTelemetry[]=[];
  private throttle=0;private brake=0;private disposed=false;
  static async create(environment:EnvironmentDefinition=PAD_ENVIRONMENT,profileId:HandlingProfileId='legacy-p08a',definition:VehicleDefinition=SLINGSHOT_DEFINITION):Promise<Simulation>{initialized??=RAPIER.init();await initialized;const owner=new RaceWorld(environment,profileId);const car=owner.addVehicle('player',{},definition,profileId);owner.initialize();car.owner=owner;return car}
  constructor(readonly environment:EnvironmentDefinition, world:RAPIER.World,readonly profileId:HandlingProfileId='legacy-p08a',readonly definition:VehicleDefinition=SLINGSHOT_DEFINITION){
    handlingProfile(profileId);this.drivetrain=definition.powertrain==='six-speed'?new SpyderSE6():definition.powertrain==='cvt'?new RykerCVT():new AutoDrive(profileId);
    this.world=world;
    // Collider carries zero mass; explicit loaded mass/inertia makes the convention unambiguous.
    this.body=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0,this.definition.comHeight+0.04,35).setCanSleep(false).setCcdEnabled(true).setAngularDamping(0.12).setAdditionalMassProperties(this.definition.mass,v(),v(...this.definition.inertia),{x:0,y:0,z:0,w:1}));
    this.world.createCollider(RAPIER.ColliderDesc.cuboid(...this.definition.chassis).setTranslation(...this.definition.chassisOffset).setDensity(0).setFriction(0.35).setRestitution(0.05),this.body);
    // Guards supply collision normal response only. They are rigidly attached, not
    // spinning wheels: giving them tangential grip would add unintended locked-wheel
    // friction on top of the custom tire law during compression/landing.
    for(const w of this.definition.layout.wheels){
      let guard=RAPIER.ColliderDesc.cylinder(w.width/2,w.radius*0.68).setRotation({x:0,y:0,z:Math.SQRT1_2,w:Math.SQRT1_2});
      // Sport v2: the three ray tires already support the continuous planar floor.
      // Passive guards still hit obstacles/ramps/other vehicles; only the separate
      // floor group is excluded. The chassis still catches a bottom-out/overturn.
      // Matched high-speed tests isolated asymmetric guard/floor response despite
      // zero reported solver impulses; cylinder-to-hull and CCD-off did not fix it.
      if((profileId==='slingmods-sport-v2'||profileId==='slingmods-sport-v3'||profileId==='slingmods-sport-v4'||profileId==='slingmods-sport-v5'||this.profileId==='ryker-road-v1'||this.profileId==='spyder-f3-v1'))guard.setCollisionGroups(0x0002fffe);
      this.world.createCollider(guard.setTranslation(w.center[0],w.center[1]-this.definition.comHeight,w.center[2]).setDensity(0).setFriction(0).setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min),this.body);
    }
    this.reset();
  }
  reset(pose:{x?:number;z?:number;y?:number;yaw?:number;pitch?:number}={}):void {
    const yaw=pose.yaw??0,pitch=pose.pitch??0;const q=pitch?{x:Math.cos(yaw/2)*Math.sin(pitch/2),y:Math.sin(yaw/2)*Math.cos(pitch/2),z:-Math.sin(yaw/2)*Math.sin(pitch/2),w:Math.cos(yaw/2)*Math.cos(pitch/2)}:{x:0,y:Math.sin(yaw/2),z:0,w:Math.cos(yaw/2)};
    const base=v(pose.x??0,pose.y??0.04,pose.z??35);this.body.setTranslation(pitch?add(base,rotate(v(0,this.definition.comHeight,0),q)):v(base.x,base.y+this.definition.comHeight,base.z),true);this.body.setRotation(q,true);
    this.body.setLinvel(v(),true);this.body.setAngvel(v(),true);this.body.resetForces(true);this.body.resetTorques(true);
    this.time=0;this.steering=0;this.drivetrain.reset();this.spin=[0,0,0];this.overspeed=[0,0,0];this.throttle=0;this.brake=0;
    this.wheels=this.definition.layout.wheels.map(w=>({id:w.id,contact:false,load:0,travel:0,slipRatio:0,slipAngle:0,spin:0,steer:0,localCenter:v(...w.center as [number,number,number]),surface:'air',angularSpeed:0,longitudinalSpeed:0,longitudinalForce:0,lateralForce:0,gripLimit:0,driveTorque:0}));
  }
  step(control:VehicleControl,dt=FIXED_DT):void {
    if(!this.owner)throw Error('Shared vehicles must be advanced by RaceWorld.step');
    this.owner.step({player:control},dt);
  }
  applyForces(control:VehicleControl,dt=FIXED_DT):void {
    if(this.disposed)throw new Error('Simulation disposed');
    if(Math.abs(dt-FIXED_DT)>1e-9)throw new Error('Authoritative simulation accepts only fixed 1/60 second ticks');
    this.throttle=clamp(finite(control.throttle),0,1);this.brake=clamp(finite(control.brake),0,1);
    const q=this.body.rotation(),p=this.body.translation(),up=rotate(v(0,1,0),q),forward=rotate(v(0,0,-1),q),velocity=this.body.linvel(),speed=dot(velocity,forward);
    const maxSteer=steeringLimit(speed,this.profileId,this.definition.layout.wheelbase)*(this.profileId==='legacy-p08a'?1:1-handlingProfile(this.profileId).brakeSteerRelief*this.brake);
    const target=clamp(finite(control.steer),-1,1)*maxSteer;
    const response=(this.profileId==='slingmods-sport-v3'||this.profileId==='slingmods-sport-v4'||this.profileId==='slingmods-sport-v5'||this.profileId==='ryker-road-v1'||this.profileId==='spyder-f3-v1')?1-Math.exp(-dt/.10):1;
    this.steering+=clamp((target-this.steering)*response,-handlingProfile(this.profileId).steerRate*dt,handlingProfile(this.profileId).steerRate*dt);
    if(this.definition.powertrain==='six-speed')this.throttle=spyderThrottle(this.throttle,this.spyder);
    const driveState=this.drivetrain.step(speed,this.overspeed[2],this.definition.layout.wheels[2].radius,this.throttle,this.brake,Boolean(control.reverse),dt);
    this.throttle=driveState.throttle;this.brake=driveState.brake;const engineForce=driveState.force;
    this.body.resetForces(true);this.body.resetTorques(true);
    const forgiving=(this.profileId==='slingmods-sport-v4'||this.profileId==='slingmods-sport-v5'||this.profileId==='ryker-road-v1'||this.profileId==='spyder-f3-v1');
    const newWheels:WheelTelemetry[]=[];if(this.diagnosticEnabled)this.forceDiagnostics=[];
    const samples=this.definition.layout.wheels.map((wheel,i)=>{
      const rear=i===2,k=rear?this.definition.rearSpring:this.definition.frontSpring,weight=this.definition.mass*9.81*(rear?0.5:0.25),preload=weight/k,restLength=rear?(this.definition.rearRestLength??this.definition.restLength):this.definition.restLength;
      const hardLocal=v(wheel.center[0],wheel.center[1]+restLength-preload-this.definition.comHeight,wheel.center[2]);
      const origin=add(p,rotate(hardLocal,q));
      const envelopeSteer=rear?0:Math.abs(this.steering)<1e-5?0:Math.atan(this.definition.layout.wheelbase/(this.definition.layout.wheelbase/Math.tan(this.steering)+wheel.center[0]));
      const envelopeForward=rotate(v(-Math.sin(envelopeSteer),0,-Math.cos(envelopeSteer)),q);
      // Five rays sample one tire's circular fore/aft envelope. Pick one support hit,
      // never sum five suspension forces. This anticipates a curb before the hub crosses it.
      let ray=new RAPIER.Ray(origin,scale(up,-1));
      let hit:ReturnType<RAPIER.World['castRayAndGetNormal']>=null;
      let length=restLength+this.definition.travel;
      for(const fraction of [-0.85,-0.45,0,0.45,0.85]){
        const offset=fraction*wheel.radius,arc=Math.sqrt(wheel.radius**2-offset**2);
        const sampleRay=new RAPIER.Ray(add(origin,scale(envelopeForward,offset)),scale(up,-1));
        const sampleHit=this.world.castRayAndGetNormal(sampleRay,restLength+this.definition.travel+arc,true,undefined,undefined,undefined,this.body,collider=>!collider.parent()&&!collider.isSensor());
        if(sampleHit&&dot(sampleHit.normal,up)>0.25&&sampleHit.timeOfImpact-arc<length){length=sampleHit.timeOfImpact-arc;hit=sampleHit;ray=sampleRay}
      }
      const contact=Boolean(hit);length=clamp(length,0,restLength+this.definition.travel);
      const point=hit?ray.pointAt(hit.timeOfImpact):origin;
      const pointVel=this.body.velocityAtPoint(point);
      let load=contact?clamp(k*(restLength-length)-(rear?handlingProfile(this.profileId).damperRear:handlingProfile(this.profileId).damperFront)*dot(pointVel,up),0,weight*4.5):0;
      // Optional product seam: directional linear damping and spring-perch preload only.
      // Positive point velocity = extension/rebound. Stock keeps the exact equation above.
      if(contact&&this.suspension){const p=this.suspension,vertical=dot(pointVel,up),d=rear?(vertical>0?p.rearRebound:p.rearCompression):(vertical>0?p.frontRebound:p.frontCompression);load=clamp(k*(restLength-length+p.rideHeight)-d*vertical,0,weight*4.5)}
      if(this.definition.powertrain==='six-speed'){if(contact&&this.spyder.parts[rear?'rear':'front']){const setup=rear?this.spyder.rear:this.spyder.front,vertical=dot(pointVel,up),d=(rear?3500:2050)*(.8+.4*(vertical>0?setup.rebound:setup.compression));load=clamp(k*(restLength-length+setup.preload*.012)-d*vertical,0,weight*4.5)}if(contact&&length<.035)load+=Math.min(weight*2,(.035-length)*80000)}else if(this.definition.powertrain==='cvt'){if(contact&&this.elka){const vertical=dot(pointVel,up);load=clamp(k*(restLength-length)-(rear?2900:1650)*(vertical<0?1.18:1)*vertical,0,weight*4.5)}if(contact&&length<.04)load+=Math.min(weight*2,(.04-length)*60000)}else if(contact&&length<0.055)load+=Math.min(weight*2,(0.055-length)*130000);
      // Game-only curb compliance: cap a single suspension channel's kick,
      // including the bump stop. Rigid chassis/guard collisions remain physical.
      if(forgiving)load=Math.min(load,weight*3);
      return {wheel,rear,restLength,k,weight,preload,ray,hit,contact,length,point,pointVel,load};
    });
    // Bounded anti-roll transfers support between the two fronts; total support stays unchanged.
    if(samples[0].contact&&samples[1].contact){
      const transfer=clamp((samples[1].length-samples[0].length)*(this.definition.powertrain==='six-speed'?(this.spyder.parts.sway?5000:3600):this.definition.powertrain==='cvt'?2600:5500),-samples[0].load,samples[1].load);
      samples[0].load+=transfer;samples[1].load-=transfer;
    }
    const supportedLoad=samples.reduce((sum,s)=>sum+s.load,0);
    // Preserve total 1g pedal demand, with a small front bias to protect the
    // single rear tire's cornering reserve during trail braking.
    const brakeLoad=forgiving?samples.reduce((sum,s)=>sum+s.load*(s.rear?.8:1.2),0):supportedLoad;
    for(let i=0;i<3;i++){
      const {wheel,rear,restLength,preload,hit,contact,length,point,pointVel}=samples[i];
      const travel=restLength-preload-length;
      // Ackermann: inner front wheel has greater positive/negative lock.
      const steer=rear?0:Math.abs(this.steering)<1e-5?0:Math.atan(this.definition.layout.wheelbase/(this.definition.layout.wheelbase/Math.tan(this.steering)+wheel.center[0]));
      let load=0,fx=0,fy=0,slipAngle=0,slipRatio=0,muLimit=0,driveTorque=0,surface='air',long=speed;
      if(contact){
        const normal=hit!.normal;
        load=samples[i].load;
        this.body.addForceAtPoint(scale(up,load),point,true);
        const rawFwd=rotate(v(-Math.sin(steer),0,-Math.cos(steer)),q);
        const tireFwd=normalized(add(rawFwd,scale(normal,-dot(rawFwd,normal))));
        const tireRight=normalized(v(tireFwd.y*normal.z-tireFwd.z*normal.y,tireFwd.z*normal.x-tireFwd.x*normal.z,tireFwd.x*normal.y-tireFwd.y*normal.x));
        long=dot(pointVel,tireFwd);const lateral=dot(pointVel,tireRight);const surf=this.environment.surfaceAt(point.x,point.z);surface=surf.id;
        muLimit=this.profileId==='legacy-p08a'?load*surf.mu:load*surf.mu*(surf.id==='asphalt'?handlingProfile(this.profileId).asphaltGripScale:1);slipAngle=Math.atan2(lateral,Math.max(Math.abs(long),2));
        let drive=rear?engineForce:0;
        if(control.tractionControl!==false){
          // Reserve part of the rear tire's finite friction budget while sliding.
          const reserve=forgiving?1-.35*clamp(Math.abs(slipAngle)/.16,0,1):1;
          drive=clamp(drive,-muLimit*.92*reserve,muLimit*.92*reserve);
        }
        driveTorque=drive*wheel.radius;
        const share=rear?0.5:0.25;
        const stopLimit=Math.abs(long)*this.definition.mass*share*0.6/dt;
        // V2 brake-by-load allocator sends the same total pedal demand to supported
        // tires in proportion to instantaneous non-tensile normal load. Friction
        // ellipse and near-zero stop limiter remain authoritative; no extra grip.
        const braking=Math.min(stopLimit,this.brake*this.definition.mass*9.81*((this.profileId==='slingmods-sport-v2'||this.profileId==='slingmods-sport-v3'||this.profileId==='slingmods-sport-v4'||this.profileId==='slingmods-sport-v5'||this.profileId==='ryker-road-v1'||this.profileId==='spyder-f3-v1')?load*(forgiving?(rear?.8:1.2):1)/Math.max(1,brakeLoad):(rear?0.3:0.35))*handlingProfile(this.profileId).brakeScale+surf.rolling*load+(rear&&this.throttle<0.01?(this.definition.powertrain==='cvt'?45:110):0));
        const request=drive-Math.sign(long)*braking;
        fy=-load*handlingProfile(this.profileId).tireStiffness*slipAngle;
        fy=clamp(fy,-Math.abs(lateral)*this.definition.mass*share/dt,Math.abs(lateral)*this.definition.mass*share/dt);
        // Smooth combined-slip ellipse saturation. Never add another controller's tire forces.
        const norm=Math.hypot(request,fy),sat=norm>muLimit?muLimit/Math.max(norm,1e-9):1;
        if(this.diagnosticEnabled)this.forceDiagnostics.push({id:wheel.id,load,contact,travel,length,point:{...point},pointVelocity:{...pointVel},requestedLongitudinal:request,requestedLateral:fy,frictionLimit:muLimit,saturation:sat,braking,drive});
        fx=request*sat;fy*=sat;
        if(forgiving){
          this.body.addForceAtPoint(scale(tireFwd,fx),point,true);
          // 18 cm virtual lateral roll centre reduces tripping leverage only.
          // Longitudinal forces retain actual contact points and braking pitch.
          this.body.addForceAtPoint(scale(tireRight,fy),add(point,scale(up,this.definition.powertrain==='six-speed'?.23:this.definition.powertrain==='cvt'?.25:.18)),true);
        }else this.body.addForceAtPoint(add(scale(tireFwd,fx),scale(tireRight,fy)),point,true);
        const excess=drive-fx-Math.sign(long)*braking;
        this.overspeed[i]=rear?clamp((this.overspeed[i]+excess*wheel.radius/2.8*dt)*Math.exp(-dt*5),-190,190):0;
        slipRatio=fx/Math.max(load*10,1)+this.overspeed[i]*wheel.radius/Math.max(Math.abs(long),3);
      }else if(rear){this.overspeed[i]=clamp(this.overspeed[i]+engineForce*wheel.radius/2.8*dt,-190,190);driveTorque=engineForce*wheel.radius}
      const angularSpeed=wheelAngularSpeed(long,this.overspeed[i],wheel.radius);
      this.spin[i]+=angularSpeed*dt;
      newWheels.push({id:wheel.id,contact,load,travel,slipRatio,slipAngle,spin:this.spin[i],steer,localCenter:v(wheel.center[0],wheel.center[1]+travel,wheel.center[2]),surface,angularSpeed,longitudinalSpeed:long,longitudinalForce:fx,lateralForce:fy,gripLimit:muLimit,driveTorque});
    }
    if(forgiving&&samples.filter(s=>s.contact&&s.load>100).length>=2&&up.y>.65){
      // Bounded grounded yaw/roll damping; no pose, velocity or pitch locks.
      // Fade out when tipped/airborne so severe crashes still need recovery.
      const omega=this.body.angvel(),right=rotate(v(1,0,0),q);
      const slip=Math.atan2(dot(velocity,right),Math.max(Math.abs(speed),3));
      const slipExcess=Math.sign(slip)*Math.max(0,Math.abs(slip)-.04);
      const yawTarget=speed*Math.tan(this.steering)/this.definition.layout.wheelbase;
      const yawTorque=Math.abs(speed)>5?clamp(-3500*slipExcess-450*(dot(omega,up)-yawTarget),-650,650):0;
      const rollTorque=clamp(-700*dot(omega,forward),-650,650);
      const fade=clamp((up.y-.65)/.25,0,1);
      this.body.addTorque(scale(add(scale(up,yawTorque),scale(forward,rollTorque)),fade*(this.definition.powertrain==='six-speed'?.55:this.definition.powertrain==='cvt'?.40:1)),true);
    }
    this.wheels=newWheels;
    // Aerodynamic drag is a COM force. Load transfer is solely rigid-body response at tire contacts.
    const vmag=Math.hypot(velocity.x,velocity.y,velocity.z);this.body.addForce(scale(velocity,-(this.definition.powertrain==='six-speed'?.36:this.definition.powertrain==='cvt'?.30:.43)*(1-this.draft)*vmag),true);
  }
  publishTick(dt:number){this.time+=dt;
  }
  telemetry():VehicleTelemetry {
    const q=this.body.rotation(),p=this.body.translation(),velocity=this.body.linvel();
    return {...(this.drivetrain instanceof SpyderSE6?{vehicleId:this.definition.id,definitionId:this.definition.revision,powertrain:this.definition.powertrain}:{}),...(this.drivetrain instanceof RykerCVT?{vehicleId:this.definition.id,definitionId:this.definition.revision,powertrain:this.definition.powertrain,cvtRatio:this.drivetrain.ratio}:{}),time:this.time,position:add(p,rotate(v(0,-this.definition.comHeight,0),q)),quaternion:{...q},velocity:{...velocity},angularVelocity:{...this.body.angvel()},speed:dot(velocity,rotate(v(0,0,-1),q)),rpm:this.drivetrain.rpm,engineWheelAngularSpeed:this.drivetrain.inputWheelAngularSpeed,gear:this.drivetrain.gear,shifting:this.drivetrain.shiftRemaining>0,shiftRemaining:this.drivetrain.shiftRemaining,steer:this.steering,throttle:this.throttle,brake:this.brake,reversePending:this.drivetrain.reversePending,wheels:this.wheels.map(w=>({...w,localCenter:{...w.localCenter}}))};
  }
  dispose():void{if(!this.disposed){if(this.owner)this.owner.dispose();else this.world.removeRigidBody(this.body);this.disposed=true}}
  markDisposed(){this.disposed=true}
}


/** One environment and one authoritative integration per tick; identical solo tire/drivetrain forces. */
export class RaceWorld {
 readonly world:RAPIER.World;
 readonly participants=new Map<string,Simulation>();
 /** Racecraft (Phase 4A), off unless a race opts in: slipstream behind another car, and glancing car-to-car contact
  *  that scrapes instead of spinning. Time trials, validation and historical runs never enable it. */
 private racecraft={slipstream:false,rubbing:false};private wake=new Map<string,number>();private scrapes=0;
 /** Pairs rubbing during the last step (racecraft), with the midpoint between them: presentation reads it for sparks. */
 readonly rubbing:{a:string;b:string;x:number;y:number;z:number}[]=[];
 setRacecraft(options:{slipstream?:boolean;rubbing?:boolean}){this.racecraft={...this.racecraft,...options};if(!this.racecraft.slipstream)for(const car of this.participants.values())car.setDraft(0)}
 draftOf(id:string){return this.participants.get(id)?.draftShare??0}
 get scrapeCount(){return this.scrapes}
 steps=0;private disposed=false;private initialized=false;
 static async create(environment:EnvironmentDefinition=PAD_ENVIRONMENT,profileId:HandlingProfileId='legacy-p08a'){initialized??=RAPIER.init();await initialized;return new RaceWorld(environment,profileId)}
 constructor(readonly environment:EnvironmentDefinition,readonly profileId:HandlingProfileId='legacy-p08a'){
    handlingProfile(profileId);
    this.world=new RAPIER.World(v(0,-9.81,0));this.world.timestep=FIXED_DT;
    // A finite planar triangle surface has explicit face normals. The former700m-wide
    // convex slab produced a near-horizontal cylinder contact normal on flat ground
    // during a shallow landing (recorded in G2/revision02), injecting a spurious yaw impulse.
    if(environment.supportMeshes){
      // New height-aware support replaces, rather than overlays, the legacy plane.
      // Same support group deliberately excludes passive wheel guards, while chassis contacts remain.
      for(const mesh of environment.supportMeshes){
        if(!mesh.vertices.length||mesh.vertices.length%3||!mesh.indices.length||mesh.indices.length%3||mesh.vertices.some(v=>!Number.isFinite(v))||mesh.indices.some(i=>!Number.isInteger(i)||i<0||i>=mesh.vertices.length/3))throw Error('Invalid elevated support mesh');
        const shape=RAPIER.ColliderDesc.trimesh(new Float32Array(mesh.vertices),new Uint32Array(mesh.indices)).setFriction(.45);
        if(profileId==='slingmods-sport-v2'||profileId==='slingmods-sport-v3'||profileId==='slingmods-sport-v4'||profileId==='slingmods-sport-v5'||profileId==='ryker-road-v1'||profileId==='spyder-f3-v1')shape.setCollisionGroups(0x0001ffff);
        this.world.createCollider(shape);
      }
    }else{
    const [gx,gy,gz]=environment.ground.center,[gw,gh,gl]=environment.ground.size;
    const groundVertices=new Float32Array([-gw/2,0,-gl/2,-gw/2,0,gl/2,gw/2,0,gl/2,gw/2,0,-gl/2]);
    const groundShape=RAPIER.ColliderDesc.trimesh(groundVertices,new Uint32Array([0,1,2,0,2,3])).setTranslation(gx,gy+gh/2,gz).setFriction(0.45);
    if((profileId==='slingmods-sport-v2'||profileId==='slingmods-sport-v3'||profileId==='slingmods-sport-v4'||profileId==='slingmods-sport-v5'||profileId==='ryker-road-v1'||profileId==='spyder-f3-v1'))groundShape.setCollisionGroups(0x0001ffff);
    this.world.createCollider(groundShape);
    }
    for(const box of environment.obstacles)this.world.createCollider(RAPIER.ColliderDesc.cuboid(box.size[0]/2,box.size[1]/2,box.size[2]/2).setTranslation(box.center[0],box.center[1],box.center[2]).setRotation(box.pitch?{x:Math.cos((box.yaw??0)/2)*Math.sin(box.pitch/2),y:Math.sin((box.yaw??0)/2)*Math.cos(box.pitch/2),z:-Math.sin((box.yaw??0)/2)*Math.sin(box.pitch/2),w:Math.cos((box.yaw??0)/2)*Math.cos(box.pitch/2)}:{x:0,y:Math.sin((box.yaw??0)/2),z:0,w:Math.cos((box.yaw??0)/2)}).setFriction(0.45));
    for(const ramp of environment.ramps){
      const points:number[]=[];for(const x of [-ramp.width/2,ramp.width/2])for(const z of [-ramp.length/2,ramp.length/2]){points.push(x,-0.1,z,x,z<0?ramp.rise:0,z)}
      const shape=RAPIER.ColliderDesc.convexHull(new Float32Array(points));if(!shape)throw new Error('Invalid ramp hull');
      this.world.createCollider(shape.setTranslation(ramp.center[0],ramp.center[1],ramp.center[2]).setFriction(0.45));
    }

 }
 initialize(){if(this.initialized)return;const poses=[...this.participants].map(([id,c])=>[id,c.telemetry()] as const);this.world.step();for(const [id,t]of poses){const q=t.quaternion;this.get(id).reset({x:t.position.x,y:t.position.y,z:t.position.z,yaw:Math.atan2(2*(q.w*q.y+q.x*q.z),1-2*(q.y*q.y+(this.environment.supportMeshes?q.x*q.x:q.z*q.z))),...(this.environment.supportMeshes?{pitch:Math.asin(Math.max(-1,Math.min(1,2*(q.w*q.x-q.y*q.z))))}:{})})}this.initialized=true}
 addVehicle(id:string,pose:{x?:number;z?:number;y?:number;yaw?:number;pitch?:number}={},definition:VehicleDefinition=SLINGSHOT_DEFINITION,profileId:HandlingProfileId=this.profileId){if(this.disposed||this.participants.has(id))throw Error('Invalid participant registration');const car=new Simulation(this.environment,this.world,profileId,definition);car.reset(pose);this.participants.set(id,car);return car}
 get(id:string){const car=this.participants.get(id);if(!car)throw Error('Unknown participant '+id);return car}
 step(controls:Record<string,VehicleControl>,dt=FIXED_DT){
  if(this.disposed)throw Error('RaceWorld disposed');if(Math.abs(dt-FIXED_DT)>1e-9)throw Error('Authoritative simulation accepts only fixed 1/60 second ticks');
  this.initialize();
  for(const id of this.participants.keys())if(!controls[id])throw Error('Missing control for '+id);
  if(this.racecraft.slipstream)this.updateDraft(dt);
  for(const [id,car]of this.participants){const control=controls[id];if(!control)throw Error('Missing control for '+id);car.applyForces(control,dt)}
  const before=this.racecraft.rubbing&&this.participants.size>1?new Map([...this.participants].map(([id,car])=>[id,car.motion()])):undefined;
  this.world.step();this.steps++;if(before)this.softenRubbing(before);for(const car of this.participants.values())car.publishTick(dt);
 }
 /** Slipstream: a car running 2.5-25 m behind another, inside a wake that widens with distance (1.3 m close up, 2.4 m
  *  at 25 m), loses up to 38% of its drag once it has sat in it for about a second (the tow builds, never instantly). */
 private updateDraft(dt:number){
  const cars=[...this.participants].map(([id,car])=>[id,car,car.motion()] as const);
  for(const [id,car,m] of cars){
   const speed=Math.hypot(m.lin.x,m.lin.z);let best=0;
   if(speed>10){const ux=m.lin.x/speed,uz=m.lin.z/speed;for(const [other,,o] of cars){if(other===id)continue;const dx=o.pos.x-m.pos.x,dz=o.pos.z-m.pos.z,ahead=dx*ux+dz*uz,side=Math.abs(dx*uz-dz*ux);const reach=1.2+ahead*.05;if(ahead>2.5&&ahead<25&&side<reach)best=Math.max(best,(1-(ahead-2.5)/22.5)*(1-side/reach))}}
   const wake=best>.05?(this.wake.get(id)??0)+dt:Math.max(0,(this.wake.get(id)??0)-2*dt);this.wake.set(id,wake);
   const ramp=Math.min(1,Math.max(0,(wake-.35)/.75));car.setDraft(.38*best*ramp*ramp*(3-2*ramp));
  }
 }
 /** Rubbing is racing: two cars touching side by side at a small angle keep only part of the yaw and sideways kick
  *  the contact gave them this step (scrape, not spin). Head-on, T-bone and fast closing hits stay fully physical. */
 private softenRubbing(before:Map<string,ReturnType<Simulation['motion']>>){
  const ids=[...this.participants.keys()];this.rubbing.length=0;
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
   const a=this.get(ids[i]),b=this.get(ids[j]),ma=before.get(ids[i])!,mb=before.get(ids[j])!;
   const fa=Math.hypot(ma.forward.x,ma.forward.z)||1,fb=Math.hypot(mb.forward.x,mb.forward.z)||1,align=(ma.forward.x*mb.forward.x+ma.forward.z*mb.forward.z)/(fa*fb);
   if(align<.9)continue;
   const dx=mb.pos.x-ma.pos.x,dz=mb.pos.z-ma.pos.z,dist=Math.hypot(dx,dz)||1,closing=((ma.lin.x-mb.lin.x)*dx+(ma.lin.z-mb.lin.z)*dz)/dist;
   if(closing>6||!a.touching(b))continue;
   this.scrapes++;this.rubbing.push({a:ids[i],b:ids[j],x:(ma.pos.x+mb.pos.x)/2,y:(ma.pos.y+mb.pos.y)/2,z:(ma.pos.z+mb.pos.z)/2});
   for(const [car,m] of [[a,ma],[b,mb]] as const){
    const now=car.motion(),rx=-m.forward.z/(Math.hypot(m.forward.x,m.forward.z)||1),rz=m.forward.x/(Math.hypot(m.forward.x,m.forward.z)||1),lateral=(now.lin.x-m.lin.x)*rx+(now.lin.z-m.lin.z)*rz;
    car.setMotion({x:now.lin.x-rx*lateral*.55,y:now.lin.y,z:now.lin.z-rz*lateral*.55},{x:m.ang.x+(now.ang.x-m.ang.x)*.5,y:m.ang.y+(now.ang.y-m.ang.y)*.3,z:m.ang.z+(now.ang.z-m.ang.z)*.5});
   }
  }
 }
 telemetry(){return Object.fromEntries([...this.participants].map(([id,c])=>[id,c.telemetry()]))}
 removeVehicle(id:string){const car=this.get(id);car.dispose();this.participants.delete(id)}
 dispose(){if(!this.disposed){for(const car of this.participants.values())car.markDisposed();this.participants.clear();this.world.free();this.disposed=true}}
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




