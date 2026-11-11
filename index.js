// Constellation & Flow Lyrics (Optimized Edition with Gemini AI Generative Backgrounds & Apple-style UI)
// Features: Constellation star-word lyrics, Flow smooth-scrolling with minimal instrumental animations,
// Gemini 2.5 Flash live music genre/vibe generative visuals, Queue & Saved Music library, and Apple-style frosted controls.

const CL_KEY = "constellation-lyrics:cfg";
const CL_COLORS = {
  gold: [255, 205, 60], white: [255, 255, 255], pink: [255, 120, 190], cyan: [80, 220, 255],
  violet: [176, 140, 255], green: [100, 240, 160], red: [255, 95, 95], orange: [255, 150, 50]
};
const CL_KINDS = {
  mix: ["sparkle", "cross", "shuriken", "burst", "heart", "orbit", "sparkle"],
  sparkle: ["sparkle"], cross: ["cross"], shuriken: ["shuriken"], y2k: ["burst", "heart", "orbit", "sparkle"]
};
const CL_CACHE = new Map();
const CL_AI_CACHE = new Map();

// ---- Keyword highlights ----
const STY = ["marker", "pop", "glitch", "slide", "letters", "stamp", "neon", "wave"];
const ICON_GENERIC = ["star", "heart", "bolt", "smile", "flower", "wing", "note", "diamond", "sun", "moon"];
const ICON_RX = [
  ["heart", "love|loves|loved|heart|baby|babe|darling|honey|crush|lover"],
  ["broken", "broke|break|broken|hurt|pain|lost|alone|goodbye|apart|sorry"],
  ["fire", "fire|burn|burning|hot|flame|lit|smoke|desire|heat"],
  ["star", "star|stars|shine|shining|light|bright|glow|spark|sparkle"],
  ["moon", "moon|night|nights|dark|midnight|dream|dreams|sleep|tonight"],
  ["sun", "sun|day|days|morning|summer|gold|golden|warm|sunshine"],
  ["skull", "die|dying|dead|death|kill|hell|devil|grave|ghost"],
  ["eye", "eye|eyes|see|look|watch|stare|vision|seen"],
  ["crown", "queen|king|crown|royal|boss|top|number|champion"],
  ["drop", "cry|crying|tears|tear|rain|blue|water|drown|ocean"],
  ["bolt", "crazy|wild|electric|thunder|lightning|rush|fast|energy|shock"],
  ["note", "song|songs|sing|music|dance|dancing|melody|radio|beat|voice"],
  ["clock", "time|hour|hours|forever|always|never|clock|year|years|ever|again|\\d+"],
  ["diamond", "diamond|diamonds|ice|money|rich|cash|gem|pearl|price|pay"],
  ["smile", "girl|boy|smile|happy|laugh|fun|friend|good|yeah"],
  ["flower", "flower|flowers|rose|roses|bloom|spring|garden|petal|sweet"],
  ["wing", "free|fly|flying|wings|angel|heaven|sky|high|float|freedom"],
  ["wave", "loud|sound|scream|hear|echo|noise|whisper|talk|call"],
  ["person", "us|someone|body|man|woman|human|stranger|everybody"],
  ["cross", "god|pray|lord|faith|holy|soul|church|jesus|forgive|sin|bless"]
].map(([n, p]) => [n, new RegExp("^(?:" + p + ")$")]);

const STOP = new Set("the a an and or but of to in on at for with from by is are was were be been am i me my you your we our they their he she it its this that these those so as if then than not no do does did just oh ooh uh la na ah hey got get cause cuz gonna wanna im ill ive id dont cant wont aint all can will would could up down out into over".split(" "));
const cleanW = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, "").replace(/'s$/, "");

function pickKey(words, freq, rnd) {
  let best = -1, bs = -9, icon = null;
  words.forEach((w, k) => {
    const c = cleanW(w); if (!c) return;
    const ic = ICON_RX.find(([, rx]) => rx.test(c));
    let s = STOP.has(c) ? -5 : 0;
    if (ic) s += 3;
    if (/\d/.test(c)) s += 4;
    if (/[?!]$/.test(w)) s += 1.5;
    if (c.length >= 5) s += 1;
    if (k && /^[A-Z]/.test(w)) s += 1;
    s += Math.min(2, (freq[c] || 0) / 3) + (k === words.length - 1 ? 0.8 : 0) + rnd() * 0.3;
    if (s > bs) { bs = s; best = k; icon = ic ? ic[0] : null; }
  });
  if (bs < -1) return { kw: -1, icon: null };
  if (!icon) {
    const m = words.map((w) => ICON_RX.find(([, rx]) => rx.test(cleanW(w)))).find(Boolean);
    icon = m ? m[0] : ICON_GENERIC[Math.floor(rnd() * ICON_GENERIC.length)];
  }
  return { kw: best, icon };
}

// Vector icons drawn with canvas paths
function ico(c, n, x, y, r) {
  c.save(); c.translate(x, y); c.lineCap = c.lineJoin = "round";
  const P = () => c.beginPath(), out = () => (c.globalCompositeOperation = "destination-out");
  const poly = (pts) => { P(); pts.forEach(([a, b], i) => (i ? c.lineTo(a * r, b * r) : c.moveTo(a * r, b * r))); c.closePath(); c.fill(); };
  if (n === "heart") shape(c, "heart", 0, 0, r * 1.15, 0);
  else if (n === "broken") {
    shape(c, "heart", 0, 0, r * 1.15, 0); out(); c.lineWidth = r * 0.2; P();
    c.moveTo(r * 0.1, -r * 0.6); c.lineTo(-r * 0.2, -r * 0.1); c.lineTo(r * 0.2, r * 0.2); c.lineTo(-r * 0.1, r * 0.8); c.stroke();
  } else if (n === "star") {
    P(); for (let i = 0; i < 10; i++) { const q = i % 2 ? r * 0.45 : r * 1.1, a = -Math.PI / 2 + (i * Math.PI) / 5; c.lineTo(Math.cos(a) * q, Math.sin(a) * q); }
    c.closePath(); c.fill();
  } else if (n === "fire") {
    P(); c.moveTo(0, -r * 1.1); c.bezierCurveTo(r * 0.2, -r * 0.5, r * 0.9, -r * 0.1, r * 0.8, r * 0.35);
    c.bezierCurveTo(r * 0.7, r * 0.85, r * 0.2, r * 1.05, 0, r * 1.05); c.bezierCurveTo(-r * 0.2, r * 1.05, -r * 0.8, r * 0.85, -r * 0.8, r * 0.3);
    c.bezierCurveTo(-r * 0.8, -r * 0.1, -r * 0.3, -r * 0.2, 0, -r * 1.1); c.fill(); out(); P();
    c.ellipse(0, r * 0.55, r * 0.3, r * 0.38, 0, 0, 7); c.fill();
  } else if (n === "moon") {
    P(); c.arc(0, 0, r, 0, 7); c.arc(r * 0.4, -r * 0.15, r * 0.78, 0, 7); c.fill("evenodd");
  } else if (n === "sun") {
    P(); c.arc(0, 0, r * 0.5, 0, 7); c.fill(); c.strokeStyle = c.fillStyle; c.lineWidth = r * 0.18;
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; P(); c.moveTo(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78); c.lineTo(Math.cos(a) * r * 1.1, Math.sin(a) * r * 1.1); c.stroke(); }
  } else if (n === "skull") {
    P(); c.arc(0, -r * 0.15, r * 0.85, 0, 7); c.fill(); c.fillRect(-r * 0.45, r * 0.4, r * 0.9, r * 0.6); out(); P();
    c.arc(-r * 0.32, -r * 0.1, r * 0.22, 0, 7); c.arc(r * 0.32, -r * 0.1, r * 0.22, 0, 7); c.fill();
  } else if (n === "eye") {
    P(); c.moveTo(-r * 1.2, 0); c.quadraticCurveTo(0, -r * 1.1, r * 1.2, 0); c.quadraticCurveTo(0, r * 1.1, -r * 1.2, 0); c.fill(); out(); P();
    c.arc(0, 0, r * 0.42, 0, 7); c.fill(); c.globalCompositeOperation = "source-over"; P(); c.arc(0, 0, r * 0.2, 0, 7); c.fill();
  } else if (n === "crown") poly([[-1, 0.7], [-1, -0.5], [-0.5, 0.1], [0, -0.8], [0.5, 0.1], [1, -0.5], [1, 0.7]]);
  else if (n === "drop") {
    P(); c.moveTo(0, -r * 1.1); c.bezierCurveTo(r * 0.3, -r * 0.5, r * 0.85, 0, r * 0.85, r * 0.45);
    c.arc(0, r * 0.45, r * 0.85, 0, Math.PI); c.bezierCurveTo(-r * 0.85, 0, -r * 0.3, -r * 0.5, 0, -r * 1.1); c.fill();
  } else if (n === "bolt") poly([[0.2, -1], [-0.6, 0.15], [-0.05, 0.15], [-0.25, 1], [0.6, -0.2], [0.05, -0.2]]);
  else if (n === "note") {
    P(); c.ellipse(-r * 0.35, r * 0.6, r * 0.55, r * 0.4, -0.4, 0, 7); c.fill(); c.fillRect(r * 0.12, -r * 0.9, r * 0.2, r * 1.55);
    P(); c.moveTo(r * 0.32, -r * 0.9); c.quadraticCurveTo(r * 1.1, -r * 0.6, r * 0.9, -r * 0.05); c.quadraticCurveTo(r * 0.8, -r * 0.4, r * 0.32, -r * 0.4); c.fill();
  } else if (n === "clock") {
    P(); c.arc(0, 0, r, 0, 7); c.fill(); out(); c.lineWidth = r * 0.18; P(); c.moveTo(0, -r * 0.55); c.lineTo(0, 0); c.lineTo(r * 0.4, r * 0.25); c.stroke();
  } else if (n === "diamond") {
    poly([[-1, -0.3], [-0.5, -0.8], [0.5, -0.8], [1, -0.3], [0, 1]]); out(); c.lineWidth = r * 0.1; P(); c.moveTo(-r, -r * 0.3); c.lineTo(r, -r * 0.3); c.stroke();
  } else if (n === "smile") {
    P(); c.arc(0, 0, r, 0, 7); c.fill(); out(); P(); c.arc(-r * 0.35, -r * 0.2, r * 0.14, 0, 7); c.arc(r * 0.35, -r * 0.2, r * 0.14, 0, 7); c.fill();
    c.lineWidth = r * 0.14; P(); c.arc(0, r * 0.05, r * 0.55, 0.2, Math.PI - 0.2); c.stroke();
  } else if (n === "flower") {
    for (let i = 0; i < 5; i++) { const a = (i * 2 * Math.PI) / 5; P(); c.arc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.45, 0, 7); c.fill(); }
    out(); P(); c.arc(0, 0, r * 0.22, 0, 7); c.fill();
  } else if (n === "wing") {
    [[-1, -0.5], [1, 0.5]].forEach(([s, a]) => { P(); c.ellipse(s * r * 0.55, -r * 0.2, r * 0.55, r * 0.8, a, 0, 7); c.fill(); P(); c.ellipse(s * r * 0.4, r * 0.5, r * 0.4, r * 0.5, -a * 0.8, 0, 7); c.fill(); });
    c.fillRect(-r * 0.07, -r * 0.7, r * 0.14, r * 1.5);
  } else if (n === "wave") {
    c.strokeStyle = c.fillStyle; c.lineWidth = r * 0.2;
    for (let i = 1; i <= 3; i++) { P(); c.arc(-r * 0.7, 0, r * i * 0.5, -0.8, 0.8); c.stroke(); }
    P(); c.arc(-r * 0.7, 0, r * 0.24, 0, 7); c.fill();
  } else if (n === "person") {
    P(); c.arc(0, -r * 0.45, r * 0.4, 0, 7); c.fill(); P(); c.arc(0, r * 0.95, r * 0.85, Math.PI, 0); c.fill();
  } else if (n === "cross") shape(c, "cross", 0, 0, r, 0);
  else sparkle(c, 0, 0, r);
  c.restore();
}

function hero(c, css, C, L, x, y, a, now, al, W, S) {
  let st = C.hl === "random" ? (S.th ? S.th.hl[L.seed % S.th.hl.length] : L.sty) : C.hl, word = L.words[L.kw], size = C.font * 56, bk = (t) => { t = clamp(t) - 1; return t * t * (2.70158 * t + 1.70158) + 1; };
  if (RTL_RX.test(word) && (st === "letters" || st === "wave")) st = "pop";
  c.save(); c.font = `800 ${size}px ${S.ff}`; c.textAlign = "center"; c.textBaseline = "middle";
  const w = c.measureText(word).width, iw = C.icons ? size * 0.95 : 0, tot = w + iw, gx = Math.min(W - tot / 2 - 14, Math.max(tot / 2 + 14, x));
  const tx = gx - L.side * iw / 2, ty = y + size * 0.8 + Math.sin(now / 700 + L.seed) * 2, e = ease(clamp(a / 0.5));
  c.globalAlpha = clamp(al); c.fillStyle = css(1); c.shadowColor = css(0.9); c.shadowBlur = C.tglow; c.translate(tx, ty);
  if (!L.bd) {
    L.bd = 1; S.sparks = S.sparks || [];
    for (let i = 0; i < 16; i++) {
      const an = Math.random() * 6.283, sp = 60 + Math.random() * 160;
      S.sparks.push({ x: tx, y: ty, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 40, life: 0.9 + Math.random() * 0.6, max: 1.5, r: 3 + Math.random() * 4, k: ["sparkle", "cross", "burst", "heart", "shuriken"][i % 5] });
    }
  }
  if (a < 0.9) {
    const gr = c.createRadialGradient(0, 0, 0, 0, 0, size * 2.2); gr.addColorStop(0, css(0.35 * (1 - a / 0.9))); gr.addColorStop(1, css(0));
    c.shadowBlur = 0; c.fillStyle = gr; c.fillRect(-size * 2.2, -size * 2.2, size * 4.4, size * 4.4); c.fillStyle = css(1); c.shadowBlur = C.tglow;
  }
  c.save();
  if (st === "marker") { const p = ease(clamp(a / 0.45)), bw = w + size * 0.5, bh = size * 0.95; c.rotate(-0.035); c.shadowBlur = 0; c.fillRect(-bw / 2, -bh / 2, bw * p, bh); c.fillStyle = `rgba(12,12,12,${clamp(p * 1.6 - 0.3)})`; c.fillText(word, 0, 0); }
  else if (st === "pop") { const s = bk(a / 0.55); c.scale(s, s); c.rotate((1 - clamp(a / 0.55)) * -0.35); c.fillText(word, 0, 0); }
  else if (st === "glitch") {
    const g = Math.max((1 - clamp(a / 0.8)) ** 2, a > 1 && a % 3.5 < 0.22 ? 0.45 : 0), n = 7, sh = (size * 1.2) / n, fl = g > 0.05 ? Math.floor(now / 90) : 0;
    for (let i = 0; i < n; i++) { c.save(); c.beginPath(); c.rect(-w, -size * 0.6 + i * sh, w * 2, sh); c.clip(); c.fillText(word, Math.sin(i * 91.3 + L.seed + fl) * size * 0.6 * g, 0); c.restore(); }
  } else if (st === "slide") { c.beginPath(); c.rect(-w / 2 - 8, -size * 0.6, w + 16, size * 1.2); c.clip(); c.translate(0, (1 - e) * size * 1.1); c.fillText(word, 0, 0); }
  else if (st === "letters") {
    let xx = -w / 2; gr(word).forEach((ch, i) => { const cw = c.measureText(ch).width, q = clamp((a - i * 0.05) / 0.45), p = bk(q);
      c.save(); c.translate(xx + cw / 2, (1 - q) * -size * 0.7); c.scale(p, p); c.rotate((1 - q) * (i % 2 ? 0.6 : -0.6)); c.fillText(ch, 0, 0); c.restore(); xx += cw; });
  } else if (st === "neon") {
    const fl = a < 0.9 ? (Math.sin(a * 60) > -0.2 || a > 0.6 ? 1 : 0.15) : 1;
    c.globalAlpha = clamp(al * fl); c.shadowBlur = C.tglow * 2 + 10; c.strokeStyle = css(1); c.lineWidth = 2; c.strokeText(word, 0, 0); c.fillStyle = css(0.35); c.fillText(word, 0, 0);
  } else if (st === "wave") {
    let xx = -w / 2; gr(word).forEach((ch, i) => { const cw = c.measureText(ch).width, q = clamp((a - i * 0.04) / 0.35);
      c.save(); c.translate(xx + cw / 2, Math.sin(now / 260 + i * 0.7) * size * 0.08 * q); c.scale(ease(q), ease(q)); c.fillText(ch, 0, 0); c.restore(); xx += cw; });
  } else {
    const q = clamp(a / 0.25), s = 1 + (1 - ease(q)) * 2.2;
    if (a < 0.8) { c.strokeStyle = css(0.6 * (1 - a / 0.8)); c.lineWidth = 2; c.beginPath(); c.arc(0, 0, size * (0.6 + a * 2), 0, 7); c.stroke(); }
    c.globalAlpha = clamp(al * ease(q)); if (a > 0.25 && a < 0.6) c.translate(Math.sin(a * 90) * (1 - (a - 0.25) / 0.35) * 4, 0); c.scale(s, s); c.fillText(word, 0, 0);
  }
  c.restore();
  if (C.icons) {
    const q = clamp((a - 0.15) / 0.55); c.save(); c.translate(L.side * (w / 2 + iw / 2 + size * 0.1), Math.sin(now / 600 + L.seed) * 3);
    c.rotate((1 - q) * 0.8 * L.side + Math.sin(now / 800 + L.seed) * 0.08); c.scale(bk(q), bk(q)); c.fillStyle = css(1); ico(c, L.icon, 0, 0, size * 0.42); c.restore();
  }
  c.restore();
}

const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (t) => 1 - Math.pow(1 - t, 3);
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// ---------- Clock Sync ----------
function makeClock() {
  let pos = 0, at = 0, rep = 0, repAt = 0, id = null;
  return (reportedMs, uri, playing, t) => {
    const r = Number.isFinite(reportedMs) ? Math.max(0, reportedMs) : 0;
    if (!playing || uri !== id) { id = uri; pos = r; at = t; rep = r; repAt = t; return pos / 1000; }
    const seek = Math.abs(r - (rep + (t - repAt))) > 900;
    rep = r; repAt = t;
    const pred = pos + (t - at);
    pos = seek ? r : pred + (r - pred) * (1 - Math.exp(-Math.min(120, t - at) / 320));
    at = t; return pos / 1000;
  };
}
function wWin(L, WS, k) {
  const st = WS[k], nx = Math.max(st + 0.001, WS[k + 1] ?? L.t + L.dur), raw = L.we && Number.isFinite(L.we[k]) ? L.we[k] : nx;
  return [st, Math.min(Math.max(raw, st + 0.001), nx)];
}

const FLOW_ANIM = { glow: [3, 0.05, 12], wave: [9, 0.03, 8], pop: [0, 0.3, 10], rise: [0, 0, 10], soft: [0, 0, 6] };
const flSeg = (() => { try { return new Intl.Segmenter(undefined, { granularity: "grapheme" }); } catch { return null; } })();
const flUnits = (w) => (/[֐-ࣿיִ-﷿ﹰ-﻿]/.test(w) ? [w] : flSeg ? Array.from(flSeg.segment(w), (s) => s.segment) : Array.from(w));

function loadCfg() {
  const d = {
    bg: "gemini", color: "adaptive", custom: "#ffffff", edge: true, snap: true, alpha: 1, fade: 0.55, tglow: 18,
    dim: 0.4, font: 1, kinds: "mix", ctrl: "right", src: "auto", hl: "random", icons: true, prox: "mix", tr: "auto", auto: true, link: "comet", follow: true, maxHold: 1, trav: 1, bhq: 384, theme: "auto", themeForce: "auto", thFx: 1, cam: "chorus", camZ: 1.7, camSpd: 1, camBg: 0.5, camKick: 0.6, camRoll: 1, camVig: true, edgeMode: "progress", fam: "auto", bn: "sans", ar: "naskh", starSize: 1, vis: "off", visSize: 1, visSpd: 1, visAlways: false, bgSpeed: 1, par: 1, ctrlSize: 1, fps: 60, ana: 2, mxm: "", customUrl: "", edgeW: 2.5, ascSet: "classic", ascSize: 11, ascColor: "cover", ascStyle: "wave", ascAmp: 1, ascReact: 1, ascGlow: 0.5, ascFlowers: 7, perfPreset: "auto",
    bright: 1, lyricStyle: "constellation", flowAnim: "glow", flowAlign: "left", flowSize: 1, flowGlow: 1, flowLift: 1, flowSpeed: 1, flowBlur: 1, flowDim: 0.4, flowPos: 0.38, flowTr: true, flowTint: false, flowDust: false,
    geminiKey: ""
  };
  try {
    const sv = JSON.parse(localStorage.getItem(CL_KEY)) || {}, r = { ...d, ...sv };
    if (sv.edge === false && !sv.edgeMode) r.edgeMode = "off";
    if (r.bg === "g1" || r.bg === "g3") r.bg = "spiral";
    // Migration: clean removed ASCII background modes
    if (r.bg === "asc_knight" || r.bg === "asc_cosmos" || r.bg === "asc_auto") r.bg = "gemini";
    if (r.lyricStyle === "flow" && r.vis === "ring") r.vis = "off";
    return r;
  } catch { return d; }
}

