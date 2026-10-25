export const ROOM_ID_PATTERN=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isRoomId=value=>typeof value==='string'&&ROOM_ID_PATTERN.test(value);
export function sameOrigin(request){const origin=request.headers.get('origin');return request.headers.get('sec-fetch-site')!=='cross-site'&&(!origin||origin===new URL(request.url).origin)}
export const STAFF_ACTIONS=new Set(['call','doctor','complete','end','transfer','reopen','cancel','demo-add','demo-add-room','demo-speed','demo-reset','acknowledge']);
export function authorizeAction(action,actor){if(STAFF_ACTIONS.has(action.type)&&!actor.staff)throw Error('Staff PIN required');if(['skip','rejoin','feedback'].includes(action.type)&&!actor.staff&&(!actor.mine||actor.mine!==action.token))throw Error('Own token required');if(action.type==='flag'&&typeof action.token==='string'&&action.token&&!actor.staff&&actor.mine!==action.token)throw Error('Own token required')}
