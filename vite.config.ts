import {defineConfig} from 'vite';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
let buildRef='review-package';
try{buildRef=execFileSync('git',['rev-parse','--short=12','HEAD'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();if(execFileSync('git',['diff','--name-only','HEAD'],{cwd:root,encoding:'utf8'}).trim())buildRef+='-working';}catch{/* Extracted review ZIP has no Git metadata. */}
export default defineConfig({define:{__BUILD_REF__:JSON.stringify(buildRef)},server:{host:'127.0.0.1',port:5186,strictPort:true},preview:{host:'127.0.0.1',port:5186,strictPort:true}});
