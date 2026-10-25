import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialState,applyAction,ordered,estimate,liveQueuePosition,findRoute} from '../lib/queue.mjs';
const now=1700000000000;
test('registration allocates unique sequential tokens and stays in its department',()=>{let s=initialState(now);for(let i=0;i<20;i++)s=applyAction(s,{type:'register',name:'Demo '+i,priority:0,department:'cardio'},now+i);assert.equal(new Set(s.patients.map(p=>p.id)).size,s.patients.length);assert.equal(ordered(s,'cardio',now).length,20);assert.equal(s.lastToken,'B-020')});
test('call advances one waiting token, completes previous consultation and updates EWMA',()=>{let s=initialState(now);s=applyAction(s,{type:'call',department:'general'},now+240000);assert.equal(s.patients.filter(p=>p.status==='called').length,1);assert.equal(s.patients.find(p=>p.id==='A-021').status,'completed');assert.equal(s.patients.find(p=>p.id==='A-022').status,'called');assert.ok(Math.abs(s.doctors.general.average-6)<1e-9);assert.equal(estimate(s,'A-024').ahead,3)});
test('break stops call-next and adds a wait allowance',()=>{const s=initialState(now);const before=estimate(s,'A-024').minutes;const paused=applyAction(s,{type:'doctor',department:'general',status:'break'},now);assert.equal(estimate(paused,'A-024').minutes,before+15);assert.throws(()=>applyAction(paused,{type:'call',department:'general'},now),/Resume/)});
test('step-away and rejoin place patient at end; invalid transitions fail',()=>{let s=initialState(now);s=applyAction(s,{type:'skip',token:'A-022'},now);s=applyAction(s,{type:'rejoin',token:'A-022'},now+1000);assert.equal(ordered(s,'general',now+1000).at(-1).id,'A-022');assert.throws(()=>applyAction(s,{type:'rejoin',token:'A-022'}),/Only skipped/)});
test('support priority respects aging and prevents prolonged starvation',()=>{let s=initialState(now);s=applyAction(s,{type:'register',name:'Support patient',department:'general',priority:1},now);assert.equal(ordered(s,'general',now)[0].name,'Support');s.patients.find(p=>p.id==='A-022').created=now-600*60000;assert.equal(ordered(s,'general',now)[0].id,'A-022')});
test('requesting assistance flags staff without declaring a clinical priority',()=>{let s=initialState(now);const before=ordered(s,'general',now).map(p=>p.id);s=applyAction(s,{type:'flag',token:'A-024'},now);assert.deepEqual(ordered(s,'general',now).map(p=>p.id),before);assert.equal(s.flags[0].status,'pending');assert.throws(()=>applyAction(s,{type:'flag',token:'A-024'},now),/already pending/);s=applyAction(s,{type:'acknowledge',id:s.flags[0].id},now);assert.equal(s.flags[0].status,'reviewed')});
test('Dijkstra reroutes without stairs; ground-floor facilities reachable',()=>{for(const floor of [1,2]){assert.ok(findRoute(floor,true).path.includes('Lift'));assert.ok(!findRoute(floor,true).path.includes('Stairs'));assert.ok(findRoute(floor,false).distance<=findRoute(floor,true).distance)}assert.deepEqual(findRoute(0,true,'Pharmacy').path,['Entrance','Reception','Ground corridor','Pharmacy']);assert.throws(()=>findRoute(7),/Invalid floor/)});
test('bad inputs cannot insert invalid names or emergency priority',()=>{const s=initialState(now);assert.throws(()=>applyAction(s,{type:'register',name:'x',department:'general',priority:0}),/Invalid/);assert.throws(()=>applyAction(s,{type:'register',name:'Valid',department:'general',priority:2}),/Invalid/);assert.throws(()=>applyAction(s,{type:'register',name:'Valid',department:'bad',priority:0}),/Invalid/)});


test('live count includes current consultation, and changes on staff actions',()=>{
 let s=initialState(now);
 assert.deepEqual(liveQueuePosition(s,'A-022',now),{ahead:1,waitingAhead:0,currentlyServing:1,position:2,status:'waiting'});
 assert.equal(liveQueuePosition(s,'A-024',now).ahead,4);
 s=applyAction(s,{type:'call',department:'general'},now+240000);
 assert.equal(liveQueuePosition(s,'A-022',now+240000).ahead,0);
 assert.equal(liveQueuePosition(s,'A-023',now+240000).ahead,1);
 s=applyAction(s,{type:'complete',token:'A-022'},now+300000);
 assert.equal(liveQueuePosition(s,'A-023',now+300000).ahead,0);
 s=applyAction(s,{type:'skip',token:'A-023'},now+301000);
 assert.equal(liveQueuePosition(s,'A-023',now+301000).position,null);
 assert.equal(liveQueuePosition(s,'A-025',now+301000).ahead,0);
});
test('live count stays within the right department and excludes completed/skipped patients',()=>{
 let s=initialState(now);
 s=applyAction(s,{type:'register',name:'Cardio guest',priority:0,department:'cardio'},now+1000);
 assert.equal(liveQueuePosition(s,'B-001',now+1000).ahead,0);
 assert.equal(liveQueuePosition(s,'MISSING').position,null);
 assert.equal(liveQueuePosition(s,'A-021',now).ahead,0);
 s=applyAction(s,{type:'skip',token:'A-022'},now+250000);
 assert.equal(liveQueuePosition(s,'A-023',now+250000).ahead,1);
});

test('send to end retains the visit and moves the ticket to the back of its queue',()=>{
 let s=initialState(now);const before=ordered(s,'general',now).map(p=>p.id);
 s=applyAction(s,{type:'end',token:'A-022'},now+10000);
 assert.equal(s.patients.find(p=>p.id==='A-022').status,'waiting');
 assert.equal(ordered(s,'general',now+10000).at(-1).id,'A-022');
 assert.equal(ordered(s,'general',now+10000).length,before.length);
});
test('only cryptographically random request IDs are accepted for registration replay',()=>{
 const id='123e4567-e89b-42d3-a456-426614174000';
 let s=initialState(now);s=applyAction(s,{type:'register',name:'Fictional visitor',department:'cardio',priority:0,requestId:id},now);
 const token=s.lastToken;
 s=applyAction(s,{type:'register',name:'Fictional visitor',department:'cardio',priority:0,requestId:id},now);
 assert.equal(s.lastToken,token);
 assert.equal(s.patients.filter(p=>p.id===token).length,1);
 for(const invalid of ['1','request','not-a-uuid'])assert.throws(()=>applyAction(s,{type:'register',name:'Fictional visitor',department:'cardio',priority:0,requestId:invalid},now),/Invalid registration request ID/);
});
