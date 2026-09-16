import type{DeviceSample}from'../../src/driving/input';
/** Evidence-only virtual device. Same player path; no transform/gear injection or modified physics. */
export function firstDriveSample(t:number):DeviceSample{let axis=0,throttle=0,brake=0;const buttons:number[]=[];
 if(t>=3&&t<8)throttle=1;if(t>=5&&t<5.7)axis=-.13;else if(t>=5.7&&t<6.4)axis=.13;if(t>=9&&t<12)brake=.85;
 if(t>=14&&t<22)throttle=.20;if(t>=15&&t<18)axis=-.22;else if(t>=18&&t<21)axis=.22;if(t>=22&&t<24)brake=.6;
 for(const start of[4,6.8,13,20,21,31])if(t>=start&&t<start+.1)buttons.push(3);
 if((t>=7.2&&t<7.4)||(t>=21.2&&t<21.4)||(t>=31.5&&t<31.7))buttons.push(4);
 if((t>=24&&t<24.1)||(t>=25&&t<25.1))buttons.push(9);if(t>=28&&t<29.3)buttons.push(0);
 return{keys:new Set(),focused:true,pads:[{index:0,id:'Virtual standard First Drive evidence',mapping:'standard',connected:true,axes:[axis],buttons:Array.from({length:17},(_,i)=>({value:i===7?throttle:i===6?brake:buttons.includes(i)?1:0,pressed:buttons.includes(i)}))}]};
}
