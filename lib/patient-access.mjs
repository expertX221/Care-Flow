// Access codes are bearer credentials. A retry with the same random registration
// request ID must not invalidate a previously printed visit slip.
export function hasPatientAccess(patient,digest){
 return !!patient&&typeof digest==='string'&&!!digest&&(
  patient._accessHash===digest||
  (Array.isArray(patient._otherAccessHashes)&&patient._otherAccessHashes.includes(digest))
 );
}
export function addPatientAccess(patient,digest){
 if(!patient||typeof digest!=='string'||!digest)throw Error('Invalid patient access digest');
 if(patient._accessHash&&patient._accessHash!==digest){
  patient._otherAccessHashes=[...new Set([...(patient._otherAccessHashes||[]),patient._accessHash])].slice(-6);
 }
 patient._accessHash=digest;
 return patient;
}
