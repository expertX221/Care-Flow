// CareFlow demonstration appointments use the hospital's Asia/Kolkata timezone.
// These reservations do not represent real hospital appointments.
export const APPOINTMENT_ZONE = 'Asia/Kolkata';
export const SLOT_CAPACITY = 4;
export const DEPARTMENTS = Object.freeze(['general','cardio','ortho','pediatric']);
export const SLOTS = Object.freeze(Array.from({length:16},(_,i)=>`${String(9+Math.floor(i/2)).padStart(2,'0')}:${i%2?'30':'00'}`));
const dateRe=/^\d{4}-\d{2}-\d{2}$/;
export function startsAt(date,slot){
 if(typeof date!=='string'||!dateRe.test(date)||typeof slot!=='string'||!SLOTS.includes(slot))throw Error('Choose a valid date and appointment time');
 const start=new Date(`${date}T${slot}:00+05:30`);
 if(!Number.isFinite(start.getTime())||new Date(start.getTime()+19800000).toISOString().slice(0,10)!==date)throw Error('Invalid date');
 return start;
}
export function validateAppointment(input,now=Date.now()){
 if(!input||typeof input!=='object')throw Error('Invalid appointment request');
 const date=input.date,slot=input.slot,department=input.department;
 const patientName=String(input.patientName||'').trim().replace(/\s+/g,' ');
 const email=String(input.email||'').trim().toLowerCase();
 if(!DEPARTMENTS.includes(department))throw Error('Choose a valid department');
 if(patientName.length<2||patientName.length>64||/[<>\r\n]/.test(patientName))throw Error('Enter a name of 2–64 characters');
 if(email&&(email.length>120||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))throw Error('Enter a valid email address or leave it blank');
 const start=startsAt(date,slot);
 if(start.getTime()<now+30*60000)throw Error('Book at least 30 minutes before your chosen time');
 if(start.getTime()>now+60*86400000)throw Error('Appointments can be booked up to 60 days ahead');
 return {date,slot,department,patientName,email,startsAt:start.toISOString()};
}
export function validateCode(code){
 if(typeof code!=='string'||!/^[A-Za-z0-9_-]{20,80}$/.test(code))throw Error('Valid private booking code required');
 return code;
}
export function slotInventory(booked=[]) {
 const remaining=Object.fromEntries(SLOTS.map(t=>[t,SLOT_CAPACITY]));
 for(const s of booked)if(Object.hasOwn(remaining,s))remaining[s]=Math.max(0,remaining[s]-1);
 return remaining;
}
export function appointmentIcs(appointment){
 const start=startsAt(appointment.date,appointment.slot);
 const compact=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
 const end=new Date(start.getTime()+30*60000);
 const text=x=>String(x).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
 const title=`CareFlow Demo - ${appointment.department} visit`;
 return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//CareFlow//Demo Appointment//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',`UID:${appointment.id}@careflow.demo`,`DTSTAMP:${compact(new Date())}`,`DTSTART:${compact(start)}`,`DTEND:${compact(end)}`,`SUMMARY:${text(title)}`,'DESCRIPTION:Demo-only appointment. Not a hospital confirmation. Bring your private booking code.','BEGIN:VALARM','TRIGGER:-P1D','ACTION:DISPLAY','DESCRIPTION:CareFlow demo appointment tomorrow','END:VALARM','END:VEVENT','END:VCALENDAR',''].join('\r\n');
}
