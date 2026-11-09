import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const $=id=>document.getElementById(id);
const canvas=$('world');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(innerWidth,innerHeight); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping;
const scene=new THREE.Scene(); scene.background=new THREE.Color('#07121d');scene.fog=new THREE.FogExp2('#07121d',0.018);
const camera=new THREE.PerspectiveCamera(53,innerWidth/innerHeight,.035,300);camera.position.set(10,6,15);
scene.add(new THREE.HemisphereLight(0xbcecff,0x132636,2.3));const sun=new THREE.DirectionalLight(0xb5f6ff,3);sun.position.set(8,14,7);scene.add(sun);
const domeRoot=new THREE.Group();scene.add(domeRoot);const environment=new THREE.Group();scene.add(environment);
const radius=5; const panelMeshes=[]; let importedDome=null; let importedPanels=null;
const glass=new THREE.MeshPhysicalMaterial({color:0x70c9dc,metalness:.12,roughness:.19,transparent:true,opacity:.17,side:THREE.DoubleSide,depthWrite:false});
const rimMat=new THREE.MeshBasicMaterial({color:0x74e6ec,transparent:true,opacity:.8,side:THREE.DoubleSide});
const metal=new THREE.MeshStandardMaterial({color:0x164452,metalness:.75,roughness:.28});
const floor=new THREE.Mesh(new THREE.CylinderGeometry(5.04,5.04,.13,96),new THREE.MeshStandardMaterial({color:0x12333d,metalness:.5,roughness:.35}));floor.position.y=-.1;domeRoot.add(floor);
const floorRings=new THREE.GridHelper(10,20,0x31747d,0x18404a);floorRings.position.y=.01;domeRoot.add(floorRings);
// A hemisphere of spherical hexagonal cells. The caps near the top are intentionally stylized.
function addCell(theta,phi,sz,index){const center=new THREE.Vector3(radius*Math.sin(theta)*Math.cos(phi),radius*Math.cos(theta),radius*Math.sin(theta)*Math.sin(phi));const n=center.clone().normalize();const tangent=new THREE.Vector3(-Math.sin(phi),0,Math.cos(phi));const bitangent=new THREE.Vector3().crossVectors(n,tangent).normalize();const verts=[];for(let i=0;i<6;i++){const a=i*Math.PI/3+Math.PI/6;const p=center.clone().addScaledVector(tangent,Math.cos(a)*sz).addScaledVector(bitangent,Math.sin(a)*sz).normalize().multiplyScalar(radius);verts.push(p)}const positions=[];for(let i=0;i<6;i++)positions.push(...center.toArray(),...verts[i].toArray(),...verts[(i+1)%6].toArray());const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.computeVertexNormals();const mesh=new THREE.Mesh(g,glass.clone());mesh.userData={panel:index,center:center.clone(),normal:n.clone()};domeRoot.add(mesh);panelMeshes.push(mesh);const outline=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(verts),new THREE.LineBasicMaterial({color:0x75dce7,transparent:true,opacity:.67}));domeRoot.add(outline)}
let index=0;for(let row=0;row<8;row++){const theta=.14+row*.192;const count=Math.max(6,Math.round(2*Math.PI*Math.sin(theta)*radius/1.38));for(let i=0;i<count;i++)addCell(theta,(i+(row%2)*.5)*Math.PI*2/count,Math.min(.71,Math.PI*radius*Math.sin(theta)/count*.83),index++)}
const proceduralShell=new THREE.Group();
// The procedural shell remains as an offline fallback.
for (const child of [...domeRoot.children]) { if (child!==floor && child!==floorRings) proceduralShell.add(child); }
domeRoot.add(proceduralShell);
const baseRing=new THREE.Mesh(new THREE.TorusGeometry(radius,.065,10,120),metal);baseRing.rotation.x=Math.PI/2;domeRoot.add(baseRing);
const edgeLights=new THREE.PointLight(0x4ce6f4,25,17);edgeLights.position.set(0,3,0);domeRoot.add(edgeLights);
const inside=new THREE.Group();domeRoot.add(inside);
function box(w,h,d,x,y,z,color){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,metalness:.18,roughness:.66}));m.position.set(x,y,z);inside.add(m);return m}
function makeInterior(mode){inside.clear();if(mode==='LIVING'){box(2.7,.55,1.05,-1.3,.38,-1.25,0x7c9fa5);box(2.7,.8,.25,-1.3,.82,-1.65,0x7c9fa5);box(1,.28,.75,-1,.35,.45,0x47717a);box(1.2,.12,1.2,1.65,.4,-.9,0x759e9e)}else if(mode==='GARDEN'){for(let i=0;i<12;i++){let a=i*2.4;const x=Math.cos(a)*(.8+i*.19),z=Math.sin(a)*(.8+i*.19);box(.48,.35,.48,x,.2,z,0x467b6d);const p=new THREE.Mesh(new THREE.ConeGeometry(.3,.7,7),new THREE.MeshStandardMaterial({color:0x51c49b}));p.position.set(x,.75,z);inside.add(p)}}else if(mode==='FITNESS'){for(let i=0;i<4;i++)box(.65,.07,1.7,-2+i*1.3,.08,0,0x4086a3);box(2,.12,.3,0,.85,-1.8,0x8faab4)}else{for(let i=0;i<4;i++){const m=box(.12,1.9,1.5,-2+i*1.3,1.05,-1.5,0x4e91a4);m.material.emissive=new THREE.Color(0x16465b)}}}
makeInterior('LIVING');
const stars=new THREE.BufferGeometry();const pts=[];for(let i=0;i<900;i++)pts.push((Math.random()-.5)*150,Math.random()*65-5,(Math.random()-.5)*150);stars.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));scene.add(new THREE.Points(stars,new THREE.PointsMaterial({color:0x77a7b4,size:.045,transparent:true,opacity:.6})));
function clearEnvironment(){while(environment.children.length){const m=environment.children[0];environment.remove(m);m.geometry?.dispose();if(m.material){(Array.isArray(m.material)?m.material:[m.material]).forEach(v=>v.dispose())}}}
function makeEnvironment(type){clearEnvironment();let color=0x123443,ground=0x193c47; if(type==='ANTARCTICA'){color=0x9bbbd2;ground=0xc4d8e0}else if(type==='WILDERNESS'){color=0x34594b;ground=0x345344}else if(type==='ROOFTOP'){color=0x1e354d;ground=0x243948}scene.background=new THREE.Color(color);scene.fog.color.setHex(color);const land=new THREE.Mesh(new THREE.CylinderGeometry(70,70,.45,80),new THREE.MeshStandardMaterial({color:ground,roughness:.95}));land.position.y=-.45;environment.add(land);if(type==='ROOFTOP'){for(let i=0;i<34;i++){let a=i*2.4,r=14+(i%5)*5;const h=3+(i*7%18);const m=new THREE.Mesh(new THREE.BoxGeometry(2+(i%3),h,2+(i%4)),new THREE.MeshStandardMaterial({color:0x243c4c,metalness:.2}));m.position.set(Math.cos(a)*r,h/2-1,Math.sin(a)*r);environment.add(m)}}if(type==='WILDERNESS'){for(let i=0;i<60;i++){let a=i*2.4,r=9+(i%9)*3;const m=new THREE.Mesh(new THREE.ConeGeometry(.5+(i%3)*.2,2+(i%5),6),new THREE.MeshStandardMaterial({color:0x25554c}));m.position.set(Math.cos(a)*r,1,Math.sin(a)*r);environment.add(m)}}if(type==='ANTARCTICA'){for(let i=0;i<26;i++){let a=i*2.4,r=10+(i%7)*3;const m=new THREE.Mesh(new THREE.DodecahedronGeometry(1+(i%3),0),new THREE.MeshStandardMaterial({color:0xe3f4fa,roughness:.9}));m.scale.y=.35;m.position.set(Math.cos(a)*r,.2,Math.sin(a)*r);environment.add(m)}}}
makeEnvironment('ROOFTOP');
const orbit=new OrbitControls(camera,canvas);orbit.enableDamping=true;orbit.dampingFactor=.065;orbit.minDistance=7;orbit.maxDistance=35;orbit.maxPolarAngle=Math.PI*.49;orbit.target.set(0,1,0);orbit.enabled=false;
let view='home',transition=null,gyroEnabled=false,gyroBase=null,deviceAngles=null,interiorYaw=0,interiorPitch=0,dragging=false,lastPointer=null,gyroOrbitOffset=0;
const targets={home:{p:[11,6,16],t:[0,1.7,0]},interior:{p:[0,1.75,.2],t:[0,1.75,-3]},structure:{p:[5.9,3.6,5.7],t:[3.1,2.65,2.9]},applications:{p:[15,10,23],t:[0,1,0]}};
function moveCamera(key,duration=1450){const t=targets[key];transition={start:performance.now(),duration,fromP:camera.position.clone(),toP:new THREE.Vector3(...t.p),fromT:orbit.target.clone(),toT:new THREE.Vector3(...t.t)};orbit.enabled=false}
function toast(message){$('toast').textContent=message;$('toast').style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').style.display='none',3500)}
const descriptions={interior:['01 / INTERIOR','INSIDE THE DOME','Look around with your phone or drag. Change the activity mode.'],structure:['02 / TECHNOLOGY','MODULAR SYSTEM','Tap a hexagonal panel to explore its potential function.'],applications:['03 / APPLICATIONS','ONE DOME. MANY PLACES.','Orbit the habitat and explore different possible locations.']};
const actions={interior:['LIVING','GARDEN','FITNESS','EXHIBITION'],structure:['SOLAR','SKYLIGHT','VENTILATION','INSULATION','RAINWATER','SHADING'],applications:['ROOFTOP','WILDERNESS','ANTARCTICA']};
function setView(next){view=next;document.body.classList.toggle('exploring',next!=='home');$('hud').hidden=next==='home';$('home').hidden=next==='home';$('panel').hidden=true;gyroBase=null;const t=descriptions[next];if(t){$('view-index').textContent=t[0];$('view-title').textContent=t[1];$('view-desc').textContent=t[2];$('modes').replaceChildren();for(const action of actions[next]){const b=document.createElement('button');b.textContent=action;b.onclick=()=>selectAction(action,b);$('modes').appendChild(b)}if(next==='interior'||next==='applications')$('modes').firstChild?.classList.add('active')}moveCamera(next);$('hint').textContent=next==='interior'?'DRAG TO LOOK · ENABLE MOTION ON MOBILE':next==='structure'?'TAP THE DOME PANELS · DRAG TO ORBIT':'DRAG TO ORBIT · PINCH TO ZOOM · ENABLE MOTION';}
function selectAction(action,button){button.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active'));button.classList.add('active');if(view==='interior'){makeInterior(action);toast(`Interior mode: ${action}. Transition animation placeholder.`)}else if(view==='applications'){makeEnvironment(action);toast(`Environment: ${action}`)}else{showPanel(action)}}
const panelInfo={SOLAR:'Photovoltaic panels may help generate electricity when sufficient sunlight is available.',SKYLIGHT:'Transparent panels introduce daylight into the interior.',VENTILATION:'Ventilation panels help regulate airflow and indoor air quality.',INSULATION:'Insulated panels reduce heat exchange between indoor and outdoor conditions.',RAINWATER:'Collection surfaces could direct rainwater into storage and treatment systems.',SHADING:'Adjustable shading can help manage direct sunlight and solar heat gain.'};
function showPanel(name){$('panel-title').textContent=name;$('panel-desc').textContent=panelInfo[name];$('panel').hidden=false}
$('panel-close').onclick=()=>$('panel').hidden=true;
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));$('home').onclick=()=>{setView('home');window.scrollTo(0,0)};$('brand').onclick=()=>{setView('home');window.scrollTo(0,0)};
const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();canvas.addEventListener('click',e=>{if(view!=='structure'||transition)return;pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);raycaster.setFromCamera(pointer,camera);const targetsForClick=importedPanels?[importedPanels]:panelMeshes;const hit=raycaster.intersectObjects(targetsForClick,true)[0];if(hit){const names=actions.structure;const index=importedPanels ? (hit.faceIndex??0) : hit.object.userData.panel;showPanel(names[index%names.length])}});
canvas.addEventListener('pointerdown',e=>{if(view!=='interior'||transition)return;dragging=true;lastPointer=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!dragging||view!=='interior'||transition||!lastPointer)return;interiorYaw-=(e.clientX-lastPointer[0])*.004;interiorPitch=THREE.MathUtils.clamp(interiorPitch-(e.clientY-lastPointer[1])*.004,-1.2,1.2);lastPointer=[e.clientX,e.clientY]});canvas.addEventListener('pointerup',()=>{dragging=false;lastPointer=null});canvas.addEventListener('pointercancel',()=>{dragging=false;lastPointer=null});
$('gyro').onclick=async()=>{if(gyroEnabled){gyroEnabled=false;gyroBase=null;$('gyro').textContent='ENABLE MOTION';toast('Motion control disabled');return}if(typeof DeviceOrientationEvent==='undefined'){toast('Device orientation is not available in this browser');return}try{if(typeof DeviceOrientationEvent.requestPermission==='function'){const permission=await DeviceOrientationEvent.requestPermission();if(permission!=='granted'){toast('Motion permission was not granted');return}}gyroEnabled=true;gyroBase=null;$('gyro').textContent='MOTION ON';toast('Motion enabled. Rotate the phone to look around.')}catch(e){toast('Motion permission failed: '+e.message)}};
window.addEventListener('deviceorientation',e=>{if(e.alpha===null||e.beta===null||e.gamma===null)return;deviceAngles={alpha:e.alpha,beta:e.beta,gamma:e.gamma};});
function gyroRotation(){if(!gyroEnabled||!deviceAngles)return null;const {alpha,beta,gamma}=deviceAngles;const orient=screen.orientation?.angle??window.orientation??0;const euler=new THREE.Euler(THREE.MathUtils.degToRad(beta),THREE.MathUtils.degToRad(alpha),-THREE.MathUtils.degToRad(gamma),'YXZ');const q=new THREE.Quaternion().setFromEuler(euler);q.multiply(new THREE.Quaternion(-Math.sqrt(.5),0,0,Math.sqrt(.5)));q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),-THREE.MathUtils.degToRad(orient)));if(!gyroBase){gyroBase=q.clone().invert()}return gyroBase.clone().multiply(q)}
function updateCamera(now){if(transition){const u=Math.min(1,(now-transition.start)/transition.duration);const k=u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;camera.position.lerpVectors(transition.fromP,transition.toP,k);orbit.target.lerpVectors(transition.fromT,transition.toT,k);camera.lookAt(orbit.target);if(u>=1){transition=null;gyroBase=null;if(view==='applications'||view==='structure'){orbit.enabled=true;orbit.target.copy(new THREE.Vector3(...targets[view].t));orbit.minDistance=view==='structure'?4:7;orbit.maxDistance=view==='structure'?16:40}else orbit.enabled=false;if(view==='interior'){interiorYaw=0;interiorPitch=0}}return}if(view==='home'){orbit.enabled=false;camera.lookAt(0,1.7,0);return}if(view==='interior'){const base=new THREE.Quaternion().setFromEuler(new THREE.Euler(interiorPitch,interiorYaw,0,'YXZ'));const g=gyroRotation();if(g)base.multiply(g);camera.quaternion.copy(base)}else{orbit.update();if(view==='applications'&&gyroEnabled&&deviceAngles){const g=gyroRotation();if(g){const e=new THREE.Euler().setFromQuaternion(g,'YXZ');const desired=THREE.MathUtils.clamp(e.y,-.6,.6);const delta=desired-gyroOrbitOffset;camera.position.sub(orbit.target).applyAxisAngle(new THREE.Vector3(0,1,0),delta*.12).add(orbit.target);gyroOrbitOffset+=delta*.12;camera.lookAt(orbit.target)}}}}
function render(now){requestAnimationFrame(render);updateCamera(now);if(view==='home'&&!transition){const scroll=Math.min(1,scrollY/Math.max(1,innerHeight));camera.position.set(11+scroll*3,6+scroll*2,16+scroll*4);camera.lookAt(0,1.7,0)}renderer.render(scene,camera)}requestAnimationFrame(render);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});


