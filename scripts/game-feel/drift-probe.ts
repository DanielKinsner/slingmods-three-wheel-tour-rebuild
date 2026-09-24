/**
 * Headless probe for the arcade drift layer (Phase 4B): a car at speed pulls the handbrake with steering, holds the
 * slide, releases and counter-steers straight. Prints rear slip, charge, tier and boost over time.
 *   npx tsx scripts/game-feel/drift-probe.ts     HOLD=1.6 STEER=1 SPEED=25 DRIFT=0 (to compare with the layer off)
 */
import {RaceWorld,FIXED_DT} from '../../src/simulation';
const hold=Number(process.env.HOLD??1.6),steer=Number(process.env.STEER??1),speed0=Number(process.env.SPEED??25),on=process.env.DRIFT!=='0';
const world=await RaceWorld.create(undefined,'slingmods-sport-v5');world.addVehicle('player',{x:0,z:0,yaw:0});world.initialize();
const car=world.get('player');car.enableDrift(on);car.setMotion({x:0,y:0,z:-speed0},{x:0,y:0,z:0});
let last=-1,events=0;
for(let i=0;i<60*6;i++){
 const t=i/60,phase=t<.3?'line':t<.3+hold?'drift':'exit',tel=car.telemetry();
 // Exit: steer against the slide until straight (a simple counter-steer on yaw rate).
 const control={throttle:phase==='line'?.6:.8,brake:0,steer:phase==='drift'?steer:phase==='exit'?Math.max(-1,Math.min(1,-tel.angularVelocity.y*.9)):0,reverse:false,handbrake:phase==='drift'?1:0};
 world.step({player:control},FIXED_DT);const d=car.drift();
 if(d.eventCount!==events){events=d.eventCount;console.log(`t=${t.toFixed(2)} EVENT ${d.event} tier ${d.eventTier}`)}
 if(Math.floor(t*4)!==last){last=Math.floor(t*4);const w=car.telemetry().wheels[2];console.log(`t=${t.toFixed(2)} ${phase.padEnd(5)} speed ${car.telemetry().speed.toFixed(1)} rearSlip ${(w.slipAngle*57.3).toFixed(0)}deg yawRate ${car.telemetry().angularVelocity.y.toFixed(2)} charge ${d.charge.toFixed(2)} tier ${d.tier} boost ${d.boostLeft.toFixed(2)} active ${d.active}`)}
}
console.log('boosts',car.drift().boosts,'forfeits',car.drift().forfeits);world.dispose();
