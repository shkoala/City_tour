/* Shared car and pedestrian simulation. Australian left-hand lanes. */
(function(root){
'use strict';
const roads=[
 {id:'h1',axis:'H',points:[[153,305],[1290,305]],show:[27,1111]},
 {id:'h2',axis:'H',points:[[100,807],[1325,807]],show:[28,1204]},
 {id:'v2',axis:'V',points:[[940,-80],[940,280],[959,340],[969,550],[977,780],[982,845],[982,1166]],show:[80,1140]},
 {id:'v1-top',axis:'V',points:[[516,-80],[516,305]],show:[100,330]},
 {id:'v1-bottom',axis:'V',points:[[504,807],[502,1166]],show:[65,325]}
].map(r=>{let length=0;const segments=r.points.slice(1).map((p,i)=>{const a=r.points[i],dx=p[0]-a[0],dy=p[1]-a[1],len=Math.hypot(dx,dy),s=length;length+=len;return {a,b:p,s,len,tx:dx/len,ty:dy/len};});return {...r,segments,length};});
const roadById=Object.fromEntries(roads.map(r=>[r.id,r]));
function at(road,s){const r=typeof road==='string'?roadById[road]:road,g=r.segments.find(g=>s<=g.s+g.len)||r.segments.at(-1),d=s-g.s;return {x:g.a[0]+g.tx*d,y:g.a[1]+g.ty*d,tx:g.tx,ty:g.ty};}
function project(road,x,y){const r=typeof road==='string'?roadById[road]:road;let best=Infinity,result=0;for(const g of r.segments){const t=Math.max(0,Math.min(g.len,(x-g.a[0])*g.tx+(y-g.a[1])*g.ty)),p=at(r,g.s+t),d=Math.hypot(p.x-x,p.y-y);if(d<best){best=d;result=g.s+t;}}return result;}
const junctions=[{x:944,y:305},{x:981,y:807}];
class Traffic{
 constructor(crossings){this.time=0;this.mode='clear';this.axis='H';this.elapsed=0;this.paused=false;this.requests=new Set();this.signals=crossings.map(c=>({...c,s:project(c.road,c.x,c.y),phase:'green',occupants:new Set()}));this.zones={};for(const r of roads){const controls=this.signals.filter(s=>s.road===r.id).map(s=>({s:s.s,pad:82}));for(const j of junctions){const pos=project(r,j.x,j.y),p=at(r,pos);if(Math.hypot(p.x-j.x,p.y-j.y)<40)controls.push({s:pos,pad:104});}controls.sort((a,b)=>a.s-b.s);const zones=[];for(const c of controls){const last=zones.at(-1);if(last&&c.s-last.max<180){last.max=c.s;last.pad=Math.max(last.pad,c.pad);}else zones.push({min:c.s,max:c.s,pad:c.pad});}this.zones[r.id]=zones;}this.cars=[];let id=0;for(const r of roads)for(const dir of [1,-1])for(let k=0;k<(r.length>500?2:1);k++){const s=(k+.25+(dir===-1?.35:0))*r.length/(r.length>500?2:1);this.cars.push({id:id++,road:r.id,dir,s,speed:0,maxSpeed:58+(id%3)*4,color:['coral','blue','gold','mint'][id%4],type:id%4===0?'van':'car'});}
  // Seed queues outside controlled boxes, never in a junction at startup.
  for(const r of roads)for(const dir of [1,-1]){const lane=this.cars.filter(c=>c.road===r.id&&c.dir===dir).sort((a,b)=>dir*(b.s-a.s));let front=null;for(const c of lane){for(const z of this.zones[r.id]){const entry=dir===1?z.min-z.pad:z.max+z.pad,exit=dir===1?z.max+64:z.min-64;if((c.s-entry)*dir>0&&(exit-c.s)*dir>0)c.s=entry;}if(front&&(front.s-c.s)*dir<100)c.s=front.s-dir*100;front=c;}}
  this.placeCars();this.updateSignals();}
 signal(id){return this.signals.find(s=>s.id===id);}
 request(id){if(this.signal(id))this.requests.add(id);}
 clear(s){return this.paused||!this.cars.some(c=>c.road===s.road&&Math.abs(c.s-s.s)<64);}
 canWalk(id){const s=this.signal(id);return !!s&&s.phase==='walk'&&this.clear(s);}
 enter(id,token){if(!this.canWalk(id))return false;this.signal(id).occupants.add(token);return true;}
 leave(id,token){const s=this.signal(id);s?.occupants.delete(token);if(s&&!s.occupants.size)this.requests.delete(id);}
 setEnabled(enabled){if(enabled===!this.paused)return;this.paused=!enabled;if(this.paused){this.mode='walk';this.elapsed=0;}else{this.mode='clear';this.elapsed=0;}this.updateSignals();}
 updateSignals(){for(const s of this.signals)s.phase=this.paused||this.mode==='walk'?'walk':s.axis===this.axis&&(this.mode==='green'||this.mode==='amber')?this.mode:'clear';}
 junctionsClear(){return !this.cars.some(c=>junctions.some(j=>Math.abs(c.x-j.x)<72&&Math.abs(c.y-j.y)<72));}
 zonesClear(){return !this.cars.some(c=>this.zones[c.road].some(z=>{const entry=c.dir===1?z.min-z.pad:z.max+z.pad,exit=c.dir===1?z.max+64:z.min-64;return (c.s-entry)*c.dir>.001&&(exit-c.s)*c.dir>0;}));}
 placeCars(){for(const c of this.cars){const r=roadById[c.road],p=at(r,c.s),offset=11*c.dir;c.x=p.x+p.ty*offset;c.y=p.y-p.tx*offset;c.angle=Math.atan2(p.ty,p.tx)*180/Math.PI+(c.dir===1?0:180);c.opacity=Math.max(0,Math.min(1,(c.s-r.show[0])/22,(r.show[1]-c.s)/22));}}
 tick(dt){
  if(dt<=0)return;dt=Math.min(dt,.05);if(this.paused){this.updateSignals();return;}this.time+=dt;this.elapsed+=dt;
  const advance=mode=>{this.mode=mode;this.elapsed=0;};
  if(this.mode==='green'&&this.elapsed>=(this.requests.size?1.2:8))advance('amber');
  else if(this.mode==='amber'&&this.elapsed>=1.3)advance('clear');
  else if(this.mode==='clear'&&this.elapsed>=.7&&this.signals.every(s=>this.clear(s))&&this.junctionsClear()&&this.zonesClear())advance('walk');
  else if(this.mode==='walk'&&this.elapsed>=4&&!this.signals.some(s=>s.occupants.size)){this.requests.clear();advance('clearAfter');}
  else if(this.mode==='clearAfter'&&this.elapsed>=.8){this.axis=this.axis==='H'?'V':'H';advance('green');}
  this.updateSignals();
  for(const r of roads)for(const dir of [1,-1]){
   const lane=this.cars.filter(c=>c.road===r.id&&c.dir===dir).sort((a,b)=>dir*(b.s-a.s));
   for(const c of lane){let allowed=Infinity;
    const leader=lane.filter(o=>o!==c&&(o.s-c.s)*dir>0).sort((a,b)=>(a.s-b.s)*dir)[0];
    for(const z of this.zones[r.id]){const stop=dir===1?z.min-z.pad:z.max+z.pad,d=(stop-c.s)*dir,exit=dir===1?z.max+64:z.min-64,exitBlocked=leader&&(leader.s-exit)*dir<100;
     if(d>=-.001&&(!(r.axis===this.axis&&this.mode==='green')||exitBlocked))allowed=Math.min(allowed,Math.max(0,d));
    }
    for(const other of lane)if(other!==c){const d=(other.s-c.s)*dir-100;if(d>=0)allowed=Math.min(allowed,d);}
    const desired=Math.min(c.maxSpeed,Math.sqrt(Math.max(0,150*allowed)));c.speed=Math.max(0,Math.min(desired,c.speed+(desired>c.speed?95:-160)*dt));const step=Math.min(c.speed*dt,allowed);c.s+=dir*step;if(step<.01)c.speed=0;
    if(c.s>r.length+70||c.s< -70){const spawn=dir===1?-60:r.length+60;if(!lane.some(o=>o!==c&&Math.abs(o.s-spawn)<120)){c.s=spawn;c.speed=0;}}
   }
  }
  this.placeCars();
 }
}
Traffic.roads=roads;Traffic.at=at;Traffic.project=project;Traffic.junctions=junctions;
root.CityTraffic=Traffic;if(typeof module!=='undefined')module.exports=Traffic;
})(typeof window!=='undefined'?window:globalThis);
