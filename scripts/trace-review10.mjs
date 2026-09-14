// Diagnostic-only derivative of the frozen native harness. Never score trace timing as clean performance.
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const source=await fs.readFile('scripts/profile-review10.mjs','utf8');
const original="try{await p.goto";
if(!source.includes(original))throw Error('Frozen harness seam changed');
let traced=source.replace(original,"const traceSession=await ctx.newCDPSession(p);await traceSession.send('Tracing.start',{categories:'devtools.timeline,v8,gpu,disabled-by-default-v8.gc,blink.user_timing',transferMode:'ReturnAsStream'});try{await p.goto");
traced=traced.replace('}finally{video=p.video();',"}finally{const ended=new Promise(resolve=>traceSession.once('Tracing.tracingComplete',resolve));await traceSession.send('Tracing.end');const {stream}=await ended;let traceText='';for(;;){const chunk=await traceSession.send('IO.read',{handle:stream});traceText+=chunk.base64Encoded?Buffer.from(chunk.data,'base64').toString():chunk.data;if(chunk.eof)break}await traceSession.send('IO.close',{handle:stream});await fs.writeFile(dir+'/diagnostic-trace.json',traceText);video=p.video();");
const generated='scripts/review10-trace-generated.mjs';
await fs.writeFile(generated,traced,{flag:'wx'});
await fs.writeFile('director-kit/production/evidence/P05/trace-harness-provenance.json',JSON.stringify({source:'scripts/profile-review10.mjs',sourceSha256:createHash('sha256').update(source).digest('hex'),generatedSha256:createHash('sha256').update(traced).digest('hex'),method:'Same ordinary player and production rival path, with CDP timeline/GC/GPU tracing added. Diagnostic only; not clean performance.'},null,2),{flag:'wx'});
execFileSync(process.execPath,[generated],{stdio:'inherit',env:{...process.env,WIDTH:'1280',EQUIPPED:'0',RACES:'1',SEED:'97',RECORD:'0',EVIDENCE_DIR:'director-kit/production/evidence/P05/diagnostic-stock720'}});
