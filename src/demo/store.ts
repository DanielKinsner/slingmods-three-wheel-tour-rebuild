import {freshCareer,migrateCareer,MemoryCareerStore,type CareerStore,type Command} from '../career/store';
import {DEMO_CAREER_KEY} from './profile';
/** Prepared showcase state, not earned career history. All subsequent results use the original transition. */
export function freshDemo(){const state=freshCareer();state.owned=true;state.equipped=true;state.chapters={entry:true,firstCompletion:true,firstBuild:true};state.crew.invitationSeen=true;return state}
/** Per-tab demo persistence avoids both cross-tab lost updates and all access to the career database. */
export class DemoCareerStore implements CareerStore{
 private memory:MemoryCareerStore;private saved=true;
 constructor(private storage:Pick<Storage,'getItem'|'setItem'>,fallback:unknown=freshDemo()){
  let initial=migrateCareer(fallback);const raw=storage.getItem(DEMO_CAREER_KEY);if(raw!==null){try{const stored=migrateCareer(JSON.parse(raw));if(stored.revision>=initial.revision)initial=stored}catch{throw Error('The demo session cannot be read. Reset only the demo from Development Preview.')}}
  this.memory=new MemoryCareerStore(initial);try{storage.setItem(DEMO_CAREER_KEY,JSON.stringify(initial))}catch{this.saved=false}
 }
 get durable(){return this.saved}
 read(){return this.memory.read()}
 async execute(command:Command){const result=await this.memory.execute(command);if(result.changed){try{this.storage.setItem(DEMO_CAREER_KEY,JSON.stringify(result.state))}catch{this.saved=false}}return result}
 subscribe(fn:()=>void){return this.memory.subscribe(fn)}close(){this.memory.close()}
}
export function openDemo(fallback:unknown=freshDemo()):CareerStore{let storage:Storage;try{storage=window.sessionStorage;storage.getItem(DEMO_CAREER_KEY)}catch{return new MemoryCareerStore(fallback)}try{return new DemoCareerStore(storage,fallback)}catch(error){if((error as Error).message.startsWith('The demo session'))throw error;return new MemoryCareerStore(fallback)}}
