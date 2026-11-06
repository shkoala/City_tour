/* The drawing and the walking graph share the same world coordinates.
   Pavement edges never enter a carriageway; only crossing edges can do that. */
(function(root){
  'use strict';
  const W=1448,H=1086;
  const places=[
    {id:'hospital',name:'hospital',article:'the hospital',icon:'✚',x:380,y:222,rect:[230,18,280,190],src:[195,22,313,224],poly:'5,60 48,60 62,16 288,16 295,53 311,76 311,202 288,221 15,221 1,196',art:[245,25,255,183]},
    {id:'park',name:'park',article:'the park',icon:'♧',x:780,y:222,rect:[540,30,400,167],src:[548,62,400,196],poly:'0,43 27,9 112,13 149,31 187,24 242,43 312,28 353,28 384,58 397,174 377,193 17,193 0,174',art:[553,32,354,174]},
    {id:'school',name:'school',article:'the school',icon:'▤',x:1120,y:222,rect:[995,10,245,192],src:[994,8,298,240],poly:'4,108 31,64 89,64 131,17 158,3 191,47 213,70 258,104 263,210 242,235 26,235 1,215',art:[1001,12,236,190]},
    {id:'theatre',name:'theatre',article:'the theatre',icon:'◒',x:330,y:514,rect:[230,333,210,160],src:[226,264,280,235],poly:'1,86 24,44 106,1 186,36 267,24 273,178 254,227 24,227 6,211',art:[226,333,213,168]},
    {id:'cinema',name:'cinema',article:'the cinema',icon:'▶',x:570,y:514,rect:[482,335,170,158],src:[512,272,226,214],poly:'2,81 19,34 64,35 78,7 134,1 169,28 208,51 223,87 217,208 18,208 4,191',art:[484,340,169,160]},
    {id:'cafe',name:'café',article:'the café',icon:'☕',x:830,y:514,rect:[737,339,187,158],src:[736,287,251,214],poly:'2,63 39,25 87,24 112,3 160,1 188,26 247,48 248,195 32,210 2,193',art:[735,339,188,160]},
    {id:'bakery',name:'baker’s',article:'the baker’s',icon:'◓',x:1120,y:514,rect:[1031,338,193,161],src:[1012,289,222,205],poly:'2,55 31,23 70,16 101,1 156,18 187,32 208,71 217,181 198,200 18,198 2,178',art:[1027,338,194,160]},
    {id:'garage',name:'garage',article:'the garage',icon:'⚒',x:350,y:804,rect:[242,625,211,158],src:[210,573,274,201],poly:'1,70 22,40 142,1 237,41 269,80 270,195 3,195',art:[237,630,226,160]},
    {id:'police',name:'police station',article:'the police station',icon:'♜',x:600,y:804,rect:[498,623,204,164],src:[493,561,239,212],poly:'3,70 56,67 60,1 134,1 163,41 217,50 235,84 235,204 2,204',art:[500,626,195,161]},
    {id:'post',name:'post office',article:'the post office',icon:'✉',x:830,y:804,rect:[752,630,174,159],src:[750,587,202,191],poly:'3,58 8,2 170,2 191,28 199,158 181,187 2,185',art:[746,632,179,151]},
    {id:'library',name:'library',article:'the library',icon:'▥',x:1120,y:804,rect:[1018,623,223,171],src:[1038,557,251,217],poly:'2,87 24,50 117,2 211,54 234,91 247,209 12,209',art:[1019,624,217,166]},
    {id:'greengrocer',name:'greengrocer’s',article:'the greengrocer’s',icon:'●',x:350,y:1050,rect:[249,913,190,127],src:[212,799,201,163],poly:'2,40 37,34 59,10 108,1 146,19 185,21 193,68 198,132 180,156 16,156',art:[261,916,174,125]},
    {id:'bus',name:'bus stop',article:'the bus stop',icon:'▣',x:720,y:1050,rect:[630,924,240,120],src:[613,901,263,144],poly:'2,50 34,3 185,3 206,24 260,12 260,129 211,139 27,139 2,119',art:[622,927,236,106]}
  ];
  // Original user-approved 1448 × 1086 map. All geometry is traced over it.
  const placePositions={
    hospital:[350,250,195,36,310,211],park:[730,249,551,87,391,171],school:[1115,250,997,28,292,214],
    theatre:[380,513,233,268,268,229],cinema:[620,513,517,274,219,212],cafe:[880,513,740,291,248,206],bakery:[1100,513,1013,291,220,199],
    garage:[350,786,211,573,275,202],police:[613,786,495,559,240,216],post:[850,786,751,585,203,194],library:[1160,790,1040,556,253,219],
    greengrocer:[320,956,211,801,207,157],bus:[727,1062,615,902,260,140]
  };
  for(const p of places){const [x,y,...rect]=placePositions[p.id];Object.assign(p,{x,y,rect});delete p.art;}
  const venues=Object.fromEntries(places.map(p=>[p.id,p]));
  const raw={
    tL:[230,250],hospital:[350,250],park:[730,249],school:[1115,250],tR:[1240,250],
    mL:[215,513],theatre:[380,513],cinema:[620,513],cafe:[880,513],bakery:[1100,513],mR:[1263,513],
    lL:[165,786],garage:[350,786],police:[613,786],post:[850,786],library:[1160,790],lR:[1320,790],
    gCorner:[80,956],gL:[170,956],greengrocer:[320,956],gR:[443,956],
    bL:[80,1062],bus:[727,1062],bR:[1290,1062]
  };
  const nodes=Object.fromEntries(Object.entries(raw).map(([id,[x,y]])=>[id,{id,x,y,place:venues[id]?id:null}]));
  const edges=Object.fromEntries(Object.keys(nodes).map(id=>[id,[]])),edgeList=[];
  const crossings=[
    {id:'hospital-park',road:4,x:524,y1:248,y2:264,light:{x:488,y:246}},
    {id:'park-school',road:5,x:974,y1:248,y2:267,light:{x:943,y:246}},
    {id:'north-crossing',road:0,x:230,y1:264,y2:306,light:{x:257,y:253}},
    {id:'middle-crossing',road:1,x:205,y1:537,y2:583,light:{x:230,y:525}},
    {id:'south-crossing',road:2,x:165,y1:809,y2:864,light:{x:190,y:796}},
    {id:'bus-crossing',road:3,x:80,y1:969,y2:1055,light:{x:117,y:1055}},
    {id:'library-crossing',road:6,x:1018,y1:780,y2:809,light:{x:1085,y:789}},
    {id:'cinema-signal',road:1,x:480,y1:535,y2:583,light:{x:513,y:530},decorative:true},
    {id:'post-signal',road:2,x:855,y1:806,y2:883,light:{x:894,y:795},decorative:true}
  ];
  // A cross property authorises only that single zebra segment, not the whole edge.
  function connect(a,b,via=[]){
    const points=[{x:nodes[a].x,y:nodes[a].y},...via.map(p=>({x:p[0],y:p[1],cross:p[2]||null})),{x:nodes[b].x,y:nodes[b].y}];
    const crossing=points.find(p=>p.cross)?.cross||null,e={a,b,points,crossing,kind:crossing?'crossing':'pavement'};
    edgeList.push(e);edges[a].push({to:b,...e});edges[b].push({to:a,...e});
  }
  const line=(ids)=>ids.slice(1).forEach((id,i)=>connect(ids[i],id));
  line(['tL','hospital']);line(['school','tR']);
  line(['mL','theatre','cinema','cafe','bakery','mR']);
  line(['lL','garage','police','post']);line(['library','lR']);
  line(['gCorner','gL','greengrocer','gR']);line(['bL','bus','bR']);
  // Curbs are geometry, never destinations. Each command ends at an entrance or
  // a real pavement corner; one crossing continues all the way onto the next lot.
  connect('hospital','park',[[486,250],[568,256,'hospital-park'],[730,256]]);
  connect('park','school',[[730,258],[930,258],[1008,250,'park-school']]);
  connect('tL','mL',[[240,322,'north-crossing'],[230,350],[225,368],[205,488]]);
  connect('mL','lL',[[205,527],[205,580,'middle-crossing'],[180,594,'middle-crossing'],[174,600],[166,638],[151,756]]);
  connect('lL','gL',[[165,795],[165,872,'south-crossing'],[165,930]]);
  connect('gCorner','bL',[[80,960],[80,1062,'bus-crossing']]);
  connect('post','library',[[951,787],[1080,787,'library-crossing']]);
  const rows=[['tL','hospital','park','school','tR'],['mL','theatre','cinema','cafe','bakery','mR'],['lL','garage','police','post','library','lR'],['gCorner','gL','greengrocer','gR'],['bL','bus','bR']];
  // Independent ground zones traced on the approved bitmap. In particular,
  // (1018,792), the old library waypoint, is roadway and cannot be a stop.
  const pavementZones=[
    [[206,239],[492,239],[494,258],[218,260],[206,252]],
    [[560,250],[936,250],[942,256],[931,263],[560,263]],
    [[688,225],[778,225],[784,255],[688,255]],
    [[1004,242],[1247,242],[1250,257],[1004,260]],
    [[207,500],[1255,500],[1270,513],[1255,530],[205,530],[200,519]],
    [[155,773],[953,773],[971,789],[956,800],[167,800],[153,785]],
    [[1062,774],[1328,774],[1341,794],[1325,803],[1068,803],[1055,791]],
    [[58,939],[444,939],[453,956],[444,964],[68,964],[58,955]],
    [[50,1054],[1357,1054],[1368,1069],[43,1069]],
    [[210,309],[246,311],[238,348],[220,370],[206,360]],
    [[170,592],[183,587],[190,592],[184,609],[171,621],[163,619]],
    [[145,868],[185,868],[184,941],[145,941]]
  ];
  function inPolygon(x,y,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [ax,ay]=poly[i],[bx,by]=poly[j];if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;}return inside;}
  const isOnPavement=(x,y)=>pavementZones.some(poly=>inPolygon(x,y,poly));
  const isSafeStop=id=>!!nodes[id]&&isOnPavement(nodes[id].x,nodes[id].y);
  for(const n of Object.values(nodes))n.kind=n.place?'entrance':edges[n.id].length>2?'junction':edges[n.id].length===1?'end':'corner';
  const dirs=['N','E','S','W'];
  const direction=(a,b)=>{const p=nodes[a],q=nodes[b],dx=q.x-p.x,dy=q.y-p.y;return Math.abs(dx)>Math.abs(dy)?(dx>0?'E':'W'):(dy>0?'S':'N');};
  const edge=(a,b)=>edges[a]?.find(e=>e.to===b);
  function geometry(a,b){const e=edge(a,b);if(!e)return null;if(a===e.a)return e.points.slice(1).map(p=>({...p}));const out=[];for(let i=e.points.length-2;i>=0;i--)out.push({...e.points[i],cross:e.points[i+1].cross||null});return out;}
  function shortestPath(start,end){
    const queue=[start],prev={[start]:null};
    for(let i=0;i<queue.length;i++){const a=queue[i];if(a===end)break;for(const e of edges[a])if(!(e.to in prev)){prev[e.to]=a;queue.push(e.to);}}
    if(!(end in prev))return null;const result=[];for(let p=end;p!==null;p=prev[p])result.unshift(p);return result;
  }
  const neighbour=(id,facing)=>edges[id].find(e=>direction(id,e.to)===facing)?.to;
  function pastPath(id,facing){const a=neighbour(id,facing),b=a&&neighbour(a,facing);return a&&b&&nodes[a].place&&isSafeStop(b)?[id,a,b]:null;}
  const missions=[
    {sender:'Mum',emoji:'👩',text:'Hi, Cole! Could you buy some fresh bread for dinner, please?',target:'bakery'},
    {sender:'Dad',emoji:'👨',text:'The car is making a funny noise! I’m waiting where the mechanics repair cars. Meet me there.',target:'garage'},
    {sender:'Grandma',emoji:'👵',text:'Please get some carrots, apples and tomatoes. I need fresh fruit and vegetables for lunch.',target:'greengrocer'},
    {sender:'Lucy',emoji:'👧',text:'The film starts soon! I’ve got our tickets and a big box of popcorn. Come and find me!',target:'cinema'},
    {sender:'Sam',emoji:'🧑',text:'I’m visiting my aunt. Doctors and nurses work here. Can you meet me outside?',target:'hospital'},
    {sender:'Ben',emoji:'👦',text:'The actors are getting ready to go on stage. Our seats are in the front row. Hurry!',target:'theatre'},
    {sender:'Emma',emoji:'👩',text:'Let’s have some sandwiches and a drink. I’ve found a lovely table outside. The waiter is bringing the menu.',target:'cafe'},
    {sender:'Mum',emoji:'👩',text:'Could you send this birthday card to Uncle Ben? You’ll need a stamp. Look for the red postbox!',target:'post'},
    {sender:'Kate',emoji:'👧',text:'Our English lesson starts in ten minutes! The teacher is waiting. Meet me outside our classroom building.',target:'school'},
    {sender:'Grandpa',emoji:'👴',text:'I’m returning the books I borrowed last week. Meet me where we can borrow some more!',target:'library'},
    {sender:'Dad',emoji:'👨',text:'An officer has found my missing wallet! Could you collect it from the place where the police work?',target:'police'},
    {sender:'Max',emoji:'🧑',text:'It’s a beautiful day! Let’s sit near the fountain and enjoy the trees. I’m already here.',target:'park'}
  ];
  const aliases={bakery:['bakery',"bakers","baker","bakers shop"],cafe:['cafe','coffee shop'],police:['police','police station'],post:['post','post office'],greengrocer:['greengrocer','greengrocers','fruit and vegetable shop'],bus:['bus stop','bus station']};
  const normalise=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\b(the|a|an|im|at|we|are|its|is)\b/g,'').replace(/\s+/g,' ').trim();
  const answerMatches=(s,id)=>[venues[id].name,id,...(aliases[id]||[])].some(v=>normalise(v)===normalise(s));
  function routeTask(start,facing,serial=0){
    let choices=places.filter(p=>p.id!=='bus'&&p.id!==start).map(p=>({target:p.id,path:shortestPath(start,p.id)}));
    const passable=o=>o.path.slice(1,-1).some((id,i)=>nodes[id].place&&direction(o.path[i],id)===direction(id,o.path[i+2]));
    const good=choices.filter(o=>o.path.length>=5&&passable(o));if(good.length)choices=good;
    choices.sort((a,b)=>a.target.localeCompare(b.target));const selected=choices[serial%choices.length];
    const path=selected.path,instructions=[];let dir=facing, i=1;
    while(i<path.length){
      const nextDir=direction(path[i-1],path[i]);const delta=(dirs.indexOf(nextDir)-dirs.indexOf(dir)+4)%4;
      if(delta)instructions.push({kind:'turn',text:delta===1?'Turn right.':delta===3?'Turn left.':'Turn around.',from:i-1,to:i-1});
      dir=nextDir;const first=i-1;let last=i;
      while(last+1<path.length&&direction(path[last],path[last+1])===dir)last++;
      const section=path.slice(first,last+1),passed=section.slice(1,-1).filter(id=>nodes[id].place),crosses=section.slice(1).filter((id,k)=>edge(section[k],id).crossing);
      let text='';
      if(passed.length){const names=passed.map(id=>venues[id].article);text='Go past '+(names.length>1?names.slice(0,-1).join(', ')+' and '+names.at(-1):names[0])+'. ';}
      else text='Go straight on. ';
      if(crosses.length)text+='Use the zebra crossing'+(crosses.length>1?'s':'')+'. ';
      if(last===path.length-1){const side=dir==='E'?'left':dir==='W'?'right':null;text+=side?'Stop at the '+(passed.length?'next':'first')+' place on your '+side+'.':'Stop at the entrance.';}
      else {const n=nodes[path[last]],stop=n.place?'entrance to '+venues[path[last]].article:n.kind==='corner'?'corner':n.kind==='end'?'end of the pavement':'junction';text+='Stop at the '+stop+'.';}
      instructions.push({kind:passed.length?'past':'straight',text,from:first,to:last,passed});i=last+1;
    }
    return {...selected,start,facing,instructions,serial,sender:'Alex',emoji:'🧑',text:'Hi, Cole! Follow my directions. Where shall we meet?'};
  }
  root.CityWorld={W,H,places,venues,nodes,edges,edgeList,crossings,rows,pavementZones,isOnPavement,isSafeStop,dirs,direction,edge,geometry,neighbour,pastPath,shortestPath,missions,routeTask,answerMatches,normalise};
  if(typeof module!=='undefined')module.exports=root.CityWorld;
})(typeof window!=='undefined'?window:globalThis);

