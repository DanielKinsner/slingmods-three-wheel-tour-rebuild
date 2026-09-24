import test from 'node:test';import assert from 'node:assert/strict';
import {RaceWorld,FIXED_DT,DRIFT,type VehicleControl} from '../src/simulation';
import {InputResolver} from '../src/driving/input';
// Phase 4B arcade drift -> boost. Off by default (career, trials, records); on only where a race enables it.
async function run(enabled:boolean,script:(t:number,yawRate:number)=>VehicleControl,seconds=4){
 const world=await RaceWorld.create(undefined,'slingmods-sport-v5');world.addVehicle('player',{x:0,z:0,yaw:0});world.initialize();
 const car=world.get('player');car.enableDrift(enabled);car.setMotion({x:0,y:0,z:-25},{x:0,y:0,z:0});
 const trace:{t:number;speed:number;x:number;z:number;tier:number;boost:number}[]=[];
 for(let i=0;i<seconds*60;i++){const tel=car.telemetry();world.step({player:script(i/60,tel.angularVelocity.y)},FIXED_DT);const now=car.telemetry(),d=car.drift();trace.push({t:i/60,speed:now.speed,x:now.position.x,z:now.position.z,tier:d.tier,boost:d.boostLeft})}
 const result={trace,drift:{...car.drift()}};world.dispose();return result;
}
const drift=(t:number,yawRate:number):VehicleControl=>t<.3?{throttle:.6,brake:0,steer:0,reverse:false}:t<1.9?{throttle:.8,brake:0,steer:1,reverse:false,handbrake:1}:{throttle:.8,brake:0,steer:Math.max(-1,Math.min(1,-yawRate*.9)),reverse:false};
test('with the layer off the handbrake changes nothing: identical motion to not pressing it',async()=>{
 const withHandbrake=await run(false,drift),without=await run(false,(t,y)=>{const c=drift(t,y);delete c.handbrake;return c});
 assert.deepEqual(withHandbrake.trace,without.trace);assert.equal(withHandbrake.drift.boosts,0);assert.equal(withHandbrake.drift.enabled,false);
});
test('a held handbrake slide charges tiers and a clean exit pays a boost that adds speed',async()=>{
 const {trace,drift:d}=await run(true,drift);
 assert.ok(Math.max(...trace.map(s=>s.tier))>=2,'reaches tier 2');assert.equal(d.boosts,1);assert.equal(d.forfeits,0);
 const fired=trace.findIndex(s=>s.boost>0);assert.ok(fired>0,'boost fires after the exit');
 const at=trace[fired].speed,later=trace[Math.min(trace.length-1,fired+Math.round(DRIFT.boostSeconds[2]*60))].speed;assert.ok(later>at+3,`boost adds speed: ${at.toFixed(1)} -> ${later.toFixed(1)}`);
 assert.ok(Math.min(...trace.slice(18,114).map(s=>s.speed))>14,'the slide keeps most of its momentum');
});
test('Space / controller X give a handbrake; without it the control object is exactly as before',()=>{
 const input=new InputResolver('slingmods-sport-v5'),poll=(keys:string[],now:number,pad?:number)=>input.poll(now,{keys:new Set(keys),pads:pad===undefined?[]:[{index:0,id:'pad',connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},(_,i)=>({value:i===pad?1:0,pressed:i===pad}))}],focused:true});
 poll([],0);poll([],16);
 assert.equal('handbrake' in poll(['KeyW'],32).control,false);
 assert.equal(poll(['KeyW','Space'],48).control.handbrake,1);
 poll([],64);poll([],80,-1);poll([],96,-1);
 assert.equal(poll([],112,2).control.handbrake,1,'controller X (button 2), once the pad has been seen at rest');
});
