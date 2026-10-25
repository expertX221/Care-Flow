import test from 'node:test';
import assert from 'node:assert/strict';
import {applyAction,initialState,ordered,QueueActionError} from '../lib/queue.mjs';
import {normalizeRoomInvite,sharedRoomUrl} from '../lib/shared-room.mjs';
const room='1a2b3c4d-1111-4111-8111-123456789abc',t=1700000000000;
test('staff can add exactly four fictional General Medicine visitors in A101',()=>{
 const before=initialState(t);const after=applyAction(before,{type:'demo-add-room',department:'general'},t+5);
 assert.equal(after.revision,before.revision+1);
 assert.equal(after.patients.length,before.patients.length+4);
 assert.equal(after.counters.general,29);
 assert.deepEqual(after.patients.slice(-4).map(p=>p.id),['A-026','A-027','A-028','A-029']);
 assert(after.patients.slice(-4).every(p=>p.department==='general'&&p.status==='waiting'&&p.name.startsWith('Demo A101')));
 assert.equal(ordered(after,'general',t+6).length,ordered(before,'general',t+6).length+4);
 assert.equal(before.patients.length,5);
});
test('four-person demo action is rejected with an unknown department',()=>{
 assert.throws(()=>applyAction(initialState(t),{type:'demo-add-room',department:'invalid'},t),QueueActionError);
});
test('same invitation link opens same room for patient, staff and board',()=>{
 for(const view of ['patient','staff','board']){const url=sharedRoomUrl('https://care-flow-kappa.vercel.app',room,view);
  assert.equal(normalizeRoomInvite(url),room);assert.equal(new URL(url).searchParams.get('view'),view);
  assert(!url.includes('token=')&&!url.includes('access='));
 }
 assert.equal(normalizeRoomInvite(room.toUpperCase()),room);
});
test('invalid or malicious input cannot switch shared demo sessions',()=>{
 for(const val of ['',null,'not-a-room','javascript:alert(1)','https://foo.test/?room=nope'])assert.equal(normalizeRoomInvite(val),'');
 assert.throws(()=>sharedRoomUrl('https://care-flow-kappa.vercel.app','not-a-room'));
 assert.throws(()=>sharedRoomUrl('https://care-flow-kappa.vercel.app',room,'admin'));
});
