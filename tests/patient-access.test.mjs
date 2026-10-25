import test from 'node:test';
import assert from 'node:assert/strict';
import {hasPatientAccess,addPatientAccess} from '../lib/patient-access.mjs';
test('retrying cloud registration preserves its previous private visit code',()=>{
 const p={id:'A-026'};
 addPatientAccess(p,'original-digest');
 assert.equal(hasPatientAccess(p,'original-digest'),true);
 addPatientAccess(p,'retry-digest');
 assert.equal(hasPatientAccess(p,'original-digest'),true);
 assert.equal(hasPatientAccess(p,'retry-digest'),true);
 assert.equal(hasPatientAccess(p,'wrong'),false);
});
test('empty digests and absent patients cannot grant access',()=>{
 assert.equal(hasPatientAccess(null,'x'),false);
 assert.equal(hasPatientAccess({},''),false);
 assert.throws(()=>addPatientAccess({},''));
});
