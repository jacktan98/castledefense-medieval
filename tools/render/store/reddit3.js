// node reddit3.js W H DSF out-dir [grow title]: a timelapse Reddit video (Jack): "From hovel to castle", one fixed camera on a town
// growing from a bare palisade fort to a full tier-3 town while day and night come round every few seconds, then the title.
// Join with node mix.js out-dir out.mp4
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
// 1 the timelapse: the castle a bare palisade fort; houses, fields, workshops and towers rise round it one by one, nearest first,
// each in stages like a site, and are upgraded on their own times; the walls go up and turn to stone; the castle becomes a keep, then
// a castle; day and night come round every few seconds (lit by the town's torches at night), the game running fast so people bustle
if(want('grow')){const p=await L.open(env,'cross',W,H,D);
 await G(p,`(()=>{for(const B of buildings.slice())removeBuilding(B,false,true);for(const v of villagers)scene.remove(v.g);villagers.length=0;road.fill(0);rebuildRoads();cacheCells();regionDirty=true;weatherReset(null);
  const ev0=findValid('castle',Math.floor(N/2)-1,Math.floor(N/2)-1,{free:true});const K=place('castle',ev0.ci,ev0.cj,{instant:true,free:true,quiet:true});SH.face(K,0);const c=center(K),ci=Math.floor(c.x/CELL),cj=Math.floor(c.z/CELL);SH.clearTrees(c.x,c.z,20);
  for(const r of rocks){const a=Math.floor(r.x/CELL),b=Math.floor(r.z/CELL);if(Math.abs(a-ci)<=7&&Math.abs(b-cj)<=7)r.amount=0;}seatRocks();cacheCells();
  SH.walls([[ci-7,cj-7],[ci+7,cj-7],[ci+7,cj+7],[ci-7,cj+7],[ci-7,cj-7]],3,[[ci,cj+7],[ci+7,cj]]);
  SH.town([['tower',-6,-6,3,0],['tower',6,-6,3,0],['tower',-6,6,3,0],['tower',6,6,3,0],
   ['house',-2,3,3,0],['house',2,3,2,0],['house',-4,2,3,0],['house',3,-3,3,0],['house',-3,-3,2,0],['house',0,-4,3,0],['house',-5,-3,3,0],['house',5,-1,3,0],['house',-1,5,2,0],
   ['farm',-5,0,3,0],['farm',-4,-5,2,0],['market',3,1,3,0],['lodge',-3,5,2,0],['quarry',4,-5,2,0],['barracks',4,4,3,0],
   ['well',2,-2,1,0],['torch',-1,3,1,0],['torch',1,3,1,0],['torch',-1,-3,1,0],['torch',4,2,1,0],['flowers',-2,-2,1,0],['banner',-2,2,1,0],['campfire',5,2,1,0],['statue',1,-2,1,0]],10);
  for(const B of buildings.slice())if(B.type!=='wall'&&B.type!=='gate'&&B!==K){const q=center(B);if(Math.abs(q.x-c.x)>13||Math.abs(q.z-c.z)>13)removeBuilding(B,false,true);}
  const gz=(cj+7.5)*CELL,gx=(ci+7.5)*CELL;layRoads([[[c.x,c.z+3.2],[c.x,gz+6]],[[c.x+3.2,c.z],[gx+6,c.z]]]);rebuildRoads();cacheCells();
  res.food=res.gold=res.wood=res.stone=9999;SH.run(40);SH.hud(false);
  window.__ok=buildings.length+' buildings '+villagers.length+' villagers';})()`);
 console.log('grow',await G(p,'window.__ok'),p.errs.slice(0,3));
 await G(p,`(()=>{const K=castleB(),c=center(K);let s=11;const R=()=>{s=(s*16807)%2147483647;return s/2147483647;};
  // nearest first, walls a little later; each has its own rise and upgrade times (fractions of the part)
  const L=buildings.filter(B=>B!==K).map(B=>({B,t:B.tier,w:B.type==='wall'||B.type==='gate',d:Math.hypot(center(B).x-c.x,center(B).z-c.z)})).sort((a,b)=>(a.d+(a.w?7:0))-(b.d+(b.w?7:0)));
  L.forEach((o,i)=>{o.a=.04+.5*i/L.length;o.u2=o.t>=2?Math.min(.9,o.a+.1+R()*.35):9;o.u3=o.t>=3?Math.min(.95,Math.max(o.u2+.08,.5)+R()*.3):9;});
  const RISE=.05;const pop=(B,up)=>{B.pop=window.__T;const q=center(B);for(let n=0;n<6;n++){const a=n/6*6.283;dustAt(q.x+Math.cos(a)*1.2,hAt(q.x,q.z),q.z+Math.sin(a)*1.2);}
   if(B===K){window.__ev.push([window.__fi||0,'castleUp',1]);return;}if(B.type!=='wall'&&B.type!=='gate')sfx('build',{x:q.x,z:q.z},up?.55:.7);};
  const set=(B,t)=>{if(B.tier>=t)return;B.tier=t;B.max=DEF[B.type].hp[t-1];B.hp=B.max;swapModel(B);if(B.type==='wall'||B.type==='gate')refreshWalls();pop(B,1);};
  for(const o of L){o.B.tier=1;o.B.max=DEF[o.B.type].hp[0];o.B.hp=o.B.max;swapModel(o.B);}K.tier=1;swapModel(K);refreshWalls();for(const o of L)o.B.group.visible=false;
  paused=false;PH.kind='day';
  // day and night on a timer: CYC cycles over the part; within each, day, dusk, night, dawn
  const CYC=5;let LT=1,DK=0;const lo=updateLight;updateLight=(dt,now)=>{light=LT;PH.t=Math.max(2,DUSK*(1-DK));skyT=0;lo(0,now);updateClouds(dt);};
  const sm=x=>{x=Math.min(1,Math.max(0,x));return x*x*(3-2*x);};
  window.__tick=t=>{for(const o of L){
    if(t>=o.a&&!o.done){o.B.group.visible=true;const k=(t-o.a)/RISE;if(k<1)stageSite(o.B,k);else{stageSite(o.B,-1);o.done=true;pop(o.B,0);}}if(t>=o.u2&&o.done)set(o.B,2);if(t>=o.u3&&o.done)set(o.B,3);}
   if(t>=.4)set(K,2);if(t>=.72)set(K,3);
   const f=(t*CYC+.15)%1;
   // day .0-.42, dusk to .55, night to .82, dawn to 1
   if(f<.42){LT=1;DK=0;}else if(f<.55){const k=sm((f-.42)/.13);LT=1-k;DK=Math.sin(k*Math.PI)*.9+(k>.5?0:0);}else if(f<.82){LT=0;DK=0;}else{const k=sm((f-.82)/.18);LT=k;DK=Math.sin(k*Math.PI)*.8;}
   res.food=res.gold=res.wood=res.stone=9999;for(const v of villagers){v.hunger=0;v.sleeping=false;}
   SH.cam({yaw:-.35,pitch:1.02,dist:37,dx:0,dz:1.5,y:1});};})()`);
 await clip(p,'1-grow',20,{k:2.5,fin:12,fout:10,cap:['From hovel','to castle'],capT:4});await p.close();}
