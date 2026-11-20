// node reddit2.js W H DSF out-dir [town charge title]: a short Reddit video (Jack): the busy town on the green River isle by day,
// then knights charging out across Horsefields into a raider column, then the title. Join with node mix.js out-dir out.mp4
const L=require('./lib');const SC=require('./scenes');const fs=require('fs');
const [W,H,D,OUT]=[+process.argv[2],+process.argv[3],+process.argv[4],process.argv[5]];const only=process.argv.slice(6);
const FPS=30;fs.mkdirSync(OUT,{recursive:true});
const G=(p,c)=>p.evaluate(c=>G(c),c);
const own=p=>p.evaluate(()=>G(`adaptResolution=()=>{};window.__T=window.__T||performance.now();window.requestAnimationFrame=cb=>{window.__cb=cb;return 1;};`));
const step=(p,k=1)=>p.evaluate(k=>{const cb=window.__cb;window.__cb=null;window.__T+=1000/30*k;if(cb)cb(window.__T);},k);
const hear=p=>G(p,`(()=>{if(window.__heard)return;window.__heard=1;window.__ev=[];const o=sfx;sfx=(n,at,v)=>{let g=v===undefined?1:v;if(at&&at.x!==undefined){const d=Math.hypot(at.x-target.x,at.z-target.z);g*=d<7?1:Math.max(.12,1-(d-7)/28);}window.__ev.push([window.__fi||0,n,g]);return o(n,at,v);};})()`);
const fade=(p,o)=>p.evaluate(o=>{let d=document.getElementById('fadeDiv');if(!d){d=document.createElement('div');d.id='fadeDiv';d.style.cssText='position:fixed;inset:0;background:#000;z-index:9999;pointer-events:none';document.body.appendChild(d);}d.style.opacity=o;},o);
const capSet=(p,c)=>p.evaluate(([c,W,H])=>{let d=document.getElementById('capDiv');if(!d){const l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=IM+Fell+English+SC&display=block';document.head.appendChild(l);
  d=document.createElement('div');d.id='capDiv';const u=Math.min(W,H*1.6);d.style.cssText='position:fixed;left:0;bottom:0;width:70%;height:60%;z-index:9990;pointer-events:none;opacity:0;background:radial-gradient(ellipse at 0% 100%,rgba(10,6,2,.78) 0%,rgba(10,6,2,.38) 45%,rgba(10,6,2,0) 75%)';
  d.innerHTML='<div style="position:absolute;left:'+Math.round(u*.045)+'px;bottom:'+Math.round(u*.04)+'px;font-family:\'IM Fell English SC\',serif;color:#f6d77a;line-height:.92;text-shadow:0 0 2px #2a1606,0 '+Math.round(u*.004)+'px 0 #2a1606,0 '+Math.round(u*.008)+'px '+Math.round(u*.018)+'px rgba(0,0,0,.85);-webkit-text-stroke:'+Math.max(1,Math.round(u*.0022))+'px #3a2009;paint-order:stroke fill"><b style="display:block;font-weight:400;font-size:'+Math.round(u*.075)+'px"></b><span style="display:block;font-size:'+Math.round(u*.055)+'px;color:#fff1c8"></span></div>';document.body.appendChild(d);}
  d.querySelector('b').textContent=c[0];d.querySelector('span').textContent=c[1];return document.fonts.ready.then(()=>1);},[c,W,H]);
