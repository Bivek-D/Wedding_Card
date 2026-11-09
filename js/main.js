// Camille & Antoine: intro, curtains, reveals, timeline pearl, countdown, calendar files.
// Timings follow references/motion-analysis.md (reference video, studied at 30 fps).
(() => {
  const $ = (s) => document.querySelector(s);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const intro = $("#intro");
  const hero = $("#hero");

  // always start at the doors, not wherever the last visit left off
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (location.hash !== "#open") window.scrollTo(0, 0);

  // ------------------------------------------------------------------ curtains
  // Drawn as SVG so the opening can follow the video: the lower inner corners lift
  // first, then the drapes gather to the tie-backs, the tops move last, and the
  // pleats fan toward the tie point. t = 0 closed … 1 tied back.
  const NS = "http://www.w3.org/2000/svg";
  const svg = $("#curtains");
  const altar = $(".hero__altar");
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  // Ivory silk with red woven motifs (references/curtains-assam-mockup.png): scattered red
  // flowers, a red lattice band down the inner edge, cross bands, a red hem, pearl tie-backs.
  const RED = "#c8202a", IVORY = "#fbefdc";
  svg.innerHTML = `<defs>
    <linearGradient id="cSilk" x1="0" x2="1"><stop offset="0" stop-color="#ecd2ae"/><stop offset=".5" stop-color="#fbefdc"/><stop offset="1" stop-color="#fff6e8"/></linearGradient>
    <linearGradient id="cShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6a2a1a" stop-opacity=".12"/></linearGradient>
    <radialGradient id="pg" cx=".35" cy=".32" r=".75"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#f3e8e6"/><stop offset="1" stop-color="#c3a9a6"/></radialGradient>
    <pattern id="cDots" width="34" height="40" patternUnits="userSpaceOnUse">
      <g fill="${RED}" opacity=".85">
        <g transform="translate(8,10)"><circle cx="0" cy="-2.6" r="1.5"/><circle cx="2.5" cy="-.8" r="1.5"/><circle cx="1.6" cy="2.1" r="1.5"/><circle cx="-1.6" cy="2.1" r="1.5"/><circle cx="-2.5" cy="-.8" r="1.5"/></g>
        <g transform="translate(25,30)"><circle cx="0" cy="-2.6" r="1.5"/><circle cx="2.5" cy="-.8" r="1.5"/><circle cx="1.6" cy="2.1" r="1.5"/><circle cx="-1.6" cy="2.1" r="1.5"/><circle cx="-2.5" cy="-.8" r="1.5"/></g>
      </g>
      <circle cx="8" cy="10" r="1" fill="${IVORY}"/><circle cx="25" cy="30" r="1" fill="${IVORY}"/>
    </pattern>
    <pattern id="cLattice" width="12" height="12" patternUnits="userSpaceOnUse">
      <rect width="12" height="12" fill="${RED}"/>
      <path d="M6,.8 L11.2,6 L6,11.2 L.8,6Z" fill="none" stroke="${IVORY}" stroke-width="1.1"/>
      <circle cx="6" cy="6" r="1" fill="${IVORY}"/>
    </pattern>
    <pattern id="cBand" width="22" height="22" patternUnits="userSpaceOnUse">
      <rect width="22" height="22" fill="${IVORY}"/>
      <path d="M11,2 L20,11 L11,20 L2,11Z" fill="${RED}"/>
      <path d="M11,7 L15,11 L11,15 L7,11Z" fill="${IVORY}"/>
      <circle cx="0" cy="0" r="1.6" fill="${RED}"/><circle cx="22" cy="0" r="1.6" fill="${RED}"/><circle cx="0" cy="22" r="1.6" fill="${RED}"/><circle cx="22" cy="22" r="1.6" fill="${RED}"/>
    </pattern>
    <clipPath id="cClip"><path id="cClipPath"/></clipPath>
    <filter id="cFold" x="-5%" y="-2%" width="110%" height="104%"><feGaussianBlur stdDeviation="3.6"/></filter>
  </defs>`;
  const clipPath = svg.querySelector("#cClipPath");
  // a short string of pearls hanging under the valance at centre stage, ending in a drop pearl
  const centrePearls = el("g", {}, svg);
  const cpShadow = el("path", { fill: "none", stroke: "#cbb2ad", "stroke-width": 4.2, "stroke-linecap": "round", "stroke-dasharray": "0 6.5" }, centrePearls);
  const cpLine = el("path", { fill: "none", stroke: "#fffaf6", "stroke-width": 3.4, "stroke-linecap": "round", "stroke-dasharray": "0 6.5" }, centrePearls);
  const cpDrop = el("circle", { fill: "url(#pg)", stroke: "#c3a9a6", "stroke-width": .5 }, centrePearls);
  // soft fabric folds (references/curtain-folds-reference.jpg): blurred shadow + highlight
  // ridges that follow the drape, so they bunch together at the tie-back as the cloth gathers
  const FOLDS = 11;
  const foldDepth = Array.from({ length: FOLDS }, (_, i) => 0.55 + 0.45 * Math.abs(Math.sin(i * 2.3 + 1)));
  const sides = ["l", "r"].map((side) => {
    const g = el("g", {}, svg);
    const body = el("path", { fill: "url(#cSilk)" }, g);
    const cloth = el("g", { "clip-path": "url(#cClip)" }, g);
    const dots = el("rect", { fill: "url(#cDots)", x: 0, y: 0 }, cloth);
    const band1 = el("rect", { fill: "url(#cLattice)" }, cloth);
    const band1a = el("rect", { fill: RED }, cloth);
    const band1b = el("rect", { fill: RED }, cloth);
    const band2 = el("rect", { fill: "url(#cBand)" }, cloth);
    const band2a = el("rect", { fill: RED }, cloth);
    const band2b = el("rect", { fill: RED }, cloth);
    const band2c = el("rect", { fill: "url(#cLattice)" }, cloth);
    const hem = el("rect", { fill: RED }, cloth);
    const foldGroup = el("g", { filter: "url(#cFold)" }, cloth);
    const folds = foldDepth.map((depth) => [
      el("path", { fill: "none", stroke: "#6e3a16", "stroke-linecap": "round", opacity: (0.42 * depth).toFixed(3) }, foldGroup),
      el("path", { fill: "none", stroke: "#fffcf2", "stroke-linecap": "round", opacity: (0.85 * depth).toFixed(3) }, foldGroup),
    ]);
    const shade = el("rect", { fill: "url(#cShade)", x: 0, y: 0 }, cloth);
    const edgeBand = el("path", { fill: "url(#cLattice)" }, g);
    const edgeOuter = el("path", { fill: "none", stroke: "#a3151f", "stroke-width": 2.6 }, g);
    const edgeInner = el("path", { fill: "none", stroke: RED, "stroke-width": 2.2 }, g);
    // pearl tie-back: three strands round the gathered cloth, two hanging strands with drop pearls
    const tie = el("g", { opacity: 0 }, g);
    const ropes = [0, 1, 2].map(() => [
      el("ellipse", { fill: "none", stroke: "#c9b0aa", "stroke-width": 4, "stroke-linecap": "round", "stroke-dasharray": "0 5.4" }, tie),
      el("ellipse", { fill: "none", stroke: "#fffaf6", "stroke-width": 3.4, "stroke-linecap": "round", "stroke-dasharray": "0 5.4" }, tie),
    ]);
    const strands = [0, 1].map(() => el("path", { fill: "none", stroke: "#fffaf6", "stroke-width": 3, "stroke-linecap": "round", "stroke-dasharray": "0 5" }, tie));
    const drops = [0, 1].map(() => el("circle", { fill: "url(#pg)", stroke: "#c3a9a6", "stroke-width": .5 }, tie));
    return { side, g, body, dots, folds, band1, band1a, band1b, band2, band2a, band2b, band2c, hem, shade,
             edgeBand, edgeOuter, edgeInner, tie, ropes, strands, drops };
  });

  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const ease = (v) => (v < .5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);
  const lerp = (a, b, k) => a + (b - a) * k;
  let curtainT = 0;
  let box = { W: 393, H: 852 };
  const setR = (n, x, y, w, h) => { n.setAttribute("x", x); n.setAttribute("y", y); n.setAttribute("width", w); n.setAttribute("height", h); };

  const drawCurtains = (t) => {
    curtainT = t;
    // tell the 3D stage (js/stage3d.js) how far open the curtains are
    window.__curtainT = t;
    window.dispatchEvent(new CustomEvent("curtains", { detail: t }));
    const { W, H } = box;
    // curtains hang the full height of the first screen, in front of the altar
    const y0 = H * 0.035;
    const yB = H + 2;
    const yk = y0 + (yB - y0) * 0.5;
    // stagger: bottom first, tie point next, top last
    const tb = ease(clamp01(t / 0.6));
    const tk = ease(clamp01((t - 0.15) / 0.65));
    const tt = ease(clamp01((t - 0.35) / 0.65));
    const half = W / 2 + 1;
    const T = { x: lerp(half, W * 0.28, tt), y: y0 };
    const K = { x: lerp(half, W * 0.075, tk), y: yk };
    const B = { x: lerp(half, W * 0.15, tb), y: yB };
    // inner edge as two cubic curves; k scales it toward the outer side (pleats, inner band)
    const pts = (k, off = 0) => {
      const tx = Math.max(0, T.x * k - off), kx = Math.max(0, K.x * k - off), bx = Math.max(0, B.x * k - off);
      return { tx, kx, bx,
        a1: [lerp(tx, kx, .15), lerp(T.y, K.y, .55)], a2: [lerp(tx, kx, .8), lerp(T.y, K.y, .85)],
        b1: [kx + (bx - kx) * .1, lerp(K.y, B.y, .35)], b2: [bx, lerp(K.y, B.y, .6)] };
    };
    const edge = (k, off = 0) => {
      const p = pts(k, off);
      return `M${p.tx},${T.y} C${p.a1} ${p.a2} ${p.kx},${K.y} C${p.b1} ${p.b2} ${p.bx},${B.y}`;
    };
    const edgeBack = (k, off = 0) => {   // same curve, walked from the bottom back to the top
      const p = pts(k, off);
      return `L${p.bx},${B.y} C${p.b2} ${p.b1} ${p.kx},${K.y} C${p.a2} ${p.a1} ${p.tx},${T.y}`;
    };
    const inner = edge(1);
    const shape = `M0,${y0} L${T.x},${T.y} ${inner.slice(inner.indexOf("C"))} L0,${B.y} Z`;
    clipPath.setAttribute("d", shape);
    const tieOp = clamp01((tk - .75) / .25);
    const BAND_K = 0.8;
    const BAND_W = 22 * (W / 393);   // inner lattice band keeps a fixed width, like the woven border
    const b1y = H * 0.30, b2y = H * 0.80, b2h = H * 0.1;

    const cpEnd = H * 0.145;
    cpLine.setAttribute("d", `M${W / 2},${y0 + 40} V${cpEnd}`);
    cpShadow.setAttribute("d", `M${W / 2},${y0 + 40.8} V${cpEnd}`);
    cpDrop.setAttribute("cx", W / 2); cpDrop.setAttribute("cy", cpEnd + 6); cpDrop.setAttribute("r", 4.6);

    for (const s of sides) {
      s.g.setAttribute("transform", s.side === "r" ? `translate(${W},0) scale(-1,1)` : "");
      s.body.setAttribute("d", shape);
      setR(s.dots, 0, 0, W / 2 + 2, H);
      setR(s.shade, 0, 0, W / 2 + 2, H);
      // each fold: a shadow trough, then a lit ridge just inside it
      s.folds.forEach(([dark, light], i) => {
        dark.setAttribute("d", edge((i + 0.2) / FOLDS));
        light.setAttribute("d", edge((i + 0.65) / FOLDS));
        dark.setAttribute("stroke-width", W * 0.022);
        light.setAttribute("stroke-width", W * 0.017);
      });
      setR(s.band1, 0, b1y, W / 2 + 2, 24);
      setR(s.band1a, 0, b1y - 5, W / 2 + 2, 3);
      setR(s.band1b, 0, b1y + 26, W / 2 + 2, 3);
      setR(s.band2a, 0, b2y - 6, W / 2 + 2, 4);
      setR(s.band2, 0, b2y, W / 2 + 2, b2h * 0.62);
      setR(s.band2c, 0, b2y + b2h * 0.62 + 3, W / 2 + 2, b2h * 0.3);
      setR(s.band2b, 0, b2y + b2h * 0.62, W / 2 + 2, 3);
      setR(s.hem, 0, H - 14, W / 2 + 2, 16);
      s.edgeBand.setAttribute("d", `${inner} ${edgeBack(1, BAND_W)} Z`);
      s.edgeOuter.setAttribute("d", inner);
      s.edgeInner.setAttribute("d", edge(1, BAND_W));
      // tie-back
      s.tie.setAttribute("opacity", tieOp);
      const cx = K.x * .5, rx = K.x * .56 + 5;
      s.ropes.forEach(([shadow, rope], i) => {
        for (const n of [shadow, rope]) {
          n.setAttribute("cx", cx); n.setAttribute("cy", K.y - 6 + i * 6);
          n.setAttribute("rx", rx); n.setAttribute("ry", 4.5);
        }
        shadow.setAttribute("transform", "translate(0,.8)");
      });
      const sx = K.x * .62;
      s.strands[0].setAttribute("d", `M${sx},${K.y + 8} q-2,22 1,44`);
      s.strands[1].setAttribute("d", `M${sx + 6},${K.y + 8} q2,16 0,30`);
      s.drops[0].setAttribute("cx", sx + 1); s.drops[0].setAttribute("cy", K.y + 58); s.drops[0].setAttribute("r", 6);
      s.drops[1].setAttribute("cx", sx + 6); s.drops[1].setAttribute("cy", K.y + 42); s.drops[1].setAttribute("r", 3.6);
    }
  };

  const sizeCurtains = () => {
    const r = hero.getBoundingClientRect();
    box = { W: r.width, H: r.height };
    svg.setAttribute("viewBox", `0 0 ${box.W} ${box.H}`);
    drawCurtains(curtainT);
  };
  sizeCurtains();
  window.addEventListener("resize", sizeCurtains);
  if (altar.complete) sizeCurtains(); else altar.addEventListener("load", sizeCurtains);

  const animate = (ms, step) => new Promise((done) => {
    if (reduced) { step(1); return done(); }
    const start = performance.now();
    const tick = (now) => {
      const k = clamp01((now - start) / ms);
      step(k);
      k < 1 ? requestAnimationFrame(tick) : done();
    };
    requestAnimationFrame(tick);
  });
  const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));

  // ------------------------------------------------------------------ doors + their shadows
  // Both are driven by the same angle every frame: each door swings out toward the
  // viewer around its outer hinge, and its shadow starts at the door's free edge as it
  // appears on screen, growing with the swing and fading as the door clears.
  const stage = $("#openInvite");
  const doors = { l: $(".door--l"), r: $(".door--r") };
  const casts = { l: $(".door-cast--l"), r: $(".door-cast--r") };
  const shades = { l: $(".door--l .door__shade"), r: $(".door--r .door__shade") };
  const MAX_ANGLE = 86;

  // line the A&H seal up with the door artwork: each door shows half of the 852x1846
  // image with background-size: cover, so the seal uses the same scale and centre
  const sealL = $(".seal--l"), sealR = $(".seal--r");
  // full badge with its own tassels (references/badge-full.png, cut by design/build/cut_badge.py)
  const ART = { half: 426, h: 1846, sealX: 196.1, sealY: 654.1, sealW: 464.2 };
  const sizeIntro = () => {
    const W = stage.clientWidth, H = stage.clientHeight;
    const s = Math.max((W / 2) / ART.half, H / ART.h);
    // the badge is cut at the seam (cut_badge.py): 49.45 % of its width is on the left door
    const LEFT = .4945, top = `${H / 2 + (ART.sealY - ART.h / 2) * s}px`;
    sealL.style.width = `${ART.sealW * LEFT * s}px`;
    sealL.style.left = `${ART.sealX * s}px`;                     // from the left door's left edge
    sealR.style.width = `${ART.sealW * (1 - LEFT) * s}px`;
    sealR.style.left = "0px";                                    // starts right at the seam
    sealL.style.top = sealR.style.top = top;
  };
  sizeIntro();
  window.addEventListener("resize", sizeIntro);
  const drawDoors = (k) => {
    const W = stage.clientWidth;
    const persp = parseFloat(getComputedStyle(stage).perspective) || 560;
    const w = doors.l.offsetWidth;
    const deg = MAX_ANGLE * ease(k);
    const a = (deg * Math.PI) / 180;
    // free edge of the left door: local (w,0,0) → x = w·cos a, z = w·sin a (toward viewer)
    const x = w * Math.cos(a), z = w * Math.sin(a);
    const cx = W / 2;
    const edge = cx + (x - cx) * (persp / Math.max(1, persp - z));   // projected screen x
    const reach = W * 0.42 * Math.sin(a);                             // shadow length grows with the swing
    // darkness grows with the swing, and fades as the door itself leaves the screen
    const onScreen = clamp01(edge / (w * 0.3));
    const dark = Math.min(1, Math.sin(a) * 1.6) * onScreen;
    const fade = 1 - clamp01((k - 0.86) / 0.14);
    doors.l.style.transform = `rotateY(${-deg}deg)`;
    doors.r.style.transform = `rotateY(${deg}deg)`;
    doors.l.style.opacity = doors.r.style.opacity = fade;
    shades.l.style.opacity = shades.r.style.opacity = deg / 90;
    for (const s of ["l", "r"]) {
      const c = casts[s];
      c.style.width = `${Math.max(0, reach)}px`;
      c.style.opacity = dark;
      // the shadow always starts at the door's on-screen free edge, even as it slides off
      if (s === "l") { c.style.left = `${edge}px`; c.style.right = "auto"; }
      else { c.style.right = `${edge}px`; c.style.left = "auto"; }
    }
  };

  // ------------------------------------------------------------------ opening sequence
  // doors swing open 2.6 s → hold 0.9 s → curtains 2.1 s → names fade in
  let started = false;
  const openInvite = async () => {
    if (started) return;
    started = true;
    intro.classList.add("is-open");
    // iPhones only allow tilt depth after a tap, and this is that tap
    try { if (window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission) DeviceOrientationEvent.requestPermission().catch(() => {}); } catch (e) {}
    await animate(2600, drawDoors);
    intro.classList.add("is-gone");
    document.body.classList.remove("is-locked");
    await wait(900);
    await animate(2100, drawCurtains);
    hero.classList.add("is-revealed");
  };

  if (location.hash === "#open") {
    intro.classList.add("is-gone");
    drawCurtains(1);
    hero.classList.add("is-revealed");
  } else {
    document.body.classList.add("is-locked");
    $("#openInvite").addEventListener("click", openInvite);
    $("#openInvite").focus({ preventScroll: true });
  }

  // ------------------------------------------------------------------ reveal on scroll
  // entries that arrive together fade in one after another (e.g. invitation lines)
  const io = new IntersectionObserver((entries) => {
    entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      .forEach((e, i) => {
        e.target.style.setProperty("--stagger", `${i * 0.14}s`);
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
  }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll("[data-reveal], .tl .ev").forEach((n) => io.observe(n));

  // ------------------------------------------------------------------ scroll depth
  // layers marked data-depth drift at their own speed as you scroll: positive = further
  // away (lags behind), negative = closer (moves ahead)
  const layers = [...document.querySelectorAll("[data-depth]")].map((el) => ({ el, d: parseFloat(el.dataset.depth), pz: 0 }));
  let depthQueued = false;
  const placeDepth = () => {
    depthQueued = false;
    const mid = window.innerHeight / 2;
    for (const L of layers) {
      const r = L.el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > window.innerHeight + 200) continue;
      const off = (r.top - L.pz + r.height / 2) - mid;
      L.pz = Math.max(-60, Math.min(60, off * L.d));
      L.el.style.setProperty("--pz", `${L.pz.toFixed(1)}px`);
    }
  };
  if (!reduced && layers.length) {
    window.addEventListener("scroll", () => { if (!depthQueued) { depthQueued = true; requestAnimationFrame(placeDepth); } }, { passive: true });
    placeDepth();
  }

  // ------------------------------------------------------------------ active page
  // the page you're looking at is at full strength; the others rest dimmed until you reach them
  const pages = [...document.querySelectorAll(".page")];
  let activeQueued = false;
  const markActive = () => {
    activeQueued = false;
    const vh = window.innerHeight;
    for (const pg of pages) {
      const r = pg.getBoundingClientRect();
      const onMiddle = r.top < vh * .62 && r.bottom > vh * .38;
      const whole = r.top >= -2 && r.bottom <= vh + 2;
      pg.classList.toggle("is-active", onMiddle || whole);
    }
  };
  window.addEventListener("scroll", () => { if (!activeQueued) { activeQueued = true; requestAnimationFrame(markActive); } }, { passive: true });
  window.addEventListener("resize", markActive);
  markActive();

  // ------------------------------------------------------------------ scroll wind
  // scrolling stirs the air for the 3D curtains (elements marked data-wind would swing too; none are now)
  const swingers = [...document.querySelectorAll("[data-wind]")].map((el) => ({ el, k: parseFloat(el.dataset.wind) }));
  let lastY = window.scrollY, lastT = performance.now(), angle = 0, spin = 0, windRaf = 0;
  const windStep = () => {
    windRaf = 0;
    const now = performance.now(), dt = Math.max(8, now - lastT);
    const vel = (window.scrollY - lastY) / dt;          // px per ms, + when scrolling down
    lastY = window.scrollY; lastT = now;
    const target = Math.max(-8, Math.min(8, -vel * 7));   // lean against the direction of travel (deg)
    spin += (target - angle) * .14; spin *= .9; angle += spin;   // loose spring: overshoots and wobbles
    for (const S of swingers) S.el.style.setProperty("--wr", `${(angle * S.k).toFixed(2)}deg`);
    if (Math.abs(vel) > .02) window.dispatchEvent(new CustomEvent("scrollwind", { detail: vel * .35 }));
    if (Math.abs(angle) > .01 || Math.abs(spin) > .01 || Math.abs(vel) > .005) windRaf = requestAnimationFrame(windStep);
    else for (const S of swingers) S.el.style.setProperty("--wr", "0deg");
  };
  if (!reduced) {   // no flowers swing any more; scrolling still sends a gust to the 3D curtains
    window.addEventListener("scroll", () => { if (!windRaf) { lastT = performance.now() - 16; windRaf = requestAnimationFrame(windStep); } }, { passive: true });
  }

  // ------------------------------------------------------------------ timeline pearl
  // one pearl travels down the dotted line, holding ~58% of the screen height
  const tl = $("#tl");
  const pearl = $("#tlPearl");
  let ticking = false;
  const placePearl = () => {
    ticking = false;
    const r = tl.getBoundingClientRect();
    const u = r.width / 337;
    const top = 10 * u, bottom = r.height - 20 * u - pearl.offsetHeight;
    const y = Math.min(bottom, Math.max(top, window.innerHeight * 0.58 - r.top));
    pearl.style.setProperty("--py", `${y}px`);
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(placePearl); } };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  placePearl();

  // ------------------------------------------------------------------ countdown (13 June 2027, 17:00 Paris)
  const target = Date.parse("2027-06-13T17:00:00+02:00");
  const D = $("#cdD"), H = $("#cdH"), M = $("#cdM");
  const put = (n, v) => {
    if (n.textContent === v) return;
    n.textContent = v;
    if (!reduced) { n.classList.remove("tick"); void n.offsetWidth; n.classList.add("tick"); }
  };
  const tick = () => {
    let ms = Math.max(0, target - Date.now());
    const d = Math.floor(ms / 864e5); ms -= d * 864e5;
    const h = Math.floor(ms / 36e5); ms -= h * 36e5;
    const m = Math.floor(ms / 6e4);
    put(D, String(d));
    put(H, String(h).padStart(2, "0"));
    put(M, String(m).padStart(2, "0"));
  };
  tick();
  setInterval(tick, 1000);

  // ------------------------------------------------------------------ add to calendar (.ics)
  const EVENTS = {
    wedding: {
      title: "Camille & Antoine: Wedding", start: "20270613T150000Z", end: "20270613T220000Z",
      location: "Château de Belvent, Gevrey-Chambertin, Bourgogne",
      details: "Ceremony at the Orangery 5:00 PM · Reception in the Wine Cellar 7:00 PM · Black tie",
    },
    recovery: {
      title: "Recovery Day: Le Comptoir des Halles", start: "20270614T100000Z", end: "20270614T140000Z",
      location: "Le Comptoir des Halles, Beaune", details: "A relaxed lunch on the garden terrace.",
    },
  };
  const esc = (s) => s.replace(/([,;\\])/g, "\\$1");
  document.querySelectorAll("[data-ics]").forEach((a) => a.addEventListener("click", (ev) => {
    ev.preventDefault();
    const e = EVENTS[a.dataset.ics];
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Camille & Antoine//Invitation//EN", "BEGIN:VEVENT",
      `UID:${a.dataset.ics}-20270613@camille-antoine`, `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d+/g, "")}`,
      `DTSTART:${e.start}`, `DTEND:${e.end}`, `SUMMARY:${esc(e.title)}`, `LOCATION:${esc(e.location)}`,
      `DESCRIPTION:${esc(e.details)}`, "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: `${a.dataset.ics}.ics` });
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }));
})();
