"use strict";
/* ============ utilidades ============ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const SVGNS = "http://www.w3.org/2000/svg";
const ov = s => `<span class="ov">${s}</span>`;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const approach = (v, t, rate, dt) => v + (t - v) * Math.min(1, rate * dt);
const NOW = () => performance.now() / 1000;
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)");
const f1 = n => (+n).toFixed(1);

/* divide un texto en letras enmascaradas */
function splitText(el) {
  if (el.dataset.split) return;
  el.dataset.split = 1;
  const text = el.textContent.trim();
  const words = text.split(/\s+/);
  el.textContent = "";
  const sr = document.createElement("span");
  sr.className = "sr";
  sr.textContent = text;
  el.appendChild(sr);
  let i = +(el.dataset.ci0 || 0);
  words.forEach((w, wi) => {
    const ws = document.createElement("span");
    ws.className = "w";
    ws.setAttribute("aria-hidden", "true");
    for (const c of w) {
      const s = document.createElement("span");
      s.className = "ch";
      s.textContent = c;
      s.style.setProperty("--ci", i++);
      ws.appendChild(s);
    }
    el.appendChild(ws);
    if (wi < words.length - 1) el.appendChild(document.createTextNode(" "));
  });
  return i;
}

/* ============ definiciones SVG compartidas ============ */
document.body.insertAdjacentHTML("afterbegin", `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<linearGradient id="gMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4F7FA"/><stop offset=".5" stop-color="#E1E8EF"/><stop offset="1" stop-color="#C9D3DD"/></linearGradient>
<linearGradient id="gSteel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".45" stop-color="#C7D1DB"/><stop offset="1" stop-color="#95A4B3"/></linearGradient>
<linearGradient id="gBox" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9B7446"/><stop offset="1" stop-color="#5E4428"/></linearGradient>
<linearGradient id="gWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7CC0FF" stop-opacity=".75"/><stop offset="1" stop-color="#2F80ED" stop-opacity=".85"/></linearGradient>
<linearGradient id="gCone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD27A" stop-opacity=".95"/><stop offset="1" stop-color="#FFB020" stop-opacity="0"/></linearGradient>
<linearGradient id="gHeat" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFB020"/><stop offset="1" stop-color="#FF4D5E"/></linearGradient>
<linearGradient id="gAnn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8591"/><stop offset="1" stop-color="#E0293C"/></linearGradient>
<radialGradient id="gOff" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#D5DDE5"/><stop offset="1" stop-color="#B0BCC8"/></radialGradient>
<radialGradient id="gGreen" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#EAFFF5"/><stop offset=".3" stop-color="#6BFFC0"/><stop offset=".75" stop-color="#1FBF7A"/><stop offset="1" stop-color="#0B5E3B"/></radialGradient>
<radialGradient id="gRed" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#FFE7EA"/><stop offset=".3" stop-color="#FF7482"/><stop offset=".75" stop-color="#E0293C"/><stop offset="1" stop-color="#6E0F1A"/></radialGradient>
<radialGradient id="gAmber" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#FFF6DD"/><stop offset=".3" stop-color="#FFCB5C"/><stop offset=".75" stop-color="#E88A00"/><stop offset="1" stop-color="#6B3E00"/></radialGradient>
<radialGradient id="hGreen"><stop offset="0" stop-color="#34E39A" stop-opacity=".55"/><stop offset="1" stop-color="#34E39A" stop-opacity="0"/></radialGradient>
<radialGradient id="hRed"><stop offset="0" stop-color="#FF4D5E" stop-opacity=".55"/><stop offset="1" stop-color="#FF4D5E" stop-opacity="0"/></radialGradient>
<radialGradient id="hAmber"><stop offset="0" stop-color="#FFB020" stop-opacity=".55"/><stop offset="1" stop-color="#FFB020" stop-opacity="0"/></radialGradient>
<pattern id="pMesh" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 0L7 7M7 0L0 7" stroke="#8FA3B5" stroke-width=".6" opacity=".5"/></pattern>
<pattern id="pScan" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000"/></pattern>
<filter id="fShadow" x="-30%" y="-200%" width="160%" height="500%"><feGaussianBlur stdDeviation="6"/></filter>
</defs></svg>`);

