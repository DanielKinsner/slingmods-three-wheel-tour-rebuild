import ts from '/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js';
import fs from 'node:fs/promises';
export async function resolve(specifier,context,next){
 try{return await next(specifier,context)}catch(error){
  if(context.parentURL&&(specifier.startsWith('.')||specifier.startsWith('file:'))){
   const base=new URL(specifier,context.parentURL);
   for(const tail of ['.ts','/index.ts']){
    const url=new URL(base.href+tail);try{await fs.access(url);return {url:url.href,shortCircuit:true}}catch{}
   }
  }
  throw error;
 }
}
export async function load(url,context,next){
 if(url.endsWith('.ts')){
  const text=await fs.readFile(new URL(url),'utf8');
  const source=ts.transpileModule(text,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,verbatimModuleSyntax:false},fileName:url}).outputText;
  return {format:'module',source,shortCircuit:true};
 }
 return next(url,context);
}
