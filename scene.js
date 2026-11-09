/* Scene geometry shares the walking graph's 1448 × 1086 coordinates. */
(function(root){
  'use strict';
  const foregrounds=[
    {id:'theatre',foot:507,points:[[237,346],[259,298],[275,298],[287,281],[323,281],[380,263],[441,281],[495,281],[490,298],[519,298],[512,352],[504,352],[504,482],[439,482],[439,505],[333,505],[333,482],[248,482],[248,355],[237,355]]},
    {id:'cinema',foot:490,points:[[514,338],[538,300],[566,300],[573,289],[589,279],[607,272],[626,269],[647,273],[666,282],[683,293],[695,305],[708,304],[736,338],[736,481],[515,481]]},
    {id:'cafe',foot:500,points:[[735,359],[767,359],[767,314],[807,314],[814,305],[829,295],[849,289],[869,291],[888,301],[899,315],[962,315],[980,354],[986,354],[986,487],[739,487]]},
    {id:'bakery',foot:500,points:[[1015,358],[1015,316],[1050,316],[1059,304],[1078,294],[1098,289],[1118,293],[1137,303],[1149,316],[1202,316],[1223,355],[1231,355],[1231,489],[1015,489]]},
    {id:'garage',foot:772,points:[[231,650],[248,602],[344,573],[452,609],[456,648],[484,648],[484,767],[232,767]]},
    {id:'police',foot:780,points:[[495,632],[515,596],[555,596],[570,561],[656,561],[672,596],[713,596],[732,632],[726,651],[726,764],[666,764],[666,779],[550,779],[550,764],[495,764]]},
    {id:'post',foot:781,points:[[751,635],[765,589],[922,589],[948,634],[945,646],[945,753],[896,753],[896,781],[802,781],[802,755],[752,755]]},
    {id:'library',foot:779,source:'assets/side-pavements-v2.webp',points:[[1067,600],[1085,600],[1180,557],[1267,595],[1293,595],[1315,644],[1310,660],[1310,751],[1257,751],[1257,778],[1145,778],[1145,751],[1092,751],[1092,659],[1075,659],[1072,643]]},
    {id:'greengrocer',foot:954,points:[[208,874],[222,823],[271,823],[278,814],[293,806],[315,802],[337,807],[355,816],[363,823],[404,823],[406,842],[422,877],[416,889],[414,951],[211,951]]},
    {id:'bus',foot:1041,points:[[645,943],[662,905],[790,905],[812,941],[812,1028],[798,1041],[649,1041],[649,951]]}
  ];
  // Buildings keep their positions. The cleared library uses the local edited art;
  // every other facade is copied from the original.
  const pavementPatches=[
    {id:'post-side',points:[[941,675],[976,675],[982,769],[941,769]],exclude:'post'},
    {id:'library-cleared',points:[[1022,550],[1344,550],[1344,805],[1022,805]]}
  ];
  const roadLanes=[{y:[287,306],left:174,right:1270},{y:[554,577],left:133,right:1325},{y:[832,855],left:93,right:1382}];
  const lowerCrossing={x:165,top:978,stripes:3,spacing:8,stripeHeight:5};
  const carSize={width:56,height:19.04},patchBounds={x:930,y:540,width:430,height:280};
  const depth=y=>100+Math.round(y*10);
  const carPose=c=>{const r=roadLanes[c.road],y=r.y[c.dir===1?0:1];return {x:c.x,y,z:depth(y),opacity:Math.max(0,Math.min(1,(c.x-r.left)/24,(r.right-c.x)/24))};};
  const points=poly=>poly.map(p=>p.join(',')).join(' ');
  function mapMarkup(asset=p=>p,prefix='map'){
    const original=asset('assets/town-map.webp');
    const masks=pavementPatches.map(p=>`<mask id="${prefix}-${p.id}" maskUnits="userSpaceOnUse" x="0" y="0" width="1448" height="1086"><polygon points="${points(p.points)}" fill="white"/>${p.exclude?`<polygon points="${points(foregrounds.find(f=>f.id===p.exclude).points)}" fill="black"/>`:""}</mask>`).join('');
    // Precise zebra paint is aligned at x=165 with the crossing above.
    const stripes=Array.from({length:lowerCrossing.stripes},(_,i)=>`<path d="M${lowerCrossing.x-22} ${lowerCrossing.top+i*lowerCrossing.spacing}H${lowerCrossing.x+22}L${lowerCrossing.x+20} ${lowerCrossing.top+lowerCrossing.stripeHeight+i*lowerCrossing.spacing}H${lowerCrossing.x-24}Z" fill="#f8f8f4"/>`).join('');
    return `<defs>${masks}<linearGradient id="${prefix}-right" x1="380" y1="0" x2="400" y2="0" gradientUnits="userSpaceOnUse"><stop stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient><linearGradient id="${prefix}-top" x1="0" y1="970" x2="0" y2="978" gradientUnits="userSpaceOnUse"><stop stop-color="black"/><stop offset="1" stop-color="white"/></linearGradient><mask id="${prefix}-bottom-top" maskUnits="userSpaceOnUse" x="0" y="970" width="400" height="116"><rect x="0" y="970" width="400" height="116" fill="url(#${prefix}-top)"/></mask><mask id="${prefix}-bottom" maskUnits="userSpaceOnUse" x="0" y="970" width="400" height="116"><rect x="0" y="970" width="400" height="116" fill="url(#${prefix}-right)" mask="url(#${prefix}-bottom-top)"/></mask></defs><image href="${original}" width="1448" height="1086"/>${pavementPatches.map(p=>`<image href="${asset('assets/side-pavements-v2.webp')}" x="930" y="540" width="430" height="280" mask="url(#${prefix}-${p.id})"/>`).join('')}<image href="${asset('assets/bottom-pavement-v2.webp')}" x="0" y="936" width="400" height="150" mask="url(#${prefix}-bottom)"/>${stripes}`;
  }
  root.CityScene={foregrounds,pavementPatches,roadLanes,carSize,lowerCrossing,patchBounds,depth,carPose,points,mapMarkup};
  if(typeof module!=='undefined')module.exports=root.CityScene;
})(typeof window!=='undefined'?window:globalThis);
