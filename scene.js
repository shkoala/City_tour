(function(root){
'use strict';
const geometry=root.CitySceneGeometry||(typeof require!=='undefined'?require('./scene-geometry.js'):null);
const depth=y=>100+Math.round(y*10),points=poly=>poly.map(p=>p.join(',')).join(' ');
const carSize={width:48,height:17.6};
const carPose=c=>({x:c.x,y:c.y,angle:c.angle,z:depth(c.y+8),opacity:c.opacity});
const mapMarkup=(asset=p=>p)=>`<image href="${asset('assets/town-map-20261110.webp')}" width="1448" height="1086"/><defs><linearGradient id="north-asphalt" x1="0" x2="1"><stop stop-color="#585c70"/><stop offset="1" stop-color="#484e63"/></linearGradient><filter id="road-grain"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter></defs>${geometry.northRoads.map(r=>`<g class="road-extension" data-road="${r.id}"><defs><clipPath id="${r.id}-clip"><polygon points="${points(r.polygon)}"/></clipPath></defs><polygon points="${points(r.polygon)}" fill="url(#north-asphalt)"/><rect x="${r.polygon[0][0]}" y="-2" width="55" height="70" filter="url(#road-grain)" opacity=".06" clip-path="url(#${r.id}-clip)"/><polyline points="${points(r.left)}" fill="none" stroke="#efc8bb" stroke-width="3"/><polyline points="${points(r.right)}" fill="none" stroke="#efc8bb" stroke-width="3"/><polyline points="${points(r.centre)}" fill="none" stroke="#f7f5ee" stroke-width="3" stroke-dasharray="20 20"/></g>`).join('')}`;
root.CityScene={...geometry,depth,points,carSize,carPose,mapMarkup};if(typeof module!=='undefined')module.exports=root.CityScene;
})(typeof window!=='undefined'?window:globalThis);