function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hexToRgb(h) {
  if (!h) return null;
  const clean = h.replace("#", "").trim();
  const n = parseInt(clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean, 16);
  if (isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lift(c, minL) {
  let [r, g, b] = c.map((v) => v / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let l = (mx + mn) / 2, s = d ? d / (1 - Math.abs(2 * l - 1)) : 0, h = 0;
  if (d) { h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
  s = Math.max(s, 0.55); l = Math.max(l, minL);
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0), f(8), f(4)].map((v) => Math.round(v * 255));
}

function sparkle(c, x, y, r) {
  c.beginPath(); c.moveTo(x, y - r);
  c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r);
  c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill();
}
function shape(c, n, x, y, r, sp, v = 0) {
  if (n === "cross") { const t = r * 0.3; c.fillRect(x - t / 2, y - r * 1.2, t, r * 2.7); c.fillRect(x - r * 0.85, y - r * 0.5, r * 1.7, t); }
  else if (n === "shuriken") {
    c.save(); c.translate(x, y); c.rotate(sp); c.beginPath();
    for (let i = 0; i < 8; i++) { const q = i % 2 ? r * 0.36 : r * 1.2, a = (i * Math.PI) / 4; c.lineTo(Math.cos(a) * q, Math.sin(a) * q); }
    c.closePath(); c.moveTo(r * 0.15, 0); c.arc(0, 0, r * 0.15, 0, 7); c.fill("evenodd"); c.restore();
  } else if (n === "burst") {
    c.beginPath(); for (let i = 0; i < 16; i++) { const q = i % 2 ? r * 0.55 : r * 1.15, a = (i * Math.PI) / 8; c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); }
    c.closePath(); c.fill();
  } else if (n === "heart") {
    c.beginPath(); c.moveTo(x, y + r * 0.9); c.bezierCurveTo(x - r * 1.5, y - r * 0.1, x - r * 0.8, y - r * 1.1, x, y - r * 0.35);
    c.bezierCurveTo(x + r * 0.8, y - r * 1.1, x + r * 1.5, y - r * 0.1, x, y + r * 0.9); c.fill();
  } else if (n === "orbit") {
    c.save(); c.strokeStyle = c.fillStyle; c.lineWidth = 1.2; c.translate(x, y); c.rotate(sp * 0.5);
    c.beginPath(); c.ellipse(0, 0, r * 1.5, r * 0.55, 0, 0, 7); c.stroke(); c.fillRect(-r * 0.2, -r * 0.2, r * 0.4, r * 0.4); c.restore();
  } else if (n === "hazard") {
    c.save(); c.translate(x, y); c.rotate(sp * 0.4); for (let i = 0; i < 3; i++) { const ac = (i * 2 * Math.PI) / 3 - Math.PI / 2; c.beginPath(); c.arc(0, 0, r * 1.15, ac - Math.PI / 6, ac + Math.PI / 6); c.arc(0, 0, r * 0.38, ac + Math.PI / 6, ac - Math.PI / 6, true); c.closePath(); c.fill(); }
    c.beginPath(); c.arc(0, 0, r * 0.2, 0, 7); c.fill(); c.restore();
  } else if (n === "rune") {
    c.save(); c.translate(x, y); c.lineWidth = Math.max(1, r * 0.28); c.strokeStyle = c.fillStyle; c.lineCap = "round"; c.beginPath(); c.moveTo(0, -r * 1.1); c.lineTo(0, r * 1.1);
    const q = v % 3; if (q === 0) { c.moveTo(0, -r * 0.2); c.lineTo(r * 0.7, -r * 0.9); c.moveTo(0, r * 0.3); c.lineTo(-r * 0.7, -r * 0.2); } else if (q === 1) { c.moveTo(-r * 0.7, -r * 0.6); c.lineTo(r * 0.7, r * 0.2); } else { c.moveTo(-r * 0.6, -r * 0.9); c.lineTo(0, -r * 0.2); c.lineTo(r * 0.6, -r * 0.9); }
    c.stroke(); c.restore();
  } else if (n === "moon") {
    c.save(); c.beginPath(); c.arc(x, y, r, 0, 7); c.clip(); c.beginPath(); c.rect(x - r - 2, y - r - 2, 2 * r + 4, 2 * r + 4); c.arc(x + r * 0.5, y - r * 0.1, r * 0.85, 0, 7); c.fill("evenodd"); c.restore();
  } else sparkle(c, x, y, r);
}

function edgePt(d, W, H, m) {
  const w = W - 2 * m, h = H - 2 * m, P = 2 * (w + h); d = ((d % P) + P) % P;
  if (d < w) return [m + d, m]; d -= w; if (d < h) return [W - m, m + d]; d -= h; if (d < w) return [W - m - d, H - m]; d -= w;
  return [m, H - m - d];
}
let CL_EDGE_W = 2.5;
function comet(c, css, W, H, f, len, boost) {
  const m = 2 + CL_EDGE_W * 1.4, P = 2 * (W + H - 4 * m), n = 56, hp = edgePt(f * P, W, H, m); let [px, py] = hp;
  c.lineCap = "round"; c.shadowColor = css(0.9); c.shadowBlur = 14;
  for (let j = 1; j <= n; j++) {
    const q = edgePt(f * P - (j * len * P) / n, W, H, m), k = 1 - j / n;
    c.strokeStyle = css(0.95 * k * k); c.lineWidth = (1 + 3.5 * k) * (0.5 + CL_EDGE_W * 0.5); c.beginPath(); c.moveTo(px, py); c.lineTo(q[0], q[1]); c.stroke(); [px, py] = q;
  }
  c.fillStyle = css(1); c.shadowBlur = 24; sparkle(c, hp[0], hp[1], 6 + 4 * boost); c.shadowBlur = 0;
}

// ===== Galaxy & Backdrops =====
const GALS = new Set(["classic", "spiral", "g2", "g4", "g5", "galaxy"]);
const mixc = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const cl2 = (S) => S.coverPal || S.pal || [[150, 110, 255], [255, 110, 170], [110, 170, 255], [255, 200, 130]];
const live = (S, now, k = 0) => mixc(cl2(S)[0], cl2(S)[1], 0.5 + 0.5 * Math.sin(now / 4200 + S.en * 2.5 + k));
const dark = (col, a) => `rgb(${col.map((v) => (v * a) | 0)})`;
const softC = (c) => { const m = Math.max(...c); return m < 150 ? c.map((v) => Math.min(255, Math.round((v * 150) / Math.max(m, 1)))) : c; };
const mk = (N) => { const cv = document.createElement("canvas"); cv.width = cv.height = N; return cv; };
const gsr = (rnd) => () => (rnd() + rnd() + rnd() - 1.5) / 1.5;
const blob = (g, x, y, rad, col, a) => { const k = g.createRadialGradient(x, y, 0, x, y, rad); k.addColorStop(0, `rgba(${col},${a})`); k.addColorStop(1, `rgba(${col},0)`); g.fillStyle = k; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };

function bakeGalaxy(c1, c2, c3, seed) {
  const N = 1100, R = N / 2, cv = mk(N), g = cv.getContext("2d"), rnd = mulberry(seed), warm = [255, 236, 205], gs = gsr(rnd);
  g.translate(R, R); g.globalCompositeOperation = "lighter";
  const glow = g.createRadialGradient(0, 0, 0, 0, 0, R * 0.95);
  glow.addColorStop(0, `rgba(${mixc(c1, warm, 0.7)},.65)`); glow.addColorStop(0.1, `rgba(${mixc(c1, warm, 0.35)},.3)`); glow.addColorStop(0.4, `rgba(${c2},.1)`); glow.addColorStop(1, `rgba(${c2},0)`);
  g.fillStyle = glow; g.fillRect(-R, -R, N, N);
  const arm = (a, t, j) => { const th = t * 5 + a * Math.PI + j, r = R * (0.07 + 0.86 * t); return [Math.cos(th) * r, Math.sin(th) * r]; }, cols = [c1, c2, c3];
  for (let a = 0; a < 2; a++) for (let i = 0; i < 90; i++) { const t = i / 90, [x, y] = arm(a, t, gs() * 0.1); blob(g, x, y, R * (0.05 + 0.11 * t) * (0.7 + rnd() * 0.6), cols[(i + a) % 3], 0.1 * (1 - t * 0.5)); }
  for (let i = 0; i < 7000; i++) {
    let x, y; const t = Math.pow(rnd(), 1.2);
    if (rnd() < 0.22) { const r = R * 0.22 * Math.abs(gs()), an = rnd() * 6.283; x = Math.cos(an) * r; y = Math.sin(an) * r; }
    else { [x, y] = arm(Math.floor(rnd() * 2), t, gs() * (0.5 - t * 0.25)); x += gs() * R * 0.04; y += gs() * R * 0.04; }
    const d = Math.hypot(x, y) / R, col = d < 0.25 ? mixc(warm, c1, 0.3) : rnd() < 0.5 ? mixc([200, 220, 255], c1, 0.35) : mixc([255, 255, 255], c2, 0.3);
    g.globalAlpha = 0.15 + rnd() * 0.6; g.fillStyle = `rgb(${col})`; const s = 0.7 + rnd() * (rnd() < 0.04 ? 2.2 : 0.9); g.fillRect(x, y, s, s);
  }
  g.globalAlpha = 1; g.globalCompositeOperation = "destination-out";
  for (let a = 0; a < 2; a++) for (let i = 8; i < 80; i++) { const t = i / 90, [x, y] = arm(a, t, 0.16 + gs() * 0.04); blob(g, x, y, R * (0.03 + 0.05 * t), [0, 0, 0], 0.3); }
  return cv;
}

function bakeStipple(cs, seed) {
  const N = 1100, R = N / 2, cv = mk(N), g = cv.getContext("2d"), rnd = mulberry(seed), gs = gsr(rnd);
  g.translate(R, R); blob(g, 0, 0, R * 0.32, [255, 240, 215], 0.9);
  for (let i = 0; i < 7500; i++) { const a = Math.floor(rnd() * 2), t = Math.pow(rnd(), 0.9), th = t * 5.5 + a * Math.PI + gs() * 0.35 * (1 - 0.5 * t), r = R * (0.08 + 0.9 * t), col = rnd() < 0.3 ? [255, 245, 225] : cs[Math.floor(rnd() * 3)];
    g.save(); g.translate(Math.cos(th) * r, Math.sin(th) * r); g.rotate(th + Math.PI / 2 + gs() * 0.6); g.fillStyle = `rgba(${col},${0.4 + rnd() * 0.6})`; g.fillRect(-2.5, -0.8, 3.5 + rnd() * 4, 1.6 + rnd() * 0.8); g.restore(); }
  g.strokeStyle = `rgba(${cs[1]},.3)`; g.lineWidth = 1.2;
  for (let i = 0; i < 600; i++) { const r = R * (0.2 + 0.75 * rnd()), an = rnd() * 6.283, x = Math.cos(an) * r, y = Math.sin(an) * r; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 7, y + 11); g.stroke(); }
  return cv;
}

function bakePlanet(cs, seed) {
  const N = 160, cv = mk(N), g = cv.getContext("2d"), rnd = mulberry(seed);
  g.beginPath(); g.arc(80, 80, 78, 0, 7); g.clip(); g.fillStyle = `rgb(${cs[0]})`; g.fillRect(0, 0, N, N); g.lineCap = "round";
  for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(${rnd() < 0.5 ? cs[1] : cs[2]},${0.3 + rnd() * 0.5})`; g.lineWidth = 1 + rnd() * 2.5; const x = rnd() * N, y = rnd() * N; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 15, y + 8, x + 30 * (rnd() - 0.3), y + 20); g.stroke(); }
  for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * 0.5})`; g.fillRect(rnd() * N, rnd() * N, 1.5, 1.5); }
  return cv;
}

function dual(S, key, bake) {
  const k = (S.galVer || 0) + ":" + S.seed;
  if (S[key + "K"] !== k) { const p = cl2(S), sd = S.seed || 7; S[key] = [bake([p[0], p[1], p[2]], sd), bake([p[1], p[3], p[0]], sd + 1)]; S[key + "K"] = k; S[key + "T"] = S.bn || 0; }
}
function texDraw(c, S, key, now, cx, cy, sz, rot, sy) {
  const fin = clamp((now - S[key + "T"]) / 1400), f = 0.5 + 0.5 * Math.sin(now / 5200 + S.en * 2);
  c.save(); c.globalCompositeOperation = "lighter"; c.translate(cx, cy); c.rotate(rot[0]); c.scale(1, sy); c.rotate(rot[1]);
  [[S[key][0], 1 - f], [S[key][1], f]].forEach(([im, a]) => { c.globalAlpha = a * fin * (0.75 + 0.35 * S.en); c.drawImage(im, -sz / 2, -sz / 2, sz, sz); });
  c.restore();
}
function spike(c, x, y, L, a) { c.strokeStyle = `rgba(255,255,255,${a * 0.5})`; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - L, y); c.lineTo(x + L, y); c.moveTo(x, y - L); c.lineTo(x, y + L); c.stroke(); }

function fx(c, W, H, S, now, dt, prox, warp, ox, oy, n = 200) {
  if (!S.sf || S.sf.length !== n) S.sf = Array.from({ length: n }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() * 0.95 + 0.05, ph: Math.random() * 6.28, sp: Math.random() < 0.07 }));
  const p = cl2(S), spd = (0.012 + 0.05 * S.en) * (S.cfg.trav ?? 1), k = Math.max(W, H) * 0.16, tints = ["255,255,255", `${mixc(p[0], [255, 255, 255], 0.6)}`, `${mixc(p[1], [255, 255, 255], 0.6)}`];
  S.sf.forEach((s, i) => {
    s.z -= dt * spd; const px = W / 2 + (s.x / s.z) * k + ox * 2, py = H / 2 + (s.y / s.z) * k + oy * 2;
    if (s.z < 0.04 || px < -30 || px > W + 30 || py < -30 || py > H + 30) { Object.assign(s, { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: 1 }); return; }
    const f = prox(px, py, 150), [x, y] = warp(px, py, f), sz2 = (0.6 + (1 - s.z) * 2.2) * (1 + f * 1.8);
    const a = clamp(Math.pow(1 - s.z, 0.8) * (0.5 + 0.5 * Math.sin(now / 500 + s.ph)) * Math.min(1, (1 - s.z) * 10) + f * 0.5);
    c.fillStyle = `rgba(${tints[i % 3]},${a})`;
    if (sz2 > 2) sparkle(c, x, y, sz2 * 1.6); else { c.beginPath(); c.arc(x, y, sz2, 0, 7); c.fill(); }
    if (s.sp && sz2 > 1.4) spike(c, x, y, sz2 * 6, a);
  });
}
const parallax = (S, W, H, k = 0.025) => [(S.px - W / 2) * -k * S.pa * (S.cfg.par ?? 1), (S.py - H / 2) * -k * S.pa * (S.cfg.par ?? 1)];

