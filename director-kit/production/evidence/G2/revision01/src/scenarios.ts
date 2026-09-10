import {Simulation,type VehicleControl,type VehicleTelemetry} from './index';
export const neutral:VehicleControl={throttle:0,brake:0,steer:0,reverse:false};
export type DrivingScenario={name:string;seconds:number;pose?:{x?:number;z?:number;y?:number;yaw?:number};control:(t:number,frame:VehicleTelemetry)=>VehicleControl};
const c=(x:Partial<VehicleControl>):VehicleControl=>({...neutral,...x});
export const scenarios:DrivingScenario[]=[
 {name:'rest',seconds:12,control:()=>c({})},
 {name:'straight',seconds:11,control:t=>c({throttle:t<2?0:0.75})},
 {name:'coast',seconds:13,control:t=>c({throttle:t>2&&t<8?0.75:0})},
 {name:'brake',seconds:13,control:t=>c({throttle:t>2&&t<8?0.75:0,brake:t>=8?1:0})},
 {name:'reverse',seconds:10,control:t=>c({reverse:true,throttle:t<2?0:0.5})},
 {name:'moving-reverse-interlock',seconds:14,control:t=>c({throttle:t<2?0:0.7,reverse:t>=7})},
 ...[1,-1].map(sign=>({name:sign>0?'left-circle':'right-circle',seconds:25,pose:{x:0,z:80},control:(t:number,f:VehicleTelemetry)=>c({throttle:t<2?0:Math.max(0,Math.min(0.5,(8-f.speed)*0.24)),steer:t>4?sign:0})})),
 {name:'slalom',seconds:15,control:(t,f)=>c({throttle:t<2?0:Math.max(0,Math.min(0.65,(12-f.speed)*0.24)),steer:t>4?Math.sin((t-4)*1.1)*0.75:0})},
 {name:'wet-traction-recovery',seconds:13,pose:{x:-28,z:-8},control:t=>c({throttle:t<2?0:t<8?1:0,steer:t>5&&t<8?0.25:0,tractionControl:false,brake:t>=9?0.5:0})},
 {name:'wet-assisted',seconds:8,pose:{x:-28,z:-8},control:t=>c({throttle:t<2?0:1})},
 {name:'dry-assisted',seconds:8,pose:{x:-8,z:-8},control:t=>c({throttle:t<2?0:1})},
 {name:'gravel',seconds:10,pose:{x:28,z:-8},control:t=>c({throttle:t<2?0:0.7})},
 {name:'one-wheel-bump',seconds:9,pose:{x:20,z:24},control:(t,f)=>c({throttle:t<2?0:Math.max(0,Math.min(0.5,(6-f.speed)*0.3))})},
 {name:'curb',seconds:9,pose:{x:30,z:24},control:(t,f)=>c({throttle:t<2?0:Math.max(0,Math.min(0.6,(7-f.speed)*0.3))})},
 {name:'split-seam',seconds:9,pose:{x:-25,z:26},control:(t,f)=>c({throttle:t<2?0:Math.max(0,Math.min(0.4,(5-f.speed)*0.3))})},
 {name:'barrier',seconds:12,pose:{x:42,z:-30},control:t=>c({throttle:t<2?0:t<8?0.9:0,brake:t>=8?1:0})},
 {name:'drop-landing',seconds:8,pose:{x:0,z:0,y:1.6},control:()=>c({})},
 {name:'incline-launch',seconds:11,pose:{x:-40,z:58},control:(t,f)=>c({throttle:t<2?0:Math.max(0,Math.min(0.7,(9-f.speed)*0.3))})},
 {name:'high-speed-lock',seconds:14,pose:{x:0,z:100},control:t=>c({throttle:t<2?0:1,steer:t>7?1:0})},
 {name:'high-speed-curb',seconds:12,pose:{x:30,z:70},control:t=>c({throttle:t<2?0:t<8?1:0,brake:t>=8?0.5:0})},
];
export async function runScenario(s:DrivingScenario){
 const sim=await Simulation.create();sim.reset(s.pose);const frames:VehicleTelemetry[]=[],inputs:VehicleControl[]=[];
 for(let tick=0;tick<Math.round(s.seconds*60);tick++){const control=s.control(tick/60,sim.telemetry());inputs.push(control);sim.step(control);frames.push(sim.telemetry())}
 sim.dispose();return {frames,inputs};
}
