 'use client';
import {useEffect,useState} from 'react';
import {callResponseWindow} from '../lib/local-workflow.mjs';
export default function CallControls({patient,busy,onRecall,onNoShow}:{patient:any;busy:boolean;onRecall:()=>void;onNoShow:()=>void}){
 const [now,setNow]=useState(()=>Date.now());useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t)},[]);
 const window=callResponseWindow(patient,now);if(!window)return null;
 return <div className="call-controls"><p>{window.overdue?'Response window elapsed — check with nearby staff before marking no-show.':`Response window: ${Math.floor(window.remainingSeconds/60)}:${String(window.remainingSeconds%60).padStart(2,'0')}`}</p><button className="secondary" disabled={busy} onClick={onRecall}>Recall {patient.id}</button><button className="secondary" disabled={busy||!window.overdue} onClick={()=>{if(confirm(`Mark ${patient.id} as no-show? They can rejoin later. No visit record is deleted.`))onNoShow()}}>Mark no-show</button><small>Recall starts a fresh five-minute response window. No automatic skipping.</small></div>
}
