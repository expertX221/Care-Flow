'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main style={{padding:40,maxWidth:700,margin:'auto'}}><h1>Let’s reconnect your visit.</h1><p style={{margin:'20px 0'}}>Something interrupted this screen. Your confirmed token is still saved in the demo room.</p><button className="primary" onClick={reset}>Try again</button></main>}
