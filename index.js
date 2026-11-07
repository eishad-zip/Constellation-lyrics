// Constellation Lyrics v3: each lyric word becomes a star; lines link them into a constellation.
const CL_KEY = "constellation-lyrics:cfg";
const CL_COLORS = { gold: [255, 205, 60], white: [255, 255, 255], pink: [255, 120, 190], cyan: [80, 220, 255],
  violet: [176, 140, 255], green: [100, 240, 160], red: [255, 95, 95], orange: [255, 150, 50] };
const CL_KINDS = { mix: ["sparkle", "cross", "shuriken", "burst", "heart", "orbit", "sparkle"], sparkle: ["sparkle"],
  cross: ["cross"], shuriken: ["shuriken"], y2k: ["burst", "heart", "orbit", "sparkle"] };
const CL_CACHE = new Map();
// ---- Keyword highlights: pick the most meaningful word of each line, pop it with a random animation + a vector icon ----
const STY = ["marker", "pop", "glitch", "slide", "letters", "stamp", "neon", "wave"];
const ICON_GENERIC = ["star", "heart", "bolt", "smile", "flower", "wing", "note", "diamond", "sun", "moon"];
const ICON_RX = [["heart", "love|loves|loved|heart|baby|babe|darling|honey|crush|lover"], ["broken", "broke|break|broken|hurt|pain|lost|alone|goodbye|apart|sorry"],
  ["fire", "fire|burn|burning|hot|flame|lit|smoke|desire|heat"], ["star", "star|stars|shine|shining|light|bright|glow|spark|sparkle"], ["moon", "moon|night|nights|dark|midnight|dream|dreams|sleep|tonight"],
  ["sun", "sun|day|days|morning|summer|gold|golden|warm|sunshine"], ["skull", "die|dying|dead|death|kill|hell|devil|grave|ghost"], ["eye", "eye|eyes|see|look|watch|stare|vision|seen"],
  ["crown", "queen|king|crown|royal|boss|top|number|champion"], ["drop", "cry|crying|tears|tear|rain|blue|water|drown|ocean"], ["bolt", "crazy|wild|electric|thunder|lightning|rush|fast|energy|shock"],
  ["note", "song|songs|sing|music|dance|dancing|melody|radio|beat|voice"], ["clock", "time|hour|hours|forever|always|never|clock|year|years|ever|again|\\d+"],
  ["diamond", "diamond|diamonds|ice|money|rich|cash|gem|pearl|price|pay"], ["smile", "girl|boy|smile|happy|laugh|fun|friend|good|yeah"], ["flower", "flower|flowers|rose|roses|bloom|spring|garden|petal|sweet"],
  ["wing", "free|fly|flying|wings|angel|heaven|sky|high|float|freedom"], ["wave", "loud|sound|scream|hear|echo|noise|whisper|talk|call"], ["person", "us|someone|body|man|woman|human|stranger|everybody"],
  ["cross", "god|pray|lord|faith|holy|soul|church|jesus|forgive|sin|bless"]].map(([n, p]) => [n, new RegExp("^(?:" + p + ")$")]);
const STOP = new Set("the a an and or but of to in on at for with from by is are was were be been am i me my you your we our they their he she it its this that these those so as if then than not no do does did just oh ooh uh la na ah hey got get cause cuz gonna wanna im ill ive id dont cant wont aint all can will would could up down out into over".split(" "));
const cleanW = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, "").replace(/'s$/, "");
function pickKey(words, freq, rnd) {
  let best = -1, bs = -9, icon = null;
  words.forEach((w, k) => {
    const c = cleanW(w); if (!c) return; const ic = ICON_RX.find(([, rx]) => rx.test(c));
    let s = STOP.has(c) ? -5 : 0; if (ic) s += 3; if (/\d/.test(c)) s += 4; if (/[?!]$/.test(w)) s += 1.5; if (c.length >= 5) s += 1; if (k && /^[A-Z]/.test(w)) s += 1;
    s += Math.min(2, (freq[c] || 0) / 3) + (k === words.length - 1 ? 0.8 : 0) + rnd() * 0.3;
    if (s > bs) { bs = s; best = k; icon = ic ? ic[0] : null; }
  });
  if (bs < -1) return { kw: -1, icon: null };
  if (!icon) { const m = words.map((w) => ICON_RX.find(([, rx]) => rx.test(cleanW(w)))).find(Boolean); icon = m ? m[0] : ICON_GENERIC[Math.floor(rnd() * ICON_GENERIC.length)]; }
  return { kw: best, icon };
}
// Vector icons drawn with canvas paths (filled with the current fillStyle)
function ico(c, n, x, y, r) {
  c.save(); c.translate(x, y); c.lineCap = c.lineJoin = "round"; const P = () => c.beginPath(), out = () => (c.globalCompositeOperation = "destination-out");
  const poly = (pts) => { P(); pts.forEach(([a, b], i) => (i ? c.lineTo(a * r, b * r) : c.moveTo(a * r, b * r))); c.closePath(); c.fill(); };
  if (n === "heart") shape(c, "heart", 0, 0, r * 1.15, 0);
  else if (n === "broken") { shape(c, "heart", 0, 0, r * 1.15, 0); out(); c.lineWidth = r * 0.2; P(); c.moveTo(r * 0.1, -r * 0.6); c.lineTo(-r * 0.2, -r * 0.1); c.lineTo(r * 0.2, r * 0.2); c.lineTo(-r * 0.1, r * 0.8); c.stroke(); }
  else if (n === "star") { P(); for (let i = 0; i < 10; i++) { const q = i % 2 ? r * 0.45 : r * 1.1, a = -Math.PI / 2 + (i * Math.PI) / 5; c.lineTo(Math.cos(a) * q, Math.sin(a) * q); } c.closePath(); c.fill(); }
  else if (n === "fire") { P(); c.moveTo(0, -r * 1.1); c.bezierCurveTo(r * 0.2, -r * 0.5, r * 0.9, -r * 0.1, r * 0.8, r * 0.35); c.bezierCurveTo(r * 0.7, r * 0.85, r * 0.2, r * 1.05, 0, r * 1.05); c.bezierCurveTo(-r * 0.2, r * 1.05, -r * 0.8, r * 0.85, -r * 0.8, r * 0.3); c.bezierCurveTo(-r * 0.8, -r * 0.1, -r * 0.3, -r * 0.2, 0, -r * 1.1); c.fill(); out(); P(); c.ellipse(0, r * 0.55, r * 0.3, r * 0.38, 0, 0, 7); c.fill(); }
  else if (n === "moon") { P(); c.arc(0, 0, r, 0, 7); c.arc(r * 0.4, -r * 0.15, r * 0.78, 0, 7); c.fill("evenodd"); }
  else if (n === "sun") { P(); c.arc(0, 0, r * 0.5, 0, 7); c.fill(); c.strokeStyle = c.fillStyle; c.lineWidth = r * 0.18; for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; P(); c.moveTo(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78); c.lineTo(Math.cos(a) * r * 1.1, Math.sin(a) * r * 1.1); c.stroke(); } }
  else if (n === "skull") { P(); c.arc(0, -r * 0.15, r * 0.85, 0, 7); c.fill(); c.fillRect(-r * 0.45, r * 0.4, r * 0.9, r * 0.6); out(); P(); c.arc(-r * 0.32, -r * 0.1, r * 0.22, 0, 7); c.arc(r * 0.32, -r * 0.1, r * 0.22, 0, 7); c.fill(); }
  else if (n === "eye") { P(); c.moveTo(-r * 1.2, 0); c.quadraticCurveTo(0, -r * 1.1, r * 1.2, 0); c.quadraticCurveTo(0, r * 1.1, -r * 1.2, 0); c.fill(); out(); P(); c.arc(0, 0, r * 0.42, 0, 7); c.fill(); c.globalCompositeOperation = "source-over"; P(); c.arc(0, 0, r * 0.2, 0, 7); c.fill(); }
  else if (n === "crown") poly([[-1, 0.7], [-1, -0.5], [-0.5, 0.1], [0, -0.8], [0.5, 0.1], [1, -0.5], [1, 0.7]]);
  else if (n === "drop") { P(); c.moveTo(0, -r * 1.1); c.bezierCurveTo(r * 0.3, -r * 0.5, r * 0.85, 0, r * 0.85, r * 0.45); c.arc(0, r * 0.45, r * 0.85, 0, Math.PI); c.bezierCurveTo(-r * 0.85, 0, -r * 0.3, -r * 0.5, 0, -r * 1.1); c.fill(); }
  else if (n === "bolt") poly([[0.2, -1], [-0.6, 0.15], [-0.05, 0.15], [-0.25, 1], [0.6, -0.2], [0.05, -0.2]]);
  else if (n === "note") { P(); c.ellipse(-r * 0.35, r * 0.6, r * 0.55, r * 0.4, -0.4, 0, 7); c.fill(); c.fillRect(r * 0.12, -r * 0.9, r * 0.2, r * 1.55); P(); c.moveTo(r * 0.32, -r * 0.9); c.quadraticCurveTo(r * 1.1, -r * 0.6, r * 0.9, -r * 0.05); c.quadraticCurveTo(r * 0.8, -r * 0.4, r * 0.32, -r * 0.4); c.fill(); }
  else if (n === "clock") { P(); c.arc(0, 0, r, 0, 7); c.fill(); out(); c.lineWidth = r * 0.18; P(); c.moveTo(0, -r * 0.55); c.lineTo(0, 0); c.lineTo(r * 0.4, r * 0.25); c.stroke(); }
  else if (n === "diamond") { poly([[-1, -0.3], [-0.5, -0.8], [0.5, -0.8], [1, -0.3], [0, 1]]); out(); c.lineWidth = r * 0.1; P(); c.moveTo(-r, -r * 0.3); c.lineTo(r, -r * 0.3); c.stroke(); }
  else if (n === "smile") { P(); c.arc(0, 0, r, 0, 7); c.fill(); out(); P(); c.arc(-r * 0.35, -r * 0.2, r * 0.14, 0, 7); c.arc(r * 0.35, -r * 0.2, r * 0.14, 0, 7); c.fill(); c.lineWidth = r * 0.14; P(); c.arc(0, r * 0.05, r * 0.55, 0.2, Math.PI - 0.2); c.stroke(); }
  else if (n === "flower") { for (let i = 0; i < 5; i++) { const a = (i * 2 * Math.PI) / 5; P(); c.arc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.45, 0, 7); c.fill(); } out(); P(); c.arc(0, 0, r * 0.22, 0, 7); c.fill(); }
  else if (n === "wing") { [[-1, -0.5], [1, 0.5]].forEach(([s, a]) => { P(); c.ellipse(s * r * 0.55, -r * 0.2, r * 0.55, r * 0.8, a, 0, 7); c.fill(); P(); c.ellipse(s * r * 0.4, r * 0.5, r * 0.4, r * 0.5, -a * 0.8, 0, 7); c.fill(); }); c.fillRect(-r * 0.07, -r * 0.7, r * 0.14, r * 1.5); }
  else if (n === "wave") { c.strokeStyle = c.fillStyle; c.lineWidth = r * 0.2; for (let i = 1; i <= 3; i++) { P(); c.arc(-r * 0.7, 0, r * i * 0.5, -0.8, 0.8); c.stroke(); } P(); c.arc(-r * 0.7, 0, r * 0.24, 0, 7); c.fill(); }
  else if (n === "person") { P(); c.arc(0, -r * 0.45, r * 0.4, 0, 7); c.fill(); P(); c.arc(0, r * 0.95, r * 0.85, Math.PI, 0); c.fill(); }
  else if (n === "cross") shape(c, "cross", 0, 0, r, 0);
  else sparkle(c, 0, 0, r);
  c.restore();
}
function hero(c, css, C, L, x, y, a, now, al, W, S) {
  let st = C.hl === "random" ? (S.th ? S.th.hl[L.seed % S.th.hl.length] : L.sty) : C.hl, word = L.words[L.kw], size = C.font * 56, bk = (t) => { t = clamp(t) - 1; return t * t * (2.70158 * t + 1.70158) + 1; };
  if (RTL_RX.test(word) && (st === "letters" || st === "wave")) st = "pop"; c.save(); c.font = `800 ${size}px ${S.ff}`; c.textAlign = "center"; c.textBaseline = "middle";
  const w = c.measureText(word).width, iw = C.icons ? size * 0.95 : 0, tot = w + iw, gx = Math.min(W - tot / 2 - 14, Math.max(tot / 2 + 14, x));
  const tx = gx - L.side * iw / 2, ty = y + size * 0.8 + Math.sin(now / 700 + L.seed) * 2, e = ease(clamp(a / 0.5));
  c.globalAlpha = clamp(al); c.fillStyle = css(1); c.shadowColor = css(0.9); c.shadowBlur = C.tglow; c.translate(tx, ty);
  if (!L.bd) { L.bd = 1; S.sparks = S.sparks || []; for (let i = 0; i < 16; i++) { const an = Math.random() * 6.283, sp = 60 + Math.random() * 160;
    S.sparks.push({ x: tx, y: ty, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 40, life: 0.9 + Math.random() * 0.6, max: 1.5, r: 3 + Math.random() * 4, k: ["sparkle", "cross", "burst", "heart", "shuriken"][i % 5] }); } }
  if (a < 0.9) { const gr = c.createRadialGradient(0, 0, 0, 0, 0, size * 2.2); gr.addColorStop(0, css(0.35 * (1 - a / 0.9))); gr.addColorStop(1, css(0)); c.shadowBlur = 0; c.fillStyle = gr; c.fillRect(-size * 2.2, -size * 2.2, size * 4.4, size * 4.4); c.fillStyle = css(1); c.shadowBlur = C.tglow; }
  c.save();
  if (st === "marker") { const p = ease(clamp(a / 0.45)), bw = w + size * 0.5, bh = size * 0.95; c.rotate(-0.035); c.shadowBlur = 0; c.fillRect(-bw / 2, -bh / 2, bw * p, bh); c.fillStyle = `rgba(12,12,12,${clamp(p * 1.6 - 0.3)})`; c.fillText(word, 0, 0); }
  else if (st === "pop") { const s = bk(a / 0.55); c.scale(s, s); c.rotate((1 - clamp(a / 0.55)) * -0.35); c.fillText(word, 0, 0); }
  else if (st === "glitch") {
    const g = Math.max((1 - clamp(a / 0.8)) ** 2, a > 1 && a % 3.5 < 0.22 ? 0.45 : 0), n = 7, sh = (size * 1.2) / n, fl = g > 0.05 ? Math.floor(now / 90) : 0;
    for (let i = 0; i < n; i++) { c.save(); c.beginPath(); c.rect(-w, -size * 0.6 + i * sh, w * 2, sh); c.clip(); c.fillText(word, Math.sin(i * 91.3 + L.seed + fl) * size * 0.6 * g, 0); c.restore(); }
  } else if (st === "slide") { c.beginPath(); c.rect(-w / 2 - 8, -size * 0.6, w + 16, size * 1.2); c.clip(); c.translate(0, (1 - e) * size * 1.1); c.fillText(word, 0, 0); }
  else if (st === "letters") { let xx = -w / 2; gr(word).forEach((ch, i) => { const cw = c.measureText(ch).width, q = clamp((a - i * 0.05) / 0.45), p = bk(q);
    c.save(); c.translate(xx + cw / 2, (1 - q) * -size * 0.7); c.scale(p, p); c.rotate((1 - q) * (i % 2 ? 0.6 : -0.6)); c.fillText(ch, 0, 0); c.restore(); xx += cw; }); }
  else if (st === "neon") { const fl = a < 0.9 ? (Math.sin(a * 60) > -0.2 || a > 0.6 ? 1 : 0.15) : 1; c.globalAlpha = clamp(al * fl); c.shadowBlur = C.tglow * 2 + 10; c.strokeStyle = css(1); c.lineWidth = 2; c.strokeText(word, 0, 0); c.fillStyle = css(0.35); c.fillText(word, 0, 0); }
  else if (st === "wave") { let xx = -w / 2; gr(word).forEach((ch, i) => { const cw = c.measureText(ch).width, q = clamp((a - i * 0.04) / 0.35); c.save(); c.translate(xx + cw / 2, Math.sin(now / 260 + i * 0.7) * size * 0.08 * q); c.scale(ease(q), ease(q)); c.fillText(ch, 0, 0); c.restore(); xx += cw; }); }
  else { const q = clamp(a / 0.25), s = 1 + (1 - ease(q)) * 2.2; if (a < 0.8) { c.strokeStyle = css(0.6 * (1 - a / 0.8)); c.lineWidth = 2; c.beginPath(); c.arc(0, 0, size * (0.6 + a * 2), 0, 7); c.stroke(); }
    c.globalAlpha = clamp(al * ease(q)); if (a > 0.25 && a < 0.6) c.translate(Math.sin(a * 90) * (1 - (a - 0.25) / 0.35) * 4, 0); c.scale(s, s); c.fillText(word, 0, 0); }
  c.restore();
  if (C.icons) { const q = clamp((a - 0.15) / 0.55); c.save(); c.translate(L.side * (w / 2 + iw / 2 + size * 0.1), Math.sin(now / 600 + L.seed) * 3); c.rotate((1 - q) * 0.8 * L.side + Math.sin(now / 800 + L.seed) * 0.08);
    c.scale(bk(q), bk(q)); c.fillStyle = css(1); ico(c, L.icon, 0, 0, size * 0.42); c.restore(); }
  c.restore();
}

const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (t) => 1 - Math.pow(1 - t, 3);
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// ---------- playback clock + word windows (smooth, drift-free sync) ----------
// Spotify reports progress in coarse steps; we predict forward between reports and ease toward each new report so the
// highlight never stutters. A seek, pause or track change snaps straight to the reported time.
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
function wWin(L, WS, k) { const st = WS[k], nx = Math.max(st + 0.001, WS[k + 1] ?? L.t + L.dur), raw = L.we && Number.isFinite(L.we[k]) ? L.we[k] : nx; return [st, Math.min(Math.max(raw, st + 0.001), nx)]; }

// ---------- Flow lyric style: DOM text, letter by letter fill ----------
const FLOW_ANIM = { glow: [3, 0.05, 12], wave: [9, 0.03, 8], pop: [0, 0.3, 10], rise: [0, 0, 10], soft: [0, 0, 6] };
const FLOW_CSS = `
.fl-wrap{position:absolute;inset:0;overflow:hidden;pointer-events:none;font-family:var(--flf,Inter,sans-serif)}
.fl-scroll{position:absolute;left:0;right:0;top:0;padding:0 clamp(22px,7%,140px);will-change:transform}
.fl-line{position:relative;margin:0 0 .55em;font-size:var(--fz,44px);font-weight:800;line-height:1.16;letter-spacing:-.01em;text-align:left;
  transform-origin:0 50%;opacity:var(--o,.4);transform:scale(var(--s,.94));filter:blur(calc(var(--b,0)*1px));
  transition:opacity .6s cubic-bezier(.22,1,.36,1),transform .7s cubic-bezier(.22,1,.36,1),filter .6s cubic-bezier(.22,1,.36,1)}
.fl-al-center .fl-line{text-align:center;transform-origin:50% 50%}
.fl-line.hid{visibility:hidden}
.fl-w{display:inline-block;white-space:nowrap}
.fl-w.cw{filter:drop-shadow(0 0 calc(var(--gr,0)*1px) rgba(255,255,255,.65))}
.fl-l{display:inline-block;position:relative;color:var(--lo,rgba(255,255,255,.42));white-space:pre}
.fl-l::after{content:attr(data-c);position:absolute;left:0;top:0;color:var(--hi,#fff);opacity:0;transition:opacity .55s ease;
  -webkit-mask-image:linear-gradient(90deg,#000 calc(var(--p,0)*140% - 40%),transparent calc(var(--p,0)*140%));mask-image:linear-gradient(90deg,#000 calc(var(--p,0)*140% - 40%),transparent calc(var(--p,0)*140%))}
.fl-line.act .fl-l{will-change:transform;transform:translate3d(0,calc(var(--g,0)*var(--lift,3)*-1px),0) scale(calc(1 + var(--g,0)*var(--pop,.05)))}
.fl-line.act .fl-l::after{opacity:1}
.fl-a-rise .fl-line.act .fl-l{transform:translate3d(0,calc((1 - var(--p,0))*var(--rs,8)*1px),0)}
.fl-tr{font-size:.38em;font-weight:500;margin-top:.35em;color:rgba(255,255,255,.55);letter-spacing:0}
`;
try { document.getElementById("fl-css")?.remove(); const st = document.createElement("style"); st.id = "fl-css"; st.textContent = FLOW_CSS; document.head.appendChild(st); } catch {}
const flSeg = (() => { try { return new Intl.Segmenter(undefined, { granularity: "grapheme" }); } catch { return null; } })();
// cursive / joined scripts must not be cut up per letter, so they animate as one unit
const flUnits = (w) => (/[֐-ࣿיִ-﷿ﹰ-﻿]/.test(w) ? [w] : flSeg ? Array.from(flSeg.segment(w), (s) => s.segment) : Array.from(w));

