import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath}from'node:url';
import {createStaticServer} from './static-demo.mjs';
const project=fileURLToPath(new URL('../',import.meta.url));
const publish=process.argv.includes('--publish');
const pointer=JSON.parse(await fs.readFile(path.join(project,publish?'publish-current.json':'demo-current.json'),'utf8'));
const root=path.resolve(project,pointer.output),allowedRoot=path.resolve(project,publish?'publish-stage':'demo-dist')+path.sep;
if(!root.startsWith(allowedRoot))throw Error('Output must be an owned versioned child');
const port=Number(process.env.PORT||(publish?5189:5188));
createStaticServer(root,{noindex:publish}).listen(port,'127.0.0.1',()=>console.log(`Static candidate ${pointer.buildRef} at http://127.0.0.1:${port}/ from ${pointer.output}; owned PID ${process.pid}; stop: Stop-Process -Id ${process.pid}`));
