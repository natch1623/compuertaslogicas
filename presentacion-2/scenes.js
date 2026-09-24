"use strict";
const SIMS = {};
const B01 = v => (v ? 1 : 0);

/* ================= AND + OR · prensa industrial con bypass ================= */
SIMS.and = {
  scene() {
    const palm = (x, i, l) => `<g class="palm p${i}"><ellipse class="palm-base" cx="${x}" cy="186" rx="18" ry="6"/><g class="palm-cap"><rect class="palm-s" x="${x - 9}" y="173" width="18" height="12"/><ellipse class="palm-h" cx="${x}" cy="173" rx="16" ry="6.5"/></g><text class="lbl dim" x="${x}" y="200" text-anchor="middle">${l}</text></g>`;
    return `<svg class="scene m-press" viewBox="0 0 480 300" role="img" aria-label="Prensa hidráulica con mando bimanual, pedal de bypass y unidad hidráulica">
    <ellipse class="shadow" cx="240" cy="282" rx="225" ry="8"/>
    <path class="edge" d="M6 274H474"/>
    <rect class="steel" x="62" y="204" width="10" height="70"/><rect class="steel" x="42" y="268" width="50" height="6" rx="2"/>
    <rect class="metal" x="12" y="156" width="110" height="50" rx="9"/>
    <text class="lbl" x="67" y="146" text-anchor="middle">MANDO BIMANUAL</text>
    ${palm(38, 0, "A · IZQ")}${palm(96, 1, "B · DER")}
    <path class="hose" d="M362 206H346V12H262"/><path class="hose-in" id="pr-hose" d="M362 206H346V12H262"/>
    <rect class="steel" x="218" y="2" width="44" height="20" rx="3"/>
    <rect class="metal" x="150" y="30" width="22" height="200" rx="4"/><rect class="metal" x="308" y="30" width="22" height="200" rx="4"/>
    <rect class="metal" x="140" y="18" width="200" height="46" rx="8"/>
    <text class="lbl dim" x="240" y="45" text-anchor="middle">PRENSA 60 t</text>
    <rect class="danger" x="178" y="108" width="124" height="96" rx="4"/>
    <text class="lbl warn-t" x="240" y="160" text-anchor="middle">ZONA DE PELIGRO</text>
    <rect class="rodp" id="pr-rod" x="233" y="64" width="14" height="10"/>
    <g id="pr-ram"><rect class="metal" x="176" y="72" width="128" height="26" rx="4"/>${fins(186, 294, 12, 76, 94)}<rect class="punch" x="222" y="98" width="36" height="10" rx="2"/></g>
    <rect class="metal" x="140" y="224" width="200" height="38" rx="6"/>
    <rect class="steel" x="152" y="262" width="30" height="12" rx="1"/><rect class="steel" x="298" y="262" width="30" height="12" rx="1"/>
    <rect class="steel" x="204" y="212" width="72" height="12" rx="2"/>
    <path class="piece" id="pr-piece" d="M214 212V204H266V212Z"/>
    <rect class="plate" x="196" y="236" width="88" height="20" rx="3"/>
    <text class="lbl" x="204" y="250">PIEZAS</text><text class="read" id="pr-n" x="276" y="251" text-anchor="end">0</text>
    ${lamp(368, 36, 7, "green", "pr-lrun")}<text class="lbl" x="382" y="39">MOTOR</text>
    ${lamp(368, 62, 7, "amber", "pr-lbyp")}<text class="lbl" x="382" y="65">BYPASS</text>
    <rect class="metal" x="374" y="130" width="66" height="42" rx="7"/>${fins(382, 432, 6, 135, 167)}
    ${wheel(452, 151, 12, 3, "pr-fan")}
    <rect class="metal" x="362" y="176" width="104" height="54" rx="8"/>
    <text class="lbl" x="414" y="206" text-anchor="middle">UNIDAD HIDR.</text>
    <rect class="steel" x="376" y="266" width="88" height="8" rx="2"/>
    <path class="pedal-hood" d="M382 266V248Q420 232 458 248V266"/>
    <rect class="yel pedal" x="394" y="254" width="52" height="8" rx="2"/>
    <text class="lbl" x="420" y="292" text-anchor="middle">PEDAL BYPASS · C</text>
  </svg>`;
  },
  scenarios: [["Operación bimanual", [1, 1, 0]], ["Una mano libre", [1, 0, 0]], ["Mantenimiento (bypass)", [0, 0, 1]]],
  mount(sc) {
    const s = sc.scene;
    sc.st = { d: 0, t: 0, m: 0, n: 0, hit: false, ram: $("#pr-ram", s), rod: $("#pr-rod", s), piece: $("#pr-piece", s), nEl: $("#pr-n", s),
      lrun: $("#pr-lrun", s), lbyp: $("#pr-lbyp", s), fan: Rot(s, "pr-fan", 452, 151), hose: Flow(s, "pr-hose", 10, 2) };
  },
  update(sc, b, y) {
    sc.st.lrun.classList.toggle("on", !!y);
    sc.st.lbyp.classList.toggle("on", !!b[2]);
  },
  status(sc, [a, b, c], y) {
    if (y && a && b && c) return ["ok", "A · B = 1 y C = 1: la prensa opera por ambas vías"];
    if (y && a && b) return ["ok", "A · B = 1 → ambas manos en los pulsadores, fuera de la zona"];
    if (y) return ["warn", "C = 1 → bypass técnico: la prensa opera sin mando bimanual"];
    if (a || b) return ["bad", "Una mano libre: A · B = 0 y sin bypass → el motor no arranca"];
    return ["idle", "A · B = 0 y C = 0 → la prensa queda arriba"];
  },
  tick(sc, dt) {
    const s = sc.st, y = sc.y, T = 2.2;
    s.m = approach(s.m, y, y ? 2 : 0.8, dt);
    spin(s.fan, s.m * 4, dt);
    s.hose.tick(dt, y ? 1 : 0, 70);
    if (y) {
      s.t += dt;
      const p = (s.t % T) / T;
      s.d = approach(s.d, Math.sin(Math.PI * p) ** 2 * 96, 14, dt);
      if (p > 0.5 && !s.hit) { s.hit = true; s.n++; s.nEl.textContent = s.n; s.piece.setAttribute("d", "M214 212V204H226L232 210H248L254 204H266V212Z"); sfx.noise(.12, .6, 400); }
      if (p < 0.5 && s.hit) { s.hit = false; s.piece.setAttribute("d", "M214 212V204H266V212Z"); }
    } else {
      s.t = 0;
      s.d = approach(s.d, 0, 3, dt);
    }
    s.ram.setAttribute("transform", `translate(0 ${f1(s.d)})`);
    s.rod.setAttribute("height", f1(10 + s.d));
    sc.scene.dataset.moving = s.d > 3 ? 1 : 0;
    sc.level = s.m;
  }
};