function loadCfg() {
  const d = { bg: "animated", color: "adaptive", custom: "#ffffff", edge: true, snap: true, alpha: 1, fade: 0.55, tglow: 18,
    dim: 0.4, font: 1, kinds: "mix", ctrl: "right", src: "auto", hl: "random", icons: true, prox: "mix", tr: "auto", auto: true, link: "comet", follow: true, maxHold: 1, trav: 1, bhq: 384, theme: "auto", themeForce: "auto", thFx: 1, cam: "chorus", camZ: 1.7, camSpd: 1, camBg: 0.5, camKick: 0.6, camRoll: 1, camVig: true, edgeMode: "progress", fam: "auto", bn: "sans", ar: "naskh", starSize: 1, vis: "ring", visSize: 1, visSpd: 1, visAlways: false, bgSpeed: 1, par: 1, ctrlSize: 1, fps: 60, ana: 2, mxm: "", customUrl: "", edgeW: 2.5, ascSet: "classic", ascSize: 11, ascColor: "cover", ascStyle: "wave", ascAmp: 1, ascReact: 1, ascGlow: 0.5, ascScarf: "red", ascWind: 1, ascFlowers: 7, perfPreset: "auto", dirAuto: true, dirMood: "auto", dirStyle: "auto",
    bright: 1, lyricStyle: "constellation", flowAnim: "glow", flowAlign: "left", flowSize: 1, flowGlow: 1, flowLift: 1, flowSpeed: 1, flowBlur: 1, flowDim: 0.4, flowPos: 0.38, flowTr: true, flowTint: false, flowDust: false };
  try { const sv = JSON.parse(localStorage.getItem(CL_KEY)) || {}, r = { ...d, ...sv }; if (sv.edge === false && !sv.edgeMode) r.edgeMode = "off"; if (r.bg === "g1" || r.bg === "g3") r.bg = "spiral"; return r; } catch { return d; }
}
function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hexToRgb(h) { if (!h) return null; const n = parseInt(h.replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
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
// Shapes: sparkle, christian cross, ninja star, y2k starburst / heart / orbit
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

// Edge light: shooting stars with tails travelling around the screen border
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
// ===== Galaxy scenes (all coloured from the cover palette, colours drift with the music) =====
const GALS = new Set(["classic", "spiral", "g2", "g4", "g5", "galaxy"]);
const mixc = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const cl2 = (S) => S.pal || [[150, 110, 255], [255, 110, 170], [110, 170, 255], [255, 200, 130]];
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
  for (let i = 0; i < 9000; i++) {
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
// Van Gogh stipple: dashed spiral arms + hatching, and hatched planets
function bakeStipple(cs, seed) {
  const N = 1100, R = N / 2, cv = mk(N), g = cv.getContext("2d"), rnd = mulberry(seed), gs = gsr(rnd);
  g.translate(R, R); blob(g, 0, 0, R * 0.32, [255, 240, 215], 0.9);
  for (let i = 0; i < 9000; i++) { const a = Math.floor(rnd() * 2), t = Math.pow(rnd(), 0.9), th = t * 5.5 + a * Math.PI + gs() * 0.35 * (1 - 0.5 * t), r = R * (0.08 + 0.9 * t), col = rnd() < 0.3 ? [255, 245, 225] : cs[Math.floor(rnd() * 3)];
    g.save(); g.translate(Math.cos(th) * r, Math.sin(th) * r); g.rotate(th + Math.PI / 2 + gs() * 0.6); g.fillStyle = `rgba(${col},${0.4 + rnd() * 0.6})`; g.fillRect(-2.5, -0.8, 3.5 + rnd() * 4, 1.6 + rnd() * 0.8); g.restore(); }
  g.strokeStyle = `rgba(${cs[1]},.3)`; g.lineWidth = 1.2;
  for (let i = 0; i < 800; i++) { const r = R * (0.2 + 0.75 * rnd()), an = rnd() * 6.283, x = Math.cos(an) * r, y = Math.sin(an) * r; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 7, y + 11); g.stroke(); }
  return cv;
}
function bakePlanet(cs, seed) {
  const N = 160, cv = mk(N), g = cv.getContext("2d"), rnd = mulberry(seed);
  g.beginPath(); g.arc(80, 80, 78, 0, 7); g.clip(); g.fillStyle = `rgb(${cs[0]})`; g.fillRect(0, 0, N, N); g.lineCap = "round";
  for (let i = 0; i < 110; i++) { g.strokeStyle = `rgba(${rnd() < 0.5 ? cs[1] : cs[2]},${0.3 + rnd() * 0.5})`; g.lineWidth = 1 + rnd() * 2.5; const x = rnd() * N, y = rnd() * N; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 15, y + 8, x + 30 * (rnd() - 0.3), y + 20); g.stroke(); }
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * 0.5})`; g.fillRect(rnd() * N, rnd() * N, 1.5, 1.5); }
  return cv;
}
// Two colour variants of every baked texture; they cross-fade so colours drift with the music
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
// Depth starfield you drift through (some stars have diffraction spikes) + beat-triggered shooting stars
function fx(c, W, H, S, now, dt, prox, warp, ox, oy, n = 240) {
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
  S.met = S.met || [];
  if (S.pulse > 0.85 && now - (S.lastMet || 0) > 900 && Math.random() < 0.3) { S.lastMet = now; const a = Math.random() * 0.6 + 0.3;
    S.met.push({ x: Math.random() * W, y: Math.random() * H * 0.5, vx: Math.cos(a) * 700 * (Math.random() < 0.5 ? 1 : -1), vy: Math.sin(a) * 700, life: 0.8 }); }
  S.met = S.met.filter((m) => { m.life -= dt; m.x += m.vx * dt; m.y += m.vy * dt; const tx = m.x - m.vx * 0.12, ty = m.y - m.vy * 0.12, g = c.createLinearGradient(m.x, m.y, tx, ty);
    g.addColorStop(0, `rgba(255,255,255,${clamp(m.life * 1.5)})`); g.addColorStop(1, "rgba(255,255,255,0)"); c.strokeStyle = g; c.lineWidth = 1.6; c.beginPath(); c.moveTo(m.x, m.y); c.lineTo(tx, ty); c.stroke(); return m.life > 0; });
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
  if (!S.gx) S.gx = Array.from({ length: 170 }, () => ({ born: -1e9, life: 1, r: 1 }));
  const tints = ["255,255,255", `${mixc(p[0], [255, 255, 255], 0.6)}`, `${mixc(p[1], [255, 255, 255], 0.6)}`];
  S.gx.forEach((s, i) => {
    let age = (now - s.born) / s.life;
    if (age > 1) { const t = Math.random(), n = (Math.random() + Math.random() + Math.random() - 1.5) * 0.3 * Math.min(W, H), d = n > 0 ? 1 : -1;
      s.life = 3500 + Math.random() * 4500; s.born = now - (s.init ? 0 : Math.random() * s.life); s.init = 1;
      Object.assign(s, { x: W * (0.05 + 0.9 * t) + n * 0.707, y: H * (0.95 - 0.9 * t) + n * 0.707, vx: d * 0.707 * (4 + Math.random() * 8), vy: d * 0.707 * (4 + Math.random() * 8), r: 0.8 + Math.random() * 2, ph: Math.random() * 6.28 }); age = (now - s.born) / s.life; }
    s.x += s.vx * dt; s.y += s.vy * dt;
    const pop = clamp(age / 0.18), sc = ease(pop) * (1 + 0.5 * Math.sin(pop * Math.PI)), f = prox(s.x, s.y, 150), [x, y] = warp(s.x, s.y, f);
    const a = Math.sin(Math.PI * clamp(age)) ** 1.4 * (0.55 + 0.45 * Math.sin(tt * 2 + s.ph)) + f * 0.5; c.fillStyle = `rgba(${tints[i % 3]},${clamp(a)})`; const r = s.r * sc * (1 + f * 1.5);
    if (s.r > 1.7) sparkle(c, x, y, r * 2.6); else { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
  });
}
function drawSpiral(c, W, H, S, now, dt, prox, warp) {
  dual(S, "sp", (cs, sd) => bakeGalaxy(cs[0], cs[1], cs[2], sd)); c.fillStyle = dark(cl2(S)[1], 0.07); c.fillRect(0, 0, W, H);
  S.grot = (S.grot || 0) + dt * (0.01 + 0.035 * S.en); const [ox, oy] = parallax(S, W, H);
  texDraw(c, S, "sp", now, W / 2 + ox, H / 2 + oy, Math.max(W, H) * 1.4, [-0.5, S.grot], 0.62);
  c.save(); c.globalCompositeOperation = "lighter"; blob(c, W / 2 + ox, H / 2 + oy, Math.min(W, H) * 0.35, live(S, now), 0.06 + 0.2 * S.en + 0.12 * S.pulse); c.restore();
  fx(c, W, H, S, now, dt, prox, warp, ox, oy);
}
// Black hole: per-pixel thin-disc render (primary image + lensed secondary image over the shadow, photon ring, Doppler beaming,
// differential rotation). Geometry and the streak texture are baked once; each frame is a typed-array lookup (fast, smooth).
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
  const C = S.cfg, p = cl2(S), N = perfEff(S).bhq, key = (S.galVer || 0) + ":" + S.seed;
  if (S.bhN !== N) { S.bhN = N; S.bhGeo = bhGeo(N); S.bhCv = mk(N); S.bhCtx = S.bhCv.getContext("2d"); S.bhImg = S.bhCtx.createImageData(N, N); S.bhU32 = new Uint32Array(S.bhImg.data.buffer); S.bhSh = new Int32Array(256); S.bhBl = mk(64); S.bhK = null; }
  if (S.bhK !== key) { S.bhK = key; S.bhTex = bhPolar(mixc(p[0], [255, 255, 255], 0.25), p[1], S.seed || 7); S.bhT = now; }
  const fin = clamp((now - S.bhT) / 1400), [ox, oy] = parallax(S, W, H, 0.02), cx = W / 2 + ox, cy = H / 2 + oy, Rs = Math.min(W, H) * 0.1, size = Rs * 16, E = Rs * 1.25, lc = live(S, now);
  c.fillStyle = "#010103"; c.fillRect(0, 0, W, H);
  c.save(); c.globalCompositeOperation = "lighter"; blob(c, cx, cy, Rs * 9, lc, 0.05 + 0.1 * S.en); c.restore();
  const lens = (x, y, f) => { const [wx, wy] = warp(x, y, f), dx = wx - cx, dy = wy - cy, d = Math.hypot(dx, dy) || 1, r2 = 0.5 * (d + Math.sqrt(d * d + 4 * E * E)); return [cx + (dx / d) * r2, cy + (dy / d) * r2]; };
  fx(c, W, H, S, now, dt, prox, lens, ox, oy, 260);
  S.bhRot = (S.bhRot || 0) + dt * (0.1 + 0.45 * S.en); bhRender(S, S.bhRot, 0.8 + 0.5 * S.en + 0.3 * S.pulse);
  c.save(); c.globalCompositeOperation = "lighter"; c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high"; c.globalAlpha = fin;
  c.drawImage(S.bhCv, cx - size / 2, cy - size / 2, size, size);
  S.bhBl.getContext("2d").drawImage(S.bhCv, 0, 0, 64, 64); c.globalAlpha = 0.65 * fin; c.drawImage(S.bhBl, cx - size * 0.75, cy - size * 0.75, size * 1.5, size * 1.5);
  c.globalAlpha = 1; const sg = c.createLinearGradient(0, cy - H * 0.45, 0, cy + H * 0.45); sg.addColorStop(0, "rgba(255,255,255,0)"); sg.addColorStop(0.5, `rgba(255,255,255,${0.35 + 0.4 * S.pulse})`); sg.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = sg; c.fillRect(cx - 0.8, cy - H * 0.45, 1.6, H * 0.9); c.restore();
}
// Van Gogh 1: starry-night flow field of brush strokes, ringed stars, crescent moon
function drawVG1(c, W, H, S, now, dt, prox, warp) {
  const p = cl2(S), t = now / 1000; c.fillStyle = `rgb(${p[1].map((v, i) => ((v * 0.22 + [8, 14, 40][i] * 0.8) | 0))})`; c.fillRect(0, 0, W, H);
  if (!S.vg || S.vg.w !== W) S.vg = { w: W, p: Array.from({ length: 900 }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, k: i % 4, ph: Math.random() * 6.28 })) };
  const C1 = [W * 0.3, H * 0.48, 1], C2 = [W * 0.72, H * 0.36, -1]; c.lineCap = "round"; c.lineWidth = 3.4;
  S.vg.p.forEach((q) => {
    let vx = Math.cos(q.y * 0.012 + t * 0.3) * 0.5, vy = Math.sin(q.x * 0.01 + t * 0.25) * 0.5;
    [C1, C2].forEach(([cx, cy, dir]) => { const dx = q.x - cx, dy = q.y - cy, d = Math.hypot(dx, dy) + 40, w = Math.min(1.6, 220 / d); vx += (-dy / d) * w * dir; vy += (dx / d) * w * dir; });
    const m = Math.hypot(vx, vy) || 1, sp = (38 + 80 * S.en) * dt; q.x += (vx / m) * sp; q.y += (vy / m) * sp;
    if (q.x < -20 || q.x > W + 20 || q.y < -20 || q.y > H + 20) { q.x = Math.random() * W; q.y = Math.random() * H; return; }
    const f = prox(q.x, q.y, 150), [x, y] = warp(q.x, q.y, f), col = mixc(p[q.k], [255, 255, 255], 0.25 + 0.2 * Math.sin(t + q.ph));
    c.strokeStyle = `rgba(${col},${clamp(0.5 + 0.3 * Math.sin(t * 1.3 + q.ph) + f * 0.3)})`; c.beginPath(); c.moveTo(x, y); c.lineTo(x - (vx / m) * 15, y - (vy / m) * 15); c.stroke();
  });
  const warm = mixc([255, 225, 130], p[3], 0.3);
  [[0.12, 0.2], [0.34, 0.12], [0.55, 0.22], [0.82, 0.14], [0.9, 0.55], [0.45, 0.72], [0.18, 0.82], [0.68, 0.8]].forEach(([sx, sy], i) => {
    const x = sx * W, y = sy * H, r = Math.min(W, H) * (0.018 + 0.006 * (i % 3)) * (1 + 0.25 * S.en); blob(c, x, y, r * 4.5, warm, 0.55);
    c.strokeStyle = `rgba(${warm},.8)`; c.lineWidth = 2; [1.4, 2.1, 2.8].forEach((m, k) => { c.globalAlpha = 0.6 - k * 0.15; c.beginPath(); c.arc(x, y, r * m * (1 + 0.05 * Math.sin(t * 2 + i + k)), 0, 7); c.stroke(); });
    c.globalAlpha = 1; c.fillStyle = "rgb(255,244,200)"; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  });
  c.fillStyle = `rgb(${warm})`; c.beginPath(); c.arc(W * 0.93, H * 0.14, Math.min(W, H) * 0.06, 0, 7); c.arc(W * 0.93 + Math.min(W, H) * 0.03, H * 0.14 - 4, Math.min(W, H) * 0.05, 0, 7); c.fill("evenodd");
}
// Van Gogh 2: stippled dashed spiral with hatched planets orbiting
function drawVG2(c, W, H, S, now, dt, prox, warp) {
  const t = now / 1000, p = cl2(S); dual(S, "st", bakeStipple);
  if (S.plK !== S.galVer + ":" + S.seed) { S.plK = S.galVer + ":" + S.seed; S.pl = [0, 1, 2, 3, 4, 5, 6].map((i) => ({ im: bakePlanet([p[i % 4], p[(i + 1) % 4], mixc(p[(i + 2) % 4], [255, 255, 255], 0.3)], (S.seed || 7) + i), a: i * 0.9, rx: 0.28 + 0.05 * i, ry: 0.2 + 0.04 * i, v: 0.04 + 0.015 * ((i * 7) % 5), s: 34 + ((i * 23) % 40) })); }
  c.fillStyle = "rgb(8,10,16)"; c.fillRect(0, 0, W, H); S.grot = (S.grot || 0) + dt * (0.03 + 0.06 * S.en);
  texDraw(c, S, "st", now, W / 2, H / 2, Math.min(W, H) * 1.5, [0, S.grot], 0.88);
  S.pl.forEach((o) => { const a = o.a + t * o.v, x = W / 2 + Math.cos(a) * o.rx * W * 1.3, y = H / 2 + Math.sin(a) * o.ry * H * 1.3, f = prox(x, y, 160), [wx, wy] = warp(x, y, f), sz = o.s * (1 + f * 0.5) * (Math.min(W, H) / 700 + 0.4);
    c.save(); c.translate(wx, wy); c.rotate(t * 0.1 + o.a); c.drawImage(o.im, -sz, -sz, sz * 2, sz * 2); c.restore(); });
  fx(c, W, H, S, now, dt, prox, warp, 0, 0, 140);
}
function drawGal(c, W, H, S, now, dt, prox, warp) {
  ({ classic: drawClassic, spiral: drawSpiral, galaxy: drawSpiral, g2: drawBH, g4: drawVG1, g5: drawVG2 }[S.cfg.bg] || drawSpiral)(c, W, H, S, now, dt, prox, warp);
}

// ===== Artist themes (generated per artist: palette, silhouette, particles, runes... all seeded from the artist name) =====
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
  return { id, ...t, seed, pal: t.pal.map((c, i) => mixc(c, o.pal[i], 0.22 * r())) };   // each artist gets a slightly different palette
}
function pickTheme(artist, mode, force) {
  if (mode === "off") return null;
  if (force && force !== "auto") return mkTheme(force, artist);
  const m = ARTIST_THEME.find(([rx]) => rx.test(artist || "")); if (m) return mkTheme(m[1], artist);
  return mode === "always" ? mkTheme(Object.keys(THEMES)[hashStr(artist || "x") % Object.keys(THEMES).length], artist) : null;
}
function bakeSil(W, H, seed, layer) {
  const cv = document.createElement("canvas"); cv.width = W; cv.height = Math.ceil(H * 0.4); const g = cv.getContext("2d"), rnd = mulberry(seed + layer * 31), h0 = cv.height;
  g.fillStyle = "#000"; g.beginPath(); g.moveTo(0, h0); let x = 0;
  while (x < W) { const w = 8 + rnd() * 22, hh = h0 * (0.25 + 0.5 * rnd() * (layer ? 1 : 0.7)); g.lineTo(x, h0 - hh * 0.35); g.lineTo(x + w / 2, h0 - hh); g.lineTo(x + w, h0 - hh * 0.35); x += w * 0.8;
    if (rnd() < 0.04) { const tw = 26 + rnd() * 24, th = h0 * (0.6 + 0.3 * rnd()); g.lineTo(x, h0 - th * 0.5); g.lineTo(x, h0 - th); g.lineTo(x + tw / 2, h0 - th - 40); g.lineTo(x + tw, h0 - th); g.lineTo(x + tw, h0 - th * 0.5); x += tw; } }
  g.lineTo(W, h0); g.closePath(); g.fill(); return cv;
}
function sceneFantasy(c, W, H, S, now, dt, prox, warp) {
  const th = S.th, p = th.pal, t = now / 1000, fxk = S.cfg.thFx, g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, dark(mixc(p[3], p[0], 0.2), 0.9)); g.addColorStop(0.6, dark(p[3], 0.55)); g.addColorStop(1, "#02020a"); c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (!S.ths || S.ths.w !== W || S.ths.sd !== th.seed) { const r = mulberry(th.seed); S.ths = { w: W, sd: th.seed, st: Array.from({ length: 120 }, () => [r() * W, r() * H * 0.65, r() * 6.28]), sil: [bakeSil(W, H, th.seed, 0), bakeSil(W, H, th.seed, 1)],
    pt: Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, ph: Math.random() * 6.28, v: 6 + Math.random() * 14, k: Math.random() < 0.5 })) }; }
  c.fillStyle = "#fff"; S.ths.st.forEach(([x, y, ph]) => { c.globalAlpha = 0.2 + 0.5 * (0.5 + 0.5 * Math.sin(t * 1.5 + ph)); c.fillRect(x, y, 1.4, 1.4); }); c.globalAlpha = 1;
  const mx = W * 0.74 + Math.sin(t * 0.03) * W * 0.01, my = H * 0.26, mr = Math.min(W, H) * 0.1; blob(c, mx, my, mr * 4.5, mixc(p[2], [255, 255, 255], 0.4), 0.28 + 0.1 * S.en);
  c.fillStyle = `rgb(${mixc(p[2], [255, 255, 255], 0.75)})`; c.beginPath(); c.arc(mx, my, mr, 0, 7); c.fill();
  c.fillStyle = "rgba(60,60,90,.18)"; [[-0.3, -0.2, 0.25], [0.25, 0.1, 0.18], [-0.05, 0.35, 0.12]].forEach(([a, b, r]) => { c.beginPath(); c.arc(mx + a * mr, my + b * mr, r * mr, 0, 7); c.fill(); });
  c.save(); c.globalCompositeOperation = "lighter";
  for (let i = 0; i < 6; i++) blob(c, (((i * 0.37 + t * 0.012 * (1 + (i % 3))) % 1.5) - 0.25) * W, H * (0.45 + 0.4 * ((i * 0.61) % 1)), Math.min(W, H) * (0.4 + 0.15 * Math.sin(i + t * 0.1)), p[i % 2], 0.09 * fxk * (0.8 + 0.5 * S.en)); c.restore();
  const R0 = Math.min(W, H) * 0.34, ra = 0.1 + 0.08 * S.en + 0.25 * S.pulse;
  c.save(); c.translate(W / 2, H * 0.5); c.rotate(t * 0.04); c.strokeStyle = `rgba(${p[0]},${ra})`; c.lineWidth = 1.4; c.shadowColor = `rgb(${p[0]})`; c.shadowBlur = 12;
  [1, 0.93, 0.62].forEach((m) => { c.beginPath(); c.arc(0, 0, R0 * m, 0, 7); c.stroke(); });
  c.fillStyle = `rgba(${p[2]},${ra * 1.5})`; for (let i = 0; i < 24; i++) { const a = (i / 24) * 6.2832; shape(c, "rune", Math.cos(a) * R0 * 0.965, Math.sin(a) * R0 * 0.965, 7, 0, i); }
  c.beginPath(); for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5; c.lineTo(Math.cos(a) * R0 * 0.62, Math.sin(a) * R0 * 0.62); } c.stroke(); c.restore();
  const [pox] = parallax(S, W, H, 0.01); c.globalAlpha = 0.6; c.drawImage(S.ths.sil[0], pox * 0.5, H - S.ths.sil[0].height - H * 0.03); c.globalAlpha = 1;
  S.ths.pt.slice(0, Math.floor(70 * fxk)).forEach((q) => { q.y -= q.v * dt * (1 + S.en); q.x += Math.sin(t + q.ph) * 10 * dt; if (q.y < -10) { q.y = H + 10; q.x = Math.random() * W; }
    const f = prox(q.x, q.y, 150), [x, y] = warp(q.x, q.y, f), col = q.k ? p[2] : p[1]; c.fillStyle = `rgba(${col},${0.5 + 0.4 * Math.sin(t * 2 + q.ph)})`; c.shadowColor = `rgb(${col})`; c.shadowBlur = 10; c.beginPath(); c.arc(x, y, 1.5 + f * 3, 0, 7); c.fill(); });
  c.shadowBlur = 0; c.drawImage(S.ths.sil[1], pox, H - S.ths.sil[1].height);
}
function sceneToxic(c, W, H, S, now, dt, prox, warp) {
  const th = S.th, p = th.pal, t = now / 1000, fxk = S.cfg.thFx; c.fillStyle = dark(p[3], 0.5); c.fillRect(0, 0, W, H);
  c.save(); c.globalCompositeOperation = "lighter"; blob(c, W / 2, H * 1.05, H * 0.95, p[0], 0.22 + 0.2 * S.en); blob(c, W * 0.1, H * 0.1, H * 0.7, p[1], 0.14 + 0.15 * S.pulse);
  for (let i = 0; i < 5; i++) blob(c, (((i * 0.41 + t * 0.015) % 1.4) - 0.2) * W, H * (0.2 + 0.15 * i), Math.min(W, H) * 0.45, p[i % 2], 0.07 * fxk); c.restore();
  if (!S.tx || S.tx.w !== W || S.tx.sd !== th.seed) { const r = mulberry(th.seed), sc = document.createElement("canvas"); sc.width = 4; sc.height = 4; const g = sc.getContext("2d"); g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(0, 0, 4, 1);
    S.tx = { w: W, sd: th.seed, scan: c.createPattern(sc, "repeat"), bars: [], dr: Array.from({ length: 26 }, () => ({ x: r() * W, sp: 40 + r() * 120, off: r() * H * 1.5, len: 40 + r() * 160, k: r() < 0.7 ? 0 : 1 })), hz: Array.from({ length: 8 }, () => ({ x: r() * W, y: r() * H, r: 18 + r() * 26, a: r() * 6.28, v: 0.1 + r() * 0.3 })) }; }
  c.lineCap = "round"; S.tx.dr.slice(0, Math.floor(26 * fxk)).forEach((d) => { const y = (t * d.sp + d.off) % (H * 1.4), g = c.createLinearGradient(d.x, y - d.len, d.x, y), col = p[d.k];
    g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},.55)`); c.strokeStyle = g; c.lineWidth = 2; c.beginPath(); c.moveTo(d.x, y - d.len); c.lineTo(d.x, y); c.stroke(); c.fillStyle = `rgba(${col},.8)`; c.beginPath(); c.arc(d.x, y, 3, 0, 7); c.fill(); });
  S.tx.hz.forEach((q) => { const f = prox(q.x, q.y, 160), [x, y] = warp(q.x, q.y, f); c.fillStyle = `rgba(${p[0]},${0.08 + 0.1 * S.en + f * 0.2})`; shape(c, "hazard", x, y, q.r * (1 + f * 0.4), t * q.v + q.a); });
  if (S.pulse > 0.8 && Math.random() < 0.35) S.tx.bars.push({ y: Math.random() * H, h: 6 + Math.random() * 40, life: 0.16, dx: (Math.random() - 0.5) * 60 });
  const dpr = c.canvas.width / W; S.tx.bars = S.tx.bars.filter((b) => { b.life -= dt; c.drawImage(c.canvas, 0, b.y * dpr, W * dpr, b.h * dpr, b.dx, b.y, W, b.h); c.fillStyle = `rgba(${p[1]},.14)`; c.fillRect(0, b.y, W, b.h); return b.life > 0; });
  const vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, `rgba(${p[1]},${0.28 + 0.3 * S.pulse})`); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  c.fillStyle = S.tx.scan; c.fillRect(0, 0, W, H); c.fillStyle = "rgba(255,255,255,.05)"; for (let i = 0; i < 40; i++) c.fillRect(Math.random() * W, Math.random() * H, 2, 1);
}
function sceneNoir(c, W, H, S, now, dt, prox, warp) {
  const th = S.th, p = th.pal, t = now / 1000, fxk = S.cfg.thFx, g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, dark(p[3], 0.8)); g.addColorStop(1, "#030208"); c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (!S.nx || S.nx.w !== W || S.nx.sd !== th.seed) { const r = mulberry(th.seed); S.nx = { w: W, sd: th.seed, bk: Array.from({ length: 34 }, () => ({ x: r() * W, y: r() * H, r: 20 + r() * 70, k: r() < 0.5 ? 0 : 1, v: 4 + r() * 10, ph: r() * 6.28 })),
    rain: Array.from({ length: 150 }, () => ({ x: r() * W * 1.2, y: r() * H, l: 14 + r() * 20, v: 500 + r() * 500 })), dr: Array.from({ length: 30 }, () => ({ x: r() * W, y: r() * H, r: 2 + r() * 4, v: 4 + r() * 14 })) }; }
  c.save(); c.globalCompositeOperation = "lighter";
  S.nx.bk.forEach((b) => { b.x += b.v * dt; if (b.x > W + 90) b.x = -90; const f = prox(b.x, b.y, 200), [x, y] = warp(b.x, b.y, f); blob(c, x, y, b.r * (1 + f * 0.6), p[b.k], (0.09 + 0.1 * S.en) * (0.7 + 0.3 * Math.sin(t + b.ph)) * fxk); }); c.restore();
  c.strokeStyle = `rgba(${mixc(p[2], [255, 255, 255], 0.5)},.14)`; c.lineWidth = 1; c.beginPath();
  S.nx.rain.slice(0, Math.floor(150 * fxk)).forEach((d) => { d.y += d.v * dt; d.x -= d.v * dt * 0.18; if (d.y > H) { d.y = -d.l; d.x = Math.random() * W * 1.2; } c.moveTo(d.x, d.y); c.lineTo(d.x + d.l * 0.18, d.y - d.l); }); c.stroke();
  S.nx.dr.forEach((d) => { d.y += d.v * dt; if (d.y > H + 10) { d.y = -10; d.x = Math.random() * W; } c.fillStyle = "rgba(255,255,255,.07)"; c.beginPath(); c.ellipse(d.x, d.y, d.r * 0.7, d.r * 1.2, 0, 0, 7); c.fill(); c.strokeStyle = "rgba(255,255,255,.2)"; c.lineWidth = 0.8; c.stroke(); });
  c.fillStyle = "rgba(255,255,255,.06)"; for (let i = 0; i < 50; i++) c.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
  if (S.pulse > 0.9 && Math.random() < 0.08) { c.fillStyle = "rgba(255,255,255,.05)"; c.fillRect(0, 0, W, H); }
}

// ===== Fonts (Google Fonts imported in style.css): English display faces + proper Bangla / Arabic / Urdu faces =====
const BN = { sans: "Noto Sans Bengali", hind: "Hind Siliguri", round: "Baloo Da 2", modern: "Anek Bangla", serif: "Noto Serif Bengali" };
const AR = { naskh: "Noto Naskh Arabic", nastaliq: "Noto Nastaliq Urdu", amiri: "Amiri" };
const fontStack = (C, S) => `"${C.fam === "auto" ? (S.th ? S.th.font : "Inter") : C.fam}", "${BN[C.bn] || BN.sans}", "${AR[C.ar] || AR.naskh}", Inter, "Segoe UI", sans-serif`;
const gr = (w) => (typeof Intl !== "undefined" && Intl.Segmenter ? [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(w)].map((x) => x.segment) : [...w]);   // keeps Bangla conjuncts intact

