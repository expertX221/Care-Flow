const names=(en,hi,ta,te,ml,kn)=>({en,hi,ta,te,ml,kn});
export const floorNames=names(['Ground floor','First floor','Second floor'],['भूतल','पहली मंज़िल','दूसरी मंज़िल'],['தரைத் தளம்','முதல் தளம்','இரண்டாம் தளம்'],['నేల అంతస్తు','మొదటి అంతస్తు','రెండవ అంతస్తు'],['താഴത്തെ നില','ഒന്നാം നില','രണ്ടാം നില'],['ನೆಲ ಮಹಡಿ','ಮೊದಲ ಮಹಡಿ','ಎರಡನೇ ಮಹಡಿ']);
export const types={
 entrance:names('Main entrance','मुख्य प्रवेश','முதன்மை நுழைவு','ప్రధాన ప్రవేశం','പ്രധാന പ്രവേശനം','ಮುಖ್ಯ ಪ್ರವೇಶ'),
 registration:names('Registration counters','पंजीकरण काउंटर','பதிவு மையம்','నమోదు కౌంటర్లు','രജിസ്ട്രേഷൻ കൗണ്ടർ','ನೋಂದಣಿ ಕೌಂಟರ್'),
 help:names('Help desk','सहायता केंद्र','உதவி மையம்','సహాయ కేంద్రం','സഹായ കേന്ദ്രം','ಸಹಾಯ ಕೇಂದ್ರ'),
 emergency:names('Emergency (Casualty)','आपातकाल (Casualty)','அவசரம் (Casualty)','అత్యవసరం (Casualty)','അടിയന്തരം (Casualty)','ತುರ್ತು (Casualty)'),
 pharmacy:names('Pharmacy','दवा की दुकान','மருந்தகம்','మందుల దుకాణం','ഫാർമസി','ಔಷಧಾಲಯ'),
 lab:names('Laboratory','प्रयोगशाला','ஆய்வகம்','ప్రయోగశాల','ലബോറട്ടറി','ಪ್ರಯೋಗಾಲಯ'),
 xray:names('X-ray','एक्स-रे (X-ray)','எக்ஸ்-ரே (X-ray)','ఎక్స్-రే (X-ray)','എക്സ്-റേ (X-ray)','ಎಕ್ಸ್-ರೇ (X-ray)'),
 water:names('Drinking water','पीने का पानी','குடிநீர்','తాగునీరు','കുടിവെള്ളം','ಕುಡಿಯುವ ನೀರು'),
 toilet:names('Toilets','शौचालय','கழிப்பறை','మరుగుదొడ్డి','ശൗചാലയം','ಶೌಚಾಲಯ'),
 wheelchair:names('Wheelchair point','व्हीलचेयर केंद्र','சக்கர நாற்காலி மையம்','చక్రాల కుర్చీ కేంద్రం','വീൽചെയർ കേന്ദ്രം','ಗಾಲಿಕುರ್ಚಿ ಕೇಂದ್ರ'),
 lift:names('Lift','लिफ्ट','மின்தூக்கி','లిఫ్ట్','ലിഫ്റ്റ്','ಲಿಫ್ಟ್'),stairs:names('Stairs','सीढ़ियाँ','படிக்கட்டு','మెట్లు','പടികൾ','ಮೆಟ್ಟಿಲು'),
 ramp:names('Ramp','रैंप','சாய்வுப் பாதை','వాలు దారి','ചരിവുപാത','ಇಳಿಜಾರು ದಾರಿ'),
 room:names('OPD room','OPD कमरा','OPD அறை','OPD గది','OPD മുറി','OPD ಕೊಠಡಿ'),
 ward:names('Ward','वार्ड','வார்டு','వార్డు','വാർഡ്','ವಾರ್ಡ್'),
 waiting:names('Waiting hall A','प्रतीक्षा हॉल A','காத்திருப்பு அரங்கு A','వేచి ఉండే హాలు A','കാത്തിരിപ്പ് ഹാൾ A','ಕಾಯುವ ಸಭಾಂಗಣ A'),
 nurses:names('Nurses’ station','नर्स केंद्र','செவிலியர் மையம்','నర్సుల కేంద్రం','നഴ്‌സുമാരുടെ കേന്ദ്രം','ದಾದಿಯರ ಕೇಂದ್ರ'),
 corridor:names('Main corridor','मुख्य गलियारा','முதன்மை நடைபாதை','ప్రధాన కారిడార్','പ്രധാന ഇടനാഴി','ಮುಖ್ಯ ನಡುದಾರಿ')};
