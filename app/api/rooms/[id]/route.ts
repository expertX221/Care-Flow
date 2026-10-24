import {NextResponse} from 'next/server';
import {getRoom,mutateRoom,actors,publicState,cookieName} from '../../../../lib/server';
import {QueueActionError} from '../../../../lib/queue.mjs';
export const dynamic='force-dynamic';
const valid=(id:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;if(!valid(id))return NextResponse.json({error:'Invalid room'},{status:400});try{const state=await getRoom(id);const actor=state?actors(_,state,id):{staff:false,mine:null};return state?NextResponse.json({state:publicState(state,actor),staff:actor.staff,mine:actor.mine},{headers:{'Cache-Control':'no-store'}}):NextResponse.json({error:'Room not found'},{status:404})}catch{return NextResponse.json({error:'Unable to sync with database'},{status:503})}}
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!valid(id))return NextResponse.json({error:'Invalid room'},{status:400});
 let action:unknown;
 try{const body=await request.text();if(new TextEncoder().encode(body).length>10000)return NextResponse.json({error:'Request too large'},{status:413});action=JSON.parse(body)}catch{return NextResponse.json({error:'Invalid JSON request'},{status:400})}
 if(!action||typeof action!=='object'||Array.isArray(action)||typeof (action as {type?:unknown}).type!=='string')return NextResponse.json({error:'Invalid action'},{status:400});
 try{const result=await mutateRoom(id,action,request);const response=NextResponse.json(result);if(result.claim&&result.mine)response.cookies.set(cookieName(id),result.mine+':'+result.claim,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:86400});return response}catch(error){if(error instanceof Error&&['Staff PIN required','Own token required'].includes(error.message))return NextResponse.json({error:error.message},{status:403});if(error instanceof QueueActionError)return NextResponse.json({error:error.message},{status:400});if(error instanceof Error&&error.message==='Demo room not found')return NextResponse.json({error:'Room not found'},{status:404});return NextResponse.json({error:'Unable to update queue. Please retry.'},{status:503})}
}
