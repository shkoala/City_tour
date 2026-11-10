/* Approved City_tour map, 1448 × 1086. Feet follow measured pavement geometry. */
(function(root){
'use strict';
const W=1448,H=1086,dirs=['N','E','S','W'];
const places=[
 ['hospital','hospital','the hospital','✚',350,264,[235,85,250,165]],['park','park','the park','♧',724,267,[550,84,355,171]],['school','school','the school','▤',1118,264,[989,76,238,174]],
 ['theatre','theatre','the theatre','◒',350,542,[228,340,240,185]],['cinema','cinema','the cinema','▶',594,542,[494,342,205,185]],['cafe','café','the café','☕',826,542,[733,340,193,188]],['bakery','baker’s','the baker’s','◓',1120,542,[1023,343,205,185]],
 ['garage','garage','the garage','⚒',280,756,[181,558,208,179]],['police','police station','the police station','♜',578,756,[469,553,205,185]],['post','post office','the post office','✉',838,756,[748,576,180,162]],['library','library','the library','▥',1165,756,[1030,555,247,185]],
 ['greengrocer','greengrocer’s','the greengrocer’s','●',310,1025,[156,851,289,160]],['bus','bus stop','the bus stop','▣',720,1025,[590,869,290,135]],['bank','bank','the bank','£',1160,1025,[1029,834,269,175]]
].map(([id,name,article,icon,x,y,rect])=>({id,name,article,icon,x,y,rect}));
const venues=Object.fromEntries(places.map(p=>[p.id,p]));
const raw={
 hL:[219,264],hospital:[350,264],hR:[482,264],pL:[550,264],park:[724,267],pR:[902,264],sL:[975,264],school:[1118,264],sR:[1249,264],
 mTopL:[210,348],mTopR:[914,348],rTop:[1245,348],
 mBackL:[184,542],theatre:[350,542],cinema:[594,542],cafe:[826,542],mBackR:[934,550],rBackL:[1007,550],bakery:[1120,542],rBackR:[1280,542],
 mL:[151,756],mCrossW:[186,756],garage:[280,756],police:[578,756],post:[838,756],mCrossE:[915,756],mR:[938,756],rL:[1008,756],library:[1165,756],rCross:[1261,756],rR:[1290,756],
 gN:[186,850],gL:[130,1025],greengrocer:[310,1025],gR:[459,1025],gX:[459,966],
 bL:[550,1025],bus:[720,1025],bR:[935,1025],bXL:[546,966],bXR:[935,966],bN:[925,850],
 kL:[1025,1025],bank:[1160,1025],kR:[1305,1025],kX:[1025,966],kNE:[1305,855],kN:[1261,850]
};
const nodes=Object.fromEntries(Object.entries(raw).map(([id,[x,y]])=>[id,{id,x,y,place:venues[id]?id:null}]));
const edges=Object.fromEntries(Object.keys(nodes).map(id=>[id,[]])),edgeList=[];
const crossings=[
 {id:'h1-west',road:'h1',x:224,y:305,light:{x:268,y:331},axis:'H'},
 {id:'h1-middle',road:'h1',x:899,y:305,light:{x:865,y:337},axis:'H'},
 {id:'h1-east',road:'h1',x:1214,y:305,light:{x:1170,y:331},axis:'H'},
 {id:'h2-west',road:'h2',x:186,y:807,light:{x:233,y:838},axis:'H'},
 {id:'h2-middle',road:'h2',x:915,y:807,light:{x:878,y:841},axis:'H'},
 {id:'h2-east',road:'h2',x:1261,y:807,light:{x:1219,y:838},axis:'H'},
 {id:'top-left',road:'v1-top',x:516,y:250,light:{x:474,y:244},axis:'V'},
 {id:'top-right',road:'v2',x:941,y:250,light:{x:977,y:240},axis:'V'},
 {id:'courtyard',road:'v2',x:965,y:550,light:{x:1008,y:578},axis:'V'},
 {id:'post-library',road:'v2',x:978,y:756,light:{x:1017,y:782},axis:'V'},
 {id:'bottom-left',road:'v1-bottom',x:502,y:966,light:{x:454,y:950},axis:'V'},
 {id:'bottom-right',road:'v2',x:981,y:966,light:{x:1024,y:940},axis:'V'}
];
function connect(a,b,via=[],passes=[]){
 const points=[{x:nodes[a].x,y:nodes[a].y},...via.map(p=>({x:p[0],y:p[1],cross:p[2]||null})),{x:nodes[b].x,y:nodes[b].y}];
 const crossing=points.find(p=>p.cross)?.cross||null,e={a,b,points,crossing,passes,kind:crossing?'crossing':'pavement'};edgeList.push(e);edges[a].push({to:b,...e});edges[b].push({to:a,...e});
}
const line=ids=>ids.slice(1).forEach((b,i)=>connect(ids[i],b));
line(['hL','hospital','hR']);line(['pL','park','pR']);line(['sL','school','sR']);
connect('hR','pL',[[491,264],[546,264,'top-left']]);connect('pR','sL',[[914,264],[971,264,'top-right']]);
line(['mL','mCrossW','garage','police','post','mCrossE','mR']);line(['mBackL','theatre','cinema','cafe','mBackR']);
connect('mL','mBackL',[[150,740],[160,680],[171,600],[181,560]],['garage']);
connect('mBackL','mTopL',[[187,500],[195,430],[201,380]],['theatre']);
connect('mR','mBackR',[[938,710],[940,620]],['post']);connect('mBackR','mTopR',[[934,510],[930,450],[922,390]],['cafe']);
connect('mTopL','hL',[[219,340],[222,273,'h1-west']]);connect('mTopR','pR',[[899,339],[899,274,'h1-middle']]);
connect('rTop','sR',[[1214,340],[1214,274,'h1-east']]);connect('rTop','rBackR',[[1264,420]],['bakery']);
line(['rBackL','bakery','rBackR']);line(['rL','library','rCross','rR']);connect('rBackL','rL',[[1002,600],[1005,690]],['library']);connect('rBackR','rR',[],['library']);
connect('mBackR','rBackL',[[941,550],[995,550,'courtyard']]);connect('mR','rL',[[943,756],[1003,756,'post-library']]);
line(['gL','greengrocer','gR']);connect('gL','gN',[[137,980],[145,930],[147,880],[163,860]]);connect('gR','gX');
connect('mCrossW','gN',[[186,768],[186,846,'h2-west']]);
line(['bL','bus','bR']);connect('bL','bXL');connect('bR','bXR');connect('bXR','bN');connect('gX','bXL',[[474,966],[539,966,'bottom-left']]);
connect('mCrossE','bN',[[915,766],[915,845,'h2-middle']]);
line(['kL','bank','kR']);connect('kL','kX');connect('kR','kNE');connect('kNE','kN');
connect('bXR','kX',[[949,966],[1018,966,'bottom-right']]);connect('rCross','kN',[[1261,768],[1261,845,'h2-east']]);
const parcels=[
 [[195,72],[487,72],[494,262],[484,278],[192,278],[177,261]],
 [[548,72],[906,72],[917,268],[903,279],[549,279],[537,264]],
 [[970,72],[1243,72],[1267,264],[1255,279],[973,279],[962,264]],
 [[185,337],[917,337],[931,350],[954,762],[934,778],[152,778],[135,761],[173,354]],
 [[991,337],[1252,337],[1268,350],[1308,759],[1288,778],[1008,778],[987,762],[978,352]],
 [[145,841],[459,841],[477,858],[477,1027],[461,1043],[127,1043],[112,1027],[132,857]],
 [[550,841],[936,841],[952,857],[952,1028],[936,1043],[550,1043],[534,1028],[534,857]],
 [[1026,841],[1293,841],[1310,857],[1322,1027],[1306,1043],[1028,1043],[1011,1028],[1008,858]]
];
const obstacles=[
 [[250,100],[474,100],[474,249],[250,249]],[[551,86],[902,86],[902,257],[551,257]],[[990,96],[1227,96],[1227,248],[990,248]],
 [[230,358],[469,358],[469,527],[230,527]],[[493,357],[698,357],[698,529],[493,529]],[[734,400],[920,400],[920,529],[734,529]],
 [[181,599],[929,599],[929,741],[181,741]],
 [[1023,356],[1235,356],[1235,530],[1023,530]],[[1030,600],[1270,600],[1270,741],[1030,741]],
 [[155,872],[450,872],[450,1011],[155,1011]],[[590,877],[813,877],[813,1002],[590,1002]],[[825,881],[878,881],[878,937],[825,937]],[[844,938],[851,938],[851,1000],[844,1000]],
 [[1033,888],[1297,888],[1297,1010],[1033,1010]],[[1128,843],[1190,843],[1230,888],[1070,888]]
];
function inPolygon(x,y,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [ax,ay]=poly[i],[bx,by]=poly[j];if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;}return inside;}
const isOnPavement=(x,y)=>parcels.some(p=>inPolygon(x,y,p))&&!obstacles.some(p=>inPolygon(x,y,p));
const isSafeStop=id=>!!nodes[id]&&isOnPavement(nodes[id].x,nodes[id].y);
for(const n of Object.values(nodes))n.kind=n.place?'entrance':edges[n.id].length>2?'junction':edges[n.id].some(e=>e.crossing)?'crossing':'corner';
function direction(a,b){const p=nodes[a],q=nodes[b],dx=q.x-p.x,dy=q.y-p.y;return Math.abs(dx)>Math.abs(dy)?(dx>0?'E':'W'):(dy>0?'S':'N');}
const edge=(a,b)=>edges[a]?.find(e=>e.to===b);
function geometry(a,b){const e=edge(a,b);if(!e)return null;if(a===e.a)return e.points.slice(1).map(p=>({...p}));const out=[];for(let i=e.points.length-2;i>=0;i--)out.push({...e.points[i],cross:e.points[i+1].cross||null});return out;}
function shortestPath(start,end){
 if(!nodes[start]||!nodes[end])return null;const cost={[start]:0},prev={[start]:null},open=new Set(Object.keys(nodes));
 while(open.size){let a=null;for(const n of open)if(Number.isFinite(cost[n])&&(a===null||cost[n]<cost[a]))a=n;if(a===null)break;open.delete(a);if(a===end)break;for(const e of edges[a]){const d=e.points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-e.points[i].x,p.y-e.points[i].y),0)+(e.crossing?35:0),c=cost[a]+d;if(c<(cost[e.to]??Infinity)){cost[e.to]=c;prev[e.to]=a;}}}
 if(!(end in prev))return null;const path=[];for(let n=end;n!==null;n=prev[n])path.unshift(n);return path;
}
const neighbour=(id,facing)=>edges[id]?.find(e=>direction(id,e.to)===facing)?.to;
function pastPath(id,facing){const path=[id];let at=id,passed=false;for(let i=0;i<12;i++){const next=neighbour(at,facing);if(!next||path.includes(next))break;const e=edge(at,next);path.push(next);if(e.passes.length)return path;if(passed)return path;if(nodes[next].place)passed=true;else if(edges[next].length>2||!neighbour(next,facing))return null;at=next;}return null;}
function pastLandmark(id,facing){const p=pastPath(id,facing);if(!p)return null;for(let i=1;i<p.length;i++){const e=edge(p[i-1],p[i]);if(e.passes.length)return e.passes[0];if(nodes[p[i]].place)return p[i];}return null;}
const aliases={bakery:['bakery','baker','bakers','bakers shop'],cafe:['cafe','coffee shop'],police:['police','police station'],post:['post','post office'],greengrocer:['greengrocer','greengrocers','fruit and vegetable shop'],bus:['bus stop','bus station']};
const normalise=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\b(the|a|an|im|at|we|are|its|is)\b/g,'').replace(/\s+/g,' ').trim();
const answerMatches=(s,id)=>!!venues[id]&&[venues[id].name,id,...(aliases[id]||[])].some(v=>normalise(v)===normalise(s));
const missions=[
 {id:'errand-bread',sender:'Mum',role:'family in Australia',emoji:'👩',text:'We haven’t got any bread. Could you buy a loaf for dinner, please?',target:'bakery'},
 {id:'errand-car',sender:'Dad',role:'family in Australia',emoji:'👨',text:'Our car won’t start. The mechanic is looking at it. Meet me outside.',target:'garage'},
 {id:'errand-veg',sender:'Grandma',role:'family in Australia',emoji:'👵',text:'Please buy some apples, carrots and tomatoes for lunch.',target:'greengrocer'},
 {id:'errand-card',sender:'Lena',role:'a friend from Russia',emoji:'👩',text:'We’d love a postcard from Australia! Don’t forget to get a stamp and send it to us.',target:'post'},
 {id:'errand-money',sender:'Dad',role:'family in Australia',emoji:'👨',text:'I need some cash. Meet me by the cash machine.',target:'bank'},
 {id:'errand-bus',sender:'Sam',role:'a friend in Australia',emoji:'🧑',text:'Let’s take the bus together. I’m waiting by the blue bus sign.',target:'bus'},
 {id:'errand-school',sender:'Emma',role:'a teacher in Australia',emoji:'👩‍🏫',text:'Can you help me with a lesson today? The children want to hear about life in Russia.',target:'school'},
 {id:'errand-hospital',sender:'Dad',role:'family in Australia',emoji:'👨',text:'I’m waiting to see the doctor. Could you meet me outside?',target:'hospital'},
 {id:'errand-film',sender:'Lucy',role:'a friend in Australia',emoji:'👩',text:'The film starts soon! I’ve got our tickets and some popcorn. Come and find me.',target:'cinema'},
 {id:'errand-play',sender:'Ben',role:'a friend in Australia',emoji:'🧑',text:'The actors are ready. The play starts soon. I’m waiting outside.',target:'theatre'},
 {id:'errand-tea',sender:'Emma',role:'a teacher in Australia',emoji:'👩‍🏫',text:'I’ve found a table for us. Let’s have a sandwich and a cup of tea.',target:'cafe'},
 {id:'errand-books',sender:'Grandpa',role:'family in Australia',emoji:'👴',text:'I’m returning my books. Meet me where we can borrow some more.',target:'library'},
 {id:'errand-wallet',sender:'Dad',role:'family in Australia',emoji:'👨',text:'An officer has found my wallet! Could you meet me where the police work?',target:'police'},
 {id:'errand-park',sender:'Max',role:'a friend in Australia',emoji:'🧑',text:'Let’s meet by the fountain. We can sit on a bench near the trees.',target:'park'},
 {id:'clue-behind',sender:'Alex',role:'a friend in Australia',emoji:'🧑',text:'I’m at the building directly behind the police station. Come and find me!',target:'cinema',group:'clues'},
 {id:'clue-front',sender:'Alex',role:'a friend in Australia',emoji:'🧑',text:'I’m at the building directly in front of the cinema. I’m waiting outside.',target:'police',group:'clues'},
 {id:'clue-next',sender:'Ben',role:'a friend in Australia',emoji:'🧑',text:'I’m next to the cinema. The actors are getting ready for a play.',target:'theatre',group:'clues'},
 {id:'clue-bakery',sender:'Lucy',role:'a friend in Australia',emoji:'👩',text:'I’m opposite the café and behind the library. Can you find me?',target:'bakery',group:'clues'},
 {id:'clue-library',sender:'Grandpa',role:'family in Australia',emoji:'👴',text:'I’m opposite the post office and in front of the baker’s. Meet me outside.',target:'library',group:'clues'},
 {id:'clue-post',sender:'Sam',role:'a friend in Australia',emoji:'🧑',text:'I’m next to the police station. There’s a red postbox outside.',target:'post',group:'clues'},
 {id:'clue-between',sender:'Max',role:'a friend in Australia',emoji:'🧑',text:'I’m between the hospital and the school. Come to the fountain!',target:'park',group:'clues'},
 {id:'clue-bank',sender:'Dad',role:'family in Australia',emoji:'👨',text:'I’m opposite the library. Look for the cash machine.',target:'bank',group:'clues'}
];
function turns(from,to,index){let d=(dirs.indexOf(to)-dirs.indexOf(from)+4)%4;return d===0?[]:d===1?[{kind:'turn',text:'Turn right.',from:index,to:index}]:d===3?[{kind:'turn',text:'Turn left.',from:index,to:index}]:[{kind:'turn',text:'Turn left. Turn left.',from:index,to:index}];}
function authored(start,facing,target,path,steps,story){return {start,facing,target,path,story,instructions:steps.map(([kind,text,from,to])=>({kind,text,from,to})),sender:'Alex',role:'a friend in Australia',emoji:'🧑',text:'Follow my directions. Where shall we meet?'};}
const walks=[
 authored('bus','S','post',['bus','bR','bXR','bN','mCrossE','post'],[
 ['turn','Turn left.',0,0],['straight','Go straight on to the corner.',0,1],['turn','Turn left.',1,1],['straight','Go straight on to the zebra crossing.',1,3],['cross','Cross the road.',3,4],['turn','Turn left.',4,4],['straight','Go straight on to the first entrance. It’s on your right.',4,5]],'Family and friends'),
 authored('post','W','garage',['post','police','garage'],[['past','Go straight on. Go past the police station. Stop at the next entrance. It’s on your right.',0,2]],'Family and friends'),
 authored('garage','W','theatre',['garage','mCrossW','mL','mBackL','theatre'],[['straight','Go straight on to the corner.',0,2],['turn','Turn right.',2,2],['past','Go past the garage.',2,3],['turn','Turn right into the courtyard.',3,3],['straight','Go straight on to the first entrance. It’s on your left.',3,4]],'Family and friends'),
 authored('theatre','E','cafe',['theatre','cinema','cafe'],[['past','Go straight on. Go past the cinema. Stop at the next entrance. It’s on your left.',0,2]],'Family and friends'),
 authored('cafe','E','bakery',['cafe','mBackR','rBackL','bakery'],[['straight','Go straight on to the zebra crossing.',0,1],['cross','Cross the road.',1,2],['straight','Go straight on to the first entrance. It’s on your left.',2,3]],'Family and friends'),
 authored('bakery','E','library',['bakery','rBackR','rR','rCross','library'],[['straight','Go straight on to the corner.',0,1],['turn','Turn right.',1,1],['straight','Go straight on to the far corner.',1,2],['turn','Turn right.',2,2],['straight','Go straight on to the first entrance. It’s on your right.',2,4]],'Visiting Emma'),
 authored('library','W','post',['library','rL','mR','mCrossE','post'],[['straight','Go straight on to the zebra crossing.',0,1],['cross','Cross the road.',1,2],['straight','Go straight on to the first entrance. It’s on your right.',2,4]],'Visiting Emma'),
 authored('post','W','school',['post','police','garage','mCrossW','mL','mBackL','mTopL','hL','hospital','hR','pL','park','pR','sL','school'],[
 ['past','Go straight on. Go past the police station and the garage.',0,4],['turn','Turn right at the corner.',4,4],['straight','Go straight on to the zebra crossing.',4,6],['cross','Cross the road.',6,7],['turn','Turn right.',7,7],['past','Go past the hospital.',7,9],['cross','Cross the road at the next zebra crossing.',9,10],['past','Go past the park.',10,12],['cross','Cross the road at the next zebra crossing.',12,13],['straight','Go straight on to the first entrance. It’s on your left.',13,14]],'Visiting Emma')
];
function instructionsFor(path,facing){let dir=facing,instructions=[];for(let i=1;i<path.length;){const nd=direction(path[i-1],path[i]);instructions.push(...turns(dir,nd,i-1));dir=nd;let end=i;while(end+1<path.length&&direction(path[end],path[end+1])===dir&&!edge(path[end-1],path[end]).crossing&&!edge(path[end],path[end+1]).crossing)end++;const segment=path.slice(i-1,end+1),passed=segment.slice(1,-1).filter(id=>nodes[id].place),cross=segment.slice(1).some((id,k)=>edge(segment[k],id).crossing);let text=cross?'Cross the road at the zebra crossing.':passed.length?'Go past '+passed.map(id=>venues[id].article).join(' and ')+'.':'Go straight on.';if(end===path.length-1)text+=' Stop at the next entrance. It’s on your '+(dir==='E'?'left':'right')+'.';else if(!cross)text+=' Stop at the '+(nodes[path[end]].kind==='crossing'?'zebra crossing':nodes[path[end]].place?'next entrance':'corner')+'.';instructions.push({kind:cross?'cross':passed.length?'past':'straight',text,from:i-1,to:end});i=end+1;}return instructions;}
function routeTask(start,facing,serial=0){
 const planned=walks[serial];if(planned&&start===planned.start)return {...planned,expectedFacing:planned.facing,facing,instructions:[...turns(facing,planned.facing,0),...planned.instructions],serial,planned:true};
 let target,path,connector=false;if(planned){target=planned.start;path=shortestPath(start,target);connector=true;}else{let options=places.filter(p=>p.id!==start).map(p=>({target:p.id,path:shortestPath(start,p.id)}));const long=options.filter(o=>o.path.length>=4);if(long.length)options=long;const choice=options[(serial-walks.length)%options.length];target=choice.target;path=choice.path;}
 return {start,facing,target,path,instructions:instructionsFor(path,facing),serial,planned:false,connector,story:connector?'On the way to the next walk':'More adventures',sender:'Alex',role:'a friend in Australia',emoji:'🧑',text:connector?'Let’s get ready for our next walk. Follow my directions. Where will you arrive?':'Follow my directions. Where shall we meet?'};
}
root.CityWorld={W,H,dirs,places,venues,nodes,edges,edgeList,crossings,parcels,obstacles,pavementZones:parcels,isOnPavement,isSafeStop,inPolygon,direction,edge,geometry,shortestPath,neighbour,pastPath,pastLandmark,answerMatches,normalise,missions,walks,routeTask,instructionsFor};
if(typeof module!=='undefined')module.exports=root.CityWorld;
})(typeof window!=='undefined'?window:globalThis);
