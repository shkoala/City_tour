(function(root){
'use strict';
const geometry=root.CitySceneGeometry||(typeof require!=='undefined'?require('./scene-geometry.js'):null);
const depth=y=>100+Math.round(y*10),points=poly=>poly.map(p=>p.join(',')).join(' ');
const carSize={width:48,height:17.6};
const carPose=c=>({x:c.x,y:c.y,angle:c.angle,z:depth(c.y+8),opacity:c.opacity});
const mapMarkup=(asset=p=>p)=>`<image href="${asset('assets/town-map-20261110.webp')}" width="1448" height="1086"/>`;
root.CityScene={...geometry,depth,points,carSize,carPose,mapMarkup};if(typeof module!=='undefined')module.exports=root.CityScene;
})(typeof window!=='undefined'?window:globalThis);

