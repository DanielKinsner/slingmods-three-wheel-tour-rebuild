#!/usr/bin/env node
/** Read-only steering command diagnostic. Node 24+; no dependencies or writes.
 * Usage: node tools/steering-baseline.mjs /absolute/path/to/existing-checkout > NEW-evidence.json
 * This executes the current profile function. It is NOT a driving simulation,
 * a proposed fix, or an acceptance test. Read index.ts for actual brake behavior.
 */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
try {
  const root=path.resolve(process.argv[2]??process.cwd());
  const modulePath=path.join(root,'src','simulation','profile.ts');
  if(!fs.existsSync(modulePath))throw new Error(`Missing profile source at ${modulePath}. Pass the actual existing checkout root.`);
  const {HANDLING_PROFILES,steeringLimit}=await import(pathToFileURL(modulePath).href);
  if(!HANDLING_PROFILES||typeof steeringLimit!=='function')throw new Error('The profile API changed; inspect and adapt this diagnostic without changing game source.');
  const wheelbase=2.667; // reviewed shared contact geometry, metres
  const rows=[];
  for(const [id,p] of Object.entries(HANDLING_PROFILES)) {
    for(const mph of [0,10,20,30,40,50,60,70,90,110]) {
      const speed=mph*.44704;
      const cap=steeringLimit(speed,id,wheelbase);
      if(!Number.isFinite(cap)||cap<0)throw new Error(`Invalid steering limit for ${id} at ${mph} mph.`);
      for(const brake of [0,.25,.5,1])for(const demand of [-1,-.75,-.5,-.25,0,.25,.5,.75,1]) {
        const relief=Number(p.brakeSteerRelief??0);
        const angle=demand*cap*(id==='legacy-p08a'?1:1-relief*brake);
        rows.push({profile:id,mph,speedMps:speed,brake,demand,
          speedCapDegrees:cap*180/Math.PI,
          requestedEquivalentRoadWheelDegrees:angle*180/Math.PI,
          idealUnsignedRadiusMetres:Math.abs(angle)>1e-9?wheelbase/Math.abs(Math.tan(angle)):null});
      }
    }
  }
  console.log(JSON.stringify({diagnostic:'Current exported command curve, without integration or rate limit',
    assumptions:'Brake multiplier mirrors the reviewed v1/v2 index.ts. Adapt if candidate changes that API. Radii are ideal no-slip geometry; null means straight. Angles are not hand-wheel rotation. No OEM assertion.',wheelbase,rows},null,2));
} catch(error) { console.error(error instanceof Error?error.message:String(error)); process.exitCode=1; }
