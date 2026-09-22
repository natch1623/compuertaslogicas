"use strict";
const SIMS = {};

/* ================= AND · compresor accionado por banda ================= */
SIMS.and = {
  scene() {
    const BELT = "M237.6 91.9L335.9 137.3A14 14 0 0 1 331 164L223.1 171.9A42 42 0 0 1 237.6 91.9Z";
    return `<svg class="scene m-and" viewBox="0 0 480 300" role="img" aria-label="Compresor de aire: tablero, compresor con manómetro de aceite, volante, banda, guarda, motor y tanque">
    <ellipse class="shadow" cx="250" cy="276" rx="215" ry="9"/>
    <path class="conduit" d="M46 92V62H394V104"/>
    <rect class="metal" x="14" y="92" width="64" height="94" rx="7"/>
    <text class="lbl" x="46" y="109" text-anchor="middle">CONTROL</text>
    ${lamp(28, 132, 7, "amber", "and-lstart")}<text class="lbl" x="40" y="135">START</text>
    ${lamp(28, 162, 7, "green", "and-lrun")}<text class="lbl" x="40" y="165">MARCHA</text>
    <rect class="metal" x="70" y="200" width="340" height="56" rx="28"/>
    <path class="edge" d="M100 203V253M380 203V253"/>
    <rect class="steel" x="112" y="254" width="16" height="16" rx="2"/><rect class="steel" x="352" y="254" width="16" height="16" rx="2"/>
    <rect class="plate" x="176" y="215" width="128" height="26" rx="4"/>
    <text class="lbl" x="188" y="231">AIRE</text><text class="read" id="and-p" x="294" y="232" text-anchor="end">6.0 bar</text>
    <rect class="metal" x="92" y="150" width="84" height="50" rx="6"/>
    <rect class="metal" x="108" y="94" width="56" height="56" rx="4"/>
    ${fins(102, 170, 8, 102, 144, false)}
    <rect class="steel" x="100" y="84" width="72" height="12" rx="3"/>
    <g transform="translate(118 176)"><circle class="dial" r="15"/><path class="zone-r" d="M-10.4 6A12 12 0 0 1 -6 -10.4"/><path class="zone-g" d="M4.1 -11.3A12 12 0 0 1 10.4 6"/><path class="ndl" id="and-oil" d="M0 0V-11"/><circle r="2" fill="#EEF3F8"/></g>
    <text class="lbl" x="137" y="194">ACEITE</text>
    <rect class="steel" x="340" y="182" width="108" height="18" rx="3"/>
    <rect class="metal" x="346" y="118" width="96" height="64" rx="10"/>
    ${fins(356, 434, 7, 124, 176)}
    <rect class="steel" x="379" y="104" width="30" height="15" rx="3"/>
    <text class="lbl dim" x="394" y="195" text-anchor="middle">MOTOR 15 kW</text>
    ${wheel(220, 130, 42, 5, "and-fly")}
    ${wheel(330, 150, 14, 3, "and-pul")}
    <path class="belt" d="${BELT}"/><path class="belt-dash" id="and-belt" d="${BELT}"/>
    <rect class="exposed" x="170" y="80" width="186" height="104" rx="26"/>
    <text class="lbl warn-t" x="263" y="196" text-anchor="middle">¡ZONA EXPUESTA!</text>
    <g class="guard"><rect class="guard-f" x="170" y="80" width="186" height="104" rx="26"/><rect class="guard-m" x="170" y="80" width="186" height="104" rx="26"/><text class="lbl" x="263" y="96" text-anchor="middle">GUARDA</text></g>
  </svg>`;
  },
  mount(sc) {
    const s = sc.scene;
    sc.st = { w: 0, belt: 0, p: 6.0, oil: -80, fly: Rot(s, "and-fly", 220, 130), pul: Rot(s, "and-pul", 330, 150),
      beltEl: $("#and-belt", s), pEl: $("#and-p", s), oilEl: $("#and-oil", s), ls: $("#and-lstart", s), lr: $("#and-lrun", s) };
  },
  update(sc, b, y) { sc.st.ls.classList.toggle("on", !!b[0]); sc.st.lr.classList.toggle("on", !!y); },
  status(sc, b, y) {
    if (y) return ["ok", "Compresor en marcha", "A · B · C = 1 → se cumplen los tres permisivos"];
    const miss = sc.def.inputs.filter((_, i) => !b[i]).map(i => i[3]);
    return ["bad", "Compresor detenido", "Falta: " + miss.join(", ")];
  },
  tick(sc, dt) {
    const s = sc.st, y = sc.y;
    s.w = approach(s.w, y ? 2.2 : 0, y ? 0.8 : 0.55, dt);
    spin(s.fly, s.w, dt); spin(s.pul, s.w * 3, dt);
    s.belt = (s.belt + s.w * 2 * Math.PI * 42 * dt) % 140;
    s.beltEl.style.strokeDashoffset = f1(-s.belt);
    s.p = y ? s.p + (8.2 - s.p) * 0.07 * dt : Math.max(0, s.p - 0.08 * dt);
    s.pEl.textContent = s.p.toFixed(1) + " bar";
    s.oil = approach(s.oil, sc.vals.B ? 55 : -80, 3, dt);
    s.oilEl.setAttribute("transform", `rotate(${f1(s.oil)})`);
    sc.level = s.w / 2.2;
  }
};

