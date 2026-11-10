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
{
 const t=new Traffic(W.crossings);let modes=new Set(),collisions=0;
 for(let i=0;i<180*60;i++){t.tick(1/60);modes.add(t.mode);for(const c of t.cars)if(c.opacity>.7){if(c.road==='h1')ok(c.x>180&&c.x<1264,'Upper cars stay within the street');if(c.road==='h2')ok(c.x>128&&c.x<1304,'Lower cars stay within the street');}for(const sig of t.signals)if(sig.phase==='walk')ok(t.clear(sig),'Pedestrian phase is clear');for(const a of t.cars)for(const b of t.cars)if(a.id<b.id){if(a.road===b.road&&a.dir===b.dir)ok(Math.abs(a.s-b.s)>=99.9,'Following distance');if(a.opacity>.7&&b.opacity>.7&&Traffic.roads.find(r=>r.id===a.road).axis!==Traffic.roads.find(r=>r.id===b.road).axis){const ha=Traffic.roads.find(r=>r.id===a.road).axis==='H'?a:b,va=ha===a?b:a;if(Math.abs(ha.x-va.x)<34&&Math.abs(ha.y-va.y)<34)collisions++;}}}
 ok(modes.has('green')&&modes.has('walk'));eq(collisions,0,'Conflicting lanes do not occupy an intersection');
}
let generated=0;for(const start of Object.keys(W.nodes))for(const face of W.dirs)for(const serial of [0,3,7,8,10,15]){const t=W.routeTask(start,face,serial);generated++;eq(t.path[0],start);eq(t.path.at(-1),t.target);ok(t.path.length>1);ok(t.path.slice(1).every((id,i)=>W.edge(t.path[i],id)));ok(t.instructions.every(i=>!(/turn around/i.test(i.text))));}
for(const [text,id] of [['the post office','post'],['bakers','bakery'],['café','cafe'],['police station','police'],['bank','bank'],['I’m at the greengrocer’s','greengrocer']])ok(W.answerMatches(text,id));ok(!W.answerMatches('bank','bakery'));
for(const f of G.foregrounds){ok(f.points.length>2);for(const [x,y] of f.points)ok(x>=0&&x<=W.W&&y>=0&&y<=W.H);}
const html=fs.readFileSync('index.html','utf8');ok(html.includes('scene-geometry.js'));ok(html.indexOf('scene-geometry.js')<html.indexOf('draw.js'));ok(html.includes('cole-south.png'));for(const m of W.missions){ok(W.venues[m.target]);ok(m.role&&m.text);}
console.log(JSON.stringify({status:'passed',checks,venues:W.places.length,crossings:W.crossings.length,authoredWalks:W.walks.length,generatedRoutes:generated,mapSha256:hash('assets/town-map-20261110.webp')}));
