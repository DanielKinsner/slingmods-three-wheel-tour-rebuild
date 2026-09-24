/** Headless check of parts game tuning: speed after N seconds of full throttle from a rolling start. */
import {RaceWorld,FIXED_DT,type VehicleTuning} from '../../src/simulation';
const start=Number(process.env.START??20),secs=Number(process.env.SECS??4);
for(const [name,t] of [['stock',{power:1,grip:1,aeroGrip:0,drag:1}],['+4% power',{power:1.04,grip:1,aeroGrip:0,drag:1}],['-2% drag',{power:1,grip:1,aeroGrip:0,drag:.98}],['+3% drag',{power:1,grip:1,aeroGrip:0,drag:1.03}]] as [string,VehicleTuning][]){
 const w=await RaceWorld.create(undefined,'slingmods-sport-v5');w.addVehicle('p',{x:0,z:0,yaw:0});w.initialize();w.get('p').configureTuning(t);w.get('p').setMotion({x:0,y:0,z:-start},{x:0,y:0,z:0});
 const marks:string[]=[];for(let i=0;i<secs*60;i++){w.step({p:{throttle:1,brake:0,steer:0,reverse:false}},FIXED_DT);if((i+1)%60===0)marks.push(w.get('p').telemetry().speed.toFixed(2))}
 console.log(name.padEnd(10),marks.join('  '));w.dispose();
}
