import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,applyAction,ordered,QueueActionError} from '../lib/queue.mjs';
const now=1700000000000;
test('completed A-026 can be reopened and then called to its assigned room',()=>{
 let s=applyAction(initialState(now),{type:'register',name:'Sai',department:'general',priority:0},now);
 s=applyAction(s,{type:'end',token:'A-026'},now+1);
 assert.equal(s.patients.find(p=>p.id==='A-026').status,'waiting');
 s=applyAction(s,{type:'complete',token:'A-021'},now+2);
 s=applyAction(s,{type:'call',department:'general',token:'A-026'},now+3);
 assert.equal(s.patients.find(p=>p.id==='A-026').status,'called');
 s=applyAction(s,{type:'complete',token:'A-026'},now+4);
 s=applyAction(s,{type:'reopen',token:'A-026'},now+5);
 assert.equal(s.patients.find(p=>p.id==='A-026').status,'waiting');
 assert.equal(s.patients.find(p=>p.id==='A-026').calledAt,null);
 assert.equal(ordered(s,'general',now+5).at(-1).id,'A-026');
});
test('cannot bypass a currently serving patient to call an arbitrary ticket',()=>{
 const s=initialState(now);
 assert.throws(()=>applyAction(s,{type:'call',department:'general',token:'A-022'},now),/Complete the current consultation/);
 assert.throws(()=>applyAction(s,{type:'call',department:'general',token:'A-021'},now),/Token is not waiting/);
 assert.throws(()=>applyAction(s,{type:'call',department:'general',token:'B-001'},now),QueueActionError);
 const paused=applyAction(s,{type:'doctor',department:'general',status:'break'},now);
 assert.throws(()=>applyAction(paused,{type:'call',department:'general',token:'A-022'},now),/Resume/);
});
test('send to end requeues rather than completes and does not record consultation time',()=>{
 let s=initialState(now);const count=ordered(s,'general',now).length;
 s=applyAction(s,{type:'end',token:'A-022'},now+1000);
 assert.equal(s.patients.find(p=>p.id==='A-022').status,'waiting');
 assert.equal(ordered(s,'general',now+1000).at(-1).id,'A-022');
 assert.equal(ordered(s,'general',now+1000).length,count);
 s=applyAction(s,{type:'end',token:'A-021'},now+2000);
 assert.equal(s.patients.find(p=>p.id==='A-021').status,'waiting');
 assert.equal(s.patients.find(p=>p.id==='A-021').calledAt,null);
 assert.equal(s.doctors.general.samples.length,1);
});
test('reopen guards completed status and preserves the original patient token',()=>{
 let s=initialState(now);
 assert.throws(()=>applyAction(s,{type:'reopen',token:'A-022'},now),/Only completed/);
 s=applyAction(s,{type:'complete',token:'A-021'},now);
 s=applyAction(s,{type:'reopen',token:'A-021'},now+1);
 assert.equal(s.patients[0].id,'A-021');
 assert.equal(s.patients[0].department,'general');
 assert.equal(s.patients[0].status,'waiting');
 assert.throws(()=>applyAction(s,{type:'reopen',token:'A-021'},now+2),/Only completed/);
});
test('invalid transfer cannot mutate source queue',()=>{
 const s=initialState(now);const before=structuredClone(s);
 assert.throws(()=>applyAction(s,{type:'transfer',token:'A-022',department:'invalid'},now),/Invalid department/);
 assert.deepEqual(s,before);
 const m=applyAction(s,{type:'transfer',token:'A-022',department:'cardio'},now+1);
 assert.equal(m.patients.find(p=>p.id==='A-022').department,'cardio');
});
