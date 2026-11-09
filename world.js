/* The drawing and the walking graph share the same world coordinates.
   Pavement edges never enter a carriageway; only crossing edges can do that. */
(function(root){
  'use strict';
  const W=1448,H=1086;
  const places=[
    {id:'hospital',name:'hospital',article:'the hospital',icon:'✚'},
    {id:'park',name:'park',article:'the park',icon:'♧'},
    {id:'school',name:'school',article:'the school',icon:'▤'},
    {id:'theatre',name:'theatre',article:'the theatre',icon:'◒'},
    {id:'cinema',name:'cinema',article:'the cinema',icon:'▶'},
    {id:'cafe',name:'café',article:'the café',icon:'☕'},
    {id:'bakery',name:'baker’s',article:'the baker’s',icon:'◓'},
    {id:'garage',name:'garage',article:'the garage',icon:'⚒'},
    {id:'police',name:'police station',article:'the police station',icon:'♜'},
    {id:'post',name:'post office',article:'the post office',icon:'✉'},
    {id:'library',name:'library',article:'the library',icon:'▥'},
    {id:'greengrocer',name:'greengrocer’s',article:'the greengrocer’s',icon:'●'},
    {id:'bus',name:'bus stop',article:'the bus stop',icon:'▣'}
  ];
  // Original layout, with local pavement corrections in scene.js.
  const placePositions={
    hospital:[350,250,195,36,310,211],park:[730,249,551,87,391,171],school:[1115,250,997,28,292,214],
    theatre:[380,513,233,268,268,229],cinema:[620,513,517,274,219,212],cafe:[880,513,740,291,248,206],bakery:[1100,513,1013,291,220,199],
    garage:[350,786,211,573,275,202],police:[613,786,495,559,240,216],post:[850,786,751,585,203,194],library:[1160,790,1040,556,253,219],
    greengrocer:[320,956,211,801,207,157],bus:[727,1062,615,902,260,140]
  };
  for(const p of places){const [x,y,...rect]=placePositions[p.id];Object.assign(p,{x,y,rect});}
  const venues=Object.fromEntries(places.map(p=>[p.id,p]));
  const raw={
    tL:[230,250],hospital:[350,250],park:[730,249],school:[1115,250],tR:[1240,250],
    mL:[215,513],theatre:[380,513],cinema:[620,513],cafe:[880,513],bakery:[1100,513],mR:[1263,513],
    lL:[165,786],garage:[350,786],police:[613,786],post:[850,786],library:[1160,790],lR:[1320,790],
    postCorner:[958,786],postSide:[958,665],libraryCorner:[1078,790],librarySide:[1053,620],libraryEast:[1326,665],
    gL:[165,956],greengrocer:[320,956],gR:[443,956],
    bL:[165,1062],bus:[727,1062],bR:[1290,1062]
  };
  const nodes=Object.fromEntries(Object.entries(raw).map(([id,[x,y]])=>[id,{id,x,y,place:venues[id]?id:null}]));
  const edges=Object.fromEntries(Object.keys(nodes).map(id=>[id,[]])),edgeList=[];
  const crossings=[
    {id:'hospital-park',road:4,x:524,y1:248,y2:264,light:{x:488,y:246}},
    {id:'park-school',road:5,x:974,y1:248,y2:267,light:{x:943,y:246}},
    {id:'north-crossing',road:0,x:230,y1:264,y2:306,light:{x:257,y:253}},
    {id:'middle-crossing',road:1,x:205,y1:537,y2:583,light:{x:230,y:525}},
    {id:'south-crossing',road:2,x:165,y1:809,y2:864,light:{x:190,y:796}},
    {id:'bus-crossing',road:3,x:165,y1:973,y2:1024,light:{x:137,y:1060}},
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
  line(['lL','garage','police','post']);
  line(['gL','greengrocer','gR']);line(['bL','bus','bR']);
  // Curbs are geometry, never destinations. Each command ends at an entrance or
  // a real pavement corner; one crossing continues all the way onto the next lot.
  connect('hospital','park',[[486,250],[568,256,'hospital-park'],[730,256]]);
  connect('park','school',[[730,258],[930,258],[1008,250,'park-school']]);
  connect('tL','mL',[[240,322,'north-crossing'],[230,350],[225,368],[205,488]]);
  connect('mL','lL',[[205,527],[205,580,'middle-crossing'],[180,594,'middle-crossing'],[174,600],[166,638],[151,756]]);
  connect('lL','gL',[[165,795],[165,872,'south-crossing'],[165,930]]);
  connect('gL','bL',[[165,960],[165,1024,'bus-crossing']]);
  line(['post','postCorner']);
  connect('postCorner','libraryCorner',[[966,787],[1078,787,'library-crossing']]);
  line(['libraryCorner','library','lR']);
  connect('postCorner','postSide');
  connect('libraryCorner','librarySide',[[1078,754],[1063,687]]);
  connect('lR','libraryEast');
  const rows=[['tL','hospital','park','school','tR'],['mL','theatre','cinema','cafe','bakery','mR'],['lL','garage','police','post','library','lR'],['gL','greengrocer','gR'],['bL','bus','bR']];
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
    [[145,868],[185,868],[184,960],[145,960]],
    [[139,1016],[188,1001],[191,1068],[139,1068]],
    [[946,651],[975,651],[977,796],[946,796]],
    [[1039,609],[1068,609],[1093,796],[1062,796]],
    [[1316,653],[1338,653],[1341,796],[1306,796]]
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


