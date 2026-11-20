// A draft of a fourth hero, the Engineer (Jack), built from the game's own parts but not in the game yet.
// Rebuilt from the first account's draft (never pushed), from Jack's screenshots of it:
// a grey-brown padded coat, a heavy leather apron with two pockets and brass rivets, a belt in the town's colour,
// a steel kettle hat with a town-colour band, a wooden tool chest on his back (iron bands, a coil of rope on top),
// a mallet at his hip, a crossbow raised to aim like the tower crossbowmen, and a field scorpion beside him:
// a small ballista (the town ballista's own top) on a timber tripod.
// node tools/render/engineer-draft.js [out-dir]   writes front, three-quarter, side, back and scorpion shots, and sheet.png
const fs = require('fs'), path = require('path');
const { openGame } = require('./serve');
const OUT = path.resolve(process.argv[2] || 'design/characters/engineer');

const BUILD = `
  paused = true;
  trunks.visible = crowns.visible = false;
  CL.forEach(c => { if (c.kind === 'bush') c.mesh.visible = false; });
  for (const v of villagers) v.g.visible = false;
  for (const e of enemies) e.g.visible = false;
  // an open spot of grass away from the town
  const X = 55, Z = 12, Y = hAt(X, Z);
  const old = window.__eng; if (old) old.forEach(o => o.parent && o.parent.remove(o));
  const made = window.__eng = [];
  const brassM = mat('#c9a34a'), ropeM2 = mat('#b59a63');
  const coatM = quiltMat('#7a6f60', '#5f564a');
  const apronM2 = (() => { const m = mat('#6b4a2c'); m.side = THREE.DoubleSide; return m; })();

  // the Engineer himself
  const p = makePerson({ tunic: coatM, hair: hairs[1], tool: 'crossbow' });
  p.g.position.set(X, Y, Z); made.push(p.g);
  const add = o => { o.traverse(m => { if (m.isMesh) m.castShadow = true; }); p.body.add(o); return o; };
  p.headParts[2].visible = false;
  // padded coat: a longer quilted skirt below the waist
  add(cyl(.205, .232, .2, 10, coatM, 0, .36, 0));
  // the heavy leather apron round the front, from the chest to the knees, close on the coat
  const ap = new THREE.Mesh(new THREE.CylinderGeometry(.152, .238, .56, 12, 1, true, -Math.PI / 3, Math.PI * 2 / 3), apronM2);
  ap.position.y = .57; add(ap);
  // two pockets with brass rivets at their corners
  for (const sx of [-1, 1]) {
    const px = sx * .085, a = Math.asin(px / .214), pz = Math.cos(a) * .214 + .006;
    const pk = box(.085, .09, .012, leatherM, px, .44, pz); pk.rotation.y = a; add(pk);
    for (const dx of [-.034, .034]) { const r = new THREE.Mesh(new THREE.SphereGeometry(.009, 6, 4), brassM); r.position.set(px + dx * Math.cos(a), .48, pz + .006 - dx * Math.sin(a)); add(r); }
  }
  // a belt in the town's colour over the apron
  add(cyl(.196, .196, .045, 12, kiteM, 0, .6, 0));
  const bk = box(.04, .04, .012, brassM, 0, .6, .198); add(bk);
  // the steel kettle hat: a dome, a broad sloping brim and a band in the town's colour
  const hat = new THREE.Group(); hat.userData.helm = true;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(.152, 14, 7, 0, Math.PI * 2, 0, Math.PI * .5), steelM); dome.position.y = 1.07; dome.scale.y = .92; hat.add(dome);
  hat.add(cyl(.17, .285, .035, 16, steelM, 0, 1.06, 0));
  hat.add(cyl(.155, .155, .03, 16, kiteM, 0, 1.095, 0));
  add(hat);
  // the tool chest strapped to his back: iron bands, a lid, a coil of rope on top, straps over the shoulders
  const ch = new THREE.Group(); ch.position.set(0, .7, -.24);
  ch.add(box(.24, .22, .12, M.wood, 0, 0, 0));
  ch.add(box(.25, .03, .13, M.timber, 0, .12, 0));
  for (const y of [-.06, .06]) ch.add(box(.25, .02, .13, M.iron, 0, y, 0));
  const coil = new THREE.Mesh(new THREE.TorusGeometry(.06, .022, 6, 14), ropeM2); coil.rotation.x = Math.PI / 2; coil.position.y = .155; ch.add(coil);
  add(ch);
  for (const sx of [-1, 1]) { const s = box(.035, .3, .02, leatherM, sx * .1, .77, .0); add(s);
    const f = box(.035, .02, .2, leatherM, sx * .1, .92, -.09); add(f); }
  // a mallet at his right hip
  const ml = new THREE.Group(); ml.position.set(.21, .52, .05); ml.rotation.z = .15;
  ml.add(box(.022, .22, .022, M.timber, 0, -.08, 0));
  const hd = cyl(.045, .045, .12, 8, M.wood, 0, .04, 0); hd.rotation.x = Math.PI / 2; ml.add(hd);
  add(ml);
  // the crossbow raised to aim, as the tower crossbowmen do
  xbowPose(p, true);

  // the field scorpion beside him: the town ballista's top on a timber tripod
  const sc = new THREE.Group(); sc.position.set(X + 1.1, Y, Z - .2); sc.rotation.y = 0; scene.add(sc); made.push(sc);
  const top = .62;
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + Math.PI / 6, L = .7;
    const leg = box(.05, L, .05, M.timber, Math.sin(a) * .2, top / 2, Math.cos(a) * .2);
    leg.rotation.set(-Math.cos(a) * .33, 0, Math.sin(a) * .33); leg.castShadow = true; sc.add(leg); }
  sc.add(cyl(.09, .09, .06, 8, M.timber, 0, top, 0));
  const tu = ballistaTurret(BALLISTA_K[0] * .62); tu.position.y = top - .02; sc.add(tu);
  tu.traverse(m => { if (m.isMesh) m.castShadow = true; });
  window.__sc = sc;
  return [X, Y, Z];
`;

