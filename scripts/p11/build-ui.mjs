import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const out=path.join(root,'public/assets/p11/ui-hud');await fs.mkdir(out,{recursive:true});
const files=[];
const embeddedFont=(await fs.readFile(path.join(root,'public/assets/fonts/BarlowCondensed-ExtraBold.woff2'))).toString('base64');
const defs=`<defs><pattern id="graphite" width="6" height="6" patternUnits="userSpaceOnUse"><path fill="#17191c" d="M0 0h6v6H0z"/><path stroke="#22252a" stroke-width=".5" d="M0 1h6M0 4h6"/></pattern><linearGradient id="red"><stop stop-color="#a7131e"/><stop offset="1" stop-color="#ff3544"/></linearGradient></defs>`;
async function svg(name,w,h,body,extra={}){const s=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${name.replaceAll('-',' ')}"><style>@font-face{font-family:'Barlow Condensed';src:url(data:font/woff2;base64,${embeddedFont}) format('woff2');font-weight:800}</style>${defs}${body}</svg>`;await fs.writeFile(path.join(out,name+'.svg'),s);files.push({name,file:name+'.svg',width:w,height:h,...extra});}
const text=(x,y,s,size=20,color='#fff',anchor='start')=>`<text x="${x}" y="${y}" fill="${color}" text-anchor="${anchor}" font-family="Barlow Condensed, sans-serif" font-weight="800" font-size="${size}">${s}</text>`;
const panel=(w,h)=>`<path d="M12 0H${w}V${h-12}L${w-12} ${h}H0V12Z" fill="url(#graphite)" stroke="#52565d"/><path d="M16 1H${w-16}" stroke="#e0202a"/>`;
for(const [name,w,h] of [['small',240,96],['medium',420,180],['large',720,300]])await svg('panel-'+name,w,h,panel(w,h),{slice:[16,16,16,16]});
let ticks='';for(let i=0;i<=40;i++){const a=(140+i*6.5)*Math.PI/180,r=i%5?137:129;const x=180+Math.cos(a)*r,y=176+Math.sin(a)*r; ticks+=`<path stroke="${i>=32?'#e0202a':'#c7c9cb'}" stroke-width="${i%5?1:3}" d="M${x} ${y}L${180+Math.cos(a)*149} ${176+Math.sin(a)*149}"/>`;if(i%5===0)ticks+=text(180+Math.cos(a)*111,183+Math.sin(a)*111,i/5,19,'#c7c9cb','middle');}
const arc=`<path d="M57.4 278.8A160 160 0 1 1 318.6 256" fill="none" stroke="#34383e" stroke-width="12"/><path d="M326.2 111A160 160 0 0 1 318.6 256" fill="none" stroke="#e0202a" stroke-width="12"/>`;
await svg('tachometer-arc',360,330,arc+ticks+text(180,235,'RPM × 1000',16,'#a5a9ae','middle'),{range:[0,8000],redline:6400,pivot:[180,176],startDegrees:140,sweepDegrees:260});
await svg('tachometer-needle',360,330,'<path d="M180 169L61 273L184 183Z" fill="#fff"/><circle cx="180" cy="176" r="11" fill="#e0202a"/>',{pivot:[180,176]});
await svg('tachometer-sweep',360,330,'<path d="M57.4 278.8A160 160 0 1 1 318.6 256" fill="none" stroke="url(#red)" stroke-width="12" pathLength="1" stroke-dasharray=".68 1"/>',{pathLength:1,fill:'Set stroke-dasharray to normalizedRPM + " 1".'});
await svg('gear-speed',260,150,text(0,112,'4',136)+text(91,92,'128',78)+text(96,124,'MPH',20,'#a5a9ae')+'<path stroke="#e0202a" d="M77 20V130"/>');
await svg('shift-lights',300,20,Array.from({length:10},(_,i)=>`<path fill="${i<6?'#f6f6f4':i<8?'#ff952f':'#e0202a'}" d="M${i*30+2} 2h24v16h-24z"/>`).join(''));
await svg('minimap-frame',240,240,panel(240,240)+'<path d="M16 40V16H40M200 224h24v-24" fill="none" stroke="#868a91"/>');
await svg('marker-player',24,24,'<path d="M12 2L22 22L12 17L2 22Z" fill="#fff" stroke="#e0202a" stroke-width="2"/>');
await svg('marker-rival',24,24,'<path d="M12 3L21 12L12 21L3 12Z" fill="#ff9b37" stroke="#111" stroke-width="2"/>');
await svg('marker-points',24,24,'<circle cx="12" cy="12" r="9" fill="#e0202a" stroke="#fff" stroke-width="2"/><path d="M12 6v6l5 3m-5-3l-5 3" stroke="#fff" stroke-width="2"/>');
await svg('position-row',320,48,panel(320,48)+'<path fill="#ff9b37" d="M0 12L12 0v48H0Z"/>'+text(27,34,'02',29)+text(79,32,'RIVAL',24)+text(304,32,'+0.482',23,'#b7bbc1','end'));
for(const [name,color,level] of [['white','#fff',.33],['orange','#ff942e',.66],['red','#e0202a',1]])await svg('boost-'+name,360,40,panel(360,40)+`<path d="M12 12H${12+level*336}V28H12Z" fill="${color}"/>`);
await svg('boost-full-flare',400,80,'<path d="M0 40L155 32L185 0L200 26L217 8L228 33L400 40L228 47L217 72L200 54L185 80L155 48Z" fill="#e0202a"/><path d="M100 40L190 35L200 14L210 35L310 40L210 45L200 66L190 45Z" fill="#fff"/>');
await svg('points-token',64,64,'<path fill="#737b83" d="M20 2h24l18 18v24L44 62H20L2 44V20Z"/><circle cx="32" cy="32" r="23" fill="#e0202a"/><path d="M32 16v16l14 9M32 32L18 41" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="square"/>',{branding:'Neutral three-spoke wheel glyph, not an invented SlingMods mark.'});
await svg('points-counter',260,64,panel(260,64)+text(20,44,'12,450',42)+text(239,43,'PTS',20,'#aaa','end'));
await svg('combo-multiplier',100,64,'<path fill="#e0202a" d="M12 0h88v52L88 64H0V12Z"/>'+text(50,48,'×3',48,'#fff','middle'));
for(const [name,col,time] of [['green','#55df8b','−0.482'],['red','#ef3547','+0.482'],['purple','#ba7aff','−0.725']])await svg('sector-'+name,240,58,panel(240,58)+`<path fill="${col}" d="M0 12L12 0h5v58H0Z"/>`+text(30,22,'SECTOR 02',15,'#aaa')+text(220,45,time,34,col,'end'));
const icons={
build:'M14 3a6 6 0 0 0-7 7L3 17a3 3 0 0 0 4 4l7-7a6 6 0 0 0 7-7l-4 4-4-4Z',
paint:'M4 4h13v7H4zM17 7h4v8H11v6',lighting:'M8 15a7 7 0 1 1 8 0v3H8ZM9 22h6M12 3v3',
suspension:'M8 2v3l8 3-8 4 8 4-8 3v3M16 2v3M16 19v3',exhaust:'M3 8h7v8H3ZM10 10h7l4-4M10 14h7l4 4',
aero:'M2 6l20 3-20 3ZM6 12v7M18 11v8M3 19h18',storage:'M3 7h18v14H3ZM8 7V3h8v4M3 12h18M10 12v3h4v-3',
destinations:'M12 22S4 13 4 9a8 8 0 0 1 16 0c0 4-8 13-8 13ZM9 9a3 3 0 1 0 6 0 3 3 0 0 0-6 0',
shop:'M3 9h18v12H3ZM2 9l3-6h14l3 6M9 21v-7h6v7',
'photo-mode':'M2 7h5l2-3h6l2 3h5v14H2ZM8 13a4 4 0 1 0 8 0 4 4 0 0 0-8 0',
replay:'M4 8a9 9 0 1 1-1 7M4 2v6h6M10 8l6 4-6 4Z',
settings:'M9 3h6l1 4 4 1v7l-4 1-1 5H9l-1-5-5-1V8l5-1ZM9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0',
audio:'M3 9h4l5-5v16l-5-5H3ZM16 8a6 6 0 0 1 0 8M19 4a11 11 0 0 1 0 16',
controller:'M6 6h12l4 12-3 2-5-5h-4l-5 5-3-2ZM5 10h6M8 7v6M16 10h.01M19 13h.01',
keyboard:'M2 5h20v14H2ZM5 8h2m2 0h2m2 0h2m2 0h2M5 11h2m2 0h2m2 0h2m2 0h2M6 16h12',
day:'M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12l2 2M4 20l2-2M18 6l2-2',
dusk:'M2 17h20M6 17a6 6 0 0 1 12 0M12 3v4M3 8l3 3M21 8l-3 3M5 21h14',
night:'M17 3A10 10 0 1 0 21 17 9 9 0 0 1 17 3Z',
rain:'M5 13a4 4 0 0 1 0-8 6 6 0 0 1 11-1 5 5 0 1 1 3 9ZM6 17l-2 4M12 17l-2 4M18 17l-2 4'
};
for(const [name,d] of Object.entries(icons))await svg('icon-'+name,24,24,`<path d="${d}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`);
await svg('letterbox',1920,1080,'<path fill="#050506" d="M0 0h1920v130H0zM0 950h1920v130H0z"/>');
await svg('rival-lower-third',720,130,panel(720,130)+'<path fill="#e0202a" d="M0 12L12 0h7v130H0Z"/>'+text(38,35,'THE HARBOR CREW',20,'#afb4ba')+text(35,101,'RIVAL NAME',65)+text(680,96,'02',76,'#545a62','end'));
await svg('loading-layout',1920,1080,'<path fill="#0c0d10" d="M0 0h1920v1080H0z"/><ellipse cx="960" cy="702" rx="570" ry="83" fill="#202328" stroke="#3b4149"/><path d="M520 640L614 544L765 512L847 431H1090L1155 509L1298 536L1400 640L1250 662L1174 590H742L668 662Z" fill="#454b53"/><ellipse cx="684" cy="637" rx="48" ry="79" fill="#08090a"/><ellipse cx="1240" cy="637" rx="48" ry="79" fill="#08090a"/>'+text(140,170,'THREE-WHEEL TOUR',68)+text(142,215,'PREPARING YOUR DRIVE',23,'#a8adb5')+'<path d="M140 880H1780" stroke="#383d45" stroke-width="4"/><path d="M140 880H1100" stroke="#e0202a" stroke-width="4"/>'+text(140,936,'LOOK THROUGH THE CORNER. KEEP YOUR EXIT IN SIGHT.',25,'#b5bac1')+text(1780,849,'64%',32,'#fff','end'),{note:'Stylized three-wheel silhouette; replace percentage and tip in application.'});
await fs.copyFile(path.join(root,'public/assets/fonts/BarlowCondensed-ExtraBold.woff2'),path.join(out,'BarlowCondensed-ExtraBold.woff2'));
await fs.copyFile(path.join(root,'assets/fonts/barlow-condensed/OFL.txt'),path.join(out,'OFL.txt'));
await fs.writeFile(path.join(out,'font.css'),"@font-face{font-family:'Barlow Condensed';src:url('./BarlowCondensed-ExtraBold.woff2') format('woff2');font-weight:800;font-display:swap}\n");
await fs.writeFile(path.join(out,'components.json'),JSON.stringify({schemaVersion:1,units:'CSS pixels; vector resolution independent',palette:{red:'#e0202a',graphite:'#17191c'},icons:{grid:24,stroke:2},font:'Barlow Condensed ExtraBold, SIL OFL 1.1',components:files},null,2));
await fs.writeFile(path.join(out,'README.md'),'Vector UI at 1 CSS px per design unit; 24 px icons / 2 px stroke; nine-slice insets 16 px; Barlow Condensed under included OFL; neutral three-spoke points glyph.\n');
const cards=files.map(f=>`<figure><div>${f.name.startsWith('icon-')?`<img width="48" height="48" src="${f.file}">`:`<object type="image/svg+xml" data="${f.file}"></object>`}</div><figcaption>${f.name}</figcaption></figure>`).join('');
await fs.writeFile(path.join(out,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>P11 UI asset sheet</title><link rel="stylesheet" href="font.css"><style>body{margin:40px;background:#101114;color:white;font-family:'Barlow Condensed',sans-serif}h1{font-size:44px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px}figure{margin:0;background:#24262c;padding:24px}figure div{height:230px;display:flex;align-items:center;justify-content:center}object{width:100%;height:100%}figcaption{margin-top:16px;color:#afb3bd;font:14px monospace}</style><h1>SLINGMODS / P11 UI ASSETS</h1><main>${cards}</main></html>`);
console.log(`Authored ${files.length} SVG assets, component metadata, font and preview in ${out}`);
