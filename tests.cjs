/* City_tour regression suite. Run node tests.cjs. No dependencies. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const base=fs.existsSync(path.join(__dirname,'dist/world.js'))?'./dist/':'./';
const S=require(base+'scene.js'),W=require(base+'world.js'),Traffic=require(base+'traffic.js'),Walker=require(base+'walker.js');
let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;},eq=(a,b,m)=>{assert.equal(a,b,m);checks++;};
const near=(a,b,m)=>ok(Math.abs(a-b)<.001,m);
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,base,p))).digest('hex');
eq(hash('assets/town-map.webp'),'08984f3852949c03e1ff00ee38da0e434a109b783ab065e7e83bf6965b541df9','Preserve exact approved map bytes');
eq(W.places.length,13);eq(W.crossings.filter(c=>!c.decorative).length,7);
for(const p of W.places){ok(W.shortestPath('bus',p.id)?.length,'Reach '+p.id);eq(W.nodes[p.id].x,p.x);eq(W.nodes[p.id].y,p.y);}
eq(Object.keys(W.nodes).length,28,'Only entrances and real pavement corners are selectable');
for(const n of Object.values(W.nodes))ok(W.isSafeStop(n.id),'Every selectable stop is on pavement: '+n.id);
for(const [x,y] of [[1018,792],[1028,790],[205,537],[1000,835]])ok(!W.isOnPavement(x,y),'Reject known road / zebra coordinate '+x+','+y);
for(const id of ['lW','lE','tH','tP','tQ','tS'])ok(!W.nodes[id],'A curb is not a destination: '+id);
for(const [id,connections] of Object.entries(W.edges)){
 const headings=connections.map(e=>W.direction(id,e.to));eq(new Set(headings).size,headings.length,'One clear exit for each direction: '+id);
 for(const e of connections){const f=W.geometry(id,e.to),r=W.geometry(e.to,id);eq(f.length,r.length);near(f.at(-1).x,W.nodes[e.to].x);near(f.at(-1).y,W.nodes[e.to].y);eq(f.filter(p=>p.cross).length,r.filter(p=>p.cross).length,'Reverse preserves zebra interlocks');}
}
const zebraBounds={'hospital-park':[480,575,245,265],'park-school':[920,1015,245,268],'north-crossing':[210,252,245,325],'middle-crossing':[170,225,520,600],'south-crossing':[145,183,790,880],'bus-crossing':[139,190,955,1067],'library-crossing':[940,1090,780,809]};
for(const e of W.edgeList)for(let i=1;i<e.points.length;i++){const a=e.points[i-1],b=e.points[i];if(b.cross){const box=zebraBounds[b.cross];ok(!!box);for(const p of [a,b])ok(p.x>=box[0]&&p.x<=box[1]&&p.y>=box[2]&&p.y<=box[3],'Use existing zebra '+b.cross);}else ok(Math.abs(b.x-a.x)<2||Math.abs(b.y-a.y)<2||Math.hypot(b.x-a.x,b.y-a.y)<180,'No diagonal block shortcuts');}
for(const e of W.edgeList)for(const [a,b] of [[e.a,e.b],[e.b,e.a]]){
 const ps=[{x:W.nodes[a].x,y:W.nodes[a].y},...W.geometry(a,b)];
 for(let i=1;i<ps.length;i++)if(ps[i].cross&&ps[i-1].cross!==ps[i].cross){let last=i;while(ps[last+1]?.cross===ps[i].cross)last++;ok(W.isOnPavement(ps[i-1].x,ps[i-1].y),'Wait before a crossing on pavement');ok(W.isOnPavement(ps[last].x,ps[last].y),'Finish crossing on the opposite pavement');}
}
const run=(t,w,seconds,verify=()=>{})=>{for(let i=0;i<seconds*60;i++){t.tick(1/60);w?.tick(1/60);verify();}};
let walked=0,waited=0;
for(const p of W.places){
 const t=new Traffic(W.crossings),w=new Walker(W,t,event=>{if(event==='wait'){waited++;ok(W.isOnPavement(w.x,w.y),'Never wait in the roadway');}if(event==='stop')ok(W.isOnPavement(w.x,w.y),'Never stop in the roadway');});
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
 const t=new Traffic(W.crossings),w=new Walker(W,t);w.reset('bL','N');w.walk(['bL','gL']);for(let i=0;i<1200&&!w.held;i++){t.tick(1/60);w.tick(1/60);}ok(!!w.held);const held=w.held;w.reset();eq(t.signal(held).occupants.size,0,'Reset releases zebra');t.paused=true;t.signals.forEach(s=>s.phase='walk');t.cars[0].x=t.signals[0].x;w.reset('hospital','E');ok(w.walk(['hospital','park']));run(t,w,5);eq(w.location,'park','Hidden traffic cannot strand Cole');
}
// Reproduce the screenshot: one action from the post office must finish at the
// library entrance, never at the old point (1018,792) on the zebra.
{
 const t=new Traffic(W.crossings),stops=[],w=new Walker(W,t,(event,id)=>{if(event==='stop')stops.push(id);});
 w.reset('post','E');ok(w.walk(W.shortestPath('post','library')));run(t,w,10);eq(w.location,'library');near(w.x,1160);near(w.y,790);eq(stops.join(','),'library');ok(!w.busy);ok(W.isOnPavement(w.x,w.y));
 w.reset('library','W');stops.length=0;ok(w.walk(W.shortestPath('library','post')));run(t,w,10);eq(stops.join(','),'post');ok(W.isOnPavement(w.x,w.y));
 w.reset('police','E');stops.length=0;eq(W.pastPath('police','E').join(','),'police,post,postCorner');ok(w.walk(W.pastPath('police','E')));run(t,w,12);eq(stops.join(','),'postCorner','Go past stops only at a real pavement junction');
}
// A bend inside a zebra must not release the red-light interlock and strand
// Cole waiting halfway across when the pedestrian timer expires.
{
 const t=new Traffic(W.crossings),w=new Walker(W,t);w.reset('mL','S');ok(w.walk(['mL','lL']));let found=false;
 for(let i=0;i<1800;i++){t.tick(1/60);w.tick(1/60);if(Math.abs(w.x-205)<.001&&Math.abs(w.y-580)<.001){found=true;eq(w.held,'middle-crossing');const sig=t.signal(w.held);sig.elapsed=10;run(t,w,.1);eq(sig.phase,'walk');ok(!w.waiting,'Continue through zebra bend');break;}}
 ok(found,'Exercise the internal zebra bend');run(t,w,10);eq(w.location,'lL');eq(t.signal('middle-crossing').occupants.size,0);
}
// The lower promenade and garage share one vertical walking line across both streets.
{
 const route=['bL','gL','lL'];eq(W.shortestPath('bL','lL').join(','),route.join(','));
 for(let i=1;i<route.length;i++){eq(W.direction(route[i-1],route[i]),'N');for(const p of W.geometry(route[i-1],route[i]))eq(p.x,165,'No sideways jog between the two lower crossings');}
 eq(W.crossings.find(c=>c.id==='bus-crossing').x,W.crossings.find(c=>c.id==='south-crossing').x);
 eq(S.lowerCrossing.x,W.crossings.find(c=>c.id==='bus-crossing').x,'Drawn zebra and walking line agree');
 const t=new Traffic(W.crossings),w=new Walker(W,t);w.reset('bL','N');ok(w.walk(route));run(t,w,20,()=>eq(w.facing,'N','Face straight ahead throughout both crossings'));eq(w.location,'lL');
}
// Cleared side passages are actual walkable routes, rather than decorative paving.
for(const id of ['postSide','librarySide','libraryEast']){
 const t=new Traffic(W.crossings),w=new Walker(W,t);ok(w.walk(W.shortestPath('bus',id)));run(t,w,60);eq(w.location,id);ok(!w.busy);ok(W.isOnPavement(w.x,w.y));
}
for(const [a,b] of [['postCorner','postSide'],['libraryCorner','librarySide'],['lR','libraryEast']]){
 let previous=W.nodes[a];for(const next of W.geometry(a,b)){for(let step=0;step<=20;step++){const t=step/20;ok(W.isOnPavement(previous.x+(next.x-previous.x)*t,previous.y+(next.y-previous.y)*t),'The entire cleared side route stays on pavement');}previous=next;}
}
// Relative depth fixes both the roof mask and the old always-on-top traffic lights.
{
 const theatre=S.foregrounds.find(f=>f.id==='theatre'),library=S.foregrounds.find(f=>f.id==='library');
 for(const road of [0,1,2])for(const dir of [-1,1]){const p=S.carPose({road,dir,x:720});ok(p.y-S.carSize.height>=[265,533,809][road],'Car fits the road band');ok(p.y<=[312,584,865][road]);}
 ok(S.depth(theatre.foot)>S.carPose({road:0,dir:1,x:380}).z,'Roof in front hides the car');
 ok(S.depth(library.foot)>S.carPose({road:1,dir:-1,x:1180}).z,'Library roof in front hides the car');
 ok(S.carPose({road:1,dir:1,x:513}).z>S.depth(W.crossings.find(c=>c.id==='cinema-signal').light.y),'Car in front of a northern signal is drawn in front');
 ok(S.depth(600)<S.depth(library.foot)&&S.depth(790)>S.depth(library.foot),'Cole walks behind the side wall and in front of the entrance');
 for(const f of S.foregrounds)for(const [x,y] of f.points)ok(x>=0&&x<=W.W&&y>=0&&y<=W.H,'Foreground coordinates stay in the original map');
}
let generated=0;
for(const start of Object.keys(W.nodes))for(const facing of W.dirs)for(let serial=0;serial<12;serial++){
 const task=W.routeTask(start,facing,serial);generated++;eq(task.path[0],start);eq(task.path.at(-1),task.target);ok(task.path.slice(1).every((n,i)=>W.edge(task.path[i],n)));ok(task.instructions.some(i=>i.kind==='past'),'Every route practises go past');for(const step of task.instructions.filter(i=>i.kind==='past'))for(const id of step.passed)ok(task.path.indexOf(id)>0&&task.path.indexOf(id)<task.path.length-1,'Pass the landmark before stopping');
}
for(const [a,id] of [['the bakery','bakery'],["baker’s",'bakery'],['café','cafe'],['post office','post'],['the greengrocers','greengrocer'],['police station','police']])ok(W.answerMatches(a,id));ok(!W.answerMatches('school','hospital'));
console.log(JSON.stringify({status:'passed',checks,venues:W.places.length,generatedRoutes:generated,map:'original preserved; two local pavement patches'}));


