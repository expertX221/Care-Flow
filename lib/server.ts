import {Pool} from 'pg';
import {initialState,applyAction} from './queue.mjs';
const globalDb=globalThis as unknown as {careflowPool?:Pool};
export function pool(){if(!process.env.DATABASE_URL)throw Error('Database connection is not configured');return globalDb.careflowPool??=(new Pool({connectionString:process.env.DATABASE_URL,max:3,idleTimeoutMillis:20000,connectionTimeoutMillis:10000}));}
export async function ensureSchema(){await pool().query(`CREATE TABLE IF NOT EXISTS careflow_demo_rooms (id uuid PRIMARY KEY, state jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`)}
export async function createRoom(){await ensureSchema();const id=crypto.randomUUID();const state=initialState();await pool().query('INSERT INTO careflow_demo_rooms(id,state) VALUES($1,$2)',[id,JSON.stringify(state)]);return {id,state};}
export async function getRoom(id:string){const r=await pool().query('SELECT state FROM careflow_demo_rooms WHERE id=$1',[id]);return r.rows[0]?.state;}
export async function mutateRoom(id:string,action:unknown){const client=await pool().connect();try{await client.query('BEGIN');const r=await client.query('SELECT state FROM careflow_demo_rooms WHERE id=$1 FOR UPDATE',[id]);if(!r.rows.length)throw Error('Demo room not found');const state=applyAction(r.rows[0].state,action);await client.query('UPDATE careflow_demo_rooms SET state=$2,updated_at=now() WHERE id=$1',[id,JSON.stringify(state)]);await client.query('COMMIT');return state;}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release()}}