export const landmarks={blue:names('opposite the blue chairs','नीली कुर्सियों के सामने','நீல நாற்காலிகளுக்கு எதிரில்','నీలి కుర్చీలకు ఎదురుగా','നീല കസേരകൾക്ക് എതിർവശം','ನೀಲಿ ಕುರ್ಚಿಗಳ ಎದುರು'),water:names('next to the drinking water sign','पीने के पानी के संकेत के पास','குடிநீர் பலகைக்கு அருகில்','తాగునీటి బోర్డు పక్కన','കുടിവെള്ള ബോർഡിനടുത്ത്','ಕುಡಿಯುವ ನೀರಿನ ಫಲಕದ ಬಳಿ'),lift:names('beside the lift sign','लिफ्ट के संकेत के पास','மின்தூக்கி பலகைக்கு அருகில்','లిఫ్ట్ బోర్డు పక్కన','ലിഫ്റ്റ് ബോർഡിനടുത്ത്','ಲಿಫ್ಟ್ ಫಲಕದ ಬಳಿ'),red:names('follow the red Emergency signs','लाल आपातकाल संकेतों की ओर','சிவப்பு அவசர பலகைகளைப் பின்பற்றவும்','ఎరుపు అత్యవసర బోర్డులను అనుసరించండి','ചുവന്ന അടിയന്തര ബോർഡുകൾ പിന്തുടരുക','ಕೆಂಪು ತುರ್ತು ಫಲಕಗಳನ್ನು ಅನುಸರಿಸಿ')};
export const places=[];
function add(id,type,floor,x,y,landmark='blue',number){places.push({id,type,floor,x,y,landmark,number})}
for(let f=0;f<3;f++){add('corridor-'+f,'corridor',f,50,55,'lift');add('lift-'+f,'lift',f,48,70,'lift');add('stairs-'+f,'stairs',f,65,70,'lift');if(f<2)add('toilets-'+f,'toilet',f,12,28,'water')}
add('entrance','entrance',0,50,92,'lift');add('registration','registration',0,20,72);add('help','help',0,30,55);add('emergency','emergency',0,83,72,'red');add('pharmacy','pharmacy',0,83,28);add('lab','lab',0,65,28,'water');add('xray','xray',0,65,42);add('water','water',0,30,28,'water');add('wheelchair','wheelchair',0,20,88);add('ramp','ramp',0,50,83,'lift');
for(let i=1;i<=8;i++)add('opd-'+i,'room',1,[15,35,55,78][(i-1)%4],i<=4?25:43,'blue',i);
add('waiting','waiting',1,82,78,'water');for(let i=4;i<=6;i++)add('ward-'+i,'ward',2,[20,50,80][i-4],30,'blue',i);add('nurses','nurses',2,25,75,'lift');
export const edges=[];
function link(a,b,metres,stairs=false){edges.push({from:a,to:b,metres,stairs})}
for(const p of places){if(p.type==='corridor')continue;if(p.id==='entrance'||p.id==='ramp')continue;const c=places.find(n=>n.id==='corridor-'+p.floor);link(c.id,p.id,Math.max(4,Math.round(Math.hypot(p.x-c.x,p.y-c.y)*.6)))}
link('entrance','ramp',8);link('ramp','corridor-0',17);for(let f=0;f<2;f++){link('lift-'+f,'lift-'+(f+1),15);link('stairs-'+f,'stairs-'+(f+1),19,true)}
export function placeName(p,lang='en'){return (types[p.type]?.[lang]||types[p.type]?.en||p.id)+(p.number?' '+p.number:'')}
export function shortestPath(start,end,avoid=true){if(!places.some(p=>p.id===start)||!places.some(p=>p.id===end))throw Error('Unknown hospital place');const dist={[start]:0},prev={},pending=[start],done=new Set();while(pending.length){pending.sort((a,b)=>dist[a]-dist[b]);const u=pending.shift();if(done.has(u))continue;done.add(u);if(u===end)break;for(const e of edges){if(avoid&&e.stairs)continue;const v=e.from===u?e.to:e.to===u?e.from:null;if(!v)continue;const n=dist[u]+e.metres;if(n<(dist[v]??Infinity)){dist[v]=n;prev[v]=u;pending.push(v)}}}if(!Number.isFinite(dist[end]))return {path:[],distance:Infinity};let node=end,path=[];while(node){path.unshift(node);node=prev[node]}return {path,distance:dist[end]}}
export const hospital={name:'City District Hospital',simulated:true,places,edges};
