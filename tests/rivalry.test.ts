import test from 'node:test';import assert from 'node:assert/strict';
import {RivalryTracker,rivalRecords,updateRecord,hottestRival,rivalStartLine,heatLabel} from '../src/game/rivalry';
// Rivalries: head-to-head across races, heat from close racing, the hottest rival's call-out.
const store=new Map<string,string>();(globalThis as {localStorage?:unknown}).localStorage={getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>void store.set(k,v),removeItem:(k:string)=>void store.delete(k)};
const order=(...ids:string[])=>ids.map(id=>({id}));
function race(swapsWithJett:number,playerAhead:boolean,gapMs:number){
 const t=new RivalryTracker(['maya','jett','nico']);let ahead=false;t.update(order('jett','player','maya','nico'));for(let i=0;i<swapsWithJett;i++){ahead=!ahead;t.update(ahead?order('player','jett','maya','nico'):order('jett','player','maya','nico'))}
 const final=playerAhead?[{id:'player',place:1,timeMs:100000},{id:'jett',place:2,timeMs:100000+gapMs}]:[{id:'jett',place:1,timeMs:100000},{id:'player',place:2,timeMs:100000+gapMs}];
 return t.finish([...final,{id:'maya',place:3,timeMs:130000},{id:'nico',place:4,timeMs:140000}]);
}
test('close racing heats a rivalry up; distance cools it; the record counts who finished ahead',()=>{
 store.clear();const r1=race(3,true,800);assert.equal(r1?.id,'jett');assert.deepEqual([r1!.record.ahead,r1!.record.behind],[1,0]);assert.ok(r1!.record.heat>=30,`heat ${r1!.record.heat}`);
 race(2,false,1500);const all=rivalRecords();assert.deepEqual([all.jett.races,all.jett.ahead,all.jett.behind],[2,1,1]);assert.equal(all.maya.ahead,2,'beat Maya twice');assert.ok(all.jett.heat>all.maya.heat);
 const cooled=updateRecord({races:5,ahead:3,behind:2,heat:50},{ahead:true,swaps:0,gapMs:60000});assert.equal(cooled.heat,40);assert.equal(heatLabel(80),'Boiling');
});
test('the call-out comes only from a rival raced twice with some heat, and quotes the real score',()=>{
 store.clear();race(3,true,800);assert.equal(hottestRival(['maya','jett','nico']),null,'one race is not a rivalry yet');
 race(3,true,900);const r=hottestRival(['maya','jett','nico']);assert.equal(r?.id,'jett');assert.match(r!.text,/^Two-zero to you/);
 assert.equal(hottestRival(['maya','nico']),null,'not when Jett is not in the race');
 assert.match(rivalStartLine('maya',{races:4,ahead:2,behind:2,heat:40}),/^Two-two\./);
});
