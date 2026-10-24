import {NextResponse} from 'next/server';
export async function POST(request:Request){
 try{const {ahead,on_break=false,consultations=[6]}=await request.json();if(typeof on_break!=='boolean'||!Number.isInteger(ahead)||ahead<0||ahead>1000||!Array.isArray(consultations)||!consultations.length||consultations.some(x=>typeof x!=='number'||!Number.isFinite(x)||x<=0||x>240))return NextResponse.json({error:'Invalid input'},{status:400});
 if(process.env.PREDICTION_URL){try{const response=await fetch(`${process.env.PREDICTION_URL}/predict`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ahead,on_break,consultations}),signal:AbortSignal.timeout(2000)});if(response.ok)return NextResponse.json(await response.json());}catch{}}
 const avg=consultations.reduce((a:number,x:number,i:number)=>i===0?x:.3*x+.7*a,6);const minutes=ahead*avg+(on_break?15:0);return NextResponse.json({minutes:Math.round(minutes),range:[Math.round(minutes*.8),Math.round(minutes*1.2)],method:'EWMA',simulated:true});
 }catch{return NextResponse.json({error:'Invalid request'},{status:400})}
}
