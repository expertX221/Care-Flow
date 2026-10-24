import {NextResponse} from 'next/server';
import {createRoom,publicState} from '../../../lib/server';
export const dynamic='force-dynamic';
export async function POST(){try{const {id,state}=await createRoom();return NextResponse.json({id,state:publicState(state,{staff:false,mine:null}),mine:null},{status:201})}catch{return NextResponse.json({error:'Cloud database is unavailable. Your browser demo still works.'},{status:503})}}
