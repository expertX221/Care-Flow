export function storageGet(storage,key){try{return storage.getItem(key)}catch{return null}}
export function storageSet(storage,key,value){try{storage.setItem(key,value);return true}catch{return false}}
export function restoreVisit(storage,key,room){
 try{const saved=JSON.parse(storageGet(storage,key)||'null');if(!saved||saved.room!==room)return null;const s=saved.state;const ids=['general','cardio','ortho','pediatric'];
 if(!s||!Number.isInteger(s.revision)||s.revision<0||!Array.isArray(s.patients)||!Array.isArray(s.flags)||!Array.isArray(s.audit)||!Array.isArray(s.feedback)||!s.doctors||!s.counters)return null;
 if(!ids.every(id=>s.doctors[id]&&Number.isFinite(s.doctors[id].average)&&Array.isArray(s.doctors[id].samples)&&Number.isInteger(s.counters[id])))return null;
 if(!s.patients.every(p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&ids.includes(p.department)&&['waiting','called','skipped','completed'].includes(p.status)&&Number.isFinite(p.created)))return null;
 if(!s.flags.every(f=>f&&typeof f.id==='string'&&['pending','reviewed'].includes(f.status))||!s.audit.every(a=>a&&typeof a.id==='string'&&typeof a.text==='string'&&Number.isFinite(a.at)))return null;
 return saved;
 }catch{return null}
}
export function shouldAlertThree(previous,token,status,ahead){return status==='waiting'&&ahead===3&&(previous?.token!==token||previous?.ahead!==3)}