/* ================= OR + AND · alarma de intrusión con armado ================= */
SIMS.or = {
  scene() {
    let stars = "";
    [[30, 30], [72, 58], [120, 22], [190, 30], [300, 20], [352, 48], [462, 88], [16, 96], [404, 16]].forEach(([x, y]) => (stars += `<circle cx="${x}" cy="${y}" r="1.2"/>`));
    const waves = (s) => `<path d="M${240 - 26 * s} 84Q${240 - 34 * s} 96 ${240 - 26 * s} 108"/><path d="M${240 - 38 * s} 76Q${240 - 50 * s} 96 ${240 - 38 * s} 116"/>`;
    return `<svg class="scene m-alarm" viewBox="0 0 480 300" role="img" aria-label="Casa con sensores en puerta y ventana, sirena y llave de armado">
    <g class="stars">${stars}</g><circle class="moon" cx="440" cy="40" r="13"/>
    <ellipse class="shadow" cx="240" cy="276" rx="220" ry="8"/>
    <path class="edge" d="M6 270H474"/>
    <rect class="flash" x="0" y="0" width="480" height="300"/>
    <path class="house" d="M110 270V126H370V270Z"/>
    <path class="roof" d="M90 130L240 48L390 130Z"/>
    <g class="waves">${waves(1)}${waves(-1)}</g>
    <rect class="steel" x="226" y="108" width="28" height="8" rx="2"/>
    ${lamp(240, 96, 11, "red", "al-siren")}
    <text class="lbl" x="240" y="140" text-anchor="middle">SIRENA · Y</text>
    <rect class="frame" x="147" y="183" width="56" height="87"/><rect class="hole" x="150" y="186" width="50" height="84"/>
    <g class="leaf"><rect class="door" x="150" y="186" width="50" height="84"/><circle class="knob" cx="192" cy="230" r="2.6"/></g>
    <rect class="mag" x="182" y="176" width="16" height="6" rx="1"/><circle class="sled s0" cx="206" cy="179" r="3.2"/>
    <text class="lbl" x="175" y="290" text-anchor="middle">PUERTA · A</text>
    <rect class="frame" x="265" y="165" width="76" height="66"/><rect class="hole" x="268" y="168" width="70" height="60"/>
    <rect class="pane" x="268" y="168" width="70" height="30"/>
    <g class="sash"><rect class="pane" x="268" y="198" width="70" height="30"/><path class="mullion" d="M268 198H338"/></g>
    <rect class="mag" x="341" y="195" width="6" height="16" rx="1"/><circle class="sled s1" cx="352" cy="188" r="3.2"/>
    <text class="lbl" x="303" y="252" text-anchor="middle">VENTANA · B</text>
    <path class="conduit" d="M206 176V160H352V184M240 140V160"/>
    <rect class="steel" x="430" y="216" width="8" height="54"/>
    <rect class="metal" x="404" y="146" width="60" height="74" rx="9"/>
    <circle class="steel" cx="434" cy="174" r="13"/><rect class="key" x="431.5" y="163" width="5" height="22" rx="1.5"/>
    ${lamp(434, 204, 6, "red", "al-armed")}
    <text class="lbl" x="434" y="138" text-anchor="middle">LLAVE · C</text>
    <text class="lbl dim" x="434" y="240" text-anchor="middle" id="al-mode">DESARMADO</text>
  </svg>`;
  },
  scenarios: [["Ventana abierta, desarmado", [0, 1, 0]], ["Armado, todo cerrado", [0, 0, 1]], ["Armado y abren la puerta", [1, 0, 1]]],
  mount(sc) { const s = sc.scene; sc.st = { t: 0, siren: $("#al-siren", s), armed: $("#al-armed", s), mode: $("#al-mode", s) }; },
  update(sc, b, y, first, prev) {
    sc.st.armed.classList.toggle("on", !!b[2]);
    sc.st.mode.textContent = b[2] ? "ARMADO" : "DESARMADO";
    if (y && !prev && !first) { sfx.alarm(); sc.st.t = 0; }
  },
  status(sc, [a, b, c], y) {
    if (y) return ["bad", `(A + B) · C = 1 → ${a && b ? "puerta y ventana abiertas" : a ? "puerta abierta" : "ventana abierta"} con el sistema armado`];
    if (c) return ["ok", "Armado y todo cerrado: A + B = 0"];
    if (a || b) return ["warn", "Hay un acceso abierto, pero C = 0: el sistema está desarmado"];
    return ["idle", "Desarmado y todo cerrado"];
  },
  tick(sc, dt) {
    const s = sc.st;
    s.t += dt;
    s.siren.classList.toggle("on", !!sc.y && Math.floor(s.t * 4) % 2 === 0);
    if (sc.y && s.t > 1.2) { s.t = 0.001; sfx.alarm(); }
    sc.level = 0;
  }
};

