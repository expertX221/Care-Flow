export const departments = [
 {id:'general',name:'General Medicine',doctor:'Dr. Ananya Sharma',room:'204',floor:1,prefix:'A',average:6},
 {id:'cardio',name:'Cardiology',doctor:'Dr. Arjun Menon',room:'205',floor:1,prefix:'B',average:8},
 {id:'ortho',name:'Orthopaedics',doctor:'Dr. Kavya Rao',room:'302',floor:2,prefix:'C',average:7},
 {id:'pediatric',name:'Paediatrics',doctor:'Dr. Neha Nair',room:'203',floor:1,prefix:'D',average:5}
];
export function initialState(now=Date.now()) {
 const people=[['A-021','Isha','called'],['A-022','Aarav','waiting'],['A-023','Meera','waiting'],['A-025','Rohan','waiting'],['A-024','Demo visitor','waiting']];
 return {revision:0,patients:people.map(([id,name,status],i)=>({id,name,status,department:'general',priority:0,created:now-(6-i)*60000,calledAt:status==='called'?now-120000:null})),doctors:Object.fromEntries(departments.map(d=>[d.id,{status:'available',average:d.average,samples:[d.average]}])),counters:{general:25,cardio:0,ortho:0,pediatric:0},flags:[],audit:[],feedback:[],created:now};
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
 const paused=doctor.status!=='available';const minutes=patient.status==='waiting'?ahead*doctor.average+(paused?15:0):0;
 return {ahead,min:Math.max(0,Math.round(minutes)),max:Math.max(0,Math.round(minutes*1.25+ (minutes?1:0))),paused};
}
export function applyAction(original,action,now=Date.now()) {
 const s=structuredClone(original); const d=departments.find(x=>x.id===action.department);
 const log=(text)=>s.audit.unshift({id:crypto.randomUUID(),at:now,text});
 switch(action.type){
 case 'register': {
 if(!d||typeof action.name!=='string'||action.name.trim().length<2||action.name.trim().length>60||![0,1].includes(action.priority))throw Error('Invalid registration');
 const n=++s.counters[d.id];const id=d.prefix+'-'+String(n).padStart(3,'0');
 s.patients.push({id,name:action.name.trim(),department:d.id,priority:action.priority,status:'waiting',created:now,calledAt:null});log('Registered '+id);s.lastToken=id;break;}
 case 'call': {
 if(!d)throw Error('Invalid department');if(s.doctors[d.id].status!=='available')throw Error('Resume the doctor before calling');
 const next=ordered(s,d.id,now)[0];if(!next)throw Error('No patients waiting');
 s.patients.filter(p=>p.department===d.id&&p.status==='called').forEach(p=>{p.status='completed';const sample=Math.min(60,Math.max(1,(now-p.calledAt)/60000));const doc=s.doctors[d.id];doc.average=0.3*sample+0.7*doc.average;doc.samples=[...doc.samples,sample].slice(-20)});
 next.status='called';next.calledAt=now;log('Called '+next.id+' · Room '+d.room);break;}
 case 'doctor':if(!d||!['available','break','delayed'].includes(action.status))throw Error('Invalid doctor status');s.doctors[d.id].status=action.status;log(d.doctor+' · '+action.status);break;
 case 'skip':case 'rejoin':case 'complete': {
 const p=s.patients.find(p=>p.id===action.token);if(!p)throw Error('Unknown token');
 if(action.type==='skip'&&!['waiting','called'].includes(p.status))throw Error('Cannot skip this token');
 if(action.type==='rejoin'&&p.status!=='skipped')throw Error('Only skipped tokens can rejoin');
 if(action.type==='complete'&&p.status!=='called')throw Error('Only called tokens can complete');
 p.status=action.type==='skip'?'skipped':action.type==='complete'?'completed':'waiting';if(action.type==='rejoin')p.created=now;log(action.type+' · '+p.id);break;}
 case 'flag':if(s.flags.some(f=>f.status==='pending'))throw Error('A staff review request is already pending');s.flags.unshift({id:crypto.randomUUID(),token:action.token||null,status:'pending',at:now});log('Immediate staff review requested');break;
 case 'acknowledge':{const flag=s.flags.find(f=>f.id===action.id);if(!flag||flag.status!=='pending')throw Error('Request already reviewed');flag.status='reviewed';log('Staff acknowledged assistance request');break;}
 case 'feedback':if(![1,2,3,4,5].includes(action.rating))throw Error('Invalid rating');s.feedback.push({rating:action.rating,at:now});log('Visit feedback recorded');break;
 default:throw Error('Unsupported action');
 }
 s.revision++;s.audit=s.audit.slice(0,100);return s;
}
// Distances are graph weights for the fictional demo building, in metres.
export function findRoute(floor=1,avoidStairs=true,destination='Consultation room') {
 if(![0,1,2].includes(floor))throw Error('Invalid floor');
 const edges={Entrance:[['Reception',12]],Reception:[['Ground corridor',9],['Lift',20],['Stairs',10]],'Ground corridor':[['Pharmacy',10],['Emergency desk',8],['Washroom',6]],Lift:[['Floor 1',15],['Floor 2',24]],Stairs:[['Floor 1',22],['Floor 2',44]],'Floor 1':[['Consultation room',18],['Laboratory',12]],'Floor 2':[['Consultation room',18]]};
 const target=floor===0?(destination==='Consultation room'?'Reception':destination):destination==='Laboratory'?'Laboratory':'Consultation room';
 if(floor>0){edges.Lift=edges.Lift.filter(x=>x[0]===`Floor ${floor}`);edges.Stairs=edges.Stairs.filter(x=>x[0]===`Floor ${floor}`)}
 const distance={Entrance:0},previous={},todo=['Entrance'];
 while(todo.length){todo.sort((a,b)=>distance[a]-distance[b]);const u=todo.shift();for(const [v,w] of edges[u]||[]){if(avoidStairs&&v==='Stairs')continue;const n=distance[u]+w;if(n<(distance[v]??Infinity)){distance[v]=n;previous[v]=u;todo.push(v)}}}
 if(!Number.isFinite(distance[target]))return {path:[],distance:0};const path=[];let p=target;while(p){path.unshift(p);p=previous[p]}return {path,distance:distance[target]};
}

