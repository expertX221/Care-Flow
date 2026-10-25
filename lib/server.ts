import {authorizeAction,isRoomId} from './request-security.mjs';
import {Pool} from 'pg';
import {createHash,randomBytes} from 'node:crypto';
import {initialState,applyAction,upgradeState} from './queue.mjs';
import {rateLimitKey,MAX_FAILURES,WINDOW_MS,staffPinMatches} from './security-upgrades.mjs';
import {hasPatientAccess,addPatientAccess} from './patient-access.mjs';
import {postgresConnectionString} from './database-url.mjs';
const globalDb=globalThis as unknown as {careflowPool?:Pool};
export function pool(){if(!process.env.DATABASE_URL)throw Error('Database connection is not configured');return globalDb.careflowPool??=(new Pool({connectionString:postgresConnectionString(process.env.DATABASE_URL),max:5,idleTimeoutMillis:20000,connectionTimeoutMillis:10000}));}
export const hash=(x:string)=>createHash('sha256').update(x).digest('hex');
export const cookieName=(id:string,staff=false)=>(staff?'cf_staff_':'cf_patient_')+id;
function cookie(request:Request,name:string){const raw=(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='));try{return raw?decodeURIComponent(raw.slice(name.length+1)):''}catch{return ''}}
export function actors(request:Request,state:any,id:string){const staffKey=cookie(request,cookieName(id,true));const staff=!!staffKey&&(state._staffSessions||[]).some(s=>s.hash===hash(staffKey)&&s.until>Date.now());const patientKey=cookie(request,cookieName(id));const [token,secret]=patientKey.split(':');const mine=secret&&state.patients.find(p=>p.id===token&&hasPatientAccess(p,hash(secret)))?token:null;return {staff,mine}}
export function publicState(state:any,actor:{staff:boolean;mine:string|null}){const s=structuredClone(state);delete s._staffSessions;for(const p of s.patients){delete p._accessHash;delete p._otherAccessHashes;delete p._requestId;if(!actor.staff&&p.id!==actor.mine){p.name='';delete p.age;delete p.gender}}if(!actor.staff){s.audit=[];s.feedback=[];s.flags=s.flags.filter(f=>actor.mine&&f.token===actor.mine)}return s}
export async function ensureSchema(){
 await pool().query(`CREATE TABLE IF NOT EXISTS careflow_demo_rooms (id uuid PRIMARY KEY,state jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now())`);
 await pool().query(`CREATE TABLE IF NOT EXISTS careflow_auth_attempts (key text PRIMARY KEY,failures integer NOT NULL,window_start timestamptz NOT NULL DEFAULT now())`);
}
export function requestIp(request:Request){return process.env.VERCEL?(request.headers.get('x-vercel-forwarded-for')||'unknown').split(',')[0].trim().slice(0,120):'local'}
export async function blockedAttempt(kind:'staff'|'patient',id:string,request:Request,subject=''){
 await ensureSchema();
 const key=rateLimitKey(kind,id,requestIp(request),subject);
 const row=await pool().query('SELECT failures,window_start FROM careflow_auth_attempts WHERE key=$1',[key]);
 return row.rows.length>0&&Number(row.rows[0].failures)>=MAX_FAILURES&&Date.now()-new Date(row.rows[0].window_start).getTime()<WINDOW_MS;
}
export async function failedAttempt(kind:'staff'|'patient',id:string,request:Request,subject=''){
 const key=rateLimitKey(kind,id,requestIp(request),subject);
 await pool().query(`INSERT INTO careflow_auth_attempts(key,failures,window_start) VALUES($1,1,now()) ON CONFLICT(key) DO UPDATE SET failures=CASE WHEN careflow_auth_attempts.window_start < now()-interval '15 minutes' THEN 1 ELSE careflow_auth_attempts.failures+1 END, window_start=CASE WHEN careflow_auth_attempts.window_start < now()-interval '15 minutes' THEN now() ELSE careflow_auth_attempts.window_start END`,[key]);
}
export async function clearAttempt(kind:'staff'|'patient',id:string,request:Request,subject=''){
 await pool().query('DELETE FROM careflow_auth_attempts WHERE key=$1',[rateLimitKey(kind,id,requestIp(request),subject)]);
}
export async function defaultRoom(){await ensureSchema();const id=process.env.DEFAULT_ROOM_ID||'ca4ef100-0000-4000-8000-000000000001';if(!isRoomId(id))throw Error('Invalid default room configuration');await pool().query('INSERT INTO careflow_demo_rooms(id,state) VALUES($1,$2) ON CONFLICT(id) DO NOTHING',[id,JSON.stringify(initialState())]);return {id,state:await getRoom(id)}}
export async function createRoom(){await ensureSchema();const id=crypto.randomUUID();const state:any=initialState();await pool().query('INSERT INTO careflow_demo_rooms(id,state) VALUES($1,$2)',[id,JSON.stringify(state)]);return {id,state}}
export async function getRoom(id:string){const r=await pool().query('SELECT state FROM careflow_demo_rooms WHERE id=$1',[id]);return r.rows[0]?upgradeState(r.rows[0].state):null}
export async function mutateRoom(id:string,action:any,request:Request){if(['register','flag','feedback'].includes(action.type))await consumeLimit(action.type,request,action.type==='register'?60:30);const client=await pool().connect();try{await client.query('BEGIN');const r=await client.query('SELECT state FROM careflow_demo_rooms WHERE id=$1 FOR UPDATE',[id]);if(!r.rows.length)throw Error('Demo room not found');const original=upgradeState(r.rows[0].state),actor=actors(request,original,id);authorizeAction(action,actor);let state=applyAction(original,action),claim:string|null=null,mine=actor.mine;if(action.type==='register'){claim=randomBytes(24).toString('base64url');mine=state.lastToken;addPatientAccess(state.patients.find(p=>p.id===mine),hash(claim))}await client.query('UPDATE careflow_demo_rooms SET state=$2,updated_at=now() WHERE id=$1',[id,JSON.stringify(state)]);await client.query('COMMIT');return {state:publicState(state,{staff:actor.staff,mine}),claim,mine}}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}}
export async function staffLogin(id:string,pin:string){if(!staffPinMatches(pin,process.env))throw new StaffAuthenticationError('Invalid staff PIN');const token=randomBytes(24).toString('base64url');const client=await pool().connect();try{await client.query('BEGIN');const r=await client.query('SELECT state FROM careflow_demo_rooms WHERE id=$1 FOR UPDATE',[id]);if(!r.rows.length)throw Error('Demo room not found');const state=upgradeState(r.rows[0].state);state._staffSessions=[...(state._staffSessions||[]).filter(s=>s.until>Date.now()).slice(-9),{hash:hash(token),until:Date.now()+8*3600000}];await client.query('UPDATE careflow_demo_rooms SET state=$2 WHERE id=$1',[id,JSON.stringify(state)]);await client.query('COMMIT');return token}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}}