/* ================= NOT · iluminación automática nocturna ================= */
SIMS.not = {
  manual: false,
  tip: "A la fija el sensor de luz.",
  scene() {
    let stars = "", wins = "";
    [[40, 30], [96, 60], [150, 24], [210, 46], [268, 18], [330, 40], [420, 24], [460, 62], [180, 80], [380, 70]].forEach(([x, y]) => (stars += `<circle cx="${x}" cy="${y}" r="1.3"/>`));
    [[32, 184], [52, 184], [32, 210], [52, 210], [82, 156], [102, 156], [82, 182], [102, 208], [150, 200], [170, 200], [150, 226]].forEach(([x, y]) => (wins += `<rect class="win" x="${x}" y="${y}" width="10" height="13" rx="1"/>`));
    return `<svg class="scene m-luz" viewBox="0 0 480 300" role="img" aria-label="Calle con farola, sensor de luz LDR y ciclo de día y noche">
    <defs><clipPath id="luzClip"><rect x="0" y="0" width="480" height="274" rx="10"/></clipPath></defs>
    <g clip-path="url(#luzClip)">
      <rect id="lz-sky" x="0" y="0" width="480" height="274"/>
      <g class="stars" id="lz-stars">${stars}</g>
      <circle class="sun" id="lz-sun" r="15"/><circle class="moon" id="lz-moon" r="10"/>
    </g>
    <path class="bldg" d="M22 274V170H70V142H120V274ZM140 274V188H196V274Z"/>
    ${wins}
    <path class="cone" d="M364 92L292 274H460L388 92Z"/>
    <ellipse class="spot" cx="376" cy="274" rx="80" ry="8"/>
    <path class="edge" d="M6 274H474"/>
    <rect class="steel" x="306" y="96" width="8" height="178"/><rect class="steel" x="298" y="266" width="24" height="8" rx="2"/>
    <path class="arm" d="M310 104Q310 80 336 80H370"/>
    <path class="head" d="M354 74H398L390 90H362Z"/>
    <ellipse class="bulb" cx="376" cy="91" rx="13" ry="3.6"/>
    <rect class="steel" x="301" y="86" width="18" height="12" rx="2"/>
    <circle class="ldr" cx="310" cy="80" r="7"/><path class="ldr-z" d="M305 80L307 77L309 83L311 77L313 83L315 80"/>
    <text class="lbl" x="296" y="72" text-anchor="end">LDR · A</text>
    <text class="lbl" x="376" y="62" text-anchor="middle">LÁMPARA · Y</text>
    <rect class="plate" x="14" y="14" width="122" height="46" rx="6"/>
    <text class="lbl" x="24" y="31">HORA</text><text class="read" id="lz-h" x="126" y="32" text-anchor="end">12:00</text>
    <text class="lbl" x="24" y="50">LUZ</text><text class="read" id="lz-lux" x="126" y="51" text-anchor="end">0 lux</text>
  </svg>`;
  },
  controls: () => `<div class="range"><label for="lz-hr">Hora del día</label><input id="lz-hr" type="range" min="0" max="23.9" step="0.1" value="17"><output id="lz-ho" for="lz-hr">17:00</output></div>
    ${actHTML("auto", "↻", "Ciclo automático", "un día en 20 s", true)}`,
  scenarios: [["Mediodía", sc => SIMS.not.setH(sc, 12)], ["Atardecer", sc => SIMS.not.setH(sc, 17.8)], ["Medianoche", sc => SIMS.not.setH(sc, 0)]],
  fmt: h => `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.floor((h % 1) * 60)).padStart(2, "0")}`,
  lux: h => { const e = Math.sin(Math.PI * (h - 6) / 12); return e > 0 ? 20 + 980 * e : Math.max(0, 20 + 60 * e); },
  mount(sc) {
    const s = sc.scene, sec = sc.sec;
    sc.st = { h: 17, auto: true, r: $("#lz-hr", sec), o: $("#lz-ho", sec), sky: $("#lz-sky", s), stars: $("#lz-stars", s), sun: $("#lz-sun", s), moon: $("#lz-moon", s), hEl: $("#lz-h", s), lux: $("#lz-lux", s) };
    sc.st.r.addEventListener("input", () => { SIMS.not.setAuto(sc, false); sc.st.h = +sc.st.r.value; });
  },
  setH(sc, h) { SIMS.not.setAuto(sc, false); sc.st.h = h; sc.st.r.value = h; },
  setAuto(sc, v) { sc.st.auto = v; $('[data-act="auto"]', sc.sec).setAttribute("aria-pressed", v); },
  action(sc, a) { if (a === "auto") SIMS.not.setAuto(sc, !sc.st.auto); },
  status(sc, [a], y) {
    const lx = Math.round(SIMS.not.lux(sc.st?.h ?? 17));
    return y ? ["ok", `Hay ${lx} lux → A = 0 (noche) → Y = A′ = 1`] : ["idle", `Hay ${lx} lux → A = 1 (día) → Y = A′ = 0`];
  },
  tick(sc, dt) {
    const s = sc.st;
    if (s.auto) { s.h = (s.h + dt * 1.2) % 24; s.r.value = s.h.toFixed(1); }
    const lx = SIMS.not.lux(s.h), f = clamp((lx - 20) / 300, 0, 1);
    s.o.textContent = SIMS.not.fmt(s.h); s.hEl.textContent = SIMS.not.fmt(s.h);
    s.lux.textContent = Math.round(lx) + " lux";
    const A = lx > 60 ? 1 : lx < 30 ? 0 : sc.vals.A;
    if (A !== sc.vals.A) { sc.vals.A = A; sc.update(); }
    const mix = (c1, c2) => c1.map((v, i) => Math.round(v + (c2[i] - v) * f));
    const [r, g, b] = mix([22, 32, 58], [150, 200, 235]);
    s.sky.setAttribute("fill", `rgb(${r},${g},${b})`);
    s.stars.style.opacity = (1 - f).toFixed(2);
    const arc = (hh, el) => {
      const ang = Math.PI * (hh - 6) / 12;
      el.setAttribute("cx", f1(240 - 200 * Math.cos(ang))); el.setAttribute("cy", f1(262 - 220 * Math.sin(ang)));
    };
    arc(s.h, s.sun); arc((s.h + 12) % 24, s.moon);
    sc.level = 0;
  }
};

