import {NextResponse} from 'next/server';
import {getRoom,actors,publicState,cookie,cookieName,familyMetadata} from '../../../../../lib/server';
import {readFamilySession,selectFamilyVisit} from '../../../../../lib/family-session.mjs';
import {sameOrigin,isRoomId} from '../../../../../lib/request-security.mjs';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!isRoomId(id)||!sameOrigin(request))return NextResponse.json({error:'Invalid request'},{status:400});
 let body:any;try{body=await request.json()}catch{return NextResponse.json({error:'Invalid request'},{status:400})}
 try{const state=await getRoom(id);if(!state)return NextResponse.json({error:'Room not found'},{status:404});const actor=actors(request,state,id);
 if(typeof body?.token!=='string'||!actor.family.includes(body.token))return NextResponse.json({error:'Saved visit not found on this device'},{status:403});
 const raw=cookie(request,cookieName(id)),value=selectFamilyVisit(raw,body.token);const entry=readFamilySession(value).visits.find(v=>v.token===body.token)!;
 const response=NextResponse.json({state:publicState(state,{staff:false,mine:body.token,family:actor.family}),mine:body.token,claim:entry.secret,family:familyMetadata(state,actor.family)},{headers:{'Cache-Control':'no-store'}});
 response.cookies.set(cookieName(id),value,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:86400});return response;
 }catch{return NextResponse.json({error:'Could not switch saved visit. Retry.'},{status:503})}
}
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;if(!isRoomId(id)||!sameOrigin(request))return NextResponse.json({error:'Invalid request'},{status:400});const response=NextResponse.json({ok:true});response.cookies.set(cookieName(id),'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});return response}
