import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='C:/Users/SM - Dan/Documents/GitHub/slingmods game/ryker-purchased/work/mods',base=process.env.RYKER_URL??'http://127.0.0.1:5197';
const b=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--mute-audio']}),p=await b.newPage(),report={errors:[],views:[]};p.on('pageerror',e=>report.errors.push(e.message));
try{for(const scene of ['career','bay']){
 await p.goto(`${base}/?scene=${scene}&visual=ryker&play=career&test=1&profile=1`);await p.locator('.vehicle-appearance-picker').waitFor();if(scene==='bay')await p.waitForFunction(()=>window.__SIGNATURE?.ready,null,{timeout:120000});
 for(const width of [1440,390]){await p.setViewportSize({width,height:width===390?844:1000});await p.waitForTimeout(300);
  const data=await p.evaluate(()=>{const a=document.querySelector('.vehicle-appearance-picker').getBoundingClientRect(),panel=document.querySelector('.career-chapters,#chapter-panel')?.getBoundingClientRect();const nav=document.querySelector('.sig-navigation').getBoundingClientRect();return {navOverlap:a.right>nav.left&&a.left<nav.right&&a.bottom>nav.top&&a.top<nav.bottom,switch:{x:a.x,y:a.y,width:a.width,height:a.height},overlap:!!panel&&a.right>panel.left&&a.left<panel.right&&a.bottom>panel.top&&a.top<panel.bottom}});assert.equal(data.overlap,false);assert.equal(data.navOverlap,false);report.views.push({scene,width,...data});await p.screenshot({path:`${out}/${scene}-${width}.png`});
 }
}assert.deepEqual(report.errors,[]);report.pass=true}finally{await writeFile(out+'/switch-layouts.json',JSON.stringify(report,null,2));await b.close()}
