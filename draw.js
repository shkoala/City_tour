(function(root){
  'use strict';
  const W=root.CityWorld,asset=p=>root.CITY_ASSETS?.[p]||p;
  function car(color,type){
    const colors={coral:['#f27b6a','#b94749'],blue:['#6fa6e7','#3665a8'],gold:['#f3c46e','#bc813f'],mint:['#8ac6b0','#3f907d']};const [c,d]=colors[color];
    const roof=type==='van'?'M23 10Q25 5 33 5H55Q61 5 65 10L72 22H20Z':'M25 20L34 8Q37 5 43 5H53Q59 5 65 20Z';
    return `<svg viewBox="0 0 96 48" aria-hidden="true"><defs><linearGradient id="paint-${color}-${type}" x2="0" y2="1"><stop stop-color="${c}"/><stop offset="1" stop-color="${d}"/></linearGradient></defs><ellipse cx="49" cy="42" rx="42" ry="5" fill="#142539" opacity=".25"/><path d="${roof}" fill="${d}" stroke="${d}" stroke-width="2"/><path d="M27 19L36 9H43V19Z M47 9H54L62 19H47Z" fill="#b5e4ea"/><path d="M30 17L37 10H41" fill="none" stroke="white" stroke-width="1.5" opacity=".7"/><path d="M9 24Q12 19 24 19H70L83 24Q91 26 91 32V37H7V30Z" fill="url(#paint-${color}-${type})" stroke="${d}" stroke-width="1.5"/><path d="M12 26H78" stroke="#fff" stroke-width="2" opacity=".35"/><circle cx="25" cy="36" r="10" fill="#263548"/><circle cx="25" cy="36" r="5.5" fill="#c9d0d5"/><circle cx="25" cy="36" r="2.5" fill="#6c7782"/><circle cx="73" cy="36" r="10" fill="#263548"/><circle cx="73" cy="36" r="5.5" fill="#c9d0d5"/><circle cx="73" cy="36" r="2.5" fill="#6c7782"/><rect x="83" y="26" width="7" height="5" rx="2" fill="#fff4b4"/><rect x="7" y="26" width="4" height="5" rx="1" fill="#a33535"/><path d="M44 23V34M48 25H53" stroke="${d}" stroke-width="1.5"/><rect x="84" y="34" width="8" height="3" rx="1" fill="#dce4e6"/><rect x="8" y="34" width="7" height="3" rx="1" fill="#dce4e6"/></svg>`;
  }
  function setup(){
    // The user-approved map is one unchanged image, at its original coordinates.
    const image=asset('assets/town-map.webp');
    document.getElementById('townArt').innerHTML=`<image href="${image}" width="1448" height="1086"/>`;
    document.getElementById('spots').innerHTML=W.places.map(p=>`<button type="button" class="place-spot" data-place="${p.id}" aria-label="${p.name}" style="left:${p.rect[0]/W.W*100}%;top:${p.rect[1]/W.H*100}%;width:${p.rect[2]/W.W*100}%;height:${p.rect[3]/W.H*100}%"><span>${p.name}</span></button>`).join('');
    document.getElementById('trafficLayer').innerHTML=root.cityTraffic.cars.map(c=>`<div class="car" id="car-${c.id}" data-direction="${c.dir}" data-type="${c.type}">${car(c.color,c.type)}</div>`).join('');
    // Exact copies of the original building pixels provide foreground occlusion.
    // This hides a car behind a projecting roof without redrawing that roof.
    const polygons=W.places.map(p=>p.poly.split(' ').map(pair=>{const [x,y]=pair.split(',').map(Number);return (x+p.src[0])+','+(y+p.src[1]);}).join(' '));
    document.getElementById('occlusionLayer').innerHTML=`<defs><clipPath id="original-foreground">${polygons.map(poly=>`<polygon points="${poly}"/>`).join('')}</clipPath></defs><image href="${image}" width="1448" height="1086" clip-path="url(#original-foreground)"/>`;
    document.getElementById('signalLayer').innerHTML=root.cityTraffic.signals.map(s=>`<div class="signal" id="signal-${s.id}" data-phase="green" style="left:${s.light.x/W.W*100}%;top:${s.light.y/W.H*100}%"><span class="signal-pole"></span><span class="lamps"><i class="red"></i><i class="amber"></i><i class="green"></i></span><span class="pedestrian">●</span></div>`).join('');
    document.getElementById('pathOverlay').innerHTML=`<g class="path-lines">${W.edgeList.map(e=>`<path d="${e.points.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join(' ')}" class="${e.kind}"/>`).join('')}</g><g class="path-points">${Object.values(W.nodes).map(n=>`<circle cx="${n.x}" cy="${n.y}" r="4"/>`).join('')}</g><path id="previewPath"/><circle id="arrivalRing" r="21"/>`;
  }
  root.CityDraw={setup};
})(window);
