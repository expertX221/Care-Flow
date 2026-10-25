import test from 'node:test';
import assert from 'node:assert/strict';
import {postgresConnectionString} from '../lib/database-url.mjs';
test('legacy database ssl=require retains strict TLS verification',()=>{
 const original='postgresql://user:p%40ss@db.example.test/careflow?sslmode=require&application_name=careflow';
 const result=new URL(postgresConnectionString(original));
 assert.equal(result.searchParams.get('sslmode'),'verify-full');
 assert.equal(result.searchParams.get('application_name'),'careflow');
 assert.equal(result.password,'p%40ss');
});
test('already explicit TLS and unrelated connection options stay intact',()=>{
 const url='postgresql://user:pw@db.example.test/careflow?sslmode=verify-full&connect_timeout=7';
 assert.equal(postgresConnectionString(url),url);
});
test('missing, unrecognized, and unrelated schemes cannot silently enable a DB',()=>{
 for(const raw of ['',undefined,'https://example.test/'])assert.throws(()=>postgresConnectionString(raw));
});
