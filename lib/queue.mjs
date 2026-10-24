export class QueueActionError extends Error {constructor(message){super(message);this.name='QueueActionError'}}
import {extendedDepartments} from '../src/data/departments.mjs';
export const departments=extendedDepartments.map(d=>({...d,name:d.labels.en}));
export function initialState(now=Date.now()) {
 const people=[['A-021','Isha','called'],['A-022','Aarav','waiting'],['A-023','Meera','waiting'],['A-025','Rohan','waiting'],['A-024','Demo visitor','waiting']];
 return {schemaVersion:2,speed:1,revision:0,patients:people.map(([id,name,status],i)=>({id,name,status,department:'general',priority:0,created:now-(6-i)*60000,calledAt:status==='called'?now-120000:null})),doctors:Object.fromEntries(departments.map(d=>[d.id,{status:'available',average:d.average,samples:[d.average],delayMinutes:0,breakUntil:null}])),counters:Object.fromEntries(departments.map(d=>[d.id,d.id==='general'?25:0])),flags:[],audit:[],feedback:[],created:now};
}
export function ordered(state,department,now=Date.now()) {
 return state.patients.filter(p=>p.status==='waiting'&&(!department||p.department===department)).sort((a,b)=>{
 const score=p=>p.priority===2?10000:p.priority*20+Math.min(40,Math.max(0,(now-p.created)/60000)/15);
 return score(b)-score(a)||a.created-b.created||a.id.localeCompare(b.id);
 });
}
export function estimate(state,id) {
 const patient=state.patients.find(p=>p.id===id);if(!patient)return {ahead:0,min:0,max:0,paused:false};
 const doctor=state.doctors[patient.department];const ahead=Math.max(0,ordered(state,patient.department).findIndex(p=>p.id===id));
 const paused=doctor.status!=='available';const avg=doctor.samples.slice(-10).reduce((a,b)=>a+b,0)/Math.max(1,doctor.samples.slice(-10).length);const minutes=patient.status==='waiting'?ahead*avg+(paused?(doctor.delayMinutes??15):0):0;
 return {ahead,min:Math.max(0,Math.round(minutes/5)*5),max:Math.max(0,Math.round(minutes/5)*5),paused};
}
export function applyAction(original,action,now=Date.now()) {
 if(!action||typeof action!=='object'||Array.isArray(action)||typeof action.type!=='string')throw new QueueActionError('Invalid action');
 const s=structuredClone(original); const d=departments.find(x=>x.id===action.department);
 const log=(text)=>s.audit.unshift({id:crypto.randomUUID(),at:now,text});
 const recordConsultation=p=>{const sample=Math.min(60,Math.max(1,(now-p.calledAt)/60000));const doc=s.doctors[p.department];doc.samples=[...doc.samples,sample].slice(-10);doc.average=doc.samples.reduce((a,b)=>a+b,0)/doc.samples.length};
 switch(action.type){
 case 'register': {
 if(!d||typeof action.name!=='string'||action.name.trim().length<2||action.name.trim().length>60||![0,1].includes(action.priority))throw new QueueActionError('Invalid registration');
 if(action.requestId&&s.patients.some(p=>p._requestId===action.requestId)){s.lastToken=s.patients.find(p=>p._requestId===action.requestId).id;return s}
 if(action.age!=null&&(!Number.isInteger(action.age)||action.age<0||action.age>120))throw new QueueActionError('Invalid age');
 const n=++s.counters[d.id];const id=d.prefix+'-'+String(n).padStart(3,'0');
 s.patients.push({id,name:action.name.trim().split(/\s+/)[0],age:action.age??null,gender:['female','male','other'].includes(action.gender)?action.gender:'other',_requestId:typeof action.requestId==='string'?action.requestId:null,department:d.id,priority:action.priority,status:'waiting',created:now,calledAt:null});log('Registered '+id);s.lastToken=id;break;}
 case 'call': {
 if(!d)throw new QueueActionError('Invalid department');if(s.doctors[d.id].status!=='available')throw new QueueActionError('Resume the doctor before calling');
 const next=ordered(s,d.id,now)[0];if(!next)throw new QueueActionError('No patients waiting');
 s.patients.filter(p=>p.department===d.id&&p.status==='called').forEach(p=>{recordConsultation(p);p.status='completed'});
 next.status='called';next.calledAt=now;log('Called '+next.id+' Â· Room '+d.room);break;}
 case 'doctor':if(!d||!['available','break','delayed'].includes(action.status))throw new QueueActionError('Invalid doctor status');if(action.delayMinutes!=null&&(!Number.isInteger(action.delayMinutes)||action.delayMinutes<0||action.delayMinutes>180))throw new QueueActionError('Invalid delay');s.doctors[d.id].status=action.status;s.doctors[d.id].delayMinutes=action.status==='available'?0:action.delayMinutes??15;s.doctors[d.id].breakUntil=action.status==='break'?now+s.doctors[d.id].delayMinutes*60000:null;log(d.doctor+' Â· '+action.status);break;
 case 'skip':case 'rejoin':case 'complete': {
 const p=s.patients.find(p=>p.id===action.token);if(!p)throw new QueueActionError('Unknown token');
 if(action.type==='skip'&&!['waiting','called'].includes(p.status))throw new QueueActionError('Cannot skip this token');
 if(action.type==='rejoin'&&p.status!=='skipped')throw new QueueActionError('Only skipped tokens can rejoin');
 if(action.type==='complete'&&p.status!=='called')throw new QueueActionError('Only called tokens can complete');
 if(action.type==='complete')recordConsultation(p);
 p.status=action.type==='skip'?'skipped':action.type==='complete'?'completed':'waiting';if(action.type==='rejoin')p.created=now;log(action.type+' Â· '+p.id);break;}
 case 'flag':if(action.token!=null&&(typeof action.token!=='string'||!s.patients.some(p=>p.id===action.token)))throw new QueueActionError('Invalid assistance token');if(s.flags.some(f=>f.status==='pending'))throw new QueueActionError('A staff review request is already pending');s.flags.unshift({id:crypto.randomUUID(),token:action.token||null,status:'pending',at:now});log('Immediate staff review requested');break;
 case 'acknowledge':{const flag=s.flags.find(f=>f.id===action.id);if(!flag||flag.status!=='pending')throw new QueueActionError('Request already reviewed');flag.status='reviewed';log('Staff acknowledged assistance request');break;}
 case 'end':case 'transfer':{const p=s.patients.find(p=>p.id===action.token);if(!p||!['waiting','skipped'].includes(p.status))throw new QueueActionError('Invalid waiting token');if(action.type==='transfer'){if(!d)throw new QueueActionError('Invalid department');p.department=d.id}p.status='waiting';p.created=now;log(action.type+' · '+p.id);break;}
 case 'demo-add':{for(let i=0;i<20;i++){const dep=departments[i%departments.length],id=dep.prefix+'-'+String(++s.counters[dep.id]).padStart(3,'0');s.patients.push({id,name:'Demo '+(i+1),department:dep.id,priority:0,status:'waiting',created:now+i})}log('Added 20 fictional patients');break;}
 case 'demo-speed':if(![1,10].includes(action.speed))throw new QueueActionError('Invalid demo speed');s.speed=action.speed;log('Demo speed '+action.speed);break;
 case 'demo-reset':{const reset=initialState(now);reset.revision=s.revision+1;reset._staffSessions=s._staffSessions;return reset;}
 case 'feedback':if(![1,2,3,4,5].includes(action.rating))throw new QueueActionError('Invalid rating');s.feedback.push({rating:action.rating,at:now});log('Visit feedback recorded');break;
 default:throw new QueueActionError('Unsupported action');
 }
 s.revision++;s.audit=s.audit.slice(0,100);return s;
}
// Distances are graph weights for the fictional demo building, in metres.
export function findRoute(floor=1,avoidStairs=true,destination='Consultation room') {
 if(![0,1,2].includes(floor))throw new QueueActionError('Invalid floor');
 const edges={Entrance:[['Reception',12]],Reception:[['Ground corridor',9],['Lift',20],['Stairs',10]],'Ground corridor':[['Pharmacy',10],['Emergency desk',8],['Washroom',6]],Lift:[['Floor 1',15],['Floor 2',24]],Stairs:[['Floor 1',22],['Floor 2',44]],'Floor 1':[['Consultation room',18],['Laboratory',12]],'Floor 2':[['Consultation room',18]]};
 const target=floor===0?(destination==='Consultation room'?'Reception':destination):destination==='Laboratory'?'Laboratory':'Consultation room';
 if(floor>0){edges.Lift=edges.Lift.filter(x=>x[0]===`Floor ${floor}`);edges.Stairs=edges.Stairs.filter(x=>x[0]===`Floor ${floor}`)}
 const distance={Entrance:0},previous={},todo=['Entrance'];
 while(todo.length){todo.sort((a,b)=>distance[a]-distance[b]);const u=todo.shift();for(const [v,w] of edges[u]||[]){if(avoidStairs&&v==='Stairs')continue;const n=distance[u]+w;if(n<(distance[v]??Infinity)){distance[v]=n;previous[v]=u;todo.push(v)}}}
 if(!Number.isFinite(distance[target]))return {path:[],distance:0};const path=[];let p=target;while(p){path.unshift(p);p=previous[p]}return {path,distance:distance[target]};
}


export function upgradeState(input){const s=structuredClone(input);s.schemaVersion=2;s.speed??=1;for(const d of departments){s.doctors[d.id]??={status:'available',average:d.average,samples:[d.average],delayMinutes:0,breakUntil:null};s.counters[d.id]??=0;s.doctors[d.id].delayMinutes??=s.doctors[d.id].status==='available'?0:15}return s}