// ===== More backgrounds =====
const BGX = new Set(["aurora", "synthwave", "waves", "lava"]);
function bgAurora(c, W, H, S, now) {
  const p = cl2(S), t = now / 1000; c.fillStyle = "#03040a"; c.fillRect(0, 0, W, H); c.save(); c.globalCompositeOperation = "lighter";
  for (let i = 0; i < 5; i++) {
    const col = i % 2 ? live(S, now, i) : p[i % 4], base = H * (0.28 + i * 0.07), amp = H * (0.07 + 0.05 * S.en), th = H * (0.16 + 0.04 * Math.sin(t * 0.3 + i)), g = c.createLinearGradient(0, base - amp, 0, base + th + amp);
    g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(0.45, `rgba(${col},${0.2 + 0.18 * S.en})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.beginPath();
    for (let x = 0; x <= W; x += 10) { const y = base + Math.sin(x * 0.004 + t * 0.35 + i * 1.3) * amp + Math.sin(x * 0.011 - t * 0.5 + i) * amp * 0.4; x ? c.lineTo(x, y) : c.moveTo(x, y); }
    for (let x = W; x >= 0; x -= 10) c.lineTo(x, base + th + Math.sin(x * 0.005 + t * 0.3 + i * 1.7) * amp * 0.7); c.closePath(); c.fill();
  }
  c.restore(); c.fillStyle = "#fff"; for (let i = 0; i < 70; i++) { c.globalAlpha = 0.15 + 0.4 * (0.5 + 0.5 * Math.sin(t * 1.3 + i)); c.fillRect(((i * 97) % 100) * W / 100, ((i * 53) % 70) * H / 100, 1.4, 1.4); } c.globalAlpha = 1;
}
function bgSynth(c, W, H, S, now) {
  const p = cl2(S), t = now / 1000, hz = H * 0.58, g = c.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, dark(p[3], 0.7)); g.addColorStop(1, dark(mixc(p[1], p[0], 0.4), 0.8)); c.fillStyle = g; c.fillRect(0, 0, W, hz);
  c.fillStyle = dark(p[3], 0.25); c.fillRect(0, hz, W, H - hz);
  const R = Math.min(W, H) * 0.2, sy = hz - R * 0.9, sg = c.createLinearGradient(0, sy - R, 0, sy + R); sg.addColorStop(0, `rgb(${p[2]})`); sg.addColorStop(1, `rgb(${p[1]})`);
  c.save(); c.beginPath(); c.arc(W / 2, sy, R, 0, 7); c.clip(); c.fillStyle = sg; c.fillRect(W / 2 - R, sy - R, 2 * R, 2 * R); c.fillStyle = dark(p[3], 0.5); for (let i = 0; i < 6; i++) c.fillRect(W / 2 - R, sy + R * (0.1 + i * 0.15), 2 * R, R * (0.02 + 0.025 * i)); c.restore();
  blob(c, W / 2, sy, R * 2.4, p[1], 0.18 + 0.2 * S.en);
  c.strokeStyle = `rgba(${p[0]},.5)`; c.shadowColor = `rgb(${p[0]})`; c.shadowBlur = 8; c.lineWidth = 1.2;
  for (let i = 0; i < 14; i++) { const z = (i / 14 + t * 0.15 * (1 + S.en)) % 1, y = hz + (H - hz) * z ** 2.2; c.globalAlpha = 0.15 + 0.6 * z; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  for (let i = -14; i <= 14; i++) { c.globalAlpha = 0.5; c.beginPath(); c.moveTo(W / 2 + i * W * 0.012, hz); c.lineTo(W / 2 + i * W * 0.16, H); c.stroke(); } c.globalAlpha = 1; c.shadowBlur = 0;
}
function bgWaves(c, W, H, S, now) {
  const p = cl2(S), t = now / 1000, g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, dark(p[3], 0.6)); g.addColorStop(1, "#02030a"); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let k = 0; k < 6; k++) { const base = H * (0.42 + k * 0.1), amp = H * (0.025 + 0.03 * S.en) * (1 + k * 0.2), col = k % 2 ? live(S, now, k) : p[k % 4], gg = c.createLinearGradient(0, base - amp, 0, H);
    gg.addColorStop(0, `rgba(${col},.42)`); gg.addColorStop(1, `rgba(${col},.04)`); c.fillStyle = gg; c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W; x += 12) c.lineTo(x, base + Math.sin(x * 0.006 + t * (0.5 + k * 0.12) + k) * amp + Math.sin(x * 0.015 - t * 0.7 + k * 2) * amp * 0.3); c.lineTo(W, H); c.closePath(); c.fill(); }
}
function bgLava(c, W, H, S, now) {
  const p = cl2(S), t = now / 1000; c.fillStyle = dark(p[3], 0.35); c.fillRect(0, 0, W, H); c.save(); c.globalCompositeOperation = "lighter";
  for (let i = 0; i < 9; i++) blob(c, W * (0.5 + 0.4 * Math.sin(t * 0.11 * (1 + (i % 4) * 0.3) + i * 1.7)), H * (0.5 + 0.4 * Math.cos(t * 0.09 * (1 + (i % 3) * 0.4) + i * 2.3)),
    Math.min(W, H) * (0.28 + 0.08 * Math.sin(t * 0.2 + i) + 0.1 * S.en), i % 2 ? live(S, now, i) : p[i % 4], 0.55); c.restore();
}
function drawBackdrop(c, W, H, S, now, dt, prox, warp) { ({ aurora: bgAurora, synthwave: bgSynth, waves: bgWaves, lava: bgLava }[S.cfg.bg])(c, W, H, S, now, dt, prox, warp); }

// ===== Four more theme scenes =====
function sceneTraditional(c, W, H, S, now, dt, prox, warp) {
  const th = S.th, p = th.pal, t = now / 1000, fxk = S.cfg.thFx, g = c.createRadialGradient(W / 2, H * 0.55, 0, W / 2, H * 0.55, Math.max(W, H) * 0.8);
  g.addColorStop(0, dark(mixc(p[1], p[0], 0.3), 0.45)); g.addColorStop(1, dark(p[3], 0.9)); c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (!S.trd || S.trd.w !== W || S.trd.sd !== th.seed) { const r = mulberry(th.seed); S.trd = { w: W, sd: th.seed, pe: Array.from({ length: 60 }, () => ({ x: r() * W, y: r() * H, ph: r() * 6.28, v: 12 + r() * 26, s: 3 + r() * 5, k: Math.floor(r() * 3) })) }; }
  c.save(); c.translate(W / 2, H * 0.5); c.globalCompositeOperation = "lighter"; const R0 = Math.min(W, H) * 0.42;   // mandala of petal rings, counter-rotating with the music
  for (let ring = 0; ring < 5; ring++) { const n = 8 + ring * 4, rr = R0 * (0.25 + ring * 0.18); c.save(); c.rotate(t * 0.05 * (ring % 2 ? 1 : -1));
    c.strokeStyle = `rgba(${ring % 2 ? p[0] : p[2]},${0.1 + 0.07 * S.en + 0.1 * S.pulse})`; c.lineWidth = 1.3; c.shadowColor = `rgb(${p[0]})`; c.shadowBlur = 8;
    for (let i = 0; i < n; i++) { c.save(); c.rotate((i / n) * 6.2832); c.beginPath(); c.moveTo(0, -rr); c.quadraticCurveTo(rr * 0.16, -rr * 1.12, 0, -rr * 1.26); c.quadraticCurveTo(-rr * 0.16, -rr * 1.12, 0, -rr); c.stroke(); c.restore(); }
    c.beginPath(); c.arc(0, 0, rr, 0, 7); c.stroke(); c.restore(); }
  c.restore();
  S.trd.pe.slice(0, Math.floor(60 * fxk)).forEach((q) => { q.y += q.v * dt; q.x += Math.sin(now / 1100 + q.ph) * 14 * dt; if (q.y > H + 10) { q.y = -10; q.x = Math.random() * W; }
    const f = prox(q.x, q.y, 140), [x, y] = warp(q.x, q.y, f); c.fillStyle = `rgba(${[p[0], p[1], p[2]][q.k]},.75)`; c.beginPath(); c.ellipse(x, y, q.s * (1 + f), q.s * 0.55, q.ph + t * 0.6, 0, 7); c.fill(); });
  c.save(); c.globalCompositeOperation = "lighter";   // diyas flickering along the bottom
  for (let i = 0; i < 9; i++) { const x = (W * (i + 0.5)) / 9, y = H * 0.94, fl = 0.7 + 0.3 * Math.sin(t * 7 + i * 1.7) * Math.sin(t * 3.1 + i); blob(c, x, y - 6, 46 * fl, p[2], 0.35 * fl); c.fillStyle = `rgba(${p[2]},.9)`; c.beginPath(); c.ellipse(x, y - 8, 3.2, 7 * fl, 0, 0, 7); c.fill(); }
  c.restore();
}
function sceneDark(c, W, H, S, now, dt, prox, warp) {
  const th = S.th, p = th.pal, t = now / 1000, fxk = S.cfg.thFx; c.fillStyle = "#020204"; c.fillRect(0, 0, W, H);
  if (!S.dk || S.dk.w !== W || S.dk.sd !== th.seed) { const r = mulberry(th.seed); S.dk = { w: W, sd: th.seed, ash: Array.from({ length: 90 }, () => ({ x: r() * W, y: r() * H, v: 5 + r() * 14, ph: r() * 6.28, s: 0.8 + r() * 1.8 })) }; }
  c.save(); c.globalCompositeOperation = "lighter"; blob(c, W * 0.2, H * 0.3, H * 0.8, p[1], 0.1 + 0.14 * S.pulse); blob(c, W * 0.85, H * 0.8, H * 0.7, p[0], 0.06 + 0.06 * S.en);
  for (let i = 0; i < 3; i++) { const x = W * (0.25 + 0.25 * i) + Math.sin(t * 0.2 + i) * W * 0.04, bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, `rgba(${p[0]},${0.1 + 0.1 * S.en})`); bg.addColorStop(1, `rgba(${p[0]},0)`);
    c.fillStyle = bg; c.beginPath(); c.moveTo(x - 6, 0); c.lineTo(x + 6, 0); c.lineTo(x + 90 + 30 * Math.sin(t * 0.3 + i), H); c.lineTo(x - 90, H); c.fill(); } c.restore();
  c.fillStyle = "rgba(235,235,245,.55)"; S.dk.ash.slice(0, Math.floor(90 * fxk)).forEach((q) => { q.y += q.v * dt; q.x += Math.sin(t + q.ph) * 6 * dt; if (q.y > H + 5) { q.y = -5; q.x = Math.random() * W; }
    const f = prox(q.x, q.y, 140), [x, y] = warp(q.x, q.y, f); c.beginPath(); c.arc(x, y, q.s * (1 + f * 1.5), 0, 7); c.fill(); });
  const vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.7); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.85)"); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  c.fillStyle = `rgba(${p[1]},${0.2 + 0.4 * S.pulse})`; c.fillRect(W * 0.1, H - 2, W * 0.8, 1.5);
}
function sceneFancy(c, W, H, S, now, dt, prox, warp) {
  const th = S.th, p = th.pal, t = now / 1000, fxk = S.cfg.thFx, k = 0.5 + 0.5 * Math.sin(t * 0.2), g = c.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, dark(mixc(p[0], p[1], k), 0.5)); g.addColorStop(0.5, dark(mixc(p[1], p[2], k), 0.45)); g.addColorStop(1, dark(mixc(p[2], p[0], k), 0.5)); c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (!S.fn || S.fn.w !== W || S.fn.sd !== th.seed) { const r = mulberry(th.seed); S.fn = { w: W, sd: th.seed, gl: Array.from({ length: 90 }, () => ({ x: r() * W, y: r() * H, ph: r() * 6.28, k: Math.floor(r() * 3), s: 2 + r() * 5 })), bu: Array.from({ length: 14 }, () => ({ x: r() * W, y: r() * H, r: 10 + r() * 30, v: 10 + r() * 22, ph: r() * 6.28 })) }; }
  c.save(); c.globalCompositeOperation = "lighter"; for (let i = 0; i < 5; i++) blob(c, W * (0.5 + 0.4 * Math.sin(t * 0.15 + i * 1.3)), H * (0.5 + 0.35 * Math.cos(t * 0.12 + i * 2)), Math.min(W, H) * 0.4, p[i % 3], 0.14 + 0.12 * S.en); c.restore();
  S.fn.bu.forEach((b) => { b.y -= b.v * dt; if (b.y < -40) { b.y = H + 40; b.x = Math.random() * W; } const x = b.x + Math.sin(t + b.ph) * 14; c.strokeStyle = "rgba(255,255,255,.28)"; c.lineWidth = 1.2; c.beginPath(); c.arc(x, b.y, b.r, 0, 7); c.stroke(); c.beginPath(); c.arc(x, b.y, b.r * 0.7, 3.6, 4.5); c.stroke(); });
  S.fn.gl.slice(0, Math.floor(90 * fxk)).forEach((q) => { const f = prox(q.x, q.y, 150), [x, y] = warp(q.x, q.y, f); c.fillStyle = `rgba(${[p[0], p[1], p[2]][q.k]},${clamp(0.25 + 0.6 * (0.5 + 0.5 * Math.sin(t * 2.2 + q.ph)) + f * 0.4)})`; shape(c, ["sparkle", "heart", "burst"][q.k], x, y, q.s * (1 + f), t + q.ph); });
}
function sceneLuxury(c, W, H, S, now, dt, prox, warp) {
  const th = S.th, p = th.pal, t = now / 1000, fxk = S.cfg.thFx, g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, dark(p[3], 1.3)); g.addColorStop(1, "#020100"); c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (!S.lx || S.lx.w !== W || S.lx.sd !== th.seed) { const r = mulberry(th.seed); S.lx = { w: W, sd: th.seed, d: Array.from({ length: 90 }, () => ({ x: r() * W, y: r() * H, v: 4 + r() * 12, ph: r() * 6.28, s: 0.8 + r() * 1.8 })), vn: Array.from({ length: 5 }, () => [r() * W, r() * H, r() * W, r() * H, r() * W, r() * H]) }; }
  c.strokeStyle = `rgba(${p[2]},.05)`; c.lineWidth = 1.5; S.lx.vn.forEach((v, i) => { const o = Math.sin(t * 0.1 + i) * 30; c.beginPath(); c.moveTo(0, v[1]); c.bezierCurveTo(v[0] + o, v[3], v[2] - o, v[5], W, v[1] + 60); c.stroke(); });
  c.save(); c.translate(W / 2, H); c.strokeStyle = `rgba(${p[0]},${0.07 + 0.08 * S.pulse + 0.05 * S.en})`; c.lineWidth = 1;
  for (let i = -8; i <= 8; i++) { const a = -Math.PI / 2 + i * 0.17; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * H * 1.1, Math.sin(a) * H * 1.1); c.stroke(); } for (let i = 1; i <= 5; i++) { c.beginPath(); c.arc(0, 0, H * 0.17 * i, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } c.restore();
  c.fillStyle = `rgb(${p[0]})`; c.shadowColor = `rgb(${p[0]})`; c.shadowBlur = 6; S.lx.d.slice(0, Math.floor(90 * fxk)).forEach((q) => { q.y -= q.v * dt * (1 + S.en); if (q.y < -5) { q.y = H + 5; q.x = Math.random() * W; }
    const f = prox(q.x, q.y, 140), [x, y] = warp(q.x, q.y, f), tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + q.ph)); c.globalAlpha = tw; if (q.s > 2) sparkle(c, x, y, q.s * 2.4 * (1 + f)); else { c.beginPath(); c.arc(x, y, q.s * (1 + f), 0, 7); c.fill(); } }); c.globalAlpha = 1; c.shadowBlur = 0;
  const x0 = ((t * 0.12) % 1.6 - 0.3) * W, sg = c.createLinearGradient(x0 - 140, 0, x0 + 140, 0); sg.addColorStop(0, "rgba(255,240,200,0)"); sg.addColorStop(0.5, `rgba(${p[2]},.09)`); sg.addColorStop(1, "rgba(255,240,200,0)"); c.fillStyle = sg; c.fillRect(0, 0, W, H);
}
function drawTheme(c, W, H, S, now, dt, prox, warp) { ({ fantasy: sceneFantasy, toxic: sceneToxic, noir: sceneNoir, traditional: sceneTraditional, dark: sceneDark, fancy: sceneFancy, luxury: sceneLuxury }[S.th.id])(c, W, H, S, now, dt, prox, warp); }

// ===== Audio-analysis alignment: onsets + beats + tatums -> candidate times; per-line shifts; per-word dynamic programming =====
function candOf(d) {
  const out = [], seg = d.segments || [];
  seg.forEach((s, i) => { if (!i) return; const jump = s.loudness_max - seg[i - 1].loudness_max; if (s.confidence > 0.3 && jump > 2) out.push([s.start, clamp(0.4 + jump / 12) * (0.5 + 0.5 * s.confidence)]); });
  (d.tatums || []).forEach((x) => out.push([x.start, 0.12 + 0.25 * (x.confidence || 0.5)])); (d.beats || []).forEach((x) => out.push([x.start, 0.3 + 0.2 * (x.confidence || 0.5)]));
  return out.sort((a, b) => a[0] - b[0]);
}
const lbound = (a, t) => { let lo = 0, hi = a.length; while (lo < hi) { const m = (lo + hi) >> 1; if (a[m][0] < t) lo = m + 1; else hi = m; } return lo; };
function lineShifts(lines, cand) {
  const raw = lines.map((l) => { if (l.wt) return null; let best = null, bs = 0.35; for (let j = lbound(cand, l.t - 0.45); j < cand.length && cand[j][0] <= l.t + 0.45; j++) { if (cand[j][1] < 0.6) continue; const sc = cand[j][1] * Math.exp(-(((cand[j][0] - l.t) / 0.2) ** 2)); if (sc > bs) { bs = sc; best = cand[j][0] - l.t; } } return best; });
  return raw.map((_, i) => { const v = []; for (let k = i - 2; k <= i + 2; k++) if (raw[k] != null) v.push(raw[k]); if (v.length < 3) return 0; v.sort((a, b) => a - b); return Math.max(-0.45, Math.min(0.45, v[v.length >> 1])); });
}
function alignWords(ws, cand, str) {
  const n = ws.length; if (n < 2 || !cand || !cand.length) return;
  const opts = ws.map((e) => { const o = [[e, 0]]; for (let j = lbound(cand, e - 0.4); j < cand.length && cand[j][0] <= e + 0.4 && o.length < 9; j++) o.push(cand[j]); return o; });
  let prev = opts[0].map(([t, w]) => ({ c: ((t - ws[0]) / 0.25) ** 2 * 0.8 - str * 2.4 * w, from: -1, t })); const hist = [prev];
  for (let k = 1; k < n; k++) { const eg = ws[k] - ws[k - 1];
    const cur = opts[k].map(([t, w]) => { let best = 1e9, bi = -1; prev.forEach((p, i) => { const gp = t - p.t; if (gp < 0.07) return; const c2 = p.c + ((gp - eg) / 0.3) ** 2 * 0.5; if (c2 < best) { best = c2; bi = i; } }); return { c: best + ((t - ws[k]) / 0.25) ** 2 * 0.8 - str * 2.4 * w, from: bi, t }; });
    hist.push(cur); prev = cur; }
  let bi = 0, bc = 1e9; prev.forEach((p, i) => { if (p.c < bc) { bc = p.c; bi = i; } }); if (bc >= 1e9) return;
  const res = []; for (let k = n - 1; k >= 0; k--) { const p = hist[k][bi]; if (!p) return; res[k] = p.t; bi = p.from; }
  res.forEach((v, k) => (ws[k] = v));
}

// ===== Visualizer (shown in intros, gaps and instrumentals) =====
function drawVis(c, css, W, H, S, now, a) {
  const C = S.cfg, m = C.vis; if (m === "off") return;
  const cx = W / 2, cy = H / 2, base = Math.min(W, H) * 0.2 * C.visSize, t = (now / 1000) * C.visSpd, e = S.en;
  c.save(); c.shadowColor = css(0.9); c.shadowBlur = 12;
  if (m === "bars") { const n = 72, in0 = base * 0.8; c.lineCap = "round"; c.lineWidth = Math.max(2, base * 0.045);
    for (let i = 0; i < n; i++) { const ang = (i / n) * 6.2832 + t * 0.1, v = 0.2 + e * (0.5 + 0.5 * Math.sin(i * 0.9 + t * 3) * Math.sin(i * 0.37 - t * 1.7)) + (i % 6 === 0 ? S.pulse * 0.25 : 0), len = base * 0.75 * v;
      c.strokeStyle = css((0.3 + 0.65 * v) * a); c.beginPath(); c.moveTo(cx + Math.cos(ang) * in0, cy + Math.sin(ang) * in0); c.lineTo(cx + Math.cos(ang) * (in0 + len), cy + Math.sin(ang) * (in0 + len)); c.stroke(); } }
  else if (m === "wave") { for (let k = 0; k < 4; k++) { c.strokeStyle = css((0.75 - k * 0.16) * a); c.lineWidth = 2.4 - k * 0.45; c.beginPath();
      for (let x = 0; x <= W; x += 8) { const u = x / W, y = cy + Math.sin(u * Math.PI) * base * 0.9 * (0.25 + e) * Math.sin(u * (6 + k * 2) + t * (1.5 + k * 0.5)) * (1 + 0.5 * S.pulse); x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); } }
  else if (m === "tunnel") { for (let k = 0; k < 14; k++) { const ph = (t * 0.35 + k / 14) % 1, r = base * 0.15 + ph ** 2.2 * Math.max(W, H) * 0.7 * C.visSize; c.strokeStyle = css(Math.sin(Math.PI * ph) * a * (0.3 + 0.5 * e)); c.lineWidth = 1 + 3 * ph; c.beginPath();
      for (let i = 0; i <= 6; i++) { const an = (i * Math.PI) / 3 + t * 0.1; i ? c.lineTo(cx + Math.cos(an) * r, cy + Math.sin(an) * r) : c.moveTo(cx + Math.cos(an) * r, cy + Math.sin(an) * r); } c.stroke(); } }
  else if (m === "orbs") { for (let k = 0; k < 28; k++) { const ang = t * (0.2 + (k % 7) * 0.05) + k * 2.4, rr = base * (0.5 + (k % 7) * 0.22) * (1 + 0.1 * e); c.fillStyle = css(a * (0.4 + 0.5 * e)); c.beginPath(); c.arc(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr * 0.6, 2 + (k % 4) + (k % 3 === 0 ? 6 * e : 0), 0, 7); c.fill(); } }
  else { const n = 56, pts = [];
    for (let k = 0; k < n; k++) { const ang = (k / n) * 6.2832 + t * 0.12, wob = 0.5 + 0.5 * Math.sin(k * 3 + t * 2.1) * Math.sin(k * 0.7 - t * 1.3), r = base * (1 + 0.3 * e * wob + 0.1 * S.pulse * (k % 2 ? 1 : 0.5)); pts.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]); }
    c.lineWidth = 1.2; c.strokeStyle = css(0.5 * a); c.beginPath(); pts.forEach((p, k) => (k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.stroke();
    c.strokeStyle = css(0.13 * a); c.beginPath(); pts.forEach((p, k) => { const q = pts[(k + 9) % n]; c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); }); c.stroke();
    c.fillStyle = css(a); const ks = CL_KINDS[C.kinds] || CL_KINDS.mix; pts.forEach((p, k) => { if (k % 4 === 0) shape(c, ks[(k >> 2) % ks.length], p[0], p[1], 3 + 6 * e * (0.5 + 0.5 * Math.sin(k + t * 3)), t); else c.fillRect(p[0] - 1, p[1] - 1, 2, 2); }); }
  c.restore();
}


const BGC = [["black", "Black", "#000"], ["cover", "Album art", "linear-gradient(135deg,#b33,#33b)"], ["animated", "Animated", "conic-gradient(from 90deg,#f4a,#4af,#fa4,#f4a)"], ["gradient", "Gradient", "linear-gradient(120deg,#f6a,#64f)"], ["aurora", "Aurora", "linear-gradient(180deg,#0b1,#06f)"], ["synthwave", "Synthwave", "linear-gradient(180deg,#f0a,#408)"], ["waves", "Waves", "linear-gradient(180deg,#058,#0cf)"], ["lava", "Lava", "radial-gradient(circle at 30% 40%,#f90,#a02)"]];
const GXC = [["classic", "Classic", "radial-gradient(#68f,#000)"], ["spiral", "Spiral", "conic-gradient(#f9a,#46f,#f9a)"], ["g2", "Black hole", "radial-gradient(circle,#000 22%,#fb6 26%,#000 62%)"], ["g4", "Galaxy 4", "linear-gradient(135deg,#13a,#fc3)"], ["g5", "Galaxy 5", "radial-gradient(#fc9,#235)"]];
const THC = [["auto", "Auto", "linear-gradient(135deg,#444,#999)"], ["fantasy", "Dark Fantasy", "linear-gradient(135deg,#6a4fd0,#0b2a3a)"], ["toxic", "Toxic", "linear-gradient(135deg,#7f3,#f23)"], ["noir", "Noir", "linear-gradient(135deg,#f58,#124)"], ["traditional", "Traditional", "linear-gradient(135deg,#fa3,#800)"], ["dark", "Dark", "linear-gradient(135deg,#222,#900)"], ["fancy", "Fancy", "linear-gradient(135deg,#f9d,#9bf)"], ["luxury", "Luxury", "linear-gradient(135deg,#eb5,#210)"]];
const FAM = [["auto", "Auto"], ["Inter", "Modern", "Inter"], ["Playfair Display", "Luxury", "Playfair Display"], ["Cinzel", "Fantasy", "Cinzel"], ["Dancing Script", "Script", "Dancing Script"], ["Orbitron", "Tech", "Orbitron"], ["Bebas Neue", "Bold", "Bebas Neue"], ["Pacifico", "Retro", "Pacifico"], ["Righteous", "Pop", "Righteous"], ["Cormorant Garamond", "Elegant", "Cormorant Garamond"]];
const BNF = [["sans", "Sans", "Noto Sans Bengali"], ["hind", "Hind", "Hind Siliguri"], ["round", "Round", "Baloo Da 2"], ["modern", "Modern", "Anek Bangla"], ["serif", "Serif", "Noto Serif Bengali"]];
const ARF = [["naskh", "Naskh", "Noto Naskh Arabic"], ["nastaliq", "Nastaliq", "Noto Nastaliq Urdu"], ["amiri", "Amiri", "Amiri"]];

// ===== ASCII art backgrounds: live-generated character art. Glyph-atlas rendering (tiles cached per char + colour) keeps it fast =====
const ASCS = new Set(["asc_auto", "asc_cover", "asc_knight", "asc_garden", "asc_rain", "asc_cosmos"]);
const ASCC = [["asc_auto", "Autonomous", "linear-gradient(135deg,#1b3a5c,#6b2d8c 55%,#ffb347)"], ["asc_cover", "ASCII cover", "linear-gradient(135deg,#d33,#222 60%,#fc6)"], ["asc_knight", "ASCII knight", "linear-gradient(160deg,#222,#bbb 55%,#d22)"], ["asc_garden", "ASCII garden", "linear-gradient(180deg,#112,#2a4 70%,#f6a)"], ["asc_rain", "ASCII rain", "linear-gradient(180deg,#010,#0f6)"], ["asc_cosmos", "ASCII cosmos", "radial-gradient(#fc9,#324 60%,#000)"]];
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
    A.bl = document.createElement("canvas"); A.bl.width = Math.ceil(W / 8); A.bl.height = Math.ceil(H / 8); A.covK = null; A.fl = null; A.rain = null; A.dust = null; A.pol = null;
  }
  return A;
}
function ascTile(A, k, w, r, g, b) {
  const key = (((k << 1) | w) << 12) | ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4); let i = A.map.get(key);   // numeric key: no string allocation per cell
  if (i === undefined) {
    if (A.nx >= A.cap) { A.map.clear(); A.nx = 0; A.actx.clearRect(0, 0, 2048, 2048); }
    i = A.nx++; A.map.set(key, i); const x = (i % A.per) * A.tw, y = Math.floor(i / A.per) * A.th, a = A.actx;
    a.font = `${w ? 800 : 600} ${A.fs * A.dpr}px ui-monospace, "Cascadia Mono", Menlo, Consolas, "MS Gothic", "Noto Sans Mono CJK JP", monospace`; a.textAlign = "center"; a.textBaseline = "middle";
    a.fillStyle = `rgb(${(r >> 4) * 17},${(g >> 4) * 17},${(b >> 4) * 17})`; a.fillText(A.glyphs[k], x + A.tw / 2, y + A.th / 2);
  }
  return i;
}
function ascFlush(c, A, W, H, glow) {
  const g = A.octx, n = A.cols * A.rows, d = A.dpr; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, A.off.width, A.off.height);
  for (let i = 0; i < n; i++) {
    const k = A.chr[i]; if (!k) continue; const ch = A.glyphs[k]; if (ch === " ") continue;
    const t = ascTile(A, k, A.R[i] + A.G[i] + A.B[i] > A.boldT ? 1 : 0, A.R[i], A.G[i], A.B[i]), col = i % A.cols, row = (i / A.cols) | 0;
    g.drawImage(A.atlas, (t % A.per) * A.tw, Math.floor(t / A.per) * A.th, A.tw, A.th, Math.floor(col * A.cw * d), Math.floor(row * A.chh * d), A.tw, A.th);
  }
  c.drawImage(A.off, 0, 0, W, H);
  if (glow > 0.01) { const b = A.bl.getContext("2d"); b.clearRect(0, 0, A.bl.width, A.bl.height); b.drawImage(A.off, 0, 0, A.bl.width, A.bl.height); c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = glow; c.imageSmoothingEnabled = true; c.drawImage(A.bl, 0, 0, W, H); c.restore(); }
}
function ascCov(A, S) {   // cover art sampled into the character grid (cover-fit)
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
const ascRev = (A, now, col, row) => clamp((now - A.t0) / 3000) * 1.35 - Math.hypot(col / A.cols - 0.5, row / A.rows - 0.5) * 0.9 - ASC_HASH(col, row, 7) * 0.35;   // "generating" reveal when a song starts

// --- 1. Cover: the album art as live, colour-per-character art with animated styles ---
function ascScCover(A, S, W, H, now, dt, prox, C) {
  const { cols, rows } = A, t = now / 1000, amp = C.ascAmp, en = S.en * C.ascReact, pl = S.pulse * C.ascReact, st = C.ascStyle, d = A.cov, sc = 1 + 0.035 * Math.sin(t * 0.3) + 0.03 * pl;
  const cx = cols / 2, cy = rows / 2, scan = ((t * 0.1) % 1.3) * rows - rows * 0.15, gl = Math.floor(t * 6), p = cl2(S);
  for (let row = 0; row < rows; row++) {
    let rowDx = 0; if (st === "glitch" && ASC_HASH(row, gl, 3) > 0.93 - 0.05 * pl) rowDx = (ASC_HASH(row, gl, 9) - 0.5) * 14 * amp;
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col, rv = ascRev(A, now, col, row); if (rv < 0) { A.chr[i] = 0; continue; }
      let dx = rowDx, dy = 0, bright = 1;
      if (st === "wave") { dx += Math.sin(row * 0.22 + t * 1.6) * 2.2 * amp * (0.5 + en); dy += Math.sin(col * 0.14 + t * 1.2) * 1.2 * amp * (0.5 + en); }
      else if (st === "ripple") { const ex = col - cx, ey = (row - cy) * 1.8, rr = Math.hypot(ex, ey) + 1, w = Math.sin(rr * 0.35 - t * 3) * 2.4 * amp * (0.4 + en); dx += (ex / rr) * w; dy += (ey / rr) * w * 0.55; }
      else if (st === "scan") { const b = Math.exp(-(((row - scan) / 3) ** 2)); bright += b * 1.1 * amp; dx += b * 2 * amp; }
      else if (st === "dissolve") { const nz = ASC_HASH(col, row, Math.floor(t * 7)); if (nz < 0.1 * amp * (0.5 + en)) bright = 0.2; else if (nz > 0.97) bright = 1.5; }
      const f = prox(col * A.cw, row * A.chh, 170); if (f > 0) { dx += (S.px / A.cw - col) * f * 0.18; dy += (S.py / A.chh - row) * f * 0.18; bright += f * 0.5; }
      let ix = Math.round((col - cx) / sc + cx + dx), iy = Math.round((row - cy) / sc + cy + dy); ix = ix < 0 ? 0 : ix >= cols ? cols - 1 : ix; iy = iy < 0 ? 0 : iy >= rows ? rows - 1 : iy;
      let r, g, b, lum;
      if (d) { const q = (iy * cols + ix) * 4; r = d[q]; g = d[q + 1]; b = d[q + 2]; lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
      else { lum = 0.5 + 0.5 * Math.sin(ix * 0.12 + t) * Math.cos(iy * 0.2 - t * 0.7); const c2 = mixc(p[0], p[1], lum); r = c2[0]; g = c2[1]; b = c2[2]; }
      ascSet(A, S, i, clamp((clamp((lum - 0.06) * 1.3) ** 0.9) * bright * clamp(rv * 4)), r, g, b);
    }
  }
}
// --- 2. Code rain that "paints" the cover: columns glow brighter where the cover is bright ---
function ascScRain(A, S, W, H, now, dt, prox, C) {
  const { cols, rows } = A, t = now / 1000, d = A.cov, k = 1 + 1.6 * S.en * C.ascReact + 2 * S.pulse * C.ascReact, set = C.ascSet, pool = [...(set === "classic" || set === "kana" || set === "fine" ? ASC_POOL : ASC_SETS[set]).replace(/ /g, "")].map((x) => A.gx.get(x) || 1);
  if (!A.rain || A.rain.length !== cols) A.rain = Array.from({ length: cols }, () => ({ y: Math.random() * rows * 2 - rows, v: 5 + Math.random() * 14, len: 8 + Math.random() * 22 }));
  A.chr.fill(0);
  if (d) for (let i = 0; i < cols * rows; i++) { const q = i * 4, l = (0.299 * d[q] + 0.587 * d[q + 1] + 0.114 * d[q + 2]) / 255; if (l > 0.22) ascSet(A, S, i, l * 0.26 * clamp(ascRev(A, now, i % cols, (i / cols) | 0) * 4), d[q], d[q + 1], d[q + 2]); }
  A.rain.forEach((c, col) => {
    c.y += c.v * k * C.ascAmp * dt; if (c.y - c.len > rows) { c.y = -Math.random() * rows * 0.5; c.v = 5 + Math.random() * 14; c.len = 8 + Math.random() * 22; }
    for (let j = 0; j < c.len; j++) {
      const row = Math.floor(c.y) - j; if (row < 0 || row >= rows) continue; const i = row * cols + col, q = i * 4, lc = d ? (0.299 * d[q] + 0.587 * d[q + 1] + 0.114 * d[q + 2]) / 255 : 0.6, tr = (1 - j / c.len) ** 1.6, lum = clamp(tr * (d ? 0.3 + 1.1 * lc : 1)) * clamp(ascRev(A, now, col, row) * 4);
      if (lum < 0.05) continue; A.chr[i] = pool[Math.floor(ASC_HASH(col, row, Math.floor(t * 6 + col * 0.1)) * pool.length) % pool.length]; ascCol(A, S, i, lum, d ? d[q] : 80, d ? d[q + 1] : 255, d ? d[q + 2] : 120);
      if (j === 0) { A.R[i] = A.G[i] = A.B[i] = 255; }
    }
  });
}
// --- 3. Garden: flowers grow, bloom, wilt and regrow; pollen and fireflies drift ---
function ascScGarden(A, S, W, H, now, dt, prox, C) {
  const { cols, rows, cw, chh } = A, t = now / 1000, p = cl2(S), n = Math.max(2, C.ascFlowers | 0), en = S.en * C.ascReact, mn = Math.min(W, H), wind = C.ascWind;
  if (!A.fl || A.fl.length !== n || A.flK !== S.uri) { A.flK = S.uri; const r = mulberry(S.seed || 3); A.fl = Array.from({ length: n }, (_, i) => ({ x: ((i + 0.5) / n) * 0.9 + 0.05 + (r() - 0.5) * 0.04, hf: 0.3 + 0.32 * r(), off: r() * 20, T: 16 + 10 * r(), k: 5 + ((r() * 4) | 0), R: 0.05 + 0.04 * r(), pc: i % 4, sw: r() * 6.28, ln: (r() - 0.5) * 0.1 })); A.pol = []; }
  A.chr.fill(0); const base = Math.floor(rows * 0.9), put = (x, y, ch, r, g, b) => { const c = Math.round(x), rr = Math.round(y); if (c >= 0 && c < cols && rr >= 0 && rr < rows) ascPut(A, rr * cols + c, ch, r, g, b); };
  for (let row = 0; row < rows * 0.55; row++) for (let col = 0; col < cols; col++) { const h = ASC_HASH(col, row, 5); if (h > 0.993) { const tw = 0.5 + 0.5 * Math.sin(t * 2 + h * 90), v = 90 + 140 * tw; put(col, row, tw > 0.6 ? "+" : ".", v, v, v + 20); } }
  for (let col = 0; col < cols; col++) {   // grass + soil
    const gh = 1 + Math.floor(2.4 * noise2(col * 0.35, 3, 64)), sw = Math.sin(t * 1.4 + col * 0.3) * wind;
    for (let j = 0; j < gh; j++) put(col + (j ? Math.round(sw * 0.4) : 0), base - j, j === 0 ? '"' : sw > 0.3 ? "/" : sw < -0.3 ? "\\" : "|", 40 + 20 * j, 150 + 40 * ASC_HASH(col, j, 2), 70);
    for (let row = base + 1; row < rows; row++) put(col, row, ASC_HASH(col, row, 4) > 0.7 ? "." : ",", 70, 52, 38);
  }
  A.fl.forEach((f) => {
    const ph = ((t + f.off) % f.T) / f.T, g = ph < 0.35 ? ease(ph / 0.35) : ph > 0.88 ? 1 - ease((ph - 0.88) / 0.12) : 1;
    let bl = ph < 0.35 ? 0 : ph < 0.55 ? ease((ph - 0.35) / 0.2) : ph < 0.82 ? 1 : ph < 0.9 ? 1 - ease((ph - 0.82) / 0.08) : 0; bl *= 1 + 0.08 * S.pulse * C.ascReact;
    if (g < 0.02) return; const bx = f.x * cols, hc = f.hf * rows * 0.95 * g, hx = bx + (f.ln * cols + Math.sin(t * 0.6 + f.sw) * cols * 0.012 * (0.5 + wind)) * g, hy = base - hc, N = Math.max(6, (hc * 1.5) | 0);
    const sx = (s) => bx + (hx - bx) * s + Math.sin(s * Math.PI) * Math.sin(t * 0.8 + f.sw) * cols * 0.01 * (0.6 + en) * wind, sy = (s) => base - hc * s;
    for (let k = 0; k <= N; k++) {
      const s = k / N, x0 = sx(s), y0 = sy(s), x1 = sx(Math.min(1, s + 1 / N)), y1 = sy(Math.min(1, s + 1 / N)), ddx = (x1 - x0) * cw, ddy = (y1 - y0) * chh, ch = Math.abs(ddx) < 0.3 * Math.abs(ddy) ? "|" : ddx > 0 ? "/" : "\\";
      put(x0, y0, ch, 55 + 30 * s, 170 + 50 * s, 80); if (s < 0.45) put(x0 + 1, y0, ")", 40, 130, 60);
      if (k > 0 && k % Math.max(4, (N / 4) | 0) === 0 && s < 0.85) { const side = (k / 4) % 2 ? 1 : -1, L = 2 + g * 5 * (1 - s * 0.5); for (let j = 1; j <= L; j++) put(x0 + side * j * 1.4, y0 - j * 0.45 + 0.1 * j * j * 0.2, j < L - 0.5 ? "~" : (side > 0 ? ">" : "<"), 70, 200, 95); }
    }
    const Rh = f.R * mn * (0.3 + 0.7 * bl), rc = Math.ceil(Rh / cw) + 1, rr = Math.ceil(Rh / chh) + 1, col0 = p[f.pc], rot = t * 0.15 + f.sw;
    if (bl < 0.04) { put(hx, hy, "0", 90, 190, 100); put(hx, hy - 1, "^", 90, 190, 100); }
    else for (let r = Math.floor(hy) - rr; r <= hy + rr; r++) for (let c = Math.floor(hx) - rc; c <= hx + rc; c++) {
      const dxp = (c - hx) * cw, dyp = (r - hy) * chh, dd = Math.hypot(dxp, dyp), th = Math.atan2(dyp, dxp) - rot, pr = Rh * (0.42 + 0.58 * Math.pow(Math.abs(Math.cos((f.k * th) / 2)), 0.7));
      if (dd > pr) continue; if (c < 0 || c >= cols || r < 0 || r >= rows) continue; const i = r * cols + c;
      if (dd < Rh * 0.2) { A.chr[i] = A.gx.get("@"); A.R[i] = 255; A.G[i] = 205; A.B[i] = 70; continue; }
      const q = dd / pr, lum = 0.35 + 0.55 * q, cc = mixc(col0, [255, 255, 255], q * 0.45); A.chr[i] = ascRamp(A, lum); A.R[i] = cc[0] * (0.6 + 0.5 * lum); A.G[i] = cc[1] * (0.6 + 0.5 * lum); A.B[i] = cc[2] * (0.6 + 0.5 * lum);
    }
    if (bl > 0.6 && A.pol.length < 140 && Math.random() < 3 * dt) A.pol.push({ x: hx, y: hy, vx: (Math.random() - 0.5) * 4, vy: -2 - Math.random() * 3, life: 3 + Math.random() * 3 });
  });
  A.pol = A.pol.filter((q) => { q.life -= dt; q.x += (q.vx + Math.sin(t + q.y) * 2 * wind) * dt; q.y += q.vy * dt; const a = clamp(q.life / 2); put(q.x, q.y, a > 0.5 ? "*" : ".", 255 * a, 215 * a, 90 * a); return q.life > 0 && q.y > 0; });
  for (let i = 0; i < 26; i++) { const x = ((ASC_HASH(i, 1, 1) * cols + t * (1 + ASC_HASH(i, 2, 2)) * 2) % cols), y = rows * 0.35 + ASC_HASH(i, 3, 3) * rows * 0.5 + Math.sin(t * 0.7 + i) * 2, b = 0.5 + 0.5 * Math.sin(t * 2 + i * 3); if (b > 0.3) put(x, y, "·" === "·" ? "." : ".", 200 * b, 255 * b, 110 * b); }
}
// --- 4. Knight: a hooded warrior leaning on his sword; his scarf streams and flutters in the wind (wind rises with the music) ---
const ell = (x, y, cx, cy, rx, ry) => (Math.hypot((x - cx) / rx, (y - cy) / ry) - 1) * Math.min(rx, ry);
const capd = (x, y, ax, ay, bx, by, r) => { const px = x - ax, py = y - ay, qx = bx - ax, qy = by - ay, k = clamp((px * qx + py * qy) / (qx * qx + qy * qy)); return Math.hypot(px - qx * k, py - qy * k) - r; };
let KN_P = 0;
function knightSD(x, y, wob) {
  let d = ell(x, y, 0, 0.15, 0.115, 0.145), q; KN_P = 1;
  q = ell(x, y, -0.2, 0.375, 0.1, 0.06); if (q < d) { d = q; KN_P = 2; } q = ell(x, y, 0.2, 0.375, 0.1, 0.06); if (q < d) { d = q; KN_P = 2; }
  q = Math.max(Math.abs(x) - (0.15 + (y - 0.3) * 0.3), 0.3 - y, y - (0.88 + wob)); if (q < d) { d = q; KN_P = 3; }
  q = capd(x, y, -0.2, 0.4, -0.085, 0.63, 0.045); if (q < d) { d = q; KN_P = 2; } q = capd(x, y, 0.2, 0.4, 0.075, 0.62, 0.045); if (q < d) { d = q; KN_P = 2; }
  q = capd(x, y, 0, 0.6, 0, 1.03, 0.014); if (q < d) { d = q; KN_P = 4; } q = capd(x, y, -0.08, 0.64, 0.08, 0.64, 0.013); if (q < d) { d = q; KN_P = 4; }
  q = capd(x, y, -0.09, 0.9, -0.09, 1.0, 0.05); if (q < d) { d = q; KN_P = 3; } q = capd(x, y, 0.09, 0.9, 0.09, 1.0, 0.05); if (q < d) { d = q; KN_P = 3; }
  return d;
}
function ascScKnight(A, S, W, H, now, dt, prox, C) {
  const { cols, rows, cw, chh } = A, t = now / 1000, p = cl2(S), en = S.en * C.ascReact, wind = C.ascWind * (0.6 + 0.9 * en + 0.6 * S.pulse * C.ascReact), Hk = H * 0.8, cxk = W * 0.46, topk = H * 0.1 + Math.sin(t * 0.8) * H * 0.004;
  const tint = A.mode === "cover" ? mixc([228, 222, 214], p[0], 0.3) : [228, 222, 214], sc = C.ascScarf === "cover" ? mixc(p[0], [255, 255, 255], 0.1) : [228, 34, 48]; A.chr.fill(0);
  const put = (x, y, ch, r, g, b) => { const c = Math.round(x), rr = Math.round(y); if (c >= 0 && c < cols && rr >= 0 && rr < rows) ascPut(A, rr * cols + c, ch, r, g, b); };
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {   // sky dust + knight body
    const i = row * cols + col, h = ASC_HASH(col, row, 5), rv = ascRev(A, now, col, row); if (rv < 0) continue;
    const nx = ((col + 0.5) * cw - cxk) / Hk, ny = ((row + 0.5) * chh - topk) / Hk;
    if (nx > -0.42 && nx < 0.42 && ny > 0 && ny < 1.04) {
      const d = knightSD(nx, ny, 0.03 * (noise2(nx * 14 + 3, 1, 64) - 0.5) + 0.012 * Math.sin(nx * 30 + t));
      if (d < 0) {
        let lum; if (KN_P === 4) lum = 0.92 + 0.08 * Math.sin(ny * 40 - t * 2);
        else { const nz = noise2(nx * 22 + 5, ny * 22 + 9, 64); lum = 0.34 + 0.34 * clamp(0.62 - nx * 1.3) + 0.3 * nz + (KN_P === 3 ? 0.12 * Math.sin(ny * 46 + nx * 14 + nz * 4) : 0); if (KN_P === 1 && ell(nx, ny, 0.005, 0.2, 0.075, 0.085) < 0) lum *= 0.18; if (d > -0.013) lum += 0.4; }
        lum = clamp(lum * clamp(rv * 4)); A.chr[i] = ascRamp(A, lum); const q = 0.45 + 0.75 * lum; A.R[i] = Math.min(255, tint[0] * q); A.G[i] = Math.min(255, tint[1] * q); A.B[i] = Math.min(255, tint[2] * q); continue;
      }
    }
    if (h > 0.992) { const b = 0.5 + 0.5 * Math.sin(t * 2 + h * 90); put(col, row, b > 0.6 ? "+" : ".", 90 + 120 * b, 90 + 120 * b, 110 + 120 * b); }
    else if (row > rows * 0.88) { const f = noise2(col * 0.07 + t * 0.12, row * 0.35, 64); if (f > 0.55) put(col, row, f > 0.75 ? ":" : ".", 70 + 80 * f, 80 + 80 * f, 100 + 80 * f); }
  }
  const toc = (nx, ny) => [(cxk + nx * Hk) / cw, (topk + ny * Hk) / chh], band = 0.55 + 0.45 * Math.sin(t * 9) * (0.4 + S.pulse);
  for (let c = Math.round(toc(-0.105, 0)[0]); c <= Math.round(toc(0.105, 0)[0]); c++) for (let dr = -1; dr <= 0; dr++) put(c, toc(0, 0.19)[1] + dr, dr ? "=" : "#", sc[0] * (0.7 + 0.3 * band), sc[1], sc[2]);   // scarf wrapped across the eyes
  [[0.1, 0.19, 0.66, -0.12, 0, 1], [0.07, 0.205, 0.45, 0.1, 1.7, 0.75], [0.0, 0.2, 0.3, 0.55, 3.1, 0.6]].forEach(([ax, ay, L, base, ph, wk]) => {   // the streaming scarf tails
    const N = 44, ds = L / N; let x = ax, y = ay;
    for (let i = 0; i <= N; i++) {
      const s = i / N, th = base + (0.55 + 0.5 * wind * wk) * Math.sin(i * 0.3 - t * 3.2 * (0.7 + 0.4 * wind) + ph) * s + 0.25 * Math.sin(i * 0.11 - t * 1.1 + ph) * s + 0.2 * S.pulse * s;
      const wpx = 0.036 * Hk * (1 - 0.8 * s) * (1 + 0.25 * Math.sin(i * 0.7 - t * 4 + ph)), rx = Math.max(0.6, wpx / cw), ry = Math.max(0.5, wpx / chh), [cx, cy] = toc(x, y);
      for (let r = Math.floor(cy - ry); r <= cy + ry; r++) for (let c = Math.floor(cx - rx); c <= cx + rx; c++) {
        const e = ((c - cx) / rx) ** 2 + ((r - cy) / ry) ** 2; if (e > 1) continue; const edge = e > 0.55, lum = clamp((0.95 - 0.5 * s) * (edge ? 0.7 : 1) * (0.8 + 0.3 * Math.sin(i * 0.9 - t * 5)));
        if (c >= 0 && c < cols && r >= 0 && r < rows) { const k = r * cols + c; A.chr[k] = ascRamp(A, lum * 0.9 + 0.1); const q = 0.45 + 0.75 * lum; A.R[k] = Math.min(255, sc[0] * q); A.G[k] = Math.min(255, sc[1] * q); A.B[k] = Math.min(255, sc[2] * q); }
      }
      x += ds * Math.cos(th); y += ds * Math.sin(th);
    }
  });
  if (!A.dust) A.dust = Array.from({ length: 70 }, () => ({ x: Math.random() * cols, y: Math.random() * rows, v: 4 + Math.random() * 10, c: ["'", ".", ",", "`"][(Math.random() * 4) | 0] }));
  A.dust.forEach((q) => { q.x += q.v * wind * dt; q.y += Math.sin(t + q.x * 0.2) * 0.6 * dt; if (q.x > cols) { q.x = 0; q.y = Math.random() * rows; } put(q.x, q.y, q.c, 160, 150, 140); });
}
// --- 5. Cosmos: a spiral galaxy in characters; arms rotate with the music, stars twinkle ---
function ascScCosmos(A, S, W, H, now, dt, prox, C) {
  const { cols, rows, cw, chh } = A, t = now / 1000, en = S.en * C.ascReact, rot = t * 0.06 * (1 + en), cxp = W / 2, cyp = H / 2, R0 = Math.min(W, H) * 0.5; if (A.mode === "cover") A.mode = "palette";
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
    const i = row * cols + col, rv = ascRev(A, now, col, row); if (rv < 0) { A.chr[i] = 0; continue; }
    const x = (col + 0.5) * cw - cxp, y = ((row + 0.5) * chh - cyp) * 1.45, r = (Math.hypot(x, y) / R0) * 1.2 + 0.001, th = Math.atan2(y, x) - rot;
    const arm = Math.pow(0.5 + 0.5 * Math.cos(2 * (th - 3.4 * Math.log(r + 0.18))), 3), core = Math.exp(-r * 5) * 1.3, disk = Math.exp(-r * 1.7), cloud = noise2(col * 0.09 + t * 0.03, row * 0.14, 64);
    let lum = (arm * 0.9 * disk + core) * (0.55 + 0.7 * cloud) * (0.8 + 0.4 * en); const hs = ASC_HASH(col, row, 11); if (hs > 0.985) lum = Math.max(lum, 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 2 + hs * 80)));
    lum += prox(col * cw, row * chh, 170) * 0.4; ascSet(A, S, i, clamp(lum * clamp(rv * 4)), 0, 0, 0);
  }
}
// ===== Autonomous generative ASCII engine (asc_auto) ==================================================================
// A SceneDirector classifies every track (title / artist / audio analysis) into a mood cluster, then keeps morphing between
// procedural worlds (ocean, eye, earth, saturn, black hole, sun) on musical phrase boundaries, with no user input.
// Rules for everything below: zero allocation inside the frame loop (typed arrays are created once per resize / per session),
// every glyph goes through the cached glyph atlas, and a device profile + frame budget keep old machines at a stable frame rate.
const TAU = 6.283185307, CL_MOODS = ["cyber", "cosmic", "organic", "surreal"];
const ZT = (() => { const t = new Float32Array(4096), r = mulberry(12345); for (let i = 0; i < 4096; i++) t[i] = r(); return t; })();   // static hash table (built once)
function zh(a, b) { return ZT[(Math.imul(a, -1640531535) ^ Math.imul(b, -2048144789)) >>> 20]; }
function zn(x, y, P) {   // same value noise as noise2 (periodic in x) but allocation-free: no closure per call
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), a0 = ((ix % P) + P) % P, a1 = (((ix + 1) % P) + P) % P;
  return (zh(a0, iy) * (1 - sx) + zh(a1, iy) * sx) * (1 - sy) + (zh(a0, iy + 1) * (1 - sx) + zh(a1, iy + 1) * sx) * sy;
}
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// ---------- 1. Device profiles + dynamic frame budget ----------
const PERF = {
  ultra:    { sc: 1.0,  fps: 60, size: 10, parts: 260, bhq: 512, glow: true,  vig: true,  steps: 1.0, rip: 4, pot: false },
  balanced: { sc: 0.85, fps: 60, size: 13, parts: 120, bhq: 384, glow: true,  vig: true,  steps: 0.7, rip: 3, pot: false },
  potato:   { sc: 0.65, fps: 30, size: 16, parts: 48,  bhq: 256, glow: false, vig: false, steps: 0.4, rip: 2, pot: true }   // Low RAM
};
const CL_AUTO_PROFILE = (() => {   // perfPreset "auto": RAM <= 4 GB or <= 4 threads => potato
  try { const m = navigator.deviceMemory, c = navigator.hardwareConcurrency; if ((m && m <= 4) || (c && c <= 4)) return "potato"; return m >= 8 && c >= 8 ? "ultra" : "balanced"; } catch { return "balanced"; }
})();
function perfEff(S) {   // effective settings; one cached object, rebuilt only when a input changes
  const C = S.cfg, lvl = S.bud ? S.bud.lvl : 0, pre = C.perfPreset || "auto", E = S.eff || (S.eff = { name: "", sc: 1, fps: 60, size: 11, parts: 120, bhq: 384, glow: true, vig: true, steps: 1, rip: 3, pot: false });
  if (E.k0 === pre && E.k1 === C.ascSize && E.k2 === C.fps && E.k3 === C.bhq && E.k4 === lvl) return E;
  E.k0 = pre; E.k1 = C.ascSize; E.k2 = C.fps; E.k3 = C.bhq; E.k4 = lvl;
  const id = pre === "auto" ? CL_AUTO_PROFILE : pre, P = PERF[id];
  if (P) { E.name = id; E.sc = P.sc; E.fps = P.fps; E.size = P.size; E.parts = P.parts; E.bhq = P.bhq; E.glow = P.glow; E.vig = P.vig; E.steps = P.steps; E.rip = P.rip; E.pot = P.pot; }
  else { E.name = "custom"; E.sc = 1; E.fps = C.fps || 60; E.size = C.ascSize || 11; E.parts = 160; E.bhq = C.bhq || 384; E.glow = true; E.vig = true; E.steps = 0.8; E.rip = 3; E.pot = false; }
  for (let l = 0; l < lvl; l++) { if (E.size < 20) E.size += 2; else E.sc = Math.max(0.5, E.sc - 0.1); }   // budget steps: bigger tiles first, then lower resolution
  return E;
}
function perfBudget(S, E, ms, skip) {   // frame delta over budget for 5 frames in a row => one step down
  const B = S.bud || (S.bud = { lvl: 0, last: ms, bad: 0, cool: 0 }), d = ms - B.last; B.last = ms;
  if (skip || d <= 0 || d > 250) { B.bad = 0; return; }   // pause / tab switch / track change / morph transition (two scenes render): ignore
  if (B.cool > 0) { B.cool--; return; }
  if (d > Math.max(20, 1500 / E.fps)) { if (++B.bad >= 5) { B.bad = 0; if (B.lvl < 8) { B.lvl++; B.cool = 45; } } } else B.bad = 0;
}

