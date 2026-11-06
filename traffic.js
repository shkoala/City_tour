/* Deterministic traffic simulation. No CSS timer drives a traffic light.
   Each zebra crossing has its own car / pedestrian interlock. */
(function(root){
  'use strict';
  class Traffic{
    constructor(crossings){
      this.time=0;this.paused=false;
      this.signals=crossings.map((c,i)=>({...c,phase:'green',elapsed:(i%3)*1.4,requested:false,occupants:new Set()}));
      this.cars=[];let id=0;
      for(let road=0;road<3;road++)for(const dir of [1,-1])for(let k=0;k<2;k++)this.cars.push({id:id++,road,dir,x:dir===1?80+k*760:1360-k*760,speed:0,maxSpeed:52+(id%3)*4,color:['coral','blue','gold','mint'][id%4],type:id%3===0?'van':'car',stopped:false});
    }
    signal(id){return this.signals.find(s=>s.id===id);}
    request(id){const s=this.signal(id);if(s)s.requested=true;}
    clear(s){return this.paused||!this.cars.some(c=>c.road===s.road&&Math.abs(c.x-s.x)<64);}
    canWalk(id){const s=this.signal(id);return !!s&&s.phase==='walk'&&this.clear(s);}
    enter(id,token){if(!this.canWalk(id))return false;this.signal(id).occupants.add(token);return true;}
    leave(id,token){this.signal(id)?.occupants.delete(token);}
    tick(dt){
      if(this.paused||dt<=0)return;dt=Math.min(dt,.05);this.time+=dt;
      for(const s of this.signals){
        s.elapsed+=dt;
        const advance=p=>{s.phase=p;s.elapsed=0;};
        if(s.phase==='green'&&s.elapsed>=(s.requested?1.2:10))advance('amber');
        else if(s.phase==='amber'&&s.elapsed>=1.7)advance('clear');
        else if(s.phase==='clear'&&s.elapsed>=1.2&&this.clear(s))advance('walk');
        else if(s.phase==='walk'&&s.elapsed>=5&&!s.occupants.size){s.requested=false;advance('clearAfter');}
        else if(s.phase==='clearAfter'&&s.elapsed>=1.3)advance('green');
      }
      // Leaders update first in travel order. Following cars clamp to their leader.
      for(let road=0;road<3;road++)for(const dir of [1,-1]){
        const lane=this.cars.filter(c=>c.road===road&&c.dir===dir).sort((a,b)=>dir*(b.x-a.x));
        for(const c of lane){
          let allowed=Infinity;
          for(const s of this.signals.filter(s=>s.road===road&&s.phase!=='green')){
            const stop=s.x-dir*78,dist=(stop-c.x)*dir;
            // Once committed beyond the stop line, clear the crossing.
            if(dist>=-.01)allowed=Math.min(allowed,Math.max(0,dist));
          }
          for(const other of lane)if(other!==c){const gap=(other.x-c.x)*dir-92;if(gap>=0)allowed=Math.min(allowed,gap);}
          const desired=Math.min(c.maxSpeed,Math.sqrt(Math.max(0,2*85*allowed)));
          c.speed=Math.min(c.maxSpeed,Math.max(0,c.speed+Math.sign(desired-c.speed)*100*dt));
          c.speed=Math.min(c.speed,desired);let step=Math.min(c.speed*dt,allowed);if(step<.02){step=0;c.speed=0;}
          c.x+=dir*step;c.stopped=step===0;
          if(c.x>1575||c.x< -125){const spawn=dir===1?-110:1558;const blocked=lane.some(o=>o!==c&&Math.abs(o.x-spawn)<120);if(!blocked){c.x=spawn;c.speed=0;}}
        }
      }
    }
  }
  root.CityTraffic=Traffic;if(typeof module!=='undefined')module.exports=Traffic;
})(typeof window!=='undefined'?window:globalThis);
