const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),C=require('./core.js');
let ctx={window:{}};vm.runInNewContext(fs.readFileSync('data/schedule.js','utf8'),ctx);let data=ctx.window.SCHEDULE;
C.normalize(data);C.normalize(data);
// Структура даних: 6 інститутів, ієрархія інститут → напрям → група → підгрупа, нормалізований час
{const inst=new Set(data.institutes.map(i=>i.id)),G=C.groups(data);assert.equal(data.institutes.length,6);assert.equal(inst.size,6);
 assert.equal(new Set(G.map(g=>g.id)).size,G.length);assert(G.length<=data.groups.length);assert(G.every(g=>inst.has(g.instituteId)));
 const dir=new Map(),base=new Map();for(const g of G){assert(!dir.has(g.direction)||dir.get(g.direction)===g.instituteId,g.direction);dir.set(g.direction,g.instituteId);assert(!base.has(g.base)||base.get(g.base)===g.direction,g.base);base.set(g.base,g.direction)}
 const ids=new Set(G.map(g=>g.id));assert(data.lessons.every(l=>ids.has(l.group)&&inst.has(l.instituteId)));
 assert(data.lessons.every(l=>/^\d{1,2}:\d{2} - \d{1,2}:\d{2}$/.test(l.time)));for(const s of [1,2,3,4,5])assert.equal(new Set(data.lessons.filter(l=>l.slot===s).map(l=>l.time)).size,1,'slot '+s);
 assert.equal(C.key('дт 12'),C.key('ДТ-12'));assert(C.key('ДТ-12').startsWith(C.key('дт1')));
 const copy={lessons:[{slot:2,time:'10:20'},{slot:9,time:'1:00'}]};C.normalize(copy);assert.equal(copy.lessons[0].time,'10:20 - 11:55');assert.equal(copy.lessons[1].time,'1:00')}
assert.equal(C.parity('2026-09-01',C.defaults),'н');assert.equal(C.parity('2026-09-07',C.defaults),'п');assert.equal(C.parity('2026-09-14',C.defaults),'н');
assert.equal(C.parity('2026-08-24',C.defaults),'п');assert.equal(C.parity('2026-09-01',{...C.defaults,firstParity:'п'}),'п');
let eng=data.lessons.filter(x=>x.group.startsWith('ДТ-12/')&&x.subject==='Інженер граф'),events=C.occurrences(eng,C.defaults);
assert.equal(events.length,24);assert.equal(events.filter(x=>x.type==='lab').length,8);assert.equal(events.filter(x=>x.type==='lecture').length,16);
assert(events.every(x=>x.groups.length===2));assert(events.filter(x=>x.type==='lab').every(x=>C.parity(x.date,C.defaults)==='п'));
let physics=data.lessons.filter(x=>x.group.startsWith('ДТ-12/')&&x.subject==='Фізика'&&x.day===2&&x.slot===1);let p=C.merge(physics);assert(p.some(x=>C.eligible({subgroup:'1'},x)&&!C.eligible({subgroup:'2'},x)));
assert(C.occurrences(eng,{...C.defaults,sessionStart:'2026-09-01',sessionEnd:'2026-12-31'}).length===0);
assert.deepEqual(C.students('1 Курка Олексій, 2 Курка Роман\nБез Підгрупи').map(s=>s.subgroup),['1','2','']);
for(let n of [1,8,40,100])for(let t of [0,1,40,100]){let d=C.distribute(t,n);assert.equal(d.length,n);assert.equal(d.reduce((a,b)=>a+b,0),t);assert(d.every(x=>Number.isInteger(x)&&x>=0))}
for(let x of data.lessons){assert(x.day>=0&&x.day<5);assert(['н','п'].includes(x.parity));assert(x.slot>=1&&x.slot<=5)}
assert(!data.lessons.flatMap(x=>x.teachers).some(x=>x.includes('зал')));
const X=require('./xlsx.js');fs.writeFileSync('/tmp/nltu-export-test.xlsx',X.create([['Журнал'],['Викладач','Гончар І.М.'],['2026-09-01'],['Демо'],['Студент','Група','Бал'],['Курка Олексій','1',40],['=NOT_A_FORMULA','2',30]]));
console.log('PASS: import, parity, 24 semester events, shared/subgroup lessons, session exclusion, roster, exact score totals, XLSX generation');
for(let min of [0,1,3,5])for(let n of [1,8,24])for(let target of [n*min,Math.floor(n*(min+5)/2),n*5]){const a=C.distributeBounded(target,n,min,5);assert.equal(a.reduce((x,y)=>x+y,0),target);assert(a.every(v=>Number.isInteger(v)&&v>=min&&v<=5))}
assert.throws(()=>C.distributeBounded(41,8,1,5),RangeError);assert.throws(()=>C.distributeBounded(7,8,1,5),RangeError);assert.throws(()=>C.distributeBounded(0,0,1,5),RangeError);
assert(C.defaults.moduleEnd<C.defaults.module2Start);assert(C.defaults.module2End<C.defaults.sessionStart);
console.log('PASS: bounded grades 0/1/3/5–5, exact totals, infeasible allocation rejected, two ordered modules');
// Calendar subscriptions: recurring events must expand to exactly the same lessons as Core.occurrences
{const expand=t=>{let n=0;for(const ev of t.split('BEGIN:VEVENT').slice(1)){const g=k=>(ev.match(new RegExp('\\n'+k+'[^:]*:([^\\r]*)'))||[])[1];const s=g('DTSTART').slice(0,8),iv=+g('RRULE').match(/INTERVAL=(\d)/)[1],ex=(g('EXDATE')||'').split(',').filter(Boolean).map(x=>x.slice(0,8));const iso=x=>x.slice(0,4)+'-'+x.slice(4,6)+'-'+x.slice(6);for(let d=iso(s);d<=C.defaults.end;d=C.add(d,7*iv))if(!ex.includes(d.replace(/-/g,'')))n++}return n};
 const slugs=new Set();for(const x of C.calendars(data)){const rows=C.select(data.lessons,x),t=C.ics(rows,C.defaults,x,{stamp:'20260901T000000Z'});assert.equal(expand(t),C.occurrences(rows,C.defaults).length,C.label(x));assert(!slugs.has(C.slug(x)));slugs.add(C.slug(x));assert(/^[a-z0-9-]+$/.test(C.slug(x)))}
 const withSession={...C.defaults,sessionStart:'2026-12-14',sessionEnd:'2026-12-31'},rows=C.select(data.lessons,{mode:'student',group:'ДТ-12',sub:'ДТ-12/1'});assert.equal(expand(C.ics(rows,withSession,{mode:'student',group:'ДТ-12',sub:'ДТ-12/1'}).replace(/\d{8}T215959Z/g,'20261218T215959Z')),C.occurrences(rows,withSession).length);
 console.log('PASS: '+slugs.size+' calendar subscriptions match semester occurrences, unique slugs, session exclusion')}
require('child_process').execFileSync(process.execPath,[require('path').join(__dirname,'scripts/build_calendars.cjs'),'--check'],{stdio:'inherit'});
{const again=C.normalize(JSON.parse(JSON.stringify(C.pack(data))));const J=JSON.stringify;assert.equal(J(again.lessons),J(data.lessons));assert.equal(J(again.groups),J(C.groups(data)));assert.equal(J(again.institutes),J(data.institutes));console.log('PASS: compact schedule format round-trips ('+data.lessons.length+' lessons)')}
