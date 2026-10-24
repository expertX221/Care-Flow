import {randomBytes,randomUUID} from 'node:crypto';
import {pool,getRoom,actors,hash,blockedAttempt,failedAttempt,clearAttempt} from './server';
import {validateAppointment,validateCode,slotInventory,SLOT_CAPACITY,DEPARTMENTS,SLOTS,startsAt} from './appointments.mjs';
export class BookingError extends Error{status:number;constructor(message:string,status=400){super(message);this.status=status}}
const validRoom=(id:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
const checked=(x:any)=>{try{return validateAppointment(x)}catch(e){throw new BookingError(e instanceof Error?e.message:'Invalid appointment',400)}};
const view=(r:any)=>{const d=new Date(new Date(r.starts_at).getTime()+19800000).toISOString();return {id:r.id,patientName:r.patient_name,department:r.department,date:d.slice(0,10),slot:d.slice(11,16),status:r.status,reminderEmailEnabled:!!r.email}};
export async function appointmentsSchema(){
 await pool().query("CREATE TABLE IF NOT EXISTS careflow_appointments(id uuid PRIMARY KEY,room_id uuid NOT NULL,department text NOT NULL,starts_at timestamptz NOT NULL,patient_name varchar(64) NOT NULL,email varchar(120),secret_hash char(64) NOT NULL,status text NOT NULL DEFAULT 'booked' CHECK(status IN ('booked','cancelled','completed')),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),reminded_at timestamptz)");
 await pool().query("CREATE INDEX IF NOT EXISTS careflow_appointment_slot_idx ON careflow_appointments(room_id,department,starts_at,status)");
}
async function roomCheck(room:string){if(!validRoom(room))throw new BookingError('Invalid CareFlow room');if(!await getRoom(room))throw new BookingError('Room not found',404)}
async function staffCheck(room:string,req:Request){const state=await getRoom(room);if(!state||!actors(req,state,room).staff)throw new BookingError('Staff login required',403)}
async function count(client:any,room:string,department:string,at:string,omit?:string){const r=await client.query("SELECT count(*)::int AS n FROM careflow_appointments WHERE room_id=$1 AND department=$2 AND starts_at=$3 AND status='booked' AND ($4::uuid IS NULL OR id<>$4::uuid)",[room,department,at,omit||null]);return Number(r.rows[0].n)}
export async function availableSlots(room:string,date:string,department:string){
 await roomCheck(room);if(!DEPARTMENTS.includes(department))throw new BookingError('Choose a department');
 let times;try{times=SLOTS.map(s=>startsAt(date,s))}catch{throw new BookingError('Choose a valid date')}
 await appointmentsSchema();
 const booked=await pool().query("SELECT starts_at FROM careflow_appointments WHERE room_id=$1 AND department=$2 AND (starts_at AT TIME ZONE 'Asia/Kolkata')::date=$3::date AND status='booked'",[room,department,date]);
 const slots=slotInventory(booked.rows.map((r:any)=>new Date(new Date(r.starts_at).getTime()+19800000).toISOString().slice(11,16)));
 for(let i=0;i<SLOTS.length;i++)if(times[i].getTime()<Date.now()+1800000||times[i].getTime()>Date.now()+60*86400000)slots[SLOTS[i]]=0;
 return {date,department,capacity:SLOT_CAPACITY,slots};
}
export async function createAppointment(room:string,raw:any,_req:Request){
 await roomCheck(room);const a=checked(raw);await appointmentsSchema();
 const client=await pool().connect(),id=randomUUID(),code=randomBytes(24).toString('base64url');
 try{await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[room]);
  if(await count(client,room,a.department,a.startsAt)>=SLOT_CAPACITY)throw new BookingError('This slot is full',409);
  await client.query('INSERT INTO careflow_appointments(id,room_id,department,starts_at,patient_name,email,secret_hash) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,room,a.department,a.startsAt,a.patientName,a.email||null,hash(code)]);
  await client.query('COMMIT');return {id,code,date:a.date,slot:a.slot,department:a.department,patientName:a.patientName,status:'booked',reminderEmailEnabled:!!a.email};
 }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}finally{client.release()}
}
export async function manageAppointment(room:string,req:Request,body:any){
 await roomCheck(room);await appointmentsSchema();
 if(body?.action==='staff-list'){await staffCheck(room,req);const rows=await pool().query('SELECT * FROM careflow_appointments WHERE room_id=$1 ORDER BY starts_at DESC LIMIT 120',[room]);return {appointments:rows.rows.map(view)}}
 const action=body?.action;
 if(!['lookup','reschedule','cancel','complete'].includes(action))throw new BookingError('Unknown booking action');
 if(action==='complete')await staffCheck(room,req);
 const id=body?.id;if(typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id))throw new BookingError('Invalid booking reference');
 if(action!=='complete'&&await blockedAttempt('patient',room,req,'appointment:'+id))throw new BookingError('Too many attempts. Try later.',429);
 let code:string|undefined;
 if(action!=='complete'){try{code=validateCode(body.code)}catch{throw new BookingError('Private booking code required')}}
 const client=await pool().connect();
 let failedAuth=false;
 try{await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[room]);
  const rows=await client.query('SELECT * FROM careflow_appointments WHERE room_id=$1 AND id=$2',[room,id]),row=rows.rows[0];
  if(!row||action!=='complete'&&row.secret_hash!==hash(code!)){failedAuth=action!=='complete';throw new BookingError('Invalid booking reference or private code',403)}
  if(action==='lookup'){await client.query('COMMIT');await clearAttempt('patient',room,req,'appointment:'+id);return {appointment:view(row)}}
  if(row.status!=='booked')throw new BookingError('Only active bookings can change',409);
  if(action==='cancel'||action==='complete'){const status=action==='cancel'?'cancelled':'completed';await client.query('UPDATE careflow_appointments SET status=$3,updated_at=now() WHERE room_id=$1 AND id=$2',[room,id,status]);await client.query('COMMIT');if(action==='cancel')await clearAttempt('patient',room,req,'appointment:'+id);return {appointment:{...view(row),status}}}
  const a=checked({...body,patientName:row.patient_name,email:row.email||''});
  if(await count(client,room,a.department,a.startsAt,id)>=SLOT_CAPACITY)throw new BookingError('New slot is full',409);
  const updated=await client.query('UPDATE careflow_appointments SET department=$3,starts_at=$4,reminded_at=null,updated_at=now() WHERE room_id=$1 AND id=$2 RETURNING *',[room,id,a.department,a.startsAt]);
  await client.query('COMMIT');await clearAttempt('patient',room,req,'appointment:'+id);return {appointment:view(updated.rows[0])};
 }catch(e){await client.query('ROLLBACK').catch(()=>{});if(failedAuth)await failedAttempt('patient',room,req,'appointment:'+id);throw e}finally{client.release()}
}
export async function sendAppointmentEmailReminders(){
 if(!process.env.RESEND_API_KEY||!process.env.REMINDER_FROM_EMAIL)throw new Error('Reminder sender not configured');
 await appointmentsSchema();const client=await pool().connect();let sent=0,failed=0;
 try{for(let i=0;i<120;i++){
  await client.query('BEGIN');
  const r=await client.query("SELECT * FROM careflow_appointments WHERE status='booked' AND email IS NOT NULL AND reminded_at IS NULL AND (starts_at AT TIME ZONE 'Asia/Kolkata')::date=(now() AT TIME ZONE 'Asia/Kolkata')::date+1 ORDER BY starts_at FOR UPDATE SKIP LOCKED LIMIT 1");
  if(!r.rows.length){await client.query('COMMIT');break}
  const a=r.rows[0],v=view(a);
  try{const res=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'careflow-'+a.id+'-'+v.date},body:JSON.stringify({from:process.env.REMINDER_FROM_EMAIL,to:[a.email],subject:'CareFlow demo booking reminder',text:'CareFlow fictional demo visit tomorrow '+v.date+' at '+v.slot+' IST, '+v.department+'. This is NOT a real hospital appointment.'})});if(!res.ok)throw Error('Provider status '+res.status);await client.query('UPDATE careflow_appointments SET reminded_at=now() WHERE id=$1',[a.id]);sent++;}catch{failed++}
  await client.query('COMMIT');if(failed)break;
 }}catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}finally{client.release()}return {sent,failed};
}
