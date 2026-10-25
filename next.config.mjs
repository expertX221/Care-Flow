export default {
 reactStrictMode:true,
 distDir:process.env.VERCEL?'.next':process.env.CAREFLOW_DEV==='1'?'.careflow-dev':'.careflow-build',
 devIndicators:false,
 experimental:{webpackBuildWorker:false,cpus:1},
 async headers(){return [{source:'/(.*)',headers:[
  {key:'Referrer-Policy',value:'no-referrer'},
  {key:'X-Content-Type-Options',value:'nosniff'},
  {key:'X-Frame-Options',value:'DENY'},
  {key:'Content-Security-Policy',value:"object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"},
  ...(process.env.NODE_ENV==='production'?[{key:'Strict-Transport-Security',value:'max-age=31536000'}]:[]),
  {key:'Permissions-Policy',value:'geolocation=(), camera=(self), microphone=(self)'},
 ]}]}
};