// ---------- 2. Grid writers (colour mode aware) ----------
function zcol(A, B, i, lum, r, g, b) {
  const m = A.mode;
  if (m === "mono") { B.R[i] = B.G[i] = B.B[i] = 70 + 185 * lum; return; }
  if (m === "accent") { const a = A.acc, q = 0.3 + 0.7 * lum; B.R[i] = a[0] * q; B.G[i] = a[1] * q; B.B[i] = a[2] * q; return; }
  const q = 0.45 + 0.75 * lum;
  if (m === "scene") { B.R[i] = Math.min(255, r * q); B.G[i] = Math.min(255, g * q); B.B[i] = Math.min(255, b * q); return; }
  const k = Math.min(63, (lum * 63) | 0) * 3, pl = A.pl;   // cover / palette: scene colour tinted by the album palette
  B.R[i] = Math.min(255, r * q * 0.55 + pl[k] * 0.45); B.G[i] = Math.min(255, g * q * 0.55 + pl[k + 1] * 0.45); B.B[i] = Math.min(255, b * q * 0.55 + pl[k + 2] * 0.45);
}
function zput(A, B, i, lum, r, g, b) {   // luminance -> ramp glyph; mids reshape the brightness curve
  lum += A.gk * lum * (1 - lum); if (lum < 0.045) return; if (lum > 1) lum = 1;
  B.chr[i] = ascRamp(A, lum); zcol(A, B, i, lum, r, g, b);
}
function zch(A, B, i, ch, lum, r, g, b) { B.chr[i] = A.gx.get(ch) || 0; zcol(A, B, i, lum > 1 ? 1 : lum, r, g, b); }
function zell(A, B, sx, sy, rr, dp, r, g, b, bl) {   // depth-tested shaded ellipse (whale body segments)
  const cols = A.cols, rows = A.rows, rx = rr / A.cw, ry = rr / A.chh, ccx = sx / A.cw - 0.5, ccy = sy / A.chh - 0.5, zb = A.zb;
  if (rx < 0.45 && ry < 0.45) return;
  const c0 = Math.max(0, Math.floor(ccx - rx)), c1 = Math.min(cols - 1, Math.ceil(ccx + rx)), r0 = Math.max(0, Math.floor(ccy - ry)), r1 = Math.min(rows - 1, Math.ceil(ccy + ry));
  for (let row = r0; row <= r1; row++) { const dy = (row - ccy) / ry;
    for (let col = c0; col <= c1; col++) { const dx = (col - ccx) / rx, q = dx * dx + dy * dy; if (q > 1) continue;
      const i = row * cols + col; if (dp >= zb[i]) continue; zb[i] = dp; B.chr[i] = 0;
      let l = 0.3 + 0.5 * (0.5 - 0.45 * dy) - 0.14 * q; if (dy > 0.3) l += bl; zput(A, B, i, l, r, g, b); }
  }
}

