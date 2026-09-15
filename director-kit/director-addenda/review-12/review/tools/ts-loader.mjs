// Read-only review loader. Uses the container's TypeScript to erase types; no source edits.
import ts from '/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
export async function resolve(specifier,context,nextResolve){
 try{return await nextResolve(specifier,context)}catch(error){
  if(specifier.startsWith('.')&&context.parentURL){
   const base=fileURLToPath(new URL(specifier,context.parentURL));
   for(const p of [base+'.ts',base+'.mjs',base+'.js',path.join(base,'index.ts')]){
    try{if((await stat(p)).isFile())return{url:pathToFileURL(p).href,shortCircuit:true}}catch{}
   }
  }
  throw error;
 }
}
export async function load(url,context,nextLoad){
 if(url.startsWith('file:')&&url.endsWith('.json')){
  const raw=await readFile(fileURLToPath(url),'utf8');
  return{format:'module',source:'export default '+raw+';',shortCircuit:true};
 }
 if(url.startsWith('file:')&&url.endsWith('.ts')){
  const source=await readFile(fileURLToPath(url),'utf8');
  return{format:'module',source:ts.transpileModule(source,{fileName:fileURLToPath(url),compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,verbatimModuleSyntax:false}}).outputText,shortCircuit:true};
 }
 return nextLoad(url,context);
}
