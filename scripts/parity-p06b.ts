import {Simulation,FIXED_DT} from '../src/simulation';
import {writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const sim=await Simulation.create();const rows=[];
for(let i=0;i<4200;i++) { if(i===1800)sim.reset({x:8,z:80,yaw:.2}); if(i===3000)sim.reset({x:-8,z:45});
 const n=i%1800; const control={throttle:n<480?.7:n>=1000&&n<1400?.45:0,brake:n>=480&&n<640||n>=1400?.8:0,steer:n<300?0:n<480?.32:n<800?-.4:0,reverse:n>=1000&&n<1400};sim.step(control,FIXED_DT);rows.push(sim.telemetry());}
sim.dispose();const bytes=JSON.stringify(rows),hash=createHash('sha256').update(bytes).digest('hex');
const dir='director-kit/production/evidence/P05/';
if(false){writeFileSync(dir+'solo-before.json',bytes);console.log(JSON.stringify({rows:rows.length,hash}));}
else {const before=readFileSync(dir+'solo-before.json','utf8');if(bytes!==before)throw Error('Exact one-car parity failed');writeFileSync('director-kit/production/evidence/P06B/parity.json',JSON.stringify({exact:true,rows:rows.length,hash,fixture:'scripts/parity-p05.ts'},null,2));console.log('EXACT PARITY',rows.length,hash);}
