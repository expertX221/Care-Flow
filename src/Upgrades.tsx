'use client';
import {useEffect,useRef,useState} from 'react';
import {upgradeCopy} from '../lib/upgrade-copy.mjs';
import {operationalInsights,personalReminder} from '../lib/upgrade-insights.mjs';
import {languages} from './i18n';
import {SpeakerHigh,CalendarBlank,ChartBar,ArrowRight,ArrowLeft,BellRinging,MapPin,CheckCircle,Monitor} from '@phosphor-icons/react';

const copy=(lang:string)=>upgradeCopy[lang]||upgradeCopy.en;
export function VoiceAssistant({lang,say,token,ahead,room,onMap,onRegister}:{lang:string;say:(text:string)=>void;token?:string;ahead?:number;room?:string;onMap:()=>void;onRegister:()=>void}){
 const c=copy(lang);const spoken=token?`${token}. ${c.queueHint} ${typeof ahead==='number'?ahead:''} ${room||''}`:c.hello;
 return <section className="upgrade-panel" aria-label={c.assist}>
  <div className="upgrade-heading"><SpeakerHigh size={24}/><h2>{c.assist}</h2></div>
  <div className="upgrade-actions">
   <button className="secondary" onClick={()=>say(spoken)}><SpeakerHigh size={19}/>{token?c.queue:c.hear}</button>
   <button className="secondary" onClick={()=>say(c.hello)}><SpeakerHigh size={19}/>{c.register}</button>
   <button className="secondary" onClick={()=>{say(c.routeHint);onMap()}}><MapPin size={19}/>{c.route}</button>
   {!token&&<button className="secondary" onClick={onRegister}><ArrowRight size={19}/>{c.register}</button>}
  </div><p className="upgrade-note">{c.queueHint}</p>
 </section>;
}
type Plan={at:string;department:string};
export function VisitPlanner({lang,onNotify}:{lang:string;onNotify:(text:string)=>void}){
 const c=copy(lang),[at,setAt]=useState(''),[dept,setDept]=useState('general'),[confirmed,setConfirmed]=useState(false);
 const fired=useRef('');
 useEffect(()=>{try{const p=JSON.parse(localStorage.getItem('cf-personal-reminder-v1')||'null');if(p&&typeof p.at==='string'){setAt(p.at);setDept(p.department||'general');setConfirmed(true)}}catch{}},[]);
 useEffect(()=>{if(!confirmed)return;const check=()=>{
  const status=personalReminder({at},Date.now());if(!status)return;
  const key=at+':'+status;if(fired.current===key||sessionStorage.getItem('cf-plan-alert')===key)return;
  fired.current=key;sessionStorage.setItem('cf-plan-alert',key);
  const body=status==='soon'?c.near:c.due;onNotify(body);
  if(typeof Notification!=='undefined'&&Notification.permission==='granted'){
   try{new Notification('CareFlow',{body,tag:'careflow-plan-'+status})}catch{}
  }
 };
 check();const timer=setInterval(check,60_000);return()=>clearInterval(timer);
 },[at,confirmed,lang,onNotify]);
 const save=()=>{const stamp=Date.parse(at);if(!at||!Number.isFinite(stamp)||stamp<Date.now()-60_000||stamp>Date.now()+365*864e5)return;
  localStorage.setItem('cf-personal-reminder-v1',JSON.stringify({at,department:dept} satisfies Plan));
  fired.current='';setConfirmed(true);onNotify(c.saved);
 };
 const clear=()=>{localStorage.removeItem('cf-personal-reminder-v1');setConfirmed(false);setAt('');fired.current=''};
 return <section className="upgrade-panel" aria-label={c.plan}>
  <div className="upgrade-heading"><CalendarBlank size={24}/><h2>{c.plan}</h2></div><p className="upgrade-note">{c.planHelp}</p>
  <div className="upgrade-fields"><label>{c.planning}<input type="datetime-local" value={at} onChange={e=>{setAt(e.target.value);setConfirmed(false)}}/></label>
  <label>Department <select value={dept} onChange={e=>{setDept(e.target.value);setConfirmed(false)}}><option value="general">General Medicine</option><option value="cardio">Cardiology</option><option value="ortho">Orthopaedics</option><option value="pediatric">Paediatrics</option></select></label></div>
  <div className="upgrade-actions"><button className="primary" onClick={save} disabled={!at||!Number.isFinite(Date.parse(at))||Date.parse(at)<Date.now()-60_000}>{c.save}</button>{confirmed&&<button className="secondary" onClick={clear}>{c.clear}</button>}</div>
  {confirmed&&<p role="status" className="upgrade-note"><CheckCircle size={16}/> {c.saved}: {at.replace('T',' ')}</p>}
 </section>;
}
export function StaffAnalytics({lang,state,departments}:{lang:string;state:any;departments:any[]}){
 const c=copy(lang),metrics=operationalInsights(state,departments);
 return <section className="upgrade-panel" aria-label={c.ops}>
  <div className="upgrade-heading"><ChartBar size={24}/><h2>{c.ops}</h2><span className="upgrade-note">{metrics.waiting} waiting · {metrics.done} completed</span></div>
  <div className="upgrade-analytics">{metrics.rows.map((r:any)=><article key={r.id} className="upgrade-analytics-row">
   <div><strong>{r.name}</strong><span className={`pressure pressure-${r.pressure}`} role="status">{c[r.pressure]}</span></div>
   <p>{r.waiting} waiting · {r.done} completed · {r.projected} min estimated backlog</p>
   <div className="upgrade-meter" role="img" aria-label={`${r.name}: ${r.waiting} waiting`}><span style={{width:`${Math.min(100,r.waiting/10*100)}%`}}/></div>
  </article>)}</div><p className="upgrade-note">{c.limits}</p>
 </section>;
}
const demoSteps=[
 {name:'Language and accessibility',description:'Choose a language; listen to its pronunciation and explore large text or assisted mode.',action:'language'},
 {name:'Patient registration and secure login',description:'Create a fictional OPD token. Returning patients need their token and private code.',action:'register'},
 {name:'Queue prediction and reminders',description:'Check wait ranges and a personal on-device reminder. These are estimates, not appointments.',action:'plan'},
 {name:'Step-free indoor directions',description:'Open the schematic multi-floor map and choose the lift-friendly route.',action:'map'},
 {name:'Staff workload and live board',description:'Examine departmental pressure, calls, delays and the public board; staff access requires a configured PIN.',action:'staff'},
];
export function JudgeTour({lang,onClose,onAction}:{lang:string;onClose:()=>void;onAction:(name:string)=>void}){
 const c=copy(lang),[step,setStep]=useState(0),item=demoSteps[step];
 return <section className="judge-tour" aria-label={c.demotitle}>
  <div className="upgrade-heading"><Monitor size={26}/><h2 id="modal-title">{c.demotitle}</h2></div>
  <p className="upgrade-note">{c.step} {step+1} / {demoSteps.length} · Fictional demo only</p>
  <div role="progressbar" aria-valuemin={1} aria-valuemax={demoSteps.length} aria-valuenow={step+1} aria-label="Walkthrough progress" className="upgrade-meter"><span style={{width:`${100*(step+1)/demoSteps.length}%`}}/></div>
  <h3>{item.name}</h3><p>{item.description}</p>
  <div className="upgrade-actions"><button className="primary" onClick={()=>{onClose();onAction(item.action)}}><ArrowRight size={18}/>{c.tourStart}</button>
   <button className="secondary" disabled={step===0} onClick={()=>setStep(s=>Math.max(0,s-1))}><ArrowLeft size={18}/>{c.previous}</button>
   <button className="secondary" disabled={step===demoSteps.length-1} onClick={()=>setStep(s=>Math.min(demoSteps.length-1,s+1))}>{c.next}<ArrowRight size={18}/></button>
  </div><button className="secondary full" onClick={onClose}>{c.close}</button>
 </section>;
}
