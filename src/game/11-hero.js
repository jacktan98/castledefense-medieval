// ---------- the hero (Jack: for testing, off unless switched on in the admin panel): the Heir ----------
// One switch (mtd-dev-hero, the admin's Heroes button) turns everything here on; off, every hook below returns at once and the
// game plays exactly as before. The Heir fights on foot (on a horse once Royal horse is learnt), holds a spot in front of the castle
// (or where Move sends them), earns XP by fighting and keeps their level from stage to stage (mtd-hero); a fallen Heir comes
// back after HERO_CD s of game time, like the castle's riders. Each level brings a skill point.
const heroOn = () => { try { return localStorage.getItem('mtd-dev-hero') === '1'; } catch (e) { return false; } };
const HERO_CD = 30, HERO_MAX = 10;
// skills: rank by rank, the level each rank needs
const HERO_SK = {
  cry: { name: 'Royal cry', line: 'Troops nearby hit harder', req: [1, 3, 5], k: [.15, .25, .35], t: 8, cd: 30 },
  horse: { name: 'Royal horse', line: 'Rides a horse, faster', req: [2, 4, 6], k: [2, 2.3, 2.6] },
  firm: { name: 'Stand firm', line: 'Takes half damage', req: [5, 7, 9], t: [4, 6, 8], cd: 40 },
};
const HERO_ORDER = ['cry', 'horse', 'firm'];
const heroBlank = () => ({ lv: 1, xp: 0, pts: 1, sk: { cry: 0, horse: 0, firm: 0 } });
function loadHero() {
  try { const h = JSON.parse(localStorage.getItem('mtd-hero')); if (h && h.lv) return { lv: h.lv, xp: h.xp || 0, pts: h.pts || 0, sk: Object.assign({ cry: 0, horse: 0, firm: 0 }, h.sk) }; } catch (e) {}
  return heroBlank();
}
var HERO = loadHero();
const saveHero = () => { try { localStorage.setItem('mtd-hero', JSON.stringify(HERO)); } catch (e) {} };
const heroHp = () => 260 + 30 * (HERO.lv - 1), heroDmg = () => 12 + 2 * (HERO.lv - 1);
const heroNeed = () => 60 + 40 * HERO.lv;
const heroSpeed = () => HERO.sk.horse ? HERO_SK.horse.k[HERO.sk.horse - 1] : 1;
var hero = null, heroDownT = 0, heroAt = null, heroFlag = null, heroMove = false, heroSel = false, heroWasNight = false;
var cryT = 0, cryCd = 0, firmT = 0, firmCd = 0, heroRing = null, heroKey = '';
const heroGold = mat('#e8b94a'); heroGold.metalness = .6; heroGold.roughness = .35;
// the Heir's look: the man-at-arms' mail and blue surcoat, sword and kite shield, but a gold crown for the helm
function heroKit(v) {
  if (v.horse) stripKit(v);
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
  hero = null; heroDownT = 0; heroMove = false; heroSel = false; cryT = cryCd = firmT = firmCd = 0; heroWasNight = false; setHeroFlag(null);
  if (heroRing) heroRing.visible = false;
  if (heroOn()) spawnHero();
  heroKey = ''; heroUI();
}
function setHeroFlag(pt) {
  if (heroFlag) { scene.remove(heroFlag); heroFlag = null; }
  heroAt = pt ? { x: pt.x, z: pt.z } : null; if (!pt) return;
  const f = new THREE.Group(); f.add(box(.05, 1.5, .05, M.timber, 0, .75, 0)); f.add(flagBox(.46, .3, .03, M.flag, .25, 1.33, 0));
  f.add(cyl(.06, .06, .06, 8, heroGold, 0, 1.53, 0));
  f.position.set(pt.x, hAt(pt.x, pt.z), pt.z); scene.add(f); heroFlag = f;
}
// Royal cry: troops within 7 m of the Heir hit harder while it lasts (updateSoldier and the Heir's own blows)
const heroBuff = v => hero && cryT > 0 && v && Math.hypot(v.x - hero.x, v.z - hero.z) < 7 ? 1 + HERO_SK.cry.k[HERO.sk.cry - 1] : 1;
// Stand firm halves what the Heir takes (hurtSoldier)
const heroTake = d => firmT > 0 ? d / 2 : d;
function heroFall(v) {
  v.gone = true; v.soldier = false; release(v); const i = villagers.indexOf(v); if (i >= 0) villagers.splice(i, 1);
  if (v.sbar) scene.remove(v.sbar.grp); fallen.push({ v, t: 0 });
  hero = null; heroDownT = HERO_CD; cryT = firmT = 0; heroMove = false; log('<b>The Heir</b> has fallen', 'warn'); heroKey = '';
}
function heroXp(n) {
  if (!heroOn() || HERO.lv >= HERO_MAX) return;
  HERO.xp += n; let up = false;
  while (HERO.lv < HERO_MAX && HERO.xp >= heroNeed()) { HERO.xp -= heroNeed(); HERO.lv++; HERO.pts++; up = true; }
  if (HERO.lv >= HERO_MAX) HERO.xp = 0;
  if (up) { if (hero) { hero.maxHp = heroHp(); hero.hp = hero.maxHp; } banner(`The Heir · Lv ${HERO.lv}`, 'Skill point'); log(`<b>The Heir</b> · Lv ${HERO.lv}`, 'good'); sfx('star'); }
  saveHero(); heroKey = '';
}
// XP (hurtEnemy): the Heir's own kills count most, any raider slain while they stand a little
function heroKill(e, by) {
  if (!heroOn() || !hero) return;
  const E = ENEMY[e.kind];
  if (by === hero) heroXp(E.boss ? 60 : E.engine ? 15 : 6 * (e.tier || 1) + (E.mounted ? 3 : 0)); else heroXp(1);
}
function heroLearn(k) {
  const S = HERO_SK[k], r = HERO.sk[k];
  if (HERO.pts < 1 || r >= 3 || HERO.lv < S.req[r]) { sfx('nope'); return; }
  HERO.pts--; HERO.sk[k]++; saveHero(); sfx('upgrade'); heroKey = '';
  if (k === 'horse' && hero) { const x = hero.x, z = hero.z, hp = hero.hp / hero.maxHp; heroKit(hero); hero.hp = hero.maxHp * hp; hero.x = x; hero.z = z; if (HERO.sk.horse === 1) sfx('neigh', hero); }
}
function heroCast(k) {
  if (!hero || !HERO.sk[k]) return;
  if (PH.kind !== 'night') { setHint('Night only', 'bad'); return; }
  if (k === 'cry') { if (cryCd > 0) return; cryT = HERO_SK.cry.t; cryCd = HERO_SK.cry.cd; heroPulse(); sfx('horn', hero, .35); setHint('Royal cry'); }
  if (k === 'firm') { if (firmCd > 0) return; firmT = HERO_SK.firm.t[HERO.sk.firm - 1]; firmCd = HERO_SK.firm.cd; sfx('clash', hero); setHint('Stand firm'); }
  heroKey = '';
}
// a gold ring that spreads out from the Heir as they cry out; a blue one round their feet while Stand firm lasts
var heroPulseT = 0;
function heroPulse() { heroPulseT = .8; }
function heroRings(dt) {
  if (!heroRing) {
    heroRing = new THREE.Mesh(new THREE.RingGeometry(.86, 1, 40), new THREE.MeshBasicMaterial({ color: '#f0c95a', transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    heroRing.rotation.x = -Math.PI / 2; heroRing.renderOrder = 3; scene.add(heroRing);
  }
  if (heroRing.parent !== scene) scene.add(heroRing);
  if (!hero) { heroRing.visible = false; return; }
  const y = walkY(hero.rx ?? hero.x, hero.rz ?? hero.z) + .06; heroRing.position.set(hero.rx ?? hero.x, y, hero.rz ?? hero.z);
  if (heroPulseT > 0) { heroPulseT -= dt; const t = 1 - heroPulseT / .8, s = .6 + t * 6.4; heroRing.visible = true; heroRing.scale.set(s, s, s); heroRing.material.color.set('#f0c95a'); heroRing.material.opacity = .9 * (1 - t); }
  else if (firmT > 0) { heroRing.visible = true; heroRing.scale.set(.7, .7, .7); heroRing.material.color.set('#9fd1ff'); heroRing.material.opacity = .55 + .25 * Math.sin(performance.now() / 160); }
  else heroRing.visible = false;
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
  else { const K = castleB(); if (K && !heroAt) turnTo(v, faceAngle(K), dt); }
  // mends slowly by day while nobody is fighting
  if (PH.kind === 'day' && !foe && v.hp < v.maxHp) v.hp = Math.min(v.maxHp, v.hp + v.maxHp * .02 * dt);
}
// one step of the game (tick): timers, the comeback, a night survived
function heroTick(dt) {
  if (!heroOn()) { if (hero) removeHero(); if (heroRing) heroRing.visible = false; return; }
  if (cryT > 0) cryT -= dt; if (cryCd > 0) cryCd = Math.max(0, cryCd - dt);
  if (firmT > 0) firmT -= dt; if (firmCd > 0) firmCd = Math.max(0, firmCd - dt);
  if (!hero && heroDownT > 0 && (heroDownT -= dt) <= 0) { heroDownT = 0; spawnHero(); log('<b>The Heir</b> returns', 'good'); }
  else if (!hero && !heroDownT && !gameOver) spawnHero();
  const night = PH.kind === 'night'; if (heroWasNight && !night && hero && !gameOver) heroXp(20); heroWasNight = night;
  heroRings(dt);
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
function heroSelect() { if (selected) deselect(); heroSel = true; heroKey = ''; sfx('click'); heroUI(); }
// ---- on screen: the portrait (and the Heir's skills at night) under the top panel; the Heir's card in the dock ----
const HERO_FACE = '<svg viewBox="0 0 48 48"><path d="M8 50 Q10 34 24 33 Q38 34 40 50Z" fill="#2f5faf" stroke="#1a2742" stroke-width="1.2"/><path d="M17 33 L24 40 L31 33" fill="#c9d3e3" stroke="#1a2742" stroke-width="1"/><ellipse cx="24" cy="23" rx="8.2" ry="9.4" fill="#e6b98f" stroke="#5a3a22" stroke-width="1"/><path d="M15.6 22 Q15 12 24 12 Q33 12 32.4 22 Q30 17 24 17 Q18 17 15.6 22Z" fill="#6b4425" stroke="#3b2414" stroke-width="1"/><path d="M15.5 16.5 L17.5 10.5 L20.5 14 L24 8.5 L27.5 14 L30.5 10.5 L32.5 16.5 Z" fill="#f0c95a" stroke="#7a5418" stroke-width="1"/><circle cx="24" cy="12.2" r="1.3" fill="#d24a3a"/><circle cx="21" cy="24" r="1" fill="#2a1a10"/><circle cx="27" cy="24" r="1" fill="#2a1a10"/><path d="M21.5 28.5 Q24 30 26.5 28.5" fill="none" stroke="#8a4a32" stroke-width="1"/></svg>';
const HERO_ICO = {
  cry: '<svg viewBox="0 0 24 24"><path d="M3 8 L7.5 12 L12 5 L16.5 12 L21 8 L19 18 H5Z"/><path d="M8 21 H16"/></svg>',
  horse: `<svg viewBox="0 0 24 24">${HORSE_ICO}</svg>`,
  firm: '<svg viewBox="0 0 24 24"><path d="M12 3 L19 6 V11 C19 16 15.5 19 12 21 C8.5 19 5 16 5 11 V6Z"/><path d="M12 7 V17 M8 11 H16"/></svg>',
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
    let h = `<button class="heroPort${hero ? '' : ' down'}${heroSel ? ' sel' : ''}" data-hact="sel" aria-label="The Heir"><i class="hpRing"></i><span class="face">${HERO_FACE}</span><b class="lv">${HERO.lv}</b><span class="xp"><i></i></span><b class="cd"></b></button>`;
    if (night && hero) for (const k of ['cry', 'firm']) if (HERO.sk[k]) h += `<button class="pw heroPw" data-hact="${k}" aria-label="${HERO_SK[k].name}">${HERO_ICO[k]}<b class="cd"></b></button>`;
    bar.innerHTML = h;
    // the card: name and level, Move and Recall, health, XP, stats and the three skills with a + while points are left
    if (heroSel) {
      const sk = HERO_ORDER.map(k => {
        const S = HERO_SK[k], r = HERO.sk[k], can = HERO.pts > 0 && r < 3 && HERO.lv >= S.req[r];
        const btn = r >= 3 ? '' : can ? `<button class="hsPlus" data-hact="learn" data-k="${k}" aria-label="Learn">+</button>` : `<span class="hsReq">Lv ${S.req[r]}</span>`;
        return `<div class="hSk${r ? '' : ' off'}"><span class="hsIco">${HERO_ICO[k]}</span><span class="hsTx"><b>${S.name}</b><small>${S.line}</small></span><span class="hsPips">${[0, 1, 2].map(i => `<i class="${i < r ? 'on' : ''}"></i>`).join('')}</span>${btn}</div>`;
      }).join('');
      card.innerHTML = `<div class="cardHead"><span class="cardIco heroIco">${HERO_FACE}</span><div class="cardName"><h4>The Heir</h4><div class="cardSub"><span>Hero · Lv ${HERO.lv}</span></div></div>`
        + (hero ? `<button class="iconBtn" data-hact="move" aria-pressed="${heroMove}" title="Move: tap, then a spot" aria-label="Move"><svg viewBox="0 0 24 24"><path d="M6 21 V3.5"/><path d="M6 4 H17.5 L15 8 L17.5 12 H6"/></svg></button>` : '')
        + (heroAt ? `<button class="iconBtn" data-hact="recall" title="Back to the castle" aria-label="Recall"><svg viewBox="0 0 24 24"><path d="M9 14 L4 9 L9 4"/><path d="M4 9 H14 A5.5 5.5 0 0 1 14 20 H9"/></svg></button>` : '')
        + `<button class="iconBtn" data-hact="close" aria-label="Close"><svg viewBox="0 0 24 24"><path d="M6 6 L18 18 M18 6 L6 18"/></svg></button></div>`
        + `<div class="hpbar"><i class="hHp"></i></div><div class="hXp">XP<span class="hXpBar"><i></i></span><span class="hXpN"></span></div>`
        + `<div class="stats hStats"></div><div class="hSkHead">Skills<span>${HERO.pts ? `${HERO.pts} point${HERO.pts > 1 ? 's' : ''}` : ''}</span></div>${sk}`;
    }
  }
  const p = bar.querySelector('.heroPort');
  if (p) {
    p.style.setProperty('--p', `${(hero ? hpf : 0) * 100}%`); p.style.setProperty('--hc', hpf < .35 ? 'var(--bad)' : hpf < .7 ? '#e6c46a' : 'var(--ok)');
    p.querySelector('.xp i').style.width = `${xpf * 100}%`; p.querySelector('.cd').textContent = hero ? '' : Math.ceil(heroDownT);
  }
  for (const b of bar.querySelectorAll('.heroPw')) { const k = b.dataset.hact, cd = k === 'cry' ? cryCd : firmCd, act = k === 'cry' ? cryT > 0 : firmT > 0; b.classList.toggle('cool', cd > 0 && !act); b.setAttribute('aria-pressed', String(act)); b.querySelector('.cd').textContent = cd > 0 && !act ? Math.ceil(cd) : ''; }
  card.hidden = !heroSel || !!selected;
  if (!card.hidden) {
    const hp = card.querySelector('.hHp'); if (hp) { hp.style.width = `${hpf * 100}%`; hp.style.background = hpf < .35 ? 'var(--bad)' : hpf < .7 ? '#e6c46a' : 'var(--ok)'; }
    const xb = card.querySelector('.hXpBar i'); if (xb) xb.style.width = `${xpf * 100}%`;
    const xn = card.querySelector('.hXpN'); if (xn) xn.textContent = HERO.lv >= HERO_MAX ? 'Max' : `${HERO.xp} / ${heroNeed()}`;
    const st = card.querySelector('.hStats'); if (st) st.innerHTML = hero ? STAT('hp', `${Math.ceil(hero.hp)}/${hero.maxHp}`, hpf < .35 ? 'bad' : '') + STAT('sword', `${heroDmg()}`) + STAT('speed', `×${heroSpeed()}`) : STAT('', `Back in ${Math.ceil(heroDownT)} s`, 'warn');
  }
  // the night powers sit to the right of the Heir's buttons
  const pw = $('#powers'); if (!pw.hidden) { const pn = document.querySelector('.panel').getBoundingClientRect(); pw.style.left = (pn.left + bar.offsetWidth * uiZ(bar) + 8) + 'px'; bar.style.top = pw.style.top; }
  else { const pn = document.querySelector('.panel').getBoundingClientRect(); bar.style.top = (pn.bottom + 8) + 'px'; }
  bar.style.left = document.querySelector('.panel').getBoundingClientRect().left + 'px';
}
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-hact]'); if (!b || !heroOn()) return;
  const a = b.dataset.hact;
  if (a === 'sel') { if (heroSel && hero) { target.set(hero.x, target.y, hero.z); } heroSelect(); }
  else if (a === 'close') { heroSel = false; heroMove = false; heroKey = ''; }
  else if (a === 'move') { heroMove = !heroMove; if (heroMove) { rallyFor = null; volleyAim = false; } setHint(heroMove ? 'Tap a spot' : 'Select a building'); heroKey = ''; }
  else if (a === 'recall') { setHeroFlag(null); heroMove = false; setHint('Recalled'); heroKey = ''; }
  else if (a === 'learn') heroLearn(b.dataset.k);
  else if (a === 'cry' || a === 'firm') heroCast(a);
  heroUI();
});
// the admin's switch and its helpers (testing)
function syncHeroAdmin() { const b = $('#adHero'); if (b) { b.textContent = heroOn() ? 'Heroes: On' : 'Heroes: Off'; b.classList.toggle('on', heroOn()); } const r = $('#adHeroRow'); if (r) r.hidden = !heroOn(); }
$('#adHero').addEventListener('click', () => {
  try { localStorage.setItem('mtd-dev-hero', heroOn() ? '0' : '1'); } catch (e) {}
  if (heroOn()) spawnHero(); else removeHero();
  syncHeroAdmin(); heroKey = ''; heroUI();
});
$('#adHeroLv').addEventListener('click', () => { if (HERO.lv < HERO_MAX) heroXp(heroNeed() - HERO.xp); heroUI(); });
$('#adHeroReset').addEventListener('click', () => {
  HERO = heroBlank(); saveHero(); if (hero) { const x = hero.x, z = hero.z; heroKit(hero); hero.x = x; hero.z = z; } heroKey = ''; heroUI();
});
syncHeroAdmin();
