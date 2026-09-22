import {createRequire} from 'node:module';import {readFile,writeFile} from 'node:fs/promises';import path from 'node:path';
const [runtime,out,validatorFolder]=process.argv.slice(2);if(!validatorFolder)throw Error('Usage: node format-validation.mjs runtime-folder output-folder validator-node_modules-folder');
const require=createRequire(import.meta.url),validator=require(path.resolve(validatorFolder,'gltf-validator'));
const data=await readFile(path.join(runtime,'ryker-900.glb'));
const result=await validator.validateBytes(new Uint8Array(data),{uri:'ryker-900.glb',maxIssues:1000,externalResourceFunction:async uri=>{throw Error('Unexpected external resource '+uri)}});
await writeFile(path.join(out,'gltf-validator.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result.issues,null,2));if(result.issues.numErrors)process.exitCode=1;
