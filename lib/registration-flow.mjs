// A cloud registration is not a confirmed visit until the server returns a token.
// Without a configured database, a new room can still run locally as a *demo*.
export function registrationMode({ready,online,room,connection}) {
 if(!ready||connection==='connecting')return 'not-ready';
 if(!room)return connection==='local'?'local':'not-ready';
 if(!online||connection==='interrupted')return 'deferred';
 return 'cloud';
}

export function localVisitCanResume(saved,sessionToken,room) {
 if(room||!saved?.hasConfirmedVisit||typeof sessionToken!=='string'||!sessionToken)return false;
 if(saved.mine!==sessionToken||!Array.isArray(saved.state?.patients))return false;
 return saved.state.patients.some(p=>p.id===sessionToken&&p.status!=='unknown');
}