/* ================= NAND + AND · llenado de tanque con panel ================= */
SIMS.nand = {
  manual: false,
  tip: "A y B los fija el nivel; C, el panel.",
  scene() {
    let ticks = "";
    for (let k = 0; k <= 10; k++) { const y = 247 - 20.4 * k; ticks += `M${k % 5 ? 174 : 170} ${f1(y)}H179`; }
    const probe = (y, i, l) => `<g class="probe pr${i}"><path class="lsh-line" d="M176 ${y}H330"/><rect class="steel" x="314" y="${y - 5}" width="14" height="10" rx="2"/><circle class="pled" cx="342" cy="${y}" r="4"/><text class="lbl" x="352" y="${y + 3}">${l}</text><path class="fault-x" d="M308 ${y - 8}L334 ${y + 8}M334 ${y - 8}L308 ${y + 8}"/></g>`;
    return `<svg class="scene m-not m-tank" viewBox="0 0 480 300" role="img" aria-label="Tanque con bomba, dos sensores de nivel y panel de encendido manual">
    <defs><clipPath id="tkClip"><rect x="183" y="43" width="144" height="204" rx="7"/></clipPath></defs>
    <ellipse class="shadow" cx="250" cy="282" rx="215" ry="8"/>
    <ellipse class="puddle" id="tk-pud" cx="356" cy="276" rx="0" ry="4"/>
    <path class="edge" d="M6 276H474"/>
    <path class="pipe" d="M4 238H48"/><path class="pipe-in" id="tk-in" d="M4 238H48"/>
    <path class="pipe" d="M70 215V24H222V54"/><path class="pipe-in" id="tk-out" d="M70 215V24H222V54"/>
    <rect class="steel" x="36" y="262" width="126" height="10" rx="2"/>
    <circle class="metal" cx="70" cy="238" r="23"/>${impeller(70, 238, 17, 6, "tk-imp")}
    <rect class="steel" x="92" y="232" width="10" height="12"/>
    <rect class="metal" x="100" y="220" width="58" height="38" rx="6"/>${fins(108, 152, 6, 225, 253)}
    <text class="lbl" x="129" y="212" text-anchor="middle">BOMBA · Y</text>
    <rect class="metal" x="92" y="52" width="74" height="84" rx="8"/>
    <text class="lbl" x="129" y="46" text-anchor="middle">PANEL · C</text>
    <circle class="steel" cx="129" cy="82" r="14"/><rect class="selector" x="126.5" y="70" width="5" height="24" rx="2"/>
    ${lamp(129, 118, 7, "green", "tk-lp")}
    <rect class="tank" x="180" y="40" width="150" height="210" rx="10"/>
    <g clip-path="url(#tkClip)">
      <path class="water" id="tk-water"/><path class="surf" id="tk-surf"/>
      <path class="stream" id="tk-stream" d="M222 54V247"/>
    </g>
    <path class="spill" id="tk-spill" d="M330 42Q350 44 352 70V274"/>
    <path class="tick" d="${ticks}"/>
    ${probe(83.8, 0, "NIVEL 1 · A")}${probe(63.4, 1, "NIVEL 2 · B")}
    <text class="big-read" id="tk-lvl" x="255" y="178" text-anchor="middle">35 %</text>
    <path class="pipe" d="M330 236H474"/><path class="pipe-in" id="tk-drain" d="M330 236H474"/>
    <path class="valve-b" d="M388 225L412 247V225L388 247Z"/>
    <path class="handle" id="tk-handle" d="M400 236V214M391 214H409"/>
    <text class="lbl" x="400" y="266" text-anchor="middle">CONSUMO</text>
  </svg>`;
  },
  controls: () => actHTML("C", "C", "Panel de encendido", "manual", true) + actHTML("cons", "Q", "Consumo de agua", "válvula de salida", false) + actHTML("fault", "!", "Falla del sensor 2", "B queda en 0", false),
  scenarios: [["Llenado normal", sc => { SIMS.nand.set(sc, "fault", 0); sc.st.level = Math.min(sc.st.level, 0.4); SIMS.nand.setC(sc, 1); }],
    ["Falla del sensor 2", sc => SIMS.nand.set(sc, "fault", 1)], ["Panel apagado", sc => SIMS.nand.setC(sc, 0)]],
  mount(sc) {
    const s = sc.scene;
    sc.st = { level: 0.35, cons: 0, fault: 0, pump: 0, t: 0, handle: 0, over: false,
      water: $("#tk-water", s), surf: $("#tk-surf", s), stream: $("#tk-stream", s), lvl: $("#tk-lvl", s), handleEl: $("#tk-handle", s), spill: $("#tk-spill", s), pud: $("#tk-pud", s), lp: $("#tk-lp", s),
      imp: Rot(s, "tk-imp", 70, 238), fin: Flow(s, "tk-in", 3), fout: Flow(s, "tk-out", 12), fdrain: Flow(s, "tk-drain", 6) };
    sc.vals.C = 1;
  },
  set(sc, k, v) {
    sc.st[k] = v;
    $(`[data-act="${k}"]`, sc.sec).setAttribute("aria-pressed", !!v);
    sc.scene.dataset.fault = sc.st.fault;
  },
  setC(sc, v) { sc.vals.C = v; $('[data-act="C"]', sc.sec).setAttribute("aria-pressed", !!v); sc.update(); },
  action(sc, a) {
    if (a === "C") { SIMS.nand.setC(sc, sc.vals.C ? 0 : 1); sfx.click(); }
    if (a === "cons" || a === "fault") { SIMS.nand.set(sc, a, sc.st[a] ? 0 : 1); sfx.click(); }
  },
  update(sc, b) { sc.st.lp.classList.toggle("on", !!b[2]); sc.scene.dataset.c = b[2]; },
  status(sc, [a, b, c], y) {
    if (sc.st?.over) return ["bad", "B quedó en 0 por la falla: (A · B)′ = 1 y la bomba nunca se detiene", "¡Rebose!"];
    if (!c) return ["idle", "C = 0 → panel apagado: la bomba no opera"];
    if (a && b) return ["warn", "A · B = 1 → (A · B)′ = 0: bloqueo por nivel máximo"];
    return ["ok", `(A · B)′ · C = 1 → llenando${sc.st?.fault ? " (sensor 2 en falla)" : ""}`];
  },
  tick(sc, dt) {
    const s = sc.st, v = sc.vals;
    s.t += dt;
    s.pump = approach(s.pump, sc.y, 1.6, dt);
    spin(s.imp, s.pump * 4, dt);
    const drain = s.level > 0.06 ? (s.cons ? 0.07 : 0.012) : 0;
    s.level = clamp(s.level + (s.pump * 0.09 - drain) * dt, 0.05, 1);
    const A = s.level >= 0.8 ? 1 : s.level < 0.76 ? 0 : v.A;
    const B = s.fault ? 0 : s.level >= 0.9 ? 1 : s.level < 0.84 ? 0 : v.B;
    if (A !== v.A || B !== v.B) { v.A = A; v.B = B; sc.update(); }
    const over = s.level > 0.995 && s.pump > 0.2;
    if (over !== s.over) { s.over = over; sc.status(); if (over) sfx.alarm(); }
    const ys = 247 - 204 * s.level, amp = 1 + s.pump * 2 + (s.cons ? 0.6 : 0);
    let top = "";
    for (let x = 183; x <= 327; x += 8) top += `${x === 183 ? "M" : "L"}${x} ${f1(ys + Math.sin(x * 0.09 + s.t * 3.2) * amp + Math.sin(x * 0.05 - s.t * 2) * amp * 0.5)}`;
    s.water.setAttribute("d", top + "L327 250H183Z");
    s.surf.setAttribute("d", top);
    s.stream.setAttribute("d", `M222 54V${f1(ys)}`);
    s.stream.style.opacity = f1(s.pump);
    s.stream.style.strokeWidth = f1(1 + s.pump * 3);
    s.stream.style.strokeDashoffset = f1(-(s.t * 120) % 140);
    s.spill.style.opacity = s.over ? 1 : 0;
    s.spill.style.strokeDashoffset = f1(-(s.t * 90) % 140);
    s.pud.setAttribute("rx", f1(approach(+s.pud.getAttribute("rx"), s.over ? 60 : 0, s.over ? 0.3 : 0.5, dt)));
    s.lvl.textContent = Math.round(s.level * 100) + " %";
    s.handle = approach(s.handle, s.cons ? 90 : 0, 6, dt);
    s.handleEl.setAttribute("transform", `rotate(${f1(s.handle)} 400 236)`);
    s.fin.tick(dt, s.pump > 0.15 ? 1 : 0, 55);
    s.fout.tick(dt, s.pump > 0.15 ? 1 : 0, 70);
    s.fdrain.tick(dt, s.cons && s.level > 0.07 ? 1 : 0, 50);
    sc.level = s.pump;
  }
};

