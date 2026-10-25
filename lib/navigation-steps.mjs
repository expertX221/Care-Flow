import {places,placeName,floorNames,landmarks} from '../src/data/hospital.mjs';
export function navigationSteps(path,lang='en'){
 const steps=[];
 for(let i=0;i<path.length;i++){
  let p=places.find(p=>p.id===path[i]);if(!p)continue;
  if(p.type==='lift'&&places.find(p=>p.id===path[i+1])?.type==='lift'){
   while(places.find(p=>p.id===path[i+1])?.type==='lift'){i++;p=places.find(p=>p.id===path[i]);}
   steps.push(`${placeName(p,lang)} → ${floorNames[lang][p.floor]}`);
  }else steps.push(`${placeName(p,lang)} · ${floorNames[lang][p.floor]} · ${landmarks[p.landmark][lang]}`);
 }
 return steps;
}
