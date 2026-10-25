// Explicitly preserve the strict TLS verification behavior of pg v8.
// pg v9 will interpret sslmode=require differently; avoid implicit defaults.
export function postgresConnectionString(raw) {
 if (typeof raw !== 'string' || !raw.trim()) throw new Error('Database connection is not configured');
 const url = new URL(raw);
 if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('Invalid database URL protocol');
 const sslMode = url.searchParams.get('sslmode');
 if (['require', 'prefer', 'verify-ca'].includes(sslMode)) url.searchParams.set('sslmode', 'verify-full');
 return url.toString();
}
