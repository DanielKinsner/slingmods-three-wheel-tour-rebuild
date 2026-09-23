/**
 * The crew as characters: portrait, livery colour and short radio lines. Portraits are original illustrations generated
 * for this project (assets/game-feel/portraits-src, see scripts/game-feel/README.md). Voices match the existing story
 * lines: Rae coaches, Maya is precise, Jett is brash, Nico is calm.
 */
export type CrewId='rae'|'maya'|'jett'|'nico';
export interface CrewMember {id:CrewId;name:string;role:string;color:string;portrait:string}
export const CREW:Record<CrewId,CrewMember>={
 rae:{id:'rae',name:'RAE',role:'Crew chief',color:'#ff3b2f',portrait:'/assets/game-feel/crew/rae.jpg'},
 maya:{id:'maya',name:'MAYA',role:'Coastline veteran',color:'#57bab7',portrait:'/assets/game-feel/crew/maya.jpg'},
 jett:{id:'jett',name:'JETT',role:'Harbor hotshot',color:'#d8474a',portrait:'/assets/game-feel/crew/jett.jpg'},
 nico:{id:'nico',name:'NICO',role:'Ridge specialist',color:'#e9b454',portrait:'/assets/game-feel/crew/nico.jpg'},
};
export type RadioMoment='start'|'passedThem'|'passedYou'|'finalLap'|'youWon'|'theyWon'|'trialStart'|'trialGold'|'trialImproved';
const LINES:Record<RadioMoment,Partial<Record<CrewId,string[]>>>={
 start:{rae:['Clean start, clean lap. The rest takes care of itself.','Eyes up. Brake before the bend, not in it.','Warm tyres, calm hands. Go get them.'],jett:['Try to keep up, rookie.','Hope you saved some speed for the corners.'],maya:['Room for everyone. Race clean.'],nico:['Settle in. The lap is longer than the first corner.']},
 passedThem:{maya:['Nice line. I will get it back.','Tidy. I saw that.'],jett:['Oh, you are brave.','Lucky. Watch the braking boards.','Enjoy it while it lasts.'],nico:['Good move. Keep it smooth.','Well placed.']},
 passedYou:{maya:['Room on the left. Thanks.','Stay with me.'],jett:['See you at the finish!','Too slow on exit!','Coming through!'],nico:['Patience. It is a long way round.','Sorry. Had the better exit.']},
 finalLap:{rae:['Final lap. Bring it home clean.','Last one. No heroics, just good lines.']},
 youWon:{rae:['That is how it is done. Take the win.','Clean and fast. The crew noticed.'],maya:['Earned. Well driven.'],jett:['Fine. Rematch. Now.'],nico:['Beautiful drive.']},
 theyWon:{rae:['Good finish. We learn and go again.','A finish is a finish. Try a setup and come back.']},
 trialStart:{rae:['Just you and the clock. Find a tenth.','Beat your ghost. It is only you out there.']},
 trialGold:{rae:['Gold. That lap is on the board.']},
 trialImproved:{rae:['New best. The ghost just got faster.']},
};
export function radioLine(moment:RadioMoment,who?:CrewId):{member:CrewMember;text:string}|null{
 const pool=LINES[moment];const ids=(who&&pool[who]?[who]:Object.keys(pool)) as CrewId[];if(!ids.length)return null;
 const id=ids[Math.floor(Math.random()*ids.length)],lines=pool[id]!;return {member:CREW[id],text:lines[Math.floor(Math.random()*lines.length)]};
}
/** Portrait for a story line written as "NAME: text". */
export function speakerOf(line:string):CrewMember|null{const m=/^\s*(RAE|MAYA|JETT|NICO)\s*:/i.exec(line);return m?CREW[m[1].toLowerCase() as CrewId]:null}
export function portraitMarkup(member:CrewMember,cls='gx-portrait'){return `<figure class="${cls}" style="--gx-crew:${member.color}"><img src="${member.portrait}" alt="" loading="eager" decoding="async"><figcaption><b>${member.name}</b><small>${member.role}</small></figcaption></figure>`}
