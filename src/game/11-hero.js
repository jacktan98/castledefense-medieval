// ---------- the heroes: the Heir, the Ranger and the Captain (one in the field at a time) ----------
// One switch (mtd-dev-hero, the admin's Heroes button) turns everything here on; off, every hook below returns at once and the
// game plays exactly as before. The Heir fights on foot (on a horse once Royal horse is learnt), holds a spot in front of the castle
// (or where Move sends them), earns XP by fighting and keeps their level from stage to stage (mtd-hero); a fallen Heir comes
// back after HERO_CD s of game time, like the castle's riders. Each level brings a skill point. The skills are passive (Jack: no
// abilities in the game, like the later Kingdom Rush games) and are learnt only on the campaign's Hero screen (#heroPick).
// the Heir is part of the game for everyone now (Jack: it was a testing switch in the admin, which left the skills locked on his phone)
const heroOn = () => HEROES_ON;   // the switch is in 00-core.js
const HERO_CD = 30, HERO_MAX = 10;
// skills: rank by rank, the level each rank needs
const HERO_SK = {
  // desc: one line that never changes; vals: each rank's figure, shown as three steps on the Hero screen (Jack: the line and a
  // "Next" line repeated each other and the rows grew uneven)
  // line: the full text of a rank (the Hero screen shows the next rank's, Jack: no boxes of figures)
  // (Jack's second balance pass, the heroes were far too strong at level 10: Inspire 5/10/15%, Royal horse adds speed and health
  // as flat figures, Eagle eye +1/2/3 m, Quick draw after 5 arrows 2/3/4 quick shots, Deflect 10/20/30%)
  cry: { name: 'Inspire', line: r => `Troops nearby hit ${[5, 10, 15][r]}% harder`, desc: 'Troops nearby hit harder', vals: ['+5%', '+10%', '+15%'], req: [1, 3, 5], k: [.05, .1, .15] },
  // (Jack, after a balance check: it gave nothing in a fight, so the horse's armour adds health too, hp)
  horse: { name: 'Royal horse', line: r => `Rides a horse, +${[.5, 1, 1.5][r]} speed, +${[20, 50, 100][r]} health`, desc: 'Rides a horse, faster', vals: ['+0.5', '+1', '+1.5'], req: [2, 4, 6], k: [.5, 1, 1.5], hp: [20, 50, 100] },
  // Flurry (Jack: after every 5 slashes, a burst of 2/3/4 quick strikes)
  flurry: { name: 'Flurry', line: r => `After 5 slashes, strikes ${[2, 3, 4][r]} quick blows`, k: [2, 3, 4] },
  // the Ranger's: a second arrow, a longer reach, a faster bow
  twin: { name: 'Twin shot', line: r => `Shoots a second raider, ${[40, 70, 100][r]}% damage`, k: [.4, .7, 1] },
  eye: { name: 'Eagle eye', line: r => `Shoots ${[1, 2, 3][r]} m further`, k: [1, 2, 3] },
  // Quick draw (Jack: after every 5 arrows, a burst of 2/3/4 quick shots; it was 10 arrows, 4/6/8)
  quick: { name: 'Quick draw', line: r => `After 5 arrows, fires ${[2, 3, 4][r]} quick shots`, k: [2, 3, 4] },
  // the Captain's: troops round him take less, his blows sweep, he mends even in battle
  // Deflect (Jack: the Heir's old skill, now the Captain's in place of Shield wall): he takes less damage
  firm: { name: 'Deflect', line: r => `Takes ${[10, 20, 30][r]}% less damage`, k: [.1, .2, .3] },
  // Sweeping blow (Jack: every 5th blow, a spin of the war hammer)
  // (Jack, after a balance check: 50/75/100% beside, it was 30/50/70%: the Captain dealt half the others' damage)
  sweep: { name: 'Sweeping blow', line: r => `Every 5th blow sweeps raiders beside, ${[50, 75, 100][r]}%`, k: [.5, .75, 1] },
  // (Jack, after a balance check: halved, it was 1/2/3%: with Deflect the Captain held off the Raider Chief at 97% health)
  wind: { name: 'Second wind', line: r => `Mends ${[.5, 1, 1.5][r]}% health a second`, k: [.005, .01, .015] },
  // the Engineer's (a first pass, for Jack to review): a scorpion he sets up beside his spot that shoots on its own, repairs to
  // buildings round him, and bolts that burst
  scorp: { name: 'Field scorpion', line: r => `Sets up a scorpion beside him, ${[15, 20, 25][r]} damage round its strike`, k: [15, 20, 25] },
  mend: { name: 'Repairs', line: r => `Mends buildings nearby, ${[.5, 1, 1.5][r]}% a second`, k: [.005, .01, .015] },
  rapid: { name: 'Rapid fire', line: r => `Shoots ${[40, 70, 100][r]}% faster`, k: [.4, .7, 1] },
};
// how far a skill's look has grown (Jack: rank 1 plain, each rank showier): the hero's rank in that skill, or a gallery figure's own
// (`p.rk`, the gallery shows every skill at ranks 1, 2 and 3); only the looks read it, never the game's numbers
// a gallery figure shows its rank only in the skill it demonstrates (`rkSk`), so the Flurry figure wears no Inspire pennant
const skR = (k, v) => v && v.rk != null ? (!v.rkSk || v.rkSk === k ? v.rk : 0) : (HERO.sk[k] || 0);
// the three heroes (Jack: the Ranger and the Captain unlocked): one takes the field at a time, picked on the Hero screen; each keeps
// its own level, XP and skills (mtd-hero for the Heir, as before; mtd-hero-ranger, mtd-hero-captain), the pick in mtd-hero-pick
const HERO_DEFS = {
  // (Jack's second balance pass) level 1, then what each level adds; rate is seconds between blows or arrows; spd the walk speed
  heir: { name: 'The Heir', role: 'Knight', order: ['cry', 'flurry', 'horse'], hp: [265, 15], dmg: [16, 1], rate: 1, spd: [1, 0], hair: 1 },
  ranger: { name: 'The Ranger', role: 'Archer', order: ['twin', 'quick', 'eye'], hp: [110, 10], dmg: [6, 1], rate: 1, range: 5, spd: [1.05, .05], hair: 0 },
  captain: { name: 'The Captain', role: 'Defender', order: ['firm', 'sweep', 'wind'], hp: [375, 25], dmg: [10.5, .5], rate: 1, spd: [1, 0], hair: 3 },
  // the Engineer (Jack, 2026-11-20: from the draft, design/characters/engineer): a crossbow at a little more reach than the Ranger's bow,
  // slower and harder hitting, and sturdier
  engineer: { name: 'The Engineer', role: 'Siege', order: ['scorp', 'rapid', 'mend'], hp: [160, 10], dmg: [6, 1], rate: 1.2, range: 6, spd: [1, 0], hair: 2, xbow: true },
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
const heroHp = () => heroDef().hp[0] + heroDef().hp[1] * (HERO.lv - 1) + (HERO_ID === 'heir' && HERO.sk.horse ? HERO_SK.horse.hp[HERO.sk.horse - 1] : 0), heroDmg = () => heroDef().dmg[0] + heroDef().dmg[1] * (HERO.lv - 1);
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
// walk speed: the hero's own, what each level adds, and Royal horse's (Jack's second balance pass)
const heroSpeed = () => Math.round((heroDef().spd[0] + heroDef().spd[1] * (HERO.lv - 1) + (HERO.sk.horse ? HERO_SK.horse.k[HERO.sk.horse - 1] : 0)) * 100) / 100;
var heroHere = false, hero = null, heroDownT = 0, heroAt = null, heroFlag = null, heroMove = false, heroSel = false, heroWasNight = false;
var heroKey = '', heroBarKey = '';
const heroGold = mat('#e8b94a'); heroGold.metalness = .6; heroGold.roughness = .35;
// the Heir's look: the man-at-arms' mail and blue surcoat, sword and kite shield, but a gold crown for the helm
// the Ranger: a green hood over a leather jerkin, a quiver and a bow (no cape: Jack); the Captain: the man-at-arms' kit under a closed great
// helm with a blue plume, a dark blue cloak and a gold clasp. Head gear is marked helm, so it turns with the head (turnHead)
const HERO_HAIR = hairs[1];
const fletchM = mat('#efe6d2'), arrowWoodM = mat('#9a6b3c');
// the heroes' finer kit (Jack: more like the Engineer's): the Heir's riding boots
const heirBootM = mat('#4d3320'), heirCuffM = mat('#8a6a44'), pouchFlapM = mat('#80623f');
const rangerTunM = mat('#5b4630'), rangerGreenM = mat('#4f6e36'), rangerCloakM = mat('#3f5a2e'),
  capCloakM = teamMat(mat('#1f3d73'), 'town', '#1f3d73');
const engCoatM = quiltMat('#7a6f60', '#5f564a'), engApronM = (() => { const m = mat('#6b4a2c'); m.side = THREE.DoubleSide; return m; })(),
  engBrassM = mat('#c9a34a'), engRopeM = mat('#b59a63'), engCapM = mat('#8a5a32'),
  engGlassM = new THREE.MeshStandardMaterial({ color: '#2f5964', roughness: .15, metalness: .35 });
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
  // worn on a leg (boots, greaves): a child of the leg mesh (its hip at 0, its foot at -.4), so it moves with it
  const onLeg = (o, i) => { o.traverse(m => { if (m.isMesh) m.castShadow = true; }); v.legs[i].add(o); v.kit.push(o); return o; };
  const boots = (m, cuff) => { for (const i of [0, 1]) { onLeg(box(.114, .17, .134, m, 0, -.315, .005), i); if (cuff) onLeg(box(.13, .055, .15, cuff, 0, -.215, .005), i); } };
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
    // a pouch and a hunting knife at the belt (Jack: finer kit, like the Engineer's)
    put(box(.075, .085, .045, leatherM, .135, .43, .155)); put(box(.08, .015, .05, pouchFlapM, .135, .47, .158));
    const kn = new THREE.Group(); kn.position.set(-.18, .44, .1); kn.rotation.z = .2; put(kn);
    kn.add(box(.035, .15, .03, leatherM, 0, -.06, 0), box(.022, .07, .022, M.timber, 0, .05, 0), box(.05, .012, .03, M.iron, 0, .015, 0));
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
  } else if (id === 'engineer') {
    // the Engineer (Jack's draft): a grey-brown padded coat, a heavy leather apron with two pockets and brass rivets, a belt in the
    // town's colour, a leather work cap with ear flaps and brass goggles pushed up on it, a tool chest on his back with a coil of rope, a mallet at his hip
    // and a crossbow
    if (v.kit) v.kit.forEach(o => o.parent && o.parent.remove(o));
    v.kit = []; if (v.carryLog) v.carryLog.visible = v.carryStone.visible = false;
    if (v.apron) v.apron.visible = false;
    v.torso.material = engCoatM; v.arms.forEach(a => a.userData.sleeve.material = engCoatM);
    put(cyl(.205, .232, .2, 10, engCoatM, 0, .36, 0));
    const ap = new THREE.Mesh(new THREE.CylinderGeometry(.152, .238, .56, 12, 1, true, -Math.PI / 3, Math.PI * 2 / 3), engApronM); ap.position.y = .57; put(ap);
    for (const sx of [-1, 1]) {
      const px = sx * .085, a = Math.asin(px / .214), pz = Math.cos(a) * .214 + .006;
      const pk = box(.085, .09, .012, leatherM, px, .44, pz); pk.rotation.y = a; put(pk);
      for (const dx of [-.034, .034]) { const r = new THREE.Mesh(new THREE.SphereGeometry(.009, 6, 4), engBrassM); r.position.set(px + dx * Math.cos(a), .48, pz + .006 - dx * Math.sin(a)); put(r); }
    }
    put(cyl(.196, .196, .045, 12, kiteM, 0, .6, 0)); put(box(.04, .04, .012, engBrassM, 0, .6, .198));
    // his cap (Jack: the kettle hat didn't suit him): a padded leather work cap tipped back off the brow, a darker band round its
    // edge, flaps over the ears and the nape, and a pair of brass-rimmed goggles pushed up on its front on a leather strap
    const hat = put(head()), cap = new THREE.Group(); cap.position.y = 1.035; cap.rotation.x = -.3; hat.add(cap);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(.15, 16, 8, 0, Math.PI * 2, 0, Math.PI * .46), engCapM); dome.scale.set(1, .96, 1.04); cap.add(dome);
    const band = new THREE.Mesh(new THREE.TorusGeometry(.148, .013, 6, 28), engApronM); band.rotation.x = Math.PI / 2; band.position.y = .018; cap.add(band);
    for (const sx of [-1, 1]) { const f = box(.022, .1, .085, engCapM, sx * .143, -.035, -.012); f.rotation.z = sx * .1; cap.add(f); }
    const nape = new THREE.Mesh(new THREE.CylinderGeometry(.15, .158, .075, 14, 1, true, Math.PI * .62, Math.PI * .76), engApronM); nape.position.y = -.02; cap.add(nape);
    const strap = new THREE.Mesh(new THREE.TorusGeometry(.143, .008, 5, 28), engApronM); strap.rotation.x = Math.PI / 2; strap.position.y = .052; cap.add(strap);
    const up = new THREE.Vector3(0, 1, 0);
    for (const sx of [-1, 1]) {
      const n = new THREE.Vector3(sx * .05, .07, .14).normalize(), q = new THREE.Quaternion().setFromUnitVectors(up, n);
      const rim = cyl(.04, .04, .026, 12, engBrassM, 0, 0, 0), lens = cyl(.031, .031, .03, 12, engGlassM, 0, 0, 0);
      for (const [m, r] of [[rim, .152], [lens, .156]]) { m.quaternion.copy(q); m.position.copy(n).multiplyScalar(r); cap.add(m); }
    }
    cap.add(box(.03, .016, .016, engBrassM, 0, .076, .14));
    hat.traverse(m => { if (m.isMesh) m.castShadow = true; });
    const ch = new THREE.Group(); ch.position.set(0, .7, -.24);
    ch.add(box(.24, .22, .12, M.wood, 0, 0, 0), box(.25, .03, .13, M.timber, 0, .12, 0));
    for (const y of [-.06, .06]) ch.add(box(.25, .02, .13, M.iron, 0, y, 0));
    const coil = new THREE.Mesh(new THREE.TorusGeometry(.06, .022, 6, 14), engRopeM); coil.rotation.x = Math.PI / 2; coil.position.y = .155; ch.add(coil);
    put(ch);
    for (const sx of [-1, 1]) { put(box(.035, .3, .02, leatherM, sx * .1, .77, 0)); put(box(.035, .02, .2, leatherM, sx * .1, .92, -.09)); }
    const ml = new THREE.Group(); ml.position.set(.21, .52, .05); ml.rotation.z = .15; ml.add(box(.022, .22, .022, M.timber, 0, -.08, 0));
    const mh = cyl(.045, .045, .12, 8, M.wood, 0, .04, 0); mh.rotation.x = Math.PI / 2; ml.add(mh); put(ml); v.hipMallet = ml;
    if (v.pivot) v.pivot.parent.remove(v.pivot);
    v.toolKind = 'crossbow'; v.pivot = makeTool('crossbow'); v.arms[1].add(v.pivot);
    v.handMallet = makeTool('hammer'); v.handMallet.visible = false; v.arms[1].add(v.handMallet);
    // his crossbow slung across his back while his hands are on the scorpion (towing it, or working at it)
    v.slungXbow = makeTool('crossbow'); v.slungXbow.position.set(.02, .93, -.33); v.slungXbow.rotation.set(0, Math.PI / 2, .25); v.slungXbow.visible = false; put(v.slungXbow);
    // the scorpion taken apart, carried on his back: its timbers bound in a bundle across the chest, a wheel strapped behind them
    const bd = new THREE.Group(); bd.position.set(0, .72, -.295); bd.visible = false; bd.userData.scorpPack = true;
    const wh = cyl(.15, .15, .035, 12, M.timber, 0, 0, -.02); wh.rotation.x = Math.PI / 2; bd.add(wh);
    const hb = cyl(.035, .035, .05, 8, M.iron, 0, 0, -.03); hb.rotation.x = Math.PI / 2; bd.add(hb);
    for (const [y, a] of [[.02, .55], [-.02, -.5], [.05, .1]]) { const tm = box(.5, .04, .04, M.timber, 0, y, -.06); tm.rotation.z = a; bd.add(tm); }
    for (const x of [-.13, .13]) bd.add(box(.03, .16, .1, engRopeM, x, 0, -.05));
    bd.traverse(m => { if (m.isMesh) m.castShadow = true; }); put(bd); v.scorpPack = bd;
    v.soldier = true; v.cav = false;
  } else {
    // the Heir's horse by Royal horse's rank (Jack): a blanket at rank 1; the flank cloths from 2; at 3 gold trim on them and a steel plate down its face
    const hr = skR('horse', v);
    soldierKit(v, 3, id === 'heir' && !foot && HERO.sk.horse > 0, 1);
    if (v.horse && hr >= 3) horseArmour(v, 3, null, heroGold);   // the plate only, in the crown's gold (Jack): its flanks wear the flaps below
    for (const o of v.kit.slice()) if (o.userData && o.userData.helm) { o.parent && o.parent.remove(o); v.kit.splice(v.kit.indexOf(o), 1); }
    if (id === 'heir') {
      const c = head(); c.add(cyl(.118, .122, .055, 12, heroGold, 0, 0, 0));
      // the points stand on the band's top, a little in from its edge and turned flat to the front, so no part of their dark
      // underside pokes out through the band (Jack saw a black speck on its front)
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, p = new THREE.Mesh(new THREE.ConeGeometry(.026, .07, 4), heroGold); p.position.set(Math.sin(a) * .1, .0605, Math.cos(a) * .1); p.rotation.y = a + Math.PI / 4; c.add(p); }
      c.position.y = 1.12; put(c);
      // the Heir's shoulder plates in the crown's gold (Jack)
      for (const o of (v.armour || []).concat(v.kit)) if (o.userData && o.userData.pauldron) o.material = heroGold;
      // more than a man-at-arms with a crown (Jack: finer kit, like the Engineer's): a small gold crown on the chest, an empty
      // scabbard at the left hip with a gold tip, and tall riding boots with turned tops
      // the crown in the middle of the chest, a little above its middle (Jack: between the first spot and just under the collar)
      // straight, its middle touching the surcoat's front corner (radius .169 at this height) (Jack: bent round the corner it showed
      // gaps; at z .21 it floated in front of the chest)
      const cr2 = new THREE.Group(); cr2.position.set(0, .755, .175); put(cr2);
      cr2.add(box(.085, .025, .012, heroGold, 0, 0, 0)); for (const dx of [-.032, 0, .032]) cr2.add(box(.016, .035, .012, heroGold, dx, .028, 0));
      const sb = new THREE.Group(); sb.position.set(-.215, .5, -.02); sb.rotation.set(.55, 0, -.1); sb.userData.scabbard = true; put(sb);
      sb.add(box(.04, .34, .055, leatherM, 0, -.16, 0), box(.046, .045, .062, heroGold, 0, -.32, 0), box(.046, .03, .062, heroGold, 0, .01, 0));
      if (v.horse) sb.visible = false;
      boots(heirBootM, heirCuffM);
      if (v.horse && hr >= 2) { v.flaps = [-1, 1].map(sx => { const h = new THREE.Group(); h.position.set(sx * .2, .98, 0); h.userData.flap = sx; v.horse.add(h);
        const c = box(.02, .36, .56, capCloakM, sx * .01, -.18, -.04); c.castShadow = true; h.add(c);
        if (hr >= 3) { const t = box(.026, .045, .58, heroGold, sx * .012, -.36, -.04); h.add(t); }   // gold trim along the hem
        return h; }); } else v.flaps = null;
      // the Heir fights with the sword alone (Jack: no shield)
      for (const o of v.kit.slice()) if (o.userData && o.userData.shield) { o.parent && o.parent.remove(o); v.kit.splice(v.kit.indexOf(o), 1); }
      // Inspire from rank 2 (Jack: the Heir holds it): a tall standard in the free left hand, upright whatever the arm does
      // (`standardHold` puts it at the hand each frame), a swallow-tailed flag in the town's colour that streams and flutters
      // (`pennantWave`); bigger at rank 3
      v.pennant = null; v.standard = null;
      const cr = skR('cry', v);
      if (cr >= 2) {
        const k = cr >= 3 ? 1.25 : 1, pole = put(new THREE.Group()); pole.userData.standard = true;
        pole.add(cyl(.016, .016, 1.95, 6, M.timber, 0, .42, 0)); const fin = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), heroGold); fin.position.y = 1.42; pole.add(fin);
        const a = new THREE.Group(), b = new THREE.Group(); a.position.y = 1.36; pole.add(a); b.position.z = -.3 * k; a.add(b);
        a.add(box(.008, .34 * k, .3 * k, kiteM, 0, -.17 * k, -.15 * k));
        for (const dy of [-.07, -.27]) b.add(box(.008, .12 * k, .26 * k, kiteM, 0, dy * k, -.13 * k));   // the split tail
        pole.traverse(m => { if (m.isMesh) m.castShadow = true; }); v.pennant = [a, b]; v.standard = pole;
      }
    } else {
      put(captainHelm());
      // Deflect by rank (Jack: gear that shows the rank): the plain steel-rimmed shield; from rank 2 a steel boss and studs;
      // the four studs at rank 2, the boss in the middle added at rank 3 (Jack: no gold, no cross)
      { const sh = v.kit.find(o => o.userData && o.userData.shield), fr = skR('firm', v);
        if (sh && fr >= 2) { const m = steelM;
          if (fr >= 3) { const boss = new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 6), m); boss.scale.x = .55; boss.position.set(-.03, .04, 0); sh.add(boss); }
          for (const [y, z] of [[.15, .09], [.15, -.09], [-.07, .07], [-.07, -.07]]) { const st = new THREE.Mesh(new THREE.SphereGeometry(.016, 6, 4), m); st.position.set(-.025, y, z); sh.add(st); }
          sh.traverse(o => { if (o.isMesh) o.castShadow = true; }); } }
      // a war hammer in place of the sword (Jack); it swings with the sword's strikes
      if (v.pivot) v.pivot.parent.remove(v.pivot); v.pivot = makeTool('warhammer'); v.arms[1].add(v.pivot);
      // the cloak (Jack: make it move): four strips hinged one under the other from the shoulders, rippling like the bosses'
      // (capeWave, from the pose loop and the gallery)
      put(box(.48, .05, .1, capCloakM, 0, .88, -.13));
      let hinge = new THREE.Group(); hinge.position.set(0, .88, -.19); put(hinge); v.cape = [];
      for (let i = 0; i < 4; i++) { if (i) { const h2 = new THREE.Group(); h2.position.y = -.14; hinge.add(h2); hinge = h2; }
        const s = box(.42 + i * .02, .145, .03, capCloakM, 0, -.07, 0); s.castShadow = true; hinge.add(s); v.cape.push(hinge);
      }
    }
  }
  if (v.hatG) v.hatG.visible = false;
  // the Captain's hair is hidden under the helm; his eyes show through its open face (Jack)
  if (v.headParts) { v.headParts[1].visible = true; v.headParts[2].visible = id !== 'captain' && id !== 'engineer'; }
  v.maxHp = v.hp = heroHp();
}
// the Captain's helm (Jack's reference: a knight's close helm): a polished dome with a raised ridge from brow to nape, a pointed
// visor whose top edge leaves a dark eye slit under the brow, three breathing slits each side of its prow (the gorget was dropped:
// Jack); the same plain steel as the shoulder plates (Jack: the polished steel's reflections drew its faces in a darker grey)
const capSteelM = steelM;
// the Captain's helm (Jack's reference, drafted with him): the old helm's dome and straight drum and its ridge over the top, cut open in
// front in a T, the eyes showing under the brow and a slot down over the nose and mouth between two cheek plates, with white edging
// round the opening and the rim (straight runs with a ball at each corner, so no gaps) and four white rivets
const RID0 = .45, capTrimM = mat('#eef0f2'), capInM = new THREE.MeshLambertMaterial({ color: '#25282d', side: THREE.BackSide });
function captainHelm() {
  const S = Math.PI, R = .158, YB = .92, YT = 1.12, E1 = 1.02, KY = .95, W = .7, SL = .17, TR = .0075;
  const g = new THREE.Group(), add = (o, to = g) => { o.castShadow = true; to.add(o); return o; };
  g.userData.helm = true;
  const pt = (th, y, k = 1.006) => new THREE.Vector3(R * k * Math.sin(th), y, R * k * Math.cos(th));
  const dome = add(new THREE.Mesh(new THREE.SphereGeometry(R, 24, 10, 0, 2 * S, 0, S / 2), capSteelM)); dome.position.y = YT; dome.scale.y = KY;
  const drum = (t0, tl, y0, y1, m = capSteelM, k = 1) => { const o = add(new THREE.Mesh(new THREE.CylinderGeometry(R * k, R * k, y1 - y0, 28, 1, true, t0, tl), m)); o.position.y = (y0 + y1) / 2; return o; };
  drum(W, 2 * S - 2 * W, YB, YT);
  for (const sx of [-1, 1]) drum(sx > 0 ? SL : -W, W - SL, YB, E1);
  drum(0, 2 * S, YB, YT, capInM, .965);
  const din = add(new THREE.Mesh(new THREE.SphereGeometry(R * .965, 16, 8, 0, 2 * S, 0, S / 2), capInM)); din.position.y = YT; din.scale.y = KY;
  // the ridge, white like the edging (Jack), starting a little above the brow (Jack: it ran down to the eye opening)
  const ridge = add(new THREE.Mesh(new THREE.CylinderGeometry(R + .014, R + .014, .026, 18, 1, false, RID0, S - RID0), capTrimM)); ridge.rotation.z = S / 2; ridge.position.y = YT; ridge.scale.x = KY;
  const run = (A, n = 8) => { const P = []; for (let i = 0; i <= n; i++) P.push(A(i / n));
    add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(P), n * 2, TR, 6, false), capTrimM)); };
  const ball = p => { const b = add(new THREE.Mesh(new THREE.SphereGeometry(TR * 1.05, 8, 6), capTrimM)); b.position.copy(p); };
  run(t => pt(-W + 2 * W * t, YT), 14);
  for (const sx of [-1, 1]) {
    run(t => pt(sx * W, YT + (E1 - YT) * t));
    run(t => pt(sx * (W + (SL - W) * t), E1));
    run(t => pt(sx * SL, E1 + (YB - E1) * t));
    for (const [th, y] of [[W, YT], [W, E1], [SL, E1], [SL, YB]]) ball(pt(sx * th, y));
  }
  run(t => pt(SL + (2 * S - 2 * SL) * t, YB), 40);
  for (const th of [-.9, .9, -1.6, 1.6]) { const r = add(new THREE.Mesh(new THREE.SphereGeometry(.011, 6, 4), capTrimM)); r.position.copy(pt(th, YT + .045, 1.0)).setY(YT + .045); }
  // drawn smaller (Jack: .83, about the least before the head shows through its sides), set down onto the shoulders (Jack)
  g.scale.setScalar(.83); g.position.y = 1.03 * (1 - .83) - .025;
  return g;
}
function heroHome() { const K = castleB(); if (!K) return null; const dp = doorPoint(K), [ox, oz] = faceRot(K.face || 0, 0, 1.6); return { x: dp.x + ox, z: dp.z + oz }; }
function spawnHero() {
  const K = castleB(); if (!K || !heroOn() || hero || plainMap) return;
  const v = makeVillager(K); v.hero = true; v.summoned = true; v.inside = false; v.indoor = null; v.hideT = 0; v.g.visible = true;
  heroKit(v); v.sbar = makeBar(.6);
  const dp = doorPoint(K); v.x = v.rx = v.tx = dp.x; v.z = v.rz = v.tz = dp.z; v.g.rotation.y = faceAngle(K);
  hero = v; heroKey = '';
  if (v.cav && skR('horse') >= 3) { v.rearT = 1.3; setTimeout(() => sfx('neigh', v), 250); }   // the rear-up at Royal horse's rank 3
}
function removeHero() {
  removeScorpion();
  if (hero) { const i = villagers.indexOf(hero); if (i >= 0) villagers.splice(i, 1); scene.remove(hero.g); if (hero.sbar) scene.remove(hero.sbar.grp); }
  hero = null; setHeroFlag(null); heroSel = false; heroMove = false;
}
// a new game (startGame): a fresh Heir in front of the castle, timers and the Move flag cleared
function heroStart() {
  // a wave list left open in the last game closes (Jack saw it over the Hero screen)
  { const wp = $('#wavePop'); if (wp) wp.hidden = true; }
  hero = null; heroDownT = 0; heroMove = false; heroSel = false; heroWasNight = false; setHeroFlag(null); removeScorpion();
  if (heroOn()) spawnHero();
  // the HUD tick draws the portrait: startGame first runs while the page is still loading, before menuOn exists
  heroKey = '';
}
// a building placed where the hero stands, or over their spot, moves them (and the spot) to the nearest open ground beside it (Jack:
// the Ranger stood on inside a new site's scaffold)
function heroOff(B) {
  if (!hero || !B.ev) return; const e = B.ev, inB = p => p && p.x > e.x0 - .15 && p.x < e.x1 + .15 && p.z > e.z0 - .15 && p.z < e.z1 + .15;
  const off = (x, z) => { for (let r = .3; r < 7; r += .25) for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
    if (!inB({ x: px, z: pz }) && canStand(px, pz, 1)) return { x: px, z: pz }; } return { x, z }; };
  if (inB(heroAt)) { const p = off(heroAt.x, heroAt.z); heroAt.x = p.x; heroAt.z = p.z; if (heroFlag) heroFlag.position.set(p.x, hAt(p.x, p.z), p.z); }
  if (inB(hero)) { const p = off(hero.x, hero.z); hero.x = hero.tx = p.x; hero.z = hero.tz = p.z; hero.path = null; hero.stuck = 0; }
}
function setHeroFlag(pt) {
  if (heroFlag) { scene.remove(heroFlag); heroFlag = null; }
  heroAt = pt ? { x: pt.x, z: pt.z } : null;
  // (Jack: sent to a new spot, the Ranger kept turning back to shoot and stepping on by turns) the hero now marches there, or back
  // home on Recall, ignoring raiders until they arrive (or 15 s pass)
  if (hero) { hero.march = true; hero.marchT = 15; hero.foe = null; hero.drawing = false; }
  if (!pt) return;
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
    // now and then a blow is seen to glance off: steel sparks, a ringing clang, the shield up, the share it took off in grey
    const now = performance.now();
    if (now - (v.deflAt || 0) > 3500 && Math.random() < .5) {   // at most every 3.5 s: in a crowd it cluttered
      v.deflAt = now; v.blockAt = now; const y = walkY(v.rx, v.rz);
      v.blockFx = deflectFx(skR('firm')); if (skR('firm') >= 3) deflectShove(v, v.foe); const c = sfx('block', v); if (c && skR('firm') >= 3) c.playbackRate.value = 1.15;
      floatText('−' + Math.round(k * 100) + '%', '#c9ced6', v.rx + .5, y + 1.5, v.rz);
    }
  }
  return d;
}
// Deflect's sparks off the shield by rank: a few, more, then a bright burst (the glint was dropped: Jack, it looked cheap)
function deflectFx(r) { return w => { sparkBurst(w.x, w.y, w.z, '#eef4ff', [4, 4, 8, 14][r]); }; }
// Deflect at rank 3: the raider whose blow glanced off is thrown back a step, reeling (a flinch, as when hit)
function deflectShove(v, e) {
  if (!e || e.dead || ENEMY[e.kind].engine || ENEMY[e.kind].boss) return;
  const d = Math.hypot(e.x - v.x, e.z - v.z); if (d > 2.6 || d < .01) return;
  e.flinchAt = performance.now(); const nx = e.x + (e.x - v.x) / d * .35, nz = e.z + (e.z - v.z) / d * .35;
  if (canStand(nx, nz, 2)) { e.x = nx; e.z = nz; }
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
  if (up) { if (hero) { hero.maxHp = heroHp(); hero.hp = hero.maxHp; } banner(`${heroName()} · Lv ${HERO.lv}`, ''); log(`<b>${heroName()}</b> · Lv ${HERO.lv}`, 'good'); sfx('levelUp'); if (hero && hero.g.visible) hero.lvUpT = LVUP_T; if (achOn()) achCheck();
    if (HERO.pts > 0) tipOnce('heroPts', 'Spend skill points on the <b>Hero</b> screen in the campaign'); }
  saveHero(); heroKey = '';
}
// XP (hurtEnemy): the Heir's own kills count most, any raider slain while they stand a little
function heroKill(e, by) {
  if (!heroOn() || !hero) return;
  const E = ENEMY[e.kind];
  if (by === hero) achAdd('heroKills', 1);
  if (by === hero) heroXp(E.boss ? 60 : E.engine ? 15 : 6 * (e.tier || 1) + (E.mounted ? 3 : 0)); else heroXp(1);
}
// every hero's level, for the achievements (Seasoned Hero, Hall of Heroes)
function heroLvs() { return Object.keys(HERO_DEFS).map(id => id === HERO_ID ? HERO.lv : loadHero(id).lv); }
function heroTopLv() { return Math.max(...heroLvs()); }
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
  if ((k === 'horse' || k === 'cry' || k === 'firm') && hero) { const x = hero.x, z = hero.z, hp = hero.hp / hero.maxHp; heroKit(hero); hero.hp = hero.maxHp * hp; hero.x = x; hero.z = z; if (k === 'horse' && HERO.sk.horse === 1) sfx('neigh', hero); }
}
// the Heir's own step, day and night (updateVillagers): hold the spot, go for raiders within 7 m of it, give up on any that lead 10 m off
function updateHero(v, dt) {
  const home = heroAt || heroHome(); if (!home) return;
  v.attackT = Math.max(0, (v.attackT || 0) - dt); v.cool = (v.cool || 0) - dt;
  // Second wind: the Captain mends all the time
  if (HERO.sk.wind && v.hp < v.maxHp) { v.hp = Math.min(v.maxHp, v.hp + v.maxHp * HERO_SK.wind.k[HERO.sk.wind - 1] * dt); v.windOn = .3;
    // soft green-white specks drift up from him while Second wind mends him
    if ((v.windFx = (v.windFx || 0) - dt) <= 0) { v.windFx = [.5, .5, .25, .16][skR('wind')]; const a = Math.random() * 6.283; sparkBurst(v.rx + Math.cos(a) * .22, walkY(v.rx, v.rz) + .3 + Math.random() * .6, v.rz + Math.sin(a) * .22, '#d6ffd9', 1); }
    // rank 3 (Jack: so it differs from rank 2): small gold orbs float slowly up round him
    if (skR('wind') >= 3 && (v.orbT = (v.orbT || 0) - dt) <= 0) { v.orbT = .55; windOrb(v.rx, walkY(v.rx, v.rz), v.rz); } }
  // the Engineer and his scorpion: towed, carried or being set up, it takes his step (Jack)
  if (HERO_ID === 'engineer' && engStep(v, dt, home)) { heroMend(v, dt, null); return; }
  if (v.march) {
    if (Math.hypot(home.x - v.x, home.z - v.z) > .4 && (v.marchT -= dt) > 0) {
      v.foe = null; v.drawing = false;
      if (!gateWait(v, home.x, home.z)) walkTo(v, home.x, home.z, dt, 1, .3, 1.3 * heroSpeed() * (1 + decorFx(v.x, v.z, 'troopWalk')));
      heroMend(v, dt, null); return;
    }
    v.march = false;
  }
  if (HERO.sk.mend) heroRepair(v, dt);
  if (heroDef().range) { rangerStep(v, dt, home); return; }
  if (v.skip && (v.skip.t -= dt) <= 0) v.skip = null;
  const reachOf = e => .9 + (e.horse ? .3 : 0) + (e.engine ? ENEMY[e.kind].r : 0) + (v.cav ? .35 : 0);
  let foe = heroFoe(v, home, dt, 7, 7.5, e => Math.hypot(e.x - home.x, e.z - home.z), reachOf);
  // a foe out of reach while another raider stands within it: strike that one instead (Jack: surrounded, the Captain stood a
  // moment not striking, trying to reach a raider beyond the crowd)
  if (foe && Math.hypot(foe.x - v.x, foe.z - v.z) > reachOf(foe)) {
    let nb = null, nd = Infinity;
    for (const e of enemies) if (!e.dead && !e.dormant && (!v.skip || v.skip.e !== e)) { const d = Math.hypot(e.x - v.x, e.z - v.z); if (d <= reachOf(e) && d < nd) { nd = d; nb = e; } }
    if (nb) { foe = nb; v.foePick = .4; }
  }
  if (foe !== v.foe) v.prog = null;
  v.foe = foe; const ride = heroSpeed() * (1 + decorFx(v.x, v.z, 'troopWalk'));
  if (foe) {
    const reach = reachOf(foe), d = Math.hypot(foe.x - v.x, foe.z - v.z);
    if (d > reach) { if (gateWait(v, foe.x, foe.z)) return; walkTo(v, foe.x, foe.z, dt, 1, reach * .9, 1.25 * ride); if (v.noProg > 4) { v.skip = { e: foe, t: 4 }; v.foe = null; } }
    else { turnTo(v, Math.atan2(foe.x - v.x, foe.z - v.z), dt); if (v.cool <= 0) { const b = heroBurst(v, 'flurry', 5, .3, SWORD_T); heroStrike(v, foe);
      // Flurry at rank 3: the burst's last quick blow is a heavier finishing thrust that drives the raider back
      const fin = b === 'quick' && v.burst === 0 && HERO_ID === 'heir' && skR('flurry') >= 3; if (fin) { thrustPose(v, 0, 0); v.strike = 'thrust'; } const dm = heroDmg() * (1 + decorFx(v.x, v.z, 'troopDmg')) * heroBuff(v);
      v.quickHit = b === 'quick';
      if (b === 'start') flurryStart(v);
      // Sweeping blow: every 5th blow the Captain spins and also lands on every other raider within 1.6 m of the one he strikes
      if (v.strike === 'sweep') { const k = HERO_SK.sweep.k[HERO.sk.sweep - 1], hit = [foe];
        for (const e of enemies.slice()) if (e !== foe && !e.dead && !e.dormant && Math.hypot(e.x - foe.x, e.z - foe.z) < 1.6) { hurtEnemy(e, dm * k, v); hit.push(e); }
        sweepFx(v, hit); }
      hurtEnemy(foe, dm, v); if (fin) flurryFinish(v, foe);
      if (v.quickHit) { const fr = skR('flurry'); sparkBurst(foe.x, walkY(foe.x, foe.z) + .8 * UNIT_K, foe.z, '#ffe08a', [3, 3, 5, 7][fr]); const c = sfx('clash', v); if (c && fr >= 3) c.playbackRate.value = 1.3; sfx('whoosh', v); }
      else if (v.strike !== 'sweep') sfx('clash', v); } }
  } else if (Math.hypot(home.x - v.x, home.z - v.z) > .35) { if (!gateWait(v, home.x, home.z)) walkTo(v, home.x, home.z, dt, 1, .3, 1.3 * ride); }
  else { const K = castleB(); if (K && !heroAt) turnTo(v, faceAngle(K), dt); heroHere = true; }
  heroMend(v, dt, foe);
}
// the hero's foe (Jack: the hero ran after a raider walking past while others were attacking nearby): raiders who are fighting
// (`busyT`, set as they strike a building, a soldier or the hero) come before ones only passing by, nearer ones before further,
// checked again every .4 s and changed only for a clearly better one (never mid-blow); a foe is given up once it is past the leash
// from the hero's spot (`out`, 7.5 m for those who fight hand to hand: it was 10, so the hero chased walkers far from the spot)
function heroFoe(v, home, dt, inR, outR, far, reachOf) {
  // a raider already within the hero's reach counts as fighting too, so one at his side is never passed over for one beyond the crowd
  const score = e => { const d = Math.hypot(e.x - v.x, e.z - v.z); return d + (e.busyT > 0 || (reachOf && d <= reachOf(e)) ? 0 : 3); };
  let foe = v.foe && !v.foe.dead && !v.foe.dormant && far(v.foe) < outR ? v.foe : null;
  if (foe && ((v.foePick = (v.foePick || 0) - dt) > 0 || v.attackT > 0)) return foe;
  v.foePick = .4;
  let best = null, bs = Infinity;
  for (const e of enemies) if (!e.dead && !e.dormant && (!v.skip || v.skip.e !== e) && far(e) < inR) { const sc = score(e); if (sc < bs) { bs = sc; best = e; } }
  return foe && (!best || score(foe) <= bs + 1) ? foe : best;
}
// the Ranger: holds the spot and shoots the nearest raider in reach (never a dormant camp's), drawing first like the towers' archers;
// Twin shot sends a second arrow at another raider, Quick draw fires a burst of quick shots
function rangerStep(v, dt, home) {
  const R = heroRange();
  if (v.skip && (v.skip.t -= dt) <= 0) v.skip = null;
  const foe = heroFoe(v, home, dt, R, R + .5, e => Math.hypot(e.x - v.x, e.z - v.z));
  v.foe = foe; v.drawing = !!foe && !(v.attackT > 0) && v.cool < DRAW;
  const away = Math.hypot(home.x - v.x, home.z - v.z);
  if (away > .35) { if (!foe || v.cool > DRAW) walkTo(v, home.x, home.z, dt, 1, .3, 1.3 * heroSpeed()); }
  else if (!foe) { const K = castleB(); if (K && !heroAt) turnTo(v, faceAngle(K), dt); heroHere = true; }
  heroMend(v, dt, foe);
  if (!foe) { v.cool = Math.max(v.cool, 0); return; }
  v.walking = false; turnTo(v, Math.atan2(foe.x - v.x, foe.z - v.z), dt);
  if (v.cool > 0) return;
  const b = heroBurst(v, 'quick', 5, .2, .3); v.glinted = false;

  const xb = heroDef().xbow, dm = heroDmg() * (1 + decorFx(v.x, v.z, 'troopDmg')) * heroBuff(v), from = xb ? xbowPoint(v) : bowPoint(v);
  // the Engineer's crossbow: a short bolt; Rapid fire (Jack: in place of Blasting bolts; named Quick reload at first, but that is the crossbow tower's upgrade) shoots faster (`heroBurst`), and by rank
  // a plain bolt at 1, a higher twang and a streak of air behind it at 2, a gold bolt trailing sparks at 3
  if (xb) { const to = new THREE.Vector3(foe.x, walkY(foe.x, foe.z) + (foe.horse ? 1.2 : .8) * UNIT_K, foe.z), rr = HERO.sk.rapid ? skR('rapid') : 0;
    shotRate = rr >= 2 ? 1.15 : 0;
    // flown dead straight like a crossbow bolt (Jack: it arced like an arrow)
    const m = fireArrow(from, to, () => { if (!foe.dead) hurtEnemy(foe, dm, v); }, .001, 'qbolt'); shotRate = 0;
    if (rr >= 2) arrowStreak(m, 2);
    if (rr >= 3) { m.material = glowArrowM; glowArrows.push(m); }
    return; }
  const tr = HERO.sk.twin ? skR('twin') : 0;
  let two = null;
  if (HERO.sk.twin) { let bd = R; for (const e of enemies) if (e !== foe && !e.dead && !e.dormant) { const d = Math.hypot(e.x - v.x, e.z - v.z); if (d < bd) { bd = d; two = e; } } }
  const shoot = (e, d) => {
    const to = new THREE.Vector3(e.x, walkY(e.x, e.z) + (e.horse ? 1.2 : .8) * UNIT_K, e.z);
    // Quick draw's arrows: a quicker, higher twang, a glow and a trail of sparks, the draw hand flicking back to the quiver
    shotRate = b === 'quick' ? 1.35 : 0;
    // Twin shot at rank 3: a puff of white feathers where each of the pair strikes, so both hits show
    const fl = two && tr >= 3 && b !== 'quick';
    const m = fireArrow(from, to, () => { if (fl) featherPuff(to); if (!e.dead) hurtEnemy(e, d, v); }); shotRate = 0;
    m.geometry = ARROW_GEO; m.material = ARROW_PLAIN;   // a real arrow: shaft, steel head, white fletching (Jack: they read as sticks)
    // by rank: plain arrows at 1, gold glowing ones at 2, trailing sparks at 3
    if (b === 'quick') { const qr = skR('quick'); if (qr >= 2) m.material = ARROW_GOLD; if (qr >= 3) glowArrows.push(m); v.fanT = .2; }
    return m;
  };
  const first = shoot(foe, dm);
  if (HERO.sk.twin) {
    // by rank (Jack: no flash, both arrows alike): plain at 1, a faint streak of air behind the second arrow at 2, behind both and
    // feathers where they strike at 3
    if (two) { const m = shoot(two, dm * HERO_SK.twin.k[HERO.sk.twin - 1]);
      if (tr >= 2 && b !== 'quick') arrowStreak(m, tr); if (tr >= 3 && b !== 'quick') arrowStreak(first, tr); }
  }
}
// ---------- the Engineer's skills ----------
// Repairs: buildings within 5 m of the Engineer (standing, not building or upgrading) mend a share of their health a second, with a
// gold speck on them now and then
function heroRepair(v, dt) {
  const k = HERO_SK.mend.k[HERO.sk.mend - 1];
  for (const B of buildings) {
    if (!B.built || B.dead || B.site || B.hp >= B.max) continue;
    const c = center(B); if (Math.hypot(c.x - v.x, c.z - v.z) > 5 + (DEF[B.type].size || 1)) continue;
    B.hp = Math.min(B.max, B.hp + B.max * k * dt);
    // by rank: a gold speck now and then, more often at 2, and at 3 a ring of gold sparks round the building every 2.5 s
    const r = skR('mend');
    if ((B.mendFx = (B.mendFx || 0) - dt) <= 0) { B.mendFx = [.5, .5, .28, .2][r]; sparkBurst(c.x + (Math.random() - .5), hAt(c.x, c.z) + .4 + Math.random(), c.z + (Math.random() - .5), '#ffe08a', 1); }
    if (r >= 3 && (B.mendRing = (B.mendRing || 0) - dt) <= 0) { B.mendRing = 2.5; mendRing(c.x, hAt(c.x, c.z), c.z, (DEF[B.type].size || 1) * CELL * .6); }
  }
}
function mendRing(x, y, z, rad) { for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; sparkBurst(x + Math.cos(a) * rad, y + .15, z + Math.sin(a) * rad, '#ffd24a', 1); } }
// Field scorpion (Jack): a small ballista on a two-wheeled carriage, resting on its trail. Set up at his spot it turns to the nearest
// raider within 9 m and shoots a bolt every 3 s. Sent elsewhere (Move or Recall) he works out which is quicker (`scorpPlan`): for a
// short way he takes the handle at once and tows it at a catapult's pace (TOW_V), his crossbow slung on his back, the scorpion still
// shooting as it rolls; there he lets go and takes his crossbow out again. For a long way he takes it apart (SC_BREAK_T) into a bundle on
// his back, walks freely and builds it again where he stops (SC_BUILD_T). States (`S.st`): set, tow, pack, carried, build;
// `S.pk` 0 in pieces (on his back), 1 whole.
var engScorp = null;
const SCORP_R = 9, SCORP_T = 3, SCORP_SPLASH = 1.8, SC_BREAK_T = 6, SC_BUILD_T = 6.5, TOW_V = MOVE_SPEED, SC_REST = -.07, SCORP_BOLT = .65;   // SCORP_BOLT: its bolt drawn at that much of the ballista's
// by rank: plain at 1; at 2 iron tyres on its wheels, iron feet on its legs and a timber shield board across its front; at 3
// (signature) each bolt leaves with a puff of dust and a streak of air behind it (scorpTick)
function makeScorpion(r = 1) {
  const g = new THREE.Group();
  // everything but the wheels sits on a body hinged at the axle, so the trail lifts to his hands as he tows it
  const body = new THREE.Group(); body.position.y = .22; body.userData.scorpBody = true; g.add(body);
  const add = o => { body.add(o); return o; };
  // a look of its own at each rank (Jack): rank 1 a rough piece knocked together in the field (solid plank wheels with a batten
  // across, a rough bed lashed with rope, a small bow); rank 2 a proper carriage (spoked wheels with iron tyres, a timber bed with
  // iron corner bands, a timber shield board, a rack of spare bolts, a bigger bow); rank 3 a fine one (iron-studded wheels, the
  // bed boarded in the town's colour, the shield board painted and banded in iron, a bigger bow still; its pennant at the back was dropped: Jack)
  const fm = r >= 2 ? M.timber : M.rough;
  const wheels = [-1, 1].map(sx => { let w;
    if (r >= 2) { w = spokeWheel(.22, true, sx * .3, .22, 0, .05); g.add(w);
      if (r >= 3) for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, st = cyl(.016, .016, .07, 5, M.iron, 0, Math.sin(a) * .232, Math.cos(a) * .232); st.rotation.z = Math.PI / 2; w.add(st); }
    } else { w = new THREE.Group(); w.position.set(sx * .3, .22, 0); w.userData.wheel = true; w.userData.r = .22; g.add(w);
      const rim = cyl(.22, .22, .06, 9, M.rough, 0, 0, 0); rim.rotation.z = Math.PI / 2; w.add(rim);
      w.add(box(.08, .4, .05, M.timber, 0, 0, 0)); const hub = cyl(.045, .045, .09, 6, M.timber, 0, 0, 0); hub.rotation.z = Math.PI / 2; w.add(hub); }
    return w; });
  const axle = add(cyl(.03, .03, .64, 6, r >= 2 ? M.iron : M.timber, 0, 0, 0)); axle.rotation.z = Math.PI / 2;
  const bed = add(box(.44, .06, .42, r >= 3 ? kiteM : fm, 0, .09, .02));
  if (r === 1) for (const x of [-.17, .17]) bed.add(box(.035, .075, .44, engRopeM, x, 0, 0));
  else for (const [x, z] of [[-.2, -.18], [.2, -.18], [-.2, .22], [.2, .22]]) bed.add(box(.05, .075, .05, M.iron, x, 0, z));
  if (r >= 2) { const rk = new THREE.Group(); rk.position.set(.25, .1, .05); bed.add(rk); rk.add(box(.05, .09, .3, M.timber, 0, 0, 0));
    for (const dy of [-.025, 0, .025]) { rk.add(box(.02, .02, .42, M.timber, .035, .06 + dy, 0)); const hd = cone(.02, .06, 4, M.iron, .035, .06 + dy, .24); hd.rotation.x = Math.PI / 2; rk.add(hd); } }
  // the trail runs back to the towing handle he pulls by
  const trail = new THREE.Group(); body.add(trail);
  // a short trail (Jack: shorter): its handle at SC_HANDLE in the body's frame
  const tb = box(.09, .07, .65, fm, 0, -.02, -.35); tb.rotation.x = -.2; trail.add(tb); trail.add(box(.28, .05, .05, fm, 0, SC_HANDLE[0], SC_HANDLE[1]));
  if (r >= 2) trail.add(box(.1, .085, .05, M.iron, 0, -.06, -.5));
  // the bow on a mount kept level whichever way the carriage tips; the bow itself turns on the mount to aim
  const mount = new THREE.Group(); mount.position.set(0, .11, .02); mount.userData.mount = true; body.add(mount);
  const t = ballistaTurret(BALLISTA_K[0] * [.55, .55, .62, .68][r]); mount.add(t);
  if (r >= 2) { t.add(box(.62, .22, .035, r >= 3 ? kiteM : M.wood, 0, .36, .55)); for (const x of [-.22, .22]) t.add(box(.04, .24, .045, M.iron, x, .36, .56));
    if (r >= 3) for (const y of [.27, .45]) t.add(box(.64, .03, .04, M.iron, 0, y, .56)); }
  g.traverse(m => { if (m.isMesh) m.castShadow = true; });
  // rank 1 is dirtied and dulled like a tier-1 building, so it reads as the tier-1 ballista's dark brown (Jack)
  if (r <= 1) { let n = 0; g.traverse(o => { if (o.isMesh && !NO_TINT.has(o.material)) o.material = tinted(o.material, 1, (n++ * 5) % 6); }); }
  // the order its pieces come off as he takes it apart, and go back on as he builds it (reversed)
  const parts = [wheels[0], wheels[1], axle, bed, trail, mount];
  const S = { g, body, t, mount, wheels, parts, pk: 1, st: 'set' }; body.rotation.x = SC_REST; scorpPose(S); return S;
}
// the bow kept level as the carriage tips (resting on its trail, or lifted to his hands), a bolt laid in once it is whole
function scorpPose(S) {
  S.mount.rotation.x = -S.body.rotation.x;
  const whole = S.pk >= 1; S.t.traverse(o => { if (o.userData.bolt) o.visible = whole; });
}
// pk: how far built; each piece grows in over its own share of the build (and shrinks away the same in reverse)
function scorpParts(S, pk) {
  const n = S.parts.length;
  S.parts.forEach((p, i) => { const s = clamp(pk * n - i, 0, 1); p.visible = s > .01; p.scale.setScalar(Math.max(.01, s < 1 ? .4 + .6 * s : 1)); });
}
// it winds and looses like the town's ballista (Jack: the strings stood still and a bolt just came out): through its reload the
// winch at the back turns and hauls the slider and string back by the pulley rope, the bolt is laid in once it is drawn, and on
// the shot the slider and string fly forward; loadK 0 just loosed, 1 drawn and loaded
function scorpRig(S, loadK, dt) {
  if (!S.rig) { const R = S.rig = { statics: [] }; S.t.traverse(o => { const u = o.userData; if (u.slider) R.slider = o; if (u.bsL) R.bsL = o; if (u.bsR) R.bsR = o; if (u.prope) R.prope = o;
    if (u.trope) R.trope = o; if (u.crank) R.crank = o; if (u.bolt) R.bolt = o; if (u.staticString) R.statics.push(o); }); }
  const R = S.rig; if (!R.slider) return;
  R.statics.forEach(o => o.visible = false); if (R.trope) R.trope.visible = false;
  S.fireT = Math.max(0, (S.fireT || 0) - dt);
  const zs = S.fireT > 0 ? BAL_REST : lerp(BAL_REST, BAL_DRAWN, sstep(0, 1, loadK)), winding = S.fireT <= 0 && loadK < 1;
  R.slider.position.z = zs;
  for (const [m, sx] of [[R.bsL, -1], [R.bsR, 1]]) { rA.set(sx * BAL_TIP[0], BAL_TIP[1], BAL_TIP[2]); rB.set(0, .585, zs); setRope(m, rA, rB); }
  if (R.bolt) { R.bolt.visible = S.pk >= 1 && loadK > .97 && S.fireT <= 0; R.bolt.position.z = zs + .325; }
  if (winding && R.crank) R.crank.rotation.x -= dt * 7;
  if (R.prope) { rA.set(0, .56, -.52); rB.set(0, .585, zs - .04); setRope(R.prope, rA, rB); R.prope.visible = winding || loadK > .97; }
}
const scorpLoad = S => clamp(1 - S.cool / (SCORP_T * .85), 0, 1);
function scorpMuzzle(S) { S.g.updateMatrixWorld(true); return S.t.localToWorld(new THREE.Vector3(0, .5, .55)); }
function removeScorpion() { if (engScorp) { scene.remove(engScorp.g); if (engScorp.bar) scene.remove(engScorp.bar.grp); engScorp = null; } }
// the length of his way there, along the route he would walk
function routeLen(v, x, z) {
  const p = findPath(v.x, v.z, x, z, 1); if (!p || !p.length) return Math.hypot(x - v.x, z - v.z) * 1.15;
  let L = 0, px = v.x, pz = v.z; for (const q of p) { L += Math.hypot(q.x - px, q.z - pz); px = q.x; pz = q.z; } return L + Math.hypot(x - px, z - pz);
}
const engWalkV = v => v.speed * 1.3 * heroSpeed();
// a new spot: tow it or carry it, whichever gets it shooting there sooner (Jack)
function scorpPlan(v, S, home) {
  S.dest = { x: home.x, z: home.z };
  if (S.st === 'carried' || S.st === 'pack' || S.st === 'build') { if (S.st === 'build') S.st = 'pack'; S.mode = 'carry'; return; }
  const L = routeLen(v, home.x, home.z);
  const tow = L / TOW_V, carry = SC_BREAK_T * S.pk + L / engWalkV(v) + SC_BUILD_T;
  S.mode = tow <= carry ? 'tow' : 'carry';
  // towed (Jack: he and the scorpion used to spin round together as he set off): he first walks to the end of its trail as it
  // stands and takes the handle, then turns it slowly on its wheels toward the way out (`S.hitch`); already towing, only the turn
  if (S.mode === 'tow') { S.hitch = S.st === 'tow' && S.hitch !== 'walk' ? 'turn' : 'walk'; S.yaw = S.g.rotation.y; S.turnTo = null; }
  S.st = S.mode === 'tow' ? 'tow' : 'pack';
}
// towing: the hero's distance from the axle, the carriage's turning rate on the spot (rad/s), and the way out (the route's first
// point a little way off)
const SC_HANDLE = [-.09, -.67], TOW_R = .9, TOW_TURN = .7;
function towDir(S, home) {
  const p = findPath(S.x, S.z, home.x, home.z, 1) || [];
  const q = p.find(q => Math.hypot(q.x - S.x, q.z - S.z) > 1.6) || home;
  return Math.atan2(q.x - S.x, q.z - S.z);
}
const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
// taking the handle (`S.hitch`): true while it takes the step
function towHitch(v, S, dt, home) {
  const yaw = S.yaw, tx = -Math.sin(yaw), tz = -Math.cos(yaw);
  if (S.hitch === 'walk') {
    // to the end of its trail, then he turns his back to it
    const hx = S.x + tx * TOW_R, hz = S.z + tz * TOW_R, d = Math.hypot(hx - v.x, hz - v.z);
    if (d > .2 && !(v.noProg > 1.5) && !walkTo(v, hx, hz, dt, 1, .15, 1.3 * heroSpeed())) return true;
    v.walking = false; const psi = yaw + Math.PI; turnTo(v, psi, dt);
    if (Math.abs(wrapA(psi - v.g.rotation.y)) > .15) return true;
    S.hitch = 'turn'; v.noProg = 0; return true;
  }
  // the turn: the carriage swings round on its wheels toward the way out, slowly, while he walks round with the handle (or, with no
  // room for him to walk round, it swings round him)
  if (S.turnTo == null) S.turnTo = towDir(S, home);
  const want = S.turnTo - Math.PI, dy = wrapA(want - yaw), st = Math.sign(dy) * Math.min(Math.abs(dy), TOW_TURN * dt);
  S.yaw = wrapA(yaw + st); const nx = -Math.sin(S.yaw), nz = -Math.cos(S.yaw);
  const px = S.x + nx * TOW_R, pz = S.z + nz * TOW_R;
  if (canStand(px, pz, 1)) { v.x = px; v.z = pz; } else { S.x = v.x - nx * TOW_R; S.z = v.z - nz * TOW_R; }
  v.g.rotation.y = S.yaw + Math.PI; v.walking = Math.abs(st) > 1e-4;
  if (Math.abs(dy) < .03) { S.hitch = null; v.noProg = 0; }
  return true;
}
// the Engineer's own step while his scorpion is not set up at his spot (updateHero): true while it takes the step
function engStep(v, dt, home) {
  const S = engScorp; if (!S) return false;
  // the spot moved away from where the scorpion stands (Move or Recall): plan the trip. A short shuffle (pushed in a crowd) is
  // only a walk back to it, leaving the scorpion where it is
  const off = S.dest ? Math.hypot(home.x - S.dest.x, home.z - S.dest.z) > .6 : true;
  if (off && !(S.st === 'set' && Math.hypot(home.x - S.x, home.z - S.z) < 2.2)) scorpPlan(v, S, home);
  else if (off) S.dest = { x: home.x, z: home.z };
  const work = S.st === 'pack' || S.st === 'build';
  v.scorpWork = work ? 1 : 0; v.towing = S.st === 'tow' && S.hitch !== 'walk';
  if (S.st === 'set') return false;
  v.foe = null; v.drawing = false;
  if (work) { v.walking = false; turnTo(v, Math.atan2(S.x - v.x, S.z - v.z), dt); return true; }
  if (S.st === 'tow' && S.hitch) return towHitch(v, S, dt, home);
  // on the way: towing at a catapult's pace (the scorpion shooting as it rolls), or walking freely with it on his back
  const dh = Math.hypot(home.x - v.x, home.z - v.z);
  // there, or as near as he can get (the spot taken, or no way onto it): he stops where he stands
  const there = dh < .45 || (dh < 2.5 && v.noProg > 1.5) || v.noProg > 5 || walkTo(v, home.x, home.z, dt, 1, .3, S.st === 'tow' ? TOW_V / v.speed : 1.3 * heroSpeed());
  if (there) {
    v.march = false; v.walking = false;
    // towed there: he lets go of the handle and takes his crossbow out again (heroLooks)
    if (S.st === 'tow') { S.st = 'set'; v.towing = false; v.unslingT = .5; }
    else {
      // unpacked beside him, a little ahead and to his right, facing the way he came
      const a = v.g.rotation.y; S.x = v.x + Math.sin(a) * .5 + Math.cos(a) * .85; S.z = v.z + Math.cos(a) * .5 - Math.sin(a) * .85;
      if (!canStand(S.x, S.z, 1)) { S.x = v.x + Math.sin(a) * 1.1; S.z = v.z + Math.cos(a) * 1.1; }
      S.g.rotation.y = a; S.body.rotation.x = SC_REST; S.st = 'build'; S.pk = 0;
    }
  }
  return true;
}
function scorpTick(dt) {
  const v = hero, want = v && HERO_ID === 'engineer' && HERO.sk.scorp > 0;
  if (!want) { removeScorpion(); if (v) { v.scorpWork = 0; v.towing = false; } return; }
  if (engScorp && engScorp.rk !== skR('scorp')) {
    const o = engScorp, n = makeScorpion(skR('scorp'));
    Object.assign(n, { x: o.x, z: o.z, st: o.st, pk: o.pk, dest: o.dest, mode: o.mode, cool: o.cool, rk: skR('scorp'), bar: o.bar });
    n.g.position.copy(o.g.position); n.g.rotation.y = o.g.rotation.y; n.t.rotation.y = o.t.rotation.y; n.body.rotation.x = o.body.rotation.x;
    scene.remove(o.g); scene.add(n.g); engScorp = n; }
  // a new scorpion (the game's start, or after he falls) comes in pieces on his back: he builds it at his spot
  if (!engScorp) { const S = makeScorpion(skR('scorp')); S.rk = skR('scorp'); S.x = v.x; S.z = v.z; S.cool = 1; S.st = 'carried'; S.pk = 0; S.dest = null;
    scene.add(S.g); engScorp = S; }
  const S = engScorp, done = () => { for (let i = 0; i < 3; i++) dustAt(S.x, hAt(S.x, S.z), S.z); sfx('build', { x: S.x, z: S.z }); };
  if (S.bar && gameOver) S.bar.grp.visible = false;
  if (gameOver) return;
  if (S.st === 'pack') {
    // its pieces come off one by one, the bow first, into the bundle on his back
    S.pk = Math.max(0, S.pk - dt / SC_BREAK_T); if (S.pk <= 0) { S.st = 'carried'; done(); }
  } else if (S.st === 'build') {
    S.pk = Math.min(1, S.pk + dt / SC_BUILD_T); if (S.pk >= 1) { S.st = 'set'; S.cool = .6; done(); }
  }
  if (S.st === 'carried') { S.x = v.x; S.z = v.z; }
  else if (S.st === 'tow' && !S.hitch) {
    // in the game's step it trails behind him on its handle (heroLooks lines the handle up with his hands each frame)
    const dx = S.x - v.x, dz = S.z - v.z, d = Math.hypot(dx, dz) || 1, L = TOW_R;
    if (d > L) { const nx = v.x + dx / d * L, nz = v.z + dz / d * L; S.x = nx; S.z = nz; }
  }
  S.g.visible = S.st !== 'carried';
  if (S.st !== 'tow' || S.hitch === 'walk') { S.g.position.set(S.x, hAt(S.x, S.z), S.z); S.body.rotation.x += (SC_REST - S.body.rotation.x) * Math.min(1, dt * 8); }
  if (S.st === 'tow' && S.hitch) S.g.rotation.y = S.yaw;
  scorpPose(S); scorpParts(S, S.pk); scorpRig(S, scorpLoad(S), dt);
  if (!S.bar) S.bar = makeBar(.7);
  const prog = { pack: 1 - S.pk, build: S.pk }[S.st];
  S.bar.grp.visible = prog !== undefined; if (prog !== undefined) { S.bar.grp.position.set(S.x, hAt(S.x, S.z) + 1.25, S.z); S.bar.set(prog); }
  if (S.st !== 'set' && S.st !== 'tow') return;
  S.cool -= dt;
  let foe = null, bd = SCORP_R; for (const e of enemies) if (!e.dead && !e.dormant) { const d = Math.hypot(e.x - S.x, e.z - S.z); if (d < bd) { bd = d; foe = e; } }
  if (!foe) return;
  const want2 = Math.atan2(foe.x - S.x, foe.z - S.z) - S.g.rotation.y; let dy = want2 - S.t.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
  S.t.rotation.y += Math.sign(dy) * Math.min(Math.abs(dy), dt * 3);
  if (S.cool > 0 || Math.abs(dy) > .25) return;
  S.cool = SCORP_T; S.fireT = .35; scorpRig(S, 0, 0);
  const from = scorpMuzzle(S), dm = HERO_SK.scorp.k[HERO.sk.scorp - 1];
  // shot like the ballista's (Jack): a heavy bolt flown dead straight past the raider into the ground 1 m beyond, where it throws
  // up earth and stays stuck, slanting; it strikes an area: full damage on the raider, and every other raider within SCORP_SPLASH m
  // takes from full at the middle to half at the edge
  const dx = foe.x - from.x, dz = foe.z - from.z, dl = Math.hypot(dx, dz) || 1, dir = new THREE.Vector3(dx / dl, 0, dz / dl), L = Math.min(dl + 1, SCORP_R + 1);
  const to = from.clone().addScaledVector(dir, L); to.y = walkY(to.x, to.z);
  const m = fireArrow(from, to, () => { const cx = foe.dead ? to.x : foe.x, cz = foe.dead ? to.z : foe.z; if (!foe.dead) hurtEnemy(foe, dm, hero);
    for (const e of enemies.slice()) { if (e === foe || e.dead || e.dormant) continue; const d = Math.hypot(e.x - cx, e.z - cz);
      if (d < SCORP_SPLASH) hurtEnemy(e, dm * (1 - .5 * d / SCORP_SPLASH), hero); }
    blastFx(to.x, to.z, 1, .9); stickBolt(to, dir); stuckBolts[stuckBolts.length - 1].m.scale.setScalar(SCORP_BOLT); }, .001, (shotSnd = 'scorp', 'bolt')); shotSnd = null; m.scale.setScalar(SCORP_BOLT);
  if (S.rk >= 3) { arrowStreak(m, 2); for (let i = 0; i < 3; i++) dustAt(S.x, hAt(S.x, S.z), S.z); }
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
  // Rapid fire (the Engineer's) shortens the time between shots
  const base = heroDef().rate * (1 - decorFx(v.x, v.z, 'troopRate')) / (1 + (HERO.sk.rapid ? HERO_SK.rapid.k[HERO.sk.rapid - 1] : 0));
  if (v.burst > 0) { v.burst--; v.cool = quick; v.attackT = Math.min(at, quick); v.atkK = at / v.attackT; return 'quick'; }
  v.cool = base; v.attackT = at; v.atkK = 1;
  if (HERO.sk[sk] && (v.hitN = (v.hitN || 0) + 1) >= n) { v.hitN = 0; v.burst = HERO_SK[sk].k[HERO.sk[sk] - 1]; v.cool = Math.min(base, .35); return 'start'; }
  return '';
}
// ---------- the skills' effects (Jack: make Flurry, Quick draw and Sweeping blow show) ----------
// (the skill's icon over the hero as it fired was dropped: Jack) Flurry: a glint at the sword's tip as the burst winds up, "×N" for the blows to come; each quick blow
// leaves a gold trail behind the blade and sparks on the raider. Quick draw: a glint on the bow before the 5th arrow,
// glowing arrows with a trail of sparks and a higher twang, the hand flicking back to the quiver. Sweeping blow: a steel
// arc behind the hammer, a ring of dust, the raiders it catches knocked back, the cloak flared and a heavier blow's sound.
var shotRate = 0;
// a shot's own sound in place of its kind's (the scorpion's bolt looks like a crossbow bolt but sounds its own: Jack)
var shotSnd = null;
const glowArrowM = new THREE.MeshBasicMaterial({ color: '#ffd36a', toneMapped: false }), glowArrows = [], heroSprites = [];
// the Ranger's arrow (Jack: the plain sticks didn't look like arrows): a shaft, a four-sided steel head and two crossed white
// vanes, one geometry with a group per material; Quick draw's gold one glows (ARROW_GOLD)
const ARROW_GEO = (() => {
  const parts = [[new THREE.BoxGeometry(.022, .022, .56), 0, -.03], [new THREE.ConeGeometry(.032, .1, 4), 1, .3], [new THREE.BoxGeometry(.004, .075, .15), 2, -.24], [new THREE.BoxGeometry(.075, .004, .15), 2, -.24]];
  const pos = [], nor = [], g = new THREE.BufferGeometry(); let at = 0;
  for (const [geo0, mi, z] of parts) {
    const geo = geo0.index ? geo0.toNonIndexed() : geo0;
    if (mi === 1) geo.rotateX(Math.PI / 2);   // the cone's tip along +z, the way the arrow flies (lookAt)
    geo.translate(0, 0, z); const n = geo.attributes.position.count;
    pos.push(...geo.attributes.position.array); nor.push(...geo.attributes.normal.array); g.addGroup(at, n, mi); at += n;
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return g;
})();
const ARROW_PLAIN = [arrowWoodM, steelM, fletchM];
const ARROW_GOLD = [glowArrowM, new THREE.MeshBasicMaterial({ color: '#fff0b8', toneMapped: false }), new THREE.MeshBasicMaterial({ color: '#fff6dc', toneMapped: false })];
// Twin shot's streak of air behind an arrow (rank 2 the second arrow, rank 3 both): a thin pale ribbon turned to face the camera,
// fading behind it; `alive` tells whether the arrow still flies (the game's arrows or the gallery's)
const streaks = [];
function arrowStreak(m, r, alive) {
  if (!m) return;
  const N = 12, geo = new THREE.BufferGeometry(), idx = [];
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3)); geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 6), 3));
  for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } geo.setIndex(idx);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  mesh.frustumCulled = false; mesh.renderOrder = 6; fxScene().add(mesh);
  streaks.push({ m, mesh, N, pts: [{ p: m.getWorldPosition(new THREE.Vector3()), t: performance.now() }], k: r >= 3 ? .6 : .42, w: r >= 3 ? .014 : .01, alive: alive || (() => arrows.some(a => a.m === m)) });
}
const _sd = new THREE.Vector3(), _sc = new THREE.Vector3(), _ss = new THREE.Vector3();
function streakTick() {
  const now = performance.now(), LIFE = 260;
  for (let n = streaks.length - 1; n >= 0; n--) {
    const S = streaks[n], fly = S.alive();
    if (fly) { const p = S.m.getWorldPosition(new THREE.Vector3()), q = S.pts[0];
      if (q) { _sd.subVectors(p, q.p); if (_sd.lengthSq() > 1e-6) { _sc.subVectors(camera.position, p); _ss.crossVectors(_sd, _sc).normalize(); S.side = _ss.clone().multiplyScalar(S.w); } }
      S.pts.unshift({ p, t: now }); }
    while (S.pts.length > S.N || (S.pts.length && now - S.pts[S.pts.length - 1].t > LIFE)) S.pts.pop();
    if (!fly && !S.pts.length) { unparent(S.mesh); S.mesh.geometry.dispose(); S.mesh.material.dispose(); streaks.splice(n, 1); continue; }
    const P = S.mesh.geometry.attributes.position.array, C = S.mesh.geometry.attributes.color.array;
    const sd = S.side || new THREE.Vector3(S.w, 0, 0);
    S.pts.forEach((q, i) => { q.s = sd; const k = Math.max(0, 1 - (now - q.t) / LIFE) * (1 - i / S.N) * S.k, w = 1 - i / S.N;
      P.set([q.p.x + q.s.x * w, q.p.y + q.s.y * w, q.p.z + q.s.z * w, q.p.x - q.s.x * w, q.p.y - q.s.y * w, q.p.z - q.s.z * w], i * 6);
      C.set([.9 * k, .94 * k, k, .9 * k, .94 * k, k], i * 6); });
    S.mesh.geometry.setDrawRange(0, Math.max(0, S.pts.length - 1) * 6);
    S.mesh.geometry.attributes.position.needsUpdate = S.mesh.geometry.attributes.color.needsUpdate = true;
  }
}
const SPEAR_LINE = [new THREE.Vector3(0, -.7, 0), new THREE.Vector3(0, -1.15, 0)];
// the standard held in the left hand: the arm a little forward and out, the pole stood upright at the hand (in the body's frame)
const _hand = new THREE.Vector3();
function standardHold(v) {
  const s = v.standard; if (!s) return;
  const a = v.arms[0]; a.rotation.set(-.45, 0, .14);
  a.updateWorldMatrix(true, false); a.localToWorld(_hand.set(0, -.33, 0)); v.body.worldToLocal(_hand);
  s.position.copy(_hand); s.rotation.set(.06, 0, 0);
}
// Inspire's pennant (rank 2+) fluttering, faster on the move
function pennantWave(v, now, mv) {
  const [a, b] = v.pennant, f = mv ? 150 : 260;
  a.rotation.y = Math.sin(now / f) * (mv ? .28 : .16); b.rotation.y = Math.sin(now / (f * .7) + 1.2) * (mv ? .5 : .3);
}
// Second wind's breath (Jack: the legs stay still, only the body breathes; the arms barely move): b is the breath (0-1); the
// shoulders' sideways turn and lift go on as changes since the last frame, as the pose loop never resets them
function windPose(v, r, b) {
  const dz = (r >= 2 ? .05 : .03) * b - (v.breathZ || 0); v.arms[0].rotation.z += dz; v.arms[1].rotation.z -= dz; v.breathZ = (v.breathZ || 0) + dz;
  const dy = (r >= 2 ? .025 : .012) * b - (v.breathY || 0); v.arms.forEach(a => { a.position.y += dy; }); v.breathY = (v.breathY || 0) + dy;
  v.torso.scale.y = 1 + (r >= 2 ? .06 : .03) * b;
}
const BOW_LINE = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, .35, 0)], SWORD_LINE = [new THREE.Vector3(0, -.12, 0), new THREE.Vector3(0, -.64, 0)], HAMMER_LINE = [new THREE.Vector3(0, -.5, 0), new THREE.Vector3(0, -.72, 0)];
function sparkBurst(x, y, z, color = '#ffe9a8', n = 6) {
  for (let i = 0; i < n && puffs.length < 170; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emberTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    sp.position.set(x + (Math.random() - .5) * .2, y + Math.random() * .15, z + (Math.random() - .5) * .2); sp.scale.setScalar(.07);
    fxScene().add(sp); puffs.push({ sp, t: 0, life: .25 + Math.random() * .25, dx: (Math.random() - .5) * 2, ember: true });
  }
}
// Second wind's gold orb (rank 3): a small glowing sphere that drifts up round the Captain, circling a little, and fades
function windOrb(x, y, z) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emberTex, color: '#ffb21e', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  sp.renderOrder = 6; fxScene().add(sp); heroSprites.push({ sp, t: 0, life: 1.8, kind: 'orb', x, y, z, a: Math.random() * 6.283 });
}
// a soft star that swells and fades where a weapon glints (follow: a function giving its place each frame)
function glintAt(at, color, follow) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emberTex, color, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  sp.position.copy(at); sp.renderOrder = 25; fxScene().add(sp); heroSprites.push({ sp, t: 0, life: .4, kind: 'glint', follow });
}
// "×N" for the quick blows to come at every rank (×2, ×3, ×4: Jack; the glint at the tip was dropped, the finishing thrust took its place)
function flurryStart(v) {
  const r = skR('flurry'); if (r < 1) return;
  floatText('×' + v.burst, '#ffd768', v.x + .7, walkY(v.x, v.z) + 1.25, v.z);
}
// Flurry's finishing thrust (rank 3): the raider driven back .45 m with dust at its feet, a low clash and a small shake
function flurryFinish(v, e) {
  const y = walkY(e.x, e.z); for (let i = 0; i < 4; i++) dustAt(e.x + (Math.random() - .5) * .5, y, e.z + (Math.random() - .5) * .5);
  const c = sfx('clash', v); if (c) c.playbackRate.value = .8; shake(.03, v);
  if (e.dead || ENEMY[e.kind].engine || ENEMY[e.kind].boss) return;
  const d = Math.hypot(e.x - v.x, e.z - v.z) || 1, nx = e.x + (e.x - v.x) / d * .45, nz = e.z + (e.z - v.z) / d * .45;
  e.flinchAt = performance.now(); if (canStand(nx, nz, 2)) { e.x = nx; e.z = nz; }
}
// by rank: 1 a small puff of dust, 2 a ring of dust (and the steel trail, heroFxRun), 3 a wider ring, the cloak flared and a small shake
function sweepFx(v, hit) {
  const y = walkY(v.x, v.z), r = skR('sweep'), n = [6, 6, 12, 16][r], rad = [.5, .5, .75, .95][r];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; dustAt(v.x + Math.cos(a) * rad, y, v.z + Math.sin(a) * rad); }
  if (r >= 3) shake(.04, v);
  // the raiders it catches are knocked back (drawn sliding: their drawn place eases after the real one)
  for (const e of hit) { if (e.dead || ENEMY[e.kind].engine || ENEMY[e.kind].boss) continue;
    const d = Math.hypot(e.x - v.x, e.z - v.z) || 1, nx = e.x + (e.x - v.x) / d * .5, nz = e.z + (e.z - v.z) / d * .5;
    if (canStand(nx, nz, 2)) { e.x = nx; e.z = nz; } }
  const c = sfx('clash', v, 1.6); if (c) c.playbackRate.value = .72; sfx('ramHit', v, .95); sfx('hammerSwing', v);
}
// each frame: the weapon trails, the glints and icons, the glowing arrows' sparks
const heroTrails = new Map(); var trailFrame = 0;
function heroTrail(v, line, color, on) {
  let T = heroTrails.get(v);
  if (!T) {
    const N = 14, geo = new THREE.BufferGeometry(), idx = [];
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3)); geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 6), 3));
    for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } geo.setIndex(idx);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    m.frustumCulled = false; m.renderOrder = 6; fxScene().add(m); T = { m, N, pts: [] }; heroTrails.set(v, T);
  }
  T.seen = trailFrame;
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
// the Ranger's reach ring, draped over the ground like a tower's range (Jack: a flat ring at his feet sank under any higher
// ground, so on hills only bits of it showed); its band is rebuilt only when he moves or his reach changes
let reachR = null;
function reachRing(v, r, op) {
  const SEG = 128;
  if (!reachR) {
    const g = new THREE.BufferGeometry(), idx = [];
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SEG * 2 * 3), 3));
    for (let i = 0; i < SEG; i++) { const a = i * 2, b = ((i + 1) % SEG) * 2; idx.push(a, a + 1, b, b, a + 1, b + 1); } g.setIndex(idx);
    reachR = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: '#8fc1db', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, blending: THREE.AdditiveBlending }));
    reachR.frustumCulled = false; reachR.renderOrder = 4; reachR.userData.op = 0;
  }
  if (!reachR.parent) fxScene().add(reachR);
  const u = reachR.userData; u.op += ((op || 0) - u.op) * .15; reachR.material.opacity = u.op; reachR.visible = u.op > .01;
  if (!reachR.visible || !v) return;
  const key = v.rx.toFixed(2) + ',' + v.rz.toFixed(2) + ',' + r + ',' + MAP;
  if (u.key === key) return; u.key = key;
  const p = reachR.geometry.attributes.position.array;
  for (let i = 0; i < SEG; i++) { const a = i / SEG * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
    for (let k = 0; k < 2; k++) { const rr = r - .1 + k * .1, x = clamp(v.rx + c * rr, 0, SIZE), z = clamp(v.rz + sn * rr, 0, SIZE), j = (i * 2 + k) * 3;
      p[j] = x; p[j + 1] = Math.max(walkY(x, z), 0) + .12; p[j + 2] = z; } }
  reachR.geometry.attributes.position.needsUpdate = true;
}
const eagleM = mat('#4a3220'), eagleDarkM = mat('#2e1f14'), eagleWhiteM = mat('#f1ede2'), eagleBeakM = mat('#e7b23a'), hawkHeadM = mat('#6b4a2c'), hawkBeakM = mat('#8a8274');
// Eagle eye's eagle (Jack: it looked like any bird): a bald eagle seen from below and the side: dark brown body and broad wings,
// fingered primaries splayed at the tips, white head and fanned white tail, a hooked yellow beak and yellow talons tucked under.
// Its forward is +z, like `makeBird`; `flap(k)` beats the wings, the outer half bending further
// hawk: Eagle eye's rank 1, a plain brown hawk (no white head or tail, a grey beak and feet)
function makeEagle(hawk) {
  const g = new THREE.Group(), add = (m, ...a) => { const b = box(...a.slice(0, 3), m, ...a.slice(3)); g.add(b); return b; };
  const headM = hawk ? hawkHeadM : eagleWhiteM, tailM = hawk ? eagleM : eagleWhiteM, beakM = hawk ? hawkBeakM : eagleBeakM;
  add(eagleM, .15, .13, .4, 0, 0, 0);                                    // body
  add(eagleM, .12, .11, .1, 0, -.01, .22);                               // shoulders into the neck
  add(headM, .11, .1, .12, 0, .03, .3);                                  // the head (an eagle's white)
  add(beakM, .05, .05, .07, 0, .01, .39);                                // beak
  add(beakM, .03, .04, .03, 0, -.025, .42);                              // its hooked tip
  for (const sx of [-1, 1]) add(eagleDarkM, .012, .02, .02, sx * .056, .05, .34);   // eyes
  for (const a of [-.35, 0, .35]) { const f = add(tailM, .07, .02, .2, Math.sin(a) * .06, .01, -.28); f.rotation.y = a; }   // tail fan
  for (const sx of [-1, 1]) add(beakM, .04, .05, .07, sx * .04, -.08, -.02);   // talons tucked under
  const wings = [-1, 1].map(sx => {
    const w = new THREE.Group(); w.position.set(sx * .07, .03, .04); g.add(w);
    w.add(box(.34, .025, .22, eagleM, sx * .17, 0, 0));                  // inner wing
    const o = new THREE.Group(); o.position.x = sx * .34; w.add(o);
    o.add(box(.24, .022, .18, eagleM, sx * .12, 0, -.01));               // outer wing
    for (let i = 0; i < 5; i++) { const f = box(.16, .015, .035, eagleDarkM, sx * .3, 0, .06 - i * .042); f.rotation.y = -sx * (i - 2) * .12; o.add(f); }   // primaries
    w.userData.outer = o; return w;
  });
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { g, wings, hawk: !!hawk, flap: k => wings.forEach((w, i) => { const sg = i ? -1 : 1; w.rotation.z = sg * (k - .06); w.userData.outer.rotation.z = sg * (k * .7 + .04); }) };
}
let eagle = null, eagleA = 0, eagleK = 0;
const EAGLE_K = .6;
// a puff of white and brown feathers where the eagle appears or vanishes
// a puff of white feathers (Twin shot's hits at rank 3): small pale wisps that drift and fade
function featherPuff(p) {
  for (let i = 0; i < 6; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: i < 4 ? '#f6f2e8' : '#d9cfb8', transparent: true, depthWrite: false, opacity: 0 }));
    sp.position.set(p.x + (Math.random() - .5) * .3, p.y + (Math.random() - .3) * .25, p.z + (Math.random() - .5) * .3); sp.scale.setScalar(.12);
    fxScene().add(sp); puffs.push({ sp, t: 0, life: .45 + Math.random() * .3, dx: (Math.random() - .5) * .8, dust: true, k: .55 });
  }
}
function eaglePoof(p) {
  for (let i = 0; i < 11; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: i < 7 ? '#f3efe4' : '#7a5a3a', transparent: true, depthWrite: false, opacity: 0 }));
    sp.position.set(p.x + (Math.random() - .5) * .7, p.y + (Math.random() - .5) * .4, p.z + (Math.random() - .5) * .7); sp.scale.setScalar(.3);
    fxScene().add(sp); puffs.push({ sp, t: 0, life: .55 + Math.random() * .4, dx: (Math.random() - .5) * 1.4, dust: true, k: 1.3 });
  }
  sparkBurst(p.x, p.y, p.z, '#fff6d8', 6);
}
// towing (heroLooks, after the pose loop): he leans into it, both hands reaching back to the handle, and the scorpion's trail is lifted
// on its axle to his hands, the carriage hanging behind him and rolling on its wheels
function scorpPull(v, S) {
  v.body.rotation.x = .16;
  v.arms[0].rotation.set(.62, 0, .2); v.arms[1].rotation.set(.62, 0, -.2);
  v.g.updateMatrixWorld(true);
  const h = new THREE.Vector3(.012, -.33, 0), h0 = v.arms[0].localToWorld(h.clone()), h1 = v.arms[1].localToWorld(h.clone()), H = h0.add(h1).multiplyScalar(.5);
  // the carriage trails its handle like a cart (Jack: it used to swing round rigidly with him): it points from his hands back to
  // where its axle was; while he takes the handle and turns it, its own slow turn (`S.yaw`)
  const phi = S.hitch ? S.yaw : Math.atan2(S.x - H.x, S.z - H.z), gx = () => S.g.position.x, gz = () => S.g.position.z;
  // the trail's lift: its handle (in the body's frame (0, SC_HANDLE)) up to his hands' height
  let gy = hAt(S.x, S.z), th = 0;
  for (let i = 0; i < 2; i++) {
    const want = clamp(H.y - gy - .22, -.15, .7);
    const [hy, hz] = SC_HANDLE, hr = Math.hypot(hy, hz);
    th = Math.atan2(-hy, -hz) + Math.asin(clamp(want / hr, -1, 1));
    const zl = hy * Math.sin(th) + hz * Math.cos(th), px = H.x - zl * Math.sin(phi), pz = H.z - zl * Math.cos(phi);
    gy = hAt(px, pz); S.g.position.set(px, gy, pz);
  }
  const moved = Math.hypot(gx() - S.x, gz() - S.z); if (moved < .5) S.wheels.forEach(w => { w.rotation.x -= moved / .22; });
  if (!S.hitch) { S.x = gx(); S.z = gz(); } S.g.rotation.y = phi; S.body.rotation.x = th; scorpPose(S);
  if (S.bar) S.bar.grp.visible = false;
}
const LVUP_T = 1.8;
var lvOwner = null;
function heroLooks(dt, now) {
  const v = hero, on = v && v.g.visible;
  // the Engineer kneels at his scorpion while he sets it up or packs it, his free hand working at it
  const work = on && !gameOver && HERO_ID === 'engineer' && v.scorpWork > 0, tow = on && HERO_ID === 'engineer' && v.towing && engScorp;
  const stow = tow || (on && HERO_ID === 'engineer' && engScorp && engScorp.st === 'tow');
  // let go of the handle: his right hand goes over his shoulder for the crossbow and brings it round (half a second)
  const un = on && v.unslingT > 0 ? 1 - (v.unslingT = Math.max(0, v.unslingT - dt)) / .5 : -1;
  if (v && v.handMallet) { v.handMallet.visible = work; if (v.pivot) v.pivot.visible = !work && !stow && (un < 0 || un > .5); if (v.hipMallet) v.hipMallet.visible = !work;
    if (v.slungXbow) v.slungXbow.visible = work || stow || (un >= 0 && un <= .5);
    if (v.scorpPack) { const S = engScorp, st = S && S.st; v.scorpPack.visible = !!S && (st === 'carried' || ((st === 'pack' || st === 'build') && S.pk < .5)); } }
  if (tow) scorpPull(v, engScorp);
  if (un >= 0 && !tow && !work) v.arms[1].rotation.set(-2.7 * Math.sin(Math.PI * un), 0, -.25 * Math.sin(Math.PI * un));
  if (work) {
    kneel(v, .75);
    const p = (now / 1000 / .55) % 1, w = stroke(p);
    v.arms[1].rotation.set(-1.25 + w * .85, 0, 0); v.handMallet.rotation.x = -.95; v.arms[0].rotation.set(-.75, 0, .15);
    // each blow lands with a knock, splinters and a little dust at the scorpion
    if (w > .85 && !v.malletHit) { v.malletHit = true; sfx('hammer', v); chipBurst(v, 'hammer', p > .5);
      if (engScorp) dustAt(engScorp.x, hAt(engScorp.x, engScorp.z), engScorp.z); }
    if (w < .5) v.malletHit = false;
  }
  // Inspire
  const insp = on && HERO_ID === 'heir' && HERO.sk.cry, mates = insp ? villagers.filter(u => u.soldier && !u.hero && u.g.visible && Math.hypot(u.x - v.x, u.z - v.z) < 7) : [];
  const ringOn = insp && (mates.length || v.foe);
  if (ringOn) {
    // by rank: a gold spark now and then (.8 s apart), two every .5 s (and the pennant on the Heir's back), then two every .3 s and
    // a faint gold trail behind every inspired troop's blow (the glint, then sparks, on the Heir's sword were dropped: Jack)
    const cr = skR('cry');
    if (mates.length && (v.crySpark = (v.crySpark || 0) - dt) <= 0) { v.crySpark = [.8, .8, .5, .3][cr]; const u = mates[Math.floor(Math.random() * mates.length)];
      if (u.pivot) { const w = u.pivot.getWorldPosition(new THREE.Vector3()); sparkBurst(w.x, w.y - .1, w.z, '#ffd24a', cr >= 2 ? 2 : 1); } }
    if (cr >= 3) for (const u of mates) heroTrail(u, u.toolKind === 'spear' ? SPEAR_LINE : SWORD_LINE, '#a88a30', u.attackT > 0);
  }
  if (v && v.pennant) { standardHold(v); pennantWave(v, now, v.walking); }
  // Royal horse
  if (on && v.cav) {
    const ry = v.g.rotation.y, mv = v.walking || (v.amp || 0) > .2;
    if (mv && (v.hoofT = (v.hoofT || 0) - dt) <= 0) { v.hoofT = [.18, .18, .1, .07][skR('horse')];   // light dust at rank 1, more at 2 and 3
      dustAt(v.rx - Math.sin(ry) * .7, walkY(v.rx, v.rz), v.rz - Math.cos(ry) * .7); }
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
  // (the eagle fades out over a second or so: with the Ranger fallen mid-fade there is no one to circle, so it goes at once;
  // it used to read the fallen hero's place and the error stopped the whole game: Jack)
  // (Jack: smaller, and a poof as it comes and goes: it now appears and vanishes in a puff of feathers where it circles, popping
  // up to size, rather than flying down and fading; with the Ranger fallen it goes at once)
  if (!v || gameOver) eagleK = 0;
  if (eagleK > .02) {
    // by rank (Jack): a plain brown hawk circling high at rank 1, the bald eagle at 2, a bigger eagle at 3
    const er = skR('eye'), hawk = er < 2;
    if (eagle && eagle.hawk !== hawk) { unparent(eagle.g); eagle = null; }
    if (!eagle) eagle = makeEagle(hawk);
    if (!eagle.g.parent) scene.add(eagle.g);
    eagleA += dt * .55; const y = walkY(v.rx, v.rz) + (hawk ? 6 : 5);
    eagle.g.position.set(v.rx + Math.cos(eagleA) * 3, y + Math.sin(eagleA * 2) * .3, v.rz + Math.sin(eagleA) * 3);
    // now and then it cries as it circles (Jack: no dive at the raiders any more, it only circles the Ranger)
    if ((v.cryT = (v.cryT == null ? 8 + Math.random() * 10 : v.cryT) - dt) <= 0) { v.cryT = 12 + Math.random() * 12; sfx('eagle', eagle.g.position); }
    eagle.g.rotation.set(0, -eagleA, .35); eagle.g.scale.setScalar(EAGLE_K * [.75, .75, 1, 1.15][er] * Math.min(1, eagleK * 4));
    if (!eagle.g.visible) { eagle.g.visible = true; eaglePoof(eagle.g.position); sfx('eagle', eagle.g.position); }
    eagle.flap(Math.sin(now / 1000 * 2.2) > .55 ? Math.sin(now / 110) * .45 : 0);
  } else if (eagle && eagle.g.visible) { eagle.g.visible = false; eaglePoof(eagle.g.position); }
  reachRing(v, heroDef().range ? heroRange() : 1, on && heroDef().range && heroSel ? .45 : 0);
  // a gold ring at the hero's feet while picked (Jack: so players see they are controlling them), pulsing gently; wider on a horse
  const sr = heroRing(v && v.cav ? 'selH' : 'sel', v && v.cav ? .8 : .5, '#f2d98a', on && heroSel ? .26 + .05 * Math.sin(now / 320) : 0);
  heroRing(v && v.cav ? 'sel' : 'selH', v && v.cav ? .5 : .8, '#f2d98a', 0); sr.material.blending = THREE.NormalBlending;
  // a level gained: a column of gold light rises round the hero with sparks spiralling up (the gold ring that spread on the ground was dropped: Jack),
  // and the hero hops with the weapon raised (Jack)
  // a hero left behind (a new game, or fallen) takes its light column with it (Jack: levelled up from the admin, then a new game
  // showed the column standing where the old hero had been)
  if (lvOwner && lvOwner !== v) { if (lvOwner.lvBeam) unparent(lvOwner.lvBeam); lvOwner.lvUpT = 0; }
  lvOwner = v;
  if (v) lvUpFx(v, dt, now, HERO_ID, 'lvup');
  // Second wind: the portrait's health bar pulses while it mends him; a slow breath every few seconds
  // by rank: a few specks, more, then more still and the portrait's bar pulses (Jack: the green glow round him was dropped)
  const wr = HERO_ID === 'captain' ? skR('wind') : 0;
  const hb = document.querySelector('#heroBar .hpb'); if (hb) hb.classList.toggle('mend', !!(v && v.windOn > 0 && wr >= 3));
  if (v && v.windOn > 0) v.windOn -= dt;
  // by rank: a slow breath every 4 s, a deeper and longer one with the shoulders rising from 2 (windPose; the body no longer lifts,
  // so the legs stay put, and the arms barely move: Jack; resting on the hammer at rank 3 was dropped: Jack)
  if (on && HERO_ID === 'captain') {
    const r = HERO.sk.wind ? wr : 0, D = r >= 2 ? 1.4 : .9; let b = 0;
    if (r && !(v.attackT > 0)) {
      if ((v.breathIn = (v.breathIn == null ? 4 : v.breathIn) - dt) <= 0) { v.breathIn = 4; v.breathT = D; }
      if (v.breathT > 0) { v.breathT -= dt; b = Math.sin(Math.PI * Math.max(0, 1 - v.breathT / D)); }
    } else v.breathT = 0;
    windPose(v, r, b);
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
    if (f > .08 && !v.lvGlint && v.pivot) { v.lvGlint = true; const tip = () => v.pivot.localToWorld((id === 'captain' ? HAMMER_LINE : id === 'ranger' ? BOW_LINE : SWORD_LINE)[1].clone()); glintAt(tip(), '#fff4c0', tip); }
    // a quick hop (a third of a second, a real jump's curve) and the weapon snapped up, held and lowered (Jack: slow, it looked like floating)
    if (!(v.attackT > 0)) { const t = LVUP_T - v.lvUpT, u = (t - .05) / .34;
      if (!v.cav && u > 0 && u < 1) v.g.position.y += .26 * 4 * u * (1 - u);
      const a = t < .12 ? t / .12 : t < .95 ? 1 : Math.max(0, 1 - (t - .95) / .2);
      v.arms[1].rotation.x += (-2.9 - v.arms[1].rotation.x) * a; }
    if (v.lvUpT <= 0) { v.lvGlint = false; lvBeam.visible = false; }
  } else if (v.lvBeam) v.lvBeam.visible = false;
}
let heroFxErr = false;
function heroFx(dt) {
  // the heroes' looks only change what is drawn: an error in them must never stop the game's loop (the Ranger falling while
  // the eagle faded froze the game: Jack), so it is caught, logged once and the frame goes on
  try { heroFxRun(dt); } catch (err) { if (!heroFxErr) { heroFxErr = true; console.warn('hero effects:', err); } }
}
function heroFxRun(dt) {
  trailFrame++;
  heroLooks(dt, performance.now());
  if (hero) {
    // the trail from rank 2 (dimmer there), full at rank 3
    const tr = skR(HERO_ID === 'captain' ? 'sweep' : 'flurry');
    heroTrail(hero, HERO_ID === 'captain' ? HAMMER_LINE : SWORD_LINE, HERO_ID === 'captain' ? (tr >= 3 ? '#ffd24a' : '#7e848c') : (tr >= 3 ? '#ffd24a' : '#8c7228'),
      tr >= 2 && hero.attackT > 0 && (hero.quickHit || hero.strike === 'sweep'));
    if (hero.fanT > 0) hero.fanT -= dt;
  }
  for (const [v, T] of heroTrails) if (T.seen !== trailFrame) { unparent(T.m); T.m.geometry.dispose(); heroTrails.delete(v); }
  heroSpriteTick(dt); streakTick();
  for (let n = glowArrows.length - 1; n >= 0; n--) { const m = glowArrows[n];
    if (!arrows.some(a => a.m === m)) { glowArrows.splice(n, 1); continue; }
    sparkBurst(m.position.x, m.position.y - .05, m.position.z, '#ffd36a', 1); }
}
// the glints (the game's and the gallery's)
function heroSpriteTick(dt) {
  for (let n = heroSprites.length - 1; n >= 0; n--) {
    const s = heroSprites[n]; s.t += dt; const f = s.t / s.life;
    if (f >= 1) { unparent(s.sp); s.sp.material.dispose(); heroSprites.splice(n, 1); continue; }
    if (s.kind === 'orb') { const a = s.a + f * 2.2, r = .3 + .05 * Math.sin(f * 9);
      s.sp.position.set(s.x + Math.cos(a) * r, s.y + .25 + f * .8, s.z + Math.sin(a) * r); s.sp.scale.setScalar(.08 * Math.min(1, f * 6));
      s.sp.material.opacity = Math.min(1, f * 5, (1 - f) * 3) * .9; continue; }
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
  scorpTick(dt);
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
  // tapping the hero in the world no longer picks them (Jack: troops near the hero couldn't be rallied easily): only the portrait does
  return false;
}
function heroRelease() { heroMove = false; heroSel = false; heroKey = ''; heroUI(); }
function heroSelect() { if (selected) deselect(); flagFocus = 'hero'; heroSel = true; heroKey = ''; sfx('click'); heroUI(); }
// ---- on screen: the portrait (and the Heir's skills at night) under the top panel; the Heir's card in the dock ----
// the skills' pictures (Jack: game-icons.net icons, CC BY 3.0, coloured by part with the upgrades' thick dark outline):
// Inspire lorc's rally-the-troops (a banner in the town's colour over a rank of spears), Royal horse delapouite's horse-head,
// Deflect lorc's shield-reflect (a steel shield turning an arrow aside with a gold spark)
const HERO_ICO_SRC = {"cry":"<svg viewBox=\"0 0 512 512\"><defs><linearGradient id=\"hiB\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#9cc5ff\"/><stop offset=\"1\" stop-color=\"#2f5faf\"/></linearGradient><linearGradient id=\"hiW\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#d9a46a\"/><stop offset=\"1\" stop-color=\"#6e4524\"/></linearGradient><linearGradient id=\"hiG\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fff0b0\"/><stop offset=\"1\" stop-color=\"#d9a12e\"/></linearGradient><linearGradient id=\"hiS\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#f4f7fa\"/><stop offset=\"1\" stop-color=\"#9aa4b1\"/></linearGradient><clipPath id=\"hiT3\"><path d=\"M0 0H512V414.4L0 336.5Z\"/></clipPath><clipPath id=\"hiU3\"><path d=\"M0 336.5L512 414.4V512H0Z\"/></clipPath><clipPath id=\"hiT4\"><path d=\"M0 0H512V387.2L0 409.1Z\"/></clipPath><clipPath id=\"hiU4\"><path d=\"M0 409.1L512 387.2V512H0Z\"/></clipPath><clipPath id=\"hiT5\"><path d=\"M0 0H512V325.5L0 397.4Z\"/></clipPath><clipPath id=\"hiU5\"><path d=\"M0 397.4L512 325.5V512H0Z\"/></clipPath><clipPath id=\"hiT6\"><path d=\"M0 0H512V397.7L0 397.7Z\"/></clipPath><clipPath id=\"hiU6\"><path d=\"M0 397.7L512 397.7V512H0Z\"/></clipPath><clipPath id=\"hiT7\"><path d=\"M0 0H512V433.9L0 444.8Z\"/></clipPath><clipPath id=\"hiU7\"><path d=\"M0 444.8L512 433.9V512H0Z\"/></clipPath><clipPath id=\"hiT8\"><path d=\"M0 0H512V429.6L0 481.9Z\"/></clipPath><clipPath id=\"hiU8\"><path d=\"M0 481.9L512 429.6V512H0Z\"/></clipPath></defs><g fill=\"none\" stroke=\"#3d2c19\" stroke-width=\"34\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M 462.9,19.1 C 453.2,19.1 445.7,26.7 445.7,36.3 C 445.7,45.9 453.3,53.5 462.9,53.5 C 472.4,53.5 480.0,45.9 480.0,36.3 C 480.0,26.7 472.4,19.1 462.9,19.1 Z\"/><path d=\"M 382.5,40.9 C 222.2,41.7 164.4,258.4 19.6,137.2 C 22.9,174.0 108.0,215.6 108.0,215.6 C 82.0,235.6 73.3,240.2 36.1,241.1 C 140.2,327.8 374.7,141.3 444.4,281.2 L 430.7,46.9 C 413.5,42.7 397.7,40.8 382.5,40.9 Z\"/><path d=\"M 453.4,70.9 L 473.5,494.9 L 492.2,494.0 L 472.0,71.0 C 465.7,72.5 459.4,72.5 453.4,70.9 L 453.4,70.9 Z\"/><path d=\"M 360.0,292.9 L 316.4,362.9 L 337.7,387.9 L 322.0,493.0 L 340.9,493.0 L 356.0,390.7 L 384.0,370.5 C 375.9,344.6 367.9,318.7 359.9,292.9 L 360.0,292.9 Z\"/><path d=\"M 203.3,310.7 L 174.5,380.5 L 195.0,400.7 L 197.2,492.9 L 215.8,492.9 L 213.7,399.9 L 233.2,380.0 L 203.2,310.7 L 203.3,310.7 Z\"/><path d=\"M 45.1,315.7 L 28.7,377.6 L 46.3,390.8 L 61.2,493.0 L 80.1,493.0 L 64.8,388.3 L 78.1,370.7 L 45.1,315.8 L 45.1,315.7 Z\"/><path d=\"M 131.1,323.1 L 102.9,380.6 L 118.0,397.6 L 111.3,492.9 L 130.0,492.9 L 136.8,397.6 L 152.7,383.4 L 131.1,323.1 Z\"/><path d=\"M 268.0,355.5 L 248.5,423.9 L 267.9,439.0 L 273.7,492.9 L 292.5,492.9 L 286.7,438.6 L 303.5,417.0 C 291.6,396.5 279.8,376.0 268.0,355.4 L 268.0,355.5 Z\"/><path d=\"M 411.6,355.6 L 392.7,424.2 L 413.0,439.7 L 419.2,493.0 L 438.0,493.0 L 431.6,437.8 L 447.6,416.9 L 411.6,355.6 Z\"/></g><path d=\"M 382.5,40.9 C 222.2,41.7 164.4,258.4 19.6,137.2 C 22.9,174.0 108.0,215.6 108.0,215.6 C 82.0,235.6 73.3,240.2 36.1,241.1 C 140.2,327.8 374.7,141.3 444.4,281.2 L 430.7,46.9 C 413.5,42.7 397.7,40.8 382.5,40.9 Z\" fill=\"url(#hiB)\"/><path d=\"M 453.4,70.9 L 473.5,494.9 L 492.2,494.0 L 472.0,71.0 C 465.7,72.5 459.4,72.5 453.4,70.9 L 453.4,70.9 Z\" fill=\"url(#hiW)\"/><path d=\"M 462.9,19.1 C 453.2,19.1 445.7,26.7 445.7,36.3 C 445.7,45.9 453.3,53.5 462.9,53.5 C 472.4,53.5 480.0,45.9 480.0,36.3 C 480.0,26.7 472.4,19.1 462.9,19.1 Z\" fill=\"url(#hiG)\"/><path d=\"M 360.0,292.9 L 316.4,362.9 L 337.7,387.9 L 322.0,493.0 L 340.9,493.0 L 356.0,390.7 L 384.0,370.5 C 375.9,344.6 367.9,318.7 359.9,292.9 L 360.0,292.9 Z\" fill=\"url(#hiW)\" clip-path=\"url(#hiU3)\"/><path d=\"M 360.0,292.9 L 316.4,362.9 L 337.7,387.9 L 322.0,493.0 L 340.9,493.0 L 356.0,390.7 L 384.0,370.5 C 375.9,344.6 367.9,318.7 359.9,292.9 L 360.0,292.9 Z\" fill=\"url(#hiS)\" clip-path=\"url(#hiT3)\"/><path d=\"M328.8 386.5L365.0 392.1\" stroke=\"#3d2c19\" stroke-width=\"17\" stroke-linecap=\"round\"/><path d=\"M 203.3,310.7 L 174.5,380.5 L 195.0,400.7 L 197.2,492.9 L 215.8,492.9 L 213.7,399.9 L 233.2,380.0 L 203.2,310.7 L 203.3,310.7 Z\" fill=\"url(#hiW)\" clip-path=\"url(#hiU4)\"/><path d=\"M 203.3,310.7 L 174.5,380.5 L 195.0,400.7 L 197.2,492.9 L 215.8,492.9 L 213.7,399.9 L 233.2,380.0 L 203.2,310.7 L 203.3,310.7 Z\" fill=\"url(#hiS)\" clip-path=\"url(#hiT4)\"/><path d=\"M186.0 401.2L222.7 399.6\" stroke=\"#3d2c19\" stroke-width=\"17\" stroke-linecap=\"round\"/><path d=\"M 45.1,315.7 L 28.7,377.6 L 46.3,390.8 L 61.2,493.0 L 80.1,493.0 L 64.8,388.3 L 78.1,370.7 L 45.1,315.8 L 45.1,315.7 Z\" fill=\"url(#hiW)\" clip-path=\"url(#hiU5)\"/><path d=\"M 45.1,315.7 L 28.7,377.6 L 46.3,390.8 L 61.2,493.0 L 80.1,493.0 L 64.8,388.3 L 78.1,370.7 L 45.1,315.8 L 45.1,315.7 Z\" fill=\"url(#hiS)\" clip-path=\"url(#hiT5)\"/><path d=\"M37.5 392.2L73.8 387.0\" stroke=\"#3d2c19\" stroke-width=\"17\" stroke-linecap=\"round\"/><path d=\"M 131.1,323.1 L 102.9,380.6 L 118.0,397.6 L 111.3,492.9 L 130.0,492.9 L 136.8,397.6 L 152.7,383.4 L 131.1,323.1 Z\" fill=\"url(#hiW)\" clip-path=\"url(#hiU6)\"/><path d=\"M 131.1,323.1 L 102.9,380.6 L 118.0,397.6 L 111.3,492.9 L 130.0,492.9 L 136.8,397.6 L 152.7,383.4 L 131.1,323.1 Z\" fill=\"url(#hiS)\" clip-path=\"url(#hiT6)\"/><path d=\"M109.0 397.7L145.8 397.7\" stroke=\"#3d2c19\" stroke-width=\"17\" stroke-linecap=\"round\"/><path d=\"M 268.0,355.5 L 248.5,423.9 L 267.9,439.0 L 273.7,492.9 L 292.5,492.9 L 286.7,438.6 L 303.5,417.0 C 291.6,396.5 279.8,376.0 268.0,355.4 L 268.0,355.5 Z\" fill=\"url(#hiW)\" clip-path=\"url(#hiU7)\"/><path d=\"M 268.0,355.5 L 248.5,423.9 L 267.9,439.0 L 273.7,492.9 L 292.5,492.9 L 286.7,438.6 L 303.5,417.0 C 291.6,396.5 279.8,376.0 268.0,355.4 L 268.0,355.5 Z\" fill=\"url(#hiS)\" clip-path=\"url(#hiT7)\"/><path d=\"M258.9 439.3L295.7 438.5\" stroke=\"#3d2c19\" stroke-width=\"17\" stroke-linecap=\"round\"/><path d=\"M 411.6,355.6 L 392.7,424.2 L 413.0,439.7 L 419.2,493.0 L 438.0,493.0 L 431.6,437.8 L 447.6,416.9 L 411.6,355.6 Z\" fill=\"url(#hiW)\" clip-path=\"url(#hiU8)\"/><path d=\"M 411.6,355.6 L 392.7,424.2 L 413.0,439.7 L 419.2,493.0 L 438.0,493.0 L 431.6,437.8 L 447.6,416.9 L 411.6,355.6 Z\" fill=\"url(#hiS)\" clip-path=\"url(#hiT8)\"/><path d=\"M404.0 440.6L440.6 436.9\" stroke=\"#3d2c19\" stroke-width=\"17\" stroke-linecap=\"round\"/></svg>","horse":"<svg viewBox=\"-22 0 512 512\"><defs><linearGradient id=\"hhC\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#c98a4e\"/><stop offset=\"1\" stop-color=\"#6b3f1d\"/></linearGradient><linearGradient id=\"hhM\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#7a5232\"/><stop offset=\"1\" stop-color=\"#3e2614\"/></linearGradient></defs><g fill=\"none\" stroke=\"#3d2c19\" stroke-width=\"34\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M 400.0,16.0 C 378.6,25.7 341.7,33.3 326.9,64.2 C 304.5,66.1 254.1,74.9 204.6,104.4 C 146.5,139.2 88.6,201.8 72.9,318.1 L 72.4,321.7 L 69.6,323.9 C 38.7,348.9 29.0,362.9 25.2,385.1 C 21.7,406.0 24.5,436.5 24.8,487.0 L 328.3,487.0 C 331.8,470.1 338.8,457.7 340.8,445.4 C 343.1,431.2 341.0,415.4 320.0,386.8 C 276.9,328.2 273.1,257.4 307.1,215.6 C 298.4,212.8 292.0,208.7 287.6,203.0 C 281.5,195.1 280.2,186.0 279.0,177.1 L 296.9,174.8 C 298.0,183.2 299.3,188.7 301.8,192.0 C 304.4,195.4 309.2,198.5 321.4,200.5 L 321.4,200.6 L 321.5,200.4 L 327.5,209.9 C 347.5,241.2 370.4,261.1 400.9,264.3 L 407.4,265.0 L 408.8,271.4 C 411.5,284.2 417.4,290.5 423.9,293.6 C 430.4,296.7 438.1,296.5 444.3,293.8 C 453.7,289.7 458.9,282.5 461.0,271.1 C 463.2,260.0 461.6,245.3 455.9,229.0 C 422.4,190.7 411.4,141.7 392.0,100.2 C 385.9,90.3 379.5,81.7 371.6,75.4 C 376.8,55.1 386.4,34.8 400.0,16.0 Z\"/><path d=\"M 214.0,34.9 C 179.5,35.0 146.0,43.0 96.0,58.5 C 127.1,68.5 166.3,77.4 182.0,97.5 C 186.5,94.5 190.9,91.7 195.4,89.0 C 235.9,64.8 275.8,53.7 303.6,48.9 C 267.8,39.5 240.6,34.8 214.0,34.9 L 214.0,34.9 Z\"/><path d=\"M 157.1,96.7 C 156.0,96.7 154.8,96.7 153.7,96.7 C 123.4,97.0 90.6,106.4 57.1,127.9 C 84.2,131.6 111.7,131.7 129.6,143.3 C 145.5,125.4 162.8,110.7 180.3,98.7 C 172.8,97.4 165.0,96.7 157.1,96.7 L 157.1,96.7 Z\"/><path d=\"M 129.0,144.0 C 92.6,145.5 60.1,150.5 24.3,168.8 C 57.5,175.9 75.2,182.3 89.3,202.6 C 100.8,180.1 114.4,160.7 129.0,144.0 L 129.0,144.0 Z\"/><path d=\"M 74.5,201.4 C 53.5,201.6 36.6,213.1 16.0,224.0 C 43.8,224.0 62.0,227.8 74.7,236.0 C 79.0,224.4 83.8,213.4 89.1,203.1 C 84.0,201.9 79.1,201.4 74.5,201.4 L 74.5,201.4 Z\"/><path d=\"M 73.8,238.2 C 55.9,244.1 38.4,245.4 19.6,260.5 C 37.2,265.2 54.4,270.1 61.0,282.5 C 64.5,266.8 68.8,252.0 73.8,238.2 L 73.8,238.2 Z\"/><path d=\"M 52.2,290.7 C 41.8,290.8 28.4,296.3 17.5,303.0 C 29.7,309.8 29.9,326.5 26.4,340.7 C 33.7,331.6 43.3,322.4 55.6,312.2 C 56.6,305.2 57.8,298.3 59.1,291.6 C 57.0,290.9 54.7,290.6 52.2,290.7 L 52.2,290.7 Z\"/></g><path d=\"M 400.0,16.0 C 378.6,25.7 341.7,33.3 326.9,64.2 C 304.5,66.1 254.1,74.9 204.6,104.4 C 146.5,139.2 88.6,201.8 72.9,318.1 L 72.4,321.7 L 69.6,323.9 C 38.7,348.9 29.0,362.9 25.2,385.1 C 21.7,406.0 24.5,436.5 24.8,487.0 L 328.3,487.0 C 331.8,470.1 338.8,457.7 340.8,445.4 C 343.1,431.2 341.0,415.4 320.0,386.8 C 276.9,328.2 273.1,257.4 307.1,215.6 C 298.4,212.8 292.0,208.7 287.6,203.0 C 281.5,195.1 280.2,186.0 279.0,177.1 L 296.9,174.8 C 298.0,183.2 299.3,188.7 301.8,192.0 C 304.4,195.4 309.2,198.5 321.4,200.5 L 321.4,200.6 L 321.5,200.4 L 327.5,209.9 C 347.5,241.2 370.4,261.1 400.9,264.3 L 407.4,265.0 L 408.8,271.4 C 411.5,284.2 417.4,290.5 423.9,293.6 C 430.4,296.7 438.1,296.5 444.3,293.8 C 453.7,289.7 458.9,282.5 461.0,271.1 C 463.2,260.0 461.6,245.3 455.9,229.0 C 422.4,190.7 411.4,141.7 392.0,100.2 C 385.9,90.3 379.5,81.7 371.6,75.4 C 376.8,55.1 386.4,34.8 400.0,16.0 Z\" fill=\"url(#hhC)\"/><path d=\"M 214.0,34.9 C 179.5,35.0 146.0,43.0 96.0,58.5 C 127.1,68.5 166.3,77.4 182.0,97.5 C 186.5,94.5 190.9,91.7 195.4,89.0 C 235.9,64.8 275.8,53.7 303.6,48.9 C 267.8,39.5 240.6,34.8 214.0,34.9 L 214.0,34.9 Z\" fill=\"url(#hhM)\"/><path d=\"M 157.1,96.7 C 156.0,96.7 154.8,96.7 153.7,96.7 C 123.4,97.0 90.6,106.4 57.1,127.9 C 84.2,131.6 111.7,131.7 129.6,143.3 C 145.5,125.4 162.8,110.7 180.3,98.7 C 172.8,97.4 165.0,96.7 157.1,96.7 L 157.1,96.7 Z\" fill=\"url(#hhM)\"/><path d=\"M 129.0,144.0 C 92.6,145.5 60.1,150.5 24.3,168.8 C 57.5,175.9 75.2,182.3 89.3,202.6 C 100.8,180.1 114.4,160.7 129.0,144.0 L 129.0,144.0 Z\" fill=\"url(#hhM)\"/><path d=\"M 74.5,201.4 C 53.5,201.6 36.6,213.1 16.0,224.0 C 43.8,224.0 62.0,227.8 74.7,236.0 C 79.0,224.4 83.8,213.4 89.1,203.1 C 84.0,201.9 79.1,201.4 74.5,201.4 L 74.5,201.4 Z\" fill=\"url(#hhM)\"/><path d=\"M 73.8,238.2 C 55.9,244.1 38.4,245.4 19.6,260.5 C 37.2,265.2 54.4,270.1 61.0,282.5 C 64.5,266.8 68.8,252.0 73.8,238.2 L 73.8,238.2 Z\" fill=\"url(#hhM)\"/><path d=\"M 52.2,290.7 C 41.8,290.8 28.4,296.3 17.5,303.0 C 29.7,309.8 29.9,326.5 26.4,340.7 C 33.7,331.6 43.3,322.4 55.6,312.2 C 56.6,305.2 57.8,298.3 59.1,291.6 C 57.0,290.9 54.7,290.6 52.2,290.7 L 52.2,290.7 Z\" fill=\"url(#hhM)\"/><path d=\"M 368.0,128.0 A 13.2,13.2 0.0 0,1 381.2,141.2 A 13.2,13.2 0.0 0,1 368.0,154.4 A 13.2,13.2 0.0 0,1 354.7,141.2 A 13.2,13.2 0.0 0,1 368.0,128.0 Z\" fill=\"#1e1209\"/><path d=\"M 444.0,246.8 C 445.6,246.8 447.2,246.8 448.8,247.0 L 447.1,264.9 C 443.2,264.6 441.6,265.3 441.6,265.4 C 441.5,265.4 440.5,266.0 440.9,271.3 L 423.0,272.6 C 422.3,264.3 424.3,256.4 429.9,251.6 C 434.2,248.0 439.1,246.9 444.0,246.8 L 444.0,246.8 Z\" fill=\"#2a170b\"/></svg>","twin":"<svg viewBox=\"0 0 512 512\"><defs><linearGradient id=\"hrtS\" x1=\"1\" y1=\"0\" x2=\"0\" y2=\"0\"><stop offset=\"0\" stop-color=\"#f2f5f8\"/><stop offset=\"1\" stop-color=\"#8c96a3\"/></linearGradient><linearGradient id=\"hrtW\" x1=\"1\" y1=\"0\" x2=\"0\" y2=\"0\"><stop offset=\"0\" stop-color=\"#c58a52\"/><stop offset=\"1\" stop-color=\"#6b4020\"/></linearGradient></defs><g transform=\"rotate(-90 256 256)\"><g fill=\"none\" stroke=\"#3d2c19\" stroke-width=\"34\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M 414.834,18.08 C 385.457,18.229999999999997 355.822,34.68 341.67,76.94999999999999 C 322.91200000000003,132.97799999999998 409.077,214.73399999999998 375.24,298.15599999999995 L 423.45500000000004,340.02599999999995 C 459.10100000000006,247.07199999999995 371.40700000000004,139.62599999999995 389.25500000000005,88.58599999999996 C 401.61500000000007,53.235999999999954 424.927,50.375999999999955 445.30500000000006,62.14599999999996 C 465.24700000000007,73.65599999999996 475.71100000000007,92.80999999999996 463.27900000000005,117.13599999999997 C 496.32200000000006,104.51599999999996 500.53400000000005,65.69199999999996 472.79900000000004,39.938999999999965 C 468.83900000000006,36.258999999999965 463.77900000000005,32.922999999999966 458.52200000000005,29.888999999999964 C 445.53800000000007,22.392999999999965 430.22200000000004,17.998999999999963 414.83200000000005,18.078999999999965 L 414.834,18.08 Z\"/><path d=\"M 334.064,50.089999999999996 L 65.937,62.16 L 53.417,330.414 C 59.767,326.99199999999996 66.181,324.058 72.545,321.449 L 83.81,80.063 L 324.14,69.243 C 327.05,62.425999999999995 330.40999999999997,56.06699999999999 334.06399999999996,50.089 L 334.064,50.089999999999996 Z\"/><path d=\"M 104.686,87.955 L 429.078,417.995 C 424.738,422.461 420.19399999999996,426.725 415.45799999999997,430.795 L 91.132,100.825 L 90.864,101.092 L 389.03,450.41 C 374.164,459.97 358.03,468.25 340.90799999999996,475.53000000000003 L 456.948,494.94000000000005 L 449.93,450.75200000000007 L 494.117,457.77200000000005 L 474.71,341.73 C 468.96999999999997,359.49800000000005 461.28499999999997,375.333 451.957,389.533 L 104.687,87.955 L 104.686,87.955 Z\"/><path d=\"M 98.078,336.495 C 97.21600000000001,336.483 96.36,336.488 95.50800000000001,336.51 C 89.92800000000001,336.65 84.55300000000001,337.496 79.40200000000002,339.21999999999997 C 14.994000000000014,360.784 10.53400000000002,418.303 32.34200000000001,456.07399999999996 C 56.60200000000002,498.1039999999999 105.16600000000001,498.59099999999995 119.58600000000001,460.83399999999995 C 95.25600000000001,473.26399999999995 76.11200000000002,462.792 64.596,442.8539999999999 C 52.833000000000006,422.47599999999994 55.68600000000001,399.16399999999993 91.031,386.8089999999999 C 141.208,369.2609999999999 245.995,453.5819999999999 339.39700000000005,421.04599999999994 L 298.64000000000004,373.29599999999994 C 225.32400000000004,400.76399999999995 152.36500000000004,337.18299999999994 98.07800000000003,336.49299999999994 L 98.078,336.495 Z\"/></g><path d=\"M 414.834,18.08 C 385.457,18.229999999999997 355.822,34.68 341.67,76.94999999999999 C 322.91200000000003,132.97799999999998 409.077,214.73399999999998 375.24,298.15599999999995 L 423.45500000000004,340.02599999999995 C 459.10100000000006,247.07199999999995 371.40700000000004,139.62599999999995 389.25500000000005,88.58599999999996 C 401.61500000000007,53.235999999999954 424.927,50.375999999999955 445.30500000000006,62.14599999999996 C 465.24700000000007,73.65599999999996 475.71100000000007,92.80999999999996 463.27900000000005,117.13599999999997 C 496.32200000000006,104.51599999999996 500.53400000000005,65.69199999999996 472.79900000000004,39.938999999999965 C 468.83900000000006,36.258999999999965 463.77900000000005,32.922999999999966 458.52200000000005,29.888999999999964 C 445.53800000000007,22.392999999999965 430.22200000000004,17.998999999999963 414.83200000000005,18.078999999999965 L 414.834,18.08\" fill=\"url(#hrtW)\"/><path d=\"M 334.064,50.089999999999996 L 65.937,62.16 L 53.417,330.414 C 59.767,326.99199999999996 66.181,324.058 72.545,321.449 L 83.81,80.063 L 324.14,69.243 C 327.05,62.425999999999995 330.40999999999997,56.06699999999999 334.06399999999996,50.089 L 334.064,50.089999999999996\" fill=\"#efe3c4\"/><path d=\"M 104.686,87.955 L 429.078,417.995 C 424.738,422.461 420.19399999999996,426.725 415.45799999999997,430.795 L 91.132,100.825 L 90.864,101.092 L 389.03,450.41 C 374.164,459.97 358.03,468.25 340.90799999999996,475.53000000000003 L 456.948,494.94000000000005 L 449.93,450.75200000000007 L 494.117,457.77200000000005 L 474.71,341.73 C 468.96999999999997,359.49800000000005 461.28499999999997,375.333 451.957,389.533 L 104.687,87.955 L 104.686,87.955\" fill=\"url(#hrtS)\"/><path d=\"M 98.078,336.495 C 97.21600000000001,336.483 96.36,336.488 95.50800000000001,336.51 C 89.92800000000001,336.65 84.55300000000001,337.496 79.40200000000002,339.21999999999997 C 14.994000000000014,360.784 10.53400000000002,418.303 32.34200000000001,456.07399999999996 C 56.60200000000002,498.1039999999999 105.16600000000001,498.59099999999995 119.58600000000001,460.83399999999995 C 95.25600000000001,473.26399999999995 76.11200000000002,462.792 64.596,442.8539999999999 C 52.833000000000006,422.47599999999994 55.68600000000001,399.16399999999993 91.031,386.8089999999999 C 141.208,369.2609999999999 245.995,453.5819999999999 339.39700000000005,421.04599999999994 L 298.64000000000004,373.29599999999994 C 225.32400000000004,400.76399999999995 152.36500000000004,337.18299999999994 98.07800000000003,336.49299999999994 L 98.078,336.495\" fill=\"url(#hrtW)\"/></g></svg>","eye":"<svg viewBox=\"0 0 512 512\"><defs><linearGradient id=\"hreE\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fbf6e8\"/><stop offset=\"1\" stop-color=\"#c9b994\"/></linearGradient><linearGradient id=\"hreG\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fff3b8\"/><stop offset=\"1\" stop-color=\"#e09424\"/></linearGradient><clipPath id=\"hreK\"><rect x=\"352\" y=\"80\" width=\"160\" height=\"180\"/></clipPath></defs><g fill=\"none\" stroke=\"#3d2c19\" stroke-width=\"34\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M 242.9,20.46 C 249.6,40.21 262.6,61.85 246.9,70.9 C 208.3,92.94 165.5,112.4 140.7,161.60000000000002 C 103.3,235.7 91.69,412.0 29.81,451.0 C 78.41,454.8 119.5,434.7 138.7,406.8 C 145.79999999999998,441.1 171.29999999999998,473.8 201.7,491.5 C 196.5,462.5 199.89999999999998,432.1 220.7,399.0 C 237.2,421.9 251.79999999999998,458.3 294.5,474.3 C 278.1,446.8 280.8,421.5 283.8,390.1 C 292.6,417.0 322.3,440.1 356.70000000000005,449.0 C 339.90000000000003,430.4 332.80000000000007,403.5 335.70000000000005,383.0 C 350.30000000000007,407.9 379.1,421.4 402.80000000000007,422.7 C 249.50000000000006,243.1 354.1000000000001,131.09999999999997 482.20000000000005,228.29999999999998 C 481.70000000000005,178.59999999999997 450.80000000000007,161.59999999999997 415.00000000000006,132.59999999999997 C 414.1000000000001,117.19999999999996 405.40000000000003,103.29999999999997 397.50000000000006,89.23999999999997 C 343.80000000000007,79.24999999999997 276.00000000000006,47.22999999999997 242.90000000000006,20.459999999999965 L 242.9,20.46 Z\"/><path d=\"M 324.1,95.34 C 350.20000000000005,106.2 370.3,117.9 380.5,130.8 C 363.9,127.20000000000002 340.7,127.30000000000001 310.5,129.70000000000002 C 325.5,120.00000000000001 327.0,108.00000000000001 324.1,95.34000000000002 L 324.1,95.34 Z\"/></g><path d=\"M 242.9,20.46 C 249.6,40.21 262.6,61.85 246.9,70.9 C 208.3,92.94 165.5,112.4 140.7,161.60000000000002 C 103.3,235.7 91.69,412.0 29.81,451.0 C 78.41,454.8 119.5,434.7 138.7,406.8 C 145.79999999999998,441.1 171.29999999999998,473.8 201.7,491.5 C 196.5,462.5 199.89999999999998,432.1 220.7,399.0 C 237.2,421.9 251.79999999999998,458.3 294.5,474.3 C 278.1,446.8 280.8,421.5 283.8,390.1 C 292.6,417.0 322.3,440.1 356.70000000000005,449.0 C 339.90000000000003,430.4 332.80000000000007,403.5 335.70000000000005,383.0 C 350.30000000000007,407.9 379.1,421.4 402.80000000000007,422.7 C 249.50000000000006,243.1 354.1000000000001,131.09999999999997 482.20000000000005,228.29999999999998 C 481.70000000000005,178.59999999999997 450.80000000000007,161.59999999999997 415.00000000000006,132.59999999999997 C 414.1000000000001,117.19999999999996 405.40000000000003,103.29999999999997 397.50000000000006,89.23999999999997 C 343.80000000000007,79.24999999999997 276.00000000000006,47.22999999999997 242.90000000000006,20.459999999999965 L 242.9,20.46\" fill=\"url(#hreE)\"/><path d=\"M 324.1,95.34 C 350.20000000000005,106.2 370.3,117.9 380.5,130.8 C 363.9,127.20000000000002 340.7,127.30000000000001 310.5,129.70000000000002 C 325.5,120.00000000000001 327.0,108.00000000000001 324.1,95.34000000000002 L 324.1,95.34\" fill=\"#3d2c19\"/><path d=\"M 242.9,20.46 C 249.6,40.21 262.6,61.85 246.9,70.9 C 208.3,92.94 165.5,112.4 140.7,161.60000000000002 C 103.3,235.7 91.69,412.0 29.81,451.0 C 78.41,454.8 119.5,434.7 138.7,406.8 C 145.79999999999998,441.1 171.29999999999998,473.8 201.7,491.5 C 196.5,462.5 199.89999999999998,432.1 220.7,399.0 C 237.2,421.9 251.79999999999998,458.3 294.5,474.3 C 278.1,446.8 280.8,421.5 283.8,390.1 C 292.6,417.0 322.3,440.1 356.70000000000005,449.0 C 339.90000000000003,430.4 332.80000000000007,403.5 335.70000000000005,383.0 C 350.30000000000007,407.9 379.1,421.4 402.80000000000007,422.7 C 249.50000000000006,243.1 354.1000000000001,131.09999999999997 482.20000000000005,228.29999999999998 C 481.70000000000005,178.59999999999997 450.80000000000007,161.59999999999997 415.00000000000006,132.59999999999997 C 414.1000000000001,117.19999999999996 405.40000000000003,103.29999999999997 397.50000000000006,89.23999999999997 C 343.80000000000007,79.24999999999997 276.00000000000006,47.22999999999997 242.90000000000006,20.459999999999965 L 242.9,20.46\" fill=\"url(#hreG)\" clip-path=\"url(#hreK)\"/><path d=\"M 324.1,95.34 C 350.20000000000005,106.2 370.3,117.9 380.5,130.8 C 363.9,127.20000000000002 340.7,127.30000000000001 310.5,129.70000000000002 C 325.5,120.00000000000001 327.0,108.00000000000001 324.1,95.34000000000002 L 324.1,95.34\" fill=\"#3d2c19\"/></svg>","sweep":"<svg viewBox=\"0 0 512 512\"><defs><linearGradient id=\"hcsC\" x1=\"1\" y1=\"0\" x2=\"0\" y2=\"0\"><stop offset=\"0\" stop-color=\"#fff8e0\"/><stop offset=\"1\" stop-color=\"#e8c870\"/></linearGradient><linearGradient id=\"hcsG\" x1=\"1\" y1=\"0\" x2=\"0\" y2=\"0\"><stop offset=\"0\" stop-color=\"#fff3b8\"/><stop offset=\"1\" stop-color=\"#e09424\"/></linearGradient><linearGradient id=\"hcsS\" x1=\"1\" y1=\"0\" x2=\"0\" y2=\"0\"><stop offset=\"0\" stop-color=\"#f2f5f8\"/><stop offset=\"1\" stop-color=\"#8c96a3\"/></linearGradient><clipPath id=\"hcsK\"><polygon points=\"0,0 330,0 0,330\"/></clipPath></defs><g transform=\"rotate(-90 256 256)\"><g fill=\"none\" stroke=\"#3d2c19\" stroke-width=\"34\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M 256.438,19.375 C 208.72799999999998,19.375 161.016,33.785 120.344,62.595 C 133.36599999999999,77.685 146.658,92.722 159.5,107.063 C 175.538,95.381 191.982,88.206 208.188,84.781 L 218.063,74.90700000000001 L 224.688,68.28200000000001 L 231.28099999999998,74.90800000000002 L 239.00099999999998,82.62800000000001 C 317.736,88.27200000000002 379.54099999999994,177.76100000000002 340.407,258.158 L 458.907,376.658 C 513.354,285.985 501.49699999999996,166.77800000000002 423.282,88.56400000000002 C 377.17,42.45 316.806,19.376 256.44,19.376 L 256.438,19.375 Z\"/><path d=\"M 66.5,27.063 L 29.53,64.03 C 67.48,93.864 109.682,129.936 144.53,160.875 L 151.937,167.469 L 144.937,174.469 L 97.56200000000001,221.843 L 117.25,241.5 L 151.75,207.0 L 419.875,475.156 L 497.219,494.43600000000004 L 475.374,419.65600000000006 L 448.39700000000005,392.67800000000005 L 448.43700000000007,392.62500000000006 L 330.68700000000007,274.87500000000006 L 330.6550000000001,274.9200000000001 L 207.25,151.5 L 244.344,114.406 L 224.688,94.75 L 178.218,141.188 L 171.25,148.125 L 164.687,140.845 C 133.5,106.334 96.644,64.837 66.5,27.062 L 66.5,27.063 Z\"/><path d=\"M 65.22,117.125 C -1.735,209.41 6.38,339.035 89.593,422.25 C 142.523,475.18 214.226,497.698 283.15500000000003,489.875 C 151.65500000000003,490.872 36.35100000000003,361.312 76.03000000000003,226.719 L 71.15600000000003,221.843 L 77.75000000000003,215.218 L 81.00000000000003,211.968 C 88.02800000000003,193.456 98.07600000000002,174.951 111.50000000000003,156.748 C 96.63000000000002,143.756 80.95000000000003,130.315 65.22000000000003,117.12299999999999 L 65.22,117.125 Z\"/><path d=\"M 185.594,163.155 C 197.87699999999998,163.155 207.814,173.123 207.814,185.405 C 207.814,187.629 207.482,189.755 206.874,191.781 L 443.81399999999996,428.751 L 430.62399999999997,441.93899999999996 L 194.47,205.813 C 191.75,206.998 188.75,207.65599999999998 185.594,207.65599999999998 C 173.31,207.65599999999998 163.344,197.69199999999998 163.344,185.40599999999998 C 163.344,173.12099999999998 173.31,163.15599999999998 185.594,163.15599999999998 L 185.594,163.155 Z\"/></g><path d=\"M 256.438,19.375 C 208.72799999999998,19.375 161.016,33.785 120.344,62.595 C 133.36599999999999,77.685 146.658,92.722 159.5,107.063 C 175.538,95.381 191.982,88.206 208.188,84.781 L 218.063,74.90700000000001 L 224.688,68.28200000000001 L 231.28099999999998,74.90800000000002 L 239.00099999999998,82.62800000000001 C 317.736,88.27200000000002 379.54099999999994,177.76100000000002 340.407,258.158 L 458.907,376.658 C 513.354,285.985 501.49699999999996,166.77800000000002 423.282,88.56400000000002 C 377.17,42.45 316.806,19.376 256.44,19.376 L 256.438,19.375\" fill=\"url(#hcsC)\"/><path d=\"M 66.5,27.063 L 29.53,64.03 C 67.48,93.864 109.682,129.936 144.53,160.875 L 151.937,167.469 L 144.937,174.469 L 97.56200000000001,221.843 L 117.25,241.5 L 151.75,207.0 L 419.875,475.156 L 497.219,494.43600000000004 L 475.374,419.65600000000006 L 448.39700000000005,392.67800000000005 L 448.43700000000007,392.62500000000006 L 330.68700000000007,274.87500000000006 L 330.6550000000001,274.9200000000001 L 207.25,151.5 L 244.344,114.406 L 224.688,94.75 L 178.218,141.188 L 171.25,148.125 L 164.687,140.845 C 133.5,106.334 96.644,64.837 66.5,27.062 L 66.5,27.063\" fill=\"url(#hcsS)\"/><path d=\"M 65.22,117.125 C -1.735,209.41 6.38,339.035 89.593,422.25 C 142.523,475.18 214.226,497.698 283.15500000000003,489.875 C 151.65500000000003,490.872 36.35100000000003,361.312 76.03000000000003,226.719 L 71.15600000000003,221.843 L 77.75000000000003,215.218 L 81.00000000000003,211.968 C 88.02800000000003,193.456 98.07600000000002,174.951 111.50000000000003,156.748 C 96.63000000000002,143.756 80.95000000000003,130.315 65.22000000000003,117.12299999999999 L 65.22,117.125\" fill=\"url(#hcsC)\"/><path d=\"M 185.594,163.155 C 197.87699999999998,163.155 207.814,173.123 207.814,185.405 C 207.814,187.629 207.482,189.755 206.874,191.781 L 443.81399999999996,428.751 L 430.62399999999997,441.93899999999996 L 194.47,205.813 C 191.75,206.998 188.75,207.65599999999998 185.594,207.65599999999998 C 173.31,207.65599999999998 163.344,197.69199999999998 163.344,185.40599999999998 C 163.344,173.12099999999998 173.31,163.15599999999998 185.594,163.15599999999998 L 185.594,163.155\" fill=\"#7d8796\"/><path d=\"M 66.5,27.063 L 29.53,64.03 C 67.48,93.864 109.682,129.936 144.53,160.875 L 151.937,167.469 L 144.937,174.469 L 97.56200000000001,221.843 L 117.25,241.5 L 151.75,207.0 L 419.875,475.156 L 497.219,494.43600000000004 L 475.374,419.65600000000006 L 448.39700000000005,392.67800000000005 L 448.43700000000007,392.62500000000006 L 330.68700000000007,274.87500000000006 L 330.6550000000001,274.9200000000001 L 207.25,151.5 L 244.344,114.406 L 224.688,94.75 L 178.218,141.188 L 171.25,148.125 L 164.687,140.845 C 133.5,106.334 96.644,64.837 66.5,27.062 L 66.5,27.063\" fill=\"url(#hcsG)\" clip-path=\"url(#hcsK)\"/></g></svg>","wind":"<svg viewBox=\"0 0 512 512\"><defs><linearGradient id=\"hcw2B\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#9cc5ff\"/><stop offset=\"1\" stop-color=\"#2f5faf\"/></linearGradient><linearGradient id=\"hcw2G\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fff3b8\"/><stop offset=\"1\" stop-color=\"#e09424\"/></linearGradient><linearGradient id=\"hcw2R\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ff7a6a\"/><stop offset=\"1\" stop-color=\"#b0201a\"/></linearGradient></defs><g fill=\"none\" stroke=\"#3d2c19\" stroke-width=\"34\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M 256.0,32.0 C 192.0,80.0 128.0,96.0 32.0,128.0 C 32.0,256.0 192.0,448.0 256.0,496.0 C 320.0,448.0 480.0,256.0 480.0,128.0 C 384.0,96.0 320.0,80.0 256.0,32.0 Z\"/><path d=\"M 256.0,66.75 L 261.4,70.8 C 311.09999999999997,108.1 361.0,120.69999999999999 438.09999999999997,146.39999999999998 L 444.29999999999995,148.39999999999998 L 444.29999999999995,154.89999999999998 C 444.29999999999995,209.89999999999998 411.19999999999993,274.59999999999997 372.29999999999995,331.29999999999995 C 333.4,388.09999999999997 288.69999999999993,436.29999999999995 261.4,456.79999999999995 L 255.99999999999997,460.9 L 250.59999999999997,456.79999999999995 C 223.29999999999995,436.29999999999995 178.59999999999997,388.09999999999997 139.69999999999996,331.29999999999995 C 100.79999999999995,274.59999999999997 67.69999999999996,209.89999999999995 67.69999999999996,154.89999999999995 L 67.69999999999996,148.39999999999995 L 73.84999999999997,146.39999999999995 C 150.9,120.7 200.9,108.0 250.6,70.8 L 256.0,66.75 Z\"/><path d=\"M 256.0,88.93 C 206.6,124.30000000000001 156.2,138.10000000000002 85.94999999999999,161.3 C 88.52999999999999,208.0 118.29999999999998,268.3 154.6,321.20000000000005 C 189.89999999999998,372.70000000000005 231.2,417.50000000000006 256.0,438.00000000000006 C 280.8,417.50000000000006 322.1,372.70000000000005 357.4,321.20000000000005 C 393.7,268.30000000000007 423.5,208.00000000000006 426.0,161.30000000000004 C 355.7,138.10000000000005 305.4,124.30000000000004 256.0,88.93000000000004 L 256.0,88.93 Z\"/><path d=\"M 210.5,143.9 C 230.2,144.4 248.6,158.3 256.0,192.0 C 274.0,105.7 366.0,149.5 366.0,214.5 C 365.0,278.4 274.0,322.2 256.0,376.6 C 237.0,322.20000000000005 148.0,278.40000000000003 146.0,214.50000000000003 C 146.0,174.90000000000003 179.8,143.20000000000005 210.5,143.90000000000003 L 210.5,143.9 Z\"/></g><path d=\"M 256.0,32.0 C 192.0,80.0 128.0,96.0 32.0,128.0 C 32.0,256.0 192.0,448.0 256.0,496.0 C 320.0,448.0 480.0,256.0 480.0,128.0 C 384.0,96.0 320.0,80.0 256.0,32.0\" fill=\"url(#hcw2G)\"/><path d=\"M 256.0,66.75 L 261.4,70.8 C 311.09999999999997,108.1 361.0,120.69999999999999 438.09999999999997,146.39999999999998 L 444.29999999999995,148.39999999999998 L 444.29999999999995,154.89999999999998 C 444.29999999999995,209.89999999999998 411.19999999999993,274.59999999999997 372.29999999999995,331.29999999999995 C 333.4,388.09999999999997 288.69999999999993,436.29999999999995 261.4,456.79999999999995 L 255.99999999999997,460.9 L 250.59999999999997,456.79999999999995 C 223.29999999999995,436.29999999999995 178.59999999999997,388.09999999999997 139.69999999999996,331.29999999999995 C 100.79999999999995,274.59999999999997 67.69999999999996,209.89999999999995 67.69999999999996,154.89999999999995 L 67.69999999999996,148.39999999999995 L 73.84999999999997,146.39999999999995 C 150.9,120.7 200.9,108.0 250.6,70.8 L 256.0,66.75\" fill=\"#3d2c19\"/><path d=\"M 256.0,88.93 C 206.6,124.30000000000001 156.2,138.10000000000002 85.94999999999999,161.3 C 88.52999999999999,208.0 118.29999999999998,268.3 154.6,321.20000000000005 C 189.89999999999998,372.70000000000005 231.2,417.50000000000006 256.0,438.00000000000006 C 280.8,417.50000000000006 322.1,372.70000000000005 357.4,321.20000000000005 C 393.7,268.30000000000007 423.5,208.00000000000006 426.0,161.30000000000004 C 355.7,138.10000000000005 305.4,124.30000000000004 256.0,88.93000000000004 L 256.0,88.93\" fill=\"url(#hcw2B)\"/><path d=\"M 210.5,143.9 C 230.2,144.4 248.6,158.3 256.0,192.0 C 274.0,105.7 366.0,149.5 366.0,214.5 C 365.0,278.4 274.0,322.2 256.0,376.6 C 237.0,322.20000000000005 148.0,278.40000000000003 146.0,214.50000000000003 C 146.0,174.90000000000003 179.8,143.20000000000005 210.5,143.90000000000003 L 210.5,143.9\" fill=\"url(#hcw2R)\"/></svg>","quick":"<svg viewBox=\"0 0 512 512\"><defs><linearGradient id=\"hrqE\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fbf6e8\"/><stop offset=\"1\" stop-color=\"#c9b994\"/></linearGradient><linearGradient id=\"hrqW\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#c58a52\"/><stop offset=\"1\" stop-color=\"#6b4020\"/></linearGradient></defs><g fill=\"none\" stroke=\"#3d2c19\" stroke-width=\"34\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M 182.938,17.75 L 153.313,129.75 L 89.09299999999999,65.437 L 70.87499999999999,83.657 L 480.78,494.124 L 492.594,494.124 L 492.594,469.5 L 264.72,241.28 L 294.34400000000005,129.156 L 276.8140000000001,111.626 L 260.03100000000006,149.094 L 259.72100000000006,94.53099999999999 L 236.15700000000007,70.97099999999999 L 224.03200000000007,90.72099999999999 L 221.68900000000008,56.50099999999999 L 182.93900000000008,17.75099999999999 L 182.938,17.75 Z\"/><path d=\"M 419.875,81.0 L 402.312,147.47 L 366.906,112.063 L 352.031,127.21900000000001 L 492.595,267.812 L 492.595,237.75 L 472.22,217.375 L 489.812,150.937 L 419.875,81.0 Z\"/><path d=\"M 114.72,154.0 L 21.906000000000006,178.53 L 38.656000000000006,195.28 L 89.626,194.28 L 52.43600000000001,209.062 L 91.876,248.5 L 124.781,250.53 L 111.90700000000001,259.437 L 132.595,260.719 L 115.751,272.37399999999997 L 133.345,289.96799999999996 L 226.0,265.436 L 114.72,154.0 Z\"/><path d=\"M 367.656,169.28 L 318.68600000000004,182.22 L 344.34400000000005,207.875 L 376.21900000000005,210.031 L 357.81100000000004,221.345 L 388.593,252.125 L 437.563,239.189 L 367.655,169.28199999999998 L 367.656,169.28 Z\"/><path d=\"M 122.78,316.313 L 105.22,382.71999999999997 L 69.875,347.25 L 54.562,362.563 L 186.156,494.125 L 216.25,494.125 L 175.094,452.812 L 192.688,386.219 L 178.78099999999998,372.311 L 166.688,392.09299999999996 L 164.345,357.87299999999993 L 122.782,316.3109999999999 L 122.78,316.313 Z\"/><path d=\"M 311.687,367.907 L 300.844,408.96999999999997 L 277.344,385.46999999999997 L 264.12399999999997,398.68699999999995 L 287.49999999999994,422.03099999999995 L 246.77999999999994,432.81399999999996 L 291.59399999999994,477.626 L 332.31399999999996,466.846 L 360.31199999999995,494.846 L 386.71899999999994,494.846 L 345.6239999999999,453.751 L 356.4679999999999,412.721 L 337.3099999999999,393.531 L 328.7479999999999,401.281 L 325.4039999999999,381.657 L 311.68399999999986,367.907 L 311.687,367.907 Z\"/><path d=\"M 70.25,404.656 L 21.562,417.5 L 75.562,471.5 L 109.656,471.5 L 93.126,487.0 L 140.156,474.562 L 70.25,404.656 Z\"/></g><path d=\"M 182.938,17.75 L 153.313,129.75 L 89.09299999999999,65.437 L 70.87499999999999,83.657 L 480.78,494.124 L 492.594,494.124 L 492.594,469.5 L 264.72,241.28 L 294.34400000000005,129.156 L 276.8140000000001,111.626 L 260.03100000000006,149.094 L 259.72100000000006,94.53099999999999 L 236.15700000000007,70.97099999999999 L 224.03200000000007,90.72099999999999 L 221.68900000000008,56.50099999999999 L 182.93900000000008,17.75099999999999 L 182.938,17.75\" fill=\"url(#hrqE)\"/><path d=\"M 419.875,81.0 L 402.312,147.47 L 366.906,112.063 L 352.031,127.21900000000001 L 492.595,267.812 L 492.595,237.75 L 472.22,217.375 L 489.812,150.937 L 419.875,81.0\" fill=\"url(#hrqE)\"/><path d=\"M 114.72,154.0 L 21.906000000000006,178.53 L 38.656000000000006,195.28 L 89.626,194.28 L 52.43600000000001,209.062 L 91.876,248.5 L 124.781,250.53 L 111.90700000000001,259.437 L 132.595,260.719 L 115.751,272.37399999999997 L 133.345,289.96799999999996 L 226.0,265.436 L 114.72,154.0\" fill=\"url(#hrqE)\"/><path d=\"M 367.656,169.28 L 318.68600000000004,182.22 L 344.34400000000005,207.875 L 376.21900000000005,210.031 L 357.81100000000004,221.345 L 388.593,252.125 L 437.563,239.189 L 367.655,169.28199999999998 L 367.656,169.28\" fill=\"url(#hrqE)\"/><path d=\"M 122.78,316.313 L 105.22,382.71999999999997 L 69.875,347.25 L 54.562,362.563 L 186.156,494.125 L 216.25,494.125 L 175.094,452.812 L 192.688,386.219 L 178.78099999999998,372.311 L 166.688,392.09299999999996 L 164.345,357.87299999999993 L 122.782,316.3109999999999 L 122.78,316.313\" fill=\"url(#hrqE)\"/><path d=\"M 311.687,367.907 L 300.844,408.96999999999997 L 277.344,385.46999999999997 L 264.12399999999997,398.68699999999995 L 287.49999999999994,422.03099999999995 L 246.77999999999994,432.81399999999996 L 291.59399999999994,477.626 L 332.31399999999996,466.846 L 360.31199999999995,494.846 L 386.71899999999994,494.846 L 345.6239999999999,453.751 L 356.4679999999999,412.721 L 337.3099999999999,393.531 L 328.7479999999999,401.281 L 325.4039999999999,381.657 L 311.68399999999986,367.907 L 311.687,367.907\" fill=\"url(#hrqE)\"/><path d=\"M 70.25,404.656 L 21.562,417.5 L 75.562,471.5 L 109.656,471.5 L 93.126,487.0 L 140.156,474.562 L 70.25,404.656\" fill=\"url(#hrqE)\"/><polygon points=\"89.1,65.4 70.9,83.7 480.8,494.1 492.6,494.1 492.6,469.5\" fill=\"url(#hrqW)\"/><polygon points=\"366.9,112.1 352,127.2 492.6,267.8 492.6,237.8\" fill=\"url(#hrqW)\"/><polygon points=\"69.9,347.2 54.6,362.6 186.2,494.1 216.2,494.1\" fill=\"url(#hrqW)\"/><polygon points=\"277.3,385.5 264.1,398.7 360.3,494.8 386.7,494.8\" fill=\"url(#hrqW)\"/></svg>","flurry":"<svg viewBox=\"0 0 512 512\"><defs><linearGradient id=\"hflG\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fff3b8\"/><stop offset=\"1\" stop-color=\"#e09424\"/></linearGradient></defs><path d=\"M 174.844,14.875 C 221.944,57.15 252.968,105.225 270.156,152.938 C 200.613,126.285 119.028,114.165 32.0,129.155 C 128.11,120.718 212.524,142.155 277.625,176.875 C 320.65999999999997,338.655 207.16500000000002,484.227 26.655,369.03 C 139.325,464.907 228.13,470.847 281.595,429.938 C 589.072,507.478 520.498,273.83799999999997 308.96900000000005,169.844 C 283.083,114.03899999999999 239.22900000000004,59.14999999999999 174.84300000000005,14.873999999999995 L 174.844,14.875 Z M 323.0,205.345 C 446.38599999999997,296.095 462.423,432.96799999999996 284.344,427.781 C 336.51,385.317 353.196,296.868 323.0,205.345 Z\" fill=\"none\" stroke=\"#3d2c19\" stroke-width=\"34\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M 174.844,14.875 C 221.944,57.15 252.968,105.225 270.156,152.938 C 200.613,126.285 119.028,114.165 32.0,129.155 C 128.11,120.718 212.524,142.155 277.625,176.875 C 320.65999999999997,338.655 207.16500000000002,484.227 26.655,369.03 C 139.325,464.907 228.13,470.847 281.595,429.938 C 589.072,507.478 520.498,273.83799999999997 308.96900000000005,169.844 C 283.083,114.03899999999999 239.22900000000004,59.14999999999999 174.84300000000005,14.873999999999995 L 174.844,14.875 Z M 323.0,205.345 C 446.38599999999997,296.095 462.423,432.96799999999996 284.344,427.781 C 336.51,385.317 353.196,296.868 323.0,205.345 Z\" fill=\"url(#hflG)\" fill-rule=\"evenodd\"/></svg>","firm":"<svg viewBox=\"0 0 512 512\"><defs><linearGradient id=\"hfS\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#eef2f6\"/><stop offset=\"1\" stop-color=\"#8c96a3\"/></linearGradient><linearGradient id=\"hfG\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fff3b8\"/><stop offset=\"1\" stop-color=\"#e09424\"/></linearGradient></defs><g fill=\"none\" stroke=\"#3d2c19\" stroke-width=\"34\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M 19.3,19.4 L 18.9,47.2 L 286.1,202.0 L 227.4,221.9 L 285.0,241.3 L 142.1,383.5 L 122.9,364.3 L 71.4,478.6 L 194.5,435.1 L 177.0,416.2 L 328.9,264.3 L 341.3,307.4 L 364.3,238.9 L 421.0,222.3 L 363.5,206.8 L 340.6,127.0 L 326.4,175.3 L 57.8,19.9 L 19.3,19.4 L 19.3,19.4 Z\"/><path d=\"M 370.6,81.9 C 366.0,81.9 361.5,82.0 357.1,82.2 C 353.8,82.3 350.5,82.5 347.3,82.7 L 378.5,191.5 L 482.6,219.6 C 488.8,180.5 491.5,139.3 491.8,99.5 C 456.3,88.8 415.0,82.2 375.1,81.9 C 373.6,81.9 372.1,81.9 370.6,81.9 L 370.6,81.9 Z\"/><path d=\"M 333.7,84.0 C 301.7,87.6 272.7,96.1 250.7,109.9 L 315.2,147.2 L 333.7,84.0 L 333.7,84.0 Z\"/><path d=\"M 481.9,224.0 L 378.9,254.1 L 340.0,370.1 L 319.7,299.9 L 280.6,339.0 C 299.5,374.3 326.7,401.3 366.8,416.6 C 414.3,398.7 445.4,353.8 464.8,295.0 C 472.2,272.8 477.7,248.9 481.9,224.0 L 481.9,224.0 Z\"/></g><path d=\"M 370.6,81.9 C 366.0,81.9 361.5,82.0 357.1,82.2 C 353.8,82.3 350.5,82.5 347.3,82.7 L 378.5,191.5 L 482.6,219.6 C 488.8,180.5 491.5,139.3 491.8,99.5 C 456.3,88.8 415.0,82.2 375.1,81.9 C 373.6,81.9 372.1,81.9 370.6,81.9 L 370.6,81.9 Z\" fill=\"url(#hfS)\"/><path d=\"M 333.7,84.0 C 301.7,87.6 272.7,96.1 250.7,109.9 L 315.2,147.2 L 333.7,84.0 L 333.7,84.0 Z\" fill=\"url(#hfS)\"/><path d=\"M 481.9,224.0 L 378.9,254.1 L 340.0,370.1 L 319.7,299.9 L 280.6,339.0 C 299.5,374.3 326.7,401.3 366.8,416.6 C 414.3,398.7 445.4,353.8 464.8,295.0 C 472.2,272.8 477.7,248.9 481.9,224.0 L 481.9,224.0 Z\" fill=\"url(#hfS)\"/><path d=\"M 19.3,19.4 L 18.9,47.2 L 286.1,202.0 L 227.4,221.9 L 285.0,241.3 L 142.1,383.5 L 122.9,364.3 L 71.4,478.6 L 194.5,435.1 L 177.0,416.2 L 328.9,264.3 L 341.3,307.4 L 364.3,238.9 L 421.0,222.3 L 363.5,206.8 L 340.6,127.0 L 326.4,175.3 L 57.8,19.9 L 19.3,19.4 L 19.3,19.4 Z\" fill=\"url(#hfG)\"/></svg>","scorp":"<svg viewBox=\"0 0 512 512\"><defs><linearGradient id=\"hSb0\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#d9a46a\"/><stop offset=\"1\" stop-color=\"#8a5a30\"/></linearGradient></defs><g fill=\"url(#hSb0)\" stroke=\"#3d2c19\" stroke-width=\"34\" paint-order=\"stroke\" stroke-linejoin=\"round\"><path d=\"m58.076 315.052l24.923 23.666l-20.873 7.685l-40.947-38.87l13.729-14.465l.633.602l10.24 25.64zm212.883-27.218c-32.144 11.865-49.901 46.32-40.914 79.375c8.987 33.053 41.738 53.748 75.463 47.709c33.725-6.04 57.258-36.815 54.215-70.933c-3.043-34.12-31.654-60.27-65.918-60.243a66.2 66.2 0 0 0-22.846 4.092m81 3.115l-10.894-29.575l-24.341 8.962a82.94 82.94 0 0 1 35.255 20.644zM224.851 304.2L30.858 375.636l14.34 39.015l165.884-61.082a83.08 83.08 0 0 1 13.77-49.368zm246.84-46.574L457.32 218.6l-33.085 12.202l14.372 39.025zm19.129-133.348l-54.754-2.415l11.59 9.086l-53.564 21.486l6.995 17.552l53.937-21.631l-2.15 14.538zM202.255 229.161L52.368 293.996l2.966 6.43l153.484-55.023a32.9 32.9 0 0 1-6.553-16.294zM356.88 96l-51.923 19.128l11.994 32.577l23.656-11.268l16.429-7.82l6.303 17.063l21.029 56.949l6.303 17.061l-17.57 4.736l-25.38 6.833l40.167 109.162l51.923-19.128zm11.88 112.392l-124.252 33.5c-2.092.569-4.25.858-6.417.863c-8.308 0-15.743-4.424-18.402-11.642c-3.333-9.034 1.787-19.533 11.86-24.33l116.182-55.34zm-126.401 16.2c-.53-5.94-7.973-8.276-11.804-3.708c-3.83 4.569-.233 11.49 5.708 10.977a6.7 6.7 0 0 0 6.096-7.27z\"/></g><defs><linearGradient id=\"hSb1\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#eef2f6\"/><stop offset=\"1\" stop-color=\"#8c96a3\"/></linearGradient></defs><g fill=\"url(#hSb1)\"><path d=\"M58.076 315.052 l24.923 23.666 l-20.873 7.685 l-40.947 -38.87 l13.729 -14.465 l0.633 0.602 l10.24 25.64 Z\"/><path d=\"M490.82000000000005 124.27799999999996 l-54.754 -2.415 l11.59 9.086 l-53.564 21.486 l6.995 17.552 l53.937 -21.631 l-2.15 14.538 Z\"/></g><defs><linearGradient id=\"hSb2\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#a8703f\"/><stop offset=\"1\" stop-color=\"#5a3518\"/></linearGradient></defs><g fill=\"url(#hSb2)\"><path d=\"M270.959 287.834 c-32.144 11.865 -49.901 46.32 -40.914 79.375 c8.987 33.053 41.738 53.748 75.463 47.709 c33.725 -6.04 57.258 -36.815 54.215 -70.933 c-3.043 -34.12 -31.654 -60.27 -65.918 -60.243 a66.2 66.2 0 0 0 -22.846 4.092\"/></g></svg>","mend":"<svg viewBox=\"0 0 512 512\"><defs><linearGradient id=\"heMs\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#eef2f6\"/><stop offset=\"1\" stop-color=\"#8c96a3\"/></linearGradient><linearGradient id=\"heMw\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#c98a4e\"/><stop offset=\"1\" stop-color=\"#6b3f1d\"/></linearGradient></defs><path d=\"M170.375 18.594c-1.155 0-2.32.014-3.47.03c-25.176.37-49.134 5.08-68.78 13.94c84.13 7.937 156.965 61.77 119.28 122.53c-2.017 3.254-4.033 6.445-6.03 9.625l.47.186c-.933 2.4-.566 5.203 2.343 9.53c2.908 4.33 8.322 9.22 14.75 12.97c6.427 3.752 13.838 6.392 20.28 7.22c5.992.768 10.808-.054 14-1.94c1.7-2.696 3.416-5.415 5.157-8.155c21.695-8.632 57.903 11.51 65.22 29.22c1.34-14.225 6.522-29.91 15.342-45.188c6.697-11.598 14.627-21.517 23.157-29.25c-20.304 7.277-30.037-6.764-38.563-34.187c-8.197-26.38-36.394-47.365-58.155-59.844c-31.287-17.92-69.206-26.65-105-26.686z M409.405 140.531c-4.01-.034-9.278 1.558-15.592 5.564c-9.622 6.103-20.325 17.327-28.688 31.812c-8.363 14.486-12.713 29.366-13.188 40.75c-.474 11.385 2.692 17.85 6.688 20.156c3.996 2.307 11.222 1.823 20.844-4.28c9.62-6.104 20.323-17.297 28.686-31.782s12.713-29.365 13.188-40.75c.474-11.385-2.693-17.88-6.688-20.188c-.998-.576-2.206-.973-3.594-1.156c-.52-.068-1.083-.12-1.656-.125z M198.59499999999997 184.813C80.93 367.197 4.35 418.813 21.937 462.875c8.065 20.204 31.467 36.36 55.218 28.78c49.34-15.74 59.974-94.006 173.094-278.124a55 55 0 0 1-3.406-.343c-9.516-1.22-18.924-4.76-27.313-9.656c-8.387-4.895-15.804-11.11-20.874-18.655c-.016-.024-.046-.04-.062-.063z M492.0 256.97l-110.438 22.436l51.313 15.53l31.47 148.94l18.31-3.845l-31.467-148.81z M291.875 272.84400000000005l-80 79.375l51.438-15.19l68.093 67.564L308.28 489.5l18.064 4.906l20.312-74.656l24.72 24.5L384.53 431l-32.217-31.97l14-51.5l52.125-12.56l-108.97-28.75l38.75 36.56l-11.187 41.095l-60.467-60l15.312-51.03z\" fill=\"none\" stroke=\"#3d2c19\" stroke-width=\"34\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M198.59499999999997 184.813C80.93 367.197 4.35 418.813 21.937 462.875c8.065 20.204 31.467 36.36 55.218 28.78c49.34-15.74 59.974-94.006 173.094-278.124a55 55 0 0 1-3.406-.343c-9.516-1.22-18.924-4.76-27.313-9.656c-8.387-4.895-15.804-11.11-20.874-18.655c-.016-.024-.046-.04-.062-.063z\" fill=\"url(#heMw)\"/><path d=\"M170.375 18.594c-1.155 0-2.32.014-3.47.03c-25.176.37-49.134 5.08-68.78 13.94c84.13 7.937 156.965 61.77 119.28 122.53c-2.017 3.254-4.033 6.445-6.03 9.625l.47.186c-.933 2.4-.566 5.203 2.343 9.53c2.908 4.33 8.322 9.22 14.75 12.97c6.427 3.752 13.838 6.392 20.28 7.22c5.992.768 10.808-.054 14-1.94c1.7-2.696 3.416-5.415 5.157-8.155c21.695-8.632 57.903 11.51 65.22 29.22c1.34-14.225 6.522-29.91 15.342-45.188c6.697-11.598 14.627-21.517 23.157-29.25c-20.304 7.277-30.037-6.764-38.563-34.187c-8.197-26.38-36.394-47.365-58.155-59.844c-31.287-17.92-69.206-26.65-105-26.686z M409.405 140.531c-4.01-.034-9.278 1.558-15.592 5.564c-9.622 6.103-20.325 17.327-28.688 31.812c-8.363 14.486-12.713 29.366-13.188 40.75c-.474 11.385 2.692 17.85 6.688 20.156c3.996 2.307 11.222 1.823 20.844-4.28c9.62-6.104 20.323-17.297 28.686-31.782s12.713-29.365 13.188-40.75c.474-11.385-2.693-17.88-6.688-20.188c-.998-.576-2.206-.973-3.594-1.156c-.52-.068-1.083-.12-1.656-.125z M492.0 256.97l-110.438 22.436l51.313 15.53l31.47 148.94l18.31-3.845l-31.467-148.81z M291.875 272.84400000000005l-80 79.375l51.438-15.19l68.093 67.564L308.28 489.5l18.064 4.906l20.312-74.656l24.72 24.5L384.53 431l-32.217-31.97l14-51.5l52.125-12.56l-108.97-28.75l38.75 36.56l-11.187 41.095l-60.467-60l15.312-51.03z\" fill=\"url(#heMs)\"/></svg>","rapid":"<svg viewBox=\"0 0 512 512\"><defs><linearGradient id=\"heRg\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#eef2f6\"/><stop offset=\"1\" stop-color=\"#8c96a3\"/></linearGradient><linearGradient id=\"heRs\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#c98a4e\"/><stop offset=\"1\" stop-color=\"#6b3f1d\"/></linearGradient></defs><path d=\"M20.91 20.002v32.29l357.793 338.9L20.91 101.407v58.942l355.942 250.224l-86.89-17.527l26.913 30.947l-70.502 3.008l245.633 64.603l-65.502-249.054l-15.352 92.36l-27.3-31.46l16.683 60.464L161.26 20.002h-22.37l142.276 208.935L109.496 42.17l98.975 138.547L45.194 20.002z\" fill=\"none\" stroke=\"#3d2c19\" stroke-width=\"34\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M20.91 20.002v32.29l357.793 338.9L20.91 101.407v58.942l355.942 250.224l-86.89-17.527l26.913 30.947l-70.502 3.008l245.633 64.603l-65.502-249.054l-15.352 92.36l-27.3-31.46l16.683 60.464L161.26 20.002h-22.37l142.276 208.935L109.496 42.17l98.975 138.547L45.194 20.002z\" fill=\"url(#heRs)\"/><path d=\"M400.53 363.9L383.85 303.45L411.15 334.9L426.5 242.55L492 491.6L246.37 427L316.87 424L289.96 393.05L376.85 410.57L378.7 391.19Z\" fill=\"url(#heRg)\"/></svg>"};
// each use gets its own gradient and clip names (a copy in a hidden card would otherwise leave the others unfilled), and the
// banner takes the town's colour like the upgrades' pictures (upIco)
let heroIcoN = 0;
const HERO_ICO = new Proxy(HERO_ICO_SRC, { get: (t, k) => {
  const n = ++heroIcoN, c = new THREE.Color(); c.setStyle(TEAM_PAL[TEAM.town]); const lt = '#' + c.clone().lerp(new THREE.Color(1, 1, 1), .45).getHexString();
  return (t[k] || '').replace(/(id="|url\(#)(h[a-zA-Z0-9]+)/g, `$1$2_${n}`).replace(/#9cc5ff/g, lt).replace(/#2f5faf/g, TEAM_PAL[TEAM.town]);
} });
// health, then damage (a bow for the Ranger, with the reach), then the Heir's speed
const heroStats = (hp, bad) => STAT('hp', hp, bad ? 'bad' : '') + (heroDef().range ? STAT('bow', `${heroDmg()}`) + STAT('range', `${heroRange()} m`) : STAT('sword', `${heroDmg()}`)) + STAT('speed', `${heroSpeed()}`);
const heroShown = () => heroOn() && !gameOver && !menuOn() && !galleryOn && !showcaseBuilt && !!castleB();
function heroUI() {
  const bar = $('#heroBar'), card = $('#heroCard'); if (!bar) return;
  const on = heroShown(); bar.hidden = !on; if (!on) { card.hidden = true; return; }
  if (selected && heroSel) heroSel = false;
  // one-time tips (Jack): how to move the hero, once a day is under way and the tutorial's guide is done
  if (hero && !guideOn && !gameOver && PH.kind === 'day') tipOnce('hero', `Tap the <b>${heroName().replace(/^The /, "")}</b>'s portrait to move them`);
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
  // no Inspire standard in the portraits (Jack: it stood up behind the head)
  if (p.standard) { p.standard.visible = false; p.standard = null; p.pennant = null; }
  // the Engineer's cap casts no shadow in the portraits (the old kettle hat's brim darkened his whole face: Jack)
  if (id === 'engineer') for (const o of p.kit || []) if (o.userData && o.userData.helm) o.traverse(m => { if (m.isMesh) m.castShadow = false; });
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
  const lo = 0;
  cxCam.position.set(hd.x + .14, hd.y + .1 - lo, hd.z + 1.05); cxCam.lookAt(hd.x, hd.y - .02 + lo * .2, hd.z);
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
const HEROES = ['heir', 'ranger', 'captain', 'engineer'];
function rosterModel(id) { return heroModel(id).p; }
// each portrait drawn once, a still bust like the Heir's, by the Archive's small renderer
function rosterSnaps(el) {
  codexRenderer();
  el.querySelectorAll('.hrCv').forEach(cv => {
    const p = rosterModel(cv.dataset.h), g = p.g; cxScene.add(g); g.updateMatrixWorld(true);
    const hd = p.headParts[0].getWorldPosition(new THREE.Vector3());
    codexStage({ r: .01, k: 1.2, c: hd.clone() });
    const lo = 0;
    cxCam.position.set(hd.x + .22, hd.y + .1 - lo, hd.z + 1.2); cxCam.lookAt(hd.x, hd.y - .06 + lo * .2, hd.z);
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
document.addEventListener('click', e => { if (HEROES_ON && e.target.closest('#campHeroBtn')) openHeroPick(); });
// the admin's helpers (testing)
// beta only: Settings' Heroes On / Off hides every hero for a recording; the choice takes effect on a reload
function syncHeroSet() {
  const w = $('#heroSet'); if (!w) return; w.hidden = !window.MTD_BETA; const cc = $('#colCard'); if (cc) cc.classList.toggle('rowSet', !!window.MTD_BETA);
  for (const b of document.querySelectorAll('[data-heroes]')) b.classList.toggle('on', (b.dataset.heroes === 'on') === HEROES_ON);
}
syncHeroSet();
document.addEventListener('click', e => {
  const b = e.target.closest('[data-heroes]'); if (!b || !window.MTD_BETA) return;
  const on = b.dataset.heroes === 'on'; if (on === HEROES_ON) return;
  try { if (on) localStorage.removeItem('mtd-heroes-off'); else localStorage.setItem('mtd-heroes-off', '1'); } catch (e2) {}
  location.reload();
});
function syncHeroAdmin() { const hb = $('#campHeroBtn'); if (hb) { hb.hidden = !HEROES_ON; syncHeroBadge(); } }
$('#adHeroLv').addEventListener('click', () => { if (HERO.lv < HERO_MAX) heroXp(heroNeed() - HERO.xp); syncHeroBadge(); heroUI(); });
$('#adHeroReset').addEventListener('click', () => {
  HERO = heroBlank(); saveHero(); syncHeroBadge(); if (hero) { const x = hero.x, z = hero.z; heroKit(hero); hero.x = x; hero.z = z; } heroKey = ''; heroUI();
});
syncHeroAdmin();

// ---- the gallery's hero demos (Jack: each skill's look and each hero's level-up on a loop, easier to see than in a fight) ----
// galPose hands any figure with `demo` here; the effects are the game's own (sparks, glints, trails, rings, the level-up column),
// put into the gallery's scene while it is open (fxScene); arrows are the gallery's own, flown by galFxTick
const galArrows = [];
// look: undefined a plain arrow, 'gold' Quick draw's glowing one, 'sparks' glowing with a trail of sparks; streak: Twin shot's rank
// flat: the Engineer's shots, flown dead straight: 'qbolt' his crossbow's bolt, 'bolt' the field scorpion's heavy bolt (stuck in the ground after)
function galArrow(from, to, look, streak, flat) {
  const m = flat === 'bolt' ? new THREE.Mesh(SHOT.bolt.geo, arrowMat) : flat === 'qbolt' ? new THREE.Mesh(SHOT.qbolt.geo, look ? glowArrowM : SHOT.qbolt.m || arrowMat) : new THREE.Mesh(ARROW_GEO, look && look !== 'feather' ? ARROW_GOLD : ARROW_PLAIN), glow = look === 'sparks', feather = look === 'feather'; m.position.copy(from); gScene.add(m);
  if (flat === 'bolt') m.scale.setScalar(SCORP_BOLT);
  m.lookAt(to); galArrows.push({ m, from: from.clone(), to: to.clone(), t: 0, dur: Math.max(.2, from.distanceTo(to) / (flat ? 25 : 20)), glow, feather, arc: flat ? 0 : .35, flat });
  if (streak) arrowStreak(m, streak, () => galArrows.some(a => a.m === m));
}
function galFxTick(dt) {
  updatePuffs(dt); updateFloats(dt); heroSpriteTick(dt); streakTick();
  for (let n = galArrows.length - 1; n >= 0; n--) {
    const a = galArrows[n]; a.t += dt / a.dur; const k = Math.min(1, a.t), m = a.m, p = m.position.clone();
    m.position.lerpVectors(a.from, a.to, k); m.position.y += a.arc * 4 * k * (1 - k); m.lookAt(m.position.clone().add(m.position.clone().sub(p)));
    if (a.glow) sparkBurst(m.position.x, m.position.y - .05, m.position.z, '#ffd36a', 1);
    if (k >= 1) { if (a.feather) featherPuff(a.to); sparkBurst(a.to.x, a.to.y, a.to.z, a.glow ? '#ffd36a' : '#e8d8b0', 3); unparent(m); galArrows.splice(n, 1); }
  }
}
const crossed = (prev, now, at) => prev < at && now >= at;
function galDemo(p, t, dt) {
  const id = p.heroId, d = p.demo, x0 = p.g.position.x, z0 = p.g.position.z, fw = p.g.rotation.y, fx = Math.sin(fw), fz = Math.cos(fw), now = t * 1000;
  p.rx = p.x = x0; p.rz = p.z = z0; p.g.position.y = 0; p.g.rotation.x = 0;
  p.arms[0].rotation.x = -.55; if (p.cape) capeWave(p, t, .15);
  const T = (t + p.seed), chest = .8 * UNIT_K, foeAt = e => new THREE.Vector3(e.g.position.x, chest, e.g.position.z), r = skR(d, p);
  const blow = c => swordPose(p, Math.max(0, SWORD_T - c), 0);
  const bowAt = () => { p.g.updateMatrixWorld(true); return (p.pivot || p.arms[0]).getWorldPosition(new THREE.Vector3()); };
  // knocked-back raiders drift back to where they stood
  for (const e of p.foes || []) if (e.home) { e.kb = Math.max(0, e.kb - dt * .6); e.g.position.set(e.home.x + fx * e.kb, 0, e.home.z + fz * e.kb); }
  if (d === 'lv') {                                               // a level gained, every 3.2 s
    if ((p.lvC = (p.lvC == null ? .6 : p.lvC) - dt) <= 0) { p.lvC = 3.2; p.lvUpT = LVUP_T; p.lvGlint = false; }
    if (id === 'ranger') bowPose(p, false, false, -.35, 0); else if (id === 'engineer') xbowPose(p, false); else blow(0);
    lvUpFx(p, dt, now, id, 'g-lv' + p.seed, p); return;
  }
  if (d === 'cry') {                                              // Inspire: gold sparks on the troops' weapons beside the Heir
    blow(T % 1.6);
    if ((p.sparkT = (p.sparkT || 0) - dt) <= 0) { p.sparkT = [.8, .8, .5, .3][r]; const u = p.mates[Math.floor(Math.random() * p.mates.length)];
      if (u.pivot) { const w = u.pivot.getWorldPosition(new THREE.Vector3()); sparkBurst(w.x, w.y - .1, w.z, '#ffd24a', r >= 2 ? 2 : 1); } }
    if (p.pennant) { standardHold(p); pennantWave(p, now, false); }
    for (const u of p.mates) heroTrail(u, SWORD_LINE, '#a88a30', r >= 3 && (t + u.seed) % 1.6 < SWORD_T);
    return;
  }
  if (d === 'flurry') {                                           // two blows, then the burst: a glint, ×3, three quick blows with a trail
    const c = T % 3.2, ci = Math.floor(T / 3.2), prev = p.prevC == null ? c : p.prevC; p.prevC = c;
    let quick = false;
    // the Heir's blows alternate the overhead chop and the thrust, the quick ones too, as in the game (heroStrike)
    const hit = (n, rem) => { if (n % 2) { swordPose(p, 0, 0); thrustPose(p, rem, 0); } else { thrustPose(p, 0, 0); swordPose(p, rem, 0); } };
    if (c < 1.6) hit(Math.floor(c / .8), Math.max(0, SWORD_T - c % .8));
    else { const q = c - 1.6, n = Math.floor(q / .3), cq = q - n * .3;
      if (n < r + 1) { quick = true; hit(n, Math.max(0, SWORD_T * (1 - cq / .3)));
        if (crossed(prev - 1.6 - n * .3, cq, .16) && p.foes[0]) { const w = foeAt(p.foes[0]); sparkBurst(w.x, w.y + .1, w.z, '#ffe9a8', [3, 3, 5, 7][r]);
          // rank 3: the last quick blow, a thrust, drives the raider back with dust
          if (r >= 3 && n === r) { p.foes[0].kb = .45; for (let i = 0; i < 4; i++) dustAt(w.x + (Math.random() - .5) * .5, 0, w.z + (Math.random() - .5) * .5); } } }
      else blow(0); }
    if (p.burstCi !== ci && c >= 1.5) { p.burstCi = ci; floatText('×' + (r + 1), '#ffd768', x0 + .7, 1.25, z0); }
    heroTrail(p, SWORD_LINE, r >= 3 ? '#ffd24a' : '#8c7228', quick && r >= 2); return;
  }
  if (d === 'horse') {                                            // Royal horse: dust behind the hooves, the flaps flutter, a rear-up
    blow(0);
    if ((p.hoofT = (p.hoofT || 0) - dt) <= 0) { p.hoofT = [.18, .18, .1, .07][r]; dustAt(x0 - fx * .7, 0, z0 - fz * .7); }
    if (p.flaps) p.flaps.forEach((h, i) => { h.rotation.z = h.userData.flap * (.35 + Math.sin(now / 90 + i * 1.7) * .12); });
    const c = T % 4; if (r >= 3 && c < 1.3) { const k = Math.sin(Math.PI * c / 1.3); p.g.rotation.order = 'YXZ'; p.g.rotation.x = -.5 * k; p.g.position.y = .25 * k; }
    return;
  }
  if (d === 'scorp' || d === 'mend' || d === 'rapid') {          // the Engineer: a bolt every 2 s, the scorpion, repairs, quicker bolts
    const c = T % 2, prev = p.prevC == null ? c : p.prevC; p.prevC = c;
    xbowPose(p, d === 'rapid' || (d !== 'mend' && c > .6 && c < 1.3));
    if (d === 'scorp') {
      if (!p.scorpM || p.scorpM.rk !== r) { if (p.scorpM) gScene.remove(p.scorpM.g); const S = p.scorpM = makeScorpion(r); S.rk = r;
        S.g.position.set(x0 + fz * 1.1, 0, z0 - fx * 1.1); S.g.rotation.y = fw; scorpPose(S, 1); gScene.add(S.g); }
      if (crossed(prev, c, 1)) { const S = p.scorpM.g.position, fr = scorpMuzzle(p.scorpM), f = foeAt(p.foes[0]), to = f.clone().sub(fr).setY(0).normalize().multiplyScalar(Math.hypot(f.x - fr.x, f.z - fr.z) + 1).add(fr).setY(0); galArrow(fr, to, undefined, r >= 3 ? 2 : 0, 'bolt');
        if (r >= 3) for (let i = 0; i < 3; i++) dustAt(S.x, 0, S.z); p.scorpM.fireT = .35; }
      scorpRig(p.scorpM, clamp(((c + 1) % 2) / 1.6, 0, 1), dt);
    } else if (d === 'rapid') {
      // Rapid fire: a bolt every 1.2 s, 40/70/100% faster by rank; a streak behind it from rank 2, gold with sparks at 3
      const per = 1.2 / (1 + [0, .4, .7, 1][r]), c2 = T % per, pv = p.prevR == null ? c2 : p.prevR; p.prevR = c2;
      if (c2 < pv) galArrow(xbowPoint(p), foeAt(p.foes[0]), r >= 3 ? 'sparks' : undefined, r >= 2 ? 2 : 0, 'qbolt');
    } else if (p.prop) {
      // Repairs: gold specks rising off the building beside him, more often at rank 2, a ring of sparks round it at 3
      const P = p.prop.position;
      if ((p.mendFx = (p.mendFx || 0) - dt) <= 0) { p.mendFx = [.5, .5, .28, .2][r]; sparkBurst(P.x + (Math.random() - .5), .4 + Math.random(), P.z + (Math.random() - .5), '#ffe08a', 1); }
      if (r >= 3 && (p.ringT = (p.ringT || 0) - dt) <= 0) { p.ringT = 2.5; mendRing(P.x, 0, P.z, .75); }
    }
    return;
  }
  if (d === 'twin' || d === 'eye' || d === 'quick') {            // the Ranger: a shot every 1.8 s at the raider ahead
    const per = d === 'quick' ? 5 : 1.8, c = T % per, prev = p.prevC == null ? c : p.prevC; p.prevC = c;
    let nk = p.pivot && p.pivot.userData.nock;
    if (p.pivot && !nk) { nk = p.pivot.userData.nock = new THREE.Group(); for (const x of [-.018, .018]) nk.add(box(.012, .6, .012, arrowWoodM, x, -.18, 0), box(.006, .09, .05, fletchM, x, .08, 0)); p.pivot.add(nk); }
    if (d === 'quick' && c >= 3.6) {                              // Quick draw's burst: a glint, then four glowing arrows a quarter second apart
      const q = c - 3.6, n = Math.floor(q / .25), cq = q - n * .25;
      bowPose(p, n < 4 && cq < .08, n < 4 && cq >= .08, -.35, 0);
      if (n < 4 && crossed(prev - 3.6 - n * .25, cq, .08)) { galArrow(bowAt(), foeAt(p.foes[0]), [0, 0, 'gold', 'sparks'][r] || undefined); p.fanT = .2; }
    } else {
      const cc = c % 1.8, pc = prev % 1.8;
      bowPose(p, cc > .6 && cc < 1.05, cc >= 1.05 && cc < 1.4, -.35, 0);
      if (crossed(pc, cc, 1.05)) {
        const b = bowAt();
        if (d === 'twin') p.foes.forEach((e, i) => galArrow(b, foeAt(e), r >= 3 ? 'feather' : undefined, (i ? r >= 2 : r >= 3) ? r : 0));
        else galArrow(b, foeAt(p.foes[0]));
      }
      if (nk) nk.visible = d === 'twin' && cc > .6 && cc < 1.05;
    }
    if (nk && d !== 'twin') nk.visible = false;
    if (p.fanT > 0) { p.fanT -= dt; const f = 1 - p.fanT / .2, k = f < .5 ? f * 2 : (1 - f) * 2; p.arms[1].rotation.set(-1.42 - 1.9 * k, 0, -.62 + .5 * k); }
    if (d === 'eye') {                                            // Eagle eye: the eagle circling over the Ranger, his reach ring in blue
      // a plain hawk circling higher at rank 1, the eagle at 2, a bigger eagle at 3
      if (!p.eagle) { p.eagle = makeEagle(r < 2); gScene.add(p.eagle.g); }
      const a = t * .55; p.eagle.g.position.set(x0 + Math.cos(a) * 1.6, (r < 2 ? 3.8 : 3.2) + Math.sin(a * 2) * .2, z0 + Math.sin(a) * 1.6);
      p.eagle.g.rotation.set(0, -a, .35); p.eagle.g.scale.setScalar(EAGLE_K * [.75, .75, 1, 1.15][r]);
      p.eagle.flap(Math.sin(t * 2.2) > .55 ? Math.sin(now / 110) * .45 : 0);
      heroRing('g-eye' + p.seed + '-' + r, 2, '#8fc1db', .45, p);
    }
    return;
  }
  if (d === 'firm') {                                             // Deflect: now and then a blow glances off, steel sparks and the share in grey
    blow(T % 1.6); const c = T % 2.2, prev = p.prevC == null ? c : p.prevC; p.prevC = c;
    if (crossed(prev, c, 1.1)) { p.blockAt = now; p.blockFx = deflectFx(r); if (r >= 3) for (const e of p.foes || []) e.kb = .35; floatText(`−${[15, 15, 25, 35][r]}%`, '#c9ced6', x0 + .5, 1.5, z0); }
    // the shield snapped up across the body as the blow glances off, as in the game (Jack couldn't see it in the gallery)
    { const bq = blockK(p, now); if (bq) shieldUp(p, bq); else shieldDown(p); }
    return;
  }
  if (d === 'sweep') {                                            // Sweeping blow: a blow, then the spin with a steel trail, dust, raiders knocked back
    const c = T % 2.6, prev = p.prevC == null ? c : p.prevC; p.prevC = c; const sw = c >= 1.2 && c < 1.2 + SWEEP_T;
    if (sw) { sweepPose(p, (SWEEP_T - (c - 1.2)) * SWORD_T / SWEEP_T, 0); if (p.cape && r >= 3) p.cape.forEach((h, i) => { h.rotation.x = i ? .25 : 1.15; }); }
    else blow(c < .9 ? c : 0);
    if (crossed(prev, c, 1.6)) { const cx = x0 + fx * .9, cz = z0 + fz * .9, n = [6, 6, 12, 16][r], rad = [.5, .5, .75, .95][r];
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; dustAt(cx + Math.cos(a) * rad, 0, cz + Math.sin(a) * rad); }
      for (const e of p.foes) e.kb = .5; }
    heroTrail(p, HAMMER_LINE, r >= 3 ? '#ffd24a' : '#7e848c', sw && r >= 2); return;
  }
  if (d === 'wind') {                                             // Second wind: green-white specks drift up, a slow breath every 4 s
    blow(0);
    if ((p.windFx = (p.windFx || 0) - dt) <= 0) { p.windFx = [.5, .5, .25, .16][r]; const a = Math.random() * 6.283; sparkBurst(x0 + Math.cos(a) * .22, .3 + Math.random() * .6, z0 + Math.sin(a) * .22, '#d6ffd9', 1); }
    if (r >= 3 && (p.orbT = (p.orbT || 0) - dt) <= 0) { p.orbT = .55; windOrb(x0, 0, z0); }
    const D = r >= 2 ? 1.4 : .9, c = T % 4, k = c < D ? Math.sin(Math.PI * c / D) : 0; windPose(p, r, k);
  }
}