function drawClassic(c, W, H, S, now, dt, prox, warp) {
  const tt = now / 1000, p = cl2(S), cols = [live(S, now), live(S, now, 2), p[2], p[3], live(S, now, 4), p[0]];
  c.fillStyle = dark(p[1], 0.05); c.fillRect(0, 0, W, H); c.globalCompositeOperation = "lighter";
  for (let k = 0; k < 6; k++) {
    const t = (k + 0.5) / 6, x = W * (0.05 + 0.9 * t) + Math.sin(tt * 0.15 + k) * W * 0.03, y = H * (0.95 - 0.9 * t) + Math.cos(tt * 0.12 + k * 2) * H * 0.03, r = Math.min(W, H) * (0.42 + 0.08 * Math.sin(tt * 0.2 + k));
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${cols[k]},${0.16 + 0.14 * S.en})`); g.addColorStop(1, `rgba(${cols[k]},0)`); c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  c.globalCompositeOperation = "source-over";
}

function drawSpiral(c, W, H, S, now, dt, prox, warp) {
  dual(S, "sp", (cs, sd) => bakeGalaxy(cs[0], cs[1], cs[2], sd)); c.fillStyle = dark(cl2(S)[1], 0.07); c.fillRect(0, 0, W, H);
  S.grot = (S.grot || 0) + dt * (0.01 + 0.035 * S.en); const [ox, oy] = parallax(S, W, H);
  texDraw(c, S, "sp", now, W / 2 + ox, H / 2 + oy, Math.max(W, H) * 1.4, [-0.5, S.grot], 0.62);
  c.save(); c.globalCompositeOperation = "lighter"; blob(c, W / 2 + ox, H / 2 + oy, Math.min(W, H) * 0.35, live(S, now), 0.06 + 0.2 * S.en + 0.12 * S.pulse); c.restore();
  fx(c, W, H, S, now, dt, prox, warp, ox, oy);
}

function noise2(x, y, P) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const h = (a, b) => { a = ((a % P) + P) % P; let n = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967295; };
  return (h(ix, iy) * (1 - sx) + h(ix + 1, iy) * sx) * (1 - sy) + (h(ix, iy + 1) * (1 - sx) + h(ix + 1, iy + 1) * sx) * sy;
}

function bhPolar(c1, c2, seed) {
  const PW = 1024, PH = 256, R = new Uint8Array(PW * PH), G = new Uint8Array(PW * PH), B = new Uint8Array(PW * PH), sd = seed % 89;
  for (let j = 0; j < PH; j++) {
    const t = j / (PH - 1), col = mixc(mixc([255, 248, 235], c1, clamp(t * 1.7)), c2, clamp(t * 1.7 - 0.7)), fall = Math.pow(1 - t, 1.2) * Math.min(1, 0.4 + t * 12);
    for (let i = 0; i < PW; i++) {
      const a = i / PW, n = noise2(a * 8 + sd, t * 70, 8) * 0.5 + noise2(a * 16 + 3, t * 160, 16) * 0.32 + noise2(a * 24 + 5, t * 330, 24) * 0.22 + 0.25 * Math.pow(noise2(a * 6 + 9, t * 22, 6), 3);
      const I = clamp((n - 0.28) * 2.1) * fall * 1.35, o = j * PW + i; R[o] = Math.min(255, col[0] * I); G[o] = Math.min(255, col[1] * I); B[o] = Math.min(255, col[2] * I);
    }
  }
  return { R, G, B };
}

function bhGeo(N) {
  const n2 = N * N, g = { rho1: new Uint8Array(n2), phi1: new Uint16Array(n2), w1: new Uint8Array(n2), rho2: new Uint8Array(n2), phi2: new Uint16Array(n2), w2: new Uint8Array(n2), ring: new Uint8Array(n2) };
  const VW = 8, ci = 0.17, rin = 2.3, rout = 7.6;
  for (let py = 0; py < N; py++) for (let px = 0; px < N; px++) {
    const p = py * N + px, u = ((px + 0.5) / N - 0.5) * 2 * VW, v = -((py + 0.5) / N - 0.5) * 2 * VW, r = Math.hypot(u, v), Y = -v / ci, rho = Math.hypot(u, Y);
    if (rho > rin && rho < rout && (Y > 0 || r > 1.02)) {
      const ph = Math.atan2(Y, u), dop = 1 + 0.75 * -Math.cos(ph), edge = clamp((rho - rin) / 0.25) * clamp((rout - rho) / 1.4);
      g.rho1[p] = ((rho - rin) / (rout - rin)) * 255; g.phi1[p] = (((ph / 6.28319 + 1) % 1) * 1023.99) | 0; g.w1[p] = clamp((0.95 * dop * edge) / 1.75) * 255;
    }
    if (r > 1.02 && r < 3.5) {
      const t2 = (r - 1.02) / 2.48, ph = Math.atan2(v, u), dop = 1 + 0.75 * -Math.cos(ph);
      g.rho2[p] = t2 * 0.9 * 255; g.phi2[p] = (((ph / 6.28319 + 1) % 1) * 1023.99) | 0; g.w2[p] = clamp((0.85 * dop * Math.pow(1 - t2, 1.3) * clamp(t2 * 12 + 0.3)) / 1.75) * 255;
    }
    g.ring[p] = 255 * clamp(Math.exp(-(((r - 1.035) / 0.022) ** 2)) + 0.22 * Math.exp(-(((r - 1.12) / 0.16) ** 2)));
  }
  return g;
}

function bhRender(S, rot, gain) {
  const N = S.bhN, g = S.bhGeo, T = S.bhTex, d = S.bhU32, sh = S.bhSh, n2 = N * N;
  for (let j = 0; j < 256; j++) sh[j] = ((rot * Math.pow(2.6 / (2.3 + (j / 255) * 5.3), 1.5) * 162.97) | 0) & 1023;
  for (let p = 0; p < n2; p++) {
    const a = g.w1[p], b = g.w2[p], rg = g.ring[p]; let R = 0, G = 0, B = 0;
    if (a) { const ri = g.rho1[p], i = (ri << 10) | ((g.phi1[p] + sh[ri]) & 1023); R = T.R[i] * a; G = T.G[i] * a; B = T.B[i] * a; }
    if (b) { const ri = g.rho2[p], i = (ri << 10) | ((g.phi2[p] + sh[ri]) & 1023); R += T.R[i] * b; G += T.G[i] * b; B += T.B[i] * b; }
    R = Math.min(255, (R >> 8) * gain + rg); G = Math.min(255, (G >> 8) * gain + rg * 0.95); B = Math.min(255, (B >> 8) * gain + rg * 0.9);
    d[p] = 0xff000000 | ((B | 0) << 16) | ((G | 0) << 8) | (R | 0);
  }
  S.bhCtx.putImageData(S.bhImg, 0, 0);
}

function drawBH(c, W, H, S, now, dt, prox, warp) {
  const N = 384, key = (S.galVer || 0) + ":" + S.seed;
  if (S.bhN !== N) {
    S.bhN = N; S.bhGeo = bhGeo(N); S.bhCv = mk(N); S.bhCtx = S.bhCv.getContext("2d");
    S.bhImg = S.bhCtx.createImageData(N, N); S.bhU32 = new Uint32Array(S.bhImg.data.buffer);
    S.bhSh = new Int32Array(256); S.bhBl = mk(64); S.bhK = null;
  }
  if (S.bhK !== key) { S.bhK = key; S.bhTex = bhPolar(mixc(cl2(S)[0], [255, 255, 255], 0.25), cl2(S)[1], S.seed || 7); S.bhT = now; }
  const fin = clamp((now - S.bhT) / 1400), [ox, oy] = parallax(S, W, H, 0.02), cx = W / 2 + ox, cy = H / 2 + oy, Rs = Math.min(W, H) * 0.1, size = Rs * 16, E = Rs * 1.25, lc = live(S, now);
  c.fillStyle = "#010103"; c.fillRect(0, 0, W, H);
  c.save(); c.globalCompositeOperation = "lighter"; blob(c, cx, cy, Rs * 9, lc, 0.05 + 0.1 * S.en); c.restore();
  const lens = (x, y, f) => { const [wx, wy] = warp(x, y, f), dx = wx - cx, dy = wy - cy, d = Math.hypot(dx, dy) || 1, r2 = 0.5 * (d + Math.sqrt(d * d + 4 * E * E)); return [cx + (dx / d) * r2, cy + (dy / d) * r2]; };
  fx(c, W, H, S, now, dt, prox, lens, ox, oy, 200);
  S.bhRot = (S.bhRot || 0) + dt * (0.1 + 0.45 * S.en); bhRender(S, S.bhRot, 0.8 + 0.5 * S.en + 0.3 * S.pulse);
  c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = fin;
  c.drawImage(S.bhCv, cx - size / 2, cy - size / 2, size, size);
  S.bhBl.getContext("2d").drawImage(S.bhCv, 0, 0, 64, 64); c.globalAlpha = 0.65 * fin; c.drawImage(S.bhBl, cx - size * 0.75, cy - size * 0.75, size * 1.5, size * 1.5);
  c.restore();
}

function drawVG1(c, W, H, S, now, dt, prox, warp) {
  const p = cl2(S), t = now / 1000; c.fillStyle = `rgb(${p[1].map((v, i) => ((v * 0.22 + [8, 14, 40][i] * 0.8) | 0))})`; c.fillRect(0, 0, W, H);
  if (!S.vg || S.vg.w !== W) S.vg = { w: W, p: Array.from({ length: 700 }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, k: i % 4, ph: Math.random() * 6.28 })) };
  const C1 = [W * 0.3, H * 0.48, 1], C2 = [W * 0.72, H * 0.36, -1]; c.lineCap = "round"; c.lineWidth = 3.4;
  S.vg.p.forEach((q) => {
    let vx = Math.cos(q.y * 0.012 + t * 0.3) * 0.5, vy = Math.sin(q.x * 0.01 + t * 0.25) * 0.5;
    [C1, C2].forEach(([cx, cy, dir]) => { const dx = q.x - cx, dy = q.y - cy, d = Math.hypot(dx, dy) + 40, w = Math.min(1.6, 220 / d); vx += (-dy / d) * w * dir; vy += (dx / d) * w * dir; });
    const m = Math.hypot(vx, vy) || 1, sp = (38 + 80 * S.en) * dt; q.x += (vx / m) * sp; q.y += (vy / m) * sp;
    if (q.x < -20 || q.x > W + 20 || q.y < -20 || q.y > H + 20) { q.x = Math.random() * W; q.y = Math.random() * H; return; }
    const f = prox(q.x, q.y, 150), [x, y] = warp(q.x, q.y, f), col = mixc(p[q.k], [255, 255, 255], 0.25 + 0.2 * Math.sin(t + q.ph));
    c.strokeStyle = `rgba(${col},${clamp(0.5 + 0.3 * Math.sin(t * 1.3 + q.ph) + f * 0.3)})`; c.beginPath(); c.moveTo(x, y); c.lineTo(x - (vx / m) * 15, y - (vy / m) * 15); c.stroke();
  });
}

function drawVG2(c, W, H, S, now, dt, prox, warp) {
  const t = now / 1000, p = cl2(S); dual(S, "st", bakeStipple);
  if (S.plK !== S.galVer + ":" + S.seed) {
    S.plK = S.galVer + ":" + S.seed;
    S.pl = [0, 1, 2, 3, 4, 5, 6].map((i) => ({ im: bakePlanet([p[i % 4], p[(i + 1) % 4], mixc(p[(i + 2) % 4], [255, 255, 255], 0.3)], (S.seed || 7) + i), a: i * 0.9, rx: 0.28 + 0.05 * i, ry: 0.2 + 0.04 * i, v: 0.04 + 0.015 * ((i * 7) % 5), s: 34 + ((i * 23) % 40) }));
  }
  c.fillStyle = "rgb(8,10,16)"; c.fillRect(0, 0, W, H); S.grot = (S.grot || 0) + dt * (0.03 + 0.06 * S.en);
  texDraw(c, S, "st", now, W / 2, H / 2, Math.min(W, H) * 1.5, [0, S.grot], 0.88);
  S.pl.forEach((o) => { const a = o.a + t * o.v, x = W / 2 + Math.cos(a) * o.rx * W * 1.3, y = H / 2 + Math.sin(a) * o.ry * H * 1.3, f = prox(x, y, 160), [wx, wy] = warp(x, y, f), sz = o.s * (1 + f * 0.5) * (Math.min(W, H) / 700 + 0.4);
    c.save(); c.translate(wx, wy); c.rotate(t * 0.1 + o.a); c.drawImage(o.im, -sz, -sz, sz * 2, sz * 2); c.restore(); });
}

function drawGal(c, W, H, S, now, dt, prox, warp) {
  ({ classic: drawClassic, spiral: drawSpiral, galaxy: drawSpiral, g2: drawBH, g4: drawVG1, g5: drawVG2 }[S.cfg.bg] || drawSpiral)(c, W, H, S, now, dt, prox, warp);
}

// ===== Electric Lightning Border & Music-Synced Outline =====
function drawElectricArc(c, x1, y1, x2, y2, displace) {
  const steps = 6;
  const dx = (x2 - x1) / steps;
  const dy = (y2 - y1) / steps;
  const dist = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = -(y2 - y1) / dist;
  const ny = (x2 - x1) / dist;

  c.beginPath();
  c.moveTo(x1, y1);
  for (let i = 1; i < steps; i++) {
    const offset = (Math.random() - 0.5) * displace * 2;
    c.lineTo(x1 + dx * i + nx * offset, y1 + dy * i + ny * offset);
  }
  c.lineTo(x2, y2);
  c.stroke();
}

function drawEdgeLightning(c, css, W, H, S, now, dt, dur0, p0, C) {
  if (C.edgeMode === "off") return;
  CL_EDGE_W = C.edgeW ?? 2.5;
  const m = 3 + CL_EDGE_W * 1.4;
  const w = W - 2 * m, h = H - 2 * m;
  const P = 2 * (w + h);
  const f = dur0 ? clamp(p0 / dur0) : 0;
  const pulse = S.pulse || 0;
  const en = S.en || 0.5;

  c.save();
  // Ambient border track with breathing luminosity
  c.strokeStyle = css(0.12 + 0.22 * pulse + 0.1 * en);
  c.lineWidth = Math.max(1, CL_EDGE_W * 0.7);
  c.strokeRect(m, m, w, h);

  if (C.edgeMode === "progress") {
    // Glowing music-synced progress line
    c.save();
    c.lineCap = "round";
    c.setLineDash([f * P, P]);
    c.strokeStyle = css(0.85 + 0.15 * pulse);
    c.lineWidth = (1.5 + CL_EDGE_W * 1.2) * (1 + 0.45 * pulse);
    c.shadowColor = css(0.95);
    c.shadowBlur = 12 + 24 * pulse + 12 * en;
    c.strokeRect(m, m, w, h);
    c.restore();

    // High-energy Comet head
    comet(c, css, W, H, f, 0.05 + 0.03 * pulse, pulse);
  } else {
    // Reactive / Orbiting surge mode
    S.edge = (S.edge + dt * (0.08 + 0.16 * en + 0.12 * pulse)) % 1;
    comet(c, css, W, H, S.edge, 0.14, pulse);
    comet(c, css, W, H, (S.edge + 0.5) % 1, 0.14, pulse);
  }

  // Smooth glowing corner accents - no blinding white flashes
  if (en > 0.3) {
    c.save();
    c.strokeStyle = css(0.45 * en);
    c.shadowColor = css(0.7);
    c.shadowBlur = 10;
    c.lineWidth = Math.max(1.2, CL_EDGE_W * 0.8);
    const len = 35 + 25 * en;
    const corners = [
      [m, m, 1, 0, 0, 1],
      [W - m, m, -1, 0, 0, 1],
      [W - m, H - m, -1, 0, 0, -1],
      [m, H - m, 1, 0, 0, -1]
    ];
    for (const [cx, cy, dx1, dy1, dx2, dy2] of corners) {
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + dx1 * len, cy + dy1 * len); c.stroke();
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + dx2 * len, cy + dy2 * len); c.stroke();
    }
    c.restore();
  }

  c.restore();
}

// ===== Genre-Themed Visual Generators for Gemini Generative Mode =====
function drawSynthGrid(c, W, H, S, t, spd, p) {
  const horizon = H * 0.56;
  const en = S.en || 0.5, pulse = S.pulse || 0;
  c.save();
  c.strokeStyle = `rgba(${p[1] || [120, 0, 255]}, ${0.28 + 0.25 * pulse})`;
  c.lineWidth = 1.4;
  c.shadowColor = `rgba(${p[0] || [255, 0, 128]}, 0.8)`;
  c.shadowBlur = 10 + 14 * pulse;

  // Vanishing point perspective lines
  const numLines = 18;
  for (let i = -numLines; i <= numLines; i++) {
    const xBottom = W * 0.5 + i * (W / (numLines * 0.8));
    c.beginPath();
    c.moveTo(W * 0.5, horizon);
    c.lineTo(xBottom, H);
    c.stroke();
  }

  // Moving horizontal lines
  const speed = (t * (28 + 40 * en) * spd) % 1;
  const numHoriz = 9;
  for (let k = 0; k < numHoriz; k++) {
    const f = ((k + speed) / numHoriz) ** 2.2;
    const y = horizon + f * (H - horizon);
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(W, y);
    c.stroke();
  }
  c.restore();
}

function drawBokehAura(c, W, H, S, now, dt, p) {
  S.bokeh = S.bokeh || Array.from({ length: 22 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: 30 + Math.random() * 55,
    vy: -18 - Math.random() * 32,
    vx: (Math.random() - 0.5) * 12,
    col: p[Math.floor(Math.random() * 3)],
    phase: Math.random() * Math.PI * 2
  }));

  const pulse = S.pulse || 0, en = S.en || 0.5;
  c.save();
  c.globalCompositeOperation = "screen";
  S.bokeh.forEach((b) => {
    b.y += b.vy * dt * (1 + 0.5 * en);
    b.x += b.vx * dt + Math.sin(now * 0.001 + b.phase) * 0.4;
    if (b.y < -b.r * 2) { b.y = H + b.r; b.x = Math.random() * W; }
    const curR = b.r * (1 + 0.35 * pulse + 0.2 * en);
    blob(c, b.x, b.y, curR, b.col, 0.16 + 0.18 * pulse);
  });
  c.restore();
}

function drawRockElectric(c, W, H, S, now, dt, p) {
  // Smooth ambient vibration lines - no full-screen white strobe flashes
  const en = S.en || 0.5;
  c.save();
  c.strokeStyle = `rgba(${p[0] || [255, 60, 60]}, ${0.25 + 0.15 * en})`;
  c.lineWidth = 1.6;
  c.shadowColor = `rgba(${p[0] || [255, 60, 60]}, 0.6)`;
  c.shadowBlur = 8;
  const y = H * 0.68;
  c.beginPath();
  for (let x = 0; x <= W; x += 18) {
    const wy = y + Math.sin(x * 0.015 + now * 0.003) * (14 + 18 * en);
    x ? c.lineTo(x, wy) : c.moveTo(x, wy);
  }
  c.stroke();
  c.restore();
}

function drawSouthAsianEmbers(c, W, H, S, now, dt, p) {
  S.embers = S.embers || Array.from({ length: 32 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    sz: 1.5 + Math.random() * 3,
    vy: -25 - Math.random() * 45,
    seed: Math.random() * 10
  }));

  const pulse = S.pulse || 0;
  c.save();
  c.fillStyle = `rgba(${p[2] || [255, 215, 120]}, 0.85)`;
  c.shadowColor = `rgba(${p[0] || [255, 140, 40]}, 0.9)`;
  c.shadowBlur = 10 + 12 * pulse;
  S.embers.forEach((em) => {
    em.y += em.vy * dt;
    em.x += Math.sin(now * 0.002 + em.seed) * 0.8;
    if (em.y < -10) { em.y = H + 10; em.x = Math.random() * W; }
    sparkle(c, em.x, em.y, em.sz * (1 + 0.6 * pulse));
  });
  c.restore();
}

function drawEtherealStardust(c, W, H, S, now, dt, p) {
  S.stardust = S.stardust || Array.from({ length: 45 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: 1 + Math.random() * 2.5,
    ph: Math.random() * 6.28,
    spd: 0.8 + Math.random() * 1.5
  }));

  const pulse = S.pulse || 0;
  c.save();
  S.stardust.forEach((st) => {
    const a = 0.3 + 0.45 * Math.sin(now * 0.0015 * st.spd + st.ph) + 0.25 * pulse;
    c.fillStyle = `rgba(${p[1] || [180, 150, 255]}, ${clamp(a)})`;
    c.shadowColor = `rgba(${p[0] || [140, 110, 240]}, 0.8)`;
    c.shadowBlur = 8 + 10 * pulse;
    sparkle(c, st.x, st.y, st.r * (1 + 0.5 * pulse));
  });
  c.restore();
}

function drawHarmonicRibbons(c, W, H, S, t, spd, p) {
  const pulse = S.pulse || 0, en = S.en || 0.5;
  c.save();
  c.lineWidth = 1.8;
  for (let k = 0; k < 3; k++) {
    const base = H * (0.42 + k * 0.12);
    const col = p[k % 4];
    c.strokeStyle = `rgba(${col}, ${0.22 + 0.18 * pulse})`;
    c.shadowColor = `rgba(${col}, 0.7)`;
    c.shadowBlur = 8 + 12 * pulse;
    c.beginPath();
    for (let x = 0; x <= W; x += 16) {
      const y = base + Math.sin(x * 0.004 + t * (0.8 + k * 0.3) * spd) * (20 + 36 * pulse + 18 * en);
      x ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.stroke();
  }
  c.restore();
}

// ===== Gemini Generative AI Background (Vibrant Audio-Reactive Canvas) =====
function drawGeminiGenerative(c, W, H, S, now, dt, prox, warp) {
  const p = cl2(S), t = now / 1000, spd = (S.aiVibe?.speed || 1.0) * (S.cfg.bgSpeed || 1);
  const pulse = S.pulse || 0, en = S.en || 0.5;

  // 1. Lush Deep Foundation matched directly to music cover palette
  const bgGrad = c.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, dark(p[3] || p[0], 0.38));
  bgGrad.addColorStop(0.5, dark(p[1] || p[0], 0.28));
  bgGrad.addColorStop(1, dark(p[0], 0.36));
  c.fillStyle = bgGrad;
  c.fillRect(0, 0, W, H);

  c.save();
  c.globalCompositeOperation = "screen";

  // 2. Large Organic Fluid Plasma Blobs (Smooth, non-flashing, reacts to proximity)
  const numBlobs = 7;
  for (let i = 0; i < numBlobs; i++) {
    const ph = i * 1.08;
    let bx = W * (0.5 + 0.42 * Math.sin(t * 0.22 * spd + ph) * Math.cos(t * 0.12 * spd + i * 0.7));
    let by = H * (0.5 + 0.38 * Math.cos(t * 0.18 * spd + ph * 1.3));
    const f = prox(bx, by, Math.min(W, H) * 0.42);
    [bx, by] = warp(bx, by, f);
    const rad = Math.min(W, H) * (0.42 + 0.15 * Math.sin(t * 0.32 * spd + i) + 0.12 * en);
    const col = p[i % 4];
    blob(c, bx, by, rad, col, 0.30 + 0.12 * en);
  }

  // 3. Shockwaves disabled per user request (no moving circle)
  // 4. Genre-Themed Visual Layers
  const genre = (S.aiVibe?.genre || "").toLowerCase();
  const artist = (S.artist || "").toLowerCase();

  if (/synth|cyber|techno|electro|edm|dance|house/i.test(genre) || /synth|cyber|daft/i.test(artist)) {
    drawSynthGrid(c, W, H, S, t, spd, p);
  } else if (/r&b|soul|hip|rap|trap|urban/i.test(genre) || /usher|weeknd|drake|travis/i.test(artist)) {
    drawBokehAura(c, W, H, S, now, dt, p);
  } else if (/rock|metal|punk|grunge|alternative/i.test(genre) || /nirvana|linkin/i.test(artist)) {
    drawRockElectric(c, W, H, S, now, dt, p);
  } else if (/bengali|south asian|bollywood|fusion/i.test(genre) || /arijit|atif|nusrat|arnob|tagore/i.test(artist)) {
    drawSouthAsianEmbers(c, W, H, S, now, dt, p);
  } else if (/dream|ambient|folk|indie|acoustic/i.test(genre) || /beach house|bon iver|cigarettes/i.test(artist)) {
    drawEtherealStardust(c, W, H, S, now, dt, p);
  } else {
    drawHarmonicRibbons(c, W, H, S, t, spd, p);
  }

  // 5. Subtle Ambient Typography Watermark (Curated motion editorial aesthetic)
  const watermarkText = (S.aiVibe?.genre || S.th?.name || S.aiVibe?.mood || S.artist || "").toUpperCase();
  if (watermarkText) {
    c.save();
    c.font = `900 ${Math.min(W * 0.12, 130)}px ${fontStack(S.cfg, S)}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.letterSpacing = "0.18em";
    c.strokeStyle = `rgba(${p[0]}, ${0.045 + 0.04 * pulse + 0.02 * en})`;
    c.lineWidth = 1.4;
    c.strokeText(watermarkText, W / 2, H * 0.52);
    c.restore();
  }

  c.restore();
  fx(c, W, H, S, now, dt, prox, warp, 0, 0, 160);
}

