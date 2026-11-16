// ---------- the hero (Jack: for testing, off unless switched on in the admin panel): the Heir ----------
// One switch (mtd-dev-hero, the admin's Heroes button) turns everything here on; off, every hook below returns at once and the
// game plays exactly as before. The Heir fights on foot (on a horse once Royal horse is learnt), holds a spot in front of the castle
// (or where Move sends them), earns XP by fighting and keeps their level from stage to stage (mtd-hero); a fallen Heir comes
// back after HERO_CD s of game time, like the castle's riders. Each level brings a skill point. The skills are passive (Jack: no
// abilities in the game, like the later Kingdom Rush games) and are learnt only on the campaign's Hero screen (#heroPick).
// the Heir is part of the game for everyone now (Jack: it was a testing switch in the admin, which left the skills locked on his phone)
const heroOn = () => true;
const HERO_CD = 30, HERO_MAX = 10;
// skills: rank by rank, the level each rank needs
const HERO_SK = {
  // desc: one line that never changes; vals: each rank's figure, shown as three steps on the Hero screen (Jack: the line and a
  // "Next" line repeated each other and the rows grew uneven)
  // line: the full text of a rank (the Hero screen shows the next rank's, Jack: no boxes of figures)
  cry: { name: 'Inspire', line: r => `Troops nearby hit ${[10, 20, 30][r]}% harder`, desc: 'Troops nearby hit harder', vals: ['+10%', '+20%', '+30%'], req: [1, 3, 5], k: [.1, .2, .3] },
  horse: { name: 'Royal horse', line: r => r ? `Rides ×${[2, 2.3, 2.6][r]} faster` : 'Rides a horse, ×2 faster', desc: 'Rides a horse, faster', vals: ['×2', '×2.3', '×2.6'], req: [2, 4, 6], k: [2, 2.3, 2.6] },
  firm: { name: 'Stand firm', line: r => `Takes ${[15, 25, 35][r]}% less damage`, desc: 'Takes less damage', vals: ['−15%', '−25%', '−35%'], req: [5, 7, 9], k: [.15, .25, .35] },
};
// a skill point is a four-point star (Jack: no "pts"), on the points left, on a rank's cost and when short of points
const SKP_ICO = '<svg class="skp" viewBox="0 0 24 24" aria-label="skill points"><path d="M12 .8 Q13.6 10.4 23.2 12 Q13.6 13.6 12 23.2 Q10.4 13.6 .8 12 Q10.4 10.4 12 .8 Z"/></svg>';
const HERO_ORDER = ['cry', 'horse', 'firm'];
// points (Jack): each level from 1 to 4 brings 1, 5 to 8 brings 2, 9 and 10 bring 3 (18 in all); a skill's ranks cost 1, 2 and 3
// (6 a skill, 18 for all three), so a level-10 Heir has every rank
const lvPts = lv => lv <= 4 ? 1 : lv <= 8 ? 2 : 3;
const rankCost = r => r + 1;
const skCan = k => { const r = HERO.sk[k]; return r < 3 && HERO.lv >= HERO_SK[k].req[r] && HERO.pts >= rankCost(r); };
const ptsEarned = lv => { let n = 0; for (let i = 1; i <= lv; i++) n += lvPts(i); return n; };
const ptsSpent = sk => HERO_ORDER.reduce((t, k) => t + sk[k] * (sk[k] + 1) / 2, 0);
const heroBlank = () => ({ lv: 1, xp: 0, pts: 1, sk: { cry: 0, horse: 0, firm: 0 } });
function loadHero() {
  try {
    const h = JSON.parse(localStorage.getItem('mtd-hero'));
    if (h && h.lv) { const sk = Object.assign({ cry: 0, horse: 0, firm: 0 }, h.sk), lv = Math.min(HERO_MAX, h.lv); let pts = ptsEarned(lv) - ptsSpent(sk); if (pts < 0) { HERO_ORDER.forEach(k => { sk[k] = 0; }); pts = ptsEarned(lv); } return { lv, xp: h.xp || 0, pts, sk }; }
  } catch (e) {}
  return heroBlank();
}
var HERO = loadHero();
const saveHero = () => { try { localStorage.setItem('mtd-hero', JSON.stringify(HERO)); } catch (e) {} };
const heroHp = () => 260 + 30 * (HERO.lv - 1), heroDmg = () => 12 + 2 * (HERO.lv - 1);
const heroNeed = () => 60 + 40 * HERO.lv;
const heroSpeed = () => HERO.sk.horse ? HERO_SK.horse.k[HERO.sk.horse - 1] : 1;
var heroHere = false, hero = null, heroDownT = 0, heroAt = null, heroFlag = null, heroMove = false, heroSel = false, heroWasNight = false;
var heroKey = '';
const heroGold = mat('#e8b94a'); heroGold.metalness = .6; heroGold.roughness = .35;
// the Heir's look: the man-at-arms' mail and blue surcoat, sword and kite shield, but a gold crown for the helm
const HERO_HAIR = hairs[1];
function heroKit(v) {
  if (v.horse) stripKit(v);
  // the Heir's own brown hair (as on the portrait), whoever the villager was
  if (!v.heroHair && v.headParts) { const old = v.headParts[2], h = makeHair(HERO_HAIR); old.parent.add(h); old.parent.remove(old); v.headParts[2] = h; v.hairC = HERO_HAIR; v.heroHair = true; }
  soldierKit(v, 3, HERO.sk.horse > 0);
  for (const o of v.kit.slice()) if (o.userData && o.userData.helm) { o.parent && o.parent.remove(o); v.kit.splice(v.kit.indexOf(o), 1); }
  const c = new THREE.Group(); c.add(cyl(.118, .122, .055, 12, heroGold, 0, 0, 0));
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, p = new THREE.Mesh(new THREE.ConeGeometry(.026, .07, 4), heroGold); p.position.set(Math.sin(a) * .118, .055, Math.cos(a) * .118); c.add(p); }
  c.position.y = 1.12; c.userData.helm = true; c.traverse(o => { if (o.isMesh) o.castShadow = true; }); v.body.add(c); v.kit.push(c);
  if (v.hatG) v.hatG.visible = false;
  v.maxHp = v.hp = heroHp();
}
function heroHome() { const K = castleB(); if (!K) return null; const dp = doorPoint(K), [ox, oz] = faceRot(K.face || 0, 0, 1.6); return { x: dp.x + ox, z: dp.z + oz }; }
function spawnHero() {
  const K = castleB(); if (!K || !heroOn() || hero || plainMap) return;
  const v = makeVillager(K); v.hero = true; v.summoned = true; v.inside = false; v.indoor = null; v.hideT = 0; v.g.visible = true;
  heroKit(v); v.sbar = makeBar(.6);
  const dp = doorPoint(K); v.x = v.rx = v.tx = dp.x; v.z = v.rz = v.tz = dp.z; v.g.rotation.y = faceAngle(K);
  hero = v; heroKey = '';
}
function removeHero() {
  if (hero) { const i = villagers.indexOf(hero); if (i >= 0) villagers.splice(i, 1); scene.remove(hero.g); if (hero.sbar) scene.remove(hero.sbar.grp); }
  hero = null; setHeroFlag(null); heroSel = false; heroMove = false;
}
// a new game (startGame): a fresh Heir in front of the castle, timers and the Move flag cleared
function heroStart() {
  hero = null; heroDownT = 0; heroMove = false; heroSel = false; heroWasNight = false; setHeroFlag(null);
  if (heroOn()) spawnHero();
  // the HUD tick draws the portrait: startGame first runs while the page is still loading, before menuOn exists
  heroKey = '';
}
function setHeroFlag(pt) {
  if (heroFlag) { scene.remove(heroFlag); heroFlag = null; }
  heroAt = pt ? { x: pt.x, z: pt.z } : null; if (!pt) return;
  const f = new THREE.Group(); f.add(box(.05, 1.5, .05, M.timber, 0, .75, 0)); f.add(flagBox(.46, .3, .03, M.flag, .25, 1.33, 0));
  f.add(cyl(.06, .06, .06, 8, heroGold, 0, 1.53, 0));
  f.position.set(pt.x, hAt(pt.x, pt.z), pt.z); scene.add(f); heroFlag = f; heroHere = false; flagFocus = 'hero';
}
// Inspire: troops within 7 m of the Heir, the Heir too, hit harder (updateSoldier and the Heir's own blows)
const heroBuff = v => hero && HERO.sk.cry && v && Math.hypot(v.x - hero.x, v.z - hero.z) < 7 ? 1 + HERO_SK.cry.k[HERO.sk.cry - 1] : 1;
// Stand firm: the Heir takes less (hurtSoldier)
const heroTake = d => HERO.sk.firm ? d * (1 - HERO_SK.firm.k[HERO.sk.firm - 1]) : d;
function heroFall(v) {
  v.gone = true; v.soldier = false; release(v); const i = villagers.indexOf(v); if (i >= 0) villagers.splice(i, 1);
  if (v.sbar) scene.remove(v.sbar.grp); fallen.push({ v, t: 0 });
  hero = null; heroDownT = HERO_CD; heroMove = false; log('<b>The Heir</b> has fallen', 'warn'); heroKey = '';
}
function heroXp(n) {
  if (!heroOn() || HERO.lv >= HERO_MAX) return;
  HERO.xp += n; let up = false;
  while (HERO.lv < HERO_MAX && HERO.xp >= heroNeed()) { HERO.xp -= heroNeed(); HERO.lv++; HERO.pts += lvPts(HERO.lv); up = true; }
  if (HERO.lv >= HERO_MAX) HERO.xp = 0;
  if (up) { if (hero) { hero.maxHp = heroHp(); hero.hp = hero.maxHp; } const g = lvPts(HERO.lv); banner(`The Heir · Lv ${HERO.lv}`, g > 1 ? `${g} skill points` : 'Skill point'); log(`<b>The Heir</b> · Lv ${HERO.lv}`, 'good'); sfx('star'); }
  saveHero(); heroKey = '';
}
// XP (hurtEnemy): the Heir's own kills count most, any raider slain while they stand a little
function heroKill(e, by) {
  if (!heroOn() || !hero) return;
  const E = ENEMY[e.kind];
  if (by === hero) heroXp(E.boss ? 60 : E.engine ? 15 : 6 * (e.tier || 1) + (E.mounted ? 3 : 0)); else heroXp(1);
}
// the Hero screen's Reset (Jack): every point spent comes back, the skills start again from nothing
function heroReset() {
  const n = ptsSpent(HERO.sk); if (!n) return;
  HERO.pts += n; HERO_ORDER.forEach(k => { HERO.sk[k] = 0; }); saveHero(); sfx('click'); heroKey = '';
  if (hero) { const x = hero.x, z = hero.z, hp = hero.hp / hero.maxHp; heroKit(hero); hero.hp = hero.maxHp * hp; hero.x = x; hero.z = z; }
  renderHeroPick();
}
function heroLearn(k) {
  const S = HERO_SK[k], r = HERO.sk[k];
  if (r >= 3 || HERO.pts < rankCost(r) || HERO.lv < S.req[r]) { sfx('nope'); return; }
  HERO.pts -= rankCost(r); HERO.sk[k]++; saveHero(); sfx('upgrade'); heroKey = ''; renderHeroPick();
  if (k === 'horse' && hero) { const x = hero.x, z = hero.z, hp = hero.hp / hero.maxHp; heroKit(hero); hero.hp = hero.maxHp * hp; hero.x = x; hero.z = z; if (HERO.sk.horse === 1) sfx('neigh', hero); }
}
// the Heir's own step, day and night (updateVillagers): hold the spot, go for raiders within 7 m of it, give up on any that lead 10 m off
function updateHero(v, dt) {
  const home = heroAt || heroHome(); if (!home) return;
  v.attackT = Math.max(0, (v.attackT || 0) - dt); v.cool = (v.cool || 0) - dt;
  if (v.skip && (v.skip.t -= dt) <= 0) v.skip = null;
  let foe = v.foe && !v.foe.dead && Math.hypot(v.foe.x - home.x, v.foe.z - home.z) < 10 ? v.foe : null;
  if (!foe) { let bd = 7; for (const e of enemies) if (!e.dead && !e.dormant && (!v.skip || v.skip.e !== e)) { const d = Math.hypot(e.x - home.x, e.z - home.z); if (d < bd) { bd = d; foe = e; } } }
  if (foe !== v.foe) v.prog = null;
  v.foe = foe; const ride = heroSpeed() * (1 + decorFx(v.x, v.z, 'troopWalk'));
  if (foe) {
    const reach = .9 + (foe.horse ? .3 : 0) + (foe.engine ? ENEMY[foe.kind].r : 0) + (v.cav ? .35 : 0), d = Math.hypot(foe.x - v.x, foe.z - v.z);
    if (d > reach) { if (gateWait(v, foe.x, foe.z)) return; walkTo(v, foe.x, foe.z, dt, 1, reach * .9, 1.25 * ride); if (v.noProg > 4) { v.skip = { e: foe, t: 4 }; v.foe = null; } }
    else { turnTo(v, Math.atan2(foe.x - v.x, foe.z - v.z), dt); if (v.cool <= 0) { v.cool = .8 * (1 - decorFx(v.x, v.z, 'troopRate')); v.attackT = SWORD_T; hurtEnemy(foe, heroDmg() * (1 + decorFx(v.x, v.z, 'troopDmg')) * heroBuff(v), v); sfx('clash', v); } }
  } else if (Math.hypot(home.x - v.x, home.z - v.z) > .35) { if (!gateWait(v, home.x, home.z)) walkTo(v, home.x, home.z, dt, 1, .3, 1.3 * ride); }
  else { const K = castleB(); if (K && !heroAt) turnTo(v, faceAngle(K), dt); heroHere = true; }
  // mends slowly by day while nobody is fighting
  if (PH.kind === 'day' && !foe && v.hp < v.maxHp) v.hp = Math.min(v.maxHp, v.hp + v.maxHp * .02 * dt);
}
// one step of the game (tick): timers, the comeback, a night survived
function heroTick(dt) {
  if (!heroOn()) { if (hero) removeHero(); return; }
  if (!hero && heroDownT > 0 && (heroDownT -= dt) <= 0) { heroDownT = 0; spawnHero(); log('<b>The Heir</b> returns', 'good'); }
  else if (!hero && !heroDownT && !gameOver) spawnHero();
  if (heroFlag) heroFlag.visible = flagFocus === 'hero' && !heroHere;
  const night = PH.kind === 'night'; if (heroWasNight && !night && hero && !gameOver) heroXp(20); heroWasNight = night;
}
// taps (tap): Move's spot first, then the Heir themself (with nothing being built)
function heroTap(e) {
  if (!heroOn()) return false;
  if (heroMove) {
    const pt = pick(e); if (!pt || !canStand(pt.x, pt.z, 1)) { setHint('Blocked', 'bad'); return true; }
    heroMove = false; setHeroFlag(pt); sfx('click'); setHint('Moving'); heroKey = ''; return true;
  }
  if (!hero || !hero.g.visible || (tool && tool !== 'select')) return false;
  const pt = pick(e); if (pt && Math.hypot(pt.x - hero.x, pt.z - hero.z) < 1.1) { heroSelect(); return true; }
  return false;
}
function heroSelect() { if (selected) deselect(); flagFocus = 'hero'; heroSel = true; heroKey = ''; sfx('click'); heroUI(); }
// ---- on screen: the portrait (and the Heir's skills at night) under the top panel; the Heir's card in the dock ----
const HERO_ICO = {
  // coloured pictures in the stat icons' style (Jack: like the heart, sword, bow and boot): a gold crown with a red gem, a brown
  // horse's head with speed lines behind it, a steel shield with a gold cross
  cry: '<svg viewBox="0 0 16 16"><path d="M2 5.2 L5 8 L8 3 L11 8 L14 5.2 L12.8 12 H3.2 Z" fill="#e9b949" stroke="#7a5414" stroke-width=".9" stroke-linejoin="round"/><path d="M3.2 12 H12.8 V13.8 H3.2 Z" fill="#c9962f" stroke="#7a5414" stroke-width=".9" stroke-linejoin="round"/><circle cx="8" cy="9.4" r="1" fill="#d9503f" stroke="#7a2418" stroke-width=".5"/><circle cx="2" cy="5.2" r=".8" fill="#e9b949" stroke="#7a5414" stroke-width=".6"/><circle cx="8" cy="3" r=".8" fill="#e9b949" stroke="#7a5414" stroke-width=".6"/><circle cx="14" cy="5.2" r=".8" fill="#e9b949" stroke="#7a5414" stroke-width=".6"/><path d="M4.4 10.6 L5.2 7.8" stroke="#fbe3a0" stroke-width=".7" stroke-linecap="round"/></svg>',
  horse: '<svg viewBox="0 0 16 16"><path d="M11.4 14.4 L11.7 9.6 C11.9 7 11.1 5 9.5 3.7 L9.8 1.8 L8.6 3 L7.6 2 L7.3 3.4 C5.7 4 4.3 5.3 3.4 7 L1.9 8.8 C1.4 9.4 1.6 10.3 2.3 10.5 L3.6 10.8 C4.2 10.9 4.8 10.6 5.2 10.1 L6.4 8.9 C6.8 10.7 6.8 12.6 6.2 14.4 Z" fill="#9a6532" stroke="#4e3015" stroke-width=".9" stroke-linejoin="round"/><path d="M9.5 3.7 C11.1 5 11.9 7 11.7 9.6 L11.4 14.4 H12.8 L13 9.6 C13.2 6.6 12.1 4.3 10 3 Z" fill="#3e2714" stroke="#2a1a0c" stroke-width=".6" stroke-linejoin="round"/><circle cx="7.7" cy="5.8" r=".55" fill="#1d130a"/><path d="M14.2 6.2 H15.6 M14.4 8.8 H15.8 M14.2 11.4 H15.6" stroke="#e8d9b0" stroke-width="1" stroke-linecap="round"/></svg>',
  firm: '<svg viewBox="0 0 16 16"><path d="M8 1.6 L13.6 3.4 V8 C13.6 11.2 11.3 13.4 8 14.6 C4.7 13.4 2.4 11.2 2.4 8 V3.4 Z" fill="#b9c0c8" stroke="#4f555c" stroke-width=".9" stroke-linejoin="round"/><path d="M8 3.3 L12 4.6 V8 C12 10.4 10.4 12 8 12.9 C5.6 12 4 10.4 4 8 V4.6 Z" fill="#8d959e"/><path d="M8 4.6 V11.6 M5.4 7.4 H10.6" stroke="#e1b04a" stroke-width="1.5" stroke-linecap="round"/><path d="M3.6 4.6 L3.6 7.6" stroke="#eef1f4" stroke-width=".7" stroke-linecap="round"/></svg>',
};
const heroShown = () => heroOn() && !gameOver && !menuOn() && !galleryOn && !showcaseBuilt && !!castleB();
function heroUI() {
  const bar = $('#heroBar'), card = $('#heroCard'); if (!bar) return;
  const on = heroShown(); bar.hidden = !on; if (!on) { card.hidden = true; return; }
  if (selected && heroSel) heroSel = false;
  const night = PH.kind === 'night', hpf = hero ? Math.max(0, hero.hp / hero.maxHp) : 0, xpf = HERO.lv >= HERO_MAX ? 1 : HERO.xp / heroNeed();
  // the portrait: a health ring, the level, a thin XP bar; greyed with the seconds left while fallen
  const key = [HERO.lv, HERO.pts, HERO.sk.cry, HERO.sk.horse, HERO.sk.firm, !!hero, night, heroSel, !!heroAt, heroMove].join('|');
  if (key !== heroKey) {
    heroKey = key;
    let h = `<button class="heroPort${hero ? '' : ' down'}${heroSel ? ' sel' : ''}" data-hact="sel" aria-label="The Heir"><span class="face"><canvas class="heroCv" width="96" height="96"></canvas></span><b class="lv">${HERO.lv}</b><span class="hpb"><i></i></span><span class="xp"><i></i></span><b class="cd"></b></button>`;
    bar.innerHTML = h;
    // the card: name and level, Move and Recall, health, XP, stats and the three skills with a + while points are left
    if (heroSel) {
      // the skills, read only: learnt on the campaign's Hero screen
      const sk = HERO_ORDER.filter(k => HERO.sk[k]).map(k => `<span class="hSkMini" title="${HERO_SK[k].name}">${HERO_ICO[k]}<span class="hsPips">${[0, 1, 2].map(i => `<i class="${i < HERO.sk[k] ? 'on' : ''}"></i>`).join('')}</span></span>`).join('');
      card.innerHTML = `<div class="cardHead"><span class="cardIco heroIco"><canvas class="heroCv" width="96" height="96"></canvas></span><div class="cardName"><h4>The Heir</h4><div class="cardSub"><span>Hero · Lv ${HERO.lv}</span></div></div>`
        + (hero ? `<button class="iconBtn" data-hact="move" aria-pressed="${heroMove}" title="Move: tap, then a spot" aria-label="Move"><svg viewBox="0 0 24 24"><path d="M6 21 V3.5"/><path d="M6 4 H17.5 L15 8 L17.5 12 H6"/></svg></button>` : '')
        + (heroAt ? `<button class="iconBtn" data-hact="recall" title="Back to the castle" aria-label="Recall"><svg viewBox="0 0 24 24"><path d="M9 14 L4 9 L9 4"/><path d="M4 9 H14 A5.5 5.5 0 0 1 14 20 H9"/></svg></button>` : '')
        + `<button class="iconBtn" data-hact="close" aria-label="Close"><svg viewBox="0 0 24 24"><path d="M6 6 L18 18 M18 6 L6 18"/></svg></button></div>`
        + `<div class="hpbar"><i class="hHp"></i></div><div class="hXp">XP<span class="hXpBar"><i></i></span><span class="hXpN"></span></div>`
        + `<div class="stats hStats"></div>${sk ? `<div class="hSkRow">${sk}</div>` : ''}`;
    }
  }
  const p = bar.querySelector('.heroPort');
  if (p) {
    const hb = p.querySelector('.hpb i'); hb.style.width = `${(hero ? hpf : 0) * 100}%`; hb.style.background = hpf < .35 ? 'var(--bad)' : hpf < .7 ? '#e6c46a' : 'var(--ok)';
    p.querySelector('.xp i').style.width = `${xpf * 100}%`; p.querySelector('.cd').textContent = hero ? '' : Math.ceil(heroDownT);
  }
  card.hidden = !heroSel || !!selected;
  if (!card.hidden) {
    const hp = card.querySelector('.hHp'); if (hp) { hp.style.width = `${hpf * 100}%`; hp.style.background = hpf < .35 ? 'var(--bad)' : hpf < .7 ? '#e6c46a' : 'var(--ok)'; }
    const xb = card.querySelector('.hXpBar i'); if (xb) xb.style.width = `${xpf * 100}%`;
    const xn = card.querySelector('.hXpN'); if (xn) xn.textContent = HERO.lv >= HERO_MAX ? 'Max' : `${HERO.xp} / ${heroNeed()}`;
    const st = card.querySelector('.hStats'); if (st) st.innerHTML = hero ? STAT('hp', `${Math.ceil(hero.hp)}/${hero.maxHp}`, hpf < .35 ? 'bad' : '') + STAT('sword', `${heroDmg()}`) + STAT('speed', `×${heroSpeed()}`) : STAT('', `Back in ${Math.ceil(heroDownT)} s`, 'warn');
  }
  // the night powers sit to the right of the Heir's buttons
  const pw = $('#powers'); if (!pw.hidden) { updatePowers(); bar.style.top = pw.style.top; }
  else { const pn = document.querySelector('.panel').getBoundingClientRect(); bar.style.top = (pn.bottom + 8) + 'px'; }
  bar.style.left = document.querySelector('.panel').getBoundingClientRect().left + 'px';
}
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-hact]'); if (!b || !heroOn()) return;
  const a = b.dataset.hact;
  // a tap on the portrait goes straight to moving the Heir (Jack: no need to press Move on the card); a second tap cancels it
  if (a === 'sel') { const was = heroMove; heroSelect(); heroMove = !!hero && !was; if (heroMove) { rallyFor = null; volleyAim = false; } setHint(heroMove ? 'Tap a spot' : 'Select a building'); heroKey = ''; }
  else if (a === 'close') { heroSel = false; heroMove = false; heroKey = ''; flagFocus = null; }
  else if (a === 'move') { heroMove = !heroMove; if (heroMove) { rallyFor = null; volleyAim = false; } setHint(heroMove ? 'Tap a spot' : 'Select a building'); heroKey = ''; }
  else if (a === 'recall') { setHeroFlag(null); heroMove = false; setHint('Recalled'); heroKey = ''; }
  else if (a === 'learn') heroLearn(b.dataset.k);
  else if (a === 'sk') { hpSkSel = b.dataset.k; renderHeroPick(); }
  else if (a === 'reset') heroReset();
  heroUI();
});
// ---- the Hero screen (from the campaign's round Hero button, shown only with heroes on): the Heir, level, XP, stats and the
// three passive skills, each with its ranks and a gold + while a point can be spent (laid out like the Upgrades screen) ----
// Back has its own listener on the screen, like the Upgrades screen's, and runs before anything else (Jack: on his phone Back
// sometimes did nothing)
function heroBack() { $('#heroPick').hidden = true; cancelAnimationFrame(hpRaf); hpRaf = 0; sfx('click'); openCampaign(cSel); }
$('#heroPick').addEventListener('click', e => {
  if (e.target.closest('[data-hact=back]')) { e.stopPropagation(); heroBack(); return; }
  const r = e.target.closest('[data-hact=ros]'); if (r && r.classList.contains('soon')) { e.stopPropagation(); sfx('nope'); }
});
// the campaign button's badge, like the Upgrades' "★30": the skill-point star and the points to spend
function syncHeroBadge() { const n = $('#campHeroN'); if (n) { n.innerHTML = HERO.pts ? `${SKP_ICO}<span class="bN">${HERO.pts}</span>` : ''; n.hidden = !HERO.pts; } }
function openHeroPick() {
  sfx('click'); $('#campaign').hidden = true; $('#heroPick').hidden = false; renderHeroPick(); matchUpZoom($('#heroPick'));
  codexRenderer(); cancelAnimationFrame(hpRaf); hpT0 = hpLast = performance.now(); hpRaf = requestAnimationFrame(heroLoop);
}
// ---- the Heir in 3D on the Hero screen: a head-and-shoulders portrait (Jack: just the face and a bit of the upper body, no turning
// round), drawn by the Archive's small renderer (codexRenderer); the Heir looks about a little and blinks ----
let hpSkSel = '', hpModel = null, hpRaf = 0, hpT0 = 0, hpLast = 0, hpDrawn = 0;
// the colours the busts were last drawn in (Jack: after a colour change in Settings the Heroes row and the portrait kept the old one):
// a change drops the portrait's model so it is built afresh, and redraws the row's stills
var heroTeamKey = '';
function heroRecolour() { if (hpModel) { cxScene && cxScene.remove(hpModel.g); hpModel = null; } heroTeamKey = ''; }
function heroModel() {
  const p = makePerson({ hair: HERO_HAIR }); p.heroHair = true; heroKitFoot(p); p.seed = 0;
  p.arms[0].rotation.x = -.35; p.arms[1].rotation.x = -.35; p.pivot.rotation.x = -.4;
  return { g: p.g, p };
}
// the portrait is always on foot (a horse would only lift the bust)
function heroKitFoot(p) { const h = HERO.sk.horse; HERO.sk.horse = 0; heroKit(p); HERO.sk.horse = h; }
// draws the bust into the small renderer and hands back its canvas: the Hero screen, the in-game portrait and the Heir's card all
// copy it (Jack: the same 3D portrait in the game); the model joins the small renderer's scene only while it is drawn
function heroBust(now) {
  codexRenderer();
  if (!hpModel) {
    hpModel = heroModel(); cxScene.add(hpModel.g); hpModel.g.updateMatrixWorld(true);
    const hd = hpModel.p.headParts[0].getWorldPosition(new THREE.Vector3());
    Object.assign(hpModel, { r: .01, k: 1.2, c: hd.clone(), head: hd }); hpT0 = now;
  } else cxScene.add(hpModel.g);
  const t = (now - hpT0) / 1000, p = hpModel.p, hd = hpModel.head;
  // looks a little to one side, then the other, with still spells between
  turnHead(p, .32 * Math.sin(t * .55) * Math.max(0, Math.sin(t * .23 + 1)));
  blink(p, now);
  p.torso.scale.x = p.torso.scale.z = 1 + .015 * Math.sin(t * 1.6);
  codexStage(hpModel);
  cxCam.position.set(hd.x + .14, hd.y + .1, hd.z + 1.05); cxCam.lookAt(hd.x, hd.y - .02, hd.z);
  cxR.render(cxScene, cxCam); cxScene.remove(hpModel.g);
  return cxR.domElement;
}
const heroCopy = (src, cv) => { const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height); c.drawImage(src, 0, 0, cv.width, cv.height); };
function heroLoop(now) {
  if ($('#heroPick').hidden) { hpRaf = 0; return; }
  hpRaf = requestAnimationFrame(heroLoop); hpLast = now;
  const cv = $('#heroPick .hpView'); if (cv) heroCopy(heroBust(now), cv);
}
// in the game (from frame): the portrait under the top panel and the card's icon, about 15 times a second
function heroPortraitTick(now) {
  if (!heroOn() || now - hpDrawn < 66) return;
  const cvs = document.querySelectorAll('#heroBar .heroCv, #heroCard:not([hidden]) .heroCv'); if (!cvs.length || $('#heroBar').hidden) return;
  hpDrawn = now; const src = heroBust(now); cvs.forEach(cv => heroCopy(src, cv));
}
// ---- more heroes (a try-out, Jack): the Ranger and the Captain from the earlier drafts, shown locked under the skills ----
const HEROES = [
  { id: 'heir', name: 'The Heir', role: 'In use' },
  { id: 'ranger', name: 'The Ranger', soon: true },
  { id: 'captain', name: 'The Captain', soon: true },
];
function rosterModel(id) {
  if (id === 'heir') return heroModel().p;
  const blue = kiteM, dblue = mat('#1f3d73'), green = mat('#3f5a2e'), gold = heroGold;
  const put = (p, o) => { o.traverse(m => { if (m.isMesh) m.castShadow = true; }); p.body.add(o); return o; };
  const cloak = (p, m, w) => put(p, box(w + .04, .05, .1, m, 0, .88, -.13));
  let p;
  if (id === 'ranger') {
    p = makePerson({ tunic: mat('#5b4630'), tool: 'bow', hair: hairs[0] });
    const hd = put(p, new THREE.Mesh(new THREE.SphereGeometry(.158, 14, 8, 0, Math.PI * 2, 0, Math.PI * .62), green)); hd.position.set(0, 1.05, -.015); hd.rotation.x = -.25;
    const tip = put(p, new THREE.Mesh(new THREE.ConeGeometry(.06, .16, 6), green)); tip.position.set(0, 1.1, -.17); tip.rotation.x = -1.9;
    cloak(p, green, .38);
    const qv = new THREE.Group(); qv.position.set(.1, .72, -.17); qv.rotation.z = -.35; p.body.add(qv); qv.add(cyl(.05, .045, .34, 8, leatherM, 0, 0, 0));
  } else {
    p = makePerson({ tunic: blue, tool: 'hammer' }); armour(p, 3);
    p.armour.forEach(o => { if (o.type === 'Group' && new THREE.Box3().setFromObject(o).min.y > .95) o.visible = false; });
    put(p, makeHelm('greathelm'));
    const pl = put(p, new THREE.Mesh(new THREE.ConeGeometry(.055, .36, 6), blue)); pl.position.set(0, 1.33, -.04); pl.rotation.x = -.35;
    cloak(p, dblue, .44); put(p, cyl(.1, .1, .02, 8, gold, 0, .86, .12));
  }
  p.arms[0].rotation.x = -.35; p.arms[1].rotation.x = -.35; p.pivot.rotation.x = -.4;
  return p;
}
// each portrait drawn once, a still bust like the Heir's, by the Archive's small renderer
function rosterSnaps(el) {
  codexRenderer();
  el.querySelectorAll('.hrCv').forEach(cv => {
    const p = rosterModel(cv.dataset.h), g = p.g; cxScene.add(g); g.updateMatrixWorld(true);
    const hd = p.headParts[0].getWorldPosition(new THREE.Vector3());
    codexStage({ r: .01, k: 1.2, c: hd.clone() });
    cxCam.position.set(hd.x + .22, hd.y + .1, hd.z + 1.2); cxCam.lookAt(hd.x, hd.y - .06, hd.z);
    cxR.render(cxScene, cxCam); cxScene.remove(g); heroCopy(cxR.domElement, cv); cv.dataset.done = 1;
  });
}
// the sheet is made once and only its parts refilled (Jack: a new sheet on every + replayed the menus' rise animation, so the page
// seemed to reload, and the portrait's canvas was made again)
function renderHeroPick() {
  const el = $('#heroPick'); if (!el || el.hidden) { syncHeroBadge(); return; }
  if (!el.querySelector('.heroSheet')) el.innerHTML = `<div class="upSheet heroSheet"><div class="upTop"><button class="upBack campBack" data-hact="back" aria-label="Back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 12H5.5M11.5 5.5L5 12l6.5 6.5"/></svg></button><h2>Hero</h2><span class="hpPad"></span></div>`
    + `<div class="hpBody"><div class="hpStage"><canvas class="hpView" width="320" height="320"></canvas></div><div class="hpInfo"><div class="hpName">The Heir<span class="upBank hpLvP"><span class="upNum">Lv <b class="hpLv"></b></span></span></div><div class="hpXp"></div><div class="hpStats"></div></div></div>`
    + `<div class="hSkHead">Skills<span class="hsPts"></span><span class="upRs hsRs"><button class="hsReset" data-hact="reset">${UP_RESET}<span class="rsT">Reset</span></button></span></div><div class="hsWrap"><div class="hsList"></div><div class="hsDet"></div></div>`
    + `<div class="hSkHead hRosHead">Heroes</div><div class="hRoster">${HEROES.map(h => `<button class="hRos${h.soon ? ' soon' : ' on'}" data-hact="ros" data-h="${h.id}"><span class="hrPic"><canvas class="hrCv" data-h="${h.id}" width="128" height="128"></canvas>${h.soon ? `<span class="hrLock">${LOCK_ICO}</span>` : ''}</span><b>${h.name}</b><small>${h.soon ? 'Coming soon' : h.role}</small></button>`).join('')}</div></div>`;
  if (!el.querySelector('.hrCv[data-done]') || heroTeamKey !== JSON.stringify(TEAM)) { heroTeamKey = JSON.stringify(TEAM); rosterSnaps(el); }
  const xpf = HERO.lv >= HERO_MAX ? 1 : HERO.xp / heroNeed();
  el.querySelector('.hpLv').textContent = HERO.lv;
  el.querySelector('.hpXp').innerHTML = `XP<span class="hXpBar"><i style="width:${xpf * 100}%"></i></span>${HERO.lv >= HERO_MAX ? 'Max' : `${HERO.xp} / ${heroNeed()}`}`;
  el.querySelector('.hpStats').innerHTML = `${STAT('hp', `${heroHp()}`)}${STAT('sword', `${heroDmg()}`)}${STAT('speed', `×${heroSpeed()}`)}`;
  el.querySelector('.hsPts').innerHTML = HERO.pts ? `${SKP_ICO}${HERO.pts}` : '';
  el.querySelector('.hsReset').disabled = !HERO_ORDER.some(k => HERO.sk[k]);
  // two sides (Jack, after Kingdom Rush 2's tower upgrades): the skills on the left, the picked one's details and Learn on the right
  if (!HERO_SK[hpSkSel]) hpSkSel = HERO_ORDER.find(k => skCan(k)) || HERO_ORDER[0];
  el.querySelector('.hsList').innerHTML = HERO_ORDER.map(k => {
    const r = HERO.sk[k];
    return `<button class="hsTile sk-${k}${k === hpSkSel ? ' sel' : ''}${r ? '' : ' off'}" data-hact="sk" data-k="${k}"><span class="hsIco">${HERO_ICO[k]}</span><span class="hsTx"><b>${HERO_SK[k].name}</b><span class="hsPips">${[0, 1, 2].map(n => `<i class="${n < r ? 'on' : ''}"></i>`).join('')}</span></span>${skCan(k) ? `<i class="hsDot">${SKP_ICO}</i>` : ''}</button>`;
  }).join('');
  {
    const k = hpSkSel, S = HERO_SK[k], r = HERO.sk[k], c = rankCost(r), lvOk = r < 3 && HERO.lv >= S.req[r];
    // one full line (Jack: no boxes of figures): what the next rank does, or the top rank's once all are learnt
    const nextLine = r < 3 ? `<span class="hsRk">Rank ${r + 1}</span>${S.line(r)}` : S.line(2);
    const act = r >= 3 ? '<span class="hsNote">Max rank</span>'
      : !lvOk ? `<span class="hsNote">Needs Lv ${S.req[r]}</span>`
      : HERO.pts >= c ? `<button class="primary hsLearn" data-hact="learn" data-k="${k}">Learn<span class="hsLc">${SKP_ICO}${c}</span></button>`
      : `<span class="hsNote">Needs ${SKP_ICO}${c}</span>`;
    el.querySelector('.hsDet').innerHTML = `<div class="hsDh sk-${k}"><span class="hsIco">${HERO_ICO[k]}</span><span><b>${S.name}</b><small>Rank ${r} / 3</small></span></div>`
      + `<p class="hsDesc">${nextLine}</p><div class="hsAct">${act}</div>`;
  }
  syncHeroBadge();
}
document.addEventListener('click', e => { if (e.target.closest('#campHeroBtn')) openHeroPick(); });
// the admin's helpers (testing)
function syncHeroAdmin() { const hb = $('#campHeroBtn'); if (hb) { hb.hidden = false; syncHeroBadge(); } }
$('#adHeroLv').addEventListener('click', () => { if (HERO.lv < HERO_MAX) heroXp(heroNeed() - HERO.xp); syncHeroBadge(); heroUI(); });
$('#adHeroReset').addEventListener('click', () => {
  HERO = heroBlank(); saveHero(); syncHeroBadge(); if (hero) { const x = hero.x, z = hero.z; heroKit(hero); hero.x = x; hero.z = z; } heroKey = ''; heroUI();
});
syncHeroAdmin();
