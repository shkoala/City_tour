(function(root){
  'use strict';
  class Walker{
    constructor(world,traffic,notify=()=>{}){this.world=world;this.traffic=traffic;this.notify=notify;this.reset('bus','E');}
    reset(node='bus',facing='E'){
      if(!this.world.isSafeStop(node))throw new RangeError('Cole must start on the pavement.');
      if(this.held)this.traffic.leave(this.held,'cole');
      this.location=node;this.facing=facing;this.x=this.world.nodes[node].x;this.y=this.world.nodes[node].y;this.queue=[];this.segment=null;this.segments=[];this.held=null;this.waiting=false;this.moving=false;this.trail=[node];this.notify('reset',node);
    }
    get busy(){return !!this.segment||!!this.queue.length||!!this.segments.length;}
    turn(delta){if(this.busy)return false;const d=this.world.dirs;this.facing=d[(d.indexOf(this.facing)+delta+4)%4];this.notify('turn',this.facing);return true;}
    walk(path){if(!Array.isArray(path)||!path.length||this.busy||path[0]!==this.location||!path.every(id=>this.world.isSafeStop(id))||path.slice(1).some((n,i)=>!this.world.edge(path[i],n)))return false;this.queue=path.slice(1);this.notify('start',path);return true;}
    tick(dt){
      if(dt<=0)return;dt=Math.min(dt,.05);
      if(!this.segment&&!this.segments.length&&this.queue.length){
        const next=this.queue.shift(),e=this.world.edge(this.location,next),a=this.world.nodes[this.location],b=this.world.nodes[next];this.facing=this.world.direction(this.location,next);this.target=next;
        this.segments=this.world.geometry(this.location,next);
      }
      if(!this.segment&&this.segments.length)this.segment=this.segments.shift();
      if(!this.segment){this.moving=false;return;}
      const s=this.segment;
      if(s.cross&&!this.held){this.traffic.request(s.cross);if(!this.traffic.enter(s.cross,'cole')){if(!this.waiting)this.notify('wait',s.cross);this.waiting=true;this.moving=false;return;}this.held=s.cross;this.waiting=false;this.notify('cross',s.cross);}
      this.moving=true;const dx=s.x-this.x,dy=s.y-this.y,d=Math.hypot(dx,dy),step=Math.min(d,142*dt);
      if(d){this.x+=dx/d*step;this.y+=dy/d*step;}
      if(d<=step+.001){
        this.x=s.x;this.y=s.y;
        // Several bends may belong to one zebra crossing. Keep the interlock
        // until its last segment reaches the opposite pavement.
        if(s.cross&&this.held&&this.segments[0]?.cross!==this.held){this.traffic.leave(this.held,'cole');this.held=null;}
        this.segment=null;
        if(!this.segments.length){this.location=this.target;this.trail.push(this.location);this.notify('arrive',this.location);if(!this.queue.length){this.moving=false;this.notify('stop',this.location);}}
      }
    }
  }
  root.CityWalker=Walker;if(typeof module!=='undefined')module.exports=Walker;
})(typeof window!=='undefined'?window:globalThis);

