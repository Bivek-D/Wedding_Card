// 3D stage for the hero (three.js / WebGL).
// Real cloth curtains whose folds deepen as they gather, sway after opening, real light and
// shadows, a valance that drops in as the curtains part, 3D pearls, the altar standing in
// front of the back wall, and tilt/pointer depth. If WebGL isn't available this file does
// nothing and the SVG curtains in main.js carry on as before.
// World units are CSS pixels: the z = 0 plane fills the hero exactly.
import * as THREE from "./vendor/three.module.min.js";

const hero = document.getElementById("hero");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = (v) => (v < .5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);
const easeOutBack = (v) => { const c = 1.9; return 1 + (c + 1) * Math.pow(v - 1, 3) + c * Math.pow(v - 1, 2); };
const RED = "#c8202a", IVORY = "#fbefdc";

function webglOK() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); }
  catch (e) { return false; }
}
const loadImage = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

// ---------------------------------------------------------------- textures (drawn once)
function curtainTexture() {
  // u across the cloth (0 outer edge → 1 inner edge), v down. 1 css px ≈ 5 texture px.
  const W = 1024, H = 2048, c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  const silk = g.createLinearGradient(0, 0, W, 0);
  silk.addColorStop(0, "#efd8b6"); silk.addColorStop(.5, "#fbefdc"); silk.addColorStop(1, "#fff6e8");
  g.fillStyle = silk; g.fillRect(0, 0, W, H);
  // scattered five-petal red flowers
  g.fillStyle = RED;
  const flower = (x, y, r) => {
    for (let i = 0; i < 5; i++) { const a = i * 2 * Math.PI / 5 - Math.PI / 2; g.beginPath(); g.arc(x + Math.cos(a) * r * 1.7, y + Math.sin(a) * r * 1.7, r, 0, 7); g.fill(); }
    g.fillStyle = IVORY; g.beginPath(); g.arc(x, y, r * .7, 0, 7); g.fill(); g.fillStyle = RED;
  };
  for (let y = 40; y < H; y += 110) for (let x = 40; x < W - 90; x += 120) flower(x + ((y / 110) % 2) * 60, y, 7);
  // lattice band helper (red with ivory diamonds)
  const lattice = (x, y, w, h, cell) => {
    g.fillStyle = RED; g.fillRect(x, y, w, h);
    g.strokeStyle = IVORY; g.lineWidth = cell * .1;
    for (let yy = y; yy < y + h; yy += cell) for (let xx = x; xx < x + w; xx += cell) {
      g.beginPath(); g.moveTo(xx + cell / 2, yy + 3); g.lineTo(xx + cell - 3, yy + cell / 2); g.lineTo(xx + cell / 2, yy + cell - 3); g.lineTo(xx + 3, yy + cell / 2); g.closePath(); g.stroke();
    }
  };
  // cross bands
  const bar = (y, h) => { g.fillStyle = RED; g.fillRect(0, y, W, h); };
  bar(H * .30 - 22, 14); lattice(0, H * .30, W, 110, 55); bar(H * .30 + 118, 14);
  bar(H * .78 - 26, 18);
  g.fillStyle = IVORY; g.fillRect(0, H * .78, W, 190);
  for (let x = 0; x < W; x += 110) { g.fillStyle = RED; g.beginPath(); g.moveTo(x + 55, H * .78 + 15); g.lineTo(x + 100, H * .78 + 95); g.lineTo(x + 55, H * .78 + 175); g.lineTo(x + 10, H * .78 + 95); g.closePath(); g.fill(); g.fillStyle = IVORY; g.beginPath(); g.moveTo(x + 55, H * .78 + 60); g.lineTo(x + 75, H * .78 + 95); g.lineTo(x + 55, H * .78 + 130); g.lineTo(x + 35, H * .78 + 95); g.closePath(); g.fill(); }
  bar(H * .78 + 190, 14); lattice(0, H * .78 + 210, W, 110, 55); bar(H * .78 + 328, 14);
  bar(H - 60, 60);   // hem
  // the woven border down the inner edge
  lattice(W - 118, 0, 100, H, 50);
  g.fillStyle = "#a3151f"; g.fillRect(W - 18, 0, 18, H); g.fillRect(W - 126, 0, 10, H);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function wallTexture(paper) {
  const W = 512, H = 1024, c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  if (paper) { const p = g.createPattern(paper, "repeat"); g.fillStyle = p; g.fillRect(0, 0, W, H); }
  else { g.fillStyle = "#fbeee0"; g.fillRect(0, 0, W, H); }
  // soft vertical pleats of the back drape
  for (let x = 0; x < W; x += 24) {
    const gr = g.createLinearGradient(x, 0, x + 24, 0);
    gr.addColorStop(0, "rgba(160,110,70,.10)"); gr.addColorStop(.5, "rgba(255,255,255,.18)"); gr.addColorStop(1, "rgba(160,110,70,.10)");
    g.fillStyle = gr; g.fillRect(x, 0, 24, H);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
async function svgTexture(src, width) {
  const img = await loadImage(src);
  const c = document.createElement("canvas");
  c.width = width; c.height = Math.round(width * img.naturalHeight / img.naturalWidth);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

// ---------------------------------------------------------------- stage
async function start() {
  if (!webglOK()) return;
  const canvas = document.createElement("canvas");
  canvas.className = "stage3d";
  canvas.setAttribute("aria-hidden", "true");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;   // respects cut-out shapes; softened with radius below

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 10, 6000);

  // light: warm key from just above the viewer (casts soft shadows close under things), generous
  // sky/ground fill so shadows stay gentle, a stage spot that brightens as the curtains part
  scene.add(new THREE.HemisphereLight(0xfffaf2, 0xb08a68, 2.0));
  const key = new THREE.DirectionalLight(0xfff1dc, .95);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  key.shadow.radius = 5;
  scene.add(key, key.target);
  const spot = new THREE.SpotLight(0xffe7c4, 0, 0, Math.PI / 6, .6, 0);
  scene.add(spot, spot.target);

  const [paper, altarTex, valTex] = await Promise.all([
    loadImage("assets/paper.jpg").catch(() => null),
    svgTexture("assets/bathou.svg", 1200),
    svgTexture("assets/valance-assam.svg", 1600),
  ]);

  // back wall
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ map: wallTexture(paper), roughness: .95 }));
  wall.receiveShadow = true;
  scene.add(wall);

  // altar stands in front of the wall
  const altar = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
    new THREE.MeshStandardMaterial({ map: altarTex, transparent: true, alphaTest: .08, roughness: .8 }));
  altar.castShadow = false; altar.receiveShadow = true;
  scene.add(altar);
  const contact = (() => {
    const c = document.createElement("canvas"); c.width = 256; c.height = 64;
    const g = c.getContext("2d"), gr = g.createRadialGradient(128, 32, 4, 128, 32, 128);
    gr.addColorStop(0, "rgba(60,30,10,.45)"); gr.addColorStop(.6, "rgba(60,30,10,.16)"); gr.addColorStop(1, "rgba(60,30,10,0)");
    g.setTransform(1, 0, 0, .25, 0, 24); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
    scene.add(m); return m;
  })();

  // curtains: dense planes reshaped every frame
  const SX = 56, SY = 80;
  const clothTex = curtainTexture();
  const clothMat = new THREE.MeshStandardMaterial({ map: clothTex, roughness: .5, metalness: 0, side: THREE.DoubleSide, vertexColors: true });
  const makeCurtain = () => {
    const geo = new THREE.PlaneGeometry(1, 1, SX, SY);
    geo.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array((SX + 1) * (SY + 1) * 3).fill(1), 3));
    const m = new THREE.Mesh(geo, clothMat);
    m.castShadow = true; m.receiveShadow = true;
    m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    scene.add(m);
    return m;
  };
  const curtains = [makeCurtain(), makeCurtain()];
  // pearl trim down each curtain's inner edge (placed every frame from the cloth's edge)
  const TRIM_STEP = 2;
  const trims = curtains.map(() => { const m = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), null, Math.floor(SY / TRIM_STEP) + 1); m.castShadow = true; scene.add(m); return m; });

  // valance: six separate swags under a fixed pelmet header. As the curtains part they drop out
  // from under the header one after another, centre first, each with its own bounce.
  const valance = new THREE.Group();
  const VX = 16, VY = 8;
  const SWAG_JS = [-3, -2, -1, 0, 1, 2];        // swag j is centred at (j + .5) swag widths from centre
  const swags = SWAG_JS.map((j) => {
    const k = ((j % 4) + 4) % 4;                // which of the 4 swags in the valance artwork
    const tex = valTex.clone();
    tex.wrapS = THREE.RepeatWrapping; tex.repeat.x = .31; tex.offset.x = k / 4 - .03; tex.needsUpdate = true;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, VX, VY),
      new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: .05, roughness: .55, side: THREE.DoubleSide }));
    mesh.castShadow = true;
    // shadow follows the swag's scalloped outline, not its rectangle
    mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: .5 });
    const pivot = new THREE.Group();            // pivot at the swag's top edge, so it swings from there
    pivot.add(mesh); valance.add(pivot);
    // centre swags first, then outwards
    return { j, mesh, pivot, delay: (Math.abs(j + .5) - .5) * 150, side: j < 0 ? -1 : 1 };
  });
  // pelmet header: ivory pleated band running up past the top of the screen, so no top edge shows
  const header = (() => {
    const c = document.createElement("canvas"); c.width = 512; c.height = 256;
    const g = c.getContext("2d");
    const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#f3dfc2"); gr.addColorStop(1, "#fbefdc");
    g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
    for (let x = 0; x < 512; x += 16) { const p = g.createLinearGradient(x, 0, x + 16, 0); p.addColorStop(0, "rgba(150,100,60,.10)"); p.addColorStop(.5, "rgba(255,255,255,.22)"); p.addColorStop(1, "rgba(150,100,60,.10)"); g.fillStyle = p; g.fillRect(x, 0, 16, 256); }
    g.fillStyle = "#c8202a"; g.fillRect(0, 226, 512, 10); g.fillStyle = "#a3151f"; g.fillRect(0, 240, 512, 4);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.x = 3;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ map: t, roughness: .6 }));
    m.castShadow = true; valance.add(m); return m;
  })();
  scene.add(valance);

  // pearls
  const pearlMat = new THREE.MeshStandardMaterial({ color: 0xfffaf3, roughness: .22, metalness: .05, emissive: 0x2a1c14, emissiveIntensity: .25 });
  const pearlGeo = new THREE.SphereGeometry(1, 14, 10);
  const TIE_PEARLS = 26, STRAND = 9;
  const ties = [0, 1].map(() => {
    const m = new THREE.InstancedMesh(pearlGeo, pearlMat, TIE_PEARLS * 3 + STRAND * 2 + 2);
    m.castShadow = true; scene.add(m); return m;
  });
  const centre = new THREE.InstancedMesh(pearlGeo, pearlMat, 13);
  centre.castShadow = true;
  valance.add(centre);

  // ---------------------------------------------------------------- layout
  let W = 1, H = 1, D = 1;
  const tmp = new THREE.Object3D();
  const rectIn = (el) => { const r = el.getBoundingClientRect(), h = hero.getBoundingClientRect(); return { x: r.left - h.left, y: r.top - h.top, w: r.width, h: r.height }; };
  // place a plane at depth z so it looks exactly like the DOM rect it replaces
  const placeLike = (mesh, rect, z) => {
    const k = (D - z) / D;
    mesh.scale.set(rect.w * k, rect.h * k, 1);
    mesh.position.set((rect.x + rect.w / 2 - W / 2) * k, (H / 2 - rect.y - rect.h / 2) * k, z);
  };
  const VAL_Z = 34;
  let valRest = 0, valH = 0, swagW = 1;

  const layout = () => {
    const r = hero.getBoundingClientRect();
    W = r.width; H = r.height;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    D = (H / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.set(0, 0, D);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    const wz = -160, wk = (D - wz) / D;
    wall.scale.set(W * wk * 1.2, H * wk * 1.2, 1); wall.position.set(0, 0, wz);
    const ar = rectIn(document.querySelector(".hero__altar"));
    placeLike(altar, ar, -36);
    // soft contact shadow where the altar's mat meets the stage floor
    const ak = (D + 37) / D;
    contact.scale.set(ar.w * ak * .95, ar.h * ak * .1, 1);
    contact.position.set((ar.x + ar.w / 2 - W / 2) * ak, (H / 2 - (ar.y + ar.h * .985)) * ak, -37);
    const vr = rectIn(document.querySelector(".hero__valance"));
    const vk = (D - VAL_Z) / D;
    valH = vr.h * vk;
    swagW = vr.w * vk / 4;
    for (const S of swags) {
      S.mesh.scale.set(swagW * 1.24, valH, 1);
      S.mesh.position.set(0, -valH / 2, 0);
      S.pivot.position.set((S.j + .5) * swagW, valH / 2, 0);
    }
    // the header covers the swags' top edge and runs well past the top of the screen
    const hh = H * .45;
    header.scale.set(W * vk * 1.6, hh, 1);
    header.position.set(0, valH / 2 + hh / 2 - valH * .12, 3);
    // raised just enough that the swags' plain top band and the header sit above the screen,
    // so the scalloped swags start right at the top edge
    valRest = (H / 2 - vr.y - vr.h / 2) * vk + valH * .11 + 3;
    valance.position.set(0, valRest, VAL_Z);
    // key light from just above the viewer, slightly left: shadows fall softly just below what casts them
    key.position.set(-W * .12, H * .55, 1800); key.target.position.set(0, -H * .05, -120);
    const sc = key.shadow.camera;
    sc.left = -W; sc.right = W; sc.top = H; sc.bottom = -H; sc.near = 10; sc.far = 3500; sc.updateProjectionMatrix();
    spot.position.set(0, H * .45, 700); spot.target.position.set(0, -H * .05, -100);
    drawFrame(performance.now());
  };

  // ---------------------------------------------------------------- cloth
  let openT = window.__curtainT || 0;
  let lastOpenChange = 0;
  // zip-style opening (references/depth-analysis.md): a gap opens in the middle first, then up and down
  const rowT = (v, t) => clamp01((t - Math.abs(v - .46) * .6) / .62);
  const inner = (v, t) => {
    // open drape shape (fractions of W): top .28, tie .075 at v .5, hem .15
    const vk = .5;
    const open = v < vk ? lerp(.28, .075, Math.pow(v / vk, 1.25)) : lerp(.075, .15, ease((v - vk) / (1 - vk)));
    const tv = ease(rowT(v, t));
    return lerp(.5 + 2 / W, open, tv) * W;
  };
  const EXT = 56;                                         // cloth runs this far past the screen edge
  const clothTop = () => H / 2 + 40;                      // cloth starts above the screen top
  const clothLen = () => H + 80;                          // and runs past the bottom
  // breeze: gusts build and fade slowly; scrolling adds a puff of air (window 'scrollwind')
  let wind = 0;
  window.addEventListener("scrollwind", (e) => { wind = Math.max(-1.6, Math.min(1.6, wind + e.detail)); kick(); });
  const gust = (time) => .3 + .85 * (.5 + .5 * Math.sin(time * .00042)) * (.5 + .5 * Math.sin(time * .00071 + 1.7));
  const shapeCurtain = (mesh, side, t, time) => {
    const pos = mesh.geometry.attributes.position, col = mesh.geometry.attributes.color;
    const top = clothTop(), len = clothLen();
    const FOLDS = 9;
    for (let iy = 0; iy <= SY; iy++) {
      const v = iy / SY;
      const ix0 = inner(v, t);
      const g = 1 - ix0 / (W / 2);                         // how gathered this row is (0 flat … ~.85)
      const tie = Math.exp(-Math.pow((v - .5) / .07, 2));  // bundle bulges at the tie-back
      const moving = Math.sin(Math.PI * rowT(v, t));
      for (let ix = 0; ix <= SX; ix++) {
        const u = ix / SX;
        let x = u * (ix0 + EXT);
        // folds: deeper as the cloth bunches up, a little header pleating at the rod
        const amp = 5 + 18 * g + (v < .04 ? 3 : 0);
        const fold = Math.sin(u * FOLDS * 2 * Math.PI + v * .6);
        let z = amp * fold * (0.45 + 0.55 * Math.min(1, v * 6));
        // ambient occlusion: fold valleys sink into shadow (deeper when gathered), ridges catch light,
        // a soft shade just under the valance, and a little more shade inside the tied bundle
        let ao = 1 - (.14 + .26 * g) * (.5 - .5 * fold) + .04 * Math.max(0, fold);
        ao *= 1 - .22 * Math.exp(-v / .06);
        ao *= 1 - .1 * tie * g;
        z += 16 * g * tie * Math.sin(Math.PI * u);           // gathered bundle pushed forward
        z += 10 + 8 * g;
        if (!reduced) {
          // air moving through the cloth: waves travel across it, strongest at the hem,
          // calmer where the tie-back holds it
          const air = gust(time) + Math.abs(wind) * 1.4;
          const calm = 1 - .55 * tie;                       // the tie-back holds the cloth steadier
          const lift = .15 + .85 * v;                       // the hem moves most
          // waves of air travelling across and down the cloth
          const travel = Math.sin(u * 5.2 - time * .0021 + v * 1.8) * 16 + Math.sin(u * 9.5 + time * .0014 - v * 3.2) * 6;
          z += travel * air * lift * calm;
          // the whole curtain slowly billows in and out
          z += Math.sin(time * .0006 + side * 1.3) * 20 * air * Math.pow(v, 1.4) * Math.sin(Math.PI * Math.min(1, u * 1.2)) * calm;
          // the hem swings sideways and flutters
          x += (Math.sin(time * .0009 + v * 2.6 + u * 1.3) * 11 * air + Math.sin(time * .0042 + u * 14) * 2.5 * air * v + wind * 14) * v * calm;
          // a ripple runs down the cloth while it is being drawn
          z += 9 * moving * Math.sin(v * 7 - time * .006) * v;
        }
        const y = top - v * len;
        const i = iy * (SX + 1) + ix;
        pos.setXYZ(i, side * (W / 2 + EXT - x), y, z);
        col.setXYZ(i, ao, ao * .985, ao * .965);
      }
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
    // pearls ride the inner edge of the cloth
    const trim = trims[side < 0 ? 0 : 1];
    trim.material = pearlMat;
    let n = 0;
    for (let iy = 0; iy <= SY; iy += TRIM_STEP) {
      const i = iy * (SX + 1) + SX;
      tmp.position.set(pos.getX(i), pos.getY(i), pos.getZ(i) + 3);
      tmp.scale.setScalar(2.6);
      tmp.updateMatrix(); trim.setMatrixAt(n++, tmp.matrix);
    }
    trim.count = n;
    trim.instanceMatrix.needsUpdate = true;
  };

  const shapeValance = (time, since) => {
    // since = ms since the curtains started to part (-1 = not yet)
    let centreDrop = 0;
    for (const S of swags) {
      const d = reduced ? (since >= 0 ? 1 : 0) : clamp01((since - S.delay) / 950);
      const settle = ease(d);                          // the swag fills out as it lands
      const pos = S.mesh.geometry.attributes.position;
      for (let iy = 0; iy <= VY; iy++) {
        const v = iy / VY;
        for (let ix = 0; ix <= VX; ix++) {
          const u = ix / VX;
          const local = clamp01((u - .5) * 1.24 + .5);  // 0..1 across the swag itself
          let z = (14 * Math.sin(Math.PI * local) * Math.pow(v, 1.2) + 4 * v) * settle;
          if (!reduced) {
            const gx = (S.j + .5) * swagW + (u - .5) * swagW * 1.24;   // breeze travels across all swags
            const air = gust(time * 1.1 + 900) + Math.abs(wind) * 1.4;
            z += (13 * Math.sin(gx * .018 - time * .0019) + 5 * Math.sin(gx * .034 + time * .0027) + 3 * Math.sin(gx * .07 - time * .0041)) * air * v * settle;
          }
          pos.setXYZ(iy * (VX + 1) + ix, u - .5, .5 - v, z);
        }
      }
      pos.needsUpdate = true;
      S.mesh.geometry.computeVertexNormals();
      // fall out from under the header with a bounce, then a little swing as it settles
      S.pivot.position.y = valH / 2 + (1 - easeOutBack(d)) * valH * 1.2;
      const breeze = reduced ? 0 : gust(time * 1.1 + 900) + Math.abs(wind) * 1.4;
      const phase = time * .0013 - S.j * .7;                // each swag a beat behind its neighbour
      S.pivot.rotation.x = reduced ? 0 : Math.sin(d * Math.PI * 3) * (1 - d) * .3 + (Math.sin(phase) * .09 + Math.sin(phase * 2.3) * .03) * breeze * d;
      S.pivot.rotation.z = reduced ? 0 : Math.sin(d * Math.PI * 2.5) * (1 - d) * .1 * S.side + Math.sin(phase * .8 + 1) * .025 * breeze * d;
      S.mesh.visible = d > 0;
      if (S.j === 0 || S.j === -1) centreDrop = Math.max(centreDrop, d);
    }
    // centre pearl strand hangs between the two middle swags and comes down with them
    const show = ease(centreDrop);
    const sway = reduced ? 0 : Math.sin(time * .0016) * .06 + (1 - centreDrop) * Math.sin(time * .01) * .2;
    const lift = (1 - easeOutBack(centreDrop)) * valH * 1.2;
    for (let i = 0; i < 13; i++) {
      const last = i === 12, yy = -valH * .32 - i * 6.6 - (last ? 3 : 0);
      tmp.position.set(Math.sin(sway) * -yy * .3, yy + lift, 6);
      tmp.scale.setScalar((last ? 5 : 2.9) * show);
      tmp.updateMatrix(); centre.setMatrixAt(i, tmp.matrix);
    }
    centre.instanceMatrix.needsUpdate = true;
  };

  const shapeTies = (t, time) => {
    const tk = ease(clamp01((t - .15) / .65));
    const show = clamp01((tk - .72) / .28);
    const ix0 = inner(.5, t);
    const yk = clothTop() - .5 * clothLen();
    ties.forEach((m, s) => {
      const side = s === 0 ? -1 : 1;
      let n = 0;
      const cx = side * (W / 2 - ix0 * .5), rx = ix0 * .55 + 7;
      for (let r = 0; r < 3; r++) {
        for (let i = 0; i < TIE_PEARLS; i++) {
          const a = (i / TIE_PEARLS) * Math.PI * 2;
          tmp.position.set(cx + Math.cos(a) * rx, yk - 6 + r * 6 + Math.sin(a) * 1.5, 26 + Math.sin(a) * 16);
          tmp.scale.setScalar(2.7 * show);
          tmp.updateMatrix(); m.setMatrixAt(n++, tmp.matrix);
        }
      }
      // two hanging strands with drop pearls
      const swing = reduced ? 0 : Math.sin(time * .0018 + s) * 2;
      for (let k = 0; k < 2; k++) {
        const sx = cx + side * (k ? -4 : 3);
        for (let i = 0; i < STRAND; i++) {
          tmp.position.set(sx + swing * (i / STRAND), yk - 12 - i * 6 * (k ? .75 : 1), 40);
          tmp.scale.setScalar(2.5 * show); tmp.updateMatrix(); m.setMatrixAt(n++, tmp.matrix);
        }
        tmp.position.set(sx + swing, yk - 14 - STRAND * 6 * (k ? .75 : 1), 40);
        tmp.scale.setScalar((k ? 3.8 : 5.6) * show); tmp.updateMatrix(); m.setMatrixAt(n++, tmp.matrix);
      }
      m.count = n;
      m.instanceMatrix.needsUpdate = true;
    });
  };

  // ---------------------------------------------------------------- depth from tilt / pointer
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("deviceorientation", (e) => {
    if (e.gamma == null) return;
    tilt.tx = clamp01((e.gamma + 30) / 60) * 2 - 1;
    tilt.ty = clamp01((e.beta - 20) / 60) * 2 - 1;
  });
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    tilt.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    tilt.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
  });

  // ---------------------------------------------------------------- loop
  let dropT = 0, dropStart = 0;
  function drawFrame(now) {
    const t = openT;
    wind *= .94;
    if (t > .05 && !dropStart) dropStart = now;
    dropT = dropStart ? now - dropStart : -1;
    shapeCurtain(curtains[0], -1, t, now);
    shapeCurtain(curtains[1], 1, t, now);
    shapeValance(now, dropT);
    valance.position.y = valRest;
    shapeTies(t, now);
    spot.intensity = 1.1 * ease(t);
    if (!reduced) {
      tilt.x += (tilt.tx - tilt.x) * .06; tilt.y += (tilt.ty - tilt.y) * .06;
      camera.position.set(tilt.x * 26, -tilt.y * 20, D);
      camera.lookAt(0, 0, 0);
    }
    renderer.render(scene, camera);
  }

  let visible = true, raf = 0;
  const loop = (now) => { raf = 0; if (!visible || document.hidden) return; drawFrame(now); raf = requestAnimationFrame(loop); };
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) kick(); }).observe(hero);
  document.addEventListener("visibilitychange", kick);
  window.addEventListener("curtains", (e) => { openT = e.detail; lastOpenChange = performance.now(); kick(); });
  window.addEventListener("resize", layout);

  // test hook: pause the live loop and draw the stage at an exact moment (used to check timings)
  window.__stage3d = { pause() { visible = false; }, draw(now) { drawFrame(now); } };

  hero.prepend(canvas);
  layout();
  hero.classList.add("is-3d");
  kick();
}

start().catch((e) => { console.warn("3D stage unavailable, using the flat curtains", e); });
