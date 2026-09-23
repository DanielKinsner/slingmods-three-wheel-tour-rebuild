import {readFile,writeFile} from 'node:fs/promises';import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),validator=require('../../.tools/gltf-audit/node_modules/gltf-validator'),report={};
for(const name of ['spyder-f3','spyder-products','spyder-rider']){const data=await readFile(`public/assets/spyder/${name}.glb`);const result=await validator.validateBytes(new Uint8Array(data),{uri:name+'.glb',maxIssues:200});report[name]=result;console.log(name,result.issues.numErrors,result.issues.numWarnings);}
await writeFile('assets/spyder/evidence/gltf-validator.json',JSON.stringify(report,null,2));assert.ok(Object.values(report).every(r=>r.issues.numErrors===0),'GLBs must have zero validator errors');
