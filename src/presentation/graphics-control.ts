import type * as THREE from 'three';
import {GRAPHICS_ORDER,GRAPHICS_PRESETS,saveGraphicsQuality,type GraphicsQuality} from './graphics-settings';
import type {RenderPipeline} from './render-pipeline';
import {LOOKS,LOOK_ORDER,type TimeOfDay} from './time-of-day';
/**
 * Minimal in-drive quality selector, shown only while the race menu is open (start, pause, results). It is a plain
 * labelled <select> on purpose: Phase 3 rebuilds the menus and will absorb it. Applies live; the choice is remembered.
 */
const STYLE='#game-graphics{position:fixed;right:24px;bottom:24px;z-index:46;display:none;align-items:center;gap:10px;padding:8px 12px;background:#111416d9;border:1px solid #ffffff2e;border-radius:6px;color:#f2f4f5;font:500 13px/1.2 var(--sm-font,system-ui,sans-serif)}.race-menu-open #game-graphics{display:flex}#game-graphics select{min-height:36px;padding:4px 8px;background:#252a2d;color:inherit;border:1px solid #ffffff3d;border-radius:3px;font:inherit}#game-graphics select:focus-visible{outline:3px solid var(--sm-focus,#ffd166);outline-offset:2px}#game-graphics small{color:#aeb6bb;max-width:190px}';
export function installGraphicsControl(parent:Element,renderer:THREE.WebGLRenderer,pipeline:RenderPipeline,loadedLighting:'low'|'standard',timeOfDay?:{current:TimeOfDay;choose:(look:TimeOfDay)=>string}){
 const style=document.createElement('style');style.textContent=STYLE;document.head.append(style);
 const root=document.createElement('label'),select=document.createElement('select'),note=document.createElement('small');root.id='game-graphics';
 if(timeOfDay){const looks=document.createElement('select');looks.setAttribute('aria-label','Time of day');for(const id of LOOK_ORDER){const option=document.createElement('option');option.value=id;option.textContent=LOOKS[id].label;looks.append(option)}looks.value=timeOfDay.current;looks.addEventListener('change',()=>{note.textContent=timeOfDay.choose(looks.value as TimeOfDay)});looks.addEventListener('keydown',e=>e.stopPropagation());root.append('Time',looks)}
 root.append('Graphics',select,note);select.setAttribute('aria-label','Graphics quality');
 for(const id of GRAPHICS_ORDER){const option=document.createElement('option');option.value=id;option.textContent=GRAPHICS_PRESETS[id].label;select.append(option)}select.value=pipeline.quality;
 select.addEventListener('change',()=>{const quality=select.value as GraphicsQuality,preset=GRAPHICS_PRESETS[quality];saveGraphicsQuality(quality);renderer.setPixelRatio(Math.min(devicePixelRatio,preset.pixelRatioCap));renderer.setSize(innerWidth,innerHeight);pipeline.setQuality(quality);pipeline.resize();note.textContent=preset.lighting!==loadedLighting?'Shadow detail updates on your next drive.':''});
 // Keep driving keys (arrows, space) from changing the option while the menu is closed and the control is hidden.
 select.addEventListener('keydown',e=>e.stopPropagation());parent.append(root);
 return{root,dispose(){root.remove();style.remove()}};
}