// ===== Artist themes =====
function firstOnset(on, t) { let lo = 0, hi = on.length; while (lo < hi) { const m = (lo + hi) >> 1; if (on[m] < t) lo = m + 1; else hi = m; } return lo < on.length ? on[lo] : null; }
const THEMES = {
  fantasy: { name: "Dark Fantasy", pal: [[150, 120, 255], [60, 200, 190], [235, 205, 150], [28, 18, 60]], accent: [196, 176, 255], kinds: ["cross", "rune", "moon", "sparkle", "orbit"], hl: ["slide", "wave", "neon"], font: "Cinzel" },
  toxic: { name: "Toxic", pal: [[120, 255, 60], [255, 40, 70], [240, 255, 220], [10, 30, 12]], accent: [150, 255, 90], kinds: ["hazard", "shuriken", "burst", "cross"], hl: ["glitch", "stamp", "neon"], font: "Orbitron" },
  noir: { name: "Noir", pal: [[255, 80, 110], [80, 120, 255], [255, 210, 220], [24, 10, 28]], accent: [255, 140, 170], kinds: ["heart", "sparkle", "orbit", "moon"], hl: ["wave", "slide", "marker"], font: "Playfair Display" },
  traditional: { name: "Traditional", pal: [[255, 170, 60], [200, 40, 40], [255, 215, 120], [40, 10, 10]], accent: [255, 205, 120], kinds: ["burst", "orbit", "sparkle", "heart"], hl: ["slide", "pop", "wave"], font: "Cormorant Garamond" },
  dark: { name: "Dark", pal: [[200, 200, 215], [170, 20, 45], [255, 255, 255], [8, 8, 12]], accent: [236, 236, 246], kinds: ["cross", "sparkle", "moon", "shuriken"], hl: ["slide", "glitch", "stamp"], font: "Inter" },
  fancy: { name: "Fancy", pal: [[255, 150, 215], [150, 190, 255], [255, 235, 150], [40, 20, 70]], accent: [255, 195, 235], kinds: ["heart", "burst", "sparkle", "orbit"], hl: ["pop", "letters", "wave", "marker"], font: "Dancing Script" },
  luxury: { name: "Luxury", pal: [[235, 190, 90], [120, 90, 40], [255, 240, 200], [14, 10, 6]], accent: [246, 208, 120], kinds: ["sparkle", "burst", "cross", "moon"], hl: ["slide", "neon", "wave"], font: "Playfair Display" },
};
const ARTIST_THEME = [
  [/cigarettes after sex|^cas$|ethel cain|florence|hozier|lord huron|wardruna|fleet foxes|bon iver|novo amor|gregory alan/i, "fantasy"],
  [/weeknd|abel tesfaye|travis scott|playboi carti|xxxtentacion|\$uicide|bones\b|ski mask|trippie redd|kid cudi/i, "toxic"],
  [/sombr|lana del rey|the neighbourhood|arctic monkeys|frank ocean|daniel caesar|bryson tiller|d4vd|mitski|clairo|beach house|the 1975|keshi|joji|laufey|rex orange/i, "noir"],
  [/juice wrld|billie eilish|lil peep|radiohead|joy division|\bnf\b|linkin park|nirvana|my chemical|evanescence|artcell|warfaze|nemesis|bring me the horizon|deftones/i, "dark"],
  [/arijit|rahman|nusrat|rahat fateh|atif aslam|ali sethi|abida parveen|fairuz|kulthum|tagore|anupam roy|habib wahid|arnob|minar rahman|tahsan|ayub bachchu|shironamhin|lalon|kishore kumar|mohammed rafi|lata mangeshkar|asha bhosle|coke studio|shreya ghoshal|sonu nigam|kumar sanu|pritom|chirkutt|sid sriram|jubin nautiyal/i, "traditional"],
  [/taylor swift|dua lipa|ariana grande|sabrina carpenter|olivia rodrigo|doja cat|charli xcx|melanie martinez|katy perry|lady gaga|ava max|tate mcrae|chappell roan|gracie abrams|selena gomez|bts|blackpink|newjeans|twice\b|jennie|rosé/i, "fancy"],
  [/drake|\bye\b|kanye|jay-z|rick ross|gucci mane|21 savage|migos|\bfuture\b|frank sinatra|michael bubl|dean martin|bruno mars|post malone|burna boy|wizkid|rihanna|beyonc/i, "luxury"],
];
function hashStr(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function mkTheme(id, artist) {
  const t = THEMES[id], seed = hashStr(artist || id), r = mulberry(seed), ids = Object.keys(THEMES), o = THEMES[ids[Math.floor(r() * ids.length)]];
  return { id, ...t, seed, pal: t.pal.map((c, i) => mixc(c, o.pal[i], 0.22 * r())) };
}
function pickTheme(artist, mode, force) {
  if (mode === "off") return null;
  if (force && force !== "auto") return mkTheme(force, artist);
  const m = ARTIST_THEME.find(([rx]) => rx.test(artist || "")); if (m) return mkTheme(m[1], artist);
  return mode === "always" ? mkTheme(Object.keys(THEMES)[hashStr(artist || "x") % Object.keys(THEMES).length], artist) : null;
}

// ===== Fonts =====
const BN = { sans: "Noto Sans Bengali", hind: "Hind Siliguri", round: "Baloo Da 2", modern: "Anek Bangla", serif: "Noto Serif Bengali" };
const AR = { naskh: "Noto Naskh Arabic", nastaliq: "Noto Nastaliq Urdu", amiri: "Amiri" };
const fontStack = (C, S) => `"${C.fam === "auto" ? (S.th ? S.th.font : "Inter") : C.fam}", "${BN[C.bn] || BN.sans}", "${AR[C.ar] || AR.naskh}", Inter, -apple-system, sans-serif`;
const gr = (w) => (typeof Intl !== "undefined" && Intl.Segmenter ? [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(w)].map((x) => x.segment) : [...w]);

// ===== Backgrounds =====
const BGX = new Set(["aurora", "synthwave", "waves", "lava"]);
function bgAurora(c, W, H, S, now) {
  const p = cl2(S), t = now / 1000; c.fillStyle = "#03040a"; c.fillRect(0, 0, W, H); c.save(); c.globalCompositeOperation = "lighter";
  for (let i = 0; i < 5; i++) {
    const col = i % 2 ? live(S, now, i) : p[i % 4], base = H * (0.28 + i * 0.07), amp = H * (0.07 + 0.05 * S.en), th = H * (0.16 + 0.04 * Math.sin(t * 0.3 + i)), g = c.createLinearGradient(0, base - amp, 0, base + th + amp);
    g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(0.45, `rgba(${col},${0.2 + 0.18 * S.en})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.beginPath();
    for (let x = 0; x <= W; x += 10) { const y = base + Math.sin(x * 0.004 + t * 0.35 + i * 1.3) * amp + Math.sin(x * 0.011 - t * 0.5 + i) * amp * 0.4; x ? c.lineTo(x, y) : c.moveTo(x, y); }
    for (let x = W; x >= 0; x -= 10) c.lineTo(x, base + th + Math.sin(x * 0.005 + t * 0.3 + i * 1.7) * amp * 0.7); c.closePath(); c.fill();
  }
  c.restore();
}
function bgSynth(c, W, H, S, now) {
  const p = cl2(S), t = now / 1000, hz = H * 0.58, g = c.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, dark(p[3], 0.7)); g.addColorStop(1, dark(mixc(p[1], p[0], 0.4), 0.8)); c.fillStyle = g; c.fillRect(0, 0, W, hz);
  c.fillStyle = dark(p[3], 0.25); c.fillRect(0, hz, W, H - hz);
  const R = Math.min(W, H) * 0.2, sy = hz - R * 0.9, sg = c.createLinearGradient(0, sy - R, 0, sy + R); sg.addColorStop(0, `rgb(${p[2]})`); sg.addColorStop(1, `rgb(${p[1]})`);
  c.save(); c.beginPath(); c.arc(W / 2, sy, R, 0, 7); c.clip(); c.fillStyle = sg; c.fillRect(W / 2 - R, sy - R, 2 * R, 2 * R); c.restore();
  blob(c, W / 2, sy, R * 2.4, p[1], 0.18 + 0.2 * S.en);
}
function bgWaves(c, W, H, S, now) {
  const p = cl2(S), t = now / 1000, g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, dark(p[3], 0.6)); g.addColorStop(1, "#02030a"); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let k = 0; k < 6; k++) { const base = H * (0.42 + k * 0.1), amp = H * (0.025 + 0.03 * S.en) * (1 + k * 0.2), col = k % 2 ? live(S, now, k) : p[k % 4], gg = c.createLinearGradient(0, base - amp, 0, H);
    gg.addColorStop(0, `rgba(${col},.42)`); gg.addColorStop(1, `rgba(${col},.04)`); c.fillStyle = gg; c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W; x += 12) c.lineTo(x, base + Math.sin(x * 0.006 + t * (0.5 + k * 0.12) + k) * amp + Math.sin(x * 0.015 - t * 0.7 + k * 2) * amp * 0.3); c.lineTo(W, H); c.closePath(); c.fill(); }
}
function bgLava(c, W, H, S, now) {
  const p = cl2(S), t = now / 1000; c.fillStyle = dark(p[3], 0.35); c.fillRect(0, 0, W, H); c.save(); c.globalCompositeOperation = "lighter";
  for (let i = 0; i < 7; i++) blob(c, W * (0.5 + 0.4 * Math.sin(t * 0.11 * (1 + (i % 4) * 0.3) + i * 1.7)), H * (0.5 + 0.4 * Math.cos(t * 0.09 * (1 + (i % 3) * 0.4) + i * 2.3)), Math.min(W, H) * (0.28 + 0.08 * Math.sin(t * 0.2 + i) + 0.1 * S.en), i % 2 ? live(S, now, i) : p[i % 4], 0.55); c.restore();
}
function drawBackdrop(c, W, H, S, now, dt, prox, warp) { ({ aurora: bgAurora, synthwave: bgSynth, waves: bgWaves, lava: bgLava }[S.cfg.bg])(c, W, H, S, now, dt, prox, warp); }

// ===== Visualizer (shown during pauses/instrumentals in Constellation mode) =====
function drawVis(c, css, W, H, S, now, a) {
  const C = S.cfg, m = C.vis;
  if (m === "off" || C.lyricStyle === "flow") return;
  const cx = W / 2, cy = H / 2, base = Math.min(W, H) * 0.2 * C.visSize, t = (now / 1000) * C.visSpd, e = S.en;
  c.save(); c.shadowColor = css(0.9); c.shadowBlur = 12;
  if (m === "bars") {
    const n = 72, in0 = base * 0.8; c.lineCap = "round"; c.lineWidth = Math.max(2, base * 0.045);
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * 6.2832 + t * 0.1, v = 0.2 + e * (0.5 + 0.5 * Math.sin(i * 0.9 + t * 3) * Math.sin(i * 0.37 - t * 1.7)) + (i % 6 === 0 ? S.pulse * 0.25 : 0), len = base * 0.75 * v;
      c.strokeStyle = css((0.3 + 0.65 * v) * a); c.beginPath(); c.moveTo(cx + Math.cos(ang) * in0, cy + Math.sin(ang) * in0); c.lineTo(cx + Math.cos(ang) * (in0 + len), cy + Math.sin(ang) * (in0 + len)); c.stroke();
    }
  } else if (m === "wave") {
    for (let k = 0; k < 4; k++) {
      c.strokeStyle = css((0.75 - k * 0.16) * a); c.lineWidth = 2.4 - k * 0.45; c.beginPath();
      for (let x = 0; x <= W; x += 8) {
        const u = x / W, y = cy + Math.sin(u * Math.PI) * base * 0.9 * (0.25 + e) * Math.sin(u * (6 + k * 2) + t * (1.5 + k * 0.5)) * (1 + 0.5 * S.pulse);
        x ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
    }
  } else if (m === "tunnel") {
    for (let k = 0; k < 14; k++) {
      const ph = (t * 0.35 + k / 14) % 1, r = base * 0.15 + ph ** 2.2 * Math.max(W, H) * 0.7 * C.visSize;
      c.strokeStyle = css(Math.sin(Math.PI * ph) * a * (0.3 + 0.5 * e)); c.lineWidth = 1 + 3 * ph; c.beginPath();
      for (let i = 0; i <= 6; i++) {
        const an = (i * Math.PI) / 3 + t * 0.1;
        i ? c.lineTo(cx + Math.cos(an) * r, cy + Math.sin(an) * r) : c.moveTo(cx + Math.cos(an) * r, cy + Math.sin(an) * r);
      }
      c.stroke();
    }
  } else if (m === "orbs") {
    for (let k = 0; k < 28; k++) {
      const ang = t * (0.2 + (k % 7) * 0.05) + k * 2.4, rr = base * (0.5 + (k % 7) * 0.22) * (1 + 0.1 * e);
      c.fillStyle = css(a * (0.4 + 0.5 * e)); c.beginPath();
      c.arc(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr * 0.6, 2 + (k % 4) + (k % 3 === 0 ? 6 * e : 0), 0, 7);
      c.fill();
    }
  } else if (m === "ring") {
    const n = 56, pts = [];
    for (let k = 0; k < n; k++) {
      const ang = (k / n) * 6.2832 + t * 0.12, wob = 0.5 + 0.5 * Math.sin(k * 3 + t * 2.1) * Math.sin(k * 0.7 - t * 1.3), r = base * (1 + 0.3 * e * wob + 0.1 * S.pulse * (k % 2 ? 1 : 0.5));
      pts.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]);
    }
    c.lineWidth = 1.2; c.strokeStyle = css(0.5 * a); c.beginPath(); pts.forEach((p, k) => (k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.stroke();
    c.strokeStyle = css(0.13 * a); c.beginPath(); pts.forEach((p, k) => { const q = pts[(k + 9) % n]; c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); }); c.stroke();
  }
  c.restore();
}

const FAM = [["auto", "Auto"], ["Inter", "Modern"], ["Playfair Display", "Luxury"], ["Cinzel", "Fantasy"], ["Dancing Script", "Script"], ["Orbitron", "Tech"], ["Bebas Neue", "Bold"], ["Pacifico", "Retro"], ["Righteous", "Pop"], ["Cormorant Garamond", "Elegant"]];
const BNF = [["sans", "Sans"], ["hind", "Hind"], ["round", "Round"], ["modern", "Modern"], ["serif", "Serif"]];
const ARF = [["naskh", "Naskh"], ["nastaliq", "Nastaliq"], ["amiri", "Amiri"]];

const BGC = [
  ["gemini", "✦ Gemini AI", "linear-gradient(135deg,#7928ca,#ff0080 50%,#00dfd8)"],
  ["black", "Black", "#000"],
  ["cover", "Album art", "linear-gradient(135deg,#b33,#33b)"],
  ["animated", "Animated", "conic-gradient(from 90deg,#f4a,#4af,#fa4,#f4a)"],
  ["gradient", "Gradient", "linear-gradient(120deg,#f6a,#64f)"],
  ["aurora", "Aurora", "linear-gradient(180deg,#0b1,#06f)"],
  ["synthwave", "Synthwave", "linear-gradient(180deg,#f0a,#408)"],
  ["waves", "Waves", "linear-gradient(180deg,#058,#0cf)"],
  ["lava", "Lava", "radial-gradient(circle at 30% 40%,#f90,#a02)"]
];
const GXC = [
  ["classic", "Classic", "radial-gradient(#68f,#000)"],
  ["spiral", "Spiral", "conic-gradient(#f9a,#46f,#f9a)"],
  ["g2", "Black hole", "radial-gradient(circle,#000 22%,#fb6 26%,#000 62%)"],
  ["g4", "Galaxy 4", "linear-gradient(135deg,#13a,#fc3)"],
  ["g5", "Galaxy 5", "radial-gradient(#fc9,#235)"]
];

// ASCII backgrounds (Cleaned: removed asc_knight, asc_cosmos, and asc_auto)
const ASCS = new Set(["asc_cover", "asc_garden", "asc_rain"]);
const ASCC = [
  ["asc_cover", "ASCII cover", "linear-gradient(135deg,#d33,#222 60%,#fc6)"],
  ["asc_garden", "ASCII garden", "linear-gradient(180deg,#112,#2a4 70%,#f6a)"],
  ["asc_rain", "ASCII rain", "linear-gradient(180deg,#010,#0f6)"]
];
const ASC_SETS = { classic: " .:-=+*#%@", fine: " .'`,:;i!lI1tfjrxnuvcXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$", blocks: " ░▒▓█", binary: " 01", code: " .,:;+=*#%&@$", kana: " ｰｲｳｴｵｶｷｸｹｺｻｼｽﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎ" };
const ASC_SPECIAL = "|/\\-_()'\",.~^vV*+oO0x@#%&{}[]<>", ASC_POOL = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789:.=*+-<>";
const ASC_HASH = (a, b, c) => { let n = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967295; };

function ascInit(S, W, H, dpr, C, fsz) {
  const A = S.asc || (S.asc = {}), fs = fsz || C.ascSize, key = [W, H, dpr, fs, C.ascSet].join(); A.mode = C.ascColor;
  if (A.key !== key) {
    A.key = key; A.fs = fs; A.dpr = dpr; A.cw = fs * 0.6; A.chh = fs * 1.05; A.cols = Math.ceil(W / A.cw); A.rows = Math.ceil(H / A.chh);
    const n = A.cols * A.rows; A.chr = new Uint16Array(n); A.R = new Uint8Array(n); A.G = new Uint8Array(n); A.B = new Uint8Array(n);
    A.ramp = [...(ASC_SETS[C.ascSet] || ASC_SETS.classic)]; A.glyphs = [...A.ramp, ...ASC_SPECIAL, ...ASC_POOL]; A.gx = new Map(); A.glyphs.forEach((g, i) => { if (!A.gx.has(g)) A.gx.set(g, i); });
    A.tw = Math.ceil(A.cw * dpr); A.th = Math.ceil(A.chh * dpr); A.per = Math.floor(2048 / A.tw); A.cap = A.per * Math.floor(2048 / A.th);
    A.atlas = document.createElement("canvas"); A.atlas.width = A.atlas.height = 2048; A.actx = A.atlas.getContext("2d"); A.map = new Map(); A.nx = 0;
    A.off = document.createElement("canvas"); A.off.width = Math.ceil(W * dpr); A.off.height = Math.ceil(H * dpr); A.octx = A.off.getContext("2d");
    A.bl = document.createElement("canvas"); A.bl.width = Math.ceil(W / 8); A.bl.height = Math.ceil(H / 8); A.covK = null; A.fl = null; A.rain = null;
  }
  return A;
}
function ascTile(A, k, w, r, g, b) {
  const key = (((k << 1) | w) << 12) | ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4); let i = A.map.get(key);
  if (i === undefined) {
    if (A.nx >= A.cap) { A.map.clear(); A.nx = 0; A.actx.clearRect(0, 0, 2048, 2048); }
    i = A.nx++; A.map.set(key, i); const x = (i % A.per) * A.tw, y = Math.floor(i / A.per) * A.th, a = A.actx;
    a.font = `${w ? 800 : 600} ${A.fs * A.dpr}px ui-monospace, Consolas, monospace`; a.textAlign = "center"; a.textBaseline = "middle";
    a.fillStyle = `rgb(${(r >> 4) * 17},${(g >> 4) * 17},${(b >> 4) * 17})`; a.fillText(A.glyphs[k], x + A.tw / 2, y + A.th / 2);
  }
  return i;
}
function ascFlush(c, A, W, H, glow) {
  const g = A.octx, n = A.cols * A.rows, d = A.dpr; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, A.off.width, A.off.height);
  for (let i = 0; i < n; i++) {
    const k = A.chr[i]; if (!k) continue; const ch = A.glyphs[k]; if (ch === " ") continue;
    const t = ascTile(A, k, A.R[i] + A.G[i] + A.B[i] > 600 ? 1 : 0, A.R[i], A.G[i], A.B[i]), col = i % A.cols, row = (i / A.cols) | 0;
    g.drawImage(A.atlas, (t % A.per) * A.tw, Math.floor(t / A.per) * A.th, A.tw, A.th, Math.floor(col * A.cw * d), Math.floor(row * A.chh * d), A.tw, A.th);
  }
  c.drawImage(A.off, 0, 0, W, H);
  if (glow > 0.01) { const b = A.bl.getContext("2d"); b.clearRect(0, 0, A.bl.width, A.bl.height); b.drawImage(A.off, 0, 0, A.bl.width, A.bl.height); c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = glow; c.drawImage(A.bl, 0, 0, W, H); c.restore(); }
}
function ascCov(A, S) {
  const k = S.uri + A.key + (S.cvImg ? 1 : 0); if (A.covK === k) return; A.covK = k; A.cov = null; const im = S.cvImg; if (!im) return;
  try { const cv = document.createElement("canvas"); cv.width = A.cols; cv.height = A.rows; const x = cv.getContext("2d"), s = Math.max((A.cols * A.cw) / im.width, (A.rows * A.chh) / im.height), sw = (A.cols * A.cw) / s, sh = (A.rows * A.chh) / s;
    x.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, 0, 0, A.cols, A.rows); A.cov = x.getImageData(0, 0, A.cols, A.rows).data; } catch { A.cov = null; }
}
function ascLut(A, S) {
  const k = S.galVer || 0; if (A.plK === k) return; A.plK = k; const p = cl2(S), cs = [[0, 0, 0], mixc(p[3], [0, 0, 0], 0.4), p[1], p[0], mixc(p[0], [255, 255, 255], 0.6), [255, 255, 255]]; A.pl = new Uint8Array(192);
  for (let i = 0; i < 64; i++) { const f = (i / 63) * 5, j = Math.min(4, f | 0), c = mixc(cs[j], cs[j + 1], f - j); A.pl[i * 3] = c[0]; A.pl[i * 3 + 1] = c[1]; A.pl[i * 3 + 2] = c[2]; }
}
function ascCol(A, S, i, lum, r, g, b) {
  const m = A.mode;
  if (m === "cover") { const q = 0.5 + 0.75 * lum; A.R[i] = Math.min(255, r * q); A.G[i] = Math.min(255, g * q); A.B[i] = Math.min(255, b * q); }
  else if (m === "mono") A.R[i] = A.G[i] = A.B[i] = 70 + 185 * lum;
  else if (m === "accent") { const a = S.th ? S.th.accent : S.rgb, q = 0.3 + 0.7 * lum; A.R[i] = a[0] * q; A.G[i] = a[1] * q; A.B[i] = a[2] * q; }
  else { const k = Math.min(63, (lum * 63) | 0) * 3; A.R[i] = A.pl[k]; A.G[i] = A.pl[k + 1]; A.B[i] = A.pl[k + 2]; }
}
const ascRamp = (A, lum) => { const n = A.ramp.length - 1; return 1 + Math.min(n - 1, (clamp(lum) * n) | 0); };
function ascSet(A, S, i, lum, r, g, b) { if (lum < 0.045) { A.chr[i] = 0; return; } A.chr[i] = ascRamp(A, lum); ascCol(A, S, i, lum, r, g, b); }
function ascPut(A, i, ch, r, g, b) { A.chr[i] = A.gx.get(ch) || 0; A.R[i] = r; A.G[i] = g; A.B[i] = b; }
const ascRev = (A, now, col, row) => clamp((now - A.t0) / 3000) * 1.35 - Math.hypot(col / A.cols - 0.5, row / A.rows - 0.5) * 0.9 - ASC_HASH(col, row, 7) * 0.35;

function ascScCover(A, S, W, H, now, dt, prox, C) {
  const { cols, rows } = A, t = now / 1000, amp = C.ascAmp, en = S.en * C.ascReact, d = A.cov, sc = 1 + 0.035 * Math.sin(t * 0.3);
  const cx = cols / 2, cy = rows / 2;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col, rv = ascRev(A, now, col, row); if (rv < 0) { A.chr[i] = 0; continue; }
      let dx = Math.sin(row * 0.22 + t * 1.6) * 2.2 * amp * (0.5 + en), dy = Math.sin(col * 0.14 + t * 1.2) * 1.2 * amp * (0.5 + en);
      let ix = Math.round((col - cx) / sc + cx + dx), iy = Math.round((row - cy) / sc + cy + dy);
      ix = ix < 0 ? 0 : ix >= cols ? cols - 1 : ix; iy = iy < 0 ? 0 : iy >= rows ? rows - 1 : iy;
      let r = 80, g = 120, b = 255, lum = 0.5;
      if (d) { const q = (iy * cols + ix) * 4; r = d[q]; g = d[q + 1]; b = d[q + 2]; lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
      ascSet(A, S, i, clamp((clamp((lum - 0.06) * 1.3) ** 0.9) * clamp(rv * 4)), r, g, b);
    }
  }
}
function ascScRain(A, S, W, H, now, dt, prox, C) {
  const { cols, rows } = A, t = now / 1000, k = 1 + 1.6 * S.en * C.ascReact, pool = [...ASC_POOL].map((x) => A.gx.get(x) || 1);
  if (!A.rain || A.rain.length !== cols) A.rain = Array.from({ length: cols }, () => ({ y: Math.random() * rows * 2 - rows, v: 5 + Math.random() * 14, len: 8 + Math.random() * 22 }));
  A.chr.fill(0);
  A.rain.forEach((c, col) => {
    c.y += c.v * k * C.ascAmp * dt; if (c.y - c.len > rows) { c.y = -Math.random() * rows * 0.5; c.v = 5 + Math.random() * 14; }
    for (let j = 0; j < c.len; j++) {
      const row = Math.floor(c.y) - j; if (row < 0 || row >= rows) continue;
      const i = row * cols + col, lum = (1 - j / c.len) ** 1.6;
      A.chr[i] = pool[Math.floor(ASC_HASH(col, row, Math.floor(t * 6 + col * 0.1)) * pool.length) % pool.length];
      ascCol(A, S, i, lum, 80, 255, 140);
      if (j === 0) { A.R[i] = A.G[i] = A.B[i] = 255; }
    }
  });
}
function ascScGarden(A, S, W, H, now, dt, prox, C) {
  const { cols, rows, cw, chh } = A, t = now / 1000, n = Math.max(2, C.ascFlowers | 0);
  if (!A.fl || A.fl.length !== n) { const r = mulberry(S.seed || 3); A.fl = Array.from({ length: n }, (_, i) => ({ x: ((i + 0.5) / n) * 0.9 + 0.05, hf: 0.3 + 0.32 * r(), off: r() * 20, T: 16 + 10 * r() })); }
  A.chr.fill(0); const base = Math.floor(rows * 0.9);
  for (let col = 0; col < cols; col++) {
    const gh = 1 + Math.floor(2.4 * noise2(col * 0.35, 3, 64));
    for (let j = 0; j < gh; j++) ascPut(A, (base - j) * cols + col, j === 0 ? '"' : "|", 40 + 20 * j, 180, 70);
  }
}
const ASC_SCENES = { asc_cover: ascScCover, asc_garden: ascScGarden, asc_rain: ascScRain };
function drawAscii(c, W, H, S, now, dt, prox) {
  const C = S.cfg, dpr = Math.min(window.devicePixelRatio || 1, 2), A = ascInit(S, W, H, dpr, C, C.ascSize);
  if (A.t0 === undefined || A.uri !== S.uri) { A.uri = S.uri; A.t0 = now; A.covK = null; }
  ascLut(A, S); ascCov(A, S); c.fillStyle = "#020204"; c.fillRect(0, 0, W, H);
  if (ASC_SCENES[C.bg]) ASC_SCENES[C.bg](A, S, W, H, now, dt, prox, C); else ascScCover(A, S, W, H, now, dt, prox, C);
  ascFlush(c, A, W, H, C.ascGlow);
}