/* ================= NOR + XOR · climatización invierno/verano ================= */
SIMS.nor = {
  scene() {
    let snow = "";
    for (let i = 0; i < 14; i++) snow += `<circle class="flake" r="${(1 + Math.random() * 1.4).toFixed(1)}"/>`;
    return `<svg class="scene m-clima" viewBox="0 0 480 300" role="img" aria-label="Habitación con ventana, puerta, climatizador y selector de estación">
    <defs><clipPath id="clWin"><rect x="46" y="84" width="100" height="80"/></clipPath><clipPath id="clDoor"><rect x="372" y="152" width="56" height="118"/></clipPath></defs>
    <rect class="room" x="14" y="14" width="452" height="258" rx="8"/>
    <path class="edge" d="M14 272H466"/>
    <g clip-path="url(#clWin)"><rect class="outside" x="46" y="84" width="100" height="80"/><circle class="o-sun" cx="118" cy="104" r="11"/><g id="cl-snow">${snow}</g></g>
    <g clip-path="url(#clDoor)"><rect class="outside" x="372" y="152" width="56" height="118"/></g>
    <rect class="frame" x="43" y="81" width="106" height="86"/>
    <g class="pane-l"><rect class="pane" x="46" y="84" width="50" height="80"/></g>
    <g class="pane-r"><rect class="pane" x="96" y="84" width="50" height="80"/></g>
    <rect class="steel" x="38" y="166" width="116" height="7" rx="2"/>
    <text class="lbl" x="96" y="188" text-anchor="middle">VENTANA · A</text>
    <rect class="frame" x="369" y="149" width="62" height="123"/>
    <g class="leaf"><rect class="door" x="372" y="152" width="56" height="118"/><circle class="knob" cx="380" cy="214" r="2.6"/></g>
    <text class="lbl" x="400" y="140" text-anchor="middle">PUERTA · B</text>
    <text class="lbl" x="240" y="28" text-anchor="middle">CLIMATIZADOR / EXTRACTOR · Y</text>
    <rect class="ac" x="178" y="36" width="124" height="40" rx="9"/>
    <path class="vent" d="M190 48H290M190 55H290"/><path class="louver" d="M188 68H292"/>
    <circle class="ac-led" cx="290" cy="46" r="3"/>
    <path class="air" id="cl-h1" d="M200 80C194 120 170 150 150 196"/><path class="air" id="cl-h2" d="M240 80V204"/><path class="air" id="cl-h3" d="M280 80C286 120 310 150 330 196"/>
    <path class="air" id="cl-e1" d="M160 200C176 150 196 118 206 80"/><path class="air" id="cl-e2" d="M320 200C304 150 284 118 274 80"/>
    <rect class="metal" x="196" y="206" width="88" height="54" rx="9"/>
    <text class="lbl" x="240" y="222" text-anchor="middle">MODO · C</text>
    <g class="ico-snow" transform="translate(216 242)"><path d="M0 -9V9M-7.8 -4.5L7.8 4.5M-7.8 4.5L7.8 -4.5"/></g>
    <g class="ico-sun" transform="translate(264 242)"><circle r="5"/><path d="M0 -10V-7.5M0 7.5V10M-10 0H-7.5M7.5 0H10M-7 -7L-5.3 -5.3M5.3 5.3L7 7M-7 7L-5.3 5.3M5.3 -5.3L7 -7"/></g>
    <text class="read" id="cl-mode" x="26" y="46">INVIERNO</text>
  </svg>`;
  },
  scenarios: [["Invierno, todo cerrado", [0, 0, 0]], ["Invierno, ventana abierta", [1, 0, 0]], ["Verano, puerta abierta", [0, 1, 1]]],
  mount(sc) {
    const s = sc.scene;
    sc.st = { t: 0, flakes: $$("#cl-snow circle", s).map(c => ({ c, x: 46 + Math.random() * 100, y: 84 + Math.random() * 80, v: 10 + Math.random() * 14 })),
      mode: $("#cl-mode", s), heat: ["cl-h1", "cl-h2", "cl-h3"].map(id => Flow(s, id, 5, 2.4)), ext: ["cl-e1", "cl-e2"].map(id => Flow(s, id, 5, 2.4)) };
    $$(".flowdots", s).forEach((g, i) => g.classList.add(i < 3 ? "heat" : "ext"));
  },
  update(sc, b) { sc.st.mode.textContent = b[2] ? "VERANO" : "INVIERNO"; sc.scene.dataset.c = b[2]; },
  status(sc, [a, b, c], y) {
    const open = a || b;
    if (!c) return open ? ["bad", "Invierno con abertura: (A + B)′ = 0 ⊕ 0 → no arranca"] : ["ok", "Invierno y todo cerrado: (A + B)′ = 1 ⊕ 0 → calefacción ON"];
    return open ? ["ok", "Verano con abertura: (A + B)′ = 0 ⊕ 1 → extracción ON"] : ["idle", "Verano y cerrado: (A + B)′ = 1 ⊕ 1 = 0 → equipo OFF"];
  },
  tick(sc, dt) {
    const s = sc.st, c = sc.vals.C, on = sc.y;
    s.heat.forEach(f => f.tick(dt, on && !c ? 1 : 0, 60));
    s.ext.forEach(f => f.tick(dt, on && c ? 1 : 0, 60));
    s.flakes.forEach(f => {
      f.y += f.v * dt;
      if (f.y > 166) { f.y = 82; f.x = 46 + Math.random() * 100; }
      f.c.setAttribute("cx", f1(f.x + Math.sin(f.y * 0.1) * 3)); f.c.setAttribute("cy", f1(f.y));
    });
    sc.level = on ? 0.6 : 0;
  }
};

