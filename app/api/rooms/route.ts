import {NextResponse} from 'next/server';
import {createRoom,publicState,cookieName} from '../../../lib/server';
export const dynamic='force-dynamic';
export async function POST(){try{const {id,state,claim}=await createRoom();const response=NextResponse.json({id,state:publicState(state,{staff:false,mine:'A-024'}),claim},{status:201});response.cookies.set(cookieName(id),'A-024:'+claim,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:86400});return response}catch{return NextResponse.json({error:'Cloud database is unavailable. Your browser demo still works.'},{status:503})}}
