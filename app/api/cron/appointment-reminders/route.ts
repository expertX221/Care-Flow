import {NextResponse} from 'next/server';
import {sendAppointmentEmailReminders} from '../../../../lib/appointments-server';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function GET(request:Request){if(!process.env.CRON_SECRET||request.headers.get('authorization')!==`Bearer ${process.env.CRON_SECRET}`)return NextResponse.json({error:'Unauthorized'},{status:401});try{return NextResponse.json(await sendAppointmentEmailReminders(),{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Email reminder provider is not configured or unavailable'},{status:503})}}