// one shot: the camera at (yaw, pitch, dist) round a point, rendered at once and read back
const SHOT = (x, y, z, yaw, pitch, d, fov) => `
  camera.fov = ${fov}; camera.updateProjectionMatrix();
  camera.position.set(${x} + Math.sin(${yaw}) * Math.cos(${pitch}) * ${d}, ${y} + Math.sin(${pitch}) * ${d}, ${z} + Math.cos(${yaw}) * Math.cos(${pitch}) * ${d});
  camera.lookAt(${x}, ${y}, ${z});
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/png');
`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const env = await openGame('index.html?debug&map=plains', { viewport: { width: 700, height: 900 }, deviceScaleFactor: 1, settle: 5000 });
  const { page } = env;
  const [X, Y, Z] = await page.evaluate(c => window.G(c), `(() => {${BUILD}})()`);
  await page.waitForTimeout(500);
  const h = Y + .55, shots = [['front', 0], ['three-quarter', .8], ['side', Math.PI / 2], ['back', Math.PI]];
  await page.evaluate(c => window.G(c), 'window.__sc.visible = false');
  for (const [n, a] of shots) {
    const url = await page.evaluate(c => window.G(c), `(() => {${SHOT(X, h, Z, a, .12, 2.6, 30)}})()`);
    fs.writeFileSync(path.join(OUT, n + '.png'), Buffer.from(url.split(',')[1], 'base64'));
  }
  await page.evaluate(c => window.G(c), 'window.__sc.visible = true');
  const url = await page.evaluate(c => window.G(c), `(() => {${SHOT(X + .55, Y + .5, Z - .1, .55, .32, 4.2, 30)}})()`);
  fs.writeFileSync(path.join(OUT, 'scorpion.png'), Buffer.from(url.split(',')[1], 'base64'));
  if (env.errors.length) console.log('page errors:', env.errors.join('\n'));
  await env.close();
  console.log('wrote', OUT);
})();
