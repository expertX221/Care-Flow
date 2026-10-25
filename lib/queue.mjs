export class QueueActionError extends Error {constructor(message){super(message);this.name='QueueActionError'}}

import {RESPONSE_WINDOW_MS} from './local-workflow.mjs';
import {displayName} from './display-name.mjs';
import {forecastQueue} from './upgrade-insights.mjs';
import {extendedDepartments} from '../src/data/departments.mjs';

export const departments=extendedDepartments.map(d=>({...d,name:d.labels.en}));

export function initialState(now=Date.now()) {

 const people=[['A-021','Isha','called'],['A-022','Aarav','waiting'],['A-023','Meera','waiting'],['A-025','Rohan','waiting'],['A-024','Demo visitor','waiting']];

 return {schemaVersion:2,facilities:{liftAvailable:true},speed:1,revision:0,patients:people.map(([id,name,status],i)=>({id,name,status,department:'general',priority:0,created:now-(6-i)*60000,calledAt:status==='called'?now-120000:null,callSequence:status==='called'?1:0,callDeadline:status==='called'?now+180000:null})),doctors:Object.fromEntries(departments.map(d=>[d.id,{status:'available',average:d.average,samples:[d.average],delayMinutes:0,breakUntil:null}])),counters:Object.fromEntries(departments.map(d=>[d.id,d.id==='general'?25:0])),flags:[],audit:[],feedback:[],created:now};

}

export function ordered(state,department,now=Date.now()) {

 return state.patients.filter(p=>p.status==='waiting'&&(!department||p.department===department)).sort((a,b)=>{

 const score=p=>p.priority===2?10000:p.priority*30+Math.min(120,Math.max(0,(now-p.created)/60000));

 return score(b)-score(a)||a.created-b.created||a.id.localeCompare(b.id);

 });

}

export function liveQueuePosition(state,id,now=Date.now()) {
 const patient=state.patients.find(p=>p.id===id);
 if(!patient||patient.status!=='waiting')return {ahead:0,waitingAhead:0,currentlyServing:0,position:null,status:patient?.status||'unknown'};
 const waitingAhead=ordered(state,patient.department,now).findIndex(p=>p.id===id);
 if(waitingAhead<0)return {ahead:0,waitingAhead:0,currentlyServing:0,position:null,status:'unknown'};
 // A patient already called into consultation is still ahead until completed/skipped.
 const currentlyServing=state.patients.some(p=>p.department===patient.department&&p.status==='called')?1:0;
 const ahead=waitingAhead+currentlyServing;
 return {ahead,waitingAhead,currentlyServing,position:ahead+1,status:patient.status};
}
export function estimate(state,id) {

 const patient=state.patients.find(p=>p.id===id);if(!patient)return {ahead:0,min:0,max:0,paused:false,minutes:0,range:[0,0],confidence:"low",sampleCount:0};

 const doctor=state.doctors[patient.department];const ahead=liveQueuePosition(state,id).ahead;

 const paused=doctor.status==='break';const forecast=patient.status==='waiting'?forecastQueue({ahead,consultations:doctor.samples,onBreak:paused,delayMinutes:doctor.delayMinutes||0}):{minutes:0,range:[0,0],confidence:'low',sampleCount:0};
 return {ahead,min:forecast.range[0],max:forecast.range[1],paused,...forecast};

}

