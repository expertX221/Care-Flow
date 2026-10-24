export const sampleTokens=new Set(['A-021','A-022','A-023','A-024','A-025']);
export function ownVisit(state,token){return typeof token==='string'&&!sampleTokens.has(token)?state.patients.find(p=>p.id===token)||null:null}
export function visitDashboardAllowed(state,token,entered){return entered===true&&!!ownVisit(state,token)}
export function parseVisitCode(value,currentRoom){const text=String(value||'').trim();const split=text.indexOf(':');if(split<0)return {room:currentRoom,access:text};const room=text.slice(0,split),access=text.slice(split+1);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(room)||!access||access.length>100)throw Error('Invalid visit code');return {room,access}}
