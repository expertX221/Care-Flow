import {NextResponse} from 'next/server';
import {sendAppointmentEmailReminders} from '../../../../lib/appointments-server';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function GET(request:Request){const auth=request.headers.get('authorization');if(!process.env.CRON_SECRET||auth!==`Bearer ${process.env.CRON_SECRET}`)return NextResponse.json({error:'Unauthorized'},{status:401});
 try{return NextResponse.json(await sendAppointmentEmailReminders(),{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Email reminder service is not configured or unavailable'},{status:503})}}
