export default {
 reactStrictMode:true,
 distDir:process.env.VERCEL?'.next':process.env.CAREFLOW_DEV==='1'?'.careflow-dev':'.careflow-build',
 devIndicators:false,
 experimental:{webpackBuildWorker:false,cpus:1},
 async headers(){return [{source:'/(.*)',headers:[
  {key:'Referrer-Policy',value:'no-referrer'},
  {key:'X-Content-Type-Options',value:'nosniff'},
  {key:'X-Frame-Options',value:'DENY'},
  {key:'Permissions-Policy',value:'geolocation=()'},
 ]}]}
};
