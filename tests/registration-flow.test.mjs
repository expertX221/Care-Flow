import test from 'node:test';
import assert from 'node:assert/strict';
import {registrationMode,localVisitCanResume} from '../lib/registration-flow.mjs';
import {applyAction,initialState} from '../lib/queue.mjs';
import {ownVisit,visitDashboardAllowed} from '../lib/visit-entry.mjs';

test('a new browser demo without a cloud database registers locally rather than indefinitely pending',()=>{
 const mode=registrationMode({ready:true,online:true,room:'',connection:'local'});
 assert.equal(mode,'local');
 const result=applyAction(initialState(),{type:'register',name:'QA Guest',department:'general',priority:0});
 const token=result.lastToken;
 assert.equal(token,'A-026');
 assert.equal(ownVisit(result,token)?.name,'QA');
 assert.equal(visitDashboardAllowed(result,token,true),true);
});
test('active rooms use cloud when online, defer only when disconnected',()=>{
 const args={ready:true,online:true,room:'11111111-1111-4111-8111-111111111111',connection:'cloud'};
 assert.equal(registrationMode(args),'cloud');
 assert.equal(registrationMode({...args,online:false}),'deferred');
 assert.equal(registrationMode({...args,connection:'interrupted'}),'deferred');
 assert.equal(registrationMode({...args,ready:false}),'not-ready');
 assert.equal(registrationMode({...args,room:'',connection:'connecting'}),'not-ready');
});
test('only locally confirmed visit in the same browser session resumes a local demo dashboard',()=>{
 const state=applyAction(initialState(),{type:'register',name:'Local Patient',department:'eyes',priority:0});
 const saved={room:'',state,mine:state.lastToken,hasConfirmedVisit:true};
 assert.equal(localVisitCanResume(saved,state.lastToken,''),true);
 assert.equal(localVisitCanResume(saved,state.lastToken,'another-cloud-room'),false);
 assert.equal(localVisitCanResume(saved,'different-token',''),false);
 assert.equal(localVisitCanResume({...saved,hasConfirmedVisit:false},state.lastToken,''),false);
 assert.equal(localVisitCanResume(null,state.lastToken,''),false);
});
