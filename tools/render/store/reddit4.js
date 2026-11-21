// node reddit4.js W H DSF out-dir: a real game played start to finish, sped up (Jack): Market Cross played by bot.js the way a
// person plays it (a house, lumber and fields first, more lumber, a quarry and towers before the first night, then more each day,
// the arrow volley and the riders at night) until every night is survived. Each frame is GS seconds of game; the frames are then
// picked evenly down to SECS seconds of video, so however long the game took it plays in 20 s, while the camera circles the
// town clockwise. Render the ending first (node reddit3.js W H DSF out-dir title), then this, then node mix.js out-dir out.mp4
const L=require('./lib');const BOT=require('./bot');const fs=require('fs');
const [W,H,D,OUT]=[+process.argv[2],+process.argv[3],+process.argv[4],process.argv[5]];
const FPS=30,SECS=+process.env.SECS||20,GS=+process.env.GS||1,TURNS=+process.env.TURNS||1;
// nights go at a quarter of the day's pace, so the fights get their share of the video; the camera turns by frame, so at an
// even speed in the video (EST: about how many frames the game takes)
const NIGHT_K=+process.env.NIGHT_K||.25,EST=+process.env.EST||1000;fs.mkdirSync(OUT,{recursive:true});
const G=(p,c)=>p.evaluate(c=>G(c),c);
const own=p=>p.evaluate(()=>G(`adaptResolution=()=>{};window.__T=window.__T||performance.now();window.requestAnimationFrame=cb=>{window.__cb=cb;return 1;};if(!performance.__own){performance.__own=1;performance.now=()=>window.__T;}`));
const step=p=>p.evaluate(()=>{const cb=window.__cb;window.__cb=null;window.__T+=1000/30;if(cb)cb(window.__T);});
const hear=p=>G(p,`(()=>{window.__ev=[];const o=sfx;sfx=(n,at,v)=>{let g=v===undefined?1:v;if(at&&at.x!==undefined){const d=Math.hypot(at.x-target.x,at.z-target.z);g*=d<9?1:Math.max(.15,1-(d-9)/30);}window.__ev.push([window.__fi||0,n,g]);return o(n,at,v);};})()`);
(async()=>{const env=await L.start();const p=await L.open(env,'cross',W,H,D);
 // no guide, the top panel only (the dock and hints hidden), the world beyond the map's edge filled in for the circling camera
 console.log(await p.evaluate(b=>G(`guideOn=false;$('#guide').hidden=true;window.__r=${b};SH.back({});SH.hud('top');__r`),BOT));
 await p.addStyleTag({content:'#tipPill,#pauseBtn,.raidMark,.hitMark,#powers,#wavePop{display:none!important}'});
 await own(p);await hear(p);
 await G(p,`(()=>{const K=castleB(),c=center(K);window.__c={x:c.x,z:c.z};window.__gt=0;window.__yaw0=yaw;window.__end=-1;
  // the camera: on the town's middle (the castle and what has been built, eased), circling clockwise (seen from above, yaw falls)
  window.__cam=()=>{let x=0,z=0,n=0;for(const B of buildings)if(!B.dead&&B.type!=='wall'&&B.type!=='path'){const q=center(B);if(Math.hypot(q.x-__c.x,q.z-__c.z)>22)continue;x+=q.x;z+=q.z;n++;}
    if(n){__c.x+=(x/n-__c.x)*.08;__c.z+=(z/n-__c.z)*.08;}target.set(__c.x,1.2,__c.z);yaw=__yaw0-__fr/${(EST/TURNS).toFixed(1)}*Math.PI*2;pitch=.86;dist=33;updateCam();};
  // one frame: GS seconds of the game in steps, the player's move each game second, a few seconds on after the win
  window.__fr=0;window.__play=()=>{const gs=PH.kind==='night'?${GS}*${NIGHT_K}:${GS},n=Math.max(1,Math.round(gs/.05));__fr++;for(let i=0;i<n;i++){if(gameOver&&__end<0)__end=__gt;if(__end>=0&&__gt-__end>5.5)break;tick(.05,performance.now());__gt+=.05;}
    // the light follows the game's time, not the frame's (else the sped-up nights never got dark)
    {const k=skyT;updateLight(gs,performance.now());skyT=k;}updateHud();
    BOT.step();for(const v of villagers)if(v.sbar)v.sbar.grp.visible=false;__cam();return __end>=0&&__gt-__end>5.5;};})()`);
 await G(p,`barOn=()=>false;`);
 let i=0;for(;i<3000;i++){await p.evaluate(i=>{window.__fi=i;},i);const done=await G(p,'__play()');await step(p);
  // the win's summary card opens on a timer: the video ends just before it
  if(await G(p,`!$('#summary').hidden`))break;
  await p.screenshot({path:`${OUT}/raw-${String(i).padStart(5,'0')}.png`});if(i%100===0)console.log('frame',i,await G(p,`PH.kind+PH.wave+' '+buildings.filter(B=>!B.dead).length+'b '+villagers.length+'v'`),p.errs.slice(0,2));if(done)break;}
 const total=fs.readdirSync(OUT).filter(f=>/^raw-/.test(f)).length,info=await G(p,`JSON.stringify({log:BOT.log,win:!!castleB()&&!enemies.some(e=>!e.dead&&!e.dormant),gt:__gt|0,slain:stats.slain,lost:stats.lostB})`);console.log('raw frames',total,info);
 // pick the frames evenly down to SECS seconds, and their sounds with them
 const n=SECS*FPS,ev=await p.evaluate(()=>window.__ev||[]);
 for(const f of fs.readdirSync(OUT))if(/^1-play-\d+\.png$/.test(f))fs.unlinkSync(`${OUT}/${f}`);
 for(let k=0;k<n;k++){const j=Math.min(total-1,Math.round(k*(total-1)/(n-1)));fs.copyFileSync(`${OUT}/raw-${String(j).padStart(5,'0')}.png`,`${OUT}/1-play-${String(k).padStart(4,'0')}.png`);}
 for(const f of fs.readdirSync(OUT))if(/^raw-\d+\.png$/.test(f))fs.unlinkSync(`${OUT}/${f}`);
 fs.writeFileSync(`${OUT}/1-play.json`,JSON.stringify(ev.map(([f,nm,g])=>[Math.round(f*(n-1)/(total-1)),nm,g])));
 fs.writeFileSync(`${OUT}/game.json`,info);
 fs.writeFileSync(`${OUT}/mix.json`,JSON.stringify({music:[['music/Medieval_theme_music_2.mp3','1-play','3-title',.22,35,3]],
  beds:[['sfx/Bird_chirping.mp3','1-play',.14]],keep:{'1-play':['horn','build','kill','victory'],'3-title':[]}}));
 await env.b.close();env.server.close();})();