/* ================= OR · banda transportadora ================= */
SIMS.or = {
  scene() {
    const estop = (x, i, l) => `<g class="es es${i}"><rect class="steel" x="${x - 3}" y="236" width="6" height="36"/><rect class="yel" x="${x - 14}" y="206" width="28" height="30" rx="4"/><g class="mush"><rect class="mush-s" x="${x - 5}" y="197" width="10" height="10"/><ellipse class="mush-h" cx="${x}" cy="197" rx="14" ry="6"/></g><text class="lbl" x="${x}" y="292" text-anchor="middle">${l}</text></g>`;
    return `<svg class="scene m-or" viewBox="0 0 480 300" role="img" aria-label="Banda transportadora con cajas, torre de señalización y tres paros de emergencia">
    <defs><clipPath id="orClip"><rect x="36" y="40" width="408" height="92"/></clipPath></defs>
    <ellipse class="shadow" cx="240" cy="278" rx="225" ry="8"/>
    <path class="edge" d="M6 272H474"/>
    <rect class="steel" x="464" y="78" width="5" height="194"/>
    <rect class="steel" x="453" y="14" width="26" height="6" rx="2"/>
    <rect class="tl tl-r" x="455" y="20" width="22" height="18" rx="3"/>
    <rect class="tl tl-a" x="455" y="39" width="22" height="18" rx="3"/>
    <rect class="tl tl-g" x="455" y="58" width="22" height="18" rx="3"/>
    <path class="belt" d="M60 130H420A20 20 0 0 1 420 170H60A20 20 0 0 1 60 130Z"/>
    <path class="belt-dash" id="or-belt" d="M60 130H420A20 20 0 0 1 420 170H60A20 20 0 0 1 60 130Z"/>
    <g clip-path="url(#orClip)"><g id="or-boxes"></g></g>
    ${wheel(60, 150, 18, 4, "or-tail")}${wheel(420, 150, 18, 4, "or-head")}
    <rect class="metal" x="72" y="143" width="336" height="14" rx="3"/>
    <text class="lbl dim" x="240" y="153" text-anchor="middle">›  ›  ›   TRANSPORTADOR T-01   ›  ›  ›</text>
    <rect class="steel" x="80" y="157" width="8" height="115"/><rect class="steel" x="236" y="157" width="8" height="115"/><rect class="steel" x="392" y="157" width="8" height="115"/>
    <path class="edge" d="M88 200L236 240M244 200L392 240"/>
    <rect class="steel" x="386" y="176" width="30" height="44" rx="4"/>
    <rect class="metal" x="412" y="182" width="46" height="32" rx="6"/>${fins(420, 452, 6, 186, 210)}
    <text class="lbl dim" x="424" y="232" text-anchor="middle">M1</text>
    ${estop(26, 0, "E1")}${estop(160, 1, "E2")}${estop(320, 2, "E3")}
  </svg>`;
  },
  mount(sc) {
    const s = sc.scene, g = $("#or-boxes", s);
    const sizes = [[40, 28], [34, 22], [46, 34], [38, 26], [42, 30]];
    const boxes = sizes.map(([w, h]) => {
      const e = document.createElementNS(SVGNS, "g");
      e.innerHTML = `<rect class="box" x="0" y="${127 - h}" width="${w}" height="${h}" rx="2"/><rect class="tape" x="${w / 2 - 3}" y="${127 - h}" width="6" height="${h}"/><rect class="tag" x="5" y="${133 - h}" width="11" height="8" rx="1"/>`;
      g.appendChild(e);
      return e;
    });
    sc.st = { v: 70, off: 0, boxes, beltEl: $("#or-belt", s), tail: Rot(s, "or-tail", 60, 150), head: Rot(s, "or-head", 420, 150) };
  },
  status(sc, b, y) {
    if (!y) return ["ok", "Banda en marcha", "E1 + E2 + E3 = 0 → ningún paro activado"];
    const act = sc.def.inputs.filter((_, i) => b[i]).map(i => `${i[0]} (${i[2]})`);
    return ["bad", "Banda detenida", "Paro activo: " + act.join(", ")];
  },
  tick(sc, dt) {
    const s = sc.st, y = sc.y;
    s.v = approach(s.v, y ? 0 : 70, y ? 2.4 : 1.1, dt);
    s.off = (s.off + s.v * dt) % 470;
    s.boxes.forEach((e, i) => e.setAttribute("transform", `translate(${f1(((i * 94 + s.off) % 470) - 20)} 0)`));
    s.beltEl.style.strokeDashoffset = f1(-(s.off % 140));
    const rev = s.v / (2 * Math.PI * 18);
    spin(s.tail, rev, dt); spin(s.head, rev, dt);
    sc.scene.dataset.tower = y ? (s.v > 4 ? "a" : "r") : "g";
    sc.level = s.v / 70;
  }
};