/* ============ piezas gráficas ============ */
function lamp(cx, cy, r, color, id) {
  return `<g class="lamp" data-c="${color}" id="${id}"><circle class="halo" cx="${cx}" cy="${cy}" r="${r * 3.2}"/><circle class="bezel" cx="${cx}" cy="${cy}" r="${r + 2.5}"/><circle class="lens" cx="${cx}" cy="${cy}" r="${r}"/><ellipse cx="${f1(cx - r * .3)}" cy="${f1(cy - r * .38)}" rx="${f1(r * .38)}" ry="${f1(r * .2)}" fill="#fff" opacity=".3"/></g>`;
}
function wheel(cx, cy, r, n, id) {
  let sp = "";
  for (let k = 0; k < n; k++) {
    const a = k * 2 * Math.PI / n;
    sp += `M${f1(cx + Math.cos(a) * r * .24)} ${f1(cy + Math.sin(a) * r * .24)}L${f1(cx + Math.cos(a) * r * .76)} ${f1(cy + Math.sin(a) * r * .76)}`;
  }
  return `<circle class="steel" cx="${cx}" cy="${cy}" r="${r}"/><g id="${id}"><circle class="rim" cx="${cx}" cy="${cy}" r="${f1(r * .82)}"/><path class="spoke" d="${sp}"/><circle class="mark" cx="${cx}" cy="${f1(cy - r * .9)}" r="${f1(Math.max(1.6, r * .07))}"/></g><circle class="hub" cx="${cx}" cy="${cy}" r="${f1(Math.max(2.5, r * .17))}"/>`;
}
function impeller(cx, cy, r, n, id) {
  let v = "";
  for (let k = 0; k < n; k++) {
    v += `<path class="vane" transform="rotate(${(360 / n) * k} ${cx} ${cy})" d="M${cx} ${f1(cy - r * .2)}C${f1(cx + r * .35)} ${f1(cy - r * .4)} ${f1(cx + r * .3)} ${f1(cy - r * .78)} ${cx} ${f1(cy - r * .92)}C${f1(cx - r * .12)} ${f1(cy - r * .62)} ${f1(cx - r * .1)} ${f1(cy - r * .38)} ${cx} ${f1(cy - r * .2)}Z"/>`;
  }
  return `<g id="${id}">${v}<circle class="mark" cx="${cx}" cy="${f1(cy - r * .95)}" r="1.6"/></g><circle class="hub" cx="${cx}" cy="${cy}" r="${f1(r * .18)}"/>`;
}
function fins(x0, x1, step, y0, y1, vertical = true) {
  let d = "";
  if (vertical) for (let x = x0; x <= x1; x += step) d += `M${x} ${y0}V${y1}`;
  else for (let y = y0; y <= y1; y += step) d += `M${x0} ${y}H${x1}`;
  return `<path class="fin" d="${d}"/>`;
}

/* rotor con inercia */
function Rot(scene, id, cx, cy) { return { el: scene.querySelector("#" + id), cx, cy, a: Math.random() * 360 }; }
function spin(r, revs, dt) {
  if (!r.el) return;
  r.a = (r.a + revs * 360 * dt) % 360;
  r.el.setAttribute("transform", `rotate(${f1(r.a)} ${r.cx} ${r.cy})`);
}

