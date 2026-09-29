import {FILMS,type Film,type Shot} from '../presentation/cinematics/tracks';

/** The shared film director, score, skip controls and timing, with shots composed for the dirt start. */
export const RALLY_FILMS:Record<Film,readonly Shot[]>={
  arrival:[
    {name:'Redstone country',duration:3.4,from:[-18,22,-24],to:[-12,14,-17],aim:[0,1,-6],aimEnd:[0,.6,-2],lens:44,lensEnd:48,aperture:0},
    {name:'On the dirt',duration:2.3,from:[-2.8,.6,-4.8],to:[-2,.55,-3.8],aim:[-.55,.5,-.6],lens:52,aperture:.5},
    {name:'Ryker territory',duration:3.8,from:[-5.5,2,-7.2],to:[-4.4,1.5,-6.2],aim:[1.65,.6,0],lens:42,lensEnd:46,aperture:.24,title:true},
  ],
  grid:[
    {name:'Redstone start',duration:1.65,from:[-12,8,-18],to:[-8,5,-12],aim:[0,.5,-2],lens:46,lensEnd:50,aperture:0},
    {name:'Dirt contact',duration:1.7,from:[-2.6,.6,-3.8],to:[-2,.55,-3.2],aim:[-.55,.45,-.6],lens:55,aperture:.45},
    {name:'Your stage',duration:2.4,from:[-4.8,2,-6.6],to:[-4.3,1.5,-5.9],aim:[1.65,.6,-.2],lens:43,lensEnd:46,aperture:.28,title:true},
    {name:'Take the stage',duration:1.25,from:[0,5,9],to:[0,3.6,7.5],aim:[0,.55,-3],lens:52,lensEnd:55,aperture:0},
  ],
  victory:FILMS.victory,
};
