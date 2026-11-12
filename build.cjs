/* Build the static preview and the portable offline edition. No dependencies. */
const fs=require('node:fs'),path=require('node:path');
const scripts=['world.js','road-rules.js','traffic.js','walker.js','scene-geometry.js','scene.js','draw.js','app.js'];
const assets=['town-map-20261110.webp','shkoala-logo.png',...['north','south','east','west','diagonal','diagonal_back'].map(n=>'cole-'+n+'.png')];
fs.mkdirSync('dist/assets',{recursive:true});
for(const file of ['index.html','style.css',...scripts])fs.copyFileSync(file,'dist/'+file);
for(const asset of assets)fs.copyFileSync('assets/'+asset,'dist/assets/'+asset);
let html=fs.readFileSync('index.html','utf8');const dictionary={};for(const f of assets){const p='assets/'+f,mime=f.endsWith('.webp')?'image/webp':'image/png';dictionary[p]='data:'+mime+';base64,'+fs.readFileSync(p).toString('base64');}
html=html.replace(/<link rel="preload"[^>]*>/g,'').replace(/<link rel="stylesheet"[^>]*>/,()=>'<style>'+fs.readFileSync('style.css','utf8')+'</style>');
html=html.replace(/<a\b[^>]*data-offline-download[^>]*>[\s\S]*?<\/a>/g,'');
html=html.replace(/(?:src|href)="(assets\/[^"]+)"/g,(all,p)=>dictionary[p]?all.replace(p,dictionary[p]):all);
html=html.replace(/<script src="([^"?]+)(?:\?[^"\s]*)?"><\/script>/g,(all,p)=>scripts.includes(p)?'<script>'+fs.readFileSync(p,'utf8').replace(/<\/script/gi,'<\\/script')+'</script>':all);
html=html.replace('<script>','<script>window.CITY_ASSETS='+JSON.stringify(dictionary)+';</script>\n<script>');
fs.writeFileSync('City_tour.html',html);fs.copyFileSync('City_tour.html','dist/City_tour.html');
console.log(JSON.stringify({status:'built',scripts:scripts.length,assets:assets.length,offlineBytes:Buffer.byteLength(html)}));
