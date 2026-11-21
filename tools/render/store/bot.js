// A player for the timelapse gameplay video (reddit4.js): plays a stage the way a person would, paying for everything and
// leaving the building to the villagers: a house, a lumber camp and fields first, then more lumber, a quarry and archer towers
// toward where the raiders come in, then more houses, fields and towers each day; by night it fires the arrow volley and calls
// the riders at the raiders, and once the day's plan is built it skips the rest of the day. Evaluated inside the game (?debug):
// window.BOT.step() once a game second.
module.exports = `(()=>{
const K=castleB(),c=center(K),cell=(x,z)=>[Math.floor(x/CELL),Math.floor(z/CELL)];
const sp=nightPts()[0],sd=Math.hypot(sp.x-c.x,sp.z-c.z)||1,ux=(sp.x-c.x)/sd,uz=(sp.z-c.z)/sd;
// a spot n metres from the castle at angle a (radians from the raiders' way in)
const at=(a,n)=>{const ca=Math.cos(a),sa=Math.sin(a);return [c.x+(ux*ca-uz*sa)*n,c.z+(uz*ca+ux*sa)*n];};
const mine=t=>buildings.filter(B=>!B.dead&&B.type===t);
// the best wood: a grown tree with most trees round it, away from the camps already built
const woodSpot=()=>{let best=null,bs=-1;for(const T of trees){if(T.deco||T.cut||T.dead)continue;const d=Math.hypot(T.x-c.x,T.z-c.z);if(d<7||d>22)continue;
  if(mine('lodge').some(B=>Math.hypot(center(B).x-T.x,center(B).z-T.z)<9))continue;let n=0;for(const U of trees)if(!U.deco&&Math.hypot(U.x-T.x,U.z-T.z)<7)n++;const s=n-d*.4;if(s>bs){bs=s;best=T;}}
  return best?[lerp(c.x,best.x,.7),lerp(c.z,best.z,.7)]:at(2,8);};
const rockSpot=()=>{let best=null,bs=-1;for(const R of rocks){if(R.amount<=0)continue;const d=Math.hypot(R.x-c.x,R.z-c.z);if(d>24)continue;let n=0;for(const Q of rocks)if(Q.amount>0&&Math.hypot(Q.x-R.x,Q.z-R.z)<8)n++;const s=n-d*.25;if(s>bs){bs=s;best=R;}}
  return best?[lerp(c.x,best.x,.6),lerp(c.z,best.z,.6)]:at(2.5,9);};
// houses in a ring round the castle, fields on the side away from the raiders, towers across their way in
let hN=0,fN=0,tN=0,dN=0;
const SPOT={house:()=>at(1.2+hN*1.05,5.5+(hN%3)),farm:()=>at(Math.PI+(fN%2?.7:-.7)*(1+(fN>>1)*.6),7.5+(fN>>1)*2),lodge:woodSpot,quarry:rockSpot,
  tower:()=>at([-.55,.55,0,-1.2,1.2,-.25,.25][tN%7],7+(tN>2?2.5:0)),torch:()=>at([-.4,.4,-.9,.9][dN%4],5.5),flowers:()=>at(1.6+dN*.9,4.2)};
const BUMP={house:()=>hN++,farm:()=>fN++,tower:()=>tN++,torch:()=>dN++,flowers:()=>dN++};
// what to build, day by day; each is tried in order once there is enough to pay for it ('up:' upgrades the lowest-tier one)
const PLANS={vale:{1:['house','lodge','farm','lodge','house','quarry','tower','house','tower','farm','house'],
  2:['lodge','tower','house','farm','tower','house','torch','torch','house','tower'],3:['tower','house','tower','house','farm','flowers','tower','house','flowers','house']},
 cross:{1:['house','farm','lodge','house','lodge','tower','farm','house','tower','market','quarry','house','house'],
  2:['house','tower','up:house','house','up:lodge','tower','house','up:house','torch','torch','house'],
  3:['tower','up:tower','house','up:house','farm','up:tower','up:house','house','tower'],
  4:['up:tower','up:farm','tower','up:house','house','up:tower','up:lodge','up:house','flowers','flowers']}};
const PLAN=PLANS[MAP]||PLANS.vale;
SPOT.market=()=>at(-1.9,7);SPOT.statue=()=>at(2.4,5);
// the market: gold for wood (or stone) when short, as a person would
const trade=(get)=>{const M=mine('market').find(B=>B.built&&traderAt(B));if(!M)return false;const t=TRADES.find(t=>t.give==='gold'&&t.get===get),give={gold:10};if(!canAfford(give))return false;
  pay(give);res[get]+=t.n[M.tier-1];achAdd('trades');tradeScene(M);const cc=center(M),y=M.group.position.y+2.4;floatRes(get,t.n[M.tier-1],cc.x,y,cc.z);sfx('trade',cc);return true;};
const need=t=>t.startsWith('up:')?(()=>{const L=t==='up:castle'?[K]:mine(t.slice(3)).filter(B=>B.built&&!B.site&&B.tier<tierCap()&&B.tier<3).sort((a,b)=>a.tier-b.tier);return L[0]?DEF[L[0].type].up[L[0].tier-1]:null;})():DEF[t].cost;
let day=0,q=[],wait=0,skipT=0,log=[];
const busy=()=>buildings.filter(B=>!B.dead&&B.site).length,gold=()=>res.gold||0;
window.BOT={log,t:0,step(){BOT.t++;
  if(gameOver)return;
  if(PH.kind==='day'){
   if(PH.wave!==day){day=PH.wave;q=(PLAN[day]||PLAN[3]).slice();skipT=0;}
   // what a person does when it goes wrong: more fields when food runs short, another lumber camp when gold piles up but wood won't come
   const vil=townsfolk().length,farms=mine('farm').length;
   if(q[0]!=='farm'&&farms<Math.ceil(vil/4)&&!q.slice(0,2).includes('farm'))q.unshift('farm');
   if(q[0]!=='lodge'&&gold()>=50&&res.wood<20&&mine('lodge').length<3)q.unshift('lodge');
   // spare gold buys wood at the market
   if(gold()>=60&&res.wood<40)trade('wood');
   if(q.length&&busy()<3){const t=q[0],cost=need(t);
    if(!cost)q.shift();
    else if(!canAfford(cost)){if(gold()>=40+(cost.gold||0))for(const k of ['wood','stone'])if((cost[k]||0)>(res[k]||0))trade(k);}
    else if(t.startsWith('up:')){const L=t==='up:castle'?[K]:mine(t.slice(3)).filter(B=>B.built&&!B.site&&B.tier<tierCap()&&B.tier<3).sort((a,b)=>a.tier-b.tier);upgrade(L[0]);log.push([BOT.t,day,t]);q.shift();}
    else{const [x,z]=SPOT[t]();const [a,b]=cell(x,z);placeFace=0;const ev=findValid(t,a,b);
     if(ev){const B=place(t,ev.ci,ev.cj,{silent:true});if(B){log.push([BOT.t,day,t]);if(BUMP[t])BUMP[t]();q.shift();}}else q.shift();}}
   // the plan is built: skip the rest of the day (a person would), after a short wait so the town is seen
   if(!q.length&&!busy()&&day>1&&(skipT+=1)>8&&PH.t>12){skipT=-1e9;$('#nightBtn').click();log.push([BOT.t,day,'skip']);}
  }else{
   // the night: the volley on the thickest knot of raiders near the town, the riders out once
   const L=enemies.filter(e=>!e.dead&&!e.dormant&&Math.hypot(e.x-c.x,e.z-c.z)<18);
   if(L.length>=3&&volleyCd<=0){let best=null,bn=0;for(const e of L){let n=0;for(const f of L)if(Math.hypot(f.x-e.x,f.z-e.z)<3)n++;if(n>bn){bn=n;best=e;}}if(bn>=2){castVolley({x:best.x,z:best.z});log.push([BOT.t,'night','volley',bn]);}}
   if(L.length>=2&&!summoned().length&&summonCd<=0&&PH.wave>=2){summonRiders();log.push([BOT.t,'night','riders']);}
  }
}};
return 'bot ok '+sp.x.toFixed(1)+','+sp.z.toFixed(1);})()`;
