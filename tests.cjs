/* City_tour regression suite. Run node tests.cjs. No dependencies. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const base=fs.existsSync(path.join(__dirname,'dist/world.js'))?'./dist/':'./';
const W=require(base+'world.js'),Traffic=require(base+'traffic.js'),Walker=require(base+'walker.js');
let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;},eq=(a,b,m)=>{assert.equal(a,b,m);checks++;};
const near=(a,b,m)=>ok(Math.abs(a-b)<.001,m);
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,base,p))).digest('hex');
eq(hash('assets/town-map.webp'),'08984f3852949c03e1ff00ee38da0e434a109b783ab065e7e83bf6965b541df9','Preserve exact approved map bytes');
eq(W.places.length,13);eq(W.crossings.filter(c=>!c.decorative).length,7);
for(const p of W.places){ok(W.shortestPath('bus',p.id)?.length,'Reach '+p.id);eq(W.nodes[p.id].x,p.x);eq(W.nodes[p.id].y,p.y);}
for(const [id,connections] of Object.entries(W.edges)){
 const headings=connections.map(e=>W.direction(id,e.to));eq(new Set(headings).size,headings.length,'One clear exit for each direction: '+id);
 for(const e of connections){const f=W.geometry(id,e.to),r=W.geometry(e.to,id);eq(f.length,r.length);near(f.at(-1).x,W.nodes[e.to].x);near(f.at(-1).y,W.nodes[e.to].y);eq(f.filter(p=>p.cross).length,r.filter(p=>p.cross).length,'Reverse preserves zebra interlocks');}
}
const zebraBounds={'hospital-park':[490,552,245,265],'park-school':[940,1000,248,268],'north-crossing':[210,252,260,325],'middle-crossing':[180,225,532,595],'south-crossing':[145,183,803,870],'bus-crossing':[50,115,965,1061],'library-crossing':[912,1002,780,809]};
for(const e of W.edgeList)for(let i=1;i<e.points.length;i++){const a=e.points[i-1],b=e.points[i];if(b.cross){const box=zebraBounds[b.cross];ok(!!box);for(const p of [a,b])ok(p.x>=box[0]&&p.x<=box[1]&&p.y>=box[2]&&p.y<=box[3],'Use existing zebra '+b.cross);}else ok(Math.abs(b.x-a.x)<2||Math.abs(b.y-a.y)<2||Math.hypot(b.x-a.x,b.y-a.y)<180,'No diagonal block shortcuts');}
const run=(t,w,seconds,verify=()=>{})=>{for(let i=0;i<seconds*60;i++){t.tick(1/60);w?.tick(1/60);verify();}};
let walked=0,waited=0;
for(const p of W.places){
 const t=new Traffic(W.crossings),w=new Walker(W,t,event=>{if(event==='wait')waited++;});
 const verify=()=>{if(w.held){walked++;const sig=t.signal(w.held);eq(sig.phase,'walk','Hold red during crossing');ok(t.clear(sig),'No car shares occupied zebra');}ok(Number.isFinite(w.x)&&Number.isFinite(w.y));};
 ok(w.walk(W.shortestPath('bus',p.id)));run(t,w,85,verify);eq(w.location,p.id,'Arrive '+p.id);ok(!w.busy);
 ok(w.walk(W.shortestPath(p.id,'bus')));run(t,w,85,verify);eq(w.location,'bus','Return '+p.id);
}
ok(walked>0);ok(waited>0);
{
 const t=new Traffic(W.crossings),w=new Walker(W,t);ok(!w.walk(['bus','school']),'No teleport');eq(w.location,'bus');ok(w.turn(-1));eq(w.facing,'N');ok(!W.neighbour('bus','N'),'No road walking');w.reset('theatre','E');ok(w.walk(W.pastPath('theatre','E')));ok(!w.turn(1),'Busy turns ignored');run(t,w,5);eq(w.location,'cafe','Go past cinema');
}
{
 const t=new Traffic(W.crossings);let walks=0;
 run(t,null,180,()=>{for(const sig of t.signals)if(sig.phase==='walk'){walks++;ok(t.clear(sig),'Clear before pedestrian green');}for(const a of t.cars)for(const b of t.cars)if(a.id<b.id&&a.road===b.road&&a.dir===b.dir)ok(Math.abs(a.x-b.x)>=91.9,'Following distance');});ok(walks>0);
}
{
 const t=new Traffic(W.crossings),sig=t.signal('cinema-signal');t.signals.forEach(s=>{s.phase='walk';s.occupants.add('hold');s.elapsed=0;});const c=t.cars.find(c=>c.road===1&&c.dir===1);c.x=sig.x-160;c.speed=55;run(t,null,15,()=>ok(c.x<=sig.x-78+.001,'Stop before red'));eq(c.speed,0);ok(t.canWalk(sig.id));
}
{
 const t=new Traffic(W.crossings),w=new Walker(W,t);w.reset('bL','N');w.walk(['bL','gCorner']);for(let i=0;i<1200&&!w.held;i++){t.tick(1/60);w.tick(1/60);}ok(!!w.held);const held=w.held;w.reset();eq(t.signal(held).occupants.size,0,'Reset releases zebra');t.paused=true;t.signals.forEach(s=>s.phase='walk');t.cars[0].x=t.signals[0].x;w.reset('tH','E');ok(w.walk(['tH','tP']));run(t,w,4);eq(w.location,'tP','Hidden traffic cannot strand Cole');
}
let generated=0;
for(const start of Object.keys(W.nodes))for(const facing of W.dirs)for(let serial=0;serial<12;serial++){
 const task=W.routeTask(start,facing,serial);generated++;eq(task.path[0],start);eq(task.path.at(-1),task.target);ok(task.path.slice(1).every((n,i)=>W.edge(task.path[i],n)));ok(task.instructions.some(i=>i.kind==='past'),'Every route practises go past');for(const step of task.instructions.filter(i=>i.kind==='past'))for(const id of step.passed)ok(task.path.indexOf(id)>0&&task.path.indexOf(id)<task.path.length-1,'Pass the landmark before stopping');
}
for(const [a,id] of [['the bakery','bakery'],["baker’s",'bakery'],['café','cafe'],['post office','post'],['the greengrocers','greengrocer'],['police station','police']])ok(W.answerMatches(a,id));ok(!W.answerMatches('school','hospital'));
console.log(JSON.stringify({status:'passed',checks,venues:W.places.length,generatedRoutes:generated,map:'original, byte-for-byte unchanged'}));
