import {NextResponse} from 'next/server';
import {consumeLimit,RateLimitError,defaultRoom,createRoom,publicState} from '../../../lib/server';
import {sameOrigin} from '../../../lib/request-security.mjs';
export const dynamic='force-dynamic';
export async function GET(){try{const {id,state}=await defaultRoom();return NextResponse.json({id,state:publicState(state,{staff:false,mine:null}),staff:false,mine:null},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Shared queue unavailable. Please retry.'},{status:503})}}
export async function POST(request:Request){if(!sameOrigin(request))return NextResponse.json({error:'Cross-origin request rejected'},{status:403});try{await consumeLimit('create-room',request,10);const {id,state}=await createRoom();return NextResponse.json({id,state:publicState(state,{staff:false,mine:null}),mine:null},{status:201})}catch(error){if(error instanceof RateLimitError)return NextResponse.json({error:error.message},{status:429});return NextResponse.json({error:'Cloud database unavailable'},{status:503})}}
