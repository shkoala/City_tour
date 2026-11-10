(function(){
  'use strict';
  const W=window.CityWorld,$=id=>document.getElementById(id),asset=path=>window.CITY_ASSETS?.[path]||path;
  const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const storeKey='shkoala-city-tour-v4';let saved={};
  try{saved=JSON.parse(localStorage.getItem(storeKey)||'{}')||{};}catch{}
  const s={mode:'missions',missionIndex:0,chat:false,accepted:false,controls:false,more:false,freeControl:'arrows',paused:false,feedback:'',answer:'',route:null,routeSerial:Number.isSafeInteger(saved.walkIndex)&&saved.walkIndex>=0?saved.walkIndex:0,routeTrail:[],routeSolved:false,completed:new Set(Array.isArray(saved.completed)?saved.completed:[]),routesCompleted:Number.isSafeInteger(saved.routesCompleted)?saved.routesCompleted:0,routeAwards:new Set(Array.isArray(saved.routeAwards)?saved.routeAwards:[]),custom:[],settings:{names:false,paths:false,speech:false,traffic:true,...saved.settings}};
  const validMessage=m=>m&&typeof m.sender==='string'&&m.sender.trim().length>0&&m.sender.length<=40&&typeof m.text==='string'&&m.text.trim().length>0&&m.text.length<=500&&W.venues[m.target];
  s.custom=(Array.isArray(saved.custom)?saved.custom:[]).filter(validMessage).slice(0,100).map((m,i)=>({sender:m.sender,text:m.text,target:m.target,emoji:'💬',id:typeof m.id==='string'?m.id:'custom-'+i}));
  function persist(){try{localStorage.setItem(storeKey,JSON.stringify({completed:[...s.completed],routesCompleted:s.routesCompleted,custom:s.custom,settings:s.settings,walkIndex:s.routeSerial,routeAwards:[...s.routeAwards]}));}catch{toast('This browser cannot save progress. You can still play and export your messages.');}}
  let toastTimer,turnUntil=0,previousFacing='S',lastFrame=0;
  function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3800);$('announcer').textContent=message;}
  const traffic=window.cityTraffic=new window.CityTraffic(W.crossings);
  let walker;walker=new window.CityWalker(W,traffic,(type,value)=>{if(!walker)return;onWalker(type,value);});
  const builtin=W.missions.map(m=>({...m}));
  const allMissions=()=>[...builtin,...s.custom];
  const current=()=>allMissions()[s.missionIndex];
  function selectMission(){const index=allMissions().findIndex(m=>!s.completed.has(m.id)&&m.target!==walker.location);s.missionIndex=index>=0?index:Math.max(0,allMissions().findIndex(m=>!s.completed.has(m.id)));}
  selectMission();
  const score=()=>s.completed.size+s.routesCompleted;
  const isActive=()=>s.mode==='free'||(s.chat&&s.accepted&&(s.mode!=='directions'||!s.routeSolved));
  const isPaused=()=>s.paused||document.hidden||$('studio').open||$('welcome').open;
  const messages={missions:['01 / MISSIONS','A message. A little mystery.<br>Find the place and help a friend.'],directions:['02 / FOLLOW DIRECTIONS','Read. Follow. Discover.<br>Where is your friend waiting?'],free:['03 / FREE WALK','Your town. Your own pace.<br>Turn a little walk into a conversation.']};

  function onWalker(type,value){
    if(type==='turn'){turnUntil=performance.now()+320;$('cole').classList.remove('turning');void $('cole').offsetWidth;$('cole').classList.add('turning');setTimeout(()=>$('cole').classList.remove('turning'),340);renderLocation();renderControls();}
    if(type==='wait'){toast('Wait for the green pedestrian light. The cars are stopping.');renderLocation();}
    if(type==='cross'){renderLocation();}
    if(type==='arrive'){
      if(s.mode==='directions'&&s.route&&s.accepted){
        if(s.routeTrail.length>1&&s.routeTrail[s.routeTrail.length-2]===value)s.routeTrail.pop();else s.routeTrail.push(value);
      }
      if(W.nodes[value].place){$('announcer').textContent='Mr Cole is outside '+W.venues[W.nodes[value].place].article+'.';}
    }
    if(type==='stop'){
      s.controls=false;s.more=false;renderControls();renderLocation();
      if(s.mode==='missions'&&s.accepted&&W.nodes[value].place){toast('Send “I’m here!” on the phone when you think you have arrived.');}
      if(s.mode==='directions'&&s.chat){renderPhone();}
      if(s.mode==='free'&&W.nodes[value].place)toast('Mr Cole is outside '+W.venues[value].article+'.');
    }
  }
  function pulse(id){const n=W.nodes[id],el=$('arrivalRing');el.setAttribute('cx',n.x);el.setAttribute('cy',n.y);el.style.opacity='1';setTimeout(()=>el.style.opacity='0',1600);}
  function renderLocation(){
    const n=W.nodes[walker.location],facing={N:'up ↑',E:'right →',S:'down ↓',W:'left ←'}[walker.facing];
    $('position').textContent=walker.waiting?'Waiting on the pavement':walker.busy?'Walking through town':n.place?'Outside '+W.venues[n.place].article:n.kind==='end'?'At the end of the pavement':n.kind==='corner'?'At a pavement corner':n.kind==='crossing'?'At the zebra crossing':'At a pavement junction';
    $('heading').textContent='Facing '+facing+' · '+(s.mode==='free'&&s.freeControl==='click'?'tap the pavement near a place':isActive()?'turn first, then walk':s.mode==='directions'&&s.routeSolved?'choose Another adventure on the phone':s.mode==='missions'&&missionDone()?'open your next message':'open your message to begin');
  }
  function renderModes(){
    document.querySelectorAll('[data-mode]').forEach(b=>{const yes=b.dataset.mode===s.mode;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes));b.disabled=walker.busy;});
    $('score').innerHTML='★ <b>'+score()+'</b>';$('modeNumber').textContent=messages[s.mode][0];$('modeDescription').innerHTML=messages[s.mode][1];
    document.body.classList.toggle('free-click',s.mode==='free'&&s.freeControl==='click');
    $('walkHint').hidden=!(s.mode==='free'&&s.freeControl==='click');
    $('map').setAttribute('aria-label','Town map. '+(isActive()?'Arrow keys turn and walk Mr Cole.':'Open a phone message to begin.'));
  }
  function renderControls(){
    const launch=$('controlLauncher'),active=isActive(),click=s.mode==='free'&&s.freeControl==='click';
    if(!active||click){s.controls=false;launch.innerHTML=click?'<span class="chat-helper">Click to walk is on</span>':'<span class="chat-helper">Your adventure starts on the phone ↗</span>';}
    else launch.innerHTML=`<button class="btn launch" data-action="controls" aria-expanded="${s.controls}" aria-controls="controls">${s.controls?'Hide':'Walk controls'} <small>↑ ← →</small><span>${s.controls?'⌄':'⌃'}</span></button>`;
    const el=$('controls');el.hidden=!s.controls||!active||click;
    const next=W.neighbour(walker.location,walker.facing),past=W.pastPath(walker.location,walker.facing),passedPlace=W.pastLandmark(walker.location,walker.facing),cross=next&&W.edge(walker.location,next).crossing;
    const disabled=walker.busy||isPaused();
    el.innerHTML=`<div class="control-title"><span>${s.mode==='directions'?'FOLLOW THE MESSAGE':'LEFT & RIGHT ARE MR COLE’S'}</span><button data-action="hideControls" aria-label="Hide walking controls">×</button></div><div class="control-row"><button class="steer" data-action="left" ${disabled?'disabled':''} title="Turn left (←)"><span>↶</span>Turn left</button><button class="steer forward" data-action="forward" ${disabled||!next?'disabled':''} title="Go straight on (↑)"><span>↑</span>${cross?'Cross the road':'Go straight on'}</button><button class="steer" data-action="right" ${disabled?'disabled':''} title="Turn right (→)"><span>↷</span>Turn right</button><button class="more-toggle" data-action="more" aria-expanded="${s.more}">${s.more?'Less −':'More +'}</button></div>${s.more?`<div class="more-controls"><button class="steer" data-action="around" ${disabled?'disabled':''}><span>⤾</span>Turn around</button>${past?`<button class="steer past-action" data-action="past" ${disabled?'disabled':''}>⇥ Go past ${safe(W.venues[passedPlace].article)}</button>`:'<span class="chat-helper" style="max-width:145px;align-self:center">Go past appears when a place is ahead of Cole.</span>'}</div>`:''}`;
  }
  function canAct(){return isActive()&&!isPaused()&&!walker.busy;}
  function act(action){
    if(action==='controls'){s.controls=!s.controls;renderControls();return;}
    if(action==='hideControls'){s.controls=false;renderControls();return;}
    if(action==='more'){s.more=!s.more;renderControls();return;}
    if(!canAct())return;
    if(action==='left'||action==='right'||action==='around'){walker.turn({left:-1,right:1,around:2}[action]);return;}
    let path;
    if(action==='past')path=W.pastPath(walker.location,walker.facing);
    else if(action==='forward'){const n=W.neighbour(walker.location,walker.facing);if(n)path=[walker.location,n];}
    if(!path){toast('No pavement ahead. Turn Mr Cole at the junction.');return;}
    s.controls=false;s.more=false;walker.walk(path);renderControls();renderModes();renderLocation();
  }
  function avatar(m){return `<span class="avatar ${m.sender==='Alex'?'alex':''}">${m.emoji||'💬'}</span>`;}
  function inboxHead(sub){return `<div class="phone-head"><div><h2>Messages</h2><small>${sub}</small></div><span>♧</span></div>`;}
  function chatHead(m){return `<div class="chat-head"><button class="back" data-phone="back" aria-label="Back to messages">‹</button>${avatar(m)}<span class="chat-person"><b>${safe(m.sender)}</b><small>${safe(m.role||'a friend in Australia')}</small></span><button class="read-aloud" data-phone="speak" aria-label="Read message aloud" title="Read message aloud">♬</button></div>`;}
  function missionDone(){return s.completed.has(current()?.id);}
  function renderPhone(){
    if(s.mode==='free'){renderFree();return;}
    const area=$('phoneArea'),m=s.mode==='missions'?current():s.route;
    const allDone=s.mode==='missions'&&allMissions().every(x=>s.completed.has(x.id));
    if(!m||allDone&&!s.chat){area.innerHTML=inboxHead('All your friends say thank you')+`<div class="inbox-art"><span class="envelope">✧</span><h3>A brilliant adventure!</h3><p>You’ve helped everyone in town.<br>Try directions or start a new lesson.</p></div><div class="chat-composer"><button class="phone-btn solid" data-phone="restartLesson">Play missions again <span>↻</span></button></div>`;return;}
    if(!s.chat){
      const queue=s.mode==='missions'?allMissions().map((m,i)=>({m,i})).filter(o=>!s.completed.has(o.m.id)&&(o.m.target!==walker.location||s.accepted&&o.i===s.missionIndex)).slice(0,3):[{m:s.route,i:0}];
      const complete=allMissions().filter(m=>s.completed.has(m.id)).length;
      if(s.mode==='missions'&&!queue.length){area.innerHTML=inboxHead('A short walk first')+'<div class="inbox-art"><span class="envelope">♧</span><h3>You are already here.</h3><p>Take a short free walk, then check your messages for the remaining destination.</p></div><div class="chat-composer"><button class="phone-btn solid" data-phone="explore">Take a free walk →</button></div>';return;}
      area.innerHTML=inboxHead(s.mode==='missions'?'A little adventure is one tap away':'A route from your friend')+`<div class="inbox-note">${s.mode==='missions'?'Mr Cole is visiting family in Australia.<br>Tap a message. Find a place. Help a friend.':'Alex has sent a route from where Cole is now.<br>Follow it and discover the meeting place.'}</div><div>${queue.map(({m,i},k)=>`<button class="thread" data-phone="open" data-index="${i}">${avatar(m)}<span class="thread-body"><b>${safe(m.sender)}</b><p>${safe(m.text)}</p><small>${safe(m.role||'Your message')}</small></span><span class="thread-meta">${k===0?'now':'soon'}<i class="unread"></i></span></button>`).join('')}</div><div class="inbox-art"><span class="envelope">✉</span><p>Your next little adventure<br>is waiting to be opened.</p></div>${s.mode==='missions'?`<div class="inbox-progress"><span>${complete} / ${allMissions().length} helped</span><span class="progress-bar"><i style="width:${complete/allMissions().length*100}%"></i></span></div>`:''}`;
      return;
    }
    if(s.mode==='missions'){
      const done=missionDone();
      area.innerHTML=chatHead(m)+`<div class="chat-scroll"><div class="timestamp">TODAY · ${$('clock').textContent}</div><div class="bubble">${safe(m.text)}</div>${s.accepted||done?'<div class="bubble self">On my way! 🐨</div>':''}${done?'<div class="bubble success">You found it! Thank you, Cole. ✨</div>':''}</div><div class="chat-composer">${done?'<button class="phone-btn success" data-phone="nextMission">Next message <span>→</span></button>':s.accepted?'<button class="phone-btn solid" data-phone="arrived">I’m here! <span>↑</span></button><div class="chat-helper">Walk to the place. Then send your reply.</div>':'<button class="phone-btn solid" data-phone="accept">On my way! <span>↗</span></button><div class="chat-helper">Read the clue. Where does Mr Cole need to go?</div>'}${s.feedback?'<div class="feedback" role="status">'+safe(s.feedback)+'</div>':''}</div>`;
    }else{
      const t=s.route,prefix=routePrefix(),off=routeOff();
      area.innerHTML=chatHead(t)+`<div class="chat-scroll"><div class="timestamp">${safe(t.story||"A LITTLE ROUTE FOR YOU")} · ${t.connector?"GETTING THERE":t.serial<W.walks.length?"TASK "+(t.serial+1)+" / "+W.walks.length:"EXTRA WALK"}</div><div class="bubble">${safe(t.text)}</div><div class="route-label">START FACING ${t.facing==='E'?'RIGHT':t.facing==='W'?'LEFT':t.facing==='N'?'UP':'DOWN'}</div><div class="route-steps">${t.instructions.map((item,i)=>`<div class="route-step ${s.accepted&&prefix>=item.to&&item.to>item.from?'done':s.accepted&&prefix>item.from?'done':s.accepted&&prefix>=item.from&&prefix<=item.to?'active':''}"><b>${i+1<10?'0':''}${i+1}</b><span>${safe(item.text)}</span></div>`).join('')}</div>${s.routeSolved?'<div class="bubble success">Yes! This is where we’re meeting. Great directions, Cole! ✨</div>':''}</div><div class="chat-composer">${s.routeSolved?'<button class="phone-btn success" data-phone="newRoute">Another adventure <span>→</span></button>':!s.accepted?'<button class="phone-btn solid" data-phone="accept">Let’s go! <span>↗</span></button>':`<form class="answer-form" id="answerForm"><input id="answer" value="${safe(s.answer)}" autocomplete="off" spellcheck="false" aria-label="Meeting place" placeholder="Where are we meeting?" maxlength="60"><button aria-label="Send meeting place" type="submit">↑</button></form><div class="route-toolbar"><button class="phone-btn" data-phone="restartRoute">Restart route ↻</button></div>${off?'<div class="feedback">You’ve left the route. Retrace your steps, or restart.</div>':''}`}${s.feedback?'<div class="feedback '+(s.routeSolved?'ok':'')+'" role="status">'+safe(s.feedback)+'</div>':''}</div>`;
    }
    if(s.mode==='missions'&&missionDone())area.querySelector('.chat-scroll')?.scrollTo(0,1000);
  }
  const freePhrases=['Go past the cinema. Stop outside the café.','The police station is between the garage and the post office.','The library is in front of the baker’s.','The cinema is behind the police station.','The park is between the hospital and the school.','The post office is opposite the library.','Give your partner directions from the bus stop to the bank.'];let phrase=0;
  function renderFree(){
    $('phoneArea').innerHTML=inboxHead('No rush. No right answer.')+`<div class="free-screen"><img src="${asset('assets/cole-south.png')}" class="free-cole" alt="Mr Cole"><h3>Let’s take<br>the scenic route.</h3><p>You choose where to go.<br>Listen, speak and explore the town.</p><div class="segmented" role="group" aria-label="Free walk controls"><button data-phone="freeArrows" class="${s.freeControl==='arrows'?'active':''}" aria-pressed="${s.freeControl==='arrows'}">Arrow controls ↑</button><button data-phone="freeClick" class="${s.freeControl==='click'?'active':''}" aria-pressed="${s.freeControl==='click'}">Click to walk ↗</button></div><div class="phrase-card"><button data-phone="phrase" aria-label="Another speaking idea">↻</button><small>A SPEAKING IDEA</small><p>${freePhrases[phrase%freePhrases.length]}</p></div></div>`;
  }
  function routePrefix(){if(!s.route)return 0;let i=0;while(i<s.routeTrail.length&&s.routeTrail[i]===s.route.path[i])i++;return Math.max(0,i-1);}
  function routeOff(){return s.routeTrail.some((id,i)=>id!==s.route?.path[i]);}
  function newRoute(){s.route=W.routeTask(walker.location,walker.facing,s.routeSerial);s.routeTrail=[walker.location];s.routeSolved=false;s.accepted=false;s.chat=false;s.answer='';s.feedback='';}
  function switchMode(mode){
    if(walker.busy){toast('Let Mr Cole finish this short walk first.');return;}
    s.mode=mode;s.chat=false;s.accepted=false;s.controls=false;s.more=false;s.feedback='';window.speechSynthesis?.cancel();
    if(mode==='directions')newRoute();if(mode==='missions')selectMission();renderModes();renderPhone();renderControls();renderLocation();
  }
  function say(text){
    if(!('speechSynthesis' in window)){toast('Read-aloud is not available in this browser.');return;}
    window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-AU';u.rate=.88;const voices=window.speechSynthesis.getVoices();const voice=voices.find(v=>v.lang==='en-AU')||voices.find(v=>v.lang==='en-GB')||voices.find(v=>/^en/.test(v.lang));if(voice)u.voice=voice;window.speechSynthesis.speak(u);
  }
  function phoneAction(action,el){
    if(action==='speak'){const t=s.mode==='missions'?current():s.route;say(t.text+(s.mode==='directions'?' '+t.instructions.map(i=>i.text).join(' '):''));return;}
    if(action==='explore'){switchMode('free');return;}
    if(action==='back'){s.chat=false;s.controls=false;renderPhone();renderControls();return;}
    if(action==='open'){
      const i=Number(el.dataset.index);if(s.mode==='missions'&&i!==s.missionIndex){if(walker.busy)return;s.missionIndex=i;s.accepted=false;s.feedback='';}
      s.chat=true;renderPhone();if(s.settings.speech){const t=s.mode==='missions'?current():s.route;say(t.text+(s.mode==='directions'?' '+t.instructions.map(i=>i.text).join(' '):''));}return;
    }
    if(action==='accept'){s.accepted=true;s.feedback='';if(s.mode==='directions')s.routeTrail=[walker.location];renderPhone();renderControls();renderLocation();toast('Left and right are Mr Cole’s. Turn first, then walk.');return;}
    if(action==='arrived'){
      if(walker.busy){toast('Let Mr Cole finish walking first.');return;}
      if(walker.location!==current().target){s.feedback='This doesn’t seem to be the right place. Read the message again and keep looking.';renderPhone();return;}
      if(!missionDone()){s.completed.add(current().id);s.accepted=false;s.controls=false;s.feedback='';persist();pulse(walker.location);renderModes();renderPhone();renderControls();renderLocation();toast('Mission complete! You helped '+current().sender+'.');}return;
    }
    if(action==='nextMission'){selectMission();s.chat=false;s.accepted=false;s.controls=false;s.feedback='';renderPhone();renderControls();return;}
    if(action==='newRoute'){if(walker.busy)return;persist();newRoute();s.chat=true;renderPhone();renderControls();renderLocation();return;}
    if(action==='restartRoute'){if(walker.busy)return;walker.reset(s.route.start,s.route.facing);s.routeTrail=[s.route.start];s.feedback='';s.answer='';s.accepted=true;s.controls=false;renderPhone();renderControls();renderLocation();return;}
    if(action==='freeArrows'||action==='freeClick'){if(walker.busy)return;s.freeControl=action==='freeClick'?'click':'arrows';s.controls=false;renderFree();renderModes();renderControls();renderLocation();return;}
    if(action==='phrase'){phrase++;renderFree();return;}
    if(action==='restartLesson')resetLesson();
  }
  function checkAnswer(){
    if(walker.busy){s.feedback='Wait until Mr Cole stops, then send your answer.';}
    else if(!s.answer.trim()){s.feedback='Type the name of the meeting place.';}
    else if(!W.answerMatches(s.answer,s.route.target)){s.feedback='That isn’t our meeting place. Read the directions and try again.';}
    else if(walker.location!==s.route.target){s.feedback='That place sounds right. Now walk Mr Cole there.';}
    else if(routeOff()||s.routeTrail.length!==s.route.path.length){s.feedback='You found the place! Now follow Alex’s complete route. Retrace your steps or restart.';}
    else if(walker.facing!==W.direction(s.route.path.at(-2),s.route.target)){s.feedback='Face the direction you were walking when you reached the entrance. Then send your answer.';}
    else if(!s.routeSolved){s.routeSolved=true;const award=(s.route.planned?'story-':s.route.connector?'link-':'extra-')+s.route.serial+'-'+s.route.start+'-'+s.route.target;if(!s.routeAwards.has(award)){s.routeAwards.add(award);s.routesCompleted++;}if(!s.route.connector)s.routeSerial=s.route.serial+1;s.accepted=false;s.controls=false;s.feedback='You followed the route and found '+W.venues[s.route.target].article+'.';persist();pulse(walker.location);renderModes();toast('Perfect! The route and the meeting place are correct.');}
    renderPhone();renderControls();renderLocation();
  }
  function resetLesson(){
    s.completed.clear();s.routeAwards.clear();s.routesCompleted=0;s.routeSerial=0;s.missionIndex=0;s.chat=false;s.accepted=false;s.controls=false;s.feedback='';walker.reset('bus','S');if(s.mode==='directions')newRoute();persist();renderAll();toast('A fresh lesson. Mr Cole is back at the bus stop.');
  }
  function renderAll(){renderModes();renderPhone();renderControls();renderLocation();}
  function setPaused(value){s.paused=value;$('pauseCover').hidden=!value;$('pause').textContent=value?'▷':'Ⅱ';$('pause').setAttribute('aria-label',value?'Resume game':'Pause game');renderControls();window.speechSynthesis?.cancel();}
  function applySettings(){
    document.body.classList.toggle('show-names',!!s.settings.names);document.body.classList.toggle('show-paths',!!s.settings.paths);
    $('showNames').checked=!!s.settings.names;$('showPaths').checked=!!s.settings.paths;$('speech').checked=!!s.settings.speech;$('trafficToggle').checked=!!s.settings.traffic;
    $('trafficLayer').hidden=!s.settings.traffic;
    traffic.setEnabled(!!s.settings.traffic);persist();
  }
  function customList(){
    $('customList').innerHTML=s.custom.length?s.custom.map((m,i)=>`<div class="custom-message"><button data-delete="${i}" aria-label="Delete message from ${safe(m.sender)}">×</button><b>${safe(m.sender)} → ${safe(W.venues[m.target].name)}</b><p>${safe(m.text)}</p></div>`).join(''):'<p class="storage-note">Your own messages will appear here and in Missions.</p>';
  }
  function openStudio(){customList();$('studio').showModal();document.body.classList.add('dialog-open');s.controls=false;renderControls();window.speechSynthesis?.cancel();}
  function saveDownload(name,body){const url=URL.createObjectURL(new Blob([body],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function nearestWalkPoint(x,y){
    let candidate=null,best=Infinity;
    for(const e of W.edgeList){for(let i=1;i<e.points.length;i++){const a=e.points[i-1],b=e.points[i];if(b.cross)continue;const den=(b.x-a.x)**2+(b.y-a.y)**2;if(!den)continue;const t=Math.max(0,Math.min(1,((x-a.x)*(b.x-a.x)+(y-a.y)*(b.y-a.y))/den)),px=a.x+t*(b.x-a.x),py=a.y+t*(b.y-a.y),d=Math.hypot(x-px,y-py);if(d<best){best=d;const na=W.nodes[e.a],nb=W.nodes[e.b];candidate=Math.hypot(x-na.x,y-na.y)<Math.hypot(x-nb.x,y-nb.y)?na.id:nb.id;}}}
    return best<=25?candidate:null;
  }
  function tick(ts){
    const dt=lastFrame?Math.min((ts-lastFrame)/1000,2):0;lastFrame=ts;
    if(!isPaused()){
      for(let remaining=dt;remaining>0;remaining-=.025){const step=Math.min(remaining,.025);traffic.tick(step);walker.tick(step);}
    }
    window.CityDraw.update(traffic,walker);
    const cole=$('cole');cole.style.left=walker.x/W.W*100+'%';cole.style.top=walker.y/W.H*100+'%';cole.classList.toggle('walking',walker.moving&&!isPaused());cole.classList.toggle('waiting',walker.waiting);cole.dataset.location=walker.location;cole.dataset.busy=String(walker.busy);cole.dataset.onPavement=String(W.isOnPavement(walker.x,walker.y));
    const turning=turnUntil>ts;const filename=turning?(walker.facing==='N'||walker.facing==='W'?'cole-diagonal_back.png':'cole-diagonal.png'):'cole-'+({N:'north',S:'south',E:'east',W:'west'}[walker.facing])+'.png';
    if($('coleSprite').dataset.file!==filename){$('coleSprite').src=asset('assets/'+filename);$('coleSprite').dataset.file=filename;}
    if(previousFacing!==walker.facing){previousFacing=walker.facing;renderLocation();}
    document.querySelectorAll('[data-mode]').forEach(b=>b.disabled=walker.busy);
    requestAnimationFrame(tick);
  }

  window.CityDraw.setup();window.CityDraw.update(traffic,walker);
  $('destination').innerHTML=W.places.map(p=>`<option value="${p.id}">${safe(p.name)}</option>`).join('');
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>switchMode(b.dataset.mode)));
  $('controls').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)act(b.dataset.action);});
  $('controlLauncher').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)act(b.dataset.action);});
  $('phoneArea').addEventListener('click',e=>{const b=e.target.closest('[data-phone]');if(b)phoneAction(b.dataset.phone,b);});
  $('phoneArea').addEventListener('submit',e=>{if(e.target.id==='answerForm'){e.preventDefault();checkAnswer();}});
  $('phoneArea').addEventListener('input',e=>{if(e.target.id==='answer')s.answer=e.target.value;});
  $('spots').addEventListener('click',e=>{const b=e.target.closest('[data-place]');if(!b)return;toast(s.mode==='free'?'That is '+W.venues[b.dataset.place].article+'. Tap the pavement in front of it to walk there.':'Help Cole walk to a place, then reply on the phone.');});
  $('map').addEventListener('click',e=>{
    if(s.mode!=='free'||s.freeControl!=='click'||!canAct()||e.target.closest('.place-spot,.controls'))return;
    const r=$('map').getBoundingClientRect(),id=nearestWalkPoint((e.clientX-r.left)/r.width*W.W,(e.clientY-r.top)/r.height*W.H);
    if(!id){toast('Tap the wide pavement near a place. Cole will use the crossings.');return;}if(id===walker.location)return;
    const path=W.shortestPath(walker.location,id);if(path){walker.walk(path);renderLocation();renderModes();}
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){s.controls=false;renderControls();return;}
    if(e.target.closest('input,textarea,select,[contenteditable="true"],dialog'))return;
    const action={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'forward',ArrowDown:'around'}[e.key];
    if(!action||!isActive()||s.mode==='free'&&s.freeControl==='click'||isPaused())return;e.preventDefault();if(!e.repeat)act(action);
  });
  document.addEventListener('pointerdown',e=>{if(s.controls&&!e.target.closest('#controls,#controlLauncher')){s.controls=false;renderControls();}});
  $('settings').addEventListener('click',openStudio);$('pause').addEventListener('click',()=>setPaused(!s.paused));$('resume').addEventListener('click',()=>setPaused(false));
  $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('app').requestFullscreen)await $('app').requestFullscreen();else toast('Use your browser’s full-screen option.');}catch{toast('Use your browser’s full-screen option.');}});
  $('help').addEventListener('click',()=>$('welcome').showModal());$('welcomeGo').addEventListener('click',()=>$('welcome').close());
  document.querySelectorAll('.close-dialog').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(d=>d.addEventListener('close',()=>{document.body.classList.remove('dialog-open');renderControls();}));
  document.querySelectorAll('[data-studio]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-studio]').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('[data-page]').forEach(p=>p.hidden=p.dataset.page!==b.dataset.studio);}));
  [['showNames','names'],['showPaths','paths'],['speech','speech'],['trafficToggle','traffic']].forEach(([id,key])=>$(id).addEventListener('change',()=>{if(key==='traffic'&&walker.busy){$(id).checked=s.settings.traffic;toast('Let Cole finish crossing before changing traffic.');return;}s.settings[key]=$(id).checked;applySettings();}));
  $('resetBus').addEventListener('click',()=>{walker.reset('bus','S');s.controls=false;s.feedback='';if(s.mode==='directions')newRoute();renderAll();$('studio').close();toast('Mr Cole is at the bus stop.');});
  $('resetLesson').addEventListener('click',()=>{resetLesson();$('studio').close();});
  $('missionForm').addEventListener('submit',e=>{e.preventDefault();const m={sender:$('sender').value.trim(),text:$('message').value.trim(),target:$('destination').value,id:'custom-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),emoji:'💬'};if(!validMessage(m)){toast('Add a sender, a message and a valid destination.');return;}if(s.custom.length>=100){toast('You can keep up to 100 custom messages. Export or remove some first.');return;}s.custom.push(m);$('message').value='';persist();customList();renderPhone();toast('Message added to Missions.');});
  $('customList').addEventListener('click',e=>{const b=e.target.closest('[data-delete]');if(!b)return;const m=s.custom.splice(Number(b.dataset.delete),1)[0];s.completed.delete(m.id);selectMission();s.accepted=false;s.chat=false;s.controls=false;s.feedback='';persist();customList();renderAll();});
  $('export').addEventListener('click',()=>saveDownload('City_tour_missions.json',JSON.stringify({format:'city-messages',version:2,messages:s.custom.map(({sender,text,target})=>({sender,text,target}))},null,2)));
  $('import').addEventListener('click',()=>$('importFile').click());
  $('importFile').addEventListener('change',async e=>{
    const file=e.target.files?.[0];if(!file)return;try{
      if(file.size>200000)throw new Error('Choose a JSON file smaller than 200 KB.');
      const parsed=JSON.parse(await file.text()),items=Array.isArray(parsed)?parsed:parsed.messages;
      if(!Array.isArray(items)||items.some(m=>!validMessage(m)))throw new Error('Every message needs a sender, text and a valid destination.');
      const fresh=items.filter(m=>!s.custom.some(c=>c.sender===m.sender&&c.text===m.text&&c.target===m.target));
      if(s.custom.length+fresh.length>100)throw new Error('A lesson can contain up to 100 custom messages.');
      s.custom.push(...fresh.map((m,i)=>({sender:m.sender.trim(),text:m.text.trim(),target:m.target,emoji:'💬',id:'custom-import-'+Date.now()+'-'+i})));persist();customList();renderPhone();$('importStatus').textContent=fresh.length+' messages added. Existing messages were kept.';
    }catch(err){$('importStatus').textContent='Could not import: '+(err.message||'invalid JSON file.');}finally{e.target.value='';}
  });
  document.addEventListener('visibilitychange',()=>{lastFrame=0;if(document.hidden)window.speechSynthesis?.cancel();});
  function updateClock(){const now=new Date();$('clock').textContent=now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});}updateClock();setInterval(updateClock,30000);
  applySettings();renderAll();requestAnimationFrame(tick);
  // Read-only diagnostics. The simulation itself is shared with the regression tests.
  window.cityMessages={getState:()=>({version:'20261110-release',mode:s.mode,location:walker.location,facing:walker.facing,busy:walker.busy,waiting:walker.waiting,x:walker.x,y:walker.y,score:score(),accepted:s.accepted,route:s.route&&{path:s.route.path,instructions:s.route.instructions,target:s.route.target},routeTrail:[...s.routeTrail],routeIndex:s.routeSerial,routeSolved:s.routeSolved,trafficMode:traffic.mode,signals:traffic.signals.map(x=>({id:x.id,phase:x.phase,occupied:x.occupants.size})),cars:traffic.cars.map(c=>({...c}))})};
})();


