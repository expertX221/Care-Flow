// Same OPD room label (A101) is not the same database room.
// Only this unique demo room ID can synchronize different browsers.
export const ROOM_ID_PATTERN=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function normalizeRoomInvite(value){
 if(typeof value!=='string')return '';
 const input=value.trim();
 if(ROOM_ID_PATTERN.test(input))return input.toLowerCase();
 try{
  const parsed=new URL(input);
  if(!['https:','http:'].includes(parsed.protocol))return '';
  const room=parsed.searchParams.get('room')||new URLSearchParams(parsed.hash.slice(1)).get('room')||'';
  return ROOM_ID_PATTERN.test(room)?room.toLowerCase():'';
 }catch{return ''}
}
export function sharedRoomUrl(origin,room,view='patient'){
 if(!ROOM_ID_PATTERN.test(room)||!['patient','staff','board'].includes(view))throw Error('Invalid shared room link');
 const url=new URL('/',origin);
 url.searchParams.set('room',room.toLowerCase());
 url.searchParams.set('view',view);
 return url.toString();
}
