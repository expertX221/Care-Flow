import {createHash} from 'node:crypto';
export const MAX_FAILURES=5;
export const WINDOW_MS=15*60*1000;
export function rateLimitKey(kind,room,ip,subject=''){
 if(!['staff','patient'].includes(kind))throw Error('Invalid login kind');
 // Hash only bounded identifiers. Never log access codes, token secrets or the user IP.
 return createHash('sha256').update([kind,String(room).slice(0,60),String(ip).slice(0,120),String(subject).slice(0,60)].join('|')).digest('hex');
}
export function staffPinConfigured(env){return env.NODE_ENV!=='production'||!!(env.STAFF_PIN&&env.STAFF_PIN.length>=8&&env.STAFF_PIN!=='2468')}
export function staffPinMatches(input,env){if(!staffPinConfigured(env))return false;const configured=env.STAFF_PIN||(env.NODE_ENV==='production'?null:'2468');return typeof input==='string'&&configured!==null&&input===configured}
