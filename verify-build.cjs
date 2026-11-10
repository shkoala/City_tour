/* Verify the actual packaged HTML, not only the source modules. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const offline=fs.readFileSync('dist/City_tour.html','utf8'),index=fs.readFileSync('dist/index.html','utf8');
assert.equal(offline,fs.readFileSync('City_tour.html','utf8'));
assert.ok(!/<script\s[^>]*src=/i.test(offline),'No external scripts in the offline edition');
assert.ok(!/<link[^>]*rel="stylesheet"/i.test(offline),'No external styles in the offline edition');
assert.ok(!/\b(?:src|href)="assets\//i.test(offline),'No external image dependencies in offline markup');
const scripts=[...offline.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.equal(scripts.length,8);for(let i=0;i<scripts.length;i++)new vm.Script(scripts[i],{filename:'offline-script-'+i});
const sandbox={window:{}};vm.runInNewContext(scripts[0],sandbox);const images=sandbox.window.CITY_ASSETS;
assert.equal(Object.keys(images).length,8);for(const [file,data] of Object.entries(images)){assert.match(data,/^data:image\/(png|webp);base64,/);assert.ok(Buffer.from(data.split(',')[1],'base64').equals(fs.readFileSync(file)));}
for(const [,file] of index.matchAll(/(?:src|href)="((?:assets\/|[a-z-]+\.js|style\.css)[^"?]*)/g))assert.ok(fs.existsSync('dist/'+file),'Packaged dependency '+file);
assert.ok(index.includes('href="City_tour.html"'));
for(const uri of ['https://vk.ru/abc_shkoala','https://vk.ru/abc_shkoala?w=donut_payment-190039625&levelId=3559'])assert.ok(index.replace(/&amp;/g,'&').includes(uri));
console.log(JSON.stringify({status:'passed',offlineScripts:scripts.length,embeddedAssets:Object.keys(images).length,offlineBytes:Buffer.byteLength(offline)}));
