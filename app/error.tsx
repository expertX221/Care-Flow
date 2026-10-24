'use client';
import {useEffect,useState} from 'react';
import {dictionaries,Language} from '../src/i18n';
import {deviceText} from '../src/device-i18n';
export default function ErrorPage({reset}:{reset:()=>void}){const [lang,setLang]=useState<Language>('en');useEffect(()=>{try{const code=JSON.parse(localStorage.getItem('cf-settings')||'{}').lang;if(dictionaries[code])setLang(code)}catch{}},[]);const t=dictionaries[lang],u=deviceText[lang];return <main lang={lang} className="ps-accessible" style={{padding:40,maxWidth:700,margin:'auto'}}><h1>{t.tryAgain}</h1><p style={{margin:'20px 0'}}>{u.failed}</p><p>{t.syncError}</p><button className="primary" onClick={reset}>{t.tryAgain}</button><a className="emergency" href="tel:112">{t.emergency} · 112</a></main>}
