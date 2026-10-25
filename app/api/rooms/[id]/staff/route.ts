import {NextResponse} from 'next/server';
import {staffLogin,staffLogout,cookieName,blockedAttempt,failedAttempt,clearAttempt,StaffAuthenticationError} from '../../../../../lib/server';
import {isRoomId,sameOrigin} from '../../../../../lib/request-security.mjs';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!isRoomId(id))return NextResponse.json({error:'Invalid room'},{status:400});
 if(!sameOrigin(request))return NextResponse.json({error:'Cross-origin request rejected'},{status:403});
 let data:any;try{data=await request.json()}catch{return NextResponse.json({error:'Invalid request'},{status:400})}
 if(typeof data?.pin!=='string'||data.pin.length>128)return NextResponse.json({error:'Invalid PIN format'},{status:400});
 try{if(await blockedAttempt('staff',id,request))return NextResponse.json({error:'Too many login attempts. Try again in 15 minutes.'},{status:429});
 const token=await staffLogin(id,data.pin);await clearAttempt('staff',id,request);const response=NextResponse.json({staff:true});response.cookies.set(cookieName(id,true),token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:28800});return response;
 }catch(error){if(error instanceof StaffAuthenticationError){await failedAttempt('staff',id,request).catch(()=>{});return NextResponse.json({error:'Staff PIN not accepted or not configured'},{status:403})}return NextResponse.json({error:'Staff sign-in service unavailable. Please retry.'},{status:503})}
}
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;if(!isRoomId(id))return NextResponse.json({error:'Invalid room'},{status:400});if(!sameOrigin(request))return NextResponse.json({error:'Cross-origin request rejected'},{status:403});try{await staffLogout(id,request)}catch{return NextResponse.json({error:'Unable to sign out; please retry'},{status:503})}const response=NextResponse.json({staff:false});response.cookies.set(cookieName(id,true),'',{path:'/',maxAge:0,httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production'});return response}