// ---------- 3. Scene Director ----------
const CL_RX = [
  /cyber|robot|machine|digital|electro|techno|industrial|synth|neon|code|wire|metal|steel|grid|data|binary|matrix|chrome|glitch|android|laser|voltage|circuit/i,
  /space|star|galax|cosmo|moon|sun\b|planet|orbit|universe|astro|nebula|aurora|sky|night|heaven|infinite|eternal|ambient|void|satellite|eclipse/i,
  /sea|ocean|wave|water|river|rain|forest|tree|flower|garden|earth|green|wild|nature|bird|whale|island|bloom|summer|spring|mountain|sand|beach|fish|deep|blue/i,
  /dream|eye|mirror|alice|wonder|surreal|vision|sleep|mind|ghost|shadow|face|illusion|trip|psych|haze|fantasy|look|watch|see\b/i
];
const CL_ARTIST = [[/daft punk|kraftwerk|nine inch|depeche|deadmau5|aphex|justice|skrillex|prodigy/i, 0], [/pink floyd|brian eno|vangelis|hans zimmer|m83|sigur|boards of canada|enya/i, 1], [/bon iver|fleet foxes|jack johnson|iron.*wine|nick drake|norah jones/i, 2], [/tame impala|radiohead|mgmt|king gizzard|the weeknd|billie eilish|lana del rey/i, 3]];
// scene order: 0 ocean, 1 eye, 2 earth, 3 saturn, 4 black hole, 5 sun        affinity per cluster
const AFF = [[0.2, 0.7, 0.4, 0.5, 1.0, 0.8], [0.3, 0.3, 0.8, 1.0, 0.9, 0.6], [1.0, 0.4, 0.9, 0.3, 0.1, 0.5], [0.7, 1.0, 0.5, 0.6, 0.8, 0.4]];
const SCENE_NAMES = ["Ocean", "Eye", "Earth", "Saturn", "Black hole", "Solar flare"];
function dirCreate() {
  return { uri: null, sig: null, seed: 1, cluster: 0, cs: new Float32Array(4), order: new Uint8Array([0, 1, 2, 3, 4, 5]), tmp: new Float32Array(6), oi: 0, cur: 0, nxt: 0, tp: -1, tType: 0, tDur: 2.4,
    t0: 0, due: 40, lastPos: 0, sx: 0, bx: 0, gx: 0, force: false, bpm: 110, T: 0, rt: 0, vs: new Uint32Array(6), prevPulse: 0, bs: 0, ripI: 0, palK: -1, pal: new Uint8Array(16), fr: new Uint8Array(3),
    X: { bass: 0, mid: 0.5, hi: 0.3, chaos: 0, spd: 1, beat: false },
    dust: new Float32Array(320 * 4), dustN: 320, sh: new Float32Array(3 * 6), fish: new Float32Array(160 * 4), fishN: 160, rip: new Float32Array(4 * 3), rr: new Float32Array(4 * 3), fl: new Float32Array(4 * 6),
    eye: { bt: -9, rest: false, nextIdle: 2, lx: 0, ly: 0, pup: 0.3 }, earth: new Uint8Array(128 * 64), earthK: -1, satT: -9, flT: -9 };
}
function dirSeedPools(D) {
  const r = mulberry(D.seed), d = D.dust, f = D.fish;
  for (let i = 0; i < D.dustN; i++) { d[i * 4] = r(); d[i * 4 + 1] = r(); d[i * 4 + 2] = r(); d[i * 4 + 3] = r() * TAU; }
  for (let i = 0; i < D.fishN; i++) { f[i * 4] = (r() + r() + r() - 1.5) * 1.1; f[i * 4 + 1] = (r() + r() - 1) * 1.1; f[i * 4 + 2] = r() * 2 - 1; f[i * 4 + 3] = r() * TAU; }
  for (let i = 0; i < 6; i++) D.vs[i] = (r() * 1e6) | 0;
}
function dirPal(S, D) {
  const p = cl2(S), q = D.pal; D.palK = S.galVer || 0;
  for (let k = 0; k < 4; k++) { q[k * 3] = p[k][0]; q[k * 3 + 1] = p[k][1]; q[k * 3 + 2] = p[k][2]; }
  const w = mixc(p[0], [255, 255, 255], 0.55); D.fr[0] = w[0]; D.fr[1] = w[1]; D.fr[2] = w[2];
}
function dirClassify(S, D, C) {   // song mood -> abstract emotional cluster -> scene order
  const cs = D.cs, txt = (S.artist || "") + " " + (S.title || ""); cs.fill(0);
  for (let k = 0; k < 4; k++) if (CL_RX[k].test(txt)) cs[k] += 3;
  for (let k = 0; k < CL_ARTIST.length; k++) if (CL_ARTIST[k][0].test(S.artist || "")) cs[CL_ARTIST[k][1]] += 3;
  let bpm = S.tempo || 0, loud = -12, bri = 0.5, vr = 4; const g = S.seg;
  if (g && g.length > 4) { let sl = 0, sb = 0, s2 = 0; for (let j = 0; j < g.length; j++) { const l = g[j].loudness_max; sl += l; s2 += l * l; sb += g[j].timbre ? g[j].timbre[1] : 100; }
    loud = sl / g.length; vr = s2 / g.length - loud * loud; bri = clamp((sb / g.length - 30) / 160); }
  const b = S.beats; if (!bpm && b && b.length > 8) bpm = (60 * (b.length - 1)) / Math.max(1, b[b.length - 1].start - b[0].start);
  D.bpm = bpm > 40 && bpm < 240 ? bpm : 110;
  if (D.bpm >= 118) cs[0] += 1.2; if (loud > -9) cs[0] += 1; if (bri > 0.55) cs[0] += 0.8;
  if (D.bpm < 100) cs[1] += 1.2; if (loud < -12) cs[1] += 1.2; if (vr < 8) cs[1] += 0.5;
  if (bri < 0.45) cs[2] += 1; if (D.bpm >= 70 && D.bpm < 125) cs[2] += 0.6; if (loud < -10 && loud > -16) cs[2] += 0.5;
  cs[3] += 0.8 + vr * 0.08;
  const fm = CL_MOODS.indexOf(C.dirMood); if (fm >= 0) cs[fm] += 100;
  let bi = 0; for (let k = 1; k < 4; k++) if (cs[k] > cs[bi]) bi = k; D.cluster = bi;
  for (let s = 0; s < 6; s++) D.tmp[s] = AFF[bi][s] + (((D.seed >>> (s * 3)) & 255) / 255) * 0.3;
  for (let s = 0; s < 6; s++) D.order[s] = s;
  for (let a = 0; a < 5; a++) for (let c2 = a + 1; c2 < 6; c2++) if (D.tmp[D.order[c2]] > D.tmp[D.order[a]]) { const t = D.order[a]; D.order[a] = D.order[c2]; D.order[c2] = t; }
}
function dirTrack(S, D, C) {   // new track
  D.uri = S.uri; D.sig = null; D.seed = hashStr((S.artist || "") + "|" + (S.title || "")); D.oi = 0; D.tp = -1; D.sx = D.bx = D.gx = 0; D.t0 = S.pos || 0; D.lastPos = S.pos || 0;
  D.due = 35 + Math.random() * 20; D.force = false; dirSeedPools(D); D.earthK = -1; dirClassify(S, D, C); D.cur = D.order[0];
}
function dirTick(S, D, C, E, dt) {
  const pos = S.pos || 0; D.rt += dt;
  if (pos + 1.5 < D.lastPos) { D.sx = D.bx = D.gx = 0; if (pos < D.t0) D.t0 = pos; }   // seeked backwards
  D.lastPos = pos;
  let hit = 0; const sc = S.secs, br = S.bars, sg = S.seg;   // musical boundaries: section change (2), every 4th bar (1), loudness drop (3)
  if (sc) while (D.sx < sc.length && sc[D.sx].start <= pos) { if (D.sx > 0 && pos - sc[D.sx].start < 0.8) hit = Math.max(hit, 2); D.sx++; }
  if (br) while (D.bx < br.length && br[D.bx].start <= pos) { if (D.bx % 4 === 0 && pos - br[D.bx].start < 0.6) hit = Math.max(hit, 1); D.bx++; }
  if (sg) while (D.gx < sg.length && sg[D.gx].start <= pos) { if (D.gx > 0 && pos - sg[D.gx].start < 0.4 && sg[D.gx].loudness_max - sg[D.gx - 1].loudness_max > 7) hit = 3; D.gx++; }
  if (!sc && !br && !sg && D.X.beat) hit = 1;
  if (D.tp >= 0) { D.tp += dt / D.tDur; if (D.tp >= 1) { D.tp = -1; D.cur = D.nxt; D.t0 = pos; D.due = 35 + Math.random() * 20; } return; }
  const el = pos - D.t0;
  if (D.force || (C.dirAuto !== false && (el >= D.due || (el >= Math.max(35, D.due - 8) && hit)))) {
    D.oi = (D.oi + 1) % 6; D.nxt = D.order[D.oi]; D.vs[D.nxt] = (Math.random() * 1e6) | 0; D.earthK = -1; D.tp = 0; D.force = false;
    const fx = ["dissolve", "glitch", "fluid"].indexOf(C.dirStyle); D.tType = fx >= 0 ? fx : hit === 3 ? 1 : hit === 2 ? 2 : (Math.random() * 3) | 0; D.tDur = E.pot ? 1.6 : 2.4;
  }
}

// ---------- 4. Audio feature bus ----------
function audioBus(S, D, C, dt) {
  const X = D.X, rc = C.ascReact, pu = S.pulse; X.beat = pu > 0.55 && D.prevPulse <= 0.55; D.prevPulse = pu;
  D.bs = pu > D.bs ? pu : D.bs + (pu - D.bs) * Math.min(1, dt * 12); X.bass = D.bs * rc;                    // kick
  X.mid += (S.en - X.mid) * Math.min(1, dt * 6);                                                              // vocals / body (loudness envelope)
  const g = S.seg && S.seg[S.si]; let tb = 0.35 + 0.2 * Math.sin(D.rt * 1.1);                                 // treble proxy: segment brightness + onset density
  if (g) tb = clamp((g.timbre ? g.timbre[1] - 30 : 60) / 160) * 0.6 + clamp(0.35 / Math.max(0.08, g.duration || 0.3)) * 0.4;
  X.hi += (tb - X.hi) * Math.min(1, dt * 5);
  X.spd = Math.max(0.6, Math.min(1.8, D.bpm / 110)) * (0.6 + 0.8 * X.mid) * (C.ascAmp == null ? 1 : C.ascAmp);   // BPM + valence -> global speed
  X.chaos = sstep(0.55, 0.9, S.en) * Math.min(1.5, rc);
}

// ---------- 5. Shared layers ----------
function dustLayer(A, B, D, E, T, dt) {   // treble-driven sparkle dust + shooting stars
  const X = D.X, cols = A.cols, rows = A.rows, d = D.dust, n = Math.min(D.dustN, (E.parts * (0.5 + 1.1 * X.hi)) | 0);
  for (let j = 0; j < n; j++) { const o = j * 4, z = d[o + 2], x = (d[o] + Math.sin(T * 0.07 * z + d[o + 3]) * 0.01 + T * 0.003 * z) % 1, y = (d[o + 1] + T * 0.002 * z) % 1, i = ((y * rows) | 0) * cols + ((x * cols) | 0);
    if (B.chr[i]) continue; const tw = 0.5 + 0.5 * Math.sin(T * (1.5 + 3 * z) + d[o + 3]), l = 0.25 + 0.6 * tw * (0.4 + z);
    zch(A, B, i, tw > 0.92 && z > 0.6 ? "*" : z > 0.55 ? "+" : ".", l, 200, 215, 255); }
  const sh = D.sh; if (!E.pot || X.hi > 0.7) if (X.hi > 0.55 && Math.random() < dt * (X.hi - 0.4) * 4) for (let k = 0; k < 3; k++) if (sh[k * 6 + 4] <= 0) { const o = k * 6, a = 0.4 + Math.random() * 0.8; sh[o] = Math.random() * cols; sh[o + 1] = Math.random() * rows * 0.5; sh[o + 2] = Math.cos(a) * 60; sh[o + 3] = Math.sin(a) * 30; sh[o + 4] = 1; break; }
  for (let k = 0; k < 3; k++) { const o = k * 6; if (sh[o + 4] <= 0) continue; sh[o + 4] -= dt * 1.1; sh[o] += sh[o + 2] * dt; sh[o + 1] += sh[o + 3] * dt;
    for (let q = 0; q < 7; q++) { const c = (sh[o] - sh[o + 2] * q * 0.012) | 0, r = (sh[o + 1] - sh[o + 3] * q * 0.012) | 0; if (c < 0 || r < 0 || c >= cols || r >= rows) continue; zch(A, B, r * cols + c, q ? (q < 3 ? "-" : ".") : "*", clamp(sh[o + 4]) * (1 - q * 0.12), 255, 245, 220); } }
}

// ---------- 6. Scenes: (A grid, B target buffers, S, W, H, T scene clock, dt, E profile, X audio, D director, prox) ----------
function scOcean(A, B, S, W, H, T, dt, E, X, D, prox) {
  const { cols, rows, cw, chh } = A, md = Math.min(W, H), zb = A.zb, bass = X.bass; zb.fill(1e9);
  const c1 = A.c1, c2 = A.c2, r1 = A.r1, r2 = A.r2, nq = A.nb;   // light shafts via angle-addition (no trig per cell) + half-resolution stipple noise
  for (let col = 0; col < cols; col++) { const x = col / cols, al = x * 9 + T * 0.25 + 1.7 * Math.sin(x * 3 - T * 0.1); c1[col] = Math.sin(al); c2[col] = Math.cos(al); }
  for (let row = 0; row < rows; row++) { const be = (row / rows) * 1.8; r1[row] = Math.sin(be); r2[row] = Math.cos(be); }
  for (let row = 0; row < rows; row++) { const y = row / rows, dep = 1 - y, ev = (row & 1) === 0;
    for (let col = 0; col < cols; col++) { if (ev) nq[col] = (col & 1) === 0 ? zn(col * 0.07 + T * 0.05, row * 0.09 - T * 0.03, 64) : nq[col - 1];
      const ray = 0.5 + 0.5 * (c1[col] * r2[row] + c2[col] * r1[row]);
      zput(A, B, row * cols + col, dep * dep * ray * ray * ray * 0.5 + (nq[col] - 0.42) * 0.22 + 0.04 + y * 0.05, 40, 110 + 70 * dep, 200); } }
  const nW = E.pot ? 1 : E.parts > 200 ? 3 : 2, ns = 12 + ((18 * E.steps) | 0), vs0 = (D.vs[0] % 628) * 0.01;
  for (let k = 0; k < nW; k++) {   // parametric whales: spine flex travels down the body, yaw follows the swim path, size follows depth
    const ph = k * 2.3 + vs0, u = T * 0.05 + ph, a = u * 0.8, c2 = u * 0.37 + ph, px = W * (0.5 + 0.32 * Math.sin(a)), py = H * (0.46 + 0.16 * Math.sin(u * 0.55 + ph * 1.7)), z = 1.5 + 0.6 * Math.sin(c2) + k * 0.25;
    const yaw = Math.atan2(Math.cos(c2) * 0.26, Math.cos(a) * 0.8), cyw = Math.cos(yaw), syw = Math.sin(yaw), s = (md * 0.34) / z * (1 + 0.05 * bass), flex = 0.11 * (1 + 0.8 * bass);
    for (let j = 0; j < ns; j++) { const t = j / (ns - 1), r = 0.11 * Math.pow(Math.sin(Math.PI * (0.06 + 0.9 * Math.pow(t, 0.8))), 0.9) * (1 - 0.5 * t);
      const lx = 0.5 - t, ly = Math.sin(T * 1.6 - t * 3.6 + ph) * flex * t * t + 0.02 * Math.sin(T * 0.5 + ph), zr = -lx * syw, pf = 1 / (1 + 0.25 * zr);
      zell(A, B, px + lx * cyw * s * pf, py + ly * s * pf, r * s * pf, z + zr * 0.3, 70, 115, 160, 0.2); }
    for (let sd = -1; sd <= 1; sd += 2) for (let q = 1; q <= 5; q++) {   // tail flukes
      const lx = -0.5 + 0.02 * q, lz = sd * 0.03 * q, ly = Math.sin(T * 1.6 - 3.6 + ph) * flex, xr = lx * cyw + lz * syw, zr = -lx * syw + lz * cyw, pf = 1 / (1 + 0.25 * zr);
      zell(A, B, px + xr * s * pf, py + ly * s * pf, 0.012 * s * pf, z + zr * 0.3, 90, 135, 175, 0); }
  }
  const nF = Math.min(D.fishN, (E.parts * 0.5) | 0), lt = T * 0.09 + (D.vs[0] % 100) * 0.1, lx = W * (0.5 + 0.38 * Math.sin(lt)), ly = H * (0.5 + 0.26 * Math.sin(T * 0.13 + 1.3));
  const dx = 0.38 * 0.09 * Math.cos(lt) * W, dy = 0.26 * 0.13 * Math.cos(T * 0.13 + 1.3) * H, dirx = dx >= 0 ? 1 : -1, zs = 0.9 + 0.35 * Math.sin(T * 0.05), ang = Math.atan2(dy, dx), ca = Math.cos(ang), sa = Math.sin(ang), f = D.fish;
  for (let j = 0; j < nF; j++) {   // school: every fish follows the leader path with its own offset, wobble and depth
    const o = j * 4, ox = f[o] * md * 0.16, oy = f[o + 1] * md * 0.08, ph = f[o + 3], wob = Math.sin(T * 1.7 + ph) * md * 0.006, z = Math.max(0.4, zs + f[o + 2] * 0.3);
    const fx = lx + ca * ox - sa * oy + wob, fy = ly + sa * ox + ca * oy + wob, len = Math.max(1, Math.round((md * 0.05) / z / cw)), c0 = Math.round(fx / cw), r0 = Math.round(fy / chh), l = clamp(1.05 - (z - 0.5) * 0.45), orange = j % 5 === 0;
    for (let q = 0; q < len; q++) { const cc = c0 - dirx * q, rq = r0 + (len > 2 ? Math.round(Math.sin(T * 7 + ph - q * 0.9) * (q / len)) : 0); if (cc < 0 || cc >= cols || rq < 0 || rq >= rows) continue;
      const i = rq * cols + cc; if (z >= zb[i]) continue; zb[i] = z;
      zch(A, B, i, q === 0 ? (dirx > 0 ? ">" : "<") : q === len - 1 && len > 2 ? "~" : "=", l, orange ? 255 : 170, orange ? 170 : 225, orange ? 90 : 255); } }
  const d = D.dust, nb = Math.min(D.dustN, (E.parts * (0.4 + 0.6 * X.hi)) | 0);   // bubbles rise with depth parallax; treble raises the count
  for (let j = 0; j < nb; j++) { const o = j * 4, z = d[o + 2], x = (d[o] + Math.sin(T * 0.3 + d[o + 3]) * 0.01) % 1, y = 1 - ((d[o + 1] + T * 0.02 * (0.3 + z)) % 1), i = ((y * rows) | 0) * cols + ((x * cols) | 0);
    if (B.chr[i]) continue; zch(A, B, i, z > 0.8 ? "O" : z > 0.45 ? "o" : ".", 0.35 + 0.4 * z + prox(x * W, y * H, 140) * 0.4, 170, 215, 255); }
}
function scEye(A, B, S, W, H, T, dt, E, X, D, prox) {
  const { cols, rows, cw, chh } = A, e = D.eye, cx = W / 2, cy = H / 2, R = Math.min(W * 0.4, H * 0.8), ir = 0.34;
  const L = S.lines && S.lines[S.li], rest = !L || (S.pos || 0) > S.hl + 0.25;   // blink when the vocal phrase rests
  if ((rest && !e.rest) || D.rt > e.nextIdle) { e.bt = D.rt; e.nextIdle = D.rt + 3.5 + Math.random() * 3.5; } e.rest = rest;
  const bp = (D.rt - e.bt) / 0.3, open = (0.8 + 0.2 * X.mid) * (bp >= 0 && bp < 1 ? 1 - Math.pow(Math.sin(bp * Math.PI), 1.2) : 1);
  let tx, ty; if (S.pa > 0.05) { tx = clamp((S.px - cx) / (W * 0.5) * 0.5 + 0.5) * 2 - 1; ty = clamp((S.py - cy) / (H * 0.5) * 0.5 + 0.5) * 2 - 1; } else { tx = Math.sin(D.rt * 0.37) * 0.5; ty = Math.sin(D.rt * 0.53 + 1) * 0.3; }   // cursor tracking
  e.lx += (tx - e.lx) * Math.min(1, dt * 9); e.ly += (ty - e.ly) * Math.min(1, dt * 9);
  e.pup += (0.28 + 0.42 * X.bass + 0.08 * (1 - X.mid) - e.pup) * Math.min(1, dt * 18);   // bass dilates the pupil
  const ix = e.lx * 0.3, iy = e.ly * 0.15, pr = Math.min(0.85, e.pup), ct = A.ct, cb = A.cb, hs = (0.05 * chh) / R;
  for (let col = 0; col < cols; col++) { const uu = Math.abs(((col + 0.5) * cw - cx) / R), w = uu >= 1 ? 0 : 1 - Math.pow(uu, 2.2); ct[col] = 0.5 * open * Math.pow(w, 0.9); cb[col] = 0.34 * open * Math.pow(w, 0.9); }
  const p = D.pal, irr = p[0] * 0.5 + 60, irg = p[1] * 0.4 + 90, irb = p[2] * 0.3 + 110, seedA = (D.vs[1] % 50);
  for (let row = 0; row < rows; row++) { const v = ((row + 0.5) * chh - cy) / R;
    for (let col = 0; col < cols; col++) { const u = ((col + 0.5) * cw - cx) / R, top = ct[col], bot = cb[col], i = row * cols + col;
      if (open < 0.12) { if (Math.abs(v) < hs && Math.abs(u) < 0.98) zch(A, B, i, "-", 0.6, 230, 200, 190); continue; }
      if (v < -top || v > bot || Math.abs(u) >= 1) continue;
      const edge = v < 0 ? -v / top : v / bot;
      if (edge > 0.88) { zch(A, B, i, v < 0 ? "=" : "-", 0.55 + 0.3 * (edge - 0.88) * 8, 235, 205, 190); continue; }
      const dx = u - ix, dy = v - iy, rr = Math.sqrt(dx * dx + dy * dy) / ir, shade = 1 - edge * edge * edge * 0.7;
      if (rr < 1) { if (rr < pr) continue;   // pupil stays black
        const fib = zn((Math.atan2(dy, dx) / TAU + 0.5) * 36 + seedA, rr * 7 + T * 0.05, 36), cd = (rr - pr * 1.3) / 0.12, collar = 1 / (1 + cd * cd * 8), lim = sstep(0.8, 1, rr);
        const lum = (0.3 + 0.55 * fib + 0.35 * collar) * (1 - 0.75 * lim) * shade * (0.75 + 0.35 * X.mid), k = 0.6 + 0.6 * fib; zput(A, B, i, lum, irr * k, irg * k, irb * k);
      } else { const vein = zn(u * 14 + 5, v * 14, 64) > 0.84; zput(A, B, i, (vein ? 0.4 : 0.2 + 0.1 * zn(u * 9, v * 9, 64)) * shade, vein ? 230 : 225, vein ? 120 : 220, vein ? 120 : 215); }
    } }
  if (open >= 0.12) { const hx = ((cx + (ix - 0.3 * ir) * R) / cw) | 0, hy = ((cy + (iy - 0.35 * ir) * R) / chh) | 0; for (let q = 0; q < 2; q++) { const c2 = hx + q; if (c2 >= 0 && c2 < cols && hy >= 0 && hy < rows) zch(A, B, hy * cols + c2, "@", 1, 255, 255, 255); } }
}
function bakeEarth(D, seed) {   // procedural continent density map (128 x 64), baked once per visit
  const m = D.earth, sd = seed % 53;
  for (let j = 0; j < 64; j++) for (let i = 0; i < 128; i++) { const x = i / 128, v = 0.55 * zn(x * 6 + sd, j * 0.13 + sd, 6) + 0.3 * zn(x * 12 + sd, j * 0.26, 12) + 0.15 * zn(x * 24, j * 0.52 + sd, 24); m[j * 128 + i] = Math.max(0, Math.min(255, (v - 0.53) * 5 * 255)); }
}
function scEarth(A, B, S, W, H, T, dt, E, X, D, prox) {
  const { cols, rows, cw, chh } = A, cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.36 * (1 + 0.05 * X.bass), sp = T * 0.25, tc = Math.cos(0.41), ts = Math.sin(0.41), m = D.earth;
  if (D.earthK !== D.vs[2]) { D.earthK = D.vs[2]; bakeEarth(D, D.vs[2]); }
  const sa = T * 0.04 + 1.2, s0 = Math.cos(sa), s1 = -0.3, s2 = 0.55 + 0.5 * Math.sin(sa), sl = Math.hypot(s0, s1, s2), sx = s0 / sl, sy = s1 / sl, sz = s2 / sl;   // virtual sun
  dustLayer(A, B, D, E, T, dt);
  for (let row = 0; row < rows; row++) { const v = ((row + 0.5) * chh - cy) / R;
    for (let col = 0; col < cols; col++) { const u = ((col + 0.5) * cw - cx) / R, r2 = u * u + v * v, i = row * cols + col;
      if (r2 > 1.3) continue;
      if (r2 > 1) { const rr = Math.sqrt(r2), a = 1 - (rr - 1) / 0.14; if (a > 0) { const sun = clamp(0.2 + 0.8 * ((u * sx + v * sy) / rr + 0.3)); B.chr[i] = 0; zput(A, B, i, a * a * (0.15 + 0.8 * sun), 110, 170, 255); } continue; }   // atmosphere rim
      const nz = Math.sqrt(1 - r2), px = u * tc + v * ts, py = -u * ts + v * tc, lon = Math.atan2(px, nz) + sp, dif = u * sx + v * sy + nz * sz;
      const la = Math.asin(Math.max(-1, Math.min(1, -py))), li = ((((lon / TAU) % 1) + 1) % 1 * 128) | 0, lj = Math.min(63, ((la / Math.PI + 0.5) * 64) | 0), d = m[lj * 128 + li] / 255, day = clamp(dif * 1.15 + 0.1);
      B.chr[i] = 0; let lum, r, g, b;
      if (Math.abs(la) > 1.25) { lum = 0.2 + 0.7 * day; r = 235; g = 245; b = 255; }   // polar ice
      else if (d > 0.02) { lum = 0.12 + 0.6 * day + d * 0.15; r = 60 + 90 * d; g = 140 - 20 * d; b = 70; if (dif < 0.08 && ASC_HASH(li, lj, 5) > 0.965) { zch(A, B, i, "*", 0.7, 255, 220, 120); continue; } }   // land / night city lights
      else { lum = 0.1 + 0.45 * day + Math.pow(Math.max(0, dif), 24) * 0.5; r = 30; g = 85; b = 185; }
      lum += (1 - nz) * (1 - nz) * (1 - nz) * 0.35 * day;
      const ql = Math.abs(lon * 12 / Math.PI - Math.round(lon * 12 / Math.PI)), qa = Math.abs(la * 12 / Math.PI - Math.round(la * 12 / Math.PI)), tl = 0.05 / (0.25 + nz), lo = ql < tl, lt2 = qa < 0.05;
      if (lo || lt2) { zch(A, B, i, lo && lt2 ? "+" : lo ? "|" : "-", 0.35 + 0.35 * Math.max(0, dif), 150, 200, 255); continue; }   // lat / long graticule
      zput(A, B, i, lum, r, g, b); } }
}
function scSaturn(A, B, S, W, H, T, dt, E, X, D, prox) {
  const { cols, rows, cw, chh } = A, cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.17 * (1 + 0.04 * X.bass), inc = 0.36 + 0.1 * Math.sin(T * 0.05), sI = Math.sin(inc), cot = Math.cos(inc) / sI, seed = D.vs[3] % 7;
  const sa = T * 0.03 + 0.6, s0 = Math.cos(sa) * 0.9, s1 = -0.35, s2 = 0.5 + 0.45 * Math.sin(sa * 0.7), sl = Math.hypot(s0, s1, s2), sx = s0 / sl, sy = s1 / sl, sz = s2 / sl;
  if (X.beat) D.satT = D.rt; const rw = 1.28 + (D.rt - D.satT) * 1.1, mAng = T * 0.2, mx = cx + Math.cos(mAng) * R * 3.1, my = cy + Math.sin(mAng) * R * 3.1 * sI * 1.2;
  dustLayer(A, B, D, E, T, dt);
  for (let row = 0; row < rows; row++) { const v = ((row + 0.5) * chh - cy) / R;
    for (let col = 0; col < cols; col++) { const u = ((col + 0.5) * cw - cx) / R, i = row * cols + col, d2 = u * u + v * v, inP = d2 <= 1, zp = inP ? Math.sqrt(1 - d2) : 0;
      let rl = 0, rr0 = 0, rg = 0, rb = 0, zr = 0;
      const rr = Math.sqrt(u * u + (v / sI) * (v / sI)); zr = v * cot;
      if (rr > 1.28 && rr < 2.4 && (!inP || zr > zp)) {   // procedural ring system: bands, Cassini gap, differential rotation, planet shadow
        let dens = sstep(1.28, 1.34, rr) * (1 - sstep(2.28, 2.36, rr)); if (rr > 1.95 && rr < 2.03) dens *= 0.05; if (rr > 2.19 && rr < 2.21) dens *= 0.3;
        const ang = Math.atan2(v / sI, u), band = E.pot ? 0.5 + 0.5 * Math.sin(rr * 60 + seed) : zn(rr * 40, seed + 3, 64), lump = E.pot ? 1 : 0.8 + 0.5 * zn((ang / TAU + 0.5) * 40 + T * (1.5 / Math.pow(rr, 1.5)), rr * 9, 40);
        const wv = Math.exp(-((rr - rw) / 0.06) * ((rr - rw) / 0.06)) * X.bass * 0.8;
        rl = dens * (0.3 + 0.6 * band) * lump + wv * dens;
        const t = u * sx + v * sy + zr * sz; if (t < 0 && u * u + v * v + zr * zr - t * t < 1) rl *= 0.12;
        rr0 = 225; rg = 200 - 30 * band; rb = 150 - 30 * band; }
      if (inP && !(rl > 0 && zr > zp)) {   // banded gas giant
        const nz = zp, dif = u * sx + v * sy + nz * sz, ca = Math.cos(0.3), sn = Math.sin(0.3), la = Math.asin(Math.max(-1, Math.min(1, -(-u * sn + v * ca)))), bd = 0.5 + 0.5 * Math.sin(la * 13 + 2 * zn(la * 6 + 20, T * 0.05 + seed, 64));
        B.chr[i] = 0; zput(A, B, i, (0.18 + 0.6 * clamp(dif * 1.1 + 0.1)) * (0.7 + 0.4 * bd) * (0.55 + 0.45 * nz), 205 + 30 * bd, 170 + 30 * bd, 110 + 40 * bd); }
      if (rl > 0.02) { B.chr[i] = 0; zput(A, B, i, rl, rr0, rg, rb); }
      else if (!inP) { const mdx = ((col + 0.5) * cw - mx), mdy = ((row + 0.5) * chh - my); if (mdx * mdx + mdy * mdy < R * R * 0.012) zch(A, B, i, "O", 0.8, 220, 210, 200); }
    } }
}
function scBlackHole(A, B, S, W, H, T, dt, E, X, D, prox) {
  const { cols, rows, cw, chh } = A, cx = W / 2, cy = H / 2, Rsh = Math.min(W, H) * 0.13 * (1 + 0.03 * X.bass), inc = 0.36 + 0.08 * Math.sin(T * 0.07), sI = Math.sin(inc), thE = 1.9, rin = 1.6, rout = 7.5, hq = E.steps > 0.5;
  for (let row = 0; row < rows; row++) { const v = ((row + 0.5) * chh - cy) / Rsh;
    for (let col = 0; col < cols; col++) { const u = ((col + 0.5) * cw - cx) / Rsh, th = Math.sqrt(u * u + v * v) + 1e-4, i = row * cols + col;
      let lum = 0, f = 0, su = 0, sv = 0, em = 0, dop = 1;
      if (th > 1) { const k = (th - (thE * thE) / th) / th; su = u * k; sv = v * k;   // point-lens equation: primary + inverted secondary image of the back disk
        if (sv < 0) { const rd = Math.sqrt(su * su + (sv / sI) * (sv / sI)); if (rd > rin && rd < rout) { f = (rd - rin) / (rout - rin); em = Math.pow(1 - f, 1.4) * 1.25 * (0.55 + 0.6 * (hq ? zn((Math.atan2(sv / sI, su) / TAU + 0.5) * 32 + T * 2.4 / Math.pow(Math.max(rd, 1), 1.5), rd * 5, 32) : 0.5)); dop = 0.65 + 0.7 * (0.5 - 0.5 * su / rd); lum = em * dop; } } }
      if (v > 0) { const rd = Math.sqrt(u * u + (v / sI) * (v / sI)); if (rd > rin && rd < rout) { const f2 = (rd - rin) / (rout - rin), e2 = Math.pow(1 - f2, 1.4) * 1.25 * (0.55 + 0.6 * (hq ? zn((Math.atan2(v / sI, u) / TAU + 0.5) * 32 + T * 2.4 / Math.pow(Math.max(rd, 1), 1.5), rd * 5, 32) : 0.5)) * (0.65 + 0.7 * (0.5 - 0.5 * u / rd)); if (e2 > lum) { lum = e2; f = f2; } } }   // front disk, unlensed
      if (lum > 0.02) { B.chr[i] = 0; zput(A, B, i, lum, 255 - 55 * f, 235 - 165 * f, 200 - 170 * f); continue; }
      if (th > 1 && th < 1.07) { zch(A, B, i, "O", 0.7 + 0.3 * X.bass, 255, 240, 210); continue; }   // photon ring
      if (th > 1) { const qx = Math.floor(su * 3.3 + 100), qy = Math.floor(sv * 3.3 + 100), h = ASC_HASH(qx, qy, 17); if (h > 0.985) zch(A, B, i, h > 0.996 ? "*" : ".", 0.35 + 0.5 * (0.5 + 0.5 * Math.sin(T * 2 + h * 90)), 210, 225, 255); }   // lensed stars (Einstein ring smear)
    } }
}
function scSolar(A, B, S, W, H, T, dt, E, X, D, prox) {
  const { cols, rows, cw, chh } = A, cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.24 * (1 + 0.04 * X.bass), fl = D.fl, nMax = E.pot ? 2 : 4, seed = D.vs[5] % 40, hq = E.steps > 0.5;
  let act = 0; for (let k = 0; k < 4; k++) if (fl[k * 6] > 0) act++;
  if ((X.beat && Math.random() < 0.6 + 0.3 * X.chaos) || (act === 0 && D.rt - D.flT > 3.5)) if (act < nMax) for (let k = 0; k < 4; k++) if (fl[k * 6] <= 0) { const o = k * 6; fl[o] = 1; fl[o + 1] = Math.random() * TAU; fl[o + 2] = 0.35 + Math.random() * 0.6; fl[o + 3] = 0.3 + Math.random() * 0.5; fl[o + 4] = T; fl[o + 5] = 2.5 + Math.random() * 2; D.flT = D.rt; break; }
  dustLayer(A, B, D, E, T, dt);
  for (let row = 0; row < rows; row++) { const v = ((row + 0.5) * chh - cy) / R;
    for (let col = 0; col < cols; col++) { const u = ((col + 0.5) * cw - cx) / R, r2 = u * u + v * v, i = row * cols + col;
      if (r2 > 6) continue;
      if (r2 <= 1) { const mu = Math.sqrt(1 - r2), gr = hq ? zn(u * 9 + T * 0.1 + seed, v * 9 - T * 0.07, 64) * 0.6 + zn(u * 22, v * 22 + T * 0.2, 64) * 0.4 : zn(u * 9 + T * 0.1 + seed, v * 9 - T * 0.07, 64), spot = hq && zn(u * 3 + seed, v * 3, 64) > 0.8 ? 0.4 : 1;
        B.chr[i] = 0; zput(A, B, i, (0.5 + 0.5 * gr) * (0.45 + 0.55 * mu) * spot, 255, 170 + 60 * gr, 40 + 30 * gr); continue; }
      const rr = Math.sqrt(r2), ray = 0.6 + 0.6 * (E.pot ? 0.5 : zn((Math.atan2(v, u) / TAU + 0.5) * 24 + T * 0.1, rr * 2, 24)), l = Math.exp(-(rr - 1) * 2.6) * 0.55 * ray * (1 + 0.3 * X.bass);   // corona
      if (l > 0.05) zput(A, B, i, l, 255, 150, 60); } }
  for (let k = 0; k < 4; k++) { const o = k * 6; if (fl[o] <= 0) continue; const lf = (T - fl[o + 4]) / fl[o + 5]; if (lf >= 1) { fl[o] = 0; continue; }
    const e = Math.pow(Math.sin(lf * Math.PI), 0.8), ns = E.pot ? 24 : 44;   // erupting prominence loop
    for (let j = 0; j <= ns; j++) { const s = j / ns, a = fl[o + 1] + (s - 0.5) * fl[o + 3], rad = 1 + fl[o + 2] * e * Math.sin(Math.PI * s), c = ((cx + Math.cos(a) * rad * R) / cw) | 0, r = ((cy + Math.sin(a) * rad * R) / chh) | 0;
      for (let q = 0; q < 2; q++) { const c2 = c + q; if (c2 < 0 || c2 >= cols || r < 0 || r >= rows) continue; zch(A, B, r * cols + c2, q ? "+" : "*", 0.75 + 0.25 * e, 255, 200 - 60 * s, 110); } } }
}
const SCENES = [scOcean, scEye, scEarth, scSaturn, scBlackHole, scSolar];