const capShow=(p,o)=>p.evaluate(o=>{const d=document.getElementById('capDiv');if(d){d.style.opacity=o;d.firstChild.style.transform='translateY('+(1-o)*14+'px)';}},o);
const shot=(p,name,i)=>p.screenshot({path:`${OUT}/${name}-${String(i).padStart(4,'0')}.png`});
// every: render only every n-th frame (a quick look at a part)
const EVERY=+process.env.EVERY||1;
async function clip(p,name,secs,{fin=0,fout=0,k=1,cap=null,capT=3}={}){await own(p);await hear(p);if(cap){await capSet(p,cap);await p.waitForTimeout(700);}await G(p,`barOn=()=>false;for(const e of enemies)if(e.dead)e.__g=1;`);const n=Math.round(secs*FPS),c1=capT*FPS;
 await p.evaluate(()=>{window.__ev=[];});
 for(let i=0;i<n;i++){const t=i/(n-1);await p.evaluate(([t,i])=>{window.__fi=i;G('window.__tick&&__tick('+t+');for(const e of enemies)if(e.dead&&!e.__g){e.__g=1;window.__ev.push([window.__fi,\'kill\',1]);}');},[t,i]);await step(p,k);
  if(i%EVERY)continue;await capShow(p,cap?Math.max(0,Math.min(1,(i-6)/10,(c1-i)/12)):0);await fade(p,Math.max(0,fin?1-i/fin:0,fout?1-(n-1-i)/fout:0));await shot(p,name,i);}
 const ev=await p.evaluate(()=>window.__ev||[]);fs.writeFileSync(`${OUT}/${name}.json`,JSON.stringify(ev));console.log('clip',name,n,p.errs.slice(0,2));}