/* ================= XOR · interruptor de escalera ================= */
SIMS.xor = {
  scene() {
    let st = "M40 272H70";
    for (let k = 0; k < 8; k++) st += `V${272 - 19 * (k + 1)}H${70 + 40 * (k + 1)}`;
    return `<svg class="scene m-xor m-esc" viewBox="0 0 480 300" role="img" aria-label="Escalera entre dos pisos con un foco y dos conmutadores de tres vías">
    <path class="cone" d="M226 45L70 272H420L254 45Z"/>
    <ellipse class="spot" cx="240" cy="270" rx="170" ry="9"/>
    <path class="stair" d="${st}H470V132H400L90 272Z"/>
    <path class="step-l" d="${st}H470"/>
    <path class="edge" d="M6 272H474"/>
    <text class="lbl dim" x="20" y="264">PISO 1</text><text class="lbl dim" x="460" y="112" text-anchor="end">PISO 2</text>
    <g class="wsw ws0"><rect class="swp" x="24" y="200" width="20" height="30" rx="3"/><rect class="tog" x="31" y="206" width="6" height="9" rx="1.5"/></g>
    <g class="wsw ws1"><rect class="swp" x="440" y="62" width="20" height="30" rx="3"/><rect class="tog" x="447" y="68" width="6" height="9" rx="1.5"/></g>
    <path class="conduit dash" d="M34 200V92H100V64M450 62V92H380V64"/>
    <path class="x x-l" d="M20 60H100"/><text class="lbl" x="22" y="52">L</text>
    <path class="x x-t1" d="M140 46C220 46 260 74 340 74"/>
    <path class="x x-t2" d="M140 74C220 74 260 46 340 46"/>
    <path class="x x-out" d="M380 60H420V26H258"/>
    <path class="x" d="M240 12V24"/>
    <path class="lev lev1 l1u" d="M100 60L140 46"/><path class="lev lev1 l1d" d="M100 60L140 74"/>
    <path class="lev lev2 l2u" d="M380 60L340 46"/><path class="lev lev2 l2d" d="M380 60L340 74"/>
    <circle class="term" cx="100" cy="60" r="4.5"/><circle class="term" cx="140" cy="46" r="4.5"/><circle class="term" cx="140" cy="74" r="4.5"/>
    <circle class="term" cx="380" cy="60" r="4.5"/><circle class="term" cx="340" cy="46" r="4.5"/><circle class="term" cx="340" cy="74" r="4.5"/>
    <text class="lbl" x="120" y="98" text-anchor="middle">A · PISO 1</text><text class="lbl" x="360" y="98" text-anchor="middle">B · PISO 2</text>
    <path class="bell" d="M220 42Q222 22 240 22Q258 22 260 42Z"/>
    <ellipse class="bulb" cx="240" cy="43" rx="17" ry="4.5"/>
  </svg>`;
  },
  scenarios: [["Sube y enciende abajo", sc => sc.toggle("A")], ["Llega arriba y apaga", sc => sc.toggle("B")], ["Apagar todo", [0, 0]]],
  status(sc, b, y) {
    return y ? ["ok", "A ≠ B → A ⊕ B = 1 · la corriente cruza por un viajero"] : ["idle", "A = B → A ⊕ B = 0 · los viajeros no conectan"];
  },
  tick(sc) { sc.level = 0; }
};

