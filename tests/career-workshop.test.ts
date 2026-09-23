import test from 'node:test';import assert from 'node:assert/strict';
import {freshCareer,transition,migrateCareer} from '../src/career/store';
import {careerRecipe} from '../src/career-experience/model';
import {careerWorkshop} from '../src/career-experience/workshop';
import {fragmentRecipe,validateRecipe} from '../src/signature/config';
import {PRODUCTS} from '../src/signature/catalog';
import {SPYDER_PRODUCTS} from '../src/signature/spyder-catalog';

for(const vehicle of ['slingshot-r-2024','can-am-ryker-900','can-am-spyder-f3'] as const)test(`${vehicle} chapter workshop renders valid links without changing the career`,()=>{
 const s=transition(freshCareer(),{type:'chapter-vehicle',vehicle}).state,before=structuredClone(s),html=careerWorkshop(s);
 const links=[...html.matchAll(/href="([^"]+)"/g)].map(m=>new URL(m[1].replaceAll('&amp;','&'),'http://localhost/'));
 assert.ok(links.length>0);
 if(vehicle==='slingshot-r-2024'){
  const previews=links.filter(u=>u.hash);assert.equal(previews.length,PRODUCTS.length+1);
  for(const u of previews){const r=fragmentRecipe(u.hash)!;assert.equal(validateRecipe(r).vehicleId,vehicle)}
  for(const p of PRODUCTS)assert.ok(previews.some(u=>fragmentRecipe(u.hash)!.products[p.id]===p.option));
 }else{
  assert.doesNotMatch(html,/data-action="purchase"|SM-133|SM-3223/);
  const visual=vehicle==='can-am-spyder-f3'?'spyder':'ryker';
  for(const u of links){assert.equal(u.searchParams.get('visual'),visual);assert.equal(u.searchParams.get('shop'),'build')}
  assert.match(html,new RegExp(`aria-label="${visual==='spyder'?'Spyder':'Ryker'} career workshop"`));
 }
 assert.deepEqual(s,before);assert.deepEqual(migrateCareer(s),before);
});

test('Spyder hub retains installed and removed ownership, credits and frozen race entries',()=>{
 let s=freshCareer();s.credits=5000;s=transition(s,{type:'chapter-vehicle',vehicle:'can-am-spyder-f3'}).state;
 for(const p of SPYDER_PRODUCTS)s=transition(s,{type:'chapter-spyder-purchase',id:crypto.randomUUID(),part:p.id}).state;
 const entryId=crypto.randomUUID();s=transition(s,{type:'chapter-one-begin',id:entryId,event:'shakedown',preset:'night'}).state;
 s=transition(s,{type:'chapter-spyder-equip',part:'front',equipped:false}).state;
 const before=structuredClone(s),html=careerWorkshop(s);
 assert.equal((html.match(/class="career-product-state">Installed/g)??[]).length,SPYDER_PRODUCTS.length-1);
 assert.match(html,/data-product="front"[\s\S]*?Owned · removed/);assert.equal((html.match(/data-product=/g)??[]).length,SPYDER_PRODUCTS.length);
 assert.deepEqual(s,before);assert.deepEqual(careerRecipe(s).products,{});
 assert.equal(s.ownBuild.chapterOne!.entries[entryId].recipe.spyder!.parts.front,true);
});
