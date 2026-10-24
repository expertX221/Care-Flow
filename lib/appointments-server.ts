import {randomBytes,randomUUID} from 'node:crypto';
import {pool,getRoom,actors,hash,requestIp,blockedAttempt,failedAttempt,clearAttempt} from './server';
import {validateAppointment,validateCode,slotInventory,SLOT_CAPACITY,DEPARTMENTS,SLOTS,startsAt} from './appointments.mjs';
export class BookingError extends Error{status:number;constructor(message:string,status=400){super(message);this.status=status}}
const checkedAppointment=(raw:any)=>{try{return validateAppointment(raw)}catch(error){throw new BookingError(error instanceof Error?error.message:'Invalid appointment fields',400)}};
const validRoom=(id:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
export async function appointmentsSchema(){
 await pool().query(`CREATE TABLE IF NOT EXISTS careflow_appointments (
 id uuid PRIMARY KEY,room_id uuid NOT NULL,department text NOT NULL,starts_at timestamptz NOT NULL,
 patient_name varchar(64) NOT NULL,email varchar(120),secret_hash char(64) NOT NULL,
 status text NOT NULL DEFAULT 'booked',created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),reminded_at timestamptz,
 CONSTRAINT careflow_booking_status CHECK(status IN ('booked','cancelled','completed')))`);
 await pool().query(`CREATE INDEX IF NOT EXISTS careflow_appointments_room_slot_idx ON careflow_appointments(room_id,department,starts_at,status)`);
 await pool().query(`CREATE INDEX IF NOT EXISTS careflow_appointments_reminder_idx ON careflow_appointments(starts_at,status,reminded_at) WHERE email IS NOT NULL`);
}
function rowView(row:any){const date=new Date(row.starts_at);const local=new Date(date.getTime()+19800000).toISOString();return {id:row.id,department:row.department,date:local.slice(0,10),slot:local.slice(11,16),patientName:row.patient_name,status:row.status,reminderEmailEnabled:!!row.email,createdAt:row.created_at};}
async function roomExists(roomId:string){if(!validRoom(roomId))throw new BookingError('Invalid room ID');if(!await getRoom(roomId))throw new BookingError('Room not found',404)}
async function authorizedStaff(roomId:string,request:Request){const room=await getRoom(roomId);if(!room||!actors(request,room,roomId).staff)throw new BookingError('Staff login required',403)}
async function verifyOwn(roomId:string,id:string,code:any,request:Request,client:any){
 if(!/^[0-9a-f-]{36}$/i.test(id))throw new BookingError('Invalid booking reference');
 if(await blockedAttempt('patient',roomId,request,'appointment:'+id))throw new BookingError('Too many attempts. Try again later.',429);
 let secret;try{secret=validateCode(code)}catch{throw new BookingError('Private booking code required',400)}
 const row=await client.query('SELECT * FROM careflow_appointments WHERE id=$1 AND room_id=$2',[id,roomId]);
 if(!row.rows.length||row.rows[0].secret_hash!==hash(secret)){
  // Record failed attempts only AFTER the caller rolls back its transaction.
  throw new BookingError('Booking reference or private code is incorrect',403);
 }
 return row.rows[0];
}
async function availableCount(client:any,roomId:string,dept:string,at:string,omit?:string){const r=await client.query("SELECT count(*)::int AS count FROM careflow_appointments WHERE room_id=$1 AND department=$2 AND starts_at=$3 AND status='booked' AND ($4::uuid IS NULL OR id<>$4::uuid)",[roomId,dept,at,omit||null]);return Number(r.rows[0].count)}
export async function availableSlots(roomId:string,date:string,department:string){await roomExists(roomId);if(!DEPARTMENTS.includes(department)||typeof date!=='string')throw new BookingError('Valid date and department required');let booked:string[]=[];try{for(const slot of SLOTS)startsAt(date,slot)}catch{throw new BookingError('Choose a valid date',400)}
 await appointmentsSchema();const r=await pool().query("SELECT starts_at FROM careflow_appointments WHERE room_id=$1 AND department=$2 AND (starts_at AT TIME ZONE 'Asia/Kolkata')::date=$3::date AND status='booked'",[roomId,department,date]);booked=r.rows.map((row:any)=>new Date(new Date(row.starts_at).getTime()+19800000).toISOString().slice(11,16));const inventory=slotInventory(booked);
 for(const slot of SLOTS){const when=startsAt(date,slot).getTime();if(when<Date.now()+30*60000||when>Date.now()+60*86400000)inventory[slot]=0}
 return {date,department,capacity:SLOT_CAPACITY,slots:inventory};}
export async function createAppointment(roomId:string,raw:any,request:Request){await roomExists(roomId);const details=checkedAppointment(raw);await appointmentsSchema();const client=await pool().connect();const id=randomUUID(),code=randomBytes(24).toString('base64url');try{
 await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[roomId]);
 if(await availableCount(client,roomId,details.department,details.startsAt)>=SLOT_CAPACITY)throw new BookingError('This slot is full. Choose another time.',409);
 await client.query(`INSERT INTO careflow_appointments(id,room_id,department,starts_at,patient_name,email,secret_hash) VALUES($1,$2,$3,$4,$5,$6,$7)`,[id,roomId,details.department,details.startsAt,details.patientName,details.email||null,hash(code)]);
 await client.query('COMMIT');return {...details,id,code,status:'booked',reminderEmailEnabled:!!details.email};
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}}
export async function manageAppointment(roomId:string,request:Request,body:any){await roomExists(roomId);await appointmentsSchema();const action=body?.action;if(action==='staff-list'){await authorizedStaff(roomId,request);const r=await pool().query('SELECT * FROM careflow_appointments WHERE room_id=$1 ORDER BY starts_at DESC LIMIT 120',[roomId]);return {appointments:r.rows.map(rowView)}}
 if(!['lookup','cancel','reschedule','complete'].includes(action))throw new BookingError('Unknown appointment action');
 if(action==='complete')await authorizedStaff(roomId,request);
 const client=await pool().connect();try{
  // Validate appointment fields using the existing row (name and email are not provided during rescheduling).
  await client.query('BEGIN');
  // Per-room lock serializes capacity checks and rescheduling. No overbooking under concurrency.
  await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[roomId]);
  const row=action==='complete'?(await client.query('SELECT * FROM careflow_appointments WHERE room_id=$1 AND id=$2',[roomId,body.id])).rows[0]:await verifyOwn(roomId,body.id,body.code,request,client);
  if(!row)throw new BookingError('Booking not found',404);
  if(action==='lookup'){await client.query('COMMIT');await clearAttempt('patient',roomId,request,'appointment:'+body.id);return {appointment:rowView(row)}}
  if(row.status!=='booked')throw new BookingError('Only active bookings can be changed',409);
  if(action==='cancel'||action==='complete'){const status=action==='cancel'?'cancelled':'completed';await client.query('UPDATE careflow_appointments SET status=$3,updated_at=now() WHERE room_id=$1 AND id=$2',[roomId,row.id,status]);await client.query('COMMIT');if(action==='cancel')await clearAttempt('patient',roomId,request,'appointment:'+body.id);return {appointment:{...rowView(row),status}}}
  const next=checkedAppointment({...body,patientName:row.patient_name,email:row.email||''});
  if(await availableCount(client,roomId,next.department,next.startsAt,row.id)>=SLOT_CAPACITY)throw new BookingError('That slot is full',409);
  const updated=await client.query('UPDATE careflow_appointments SET department=$3,starts_at=$4,updated_at=now(),reminded_at=null WHERE room_id=$1 AND id=$2 RETURNING *',[roomId,row.id,next.department,next.startsAt]);
  await client.query('COMMIT');await clearAttempt('patient',roomId,request,'appointment:'+body.id);return {appointment:rowView(updated.rows[0])};
 }catch(e){await client.query('ROLLBACK');if(e instanceof BookingError&&e.status===403&&typeof body?.id==='string'&&action!=='complete')await failedAttempt('patient',roomId,request,'appointment:'+body.id);throw e}finally{client.release()}}
