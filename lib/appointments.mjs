// CareFlow demo booking schedule: all slots in Asia/Kolkata.
export const SLOT_CAPACITY=4;
export const DEPARTMENTS=Object.freeze(['general','cardio','ortho','pediatric']);
export const SLOTS=Object.freeze(Array.from({length:16},(_,i)=>`${String(9+Math.floor(i/2)).padStart(2,'0')}:${i%2?'30':'00'}`));
export function startsAt(date,slot){
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||typeof slot!=='string'||!SLOTS.includes(slot))throw Error('Choose a valid date and time');
 const start=new Date(`${date}T${slot}:00+05:30`);
 if(!Number.isFinite(start.getTime())||new Date(start.getTime()+19800000).toISOString().slice(0,10)!==date)throw Error('Invalid date');
 return start;
}
export function validateAppointment(input,now=Date.now()){
 if(!input||typeof input!=='object'||!DEPARTMENTS.includes(input.department))throw Error('Choose a department');
 const patientName=String(input.patientName||'').trim().replace(/\s+/g,' '),email=String(input.email||'').trim().toLowerCase();
 if(patientName.length<2||patientName.length>64||/[<>\r\n]/.test(patientName))throw Error('Enter a name of 2–64 characters');
 if(email&&(email.length>120||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))throw Error('Enter a valid email or leave it blank');
 const start=startsAt(input.date,input.slot);
 if(start.getTime()<now+30*60000||start.getTime()>now+60*86400000)throw Error('Choose a slot 30 minutes to 60 days ahead');
 return {date:input.date,slot:input.slot,department:input.department,patientName,email,startsAt:start.toISOString()};
}
export function validateCode(code){if(typeof code!=='string'||!/^[A-Za-z0-9_-]{20,80}$/.test(code))throw Error('Private code required');return code}
export function slotInventory(booked=[]){const left=Object.fromEntries(SLOTS.map(t=>[t,SLOT_CAPACITY]));for(const s of booked)if(Object.hasOwn(left,s))left[s]=Math.max(0,left[s]-1);return left}
export function appointmentIcs(a){
 const start=startsAt(a.date,a.slot),end=new Date(start.getTime()+30*60000),fmt=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
 return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//CareFlow//Demo//EN','METHOD:PUBLISH','BEGIN:VEVENT',`UID:${a.id}@careflow.demo`,`DTSTAMP:${fmt(new Date())}`,`DTSTART:${fmt(start)}`,`DTEND:${fmt(end)}`,`SUMMARY:CareFlow demonstration appointment - ${a.department}`,'DESCRIPTION:Fictional booking only. Not a real hospital reservation.','BEGIN:VALARM','TRIGGER:-P1D','ACTION:DISPLAY','DESCRIPTION:Your CareFlow demo visit is tomorrow','END:VALARM','END:VEVENT','END:VCALENDAR',''].join('\r\n');
}
