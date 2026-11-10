/* Run node tests.cjs. These are the same world/simulation modules as the game. */
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const W=require('./world'),Traffic=require('./traffic'),Walker=require('./walker'),G=require('./scene-geometry');let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;},eq=(a,b,m)=>{assert.equal(a,b,m);checks++;};
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
eq(hash('assets/town-map-20261110.webp'),'f25b92f00c3247f6aa588acd25f365af3fb41c41cf88f8724e9237b68268dbed','Approved map remains intact');
eq(W.places.length,14);eq(W.crossings.length,12);eq(W.walks.length,8);
for(const n of Object.values(W.nodes)){ok(W.isSafeStop(n.id),'Safe ground stop '+n.id);const headings=W.edges[n.id].map(e=>W.direction(n.id,e.to));eq(new Set(headings).size,headings.length,'One clear exit per direction '+n.id);}
for(const p of W.places){ok(W.shortestPath('bus',p.id),'Reach '+p.id);eq(W.nodes[p.id].x,p.x);eq(W.nodes[p.id].y,p.y);}
for(const e of W.edgeList)for(const [a,b] of [[e.a,e.b],[e.b,e.a]]){
 const ps=[W.nodes[a],...W.geometry(a,b)];eq(ps.at(-1).x,W.nodes[b].x);eq(ps.at(-1).y,W.nodes[b].y);
 for(let i=1;i<ps.length;i++){const p=ps[i-1],q=ps[i];if(q.cross){ok(W.crossings.some(s=>s.id===q.cross),'Known zebra');if(p.cross!==q.cross)ok(W.isOnPavement(p.x,p.y),'Wait on pavement');if(ps[i+1]?.cross!==q.cross)ok(W.isOnPavement(q.x,q.y),'End on pavement');}else for(let k=0;k<=25;k++){const t=k/25;ok(W.isOnPavement(p.x+(q.x-p.x)*t,p.y+(q.y-p.y)*t),'Normal segment stays on pavement '+a+' '+b);}}
}
for(const p of [[420,690],[700,690],[570,700]])ok(!W.isOnPavement(...p),'Joined civic row cannot be crossed');ok(!W.edge('police','cinema'),'No path through connected civic row');
function simulate(t,w,seconds){for(let i=0;i<seconds*60;i++){t.tick(1/60);w?.tick(1/60);if(w){ok(Number.isFinite(w.x)&&Number.isFinite(w.y));if(w.waiting)ok(W.isOnPavement(w.x,w.y),'Never wait in the road');if(w.held){const sig=t.signal(w.held);eq(sig.phase,'walk');ok(t.clear(sig),'No car on occupied zebra');}else if(w.moving)ok(W.isOnPavement(w.x,w.y),'Unheld movement is pavement');}}}
{
 const t=new Traffic(W.crossings),w=new Walker(W,t);eq(w.location,'bus');eq(w.facing,'S');eq(w.x,720);eq(w.y,1025);ok(!w.walk(['bus','school']));w.turn(-1);eq(w.facing,'E');w.reset();eq(w.facing,'S'); 
}
for(const e of W.edgeList)for(const [a,b] of [[e.a,e.b],[e.b,e.a]]){const t=new Traffic(W.crossings),w=new Walker(W,t);w.reset(a,W.direction(a,b));ok(w.walk([a,b]));simulate(t,w,20);eq(w.location,b,'Traverse '+a+' -> '+b);ok(!w.busy,'Finish '+a+' -> '+b);}
{
 const t=new Traffic(W.crossings),w=new Walker(W,t);let prior='bus',facing='S';
 for(let index=0;index<W.walks.length;index++){
  const task=W.routeTask(w.location,w.facing,index);eq(task.start,prior);eq(task.facing,facing);eq(task.planned,true);
  for(const step of task.instructions){if(step.kind==='turn'){for(const m of step.text.matchAll(/Turn (left|right)/g))ok(w.turn(m[1]==='left'?-1:1));}else if(step.to>step.from){eq(w.location,task.path[step.from]);const path=task.path.slice(step.from,step.to+1);for(let i=1;i<path.length;i++)eq(W.direction(path[i-1],path[i]),w.facing,'Instruction heading '+index+' '+step.text);ok(w.walk(path));simulate(t,w,30);eq(w.location,path.at(-1),'Instruction endpoint');ok(!w.busy);}}
  eq(w.location,task.target);const final=task.instructions.at(-1).text;ok(final.includes(w.facing==='E'?'on your left':'on your right'),'Correct final side');prior=w.location;facing=w.facing;
 }
 eq(w.location,'school');eq(w.facing,'E');
}
for(const p of W.places){const t=new Traffic(W.crossings),w=new Walker(W,t);ok(w.walk(W.shortestPath('bus',p.id))||p.id==='bus');simulate(t,w,85);eq(w.location,p.id);ok(!w.busy);ok(w.walk(W.shortestPath(p.id,'bus'))||p.id==='bus');simulate(t,w,85);eq(w.location,'bus');}
{
 const t=new Traffic(W.crossings),w=new Walker(W,t);t.setEnabled(false);ok(w.walk(W.walks[0].path));simulate(t,w,10);eq(w.location,'post');ok(!w.busy);t.setEnabled(true);simulate(t,w,12);ok(t.mode!=='clear','Traffic resumes without deadlock');
 w.reset('bN','N');ok(w.walk(['bN','mCrossE']));for(let i=0;i<1800&&!w.held;i++){t.tick(1/60);w.tick(1/60);}ok(w.held);const held=w.held;t.setEnabled(true);eq(t.signal(held).phase,'walk','Unchanged settings preserve an occupied crossing');w.reset();eq(t.signal(held).occupants.size,0,'Reset releases interlock');
}
// Open road journeys: entry and exit occur beyond the image, with no visible resets.
{
 function visible(c){const p=Traffic.poseOnRoute(c.route,c.s,c.dir),rx=24*Math.abs(p.tx)+8.8*Math.abs(p.ty),ry=24*Math.abs(p.ty)+8.8*Math.abs(p.tx);return c.x+rx>=0&&c.x-rx<=W.W&&c.y+ry>=0&&c.y-ry<=W.H;}
 for(const route of Traffic.routes){ok(route.points[0][1]<-50);ok(route.points.at(-1)[1]>W.H+50);ok(route.points[0][1]!==route.points.at(-1)[1],'A through route has different ends');
  for(let arc=0;arc<=route.length;arc+=2)for(const dir of [1,-1]){const p=Traffic.poseOnRoute(route,arc,dir);for(const a of [-24,0,24])for(const b of [-8.8,0,8.8]){const x=p.x+p.tx*a+p.ty*b,y=p.y+p.ty*a-p.tx*b;if(y>=0&&y<=W.H){ok(G.onAsphalt(x,y),'Whole car on asphalt: '+route.id+' '+arc+' '+dir+' '+x+' '+y);ok(!W.isOnPavement(x,y),'Car stays off pavement');}}}
 }
 const t=new Traffic(W.crossings),identities=[...t.cars],headings=t.cars.map(()=>new Set()),entries=[0,0,0,0],exits=[0,0,0,0];const modes=new Set();eq(t.cars.length,4,'Quiet town: at most four cars');
 function overlaps(a,b){const pa=Traffic.poseOnRoute(a.route,a.s,a.dir),pb=Traffic.poseOnRoute(b.route,b.s,b.dir);for(const axis of [[pa.tx,pa.ty],[pa.ty,-pa.tx],[pb.tx,pb.ty],[pb.ty,-pb.tx]]){const dx=b.x-a.x,dy=b.y-a.y,separation=Math.abs(dx*axis[0]+dy*axis[1]),ra=24*Math.abs(pa.tx*axis[0]+pa.ty*axis[1])+8.8*Math.abs(pa.ty*axis[0]-pa.tx*axis[1]),rb=24*Math.abs(pb.tx*axis[0]+pb.ty*axis[1])+8.8*Math.abs(pb.ty*axis[0]-pb.tx*axis[1]);if(separation>=ra+rb-.1)return false;}return true;}
 for(let i=0;i<600*60;i++){const previous=t.cars.map(c=>({...c}));t.tick(1/60);modes.add(t.mode);ok(t.cars.filter(c=>c.state==='driving'&&c.route==='west').length<=1,'Tram-side road has one car at a time');for(const c of t.cars){const before=previous[c.id],route=Traffic.routes.find(r=>r.id===c.route);eq(c,identities[c.id],'Stable actors');ok(c.opacity===0||c.opacity===1,'No partial fades');ok(c.s>=0&&c.s<=route.length);if(visible(c)||visible(before)){eq(c.opacity,1,'A visible car is fully opaque');eq(before.opacity,1,'No car appears inside the map');ok(Math.hypot(c.x-before.x,c.y-before.y)<2,'Continuous motion at the border and every turn');}else if(c.opacity===0)ok(!visible(c),'Hidden cars are wholly outside the town');if(!visible(before)&&visible(c))entries[c.id]++;if(visible(before)&&!visible(c))exits[c.id]++;if(visible(c)&&c.state==='driving'&&before.state==='driving'&&c.s!==before.s&&c.speed<before.speed-.01){const red=t.zonesByRoute[c.route].some(z=>{const d=(t.entry(c,z)-c.s)*c.dir;return d>=-.01&&d<35&&!(t.mode==='green'&&Traffic.axisAt(c.route,t.entry(c,z))===t.axis);});const leader=t.cars.some(o=>o!==c&&o.state==='driving'&&o.route===c.route&&o.dir===c.dir&&(o.s-c.s)*c.dir>0&&(o.s-c.s)*c.dir<135);ok(red||leader,'Brake only for a red crossing or a car ahead');}const angle=((c.angle%360)+360)%360;headings[c.id].add(Math.round(angle/90)%4);for(const z of t.zonesByRoute[c.route])if(!t.inside(before,z)&&t.inside(c,z)){eq(t.mode,'green','Zone entry only on green');eq(Traffic.axisAt(c.route,t.entry(c,z)),t.axis,'Correct road phase at entry');}}
  for(const sig of t.signals)if(sig.phase==='walk')ok(t.clear(sig),'Pedestrian phase is clear');for(const a of t.cars)for(const b of t.cars)if(a.id<b.id&&a.state==='driving'&&b.state==='driving')ok(!overlaps(a,b),'Car bodies do not collide, including turns');
 }
 ok(modes.has('green')&&modes.has('walk'));for(const c of t.cars){ok(c.trips>=2,'Every car finishes multiple through journeys');ok(c.distance>Traffic.routes.find(r=>r.id===c.route).length*2);ok(entries[c.id]>=2&&exits[c.id]>=2,'Every car enters and leaves through the map edges');if(c.route==='west')ok(headings[c.id].size>=3,'The west route has real turns');}
}

