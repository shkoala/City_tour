(function(root){
  'use strict';
  const W=root.CityWorld,S=root.CityScene,asset=p=>root.CITY_ASSETS?.[p]||p;
  function car(color,type,id){
    const colors={coral:['#f28a74','#ac4545'],blue:['#87b9ef','#376eaa'],gold:['#f4ce79','#b37b35'],mint:['#91d0bb','#387f70']},[paint,shade]=colors[color],van=type==='van';
    return `<defs><linearGradient id="paint-${id}" x2="0" y2="1"><stop stop-color="${paint}"/><stop offset="1" stop-color="${shade}"/></linearGradient></defs><ellipse cx="0" cy="-2" rx="26" ry="2.5" fill="#202b3b" opacity=".23"/><g transform="translate(-28 -19.04) scale(.56)"><rect x="18" y="21" width="13" height="12" rx="4" fill="#243448"/><rect x="70" y="21" width="13" height="12" rx="4" fill="#243448"/><path d="M5 15Q7 10 20 9L${van?'29 3H64L76 10':'33 3H60L73 10'} 88 13Q96 15 96 24V28H5Z" fill="url(#paint-${id})" stroke="${shade}" stroke-width="1.5"/><path d="M29 11L36 5H59L68 12Z" fill="#d0edf0" stroke="${shade}"/><path d="M36 5H${van?'61':'57'}V12H30Z" fill="${paint}"/><path d="M61 6L69 12 69 20 61 18Z" fill="#a0d1dd"/><path d="M28 12H58V20H26Z" fill="#a7d5e1"/><path d="M30 13H56" stroke="#f3ffff" stroke-width="1.6"/><path d="M60 12V26M28 21H55M66 23H71" fill="none" stroke="${shade}" stroke-width="1.5"/><path d="M77 13L88 15M8 21H22" stroke="#fff" stroke-width="1.4" opacity=".5"/><rect x="89" y="18" width="7" height="4" rx="1.3" fill="#fff6b5"/><rect x="5" y="19" width="4" height="4" rx="1" fill="#9f353c"/><circle cx="24" cy="27" r="5.5" fill="#223245"/><circle cx="24" cy="27" r="2.6" fill="#d9e4e7"/><circle cx="76" cy="27" r="5.5" fill="#223245"/><circle cx="76" cy="27" r="2.6" fill="#d9e4e7"/><path d="M7 27H16M84 27H96" stroke="#dbe6e9" stroke-width="2"/></g>`;
  }
  function setup(){
    document.getElementById('townArt').innerHTML=S.mapMarkup(asset);
    document.getElementById('spots').innerHTML=W.places.map(p=>`<button type="button" class="place-spot" data-place="${p.id}" aria-label="${p.name}" style="left:${p.rect[0]/W.W*100}%;top:${p.rect[1]/W.H*100}%;width:${p.rect[2]/W.W*100}%;height:${p.rect[3]/W.H*100}%"><span>${p.name}</span></button>`).join('');
    document.getElementById('trafficLayer').innerHTML=root.cityTraffic.cars.map(c=>`<svg class="car-frame" id="car-frame-${c.id}" viewBox="0 0 1448 1086"><g class="vehicle" id="car-${c.id}" data-type="${c.type}">${car(c.color,c.type,c.id)}</g></svg>`).join('');
    document.getElementById('occlusionLayer').innerHTML=S.foregrounds.map(f=>`<svg class="foreground" viewBox="0 0 1448 1086" style="z-index:${S.depth(f.foot)}"><defs><clipPath id="foreground-${f.id}"><polygon points="${S.points(f.points)}"/></clipPath></defs><image href="${asset(f.source||'assets/town-map.webp')}" ${f.source?'x="930" y="540" width="430" height="280"':'width="1448" height="1086"'} clip-path="url(#foreground-${f.id})"/></svg>`).join('');
    document.getElementById('signalLayer').innerHTML=root.cityTraffic.signals.map(s=>`<div class="signal" id="signal-${s.id}" data-phase="green" style="left:${s.light.x/W.W*100}%;top:${s.light.y/W.H*100}%;z-index:${S.depth(s.light.y)}"><span class="signal-pole"></span><span class="lamps"><i class="red"></i><i class="amber"></i><i class="green"></i></span><span class="pedestrian">●</span></div>`).join('');
    document.getElementById('pathOverlay').innerHTML=`<g class="path-lines">${W.edgeList.map(e=>`<path d="${e.points.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join(' ')}" class="${e.kind}"/>`).join('')}</g><g class="path-points">${Object.values(W.nodes).map(n=>`<circle cx="${n.x}" cy="${n.y}" r="4"/>`).join('')}</g><path id="previewPath"/><circle id="arrivalRing" r="21"/>`;
  }
  function update(traffic,walker){
    for(const c of traffic.cars){const p=S.carPose(c),el=document.getElementById('car-'+c.id),frame=document.getElementById('car-frame-'+c.id);el.setAttribute('transform',`translate(${p.x} ${p.y}) scale(${c.dir} 1)`);el.classList.toggle('braking',c.speed<4);frame.style.zIndex=p.z;frame.style.opacity=p.opacity;}
    for(const sig of traffic.signals)document.getElementById('signal-'+sig.id).dataset.phase=sig.phase;
    document.getElementById('cole').style.zIndex=S.depth(walker.y);
  }
  root.CityDraw={setup,update,car};
})(window);