// ---------- 7. Compositor: dissolve / glitch-wipe / fluid morph between two live scenes ----------
function autoMix(A, D, E, T) {
  const { cols, rows } = A, a = A.z1, b = A.z2, p = D.tp, e = p * p * (3 - 2 * p), type = D.tType, bw = type === 1 ? 0.04 : 0.055, th = e * (1 + 2 * bw) - bw, fr = D.fr, fc = (D.rt * 24) | 0, amp = 1 - Math.abs(2 * e - 1);
  for (let row = 0; row < rows; row++) { const jit = type === 1 ? ((ASC_HASH(row, fc >> 1, 5) - 0.5) * 0.3 * amp) : 0, sh = type === 1 && ASC_HASH(row, fc >> 2, 2) > 0.8 ? (((ASC_HASH(row, fc, 4) - 0.5) * 12 * amp) | 0) : 0;
    for (let col = 0; col < cols; col++) { const i = row * cols + col; let m;
      if (type === 0) m = ASC_HASH(col, row, 3); else if (type === 1) m = col / cols + jit; else m = zn(col * 0.06 + T * 0.3, row * 0.1 - T * 0.2, 64) * 0.75 + ASC_HASH(col, row, 9) * 0.25;
      const q = th - m;
      if (q >= bw || q <= -bw) { const s = q >= bw ? b : a; let j = i; if (sh) { const c2 = col + sh; if (c2 >= 0 && c2 < cols) j = row * cols + c2; } A.chr[i] = s.chr[j]; A.R[i] = s.R[j]; A.G[i] = s.G[j]; A.B[i] = s.B[j]; }
      else { const k = 1 - Math.abs(q) / bw; A.chr[i] = A.pool0 + ((ASC_HASH(col, row, fc) * A.poolN) | 0); A.R[i] = 120 + (fr[0] - 120) * k; A.G[i] = 120 + (fr[1] - 120) * k; A.B[i] = 120 + (fr[2] - 120) * k; } }
  }
}
function autoPost(A, D, E, W, H) {   // bass shockwaves (only the ring's cells are touched) + energy-driven glitching (random cell sampling)
  const X = D.X, cols = A.cols, rows = A.rows, md = Math.min(W, H), n = cols * rows, cw = A.cw, chh = A.chh, rl = A.ramp.length - 1;
  if (X.beat) { const o = (D.ripI++ % E.rip) * 3; D.rip[o] = W / 2 + (Math.random() - 0.5) * W * 0.1; D.rip[o + 1] = H / 2 + (Math.random() - 0.5) * H * 0.1; D.rip[o + 2] = D.rt; }
  const w = md * 0.03;
  for (let k = 0; k < 4; k++) { const o = k * 3, age = D.rt - D.rip[o + 2]; if (age < 0 || age >= 2) continue;
    const rx = D.rip[o], ry = D.rip[o + 1], r = age * md * 0.6, amp = (1 - age / 2) * 0.9, r1 = r + 1.6 * w, r0 = Math.max(0, r - 1.6 * w);
    for (let row = 0; row < rows; row++) { const dy = (row + 0.5) * chh - ry, ady = dy < 0 ? -dy : dy; if (ady > r1) continue;
      const xo = Math.sqrt(r1 * r1 - dy * dy), xi = r0 > ady ? Math.sqrt(r0 * r0 - dy * dy) : 0;
      for (let side = xi > 0 ? -1 : 1; side <= 1; side += 2) {
        const lo = xi === 0 ? rx - xo : side > 0 ? rx + xi : rx - xo, hi = xi === 0 ? rx + xo : side > 0 ? rx + xo : rx - xi, c0 = Math.max(0, Math.ceil(lo / cw - 0.5)), c1 = Math.min(cols - 1, Math.floor(hi / cw - 0.5));
        for (let col = c0; col <= c1; col++) { const dx = (col + 0.5) * cw - rx, dd = (Math.sqrt(dx * dx + dy * dy) - r) / w, q = 1 - dd * dd * 0.39, wv = q * q * amp; if (q <= 0 || wv < 0.08) continue;
          const i = row * cols + col, c = A.chr[i]; if (c > 0 && c <= rl) A.chr[i] = Math.min(rl, c + Math.ceil(wv * 3)); else if (c === 0 && wv > 0.4) { A.chr[i] = ascRamp(A, 0.3 + 0.4 * wv); A.R[i] = D.fr[0]; A.G[i] = D.fr[1]; A.B[i] = D.fr[2]; }
          A.R[i] = Math.min(255, A.R[i] * (1 + wv)); A.G[i] = Math.min(255, A.G[i] * (1 + wv)); A.B[i] = Math.min(255, A.B[i] * (1 + wv)); } } } }
  const pg = X.chaos * 0.05 * (E.pot ? 0.4 : 1);
  if (pg > 0.002) {
    let ng = pg * n; ng = (ng | 0) + (Math.random() < ng - (ng | 0) ? 1 : 0);
    for (let q = 0; q < ng; q++) { const i = (Math.random() * n) | 0; if (A.chr[i]) A.chr[i] = A.pool0 + ((Math.random() * A.poolN) | 0); }
    const nt = X.chaos > 0.25 ? Math.min(E.pot ? 1 : 3, 1 + ((X.chaos * 3) | 0)) : 0;
    for (let t = 0; t < nt; t++) { const r = (Math.random() * rows) | 0, sh = ((Math.random() - 0.5) * 14) | 0, a = r * cols, z = a + cols; if (sh > 0) { A.chr.copyWithin(a + sh, a, z - sh); A.R.copyWithin(a + sh, a, z - sh); A.G.copyWithin(a + sh, a, z - sh); A.B.copyWithin(a + sh, a, z - sh); } else if (sh < 0) { A.chr.copyWithin(a, a - sh, z); A.R.copyWithin(a, a - sh, z); A.G.copyWithin(a, a - sh, z); A.B.copyWithin(a, a - sh, z); } }
  }
}
function drawAuto(c, W, H, S, now, dt, prox, A, E) {
  const C = S.cfg, D = S.dir || (S.dir = dirCreate()), n = A.cols * A.rows, X = D.X;
  if (A.zk !== A.key) {   // (re)allocate once per resize / profile step - never per frame
    const mkb = () => ({ chr: new Uint16Array(n), R: new Uint8Array(n), G: new Uint8Array(n), B: new Uint8Array(n) });
    A.z1 = mkb(); A.z2 = mkb(); A.zb = new Float32Array(n); A.ct = new Float32Array(A.cols); A.cb = new Float32Array(A.cols); A.c1 = new Float32Array(A.cols); A.c2 = new Float32Array(A.cols); A.nb = new Float32Array(A.cols); A.r1 = new Float32Array(A.rows); A.r2 = new Float32Array(A.rows); A.pool0 = A.ramp.length + [...ASC_SPECIAL].length; A.poolN = Math.max(1, [...ASC_POOL].length); A.zk = A.key;
  }
  if (D.uri !== S.uri) dirTrack(S, D, C);
  if (D.sig !== S.seg) { D.sig = S.seg; dirClassify(S, D, C); if (D.oi === 0 && D.tp < 0 && (S.pos || 0) - D.t0 < 6) D.cur = D.order[0]; }
  if (D.palK !== (S.galVer || 0)) dirPal(S, D);
  dt = Math.min(dt, 0.1); audioBus(S, D, C, dt); dirTick(S, D, C, E, dt); D.T += dt * X.spd;
  const T = D.T; A.gk = 0.7 * (X.mid - 0.5); A.boldT = 640 - 300 * X.mid; A.acc = S.th ? S.th.accent : S.rgb;   // mids reshape brightness + switch bold glyphs
  if (D.tp < 0) { A.chr.fill(0); SCENES[D.cur](A, A, S, W, H, T, dt, E, X, D, prox); }
  else { A.z1.chr.fill(0); A.z2.chr.fill(0); SCENES[D.cur](A, A.z1, S, W, H, T, dt, E, X, D, prox); SCENES[D.nxt](A, A.z2, S, W, H, T, dt, E, X, D, prox); autoMix(A, D, E, T); }
  autoPost(A, D, E, W, H);
}

const ASC_SCENES = { asc_cover: ascScCover, asc_knight: ascScKnight, asc_garden: ascScGarden, asc_rain: ascScRain, asc_cosmos: ascScCosmos };
function drawAscii(c, W, H, S, now, dt, prox) {
  const C = S.cfg, E = perfEff(S); perfBudget(S, E, performance.now(), !!(S.dir && S.dir.tp >= 0));
  const dpr = Math.max(0.5, Math.min(window.devicePixelRatio || 1, E.pot ? 1 : 2) * E.sc), A = ascInit(S, W, H, dpr, C, E.size);   // profile: tile size + resolution scale
  if (A.bk !== A.key) { A.bk = A.key; S.bud.bad = 0; S.bud.cool = Math.max(S.bud.cool, 3); }   // a resize / profile step allocates once: don't count that hitch
  if (A.t0 === undefined || A.uri !== S.uri) { A.uri = S.uri; A.t0 = now; A.covK = null; }
  ascLut(A, S); ascCov(A, S); c.fillStyle = "#020204"; c.fillRect(0, 0, W, H); A.boldT = Infinity;
  if (C.bg === "asc_auto") drawAuto(c, W, H, S, now, dt, prox, A, E); else ASC_SCENES[C.bg](A, S, W, H, now, dt, prox, C);
  ascFlush(c, A, W, H, E.glow ? C.ascGlow : 0);
}

// ===== Cover palette (k-means), translation, auto-alignment =====
function palFromPixels(px) {
  const K = 6; let cen = Array.from({ length: K }, (_, i) => px[Math.floor(((i + 0.5) * px.length) / K)].slice()), cnt = [];
  for (let it = 0; it < 8; it++) {
    const sm = cen.map(() => [0, 0, 0, 0]);
    px.forEach((p) => { let bi = 0, bd = 1e9; cen.forEach((c, i) => { const q = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (q < bd) { bd = q; bi = i; } }); const s = sm[bi]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++; });
    cen = cen.map((c, i) => (sm[i][3] ? [sm[i][0] / sm[i][3], sm[i][1] / sm[i][3], sm[i][2] / sm[i][3]] : c)); cnt = sm.map((s) => s[3]);
  }
  const cand = cen.map((c, i) => { const mx = Math.max(...c), mn = Math.min(...c), sat = mx ? (mx - mn) / mx : 0; return { c: c.map(Math.round), sc: cnt[i] * (0.15 + sat * sat) * (mx > 40 ? 1 : 0.1) }; }).sort((a, b) => b.sc - a.sc);
  const out = []; cand.forEach((o) => { if (out.length < 4 && o.sc > 0 && out.every((q) => (q[0] - o.c[0]) ** 2 + (q[1] - o.c[1]) ** 2 + (q[2] - o.c[2]) ** 2 > 3600)) out.push(o.c); });
  return out.length ? out : null;
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
// Non-English lines: key word = longest word; the icon comes from the English translation
function pickNL(words, tr, rnd) {
  let icon = null; for (const w of (tr || "").split(/\s+/)) { const m = ICON_RX.find(([, rx]) => rx.test(cleanW(w))); if (m) { icon = m[0]; break; } }
  let best = 0; words.forEach((w, k) => { if (w.length > words[best].length || (w.length === words[best].length && rnd() < 0.5)) best = k; });
  return { kw: best, icon: icon || ICON_GENERIC[Math.floor(rnd() * ICON_GENERIC.length)] };
}
// Auto-align: find the global shift (±0.6s) that best lines lyric line starts up with real note onsets in the audio analysis
function autoShift(raw, on) {
  if (!on || on.length < 20 || raw.length < 8) return 0;
  const near = (t) => { let lo = 0, hi = on.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (on[m] < t) lo = m; else hi = m; } return Math.min(Math.abs(on[lo] - t), Math.abs(on[hi] - t)); };
  const score = (o) => raw.reduce((a, l) => a + Math.exp(-((near(l.t + o) / 0.07) ** 2)), 0);
  const s0 = score(0); let best = 0, bs = s0; for (let o = -0.6; o <= 0.601; o += 0.02) { const s = score(o); if (s > bs) { bs = s; best = o; } }
  return bs > s0 * 1.15 + 0.5 ? Math.round(best * 100) / 100 : 0;
}