// ===== Gemini API & Genre Classifier Integration =====
const rgbToHex = (r) => "#" + [r[0], r[1], r[2]].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("");

function ensureVibeResult(obj) {
  if (!obj) return obj;
  if (!obj.paletteRgb) {
    if (Array.isArray(obj.palette) && typeof obj.palette[0] === "string") {
      obj.paletteRgb = obj.palette.map(hexToRgb).filter(Boolean);
    } else if (Array.isArray(obj.palette)) {
      obj.paletteRgb = obj.palette;
    }
  }
  if (!obj.accentRgb) {
    obj.accentRgb = typeof obj.accent === "string" ? hexToRgb(obj.accent) : (obj.accent || obj.paletteRgb?.[0]);
  }
  if (Array.isArray(obj.paletteRgb) && (!obj.palette || typeof obj.palette[0] !== "string")) {
    obj.palette = obj.paletteRgb.map(rgbToHex);
  }
  if (Array.isArray(obj.accentRgb) && (!obj.accent || typeof obj.accent !== "string")) {
    obj.accent = rgbToHex(obj.accentRgb);
  }
  return obj;
}

function localGenreClassifier(artist, title, tempo, energy) {
  const txt = (artist + " " + title).toLowerCase();
  if (/synth|cyber|electro|techno|retrowave|neon|daft|kraft|future|glitch|bass|edm|trance|house/i.test(txt) || (tempo > 125 && energy > 0.6)) {
    return ensureVibeResult({
      genre: "Synthwave / Cyberpunk", mood: "Electric & High Energy", style: "synthwave",
      palette: [[255, 0, 128], [120, 0, 255], [0, 220, 255], [10, 5, 28]],
      accent: [0, 240, 255], speed: 1.3, vibe: "Neon horizons, driving synthesizer rhythms, and cybernetic resonance."
    });
  }
  if (/usher|chris brown|trey songz|mario|ne-yo|bruno mars|alicia keys|beyonce|rihanna|sza|frank ocean|weeknd|daniel caesar|bryson tiller|brent faiyaz|summer walker|kehlani|partynextdoor|joji|keshi|giveon|d4vd|r&b|soul|neo-soul/i.test(txt)) {
    return ensureVibeResult({
      genre: "Contemporary R&B / Velvet Soul", mood: "Sensual & Midnight Glow", style: "gemini",
      palette: [[235, 65, 115], [130, 45, 195], [255, 175, 130], [20, 8, 26]],
      accent: [255, 110, 150], speed: 0.9, vibe: "Midnight velvet sheen, warm floating bokeh, and lush nocturnal harmony."
    });
  }
  if (/drake|travis scott|playboi carti|kanye|\bye\b|21 savage|kendrick|cole|eminem|juice wrld|future|metro boomin|lil baby|gunna|lil uzi|post malone|rap|hip hop|hip-hop|trap/i.test(txt)) {
    return ensureVibeResult({
      genre: "Nocturnal Trap / Hip-Hop", mood: "Heavy 808s & Hypnotic", style: "gemini",
      palette: [[160, 45, 240], [255, 45, 95], [45, 215, 255], [12, 6, 22]],
      accent: [205, 75, 255], speed: 1.1, vibe: "Sub-bass shockwaves, neon chromatic glimmers, and cinematic shadows."
    });
  }
  if (/dua lipa|taylor swift|ariana|sabrina carpenter|olivia rodrigo|billie eilish|lady gaga|katy perry|charli xcx|chappell roan|tate mcrae|disco|dance|pop/i.test(txt)) {
    return ensureVibeResult({
      genre: "Vibrant Pop / Electric Groove", mood: "Euphoric & Glossy", style: "gemini",
      palette: [[255, 60, 165], [125, 80, 255], [0, 235, 225], [18, 10, 32]],
      accent: [255, 125, 205], speed: 1.25, vibe: "Vivid iridescent waves, sparkling dynamic prisms, and dancefloor pulse."
    });
  }
  if (/nirvana|linkin park|radiohead|arctic monkeys|bring me the horizon|deftones|slipknot|green day|fall out boy|my chemical|paramore|rock|metal|punk|grunge|alt-rock/i.test(txt)) {
    return ensureVibeResult({
      genre: "Alternative Rock / Heavy Grunge", mood: "Raw & Energetic", style: "gemini",
      palette: [[235, 45, 45], [145, 145, 190], [255, 145, 45], [14, 10, 18]],
      accent: [255, 65, 65], speed: 1.2, vibe: "Electric kinetic streaks, jagged transient sparks, and raw sonic drive."
    });
  }
  if (/[\u0980-\u09FF]|arijit|atif|nusrat|arnob|artcell|warfaze|shironamhin|anupam|habib|tagore|lalon|coke studio|sid sriram|jubin|shreya|mohammed rafi|kishore|lata|pritam|sonu/i.test(txt)) {
    return ensureVibeResult({
      genre: "Bengali / South Asian Melodic Fusion", mood: "Soulful & Poetic", style: "gemini",
      palette: [[255, 145, 40], [220, 40, 70], [255, 215, 120], [32, 12, 14]],
      accent: [255, 195, 80], speed: 0.9, vibe: "Rich acoustic resonance, timeless poetic melody, and golden embers."
    });
  }
  if (/beach house|cigarettes after sex|cocteau|ambient|dream|sleep|space|stars|slowdive|haze|ethereal/i.test(txt) || (tempo < 85 && energy < 0.45)) {
    return ensureVibeResult({
      genre: "Dream Pop / Ethereal Ambient", mood: "Hypnotic & Melancholic", style: "aurora",
      palette: [[140, 110, 240], [70, 180, 220], [240, 190, 220], [8, 10, 24]],
      accent: [180, 150, 255], speed: 0.7, vibe: "Celestial drifts, slow washed reverbs, and starlit contemplation."
    });
  }
  if (/bon iver|fleet foxes|folk|acoustic|lumineers|hozier|phoebe|vance|guitar|indie|novo amor|gregory alan/i.test(txt)) {
    return ensureVibeResult({
      genre: "Indie Folk / Organic Acoustic", mood: "Earthy & Nostalgic", style: "waves",
      palette: [[60, 160, 120], [190, 140, 80], [240, 225, 190], [14, 22, 16]],
      accent: [110, 210, 150], speed: 0.75, vibe: "Woodland dusk, warm acoustic overtones, and fireside clarity."
    });
  }
  return ensureVibeResult({
    genre: "Modern Alternative", mood: "Dynamic & Expressive", style: "gemini",
    palette: [[150, 90, 240], [245, 100, 160], [80, 200, 240], [12, 12, 22]],
    accent: [220, 160, 255], speed: 1.0, vibe: "Harmonic color gradients pulsing with the vocal and rhythmic envelope."
  });
}

async function fetchGeminiVibe(apiKey, track, tempo, energy) {
  const cacheKey = track.uri || (track.artist + ":" + track.name);
  if (CL_AI_CACHE.has(cacheKey)) return CL_AI_CACHE.get(cacheKey);
  try {
    const stored = localStorage.getItem("cl_ai_vibe:" + cacheKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      CL_AI_CACHE.set(cacheKey, parsed);
      return parsed;
    }
  } catch {}

  if (!apiKey) {
    const fallback = localGenreClassifier(track.artist, track.name, tempo, energy);
    CL_AI_CACHE.set(cacheKey, fallback);
    return fallback;
  }

  const prompt = `Analyze this song:
Title: "${track.name}"
Artist: "${track.artist}"
Album: "${track.album || ''}"
Tempo: ${Math.round(tempo || 120)} BPM

Return ONLY a valid JSON object matching:
{
  "genre": "Precise genre (e.g. Synthwave, Dream Pop, Contemporary R&B, Bangla Fusion, Alt Rock)",
  "mood": "Emotional mood (e.g. Nostalgic, Melancholy, Euphoric, Sensual, Energetic)",
  "style": "one of: aurora, synthwave, waves, lava, gemini",
  "palette": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "accent": "#hexAccent",
  "speed": 1.0,
  "vibe": "1 concise sentence describing the song's aesthetic visual atmosphere"
}`;

  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    if (!resp.ok) throw new Error("Gemini API error: " + resp.status);
    const data = await resp.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawText) {
      const result = JSON.parse(rawText);
      if (result && Array.isArray(result.palette) && result.palette.length >= 4) {
        ensureVibeResult(result);
        CL_AI_CACHE.set(cacheKey, result);
        try { localStorage.setItem("cl_ai_vibe:" + cacheKey, JSON.stringify(result)); } catch {}
        return result;
      }
    }
  } catch (err) {
    console.warn("Gemini Vibe call failed, using local smart classifier:", err);
  }

  const fallback = localGenreClassifier(track.artist, track.name, tempo, energy);
  CL_AI_CACHE.set(cacheKey, fallback);
  return fallback;
}

// ===== Palette & Translation =====
function palFromPixels(px) {
  if (!px || !px.length) return null;
  const K = 6;
  let cen = Array.from({ length: K }, (_, i) => px[Math.floor(((i + 0.5) * px.length) / K)].slice()), cnt = [];
  for (let it = 0; it < 8; it++) {
    const sm = cen.map(() => [0, 0, 0, 0]);
    px.forEach((p) => {
      let bi = 0, bd = 1e9;
      cen.forEach((c, i) => {
        const q = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
        if (q < bd) { bd = q; bi = i; }
      });
      const s = sm[bi]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++;
    });
    cen = cen.map((c, i) => (sm[i][3] ? [sm[i][0] / sm[i][3], sm[i][1] / sm[i][3], sm[i][2] / sm[i][3]] : c));
    cnt = sm.map((s) => s[3]);
  }
  const cand = cen.map((c, i) => {
    const mx = Math.max(...c), mn = Math.min(...c), sat = mx ? (mx - mn) / mx : 0;
    return { c: c.map(Math.round), sc: cnt[i] * (0.15 + sat * sat) * (mx > 25 ? 1 : 0.05) };
  }).sort((a, b) => b.sc - a.sc);

  const out = [];
  cand.forEach((o) => {
    if (out.length < 4 && o.sc > 0 && out.every((q) => (q[0] - o.c[0]) ** 2 + (q[1] - o.c[1]) ** 2 + (q[2] - o.c[2]) ** 2 > 1200)) {
      out.push(o.c);
    }
  });
  if (!out.length && cand.length) out.push(cand[0].c);
  for (const o of cand) {
    if (out.length >= 4) break;
    if (!out.some((q) => q[0] === o.c[0] && q[1] === o.c[1] && q[2] === o.c[2])) {
      out.push(o.c);
    }
  }
  while (out.length < 4 && out.length > 0) {
    const base = out[0];
    const shift = out.length * 0.22;
    out.push([
      Math.min(255, Math.max(10, Math.round(base[0] * (1 + shift)))),
      Math.min(255, Math.max(10, Math.round(base[1] * (1 - shift * 0.5)))),
      Math.min(255, Math.max(10, Math.round(base[2] * (1 + shift * 0.8))))
    ]);
  }
  return out.length >= 4 ? out : null;
}
function paletteFromImage(url) {
  return new Promise((res) => {
    const im = new Image(); im.crossOrigin = "anonymous";
    im.onload = () => { try { const cv = document.createElement("canvas"); cv.width = cv.height = 40; const x = cv.getContext("2d"); x.drawImage(im, 0, 0, 40, 40);
      const d = x.getImageData(0, 0, 40, 40).data, px = []; for (let i = 0; i < d.length; i += 4) px.push([d[i], d[i + 1], d[i + 2]]); res(palFromPixels(px)); } catch { res(null); } };
    im.onerror = () => res(null); im.src = url;
  });
}

const RTL_RX = /[\u0590-\u08FF]/, NONLAT_RX = /[\u0590-\u08FF\u0900-\u0DFF\u0E00-\u0EFF\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/;
async function gtr(text) { const r = await fetch("https://translate.googleapis.com/translate_a/single?" + new URLSearchParams({ client: "gtx", sl: "auto", tl: "en", dt: "t", q: text })); return (await r.json())[0].map((x) => x[0]).join(""); }
async function translateLines(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i += 25) {
    const chunk = lines.slice(i, i + 25).map((l) => l.text);
    try { const tx = (await gtr(chunk.join("\n"))).split("\n"); if (tx.length === chunk.length) { out.push(...tx); continue; } } catch {}
    for (const t of chunk) { try { out.push(await gtr(t)); } catch { out.push(""); } }
  }
  return out;
}
function pickNL(words, tr, rnd) {
  let icon = null; for (const w of (tr || "").split(/\s+/)) { const m = ICON_RX.find(([, rx]) => rx.test(cleanW(w))); if (m) { icon = m[0]; break; } }
  let best = 0; words.forEach((w, k) => { if (w.length > words[best].length || (w.length === words[best].length && rnd() < 0.5)) best = k; });
  return { kw: best, icon: icon || ICON_GENERIC[Math.floor(rnd() * ICON_GENERIC.length)] };
}

// ===== Lyric Sources =====
function parseLRC(s) {
  return s.split("\n").map((l) => { const m = l.match(/^\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)/);
    return m && m[3].trim() && !/^(作词|作曲|编曲|制作|Lyrics|Composer)/.test(m[3].trim()) ? { t: +m[1] * 60 + +m[2], text: m[3].trim() } : null; }).filter(Boolean);
}
function parseYRC(s) {
  return s.split("\n").map((ln) => {
    const m = ln.match(/^\[(\d+),(\d+)\](.*)$/); if (!m) return null;
    const words = [], wt = [], we = [], re = /\((\d+),(\d+),\d+\)([^(]*)/g; let q, endsSp = true;
    while ((q = re.exec(m[3]))) {
      const st = +q[1] / 1000, en = (+q[1] + +q[2]) / 1000, tx = q[3]; if (!tx.trim()) { endsSp = true; continue; }
      if (words.length && !/^\s/.test(tx) && !endsSp) { words[words.length - 1] += tx.trim(); we[we.length - 1] = en; }
      else { words.push(tx.trim()); wt.push(st); we.push(en); }
      endsSp = /\s$/.test(tx);
    }
    const text = words.join(" ");
    return words.length && !/^(作词|作曲|编曲|制作|Lyrics|Composer)/.test(text) ? { t: wt[0], text, words, wt, we } : null;
  }).filter(Boolean);
}

const CL_SRC = {
  async spotify(t) {
    const r = await Spicetify.CosmosAsync.get(`https://spclient.wg.spotify.com/color-lyrics/v2/track/${t.uri.split(":")[2]}?format=json&vocalRemoval=false&market=from_token`);
    const L = r?.lyrics; if (!L || L.syncType === "UNSYNCED") return null;
    return L.lines.map((l) => ({ t: +l.startTimeMs / 1000, text: (l.words || "").trim() })).filter((l) => l.text && l.text !== "♪");
  },
  async lrclib(t) {
    try {
      const r = await fetch("https://lrclib.net/api/get?" + new URLSearchParams({ track_name: t.name, artist_name: t.artist, album_name: t.album, duration: Math.round(t.dur) }));
      if (r.ok) { const j = await r.json(); if (j.syncedLyrics) return parseLRC(j.syncedLyrics); }
    } catch {}
    return null;
  },
  async netease(t) {
    try {
      const s = await (await fetch("https://music.163.com/api/search/get?" + new URLSearchParams({ s: t.name + " " + t.artist, type: 1, limit: 8 }))).json();
      const a0 = t.artist.toLowerCase();
      const song = (s?.result?.songs || []).map((x) => ({ x, d: Math.abs(x.duration / 1000 - t.dur), am: (x.artists || []).some((q) => { const n = q.name.toLowerCase(); return a0.includes(n) || n.includes(a0); }) }))
        .filter((o) => o.d < 3 && o.am).sort((a, b) => a.d - b.d)[0]?.x;
      if (!song) return null;
      const j = await (await fetch(`https://music.163.com/api/song/lyric?id=${song.id}&lv=1&kv=1&tv=-1&yv=1`)).json();
      const y = j?.yrc?.lyric ? parseYRC(j.yrc.lyric) : null;
      return y && y.length > 3 ? y : j?.lrc?.lyric ? parseLRC(j.lrc.lyric) : null;
    } catch { return null; }
  }
};

async function fetchLyrics(t, pref) {
  const key = t.uri + (pref === "auto" ? "" : pref);
  let c = CL_CACHE.get(key);
  if (!c) {
    const order = pref === "auto" ? ["spotify", "lrclib", "netease"] : [pref];
    for (const n of order) {
      if (!CL_SRC[n]) continue;
      try {
        const l = await CL_SRC[n](t);
        if (l && l.length > 3) { c = { n, l, ws: l.some((x) => x.wt) }; break; }
      } catch {}
    }
    if (c) CL_CACHE.set(key, c);
  }
  return c || null;
}

function syl(w) {
  if (/[\u0980-\u09FF]/.test(w)) { const m = w.match(/[\u0985-\u09B9\u09DC-\u09DF\u09CE]/g) || [], hs = (w.match(/\u09CD/g) || []).length; return Math.max(1, m.length - hs); }
  if (RTL_RX.test(w)) return Math.max(1, Math.round(w.replace(/[^\u0620-\u064A\u0671-\u06D3]/g, "").length / 2.4));
  const s = w.toLowerCase().replace(/[^a-z]/g, ""); if (!s) return Math.max(1, Math.ceil(w.length / 3));
  const m = s.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "").match(/[aeiouy]{1,2}/g); return Math.max(1, m ? m.length : 1);
}
const nsyl = (t) => t.split(/\s+/).reduce((a, x) => a + syl(x), 0);

