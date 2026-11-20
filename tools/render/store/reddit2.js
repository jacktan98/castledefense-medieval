// node reddit2.js W H DSF out-dir [town charge title]: a short Reddit video (Jack): the busy town on the green River isle by day,
// then knights charging out across Horsefields into a raider column, then the title. Join with node mix.js out-dir out.mp4
const L=require('./lib');const SC=require('./scenes');const fs=require('fs');
const [W,H,D,OUT]=[+process.argv[2],+process.argv[3],+process.argv[4],process.argv[5]];
// a portrait size (H > W) makes the 9:16 version for TikTok, Shorts and Reels: each camera is set up for it below
const PORT=H>W;const only=process.argv.slice(6);
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
   ['flowers',-4,0,1,0],['flowers',4,0,1,0],['well',4,5,1,0],['statue',-2,-3,1,0]],6);
  const c=center(castleB());layRoads([[[c.x,c.z+3.2],[c.x,c.z+12]],[[c.x-8,c.z+5],[c.x+8,c.z+5]]]);rebuildRoads();cacheCells();
  res.food=999;res.gold=500;res.wood=400;res.stone=300;PH.kind='day';PH.t=DAYLEN[0]*.7;SH.run(45);for(const v of villagers){v.sleeping=false;v.hunger=0;}PH.t=DAYLEN[0]*.7;SH.hud(false);
  const y0=(castleB().face||0)*Math.PI/2+.5;
  window.__tick=t=>{const k=t*t*(3-2*t);PH.t=DUSK+30-(DUSK+30-DUSK*.4)*k;SH.look(c.x,c.z+1,{yaw:y0+t*.55,pitch:.66-t*.06,dist:${PORT?'48-t*8':'34-t*6'},y:1.5});};
  window.__ok=buildings.length+' buildings '+villagers.length+' villagers';})()`);
 console.log('town',await G(p,'window.__ok'),p.errs.slice(0,3));
 await clip(p,'1-town',7,{fin:12,fout:8,cap:['Build','your town']});await p.close();}
// 2 the battle: the town's foot march in first, knights swing round both flanks, the raiders' army with siege shooting at two towers
if(want('charge')){const p=await L.open(env,'plains',W,H,D);
 await G(p,`(()=>{weatherReset(null);
  // troop buildings behind the castle, out of view, at mixed tiers; two archer towers out on the flanks
  SH.town([['stables',-4,6,3,0],['stables',4,6,2,0],['barracks',-10,4,3,0],['barracks',10,4,2,0],['barracks',-10,8,1,0]],34);
  UPK.lance=true;const K=castleB(),c=center(K);const x=c.x,z=c.z-10,fz=z-10;
  SH.town([['tower',-4,-5,3,0],['tower',5,-7,3,0]],0);
  SH.clearTrees(x,(z+fz)/2,16);for(const r of rocks)if(Math.hypot(r.x-x,r.z-(z+fz)/2)<16)r.amount=0;seatRocks();
  // a few trees here and there round the field, clear of the fighting and the flanking rides
  {let s=7;const R=()=>{s=(s*16807)%2147483647;return s/2147483647;};let n=0;for(let k=0;k<400&&n<22;k++){const tx=x-24+R()*48,tz=fz-8+R()*24;if(Math.abs(tx-x)<12.5&&tz>fz-4&&tz<z+4)continue;if(Math.hypot(tx-c.x,tz-c.z)<9||!canStand(tx,tz,2))continue;if(trees.some(t=>!t.dead&&Math.hypot(t.x-tx,t.z-tz)<2.2))continue;trees.push({x:tx,z:tz,s:.8+R()*.5,k:1});n++;}trunks.count=crowns.count=trees.length;const tc=new THREE.Color();trees.forEach((t,m)=>{const r=(Math.sin(t.x*12.9+t.z*78.2)*43758.5)%1;tc.setHSL(.27+(Math.abs(r)-.5)*.07,.3+Math.abs(r)*.15,.17+Math.abs(r)*.08);crowns.setColorAt(m,tc);});crowns.instanceColor.needsUpdate=true;seatTrees();}
  cacheCells();SH.run(4);SH.hud(false);for(const v of villagers){v.sleeping=false;v.hunger=0;}res.food=999;
  // the raiders' army at mixed tiers: foot in front, archers and crossbows among them, horsemen on the wings, siege at the back
  const KK=['spear','sword','spear','sword','spear','sword','archer','xbow','spear','sword'];let n=0;
  for(let i=0;i<400&&n<26;i++){const ex=x-6+Math.random()*12,ez=fz-Math.random()*5;if(canStand(ex,ez,2)&&!enemies.some(e=>Math.hypot(e.x-ex,e.z-ez)<1.1)){SH.spawn(KK[n%KK.length],1+n%3,ex,ez);n++;}}
  for(const [k,dx,dz,t] of [['rider',-8,-1,3],['lancer',-9,-3,1],['rider',8,-1,2],['lancer',9,-3,3]])SH.spawn(k,t,x+dx,fz+dz);
  for(const [k,dx,dz,t] of [['ballista',-4,-4,2],['catapult',2,-5,3],['ballista',6,-4,1]])SH.spawn(k,t,x+dx,fz+dz);
  for(const e of enemies){e.__sp=e.speed;e.speed=.0001;}
  SH.run(.3);assignPosts();
  const ST=buildings.filter(B=>B.type==='stables'),BK=buildings.filter(B=>B.type==='barracks');ST.forEach((B,i)=>setRally(B,{x:x-6+i*4,z:z+4}));BK.forEach((B,i)=>setRally(B,{x:x-6+i*4,z:z+6}));
  SH.run(22);
  // the foot in a line in front, the knights behind them split onto both flanks
  const R=()=>villagers.filter(v=>v.cav&&v.soldier&&!v.dead),F=()=>villagers.filter(v=>v.soldier&&!v.cav&&v.post&&v.post.B.type==='barracks'&&!v.dead);
  const put=(v,px,pz)=>{v.x=v.rx=px;v.z=v.rz=pz;v.g.position.set(px,walkY(px,pz),pz);v.g.rotation.y=Math.PI;v.hx=0;v.hz=-1;};
  const fv=F();fv.forEach((v,i)=>put(v,x-(fv.length-1)*.8+i*1.6,z-2+(i%2)*.5));
  // the knights behind them on both flanks, one stables to a wing
  ST.forEach((B,i)=>{const sd=i?1:-1;R().filter(v=>v.post.B===B).forEach((v,j)=>put(v,x+sd*(10+(j%2)*1.4),z+6+j*1.3));});
  ST.forEach((B,i)=>setRally(B,{x:x+(i?11:-11),z:z+7}));BK.forEach(B=>setRally(B,{x:x,z:z-2}));for(const v of [...R(),...F()])v.march=false;SH.run(.4);
  for(const B of buildings)if(B.rallyFlag)B.rallyFlag.visible=false;
  for(const e of enemies){e.speed=e.__sp||e.speed;e.hp=e.max=e.max*2.2;}
  // night: moonlight, a few torches along the raiders' line
  const lo=updateLight;updateLight=(dt,now)=>{light=0;lo(dt,now);};
  for(const [dx,dz] of [[-9,-2],[9,-3],[-3,-8],[7,3]]){const ci=Math.floor((x+dx)/CELL),cj=Math.floor((fz+dz)/CELL);place('torch',ci,cj,{instant:true,free:true,quiet:true});}lampT=0;
  const tx={};let st=0;
  // the wings: out wide past the foot, then wheel in on the raiders' flanks
  const wings=(dx,dz)=>{ST.forEach((B,i)=>setRally(B,{x:x+(i?dx:-dx),z:dz}));for(const v of R())v.march=false;};
  window.__tick=t=>{
   if(st===0&&t>.02){st=1;BK.forEach((B,i)=>setRally(B,{x:x-4+i*4,z:fz}));for(const v of F())v.march=false;}
   if(st===1&&t>.3){st=2;window.__ev.push([window.__fi||0,'rush',1]);wings(10,fz+2);}
   if(st===2&&t>.6){st=3;window.__ev.push([window.__fi||0,'neigh',.8]);wings(4,fz-2);}
   for(const B of buildings)if(B.rallyFlag)B.rallyFlag.visible=false;
   const a=st>=2?[...R(),...F()]:F(),f=enemies.filter(e=>!e.dead&&!e.engine);if(a.length){let ax=0,az=0;for(const v of a){ax+=v.rx;az+=v.rz;}ax/=a.length;az/=a.length;let bx=ax,bz=az;if(f.length){bx=0;bz=0;for(const e of f){bx+=e.x;bz+=e.z;}bx/=f.length;bz/=f.length;}const gx=ax*.5+bx*.5,gz=az*.5+bz*.5;if(tx.n===undefined){tx.x=gx;tx.z=gz;tx.n=1;}tx.x+=(gx-tx.x)*.06;tx.z+=(gz-tx.z)*.06;}
   SH.look(tx.x,tx.z,{yaw:+(window.YAW||${PORT?0:-1.6})+t*${PORT?.15:.3},pitch:${PORT?1.05:.74}+t*.05,dist:${PORT?'32+t*2':'18+t*2'},y:1.2});};
  window.__ok='riders '+R().length+' foot '+F().length+' foes '+enemies.length+' towers '+buildings.filter(B=>B.type==='tower').length+' manned '+buildings.filter(B=>B.type==='tower').map(B=>B.manned).join(',');})()`);
 console.log('charge',await G(p,'window.__ok'),p.errs.slice(0,3));
 await clip(p,'2-charge',12,{k:.8,fout:8,cap:['Charge','into battle']});
 console.log('end',await G(p,`'foes left '+enemies.filter(e=>!e.dead).length`));await p.close();}
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
fs.writeFileSync(`${OUT}/mix.json`,JSON.stringify({music:[['music/Medieval_theme_music_2.mp3','1-town','3-title',.14,35,3]],
 beds:[['sfx/Bird_chirping.mp3','1-town',.28],['sfx/Bird_chirping.mp3','2-charge',.1]],horn:false,
 keep:{'1-town':['chop','pick','hammer'],'2-charge':['rush','neigh','clash','kill','block','rockFire','rockHit','bolt','arrow'],'3-title':[]},rush:[5,1.6]}));
await env.b.close();env.server.close();})();
