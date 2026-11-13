(function(root){
const defaults={start:'2026-09-01',end:'2026-12-18',moduleStart:'2026-10-19',moduleEnd:'2026-10-30',module2Start:'2026-12-07',module2End:'2026-12-18',sessionStart:'2026-12-21',sessionEnd:'2026-12-31',firstParity:'н'};
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
const api={distributeBounded,defaults,date,iso,monday,add,parity,merge,students,occurrences,eligible,distribute};root.Core=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