function prep(raw, seed) {
  const freq = {}; raw.forEach((l) => l.text.split(/\s+/).forEach((w) => { const k = cleanW(w); if (k && !STOP.has(k)) freq[k] = (freq[k] || 0) + 1; }));
  const r = []; raw.forEach((l, i) => { const g = (raw[i + 1] ? raw[i + 1].t : l.t + 6) - l.t; if (g < 7) r.push(g / nsyl(l.text)); });
  r.sort((a, b) => a - b); const pace = Math.max(0.12, Math.min(0.42, r.length ? r[Math.floor(r.length * 0.4)] : 0.3));
  return raw.map((l, i) => {
    const gap = (raw[i + 1] ? raw[i + 1].t : l.t + 6) - l.t, words = l.words || l.text.split(/\s+/);
    const dur = l.we ? l.we[l.we.length - 1] - l.t + 0.15 : Math.max(0.4, Math.min(gap - 0.1, nsyl(l.text) * pace + 0.2));
    const w = words.map((x) => syl(x) + (/[,.;:!?]$/.test(x) ? 0.5 : 0)), tot = w.reduce((a, b) => a + b, 0);
    let acc = 0; const ws = l.wt ? l.wt.slice() : words.map((_, k) => { const s = l.t + (dur * acc) / tot; acc += w[k]; return s; });
    const rnd = mulberry(i * 9301 + words.length * 17 + 7), pts = [];
    words.forEach((_, k) => {
      let p;
      for (let a = 0; a < 25; a++) {
        p = [0.08 + 0.84 * (0.6 * (k / Math.max(1, words.length - 1)) + 0.4 * rnd()), 0.2 + 0.6 * rnd()];
        if (pts.every((q) => Math.hypot((p[0] - q[0]) * 1.6, p[1] - q[1]) > 0.14)) break;
      }
      pts.push(p);
    });
    const sh = words.map(() => rnd()), nl = /[^\x00-\x7F]/.test(l.text) && !/[a-z]{3}/i.test(l.text), kx = nl ? pickNL(words, l.tr, rnd) : pickKey(words, freq, rnd);
    return {
      t: l.t, dur, words, ws, pts: RTL_RX.test(l.text) ? pts.map((q) => [1 - q[0], q[1]]) : pts, sh,
      ch: false, wt: !!l.wt, we: l.we || null, tr: l.tr, ...kx,
      sty: STY[Math.floor(mulberry(seed + i * 77)() * STY.length)], side: rnd() < 0.5 ? -1 : 1, seed: (seed + i * 13) % 1000
    };
  });
}

// Flow Lyric Engine (with Instrumental Section Handling)
function flowUpdate(S, C, L, i, pos, now, dt, W, H, rgb, sc, wr) {
  const fe = S.fe; if (!fe || !sc || !wr || fe.length !== S.lines.length) return;
  const A = FLOW_ANIM[C.flowAnim] || FLOW_ANIM.glow;
  const key = [W | 0, C.flowSize, C.flowAnim, C.flowLift, C.flowTint ? rgb : "", C.flowAlign].join();
  if (S.flK !== key) {
    S.flK = key; const st = wr.style;
    st.setProperty("--fz", Math.max(22, Math.min(68, W * 0.045)) * C.flowSize + "px");
    st.setProperty("--lift", A[0] * C.flowLift); st.setProperty("--pop", A[1] * C.flowLift); st.setProperty("--rs", 8 * C.flowLift);
    st.setProperty("--hi", C.flowTint ? `rgb(${rgb})` : "#fff"); S.flDirty = true;
  }
  const dk = [C.flowDim, C.flowBlur].join();
  if (i !== S.fa || S.flDirty || S.flDk !== dk) {
    const all = S.flDirty || S.fa === undefined || S.flDk !== dk, a = Math.min(i, S.fa ?? i) - 10, b = Math.max(i, S.fa ?? i) + 10;
    S.flDk = dk;
    if (S.fa !== undefined && fe[S.fa]) fe[S.fa].ws.forEach((w) => w.el.classList.remove("cw"));
    for (let j = 0; j < fe.length; j++) {
      if (!all && (j < a || j > b)) continue;
      const ad = Math.abs(j - i), el = fe[j].el, st = el.style;
      st.setProperty("--o", ad === 0 ? 1 : Math.max(0.05, C.flowDim * Math.pow(0.78, ad - 1)).toFixed(3));
      st.setProperty("--b", ad === 0 ? 0 : Math.min(7, (0.5 + ad * 0.7) * C.flowBlur).toFixed(2));
      st.setProperty("--s", ad === 0 ? 1 : 0.94);
      el.classList.toggle("act", j === i); el.classList.toggle("hid", ad > 8);
    }
    if (fe[i]) { fe[i].ws.forEach((w) => { w.v = -1; w.ps = null; }); }
    const t = fe[Math.max(0, i)]; if (t) S.flT = t.el.offsetTop + t.el.offsetHeight / 2;
    S.fa = i; S.flDirty = false;
  }

  // Smooth critically-damped spring scroll
  const ty = H * C.flowPos - (S.flT || 0);
  if (S.flY === undefined) { S.flY = ty; S.flV = 0; }
  else {
    const k = 7 * C.flowSpeed, d = Math.min(0.05, dt);
    S.flV += ((ty - S.flY) * k * k - 2 * k * S.flV) * d; S.flY += S.flV * d;
  }
  if (Math.abs(S.flY - (S.flW ?? 1e9)) > 0.02) { S.flW = S.flY; sc.style.transform = `translate3d(0,${S.flY.toFixed(2)}px,0)`; }
  if (i < 0 || !L || !fe[i]) return;

  const E = fe[i];
  for (let k = 0; k < E.ws.length; k++) {
    const Wd = E.ws[k], [w0, w1] = wWin(L, L.ws, k), dur = w1 - w0, n = Wd.ls.length;
    const st = pos > w1 + 1.2 ? 2 : pos < w0 - 0.7 ? 0 : 1;
    if (st !== 1 && Wd.v === st) continue;
    Wd.v = st; if (!Wd.ps) { Wd.ps = new Array(n).fill(""); Wd.gs = new Array(n).fill(""); }
    const r = clamp((pos - w0) / dur), tau = Math.max(0.2, Math.min(0.42, dur * 0.6));
    for (let j = 0; j < n; j++) {
      const q = st === 2 ? 1 : st === 0 ? 0 : clamp(r * n - j), g = st === 1 ? Math.exp(-(((pos - (w0 + ((j + 0.5) / n) * dur)) / tau) ** 2)) : 0;
      const ps = q.toFixed(3), gs = g < 0.004 ? "0" : g.toFixed(3), el = Wd.ls[j];
      if (Wd.ps[j] !== ps) { Wd.ps[j] = ps; el.style.setProperty("--p", ps); }
      if (Wd.gs[j] !== gs) { Wd.gs[j] = gs; el.style.setProperty("--g", gs); }
    }
    const e = st === 1 ? clamp((pos - (w0 - 0.1)) / 0.25) * (1 - clamp((pos - w1) / 0.45)) : 0;
    if (e > 0.01) { Wd.el.classList.add("cw"); Wd.el.style.setProperty("--gr", (e * A[2] * C.flowGlow).toFixed(2)); } else Wd.el.classList.remove("cw");
  }
}

// SVG Icons
const IC = {
  play: "M8 5v14l11-7z", pause: "M6 5h4v14H6zM14 5h4v14h-4z", prev: "M6 6h2v12H6zM9.5 12l8.5 6V6z", next: "M16 6h2v12h-2zM6 18l8.5-6L6 6z",
  shuf: "M3 7h3c4 0 6 10 11 10h4M18 14l3 3-3 3M3 17h3c1.5 0 2.7-.8 3.7-2M14 9c.9-1 1.9-2 3.5-2H21M18 4l3 3-3 3",
  rep: "M17 2l4 4-4 4M3 11V9a3 3 0 013-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 01-3 3H3",
  heart: "M12 21s-7-4.6-9.5-9C.9 8.5 3 5 6.3 5c2 0 3.7 1.1 5.7 3.3C14 6.1 15.7 5 17.7 5 21 5 23.1 8.5 21.5 12 19 16.4 12 21 12 21z",
  gear: "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  close: "M18 6L6 18M6 6l12 12",
  fullscreen: "M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"
};

