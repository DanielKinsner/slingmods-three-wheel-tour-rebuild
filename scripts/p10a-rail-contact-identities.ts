import fs from 'node:fs';import {gunzipSync} from 'node:zlib';import {RaceWorld} from '../src/simulation';import {createRidgeEnvironment,RIDGE_ROUTE} from '../src/ridge/route';
const dir=process.env.EVIDENCE_DIR;if(!dir)throw Error('Existing rail brush EVIDENCE_DIR required');const output=dir+'/contact-identities.json';if(fs.existsSync(output))throw Error('Will not overwrite identity proof');
const w=await RaceWorld.create(createRidgeEnvironment(),'slingmods-sport-v3'),rows=[];
try{for(const id of['maya','jett','nico']){
 const a=JSON.parse(gunzipSync(fs.readFileSync(dir+'/'+id+'.json.gz')).toString()),r=a.find((r:any)=>r.diagnostics.contacts.some((c:any)=>c.points.some((p:any)=>p.normalImpulse>0)));
 for(const c of r.diagnostics.contacts.filter((c:any)=>c.points.some((p:any)=>p.normalImpulse>0))){const o=w.world.getCollider(c.other),p=o.translation(),box=RIDGE_ROUTE.colliders.find(b=>Math.hypot(b.center[0]-p.x,b.center[1]-p.y,b.center[2]-p.z)<.001);if(!box)throw Error('Impulse did not map to authored rail');rows.push({id,tick:r.tick,kind:c.kind,wheel:c.wheel,handle:c.other,collider:box.id,center:p,maxImpulse:Math.max(...c.points.map((p:any)=>p.normalImpulse))})}
}}finally{w.dispose()}
fs.writeFileSync(output,JSON.stringify({pass:true,method:'Read-only matching of recorded first-impulse collider handles to a fresh identical static collider layout; no additional driving',rows},null,2));console.log(rows);
