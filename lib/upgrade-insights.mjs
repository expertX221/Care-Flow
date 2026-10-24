// Deterministic decision support for fictional queues. These are estimates, not appointment times.
export function forecastQueue({ahead=0,consultations=[],onBreak=false,delayMinutes=0}) {
  if(!Number.isInteger(ahead)||ahead<0||ahead>1000||!Array.isArray(consultations)||consultations.length>50||consultations.some(x=>!Number.isFinite(x)||x<=0||x>240)||!Number.isFinite(delayMinutes)||delayMinutes<0||delayMinutes>180)throw Error('Invalid forecast input');
  const samples=consultations.slice(-10);
  const mean=samples.length?samples.reduce((a,b)=>a+b,0)/samples.length:8;
  const ewma=samples.reduce((a,x)=>0.35*x+0.65*a,mean);
  const uncertainty=samples.length>1?Math.sqrt(samples.reduce((a,x)=>a+(x-mean)**2,0)/(samples.length-1)):mean*0.35;
  const base=ahead*ewma+(onBreak?Math.max(15,delayMinutes):delayMinutes);
  const margin=Math.max(5,ahead*Math.max(1.5,uncertainty)*0.9,base*(samples.length<3?0.32:0.16));
  const round5=n=>Math.max(0,5*Math.round(n/5));
  return {minutes:round5(base),range:[round5(Math.max(0,base-margin)),round5(base+margin)],confidence:samples.length>=7?'moderate':samples.length>=3?'limited':'low',sampleCount:samples.length,method:'EWMA + uncertainty',simulated:true};
}
export function operationalInsights(state,departments,now=Date.now()) {
 const rows=departments.map(d=>{
  const doc=state.doctors[d.id],patients=state.patients.filter(p=>p.department===d.id);
  const waiting=patients.filter(p=>p.status==='waiting').length;
  const done=patients.filter(p=>p.status==='completed').length;
  const active=patients.filter(p=>p.status==='called').length;
  const avg=doc.samples?.length?doc.samples.slice(-10).reduce((a,b)=>a+b,0)/doc.samples.slice(-10).length:doc.average||8;
  const projected=forecastQueue({ahead:waiting,consultations:doc.samples||[],onBreak:doc.status!=='available',delayMinutes:doc.delayMinutes||0});
  const pressure=doc.status!=='available'||projected.minutes>=45?'critical':projected.minutes>=20||waiting>=5?'busy':'normal';
  return {id:d.id,name:d.name,waiting,done,active,avg:Math.round(avg),status:doc.status,pressure,projected:projected.minutes,range:projected.range};
 });
 return {rows,waiting:rows.reduce((a,r)=>a+r.waiting,0),done:rows.reduce((a,r)=>a+r.done,0),bottlenecks:rows.filter(r=>r.pressure!=='normal'),updatedAt:now};
}
export function personalReminder(plan,now=Date.now()) {
 if(!plan||typeof plan.at!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(plan.at))return null;
 const at=Date.parse(plan.at),remaining=at-now;
 if(!Number.isFinite(at)||remaining < -30*60000 ||remaining>30*60000)return null;
 return remaining<=0?'due':'soon';
}