// Lyric sources: Spotify's own, LRCLIB, NetEase. Auto = first one that returns sane synced lyrics.
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
  get lrclib() { return CL_MORE.lrclib; }, get lrcmux() { return CL_MORE.lrcmux; }, get betterlyrics() { return CL_MORE.betterlyrics; }, get lrcapi() { return CL_MORE.lrcapi; }, get musixmatch() { return CL_MORE.musixmatch; }, get custom() { return CL_MORE.custom; },
  async spotify(t) {
    const r = await Spicetify.CosmosAsync.get(`https://spclient.wg.spotify.com/color-lyrics/v2/track/${t.uri.split(":")[2]}?format=json&vocalRemoval=false&market=from_token`);
    const L = r?.lyrics; if (!L || L.syncType === "UNSYNCED") return null;
    return L.lines.map((l) => ({ t: +l.startTimeMs / 1000, text: (l.words || "").trim() })).filter((l) => l.text && l.text !== "♪");
  },
  async netease(t) {
    const s = await (await fetch("https://music.163.com/api/search/get?" + new URLSearchParams({ s: t.name + " " + t.artist, type: 1, limit: 8 }))).json();
    const a0 = t.artist.toLowerCase();
    const song = (s?.result?.songs || []).map((x) => ({ x, d: Math.abs(x.duration / 1000 - t.dur), am: (x.artists || []).some((q) => { const n = q.name.toLowerCase(); return a0.includes(n) || n.includes(a0); }) }))
      .filter((o) => o.d < 3 && o.am).sort((a, b) => a.d - b.d)[0]?.x;
    if (!song) return null;
    const j = await (await fetch(`https://music.163.com/api/song/lyric?id=${song.id}&lv=1&kv=1&tv=-1&yv=1`)).json();
    const y = j?.yrc?.lyric ? parseYRC(j.yrc.lyric) : null;
    return y && y.length > 3 ? y : j?.lrc?.lyric ? parseLRC(j.lrc.lyric) : null;
  },
};
// ---- more providers: LRCLIB-compatible (LRCLIB, lrcmux), Better Lyrics (TTML, word-level), Musixmatch (richsync, needs your token), LrcApi, custom URL ----
const lowerB = (a, t) => { let lo = 0, hi = a.length; while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] < t) lo = m + 1; else hi = m; } return lo; };
const ttT = (s) => { s = (s || "").trim(); return /s$/.test(s) ? parseFloat(s) : s.split(":").reduce((a, v) => a * 60 + parseFloat(v), 0); };
const decodeX = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'");
function parseTTML(x) {
  const out = [], pr = /<p\b([^>]*)>([\s\S]*?)<\/p>/g; let m;
  while ((m = pr.exec(x))) {
    const bg = /begin="([^"]+)"/.exec(m[1]); if (!bg) continue;
    const inner = m[2].replace(/<span\b[^>]*x-bg[^>]*>(?:<span\b[^>]*>[^<]*<\/span>\s*)*<\/span>/g, ""), words = [], wt = [], we = [], tk = /<span\b([^>]*)>([^<]*)<\/span>|([^<]+)/g; let q, sp = true;
    while ((q = tk.exec(inner))) {
      if (q[3] !== undefined) { if (/\s/.test(q[3])) sp = true; continue; }
      const b = /begin="([^"]+)"/.exec(q[1]), e = /end="([^"]+)"/.exec(q[1]), tx = decodeX(q[2]); if (!b || !tx.trim()) { if (/\s/.test(tx)) sp = true; continue; }
      if (words.length && !sp && !/^\s/.test(tx)) { words[words.length - 1] += tx.trim(); we[we.length - 1] = e ? ttT(e[1]) : we[we.length - 1]; }
      else { words.push(tx.trim()); wt.push(ttT(b[1])); we.push(e ? ttT(e[1]) : ttT(b[1]) + 0.3); }
      sp = /\s$/.test(tx);
    }
    if (words.length) out.push({ t: wt[0], text: words.join(" "), words, wt, we });
    else { const tx = decodeX(inner.replace(/<[^>]+>/g, "")).trim(); if (tx) out.push({ t: ttT(bg[1]), text: tx }); }
  }
  return out.sort((a, b) => a.t - b.t);
}
function parseRichsync(arr) {
  return arr.map((ln) => {
    const words = [], wt = [], we = []; let cur = "", cs = 0;
    (ln.l || []).forEach((ch) => { const st = ln.ts + ch.o, tx = ch.c;
      if (/^\s/.test(tx) && cur.trim()) { words.push(cur.trim()); wt.push(cs); cur = ""; }
      if (!cur) cs = st; cur += tx; if (/\s$/.test(tx)) { if (cur.trim()) { words.push(cur.trim()); wt.push(cs); } cur = ""; } });
    if (cur.trim()) { words.push(cur.trim()); wt.push(cs); }
    words.forEach((_, k) => we.push(k < words.length - 1 ? wt[k + 1] : ln.te));
    return words.length ? { t: wt[0], text: words.join(" "), words, wt, we } : null;
  }).filter(Boolean);
}
async function lrcCompat(base, t) {
  try { const r = await fetch(base + "/get?" + new URLSearchParams({ track_name: t.name, artist_name: t.artist, album_name: t.album, duration: Math.round(t.dur) }));
    if (r.ok) { const j = await r.json(); if (j.syncedLyrics) return parseLRC(j.syncedLyrics); } } catch {}
  const m = (await (await fetch(base + "/search?" + new URLSearchParams({ track_name: t.name, artist_name: t.artist }))).json()).filter((x) => x.syncedLyrics && Math.abs(x.duration - t.dur) < 3).sort((a, b) => Math.abs(a.duration - t.dur) - Math.abs(b.duration - t.dur))[0];
  return m ? parseLRC(m.syncedLyrics) : null;
}
function anyLyrics(j, tx) {
  const s = typeof j === "string" ? j : j?.ttml || j?.syncedLyrics || j?.lrc || j?.lyric || j?.lyrics || tx || "";
  return typeof s !== "string" ? null : /<tt\b/.test(s) ? parseTTML(s) : /^\s*\[\d/.test(s) ? parseLRC(s) : null;
}
const CL_MORE = {
  lrclib: (t) => lrcCompat("https://lrclib.net/api", t),
  lrcmux: (t) => lrcCompat("https://lrcmux.dev/api", t),
  async betterlyrics(t) { const r = await fetch("https://lyrics-api.boidu.dev/getLyrics?" + new URLSearchParams({ s: t.name, a: t.artist, d: Math.round(t.dur), al: t.album })); const tx = await r.text(); let j = null; try { j = JSON.parse(tx); } catch {} return anyLyrics(j, tx); },
  async lrcapi(t) { const r = await fetch("https://api.lrc.cx/lyrics?" + new URLSearchParams({ title: t.name, artist: t.artist, album: t.album })); return /^\s*\[\d/.test(await r.clone().text()) ? parseLRC(await r.text()) : null; },
  async musixmatch(t) {
    if (!t.mxm) return null;
    const url = "https://apic-desktop.musixmatch.com/ws/1.1/macro.subtitles.get?" + new URLSearchParams({ format: "json", namespace: "lyrics_richsynched", subtitle_format: "mxm", app_id: "web-desktop-app-v1.0", q_track: t.name, q_artist: t.artist, q_album: t.album, q_duration: Math.round(t.dur), f_subtitle_length: Math.round(t.dur), usertoken: t.mxm });
    let j; try { j = await (await fetch(url)).json(); } catch { j = await Spicetify.CosmosAsync.get(url); }
    const mc = j?.message?.body?.macro_calls || {}, rs = mc["track.richsync.get"]?.message?.body?.richsync?.richsync_body;
    if (rs) { const l = parseRichsync(JSON.parse(rs)); if (l.length > 3) return l; }
    const sb = mc["track.subtitles.get"]?.message?.body?.subtitle_list?.[0]?.subtitle?.subtitle_body;
    return sb ? JSON.parse(sb).map((x) => ({ t: x.time.total, text: (x.text || "").trim() })).filter((x) => x.text) : null;
  },
  async custom(t) {
    if (!t.custom) return null; const u = t.custom.replace(/\{title\}/g, encodeURIComponent(t.name)).replace(/\{artist\}/g, encodeURIComponent(t.artist)).replace(/\{album\}/g, encodeURIComponent(t.album)).replace(/\{duration\}/g, Math.round(t.dur));
    const tx = await (await fetch(u)).text(); let j = null; try { j = JSON.parse(tx); } catch {} return anyLyrics(j, tx);
  },
};
// Which provider matches the recording best? Score = how well line starts agree with real note onsets in the audio (after the best small shift,
// minus the chance level), + word-sync bonus + coverage. Auto mode picks the top score.
function matchScore(lines, on, dur) {
  const n = lines.length, ws = lines.some((x) => x.wt), cov = clamp((lines[n - 1].t - lines[0].t) / Math.max(1, dur)); let agree = 0.35;
  if (on && on.length > 20 && n >= 6) {
    const near = (t) => { const i = lowerB(on, t); return Math.min(Math.abs((on[i - 1] ?? 1e9) - t), Math.abs((on[i] ?? 1e9) - t)); }, sc = (o) => lines.reduce((a, l) => a + Math.exp(-((near(l.t + o) / 0.09) ** 2)), 0) / n;
    let best = 0; for (let o = -0.6; o <= 0.601; o += 0.05) best = Math.max(best, sc(o)); const base = [-1.5, -1.2, 1.2, 1.5].reduce((a, o) => a + sc(o), 0) / 4; agree = Math.max(0, best - base);
  }
  return 0.6 * agree + 0.25 * (ws ? 1 : 0) + 0.15 * cov - (n < 8 ? 0.1 : 0);
}
async function fetchLyrics(t, pref, on) {
  const key = t.uri + (t.mxm ? "m" : "") + (t.custom || "") + (pref === "auto" ? "" : pref); let c = CL_CACHE.get(key);
  if (!c) {
    const order = pref === "auto" ? ["spotify", "lrclib", "lrcmux", "betterlyrics", "netease", "lrcapi", "musixmatch", "custom"] : [pref];
    c = (await Promise.all(order.map((n) => (CL_SRC[n] ? CL_SRC[n](t) : Promise.resolve(null)).then((l) => (l && l.length > 3 && l[l.length - 1].t < t.dur + 20 ? { n, l, ws: l.some((x) => x.wt) } : null)).catch(() => null)))).filter(Boolean); CL_CACHE.set(key, c);
  }
  if (!c.length) return null;
  const sc = c.map((r) => ({ ...r, sc: matchScore(r.l, on, t.dur) })).sort((a, b) => b.sc - a.sc); sc[0].all = sc.map((r) => `${r.n} ${Math.round(r.sc * 100)}`); return sc[0];
}

// Timing: syllable-weighted words; the song's own pace (syllables/second) is learned from its lines,
// so slow ballads and fast raps both get realistic word spacing. Optional snap to real note onsets.
function syl(w) {
  if (/[\u0980-\u09FF]/.test(w)) { const m = w.match(/[\u0985-\u09B9\u09DC-\u09DF\u09CE]/g) || [], hs = (w.match(/\u09CD/g) || []).length; return Math.max(1, m.length - hs); }
  if (RTL_RX.test(w)) return Math.max(1, Math.round(w.replace(/[^\u0620-\u064A\u0671-\u06D3]/g, "").length / 2.4));
  const s = w.toLowerCase().replace(/[^a-z]/g, ""); if (!s) return Math.max(1, Math.ceil(w.length / 3));
  const m = s.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "").match(/[aeiouy]{1,2}/g); return Math.max(1, m ? m.length : 1);
}
const nsyl = (t) => t.split(/\s+/).reduce((a, x) => a + syl(x), 0);
function onsetsOf(seg) { const o = []; seg.forEach((s, i) => { if (i && s.confidence > 0.4 && s.loudness_max - seg[i - 1].loudness_max > 3) o.push(s.start); }); return o; }
function prep(raw, on, seed, str = 1) {
  const freq = {}; raw.forEach((l) => l.text.split(/\s+/).forEach((w) => { const k = cleanW(w); if (k && !STOP.has(k)) freq[k] = (freq[k] || 0) + 1; }));
  const r = []; raw.forEach((l, i) => { const g = (raw[i + 1] ? raw[i + 1].t : l.t + 6) - l.t; if (g < 7) r.push(g / nsyl(l.text)); });
  const cf = {}, nk = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ""); raw.forEach((l) => { cf[nk(l.text)] = (cf[nk(l.text)] || 0) + 1; });
  r.sort((a, b) => a - b); const pace = Math.max(0.12, Math.min(0.42, r.length ? r[Math.floor(r.length * 0.4)] : 0.3));
  return raw.map((l, i) => {
    const gap = (raw[i + 1] ? raw[i + 1].t : l.t + 6) - l.t, words = l.words || l.text.split(/\s+/);
    const dur = l.we ? l.we[l.we.length - 1] - l.t + 0.15 : Math.max(0.4, Math.min(gap - 0.1, nsyl(l.text) * pace + 0.2));
    const w = words.map((x) => syl(x) + (/[,.;:!?]$/.test(x) ? 0.5 : 0)), tot = w.reduce((a, b) => a + b, 0);
    let acc = 0; const ws = l.wt ? l.wt.slice() : words.map((_, k) => { const s = l.t + (dur * acc) / tot; acc += w[k]; return s; });
    if (on && !l.wt) alignWords(ws, on, str);
    const rnd = mulberry(i * 9301 + words.length * 17 + 7), pts = [];
    words.forEach((_, k) => { let p;
      for (let a = 0; a < 25; a++) { p = [0.08 + 0.84 * (0.6 * (k / Math.max(1, words.length - 1)) + 0.4 * rnd()), 0.2 + 0.6 * rnd()];
        if (pts.every((q) => Math.hypot((p[0] - q[0]) * 1.6, p[1] - q[1]) > 0.14)) break; }
      pts.push(p); });
    const sh = words.map(() => rnd()), nl = /[^\x00-\x7F]/.test(l.text) && !/[a-z]{3}/i.test(l.text), kx = nl ? pickNL(words, l.tr, rnd) : pickKey(words, freq, rnd);
    return { t: l.t, dur, words, ws, pts: RTL_RX.test(l.text) ? pts.map((q) => [1 - q[0], q[1]]) : pts, sh, ch: cf[nk(l.text)] >= 2, wt: !!l.wt, we: l.we || null, tr: l.tr, ...kx, sty: STY[Math.floor(mulberry(seed + i * 77)() * STY.length)], side: rnd() < 0.5 ? -1 : 1, seed: (seed + i * 13) % 1000 };
  });
}

const IC = { play: "M8 5v14l11-7z", pause: "M6 5h4v14H6zM14 5h4v14h-4z", prev: "M6 6h2v12H6zM9.5 12l8.5 6V6z", next: "M16 6h2v12h-2zM6 18l8.5-6L6 6z",
  shuf: "M3 7h3c4 0 6 10 11 10h4M18 14l3 3-3 3M3 17h3c1.5 0 2.7-.8 3.7-2M14 9c.9-1 1.9-2 3.5-2H21M18 4l3 3-3 3",
  rep: "M17 2l4 4-4 4M3 11V9a3 3 0 013-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 01-3 3H3",
  heart: "M12 21s-7-4.6-9.5-9C.9 8.5 3 5 6.3 5c2 0 3.700 1.100 5.700 3.300C14 6.100 15.700 5 17.700 5 21 5 23.100 8.500 21.500 12 19 16.400 12 21 12 21z" };

// per-frame work for the Flow style: pick the active line, ease the scroll, fill the active line's letters
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
  // critically damped spring toward the active line, so the scroll glides and never snaps
  const ty = H * C.flowPos - (S.flT || 0);
  if (S.flY === undefined) { S.flY = ty; S.flV = 0; }
  else { const k = 7 * C.flowSpeed, d = Math.min(0.05, dt); S.flV += ((ty - S.flY) * k * k - 2 * k * S.flV) * d; S.flY += S.flV * d; if (dt > 0.05) { const d2 = Math.min(0.05, dt - 0.05); S.flV += ((ty - S.flY) * k * k - 2 * k * S.flV) * d2; S.flY += S.flV * d2; } }
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

