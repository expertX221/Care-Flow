import {NextResponse} from 'next/server';
import {forecastQueue} from '../../../lib/upgrade-insights.mjs';
export async function POST(request:Request){
 try{
  const data=await request.json();
  const ahead=data.ahead,onBreak=data.on_break===true,consultations=data.consultations??[],delayMinutes=data.delayMinutes??0;
  const result=forecastQueue({ahead,onBreak,consultations,delayMinutes});
  return NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Invalid forecast input'},{status:400})}
}
