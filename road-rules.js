/* Picture-led speaking practice. Road signs apply to the role shown on the card. */
(function(root){
'use strict';
const signs=[
 {id:'parking',symbol:'parking',name:'Parking',x:480,y:88,role:'Driver',context:'At the car park behind the hospital.',cue:'park here',answers:['You can park here.'],note:'Use the marked parking spaces behind the hospital.',area:'hospital-parking'},
 {id:'no-parking',symbol:'no-parking',name:'No parking',x:1284,y:530,role:'Driver',context:'On the road beside the tram.',cue:'park here',answers:["You can't park here.","You mustn't park here."],note:'Keep the road beside the tram tracks and the yellow kerb clear.',area:'tram-kerb'},
 {id:'speed-limit',symbol:'speed-limit',name:'Speed limit: 30',x:1006,y:266,role:'Driver',context:'On the road beside the school.',cue:'drive faster than 30 km/h',answers:["You mustn't drive faster than 30 km/h.","You can't drive faster than 30 km/h."],note:'30 km/h is the maximum speed.'},
 {id:'no-entry',symbol:'no-entry',name:'No entry',x:1238,y:99,role:'Driver',context:'At the path behind the school.',cue:'drive into this area',answers:["You can't drive into this area.","You mustn't drive into this area."],note:'The path behind the school is for pedestrians. Bollards keep vehicles out.',area:'school-footpath'},
 {id:'straight',symbol:'straight',name:'Ahead only',x:168,y:755,role:'Driver',context:'Drive up the road beside the garage.',cue:'go straight on',answers:['You must go straight on.'],note:'Continue straight on beside the garage and the theatre.',approach:{route:'west',dir:-1,point:[136,550],movement:'straight'}},
 {id:'right',symbol:'right',name:'Turn right',x:550,y:230,role:'Driver',context:'Drive down the road beside the hospital.',cue:'turn right',answers:['You must turn right.'],note:'At the end of this road, turn right and follow the road beside the hospital.',approach:{route:'west',dir:1,point:[516,305],movement:'right'}},
 {id:'no-right',symbol:'no-right',name:'No right turn',x:976,y:127,role:'Driver',context:'Drive up the road beside the school.',cue:'turn right',answers:["You can't turn right here.","You mustn't turn right here."],note:'The path on your right is a pavement, protected by bollards. Cars continue straight on.',area:'school-footpath',approach:{route:'central',dir:-1,point:[934,55],movement:'no-right'}},
 {id:'crossing',symbol:'crossing',name:'Pedestrian crossing',x:562,y:970,role:'Pedestrian',context:'Beside the bus stop.',cue:'cross here / look both ways',answers:['You can cross here when the pedestrian light is green.','You must look both ways before you cross.'],note:'Use the zebra crossing and wait for the green pedestrian light.'}
];
function icon(symbol){
 const blue='#2275b8',red='#d84741',ink='#243746',white='#fffdf6';
 const disc=(fill,stroke='none',width=0)=>`<circle cx="32" cy="32" r="28" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
 const slash=`<path d="M13 13L51 51" fill="none" stroke="${red}" stroke-width="7"/>`;
 const right=`<path d="M24 49V29Q24 24 29 24H40V16L53 28 40 40V32H32V49Z"/>`;
 let face;
 if(symbol==='parking')face=`<rect x="4" y="4" width="56" height="56" rx="8" fill="${blue}" stroke="${white}" stroke-width="3"/><text x="32" y="48" text-anchor="middle" font-family="Arial,sans-serif" font-size="46" font-weight="700" fill="${white}">P</text>`;
 else if(symbol==='no-parking')face=disc(white,red,6)+`<text x="32" y="47" text-anchor="middle" font-family="Arial,sans-serif" font-size="43" font-weight="700" fill="${ink}">P</text>`+slash;
 else if(symbol==='speed-limit')face=disc(white,red,6)+`<text x="32" y="44" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" font-weight="700" fill="${ink}">30</text>`;
 else if(symbol==='no-entry')face=disc(red,white,2)+`<rect x="12" y="27" width="40" height="10" rx="1" fill="${white}"/>`;
 else if(symbol==='straight')face=disc(blue,white,2)+`<path d="M27 52V28H17L32 11 47 28H37V52Z" fill="${white}"/>`;
 else if(symbol==='right')face=disc(blue,white,2)+`<g fill="${white}">${right}</g>`;
 else if(symbol==='no-right')face=disc(white,red,6)+`<g fill="${ink}">${right}</g>`+slash;
 else if(symbol==='crossing')face=`<rect x="10" y="10" width="44" height="44" rx="4" transform="rotate(45 32 32)" fill="#ffd66d" stroke="${ink}" stroke-width="2"/><g stroke="${ink}" fill="none" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="34" cy="17" r="4" fill="${ink}" stroke="none"/><path d="M31 25L28 36 20 46M28 36L38 44M31 25L39 31 44 29M30 27L22 31"/></g><path d="M14 50H50" stroke="${ink}" stroke-width="3"/>`;
 else throw new RangeError('Unknown road sign: '+symbol);
 return `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">${face}</svg>`;
}
root.CityRoadRules={signs,icon};if(typeof module!=='undefined')module.exports=root.CityRoadRules;
})(typeof window!=='undefined'?window:globalThis);