// Revoke the current staff session on sign out, rather than only hiding the UI.
export async function staffLogout(id:string,request:Request){const staffKey=cookie(request,cookieName(id,true));if(!staffKey)return;const client=await pool().connect();try{await client.query('BEGIN');const r=await client.query('SELECT state FROM careflow_demo_rooms WHERE id=$1 FOR UPDATE',[id]);if(r.rows.length){const state=upgradeState(r.rows[0].state);state._staffSessions=(state._staffSessions||[]).filter((s:any)=>s.hash!==hash(staffKey));await client.query('UPDATE careflow_demo_rooms SET state=$2 WHERE id=$1',[id,JSON.stringify(state)])}await client.query('COMMIT')}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}}

export class StaffAuthenticationError extends Error {}

export class RateLimitError extends Error {}
export async function consumeLimit(kind:string,request:Request,limit:number){
 await ensureSchema();const key=hash('write|'+kind+'|'+requestIp(request));
 const result=await pool().query(`INSERT INTO careflow_auth_attempts(key,failures,window_start) VALUES($1,1,now()) ON CONFLICT(key) DO UPDATE SET failures=CASE WHEN careflow_auth_attempts.window_start < now()-interval '15 minutes' THEN 1 ELSE careflow_auth_attempts.failures+1 END, window_start=CASE WHEN careflow_auth_attempts.window_start < now()-interval '15 minutes' THEN now() ELSE careflow_auth_attempts.window_start END RETURNING failures`,[key]);
 if(Number(result.rows[0].failures)>limit)throw new RateLimitError('Too many requests. Please try again in 15 minutes.');
}
