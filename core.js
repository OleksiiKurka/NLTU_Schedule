(function(root){
// Графік навчального процесу 2026/2027 (наказ НЛТУ №120 від 25.05.2026): модулі 12.10–25.10 і 07.12–20.12, семестровий контроль 21.12–31.12.
const defaults={start:'2026-09-01',end:'2026-12-18',moduleStart:'2026-10-12',moduleEnd:'2026-10-25',module2Start:'2026-12-07',module2End:'2026-12-20',sessionStart:'2026-12-21',sessionEnd:'2026-12-31',firstParity:'н'};
Object.assign(defaults,(root.APP_CONFIG&&root.APP_CONFIG.calendar)||{});
const date=s=>new Date(s+'T12:00:00Z'), iso=d=>d.toISOString().slice(0,10);
function monday(s){let d=date(s);d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return iso(d)}
function add(s,n){let d=date(s);d.setUTCDate(d.getUTCDate()+n);return iso(d)}
function parity(s,c){const n=Math.floor((date(monday(s))-date(monday(c.start)))/604800000);return ((n%2)+2)%2===0?c.firstParity:(c.firstParity==='н'?'п':'н')}
function merge(rows){let map=new Map();for(const r of rows){const k=[r.day,r.slot,r.subject,r.type,r.teachers.join(','),r.room,r.building].join('|');if(!map.has(k))map.set(k,{...r,groups:[],parities:[],sources:[]});const x=map.get(k);if(!x.groups.includes(r.group))x.groups.push(r.group);if(!x.parities.includes(r.parity))x.parities.push(r.parity);if(!x.sources.includes(r.id))x.sources.push(r.id)}return [...map.values()].sort((a,b)=>a.day-b.day||a.slot-b.slot)}
function students(text){return text.split(/[,\n]+/).map(x=>x.trim()).filter(Boolean).map(x=>{const m=x.match(/^(\d+)\s+(.+)$/);return {name:m?m[2]:x,subgroup:m?m[1]:''}})}
function occurrences(rows,c){let result=[];for(let d=c.start;d<=c.end;d=add(d,1)){if(d>=c.sessionStart&&d<=c.sessionEnd)continue;let day=(date(d).getUTCDay()+6)%7;for(let r of merge(rows.filter(x=>x.day===day&&x.parity===parity(d,c))))result.push({...r,date:d,key:d+'|'+r.slot+'|'+r.type+'|'+r.groups.join(',')})}return result}
function eligible(student,lesson){return !student.subgroup||lesson.groups.some(g=>!g.includes('/')||g.split('/')[1].replace(/м$/,'')===student.subgroup)}
function distribute(total,n,random=Math.random){if(!n)return [];let weights=Array.from({length:n},()=>.3+random()),sum=weights.reduce((a,b)=>a+b,0),raw=weights.map(x=>total*x/sum),v=raw.map(Math.floor),left=total-v.reduce((a,b)=>a+b,0);raw.map((x,i)=>({i,f:x-v[i]})).sort((a,b)=>b.f-a.f).slice(0,left).forEach(x=>v[x.i]++);return v}
function distributeBounded(total,n,min=1,max=5,random=Math.random){
 if(!Number.isInteger(total)||!Number.isInteger(n)||n<1||!Number.isInteger(min)||min<0||min>max||total<n*min||total>n*max)throw new RangeError(`Для ${n} занять сума має бути від ${n*min} до ${n*max}`);
 const values=Array(n).fill(min);for(let left=total-n*min;left>0;left--){const available=values.map((v,i)=>v<max?i:-1).filter(i=>i>=0);values[available[Math.min(available.length-1,Math.floor(random()*available.length))]]++}return values;
}
function select(lessons,x){return lessons.filter(l=>x.mode==='teacher'?l.teachers.includes(x.teacher):(l.group.split('/')[0]===x.group&&(!x.sub||x.sub==='all'||l.group===x.sub||!l.group.includes('/'))))}
function label(x){return x.mode==='teacher'?x.teacher:x.group+(x.sub&&x.sub!=='all'?' · підгрупа '+x.sub.split('/')[1]:'')}
function hash(s){let h=5381;for(const ch of s)h=(h*33^ch.codePointAt(0))>>>0;return h.toString(36)}
const TR={а:'a',б:'b',в:'v',г:'h',ґ:'g',д:'d',е:'e',є:'ie',ж:'zh',з:'z',и:'y',і:'i',ї:'i',й:'i',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ь:'',ю:'iu',я:'ia',ы:'y',э:'e',ё:'io',ъ:''};
function slug(x){const id=x.mode==='teacher'?'t:'+x.teacher:'g:'+(x.sub&&x.sub!=='all'?x.sub:x.group),t=[...id.slice(2).toLowerCase()].map(c=>TR[c]??c).join('').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');return (x.mode==='teacher'?'t-':'g-')+t+'-'+hash(id).slice(-5)}
const VTZ=['BEGIN:VTIMEZONE','TZID:Europe/Kyiv','BEGIN:DAYLIGHT','TZOFFSETFROM:+0200','TZOFFSETTO:+0300','TZNAME:EEST','DTSTART:19700329T030000','RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU','END:DAYLIGHT','BEGIN:STANDARD','TZOFFSETFROM:+0300','TZOFFSETTO:+0200','TZNAME:EET','DTSTART:19701025T040000','RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU','END:STANDARD','END:VTIMEZONE'];
const TYPES={lecture:'Лекція',lab:'Лабораторна',practice:'Практична'};
// Recurring calendar: one VEVENT per lesson (weekly, or every 2 weeks for чисельник/знаменник), session dates excluded.
function ics(rows,c,x,opts={}){
 const q=t=>String(t).replace(/[\;,]/g,'\\$&').replace(/\r?\n/g,'\\n'),b=s=>s.replace(/-/g,''),dt=(d,t)=>{const [h,m]=t.split(':');return b(d)+'T'+h.padStart(2,'0')+m+'00'},stamp=opts.stamp||new Date().toISOString().replace(/[-:]|\.\d+/g,''),key=l=>[l.day,l.slot,l.subject,l.type,l.teachers.join(','),l.room,l.building,l.groups.join(',')].join('|');
 const first=(day,p)=>{for(let d=c.start,i=0;i<21&&d<=c.end;d=add(d,1),i++)if((date(d).getUTCDay()+6)%7===day&&(!p||parity(d,c)===p))return d;return null};
 const by={н:new Map(),п:new Map()};for(const p of ['н','п'])for(const l of merge(rows.filter(r=>r.parity===p)))by[p].set(key(l),l);
 const ev=[];for(const [k,l] of by['н'])if(by['п'].has(k)){ev.push({l,p:'',k});by['п'].delete(k)}else ev.push({l,p:'н',k});for(const [k,l] of by['п'])ev.push({l,p:'п',k});
 ev.sort((a,b)=>a.l.day-b.l.day||a.l.slot-b.l.slot||a.p.localeCompare(b.p));
 const fold=l=>{let out='',n=0;for(const ch of l){const w=typeof Buffer!=='undefined'?Buffer.byteLength(ch):new TextEncoder().encode(ch).length;if(n+w>74){out+='\r\n ';n=1}out+=ch;n+=w}return out};
 const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//NLTU//Schedule//UK','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:'+q('НЛТУ · '+label(x)),'X-WR-TIMEZONE:Europe/Kyiv','REFRESH-INTERVAL;VALUE=DURATION:PT6H','X-PUBLISHED-TTL:PT6H',...VTZ];
 for(const {l,p,k} of ev){const d0=first(l.day,p);if(!d0)continue;const [a,e]=l.time.split(/\s*-\s*/),step=p?14:7,ex=[];for(let d=d0;d<=c.end;d=add(d,step))if(d>=c.sessionStart&&d<=c.sessionEnd)ex.push(d);
  L.push('BEGIN:VEVENT','UID:'+hash(slug(x)+'|'+k+'|'+p)+'-'+l.day+l.slot+'@nltu-schedule','DTSTAMP:'+stamp,'DTSTART;TZID=Europe/Kyiv:'+dt(d0,a),'DTEND;TZID=Europe/Kyiv:'+dt(d0,e),'RRULE:FREQ=WEEKLY;INTERVAL='+(p?2:1)+';UNTIL='+b(c.end)+'T215959Z');
  if(ex.length)L.push('EXDATE;TZID=Europe/Kyiv:'+ex.map(d=>dt(d,a)).join(','));
  L.push('SUMMARY:'+q(l.subject+(opts.types===false?'':' ('+TYPES[l.type]+')')));if(l.room)L.push('LOCATION:'+q('ауд. '+l.room+(l.building?', корпус '+l.building:'')));
  L.push('DESCRIPTION:'+q((p?(p==='н'?'Чисельник':'Знаменник')+' (через тиждень)\n':'')+'Викладач: '+(l.teachers.join(', ')||'не вказано')+'\nГрупи: '+l.groups.join(', ')),'END:VEVENT')}
 L.push('END:VCALENDAR');return L.map(fold).join('\r\n')+'\r\n'}
function calendars(SCHEDULE){const out=[],bases=[...new Set(SCHEDULE.groups.map(g=>g.base))];for(const g of bases)out.push({mode:'student',group:g,sub:'all'});for(const g of SCHEDULE.groups)if(g.id.includes('/'))out.push({mode:'student',group:g.base,sub:g.id});for(const t of [...new Set(SCHEDULE.lessons.flatMap(l=>l.teachers))].sort())out.push({mode:'teacher',teacher:t});return out}
const api={select,label,hash,slug,ics,calendars,distributeBounded,defaults,date,iso,monday,add,parity,merge,students,occurrences,eligible,distribute};root.Core=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