export function applyAction(original,action,now=Date.now()) {

 if(!action||typeof action!=='object'||Array.isArray(action)||typeof action.type!=='string')throw new QueueActionError('Invalid action');

 const s=structuredClone(original); const d=departments.find(x=>x.id===action.department);

 const log=(text)=>{s.audit.unshift({id:crypto.randomUUID(),at:now,text});s.audit=s.audit.slice(0,200)};

 const recordConsultation=p=>{const elapsed=(now-p.calledAt)/60000;if(!Number.isFinite(elapsed)||elapsed<0.5)return;const sample=Math.min(60,elapsed);const doc=s.doctors[p.department];doc.samples=[...doc.samples,sample].slice(-10);doc.average=doc.samples.reduce((a,b)=>a+b,0)/doc.samples.length};

 switch(action.type){

 case 'register': {

 if(!d||typeof action.name!=='string'||action.name.trim().length<2||action.name.trim().length>60||![0,1].includes(action.priority))throw new QueueActionError('Invalid registration');

 if(action.requestId!=null&&(typeof action.requestId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(action.requestId)))throw new QueueActionError('Invalid registration request ID');
 if(action.requestId&&s.patients.some(p=>p._requestId===action.requestId)){s.lastToken=s.patients.find(p=>p._requestId===action.requestId).id;return s}

 if(action.age!=null&&(!Number.isInteger(action.age)||action.age<0||action.age>120))throw new QueueActionError('Invalid age');

 const n=++s.counters[d.id];const id=d.prefix+'-'+String(n).padStart(3,'0');

 s.patients.push({id,name:displayName(action.name),age:action.age??null,gender:['female','male','other'].includes(action.gender)?action.gender:'not-stated',_requestId:typeof action.requestId==='string'?action.requestId:null,department:d.id,priority:action.priority,status:'waiting',created:now,calledAt:null});log('Registered '+id);s.lastToken=id;break;}

 case 'call': {

 if(!d)throw new QueueActionError('Invalid department');if(s.doctors[d.id].status==='break')throw new QueueActionError('Resume the doctor before calling');

 // A staff member may call a specific waiting ticket instead of the next automatic ticket.
 // Do not silently finish a different active consultation when selecting a ticket.
 const waiting=ordered(s,d.id,now);
 const next=action.token===undefined?waiting[0]:waiting.find(p=>p.id===action.token);
 if(!next)throw new QueueActionError(action.token===undefined?'No patients waiting':'Token is not waiting in this department');
 if(action.token!==undefined&&s.patients.some(p=>p.department===d.id&&p.status==='called'))throw new QueueActionError('Complete the current consultation before calling a specific token');

 s.patients.filter(p=>p.department===d.id&&p.status==='called').forEach(p=>{recordConsultation(p);p.status='completed'});

 next.status='called';next.calledAt=now;next.callDeadline=now+RESPONSE_WINDOW_MS;next.callSequence=(next.callSequence||0)+1;log('Called '+next.id+' · Room '+d.room);break;}

 case 'recall':{const p=s.patients.find(p=>p.id===action.token&&p.status==='called');if(!p)throw new QueueActionError('Only called visits can be recalled');p.callSequence=(p.callSequence||0)+1;p.callDeadline=now+RESPONSE_WINDOW_MS;log('Recalled '+p.id);break;}
 case 'facility':if(typeof action.liftAvailable!=='boolean')throw new QueueActionError('Invalid lift availability');s.facilities??={liftAvailable:true};s.facilities.liftAvailable=action.liftAvailable;log(action.liftAvailable?'Lift restored':'Lift out of service');break;
 case 'doctor':if(!d||!['available','break','delayed'].includes(action.status))throw new QueueActionError('Invalid doctor status');if(action.delayMinutes!=null&&(!Number.isInteger(action.delayMinutes)||action.delayMinutes<0||action.delayMinutes>180))throw new QueueActionError('Invalid delay');s.doctors[d.id].status=action.status;s.doctors[d.id].delayMinutes=action.status==='available'?0:action.delayMinutes??15;s.doctors[d.id].breakUntil=action.status==='break'?now+s.doctors[d.id].delayMinutes*60000:null;log(d.doctor+' · '+action.status);break;

 case 'skip':case 'rejoin':case 'complete': {

 const p=s.patients.find(p=>p.id===action.token);if(!p)throw new QueueActionError('Unknown token');

 if(action.type==='skip'&&!['waiting','called'].includes(p.status))throw new QueueActionError('Cannot skip this token');

 if(action.type==='rejoin'&&p.status!=='skipped')throw new QueueActionError('Only skipped tokens can rejoin');

 if(action.type==='complete'&&p.status!=='called')throw new QueueActionError('Only called tokens can complete');

 if(action.type==='complete')recordConsultation(p);

 p.status=action.type==='skip'?'skipped':action.type==='complete'?'completed':'waiting';if(action.type==='rejoin')p.created=now;log(action.type+' · '+p.id);break;}

 case 'flag':if(action.token!=null&&(typeof action.token!=='string'||!s.patients.some(p=>p.id===action.token)))throw new QueueActionError('Invalid assistance token');if(s.flags.some(f=>f.status==='pending'&&f.token===(action.token||null)))throw new QueueActionError('A staff review request is already pending');s.flags.unshift({id:crypto.randomUUID(),token:action.token||null,status:'pending',at:now});log('Immediate staff review requested');break;

 case 'acknowledge':{const flag=s.flags.find(f=>f.id===action.id);if(!flag||flag.status!=='pending')throw new QueueActionError('Request already reviewed');flag.status='reviewed';log('Staff acknowledged assistance request');break;}

 case 'end':case 'transfer':{
 const p=s.patients.find(p=>p.id===action.token);
 if(!p||!['waiting','skipped','called'].includes(p.status))throw new QueueActionError('Invalid active token');
 if(action.type==='transfer'){
  if(!d)throw new QueueActionError('Invalid department');
  p.department=d.id;
 }
 // Sending to the end or another department keeps the visit active; it is NOT completion.
 p.status='waiting';p.created=now;p.calledAt=null;
 log(action.type+' · '+p.id);break;
 }
 case 'reopen':{
 const p=s.patients.find(p=>p.id===action.token);
 if(!p||!['completed','cancelled'].includes(p.status))throw new QueueActionError('Only completed or removed visits can be reopened');
 // Staff explicitly confirms reopening in the UI. No new token and no patient data loss.
 p.status='waiting';p.created=now;p.calledAt=null;
 log('reopen · '+p.id);break;
 }

 case 'cancel':{
 const p=s.patients.find(p=>p.id===action.token);
 if(!p||!['waiting','skipped'].includes(p.status))throw new QueueActionError('Only waiting or no-show visits can be removed');
 p.status='cancelled';p.calledAt=null;
 log('Removed from active queue · '+p.id);break;
 }

 case 'demo-add-room':{
 // Four intentionally fictional patients share one OPD / consultation room.
 // This only changes the currently selected shared demo room's state.
 if(!d)throw new QueueActionError('Invalid demo department');
 for(let i=0;i<4;i++){
  const id=d.prefix+'-'+String(++s.counters[d.id]).padStart(3,'0');
  s.patients.push({id,name:'Demo '+d.room+' '+(i+1),department:d.id,priority:0,status:'waiting',created:now+i,calledAt:null});
 }
 log('Added 4 fictional visitors · Room '+d.room);break;
 }

 case 'demo-add':{for(let i=0;i<20;i++){const dep=departments[i%departments.length],id=dep.prefix+'-'+String(++s.counters[dep.id]).padStart(3,'0');s.patients.push({id,name:'Demo '+(i+1),department:dep.id,priority:0,status:'waiting',created:now+i})}log('Added 20 fictional patients');break;}

 case 'demo-speed':if(![1,10].includes(action.speed))throw new QueueActionError('Invalid demo speed');s.speed=action.speed;log('Demo speed '+action.speed);break;

 case 'demo-reset':{const reset=initialState(now);reset.revision=s.revision+1;reset._staffSessions=s._staffSessions;return reset;}

 case 'feedback':{if(![1,2,3,4,5].includes(action.rating))throw new QueueActionError('Invalid rating');const patient=s.patients.find(p=>p.id===action.token&&p.status==='completed');if(!patient)throw new QueueActionError('Feedback requires a completed visit');s.feedback=s.feedback.filter(f=>f.token!==patient.id);s.feedback.push({token:patient.id,department:patient.department,rating:action.rating,at:now});log('Visit feedback recorded');break;}

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





export function upgradeState(input){const s=structuredClone(input);s.schemaVersion=2;s.facilities??={liftAvailable:true};s.speed??=1;for(const d of departments){s.doctors[d.id]??={status:'available',average:d.average,samples:[d.average],delayMinutes:0,breakUntil:null};s.counters[d.id]??=0;s.doctors[d.id].delayMinutes??=s.doctors[d.id].status==='available'?0:15}return s}


