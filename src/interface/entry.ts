import type {TourProgress} from '../game/progress';
import {dailyCardMarkup} from '../game/daily';
import '../game/menu.css';
/** Presentation only. All actions go through the showroom's existing event delegation. */
export interface TourEntry {
  model: string;
  ryker: boolean;
  careerLabel: string;
  careerDetail: string;
  progress?: TourProgress;
  returning?: boolean;
}
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

/** Game ratings shown on the ride card (1-10). Presentation only; the simulation owns the real numbers. */
const RIDES = {
  slingshot: {index: '01', name: 'POLARIS SLINGSHOT R', engine: '2.0L ProStar I4 · 203 hp', drive: '5-speed · rear-wheel drive', stats: [['Power', 8], ['Grip', 7], ['Braking', 7], ['Agility', 6]]},
  ryker: {index: '02', name: 'CAN-AM RYKER 900', engine: '900 ACE triple · 82 hp', drive: 'CVT · shaft drive', stats: [['Power', 5], ['Grip', 6], ['Braking', 6], ['Agility', 9]]},
} as const;

function tile(action: string, title: string, sub: string, kicker: string, extra = '', cls = '') {
  return `<button data-action="${action}" class="gx-tile ${cls}" data-gx-sfx="select"><span class="gx-tile-body"><small>${kicker}</small><strong>${title}</strong><em>${sub}</em>${extra}</span><b class="gx-tile-arrow" aria-hidden="true"></b></button>`;
}

export function tourEntry({model, ryker, careerLabel, careerDetail, progress, returning}: TourEntry): string {
  const ride = ryker ? RIDES.ryker : RIDES.slingshot;
  const p = progress;
  const career = p
    ? `<span class="gx-tile-meter" aria-label="${p.completed} of ${p.total} career events complete"><i style="--gx-fill:${(p.completed / Math.max(1, p.total)).toFixed(3)}"></i></span><span class="gx-tile-foot">CHAPTER 0${p.chapter} · ${p.completed}/${p.total} EVENTS</span>`
    : '';
  const [careerTitle, careerSub] = returning ? ['CAREER', careerLabel] : [careerLabel.replace(/^Continue Career$/, 'Continue').replace(/^Start Career$/, 'Start career'), careerDetail];
  return `<main class="sig-entry gx-menu" aria-label="Main menu">
    <header class="gx-menu-title"><span class="gx-kicker">SLINGMODS PRESENTS</span><h1 class="gx-display">THREE-WHEEL<br><em>TOUR</em></h1></header>
    <nav class="gx-menu-stack" aria-label="Game modes">
      ${tile('career', escape(careerTitle), escape(careerSub), 'CAREER', career, 'gx-tile-hero')}
      ${tile('quick-race', 'Quick race', 'Race the crew · Time Attack medals · free drive', 'ARCADE')}
      ${tile('build', 'Garage', 'Make it yours · paint, parts and setup', 'MAKE IT YOURS')}
      ${tile('shop', 'Shop this build', 'Every part you fit, on SlingMods.com', 'REAL PARTS')}
      <div class="gx-menu-row"><button class="gx-tile gx-tile-slim" data-gx-log data-gx-sfx="select"><span class="gx-tile-body"><small>RECORDS</small><strong>Tour log</strong></span><b class="gx-tile-arrow" aria-hidden="true"></b></button><button class="gx-tile gx-tile-slim" data-gx-options data-gx-sfx="select"><span class="gx-tile-body"><small>SETTINGS</small><strong>Options</strong></span><b class="gx-tile-arrow" aria-hidden="true"></b></button></div>
    </nav>
  </main>
  ${dailyCardMarkup()}
  <aside class="tour-machine gx-ride" aria-label="Current vehicle">
    <span class="gx-kicker">YOUR RIDE <b>${ride.index}</b>/02</span>
    <strong class="gx-display">${ride.name}</strong>
    <span class="gx-ride-model">${escape(model)} · ${ride.engine}</span>
    <dl class="gx-ride-stats">${ride.stats.map(([label, value]) => `<div><dt>${label}</dt><dd aria-label="${value} of 10">${Array.from({length: 10}, (_, k) => `<i${k < (value as number) ? ' class="on"' : ''}></i>`).join('')}</dd></div>`).join('')}</dl>
    <span class="gx-ride-drive">${ride.drive}</span>
  </aside>`;
}
