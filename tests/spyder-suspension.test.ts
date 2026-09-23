import test from 'node:test';import assert from 'node:assert/strict';
import {Simulation,type VehicleTelemetry} from '../src/simulation';import {SPYDER_DEFINITION} from '../src/simulation/vehicle-definition';
import {freshSpyderBuild,type SpyderBuild} from '../src/signature/spyder-catalog';import type {EnvironmentDefinition} from '../src/course/environment';
const coast={throttle:0,brake:0,steer:0,reverse:false};
const ground:EnvironmentDefinition={ground:{center:[0,-.5,0],size:[100,1,200]},obstacles:[],ramps:[],surfaceAt:()=>({id:'asphalt',mu:1.05,rolling:.014})};
async function firstLoads(build:SpyderBuild,vertical=0,roll=0){const s=await Simulation.create(ground,'spyder-f3-v1',SPYDER_DEFINITION);try{s.configureSpyder(build);s.reset({y:0});(s as any).body.setRotation({x:0,y:0,z:Math.sin(roll/2),w:Math.cos(roll/2)},true);(s as any).body.setLinvel({x:0,y:vertical,z:0},true);s.step(coast);return s.telemetry().wheels.map(w=>w.load)}finally{s.dispose()}}
test('front/rear manual preload affects only its own force channels at the same physical state',async()=>{
 const stock=await firstLoads(freshSpyderBuild());for(const id of ['front','rear'] as const){const b=freshSpyderBuild();b.parts[id]=true;b[id].preload=1;const loads=await firstLoads(b);for(let i=0;i<3;i++){if((i===2)===(id==='rear'))assert.ok(loads[i]>stock[i]+100);else assert.equal(loads[i],stock[i]);}}
});
test('Elka rebound and compression adjustments have directional independent effects',async()=>{
 for(const id of ['front','rear'] as const)for(const direction of ['rebound','compression'] as const){const velocity=direction==='rebound'?.15:-.15,a=freshSpyderBuild();a.parts[id]=true;a[id][direction]=0;const b=structuredClone(a);b[id][direction]=1;const x=await firstLoads(a,velocity),y=await firstLoads(b,velocity);for(let i=0;i<3;i++){if((i===2)===(id==='rear'))assert.ok(direction==='rebound'?y[i]<x[i]:y[i]>x[i]);else assert.equal(y[i],x[i]);}const unused=structuredClone(a);unused[id][direction==='rebound'?'compression':'rebound']=1;assert.deepEqual(await firstLoads(unused,velocity),x);}
});
test('Spyder narrow corridor, one-wheel bump, modest ramp and barrier recovery remain finite',async()=>{
 for(const fixture of ['corridor','bump','ramp','barrier']){
  const env=structuredClone({...ground,surfaceAt:undefined}) as unknown as EnvironmentDefinition;env.surfaceAt=ground.surfaceAt;
  if(fixture==='corridor')env.obstacles=[-1.2,1.2].map(x=>({id:'corridor',center:[x,.5,15],size:[.15,1,55]}));
  if(fixture==='bump')env.obstacles=[{id:'one-front-bump',center:[-.685,.035,25],size:[.36,.07,.7]}];
  if(fixture==='ramp')env.ramps=[{center:[0,0,23],width:2,length:3,rise:.12}];
  if(fixture==='barrier')env.obstacles=[{id:'barrier',center:[0,.6,23],size:[3,1.2,.3]}];
  const s=await Simulation.create(env,'spyder-f3-v1',SPYDER_DEFINITION);let maxX=0,minUp=1,maxY=0,maxSupportY=0,asymmetry=0,minZ=35; s.enableDiagnostics();
  try{for(let i=0;i<720;i++){const before=s.telemetry();s.step({...coast,throttle:before.speed<6?.3:0,brake:before.speed>6.3?.2:0});const t=s.telemetry();assert.ok([t.speed,t.rpm,...Object.values(t.position),...Object.values(t.quaternion),...t.wheels.flatMap(w=>[w.load,w.travel,w.spin,w.longitudinalForce,w.lateralForce])].every(Number.isFinite));maxX=Math.max(maxX,Math.abs(t.position.x));minUp=Math.min(minUp,1-2*(t.quaternion.x**2+t.quaternion.z**2));maxY=Math.max(maxY,t.position.y);maxSupportY=Math.max(maxSupportY,...s.diagnostics().wheels.map((w:any)=>w.contact?w.point.y:0));minZ=Math.min(minZ,t.position.z);asymmetry=Math.max(asymmetry,Math.abs(t.wheels[0].localCenter.y-t.wheels[1].localCenter.y));assert.ok(t.wheels.every(w=>w.load>=0&&w.load<18000));}
   // Telemetry position is the ground-level vehicle origin, not the center of mass.
   assert.ok(minUp>.65,`${fixture} upright ${minUp}`);if(fixture==='corridor')assert.ok(maxX<.2);if(fixture==='bump')assert.ok(asymmetry>.02,'bump actually engages one front');if(fixture==='ramp')assert.ok(maxSupportY>.1,`tires actually contact the 0.12 m ramp: support ${maxSupportY}, origin ${maxY}`);if(fixture!=='barrier')assert.ok(minZ<20,'fixture passed');else{assert.ok(minZ>21,'barrier stops chassis');for(let i=0;i<240;i++)s.step({...coast,throttle:.5,reverse:true});assert.ok(s.telemetry().speed<-.5);}
   s.reset();for(let i=0;i<180;i++)s.step(coast);assert.ok(s.telemetry().wheels.every(w=>w.contact));assert.ok(Math.abs(s.telemetry().speed)<.01);
  }finally{s.dispose()}
 }
});

test('ULTRA sway bar redistributes front support without adding total support or changing rear',async()=>{const a=freshSpyderBuild(),b=freshSpyderBuild();b.parts.sway=true;const x=await firstLoads(a,0,.02),y=await firstLoads(b,0,.02);assert.ok([...x,...y].every(load=>load>0),'both fronts remain loaded, below the bounded transfer limit');assert.equal(x[2],y[2]);assert.ok(Math.abs((x[0]+x[1])-(y[0]+y[1]))<1e-6);assert.ok(Math.abs(x[0]-y[0])>1);assert.ok(Math.abs((x[0]-y[0])+(x[1]-y[1]))<1e-6);});
