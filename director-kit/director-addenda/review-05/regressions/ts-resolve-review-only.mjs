// Review-only native-Node resolver; never changes the supplied project source.
import {existsSync,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
export async function resolve(specifier,context,nextResolve) {
 if ((specifier.startsWith('.')||specifier.startsWith('/')) && context.parentURL) {
  const u=new URL(specifier,context.parentURL);
  if(u.protocol==='file:') {
   for(const suffix of ['', '.ts', '/index.ts']) {
    const trial=new URL(u.href+suffix);
    if(existsSync(trial)&&statSync(fileURLToPath(trial)).isFile())return nextResolve(trial.href,context);
   }
  }
 }
 return nextResolve(specifier,context);
}