let generated=0;for(const start of Object.keys(W.nodes))for(const face of W.dirs)for(const serial of [0,3,7,8,10,15]){const t=W.routeTask(start,face,serial);generated++;eq(t.path[0],start);eq(t.path.at(-1),t.target);ok(t.path.length>1);ok(t.path.slice(1).every((id,i)=>W.edge(t.path[i],id)));ok(t.instructions.every(i=>!(/turn around/i.test(i.text))));}
for(const [text,id] of [['the post office','post'],['bakers','bakery'],['café','cafe'],['police station','police'],['bank','bank'],['I’m at the greengrocer’s','greengrocer']])ok(W.answerMatches(text,id));ok(!W.answerMatches('bank','bakery'));
for(const f of G.foregrounds){ok(f.points.length>2);for(const [x,y] of f.points)ok(x>=0&&x<=W.W&&y>=0&&y<=W.H);}
const html=fs.readFileSync('index.html','utf8');ok(html.includes('scene-geometry.js'));ok(html.indexOf('scene-geometry.js')<html.indexOf('draw.js'));ok(html.includes('cole-south.png'));for(const m of W.missions){ok(W.venues[m.target]);ok(m.role&&m.text);}
console.log(JSON.stringify({status:'passed',checks,venues:W.places.length,crossings:W.crossings.length,authoredWalks:W.walks.length,generatedRoutes:generated,mapSha256:hash('assets/town-map-20261110.webp')}));

