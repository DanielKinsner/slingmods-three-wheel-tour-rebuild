import assert from 'node:assert/strict';
import {Simulation,type HandlingProfileId} from '../src/simulation/index';
import {InputResolver} from '../src/driving/input';
import {PAD_ENVIRONMENT} from '../src/course/environment';
const profile=(process.argv[2]??'slingmods-sport-v4') as HandlingProfileId;
for(const name of ['held-turn','corrections','turn-brake','minor-curb','hard-barrier']){
 const obstacle=name==='minor-curb'?[{id:'curb',center:[-.88,.065,-48],size:[.65,.13,1.3]}]:name==='hard-barrier'?[{id:'wall',center:[0,.6,-65],size:[12,1.2,.6]}]:[];
 const sim=await Simulation.create({...PAD_ENVIRONMENT,obstacles:obstacle,ramps:[],surfaceAt:()=>({id:'asphalt',mu:1.05,rolling:.014})},profile);sim.reset({x:0,z:0});const input=new InputResolver(profile);
 let roll=0,slip=0,maxSpeed=0,maxY=0,minUp=1,air=0,pitch=0,stopSpeed=0;
 for(let i=0;i<720;i++){const t=i/60,keys:string[]=[];if(t>1&&t<7)keys.push('KeyW');if(t>=5&&t<7){if(name==='held-turn'||name==='turn-brake')keys.push('KeyA');if(name==='corrections')keys.push(Math.floor((t-5)/.3)%2?'KeyD':'KeyA')}if(t>=6&&name==='turn-brake'){keys.splice(keys.indexOf('KeyW'),keys.includes('KeyW')?1:0);keys.push('KeyS')}if(t>=7)keys.push('KeyS');const control=input.poll(i*1000/60,{keys:new Set(keys),pads:[],focused:true},sim.telemetry().speed).control;sim.step(control);const a=sim.telemetry();for(const w of a.wheels)assert.ok(Math.hypot(w.longitudinalForce,w.lateralForce)<=w.gripLimit+1e-7);const q=a.quaternion,up=1-2*(q.x*q.x+q.z*q.z);minUp=Math.min(minUp,up);roll=Math.max(roll,Math.abs(Math.atan2(2*(q.w*q.z+q.x*q.y),up)));pitch=Math.max(pitch,Math.abs(Math.asin(Math.max(-1,Math.min(1,2*(q.w*q.x-q.y*q.z))))));maxY=Math.max(maxY,a.position.y);maxSpeed=Math.max(maxSpeed,a.speed);const right={x:1-2*(q.y*q.y+q.z*q.z),z:2*(q.x*q.z-q.w*q.y)};if(a.speed>5)slip=Math.max(slip,Math.abs(Math.atan2(a.velocity.x*right.x+a.velocity.z*right.z,a.speed)));if(!a.wheels.some(w=>w.contact))air++;stopSpeed=a.speed;}
 assert.ok(minUp>.95,name+' stays upright');assert.ok(Math.abs(stopSpeed)<.2,name+' stops');if(name!=='hard-barrier')assert.ok(slip<.25,name+' slide stays recoverable');assert.ok(pitch>.005,'suspension pitch remains');
 console.log(JSON.stringify({profile,name,maxSpeed,rollDeg:roll*180/Math.PI,slipDeg:slip*180/Math.PI,pitchDeg:pitch*180/Math.PI,maxY,minUp,airTicks:air,stopSpeed}));sim.dispose();
}
