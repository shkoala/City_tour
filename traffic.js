/* Four persistent cars follow both lanes of a continuous town circuit. */
(function(root){
'use strict';
const LANE=7.5,GAP=100;
const roads=[
 {id:'h1',axis:'H',points:[[153,305],[1290,305]]},
 {id:'h2',axis:'H',points:[[100,807],[1325,807]]},
 {id:'v2',axis:'V',points:[[941,-80],[941,280],[954,344],[962,550],[970,768],[980,845],[982,1166]]},
 {id:'v1-top',axis:'V',points:[[516,-80],[516,305]]},
 {id:'v1-bottom',axis:'V',points:[[504,807],[502,1166]]},
 {id:'west',axis:'V',points:[[158,305],[153,344],[105,768],[101,807]]}
].map(r=>{let length=0;const segments=r.points.slice(1).map((p,i)=>{const a=r.points[i],dx=p[0]-a[0],dy=p[1]-a[1],len=Math.hypot(dx,dy),s=length;length+=len;return {a,b:p,s,len,tx:dx/len,ty:dy/len};});return {...r,segments,length};});
const roadById=Object.fromEntries(roads.map(r=>[r.id,r]));
function at(road,s){const r=typeof road==='string'?roadById[road]:road,g=r.segments.find(g=>s<=g.s+g.len)||r.segments.at(-1),d=s-g.s;return {x:g.a[0]+g.tx*d,y:g.a[1]+g.ty*d,tx:g.tx,ty:g.ty};}
function project(road,x,y){const r=typeof road==='string'?roadById[road]:road;let best=Infinity,result=0;for(const g of r.segments){const t=Math.max(0,Math.min(g.len,(x-g.a[0])*g.tx+(y-g.a[1])*g.ty)),p=at(r,g.s+t),d=Math.hypot(p.x-x,p.y-y);if(d<best){best=d;result=g.s+t;}}return result;}
// Rounded corners stay on asphalt. The seam lies on a straight street.
const points=[[350,305]];
const line=(x,y)=>points.push([x,y]);
function curve(cx,cy,x,y){const [ax,ay]=points.at(-1);for(let i=1;i<=40;i++){const t=i/40,u=1-t;points.push([u*u*ax+2*u*t*cx+t*t*x,u*u*ay+2*u*t*cy+t*t*y]);}}
line(911,305);curve(950,305,954,344);line(962,550);line(969,768);curve(970.5,807,932.5,807);line(140,807);curve(101,807,105,768);line(153,344);curve(157.4,305,196.4,305);line(350,305);
const vertices=points.slice(0,-1).map(([x,y],i,ps)=>{const prev=ps[(i+ps.length-1)%ps.length],next=ps[(i+1)%ps.length],a=Math.hypot(x-prev[0],y-prev[1]),b=Math.hypot(next[0]-x,next[1]-y),tx=(x-prev[0])/a+(next[0]-x)/b,ty=(y-prev[1])/a+(next[1]-y)/b,n=Math.hypot(tx,ty);return {x,y,tx:tx/n,ty:ty/n};});
let length=0;
const segments=vertices.map((a,i)=>{const b=vertices[(i+1)%vertices.length],len=Math.hypot(b.x-a.x,b.y-a.y),s=length;length+=len;return {a,b,len,s};});
const wrap=s=>(s%length+length)%length;
function onLoop(s){s=wrap(s);const g=segments.find(g=>s<g.s+g.len)||segments.at(-1),t=(s-g.s)/g.len,tx=g.a.tx+(g.b.tx-g.a.tx)*t,ty=g.a.ty+(g.b.ty-g.a.ty)*t,n=Math.hypot(tx,ty);return {x:g.a.x+(g.b.x-g.a.x)*t,y:g.a.y+(g.b.y-g.a.y)*t,tx:tx/n,ty:ty/n};}
function loopProjection(x,y){let best=Infinity,s=0;for(const g of segments){const dx=g.b.x-g.a.x,dy=g.b.y-g.a.y,t=Math.max(0,Math.min(1,((x-g.a.x)*dx+(y-g.a.y)*dy)/(g.len*g.len))),px=g.a.x+dx*t,py=g.a.y+dy*t,d=Math.hypot(px-x,py-y);if(d<best){best=d;s=g.s+g.len*t;}}return {s,distance:best};}
const axisAt=s=>{const p=onLoop(s);return Math.abs(p.tx)>Math.abs(p.ty)?'H':'V';};
const junctions=[{x:941,y:316},{x:960,y:797},{x:111,y:797},{x:166,y:315}];
class Traffic{
 constructor(crossings){
  this.time=0;this.mode='clear';this.axis='H';this.elapsed=0;this.paused=false;this.requests=new Set();
  this.signals=crossings.map(c=>({...c,s:project(c.road,c.x,c.y),phase:'clear',occupants:new Set()}));
  this.crossingArcs=new Map();const controls=[];
  for(const s of this.signals){const p=loopProjection(s.x,s.y);if(p.distance<30){this.crossingArcs.set(s.id,p.s);controls.push({s:p.s,pad:82});}}
  for(const j of junctions)controls.push({s:loopProjection(j.x,j.y).s,pad:104});
  controls.sort((a,b)=>a.s-b.s);this.zones=[];
  for(const c of controls){const last=this.zones.at(-1);if(last&&c.s-last.max<180){last.max=c.s;last.pad=Math.max(last.pad,c.pad);}else this.zones.push({min:c.s,max:c.s,pad:c.pad});}
  this.cars=[0,.27,.53,.78].map((fraction,id)=>({id,dir:id%2?-1:1,s:fraction*length,speed:0,maxSpeed:50+id*2,color:['coral','blue','gold','mint'][id],type:id===3?'van':'car',distance:0,laps:0,opacity:1}));
  // Initial cars are parked before red lights, not inside a controlled turn.
  for(const c of this.cars)for(const z of this.zones)if(this.inside(c,z))c.s=wrap(this.entry(c,z));
  this.placeCars();this.updateSignals();
 }
 signal(id){return this.signals.find(s=>s.id===id);}
 request(id){if(this.signal(id))this.requests.add(id);}
 entry(c,z){return c.dir===1?z.min-z.pad:z.max+z.pad;}
 exit(c,z){return c.dir===1?z.max+64:z.min-64;}
 inside(c,z){return (c.s-this.entry(c,z))*c.dir>.001&&(this.exit(c,z)-c.s)*c.dir>0;}
 clear(s){const arc=this.crossingArcs.get(s.id);return this.paused||arc===undefined||!this.cars.some(c=>Math.min(wrap(c.s-arc),wrap(arc-c.s))<64);}
 canWalk(id){const s=this.signal(id);return !!s&&s.phase==='walk'&&this.clear(s);}
 enter(id,token){if(!this.canWalk(id))return false;this.signal(id).occupants.add(token);return true;}
 leave(id,token){const s=this.signal(id);s?.occupants.delete(token);if(s&&!s.occupants.size)this.requests.delete(id);}
 setEnabled(enabled){if(enabled===!this.paused)return;this.paused=!enabled;this.mode=this.paused?'walk':'clear';this.elapsed=0;this.updateSignals();}
 updateSignals(){for(const s of this.signals)s.phase=this.paused||this.mode==='walk'?'walk':s.axis===this.axis&&(this.mode==='green'||this.mode==='amber')?this.mode:'clear';}
 zonesClear(){return !this.cars.some(c=>this.zones.some(z=>this.inside(c,z)));}
 placeCars(){for(const c of this.cars){const p=onLoop(c.s),offset=LANE*c.dir;c.x=p.x+p.ty*offset;c.y=p.y-p.tx*offset;c.angle=Math.atan2(p.ty,p.tx)*180/Math.PI+(c.dir===1?0:180);c.road=c.x<180?'west':c.y<345?'h1':c.y>775?'h2':'v2';c.opacity=1;}}
 tick(dt){
  if(dt<=0)return;dt=Math.min(dt,.05);if(this.paused){this.updateSignals();return;}this.time+=dt;this.elapsed+=dt;
  const advance=mode=>{this.mode=mode;this.elapsed=0;};
  if(this.mode==='green'&&this.elapsed>=(this.requests.size?1.2:8))advance('amber');
  else if(this.mode==='amber'&&this.elapsed>=1.3)advance('clear');
  else if(this.mode==='clear'&&this.elapsed>=.7&&this.signals.every(s=>this.clear(s))&&this.zonesClear())advance('walk');
  else if(this.mode==='walk'&&this.elapsed>=4&&!this.signals.some(s=>s.occupants.size)){this.requests.clear();advance('clearAfter');}
  else if(this.mode==='clearAfter'&&this.elapsed>=.8){this.axis=this.axis==='H'?'V':'H';advance('green');}
  this.updateSignals();
  for(const c of this.cars){let allowed=Infinity;const leaders=this.cars.filter(o=>o!==c&&o.dir===c.dir).map(o=>({car:o,d:wrap((o.s-c.s)*c.dir)})).sort((a,b)=>a.d-b.d),leader=leaders[0];
   if(leader)allowed=Math.max(0,leader.d-GAP);
   for(const z of this.zones){const stop=this.entry(c,z),signed=(stop-c.s)*c.dir,d=Math.abs(signed)<.001?0:wrap(signed);if(this.inside(c,z))continue;const exitDistance=(this.exit(c,z)-stop)*c.dir,exitBlocked=leader&&leader.d<d+exitDistance+GAP;
    if(!(axisAt(stop)===this.axis&&this.mode==='green')||exitBlocked)allowed=Math.min(allowed,d);
   }
   const desired=Math.min(c.maxSpeed,Math.sqrt(Math.max(0,150*allowed)));c.speed=Math.max(0,Math.min(desired,c.speed+(desired>c.speed?85:-160)*dt));const step=Math.min(c.speed*dt,allowed),next=c.s+c.dir*step;c.distance+=step;if(next>=length||next<0)c.laps++;c.s=wrap(next);if(step<.01)c.speed=0;
  }
  this.placeCars();
 }
}
Traffic.roads=roads;Traffic.at=at;Traffic.project=project;Traffic.junctions=junctions;Traffic.loop={length,points,segments};Traffic.onLoop=onLoop;Traffic.loopProjection=loopProjection;Traffic.wrap=wrap;Traffic.lane=LANE;
root.CityTraffic=Traffic;if(typeof module!=='undefined')module.exports=Traffic;
})(typeof window!=='undefined'?window:globalThis);