const want=s=>!only.length||only.includes(s);
(async()=>{const env=await L.start();
// 1 the town: the title screen's lush green River isle by day, a busy tier-3 town round the castle, the camera circling slowly
if(want('town')){const p=await L.open(env,'vale',W,H,D);
 await G(p,`(()=>{MAP='isle';plainMap=true;greenLook=true;try{startGame();}finally{plainMap=false;}weatherReset(null);
  for(const id of ['newCards'])document.getElementById(id).hidden=true;paused=false;
  SH.town([['house',-3,-1,3,0],['house',-3,1,2,0],['house',-2,3,3,0],['house',3,1,2,0],['house',3,-1,3,0],['house',-4,3,2,0],['house',4,3,3,0],
   ['market',1,4,3,0],['tower',-3,-4,3,0],['tower',3,-4,3,0],['tower',5,3,2,0],['farm',-7,-1,3,0],['farm',-7,2,2,0],['barracks',0,-5,3,0],
   ['lodge',-6,5,2,0],['quarry',6,-2,2,0],['torch',-1,2,1,0],['torch',1,2,1,0],['campfire',-1,6,1,0],['banner',2,-3,1,0],
   ['flowers',-4,0,1,0],['flowers',4,0,1,0],['well',4,5,1,0],['statue',-2,-3,1,0]],16);
  const c=center(castleB());layRoads([[[c.x,c.z+3.2],[c.x,c.z+12]],[[c.x-8,c.z+5],[c.x+8,c.z+5]]]);rebuildRoads();cacheCells();
  res.food=999;res.gold=500;res.wood=400;res.stone=300;PH.kind='day';PH.t=DAYLEN[0]*.7;SH.run(45);for(const v of villagers){v.sleeping=false;v.hunger=0;}PH.t=DAYLEN[0]*.7;SH.hud(false);
  const y0=(castleB().face||0)*Math.PI/2+.5;
  window.__tick=t=>{const k=t*t*(3-2*t);PH.t=DUSK+30-(DUSK+30-DUSK*.4)*k;SH.look(c.x,c.z+1,{yaw:y0+t*.55,pitch:.66-t*.06,dist:34-t*6,y:1.5});};
  window.__ok=buildings.length+' buildings '+villagers.length+' villagers';})()`);
 console.log('town',await G(p,'window.__ok'),p.errs.slice(0,3));
 await clip(p,'1-town',7,{fin:12,fout:8,cap:['Build','your town']});await p.close();}
// 2 the charge: knights ride out across the open plains into a raider column coming down on the town
if(want('charge')){const p=await L.open(env,'plains',W,H,D);
 await G(p,`(()=>{weatherReset(null);
  // the stables behind the castle, out of view; the riders are brought out to the field once mounted
  SH.town([['stables',-6,6,3,0],['stables',-2,7,3,0],['stables',2,7,3,0],['stables',6,6,3,0]],16);
  UPK.lance=true;const K=castleB(),c=center(K);const x=c.x,z=c.z-10,fz=z-11;
  SH.clearTrees(x,(z+fz)/2,16);for(const r of rocks)if(Math.hypot(r.x-x,r.z-(z+fz)/2)<16)r.amount=0;seatRocks();
  // a few trees here and there round the field, clear of the charge's path
  {let s=7;const R=()=>{s=(s*16807)%2147483647;return s/2147483647;};let n=0;for(let k=0;k<400&&n<22;k++){const tx=x-22+R()*44,tz=fz-8+R()*24;if(Math.abs(tx-x)<6.5&&tz>fz-3&&tz<z+3)continue;if(Math.hypot(tx-c.x,tz-c.z)<9||!canStand(tx,tz,2))continue;if(trees.some(t=>!t.dead&&Math.hypot(t.x-tx,t.z-tz)<2.2))continue;trees.push({x:tx,z:tz,s:.8+R()*.5,k:1});n++;}trunks.count=crowns.count=trees.length;const tc=new THREE.Color();trees.forEach((t,m)=>{const r=(Math.sin(t.x*12.9+t.z*78.2)*43758.5)%1;tc.setHSL(.27+(Math.abs(r)-.5)*.07,.3+Math.abs(r)*.15,.17+Math.abs(r)*.08);crowns.setColorAt(m,tc);});crowns.instanceColor.needsUpdate=true;seatTrees();}
  cacheCells();SH.run(4);SH.hud(false);for(const v of villagers){v.sleeping=false;v.hunger=0;}res.food=999;
  const KK=['spear','sword','spear','sword','spear','archer','spear','sword','xbow','spear'];let n=0;
  for(let i=0;i<300&&n<30;i++){const ex=x-7+Math.random()*14,ez=fz-Math.random()*6;if(canStand(ex,ez,2)&&!enemies.some(e=>Math.hypot(e.x-ex,e.z-ez)<1.1)){SH.spawn(KK[n%KK.length],1+(n%3===0?1:0),ex,ez);n++;}}
  for(const e of enemies){e.__sp=e.speed;e.speed=.0001;}
  SH.run(.3);assignPosts();
  const ST=buildings.filter(B=>B.type==='stables');ST.forEach((B,i)=>setRally(B,{x:x-6+i*4,z:z+4}));
  SH.run(22);
  // every rider in two neat ranks on the start line, facing the raiders
  const R=()=>villagers.filter(v=>v.cav&&v.soldier&&!v.dead);R().forEach((v,i)=>{const px=x-5.5+(i%6)*2.2+(i>5?1.1:0),pz=z+(i>5?1.6:0);v.x=v.rx=px;v.z=v.rz=pz;v.g.position.set(px,walkY(px,pz),pz);v.g.rotation.y=Math.PI;v.hx=0;v.hz=-1;});
  ST.forEach((B,i)=>setRally(B,{x:x-6+i*4,z:z}));for(const v of R())v.march=false;SH.run(.6);
  for(const B of buildings)if(B.rallyFlag)B.rallyFlag.visible=false;
  for(const e of enemies){e.speed=e.__sp||e.speed;e.hp=e.max=e.max*2.2;}
  // night: moonlight, a few torches along the raiders' line
  const lo=updateLight;updateLight=(dt,now)=>{light=0;lo(dt,now);};
  for(const [dx,dz] of [[-9,-2],[9,-3],[-3,-8],[7,3]]){const ci=Math.floor((x+dx)/CELL),cj=Math.floor((fz+dz)/CELL);place('torch',ci,cj,{instant:true,free:true,quiet:true});}lampT=0;
  const tx={};let rushed=0;
  window.__tick=t=>{if(!rushed&&t>.04){rushed=1;window.__ev.push([window.__fi||0,'rush',1]);ST.forEach((B,i)=>setRally(B,{x:x-6+i*4,z:fz-2}));for(const v of R())v.march=false;}
   for(const B of buildings)if(B.rallyFlag)B.rallyFlag.visible=false;
   const r=R(),f=enemies.filter(e=>!e.dead);if(r.length){let ax=0,az=0;for(const v of r){ax+=v.rx;az+=v.rz;}ax/=r.length;az/=r.length;let bx=ax,bz=az;if(f.length){bx=0;bz=0;for(const e of f){bx+=e.x;bz+=e.z;}bx/=f.length;bz/=f.length;}const gx=ax*.6+bx*.4,gz=az*.6+bz*.4;if(tx.n===undefined){tx.x=gx;tx.z=gz;tx.n=1;}tx.x+=(gx-tx.x)*.06;tx.z+=(gz-tx.z)*.06;}
   SH.look(tx.x,tx.z,{yaw:+(window.YAW||-1.6)+t*.4,pitch:.76+t*.06,dist:15+t*3,y:1.2});};
  window.__ok='riders '+R().length+' foes '+enemies.length+' trees+';})()`);
 console.log('charge',await G(p,'window.__ok'),p.errs.slice(0,3));
 await clip(p,'2-charge',10,{k:.8,fout:8,cap:['Charge','into battle']});
 console.log('end',await G(p,`'foes left '+enemies.filter(e=>!e.dead).length`));await p.close();}
// 3 the title, and where to get it
if(want('title')){const p=await L.open(env,SC.title.map,W,H,D);await G(p,SC.title.code);
 await p.addStyleTag({content:'.gameTitle{top:9vh!important}'});await p.waitForTimeout(3000);
 await p.evaluate(()=>{const t=document.querySelector('.gameTitle'),cs=getComputedStyle(t),d=document.createElement('div');d.id='awaits';d.innerHTML='<div><div class=l1>Full game</div><img src="/site/img/appstore-badge.svg"><div class=l2>Play the demo on itch.io</div></div>';
  d.style.cssText='position:fixed;left:0;right:0;bottom:0;height:44%;display:flex;align-items:center;justify-content:center;z-index:9998;opacity:0;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.55) 45%,rgba(0,0,0,.7))';
  const s=d.firstChild,F=parseFloat(cs.fontSize);s.style.cssText=`display:flex;flex-direction:column;align-items:center;gap:${F*.18}px;font-family:${cs.fontFamily};letter-spacing:.03em;text-shadow:0 3px 14px rgba(0,0,0,.9)`;
  s.querySelector('.l1').style.cssText=`color:#fff1c8;font-size:${F*.5}px;-webkit-text-stroke:1.5px #3a2009;paint-order:stroke fill`;
  s.querySelector('img').style.cssText=`height:${F*1.15}px;filter:drop-shadow(0 4px 12px rgba(0,0,0,.8))`;
  s.querySelector('.l2').style.cssText=`color:#f6d77a;font-size:${F*.62}px;-webkit-text-stroke:2px #3a2009;paint-order:stroke fill;text-shadow:0 3px 14px rgba(0,0,0,.9),0 0 22px rgba(243,207,110,.35)`;document.body.appendChild(d);});
 await G(p,`window.__tick=t=>{const d=document.getElementById('awaits');if(d){const k=Math.min(1,Math.max(0,(t-.3)/.25));d.style.opacity=k;d.firstChild.style.transform='scale('+(1.08-.08*k)+')';}}`);
 await clip(p,'3-title',4.5,{fin:12});await p.close();}
fs.writeFileSync(`${OUT}/mix.json`,JSON.stringify({music:[['music/Medieval_theme_music.mp3','1-town','1-town',.15,0,1.2],['music/Night_theme_music.mp3','2-charge','2-charge',.2,4,1.6],['music/Medieval_theme_music_2.mp3','3-title','3-title',.13,35]],
 beds:[['sfx/Bird_chirping.mp3','1-town',.28],['sfx/Bird_chirping.mp3','2-charge',.1]],horn:false,
 keep:{'1-town':['chop','pick','hammer'],'2-charge':['rush','clash','kill','block'],'3-title':[]}}));
await env.b.close();env.server.close();})();
