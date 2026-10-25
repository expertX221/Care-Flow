export const RESPONSE_WINDOW_MS=5*60*1000;
export function callResponseWindow(patient,now=Date.now()){
 if(patient?.status!=='called'||!Number.isFinite(patient.calledAt))return null;
 const deadline=patient.callDeadline??patient.calledAt+RESPONSE_WINDOW_MS;
 return {deadline,remainingSeconds:Math.max(0,Math.ceil((deadline-now)/1000)),overdue:now>=deadline};
}
export function appointmentCheckInWindow(startsAt,now=Date.now()){
 const at=Date.parse(startsAt);if(!Number.isFinite(at))return false;
 const day=time=>new Date(time+19800000).toISOString().slice(0,10);
 return day(at)===day(now)&&Math.abs(at-now)<=60*60000;
}
