import test from 'node:test';
import assert from 'node:assert/strict';
import {SLOTS,SLOT_CAPACITY,validateAppointment,slotInventory,startsAt,validateCode,appointmentIcs} from '../lib/appointments.mjs';
const now=Date.parse('2026-10-24T00:00:00Z'),data={date:'2026-10-27',slot:'09:30',department:'general',patientName:'Demo Visitor'};
test('appointment slot capacities and date validation',()=>{assert.equal(SLOTS.length,16);assert.equal(slotInventory(Array(9).fill('09:00'))['09:00'],0);assert.equal(slotInventory([])['09:00'],SLOT_CAPACITY);assert.throws(()=>startsAt('2026-02-30','09:00'));assert.throws(()=>startsAt('2026-10-27','21:00'))});
test('appointments require valid fictional person, department, time',()=>{const x=validateAppointment(data,now);assert.equal(x.startsAt,'2026-10-27T04:00:00.000Z');for(const override of [{patientName:''},{email:'nope'},{department:'fake'},{date:'2025-02-01'}])assert.throws(()=>validateAppointment({...data,...override},now))});
test('private code is required to manage booking',()=>{assert.throws(()=>validateCode(''));assert.throws(()=>validateCode('2468'));assert.equal(validateCode('Abcdefghi12345678901'),'Abcdefghi12345678901')});
test('calendar reminder contains a one-day event alarm',()=>{const ics=appointmentIcs({...data,id:'11111111-1111-4111-8111-111111111111'});assert.match(ics,/TRIGGER:-P1D/);assert.match(ics,/DTSTART:20261027T040000Z/);assert.ok(!ics.includes('secret'))});
