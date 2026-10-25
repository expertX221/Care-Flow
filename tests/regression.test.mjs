import {test} from 'node:test';import assert from 'node:assert/strict';
import {initialState,applyAction,findRoute} from '../lib/queue.mjs';
import {restoreVisit,storageGet,storageSet,shouldAlertThree,readPendingRegistrations} from '../lib/client-state.mjs';
const now=1700000000000;
test('malformed actions fail before mutation',()=>{for(const input of [null,[],1,'call',{}])assert.throws(()=>applyAction(initialState(now),input),/Invalid action/)});
test('manual completion updates consultation history and EWMA',()=>{const s=applyAction(initialState(now),{type:'complete',token:'A-021'},now+600000);assert.equal(s.doctors.general.samples.length,2);assert.equal(s.doctors.general.samples[1],12);assert.ok(Math.abs(s.doctors.general.average-9)<1e-9)});
test('three-ahead alert fires when count decreases, without status change',()=>{assert.ok(shouldAlertThree({token:'A-024',ahead:4},'A-024','waiting',3));assert.ok(!shouldAlertThree({token:'A-024',ahead:3},'A-024','waiting',3));assert.ok(!shouldAlertThree(null,'A-024','completed',3));assert.ok(shouldAlertThree({token:'A-026',ahead:3},'A-024','waiting',3))});
test('cache rejects corrupt shapes and another room',()=>{const store={getItem:()=>JSON.stringify({state:initialState(now),room:'one',mine:'A-024',lang:'en'})};assert.ok(restoreVisit(store,'key','one'));assert.equal(restoreVisit(store,'key','two'),null);for(const value of ['{','null','{"state":{}}',JSON.stringify({room:'one',state:{...initialState(now),flags:[null]}})])assert.equal(restoreVisit({getItem:()=>value},'key','one'),null)});
test('blocked browser storage never crashes the client',()=>{const denied={getItem(){throw Error('blocked')},setItem(){throw Error('quota')}};assert.equal(storageGet(denied,'key'),null);assert.equal(storageSet(denied,'key','value'),false);assert.equal(restoreVisit(denied,'key','one'),null)});
test('all facility routes terminate at the correct destination',()=>{for(const name of ['Pharmacy','Washroom','Emergency desk'])assert.equal(findRoute(0,true,name).path.at(-1),name);assert.equal(findRoute(1,true,'Laboratory').path.at(-1),'Laboratory');assert.equal(findRoute(2,true).path.at(-1),'Consultation room')});
test('assistance token must refer to a patient, not a nested object',()=>{for(const token of [{invalid:true},'missing'])assert.throws(()=>applyAction(initialState(now),{type:'flag',token}),/Invalid assistance token/)});

test('corrupt offline registration storage is ignored instead of crashing the registration screen',()=>{
 const corrupt={getItem:()=>'{this is broken'};assert.deepEqual(readPendingRegistrations(corrupt),[]);
 const invalid={getItem:()=>JSON.stringify({unexpected:true})};assert.deepEqual(readPendingRegistrations(invalid),[]);
 const valid={getItem:()=>JSON.stringify([{type:'register',requestId:'valid-uuid',name:'Example'},{type:'call'}])};assert.equal(readPendingRegistrations(valid).length,1);
});
test('finished demo visits remain valid restored state but no longer wait in queue',()=>{
 const s=applyAction(initialState(now),{type:'complete',token:'A-021'},now);
 const restored=restoreVisit({getItem:()=>JSON.stringify({room:'sample',state:s})},'k','sample');
 assert.equal(restored.state.patients.find(p=>p.id==='A-021').status,'completed');
});
