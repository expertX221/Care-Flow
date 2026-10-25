import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,applyAction,ordered,QueueActionError} from '../lib/queue.mjs';
const now=1700000000000;
test('previously completed A-026 can be reopened by staff then called into General Medicine room',()=>{
 let state=applyAction(initialState(now),{type:'register',name:'Sai',department:'general',priority:0},now);
 state=applyAction(state,{type:'end',token:'A-026'},now+1);
 assert.equal(state.patients.find(p=>p.id==='A-026').status,'waiting','send-to-end must not complete');
 state=applyAction(state,{type:'complete',token:'A-021'},now+2);
 state=applyAction(state,{type:'call',department:'general',token:'A-026'},now+3);
 assert.equal(state.patients.find(p=>p.id==='A-026').status,'called');
 assert.match(state.audit[0].text,/A-026/);
 state=applyAction(state,{type:'complete',token:'A-026'},now+3);
 assert.equal(state.patients.find(p=>p.id==='A-026').status,'completed');
 state=applyAction(state,{type:'reopen',token:'A-026'},now+4);
 assert.equal(state.patients.find(p=>p.id==='A-026').status,'waiting');
 assert.equal(state.patients.find(p=>p.id==='A-026').calledAt,null);
 assert.equal(ordered(state,'general',now+4).at(-1).id,'A-026');
});
test('specific-token call rejects absent tokens, other departments, skipped/completed and unavailable doctors',()=>{
 let s=initialState(now);
 for(const token of ['MISSING','A-021','B-001'])assert.throws(()=>applyAction(s,{type:'call',department:'general',token},now),QueueActionError);
 const paused=applyAction(s,{type:'doctor',department:'general',status:'break'},now);
 assert.throws(()=>applyAction(paused,{type:'call',department:'general',token:'A-022'},now),/Resume/);
 // Current consultation must be completed by staff explicitly before selecting a ticket.
 assert.throws(()=>applyAction(s,{type:'call',department:'general',token:'A-022'},now),/Complete the current consultation/);
});
test('reopen only works for completed patients and never changes their token or department',()=>{
 let s=initialState(now);
 assert.throws(()=>applyAction(s,{type:'reopen',token:'A-022'},now),/Only completed/);
 s=applyAction(s,{type:'complete',token:'A-021'},now);
 s=applyAction(s,{type:'reopen',token:'A-021'},now+1);
 assert.deepEqual({id:s.patients[0].id,department:s.patients[0].department,status:s.patients[0].status},{id:'A-021',department:'general',status:'waiting'});
 assert.throws(()=>applyAction(s,{type:'reopen',token:'A-021'},now+2),/Only completed/);
});
test('send-to-end on a called patient requeues them without recording a completed visit',()=>{
 const s=applyAction(initialState(now),{type:'end',token:'A-021'},now+500);
 assert.equal(s.patients.find(p=>p.id==='A-021').status,'waiting');
 assert.equal(s.patients.find(p=>p.id==='A-021').calledAt,null);
 assert.equal(s.doctors.general.samples.length,1);
});
test('transfers preserve the waiting status, and an invalid transfer does not mutate the input',()=>{
 const s=initialState(now);const before=structuredClone(s);
 assert.throws(()=>applyAction(s,{type:'transfer',token:'A-022',department:'invalid'},now),/Invalid department/);
 assert.deepEqual(s,before);
 const moved=applyAction(s,{type:'transfer',token:'A-022',department:'cardio'},now+1);
 assert.equal(moved.patients.find(p=>p.id==='A-022').status,'waiting');
 assert.equal(moved.patients.find(p=>p.id==='A-022').department,'cardio');
});
