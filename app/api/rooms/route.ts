import {NextResponse} from 'next/server';
import {createRoom} from '../../../lib/server';
export const dynamic='force-dynamic';
export async function POST(){try{return NextResponse.json(await createRoom(),{status:201})}catch{return NextResponse.json({error:'Cloud database is unavailable. Your browser demo still works.'},{status:503})}}
