/**
 * Patch a live DOM subtree to match new markup instead of replacing it (`innerHTML`). Elements that stay the same keep
 * their identity, focus, scroll position and typed values, so CSS transitions can animate state changes (selected
 * paint, installed part, pressed view) instead of every click rebuilding the whole panel.
 *
 * - Text and attributes are updated in place; properties that attributes do not drive (input value) are kept in sync
 *   only when the user is not editing that field.
 * - An element carrying `data-motion-key` is swapped wholesale when its key changes (e.g. the inspector for another
 *   category), so it can play its entrance animation. New elements are marked `data-enter` for one animation.
 * - Children are matched by position, or by `id` / `data-motion-key` when present.
 */
const ENTER_MS=420;
function keyOf(n:Node):string|null{if(!(n instanceof Element))return null;return n.id?'#'+n.id:n.getAttribute('data-motion-key')!=null?'@'+n.tagName+':'+n.getAttribute('data-motion-key'):null}
function sameKind(a:Node,b:Node){if(a.nodeType!==b.nodeType)return false;if(a instanceof Element&&b instanceof Element){if(a.tagName!==b.tagName)return false;const ka=keyOf(a),kb=keyOf(b);if((ka||kb)&&ka!==kb)return false}return true}
/** One-shot animation markers: set by the morph, never removed by a following morph (that would cut the animation). */
const MARKS=new Set(['data-enter','data-pop']);
function mark(n:Node,name:string,reduced:boolean){if(reduced||!(n instanceof HTMLElement))return;n.setAttribute(name,'');setTimeout(()=>n.removeAttribute(name),ENTER_MS)}
function syncAttributes(from:Element,to:Element,reduced:boolean){
 for(const a of [...from.attributes])if(!to.hasAttribute(a.name)&&!MARKS.has(a.name))from.removeAttribute(a.name);
 // A control switching on (paint swatch, view) pops once; one that was already on when the screen drew does not.
 if(to.getAttribute('aria-pressed')==='true'&&from.getAttribute('aria-pressed')!=='true')mark(from,'data-pop',reduced);
 for(const a of [...to.attributes])if(from.getAttribute(a.name)!==a.value)from.setAttribute(a.name,a.value);
 if(from instanceof HTMLInputElement&&to instanceof HTMLInputElement){
  if(from!==document.activeElement&&from.value!==to.value)from.value=to.value;
  if(from.checked!==to.checked)from.checked=to.checked;
 }
 if(from instanceof HTMLSelectElement&&to instanceof HTMLSelectElement&&from!==document.activeElement){const v=[...to.options].find(o=>o.hasAttribute('selected'))?.value;if(v!==undefined&&from.value!==v)from.value=v}
}
function patch(from:Node,to:Node,reduced:boolean){
 if(from.nodeType===Node.TEXT_NODE||from.nodeType===Node.COMMENT_NODE){if(from.nodeValue!==to.nodeValue)from.nodeValue=to.nodeValue;return}
 if(from instanceof Element&&to instanceof Element){syncAttributes(from,to,reduced);patchChildren(from,to,reduced)}
}
function patchChildren(parent:Node,next:Node,reduced:boolean){
 const want=[...next.childNodes];let cursor=parent.firstChild;
 const keyed=new Map<string,Node>();for(let c=parent.firstChild;c;c=c.nextSibling){const k=keyOf(c);if(k)keyed.set(k,c)}
 const wanted=new Set(want.map(keyOf).filter((k):k is string=>!!k));
 for(const n of want){
  // A keyed element that is no longer wanted (the inspector of the previous category) goes now, so it does not block
  // positional matching of the unkeyed siblings after it.
  while(cursor&&keyOf(cursor)&&!wanted.has(keyOf(cursor)!)){const stale=cursor;cursor=cursor.nextSibling;parent.removeChild(stale)}
  const k=keyOf(n);let match:Node|null=null;
  if(k&&keyed.has(k)&&sameKind(keyed.get(k)!,n))match=keyed.get(k)!;
  else if(cursor&&!keyOf(cursor)&&sameKind(cursor,n))match=cursor;
  if(match){if(match!==cursor)parent.insertBefore(match,cursor);patch(match,n,reduced);cursor=match.nextSibling;if(k)keyed.delete(k)}
  else{const fresh=document.importNode(n,true);parent.insertBefore(fresh,cursor);mark(fresh,'data-enter',reduced)}
 }
 while(cursor){const stale=cursor;cursor=cursor.nextSibling;stale.parentNode?.removeChild(stale)}
}
/** Morph `root`'s children to the given markup. First call (empty root) is a plain assignment. */
export function morph(root:HTMLElement,html:string,reduced=false){
 if(!root.firstChild){root.innerHTML=html;return}
 const template=document.createElement('template');template.innerHTML=html;patchChildren(root,template.content,reduced);
}
