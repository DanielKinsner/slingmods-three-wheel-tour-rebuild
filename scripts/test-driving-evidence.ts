import {writeFileSync,mkdirSync} from 'node:fs';
import {scenarios,runScenario} from '../src/simulation/scenarios.ts';
import {Simulation,FixedClock,FIXED_DT,SPEC} from '../src/simulation/index.ts';
import {AutoDrive,engineTorque} from '../src/simulation/drivetrain.ts';
import layout from '../public/assets/slingshot-contact-layout.json';
const out='director-kit/production/evidence/G2';mkdirSync(out,{recursive:true});const summary=[];
for(const s of scenarios){const {frames,inputs}=await runScenario(s);const final=frames.at(-1)!;const start=frames[119];
 const data={name:s.name,seconds:s.seconds,finalPosition:final.position,finalSpeed:final.speed,maxSpeed:Math.max(...frames.map(f=>f.speed)),minRootY:Math.min(...frames.map(f=>f.position.y)),maxRootY:Math.max(...frames.map(f=>f.position.y)),minUpright:Math.min(...frames.map(f=>1-2*(f.quaternion.x**2+f.quaternion.z**2))),minContacts:Math.min(...frames.slice(120).map(f=>f.wheels.filter(w=>w.contact).length)),maxSlip:Math.max(...frames.map(f=>Math.max(...f.wheels.map(w=>Math.abs(w.slipRatio))))),gears:[...new Set(frames.map(f=>f.gear))],shiftTicks:frames.filter(f=>f.shifting).length,surfaces:[...new Set(frames.flatMap(f=>f.wheels.map(w=>w.surface)))],distance:Math.hypot(final.position.x-start.position.x,final.position.z-start.position.z)};
 summary.push(data);writeFileSync(`${out}/telemetry-${s.name}.json`,JSON.stringify({provenance:'Actual Rapier 0.20 Node WASM fixed60 simulation; every6th telemetry frame, all tick inputs. Render/human evidence separate.',scenario:{...s,control:undefined},inputs,frames:frames.filter((_,i)=>i%6===5)},null,2));console.log(JSON.stringify(data));
}
writeFileSync(`${out}/dynamics-summary.json`,JSON.stringify({created:new Date().toISOString(),node:process.version,summary},null,2));
const caps=[];
for(const cap of [30,60,120,144]){const sim=await Simulation.create(),clock=new FixedClock();let ticks=0;for(let frame=0;frame<cap*12;frame++)clock.advance(1/cap,()=>{const t=ticks/60;sim.step({throttle:t>2?.7:0,steer:t>5?Math.sin(t)*.3:0,brake:0,reverse:false});ticks++});caps.push({cap,ticks,droppedSeconds:clock.droppedSeconds,final:sim.telemetry()});sim.dispose()}
writeFileSync(`${out}/dynamics-frame-caps.json`,JSON.stringify({provenance:'Actual fixed-clock Node simulation cap scheduling. Isolated runtime render captures are a separate lead-owned test.',seconds:12,capTolerancePercent:1,caps},null,2));
const drive=new AutoDrive(),sweep=[];
for(let tick=0;tick<3000;tick++){const speed=Math.min(tick/60*1.8,78),state=drive.step(speed,0,layout.wheels[2].radius,1,0,false,FIXED_DT);if(tick%6===5)sweep.push({time:(tick+1)/60,prescribedSpeed:speed,gear:drive.gear,rpm:drive.rpm,shiftRemaining:drive.shiftRemaining,outputForce:state.force,torqueNm:engineTorque(drive.rpm),powerWatts:engineTorque(drive.rpm)*drive.rpm*Math.PI/30})}
writeFileSync(`${out}/dynamics-five-speed.json`,JSON.stringify({provenance:'Isolated authoritative AutoDrive module sweep with prescribed wheel-equivalent speed. This is NOT a chassis acceleration run or a real vehicle performance claim. Driving scenarios separately demonstrate integration on the pad.',spec:SPEC,sweep},null,2));
