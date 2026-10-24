import {readFileSync} from 'node:fs';
import pg from 'pg'; const {Pool}=pg;
import {initialState,applyAction} from '../lib/queue.mjs';
const connectionString=readFileSync(new URL('../.env.local',import.meta.url),'utf8').match(/DATABASE_URL=(.+)/)[1].trim().replace('sslmode=require','sslmode=verify-full');
const pool=new Pool({connectionString,max:4,connectionTimeoutMillis:10000});
const id=crypto.randomUUID();
try{
 await pool.query('CREATE TABLE IF NOT EXISTS careflow_demo_rooms(id uuid PRIMARY KEY,state jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now())');
 await pool.query('INSERT INTO careflow_demo_rooms(id,state) VALUES($1,$2)',[id,JSON.stringify(initialState())]);
 await Promise.all(Array.from({length:5},async(_,i)=>{const c=await pool.connect();try{await c.query('BEGIN');const r=await c.query('SELECT state FROM careflow_demo_rooms WHERE id=$1 FOR UPDATE',[id]);const state=applyAction(r.rows[0].state,{type:'register',name:'Concurrent demo '+i,department:'cardio',priority:0});await c.query('UPDATE careflow_demo_rooms SET state=$2 WHERE id=$1',[id,JSON.stringify(state)]);await c.query('COMMIT')}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}}));
 const r=await pool.query('SELECT state FROM careflow_demo_rooms WHERE id=$1',[id]);const state=r.rows[0].state;const ids=state.patients.filter(p=>p.department==='cardio').map(p=>p.id);if(ids.length!==5||new Set(ids).size!==5||state.revision!==5)throw Error('Concurrency invariant failed');
 console.log('Neon concurrency check passed: five simultaneous registrations, five unique tokens, no lost updates.');
 console.log('Test room retained with fictional data:',id);
}finally{await pool.end()}