/* partículas que recorren un tubo */
function Flow(scene, id, n, r = 2.3) {
  const path = scene.querySelector("#" + id);
  const g = document.createElementNS(SVGNS, "g");
  g.setAttribute("class", "flowdots");
  g.style.opacity = 0;
  path.after(g);
  const dots = [];
  for (let i = 0; i < n; i++) {
    const c = document.createElementNS(SVGNS, "circle");
    c.setAttribute("r", r);
    g.appendChild(c);
    dots.push(c);
  }
  return {
    len: 0, off: 0, amt: 0,
    tick(dt, target, speed = 60) {
      this.amt = approach(this.amt, target, 3, dt);
      if (this.amt < 0.01 && target === 0) { g.style.opacity = 0; return; }
      if (!this.len) this.len = path.getTotalLength() || 1;
      this.off = (this.off + speed * this.amt * dt) % this.len;
      const step = this.len / n;
      dots.forEach((c, i) => {
        const p = path.getPointAtLength((this.off + i * step) % this.len);
        c.setAttribute("cx", f1(p.x));
        c.setAttribute("cy", f1(p.y));
      });
      g.style.opacity = Math.min(1, this.amt * 1.4).toFixed(2);
    }
  };
}

/* ============ símbolo ANSI ============ */
function gateSymbol(kind, ins, y, draw = false) {
  return `<svg class="sym${draw ? " draw" : ""}" viewBox="0 0 134 80" aria-hidden="true">${gateInner(kind, ins, y, draw)}</svg>`;
}
function gateInner(kind, ins, y, draw = false) {
  const n = ins.length;
  const ys = n === 1 ? [40] : n === 2 ? [25, 55] : [22, 40, 58];
  const orish = /or/.test(kind);
  const bubble = ["not", "nand", "nor", "xnor"].includes(kind);
  const pl = draw ? ' pathLength="1"' : "";
  let body;
  if (kind === "not") body = `<path class="gb"${pl} d="M30 12 L82 40 L30 68 Z"/>`;
  else if (orish) body = `<path class="gb"${pl} d="M26 10 Q58 10 90 40 Q58 70 26 70 Q40 40 26 10 Z"/>` + (kind.startsWith("x") ? `<path class="gb2"${pl} d="M16 10 Q30 40 16 70"/>` : "");
  else body = `<path class="gb"${pl} d="M30 10 H60 A30 30 0 0 1 60 70 H30 Z"/>`;
  const tip = kind === "not" ? 82 : 90;
  if (bubble) body += `<circle class="gb"${pl} cx="${tip + 6}" cy="40" r="6"/>`;
  const outX = bubble ? tip + 12 : tip;
  const wires = ys.map((yy, i) => {
    const t = (yy - 10) / 60;
    const xe = orish ? 26 + 28 * t * (1 - t) : 30;
    return `<path class="w${ins[i] ? " hot" : ""}"${pl} d="M2 ${yy} H${xe.toFixed(1)}"/>`;
  }).join("");
  return `${wires}${body}<path class="w${y ? " hot" : ""}"${pl} d="M${outX} 40 H132"/>`;
}
const GATE_FN = {
  and: b => b.every(Boolean), or: b => b.some(Boolean), not: b => !b[0],
  nand: b => !b.every(Boolean), nor: b => !b.some(Boolean),
  xor: b => b.filter(Boolean).length % 2 === 1, xnor: b => b.filter(Boolean).length % 2 === 0
};

