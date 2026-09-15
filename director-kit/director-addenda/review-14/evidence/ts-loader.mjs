import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import ts from '/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js';
export async function resolve(specifier,context,next){
 if(specifier.startsWith('.')&&context.parentURL){
  const url=new URL(specifier,context.parentURL);
  for(const candidate of [url.href, url.href+'.ts',url.href+'/index.ts',url.href.endsWith('.js')?url.href.slice(0,-3)+'.ts':'']){
   if(candidate&&existsSync(fileURLToPath(candidate))){
    const st=await fs.stat(fileURLToPath(candidate));if(st.isFile())return {url:candidate,shortCircuit:true};
   }
  }
 }
 return next(specifier,context);
}
export async function load(url,context,next){
 if(url.startsWith('file:')&&url.endsWith('.ts')){
  const source=await fs.readFile(fileURLToPath(url),'utf8');
  return{format:'module',source:ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022},fileName:fileURLToPath(url)}).outputText,shortCircuit:true};
 }
 if(url.startsWith('file:')&&url.endsWith('.json'))return{format:'module',source:'export default '+await fs.readFile(fileURLToPath(url),'utf8')+';',shortCircuit:true};
 return next(url,context);
}
