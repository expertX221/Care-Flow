import test from 'node:test';
import assert from 'node:assert/strict';
import {hasPatientAccess,addPatientAccess} from '../lib/patient-access.mjs';
test('retrying cloud registration preserves original private visit code',()=>{
 const patient={id:'A-026'};addPatientAccess(patient,'first');addPatientAccess(patient,'second');
 assert.equal(hasPatientAccess(patient,'first'),true);
 assert.equal(hasPatientAccess(patient,'second'),true);
 assert.equal(hasPatientAccess(patient,'wrong'),false);
});
test('empty access never grants ownership',()=>{
 assert.equal(hasPatientAccess(null,'valid'),false);
 assert.equal(hasPatientAccess({},''),false);
 assert.throws(()=>addPatientAccess({},''));
});
