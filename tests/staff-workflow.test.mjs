import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,applyAction,ordered,QueueActionError} from '../lib/queue.mjs';
import {STAFF_TABS,visitsForSection,staffSummary} from '../lib/staff-workflow.mjs';
const now=1700000000000;
test('staff actions are separated into six navigable sections',()=>{
 assert.deepEqual(STAFF_TABS,['overview','checkin','queue','appointments','history','activity']);
});
test('multiple check-ins receive distinct tokens and appear in active queue',()=>{
 let s=initialState(now);
 for(let i=0;i<5;i++)s=applyAction(s,{type:'register',name:'Demo Visitor '+i,department:'general',priority:0},now+i*1000);
 const registered=s.patients.slice(-5);
 assert.deepEqual(registered.map(p=>p.id),['A-026','A-027','A-028','A-029','A-030']);
 assert.equal(new Set(registered.map(p=>p.id)).size,5);
 assert(registered.every(p=>p.status==='waiting'));
 assert.equal(visitsForSection(s.patients,'queue').length,10);
});
test('removing a waiting visit never deletes patient identity or audit and is reversible',()=>{
 let s=initialState(now);
 const patient=s.patients.find(p=>p.id==='A-022');
 s=applyAction(s,{type:'cancel',token:patient.id},now+100);
 assert.equal(s.patients.length,5);
 assert.equal(s.patients.find(p=>p.id===patient.id).status,'cancelled');
 assert.equal(visitsForSection(s.patients,'queue').some(p=>p.id===patient.id),false);
 assert.equal(visitsForSection(s.patients,'history').some(p=>p.id===patient.id),true);
 assert.match(s.audit[0].text,/Removed from active queue/);
 s=applyAction(s,{type:'reopen',token:patient.id},now+200);
 assert.equal(s.patients.find(p=>p.id===patient.id).status,'waiting');
 assert(visitsForSection(s.patients,'queue').some(p=>p.id===patient.id));
});
test('in-progress consultation cannot be silently cancelled or reopened',()=>{
 const s=initialState(now);
 assert.throws(()=>applyAction(s,{type:'cancel',token:'A-021'},now),QueueActionError);
 assert.throws(()=>applyAction(s,{type:'reopen',token:'A-022'},now),QueueActionError);
});
test('active queue filters out completed and removed and supports token search',()=>{
 let s=initialState(now);
 s=applyAction(s,{type:'complete',token:'A-021'},now+1);
 s=applyAction(s,{type:'cancel',token:'A-022'},now+2);
 assert.deepEqual(visitsForSection(s.patients,'history').map(p=>p.id).sort(),['A-021','A-022']);
 assert.equal(staffSummary(s.patients).waiting,3);
 assert.equal(visitsForSection(s.patients,'queue','general','A-023').length,1);
 assert.equal(visitsForSection(s.patients,'queue','cardio').length,0);
});
test('activity log retains recent entries and is bounded to avoid uncontrolled state growth',()=>{
 let s=initialState(now);
 for(let i=0;i<212;i++)s=applyAction(s,{type:'doctor',department:'general',status:i%2?'break':'available'},now+i);
 assert.equal(s.audit.length,100);
});
