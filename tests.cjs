const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),C=require('./core.js');
let ctx={window:{}};vm.runInNewContext(fs.readFileSync('data/schedule.js','utf8'),ctx);let data=ctx.window.SCHEDULE;
assert.equal(data.groups.length,62);assert.equal(new Set(data.lessons.map(x=>x.sheet)).size,6);
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
