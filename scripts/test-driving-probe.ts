import {Simulation, type VehicleControl} from '../src/simulation/index.ts';
const sim=await Simulation.create();
const zero={throttle:0,brake:0,steer:0,reverse:false};
for(const name of ['rest','straight','left','right','coast','brake','reverse']){
 sim.reset();
 for(let i=0;i<900;i++){
  const t=i/60;let c:VehicleControl={...zero};
  if(name!=='rest')c.throttle=t<2?0:0.7;
  if(name==='left')c.steer=t>5?0.55:0;
  if(name==='right')c.steer=t>5?-0.55:0;
  if(name==='coast'&&t>8)c.throttle=0;
  if(name==='brake'&&t>8){c.throttle=0;c.brake=1}
  if(name==='reverse'){c.reverse=true;c.throttle=0.5}
  sim.step(c);
  if(i%180===179){const a=sim.telemetry();console.log(name,t.toFixed(1),JSON.stringify({p:a.position,v:a.speed,r:a.rpm,g:a.gear,q:a.quaternion,w:a.wheels.map(w=>[w.contact,Math.round(w.load),w.travel.toFixed(3),w.slipAngle.toFixed(2)])}))}
 }
}
sim.dispose();