export async function sendAppointmentEmailReminders(){await appointmentsSchema();if(!process.env.RESEND_API_KEY||!process.env.REMINDER_FROM_EMAIL)throw new Error('Reminder email provider is not configured');
 const client=await pool().connect();let sent=0,failed=0;try{for(let n=0;n<120;n++){
 await client.query('BEGIN');const q=await client.query(`SELECT * FROM careflow_appointments WHERE status='booked' AND email IS NOT NULL AND reminded_at IS NULL AND (starts_at AT TIME ZONE 'Asia/Kolkata')::date=((now() AT TIME ZONE 'Asia/Kolkata')::date+1) ORDER BY starts_at FOR UPDATE SKIP LOCKED LIMIT 1`);
 if(!q.rows.length){await client.query('COMMIT');break}const a=q.rows[0],when=rowView(a);
 try{const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'careflow-'+a.id+'-'+when.date},body:JSON.stringify({from:process.env.REMINDER_FROM_EMAIL,to:[a.email],subject:'CareFlow demonstration visit tomorrow',text:`Your CareFlow DEMO visit is scheduled for ${when.date} at ${when.slot} (India time), department ${when.department}. This is a fictional demonstration booking, NOT a confirmed hospital appointment. Please open CareFlow to see your booking. No reply is required.`})});if(!r.ok)throw Error('Email provider error '+r.status);await client.query('UPDATE careflow_appointments SET reminded_at=now() WHERE id=$1',[a.id]);sent++;}catch{failed++}
 await client.query('COMMIT');if(failed)break;
 }}catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}finally{client.release()}return {sent,failed};}