// Blender model integration. All three meshes remain independent for later interactions.
export async function loadDomeGLB(url='./public/models/adaptive-dome.glb') {
  const gltf=await new GLTFLoader().loadAsync(url);
  const model=gltf.scene;
  // The supplied model is already ~10m wide and Y-up, but normalize future replacements.
  const bounds=new THREE.Box3().setFromObject(model);
  const size=bounds.getSize(new THREE.Vector3());
  if (size.x<0.01 || size.y<0.01 || size.z<0.01) throw new Error('Empty model bounds');
  const scale=10/Math.max(size.x,size.z);
  model.scale.setScalar(scale);
  const normalized=new THREE.Box3().setFromObject(model);
  const center=normalized.getCenter(new THREE.Vector3());
  model.position.set(-center.x,-normalized.min.y,-center.z);
  model.traverse(object=>{
    if (!object.isMesh) return;
    const name=object.name.toLowerCase();
    if (name.includes('panels')) {
      importedPanels=object;
      object.material=new THREE.MeshPhysicalMaterial({color:0x9bdce6,metalness:0,roughness:.13,transmission:.78,thickness:.025,transparent:true,opacity:.45,side:THREE.DoubleSide,depthWrite:false});
    } else if (name.includes('frame')) {
      object.material=new THREE.MeshStandardMaterial({color:0x538b9b,metalness:.7,roughness:.27,side:THREE.DoubleSide});
    }
  });
  if(importedDome) domeRoot.remove(importedDome);
  importedDome=model;
  domeRoot.add(model);
  proceduralShell.visible=false;
  floor.visible=false;
  floorRings.visible=false;
  baseRing.visible=false;
  return model;
}
loadDomeGLB().catch(err=>{console.error('Could not load Blender dome:',err);toast('GLB load failed. Showing procedural fallback dome.')});
window.ADAPT_DEBUG={scene,camera,domeRoot,setView,loadDomeGLB};
