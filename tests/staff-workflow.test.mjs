import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,applyAction,QueueActionError} from '../lib/queue.mjs';
import {STAFF_TABS,visitsForSection,staffSummary} from '../lib/staff-workflow.mjs';
const now=1700000000000;
test('staff sections are separate',()=>assert.deepEqual(STAFF_TABS,['overview','checkin','queue','appointments','history','activity']));
test('simultaneous check-ins receive distinct tokens and enter same waiting list',()=>{
 let s=initialState(now);for(let i=0;i<5;i++)s=applyAction(s,{type:'register',name:'Demo Visitor '+i,department:'general',priority:0},now+i);
 assert.deepEqual(s.patients.slice(-5).map(p=>p.id),['A-026','A-027','A-028','A-029','A-030']);
 assert.equal(visitsForSection(s.patients,'queue').length,10);
});
test('staff can remove without deleting and restore without changing tokens',()=>{
 let s=initialState(now);s=applyAction(s,{type:'cancel',token:'A-022'},now+100);
 assert.equal(s.patients.length,5);assert.equal(s.patients.find(p=>p.id==='A-022').status,'cancelled');
 assert(!visitsForSection(s.patients,'queue').some(p=>p.id==='A-022'));assert(visitsForSection(s.patients,'history').some(p=>p.id==='A-022'));
 assert.match(s.audit[0].text,/Removed from active queue/);
 s=applyAction(s,{type:'reopen',token:'A-022'},now+200);
 assert.equal(s.patients.find(p=>p.id==='A-022').status,'waiting');
});
test('cannot remove the current consultation',()=>assert.throws(()=>applyAction(initialState(now),{type:'cancel',token:'A-021'},now),QueueActionError));
test('queue and visit history are distinct and searchable',()=>{
 let s=initialState(now);s=applyAction(s,{type:'complete',token:'A-021'},now+1);s=applyAction(s,{type:'cancel',token:'A-022'},now+2);
 assert.deepEqual(visitsForSection(s.patients,'history').map(p=>p.id).sort(),['A-021','A-022']);
 assert.equal(staffSummary(s.patients).waiting,3);assert.equal(visitsForSection(s.patients,'queue','general','A-023').length,1);
});
