// Packs the full import (data/schedule.json) into the compact data/schedule.js the app loads.
// Usage: node scripts/pack_schedule.cjs [path/to/full.json]
const fs=require('fs'),path=require('path'),Core=require('../core.js'),root=path.join(__dirname,'..');
const src=process.argv[2]||path.join(root,'data/schedule.json'),full=JSON.parse(fs.readFileSync(src,'utf8')),out=path.join(root,'data/schedule.js');
const packed=Core.pack(full),text='window.SCHEDULE = '+JSON.stringify(packed)+';';
const back=Core.normalize(JSON.parse(JSON.stringify(packed))),keys=['day','slot','time','parity','group','subject','type','teachers','room','building','instituteId'];
if(back.lessons.length!==full.lessons.length||back.lessons.some((l,i)=>keys.some(k=>JSON.stringify(l[k]??'')!==JSON.stringify(full.lessons[i][k]??''))))throw new Error('Round-trip mismatch');
fs.writeFileSync(out,text);console.log(`data/schedule.js: ${(fs.statSync(src).size/1e6).toFixed(1)} MB → ${(text.length/1e6).toFixed(2)} MB (${Buffer.byteLength(text)/1e6|0||'<1'} MB UTF-8), ${back.lessons.length} пар, ${back.groups.length} груп`);