// ==========================================================================
// Main React Application
// ==========================================================================
function ConstellationApp() {
  const R = Spicetify.React, h = R.createElement, { useState, useEffect, useRef } = R;
  const [cfg, setCfg] = useState(loadCfg);
  const [info, setInfo] = useState({ title: "", artist: "", status: "Waiting for a song…", src: "", aiBadge: "", aiVibe: "" });
  const [ui, setUi] = useState(true);
  const [open, setOpen] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerTab, setDrawerTab] = useState("queue");
  const [queueList, setQueueList] = useState([]);
  const [savedList, setSavedList] = useState([]);
  const [savedSearch, setSavedSearch] = useState("");
  const [off, setOff] = useState(0);
  const [tab, setTab] = useState("Style");
  const [lv, setLv] = useState(0);
  const [thOn, setThOn] = useState(false);
  const [stage, setStage] = useState("pop");
  const [sk, setSk] = useState(0);
  const [pl, setPl] = useState({ playing: false, shuf: false, rep: 0, heart: false });
  const [curPos, setCurPos] = useState(0);

  const flw = useRef(), fls = useRef(), root = useRef(), cvs = useRef(), bgl = useRef(), idle = useRef(), fill = useRef(), tcur = useRef(), tdur = useRef();
  const S = useRef({
    lines: [], raw: null, beats: null, seg: null, on: null, bi: 0, si: 0, pulse: 0, en: 0.5, vis: 1, edge: 0,
    mx: -999, my: -999, px: -999, py: -999, pa: 0, mt: 0, rgb: CL_COLORS.gold, offset: 0, cur: "", title: "",
    dust: Array.from({ length: 90 }, () => [Math.random(), Math.random(), Math.random() * 6, Math.random()]),
    aiVibe: null
  }).current;
  S.cfg = cfg;

  const upd = (p) => {
    const n = { ...cfg, ...p }; setCfg(n);
    try { localStorage.setItem(CL_KEY, JSON.stringify(n)); } catch {}
  };
  const wake = () => {
    setUi(true); clearTimeout(idle.current);
    idle.current = setTimeout(() => { if (!open && !showDrawer) setUi(false); }, 3500);
  };
  const move = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    S.mx = e.clientX - r.left; S.my = e.clientY - r.top; S.mt = 1; wake();
  };
  const fs = () => (document.fullscreenElement ? document.exitFullscreen() : root.current.requestFullscreen?.());
  const nudge = (d) => {
    S.offset = Math.round((S.offset + d) * 100) / 100; setOff(S.offset);
    try { localStorage.setItem(CL_KEY + ":off:" + S.uri, S.offset); } catch {}
  };
  const seek = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    Spicetify.Player.seek(((e.clientX - r.left) / r.width) * Spicetify.Player.getDuration());
  };

  // Close menus when touching background
  const closeAllMenus = () => {
    if (open) setOpen(false);
    if (showDrawer) setShowDrawer(false);
  };

  // Queue Fetching
  const loadQueue = async () => {
    try {
      let q = null;
      if (Spicetify.Platform?.PlayerAPI?.getQueue) q = await Spicetify.Platform.PlayerAPI.getQueue();
      else if (Spicetify.Queue) q = Spicetify.Queue;
      if (q) {
        const next = (q.queued || q.queuedTracks || []).concat(q.nextTracks || q.normal || []);
        const formatted = next.map((it) => {
          const track = it?.track || it;
          return {
            uri: track?.uri || it?.uri,
            name: track?.name || it?.name || "Unknown Track",
            artist: track?.artists?.[0]?.name || track?.artist || it?.artists?.[0]?.name || "Unknown Artist",
            image: (track?.album?.images?.[0]?.url || track?.metadata?.image_url || it?.image || "").replace("spotify:image:", "https://i.scdn.co/image/"),
            duration: (track?.duration_ms || track?.duration || 0) / 1000
          };
        }).filter((t) => t.uri);
        setQueueList(formatted.slice(0, 40));
      }
    } catch (e) { console.warn("Queue error:", e); }
  };

  // Saved / Liked Songs Fetching
  const loadSavedMusic = async () => {
    try {
      const res = await Spicetify.CosmosAsync.get("https://api.spotify.com/v1/me/tracks?limit=50");
      const items = res?.items || [];
      const formatted = items.map((row) => {
        const tr = row?.track || row;
        return {
          uri: tr?.uri,
          name: tr?.name || "Unknown Track",
          artist: tr?.artists?.map((a) => a.name).join(", ") || "Unknown Artist",
          album: tr?.album?.name || "",
          image: tr?.album?.images?.[0]?.url || "",
          duration: (tr?.duration_ms || 0) / 1000
        };
      }).filter((t) => t.uri);
      setSavedList(formatted);
    } catch (e) { console.warn("Saved music error:", e); }
  };

  const playSong = (uri) => {
    try {
      if (Spicetify.Player?.playUri) Spicetify.Player.playUri(uri);
      else if (Spicetify.Platform?.PlayerAPI?.play) Spicetify.Platform.PlayerAPI.play({ uri });
    } catch (err) { console.error(err); }
  };

  // Rebuild Flow letter elements
  useEffect(() => {
    const sc = fls.current; S.fa = undefined; S.flDirty = true; S.flY = undefined;
    S.fe = cfg.lyricStyle === "flow" && sc
      ? Array.from(sc.querySelectorAll(".fl-line")).map((el) => ({
          el, c: -9,
          ws: Array.from(el.querySelectorAll(".fl-w")).map((w) => ({ el: w, ls: Array.from(w.children), v: -1 }))
        }))
      : null;
  }, [lv, cfg.lyricStyle, cfg.flowTr, cfg.tr]);

  // Main playback, lyrics & AI Vibe loop
  useEffect(() => {
    let raf, last = performance.now(), alive = true;
    const clk = makeClock();

    const build = () => {
      if (!S.raw) return;
      S.lines = prep(S.raw, S.seed || 1);
      setLv((v) => v + 1);
    };
    S.rebuild = build;

    const sync = () => setPl({
      playing: Spicetify.Player.isPlaying(),
      shuf: Spicetify.Player.getShuffle(),
      rep: Spicetify.Player.getRepeat(),
      heart: Spicetify.Player.getHeart()
    });

    const applyPal = (p) => {
      const a = p[0], b = p[1] || a, cs = [a, b, p[2] || mixc(a, b, 0.5), p[3] || lift(a, 0.6)];
      S.rgb = lift(a, 0.65); S.pal = cs.map(softC); S.coverPal = S.pal;
      S.galVer = (S.galVer || 0) + 1;
      S.pal.forEach((c, i) => root.current?.style.setProperty("--c" + (i + 1), `rgb(${c})`));
    };

    async function load() {
      const it = Spicetify.Player.data?.item; if (!it) return;
      const t = {
        uri: it.uri, name: it.name, artist: it.artists?.[0]?.name || "", album: it.album?.name || "",
        dur: Spicetify.Player.getDuration() / 1000
      };
      Object.assign(S, {
        lines: [], raw: null, beats: null, seg: null, on: null, uri: it.uri,
        title: t.name, artist: t.artist, seed: (Math.random() * 1e6) | 0
      });
      S.th = pickTheme(t.artist, S.cfg.theme, S.cfg.themeForce); setThOn(!!S.th);
      try { S.offset = +localStorage.getItem(CL_KEY + ":off:" + it.uri) || 0; } catch { S.offset = 0; }
      setOff(S.offset); setLv((v) => v + 1); setSk((k) => k + 1);
      setStage("pop"); clearTimeout(S.st); S.st = setTimeout(() => setStage("dock"), 2800); sync();
      setInfo({ title: t.name, artist: t.artist, status: "Finding lyrics…", src: "", aiBadge: "", aiVibe: "" });

      // Instant metadata color pre-seed from Spotify client
      const rawCol = it.metadata?.color_raw || it.metadata?.extracted_color;
      if (rawCol !== undefined) {
        const num = typeof rawCol === "string" ? parseInt(rawCol.replace("#", ""), 16) : rawCol;
        if (!isNaN(num) && num > 0) {
          const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
          applyPal([[r, g, b], lift([r, g, b], 0.75), dark([r, g, b], 0.6), lift([r, g, b], 0.45)]);
        }
      }

      const img = (it.metadata?.image_xlarge_url || it.metadata?.image_url || "").replace("spotify:image:", "https://i.scdn.co/image/");
      root.current?.style.setProperty("--art", img ? `url(${img})` : "none");
      S.cvImg = null;
      if (img) {
        const im = new Image(); im.crossOrigin = "anonymous";
        im.onload = () => { if (S.uri === it.uri) S.cvImg = im; }; im.src = img;
      }
      paletteFromImage(img).then((p) => { if (p && p[0] && S.uri === it.uri) applyPal(p); });

      // Spicetify Audio Beat & Segment Tracking
      Spicetify.getAudioData?.(it.uri).then((d) => {
        if (!alive || S.uri !== it.uri || !d) return;
        S.beats = d.beats || null;
        S.seg = d.segments || null;
        S.secs = d.sections || null;
        S.bars = d.bars || null;
        S.tempo = d.track?.tempo || 0;
        S.bi = 0; S.si = 0;
      }).catch(() => {});

      // Gemini AI Genre & Vibe Analysis
      fetchGeminiVibe(S.cfg.geminiKey, t, 120, 0.6).then((ai) => {
        if (!alive || S.uri !== it.uri || !ai) return;
        S.aiVibe = ai;
        // Never overwrite the music cover colors with generic text AI colors
        if (!S.coverPal && ai.paletteRgb && ai.paletteRgb.length >= 4) applyPal(ai.paletteRgb);
        setInfo((prev) => ({ ...prev, aiBadge: `${ai.genre} · ${ai.mood}`, aiVibe: ai.vibe || "" }));
      });

      // Lyrics
      const got = await fetchLyrics(t, S.cfg.src);
      if (!alive || S.uri !== it.uri) return;
      if (got) {
        S.raw = got.l; build();
        setInfo((prev) => ({ ...prev, status: "", src: got.n + (got.ws ? " · word-synced" : " · line-synced") }));
      } else {
        setInfo((prev) => ({ ...prev, status: "No synced lyrics found for this song", src: "" }));
      }
    }
    S.reload = load;

    const onKey = (e) => {
      if ((e.key === "f" || e.key === "F") && !e.ctrlKey && !e.metaKey && !e.altKey && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName || "")) {
        e.preventDefault(); e.stopPropagation(); fs();
      }
      if (e.key === "Escape") { closeAllMenus(); }
      if (e.key === "[" || e.key === "]") { nudge(e.key === "]" ? 0.05 : -0.05); }
    };

    Spicetify.Player.addEventListener("songchange", load);
    Spicetify.Player.addEventListener("onplaypause", sync);
    window.addEventListener("keydown", onKey, true);
    load(); wake();

    // Render Loop
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
      const cv = cvs.current; if (!cv) return;
      const W = cv.clientWidth, H = cv.clientHeight, dpr = window.devicePixelRatio || 1;
      if (cv.width !== (W * dpr) | 0 || cv.height !== (H * dpr) | 0) { cv.width = W * dpr; cv.height = H * dpr; }
      const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);

      const p0 = clk(Spicetify.Player.getProgress(), Spicetify.Player.data?.item?.uri || "", Spicetify.Player.isPlaying(), now);
      const pos = (S.pos = p0 + S.offset);
      const C = S.cfg, FLOW = C.lyricStyle === "flow";
      setCurPos(pos);

      // Real-time Audio Beats & Energy Tracking
      if (S.beats && S.beats.length) {
        const b = S.beats;
        if (S.bi > 0 && b[S.bi - 1].start > pos) S.bi = 0;
        while (S.bi < b.length && b[S.bi].start <= pos) {
          if (pos - b[S.bi].start < 0.16) {
            S.pulse = Math.max(S.pulse, 0.6 + 0.4 * (b[S.bi].confidence || 0.6));
          }
          S.bi++;
        }
      } else {
        // Fallback rhythmic pulse simulation so audio visuals are NEVER dead
        const bpm = S.tempo || 116;
        const beatSec = 60 / bpm;
        const phase = (pos % beatSec) / beatSec;
        if (phase < 0.14) {
          S.pulse = Math.max(S.pulse, 0.5 + 0.45 * Math.sin((phase / 0.14) * Math.PI));
        }
      }

      // Loudness & Dynamic Energy
      let tgtEn = 0.5;
      if (S.seg && S.seg.length) {
        const g = S.seg;
        if (S.si > 0 && g[S.si].start > pos) S.si = 0;
        while (S.si + 1 < g.length && g[S.si + 1].start <= pos) S.si++;
        tgtEn = clamp((g[S.si].loudness_max + 35) / 30);
      } else {
        tgtEn = 0.45 + 0.3 * Math.sin(now * 0.0017) + 0.15 * Math.cos(now * 0.0006);
      }
      S.en += (tgtEn - S.en) * Math.min(1, dt * 7);

      const rgb = C.color === "adaptive" ? (S.th ? S.th.accent : (S.aiVibe?.accentRgb || S.rgb)) : C.color === "custom" ? hexToRgb(C.custom) || CL_COLORS.gold : CL_COLORS[C.color] || CL_COLORS.gold;
      const css = (a) => `rgba(${rgb},${a})`; S.ff = fontStack(C, S);

      // Seekbar progress
      const dur0 = Spicetify.Player.getDuration() / 1000;
      if (fill.current) fill.current.style.width = (dur0 ? (p0 / dur0) * 100 : 0) + "%";
      const sec = Math.floor(p0);
      if (sec !== S.sec) { S.sec = sec; if (tcur.current) tcur.current.textContent = fmt(p0); if (tdur.current) tdur.current.textContent = fmt(dur0); }

      // Proximity pointer
      if (S.px < -900) { S.px = S.mx; S.py = S.my; }
      S.px += (S.mx - S.px) * Math.min(1, dt * 7); S.py += (S.my - S.py) * Math.min(1, dt * 7); S.pa += (S.mt - S.pa) * Math.min(1, dt * 4);
      const prox = (x, y, R = 170) => { const f = clamp(1 - Math.hypot(x - S.px, y - S.py) / R) * S.pa * (C.prox === "off" ? 0 : 1); return f * f * (3 - 2 * f); };
      S.pw = S.pw || [1, 0, 0, 0];
      const ti = C.prox === "mix" ? Math.floor(now / 9000) % 4 : ["magnet", "repel", "swirl", "ripple"].indexOf(C.prox);
      S.pw = S.pw.map((v, q) => v + ((q === ti ? 1 : 0) - v) * Math.min(1, dt * 2.5)); const pw = S.pw;
      const warp = (x, y, f) => {
        if (f <= 0) return [x, y];
        const dx = S.px - x, dy = S.py - y, d = Math.hypot(dx, dy) || 1;
        const an = f * pw[2], co = Math.cos(an), si = Math.sin(an);
        const rx = -dx, ry = -dy, wv = Math.sin(d / 16 - now / 160) * f * 12 * pw[3];
        return [
          x + pw[0] * dx * f * 0.08 - pw[1] * dx * f * 0.3 + pw[2] * (rx * co - ry * si - rx) + (rx / d) * wv,
          y + pw[0] * dy * f * 0.08 - pw[1] * dy * f * 0.3 + pw[2] * (rx * si + ry * co - ry) + (ry / d) * wv
        ];
      };

      // Draw background
      const bn = now * C.bgSpeed, bdt = dt * C.bgSpeed; S.bn = bn;
      c.save();
      if (C.bg === "gemini") drawGeminiGenerative(c, W, H, S, bn, bdt, prox, warp);
      else if (ASCS.has(C.bg)) drawAscii(c, W, H, S, bn, bdt, prox);
      else if (GALS.has(C.bg)) drawGal(c, W, H, S, bn, bdt, prox, warp);
      else if (BGX.has(C.bg)) drawBackdrop(c, W, H, S, bn, bdt, prox, warp);
      c.restore();

      if (C.bright < 0.999) { c.fillStyle = `rgba(0,0,0,${clamp(1 - C.bright)})`; c.fillRect(0, 0, W, H); }

      // Interactive mouse proximity field aura & ripple
      if (S.pa > 0.01 && S.pw && S.pw[3] > 0.05 && C.prox !== "off") {
        for (let r2 = 0; r2 < 2; r2++) {
          const ph = (now / 1100 + r2 / 2) % 1;
          c.strokeStyle = css(0.22 * S.pa * S.pw[3] * (1 - ph));
          c.lineWidth = 1.2;
          c.beginPath();
          c.arc(S.px, S.py, ph * 140, 0, 7);
          c.stroke();
        }
      }
      if (S.pa > 0.01 && C.prox !== "off") {
        const g = c.createRadialGradient(S.px, S.py, 0, S.px, S.py, 120);
        g.addColorStop(0, css(0.12 * S.pa));
        g.addColorStop(1, css(0));
        c.fillStyle = g;
        c.fillRect(S.px - 120, S.py - 120, 240, 240);
      }

      // Active lyric line determination
      let i = -1;
      for (let j = 0; j < S.lines.length; j++) { if (S.lines[j].t <= pos) i = j; else break; }
      const L = S.lines[i];
      if (i !== S.li) { S.li = i; S.hl = L ? L.t + L.dur : 0; }

      // Constellation Star Lyrics Rendering
      if (!FLOW && L && pos < S.hl + 0.5) {
        const end = S.hl, al = pos > end ? Math.max(0, 1 - (pos - end) / 0.5) : 1;
        let cur = 0; L.ws.forEach((w, k) => { if (w <= pos) cur = k; });
        const WS = L.ws, P = L.pts.map((p) => {
          const x = p[0] * W, y = p[1] * H, f = prox(x, y), [wx, wy] = warp(x, y, f);
          return [wx, wy, f];
        });

        // Lines connecting stars
        for (let k = 1; k <= cur; k++) {
          const a = ease(clamp((pos - WS[k]) / 0.35)), [x0, y0] = P[k - 1], [x1, y1] = P[k];
          c.save(); c.strokeStyle = css(0.55 * al * C.alpha); c.lineWidth = 1.6; c.shadowColor = css(0.8); c.shadowBlur = 10;
          c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + (x1 - x0) * a, y0 + (y1 - y0) * a); c.stroke(); c.restore();
        }

        // Star words
        for (let k = 0; k <= cur; k++) {
          const ap = ease(clamp((pos - WS[k]) / 0.3)), isCur = k === cur, [x, y] = P[k];
          const s = isCur ? 0 : ease(clamp((pos - WS[k + 1]) / 0.5)), a = clamp((1 - (1 - C.fade) * s) * al * ap * C.alpha);
          const size = C.font * (44 - 31 * s) * (0.6 + 0.4 * ap), r = (4 + 7 * (1 - s)) * ap * C.starSize;
          c.fillStyle = css(a); c.shadowColor = css(0.9); c.shadowBlur = isCur ? C.tglow : 4;
          sparkle(c, x, y, r);
          c.font = `${isCur ? 800 : 500} ${size}px ${S.ff}`; c.textAlign = "center";
          const w = c.measureText(L.words[k]).width;
          if (C.hl !== "off" && k === L.kw) hero(c, css, C, L, x, y, Math.max(0, pos - WS[k]), now, al * C.alpha, W, S);
          else c.fillText(L.words[k], Math.min(W - w / 2 - 16, Math.max(w / 2 + 16, x)), y + r + size * 0.95);
          c.shadowBlur = 0;
        }
      }

      // Constellation visualizer during instrumental breaks
      if (!FLOW && (!L || pos > S.hl + 2.5)) drawVis(c, css, W, H, S, now, 0.85);

      // Floating particles react to mouse proximity
      if (S.dust && (FLOW && C.flowDust)) {
        S.dust.forEach(([x, y, sz, q]) => {
          const px = x * W, py = y * H;
          const f = prox(px, py, 180), [dx, dy] = warp(px, py, f);
          c.fillStyle = `rgba(${rgb},${q * (1 + f * 1.5)})`;
          c.fillRect(dx - sz, dy - sz, sz * 2, sz * 2);
        });
      }

      // Flow updates
      if (FLOW) flowUpdate(S, C, L, i, pos, now, dt, W, H, rgb, fls.current, flw.current);

      // Edge glow light & music-synced lightning
      drawEdgeLightning(c, css, W, H, S, now, dt, dur0, p0, C);
      S.pulse *= Math.exp(-dt * 4.8);
    };
    loop();

    return () => {
      alive = false; cancelAnimationFrame(raf); clearTimeout(S.st);
      Spicetify.Player.removeEventListener("songchange", load);
      Spicetify.Player.removeEventListener("onplaypause", sync);
      window.removeEventListener("keydown", onKey, true);
    };
  }, []);

  const ic = (p) => h("svg", { viewBox: "0 0 24 24", width: 16, height: 16, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: p }));
  const ib = (p, fn, on, fillIt, cls) => h("button", { className: "cl-ib" + (on ? " on" : "") + (cls ? " " + cls : ""), onClick: fn }, h("svg", { viewBox: "0 0 24 24", width: 16, height: 16, fill: fillIt ? "currentColor" : "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: p })));
  const P = Spicetify.Player;

  // Apple Music-Style 3-Dot Progression Indicator (No Text)
  const renderInstDots = (act, progress) => h("div", { className: `fl-inst-dots${act ? " act" : ""}` },
    h("span", { className: `fl-inst-dot d1${progress >= 0.15 ? " on" : ""}` }),
    h("span", { className: `fl-inst-dot d2${progress >= 0.50 ? " on" : ""}` }),
    h("span", { className: `fl-inst-dot d3${progress >= 0.85 ? " on" : ""}` })
  );

  // Filtered saved music
  const filteredSaved = savedList.filter((s) => !savedSearch || s.name.toLowerCase().includes(savedSearch.toLowerCase()) || s.artist.toLowerCase().includes(savedSearch.toLowerCase()));

  return h("div", {
    ref: root,
    className: `cl-root bg-${GALS.has(cfg.bg) || BGX.has(cfg.bg) || ASCS.has(cfg.bg) || cfg.bg === "gemini" ? "galaxy" : cfg.bg}${ui || open || showDrawer ? " ui" : ""}${open || showDrawer ? " modal-open" : ""}`,
    onMouseMove: move,
    onMouseLeave: () => { S.mt = 0; },
    onClick: closeAllMenus
  },
    // Backdrop overlay to close menus when clicking anywhere
    (open || showDrawer) && h("div", { className: "cl-backdrop", onClick: closeAllMenus, onTouchStart: closeAllMenus }),

    // Background layers
    h("div", { className: "cl-bgl", ref: bgl },
      h("div", { className: "cl-bg cl-bg-art" }),
      h("div", { className: "cl-mesh" }, h("i", { className: "cl-blob b1" }), h("i", { className: "cl-blob b2" }), h("i", { className: "cl-blob b3" }), h("i", { className: "cl-blob b4" })),
      h("div", { className: "cl-bg cl-bg-grad" }),
      h("div", { className: "cl-shade" })
    ),
    h("canvas", { ref: cvs, className: "cl-canvas" }),

    // Flow Lyrics Rendering (With Apple Music 3-Dot Instrumental Animations)
    cfg.lyricStyle === "flow" && h("div", {
      ref: flw,
      className: `fl-wrap fl-a-${cfg.flowAnim} fl-al-${cfg.flowAlign}`,
      style: { "--flf": fontStack(cfg, S) }
    },
      h("div", { ref: fls, className: "fl-scroll" },
        // Intro Instrumental 3-dot progression (No text)
        S.lines.length > 0 && S.lines[0].t >= 3.0 && (() => {
          const introProg = clamp(curPos / S.lines[0].t);
          const isAct = curPos < S.lines[0].t - 0.25;
          return renderInstDots(isAct, introProg);
        })(),

        // Line-by-line lyrics with intermediate 3-dot instrumental progression
        S.lines.map((L, idx) => {
          const nextL = S.lines[idx + 1];
          const gapStart = L.t + (L.dur || 0);
          const gapEnd = nextL ? nextL.t : gapStart;
          const gap = nextL ? gapEnd - gapStart : 0;
          const isInstActive = gap >= 3.0 && (curPos >= gapStart - 0.1) && (curPos < gapEnd - 0.25);
          const gapProg = gap >= 3.0 ? clamp((curPos - gapStart) / Math.max(0.1, gapEnd - gapStart)) : 0;

          return h(R.Fragment, { key: (S.uri || "") + ":" + idx },
            h("div", { className: "fl-line" },
              h("div", null, L.words.map((w, k) => h(R.Fragment, { key: k },
                h("span", { className: "fl-w" }, flUnits(w).map((u, j) => h("span", { key: j, className: "fl-l", "data-c": u }, u))), " "
              ))),
              cfg.flowTr && cfg.tr !== "off" && L.tr && h("div", { className: "fl-tr" }, L.tr)
            ),
            // Minimal Apple-style 3-Dot Instrumental Interlude (No Text)
            gap >= 3.0 && renderInstDots(isInstActive, gapProg)
          );
        })
      )
    ),

    info.status && h("div", { className: "cl-meta" }, info.status),

    // Floating Controller
    cfg.ctrl !== "off" && h("div", { className: `cl-ctrl ${stage} ${cfg.ctrl}`, onClick: (e) => e.stopPropagation() },
      h("div", { className: "cl-card", key: sk },
        h("div", { className: "cl-hov" },
          h("div", { className: "cl-cap" }, h("b", null, info.title), h("span", null, info.artist)),
          h("button", { className: "cl-heart" + (pl.heart ? " on" : ""), onClick: () => { P.toggleHeart(); setTimeout(() => setPl({ ...pl, heart: P.getHeart() }), 150); } },
            h("svg", { viewBox: "0 0 24 24", width: 44, height: 44, fill: pl.heart ? "currentColor" : "none", stroke: "currentColor", strokeWidth: 2 }, h("path", { d: IC.heart }))
          ),
          h("div", { className: "cl-seekrow" }, h("span", { ref: tcur }, "0:00"), h("div", { className: "cl-seek", onClick: seek }, h("i", { ref: fill })), h("span", { ref: tdur }, "0:00")),
          h("div", { className: "cl-btns" },
            ib(IC.shuf, () => { P.toggleShuffle(); setTimeout(() => setPl({ ...pl, shuf: P.getShuffle() }), 150); }, pl.shuf),
            ib(IC.prev, () => P.back(), false, true),
            ib(pl.playing ? IC.pause : IC.play, () => { P.togglePlay(); setTimeout(() => setPl({ ...pl, playing: P.isPlaying() }), 150); }, false, true, "big"),
            ib(IC.next, () => P.next(), false, true),
            ib(IC.rep, () => { P.toggleRepeat(); setTimeout(() => setPl({ ...pl, rep: P.getRepeat() }), 150); }, pl.rep > 0)
          )
        )
      )
    ),

    // Apple-Style Top Bar
    h("div", { className: "cl-top" },
      h("div", { className: "cl-apple-bar", onClick: (e) => e.stopPropagation() },
        h("button", {
          className: "cl-apple-pill-btn" + (open ? " on" : ""),
          onClick: () => { setOpen(!open); setShowDrawer(false); }
        },
          ic(IC.gear),
          h("span", null, "Settings")
        ),
        h("button", {
          className: "cl-apple-pill-btn" + (showDrawer ? " on" : ""),
          onClick: () => {
            const nextState = !showDrawer;
            setShowDrawer(nextState);
            setOpen(false);
            if (nextState) { loadQueue(); loadSavedMusic(); }
          }
        },
          ic(IC.list),
          h("span", null, "Queue & Library")
        ),
        info.aiBadge && h("div", { className: "cl-apple-badge", title: info.aiVibe || "" },
          h("span", { className: "cl-sparkle-dot" }),
          h("span", null, info.aiBadge)
        ),
        h("button", { className: "cl-apple-icon-btn", onClick: fs, title: "Fullscreen (F)" },
          ic(IC.fullscreen)
        )
      ),

      // Apple-Style Settings Sheet Modal
      open && h("div", { className: "cl-apple-panel", onClick: (e) => e.stopPropagation() },
        h("div", { className: "cl-apple-header" },
          h("div", { className: "cl-apple-title" }, "Settings"),
          h("button", { className: "cl-apple-close", onClick: () => setOpen(false) }, ic(IC.close))
        ),
        h("div", { className: "cl-apple-tabs" },
          ["Style", "Scene", "✦ AI Studio", "Text", "Effects", "Visual", "Lyrics"].map((t) =>
            h("button", { key: t, className: "cl-apple-tab" + (tab === t ? " on" : ""), onClick: () => setTab(t) }, t)
          )
        ),
        h("div", { className: "cl-apple-body", key: tab },
          // Tab 1: Style
          tab === "Style" && h(R.Fragment, null,
            h("div", { className: "cl-apple-group" },
              h("span", { className: "cl-group-title" }, "Lyric Presentation"),
              h("div", { className: "cl-cards" },
                [["constellation", "Constellation", "linear-gradient(135deg,#120c33,#6d4dff 60%,#c9b8ff)"], ["flow", "Flow", "linear-gradient(135deg,#ff8a5c,#8a3fbf 55%,#2a2060)"]].map(([v, n, g]) =>
                  h("button", { key: v, className: "cl-cd" + (cfg.lyricStyle === v ? " on" : ""), onClick: () => upd({ lyricStyle: v }), style: { "--g": g } }, h("i"), h("span", null, n))
                )
              ),
              h("div", { className: "cl-apple-sub", style: { marginTop: 6 } }, "Constellation: lyrics appear as stars across 3D space. Flow: smooth line scrolling with synchronized word highlighting.")
            ),
            cfg.lyricStyle === "flow" && h("div", { className: "cl-apple-group" },
              h("span", { className: "cl-group-title" }, "Flow Animation & Layout"),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Letter Effect"),
                h("div", { className: "cl-apple-ctl" },
                  [["glow", "Glow"], ["wave", "Wave"], ["pop", "Pop"], ["rise", "Rise"], ["soft", "Soft"]].map(([k, lbl]) =>
                    h("button", { key: k, className: "cl-apple-btn" + (cfg.flowAnim === k ? " on" : ""), onClick: () => upd({ flowAnim: k }) }, lbl)
                  )
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Alignment"),
                h("div", { className: "cl-apple-ctl" },
                  [["left", "Left"], ["center", "Center"]].map(([k, lbl]) =>
                    h("button", { key: k, className: "cl-apple-btn" + (cfg.flowAlign === k ? " on" : ""), onClick: () => upd({ flowAlign: k }) }, lbl)
                  )
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Text Size"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0.6, max: 1.6, step: 0.05, value: cfg.flowSize, onChange: (e) => upd({ flowSize: +e.target.value }) }),
                  h("em", null, Math.round(cfg.flowSize * 100) + "%")
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Active Line Glow"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0, max: 2, step: 0.1, value: cfg.flowGlow, onChange: (e) => upd({ flowGlow: +e.target.value }) }),
                  h("em", null, cfg.flowGlow)
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Letter Bounce / Lift"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0, max: 2, step: 0.1, value: cfg.flowLift, onChange: (e) => upd({ flowLift: +e.target.value }) }),
                  h("em", null, cfg.flowLift)
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Scroll Speed"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0.4, max: 2, step: 0.1, value: cfg.flowSpeed, onChange: (e) => upd({ flowSpeed: +e.target.value }) }),
                  h("em", null, cfg.flowSpeed)
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Active Line Height"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0.2, max: 0.6, step: 0.02, value: cfg.flowPos, onChange: (e) => upd({ flowPos: +e.target.value }) }),
                  h("em", null, Math.round(cfg.flowPos * 100) + "%")
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Other Lines Opacity"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0.1, max: 0.8, step: 0.05, value: cfg.flowDim, onChange: (e) => upd({ flowDim: +e.target.value }) }),
                  h("em", null, Math.round(cfg.flowDim * 100) + "%")
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Distance Blur"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0, max: 2, step: 0.1, value: cfg.flowBlur, onChange: (e) => upd({ flowBlur: +e.target.value }) }),
                  h("em", null, cfg.flowBlur)
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Show Translation"),
                h("button", { className: "cl-apple-switch" + (cfg.flowTr ? " on" : ""), onClick: () => upd({ flowTr: !cfg.flowTr }) }, h("i"))
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Fill with Album Colour"),
                h("button", { className: "cl-apple-switch" + (cfg.flowTint ? " on" : ""), onClick: () => upd({ flowTint: !cfg.flowTint }) }, h("i"))
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Floating Ambient Dust"),
                h("button", { className: "cl-apple-switch" + (cfg.flowDust ? " on" : ""), onClick: () => upd({ flowDust: !cfg.flowDust }) }, h("i"))
              )
            ),
            h("div", { className: "cl-apple-group" },
              h("span", { className: "cl-group-title" }, "Background Lighting"),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Background Brightness"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0.1, max: 1, step: 0.05, value: cfg.bright, onChange: (e) => upd({ bright: +e.target.value }) }),
                  h("em", null, Math.round(cfg.bright * 100) + "%")
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Background Dim (Vignette)"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0, max: 0.9, step: 0.05, value: cfg.dim, onChange: (e) => upd({ dim: +e.target.value }) }),
                  h("em", null, Math.round(cfg.dim * 100) + "%")
                )
              )
            )
          ),

          // Tab 2: Scene & Background
          tab === "Scene" && h(R.Fragment, null,
            h("div", { className: "cl-apple-group" },
              h("span", { className: "cl-group-title" }, "Background Atmosphere"),
              h("div", { className: "cl-cards" }, BGC.map(([v, n, g]) =>
                h("button", { key: v, className: "cl-cd" + (cfg.bg === v ? " on" : ""), onClick: () => upd({ bg: v }), style: { "--g": g } }, h("i"), h("span", null, n))
              ))
            ),
            h("div", { className: "cl-apple-group" },
              h("span", { className: "cl-group-title" }, "Galaxies & Canvas Simulations"),
              h("div", { className: "cl-cards" }, GXC.map(([v, n, g]) =>
                h("button", { key: v, className: "cl-cd" + (cfg.bg === v ? " on" : ""), onClick: () => upd({ bg: v }), style: { "--g": g } }, h("i"), h("span", null, n))
              ))
            ),
            h("div", { className: "cl-apple-group" },
              h("span", { className: "cl-group-title" }, "ASCII Art Modes"),
              h("div", { className: "cl-cards" }, ASCC.map(([v, n, g]) =>
                h("button", { key: v, className: "cl-cd" + (cfg.bg === v ? " on" : ""), onClick: () => upd({ bg: v }), style: { "--g": g } }, h("i"), h("span", null, n))
              ))
            ),
            h("div", { className: "cl-apple-group" },
              h("span", { className: "cl-group-title" }, "ASCII Art Customization"),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Characters"),
                h("div", { className: "cl-apple-ctl" },
                  [["classic", "Classic"], ["fine", "Fine"], ["blocks", "Blocks"], ["binary", "Binary"], ["code", "Code"], ["kana", "Katakana"]].map(([k, lbl]) =>
                    h("button", { key: k, className: "cl-apple-btn" + (cfg.ascSet === k ? " on" : ""), onClick: () => upd({ ascSet: k }) }, lbl)
                  )
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "ASCII Colour"),
                h("div", { className: "cl-apple-ctl" },
                  [["cover", "Cover colours"], ["palette", "Palette"], ["accent", "Accent"], ["mono", "Mono"]].map(([k, lbl]) =>
                    h("button", { key: k, className: "cl-apple-btn" + (cfg.ascColor === k ? " on" : ""), onClick: () => upd({ ascColor: k }) }, lbl)
                  )
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Cover Animation"),
                h("div", { className: "cl-apple-ctl" },
                  [["wave", "Wave"], ["ripple", "Ripple"], ["scan", "Scan"], ["dissolve", "Dissolve"], ["glitch", "Glitch"]].map(([k, lbl]) =>
                    h("button", { key: k, className: "cl-apple-btn" + (cfg.ascStyle === k ? " on" : ""), onClick: () => upd({ ascStyle: k }) }, lbl)
                  )
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Character Size"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 7, max: 18, step: 1, value: cfg.ascSize, onChange: (e) => upd({ ascSize: +e.target.value }) }),
                  h("em", null, cfg.ascSize + "px")
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Animation Intensity"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0, max: 2, step: 0.1, value: cfg.ascAmp, onChange: (e) => upd({ ascAmp: +e.target.value }) }),
                  h("em", null, cfg.ascAmp)
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Music Reactivity"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0, max: 2, step: 0.1, value: cfg.ascReact, onChange: (e) => upd({ ascReact: +e.target.value }) }),
                  h("em", null, cfg.ascReact)
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Flowers"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 3, max: 12, step: 1, value: cfg.ascFlowers, onChange: (e) => upd({ ascFlowers: +e.target.value }) }),
                  h("em", null, cfg.ascFlowers)
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "ASCII Glow"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0, max: 1, step: 0.05, value: cfg.ascGlow, onChange: (e) => upd({ ascGlow: +e.target.value }) }),
                  h("em", null, Math.round(cfg.ascGlow * 100) + "%")
                )
              )
            ),
            h("div", { className: "cl-apple-group" },
              h("span", { className: "cl-group-title" }, "Motion & Lighting"),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Background Brightness"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0.1, max: 1, step: 0.05, value: cfg.bright, onChange: (e) => upd({ bright: +e.target.value }) }),
                  h("em", null, Math.round(cfg.bright * 100) + "%")
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Background Dim"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0, max: 0.9, step: 0.05, value: cfg.dim, onChange: (e) => upd({ dim: +e.target.value }) }),
                  h("em", null, Math.round(cfg.dim * 100) + "%")
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Background Speed"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0.2, max: 3, step: 0.1, value: cfg.bgSpeed, onChange: (e) => upd({ bgSpeed: +e.target.value }) }),
                  h("em", null, cfg.bgSpeed)
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Travel Speed"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0, max: 3, step: 0.1, value: cfg.trav, onChange: (e) => upd({ trav: +e.target.value }) }),
                  h("em", null, cfg.trav)
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Parallax Depth"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0, max: 2, step: 0.1, value: cfg.par, onChange: (e) => upd({ par: +e.target.value }) }),
                  h("em", null, cfg.par)
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Black Hole Quality"),
                h("div", { className: "cl-apple-ctl" },
                  [[256, "Low"], [384, "Medium"], [512, "High"]].map(([k, lbl]) =>
                    h("button", { key: k, className: "cl-apple-btn" + (cfg.bhq === k ? " on" : ""), onClick: () => upd({ bhq: k }) }, lbl)
                  )
                )
              )
            ),
            h("div", { className: "cl-apple-group" },
              h("span", { className: "cl-group-title" }, "Edge Progress Lighting"),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Mode"),
                h("div", { className: "cl-apple-ctl" },
                  [["progress", "Progress & Comets"], ["reactive", "Audio-Reactive Surge"], ["off", "Disabled"]].map(([k, lbl]) =>
                    h("button", { key: k, className: "cl-apple-btn" + (cfg.edgeMode === k ? " on" : ""), onClick: () => upd({ edgeMode: k }) }, lbl)
                  )
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Thickness"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0.5, max: 6, step: 0.5, value: cfg.edgeW, onChange: (e) => upd({ edgeW: +e.target.value }) }),
                  h("em", null, cfg.edgeW + "px")
                )
              )
            ),
            h("div", { className: "cl-apple-group" },
              h("span", { className: "cl-group-title" }, "Floating Controller"),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Position"),
                h("div", { className: "cl-apple-ctl" },
                  [["right", "Right"], ["left", "Left"], ["off", "Off"]].map(([k, lbl]) =>
                    h("button", { key: k, className: "cl-apple-btn" + (cfg.ctrl === k ? " on" : ""), onClick: () => upd({ ctrl: k }) }, lbl)
                  )
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Size"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0.7, max: 1.6, step: 0.05, value: cfg.ctrlSize, onChange: (e) => upd({ ctrlSize: +e.target.value }) }),
                  h("em", null, Math.round(cfg.ctrlSize * 100) + "%")
                )
              )
            )
          ),

          // Tab 3: Gemini AI Studio
          tab === "✦ AI Studio" && h(R.Fragment, null,
            h("div", { className: "cl-apple-group" },
              h("span", { className: "cl-group-title" }, "Google Gemini API Key"),
              h("div", { className: "cl-apple-row col" },
                h("span", { className: "cl-apple-sub" }, "Enter your Gemini API key to generate custom genre-tuned backgrounds and color palettes for every track."),
                h("input", {
                  type: "password",
                  className: "cl-apple-input",
                  placeholder: "AIzaSy...",
                  defaultValue: cfg.geminiKey || "",
                  onBlur: (e) => upd({ geminiKey: e.target.value.trim() })
                })
              )
            ),
            h("div", { className: "cl-ai-preview" },
              h("span", { className: "cl-group-title", style: { color: "#fff" } }, "Current Track Analysis"),
              h("div", { className: "cl-ai-badge-row" },
                h("span", { className: "cl-ai-chip" }, "Genre: " + (S.aiVibe?.genre || "Analyzing...")),
                h("span", { className: "cl-ai-chip" }, "Mood: " + (S.aiVibe?.mood || "Dynamic"))
              ),
              S.aiVibe?.vibe && h("div", { style: { fontSize: 12, opacity: 0.85, fontStyle: "italic", marginTop: 4 } }, `"${S.aiVibe.vibe}"`),
              h("div", { className: "cl-swatches" },
                (S.aiVibe?.palette || ["#7928ca", "#ff0080", "#00dfd8", "#111"]).map((c, i) =>
                  h("div", { key: i, className: "cl-swatch", style: { background: c }, title: c })
                )
              ),
              h("button", {
                className: "cl-apple-btn on",
                style: { marginTop: 8, alignSelf: "flex-start" },
                onClick: () => {
                  fetchGeminiVibe(cfg.geminiKey, { name: info.title, artist: info.artist, uri: S.uri }, 120, 0.7).then((ai) => {
                    S.aiVibe = ai;
                    setInfo((prev) => ({ ...prev, aiBadge: `${ai.genre} · ${ai.mood}`, aiVibe: ai.vibe || "" }));
                  });
                }
              }, "Re-analyze Track with Gemini")
            )
          ),

          // Tab 4: Text
          tab === "Text" && h(R.Fragment, null,
            h("div", { className: "cl-apple-group" },
              h("span", { className: "cl-group-title" }, "Lyric Colour"),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Palette"),
                h("div", { className: "cl-apple-ctl" },
                  h("button", { className: "cl-apple-btn" + (cfg.color === "adaptive" ? " on" : ""), onClick: () => upd({ color: "adaptive" }) }, "Album Adaptive"),
                  ...Object.keys(CL_COLORS).map((k) =>
                    h("button", { key: k, className: "cl-dot" + (cfg.color === k ? " on" : ""), style: { background: `rgb(${CL_COLORS[k]})` }, onClick: () => upd({ color: k }) })
                  ),
                  h("input", { type: "color", className: "cl-pick", title: "Custom colour", value: cfg.custom, onChange: (e) => upd({ color: "custom", custom: e.target.value }) })
                )
              )
            ),
            h("div", { className: "cl-apple-group" },
              h("span", { className: "cl-group-title" }, "Typefaces"),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "English"),
                h("div", { className: "cl-apple-ctl" },
                  FAM.map(([k, lbl]) =>
                    h("button", { key: k, className: "cl-apple-btn" + (cfg.fam === k ? " on" : ""), onClick: () => upd({ fam: k }) }, lbl)
                  )
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Bangla"),
                h("div", { className: "cl-apple-ctl" },
                  BNF.map(([k, lbl]) =>
                    h("button", { key: k, className: "cl-apple-btn" + (cfg.bn === k ? " on" : ""), onClick: () => upd({ bn: k }) }, lbl)
                  )
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Arabic / Urdu"),
                h("div", { className: "cl-apple-ctl" },
                  ARF.map(([k, lbl]) =>
                    h("button", { key: k, className: "cl-apple-btn" + (cfg.ar === k ? " on" : ""), onClick: () => upd({ ar: k }) }, lbl)
                  )
                )
              )
            ),
            h("div", { className: "cl-apple-group" },
              h("span", { className: "cl-group-title" }, "Size & Dynamics (Constellation)"),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Font Size"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0.6, max: 1.8, step: 0.05, value: cfg.font, onChange: (e) => upd({ font: +e.target.value }) }),
                  h("em", null, Math.round(cfg.font * 100) + "%")
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Star Size"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0.4, max: 2.5, step: 0.1, value: cfg.starSize, onChange: (e) => upd({ starSize: +e.target.value }) }),
                  h("em", null, cfg.starSize)
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Lyric Opacity"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0.2, max: 1, step: 0.05, value: cfg.alpha, onChange: (e) => upd({ alpha: +e.target.value }) }),
                  h("em", null, Math.round(cfg.alpha * 100) + "%")
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Fade Threshold"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0.05, max: 1, step: 0.05, value: cfg.fade, onChange: (e) => upd({ fade: +e.target.value }) }),
                  h("em", null, Math.round(cfg.fade * 100) + "%")
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Text Glow"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0, max: 40, step: 1, value: cfg.tglow, onChange: (e) => upd({ tglow: +e.target.value }) }),
                  h("em", null, cfg.tglow)
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Elements"),
                h("div", { className: "cl-apple-ctl" },
                  [["mix", "Mix"], ["sparkle", "Sparkles"], ["cross", "Crosses"], ["shuriken", "Ninja stars"], ["y2k", "Y2K"]].map(([k, lbl]) =>
                    h("button", { key: k, className: "cl-apple-btn" + (cfg.kinds === k ? " on" : ""), onClick: () => upd({ kinds: k }) }, lbl)
                  )
                )
              )
            )
          ),

          // Tab 5: Effects (Restored)
          tab === "Effects" && h(R.Fragment, null,
            h("div", { className: "cl-apple-group" },
              h("span", { className: "cl-group-title" }, "Interaction & Physics"),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Proximity"),
                h("div", { className: "cl-apple-ctl" },
                  [["mix", "Mix"], ["magnet", "Magnet"], ["repel", "Repel"], ["swirl", "Swirl"], ["ripple", "Ripple"], ["off", "Off"]].map(([k, lbl]) =>
                    h("button", { key: k, className: "cl-apple-btn" + (cfg.prox === k ? " on" : ""), onClick: () => upd({ prox: k }) }, lbl)
                  )
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Star Links"),
                h("div", { className: "cl-apple-ctl" },
                  [["comet", "Shooting Star"], ["classic", "Classic"]].map(([k, lbl]) =>
                    h("button", { key: k, className: "cl-apple-btn" + (cfg.link === k ? " on" : ""), onClick: () => upd({ link: k }) }, lbl)
                  )
                )
              )
            ),
            h("div", { className: "cl-apple-group" },
              h("span", { className: "cl-group-title" }, "Highlight Words"),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Animation"),
                h("div", { className: "cl-apple-ctl" },
                  [["random", "Random"], ["marker", "Marker"], ["pop", "Pop"], ["glitch", "Glitch"], ["slide", "Slide"], ["letters", "Letters"], ["stamp", "Stamp"], ["neon", "Neon"], ["wave", "Wave"], ["off", "Off"]].map(([k, lbl]) =>
                    h("button", { key: k, className: "cl-apple-btn" + (cfg.hl === k ? " on" : ""), onClick: () => upd({ hl: k }) }, lbl)
                  )
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Vector Icons"),
                h("button", { className: "cl-apple-switch" + (cfg.icons ? " on" : ""), onClick: () => upd({ icons: !cfg.icons }) }, h("i"))
              )
            )
          ),

          // Tab 6: Visual (Restored All Styles & Controls)
          tab === "Visual" && h(R.Fragment, null,
            h("div", { className: "cl-apple-group" },
              h("span", { className: "cl-group-title" }, "Instrumental Visualizer (Constellation)"),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Style"),
                h("div", { className: "cl-apple-ctl" },
                  [["bars", "Bars"], ["wave", "Wave"], ["tunnel", "Tunnel"], ["orbs", "Orbs"], ["ring", "Ring"], ["off", "Off"]].map(([k, lbl]) =>
                    h("button", { key: k, className: "cl-apple-btn" + (cfg.vis === k ? " on" : ""), onClick: () => upd({ vis: k }) }, lbl)
                  )
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Size"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0.4, max: 2.2, step: 0.1, value: cfg.visSize, onChange: (e) => upd({ visSize: +e.target.value }) }),
                  h("em", null, cfg.visSize)
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Speed"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0.2, max: 3, step: 0.1, value: cfg.visSpd, onChange: (e) => upd({ visSpd: +e.target.value }) }),
                  h("em", null, cfg.visSpd)
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Also Show Faintly During Vocals"),
                h("button", { className: "cl-apple-switch" + (cfg.visAlways ? " on" : ""), onClick: () => upd({ visAlways: !cfg.visAlways }) }, h("i"))
              )
            )
          ),

          // Tab 7: Lyrics & Sources (Restored)
          tab === "Lyrics" && h(R.Fragment, null,
            h("div", { className: "cl-apple-group" },
              h("span", { className: "cl-group-title" }, "Lyric Provider & Source"),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Provider"),
                h("div", { className: "cl-apple-ctl" },
                  [["auto", "Auto"], ["spotify", "Spotify"], ["lrclib", "LRCLIB"], ["lrcmux", "lrcmux"], ["betterlyrics", "Better Lyrics"], ["netease", "NetEase"], ["lrcapi", "LrcApi"], ["musixmatch", "Musixmatch"], ["custom", "Custom"]].map(([k, lbl]) =>
                    h("button", { key: k, className: "cl-apple-btn" + (cfg.src === k ? " on" : ""), onClick: () => upd({ src: k }) }, lbl)
                  )
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Active Provider"),
                h("em", { className: "cl-wide", style: { color: "#a4a4b4", fontSize: 11 } }, info.src ? "using " + info.src + (info.all ? "   |   " + info.all : "") : "—")
              ),
              h("div", { className: "cl-apple-row col" },
                h("span", { className: "cl-apple-lab" }, "Musixmatch Token"),
                h("input", {
                  type: "password",
                  className: "cl-apple-input",
                  placeholder: "paste user token (optional)",
                  defaultValue: cfg.mxm || "",
                  onBlur: (e) => upd({ mxm: e.target.value.trim() })
                })
              ),
              h("div", { className: "cl-apple-row col" },
                h("span", { className: "cl-apple-lab" }, "Custom URL"),
                h("input", {
                  type: "text",
                  className: "cl-apple-input",
                  placeholder: "https://…?title={title}&artist={artist}&duration={duration}",
                  defaultValue: cfg.customUrl || "",
                  onBlur: (e) => upd({ customUrl: e.target.value.trim() })
                })
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Translate"),
                h("div", { className: "cl-apple-ctl" },
                  [["auto", "Auto"], ["on", "Always"], ["off", "Off"]].map(([k, lbl]) =>
                    h("button", { key: k, className: "cl-apple-btn" + (cfg.tr === k ? " on" : ""), onClick: () => upd({ tr: k }) }, lbl)
                  )
                )
              )
            ),
            h("div", { className: "cl-apple-group" },
              h("span", { className: "cl-group-title" }, "Timing & Audio Sync"),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Audio Analysis"),
                h("div", { className: "cl-apple-ctl" },
                  [[0, "Off"], [1, "Light"], [2, "Strong"]].map(([k, lbl]) =>
                    h("button", { key: k, className: "cl-apple-btn" + (cfg.ana === k ? " on" : ""), onClick: () => upd({ ana: k }) }, lbl)
                  )
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Manual Offset"),
                h("div", { className: "cl-apple-ctl" },
                  h("button", { className: "cl-apple-btn", onClick: () => nudge(-0.1) }, "-0.1s"),
                  h("em", null, (off >= 0 ? "+" : "") + off.toFixed(2) + "s"),
                  h("button", { className: "cl-apple-btn", onClick: () => nudge(0.1) }, "+0.1s"),
                  off !== 0 && h("button", { className: "cl-apple-btn", onClick: () => nudge(-off) }, "Reset")
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Auto-align Whole Song"),
                h("button", { className: "cl-apple-switch" + (cfg.auto ? " on" : ""), onClick: () => upd({ auto: !cfg.auto }) }, h("i"))
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Vocal Follow (Hold on Long Notes)"),
                h("button", { className: "cl-apple-switch" + (cfg.follow ? " on" : ""), onClick: () => upd({ follow: !cfg.follow }) }, h("i"))
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Max Hold Duration"),
                h("div", { className: "cl-apple-ctl" },
                  h("input", { type: "range", min: 0.3, max: 3, step: 0.1, value: cfg.maxHold, onChange: (e) => upd({ maxHold: +e.target.value }) }),
                  h("em", null, cfg.maxHold + "s")
                )
              )
            ),
            h("div", { className: "cl-apple-group" },
              h("span", { className: "cl-group-title" }, "Performance & Frame Rate"),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Target FPS"),
                h("div", { className: "cl-apple-ctl" },
                  [[30, "30 FPS"], [60, "60 FPS"], [120, "120 FPS"]].map(([k, lbl]) =>
                    h("button", { key: k, className: "cl-apple-btn" + (cfg.fps === k ? " on" : ""), onClick: () => upd({ fps: k }) }, lbl)
                  )
                )
              ),
              h("div", { className: "cl-apple-row" },
                h("span", { className: "cl-apple-lab" }, "Preset"),
                h("div", { className: "cl-apple-ctl" },
                  [["smooth", "Smooth (60)"], ["max", "Max (120)"], ["saver", "Battery Saver (30)"]].map(([k, lbl]) =>
                    h("button", { key: k, className: "cl-apple-btn" + (cfg.perfPreset === k ? " on" : ""), onClick: () => upd({ perfPreset: k }) }, lbl)
                  )
                )
              )
            )
          )
        )
      ),
      // Queue & Saved Music Window (Apple Style)
      showDrawer && h("div", { className: "cl-drawer", onClick: (e) => e.stopPropagation() },
        h("div", { className: "cl-drawer-header" },
          h("div", { className: "cl-drawer-tabs" },
            h("button", { className: "cl-drawer-tab" + (drawerTab === "queue" ? " on" : ""), onClick: () => { setDrawerTab("queue"); loadQueue(); } }, "Up Next (Queue)"),
            h("button", { className: "cl-drawer-tab" + (drawerTab === "saved" ? " on" : ""), onClick: () => { setDrawerTab("saved"); loadSavedMusic(); } }, "Liked Songs")
          ),
          h("button", { className: "cl-apple-close", onClick: () => setShowDrawer(false) }, ic(IC.close))
        ),

        // Search Bar for Saved Music
        drawerTab === "saved" && h("div", { className: "cl-drawer-search" },
          h("input", {
            type: "text",
            className: "cl-apple-input",
            placeholder: "Search Liked Songs…",
            value: savedSearch,
            onChange: (e) => setSavedSearch(e.target.value)
          })
        ),

        // Tracks List
        h("div", { className: "cl-track-list" },
          drawerTab === "queue"
            ? (queueList.length === 0
                ? h("div", { style: { padding: 24, textAlign: "center", opacity: 0.6 } }, "Queue is empty")
                : queueList.map((tr, idx) =>
                    h("div", { key: tr.uri + ":" + idx, className: "cl-track-item", onClick: () => playSong(tr.uri) },
                      tr.image && h("img", { src: tr.image, className: "cl-track-thumb" }),
                      h("div", { className: "cl-track-info" },
                        h("div", { className: "cl-track-title" }, tr.name),
                        h("div", { className: "cl-track-artist" }, tr.artist)
                      ),
                      h("div", { className: "cl-track-dur" }, fmt(tr.duration))
                    )
                  )
              )
            : (filteredSaved.length === 0
                ? h("div", { style: { padding: 24, textAlign: "center", opacity: 0.6 } }, "No saved songs found")
                : filteredSaved.map((tr, idx) =>
                    h("div", { key: tr.uri + ":" + idx, className: "cl-track-item", onClick: () => playSong(tr.uri) },
                      tr.image && h("img", { src: tr.image, className: "cl-track-thumb" }),
                      h("div", { className: "cl-track-info" },
                        h("div", { className: "cl-track-title" }, tr.name),
                        h("div", { className: "cl-track-artist" }, tr.artist)
                      ),
                      h("div", { className: "cl-track-dur" }, fmt(tr.duration))
                    )
                  )
              )
        )
      )
    )
  );
}

function render() {
  return Spicetify.React.createElement(ConstellationApp);
}
