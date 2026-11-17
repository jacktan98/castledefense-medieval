// ---------- the heroes: the Heir, the Ranger and the Captain (one in the field at a time) ----------
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
  // Flurry (Jack: after every 5 slashes, a burst of 2/3/4 quick strikes)
  flurry: { name: 'Flurry', line: r => `After 5 slashes, strikes ${[2, 3, 4][r]} quick blows`, k: [2, 3, 4] },
  // the Ranger's: a second arrow, a longer reach, a faster bow
  twin: { name: 'Twin shot', line: r => `Shoots a second raider, ${[40, 70, 100][r]}% damage`, k: [.4, .7, 1] },
  eye: { name: 'Eagle eye', line: r => `Shoots ${[1.5, 3, 4.5][r]} m further`, k: [1.5, 3, 4.5] },
  // Quick draw (Jack: after every 10 arrows, a burst of 4/6/8 quick shots)
  quick: { name: 'Quick draw', line: r => `After 10 arrows, fires ${[4, 6, 8][r]} quick shots`, k: [4, 6, 8] },
  // the Captain's: troops round him take less, his blows sweep, he mends even in battle
  // Deflect (Jack: the Heir's old skill, now the Captain's in place of Shield wall): he takes less damage
  firm: { name: 'Deflect', line: r => `Takes ${[15, 25, 35][r]}% less damage`, k: [.15, .25, .35] },
  // Sweeping blow (Jack: every 5th blow, a spin of the war hammer)
  sweep: { name: 'Sweeping blow', line: r => `Every 5th blow sweeps raiders beside, ${[30, 50, 70][r]}%`, k: [.3, .5, .7] },
  wind: { name: 'Second wind', line: r => `Mends ${[1, 2, 3][r]}% health a second`, k: [.01, .02, .03] },
};
// the three heroes (Jack: the Ranger and the Captain unlocked): one takes the field at a time, picked on the Hero screen; each keeps
// its own level, XP and skills (mtd-hero for the Heir, as before; mtd-hero-ranger, mtd-hero-captain), the pick in mtd-hero-pick
const HERO_DEFS = {
  heir: { name: 'The Heir', role: 'Knight', order: ['cry', 'flurry', 'horse'], hp: [260, 30], dmg: [12, 2], rate: .8, hair: 1 },
  ranger: { name: 'The Ranger', role: 'Archer', order: ['twin', 'eye', 'quick'], hp: [170, 20], dmg: [8, 2], rate: 1.1, range: 8, hair: 0 },
  captain: { name: 'The Captain', role: 'Defender', order: ['firm', 'sweep', 'wind'], hp: [340, 35], dmg: [9, 2], rate: 1, hair: 3 },
};
const HERO_KEY = id => id === 'heir' ? 'mtd-hero' : 'mtd-hero-' + id;
var HERO_ID = (() => { try { const id = localStorage.getItem('mtd-hero-pick'); return HERO_DEFS[id] ? id : 'heir'; } catch (e) { return 'heir'; } })();
const heroDef = () => HERO_DEFS[HERO_ID], heroName = () => heroDef().name;
// a skill point is a four-point star (Jack: no "pts"), on the points left, on a rank's cost and when short of points
const SKP_ICO = '<svg class="skp" viewBox="0 0 24 24" aria-label="skill points"><path d="M12 .8 Q13.6 10.4 23.2 12 Q13.6 13.6 12 23.2 Q10.4 13.6 .8 12 Q10.4 10.4 12 .8 Z"/></svg>';
let HERO_ORDER = HERO_DEFS[HERO_ID].order.slice();
// points (Jack): each level from 1 to 4 brings 1, 5 to 8 brings 2, 9 and 10 bring 3 (18 in all); a skill's ranks cost 1, 2 and 3
// (6 a skill, 18 for all three), so a level-10 Heir has every rank
const lvPts = lv => lv <= 4 ? 1 : lv <= 8 ? 2 : 3;
const rankCost = r => r + 1;
const skCan = k => { const r = HERO.sk[k]; return r < 3 && HERO.pts >= rankCost(r); };
const ptsEarned = lv => { let n = 0; for (let i = 1; i <= lv; i++) n += lvPts(i); return n; };
const ptsSpent = sk => Object.keys(sk).reduce((t, k) => t + sk[k] * (sk[k] + 1) / 2, 0);
const skBlank = id => Object.fromEntries(HERO_DEFS[id].order.map(k => [k, 0]));
const heroBlank = (id = HERO_ID) => ({ lv: 1, xp: 0, pts: 1, sk: skBlank(id) });
function loadHero(id = HERO_ID) {
  try {
    const h = JSON.parse(localStorage.getItem(HERO_KEY(id)));
    if (h && h.lv) { const sk = skBlank(id); for (const k in sk) sk[k] = Math.min(3, (h.sk && h.sk[k]) || 0); const lv = Math.min(HERO_MAX, h.lv); let pts = ptsEarned(lv) - ptsSpent(sk); if (pts < 0) { for (const k in sk) sk[k] = 0; pts = ptsEarned(lv); } return { lv, xp: h.xp || 0, pts, sk }; }
  } catch (e) {}
  return heroBlank(id);
}
var HERO = loadHero();
const saveHero = () => { try { localStorage.setItem(HERO_KEY(HERO_ID), JSON.stringify(HERO)); } catch (e) {} };
const heroHp = () => heroDef().hp[0] + heroDef().hp[1] * (HERO.lv - 1), heroDmg = () => heroDef().dmg[0] + heroDef().dmg[1] * (HERO.lv - 1);
// the Ranger's reach, Eagle eye added
const heroRange = () => (heroDef().range || 0) + (HERO.sk.eye ? HERO_SK.eye.k[HERO.sk.eye - 1] : 0);
// pick another hero (the Hero screen's Heroes row): the one in the field, if any, stands down for the next game's
function pickHero(id) {
  if (!HERO_DEFS[id] || id === HERO_ID) return;
  saveHero(); HERO_ID = id; try { localStorage.setItem('mtd-hero-pick', id); } catch (e) {}
  HERO = loadHero(id); HERO_ORDER = HERO_DEFS[id].order.slice(); hpSkSel = ''; heroRecolour(); heroKey = '';
  if (hero) removeHero();
  sfx('click'); syncHeroBadge();
}
const heroNeed = () => 60 + 40 * HERO.lv;
const heroSpeed = () => HERO.sk.horse ? HERO_SK.horse.k[HERO.sk.horse - 1] : 1;
var heroHere = false, hero = null, heroDownT = 0, heroAt = null, heroFlag = null, heroMove = false, heroSel = false, heroWasNight = false;
var heroKey = '', heroBarKey = '';
const heroGold = mat('#e8b94a'); heroGold.metalness = .6; heroGold.roughness = .35;
// the Heir's look: the man-at-arms' mail and blue surcoat, sword and kite shield, but a gold crown for the helm
// the Ranger: a green hood over a leather jerkin, a quiver and a bow (no cape: Jack); the Captain: the man-at-arms' kit under a closed great
// helm with a blue plume, a dark blue cloak and a gold clasp. Head gear is marked helm, so it turns with the head (turnHead)
const HERO_HAIR = hairs[1];
const fletchM = mat('#efe6d2'), arrowWoodM = mat('#9a6b3c');
const rangerTunM = mat('#5b4630'), rangerGreenM = mat('#4f6e36'), rangerCloakM = mat('#3f5a2e'),
  capCloakM = teamMat(mat('#1f3d73'), 'town', '#1f3d73');