// 3 the title, and where to get it
if(want('title')){const p=await L.open(env,SC.title.map,W,H,D);await G(p,SC.title.code);
 await p.addStyleTag({content:'.gameTitle{top:9vh!important}'});await p.waitForTimeout(3000);
 const BADGE='data:image/svg+xml;base64,'+fs.readFileSync(__dirname+'/../../../site/img/appstore-badge.svg').toString('base64');
 // itch.io's mark (simple-icons, CC0), drawn in itch.io's red on a black badge like Apple's
 const ITCH=fs.readFileSync(__dirname+'/itchio-mark.svg','utf8').match(/ d="([^"]+)"/)[1];
 await p.evaluate(([B,I])=>{const t=document.querySelector('.gameTitle'),cs=getComputedStyle(t),d=document.createElement('div');d.id='awaits';
  d.innerHTML='<div><div class=col><div class=l1>Full game</div><img src="'+B+'"></div><div class=col><div class=l1>Free demo</div><div class=itch><svg viewBox="0 0 24 24"><path fill="#fa5c5c" d="'+I+'"/></svg><div><small>Play the demo on</small><b>itch.io</b></div></div></div></div>';
  d.style.cssText='position:fixed;left:0;right:0;bottom:0;height:44%;display:flex;align-items:center;justify-content:center;z-index:9998;opacity:0;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.55) 45%,rgba(0,0,0,.7))';
  const s=d.firstChild,F=parseFloat(cs.fontSize),h=F*1.35;s.style.cssText=`display:flex;align-items:flex-end;gap:${F*.9}px;font-family:${cs.fontFamily};letter-spacing:.03em;text-shadow:0 3px 14px rgba(0,0,0,.9)`;
  for(const c of s.querySelectorAll('.col'))c.style.cssText=`display:flex;flex-direction:column;align-items:center;gap:${F*.18}px`;
  for(const l of s.querySelectorAll('.l1'))l.style.cssText=`color:#fff1c8;font-size:${F*.6}px;-webkit-text-stroke:1.5px #3a2009;paint-order:stroke fill`;
  s.querySelector('img').style.cssText=`height:${h}px;filter:drop-shadow(0 4px 12px rgba(0,0,0,.8))`;
  const it=s.querySelector('.itch');it.style.cssText=`height:${h}px;box-sizing:border-box;display:flex;align-items:center;gap:${h*.2}px;padding:0 ${h*.32}px 0 ${h*.24}px;background:#000;border:${h/40}px solid #a6a6a6;border-radius:${h*.2}px;font-family:'Helvetica Neue',Helvetica,'Liberation Sans',Arial,sans-serif;letter-spacing:0;text-shadow:none;filter:drop-shadow(0 4px 12px rgba(0,0,0,.8))`;
  it.querySelector('svg').style.cssText=`height:${h*.62}px;width:${h*.62}px`;
  it.querySelector('div').style.cssText=`display:flex;flex-direction:column;color:#fff;line-height:1`;
  it.querySelector('small').style.cssText=`font-size:${h*.2}px;margin-bottom:${h*.04}px`;
  it.querySelector('b').style.cssText=`font-size:${h*.46}px;font-weight:700;letter-spacing:-.01em`;
  document.body.appendChild(d);},[BADGE,ITCH]);
 await G(p,`window.__tick=t=>{const d=document.getElementById('awaits');if(d){const k=Math.min(1,Math.max(0,(t-.3)/.25));d.style.opacity=k;d.firstChild.style.transform='scale('+(1.08-.08*k)+')';}}`);
 await clip(p,'3-title',4.5,{fin:12});await p.close();}
fs.writeFileSync(`${OUT}/mix.json`,JSON.stringify({music:[['music/Medieval_theme_music_2.mp3','1-grow','3-title',.14,35,3]],
 beds:[['sfx/Bird_chirping.mp3','1-grow',.18]],horn:false,keep:{'1-grow':['castleUp','build'],'3-title':[]}}));
await env.b.close();env.server.close();})();
