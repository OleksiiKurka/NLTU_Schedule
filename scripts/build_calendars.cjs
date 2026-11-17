// Generates cal/<slug>.ics for every group, subgroup and teacher (static calendar subscriptions).
// Usage: node scripts/build_calendars.cjs [--check]
const fs=require('fs'),path=require('path'),vm=require('vm'),Core=require('../core.js');
const root=path.join(__dirname,'..'),dir=path.join(root,'cal'),ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'data/schedule.js'),'utf8'),ctx);
const S=ctx.window.SCHEDULE,stamp=Core.defaults.start.replace(/-/g,'')+'T000000Z',files={};
for(const x of Core.calendars(S)){const f=Core.slug(x)+'.ics';if(files[f])throw new Error('Slug collision: '+f);files[f]=Core.ics(Core.select(S.lessons,x),Core.defaults,x,{stamp})}
const existing=fs.existsSync(dir)?fs.readdirSync(dir).filter(f=>f.endsWith('.ics')):[];
if(process.argv.includes('--check')){const stale=Object.keys(files).filter(f=>!existing.includes(f)||fs.readFileSync(path.join(dir,f),'utf8')!==files[f]).concat(existing.filter(f=>!files[f]));if(stale.length){console.error('cal/ застарів ('+stale.length+' файлів). Запустіть: node scripts/build_calendars.cjs');process.exit(1)}console.log('cal/ актуальний: '+existing.length+' файлів');process.exit(0)}
fs.mkdirSync(dir,{recursive:true});for(const f of existing)if(!files[f])fs.unlinkSync(path.join(dir,f));
for(const [f,t] of Object.entries(files))fs.writeFileSync(path.join(dir,f),t);
console.log('Згенеровано '+Object.keys(files).length+' календарів у cal/');
