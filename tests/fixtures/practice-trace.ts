import type {DeviceSample} from '../../src/driving/input';
/** Controlled virtual device trace for isolated evidence only. Never imported by the game. */
export function practiceSample(t:number):DeviceSample {
 let axis=0,throttle=0,brake=0;const buttons:number[]=[];
 if(t>=.8&&t<5)throttle=.32;else if(t>=5&&t<7.5){axis=-.32;throttle=.04}else if(t>=7.5&&t<10.5){axis=.42;throttle=.04}else if(t>=10.5&&t<13.5){axis=-.36;throttle=.04}else if(t>=13.5&&t<18){axis=.30;throttle=.04}else if(t>=18&&t<21)brake=.5;
 if((t>=6&&t<6.12)||(t>=12.8&&t<12.92))buttons.push(3);
 if(t>=14.5&&t<16.5)buttons.push(4);
 if((t>=21.2&&t<21.32)||(t>=22.2&&t<22.32))buttons.push(9);
 if(t>=23&&t<23.12)buttons.push(1);if(t>=23.3&&t<25.5)throttle=.18;if(t>=25.5&&t<27.5)brake=.5;
 if(t>=28.2&&t<29.4)buttons.push(0);
 return {keys:new Set(),focused:true,pads:[{index:0,id:'Virtual standard input (automated test)',connected:true,mapping:'standard',axes:[axis],buttons:Array.from({length:17},(_,i)=>({value:i===7?throttle:i===6?brake:buttons.includes(i)?1:0,pressed:buttons.includes(i)}))}]};
}