/* ============ Ladder con flujo de corriente ============ */
const CW = 104, RH = 80;
function lsize(n) {
  if (n.t === "no" || n.t === "nc") return { w: 1, h: 1 };
  const s = n.c.map(lsize);
  return n.t === "s"
    ? { w: s.reduce((a, b) => a + b.w, 0), h: Math.max(...s.map(b => b.h)) }
    : { w: Math.max(...s.map(b => b.w)), h: s.reduce((a, b) => a + b.h, 0) };
}
function lcond(n, v) {
  if (n.t === "no") return !!v[n.v];
  if (n.t === "nc") return !v[n.v];
  return n.t === "s" ? n.c.every(k => lcond(k, v)) : n.c.some(k => lcond(k, v));
}
function lay(n, x, y, W, pin, v, o, opt) {
  const yc = y + RH / 2;
  const put = (hot, d) => (hot ? o.hot : o.cold).push(`<path pathLength="1" d="${d}"/>`);
  let pout;
  if (n.t === "no" || n.t === "nc") {
    pout = pin && lcond(n, v);
    const cx = x + CW / 2;
    put(pin, `M${x} ${yc}H${cx - 9}`);
    put(pout, `M${cx - 9} ${yc - 16}V${yc + 16}M${cx + 9} ${yc - 16}V${yc + 16}` + (n.t === "nc" ? `M${cx - 17} ${yc + 15}L${cx + 17} ${yc - 15}` : ""));
    put(pout, `M${cx + 9} ${yc}H${x + W}`);
    const click = opt.click ? ` class="ct" data-var="${n.v}"` : "";
    o.txt.push(`<g${click}><rect class="hit" x="${x + 8}" y="${y + 2}" width="${CW - 16}" height="${RH - 4}" rx="8"/><text class="var" x="${cx}" y="${yc - 24}">${n.label || n.v}</text><text class="tag" x="${cx}" y="${yc + 34}">${n.t === "nc" ? "NC" : "NA"}</text></g>`);
  } else if (n.t === "s") {
    let cx = x, p = pin;
    n.c.forEach((k, i) => {
      const w = i === n.c.length - 1 ? x + W - cx : lsize(k).w * CW;
      p = lay(k, cx, y, w, p, v, o, opt);
      cx += w;
    });
    pout = p;
  } else {
    let yy = y, any = false;
    n.c.forEach((k, i) => {
      const pk = lay(k, x, yy, W, pin, v, o, opt);
      any = any || pk;
      if (i > 0) {
        const yk = yy + RH / 2;
        put(pin, `M${x} ${yc}V${yk}`);
        put(pk, `M${x + W} ${yc}V${yk}`);
      }
      yy += lsize(k).h * RH;
    });
    pout = pin && any;
  }
  if (n.note && opt.notes) {
    const h = lsize(n).h * RH;
    o.notes.push(`<g class="note"><rect x="${x + 4}" y="${y + 1}" width="${W - 8}" height="${h - 2}" rx="10"/><text x="${x + W / 2}" y="${y + h + 15}">${n.note}</text></g>`);
  }
  return pout;
}
function ladder(tree, v, opt = {}) {
  const s = lsize(tree), X0 = 18, TW = s.w * CW, COIL = 116;
  const W = X0 + TW + COIL + 18, H = s.h * RH + (opt.notes ? 26 : 4);
  const o = { cold: [], hot: [], txt: [], notes: [] };
  const pout = lay(tree, X0, 2, TW, true, v, o, opt);
  const yc = 2 + RH / 2, cc = X0 + TW + COIL / 2;
  const put = (hot, d) => (hot ? o.hot : o.cold).push(`<path pathLength="1" d="${d}"/>`);
  put(pout, `M${X0 + TW} ${yc}H${cc - 14}M${cc + 14} ${yc}H${W - 18}`);
  let coil;
  if (opt.lamp) {
    coil = `<circle class="lampx" cx="${cc}" cy="${yc}" r="14"/><path d="M${cc - 10} ${yc - 10}L${cc + 10} ${yc + 10}M${cc + 10} ${yc - 10}L${cc - 10} ${yc + 10}" stroke="${pout ? "#B07600" : "#2E4254"}" stroke-width="2"/>`;
  } else {
    put(pout, `M${cc - 7} ${yc - 17}Q${cc - 19} ${yc} ${cc - 7} ${yc + 17}M${cc + 7} ${yc - 17}Q${cc + 19} ${yc} ${cc + 7} ${yc + 17}`);
    coil = "";
  }
  put(true, `M${X0} 0V${s.h * RH + 4}`);
  o.cold.push(`<path pathLength="1" d="M${W - 18} 0V${s.h * RH + 4}"/>`);
  return `<svg class="ld${pout ? " on" : ""}${opt.draw ? " draw" : ""}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
    <circle class="glow" cx="${cc}" cy="${yc}" r="${opt.lamp ? 30 : 22}"/>
    <g class="w">${o.cold.join("")}</g><g class="w hot">${o.hot.join("")}</g>${coil}
    ${o.notes.join("")}${o.txt.join("")}
    <text class="var" x="${cc}" y="${yc - 26}">${opt.coil || "Y"}</text>
    <text class="tag" x="${cc}" y="${yc + 34}">${opt.lamp ? "LÁMPARA" : "BOBINA"}</text>
  </svg>`;
}