// the hood is an open shell round the head: drawn on both sides, so its inside shows where it stands off the head (Jack saw a gap)
rangerCloakM.side = THREE.DoubleSide;
function heroKit(v, id = HERO_ID, foot) {
  if (v.horse) stripKit(v);
  v.cape = null;
  const D = HERO_DEFS[id], hc = hairs[D.hair % hairs.length];
  // the hero's own hair (as on the portrait), whoever the villager was
  if (v.heroHair !== hc && v.headParts) { const old = v.headParts[2], h = makeHair(hc); old.parent.add(h); old.parent.remove(old); v.headParts[2] = h; v.hairC = hc; v.heroHair = hc; }
  const put = o => { o.traverse(m => { if (m.isMesh) m.castShadow = true; }); v.body.add(o); v.kit.push(o); return o; };
  const head = () => { const g = new THREE.Group(); g.userData.helm = true; return g; };
  if (id === 'ranger') {
    if (v.kit) v.kit.forEach(o => o.parent && o.parent.remove(o));
    v.kit = []; if (v.carryLog) v.carryLog.visible = v.carryStone.visible = false;
    v.kit.push(...armour(v, 1)); v.armour = null;
    // a green tunic under a short brown leather jerkin, and a leather bracer on the bow arm
    // (Jack: make the archer's clothes more distinct)
    v.torso.material = rangerGreenM; v.arms.forEach(a => a.userData.sleeve.material = rangerGreenM);
    put(cyl(.168, .2, .3, 6, rangerTunM, 0, .65, 0));
    const br = cyl(.052, .05, .12, 6, leatherM, 0, -.24, 0); br.castShadow = true; v.arms[0].add(br); v.kit.push(br);
    // the hood: a cap over the brow and the sides and back down to the neck, open over the face (the eyes show)
    const hd = put(head()), cap = new THREE.Mesh(new THREE.SphereGeometry(.158, 14, 5, 0, Math.PI * 2, 0, Math.PI * .36), rangerCloakM);
    const hood = new THREE.Mesh(new THREE.SphereGeometry(.16, 14, 8, Math.PI / 2 + .85, Math.PI * 2 - 1.7, 0, Math.PI * .64), rangerCloakM);
    cap.position.set(0, 1.04, -.01); hood.position.set(0, 1.04, -.01); hd.add(cap, hood);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(.06, .16, 6), rangerCloakM); tip.position.set(0, 1.1, -.17); tip.rotation.x = -1.9; hd.add(tip);
    const qv = new THREE.Group(); qv.position.set(.1, .72, -.205); qv.rotation.z = -.35; put(qv); qv.add(cyl(.05, .045, .34, 8, leatherM, 0, 0, 0));
    // arrows standing up out of it (Jack: make them read as arrows): shafts well clear of the rim, each with a white fletching
    // of two crossed vanes, one red
    // three, spread round the quiver's mouth, all white-fletched (Jack)
    for (let i = 0; i < 3; i++) {
      const a = i / 3 * Math.PI * 2 + .5, ax = Math.cos(a) * .026, az = Math.sin(a) * .026, fm = fletchM;
      qv.add(box(.014, .26, .014, arrowWoodM, ax, .2, az));
      const f1 = box(.05, .08, .006, fm, ax, .3, az), f2 = box(.006, .08, .05, fm, ax, .3, az); qv.add(f1, f2);
    }
    if (v.pivot) v.pivot.parent.remove(v.pivot);
    v.toolKind = 'bow'; v.pivot = makeTool('bow'); v.arms[0].add(v.pivot);
    v.soldier = true; v.cav = false;
  } else {
    soldierKit(v, 3, id === 'heir' && !foot && HERO.sk.horse > 0);
    for (const o of v.kit.slice()) if (o.userData && o.userData.helm) { o.parent && o.parent.remove(o); v.kit.splice(v.kit.indexOf(o), 1); }
    if (id === 'heir') {
      const c = head(); c.add(cyl(.118, .122, .055, 12, heroGold, 0, 0, 0));
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, p = new THREE.Mesh(new THREE.ConeGeometry(.026, .07, 4), heroGold); p.position.set(Math.sin(a) * .118, .055, Math.cos(a) * .118); c.add(p); }
      c.position.y = 1.12; put(c);
      if (v.horse) { v.flaps = [-1, 1].map(sx => { const h = new THREE.Group(); h.position.set(sx * .2, .98, 0); h.userData.flap = sx; v.horse.add(h);
        const c = box(.02, .36, .56, capCloakM, sx * .01, -.18, -.04); c.castShadow = true; h.add(c); return h; }); }
      // the Heir fights with the sword alone (Jack: no shield)
      for (const o of v.kit.slice()) if (o.userData && o.userData.shield) { o.parent && o.parent.remove(o); v.kit.splice(v.kit.indexOf(o), 1); }
    } else {
      put(captainHelm());
      // a war hammer in place of the sword (Jack); it swings with the sword's strikes
      if (v.pivot) v.pivot.parent.remove(v.pivot); v.pivot = makeTool('warhammer'); v.arms[1].add(v.pivot);
      // the cloak (Jack: make it move): four strips hinged one under the other from the shoulders, rippling like the bosses'
      // (capeWave, from the pose loop and the gallery)
      put(box(.48, .05, .1, capCloakM, 0, .88, -.13));
      let hinge = new THREE.Group(); hinge.position.set(0, .88, -.19); put(hinge); v.cape = [];
      for (let i = 0; i < 4; i++) { if (i) { const h2 = new THREE.Group(); h2.position.y = -.14; hinge.add(h2); hinge = h2; }
        const s = box(.42 + i * .02, .145, .03, capCloakM, 0, -.07, 0); s.castShadow = true; hinge.add(s); v.cape.push(hinge); }
    }
  }
  if (v.hatG) v.hatG.visible = false;
  // the Captain's helm sits low and closed: the hair would show through its dome
  // under the Captain's closed helm neither the hair nor the eyes show (Jack: the eyes poked through as two dots over the slit)
  if (v.headParts) { v.headParts[1].visible = v.headParts[2].visible = id !== 'captain'; }
  v.maxHp = v.hp = heroHp();
}
// the Captain's helm (Jack's reference: a knight's close helm): a polished dome with a raised ridge from brow to nape, a pointed
// visor whose top edge leaves a dark eye slit under the brow, three breathing slits each side of its prow (the gorget was dropped:
// Jack); the same plain steel as the shoulder plates (Jack: the polished steel's reflections drew its faces in a darker grey)
const capSteelM = steelM;
function captainHelm() {
  const g = new THREE.Group(), add = (o, to = g) => { o.castShadow = true; to.add(o); return o; };
  g.userData.helm = true;
  const dome = add(new THREE.Mesh(new THREE.SphereGeometry(.158, 16, 8, 0, Math.PI * 2, 0, Math.PI * .5), capSteelM)); dome.position.y = 1.07; dome.scale.y = 1.12;
  const ridge = add(new THREE.Mesh(new THREE.CylinderGeometry(.172, .172, .026, 18, 1, false, 0, Math.PI), capSteelM)); ridge.rotation.z = Math.PI / 2; ridge.position.y = 1.07; ridge.scale.x = 1.12;
  add(cyl(.158, .158, .2, 16, capSteelM, 0, 1.03, 0));   // up into the dome, so no gap shows above the eye slit
  // the prow: two plates meeting in front; the slit is a dark band of the same shape just behind their top edge
  for (const sx of [-1, 1]) {
    const vis = add(box(.17, .15, .02, capSteelM, sx * .07, .995, .14)); vis.rotation.y = sx * .62;
    const slit = add(box(.17, .018, .02, M.dark, sx * .068, 1.079, .134)); slit.rotation.y = sx * .62;
    const brow = add(box(.17, .03, .02, capSteelM, sx * .066, 1.103, .13)); brow.rotation.y = sx * .62;
    for (const x of [-.058, -.018, .022]) add(box(.014, .07, .012, M.dark, x * sx, -.005, .008), vis);
  }
  // drawn a little smaller (Jack), and set down onto the shoulders so it meets the body (Jack)
  g.scale.setScalar(.88); g.position.y = 1.03 * (1 - .88) - .025;
  return g;
}
function heroHome() { const K = castleB(); if (!K) return null; const dp = doorPoint(K), [ox, oz] = faceRot(K.face || 0, 0, 1.6); return { x: dp.x + ox, z: dp.z + oz }; }
function spawnHero() {
  const K = castleB(); if (!K || !heroOn() || hero || plainMap) return;
  const v = makeVillager(K); v.hero = true; v.summoned = true; v.inside = false; v.indoor = null; v.hideT = 0; v.g.visible = true;
  heroKit(v); v.sbar = makeBar(.6);
  const dp = doorPoint(K); v.x = v.rx = v.tx = dp.x; v.z = v.rz = v.tz = dp.z; v.g.rotation.y = faceAngle(K);
  hero = v; heroKey = '';
  if (v.cav) { v.rearT = 1.3; setTimeout(() => sfx('neigh', v), 250); }
}
function removeHero() {
  if (hero) { const i = villagers.indexOf(hero); if (i >= 0) villagers.splice(i, 1); scene.remove(hero.g); if (hero.sbar) scene.remove(hero.sbar.grp); }
  hero = null; setHeroFlag(null); heroSel = false; heroMove = false;
}
// a new game (startGame): a fresh Heir in front of the castle, timers and the Move flag cleared
function heroStart() {
  // a wave list left open in the last game closes (Jack saw it over the Hero screen)
  { const wp = $('#wavePop'); if (wp) wp.hidden = true; }
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
// Deflect: the Captain takes less (hurtSoldier)
function heroTake(d, v) {
  if (v.hero && HERO.sk.firm) {
    const k = HERO_SK.firm.k[HERO.sk.firm - 1]; d *= 1 - k;
    // now and then a blow is seen to glance off: steel sparks, a ringing clang, the share it took off in grey (the shield no longer
    // snaps up: Jack found the move bad)
    const now = performance.now();
    if (now - (v.deflAt || 0) > 3500 && Math.random() < .5) {   // at most every 3.5 s: in a crowd it cluttered
      v.deflAt = now; const y = walkY(v.rx, v.rz);
      sparkBurst(v.rx, y + .95 * UNIT_K, v.rz, '#eef4ff', 9); const c = sfx('clash', v); if (c) c.playbackRate.value = 1.35;
      floatText('−' + Math.round(k * 100) + '%', '#c9ced6', v.rx + .5, y + 1.5, v.rz);
    }
  }
  return d;
}
function heroFall(v) {
  v.gone = true; v.soldier = false; release(v); const i = villagers.indexOf(v); if (i >= 0) villagers.splice(i, 1);
  if (v.sbar) scene.remove(v.sbar.grp); fallen.push({ v, t: 0 });
  hero = null; heroDownT = HERO_CD; heroMove = false; log(`<b>${heroName()}</b> has fallen`, 'warn'); heroKey = '';
}
function heroXp(n) {
  if (!heroOn() || HERO.lv >= HERO_MAX) return;
  HERO.xp += n; let up = false;
  while (HERO.lv < HERO_MAX && HERO.xp >= heroNeed()) { HERO.xp -= heroNeed(); HERO.lv++; HERO.pts += lvPts(HERO.lv); up = true; }
  if (HERO.lv >= HERO_MAX) HERO.xp = 0;
  if (up) { if (hero) { hero.maxHp = heroHp(); hero.hp = hero.maxHp; } banner(`${heroName()} · Lv ${HERO.lv}`, ''); log(`<b>${heroName()}</b> · Lv ${HERO.lv}`, 'good'); sfx('achieve'); if (hero && hero.g.visible) hero.lvUpT = LVUP_T; }
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
  if (r >= 3 || HERO.pts < rankCost(r)) { sfx('nope'); return; }
  HERO.pts -= rankCost(r); HERO.sk[k]++; saveHero(); sfx('upgrade'); heroKey = ''; renderHeroPick();
  if (k === 'horse' && hero) { const x = hero.x, z = hero.z, hp = hero.hp / hero.maxHp; heroKit(hero); hero.hp = hero.maxHp * hp; hero.x = x; hero.z = z; if (HERO.sk.horse === 1) sfx('neigh', hero); }
}
// the Heir's own step, day and night (updateVillagers): hold the spot, go for raiders within 7 m of it, give up on any that lead 10 m off
function updateHero(v, dt) {
  const home = heroAt || heroHome(); if (!home) return;
  v.attackT = Math.max(0, (v.attackT || 0) - dt); v.cool = (v.cool || 0) - dt;
  // Second wind: the Captain mends all the time
  if (HERO.sk.wind && v.hp < v.maxHp) { v.hp = Math.min(v.maxHp, v.hp + v.maxHp * HERO_SK.wind.k[HERO.sk.wind - 1] * dt); v.windOn = .3;
    // soft green-white specks drift up from him while Second wind mends him
    if ((v.windFx = (v.windFx || 0) - dt) <= 0) { v.windFx = .16; const a = Math.random() * 6.283; sparkBurst(v.rx + Math.cos(a) * .22, walkY(v.rx, v.rz) + .3 + Math.random() * .6, v.rz + Math.sin(a) * .22, '#d6ffd9', 1); } }
  if (heroDef().range) { rangerStep(v, dt, home); return; }
  if (v.skip && (v.skip.t -= dt) <= 0) v.skip = null;
  let foe = v.foe && !v.foe.dead && Math.hypot(v.foe.x - home.x, v.foe.z - home.z) < 10 ? v.foe : null;
  if (!foe) { let bd = 7; for (const e of enemies) if (!e.dead && !e.dormant && (!v.skip || v.skip.e !== e)) { const d = Math.hypot(e.x - home.x, e.z - home.z); if (d < bd) { bd = d; foe = e; } } }
  if (foe !== v.foe) v.prog = null;
  v.foe = foe; const ride = heroSpeed() * (1 + decorFx(v.x, v.z, 'troopWalk'));
  if (foe) {
    const reach = .9 + (foe.horse ? .3 : 0) + (foe.engine ? ENEMY[foe.kind].r : 0) + (v.cav ? .35 : 0), d = Math.hypot(foe.x - v.x, foe.z - v.z);
    if (d > reach) { if (gateWait(v, foe.x, foe.z)) return; walkTo(v, foe.x, foe.z, dt, 1, reach * .9, 1.25 * ride); if (v.noProg > 4) { v.skip = { e: foe, t: 4 }; v.foe = null; } }
    else { turnTo(v, Math.atan2(foe.x - v.x, foe.z - v.z), dt); if (v.cool <= 0) { const b = heroBurst(v, 'flurry', 5, .3, SWORD_T); heroStrike(v, foe); const dm = heroDmg() * (1 + decorFx(v.x, v.z, 'troopDmg')) * heroBuff(v);
      v.quickHit = b === 'quick';
      if (b === 'start') flurryStart(v);
      // Sweeping blow: every 5th blow the Captain spins and also lands on every other raider within 1.6 m of the one he strikes
      if (v.strike === 'sweep') { const k = HERO_SK.sweep.k[HERO.sk.sweep - 1], hit = [foe];
        for (const e of enemies.slice()) if (e !== foe && !e.dead && !e.dormant && Math.hypot(e.x - foe.x, e.z - foe.z) < 1.6) { hurtEnemy(e, dm * k, v); hit.push(e); }
        sweepFx(v, hit); }
      hurtEnemy(foe, dm, v);
      if (v.quickHit) { sparkBurst(foe.x, walkY(foe.x, foe.z) + .8 * UNIT_K, foe.z, '#ffe08a', 7); const c = sfx('clash', v); if (c) c.playbackRate.value = 1.3; }
      else if (v.strike !== 'sweep') sfx('clash', v); } }
  } else if (Math.hypot(home.x - v.x, home.z - v.z) > .35) { if (!gateWait(v, home.x, home.z)) walkTo(v, home.x, home.z, dt, 1, .3, 1.3 * ride); }
  else { const K = castleB(); if (K && !heroAt) turnTo(v, faceAngle(K), dt); heroHere = true; }
  heroMend(v, dt, foe);
}
// the Ranger: holds the spot and shoots the nearest raider in reach (never a dormant camp's), drawing first like the towers' archers;
// Twin shot sends a second arrow at another raider, Quick draw fires a burst of quick shots
function rangerStep(v, dt, home) {
  const R = heroRange();
  if (v.skip && (v.skip.t -= dt) <= 0) v.skip = null;
  let foe = v.foe && !v.foe.dead && Math.hypot(v.foe.x - v.x, v.foe.z - v.z) < R + .5 ? v.foe : null;
  if (!foe) { let bd = R; for (const e of enemies) if (!e.dead && !e.dormant) { const d = Math.hypot(e.x - v.x, e.z - v.z); if (d < bd) { bd = d; foe = e; } } }
  v.foe = foe; v.drawing = !!foe && !(v.attackT > 0) && v.cool < DRAW;
  if (Math.hypot(home.x - v.x, home.z - v.z) > .35) { if (!foe || v.cool > DRAW) walkTo(v, home.x, home.z, dt, 1, .3, 1.3); }
  else if (!foe) { const K = castleB(); if (K && !heroAt) turnTo(v, faceAngle(K), dt); heroHere = true; }
  heroMend(v, dt, foe);
  if (!foe) { v.cool = Math.max(v.cool, 0); return; }
  v.walking = false; turnTo(v, Math.atan2(foe.x - v.x, foe.z - v.z), dt);
  // the bow glints just before the arrow that sets off Quick draw
  if (HERO.sk.quick && v.hitN === 9 && v.drawing && !v.glinted && v.pivot) { v.glinted = true; glintAt(v.pivot.getWorldPosition(new THREE.Vector3()), '#fff1b8'); }
  if (v.cool > 0) return;
  const b = heroBurst(v, 'quick', 10, .2, .3); v.glinted = false;

  const dm = heroDmg() * (1 + decorFx(v.x, v.z, 'troopDmg')) * heroBuff(v), from = bowPoint(v);
  const shoot = (e, d) => {
    const to = new THREE.Vector3(e.x, walkY(e.x, e.z) + (e.horse ? 1.2 : .8) * UNIT_K, e.z);
    // Quick draw's arrows: a quicker, higher twang, a glow and a trail of sparks, the draw hand flicking back to the quiver
    shotRate = b === 'quick' ? 1.35 : 0;
    const m = fireArrow(from, to, () => { if (!e.dead) hurtEnemy(e, d, v); }); shotRate = 0;
    if (b === 'quick') { m.material = glowArrowM; glowArrows.push(m); v.fanT = .2; }
  };
  shoot(foe, dm);
  if (HERO.sk.twin) {
    let two = null, bd = R; for (const e of enemies) if (e !== foe && !e.dead && !e.dormant) { const d = Math.hypot(e.x - v.x, e.z - v.z); if (d < bd) { bd = d; two = e; } }
    if (two) { shoot(two, dm * HERO_SK.twin.k[HERO.sk.twin - 1]); glintAt(from, '#ffffff'); }
  }
}
// which strike the hero plays (`v.strike`, read by the pose loop): the Heir alternates the overhead chop with a sword thrust (Flurry's
// quick blows too); the Captain swings round on the spot with his Sweeping blow every 5th blow (Jack)
const SWEEP_T = .75;
function heroStrike(v, foe) {
  v.strike = 'chop'; if (v.pivot) v.pivot.position.set(0, -.33, 0);   // a thrust slides the grip along the blade: put it back
  if (HERO_ID === 'heir') v.strike = (v.strikeN = (v.strikeN || 0) + 1) % 2 ? 'thrust' : 'chop';
  else if (HERO.sk.sweep && (v.sweepN = (v.sweepN || 0) + 1) >= 5) {
    v.sweepN = 0; v.strike = 'sweep'; v.attackT = SWEEP_T; v.atkK = SWORD_T / SWEEP_T; v.cool = Math.max(v.cool, SWEEP_T);
  }
}
// Flurry and Quick draw: every n-th blow or arrow (`v.hitN`) sets off a burst of quick ones (`v.burst`), each `quick` s apart, the
// sword's swing played faster to fit (`v.atkK`, read by the pose loop)
function heroBurst(v, sk, n, quick, at) {
  const base = heroDef().rate * (1 - decorFx(v.x, v.z, 'troopRate'));
  if (v.burst > 0) { v.burst--; v.cool = quick; v.attackT = Math.min(at, quick); v.atkK = at / v.attackT; return 'quick'; }
  v.cool = base; v.attackT = at; v.atkK = 1;
  if (HERO.sk[sk] && (v.hitN = (v.hitN || 0) + 1) >= n) { v.hitN = 0; v.burst = HERO_SK[sk].k[HERO.sk[sk] - 1]; v.cool = Math.min(base, .35); return 'start'; }
  return '';
}
// ---------- the skills' effects (Jack: make Flurry, Quick draw and Sweeping blow show) ----------
// (the skill's icon over the hero as it fired was dropped: Jack) Flurry: a glint at the sword's tip as the burst winds up, "×N" for the blows to come; each quick blow
// leaves a gold trail behind the blade and sparks on the raider. Quick draw: a glint on the bow before the 10th arrow,
// glowing arrows with a trail of sparks and a higher twang, the hand flicking back to the quiver. Sweeping blow: a steel
// arc behind the hammer, a ring of dust, the raiders it catches knocked back, the cloak flared and a heavier blow's sound.
var shotRate = 0;
const glowArrowM = new THREE.MeshBasicMaterial({ color: '#ffd36a', toneMapped: false }), glowArrows = [], heroSprites = [];
const BOW_LINE = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, .35, 0)], SWORD_LINE = [new THREE.Vector3(0, -.12, 0), new THREE.Vector3(0, -.64, 0)], HAMMER_LINE = [new THREE.Vector3(0, -.5, 0), new THREE.Vector3(0, -.72, 0)];
function sparkBurst(x, y, z, color = '#ffe9a8', n = 6) {
  for (let i = 0; i < n && puffs.length < 170; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emberTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    sp.position.set(x + (Math.random() - .5) * .2, y + Math.random() * .15, z + (Math.random() - .5) * .2); sp.scale.setScalar(.07);
    fxScene().add(sp); puffs.push({ sp, t: 0, life: .25 + Math.random() * .25, dx: (Math.random() - .5) * 2, ember: true });
  }
}
// a soft star that swells and fades where a weapon glints (follow: a function giving its place each frame)
function glintAt(at, color, follow) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emberTex, color, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  sp.position.copy(at); sp.renderOrder = 25; fxScene().add(sp); heroSprites.push({ sp, t: 0, life: .4, kind: 'glint', follow });
}
function flurryStart(v) {
  const tip = () => v.pivot ? v.pivot.localToWorld(SWORD_LINE[1].clone()) : new THREE.Vector3(v.x, 1, v.z);
  glintAt(tip(), '#fff4c0', tip);
  floatText('×' + v.burst, '#ffd768', v.x + .7, walkY(v.x, v.z) + 1.25, v.z);
}
function sweepFx(v, hit) {
  const y = walkY(v.x, v.z);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; dustAt(v.x + Math.cos(a) * .75, y, v.z + Math.sin(a) * .75); }
  // the raiders it catches are knocked back (drawn sliding: their drawn place eases after the real one)
  for (const e of hit) { if (e.dead || ENEMY[e.kind].engine || ENEMY[e.kind].boss) continue;
    const d = Math.hypot(e.x - v.x, e.z - v.z) || 1, nx = e.x + (e.x - v.x) / d * .5, nz = e.z + (e.z - v.z) / d * .5;
    if (canStand(nx, nz, 2)) { e.x = nx; e.z = nz; } }
  const c = sfx('clash', v); if (c) c.playbackRate.value = .72; sfx('ramHit', v, .55);
}
// each frame: the weapon trails, the glints and icons, the glowing arrows' sparks
const heroTrails = new Map();
function heroTrail(v, line, color, on) {
  let T = heroTrails.get(v);
  if (!T) {
    const N = 14, geo = new THREE.BufferGeometry(), idx = [];
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3)); geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 6), 3));
    for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } geo.setIndex(idx);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    m.frustumCulled = false; m.renderOrder = 6; fxScene().add(m); T = { m, N, pts: [] }; heroTrails.set(v, T);
  }
  if (!T.m.parent) fxScene().add(T.m);
  const now = performance.now(), LIFE = 230;
  if (on && v.pivot && v.g.visible) { v.pivot.updateWorldMatrix(true, false); T.pts.unshift({ a: v.pivot.localToWorld(line[0].clone()), b: v.pivot.localToWorld(line[1].clone()), t: now }); }
  while (T.pts.length > T.N || (T.pts.length && now - T.pts[T.pts.length - 1].t > LIFE)) T.pts.pop();
  const P = T.m.geometry.attributes.position.array, C = T.m.geometry.attributes.color.array, col = new THREE.Color(color);
  T.pts.forEach((q, i) => { const k = Math.max(0, 1 - (now - q.t) / LIFE) * (1 - i / T.N);
    P.set([q.a.x, q.a.y, q.a.z, q.b.x, q.b.y, q.b.z], i * 6); C.set([col.r * k * .7, col.g * k * .7, col.b * k * .7, col.r * k * 1.4, col.g * k * 1.4, col.b * k * 1.4], i * 6); });
  T.m.geometry.setDrawRange(0, Math.max(0, T.pts.length - 1) * 6);
  T.m.geometry.attributes.position.needsUpdate = T.m.geometry.attributes.color.needsUpdate = true;
}
// the other skills' looks (Jack: all of them): Inspire's sparks on the troops' weapons inside
// it (Jack: the gold pulse every 8 s and the sword raised were dropped); Royal horse's dust behind the hooves, the cloth flaps and the
// rear-up as the Heir first rides out; Twin shot's two arrows on the string and a flash as they part; Eagle eye's eagle circling
// over the Ranger while he has a target and his reach ring while picked; Deflect's glancing blows (heroTake); Second wind's specks,
// the portrait's health bar pulsing and a slow breath every few seconds
const heroRings = {};
function heroRing(k, r, color, op, at) {
  let m = heroRings[k];
  if (!m || m.userData.r !== r) { if (m) { unparent(m); m.geometry.dispose(); }
    m = heroRings[k] = new THREE.Mesh(new THREE.RingGeometry(r - .1, r, 72), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, blending: THREE.AdditiveBlending }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 4; m.userData.r = r; m.userData.op = 0; fxScene().add(m); }
  if (!m.parent) fxScene().add(m);
  m.userData.op += ((op || 0) - m.userData.op) * .15; m.material.opacity = m.userData.op; m.visible = m.userData.op > .01;
  const w = at || hero; if (w) m.position.set(w.rx, at ? .07 : walkY(w.rx, w.rz) + .07, w.rz);
  return m;
}
const eagleM = mat('#4a3220'), eagleDarkM = mat('#2e1f14'), eagleWhiteM = mat('#f1ede2'), eagleBeakM = mat('#e7b23a');
// Eagle eye's eagle (Jack: it looked like any bird): a bald eagle seen from below and the side: dark brown body and broad wings,
// fingered primaries splayed at the tips, white head and fanned white tail, a hooked yellow beak and yellow talons tucked under.
// Its forward is +z, like `makeBird`; `flap(k)` beats the wings, the outer half bending further
function makeEagle() {
  const g = new THREE.Group(), add = (m, ...a) => { const b = box(...a.slice(0, 3), m, ...a.slice(3)); g.add(b); return b; };
  add(eagleM, .15, .13, .4, 0, 0, 0);                                    // body
  add(eagleM, .12, .11, .1, 0, -.01, .22);                               // shoulders into the neck
  add(eagleWhiteM, .11, .1, .12, 0, .03, .3);                            // the white head
  add(eagleBeakM, .05, .05, .07, 0, .01, .39);                           // beak
  add(eagleBeakM, .03, .04, .03, 0, -.025, .42);                         // its hooked tip
  for (const sx of [-1, 1]) add(eagleDarkM, .012, .02, .02, sx * .056, .05, .34);   // eyes
  for (const a of [-.35, 0, .35]) { const f = add(eagleWhiteM, .07, .02, .2, Math.sin(a) * .06, .01, -.28); f.rotation.y = a; }   // tail fan
  for (const sx of [-1, 1]) add(eagleBeakM, .04, .05, .07, sx * .04, -.08, -.02);   // talons tucked under
  const wings = [-1, 1].map(sx => {
    const w = new THREE.Group(); w.position.set(sx * .07, .03, .04); g.add(w);
    w.add(box(.34, .025, .22, eagleM, sx * .17, 0, 0));                  // inner wing
    const o = new THREE.Group(); o.position.x = sx * .34; w.add(o);
    o.add(box(.24, .022, .18, eagleM, sx * .12, 0, -.01));               // outer wing
    for (let i = 0; i < 5; i++) { const f = box(.16, .015, .035, eagleDarkM, sx * .3, 0, .06 - i * .042); f.rotation.y = -sx * (i - 2) * .12; o.add(f); }   // primaries
    w.userData.outer = o; return w;
  });
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { g, wings, flap: k => wings.forEach((w, i) => { const sg = i ? -1 : 1; w.rotation.z = sg * (k - .06); w.userData.outer.rotation.z = sg * (k * .7 + .04); }) };
}
let eagle = null, eagleA = 0, eagleK = 0;
const LVUP_T = 1.8;
function heroLooks(dt, now) {
  const v = hero, on = v && v.g.visible;
  // Inspire
  const insp = on && HERO_ID === 'heir' && HERO.sk.cry, mates = insp ? villagers.filter(u => u.soldier && !u.hero && u.g.visible && Math.hypot(u.x - v.x, u.z - v.z) < 7) : [];
  const ringOn = insp && (mates.length || v.foe);
  if (ringOn) {
    if (mates.length && (v.crySpark = (v.crySpark || 0) - dt) <= 0) { v.crySpark = .3; const u = mates[Math.floor(Math.random() * mates.length)];
      if (u.pivot) { const w = u.pivot.getWorldPosition(new THREE.Vector3()); sparkBurst(w.x, w.y - .1, w.z, '#ffd24a', 1); } }
  }
  // Royal horse
  if (on && v.cav) {
    const ry = v.g.rotation.y, mv = v.walking || (v.amp || 0) > .2;
    if (mv && (v.hoofT = (v.hoofT || 0) - dt) <= 0) { v.hoofT = .07; dustAt(v.rx - Math.sin(ry) * .7, walkY(v.rx, v.rz), v.rz - Math.cos(ry) * .7); }
    if (v.flaps) v.flaps.forEach((h, i) => { h.rotation.z = h.userData.flap * ((mv ? .35 : .08) + Math.sin(now / (mv ? 90 : 400) + i * 1.7) * (mv ? .12 : .04)); });
    if (v.rearT > 0) { v.rearT -= dt; const k = v.rearT > 0 ? Math.sin(Math.PI * (1 - v.rearT / 1.3)) : 0; v.g.rotation.order = 'YXZ'; v.g.rotation.x = -.5 * k; v.g.position.y += .25 * k; }
  }
  // Twin shot: two arrows nocked while the Ranger draws
  if (v && HERO_ID === 'ranger' && v.pivot) {
    let nk = v.pivot.userData.nock;
    if (!nk) { nk = v.pivot.userData.nock = new THREE.Group(); for (const x of [-.018, .018]) nk.add(box(.012, .6, .012, arrowWoodM, x, -.18, 0), box(.006, .09, .05, fletchM, x, .08, 0)); v.pivot.add(nk); }
    nk.visible = !!(HERO.sk.twin && v.drawing);
  }
  // Eagle eye: the eagle circles while the Ranger has a target; the reach ring while he is picked
  const eye = on && HERO_ID === 'ranger' && HERO.sk.eye;
  eagleK += ((eye && v.foe ? 1 : 0) - eagleK) * Math.min(1, dt * 1.5);
  if (eagleK > .02) {
    if (!eagle) eagle = makeEagle();
    if (!eagle.g.parent) scene.add(eagle.g);
    eagleA += dt * .55; const y = walkY(v.rx, v.rz) + 5.5 + 8 * (1 - eagleK);
    eagle.g.position.set(v.rx + Math.cos(eagleA) * 3.2, y + Math.sin(eagleA * 2) * .3, v.rz + Math.sin(eagleA) * 3.2);
    eagle.g.rotation.set(0, -eagleA, .35); eagle.g.scale.setScalar(.9); eagle.g.visible = true;
    eagle.flap(Math.sin(now / 1000 * 2.2) > .55 ? Math.sin(now / 110) * .45 : 0);
  } else if (eagle) eagle.g.visible = false;
  heroRing('reach', HERO_ID === 'ranger' ? heroRange() : 1, '#8fc1db', on && HERO_ID === 'ranger' && heroSel ? .45 : 0);
  // a gold ring at the hero's feet while picked (Jack: so players see they are controlling them), pulsing gently; wider on a horse
  const sr = heroRing(v && v.cav ? 'selH' : 'sel', v && v.cav ? .8 : .5, '#f2d98a', on && heroSel ? .26 + .05 * Math.sin(now / 320) : 0);
  heroRing(v && v.cav ? 'sel' : 'selH', v && v.cav ? .5 : .8, '#f2d98a', 0); sr.material.blending = THREE.NormalBlending;
  // a level gained: a column of gold light rises round the hero with sparks spiralling up, a gold ring spreads on the ground,
  // and the hero hops with the weapon raised (Jack)
  if (v) lvUpFx(v, dt, now, HERO_ID, 'lvup'); else heroRing('lvup', 2.4, '#ffd24a', 0);
  // Second wind: the portrait's health bar pulses while it mends him; a slow breath every few seconds
  const hb = document.querySelector('#heroBar .hpb'); if (hb) hb.classList.toggle('mend', !!(v && v.windOn > 0));
  if (v && v.windOn > 0) v.windOn -= dt;
  if (on && HERO_ID === 'captain' && HERO.sk.wind && !(v.attackT > 0)) {
    if ((v.breathIn = (v.breathIn == null ? 4 : v.breathIn) - dt) <= 0) { v.breathIn = 4; v.breathT = .9; }
    if (v.breathT > 0) { v.breathT -= dt; const k = Math.sin(Math.PI * Math.max(0, 1 - v.breathT / .9)); v.body.position.y += .03 * k; v.arms[0].rotation.z += .12 * k; v.arms[1].rotation.z -= .12 * k; }
  }
}
// a level gained (the game's hero, or a gallery figure: at = the figure, standing on the gallery's flat lawn, key its own ring)
function lvUpFx(v, dt, now, id, key, at) {
  if (v.lvUpT > 0) {
    v.lvUpT -= dt; const f = Math.min(1, 1 - v.lvUpT / LVUP_T), y = at ? 0 : walkY(v.rx, v.rz), H = v.cav ? 3.4 : 2.8;
    let lvBeam = v.lvBeam;
    if (!lvBeam) {
      const c = document.createElement('canvas'); c.width = 4; c.height = 64; const x = c.getContext('2d'), gr = x.createLinearGradient(0, 64, 0, 0);
      gr.addColorStop(0, 'rgba(255,220,110,1)'); gr.addColorStop(.35, 'rgba(255,214,90,.55)'); gr.addColorStop(1, 'rgba(255,214,90,0)'); x.fillStyle = gr; x.fillRect(0, 0, 4, 64);
      lvBeam = new THREE.Mesh(new THREE.CylinderGeometry(.62, .7, 1, 24, 1, true), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), color: '#ffd24a', transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false }));
      lvBeam.renderOrder = 7; lvBeam.frustumCulled = false; v.lvBeam = lvBeam;
    }
    if (!lvBeam.parent) fxScene().add(lvBeam);
    const up = Math.min(1, f / .2), k = v.lvUpT > 0 ? up * (f < .55 ? 1 : 1 - (f - .55) / .45) : 0;
    lvBeam.visible = k > .01; lvBeam.scale.set(1 - .25 * f, H * up, 1 - .25 * f); lvBeam.position.set(v.rx, y + H * up / 2, v.rz); lvBeam.material.opacity = .5 * k;
    if (f < .8 && (v.lvSpark = (v.lvSpark || 0) - dt) <= 0) { v.lvSpark = .03; const a = now / 120 + Math.random() * .6, r = .55;
      for (const s of [0, Math.PI]) sparkBurst(v.rx + Math.cos(a + s) * r, y + .2 + f * H * .9, v.rz + Math.sin(a + s) * r, '#ffe27a', 1); }
    const m = heroRing(key, 2.4, '#ffd24a', f < .7 ? .7 * (1 - f / .7) : 0, at); m.scale.setScalar(Math.max(.05, Math.min(1, f / .7)));
    if (f > .08 && !v.lvGlint && v.pivot) { v.lvGlint = true; const tip = () => v.pivot.localToWorld((id === 'captain' ? HAMMER_LINE : id === 'ranger' ? BOW_LINE : SWORD_LINE)[1].clone()); glintAt(tip(), '#fff4c0', tip); }
    // a quick hop (a third of a second, a real jump's curve) and the weapon snapped up, held and lowered (Jack: slow, it looked like floating)
    if (!(v.attackT > 0)) { const t = LVUP_T - v.lvUpT, u = (t - .05) / .34;
      if (!v.cav && u > 0 && u < 1) v.g.position.y += .26 * 4 * u * (1 - u);
      const a = t < .12 ? t / .12 : t < .95 ? 1 : Math.max(0, 1 - (t - .95) / .2);
      v.arms[1].rotation.x += (-2.9 - v.arms[1].rotation.x) * a; }
    if (v.lvUpT <= 0) { v.lvGlint = false; lvBeam.visible = false; }
  } else { if (v.lvBeam) v.lvBeam.visible = false; heroRing(key, 2.4, '#ffd24a', 0, at); }
}
function heroFx(dt) {
  heroLooks(dt, performance.now());
  if (hero) {
    heroTrail(hero, HERO_ID === 'captain' ? HAMMER_LINE : SWORD_LINE, HERO_ID === 'captain' ? '#eef4ff' : '#ffd24a',
      hero.attackT > 0 && (hero.quickHit || hero.strike === 'sweep'));
    if (hero.fanT > 0) hero.fanT -= dt;
  }
  for (const [v, T] of heroTrails) if (v !== hero) { unparent(T.m); T.m.geometry.dispose(); heroTrails.delete(v); }
  heroSpriteTick(dt);
  for (let n = glowArrows.length - 1; n >= 0; n--) { const m = glowArrows[n];
    if (!arrows.some(a => a.m === m)) { glowArrows.splice(n, 1); continue; }
    sparkBurst(m.position.x, m.position.y - .05, m.position.z, '#ffd36a', 1); }
}
// the glints (the game's and the gallery's)
function heroSpriteTick(dt) {
  for (let n = heroSprites.length - 1; n >= 0; n--) {
    const s = heroSprites[n]; s.t += dt; const f = s.t / s.life;
    if (f >= 1) { unparent(s.sp); s.sp.material.dispose(); heroSprites.splice(n, 1); continue; }
    if (s.kind === 'glint') { if (s.follow) s.sp.position.copy(s.follow()); s.sp.scale.setScalar(.15 + .45 * Math.sin(Math.PI * f)); s.sp.material.opacity = 1 - f * f; }
  }
}
// the hero mends slowly once out of a fight for 5 s, day or night (Jack; it was by day only): no foe and no hit taken
function heroMend(v, dt, foe) {
  if (foe || performance.now() - (v.hitAt || 0) < 5000) { v.calmT = 0; return; }
  if ((v.calmT = (v.calmT || 0) + dt) >= 5 && v.hp < v.maxHp) v.hp = Math.min(v.maxHp, v.hp + v.maxHp * .02 * dt);
}
// one step of the game (tick): timers, the comeback, a night survived
function heroTick(dt) {
  if (!heroOn()) { if (hero) removeHero(); return; }
  if (!hero && heroDownT > 0 && (heroDownT -= dt) <= 0) { heroDownT = 0; spawnHero(); log(`<b>${heroName()}</b> returns`, 'good'); }
  else if (!hero && !heroDownT && !gameOver) spawnHero();
  if (heroFlag) heroFlag.visible = flagFocus === 'hero' && !heroHere;
  const night = PH.kind === 'night'; if (heroWasNight && !night && hero && !gameOver) heroXp(20); heroWasNight = night;
}
// taps (tap): Move's spot first, then the Heir themself (with nothing being built)
function heroTap(e) {
  if (!heroOn()) return false;
  // (Jack: after tapping a spot the hero stayed picked, ring and card, but the next tap on the ground did nothing, so it was unclear
  // what was being controlled): a spot sends the hero there and lets go of them, card and ring gone, the flag showing until they
  // arrive; a tap on the hero again while picked lets go too; tapping the hero picks them again for the next move
  if (heroMove) {
    const pt = pick(e);
    if (pt && hero && Math.hypot(pt.x - hero.rx, pt.z - hero.rz) < (hero.cav ? 1.2 : .9)) { heroRelease(); sfx('click'); setHint('Select a building'); return true; }
    if (!pt || !canStand(pt.x, pt.z, 1)) { setHint('Blocked', 'bad'); return true; }
    setHeroFlag(pt); heroRelease(); flagFocus = 'hero'; sfx('click'); setHint('Moving'); return true;
  }
  if (!hero || !hero.g.visible || (tool && tool !== 'select')) return false;
  // a tap on the hero (within 1.6 m, more on a horse: Jack, easier to hit on a phone) opens the card and goes straight to Move, as the
  // portrait does
  const pt = pick(e); if (pt && Math.hypot(pt.x - hero.rx, pt.z - hero.rz) < (hero.cav ? 2 : 1.6)) {
    heroSelect(); heroMove = true; rallyFor = null; volleyAim = false; setHint('Tap a spot'); heroKey = ''; return true; }
  return false;
}
function heroRelease() { heroMove = false; heroSel = false; heroKey = ''; heroUI(); }
function heroSelect() { if (selected) deselect(); flagFocus = 'hero'; heroSel = true; heroKey = ''; sfx('click'); heroUI(); }
// ---- on screen: the portrait (and the Heir's skills at night) under the top panel; the Heir's card in the dock ----
// the skills' pictures (Jack: game-icons.net icons, CC BY 3.0, coloured by part with the upgrades' thick dark outline):
// Inspire lorc's rally-the-troops (a banner in the town's colour over a rank of spears), Royal horse delapouite's horse-head,
// Deflect lorc's shield-reflect (a steel shield turning an arrow aside with a gold spark)
const HERO_ICO_SRC = {"cry":"<svg viewBox=\"0 0 512 512\"><defs><linearGradient id=\"hiB\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#9cc5ff\"/><stop offset=\"1\" stop-color=\"#2f5faf\"/></linearGradient><linearGradient id=\"hiW\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#d9a46a\"/><stop offset=\"1\" stop-color=\"#6e4524\"/></linearGradient><linearGradient id=\"hiG\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fff0b0\"/><stop offset=\"1\" stop-color=\"#d9a12e\"/></linearGradient><linearGradient id=\"hiS\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#f4f7fa\"/><stop offset=\"1\" stop-color=\"#9aa4b1\"/></linearGradient><clipPath id=\"hiT3\"><path d=\"M0 0H512V414.4L0 336.5Z\"/></clipPath><clipPath id=\"hiU3\"><path d=\"M0 336.5L512 414.4V512H0Z\"/></clipPath><clipPath id=\"hiT4\"><path d=\"M0 0H512V387.2L0 409.1Z\"/></clipPath><clipPath id=\"hiU4\"><path d=\"M0 409.1L512 387.2V512H0Z\"/></clipPath><clipPath id=\"hiT5\"><path d=\"M0 0H512V325.5L0 397.4Z\"/></clipPath><clipPath id=\"hiU5\"><path d=\"M0 397.4L512 325.5V512H0Z\"/></clipPath><clipPath id=\"hiT6\"><path d=\"M0 0H512V397.7L0 397.7Z\"/></clipPath><clipPath id=\"hiU6\"><path d=\"M0 397.7L512 397.7V512H0Z\"/></clipPath><clipPath id=\"hiT7\"><path d=\"M0 0H512V433.9L0 444.8Z\"/></clipPath><clipPath id=\"hiU7\"><path d=\"M0 444.8L512 433.9V512H0Z\"/></clipPath><clipPath id=\"hiT8\"><path d=\"M0 0H512V429.6L0 481.9Z\"/></clipPath><clipPath id=\"hiU8\"><path d=\"M0 481.9L512 429.6V512H0Z\"/></clipPath></defs><g fill=\"none\" stroke=\"#3d2c19\" stroke-width=\"34\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M 462.9,19.1 C 453.2,19.1 445.7,26.7 445.7,36.3 C 445.7,45.9 453.3,53.5 462.9,53.5 C 472.4,53.5 480.0,45.9 480.0,36.3 C 480.0,26.7 472.4,19.1 462.9,19.1 Z\"/><path d=\"M 382.5,40.9 C 222.2,41.7 164.4,258.4 19.6,137.2 C 22.9,174.0 108.0,215.6 108.0,215.6 C 82.0,235.6 73.3,240.2 36.1,241.1 C 140.2,327.8 374.7,141.3 444.4,281.2 L 430.7,46.9 C 413.5,42.7 397.7,40.8 382.5,40.9 Z\"/><path d=\"M 453.4,70.9 L 473.5,494.9 L 492.2,494.0 L 472.0,71.0 C 465.7,72.5 459.4,72.5 453.4,70.9 L 453.4,70.9 Z\"/><path d=\"M 360.0,292.9 L 316.4,362.9 L 337.7,387.9 L 322.0,493.0 L 340.9,493.0 L 356.0,390.7 L 384.0,370.5 C 375.9,344.6 367.9,318.7 359.9,292.9 L 360.0,292.9 Z\"/><path d=\"M 203.3,310.7 L 174.5,380.5 L 195.0,400.7 L 197.2,492.9 L 215.8,492.9 L 213.7,399.9 L 233.2,380.0 L 203.2,310.7 L 203.3,310.7 Z\"/><path d=\"M 45.1,315.7 L 28.7,377.6 L 46.3,390.8 L 61.2,493.0 L 80.1,493.0 L 64.8,388.3 L 78.1,370.7 L 45.1,315.8 L 45.1,315.7 Z\"/><path d=\"M 131.1,323.1 L 102.9,380.6 L 118.0,397.6 L 111.3,492.9 L 130.0,492.9 L 136.8,397.6 L 152.7,383.4 L 131.1,323.1 Z\"/><path d=\"M 268.0,355.5 L 248.5,423.9 L 267.9,439.0 L 273.7,492.9 L 292.5,492.9 L 286.7,438.6 L 303.5,417.0 C 291.6,396.5 279.8,376.0 268.0,355.4 L 268.0,355.5 Z\"/><path d=\"M 411.6,355.6 L 392.7,424.2 L 413.0,439.7 L 419.2,493.0 L 438.0,493.0 L 431.6,437.8 L 447.6,416.9 L 411.6,355.6 Z\"/></g><path d=\"M 382.5,40.9 C 222.2,41.7 164.4,258.4 19.6,137.2 C 22.9,174.0 108.0,215.6 108.0,215.6 C 82.0,235.6 73.3,240.2 36.1,241.1 C 140.2,327.8 374.7,141.3 444.4,281.2 L 430.7,46.9 C 413.5,42.7 397.7,40.8 382.5,40.9 Z\" fill=\"url(#hiB)\"/><path d=\"M 453.4,70.9 L 473.5,494.9 L 492.2,494.0 L 472.0,71.0 C 465.7,72.5 459.4,72.5 453.4,70.9 L 453.4,70.9 Z\" fill=\"url(#hiW)\"/><path d=\"M 462.9,19.1 C 453.2,19.1 445.7,26.7 445.7,36.3 C 445.7,45.9 453.3,53.5 462.9,53.5 C 472.4,53.5 480.0,45.9 480.0,36.3 C 480.0,26.7 472.4,19.1 462.9,19.1 Z\" fill=\"url(#hiG)\"/><path d=\"M 360.0,292.9 L 316.4,362.9 L 337.7,387.9 L 322.0,493.0 L 340.9,493.0 L 356.0,390.7 L 384.0,370.5 C 375.9,344.6 367.9,318.7 359.9,292.9 L 360.0,292.9 Z\" fill=\"url(#hiW)\" clip-path=\"url(#hiU3)\"/><path d=\"M 360.0,292.9 L 316.4,362.9 L 337.7,387.9 L 322.0,493.0 L 340.9,493.0 L 356.0,390.7 L 384.0,370.5 C 375.9,344.6 367.9,318.7 359.9,292.9 L 360.0,292.9 Z\" fill=\"url(#hiS)\" clip-path=\"url(#hiT3)\"/><path d=\"M328.8 386.5L365.0 392.1\" stroke=\"#3d2c19\" stroke-width=\"17\" stroke-linecap=\"round\"/><path d=\"M 203.3,310.7 L 174.5,380.5 L 195.0,400.7 L 197.2,492.9 L 215.8,492.9 L 213.7,399.9 L 233.2,380.0 L 203.2,310.7 L 203.3,310.7 Z\" fill=\"url(#hiW)\" clip-path=\"url(#hiU4)\"/><path d=\"M 203.3,310.7 L 174.5,380.5 L 195.0,400.7 L 197.2,492.9 L 215.8,492.9 L 213.7,399.9 L 233.2,380.0 L 203.2,310.7 L 203.3,310.7 Z\" fill=\"url(#hiS)\" clip-path=\"url(#hiT4)\"/><path d=\"M186.0 401.2L222.7 399.6\" stroke=\"#3d2c19\" stroke-width=\"17\" stroke-linecap=\"round\"/><path d=\"M 45.1,315.7 L 28.7,377.6 L 46.3,390.8 L 61.2,493.0 L 80.1,493.0 L 64.8,388.3 L 78.1,370.7 L 45.1,315.8 L 45.1,315.7 Z\" fill=\"url(#hiW)\" clip-path=\"url(#hiU5)\"/><path d=\"M 45.1,315.7 L 28.7,377.6 L 46.3,390.8 L 61.2,493.0 L 80.1,493.0 L 64.8,388.3 L 78.1,370.7 L 45.1,315.8 L 45.1,315.7 Z\" fill=\"url(#hiS)\" clip-path=\"url(#hiT5)\"/><path d=\"M37.5 392.2L73.8 387.0\" stroke=\"#3d2c19\" stroke-width=\"17\" stroke-linecap=\"round\"/><path d=\"M 131.1,323.1 L 102.9,380.6 L 118.0,397.6 L 111.3,492.9 L 130.0,492.9 L 136.8,397.6 L 152.7,383.4 L 131.1,323.1 Z\" fill=\"url(#hiW)\" clip-path=\"url(#hiU6)\"/><path d=\"M 131.1,323.1 L 102.9,380.6 L 118.0,397.6 L 111.3,492.9 L 130.0,492.9 L 136.8,397.6 L 152.7,383.4 L 131.1,323.1 Z\" fill=\"url(#hiS)\" clip-path=\"url(#hiT6)\"/><path d=\"M109.0 397.7L145.8 397.7\" stroke=\"#3d2c19\" stroke-width=\"17\" stroke-linecap=\"round\"/><path d=\"M 268.0,355.5 L 248.5,423.9 L 267.9,439.0 L 273.7,492.9 L 292.5,492.9 L 286.7,438.6 L 303.5,417.0 C 291.6,396.5 279.8,376.0 268.0,355.4 L 268.0,355.5 Z\" fill=\"url(#hiW)\" clip-path=\"url(#hiU7)\"/><path d=\"M 268.0,355.5 L 248.5,423.9 L 267.9,439.0 L 273.7,492.9 L 292.5,492.9 L 286.7,438.6 L 303.5,417.0 C 291.6,396.5 279.8,376.0 268.0,355.4 L 268.0,355.5 Z\" fill=\"url(#hiS)\" clip-path=\"url(#hiT7)\"/><path d=\"M258.9 439.3L295.7 438.5\" stroke=\"#3d2c19\" stroke-width=\"17\" stroke-linecap=\"round\"/><path d=\"M 411.6,355.6 L 392.7,424.2 L 413.0,439.7 L 419.2,493.0 L 438.0,493.0 L 431.6,437.8 L 447.6,416.9 L 411.6,355.6 Z\" fill=\"url(#hiW)\" clip-path=\"url(#hiU8)\"/><path d=\"M 411.6,355.6 L 392.7,424.2 L 413.0,439.7 L 419.2,493.0 L 438.0,493.0 L 431.6,437.8 L 447.6,416.9 L 411.6,355.6 Z\" fill=\"url(#hiS)\" clip-path=\"url(#hiT8)\"/><path d=\"M404.0 440.6L440.6 436.9\" stroke=\"#3d2c19\" stroke-width=\"17\" stroke-linecap=\"round\"/></svg>","horse":"<svg viewBox=\"-22 0 512 512\"><defs><linearGradient id=\"hhC\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#c98a4e\"/><stop offset=\"1\" stop-color=\"#6b3f1d\"/></linearGradient><linearGradient id=\"hhM\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#7a5232\"/><stop offset=\"1\" stop-color=\"#3e2614\"/></linearGradient></defs><g fill=\"none\" stroke=\"#3d2c19\" stroke-width=\"34\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M 400.0,16.0 C 378.6,25.7 341.7,33.3 326.9,64.2 C 304.5,66.1 254.1,74.9 204.6,104.4 C 146.5,139.2 88.6,201.8 72.9,318.1 L 72.4,321.7 L 69.6,323.9 C 38.7,348.9 29.0,362.9 25.2,385.1 C 21.7,406.0 24.5,436.5 24.8,487.0 L 328.3,487.0 C 331.8,470.1 338.8,457.7 340.8,445.4 C 343.1,431.2 341.0,415.4 320.0,386.8 C 276.9,328.2 273.1,257.4 307.1,215.6 C 298.4,212.8 292.0,208.7 287.6,203.0 C 281.5,195.1 280.2,186.0 279.0,177.1 L 296.9,174.8 C 298.0,183.2 299.3,188.7 301.8,192.0 C 304.4,195.4 309.2,198.5 321.4,200.5 L 321.4,200.6 L 321.5,200.4 L 327.5,209.9 C 347.5,241.2 370.4,261.1 400.9,264.3 L 407.4,265.0 L 408.8,271.4 C 411.5,284.2 417.4,290.5 423.9,293.6 C 430.4,296.7 438.1,296.5 444.3,293.8 C 453.7,289.7 458.9,282.5 461.0,271.1 C 463.2,260.0 461.6,245.3 455.9,229.0 C 422.4,190.7 411.4,141.7 392.0,100.2 C 385.9,90.3 379.5,81.7 371.6,75.4 C 376.8,55.1 386.4,34.8 400.0,16.0 Z\"/><path d=\"M 214.0,34.9 C 179.5,35.0 146.0,43.0 96.0,58.5 C 127.1,68.5 166.3,77.4 182.0,97.5 C 186.5,94.5 190.9,91.7 195.4,89.0 C 235.9,64.8 275.8,53.7 303.6,48.9 C 267.8,39.5 240.6,34.8 214.0,34.9 L 214.0,34.9 Z\"/><path d=\"M 157.1,96.7 C 156.0,96.7 154.8,96.7 153.7,96.7 C 123.4,97.0 90.6,106.4 57.1,127.9 C 84.2,131.6 111.7,131.7 129.6,143.3 C 145.5,125.4 162.8,110.7 180.3,98.7 C 172.8,97.4 165.0,96.7 157.1,96.7 L 157.1,96.7 Z\"/><path d=\"M 129.0,144.0 C 92.6,145.5 60.1,150.5 24.3,168.8 C 57.5,175.9 75.2,182.3 89.3,202.6 C 100.8,180.1 114.4,160.7 129.0,144.0 L 129.0,144.0 Z\"/><path d=\"M 74.5,201.4 C 53.5,201.6 36.6,213.1 16.0,224.0 C 43.8,224.0 62.0,227.8 74.7,236.0 C 79.0,224.4 83.8,213.4 89.1,203.1 C 84.0,201.9 79.1,201.4 74.5,201.4 L 74.5,201.4 Z\"/><path d=\"M 73.8,238.2 C 55.9,244.1 38.4,245.4 19.6,260.5 C 37.2,265.2 54.4,270.1 61.0,282.5 C 64.5,266.8 68.8,252.0 73.8,238.2 L 73.8,238.2 Z\"/><path d=\"M 52.2,290.7 C 41.8,290.8 28.4,296.3 17.5,303.0 C 29.7,309.8 29.9,326.5 26.4,340.7 C 33.7,331.6 43.3,322.4 55.6,312.2 C 56.6,305.2 57.8,298.3 59.1,291.6 C 57.0,290.9 54.7,290.6 52.2,290.7 L 52.2,290.7 Z\"/></g><path d=\"M 400.0,16.0 C 378.6,25.7 341.7,33.3 326.9,64.2 C 304.5,66.1 254.1,74.9 204.6,104.4 C 146.5,139.2 88.6,201.8 72.9,318.1 L 72.4,321.7 L 69.6,323.9 C 38.7,348.9 29.0,362.9 25.2,385.1 C 21.7,406.0 24.5,436.5 24.8,487.0 L 328.3,487.0 C 331.8,470.1 338.8,457.7 340.8,445.4 C 343.1,431.2 341.0,415.4 320.0,386.8 C 276.9,328.2 273.1,257.4 307.1,215.6 C 298.4,212.8 292.0,208.7 287.6,203.0 C 281.5,195.1 280.2,186.0 279.0,177.1 L 296.9,174.8 C 298.0,183.2 299.3,188.7 301.8,192.0 C 304.4,195.4 309.2,198.5 321.4,200.5 L 321.4,200.6 L 321.5,200.4 L 327.5,209.9 C 347.5,241.2 370.4,261.1 400.9,264.3 L 407.4,265.0 L 408.8,271.4 C 411.5,284.2 417.4,290.5 423.9,293.6 C 430.4,296.7 438.1,296.5 444.3,293.8 C 453.7,289.7 458.9,282.5 461.0,271.1 C 463.2,260.0 461.6,245.3 455.9,229.0 C 422.4,190.7 411.4,141.7 392.0,100.2 C 385.9,90.3 379.5,81.7 371.6,75.4 C 376.8,55.1 386.4,34.8 400.0,16.0 Z\" fill=\"url(#hhC)\"/><path d=\"M 214.0,34.9 C 179.5,35.0 146.0,43.0 96.0,58.5 C 127.1,68.5 166.3,77.4 182.0,97.5 C 186.5,94.5 190.9,91.7 195.4,89.0 C 235.9,64.8 275.8,53.7 303.6,48.9 C 267.8,39.5 240.6,34.8 214.0,34.9 L 214.0,34.9 Z\" fill=\"url(#hhM)\"/><path d=\"M 157.1,96.7 C 156.0,96.7 154.8,96.7 153.7,96.7 C 123.4,97.0 90.6,106.4 57.1,127.9 C 84.2,131.6 111.7,131.7 129.6,143.3 C 145.5,125.4 162.8,110.7 180.3,98.7 C 172.8,97.4 165.0,96.7 157.1,96.7 L 157.1,96.7 Z\" fill=\"url(#hhM)\"/><path d=\"M 129.0,144.0 C 92.6,145.5 60.1,150.5 24.3,168.8 C 57.5,175.9 75.2,182.3 89.3,202.6 C 100.8,180.1 114.4,160.7 129.0,144.0 L 129.0,144.0 Z\" fill=\"url(#hhM)\"/><path d=\"M 74.5,201.4 C 53.5,201.6 36.6,213.1 16.0,224.0 C 43.8,224.0 62.0,227.8 74.7,236.0 C 79.0,224.4 83.8,213.4 89.1,203.1 C 84.0,201.9 79.1,201.4 74.5,201.4 L 74.5,201.4 Z\" fill=\"url(#hhM)\"/><path d=\"M 73.8,238.2 C 55.9,244.1 38.4,245.4 19.6,260.5 C 37.2,265.2 54.4,270.1 61.0,282.5 C 64.5,266.8 68.8,252.0 73.8,238.2 L 73.8,238.2 Z\" fill=\"url(#hhM)\"/><path d=\"M 52.2,290.7 C 41.8,290.8 28.4,296.3 17.5,303.0 C 29.7,309.8 29.9,326.5 26.4,340.7 C 33.7,331.6 43.3,322.4 55.6,312.2 C 56.6,305.2 57.8,298.3 59.1,291.6 C 57.0,290.9 54.7,290.6 52.2,290.7 L 52.2,290.7 Z\" fill=\"url(#hhM)\"/><path d=\"M 368.0,128.0 A 13.2,13.2 0.0 0,1 381.2,141.2 A 13.2,13.2 0.0 0,1 368.0,154.4 A 13.2,13.2 0.0 0,1 354.7,141.2 A 13.2,13.2 0.0 0,1 368.0,128.0 Z\" fill=\"#1e1209\"/><path d=\"M 444.0,246.8 C 445.6,246.8 447.2,246.8 448.8,247.0 L 447.1,264.9 C 443.2,264.6 441.6,265.3 441.6,265.4 C 441.5,265.4 440.5,266.0 440.9,271.3 L 423.0,272.6 C 422.3,264.3 424.3,256.4 429.9,251.6 C 434.2,248.0 439.1,246.9 444.0,246.8 L 444.0,246.8 Z\" fill=\"#2a170b\"/></svg>","twin":"<svg viewBox=\"0 0 512 512\"><defs><linearGradient id=\"hrtS\" x1=\"1\" y1=\"0\" x2=\"0\" y2=\"0\"><stop offset=\"0\" stop-color=\"#f2f5f8\"/><stop offset=\"1\" stop-color=\"#8c96a3\"/></linearGradient><linearGradient id=\"hrtW\" x1=\"1\" y1=\"0\" x2=\"0\" y2=\"0\"><stop offset=\"0\" stop-color=\"#c58a52\"/><stop offset=\"1\" stop-color=\"#6b4020\"/></linearGradient></defs><g transform=\"rotate(-90 256 256)\"><g fill=\"none\" stroke=\"#3d2c19\" stroke-width=\"34\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M 414.834,18.08 C 385.457,18.229999999999997 355.822,34.68 341.67,76.94999999999999 C 322.91200000000003,132.97799999999998 409.077,214.73399999999998 375.24,298.15599999999995 L 423.45500000000004,340.02599999999995 C 459.10100000000006,247.07199999999995 371.40700000000004,139.62599999999995 389.25500000000005,88.58599999999996 C 401.61500000000007,53.235999999999954 424.927,50.375999999999955 445.30500000000006,62.14599999999996 C 465.24700000000007,73.65599999999996 475.71100000000007,92.80999999999996 463.27900000000005,117.13599999999997 C 496.32200000000006,104.51599999999996 500.53400000000005,65.69199999999996 472.79900000000004,39.938999999999965 C 468.83900000000006,36.258999999999965 463.77900000000005,32.922999999999966 458.52200000000005,29.888999999999964 C 445.53800000000007,22.392999999999965 430.22200000000004,17.998999999999963 414.83200000000005,18.078999999999965 L 414.834,18.08 Z\"/><path d=\"M 334.064,50.089999999999996 L 65.937,62.16 L 53.417,330.414 C 59.767,326.99199999999996 66.181,324.058 72.545,321.449 L 83.81,80.063 L 324.14,69.243 C 327.05,62.425999999999995 330.40999999999997,56.06699999999999 334.06399999999996,50.089 L 334.064,50.089999999999996 Z\"/><path d=\"M 104.686,87.955 L 429.078,417.995 C 424.738,422.461 420.19399999999996,426.725 415.45799999999997,430.795 L 91.132,100.825 L 90.864,101.092 L 389.03,450.41 C 374.164,459.97 358.03,468.25 340.90799999999996,475.53000000000003 L 456.948,494.94000000000005 L 449.93,450.75200000000007 L 494.117,457.77200000000005 L 474.71,341.73 C 468.96999999999997,359.49800000000005 461.28499999999997,375.333 451.957,389.533 L 104.687,87.955 L 104.686,87.955 Z\"/><path d=\"M 98.078,336.495 C 97.21600000000001,336.483 96.36,336.488 95.50800000000001,336.51 C 89.92800000000001,336.65 84.55300000000001,337.496 79.40200000000002,339.21999999999997 C 14.994000000000014,360.784 10.53400000000002,418.303 32.34200000000001,456.07399999999996 C 56.60200000000002,498.1039999999999 105.16600000000001,498.59099999999995 119.58600000000001,460.83399999999995 C 95.25600000000001,473.26399999999995 76.11200000000002,462.792 64.596,442.8539999999999 C 52.833000000000006,422.47599999999994 55.68600000000001,399.16399999999993 91.031,386.8089999999999 C 141.208,369.2609999999999 245.995,453.5819999999999 339.39700000000005,421.04599999999994 L 298.64000000000004,373.29599999999994 C 225.32400000000004,400.76399999999995 152.36500000000004,337.18299999999994 98.07800000000003,336.49299999999994 L 98.078,336.495 Z\"/></g><path d=\"M 414.834,18.08 C 385.457,18.229999999999997 355.822,34.68 341.67,76.94999999999999 C 322.91200000000003,132.97799999999998 409.077,214.73399999999998 375.24,298.15599999999995 L 423.45500000000004,340.02599999999995 C 459.10100000000006,247.07199999999995 371.40700000000004,139.62599999999995 389.25500000000005,88.58599999999996 C 401.61500000000007,53.235999999999954 424.927,50.375999999999955 445.30500000000006,62.14599999999996 C 465.24700000000007,73.65599999999996 475.71100000000007,92.80999999999996 463.27900000000005,117.13599999999997 C 496.32200000000006,104.51599999999996 500.53400000000005,65.69199999999996 472.79900000000004,39.938999999999965 C 468.83900000000006,36.258999999999965 463.77900000000005,32.922999999999966 458.52200000000005,29.888999999999964 C 445.53800000000007,22.392999999999965 430.22200000000004,17.998999999999963 414.83200000000005,18.078999999999965 L 414.834,18.08\" fill=\"url(#hrtW)\"/><path d=\"M 334.064,50.089999999999996 L 65.937,62.16 L 53.417,330.414 C 59.767,326.99199999999996 66.181,324.058 72.545,321.449 L 83.81,80.063 L 324.14,69.243 C 327.05,62.425999999999995 330.40999999999997,56.06699999999999 334.06399999999996,50.089 L 334.064,50.089999999999996\" fill=\"#efe3c4\"/><path d=\"M 104.686,87.955 L 429.078,417.995 C 424.738,422.461 420.19399999999996,426.725 415.45799999999997,430.795 L 91.132,100.825 L 90.864,101.092 L 389.03,450.41 C 374.164,459.97 358.03,468.25 340.90799999999996,475.53000000000003 L 456.948,494.94000000000005 L 449.93,450.75200000000007 L 494.117,457.77200000000005 L 474.71,341.73 C 468.96999999999997,359.49800000000005 461.28499999999997,375.333 451.957,389.533 L 104.687,87.955 L 104.686,87.955\" fill=\"url(#hrtS)\"/><path d=\"M 98.078,336.495 C 97.21600000000001,336.483 96.36,336.488 95.50800000000001,336.51 C 89.92800000000001,336.65 84.55300000000001,337.496 79.40200000000002,339.21999999999997 C 14.994000000000014,360.784 10.53400000000002,418.303 32.34200000000001,456.07399999999996 C 56.60200000000002,498.1039999999999 105.16600000000001,498.59099999999995 119.58600000000001,460.83399999999995 C 95.25600000000001,473.26399999999995 76.11200000000002,462.792 64.596,442.8539999999999 C 52.833000000000006,422.47599999999994 55.68600000000001,399.16399999999993 91.031,386.8089999999999 C 141.208,369.2609999999999 245.995,453.5819999999999 339.39700000000005,421.04599999999994 L 298.64000000000004,373.29599999999994 C 225.32400000000004,400.76399999999995 152.36500000000004,337.18299999999994 98.07800000000003,336.49299999999994 L 98.078,336.495\" fill=\"url(#hrtW)\"/></g></svg>","eye":"<svg viewBox=\"0 0 512 512\"><defs><linearGradient id=\"hreE\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fbf6e8\"/><stop offset=\"1\" stop-color=\"#c9b994\"/></linearGradient><linearGradient id=\"hreG\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fff3b8\"/><stop offset=\"1\" stop-color=\"#e09424\"/></linearGradient><clipPath id=\"hreK\"><rect x=\"352\" y=\"80\" width=\"160\" height=\"180\"/></clipPath></defs><g fill=\"none\" stroke=\"#3d2c19\" stroke-width=\"34\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M 242.9,20.46 C 249.6,40.21 262.6,61.85 246.9,70.9 C 208.3,92.94 165.5,112.4 140.7,161.60000000000002 C 103.3,235.7 91.69,412.0 29.81,451.0 C 78.41,454.8 119.5,434.7 138.7,406.8 C 145.79999999999998,441.1 171.29999999999998,473.8 201.7,491.5 C 196.5,462.5 199.89999999999998,432.1 220.7,399.0 C 237.2,421.9 251.79999999999998,458.3 294.5,474.3 C 278.1,446.8 280.8,421.5 283.8,390.1 C 292.6,417.0 322.3,440.1 356.70000000000005,449.0 C 339.90000000000003,430.4 332.80000000000007,403.5 335.70000000000005,383.0 C 350.30000000000007,407.9 379.1,421.4 402.80000000000007,422.7 C 249.50000000000006,243.1 354.1000000000001,131.09999999999997 482.20000000000005,228.29999999999998 C 481.70000000000005,178.59999999999997 450.80000000000007,161.59999999999997 415.00000000000006,132.59999999999997 C 414.1000000000001,117.19999999999996 405.40000000000003,103.29999999999997 397.50000000000006,89.23999999999997 C 343.80000000000007,79.24999999999997 276.00000000000006,47.22999999999997 242.90000000000006,20.459999999999965 L 242.9,20.46 Z\"/><path d=\"M 324.1,95.34 C 350.20000000000005,106.2 370.3,117.9 380.5,130.8 C 363.9,127.20000000000002 340.7,127.30000000000001 310.5,129.70000000000002 C 325.5,120.00000000000001 327.0,108.00000000000001 324.1,95.34000000000002 L 324.1,95.34 Z\"/></g><path d=\"M 242.9,20.46 C 249.6,40.21 262.6,61.85 246.9,70.9 C 208.3,92.94 165.5,112.4 140.7,161.60000000000002 C 103.3,235.7 91.69,412.0 29.81,451.0 C 78.41,454.8 119.5,434.7 138.7,406.8 C 145.79999999999998,441.1 171.29999999999998,473.8 201.7,491.5 C 196.5,462.5 199.89999999999998,432.1 220.7,399.0 C 237.2,421.9 251.79999999999998,458.3 294.5,474.3 C 278.1,446.8 280.8,421.5 283.8,390.1 C 292.6,417.0 322.3,440.1 356.70000000000005,449.0 C 339.90000000000003,430.4 332.80000000000007,403.5 335.70000000000005,383.0 C 350.30000000000007,407.9 379.1,421.4 402.80000000000007,422.7 C 249.50000000000006,243.1 354.1000000000001,131.09999999999997 482.20000000000005,228.29999999999998 C 481.70000000000005,178.59999999999997 450.80000000000007,161.59999999999997 415.00000000000006,132.59999999999997 C 414.1000000000001,117.19999999999996 405.40000000000003,103.29999999999997 397.50000000000006,89.23999999999997 C 343.80000000000007,79.24999999999997 276.00000000000006,47.22999999999997 242.90000000000006,20.459999999999965 L 242.9,20.46\" fill=\"url(#hreE)\"/><path d=\"M 324.1,95.34 C 350.20000000000005,106.2 370.3,117.9 380.5,130.8 C 363.9,127.20000000000002 340.7,127.30000000000001 310.5,129.70000000000002 C 325.5,120.00000000000001 327.0,108.00000000000001 324.1,95.34000000000002 L 324.1,95.34\" fill=\"#3d2c19\"/><path d=\"M 242.9,20.46 C 249.6,40.21 262.6,61.85 246.9,70.9 C 208.3,92.94 165.5,112.4 140.7,161.60000000000002 C 103.3,235.7 91.69,412.0 29.81,451.0 C 78.41,454.8 119.5,434.7 138.7,406.8 C 145.79999999999998,441.1 171.29999999999998,473.8 201.7,491.5 C 196.5,462.5 199.89999999999998,432.1 220.7,399.0 C 237.2,421.9 251.79999999999998,458.3 294.5,474.3 C 278.1,446.8 280.8,421.5 283.8,390.1 C 292.6,417.0 322.3,440.1 356.70000000000005,449.0 C 339.90000000000003,430.4 332.80000000000007,403.5 335.70000000000005,383.0 C 350.30000000000007,407.9 379.1,421.4 402.80000000000007,422.7 C 249.50000000000006,243.1 354.1000000000001,131.09999999999997 482.20000000000005,228.29999999999998 C 481.70000000000005,178.59999999999997 450.80000000000007,161.59999999999997 415.00000000000006,132.59999999999997 C 414.1000000000001,117.19999999999996 405.40000000000003,103.29999999999997 397.50000000000006,89.23999999999997 C 343.80000000000007,79.24999999999997 276.00000000000006,47.22999999999997 242.90000000000006,20.459999999999965 L 242.9,20.46\" fill=\"url(#hreG)\" clip-path=\"url(#hreK)\"/><path d=\"M 324.1,95.34 C 350.20000000000005,106.2 370.3,117.9 380.5,130.8 C 363.9,127.20000000000002 340.7,127.30000000000001 310.5,129.70000000000002 C 325.5,120.00000000000001 327.0,108.00000000000001 324.1,95.34000000000002 L 324.1,95.34\" fill=\"#3d2c19\"/></svg>","sweep":"<svg viewBox=\"0 0 512 512\"><defs><linearGradient id=\"hcsC\" x1=\"1\" y1=\"0\" x2=\"0\" y2=\"0\"><stop offset=\"0\" stop-color=\"#fff8e0\"/><stop offset=\"1\" stop-color=\"#e8c870\"/></linearGradient><linearGradient id=\"hcsG\" x1=\"1\" y1=\"0\" x2=\"0\" y2=\"0\"><stop offset=\"0\" stop-color=\"#fff3b8\"/><stop offset=\"1\" stop-color=\"#e09424\"/></linearGradient><linearGradient id=\"hcsS\" x1=\"1\" y1=\"0\" x2=\"0\" y2=\"0\"><stop offset=\"0\" stop-color=\"#f2f5f8\"/><stop offset=\"1\" stop-color=\"#8c96a3\"/></linearGradient><clipPath id=\"hcsK\"><polygon points=\"0,0 330,0 0,330\"/></clipPath></defs><g transform=\"rotate(-90 256 256)\"><g fill=\"none\" stroke=\"#3d2c19\" stroke-width=\"34\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M 256.438,19.375 C 208.72799999999998,19.375 161.016,33.785 120.344,62.595 C 133.36599999999999,77.685 146.658,92.722 159.5,107.063 C 175.538,95.381 191.982,88.206 208.188,84.781 L 218.063,74.90700000000001 L 224.688,68.28200000000001 L 231.28099999999998,74.90800000000002 L 239.00099999999998,82.62800000000001 C 317.736,88.27200000000002 379.54099999999994,177.76100000000002 340.407,258.158 L 458.907,376.658 C 513.354,285.985 501.49699999999996,166.77800000000002 423.282,88.56400000000002 C 377.17,42.45 316.806,19.376 256.44,19.376 L 256.438,19.375 Z\"/><path d=\"M 66.5,27.063 L 29.53,64.03 C 67.48,93.864 109.682,129.936 144.53,160.875 L 151.937,167.469 L 144.937,174.469 L 97.56200000000001,221.843 L 117.25,241.5 L 151.75,207.0 L 419.875,475.156 L 497.219,494.43600000000004 L 475.374,419.65600000000006 L 448.39700000000005,392.67800000000005 L 448.43700000000007,392.62500000000006 L 330.68700000000007,274.87500000000006 L 330.6550000000001,274.9200000000001 L 207.25,151.5 L 244.344,114.406 L 224.688,94.75 L 178.218,141.188 L 171.25,148.125 L 164.687,140.845 C 133.5,106.334 96.644,64.837 66.5,27.062 L 66.5,27.063 Z\"/><path d=\"M 65.22,117.125 C -1.735,209.41 6.38,339.035 89.593,422.25 C 142.523,475.18 214.226,497.698 283.15500000000003,489.875 C 151.65500000000003,490.872 36.35100000000003,361.312 76.03000000000003,226.719 L 71.15600000000003,221.843 L 77.75000000000003,215.218 L 81.00000000000003,211.968 C 88.02800000000003,193.456 98.07600000000002,174.951 111.50000000000003,156.748 C 96.63000000000002,143.756 80.95000000000003,130.315 65.22000000000003,117.12299999999999 L 65.22,117.125 Z\"/><path d=\"M 185.594,163.155 C 197.87699999999998,163.155 207.814,173.123 207.814,185.405 C 207.814,187.629 207.482,189.755 206.874,191.781 L 443.81399999999996,428.751 L 430.62399999999997,441.93899999999996 L 194.47,205.813 C 191.75,206.998 188.75,207.65599999999998 185.594,207.65599999999998 C 173.31,207.65599999999998 163.344,197.69199999999998 163.344,185.40599999999998 C 163.344,173.12099999999998 173.31,163.15599999999998 185.594,163.15599999999998 L 185.594,163.155 Z\"/></g><path d=\"M 256.438,19.375 C 208.72799999999998,19.375 161.016,33.785 120.344,62.595 C 133.36599999999999,77.685 146.658,92.722 159.5,107.063 C 175.538,95.381 191.982,88.206 208.188,84.781 L 218.063,74.90700000000001 L 224.688,68.28200000000001 L 231.28099999999998,74.90800000000002 L 239.00099999999998,82.62800000000001 C 317.736,88.27200000000002 379.54099999999994,177.76100000000002 340.407,258.158 L 458.907,376.658 C 513.354,285.985 501.49699999999996,166.77800000000002 423.282,88.56400000000002 C 377.17,42.45 316.806,19.376 256.44,19.376 L 256.438,19.375\" fill=\"url(#hcsC)\"/><path d=\"M 66.5,27.063 L 29.53,64.03 C 67.48,93.864 109.682,129.936 144.53,160.875 L 151.937,167.469 L 144.937,174.469 L 97.56200000000001,221.843 L 117.25,241.5 L 151.75,207.0 L 419.875,475.156 L 497.219,494.43600000000004 L 475.374,419.65600000000006 L 448.39700000000005,392.67800000000005 L 448.43700000000007,392.62500000000006 L 330.68700000000007,274.87500000000006 L 330.6550000000001,274.9200000000001 L 207.25,151.5 L 244.344,114.406 L 224.688,94.75 L 178.218,141.188 L 171.25,148.125 L 164.687,140.845 C 133.5,106.334 96.644,64.837 66.5,27.062 L 66.5,27.063\" fill=\"url(#hcsS)\"/><path d=\"M 65.22,117.125 C -1.735,209.41 6.38,339.035 89.593,422.25 C 142.523,475.18 214.226,497.698 283.15500000000003,489.875 C 151.65500000000003,490.872 36.35100000000003,361.312 76.03000000000003,226.719 L 71.15600000000003,221.843 L 77.75000000000003,215.218 L 81.00000000000003,211.968 C 88.02800000000003,193.456 98.07600000000002,174.951 111.50000000000003,156.748 C 96.63000000000002,143.756 80.95000000000003,130.315 65.22000000000003,117.12299999999999 L 65.22,117.125\" fill=\"url(#hcsC)\"/><path d=\"M 185.594,163.155 C 197.87699999999998,163.155 207.814,173.123 207.814,185.405 C 207.814,187.629 207.482,189.755 206.874,191.781 L 443.81399999999996,428.751 L 430.62399999999997,441.93899999999996 L 194.47,205.813 C 191.75,206.998 188.75,207.65599999999998 185.594,207.65599999999998 C 173.31,207.65599999999998 163.344,197.69199999999998 163.344,185.40599999999998 C 163.344,173.12099999999998 173.31,163.15599999999998 185.594,163.15599999999998 L 185.594,163.155\" fill=\"#7d8796\"/><path d=\"M 66.5,27.063 L 29.53,64.03 C 67.48,93.864 109.682,129.936 144.53,160.875 L 151.937,167.469 L 144.937,174.469 L 97.56200000000001,221.843 L 117.25,241.5 L 151.75,207.0 L 419.875,475.156 L 497.219,494.43600000000004 L 475.374,419.65600000000006 L 448.39700000000005,392.67800000000005 L 448.43700000000007,392.62500000000006 L 330.68700000000007,274.87500000000006 L 330.6550000000001,274.9200000000001 L 207.25,151.5 L 244.344,114.406 L 224.688,94.75 L 178.218,141.188 L 171.25,148.125 L 164.687,140.845 C 133.5,106.334 96.644,64.837 66.5,27.062 L 66.5,27.063\" fill=\"url(#hcsG)\" clip-path=\"url(#hcsK)\"/></g></svg>","wind":"<svg viewBox=\"0 0 512 512\"><defs><linearGradient id=\"hcw2B\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#9cc5ff\"/><stop offset=\"1\" stop-color=\"#2f5faf\"/></linearGradient><linearGradient id=\"hcw2G\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fff3b8\"/><stop offset=\"1\" stop-color=\"#e09424\"/></linearGradient><linearGradient id=\"hcw2R\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ff7a6a\"/><stop offset=\"1\" stop-color=\"#b0201a\"/></linearGradient></defs><g fill=\"none\" stroke=\"#3d2c19\" stroke-width=\"34\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M 256.0,32.0 C 192.0,80.0 128.0,96.0 32.0,128.0 C 32.0,256.0 192.0,448.0 256.0,496.0 C 320.0,448.0 480.0,256.0 480.0,128.0 C 384.0,96.0 320.0,80.0 256.0,32.0 Z\"/><path d=\"M 256.0,66.75 L 261.4,70.8 C 311.09999999999997,108.1 361.0,120.69999999999999 438.09999999999997,146.39999999999998 L 444.29999999999995,148.39999999999998 L 444.29999999999995,154.89999999999998 C 444.29999999999995,209.89999999999998 411.19999999999993,274.59999999999997 372.29999999999995,331.29999999999995 C 333.4,388.09999999999997 288.69999999999993,436.29999999999995 261.4,456.79999999999995 L 255.99999999999997,460.9 L 250.59999999999997,456.79999999999995 C 223.29999999999995,436.29999999999995 178.59999999999997,388.09999999999997 139.69999999999996,331.29999999999995 C 100.79999999999995,274.59999999999997 67.69999999999996,209.89999999999995 67.69999999999996,154.89999999999995 L 67.69999999999996,148.39999999999995 L 73.84999999999997,146.39999999999995 C 150.9,120.7 200.9,108.0 250.6,70.8 L 256.0,66.75 Z\"/><path d=\"M 256.0,88.93 C 206.6,124.30000000000001 156.2,138.10000000000002 85.94999999999999,161.3 C 88.52999999999999,208.0 118.29999999999998,268.3 154.6,321.20000000000005 C 189.89999999999998,372.70000000000005 231.2,417.50000000000006 256.0,438.00000000000006 C 280.8,417.50000000000006 322.1,372.70000000000005 357.4,321.20000000000005 C 393.7,268.30000000000007 423.5,208.00000000000006 426.0,161.30000000000004 C 355.7,138.10000000000005 305.4,124.30000000000004 256.0,88.93000000000004 L 256.0,88.93 Z\"/><path d=\"M 210.5,143.9 C 230.2,144.4 248.6,158.3 256.0,192.0 C 274.0,105.7 366.0,149.5 366.0,214.5 C 365.0,278.4 274.0,322.2 256.0,376.6 C 237.0,322.20000000000005 148.0,278.40000000000003 146.0,214.50000000000003 C 146.0,174.90000000000003 179.8,143.20000000000005 210.5,143.90000000000003 L 210.5,143.9 Z\"/></g><path d=\"M 256.0,32.0 C 192.0,80.0 128.0,96.0 32.0,128.0 C 32.0,256.0 192.0,448.0 256.0,496.0 C 320.0,448.0 480.0,256.0 480.0,128.0 C 384.0,96.0 320.0,80.0 256.0,32.0\" fill=\"url(#hcw2G)\"/><path d=\"M 256.0,66.75 L 261.4,70.8 C 311.09999999999997,108.1 361.0,120.69999999999999 438.09999999999997,146.39999999999998 L 444.29999999999995,148.39999999999998 L 444.29999999999995,154.89999999999998 C 444.29999999999995,209.89999999999998 411.19999999999993,274.59999999999997 372.29999999999995,331.29999999999995 C 333.4,388.09999999999997 288.69999999999993,436.29999999999995 261.4,456.79999999999995 L 255.99999999999997,460.9 L 250.59999999999997,456.79999999999995 C 223.29999999999995,436.29999999999995 178.59999999999997,388.09999999999997 139.69999999999996,331.29999999999995 C 100.79999999999995,274.59999999999997 67.69999999999996,209.89999999999995 67.69999999999996,154.89999999999995 L 67.69999999999996,148.39999999999995 L 73.84999999999997,146.39999999999995 C 150.9,120.7 200.9,108.0 250.6,70.8 L 256.0,66.75\" fill=\"#3d2c19\"/><path d=\"M 256.0,88.93 C 206.6,124.30000000000001 156.2,138.10000000000002 85.94999999999999,161.3 C 88.52999999999999,208.0 118.29999999999998,268.3 154.6,321.20000000000005 C 189.89999999999998,372.70000000000005 231.2,417.50000000000006 256.0,438.00000000000006 C 280.8,417.50000000000006 322.1,372.70000000000005 357.4,321.20000000000005 C 393.7,268.30000000000007 423.5,208.00000000000006 426.0,161.30000000000004 C 355.7,138.10000000000005 305.4,124.30000000000004 256.0,88.93000000000004 L 256.0,88.93\" fill=\"url(#hcw2B)\"/><path d=\"M 210.5,143.9 C 230.2,144.4 248.6,158.3 256.0,192.0 C 274.0,105.7 366.0,149.5 366.0,214.5 C 365.0,278.4 274.0,322.2 256.0,376.6 C 237.0,322.20000000000005 148.0,278.40000000000003 146.0,214.50000000000003 C 146.0,174.90000000000003 179.8,143.20000000000005 210.5,143.90000000000003 L 210.5,143.9\" fill=\"url(#hcw2R)\"/></svg>","quick":"<svg viewBox=\"0 0 512 512\"><defs><linearGradient id=\"hrqE\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fbf6e8\"/><stop offset=\"1\" stop-color=\"#c9b994\"/></linearGradient><linearGradient id=\"hrqW\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#c58a52\"/><stop offset=\"1\" stop-color=\"#6b4020\"/></linearGradient></defs><g fill=\"none\" stroke=\"#3d2c19\" stroke-width=\"34\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M 182.938,17.75 L 153.313,129.75 L 89.09299999999999,65.437 L 70.87499999999999,83.657 L 480.78,494.124 L 492.594,494.124 L 492.594,469.5 L 264.72,241.28 L 294.34400000000005,129.156 L 276.8140000000001,111.626 L 260.03100000000006,149.094 L 259.72100000000006,94.53099999999999 L 236.15700000000007,70.97099999999999 L 224.03200000000007,90.72099999999999 L 221.68900000000008,56.50099999999999 L 182.93900000000008,17.75099999999999 L 182.938,17.75 Z\"/><path d=\"M 419.875,81.0 L 402.312,147.47 L 366.906,112.063 L 352.031,127.21900000000001 L 492.595,267.812 L 492.595,237.75 L 472.22,217.375 L 489.812,150.937 L 419.875,81.0 Z\"/><path d=\"M 114.72,154.0 L 21.906000000000006,178.53 L 38.656000000000006,195.28 L 89.626,194.28 L 52.43600000000001,209.062 L 91.876,248.5 L 124.781,250.53 L 111.90700000000001,259.437 L 132.595,260.719 L 115.751,272.37399999999997 L 133.345,289.96799999999996 L 226.0,265.436 L 114.72,154.0 Z\"/><path d=\"M 367.656,169.28 L 318.68600000000004,182.22 L 344.34400000000005,207.875 L 376.21900000000005,210.031 L 357.81100000000004,221.345 L 388.593,252.125 L 437.563,239.189 L 367.655,169.28199999999998 L 367.656,169.28 Z\"/><path d=\"M 122.78,316.313 L 105.22,382.71999999999997 L 69.875,347.25 L 54.562,362.563 L 186.156,494.125 L 216.25,494.125 L 175.094,452.812 L 192.688,386.219 L 178.78099999999998,372.311 L 166.688,392.09299999999996 L 164.345,357.87299999999993 L 122.782,316.3109999999999 L 122.78,316.313 Z\"/><path d=\"M 311.687,367.907 L 300.844,408.96999999999997 L 277.344,385.46999999999997 L 264.12399999999997,398.68699999999995 L 287.49999999999994,422.03099999999995 L 246.77999999999994,432.81399999999996 L 291.59399999999994,477.626 L 332.31399999999996,466.846 L 360.31199999999995,494.846 L 386.71899999999994,494.846 L 345.6239999999999,453.751 L 356.4679999999999,412.721 L 337.3099999999999,393.531 L 328.7479999999999,401.281 L 325.4039999999999,381.657 L 311.68399999999986,367.907 L 311.687,367.907 Z\"/><path d=\"M 70.25,404.656 L 21.562,417.5 L 75.562,471.5 L 109.656,471.5 L 93.126,487.0 L 140.156,474.562 L 70.25,404.656 Z\"/></g><path d=\"M 182.938,17.75 L 153.313,129.75 L 89.09299999999999,65.437 L 70.87499999999999,83.657 L 480.78,494.124 L 492.594,494.124 L 492.594,469.5 L 264.72,241.28 L 294.34400000000005,129.156 L 276.8140000000001,111.626 L 260.03100000000006,149.094 L 259.72100000000006,94.53099999999999 L 236.15700000000007,70.97099999999999 L 224.03200000000007,90.72099999999999 L 221.68900000000008,56.50099999999999 L 182.93900000000008,17.75099999999999 L 182.938,17.75\" fill=\"url(#hrqE)\"/><path d=\"M 419.875,81.0 L 402.312,147.47 L 366.906,112.063 L 352.031,127.21900000000001 L 492.595,267.812 L 492.595,237.75 L 472.22,217.375 L 489.812,150.937 L 419.875,81.0\" fill=\"url(#hrqE)\"/><path d=\"M 114.72,154.0 L 21.906000000000006,178.53 L 38.656000000000006,195.28 L 89.626,194.28 L 52.43600000000001,209.062 L 91.876,248.5 L 124.781,250.53 L 111.90700000000001,259.437 L 132.595,260.719 L 115.751,272.37399999999997 L 133.345,289.96799999999996 L 226.0,265.436 L 114.72,154.0\" fill=\"url(#hrqE)\"/><path d=\"M 367.656,169.28 L 318.68600000000004,182.22 L 344.34400000000005,207.875 L 376.21900000000005,210.031 L 357.81100000000004,221.345 L 388.593,252.125 L 437.563,239.189 L 367.655,169.28199999999998 L 367.656,169.28\" fill=\"url(#hrqE)\"/><path d=\"M 122.78,316.313 L 105.22,382.71999999999997 L 69.875,347.25 L 54.562,362.563 L 186.156,494.125 L 216.25,494.125 L 175.094,452.812 L 192.688,386.219 L 178.78099999999998,372.311 L 166.688,392.09299999999996 L 164.345,357.87299999999993 L 122.782,316.3109999999999 L 122.78,316.313\" fill=\"url(#hrqE)\"/><path d=\"M 311.687,367.907 L 300.844,408.96999999999997 L 277.344,385.46999999999997 L 264.12399999999997,398.68699999999995 L 287.49999999999994,422.03099999999995 L 246.77999999999994,432.81399999999996 L 291.59399999999994,477.626 L 332.31399999999996,466.846 L 360.31199999999995,494.846 L 386.71899999999994,494.846 L 345.6239999999999,453.751 L 356.4679999999999,412.721 L 337.3099999999999,393.531 L 328.7479999999999,401.281 L 325.4039999999999,381.657 L 311.68399999999986,367.907 L 311.687,367.907\" fill=\"url(#hrqE)\"/><path d=\"M 70.25,404.656 L 21.562,417.5 L 75.562,471.5 L 109.656,471.5 L 93.126,487.0 L 140.156,474.562 L 70.25,404.656\" fill=\"url(#hrqE)\"/><polygon points=\"89.1,65.4 70.9,83.7 480.8,494.1 492.6,494.1 492.6,469.5\" fill=\"url(#hrqW)\"/><polygon points=\"366.9,112.1 352,127.2 492.6,267.8 492.6,237.8\" fill=\"url(#hrqW)\"/><polygon points=\"69.9,347.2 54.6,362.6 186.2,494.1 216.2,494.1\" fill=\"url(#hrqW)\"/><polygon points=\"277.3,385.5 264.1,398.7 360.3,494.8 386.7,494.8\" fill=\"url(#hrqW)\"/></svg>","flurry":"<svg viewBox=\"0 0 512 512\"><defs><linearGradient id=\"hflG\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fff3b8\"/><stop offset=\"1\" stop-color=\"#e09424\"/></linearGradient></defs><path d=\"M 174.844,14.875 C 221.944,57.15 252.968,105.225 270.156,152.938 C 200.613,126.285 119.028,114.165 32.0,129.155 C 128.11,120.718 212.524,142.155 277.625,176.875 C 320.65999999999997,338.655 207.16500000000002,484.227 26.655,369.03 C 139.325,464.907 228.13,470.847 281.595,429.938 C 589.072,507.478 520.498,273.83799999999997 308.96900000000005,169.844 C 283.083,114.03899999999999 239.22900000000004,59.14999999999999 174.84300000000005,14.873999999999995 L 174.844,14.875 Z M 323.0,205.345 C 446.38599999999997,296.095 462.423,432.96799999999996 284.344,427.781 C 336.51,385.317 353.196,296.868 323.0,205.345 Z\" fill=\"none\" stroke=\"#3d2c19\" stroke-width=\"34\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M 174.844,14.875 C 221.944,57.15 252.968,105.225 270.156,152.938 C 200.613,126.285 119.028,114.165 32.0,129.155 C 128.11,120.718 212.524,142.155 277.625,176.875 C 320.65999999999997,338.655 207.16500000000002,484.227 26.655,369.03 C 139.325,464.907 228.13,470.847 281.595,429.938 C 589.072,507.478 520.498,273.83799999999997 308.96900000000005,169.844 C 283.083,114.03899999999999 239.22900000000004,59.14999999999999 174.84300000000005,14.873999999999995 L 174.844,14.875 Z M 323.0,205.345 C 446.38599999999997,296.095 462.423,432.96799999999996 284.344,427.781 C 336.51,385.317 353.196,296.868 323.0,205.345 Z\" fill=\"url(#hflG)\" fill-rule=\"evenodd\"/></svg>","firm":"<svg viewBox=\"0 0 512 512\"><defs><linearGradient id=\"hfS\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#eef2f6\"/><stop offset=\"1\" stop-color=\"#8c96a3\"/></linearGradient><linearGradient id=\"hfG\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fff3b8\"/><stop offset=\"1\" stop-color=\"#e09424\"/></linearGradient></defs><g fill=\"none\" stroke=\"#3d2c19\" stroke-width=\"34\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M 19.3,19.4 L 18.9,47.2 L 286.1,202.0 L 227.4,221.9 L 285.0,241.3 L 142.1,383.5 L 122.9,364.3 L 71.4,478.6 L 194.5,435.1 L 177.0,416.2 L 328.9,264.3 L 341.3,307.4 L 364.3,238.9 L 421.0,222.3 L 363.5,206.8 L 340.6,127.0 L 326.4,175.3 L 57.8,19.9 L 19.3,19.4 L 19.3,19.4 Z\"/><path d=\"M 370.6,81.9 C 366.0,81.9 361.5,82.0 357.1,82.2 C 353.8,82.3 350.5,82.5 347.3,82.7 L 378.5,191.5 L 482.6,219.6 C 488.8,180.5 491.5,139.3 491.8,99.5 C 456.3,88.8 415.0,82.2 375.1,81.9 C 373.6,81.9 372.1,81.9 370.6,81.9 L 370.6,81.9 Z\"/><path d=\"M 333.7,84.0 C 301.7,87.6 272.7,96.1 250.7,109.9 L 315.2,147.2 L 333.7,84.0 L 333.7,84.0 Z\"/><path d=\"M 481.9,224.0 L 378.9,254.1 L 340.0,370.1 L 319.7,299.9 L 280.6,339.0 C 299.5,374.3 326.7,401.3 366.8,416.6 C 414.3,398.7 445.4,353.8 464.8,295.0 C 472.2,272.8 477.7,248.9 481.9,224.0 L 481.9,224.0 Z\"/></g><path d=\"M 370.6,81.9 C 366.0,81.9 361.5,82.0 357.1,82.2 C 353.8,82.3 350.5,82.5 347.3,82.7 L 378.5,191.5 L 482.6,219.6 C 488.8,180.5 491.5,139.3 491.8,99.5 C 456.3,88.8 415.0,82.2 375.1,81.9 C 373.6,81.9 372.1,81.9 370.6,81.9 L 370.6,81.9 Z\" fill=\"url(#hfS)\"/><path d=\"M 333.7,84.0 C 301.7,87.6 272.7,96.1 250.7,109.9 L 315.2,147.2 L 333.7,84.0 L 333.7,84.0 Z\" fill=\"url(#hfS)\"/><path d=\"M 481.9,224.0 L 378.9,254.1 L 340.0,370.1 L 319.7,299.9 L 280.6,339.0 C 299.5,374.3 326.7,401.3 366.8,416.6 C 414.3,398.7 445.4,353.8 464.8,295.0 C 472.2,272.8 477.7,248.9 481.9,224.0 L 481.9,224.0 Z\" fill=\"url(#hfS)\"/><path d=\"M 19.3,19.4 L 18.9,47.2 L 286.1,202.0 L 227.4,221.9 L 285.0,241.3 L 142.1,383.5 L 122.9,364.3 L 71.4,478.6 L 194.5,435.1 L 177.0,416.2 L 328.9,264.3 L 341.3,307.4 L 364.3,238.9 L 421.0,222.3 L 363.5,206.8 L 340.6,127.0 L 326.4,175.3 L 57.8,19.9 L 19.3,19.4 L 19.3,19.4 Z\" fill=\"url(#hfG)\"/></svg>"};
// each use gets its own gradient and clip names (a copy in a hidden card would otherwise leave the others unfilled), and the
// banner takes the town's colour like the upgrades' pictures (upIco)
let heroIcoN = 0;
const HERO_ICO = new Proxy(HERO_ICO_SRC, { get: (t, k) => {
  const n = ++heroIcoN, c = new THREE.Color(); c.setStyle(TEAM_PAL[TEAM.town]); const lt = '#' + c.clone().lerp(new THREE.Color(1, 1, 1), .45).getHexString();
  return (t[k] || '').replace(/(id="|url\(#)(h[a-zA-Z0-9]+)/g, `$1$2_${n}`).replace(/#9cc5ff/g, lt).replace(/#2f5faf/g, TEAM_PAL[TEAM.town]);
} });
// health, then damage (a bow for the Ranger, with the reach), then the Heir's speed
const heroStats = (hp, bad) => STAT('hp', hp, bad ? 'bad' : '') + (heroDef().range ? STAT('bow', `${heroDmg()}`) + STAT('range', `${heroRange()} m`) : STAT('sword', `${heroDmg()}`)) + (HERO_ID === 'heir' ? STAT('speed', `×${heroSpeed()}`) : '');
const heroShown = () => heroOn() && !gameOver && !menuOn() && !galleryOn && !showcaseBuilt && !!castleB();
function heroUI() {
  const bar = $('#heroBar'), card = $('#heroCard'); if (!bar) return;
  const on = heroShown(); bar.hidden = !on; if (!on) { card.hidden = true; return; }
  if (selected && heroSel) heroSel = false;
  const night = PH.kind === 'night', hpf = hero ? Math.max(0, hero.hp / hero.maxHp) : 0, xpf = HERO.lv >= HERO_MAX ? 1 : HERO.xp / heroNeed();
  // the portrait: a health ring, the level, a thin XP bar; greyed with the seconds left while fallen
  const key = [HERO_ID, HERO.lv, HERO.pts, ...HERO_ORDER.map(k => HERO.sk[k]), !!hero, night, heroSel, !!heroAt, heroMove].join('|');
  // the portrait is built only when the hero, its level or its fall change (Jack: rebuilt on every tap, its picture went blank and
  // its gold ring restarted); being picked only toggles a class
  const bk = [HERO_ID, HERO.lv, !!hero].join('|');
  if (bk !== heroBarKey || !bar.firstChild) {
    heroBarKey = bk;
    bar.innerHTML = `<button class="heroPort${hero ? '' : ' down'}" data-hact="sel" aria-label="${heroName()}"><span class="face"><canvas class="heroCv" width="96" height="96"></canvas></span><b class="lv">${HERO.lv}</b><span class="hpb"><i></i></span><span class="xp"><i></i></span><b class="cd"></b></button>`;
    hpDrawn = 0;
  }
  const port = bar.querySelector('.heroPort'); if (port) port.classList.toggle('sel', heroSel);
  if (key !== heroKey) {
    heroKey = key;
    // the card: name and level, Move and Recall, health, XP, stats and the three skills with a + while points are left
    if (heroSel) {
      // the skills, read only: learnt on the campaign's Hero screen
      const sk = HERO_ORDER.filter(k => HERO.sk[k]).map(k => `<span class="hSkMini" title="${HERO_SK[k].name}">${HERO_ICO[k]}<span class="hsPips">${[0, 1, 2].map(i => `<i class="${i < HERO.sk[k] ? 'on' : ''}"></i>`).join('')}</span></span>`).join('');
      card.innerHTML = `<div class="cardHead"><span class="cardIco heroIco"><canvas class="heroCv" width="96" height="96"></canvas></span><div class="cardName"><h4>${heroName()}</h4><div class="cardSub"><span>Hero · Lv ${HERO.lv}</span></div></div>`
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
    const st = card.querySelector('.hStats'); if (st) st.innerHTML = hero ? heroStats(Math.ceil(hero.hp) + '/' + hero.maxHp, hpf < .35) : STAT('', `Back in ${Math.ceil(heroDownT)} s`, 'warn');
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
  if (a === 'sel') { if (heroSel) { heroRelease(); sfx('click'); setHint('Select a building'); } else { heroSelect(); heroMove = !!hero; if (heroMove) { rallyFor = null; volleyAim = false; } setHint(heroMove ? 'Tap a spot' : 'Select a building'); heroKey = ''; } }
  else if (a === 'close') { heroSel = false; heroMove = false; heroKey = ''; flagFocus = null; }
  else if (a === 'move') { heroMove = !heroMove; if (heroMove) { rallyFor = null; volleyAim = false; } setHint(heroMove ? 'Tap a spot' : 'Select a building'); heroKey = ''; }
  else if (a === 'recall') { setHeroFlag(null); heroRelease(); flagFocus = null; setHint('Recalled'); }
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
  const r = e.target.closest('[data-hact=ros]'); if (r) { e.stopPropagation(); if (r.dataset.h !== HERO_ID) { pickHero(r.dataset.h); renderHeroPick(); } }
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
function heroModel(id = HERO_ID) {
  const p = makePerson({ hair: hairs[HERO_DEFS[id].hair % hairs.length] }); heroKitFoot(p, id); p.seed = 0;
  p.arms[0].rotation.x = -.35; p.arms[1].rotation.x = -.35; p.pivot.rotation.x = -.4;
  return { g: p.g, p };
}
// the portrait is always on foot (a horse would only lift the bust)
function heroKitFoot(p, id) { heroKit(p, id, true); }
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
// ---- the Heroes row under the skills: every hero, a tap picks one ----
const HEROES = ['heir', 'ranger', 'captain'];
function rosterModel(id) { return heroModel(id).p; }
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
    + `<div class="hpBody"><div class="hpStage"><canvas class="hpView" width="320" height="320"></canvas></div><div class="hpInfo"><div class="hpName"><span class="hpNm"></span><span class="upBank hpLvP"><span class="upNum">Lv <b class="hpLv"></b></span></span></div><div class="hpXp"></div><div class="hpStats"></div></div></div>`
    + `<div class="hSkHead">Skills<span class="hsPts"></span><span class="upRs hsRs"><button class="hsReset" data-hact="reset">${UP_RESET}<span class="rsT">Reset</span></button></span></div><div class="hsWrap"><div class="hsList"></div><div class="hsDet"></div></div>`
    + `<div class="hSkHead hRosHead">Heroes</div><div class="hRoster">${HEROES.map(id => `<button class="hRos" data-hact="ros" data-h="${id}"><span class="hrPic"><canvas class="hrCv" data-h="${id}" width="128" height="128"></canvas><b class="hrLv"></b></span><b>${HERO_DEFS[id].name}</b><small></small></button>`).join('')}</div></div>`;
  if (!el.querySelector('.hrCv[data-done]') || heroTeamKey !== JSON.stringify(TEAM)) { heroTeamKey = JSON.stringify(TEAM); rosterSnaps(el); }
  const xpf = HERO.lv >= HERO_MAX ? 1 : HERO.xp / heroNeed();
  el.querySelector('.hpLv').textContent = HERO.lv; el.querySelector('.hpNm').textContent = heroName();
  // the Heroes row: the one in use with a gold edge; the others show their role, each its own level
  el.querySelectorAll('.hRos').forEach(b => { const id = b.dataset.h, on = id === HERO_ID; b.classList.toggle('on', on); b.querySelector('small').textContent = on ? 'Selected' : HERO_DEFS[id].role; b.querySelector('.hrLv').textContent = on ? HERO.lv : loadHero(id).lv; });
  el.querySelector('.hpXp').innerHTML = `XP<span class="hXpBar"><i style="width:${xpf * 100}%"></i></span>${HERO.lv >= HERO_MAX ? 'Max' : `${HERO.xp} / ${heroNeed()}`}`;
  el.querySelector('.hpStats').innerHTML = heroStats(`${heroHp()}`);
  el.querySelector('.hsPts').innerHTML = HERO.pts ? `${SKP_ICO}${HERO.pts}` : '';
  el.querySelector('.hsReset').disabled = !HERO_ORDER.some(k => HERO.sk[k]);
  // two sides (Jack, after Kingdom Rush 2's tower upgrades): the skills on the left, the picked one's details and Learn on the right
  if (!HERO_SK[hpSkSel]) hpSkSel = HERO_ORDER.find(k => skCan(k)) || HERO_ORDER[0];
  el.querySelector('.hsList').innerHTML = HERO_ORDER.map(k => {
    const r = HERO.sk[k];
    return `<button class="hsTile sk-${k}${k === hpSkSel ? ' sel' : ''}${r ? '' : ' off'}" data-hact="sk" data-k="${k}"><span class="hsIco">${HERO_ICO[k]}</span><span class="hsTx"><b>${HERO_SK[k].name}</b><span class="hsPips">${[0, 1, 2].map(n => `<i class="${n < r ? 'on' : ''}"></i>`).join('')}</span></span></button>`;
  }).join('');
  {
    const k = hpSkSel, S = HERO_SK[k], r = HERO.sk[k], c = rankCost(r), lvOk = r < 3;
    // one full line (Jack: no boxes of figures): what the next rank does, or the top rank's once all are learnt
    const nextLine = r < 3 ? S.line(r) : S.line(2);
    const act = r >= 3 ? '<span class="hsNote">Max rank</span>'
      : HERO.pts >= c ? `<button class="primary hsLearn" data-hact="learn" data-k="${k}">Learn<span class="hsLc">${SKP_ICO}${c}</span></button>`
      : `<span class="hsNote">Needs ${SKP_ICO}${c}</span>`;
    // the picture with the name and the next rank beside it, what it does under them; on a tablet all centred under a bigger picture (Jack)
    el.querySelector('.hsDet').innerHTML = `<div class="hsDh sk-${k}"><span class="hsIco">${HERO_ICO[k]}</span><span class="hsDt"><b>${S.name}</b><small class="hsRk">Rank ${r < 3 ? r + 1 : 3}</small></span></div>`
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

// ---- the gallery's hero demos (Jack: each skill's look and each hero's level-up on a loop, easier to see than in a fight) ----
// galPose hands any figure with `demo` here; the effects are the game's own (sparks, glints, trails, rings, the level-up column),
// put into the gallery's scene while it is open (fxScene); arrows are the gallery's own, flown by galFxTick
const galArrows = [];
function galArrow(from, to, glow) {
  const m = new THREE.Mesh(arrowGeo, glow ? glowArrowM : arrowMat); m.position.copy(from); gScene.add(m);
  galArrows.push({ m, from: from.clone(), to: to.clone(), t: 0, dur: Math.max(.2, from.distanceTo(to) / 20), glow });
}
function galFxTick(dt) {
  updatePuffs(dt); updateFloats(dt); heroSpriteTick(dt);
  for (let n = galArrows.length - 1; n >= 0; n--) {
    const a = galArrows[n]; a.t += dt / a.dur; const k = Math.min(1, a.t), m = a.m, p = m.position.clone();
    m.position.lerpVectors(a.from, a.to, k); m.position.y += .35 * 4 * k * (1 - k); m.lookAt(m.position.clone().add(m.position.clone().sub(p)));
    if (a.glow) sparkBurst(m.position.x, m.position.y - .05, m.position.z, '#ffd36a', 1);
    if (k >= 1) { sparkBurst(a.to.x, a.to.y, a.to.z, a.glow ? '#ffd36a' : '#e8d8b0', 3); unparent(m); galArrows.splice(n, 1); }
  }
}
const crossed = (prev, now, at) => prev < at && now >= at;
function galDemo(p, t, dt) {
  const id = p.heroId, d = p.demo, x0 = p.g.position.x, z0 = p.g.position.z, fw = p.g.rotation.y, fx = Math.sin(fw), fz = Math.cos(fw), now = t * 1000;
  p.rx = p.x = x0; p.rz = p.z = z0; p.g.position.y = 0; p.g.rotation.x = 0;
  p.arms[0].rotation.x = -.55; if (p.cape) capeWave(p, t, .15);
  const T = (t + p.seed), chest = .8 * UNIT_K, foeAt = e => new THREE.Vector3(e.g.position.x, chest, e.g.position.z);
  const blow = c => swordPose(p, Math.max(0, SWORD_T - c), 0);
  const bowAt = () => { p.g.updateMatrixWorld(true); return (p.pivot || p.arms[0]).getWorldPosition(new THREE.Vector3()); };
  // knocked-back raiders drift back to where they stood
  for (const e of p.foes || []) if (e.home) { e.kb = Math.max(0, e.kb - dt * .6); e.g.position.set(e.home.x + fx * e.kb, 0, e.home.z + fz * e.kb); }
  if (d === 'lv') {                                               // a level gained, every 3.2 s
    if ((p.lvC = (p.lvC == null ? .6 : p.lvC) - dt) <= 0) { p.lvC = 3.2; p.lvUpT = LVUP_T; p.lvGlint = false; }
    if (id === 'ranger') bowPose(p, false, false, -.35, 0); else blow(0);
    lvUpFx(p, dt, now, id, 'g-lv' + p.seed, p); return;
  }
  if (d === 'cry') {                                              // Inspire: gold sparks on the troops' weapons beside the Heir
    blow(T % 1.6);
    if ((p.sparkT = (p.sparkT || 0) - dt) <= 0) { p.sparkT = .3; const u = p.mates[Math.floor(Math.random() * p.mates.length)];
      if (u.pivot) { const w = u.pivot.getWorldPosition(new THREE.Vector3()); sparkBurst(w.x, w.y - .1, w.z, '#ffd24a', 1); } }
    return;
  }
  if (d === 'flurry') {                                           // two blows, then the burst: a glint, ×3, three quick blows with a trail
    const c = T % 3.2, ci = Math.floor(T / 3.2), prev = p.prevC == null ? c : p.prevC; p.prevC = c;
    let quick = false;
    // the Heir's blows alternate the overhead chop and the thrust, the quick ones too, as in the game (heroStrike)
    const hit = (n, rem) => { if (n % 2) { swordPose(p, 0, 0); thrustPose(p, rem, 0); } else { thrustPose(p, 0, 0); swordPose(p, rem, 0); } };
    if (c < 1.6) hit(Math.floor(c / .8), Math.max(0, SWORD_T - c % .8));
    else { const q = c - 1.6, n = Math.floor(q / .3), cq = q - n * .3;
      if (n < 3) { quick = true; hit(n, Math.max(0, SWORD_T * (1 - cq / .3)));
        if (crossed(prev - 1.6 - n * .3, cq, .16) && p.foes[0]) { const w = foeAt(p.foes[0]); sparkBurst(w.x, w.y + .1, w.z, '#ffe9a8', 6); } }
      else blow(0); }
    if (p.burstCi !== ci && c >= 1.5) { p.burstCi = ci; const tip = () => p.pivot.localToWorld(SWORD_LINE[1].clone()); glintAt(tip(), '#fff4c0', tip); floatText('×3', '#ffd768', x0 + .7, 1.25, z0); }
    heroTrail(p, SWORD_LINE, '#ffd24a', quick); return;
  }
  if (d === 'horse') {                                            // Royal horse: dust behind the hooves, the flaps flutter, a rear-up
    blow(0);
    if ((p.hoofT = (p.hoofT || 0) - dt) <= 0) { p.hoofT = .07; dustAt(x0 - fx * .7, 0, z0 - fz * .7); }
    if (p.flaps) p.flaps.forEach((h, i) => { h.rotation.z = h.userData.flap * (.35 + Math.sin(now / 90 + i * 1.7) * .12); });
    const c = T % 4; if (c < 1.3) { const k = Math.sin(Math.PI * c / 1.3); p.g.rotation.order = 'YXZ'; p.g.rotation.x = -.5 * k; p.g.position.y = .25 * k; }
    return;
  }
  if (d === 'twin' || d === 'eye' || d === 'quick') {            // the Ranger: a shot every 1.8 s at the raider ahead
    const per = d === 'quick' ? 5 : 1.8, c = T % per, prev = p.prevC == null ? c : p.prevC; p.prevC = c;
    let nk = p.pivot && p.pivot.userData.nock;
    if (p.pivot && !nk) { nk = p.pivot.userData.nock = new THREE.Group(); for (const x of [-.018, .018]) nk.add(box(.012, .6, .012, arrowWoodM, x, -.18, 0), box(.006, .09, .05, fletchM, x, .08, 0)); p.pivot.add(nk); }
    if (d === 'quick' && c >= 3.6) {                              // Quick draw's burst: a glint, then four glowing arrows a quarter second apart
      const q = c - 3.6, n = Math.floor(q / .25), cq = q - n * .25;
      bowPose(p, n < 4 && cq < .08, n < 4 && cq >= .08, -.35, 0);
      if (n < 4 && crossed(prev - 3.6 - n * .25, cq, .08)) { galArrow(bowAt(), foeAt(p.foes[0]), true); p.fanT = .2; }
    } else {
      const cc = c % 1.8, pc = prev % 1.8;
      bowPose(p, cc > .6 && cc < 1.05, cc >= 1.05 && cc < 1.4, -.35, 0);
      if (crossed(pc, cc, 1.05)) {
        const b = bowAt();
        if (d === 'twin') { glintAt(b, '#ffffff'); for (const e of p.foes) galArrow(b, foeAt(e)); }
        else galArrow(b, foeAt(p.foes[0]));
      }
      if (d === 'quick' && crossed(prev, c, 3.45)) { const b = bowAt(); glintAt(b, '#fff4c0'); }
      if (nk) nk.visible = d === 'twin' && cc > .6 && cc < 1.05;
    }
    if (nk && d !== 'twin') nk.visible = false;
    if (p.fanT > 0) { p.fanT -= dt; const f = 1 - p.fanT / .2, k = f < .5 ? f * 2 : (1 - f) * 2; p.arms[1].rotation.set(-1.42 - 1.9 * k, 0, -.62 + .5 * k); }
    if (d === 'eye') {                                            // Eagle eye: the eagle circling over the Ranger, his reach ring in blue
      if (!p.eagle) { p.eagle = makeEagle(); gScene.add(p.eagle.g); }
      const a = t * .55; p.eagle.g.position.set(x0 + Math.cos(a) * 1.6, 3.2 + Math.sin(a * 2) * .2, z0 + Math.sin(a) * 1.6);
      p.eagle.g.rotation.set(0, -a, .35); p.eagle.g.scale.setScalar(.9);
      p.eagle.flap(Math.sin(t * 2.2) > .55 ? Math.sin(now / 110) * .45 : 0);
      heroRing('g-eye' + p.seed, 2, '#8fc1db', .45, p);
    }
    return;
  }
  if (d === 'firm') {                                             // Deflect: now and then a blow glances off, steel sparks and the share in grey
    blow(T % 1.6); const c = T % 2.2, prev = p.prevC == null ? c : p.prevC; p.prevC = c;
    if (crossed(prev, c, 1.1)) { sparkBurst(x0, .95 * UNIT_K, z0, '#eef4ff', 9); floatText('−35%', '#c9ced6', x0 + .5, 1.5, z0); }
    return;
  }
  if (d === 'sweep') {                                            // Sweeping blow: a blow, then the spin with a steel trail, dust, raiders knocked back
    const c = T % 2.6, prev = p.prevC == null ? c : p.prevC; p.prevC = c; const sw = c >= 1.2 && c < 1.2 + SWEEP_T;
    if (sw) { sweepPose(p, (SWEEP_T - (c - 1.2)) * SWORD_T / SWEEP_T, 0); if (p.cape) p.cape.forEach((h, i) => { h.rotation.x = i ? .25 : 1.15; }); }
    else blow(c < .9 ? c : 0);
    if (crossed(prev, c, 1.6)) { const cx = x0 + fx * .9, cz = z0 + fz * .9; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; dustAt(cx + Math.cos(a) * .75, 0, cz + Math.sin(a) * .75); }
      for (const e of p.foes) e.kb = .5; }
    heroTrail(p, HAMMER_LINE, '#eef4ff', sw); return;
  }
  if (d === 'wind') {                                             // Second wind: green-white specks drift up, a slow breath every 4 s
    blow(0);
    if ((p.windFx = (p.windFx || 0) - dt) <= 0) { p.windFx = .16; const a = Math.random() * 6.283; sparkBurst(x0 + Math.cos(a) * .22, .3 + Math.random() * .6, z0 + Math.sin(a) * .22, '#d6ffd9', 1); }
    const c = T % 4, k = c < .9 ? Math.sin(Math.PI * c / .9) : 0; p.body.position.y += .03 * k; p.arms[0].rotation.z = .12 * k; p.arms[1].rotation.z = -.12 * k;
  }
}