/* ================= XNOR + NOR · alarma de discrepancia ================= */
SIMS.xnor = {
  scene() {
    return `<svg class="scene m-disc" viewBox="0 0 480 300" role="img" aria-label="Tanque con sensor principal y de respaldo, comparador, alarma y botón de reset">
    <defs><clipPath id="dcClip"><rect x="27" y="43" width="124" height="204" rx="7"/></clipPath></defs>
    <ellipse class="shadow" cx="240" cy="282" rx="215" ry="8"/>
    <path class="edge" d="M6 276H474"/>
    <rect class="tank" x="24" y="40" width="130" height="210" rx="10"/>
    <g clip-path="url(#dcClip)"><rect id="dc-water" x="27" y="43" width="124" height="204" fill="url(#gWater)" style="transform-box:fill-box;transform-origin:bottom"/></g>
    <path class="hi-line" d="M20 96H158"/><text class="lbl dim" x="89" y="128" text-anchor="middle">ALTO NIVEL</text>
    <path class="sig s0" d="M60 22V8H184V112H196"/><path class="sig s1" d="M118 22V16H172V142H196"/>
    <rect class="steel" x="50" y="22" width="20" height="18" rx="3"/><path class="rod" d="M60 40V92"/><circle class="tip t0" cx="60" cy="96" r="5"/>
    <rect class="steel" x="108" y="22" width="20" height="18" rx="3"/><path class="rod" d="M118 40V92"/><circle class="tip t1" cx="118" cy="96" r="5"/>
    <text class="lbl" x="40" y="18" text-anchor="end">A</text><text class="lbl" x="98" y="18" text-anchor="end">B</text>
    <text class="lbl dim" x="60" y="268" text-anchor="middle">PRINCIPAL</text><text class="lbl dim" x="118" y="268" text-anchor="middle">RESPALDO</text>
    <rect class="metal" x="196" y="92" width="94" height="68" rx="8"/>
    <text class="lbl" x="243" y="84" text-anchor="middle">COMPARADOR</text>
    <text class="big-read cmp" id="dc-cmp" x="243" y="136" text-anchor="middle">=</text>
    <text class="lbl dim" x="243" y="153" text-anchor="middle">A ⊙ B</text>
    <path class="sig sx" d="M290 126H316"/>
    <rect class="metal" x="316" y="104" width="52" height="44" rx="7"/><text class="lbl" x="342" y="130" text-anchor="middle">NOR</text>
    <path class="sig sc" d="M342 196V148"/>
    <path class="sig sy" d="M368 126H430V100"/>
    <g class="beams"><path d="M430 72L476 52V92Z"/><path d="M430 72L384 52V92Z"/></g>
    <rect class="steel" x="412" y="88" width="36" height="12" rx="2"/>
    ${lamp(430, 74, 14, "red", "dc-bea")}
    <text class="lbl" x="430" y="122" text-anchor="middle">ALARMA · Y</text>
    <rect class="yel" x="322" y="214" width="40" height="30" rx="4"/><rect class="steel" x="338" y="244" width="8" height="32"/>
    <g class="rst"><rect class="rst-s" x="334" y="202" width="16" height="12"/><ellipse class="rst-h" cx="342" cy="202" rx="18" ry="7"/></g>
    <text class="lbl" x="400" y="232">RESET · C</text>
    <text class="read" id="dc-read" x="243" y="190" text-anchor="middle">LECTURAS OK</text>
  </svg>`;
  },
  scenarios: [["Lecturas coinciden", [1, 1, 0]], ["Falla del respaldo", [1, 0, 0]], ["Silenciar con reset", [1, 0, 1]]],
  mount(sc) { const s = sc.scene; sc.st = { t: 0, lvl: 0.5, water: $("#dc-water", s), bea: $("#dc-bea", s), cmp: $("#dc-cmp", s), read: $("#dc-read", s) }; },
  update(sc, [a, b, c], y, first, prev) {
    const eq = a === b;
    sc.st.cmp.textContent = eq ? "=" : "≠";
    sc.scene.dataset.eq = eq ? 1 : 0;
    sc.st.read.textContent = eq ? "LECTURAS OK" : c ? "DISCREPANCIA · SILENCIADA" : "DISCREPANCIA";
    if (y && !prev && !first) { sfx.alarm(); sc.st.t = 0; }
  },
  status(sc, [a, b, c], y) {
    if (y) return ["bad", "A ≠ B → A ⊙ B = 0 y C = 0 → la alarma suena"];
    if (a !== b) return ["warn", "A ≠ B, pero C = 1 → el reset silencia la alarma"];
    return ["ok", `A = B → A ⊙ B = 1 → ((A ⊙ B) + C)′ = 0`];
  },
  tick(sc, dt) {
    const s = sc.st, v = sc.vals;
    s.t += dt;
    const target = v.A && v.B ? 0.8 : !v.A && !v.B ? 0.5 : s.lvl;
    s.lvl = approach(s.lvl, target, 1.2, dt);
    s.water.style.transform = `scaleY(${s.lvl.toFixed(3)})`;
    s.bea.classList.toggle("on", !!sc.y && Math.floor(s.t * 4) % 2 === 0);
    sc.scene.style.setProperty("--rot", f1((s.t * 360) % 360) + "deg");
    if (sc.y && s.t > 1.2) { s.t = 0.001; sfx.alarm(); }
    sc.level = 0;
  }
};
