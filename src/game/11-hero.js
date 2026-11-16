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
  firm: { name: 'Deflect', line: r => `Takes ${[15, 25, 35][r]}% less damage`, desc: 'Takes less damage', vals: ['−15%', '−25%', '−35%'], req: [5, 7, 9], k: [.15, .25, .35] },
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
// Deflect (was Stand firm): the Heir takes less (hurtSoldier)
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
// the skills' pictures (Jack: game-icons.net icons, CC BY 3.0, coloured by part with the upgrades' thick dark outline):
// Inspire lorc's rally-the-troops (a banner in the town's colour over a rank of spears), Royal horse delapouite's horse-head,
// Deflect lorc's shield-reflect (a steel shield turning an arrow aside with a gold spark)
const HERO_ICO_SRC = {"cry": "<svg viewBox=\"0 0 512 512\"><defs><linearGradient id=\"hiB\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#9cc5ff\"/><stop offset=\"1\" stop-color=\"#2f5faf\"/></linearGradient><linearGradient id=\"hiW\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#d9a46a\"/><stop offset=\"1\" stop-color=\"#6e4524\"/></linearGradient><linearGradient id=\"hiG\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fff0b0\"/><stop offset=\"1\" stop-color=\"#d9a12e\"/></linearGradient><linearGradient id=\"hiS\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#f4f7fa\"/><stop offset=\"1\" stop-color=\"#9aa4b1\"/></linearGradient><clipPath id=\"hiT3\"><path d=\"M0 0H512V414.4L0 336.5Z\"/></clipPath><clipPath id=\"hiU3\"><path d=\"M0 336.5L512 414.4V512H0Z\"/></clipPath><clipPath id=\"hiT4\"><path d=\"M0 0H512V387.2L0 409.1Z\"/></clipPath><clipPath id=\"hiU4\"><path d=\"M0 409.1L512 387.2V512H0Z\"/></clipPath><clipPath id=\"hiT5\"><path d=\"M0 0H512V325.5L0 397.4Z\"/></clipPath><clipPath id=\"hiU5\"><path d=\"M0 397.4L512 325.5V512H0Z\"/></clipPath><clipPath id=\"hiT6\"><path d=\"M0 0H512V397.7L0 397.7Z\"/></clipPath><clipPath id=\"hiU6\"><path d=\"M0 397.7L512 397.7V512H0Z\"/></clipPath><clipPath id=\"hiT7\"><path d=\"M0 0H512V433.9L0 444.8Z\"/></clipPath><clipPath id=\"hiU7\"><path d=\"M0 444.8L512 433.9V512H0Z\"/></clipPath><clipPath id=\"hiT8\"><path d=\"M0 0H512V429.6L0 481.9Z\"/></clipPath><clipPath id=\"hiU8\"><path d=\"M0 481.9L512 429.6V512H0Z\"/></clipPath></defs><g fill=\"none\" stroke=\"#3d2c19\" stroke-width=\"34\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M 462.9,19.1 C 453.2,19.1 445.7,26.7 445.7,36.3 C 445.7,45.9 453.3,53.5 462.9,53.5 C 472.4,53.5 480.0,45.9 480.0,36.3 C 480.0,26.7 472.4,19.1 462.9,19.1 Z\"/><path d=\"M 382.5,40.9 C 222.2,41.7 164.4,258.4 19.6,137.2 C 22.9,174.0 108.0,215.6 108.0,215.6 C 82.0,235.6 73.3,240.2 36.1,241.1 C 140.2,327.8 374.7,141.3 444.4,281.2 L 430.7,46.9 C 413.5,42.7 397.7,40.8 382.5,40.9 Z\"/><path d=\"M 453.4,70.9 L 473.5,494.9 L 492.2,494.0 L 472.0,71.0 C 465.7,72.5 459.4,72.5 453.4,70.9 L 453.4,70.9 Z\"/><path d=\"M 360.0,292.9 L 316.4,362.9 L 337.7,387.9 L 322.0,493.0 L 340.9,493.0 L 356.0,390.7 L 384.0,370.5 C 375.9,344.6 367.9,318.7 359.9,292.9 L 360.0,292.9 Z\"/><path d=\"M 203.3,310.7 L 174.5,380.5 L 195.0,400.7 L 197.2,492.9 L 215.8,492.9 L 213.7,399.9 L 233.2,380.0 L 203.2,310.7 L 203.3,310.7 Z\"/><path d=\"M 45.1,315.7 L 28.7,377.6 L 46.3,390.8 L 61.2,493.0 L 80.1,493.0 L 64.8,388.3 L 78.1,370.7 L 45.1,315.8 L 45.1,315.7 Z\"/><path d=\"M 131.1,323.1 L 102.9,380.6 L 118.0,397.6 L 111.3,492.9 L 130.0,492.9 L 136.8,397.6 L 152.7,383.4 L 131.1,323.1 Z\"/><path d=\"M 268.0,355.5 L 248.5,423.9 L 267.9,439.0 L 273.7,492.9 L 292.5,492.9 L 286.7,438.6 L 303.5,417.0 C 291.6,396.5 279.8,376.0 268.0,355.4 L 268.0,355.5 Z\"/><path d=\"M 411.6,355.6 L 392.7,424.2 L 413.0,439.7 L 419.2,493.0 L 438.0,493.0 L 431.6,437.8 L 447.6,416.9 L 411.6,355.6 Z\"/></g><path d=\"M 382.5,40.9 C 222.2,41.7 164.4,258.4 19.6,137.2 C 22.9,174.0 108.0,215.6 108.0,215.6 C 82.0,235.6 73.3,240.2 36.1,241.1 C 140.2,327.8 374.7,141.3 444.4,281.2 L 430.7,46.9 C 413.5,42.7 397.7,40.8 382.5,40.9 Z\" fill=\"url(#hiB)\"/><path d=\"M 453.4,70.9 L 473.5,494.9 L 492.2,494.0 L 472.0,71.0 C 465.7,72.5 459.4,72.5 453.4,70.9 L 453.4,70.9 Z\" fill=\"url(#hiW)\"/><path d=\"M 462.9,19.1 C 453.2,19.1 445.7,26.7 445.7,36.3 C 445.7,45.9 453.3,53.5 462.9,53.5 C 472.4,53.5 480.0,45.9 480.0,36.3 C 480.0,26.7 472.4,19.1 462.9,19.1 Z\" fill=\"url(#hiG)\"/><path d=\"M 360.0,292.9 L 316.4,362.9 L 337.7,387.9 L 322.0,493.0 L 340.9,493.0 L 356.0,390.7 L 384.0,370.5 C 375.9,344.6 367.9,318.7 359.9,292.9 L 360.0,292.9 Z\" fill=\"url(#hiW)\" clip-path=\"url(#hiU3)\"/><path d=\"M 360.0,292.9 L 316.4,362.9 L 337.7,387.9 L 322.0,493.0 L 340.9,493.0 L 356.0,390.7 L 384.0,370.5 C 375.9,344.6 367.9,318.7 359.9,292.9 L 360.0,292.9 Z\" fill=\"url(#hiS)\" clip-path=\"url(#hiT3)\"/><path d=\"M328.8 386.5L365.0 392.1\" stroke=\"#3d2c19\" stroke-width=\"17\" stroke-linecap=\"round\"/><path d=\"M 203.3,310.7 L 174.5,380.5 L 195.0,400.7 L 197.2,492.9 L 215.8,492.9 L 213.7,399.9 L 233.2,380.0 L 203.2,310.7 L 203.3,310.7 Z\" fill=\"url(#hiW)\" clip-path=\"url(#hiU4)\"/><path d=\"M 203.3,310.7 L 174.5,380.5 L 195.0,400.7 L 197.2,492.9 L 215.8,492.9 L 213.7,399.9 L 233.2,380.0 L 203.2,310.7 L 203.3,310.7 Z\" fill=\"url(#hiS)\" clip-path=\"url(#hiT4)\"/><path d=\"M186.0 401.2L222.7 399.6\" stroke=\"#3d2c19\" stroke-width=\"17\" stroke-linecap=\"round\"/><path d=\"M 45.1,315.7 L 28.7,377.6 L 46.3,390.8 L 61.2,493.0 L 80.1,493.0 L 64.8,388.3 L 78.1,370.7 L 45.1,315.8 L 45.1,315.7 Z\" fill=\"url(#hiW)\" clip-path=\"url(#hiU5)\"/><path d=\"M 45.1,315.7 L 28.7,377.6 L 46.3,390.8 L 61.2,493.0 L 80.1,493.0 L 64.8,388.3 L 78.1,370.7 L 45.1,315.8 L 45.1,315.7 Z\" fill=\"url(#hiS)\" clip-path=\"url(#hiT5)\"/><path d=\"M37.5 392.2L73.8 387.0\" stroke=\"#3d2c19\" stroke-width=\"17\" stroke-linecap=\"round\"/><path d=\"M 131.1,323.1 L 102.9,380.6 L 118.0,397.6 L 111.3,492.9 L 130.0,492.9 L 136.8,397.6 L 152.7,383.4 L 131.1,323.1 Z\" fill=\"url(#hiW)\" clip-path=\"url(#hiU6)\"/><path d=\"M 131.1,323.1 L 102.9,380.6 L 118.0,397.6 L 111.3,492.9 L 130.0,492.9 L 136.8,397.6 L 152.7,383.4 L 131.1,323.1 Z\" fill=\"url(#hiS)\" clip-path=\"url(#hiT6)\"/><path d=\"M109.0 397.7L145.8 397.7\" stroke=\"#3d2c19\" stroke-width=\"17\" stroke-linecap=\"round\"/><path d=\"M 268.0,355.5 L 248.5,423.9 L 267.9,439.0 L 273.7,492.9 L 292.5,492.9 L 286.7,438.6 L 303.5,417.0 C 291.6,396.5 279.8,376.0 268.0,355.4 L 268.0,355.5 Z\" fill=\"url(#hiW)\" clip-path=\"url(#hiU7)\"/><path d=\"M 268.0,355.5 L 248.5,423.9 L 267.9,439.0 L 273.7,492.9 L 292.5,492.9 L 286.7,438.6 L 303.5,417.0 C 291.6,396.5 279.8,376.0 268.0,355.4 L 268.0,355.5 Z\" fill=\"url(#hiS)\" clip-path=\"url(#hiT7)\"/><path d=\"M258.9 439.3L295.7 438.5\" stroke=\"#3d2c19\" stroke-width=\"17\" stroke-linecap=\"round\"/><path d=\"M 411.6,355.6 L 392.7,424.2 L 413.0,439.7 L 419.2,493.0 L 438.0,493.0 L 431.6,437.8 L 447.6,416.9 L 411.6,355.6 Z\" fill=\"url(#hiW)\" clip-path=\"url(#hiU8)\"/><path d=\"M 411.6,355.6 L 392.7,424.2 L 413.0,439.7 L 419.2,493.0 L 438.0,493.0 L 431.6,437.8 L 447.6,416.9 L 411.6,355.6 Z\" fill=\"url(#hiS)\" clip-path=\"url(#hiT8)\"/><path d=\"M404.0 440.6L440.6 436.9\" stroke=\"#3d2c19\" stroke-width=\"17\" stroke-linecap=\"round\"/></svg>", "horse": "<svg viewBox=\"-22 0 512 512\"><defs><linearGradient id=\"hhC\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#c98a4e\"/><stop offset=\"1\" stop-color=\"#6b3f1d\"/></linearGradient><linearGradient id=\"hhM\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#7a5232\"/><stop offset=\"1\" stop-color=\"#3e2614\"/></linearGradient></defs><g fill=\"none\" stroke=\"#3d2c19\" stroke-width=\"34\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M 400.0,16.0 C 378.6,25.7 341.7,33.3 326.9,64.2 C 304.5,66.1 254.1,74.9 204.6,104.4 C 146.5,139.2 88.6,201.8 72.9,318.1 L 72.4,321.7 L 69.6,323.9 C 38.7,348.9 29.0,362.9 25.2,385.1 C 21.7,406.0 24.5,436.5 24.8,487.0 L 328.3,487.0 C 331.8,470.1 338.8,457.7 340.8,445.4 C 343.1,431.2 341.0,415.4 320.0,386.8 C 276.9,328.2 273.1,257.4 307.1,215.6 C 298.4,212.8 292.0,208.7 287.6,203.0 C 281.5,195.1 280.2,186.0 279.0,177.1 L 296.9,174.8 C 298.0,183.2 299.3,188.7 301.8,192.0 C 304.4,195.4 309.2,198.5 321.4,200.5 L 321.4,200.6 L 321.5,200.4 L 327.5,209.9 C 347.5,241.2 370.4,261.1 400.9,264.3 L 407.4,265.0 L 408.8,271.4 C 411.5,284.2 417.4,290.5 423.9,293.6 C 430.4,296.7 438.1,296.5 444.3,293.8 C 453.7,289.7 458.9,282.5 461.0,271.1 C 463.2,260.0 461.6,245.3 455.9,229.0 C 422.4,190.7 411.4,141.7 392.0,100.2 C 385.9,90.3 379.5,81.7 371.6,75.4 C 376.8,55.1 386.4,34.8 400.0,16.0 Z\"/><path d=\"M 214.0,34.9 C 179.5,35.0 146.0,43.0 96.0,58.5 C 127.1,68.5 166.3,77.4 182.0,97.5 C 186.5,94.5 190.9,91.7 195.4,89.0 C 235.9,64.8 275.8,53.7 303.6,48.9 C 267.8,39.5 240.6,34.8 214.0,34.9 L 214.0,34.9 Z\"/><path d=\"M 157.1,96.7 C 156.0,96.7 154.8,96.7 153.7,96.7 C 123.4,97.0 90.6,106.4 57.1,127.9 C 84.2,131.6 111.7,131.7 129.6,143.3 C 145.5,125.4 162.8,110.7 180.3,98.7 C 172.8,97.4 165.0,96.7 157.1,96.7 L 157.1,96.7 Z\"/><path d=\"M 129.0,144.0 C 92.6,145.5 60.1,150.5 24.3,168.8 C 57.5,175.9 75.2,182.3 89.3,202.6 C 100.8,180.1 114.4,160.7 129.0,144.0 L 129.0,144.0 Z\"/><path d=\"M 74.5,201.4 C 53.5,201.6 36.6,213.1 16.0,224.0 C 43.8,224.0 62.0,227.8 74.7,236.0 C 79.0,224.4 83.8,213.4 89.1,203.1 C 84.0,201.9 79.1,201.4 74.5,201.4 L 74.5,201.4 Z\"/><path d=\"M 73.8,238.2 C 55.9,244.1 38.4,245.4 19.6,260.5 C 37.2,265.2 54.4,270.1 61.0,282.5 C 64.5,266.8 68.8,252.0 73.8,238.2 L 73.8,238.2 Z\"/><path d=\"M 52.2,290.7 C 41.8,290.8 28.4,296.3 17.5,303.0 C 29.7,309.8 29.9,326.5 26.4,340.7 C 33.7,331.6 43.3,322.4 55.6,312.2 C 56.6,305.2 57.8,298.3 59.1,291.6 C 57.0,290.9 54.7,290.6 52.2,290.7 L 52.2,290.7 Z\"/></g><path d=\"M 400.0,16.0 C 378.6,25.7 341.7,33.3 326.9,64.2 C 304.5,66.1 254.1,74.9 204.6,104.4 C 146.5,139.2 88.6,201.8 72.9,318.1 L 72.4,321.7 L 69.6,323.9 C 38.7,348.9 29.0,362.9 25.2,385.1 C 21.7,406.0 24.5,436.5 24.8,487.0 L 328.3,487.0 C 331.8,470.1 338.8,457.7 340.8,445.4 C 343.1,431.2 341.0,415.4 320.0,386.8 C 276.9,328.2 273.1,257.4 307.1,215.6 C 298.4,212.8 292.0,208.7 287.6,203.0 C 281.5,195.1 280.2,186.0 279.0,177.1 L 296.9,174.8 C 298.0,183.2 299.3,188.7 301.8,192.0 C 304.4,195.4 309.2,198.5 321.4,200.5 L 321.4,200.6 L 321.5,200.4 L 327.5,209.9 C 347.5,241.2 370.4,261.1 400.9,264.3 L 407.4,265.0 L 408.8,271.4 C 411.5,284.2 417.4,290.5 423.9,293.6 C 430.4,296.7 438.1,296.5 444.3,293.8 C 453.7,289.7 458.9,282.5 461.0,271.1 C 463.2,260.0 461.6,245.3 455.9,229.0 C 422.4,190.7 411.4,141.7 392.0,100.2 C 385.9,90.3 379.5,81.7 371.6,75.4 C 376.8,55.1 386.4,34.8 400.0,16.0 Z\" fill=\"url(#hhC)\"/><path d=\"M 214.0,34.9 C 179.5,35.0 146.0,43.0 96.0,58.5 C 127.1,68.5 166.3,77.4 182.0,97.5 C 186.5,94.5 190.9,91.7 195.4,89.0 C 235.9,64.8 275.8,53.7 303.6,48.9 C 267.8,39.5 240.6,34.8 214.0,34.9 L 214.0,34.9 Z\" fill=\"url(#hhM)\"/><path d=\"M 157.1,96.7 C 156.0,96.7 154.8,96.7 153.7,96.7 C 123.4,97.0 90.6,106.4 57.1,127.9 C 84.2,131.6 111.7,131.7 129.6,143.3 C 145.5,125.4 162.8,110.7 180.3,98.7 C 172.8,97.4 165.0,96.7 157.1,96.7 L 157.1,96.7 Z\" fill=\"url(#hhM)\"/><path d=\"M 129.0,144.0 C 92.6,145.5 60.1,150.5 24.3,168.8 C 57.5,175.9 75.2,182.3 89.3,202.6 C 100.8,180.1 114.4,160.7 129.0,144.0 L 129.0,144.0 Z\" fill=\"url(#hhM)\"/><path d=\"M 74.5,201.4 C 53.5,201.6 36.6,213.1 16.0,224.0 C 43.8,224.0 62.0,227.8 74.7,236.0 C 79.0,224.4 83.8,213.4 89.1,203.1 C 84.0,201.9 79.1,201.4 74.5,201.4 L 74.5,201.4 Z\" fill=\"url(#hhM)\"/><path d=\"M 73.8,238.2 C 55.9,244.1 38.4,245.4 19.6,260.5 C 37.2,265.2 54.4,270.1 61.0,282.5 C 64.5,266.8 68.8,252.0 73.8,238.2 L 73.8,238.2 Z\" fill=\"url(#hhM)\"/><path d=\"M 52.2,290.7 C 41.8,290.8 28.4,296.3 17.5,303.0 C 29.7,309.8 29.9,326.5 26.4,340.7 C 33.7,331.6 43.3,322.4 55.6,312.2 C 56.6,305.2 57.8,298.3 59.1,291.6 C 57.0,290.9 54.7,290.6 52.2,290.7 L 52.2,290.7 Z\" fill=\"url(#hhM)\"/><path d=\"M 368.0,128.0 A 13.2,13.2 0.0 0,1 381.2,141.2 A 13.2,13.2 0.0 0,1 368.0,154.4 A 13.2,13.2 0.0 0,1 354.7,141.2 A 13.2,13.2 0.0 0,1 368.0,128.0 Z\" fill=\"#1e1209\"/><path d=\"M 444.0,246.8 C 445.6,246.8 447.2,246.8 448.8,247.0 L 447.1,264.9 C 443.2,264.6 441.6,265.3 441.6,265.4 C 441.5,265.4 440.5,266.0 440.9,271.3 L 423.0,272.6 C 422.3,264.3 424.3,256.4 429.9,251.6 C 434.2,248.0 439.1,246.9 444.0,246.8 L 444.0,246.8 Z\" fill=\"#2a170b\"/></svg>", "firm": "<svg viewBox=\"0 0 512 512\"><defs><linearGradient id=\"hfS\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#eef2f6\"/><stop offset=\"1\" stop-color=\"#8c96a3\"/></linearGradient><linearGradient id=\"hfG\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fff3b8\"/><stop offset=\"1\" stop-color=\"#e09424\"/></linearGradient></defs><g fill=\"none\" stroke=\"#3d2c19\" stroke-width=\"34\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M 19.3,19.4 L 18.9,47.2 L 286.1,202.0 L 227.4,221.9 L 285.0,241.3 L 142.1,383.5 L 122.9,364.3 L 71.4,478.6 L 194.5,435.1 L 177.0,416.2 L 328.9,264.3 L 341.3,307.4 L 364.3,238.9 L 421.0,222.3 L 363.5,206.8 L 340.6,127.0 L 326.4,175.3 L 57.8,19.9 L 19.3,19.4 L 19.3,19.4 Z\"/><path d=\"M 370.6,81.9 C 366.0,81.9 361.5,82.0 357.1,82.2 C 353.8,82.3 350.5,82.5 347.3,82.7 L 378.5,191.5 L 482.6,219.6 C 488.8,180.5 491.5,139.3 491.8,99.5 C 456.3,88.8 415.0,82.2 375.1,81.9 C 373.6,81.9 372.1,81.9 370.6,81.9 L 370.6,81.9 Z\"/><path d=\"M 333.7,84.0 C 301.7,87.6 272.7,96.1 250.7,109.9 L 315.2,147.2 L 333.7,84.0 L 333.7,84.0 Z\"/><path d=\"M 481.9,224.0 L 378.9,254.1 L 340.0,370.1 L 319.7,299.9 L 280.6,339.0 C 299.5,374.3 326.7,401.3 366.8,416.6 C 414.3,398.7 445.4,353.8 464.8,295.0 C 472.2,272.8 477.7,248.9 481.9,224.0 L 481.9,224.0 Z\"/></g><path d=\"M 370.6,81.9 C 366.0,81.9 361.5,82.0 357.1,82.2 C 353.8,82.3 350.5,82.5 347.3,82.7 L 378.5,191.5 L 482.6,219.6 C 488.8,180.5 491.5,139.3 491.8,99.5 C 456.3,88.8 415.0,82.2 375.1,81.9 C 373.6,81.9 372.1,81.9 370.6,81.9 L 370.6,81.9 Z\" fill=\"url(#hfS)\"/><path d=\"M 333.7,84.0 C 301.7,87.6 272.7,96.1 250.7,109.9 L 315.2,147.2 L 333.7,84.0 L 333.7,84.0 Z\" fill=\"url(#hfS)\"/><path d=\"M 481.9,224.0 L 378.9,254.1 L 340.0,370.1 L 319.7,299.9 L 280.6,339.0 C 299.5,374.3 326.7,401.3 366.8,416.6 C 414.3,398.7 445.4,353.8 464.8,295.0 C 472.2,272.8 477.7,248.9 481.9,224.0 L 481.9,224.0 Z\" fill=\"url(#hfS)\"/><path d=\"M 19.3,19.4 L 18.9,47.2 L 286.1,202.0 L 227.4,221.9 L 285.0,241.3 L 142.1,383.5 L 122.9,364.3 L 71.4,478.6 L 194.5,435.1 L 177.0,416.2 L 328.9,264.3 L 341.3,307.4 L 364.3,238.9 L 421.0,222.3 L 363.5,206.8 L 340.6,127.0 L 326.4,175.3 L 57.8,19.9 L 19.3,19.4 L 19.3,19.4 Z\" fill=\"url(#hfG)\"/></svg>"};
// each use gets its own gradient and clip names (a copy in a hidden card would otherwise leave the others unfilled), and the
// banner takes the town's colour like the upgrades' pictures (upIco)
let heroIcoN = 0;
const HERO_ICO = new Proxy(HERO_ICO_SRC, { get: (t, k) => {
  const n = ++heroIcoN, c = new THREE.Color(); c.setStyle(TEAM_PAL[TEAM.town]); const lt = '#' + c.clone().lerp(new THREE.Color(1, 1, 1), .45).getHexString();
  return (t[k] || '').replace(/(id="|url\(#)(h[a-zA-Z0-9]+)/g, `$1$2_${n}`).replace(/#9cc5ff/g, lt).replace(/#2f5faf/g, TEAM_PAL[TEAM.town]);
} });
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
    return `<button class="hsTile sk-${k}${k === hpSkSel ? ' sel' : ''}${r ? '' : ' off'}" data-hact="sk" data-k="${k}"><span class="hsIco">${HERO_ICO[k]}</span><span class="hsTx"><b>${HERO_SK[k].name}</b><span class="hsPips">${[0, 1, 2].map(n => `<i class="${n < r ? 'on' : ''}"></i>`).join('')}</span></span></button>`;
  }).join('');
  {
    const k = hpSkSel, S = HERO_SK[k], r = HERO.sk[k], c = rankCost(r), lvOk = r < 3 && HERO.lv >= S.req[r];
    // one full line (Jack: no boxes of figures): what the next rank does, or the top rank's once all are learnt
    const nextLine = r < 3 ? S.line(r) : S.line(2);
    const act = r >= 3 ? '<span class="hsNote">Max rank</span>'
      : !lvOk ? `<span class="hsNote">Needs Lv ${S.req[r]}</span>`
      : HERO.pts >= c ? `<button class="primary hsLearn" data-hact="learn" data-k="${k}">Learn<span class="hsLc">${SKP_ICO}${c}</span></button>`
      : `<span class="hsNote">Needs ${SKP_ICO}${c}</span>`;
    // a big picture with the name, the next rank and what it does in one column beside it (Jack)
    el.querySelector('.hsDet').innerHTML = `<div class="hsDh sk-${k}"><span class="hsIco">${HERO_ICO[k]}</span><span class="hsDt"><b>${S.name}</b><small class="hsRk">Rank ${r < 3 ? r + 1 : 3}</small><p class="hsDesc">${nextLine}</p></span></div>`
      + `<div class="hsAct">${act}</div>`;
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
