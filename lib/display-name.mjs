export function displayName(value){const w=String(value||'').trim().split(/\s+/);return /^[\p{L}]\.?$/u.test(w[0])||/^(dr|mr|mrs|ms|prof)\.?$/i.test(w[0])?w.slice(0,2).join(' '):w[0]||''}
