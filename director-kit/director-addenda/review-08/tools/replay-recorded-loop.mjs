import fs from 'node:fs';import assert from 'node:assert/strict';
import path from 'node:path';import {pathToFileURL}from'node:url';
if(process.argv.length<4)throw Error('Usage: node with TS loader replay-recorded-loop.mjs REVIEW08_ROOT OUTPUT_DIRECTORY');
const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);fs.mkdirSync(out,{recursive:true});
const {RaceAttempt}=await import(pathToFileURL(path.join(root,'src/race/attempt.ts')).href);
const {freshCareer,transition}=await import(pathToFileURL(path.join(root,'src/career/store.ts')).href);
const {PRODUCT}=await import(pathToFileURL(path.join(root,'src/career/catalog.ts')).href);
const load=p=>JSON.parse(fs.readFileSync(root+'/'+p,'utf8'));const route=load('public/assets/harbor/route.json');const summary=load('director-kit/production/evidence/Review08-final/RESULTS.json');
const checks=[];let career=freshCareer();career=transition(career,{type:'entry'}).state;const balances=[career.credits];
for(const preset of ['day','night']){
 const rows=load(`director-kit/production/evidence/Review08-final/${preset}-timeline.json`);const r=new RaceAttempt(route,preset);r.start();let prev=rows[0].telemetry,ticks=rows[0].ticks;
 for(const row of rows){if(row.ticks===ticks)continue;assert.equal(row.ticks,ticks+1);r.tick(prev,row.telemetry,1/60);prev=row.telemetry;ticks=row.ticks}
 const finish=r.snapshot().result;assert.ok(finish?.valid);const reported=summary.attempts.find(a=>a.preset===preset);assert.ok(Math.abs(finish.timeMs-reported.result.timeMs)<1e-6);
 const c={type:'award',event:'harbor',valid:finish.valid,timeMs:finish.timeMs,id:reported.attemptId};const earned=transition(career,c);career=earned.state;balances.push(career.credits);const duplicate=transition(career,c);assert.equal(duplicate.changed,false);assert.deepEqual(duplicate.state,career);
 checks.push({preset,id:c.id,reconstructedTimeMs:finish.timeMs,valid:finish.valid,award:earned.receipt.amount,balance:career.credits,duplicateNoChange:!duplicate.changed});
 if(preset==='day'){
  const receipt=Object.values(summary.receipts).find(r=>r.kind==='purchase');career=transition(career,{type:'purchase',id:receipt.id,productId:PRODUCT.id,vehicleId:PRODUCT.vehicleId},receipt.at).state;balances.push(career.credits);career=transition(career,{type:'appearance',patch:{color:'cyan',brightness:.7}}).state;
 }
}
assert.deepEqual(balances,[0,800,200,300]);assert.ok(career.owned&&career.equipped);assert.deepEqual(career.appearance,summary.inventory.appearance);assert.deepEqual(career.chapters,summary.inventory.chapters);
const result={method:'Independent replay of submitted telemetry into fresh actual RaceAttempt instances and valid result IDs into actual transition(); duplicates tested. This is race-rule/wallet logic execution, not physical driving or IndexedDB durability.',status:'PASS',checks,balances,appearance:career.appearance,chapters:career.chapters};fs.writeFileSync(out+'/independent-recorded-loop.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
