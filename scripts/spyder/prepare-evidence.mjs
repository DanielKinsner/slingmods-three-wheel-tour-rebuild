import {build} from 'vite';import path from 'node:path';
await build({configFile:false,logLevel:'silent',publicDir:false,build:{outDir:path.resolve('.tools/ryker-agent'),emptyOutDir:false,minify:false,lib:{entry:path.resolve('scripts/crew-evidence-agent.ts'),name:'CrewEvidence',formats:['iife'],fileName:()=> 'agent.js'}}});
