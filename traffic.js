/* Quiet through traffic: cars enter and leave beyond the town's road edges. */
(function(root){
'use strict';
const LANE=9.5,GAP=100;
const roads=[
 {id:'h1',axis:'H',points:[[153,305],[1290,305]]},
 {id:'h2',axis:'H',points:[[100,807],[1325,807]]},
 {id:'v2',axis:'V',points:[[934,-80],[934,65],[936.5,150],[939.5,200],[941,278],[954.5,344],[956.5,380],[959,430],[961.5,480],[966,550],[973.5,650],[977.5,730],[979,768],[980,845],[982,1166]]},
 {id:'v1-top',axis:'V',points:[[516,-80],[516,305]]},
 {id:'v1-bottom',axis:'V',points:[[504,807],[502,1166]]},
 {id:'west',axis:'V',points:[[164,305],[160,344],[154.5,380],[150.5,430],[144.5,480],[136,550],[124,650],[115.5,730],[112,768],[108,807]]}
].map(r=>{let length=0;const segments=r.points.slice(1).map((p,i)=>{const a=r.points[i],dx=p[0]-a[0],dy=p[1]-a[1],len=Math.hypot(dx,dy),s=length;length+=len;return {a,b:p,s,len,tx:dx/len,ty:dy/len};});return {...r,segments,length};});
const roadById=Object.fromEntries(roads.map(r=>[r.id,r]));
function at(road,s){const r=typeof road==='string'?roadById[road]:road,g=r.segments.find(g=>s<=g.s+g.len)||r.segments.at(-1),d=s-g.s;return {x:g.a[0]+g.tx*d,y:g.a[1]+g.ty*d,tx:g.tx,ty:g.ty};}
function project(road,x,y){const r=typeof road==='string'?roadById[road]:road;let best=Infinity,result=0;for(const g of r.segments){const t=Math.max(0,Math.min(g.len,(x-g.a[0])*g.tx+(y-g.a[1])*g.ty)),p=at(r,g.s+t),d=Math.hypot(p.x-x,p.y-y);if(d<best){best=d;result=g.s+t;}}return result;}
function makeRoute(id,start,commands){
 const points=[start];
 for(const command of commands){if(command.length===2)points.push(command);else{const [ax,ay]=points.at(-1);for(let i=1;i<=40;i++){const t=i/40,u=1-t;if(command.length===6){const [cx,cy,dx,dy,x,y]=command;points.push([u*u*u*ax+3*u*u*t*cx+3*u*t*t*dx+t*t*t*x,u*u*u*ay+3*u*u*t*cy+3*u*t*t*dy+t*t*t*y]);}else{const [cx,cy,x,y]=command;points.push([u*u*ax+2*u*t*cx+t*t*x,u*u*ay+2*u*t*cy+t*t*y]);}}}}
 const vertices=points.map(([x,y],i)=>{const prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],a=Math.hypot(x-prev[0],y-prev[1]),b=Math.hypot(next[0]-x,next[1]-y),tx=(a?(x-prev[0])/a:0)+(b?(next[0]-x)/b:0),ty=(a?(y-prev[1])/a:0)+(b?(next[1]-y)/b:0),n=Math.hypot(tx,ty);return {x,y,tx:tx/n,ty:ty/n};});
 let length=0;const segments=vertices.slice(1).map((b,i)=>{const a=vertices[i],len=Math.hypot(b.x-a.x,b.y-a.y),s=length;length+=len;return {a,b,len,s};});
 return {id,points,segments,length};
}
// Every route has two different, offscreen ends. Neither path closes into a loop.
const routes=[
 makeRoute('central',[934,-80],[[934,65],[936.5,150],[939.5,200],[941,278],[941,300,952.3,315,954.5,344],[956.5,380],[959,430],[961.5,480],[966,550],[973.5,650],[977.5,730],[979,768],[980,807,980,846],[982,1166]]),
 makeRoute('west',[516,-80],[[516,267],[516,305,478,305],[203,305],[164,305,160,344],[154.5,380],[150.5,430],[144.5,480],[136,550],[124,650],[115.5,730],[112,768],[108,807,147,807],[466,807],[504,807,504,845],[502,1166]])
];
const routeById=Object.fromEntries(routes.map(r=>[r.id,r]));
function onRoute(route,s){const r=typeof route==='string'?routeById[route]:route;s=Math.max(0,Math.min(r.length,s));const g=r.segments.find(g=>s<g.s+g.len)||r.segments.at(-1),t=(s-g.s)/g.len,tx=g.a.tx+(g.b.tx-g.a.tx)*t,ty=g.a.ty+(g.b.ty-g.a.ty)*t,n=Math.hypot(tx,ty);return {x:g.a.x+(g.b.x-g.a.x)*t,y:g.a.y+(g.b.y-g.a.y)*t,tx:tx/n,ty:ty/n};}
function routeProjection(route,x,y){const r=typeof route==='string'?routeById[route]:route;let best=Infinity,s=0;for(const g of r.segments){const dx=g.b.x-g.a.x,dy=g.b.y-g.a.y,t=Math.max(0,Math.min(1,((x-g.a.x)*dx+(y-g.a.y)*dy)/(g.len*g.len))),px=g.a.x+dx*t,py=g.a.y+dy*t,d=Math.hypot(px-x,py-y);if(d<best){best=d;s=g.s+g.len*t;}}return {s,distance:best};}
// The tram-side street is narrow: a single car uses its asphalt centre.
// Cars wait outside the map for this route, never in the visible street.
function laneOffset(route,s){const r=typeof route==='string'?routeById[route]:route,p=onRoute(r,s);if(r.id!=='west')return LANE;if(p.x>=204||p.y<=305||p.y>=807)return 7.5;const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};return p.y<344?7.5*(1-smooth((p.y-305)/39)):p.y>768?7.5*smooth((p.y-768)/39):0;}
function lanePoint(route,s,dir){const p=onRoute(route,s),offset=laneOffset(route,s)*dir;return {x:p.x+p.ty*offset,y:p.y-p.tx*offset};}
function poseOnRoute(route,s,dir){const r=typeof route==='string'?routeById[route]:route,p=lanePoint(r,s,dir),a=lanePoint(r,Math.max(0,s-.5),dir),b=lanePoint(r,Math.min(r.length,s+.5),dir),n=Math.hypot(b.x-a.x,b.y-a.y);return {...p,tx:(b.x-a.x)/n,ty:(b.y-a.y)/n};}
const axisAt=(route,s)=>{const p=onRoute(route,s);return Math.abs(p.tx)>Math.abs(p.ty)?'H':'V';};
const junctions=[{x:946,y:305},{x:974,y:807},{x:111,y:797},{x:166,y:315},{x:516,y:305},{x:504,y:807}];
class Traffic{
 constructor(crossings){
  this.time=0;this.mode='clear';this.axis='H';this.elapsed=0;this.paused=false;this.requests=new Set();
  this.signals=crossings.map(c=>({...c,s:project(c.road,c.x,c.y),phase:'clear',occupants:new Set()}));
  this.crossingArcs=new Map();this.zonesByRoute={};
  for(const r of routes){const controls=[];
   for(const signal of this.signals){const p=routeProjection(r,signal.x,signal.y);if(p.distance<30){if(!this.crossingArcs.has(signal.id))this.crossingArcs.set(signal.id,[]);this.crossingArcs.get(signal.id).push({route:r.id,s:p.s});controls.push({s:p.s,pad:50,id:signal.id});}}
   controls.sort((a,b)=>a.s-b.s);const zones=this.zonesByRoute[r.id]=[];
   for(const c of controls){const last=zones.at(-1);if(last&&c.s-last.max<116){last.max=c.s;last.pad=Math.max(last.pad,c.pad);}else zones.push({min:c.s,max:c.s,pad:c.pad,id:c.id});}
  }
  this.cars=[0,1,2,3].map(id=>{const route=routes[Math.floor(id/2)],dir=id%2?-1:1;return {id,route:route.id,dir,s:dir===1?0:route.length,state:'waiting',wait:[0,2.4,5,7.3][id],speed:0,maxSpeed:50+id*2,color:['coral','blue','gold','mint'][id],type:id===3?'van':'car',distance:0,trips:0,opacity:0};});
  this.placeCars();this.updateSignals();
 }
 signal(id){return this.signals.find(s=>s.id===id);}
 request(id){if(this.signal(id))this.requests.add(id);}
 entry(c,z){return c.dir===1?z.min-z.pad:z.max+z.pad;}
 exit(c,z){return c.dir===1?z.max+64:z.min-64;}
 inside(c,z){return c.state==='driving'&&(c.s-this.entry(c,z))*c.dir>.001&&(this.exit(c,z)-c.s)*c.dir>0;}
 clear(s){const arcs=this.crossingArcs.get(s.id);return this.paused||!arcs||!this.cars.some(c=>c.state==='driving'&&arcs.some(a=>a.route===c.route&&Math.abs(c.s-a.s)<47));}
 canWalk(id){const s=this.signal(id);return !!s&&s.phase==='walk'&&this.clear(s);}
 enter(id,token){if(!this.canWalk(id))return false;this.signal(id).occupants.add(token);return true;}
 leave(id,token){const s=this.signal(id);s?.occupants.delete(token);if(s&&!s.occupants.size)this.requests.delete(id);}
 setEnabled(enabled){if(enabled===!this.paused)return;this.paused=!enabled;this.mode=this.paused?'walk':'clear';this.elapsed=0;this.updateSignals();}
 updateSignals(){for(const s of this.signals)s.phase=this.paused||this.mode==='walk'?'walk':s.axis===this.axis&&(this.mode==='green'||this.mode==='amber')?this.mode:'clear';}
 zonesClear(){return !this.cars.some(c=>this.zonesByRoute[c.route].some(z=>this.inside(c,z)));}
 placeCars(){for(const c of this.cars){const p=poseOnRoute(c.route,c.s,c.dir);c.x=p.x;c.y=p.y;c.angle=Math.atan2(p.ty,p.tx)*180/Math.PI+(c.dir===1?0:180);c.road=c.x<180?'west':c.y<345&&Math.abs(p.tx)>.5?'h1':c.y>775&&Math.abs(p.tx)>.5?'h2':c.route==='central'?'v2':c.y<305?'v1-top':'v1-bottom';c.opacity=c.state==='driving'?1:0;}}
 tick(dt){
  if(dt<=0)return;dt=Math.min(dt,.05);if(this.paused){this.updateSignals();return;}this.time+=dt;this.elapsed+=dt;
  const advance=mode=>{this.mode=mode;this.elapsed=0;};
  if(this.mode==='green'&&this.elapsed>=(this.requests.size?1.2:8))advance('amber');
  else if(this.mode==='amber'&&this.elapsed>=1.3)advance('clear');
  else if(this.mode==='clear'&&this.elapsed>=.7&&this.signals.every(s=>this.clear(s))&&this.zonesClear())advance('walk');
  else if(this.mode==='walk'&&this.elapsed>=4&&!this.signals.some(s=>s.occupants.size)){this.requests.clear();advance('clearAfter');}
  else if(this.mode==='clearAfter'&&this.elapsed>=.8){this.axis=this.axis==='H'?'V':'H';advance('green');}
  this.updateSignals();
  for(const c of this.cars){const route=routeById[c.route];
   if(c.state==='waiting'){c.wait=Math.max(0,c.wait-dt);if(c.wait>0||c.route==='west'&&this.cars.some(o=>o!==c&&o.route==='west'&&o.state==='driving'))continue;c.s=c.dir===1?0:route.length;c.state='driving';c.speed=0;}
   let allowed=c.dir===1?route.length-c.s:c.s;
   const leader=this.cars.filter(o=>o!==c&&o.state==='driving'&&o.route===c.route&&o.dir===c.dir&&(o.s-c.s)*c.dir>0).map(o=>({car:o,d:(o.s-c.s)*c.dir})).sort((a,b)=>a.d-b.d)[0];
   if(leader)allowed=Math.min(allowed,Math.max(0,leader.d-GAP));
   for(const z of this.zonesByRoute[c.route]){const stop=this.entry(c,z),signed=(stop-c.s)*c.dir;if(signed<-.001||this.inside(c,z))continue;const d=Math.max(0,signed),exitDistance=(this.exit(c,z)-stop)*c.dir,exitBlocked=leader&&leader.d<d+exitDistance+GAP;
    if(!(axisAt(route,stop)===this.axis&&this.mode==='green')||exitBlocked)allowed=Math.min(allowed,d);
   }
   const desired=Math.min(c.maxSpeed,Math.sqrt(Math.max(0,150*allowed)));const delta=desired-c.speed;c.speed+=Math.sign(delta)*Math.min(Math.abs(delta),(delta>0?85:160)*dt);const step=Math.min(c.speed*dt,allowed);c.distance+=step;c.s=Math.max(0,Math.min(route.length,c.s+c.dir*step));if(step<.01)c.speed=0;
   // The whole car is already beyond the image before a new journey is scheduled.
   if((c.dir===1?route.length-c.s:c.s)<.001){c.state='waiting';c.speed=0;c.trips++;c.wait=4+(c.id*1.7+c.trips*1.3)%6;}
  }
  this.placeCars();
 }
}
Traffic.roads=roads;Traffic.at=at;Traffic.project=project;Traffic.junctions=junctions;Traffic.routes=routes;Traffic.onRoute=onRoute;Traffic.routeProjection=routeProjection;Traffic.axisAt=axisAt;Traffic.lane=LANE;Traffic.laneOffset=laneOffset;Traffic.poseOnRoute=poseOnRoute;
root.CityTraffic=Traffic;if(typeof module!=='undefined')module.exports=Traffic;
})(typeof window!=='undefined'?window:globalThis);
