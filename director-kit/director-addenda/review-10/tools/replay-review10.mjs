import {readFile,writeFile} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createGunzip} from 'node:zlib';
import {createInterface} from 'node:readline';
import {randomUUID,createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
if (!process.argv[2] || !process.argv[3]) throw new Error('Usage: replay-review10.mjs <extracted Review10 root> <output directory>');
const root=resolve(process.argv[2])+'/';
const outputDir=resolve(process.argv[3]);
await mkdir(outputDir,{recursive:true});
const {CrewRace}=await import(pathToFileURL(join(root,'src/competition/race.ts')).href);
const {freshCareer,transition}=await import(pathToFileURL(join(root,'src/career/store.ts')).href);
const {PRODUCT}=await import(pathToFileURL(join(root,'src/career/catalog.ts')).href);
const base=root+'director-kit/production/evidence/P05/competition-repaired/';
const route=JSON.parse(await readFile(root+'public/assets/harbor/route.json','utf8'));
const reports=[];const proofs=[];
for (const name of ['podium-11','field-player-97']) {
 const report=JSON.parse(await readFile(base+name+'.json','utf8'));
 const manager=new CrewRace(route,Object.keys(report.grid));manager.restart(report.result.attemptId);
 const filename=base+name+'-ticks.jsonl.gz';
 assert.equal(createHash('sha256').update(await readFile(filename)).digest('hex'),report.rawTelemetry.sha256);
 let prev=null,frames=0,changes=[],lastOrder='',maxSpeed=0,controlBounds=true,worldTimeConsistent=true,minGap=Infinity;
 for await (const line of createInterface({input:createReadStream(filename).pipe(createGunzip()),crlfDelay:Infinity})) {
  const row=JSON.parse(line),current=row.telemetry;
  assert.equal(row.tick,frames);
  manager.tick(prev??current,current,1/60); const s=manager.snapshot();
  if (s.phase==='running') {
    const order=s.standings.map(v=>v.id).join(',');
    if(order!==lastOrder){changes.push({tick:row.tick,raceMs:s.elapsedMs,order});lastOrder=order;}
    const ids=Object.keys(current);
    for (const id of ids) {
      const t=current[id],c=row.controls[id];maxSpeed=Math.max(maxSpeed,Math.abs(t.speed));
      if(![c.throttle,c.brake,c.steer].every(Number.isFinite)||c.throttle<0||c.throttle>1||c.brake<0||c.brake>1||Math.abs(c.steer)>1.0000001)controlBounds=false;
      if(Math.abs(t.time-(row.tick+1)/60)>1e-6)worldTimeConsistent=false;
      if(id!=='player')minGap=Math.min(minGap,Math.hypot(t.position.x-current.player.position.x,t.position.z-current.player.position.z));
    }
  }
  prev=current;frames++;
 }
 const final=manager.snapshot();assert.deepEqual(final,report.result);
 const before=manager.snapshot().playerResult;const proof=manager.awardProof();
 for(let k=0;k<5;k++)manager.tick(prev,prev,1/60);
 assert.deepEqual(manager.snapshot().playerResult,before);assert.equal(manager.awardProof(),proof);proofs.push(proof);
 reports.push({name,frames,allParticipantResultsReproducedExactly:true,terminalIdempotent:true,result:final.playerResult,standings:final.standings,rankChanges:changes,allControlsBounded:controlBounds,participantTimeConsistent:worldTimeConsistent,maxSpeedMph:maxSpeed*2.2369362920544,closestPlayerRivalCenterGapMeters:minGap});
}
let career=freshCareer();const balances=[career.credits];
career=transition(career,{type:'award',event:'harbor',valid:true,id:randomUUID(),timeMs:80000}).state;balances.push(career.credits);
career=transition(career,{type:'purchase',id:randomUUID(),productId:PRODUCT.id,vehicleId:PRODUCT.vehicleId}).state;balances.push(career.credits);
career=transition(career,{type:'appearance',patch:{color:'cyan',brightness:.6}}).state;
const awards=[];
for(const proof of proofs){const result=transition(career,{type:'crew-award',result:proof});career=result.state;balances.push(career.credits);const repeat=transition(career,{type:'crew-award',result:proof});assert.equal(repeat.changed,false);assert.deepEqual(repeat.state,career);awards.push(result.receipt);}
assert.deepEqual(balances,[0,800,200,750,850]);
const output={method:'Fresh execution of the submitted CrewRace manager against every supplied 60Hz telemetry sample, not a new Rapier simulation or rendered playtest. Pure career transitions then consume the manager-issued finish proofs. The starting clean-lap award is a constructed valid fixture, not a newly driven lap.',reports,career:{balances,awards,duplicatesIgnored:true,final:{owned:career.owned,equipped:career.equipped,appearance:career.appearance,crew:career.crew}}};
await writeFile(join(outputDir,'independent-race-career-replay.json'),JSON.stringify(output,null,2));
console.log(JSON.stringify({frames:reports.map(r=>r.frames),results:reports.map(r=>r.result),rankChanges:reports.map(r=>r.rankChanges),balances},null,2));
