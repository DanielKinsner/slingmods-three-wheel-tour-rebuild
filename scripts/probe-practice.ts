import {Simulation} from '../src/simulation';import {DrivingSession} from '../src/driving/session';
const make=(axis=0,throttle=0,brake=0,buttons:number[]=[])=>({keys:new Set<string>(),focused:true,pads:[{index:0,id:'virtual-standard',connected:true,mapping:'standard',axes:[axis],buttons:Array.from({length:17},(_,i)=>({value:i===7?throttle:i===6?brake:buttons.includes(i)?1:0}))}]});
const sim=await Simulation.create();let sample=make();const session=new DrivingSession(sim,()=>sample);session.reset();const result=[];
for(let frame=0;frame<=1800;frame++){const t=frame/60;let axis=0,throttle=0,brake=0;const buttons=[];
if(t>=.8&&t<5)throttle=.32;else if(t>=5&&t<7.5){axis=-.32;throttle=.04}else if(t>=7.5&&t<10.5){axis=.42;throttle=.04}else if(t>=10.5&&t<13.5){axis=-.36;throttle=.04}else if(t>=13.5&&t<18){axis=.30;throttle=.04}else if(t>=18&&t<21)brake=.5;
if(t>=23&&t<23.1)buttons.push(1);if(t>=23.3&&t<25.5)throttle=.18;if(t>=25.5&&t<27.5)brake=.5;
sample=make(axis,throttle,brake,buttons);const r=session.frame(t*1000);if(frame%60===0)result.push({t,x:r.current.position.x,z:r.current.position.z,speed:r.current.speed,steer:r.current.steer,gear:r.current.gear})}
console.log(JSON.stringify(result));sim.dispose();
