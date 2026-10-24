import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,applyAction} from '../lib/queue.mjs';
import {ownVisit,visitDashboardAllowed,parseLoginCredentials} from '../lib/visit-entry.mjs';
test('new visitors never inherit a seeded token or see a dashboard',()=>{const s=initialState();assert.equal(ownVisit(s,''),null);assert.equal(ownVisit(s,'A-024'),null);assert.equal(visitDashboardAllowed(s,'A-024',true),false);assert.equal(visitDashboardAllowed(s,'',false),false)});
test('registered visits need explicit entry before personal dashboard opens',()=>{const s=applyAction(initialState(),{type:'register',name:'New Visitor',department:'eyes',priority:0});assert.equal(visitDashboardAllowed(s,s.lastToken,false),false);assert.equal(visitDashboardAllowed(s,s.lastToken,true),true);assert.equal(ownVisit(s,s.lastToken).name,'New');assert.equal(visitDashboardAllowed(s,'UNKNOWN',true),false)});
test('private visit codes identify the original room on another device',async()=>{const {parseVisitCode}=await import('../lib/visit-entry.mjs');const room='11111111-1111-4111-8111-111111111111';assert.deepEqual(parseVisitCode(room+':private-code','another-room'),{room,access:'private-code'});assert.deepEqual(parseVisitCode('secret',room),{room,access:'secret'});assert.throws(()=>parseVisitCode('invalid-room:secret',room))});

test('login must contain a token AND an explicitly supplied private OPD code',()=>{
 const room='11111111-1111-4111-8111-111111111111';
 assert.deepEqual(parseLoginCredentials(' a-026 ','private-secret',room),{token:'A-026',room,access:'private-secret'});
 assert.deepEqual(parseLoginCredentials('B-031',room+':private-secret','another-room'),{token:'B-031',room,access:'private-secret'});
 for(const [token,code] of [['','private-secret'],['A-026',''],['A-026',' '],['',''],['A-026',null],['not-a-token','private-secret']]){
  assert.throws(()=>parseLoginCredentials(token,code,room),`${JSON.stringify([token,code])} must not authorize login`);
 }
});
