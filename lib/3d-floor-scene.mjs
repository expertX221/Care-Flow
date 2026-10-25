import {places,edges} from '../src/data/hospital.mjs';
import {floorPlanPoint,floorPlanSegmentPath} from '../src/data/floor-plan.mjs';

// The 3D scene consumes the very same orthogonal paths as the 2D guide.
export function schematicPolyline(path){
 const tokens=String(path).match(/[MHV]|-?(?:\d*\.)?\d+/g)||[];
 let x=0,y=0,i=0;const points=[];
 while(i<tokens.length){
  const command=tokens[i++];
  if(command==='M'){x=Number(tokens[i++]);y=Number(tokens[i++]);}
  else if(command==='H')x=Number(tokens[i++]);
  else if(command==='V')y=Number(tokens[i++]);
  else throw Error('Unsupported schematic path');
  if(!Number.isFinite(x)||!Number.isFinite(y))throw Error('Invalid schematic coordinate');
  points.push({x,y});
 }
 return points;
}
export function floorSceneData(floor,route=[],destination=''){
 if(![0,1,2].includes(floor))throw Error('Invalid floor');
 const rooms=places.filter(p=>p.floor===floor&&p.type!=='corridor').map(p=>({...p,...floorPlanPoint(p),selected:p.id===destination}));
 const paths=edges.filter(e=>{const a=places.find(p=>p.id===e.from),b=places.find(p=>p.id===e.to);return a?.floor===floor&&b?.floor===floor}).map(e=>schematicPolyline(floorPlanSegmentPath(places.find(p=>p.id===e.from),places.find(p=>p.id===e.to))));
 const highlighted=[];
 for(let i=1;i<route.length;i++){
  const a=places.find(p=>p.id===route[i-1]),b=places.find(p=>p.id===route[i]);
  if(a?.floor===floor&&b?.floor===floor&&edges.some(e=>(e.from===a.id&&e.to===b.id)||(e.to===a.id&&e.from===b.id)))highlighted.push(schematicPolyline(floorPlanSegmentPath(a,b)));
 }
 return {rooms,paths,highlighted};
}
