// Up to eight verified visits per device. Secrets stay in an HttpOnly cookie.
const tokenPattern=/^[A-Z]-\d{3,8}$/;
const secretPattern=/^[A-Za-z0-9_-]{20,100}$/;
export function readFamilySession(raw='') {
 const [activePart,listPart]=String(raw).slice(0,3500).split('~');
 const parts=listPart===undefined?[activePart]:listPart.split(',');
 const visits=[];
 for(const item of parts){const [token,secret]=item.split(':');if(tokenPattern.test(token||'')&&secretPattern.test(secret||'')&&!visits.some(v=>v.token===token))visits.push({token,secret});if(visits.length===8)break}
 const active=listPart===undefined?visits[0]?.token:activePart;
 return {active:visits.some(v=>v.token===active)?active:null,visits};
}
export function addFamilyVisit(raw,token,secret) {
 if(!tokenPattern.test(token)||!secretPattern.test(secret))throw Error('Invalid visit session');
 const visits=[...readFamilySession(raw).visits.filter(v=>v.token!==token),{token,secret}].slice(-8);
 return token+'~'+visits.map(v=>v.token+':'+v.secret).join(',');
}
export function selectFamilyVisit(raw,token){const session=readFamilySession(raw);if(!session.visits.some(v=>v.token===token))throw Error('Saved visit not found');return token+'~'+session.visits.map(v=>v.token+':'+v.secret).join(',')}
