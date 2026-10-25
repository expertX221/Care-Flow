'use client';
import {useEffect,useRef,useState} from 'react';
import {floorSceneData} from '../lib/3d-floor-scene.mjs';
import {places,placeName,floorNames} from './data/hospital.mjs';

type Props={floor:number;route:string[];destination:string;lang:string;reducedMotion?:boolean};
type Controls={rotate:(amount:number)=>void;reset:()=>void;top:()=>void};

/** Optional 3D enhancement. The surrounding 2D map remains the authoritative fallback. */
export default function Hospital3D({floor,route,destination,lang,reducedMotion=false}:Props){
 const host=useRef<HTMLDivElement>(null),controls=useRef<Controls|null>(null);
 const [status,setStatus]=useState<'loading'|'ready'|'unavailable'>('loading');
 const [retry,setRetry]=useState(0);
 const routeKey=route.join('|');
 const target=places.find(p=>p.id===destination);
 const label=`${floorNames[lang]?.[floor]||floorNames.en[floor]} · ${target?placeName(target,lang):'Hospital'}`;
 useEffect(()=>{
  let stopped=false,dispose=()=>{};
  setStatus('loading');controls.current=null;
  const element=host.current;
  if(!element)return;
  async function open(){
   try{
    const THREE=await import('three');
    if(stopped)return;
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
    const scene=new THREE.Scene();scene.background=new THREE.Color('#f6f8ff');
    const camera=new THREE.PerspectiveCamera(42,1,0.1,700);
    const group=new THREE.Group();scene.add(group);
    const resources:{dispose:()=>void}[]=[];
    const own=<T extends {dispose:()=>void}>(item:T)=>{resources.push(item);return item};
    dispose=()=>{resources.forEach(x=>x.dispose());renderer.dispose();renderer.domElement.remove();controls.current=null};
    const material=(color:string)=>own(new THREE.MeshLambertMaterial({color}));
    const floorMaterial=material('#edf1fb'),roomMaterial=material('#c5d5f0'),selectedMaterial=material('#174fff');
    const walkwayMaterial=material('#b5c3dd'),routeMaterial=material('#0a40dc');
    const slab=new THREE.Mesh(own(new THREE.BoxGeometry(99,1,99)),floorMaterial);slab.position.set(0,-1,0);group.add(slab);
    scene.add(new THREE.HemisphereLight('#ffffff','#8791a8',2.4));
    const light=new THREE.DirectionalLight('#ffffff',2);light.position.set(35,80,40);scene.add(light);
    const data=floorSceneData(floor,routeKey?routeKey.split('|'):[],destination);
    const point=(p:{x:number;y:number},height:number)=>new THREE.Vector3(p.x-50,height,p.y-50);
    const line=(points:{x:number;y:number}[],height:number,width:number,mat:InstanceType<typeof THREE.MeshLambertMaterial>)=>{
     for(let i=1;i<points.length;i++){
      const a=point(points[i-1],height),b=point(points[i],height),delta=b.clone().sub(a),length=delta.length();if(!length)continue;
      const mesh=new THREE.Mesh(own(new THREE.CylinderGeometry(width,width,length,8)),mat);
      mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());group.add(mesh);
     }
    };
    data.paths.forEach(path=>line(path,0.1,1.15,walkwayMaterial));
    for(const room of data.rooms){
     const height=room.type==='lift'?5:room.type==='stairs'?2:3;
     const box=new THREE.Mesh(own(new THREE.BoxGeometry(12,height,9)),room.selected?selectedMaterial:roomMaterial);
     box.position.copy(point(room,height/2));group.add(box);
     const canvas=document.createElement('canvas');canvas.width=256;canvas.height=80;
     const context=canvas.getContext('2d');
     if(context){
      context.fillStyle=room.selected?'#ffffff':'#153571';context.font='bold 28px sans-serif';context.textAlign='center';context.textBaseline='middle';
      const text=room.roomCode||room.number||placeName(room,lang);context.fillText(String(text),128,40,246);
      const texture=own(new THREE.CanvasTexture(canvas));texture.colorSpace=THREE.SRGBColorSpace;
      const sprite=new THREE.Sprite(own(new THREE.SpriteMaterial({map:texture,depthTest:false,transparent:true})));
      sprite.position.copy(point(room,height+3));sprite.scale.set(13,4,1);sprite.renderOrder=2;group.add(sprite);
     }
    }
    data.highlighted.forEach(path=>line(path,3.4,.65,routeMaterial));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
    const canvas=renderer.domElement;canvas.setAttribute('aria-hidden','true');canvas.style.display='block';canvas.style.width='100%';canvas.style.height='100%';canvas.style.touchAction='pan-y';
    element.replaceChildren(canvas);
    const render=()=>{if(!stopped&&!document.hidden)renderer.render(scene,camera)};
    const reset=()=>{group.rotation.y=0;camera.up.set(0,1,0);camera.position.set(95,110,120);camera.lookAt(0,0,0);render()};
    const resize=()=>{const width=element.clientWidth||320,height=element.clientHeight||340;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();render()};
    controls.current={rotate(amount){group.rotation.y+=amount;render()},reset,top(){camera.up.set(0,0,-1);camera.position.set(0,170,.1);camera.lookAt(0,0,0);render()}};
    let dragging=false,lastX=0;
    const down=(event:PointerEvent)=>{if(event.pointerType==='touch')return;dragging=true;lastX=event.clientX;canvas.setPointerCapture(event.pointerId)};
    const move=(event:PointerEvent)=>{if(!dragging)return;group.rotation.y+=(event.clientX-lastX)*.008;lastX=event.clientX;render()};
    const up=()=>{dragging=false};
    const lost=(event:Event)=>{event.preventDefault();dispose();controls.current=null;setStatus('unavailable')};
    const visible=()=>render();
    canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('webglcontextlost',lost);
    document.addEventListener('visibilitychange',visible);
    const observer=new ResizeObserver(resize);observer.observe(element);
    dispose=()=>{observer.disconnect();document.removeEventListener('visibilitychange',visible);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('webglcontextlost',lost);resources.forEach(x=>x.dispose());renderer.dispose();canvas.remove();controls.current=null};
    reset();resize();setStatus('ready');
   }catch{dispose();if(!stopped){setStatus('unavailable');controls.current=null}}
  }
  open();
  return()=>{stopped=true;dispose()};
 },[floor,routeKey,destination,lang,retry]);
 return <section className="hospital-3d" aria-label="Interactive 3D hospital floor">
  <p className="hospital-3d-caption"><strong>3D floor view</strong> · {label}</p>
  <p className="muted">Blue marks your selected route and destination. This is a fictional floor plan.</p>
  <div ref={host} className="hospital-3d-canvas" role="img" aria-label={`3D schematic: ${label}. Use the buttons to change the view; accessible route steps remain below.`} style={{height:status==='unavailable'?0:340,width:'100%',maxWidth:'100%',overflow:'hidden',borderRadius:16}}/>
  {status==='loading'&&<p role="status">Loading the optional 3D view…</p>}
  {status==='unavailable'&&<p role="status">3D is unavailable on this device. The 2D map and written directions below remain available. <button className="secondary" type="button" onClick={()=>setRetry(x=>x+1)}>Retry 3D</button></p>}
  <div className="guide-controls" aria-label="3D view controls">
   <button type="button" className="secondary" disabled={status!=='ready'} onClick={()=>controls.current?.rotate(-Math.PI/6)}>Rotate left</button>
   <button type="button" className="secondary" disabled={status!=='ready'} onClick={()=>controls.current?.rotate(Math.PI/6)}>Rotate right</button>
   <button type="button" className="secondary" disabled={status!=='ready'} onClick={()=>controls.current?.top()}>Top view</button>
   <button type="button" className="secondary" disabled={status!=='ready'} onClick={()=>controls.current?.reset()}>Reset view</button>
  </div>
  <p className="muted">{reducedMotion?'Reduced motion: this scene moves only when you use a control.':'No automatic animation. Mouse users may also drag to rotate; touch users can use the buttons.'}</p>
 </section>;
}