/* ================= NOT · tanque con bomba de llenado ================= */
SIMS.not = {
  manual: false,
  scene() {
    let ticks = "";
    for (let k = 0; k <= 10; k++) { const y = 247 - 20.4 * k; ticks += `M${k % 5 ? 174 : 170} ${f1(y)}H179`; }
    return `<svg class="scene m-not" viewBox="0 0 480 300" role="img" aria-label="Tanque con bomba de llenado, flotador LSH y válvula de consumo">
    <defs><clipPath id="notClip"><rect x="183" y="43" width="144" height="204" rx="7"/></clipPath></defs>
    <ellipse class="shadow" cx="250" cy="282" rx="215" ry="8"/>
    <path class="edge" d="M6 276H474"/>
    <path class="pipe" d="M4 238H48"/><path class="pipe-in" id="not-in" d="M4 238H48"/>
    <path class="pipe" d="M70 215V24H222V54"/><path class="pipe-in" id="not-out" d="M70 215V24H222V54"/>
    <rect class="steel" x="36" y="262" width="126" height="10" rx="2"/>
    <circle class="metal" cx="70" cy="238" r="23"/>${impeller(70, 238, 17, 6, "not-imp")}
    <rect class="steel" x="92" y="232" width="10" height="12"/>
    <rect class="metal" x="100" y="220" width="58" height="38" rx="6"/>${fins(108, 152, 6, 225, 253)}
    <text class="lbl" x="129" y="212" text-anchor="middle">BOMBA P-01</text>
    <rect class="tank" x="180" y="40" width="150" height="210" rx="10"/>
    <g clip-path="url(#notClip)">
      <rect class="hyst" x="183" y="83.8" width="144" height="36.7"/>
      <path class="water" id="not-water"/>
      <path class="surf" id="not-surf"/>
      <path class="stream" id="not-stream" d="M222 54V247"/>
      <g id="not-bub"></g>
    </g>
    <path class="tick" d="${ticks}"/>
    <path class="lsh-line" d="M176 83.8H336"/><text class="lbl" x="340" y="87">80 %</text>
    <path class="rst-line" d="M176 120.5H336"/><text class="lbl dim" x="340" y="124">62 %</text>
    <rect class="steel" x="306" y="27" width="24" height="15" rx="3"/><circle class="lsh-led" cx="312" cy="34.5" r="3"/>
    <text class="lbl" x="336" y="38">LSH</text>
    <path class="rod" d="M318 42V132"/><circle class="float" id="not-float" cx="318" cy="120" r="7"/>
    <text class="big-read" id="not-lvl" x="255" y="178" text-anchor="middle">35 %</text>
    <path class="pipe" d="M330 236H474"/><path class="pipe-in" id="not-drain" d="M330 236H474"/>
    <path class="valve-b" d="M388 225L412 247V225L388 247Z"/>
    <path class="handle" id="not-handle" d="M400 236V214M391 214H409"/>
    <text class="lbl" x="400" y="266" text-anchor="middle">CONSUMO</text>
  </svg>`;
  },
  controls: () => `<button class="sw" data-act="cons" aria-pressed="false"><span class="key">Q</span><span class="txt">Consumo de agua<small>válvula de salida</small></span><span class="track"></span></button>
    <button class="sw act" data-act="refill" aria-pressed="false"><span class="key">↺</span><span class="txt">Tanque casi vacío<small>reiniciar al 20 %</small></span></button>`,
  scenarios: [["Consumo alto", sc => SIMS.not.setCons(sc, 1)], ["Sin consumo", sc => SIMS.not.setCons(sc, 0)], ["Tanque casi vacío", sc => (sc.st.level = 0.2)]],
  mount(sc) {
    const s = sc.scene, bub = $("#not-bub", s), bubbles = [];
    for (let i = 0; i < 9; i++) {
      const c = document.createElementNS(SVGNS, "circle");
      c.setAttribute("class", "bub"); c.setAttribute("r", 1.5 + Math.random() * 2);
      bub.appendChild(c);
      bubbles.push({ c, x: 210, y: 300, v: 30 + Math.random() * 40 });
    }
    sc.st = { level: 0.35, cons: 0, pump: 0, t: 0, handle: 0, bubbles,
      water: $("#not-water", s), surf: $("#not-surf", s), stream: $("#not-stream", s), float: $("#not-float", s), lvl: $("#not-lvl", s), handleEl: $("#not-handle", s),
      imp: Rot(s, "not-imp", 70, 238), fin: Flow(s, "not-in", 3), fout: Flow(s, "not-out", 12), fdrain: Flow(s, "not-drain", 6) };
  },
  setCons(sc, v) {
    sc.st.cons = v;
    const b = $('[data-act="cons"]', sc.sec);
    b.setAttribute("aria-pressed", !!v);
  },
  action(sc, a) {
    if (a === "cons") SIMS.not.setCons(sc, sc.st.cons ? 0 : 1);
    if (a === "refill") sc.st.level = 0.2;
  },
  status(sc, b, y) {
    return y ? ["ok", "Bomba llenando", "LSH = 0 → el contacto NC sigue cerrado"] : ["warn", "Bomba detenida", "LSH = 1 → el contacto NC se abrió"];
  },
  tick(sc, dt) {
    const s = sc.st, y = sc.y;
    s.t += dt;
    s.pump = approach(s.pump, y ? 1 : 0, 1.6, dt);
    spin(s.imp, s.pump * 4, dt);
    const drain = s.level > 0.06 ? (s.cons ? 0.075 : 0.018) : 0;
    s.level = clamp(s.level + (s.pump * 0.11 - drain) * dt, 0.05, 0.97);
    const lsh = s.level >= 0.8 ? 1 : s.level <= 0.62 ? 0 : sc.vals.LSH;
    if (lsh !== sc.vals.LSH) { sc.vals.LSH = lsh; sc.update(); }
    const ys = 247 - 204 * s.level, amp = 1 + s.pump * 2 + (s.cons ? 0.6 : 0);
    let top = "";
    for (let x = 183; x <= 327; x += 8) top += `${x === 183 ? "M" : "L"}${x} ${f1(ys + Math.sin(x * 0.09 + s.t * 3.2) * amp + Math.sin(x * 0.05 - s.t * 2) * amp * 0.5)}`;
    s.water.setAttribute("d", top + "L327 250H183Z");
    s.surf.setAttribute("d", top);
    s.stream.setAttribute("d", `M222 54V${f1(ys)}`);
    s.stream.style.opacity = f1(s.pump);
    s.stream.style.strokeWidth = f1(1 + s.pump * 3);
    s.stream.style.strokeDashoffset = f1(-(s.t * 120) % 140);
    s.bubbles.forEach(bb => {
      bb.y -= bb.v * dt;
      if (bb.y < ys + 2) { bb.y = ys + 20 + Math.random() * 60; bb.x = 206 + Math.random() * 32; }
      bb.c.setAttribute("cx", f1(bb.x + Math.sin(bb.y * 0.2) * 2)); bb.c.setAttribute("cy", f1(bb.y));
      bb.c.style.opacity = f1(s.pump * 0.9);
    });
    s.float.setAttribute("cy", f1(clamp(ys, 76, 128)));
    s.lvl.textContent = Math.round(s.level * 100) + " %";
    s.handle = approach(s.handle, s.cons ? 90 : 0, 6, dt);
    s.handleEl.setAttribute("transform", `rotate(${f1(s.handle)} 400 236)`);
    s.fin.tick(dt, s.pump > 0.15 ? 1 : 0, 55);
    s.fout.tick(dt, s.pump > 0.15 ? 1 : 0, 70);
    s.fdrain.tick(dt, s.cons && s.level > 0.07 ? 1 : 0, 50);
    sc.level = s.pump;
  }
};
