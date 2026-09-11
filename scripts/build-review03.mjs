import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';import {execFileSync,spawnSync} from 'node:child_process';import assert from 'node:assert/strict';
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?files(dir+'/'+d.name):[dir+'/'+d.name])}
const paths=[...files('src'),...files('public'),'package.json','package-lock.json','index.html','vite.config.ts','tsconfig.json','scripts/build-review03.mjs','scripts/record-p03a1.mjs','scripts/capture-p03a1-stills.mjs','scripts/verify-p03a1-browser.mjs'];
function snapshot(){return Object.fromEntries(paths.sort().map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')]))}
const before=snapshot(),commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const result=spawnSync('npm run build',{shell:true,cwd:process.cwd(),stdio:'inherit'});if(result.status!==0)process.exit(result.status??1);
assert.deepEqual(snapshot(),before,'Build inputs changed while compiling');
const report={commit,created:new Date().toISOString(),command:'node scripts/build-review03.mjs (npm run build)',inputs:before,method:'SHA256 snapshot immediately before compile; input equality checked after successful compile. Served bytes checked separately during capture.'};
writeFileSync('dist/review-build.json',JSON.stringify(report,null,2));console.log('REVIEW BUILD inputs stable; commit '+commit);