/* ============ sonido (WebAudio, apagado por defecto) ============ */
const sfx = {
  on: false, ctx: null, humG: null,
  init() {
    if (this.ctx) return;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    this.ctx = new C();
    const o = this.ctx.createOscillator(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    o.type = "sawtooth"; o.frequency.value = 120;
    f.type = "lowpass"; f.frequency.value = 420;
    g.gain.value = 0;
    o.connect(f); f.connect(g); g.connect(this.ctx.destination);
    o.start();
    this.humG = g;
  },
  tone(freq, type, dur, vol, to) {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol, freq) {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime, len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
    const s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    s.buffer = buf; f.type = "bandpass"; f.frequency.value = freq; g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(this.ctx.destination); s.start(t);
  },
  click() { this.tone(2400, "square", .02, .025); },
  clack() { this.noise(.08, .5, 1500); this.tone(120, "sine", .1, .25, 55); },
  alarm() { this.tone(880, "square", .13, .04); setTimeout(() => this.tone(660, "square", .13, .04), 170); },
  ok() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, "triangle", .2, .07), i * 80)); },
  bad() { this.tone(170, "sawtooth", .4, .07, 70); },
  whoosh() { this.noise(.35, .12, 700); },
  hum(level) { if (this.humG) this.humG.gain.setTargetAtTime(this.on ? level * 0.045 : 0, this.ctx.currentTime, 0.1); },
  toggle() {
    this.on = !this.on;
    if (this.on) { this.init(); this.ctx?.resume(); this.click(); }
    else this.hum(0);
    return this.on;
  }
};

/* ============ cronograma ============ */
function chronoSVG(names, hist, colorLast = true) {
  const rows = names.length, RHc = 44, X0 = 58, X1 = 506, WIN = 12, H = rows * RHc + 22;
  const now = NOW(), t0 = now - WIN, sx = t => X0 + (t - t0) / WIN * (X1 - X0);
  let grid = "";
  for (let s = 0; s <= WIN; s += 2) {
    const x = sx(now - s);
    grid += `<path class="gl" d="M${f1(x)} 4V${rows * RHc}"/><text x="${f1(x)}" y="${rows * RHc + 16}" text-anchor="middle" style="fill:#566B7E;font-size:9px">${s ? "−" + s + " s" : "ahora"}</text>`;
  }
  let sigs = "";
  names.forEach((nm, r) => {
    const hi = r * RHc + 12, lo = r * RHc + 34;
    let i = 0;
    while (i < hist.length - 1 && hist[i + 1].t <= t0) i++;
    let val = hist.length ? hist[i].v[r] : 0;
    let d = `M${X0} ${val ? hi : lo}`;
    for (let k = i + 1; k < hist.length; k++) {
      const nv = hist[k].v[r];
      if (nv !== val) { d += `H${f1(sx(hist[k].t))}V${nv ? hi : lo}`; val = nv; }
    }
    d += `H${X1}`;
    const isY = colorLast && r === rows - 1;
    sigs += `<text x="8" y="${r * RHc + 27}">${nm}</text><path class="base" d="M${X0} ${lo}H${X1}"/><path class="sig${isY ? " y" : ""}" d="${d}"/>`;
  });
  return `<svg class="chrono" viewBox="0 0 520 ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${grid}${sigs}<path class="now" d="M${X1} 4V${rows * RHc}"/></svg>`;
}
