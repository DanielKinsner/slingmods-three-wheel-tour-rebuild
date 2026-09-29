import { chromium } from 'file:///C:/Users/SM - Dan/Documents/GitHub/slingmods-three-wheel-tour-rebuild/node_modules/playwright-core/index.mjs';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const out = new URL('./', import.meta.url);
const browser = await chromium.launch({headless:true});
const errors=[];
try {
 const page=await browser.newPage({viewport:{width:1920,height:1080},reducedMotion:'reduce'});
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/assets/game-feel/loading/garage-spyder.jpg',r=>r.fulfill({path:fileURLToPath(new URL('f3-premium-garage.jpg',out)),contentType:'image/jpeg'}));
 await page.route('**/*.glb',()=>new Promise(()=>{}));
 await page.goto('http://127.0.0.1:5279/?scene=signature&screen=build&visual=spyder',{waitUntil:'domcontentloaded'});
 await page.locator('.drive-preparation[data-art]').waitFor({timeout:30000});
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForTimeout(1200);
 const background=await page.locator('.drive-preparation[data-art]').evaluate(el=>getComputedStyle(el).backgroundImage);
 if(!background.includes('garage-spyder.jpg'))throw new Error('Wrong F3 loading art');
 await page.screenshot({path:fileURLToPath(new URL('loading-desktop.png',out))});
 await page.setViewportSize({width:2048,height:1019});
 await page.screenshot({path:fileURLToPath(new URL('loading-wide.png',out))});
 await fs.writeFile(new URL('validation.json',out),JSON.stringify({background,errors,viewports:['1920x1080','2048x1019'],method:'Real showroom loading veil, candidate JPEG served by request override; GLB requests held to keep loading screen visible.'},null,2));
 console.log(JSON.stringify({errors,background}));
 if(errors.length)process.exitCode=1;
}finally{await browser.close()}