function ConstellationApp() {
  const R = Spicetify.React, h = R.createElement, { useState, useEffect, useRef } = R;
  const [cfg, setCfg] = useState(loadCfg);
  const [info, setInfo] = useState({ title: "", artist: "", status: "Waiting for a song…", src: "" });
  const [ui, setUi] = useState(true), [open, setOpen] = useState(false), [off, setOff] = useState(0), [tab, setTab] = useState("Style"), [lv, setLv] = useState(0), [thOn, setThOn] = useState(false);
  const [stage, setStage] = useState("pop"), [sk, setSk] = useState(0), [pl, setPl] = useState({ playing: false, shuf: false, rep: 0, heart: false });
  const flw = useRef(), fls = useRef(), root = useRef(), cvs = useRef(), bgl = useRef(), idle = useRef(), fill = useRef(), tcur = useRef(), tdur = useRef();
  const S = useRef({ lines: [], raw: null, beats: null, seg: null, on: null, bi: 0, si: 0, pulse: 0, en: 0.5, vis: 1, edge: 0, mx: -999, my: -999, px: -999, py: -999, pa: 0, mt: 0,
    rgb: CL_COLORS.gold, offset: 0, cur: "", title: "", dust: Array.from({ length: 90 }, () => [Math.random(), Math.random(), Math.random() * 6, Math.random()]) }).current;
  S.cfg = cfg;

  const upd = (p) => { const n = { ...cfg, ...p }; setCfg(n); try { localStorage.setItem(CL_KEY, JSON.stringify(n)); } catch {} };
  const wake = () => { setUi(true); clearTimeout(idle.current); idle.current = setTimeout(() => setUi(false), 3000); };
  const move = (e) => { const r = e.currentTarget.getBoundingClientRect(); S.mx = e.clientX - r.left; S.my = e.clientY - r.top; S.mt = 1; wake(); };
  const fs = () => (document.fullscreenElement ? document.exitFullscreen() : root.current.requestFullscreen?.());
  const nudge = (d) => { S.offset = Math.round((S.offset + d) * 100) / 100; setOff(S.offset); try { localStorage.setItem(CL_KEY + ":off:" + S.uri, S.offset); } catch {} };
  const seek = (e) => { const r = e.currentTarget.getBoundingClientRect(); Spicetify.Player.seek(((e.clientX - r.left) / r.width) * Spicetify.Player.getDuration()); };

  useEffect(() => { S.rebuild && S.rebuild(); }, [cfg.ana, cfg.auto]);
  useEffect(() => { const k = cfg.src + cfg.tr + cfg.theme + cfg.themeForce + cfg.mxm + cfg.customUrl; if (S.srcPrev !== undefined && S.srcPrev !== k && S.reload) S.reload(); S.srcPrev = k; }, [cfg.src, cfg.tr, cfg.theme, cfg.themeForce, cfg.mxm, cfg.customUrl]);
  useEffect(() => { [cfg.fam === "auto" ? (S.th ? S.th.font : "Inter") : cfg.fam, BN[cfg.bn], AR[cfg.ar]].forEach((f) => { try { document.fonts.load(`800 40px "${f}"`); document.fonts.load(`500 20px "${f}"`); } catch {} }); }, [cfg.fam, cfg.bn, cfg.ar, thOn]);

  // Flow: collect the letter elements whenever the line DOM is rebuilt
  useEffect(() => {
    const sc = fls.current; S.fa = undefined; S.flDirty = true; S.flY = undefined;
    S.fe = cfg.lyricStyle === "flow" && sc ? Array.from(sc.querySelectorAll(".fl-line")).map((el) => ({ el, c: -9, ws: Array.from(el.querySelectorAll(".fl-w")).map((w) => ({ el: w, ls: Array.from(w.children), v: -1 })) })) : null;
  }, [lv, cfg.lyricStyle, cfg.flowTr, cfg.tr]);

  useEffect(() => {
    let raf, last = performance.now(), alive = true; const clk = makeClock();
    const build = () => { if (!S.raw) return; const wsync = S.raw.some((l) => l.wt), A = S.cfg.ana, sh = A && S.cfg.auto && !wsync ? autoShift(S.raw, S.on) : 0; S.shift = sh;
      let base = sh ? S.raw.map((l) => ({ ...l, t: l.t + sh })) : S.raw;
      if (A && !wsync && S.cand && S.cand.length) { const ls = lineShifts(base, S.cand); base = base.map((l, i) => ({ ...l, t: l.t + ls[i] * (A === 1 ? 0.5 : 1) })); base.forEach((l, i) => { if (i && l.t < base[i - 1].t + 0.2) l.t = base[i - 1].t + 0.2; }); }
      S.lines = prep(base, A && S.cand ? S.cand : null, S.seed || 1, A === 1 ? 0.6 : 1.2); setLv((v) => v + 1); };
    const maybeTranslate = (uri, raw) => { const m = S.cfg.tr, nl = raw.filter((l) => NONLAT_RX.test(l.text)).length > raw.length * 0.4;
      if (m === "off" || (m === "auto" && !nl) || raw[0].tr) return;
      translateLines(raw).then((tx) => { if (S.uri !== uri) return; raw.forEach((l, i) => (l.tr = tx[i])); build(); }); };
    S.rebuild = build;
    const sync = () => setPl({ playing: Spicetify.Player.isPlaying(), shuf: Spicetify.Player.getShuffle(), rep: Spicetify.Player.getRepeat(), heart: Spicetify.Player.getHeart() });
    const applyPal = (p) => {
      const a = p[0], b = p[1] || a, cs = [a, b, p[2] || mixc(a, b, 0.5), p[3] || lift(a, 0.6)];
      S.rgb = lift(a, 0.65); S.pal = cs.map(softC); [S.c1, S.c2, S.c3, S.c4] = S.pal; S.galVer = (S.galVer || 0) + 1;
      S.pal.forEach((c, i) => root.current?.style.setProperty("--c" + (i + 1), `rgb(${c})`));
    };
    async function load() {
      const it = Spicetify.Player.data?.item; if (!it) return;
      const t = { uri: it.uri, name: it.name, artist: it.artists?.[0]?.name || "", album: it.album?.name || "", dur: Spicetify.Player.getDuration() / 1000 };
      Object.assign(S, { lines: [], raw: null, beats: null, seg: null, on: null, cand: null, bi: 0, si: 0, uri: it.uri, title: t.name, artist: t.artist, secs: null, bars: null, tempo: 0, sec: -1, seed: (Math.random() * 1e6) | 0 });
      S.th = pickTheme(t.artist, S.cfg.theme, S.cfg.themeForce); setThOn(!!S.th);
      try { S.offset = +localStorage.getItem(CL_KEY + ":off:" + it.uri) || 0; } catch { S.offset = 0; }
      setOff(S.offset); setLv((v) => v + 1); setSk((k) => k + 1); setStage("pop"); clearTimeout(S.st); S.st = setTimeout(() => setStage("dock"), 2800); sync();
      setInfo({ title: t.name, artist: t.artist, status: "Finding lyrics…", src: "" });
      const img = (it.metadata?.image_xlarge_url || it.metadata?.image_url || "").replace("spotify:image:", "https://i.scdn.co/image/");
      root.current?.style.setProperty("--art", img ? `url(${img})` : "none");
      S.cvImg = null; if (img) { const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => { if (S.uri === it.uri) S.cvImg = im; }; im.src = img; }
      paletteFromImage(img)
        .then((p) => p || Spicetify.colorExtractor?.(it.uri).then((c) => [hexToRgb(c.VIBRANT_NON_ALARMING || c.VIBRANT || c.PROMINENT), hexToRgb(c.DARK_VIBRANT || c.DESATURATED || c.PROMINENT)]).catch(() => null))
        .then((p) => { if (p && p[0] && S.uri === it.uri) applyPal(p); });
      const ap = Spicetify.getAudioData?.(it.uri).then((d) => {
        if (S.uri !== it.uri || !d) return; S.beats = d.beats || null; S.seg = d.segments || null; S.secs = d.sections || null; S.bars = d.bars || null; S.tempo = d.track?.tempo || 0; S.on = d.segments ? onsetsOf(d.segments) : null; S.cand = candOf(d); build();
      }).catch(() => {});
      await Promise.race([ap, new Promise((r) => setTimeout(r, 2500))]);
      const got = await fetchLyrics({ ...t, mxm: S.cfg.mxm, custom: S.cfg.customUrl }, S.cfg.src, S.on);
      if (!alive || S.uri !== it.uri) return;
      if (got) { S.raw = got.l; build(); maybeTranslate(it.uri, got.l); setInfo({ title: t.name, artist: t.artist, status: "", src: got.n + (got.ws ? " · word-synced" : " · line-synced"), all: (got.all || []).join("  ·  ") }); }
      else setInfo({ title: t.name, artist: t.artist, status: "No synced lyrics found for this song", src: "" });
    }
    S.reload = load;
    const onKey = (e) => {
      if ((e.key === "f" || e.key === "F") && !e.ctrlKey && !e.metaKey && !e.altKey && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName || "")) { e.preventDefault(); e.stopPropagation(); fs(); }
      if (e.key === "[" || e.key === "]") { nudge(e.key === "]" ? 0.05 : -0.05); Spicetify.showNotification(`Lyric offset ${S.offset.toFixed(2)}s`); }
    };
    Spicetify.Player.addEventListener("songchange", load); Spicetify.Player.addEventListener("onplaypause", sync);
    window.addEventListener("keydown", onKey, true); load(); wake();

    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (document.hidden || performance.now() - last < 1000 / (perfEff(S).fps || 60) - 2) return;
      const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
      const cv = cvs.current; if (!cv) return;
      const W = cv.clientWidth, H = cv.clientHeight, dpr = window.devicePixelRatio || 1;
      if (cv.width !== (W * dpr) | 0 || cv.height !== (H * dpr) | 0) { cv.width = W * dpr; cv.height = H * dpr; }
      const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
      const p0 = clk(Spicetify.Player.getProgress(), Spicetify.Player.data?.item?.uri || "", Spicetify.Player.isPlaying(), now), pos = (S.pos = p0 + S.offset), C = S.cfg, kinds = S.th && C.kinds === "mix" ? S.th.kinds : CL_KINDS[C.kinds] || CL_KINDS.mix;
      const FLOW = C.lyricStyle === "flow", rgb = C.color === "adaptive" ? (S.th ? S.th.accent : S.rgb) : C.color === "custom" ? hexToRgb(C.custom) || CL_COLORS.gold : CL_COLORS[C.color] || CL_COLORS.gold;
      const css = (a) => `rgba(${rgb},${a})`; S.ff = fontStack(C, S);
      root.current?.style.setProperty("--dim", C.dim); if (S.sv !== C.bgSpeed + ":" + C.ctrlSize) { S.sv = C.bgSpeed + ":" + C.ctrlSize; root.current?.style.setProperty("--spd", C.bgSpeed); root.current?.style.setProperty("--cs", C.ctrlSize); }

      // controller progress
      const dur0 = Spicetify.Player.getDuration() / 1000; if (fill.current) fill.current.style.width = (dur0 ? (p0 / dur0) * 100 : 0) + "%";
      const sec = Math.floor(p0); if (sec !== S.sec) { S.sec = sec; if (tcur.current) tcur.current.textContent = fmt(p0); if (tdur.current) tdur.current.textContent = fmt(dur0); }

      // smooth pointer for the proximity effect
      if (S.px < -900) { S.px = S.mx; S.py = S.my; }
      S.px += (S.mx - S.px) * Math.min(1, dt * 7); S.py += (S.my - S.py) * Math.min(1, dt * 7); S.pa += (S.mt - S.pa) * Math.min(1, dt * 4);
      const prox = (x, y, R = 170) => { const f = clamp(1 - Math.hypot(x - S.px, y - S.py) / R) * S.pa * (C.prox === "off" ? 0 : 1); return f * f * (3 - 2 * f); };
      S.pw = S.pw || [1, 0, 0, 0];
      const ti = C.prox === "mix" ? Math.floor(now / 9000) % 4 : ["magnet", "repel", "swirl", "ripple"].indexOf(C.prox);
      S.pw = S.pw.map((v, q) => v + ((q === ti ? 1 : 0) - v) * Math.min(1, dt * 2.5)); const pw = S.pw;
      const warp = (x, y, f) => { if (f <= 0) return [x, y]; const dx = S.px - x, dy = S.py - y, d = Math.hypot(dx, dy) || 1, an = f * pw[2], co = Math.cos(an), si = Math.sin(an), rx = -dx, ry = -dy, wv = Math.sin(d / 16 - now / 160) * f * 12 * pw[3];
        return [x + pw[0] * dx * f * 0.08 - pw[1] * dx * f * 0.3 + pw[2] * (rx * co - ry * si - rx) + (rx / d) * wv, y + pw[0] * dy * f * 0.08 - pw[1] * dy * f * 0.3 + pw[2] * (rx * si + ry * co - ry) + (ry / d) * wv]; };

      const bn = now * C.bgSpeed, bdt = dt * C.bgSpeed; S.bn = bn;
      const cb = C.camBg, cz = S.cam ? S.cam.z : 1, sb = Math.max(1, 1 + (cz - 1) * cb), cR = (v, m) => Math.max(-m, Math.min(m, v));
      const bpx = S.cam && cb ? cR(-(S.cam.x - W / 2) * 0.2 * cb * sb, ((sb - 1) * W) / 2) : 0, bpy = S.cam && cb ? cR(-(S.cam.y - H / 2) * 0.2 * cb * sb, ((sb - 1) * H) / 2) : 0;
      if (bgl.current) bgl.current.style.transform = sb > 1.001 ? `translate(${bpx}px,${bpy}px) scale(${sb})` : "";   // the background zooms and pans with the camera
      c.save(); if (sb > 1.001) { c.translate(W / 2 + bpx, H / 2 + bpy); c.scale(sb, sb); c.translate(-W / 2, -H / 2); }
      if (ASCS.has(C.bg)) drawAscii(c, W, H, S, bn, bdt, prox); else if (S.th) drawTheme(c, W, H, S, bn, bdt, prox, warp); else if (GALS.has(C.bg)) drawGal(c, W, H, S, bn, bdt, prox, warp); else if (BGX.has(C.bg)) drawBackdrop(c, W, H, S, bn, bdt, prox, warp);
      c.restore();
      if (C.bright < 0.999) { c.fillStyle = `rgba(0,0,0,${clamp(1 - C.bright)})`; c.fillRect(0, 0, W, H); }   // background brightness (everything under the lyrics)
      if (S.pa > 0.01 && S.pw[3] > 0.05) for (let r2 = 0; r2 < 2; r2++) { const ph = (now / 1100 + r2 / 2) % 1; c.strokeStyle = css(0.25 * S.pa * S.pw[3] * (1 - ph)); c.lineWidth = 1.2; c.beginPath(); c.arc(S.px, S.py, ph * 150, 0, 7); c.stroke(); }
      if (S.pa > 0.01) { const g = c.createRadialGradient(S.px, S.py, 0, S.px, S.py, 130); g.addColorStop(0, css(0.13 * S.pa)); g.addColorStop(1, css(0)); c.fillStyle = g; c.fillRect(S.px - 130, S.py - 130, 260, 260); }
      if (!FLOW || C.flowDust) S.dust.forEach(([x, y, p, q]) => {
        x *= W; y *= H; const f = prox(x, y, 190), [dx, dy] = warp(x, y, f);
        c.fillStyle = css(clamp(0.1 + 0.15 * Math.sin(now / 1200 + p) + f * 0.7));
        if (f > 0.04 || q < 0.12) shape(c, q < 0.12 && f < 0.04 ? kinds[Math.floor(q * 100) % kinds.length] : "sparkle", dx, dy, 2 + f * 5, now / 900 + p);
        else c.fillRect(dx, dy, 1.5, 1.5);
        if (f > 0.15) { c.strokeStyle = css(f * 0.35); c.lineWidth = 0.8; c.beginPath(); c.moveTo(dx, dy); c.lineTo(S.px, S.py); c.stroke(); }
      });

      if (S.beats) {
        const b = S.beats; if (S.bi > 0 && b[S.bi - 1].start > pos) S.bi = 0;
        while (S.bi < b.length && b[S.bi].start <= pos) { if (pos - b[S.bi].start < 0.15) S.pulse = Math.max(S.pulse, 0.5 + 0.5 * (b[S.bi].confidence || 0.5)); S.bi++; }
      }
      let tgt;
      if (S.seg && S.seg.length) {
        const g = S.seg; if (S.si > 0 && g[S.si].start > pos) S.si = 0; while (S.si + 1 < g.length && g[S.si + 1].start <= pos) S.si++;
        tgt = clamp((g[S.si].loudness_max + 35) / 30);
      } else { const t = now / 1000; tgt = 0.5 + 0.25 * Math.sin(t * 1.7) + 0.15 * Math.sin(t * 0.5); }
      S.en += (tgt - S.en) * Math.min(1, dt * 8);

      let i = -1; for (let j = 0; j < S.lines.length; j++) { if (S.lines[j].t <= pos) i = j; else break; }
      const L = S.lines[i];
      if (i !== S.li) { S.li = i; S.hl = L ? L.t + L.dur : 0; }
      if (L && !L.wt) { const nx = S.lines[i + 1], lim = nx ? nx.t : L.t + L.dur + 6;
        if (pos > S.hl - 0.001 && pos < lim - 0.05 && pos < L.t + L.dur + 6 && (S.en > 0.3 || pos < L.t + L.dur + 1.5)) S.hl = pos; }
      S.vis += (((!L || pos > S.hl + 2.5) ? 1 : (C.visAlways ? 0.22 : 0)) - S.vis) * Math.min(1, dt * 3);
      if (S.vis > 0.01 && !FLOW) drawVis(c, css, W, H, S, now, S.vis);

      const cam = S.cam || (S.cam = { x: W / 2, y: H / 2, z: 1, vx: 0, vy: 0, vz: 0 });
      const camOn = FLOW ? false : C.cam === "always" ? !!L && pos < S.hl + 0.3 : C.cam === "chorus" && !!L && L.ch && pos < S.hl + 0.3;
      { const tz = camOn ? C.camZ : 1, tx = camOn && S.camT ? S.camT[0] : W / 2, ty = camOn && S.camT ? S.camT[1] : H / 2, kk = 90 * C.camSpd, dm = 12 * Math.sqrt(C.camSpd);
        cam.vz += ((tz - cam.z) * kk - cam.vz * dm) * dt; cam.vx += ((tx - cam.x) * kk - cam.vx * dm) * dt; cam.vy += ((ty - cam.y) * kk - cam.vy * dm) * dt; cam.z += cam.vz * dt; cam.x += cam.vx * dt; cam.y += cam.vy * dt; }
      cam.roll = (cam.roll || 0) + (Math.max(-0.05, Math.min(0.05, cam.vx * 0.00035 * C.camRoll)) - (cam.roll || 0)) * Math.min(1, dt * 6);
      c.save(); c.translate(W / 2, H / 2); c.rotate(cam.roll); c.scale(cam.z, cam.z); c.translate(-cam.x, -cam.y);
      if (!FLOW && L && pos < S.hl + 0.5) {
        const end = S.hl, al = pos > end ? Math.max(0, 1 - (pos - end) / 0.5) : 1;
        let cur = 0; L.ws.forEach((w, k) => { if (w <= pos) cur = k; });
        if (C.follow && !L.wt) {   // vocal follow: a word only advances when a real note onset arrives (or after the max hold)
          if (L.g === undefined || pos < L.as[L.g] - 0.3) { L.g = 0; L.as = L.ws.slice(); }
          while (L.g < cur) { const need = L.ws[L.g + 1], o = S.on ? firstOnset(S.on, need - 0.25) : null;
            if ((o !== null && o <= pos) || pos > need + C.maxHold) { L.as[L.g + 1] = o !== null && o <= pos ? Math.max(o, need - 0.25) : pos; L.g++; } else break; }
          cur = L.g;
        }
        const WS = C.follow && !L.wt && L.as ? L.as : L.ws;
        const key = i + ":" + cur; if (key !== S.cur) { S.cur = key; S.pulse = Math.max(S.pulse, 0.7); if (camOn) cam.vz += 1.1 * C.camKick; }
        const spx = S.px, spy = S.py; S.px = cam.x + (spx - W / 2) / cam.z; S.py = cam.y + (spy - H / 2) / cam.z;
        const P = L.pts.map((p) => { const x = p[0] * W, y = p[1] * H, f = prox(x, y), [wx, wy] = warp(x, y, f); return [wx, wy, f]; }); S.px = spx; S.py = spy; S.camT = [P[cur][0], P[cur][1] + 22];
        for (let k = 1; k <= cur; k++) {
          const a = ease(clamp((pos - WS[k]) / (C.link === "comet" ? 0.5 : 0.35))), [x0, y0] = P[k - 1], [x1, y1] = P[k], hx = x0 + (x1 - x0) * a, hy = y0 + (y1 - y0) * a;
          if (C.link === "comet") {
            const st = clamp((pos - WS[k] - 0.5) / 0.7), g = c.createLinearGradient(x0, y0, hx + 0.01, hy);
            g.addColorStop(0, css(0.12 * al * C.alpha)); g.addColorStop(1, css((0.95 - 0.5 * st) * al * C.alpha));
            c.save(); c.strokeStyle = g; c.lineWidth = 1.6; c.shadowColor = css(0.9); c.shadowBlur = 10; c.beginPath(); c.moveTo(x0, y0); c.lineTo(hx, hy); c.stroke();
            if (a < 1) { c.fillStyle = css(al * C.alpha); c.shadowBlur = 18; sparkle(c, hx, hy, 5 + 3 * (1 - a)); }
            c.restore();
          } else { c.lineWidth = 1.2; c.strokeStyle = css(0.5 * al * C.alpha); c.beginPath(); c.moveTo(x0, y0); c.lineTo(hx, hy); c.stroke(); }
        }
        for (let k = 0; k <= cur; k++) {
          const ap = ease(clamp((pos - WS[k]) / 0.3)), isCur = k === cur, [x, y, f] = P[k], hf = isCur && pos - WS[k] > 0.9 ? 1 + 0.5 * (0.5 + 0.5 * Math.sin(now / 200)) : 1;
          const s = isCur ? 0 : ease(clamp((pos - WS[k + 1]) / 0.5)), a = clamp((1 - (1 - C.fade) * s + f * 0.4) * al * ap * C.alpha);
          const size = C.font * (44 - 31 * s) * (0.6 + 0.4 * ap) * (1 + 0.3 * f), r = (4 + 7 * (1 - s)) * ap * (1 + 0.9 * f) * C.starSize;
          c.fillStyle = css(a); c.shadowColor = css(0.9); c.shadowBlur = (isCur ? C.tglow : C.tglow * 0.25 * (1 - s)) * (1 + f) * hf;
          shape(c, kinds[Math.floor(L.sh[k] * kinds.length)], x, y, r, now / 700 + k, k);
          c.font = `${isCur ? 800 : 500} ${size}px ${S.ff}`;
          c.textAlign = "center"; const w = c.measureText(L.words[k]).width;
          if (C.hl !== "off" && k === L.kw) hero(c, css, C, L, x, y, Math.max(0, pos - WS[k]), now, al * C.alpha * (1 - 0.25 * s), W, S);
          else c.fillText(L.words[k], Math.min(W - w / 2 - 16, Math.max(w / 2 + 16, x)), y + r + size * 0.95);
          c.shadowBlur = 0;
          if (isCur) { c.strokeStyle = css(0.9 * al * C.alpha); c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, 15 + S.pulse * 5 + (hf > 1 ? 3 * Math.sin(now / 180) : 0), 0, 7); c.stroke();
            if (hf > 1) { const q = (now / 900) % 1; c.strokeStyle = css(0.5 * (1 - q) * al); c.beginPath(); c.arc(x, y, 15 + q * 28, 0, 7); c.stroke(); }   // long note: keep glowing on this word
            }
        }
      }
      if (FLOW) flowUpdate(S, C, L, i, pos, now, dt, W, H, rgb, fls.current, flw.current);
      S.sparks = S.sparks || [];
      for (let q = S.sparks.length - 1; q >= 0; q--) { const p = S.sparks[q]; p.life -= dt; if (p.life <= 0) { S.sparks.splice(q, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy = p.vy * 0.96 + 30 * dt; c.fillStyle = css(clamp(p.life / p.max)); shape(c, p.k, p.x, p.y, p.r * (0.5 + p.life / p.max), now / 300 + p.r); }
      c.restore();
      if (C.camVig && perfEff(S).vig && cam.z > 1.03) { const va = clamp((cam.z - 1) * 0.9) * 0.55, vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, `rgba(0,0,0,${va})`); c.fillStyle = vg; c.fillRect(0, 0, W, H); }   // soft focus pull
      if (!FLOW && C.tr !== "off" && L && L.tr && pos < S.hl + 0.5) { const a2 = clamp(1 - Math.max(0, pos - S.hl) / 0.5); c.save(); c.font = `500 17px ${S.ff}`; c.textAlign = "center"; c.textBaseline = "alphabetic";
        c.fillStyle = `rgba(255,255,255,${0.78 * a2})`; c.shadowColor = "rgba(0,0,0,.8)"; c.shadowBlur = 6; c.fillText(L.tr, W / 2, H - 44, W * 0.8); c.restore(); }
      S.pulse *= Math.exp(-dt * 5);
      if (C.edgeMode !== "off") {
        CL_EDGE_W = C.edgeW ?? 2.5; const em = 2 + CL_EDGE_W * 1.4;   // edge light: a glowing progress bar around the screen (or orbiting comets)
        c.strokeStyle = css(0.1); c.lineWidth = Math.max(1, CL_EDGE_W * 0.6); c.strokeRect(em, em, W - 2 * em, H - 2 * em);
        if (C.edgeMode === "progress") { const f = dur0 ? clamp(p0 / dur0) : 0, P2 = 2 * (W + H - 4 * em);
          c.save(); c.lineCap = "round"; c.setLineDash([f * P2, P2]); c.strokeStyle = css(0.85); c.lineWidth = 1.2 + CL_EDGE_W * 1.3; c.shadowColor = css(0.9); c.shadowBlur = 14 + 10 * S.en + 12 * S.pulse; c.strokeRect(em, em, W - 2 * em, H - 2 * em); c.restore(); comet(c, css, W, H, f, 0.05, S.pulse); }
        else { S.edge = (S.edge + dt * (0.07 + 0.1 * S.en)) % 1; comet(c, css, W, H, S.edge, 0.14, S.pulse); comet(c, css, W, H, (S.edge + 0.5) % 1, 0.14, S.pulse); }
      }
    };
    loop();
    return () => { alive = false; cancelAnimationFrame(raf); clearTimeout(S.st); Spicetify.Player.removeEventListener("songchange", load);
      Spicetify.Player.removeEventListener("onplaypause", sync); window.removeEventListener("keydown", onKey, true); };
  }, []);

  const btn = (k, v, n) => h("button", { key: n, className: "cl-btn" + (cfg[k] === v ? " on" : ""), onClick: () => upd({ [k]: v }) }, n);
  const row = (label, ...kids) => h("div", { className: "cl-row" }, h("span", { className: "cl-lab" }, label), h("div", { className: "cl-ctl" }, ...kids));
  const rng = (label, k, min, max, step, pct) => row(label, h("input", { type: "range", min, max, step, value: cfg[k], onChange: (e) => upd({ [k]: +e.target.value }) }), h("em", null, pct ? Math.round(cfg[k] * 100) + "%" : cfg[k]));
  const ic = (p, on) => h("svg", { viewBox: "0 0 24 24", width: 20, height: 20, fill: on ? "currentColor" : "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: p }));
  const ib = (p, fn, on, fillIt, cls) => h("button", { className: "cl-ib" + (on ? " on" : "") + (cls ? " " + cls : ""), onClick: fn }, ic(p, fillIt));
  const P = Spicetify.Player;
  const sec = (t) => h("div", { className: "cl-sec" }, t);
  const tg = (label, k) => h("div", { className: "cl-row h" }, h("span", { className: "cl-lab2" }, label), h("button", { className: "cl-tg" + (cfg[k] ? " on" : ""), onClick: () => upd({ [k]: !cfg[k] }) }, h("i")));
  const cards = (k, items) => h("div", { className: "cl-cards" }, items.map(([v, n, g]) => h("button", { key: v, className: "cl-cd" + (cfg[k] === v ? " on" : ""), onClick: () => upd({ [k]: v }), style: { "--g": g } }, h("i"), h("span", null, n))));
  const fch = (label, k, items) => row(label, ...items.map(([v, n, ff]) => h("button", { key: v, className: "cl-btn" + (cfg[k] === v ? " on" : ""), style: ff ? { fontFamily: `"${ff}", Inter, sans-serif` } : null, onClick: () => upd({ [k]: v }) }, n)));

  return h("div", { ref: root, className: `cl-root bg-${GALS.has(cfg.bg) || BGX.has(cfg.bg) || ASCS.has(cfg.bg) || thOn ? "galaxy" : cfg.bg}${ui || open ? " ui" : ""}`, onMouseMove: move, onMouseLeave: () => { S.mt = 0; } },
    h("div", { className: "cl-bgl", ref: bgl },
      h("div", { className: "cl-bg cl-bg-art" }),
      h("div", { className: "cl-mesh" }, h("i", { className: "cl-blob b1" }), h("i", { className: "cl-blob b2" }), h("i", { className: "cl-blob b3" }), h("i", { className: "cl-blob b4" })),
      h("div", { className: "cl-bg cl-bg-grad" }),
      h("div", { className: "cl-shade" })),
    h("canvas", { ref: cvs, className: "cl-canvas" }),
    cfg.lyricStyle === "flow" && h("div", { ref: flw, className: `fl-wrap fl-a-${cfg.flowAnim} fl-al-${cfg.flowAlign}`, style: { "--flf": fontStack(cfg, S) } },
      h("div", { ref: fls, className: "fl-scroll" }, S.lines.map((L, i) => h("div", { key: (S.uri || "") + ":" + i, className: "fl-line" },
        h("div", null, L.words.map((w, k) => h(R.Fragment, { key: k }, h("span", { className: "fl-w" }, flUnits(w).map((u, j) => h("span", { key: j, className: "fl-l", "data-c": u }, u))), " "))),
        cfg.flowTr && cfg.tr !== "off" && L.tr && h("div", { className: "fl-tr" }, L.tr))))),
    info.status && h("div", { className: "cl-meta" }, info.status),
    cfg.ctrl !== "off" && h("div", { className: `cl-ctrl ${stage} ${cfg.ctrl}` },
      h("div", { className: "cl-card", key: sk },
        h("div", { className: "cl-hov" },
          h("div", { className: "cl-cap" }, h("b", null, info.title), h("span", null, info.artist)),
          h("button", { className: "cl-heart" + (pl.heart ? " on" : ""), onClick: () => { P.toggleHeart(); setTimeout(() => setPl({ ...pl, heart: P.getHeart() }), 150); } }, ic(IC.heart, pl.heart)),
          h("div", { className: "cl-seekrow" }, h("span", { ref: tcur }, "0:00"), h("div", { className: "cl-seek", onClick: seek }, h("i", { ref: fill })), h("span", { ref: tdur }, "0:00")),
          h("div", { className: "cl-btns" },
            ib(IC.shuf, () => { P.toggleShuffle(); setTimeout(() => setPl({ ...pl, shuf: P.getShuffle() }), 150); }, pl.shuf),
            ib(IC.prev, () => P.back(), false, true), ib(pl.playing ? IC.pause : IC.play, () => { P.togglePlay(); setTimeout(() => setPl({ ...pl, playing: P.isPlaying() }), 150); }, false, true, "big"),
            ib(IC.next, () => P.next(), false, true), ib(IC.rep, () => { P.toggleRepeat(); setTimeout(() => setPl({ ...pl, rep: P.getRepeat() }), 150); }, pl.rep > 0))))),
    h("div", { className: "cl-top" },
      h("div", { className: "cl-bar" },
        h("button", { className: "cl-btn" + (open ? " on" : ""), onClick: () => setOpen(!open) }, "Settings"),
        h("button", { className: "cl-btn", onClick: fs }, "Fullscreen")),
      open && h("div", { className: "cl-panel" },
        h("div", { className: "cl-tabs" }, ["Style", "Scene", "Text", "Effects", "Visual", "Lyrics", "Director"].map((t) => h("button", { key: t, className: "cl-tab" + (tab === t ? " on" : ""), onClick: () => setTab(t) }, t))),
        h("div", { className: "cl-body", key: tab }, ...(tab === "Style" ? [
          sec("Lyric style"), cards("lyricStyle", [["constellation", "Constellation", "linear-gradient(135deg,#120c33,#6d4dff 60%,#c9b8ff)"], ["flow", "Flow", "linear-gradient(135deg,#ff8a5c,#8a3fbf 55%,#2a2060)"]]),
          h("div", { className: "cl-note" }, "Constellation: words appear as stars across the screen. Flow: whole lyrics scroll smoothly and every word fills letter by letter in time with the singer (no camera zoom, much lighter)."),
          ...(cfg.lyricStyle === "flow" ? [
            sec("Flow animation"), row("Letter effect", btn("flowAnim", "glow", "Glow"), btn("flowAnim", "wave", "Wave"), btn("flowAnim", "pop", "Pop"), btn("flowAnim", "rise", "Rise"), btn("flowAnim", "soft", "Soft fill")),
            row("Alignment", btn("flowAlign", "left", "Left"), btn("flowAlign", "center", "Center")),
            rng("Text size", "flowSize", 0.6, 1.6, 0.05, true), rng("Glow", "flowGlow", 0, 2, 0.1, true), rng("Letter motion", "flowLift", 0, 2, 0.1, true),
            sec("Flow scrolling"), rng("Scroll speed", "flowSpeed", 0.4, 2, 0.1), rng("Active line height", "flowPos", 0.2, 0.6, 0.02, true),
            rng("Other lines opacity", "flowDim", 0.1, 0.8, 0.05, true), rng("Distance blur", "flowBlur", 0, 2, 0.1, true),
            tg("Show translation", "flowTr"), tg("Fill with album colour", "flowTint"), tg("Floating dust in background", "flowDust")
          ] : []),
          sec("Background"), rng("Background brightness", "bright", 0.1, 1, 0.05, true), rng("Background dim (edges)", "dim", 0, 0.9, 0.05, true)
        ] : tab === "Scene" ? [
          sec("Background"), cards("bg", BGC), sec("Galaxy"), cards("bg", GXC),
          sec("ASCII art"), cards("bg", ASCC),
          row("Characters", btn("ascSet", "classic", "Classic"), btn("ascSet", "fine", "Fine"), btn("ascSet", "blocks", "Blocks"), btn("ascSet", "binary", "Binary"), btn("ascSet", "code", "Code"), btn("ascSet", "kana", "Katakana")),
          row("ASCII colour", btn("ascColor", "cover", "Cover colours"), btn("ascColor", "palette", "Palette"), btn("ascColor", "accent", "Accent"), btn("ascColor", "mono", "Mono")),
          row("Cover animation", btn("ascStyle", "wave", "Wave"), btn("ascStyle", "ripple", "Ripple"), btn("ascStyle", "scan", "Scan"), btn("ascStyle", "dissolve", "Dissolve"), btn("ascStyle", "glitch", "Glitch")),
          row("Knight scarf", btn("ascScarf", "red", "Red"), btn("ascScarf", "cover", "Cover colour")),
          rng("Character size", "ascSize", 7, 18, 1), rng("Animation intensity", "ascAmp", 0, 2, 0.1), rng("Music reactivity", "ascReact", 0, 2, 0.1), rng("Wind (knight, garden)", "ascWind", 0.2, 2.5, 0.1), rng("Flowers", "ascFlowers", 3, 12, 1), rng("ASCII glow", "ascGlow", 0, 1, 0.05),
          sec("Autonomous engine"), tg("Auto-morph between worlds", "dirAuto"),
            row("Mood", btn("dirMood", "auto", "Auto"), btn("dirMood", "cyber", "Cyber"), btn("dirMood", "cosmic", "Cosmic"), btn("dirMood", "organic", "Organic"), btn("dirMood", "surreal", "Surreal")),
            row("Morph style", btn("dirStyle", "auto", "Auto"), btn("dirStyle", "dissolve", "Dissolve"), btn("dirStyle", "glitch", "Glitch wipe"), btn("dirStyle", "fluid", "Fluid")),
            row("Next world", h("button", { className: "cl-btn", onClick: () => { if (S.dir) S.dir.force = true; } }, "Morph now")),
            h("div", { className: "cl-note" }, "Pick the Autonomous card above. It reads the song's mood and morphs between ocean, eye, Earth, Saturn, black hole and solar worlds every 35-55 s on musical phrase changes."),
            sec("Motion"), rng("Background speed", "bgSpeed", 0.2, 3, 0.1), rng("Travel speed", "trav", 0, 3, 0.1), rng("Parallax", "par", 0, 2, 0.1), rng("Background dim", "dim", 0, 0.9, 0.05, true), rng("Background brightness", "bright", 0.1, 1, 0.05, true),
          row("Black hole quality", btn("bhq", 256, "Low"), btn("bhq", 384, "Medium"), btn("bhq", 512, "High")),
          sec("Edge light"), row("Mode", btn("edgeMode", "progress", "Progress bar"), btn("edgeMode", "orbit", "Orbiting"), btn("edgeMode", "off", "Off")), rng("Thickness", "edgeW", 0.5, 6, 0.5),
          sec("Controller"), row("Position", btn("ctrl", "right", "Right"), btn("ctrl", "left", "Left"), btn("ctrl", "off", "Off")), rng("Size", "ctrlSize", 0.7, 1.6, 0.05, true)
        ] : tab === "Text" ? [
          sec("Colour"), row("Lyrics colour", btn("color", "adaptive", "Album"),
            ...Object.keys(CL_COLORS).map((k) => h("button", { key: k, title: k, className: "cl-dot" + (cfg.color === k ? " on" : ""), style: { background: `rgb(${CL_COLORS[k]})` }, onClick: () => upd({ color: k }) })),
            h("input", { type: "color", className: "cl-pick", title: "Custom colour", value: cfg.custom, onChange: (e) => upd({ color: "custom", custom: e.target.value }) })),
          sec("Typeface"), fch("English", "fam", FAM), fch("Bangla", "bn", BNF), fch("Arabic / Urdu", "ar", ARF),
          sec("Size & look"), rng("Font size", "font", 0.6, 1.8, 0.05, true), rng("Star size", "starSize", 0.4, 2.5, 0.1), rng("Opacity", "alpha", 0.2, 1, 0.05, true), rng("Fade threshold", "fade", 0.05, 1, 0.05, true), rng("Glow", "tglow", 0, 40, 1),
          row("Elements", btn("kinds", "mix", "Mix"), btn("kinds", "sparkle", "Sparkles"), btn("kinds", "cross", "Crosses"), btn("kinds", "shuriken", "Ninja stars"), btn("kinds", "y2k", "Y2K"))
        ] : tab === "Effects" ? [
          sec("Interaction"), row("Proximity", btn("prox", "mix", "Mix"), btn("prox", "magnet", "Magnet"), btn("prox", "repel", "Repel"), btn("prox", "swirl", "Swirl"), btn("prox", "ripple", "Ripple"), btn("prox", "off", "Off")),
          row("Links", btn("link", "comet", "Shooting star"), btn("link", "classic", "Classic")),
          sec("Highlight words"), row("Animation", btn("hl", "random", "Random"), btn("hl", "marker", "Marker"), btn("hl", "pop", "Pop"), btn("hl", "glitch", "Glitch"), btn("hl", "slide", "Slide"), btn("hl", "letters", "Letters"), btn("hl", "stamp", "Stamp"), btn("hl", "neon", "Neon"), btn("hl", "wave", "Wave"), btn("hl", "off", "Off")),
          tg("Vector icons", "icons")
        ] : tab === "Visual" ? [
          sec("Visualizer (intros, gaps, instrumentals)"), row("Style", btn("vis", "ring", "Ring"), btn("vis", "bars", "Bars"), btn("vis", "wave", "Wave"), btn("vis", "tunnel", "Tunnel"), btn("vis", "orbs", "Orbs"), btn("vis", "off", "Off")),
          rng("Size", "visSize", 0.4, 2.2, 0.1), rng("Speed", "visSpd", 0.2, 3, 0.1), tg("Also show faintly during vocals", "visAlways")
        ] : tab === "Lyrics" ? [
          sec("Source"), row("Provider", btn("src", "auto", "Auto (best match)"), btn("src", "spotify", "Spotify"), btn("src", "lrclib", "LRCLIB"), btn("src", "lrcmux", "lrcmux"), btn("src", "betterlyrics", "Better Lyrics"), btn("src", "netease", "NetEase"), btn("src", "lrcapi", "LrcApi"), btn("src", "musixmatch", "Musixmatch"), btn("src", "custom", "Custom")),
          row("Match scores", h("em", { className: "cl-wide" }, info.src ? "using " + info.src + (info.all ? "   |   " + info.all : "") : "—")),
          row("Musixmatch token", h("input", { type: "password", className: "cl-in", placeholder: "paste your usertoken (optional)", defaultValue: cfg.mxm || "", onBlur: (e) => upd({ mxm: e.target.value.trim() }) })),
          row("Custom URL", h("input", { type: "text", className: "cl-in", placeholder: "https://…?title={title}&artist={artist}&duration={duration}", defaultValue: cfg.customUrl || "", onBlur: (e) => upd({ customUrl: e.target.value.trim() }) })),
          row("Translate", btn("tr", "auto", "Auto"), btn("tr", "on", "Always"), btn("tr", "off", "Off")),
          sec("Timing"), row("Audio analysis", btn("ana", 0, "Off"), btn("ana", 1, "Light"), btn("ana", 2, "Strong"), h("em", null, S.shift ? (S.shift > 0 ? "+" : "") + S.shift.toFixed(2) + "s auto-shift" : "")),
          tg("Auto-align whole song", "auto"), tg("Vocal follow (hold on long notes)", "follow"), rng("Max hold (s)", "maxHold", 0.3, 3, 0.1),
          row("Manual sync", h("button", { className: "cl-btn", onClick: () => nudge(-0.25) }, "−0.25"), h("button", { className: "cl-btn", onClick: () => nudge(-0.05) }, "−0.05"),
            h("em", null, (off >= 0 ? "+" : "") + off.toFixed(2) + "s"), h("button", { className: "cl-btn", onClick: () => nudge(0.05) }, "+0.05"), h("button", { className: "cl-btn", onClick: () => nudge(0.25) }, "+0.25")),
          sec("Performance"), row("Device profile", btn("perfPreset", "auto", "Auto"), btn("perfPreset", "ultra", "Ultra"), btn("perfPreset", "balanced", "Balanced"), btn("perfPreset", "potato", "Low RAM"), btn("perfPreset", "custom", "Custom")),
          h("div", { className: "cl-note" }, "Auto reads RAM and CPU threads (4 GB / 4 threads or less = Low RAM). Frame rate, character size and black-hole quality sliders only apply in Custom. The engine also steps quality down by itself if frames stay slow."),
          row("Frame rate", btn("fps", 30, "30"), btn("fps", 60, "60"), btn("fps", 90, "90"))
        ] : [
          sec("Artist themes"), row("Apply to", btn("theme", "auto", "Known artists"), btn("theme", "always", "Every artist"), btn("theme", "off", "Off")), cards("themeForce", THC), rng("Theme effects", "thFx", 0.2, 1.5, 0.1, true),
          h("div", { className: "cl-note" }, "A theme replaces the background while it's active. Set Apply to: Off to use the Scene backgrounds."),
          sec("Camera"), row("Mode", btn("cam", "chorus", "Chorus"), btn("cam", "always", "Always"), btn("cam", "off", "Off")), rng("Zoom", "camZ", 1.2, 2.6, 0.1), rng("Speed", "camSpd", 0.4, 2, 0.1), rng("Bounce", "camKick", 0, 2, 0.1), rng("Roll", "camRoll", 0, 3, 0.1),
          rng("Background follows camera", "camBg", 0, 1, 0.05, true), tg("Focus vignette", "camVig")
        ])))));
}
function render() { return Spicetify.React.createElement(ConstellationApp); }
