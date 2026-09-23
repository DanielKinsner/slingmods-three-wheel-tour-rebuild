import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BuildRepository,freshRecipe,rykerRecipe,stockRecipe,validateRecipe} from '../src/signature/config';
import {RYKER_PRODUCTS} from '../src/signature/ryker-catalog';
const memory=()=>{const m=new Map<string,string>();return {getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>void m.set(k,v)}};
test('vehicle drafts, named saves and drive snapshots remain isolated in shared storage',()=>{
 const durable=memory(),session=memory(),s=new BuildRepository(durable,session,'slingshot'),r=new BuildRepository(durable,session,'ryker');
 const sling=freshRecipe();sling.products['SM-28919']='lower-pair';sling.finish='white-graphite';s.setDraft(sling);s.save('Mine',sling);s.beginDrive(sling,'harbor','test');
 const ryker={...freshRecipe(),ryker:{body:true,exhaust:true,shocks:true,underglow:true}};r.setDraft(ryker);r.save('Mine',ryker);r.beginDrive(ryker,'ridge','test','night');
 assert.deepEqual(new BuildRepository(durable,session,'slingshot').draft(),sling);assert.deepEqual(new BuildRepository(durable,session,'ryker').draft(),rykerRecipe(ryker));
 assert.equal(s.recipes()[0].recipe.products['SM-28919'],'lower-pair');assert.equal(r.recipes()[0].recipe.ryker?.body,true);assert.equal(s.drive().route,'harbor');assert.equal(r.drive().route,'ridge');
});
test('stock comparison removes Ryker accessories without mutating its build; malformed equipment is rejected',()=>{
 const r={...freshRecipe(),ryker:{body:true,shocks:true}};assert.deepEqual(stockRecipe(r).ryker,{});assert.equal(r.ryker.body,true);
 for(const ryker of [{storage:true},{body:'yes'},[],null])assert.throws(()=>validateRecipe({...freshRecipe(),ryker}));
 assert.equal(RYKER_PRODUCTS.some(p=>String(p.category)==='Storage'),false);
});
function glb(path:string){const b=readFileSync(path);return JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString())}
test('stock partitions conserve source triangle counts and all four mods ship real finite geometry',()=>{
 const base=glb('public/assets/ryker/ryker-900.glb'),mods=glb('public/assets/ryker/ryker-accessories.glb'),glow=glb('public/assets/ryker/ryker-underglow.glb');
 const triangles=(g:any,n:any):number=>(n.mesh===undefined?0:g.meshes[n.mesh].primitives.reduce((sum:number,p:any)=>sum+g.accessors[p.indices??p.attributes.POSITION].count/3,0))+(n.children??[]).reduce((sum:number,i:number)=>sum+triangles(g,g.nodes[i]),0);
 const sum=(g:any,names:string[])=>names.reduce((s,n)=>s+triangles(g,g.nodes.find((o:any)=>o.name===n)),0);
 assert.equal(sum(base,['body_panels','front_suspension','rear_mechanical']),sum(mods,['stock_ryker_body','retained_body_panels','stock_ryker_shocks','retained_front_links','stock_ryker_shocks_rear','stock_ryker_exhaust','retained_rear_mechanical']));
 for(const id of ['body','shocks','exhaust'])assert.ok(sum(mods,['ryker_mod_'+id])>100);
 assert.ok(sum(glow,['ryker_mod_underglow'])>100);
 for(const g of [mods,glow])for(const mesh of g.meshes)for(const p of mesh.primitives){const a=g.accessors[p.attributes.POSITION];assert.ok(a.min.every(Number.isFinite)&&a.max.every(Number.isFinite));}
 const drawCalls=mods.meshes.reduce((n:number,m:any)=>n+m.primitives.length,0);assert.ok(drawCalls<45,'Merged rigid accessories keep draw calls bounded');
});
