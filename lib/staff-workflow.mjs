export const STAFF_TABS=['overview','checkin','queue','appointments','history','activity'];
export function visitsForSection(patients,section,department='all',search=''){
 if(!Array.isArray(patients))return [];
 const isHistory=section==='history';
 const needle=String(search||'').trim().toLowerCase();
 return patients.filter(p=>p&& (isHistory?['completed','cancelled'].includes(p.status):['waiting','called','skipped'].includes(p.status)) &&
  (department==='all'||p.department===department) &&
  (!needle||String(p.id+' '+p.name).toLowerCase().includes(needle)));
}
export function staffSummary(patients){const counts={waiting:0,called:0,skipped:0,completed:0,cancelled:0};for(const p of patients||[])if(Object.prototype.hasOwnProperty.call(counts,p.status))counts[p.status]++;return counts}
