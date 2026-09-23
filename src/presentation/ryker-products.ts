import * as THREE from 'three';
import type {RykerBuild} from '../signature/ryker-catalog';
/** Fitted original accessory meshes and lossless partitions of the purchased stock mesh. */
export class RykerProducts {
 private hidden:THREE.Object3D[]=[];private state:RykerBuild={};
 constructor(private car:THREE.Object3D,readonly root:THREE.Group){
  for(const name of ['front_suspension','body_panels','rear_mechanical']){const original=car.getObjectByName(name);if(original){original.visible=false;this.hidden.push(original)}}
  car.add(root);car.userData.rykerAssemblyRevision=(car.userData.rykerAssemblyRevision??0)+1;root.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true}});this.set({});
 }
 set(state:RykerBuild={}){this.state={...state};this.car.userData.rykerBody=!!state.body;const tree=this.car.parent??this.car;tree.traverse(o=>{if(o.userData.stockGrilleLight)o.visible=!state.body});for(const id of ['shocks','exhaust','body'] as const){const part=this.root.getObjectByName('ryker_mod_'+id);if(part)part.visible=!!state[id];for(const stock of ['stock_ryker_'+id,'stock_ryker_'+id+'_rear']){const node=this.root.getObjectByName(stock);if(node)node.visible=!state[id]}}const grille=this.car.getObjectByName('grille');if(grille)grille.visible=!state.body;}
 inspect(){return {selected:{...this.state},replacementNodes:this.hidden.map(o=>o.name),geometry:'Original reference-based game approximations; not manufacturer CAD',physics:'Ryker Road v1; Elka uses labeled game-estimated compression damping'}}
 dispose(){for(const o of this.hidden)o.visible=true;const grille=this.car.getObjectByName('grille');if(grille)grille.visible=true;this.root.removeFromParent()}
}
