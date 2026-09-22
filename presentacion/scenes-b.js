"use strict";
/* ================= NAND · dos bombas en paralelo ================= */
SIMS.nand = {
  scene() {
    const pump = (X, k) => {
      const vx = X - 40;
      return `
      <path class="pipe" d="M${vx} 180V76"/><path class="pipe-in" id="nand-r${k}" d="M${vx} 180V76"/>
      <path class="valve-b" d="M${vx - 10} 118H${vx + 10}L${vx - 10} 140H${vx + 10}Z"/>
      <path class="pipe" d="M${vx - 34} 282V206H${vx - 24}"/><path class="pipe-in" d="M${vx - 34} 282V206H${vx - 24}"/>
      <rect class="steel" x="${X - 74}" y="236" width="148" height="8" rx="2"/>
      <circle class="metal" cx="${vx}" cy="206" r="27"/>${impeller(vx, 206, 20, 6, "nand-imp" + k)}
      <rect class="steel" x="${vx - 7}" y="172" width="14" height="10" rx="2"/>
      <rect class="steel" x="${X - 14}" y="200" width="12" height="12" rx="2"/>
      <rect class="metal mot${k}" x="${X - 4}" y="186" width="72" height="42" rx="7"/>${fins(X + 4, X + 60, 6, 191, 223)}
      <text class="lbl" x="${X + 32}" y="258" text-anchor="middle">BOMBA ${k}</text>
      <g class="warn warn${k}" transform="translate(${X + 32} 160)"><path class="tri" d="M0 -15L15 11H-15Z"/><path class="tri-x" d="M0 -6V2M0 6.5V7"/></g>`;
    };
    return `<svg class="scene m-nand" viewBox="0 0 480 300" role="img" aria-label="Dos bombas centrífugas en paralelo con cabezal de descarga, caudal y luz de disponible">
    <ellipse class="shadow" cx="240" cy="284" rx="220" ry="8"/>
    <rect class="metal" x="14" y="12" width="170" height="42" rx="9"/>
    ${lamp(40, 33, 10, "green", "nand-l")}<text class="lbl" x="60" y="37" style="font-size:10px;fill:#EEF3F8">DISPONIBLE</text>
    <text class="lbl" x="466" y="26" text-anchor="end">CAUDAL A PLANTA</text>
    <text class="read" id="nand-q" x="466" y="44" text-anchor="end">100 %</text>
    <rect class="bar-bg" x="330" y="50" width="136" height="5" rx="2.5"/><rect class="bar" id="nand-bar" x="330" y="50" width="136" height="5" rx="2.5"/>
    <path class="pipe" d="M90 76H474"/><path class="pipe-in" id="nand-h" d="M90 76H474"/>
    <path class="pipe" d="M8 282H300"/><path class="pipe-in" d="M8 282H300"/>
    ${pump(130, 1)}${pump(350, 2)}
  </svg>`;
  },
  scenarios: [["Ambas operan", [0, 0]], ["Falla bomba 1", [1, 0]], ["Falla total", [1, 1]]],
  mount(sc) {
    const s = sc.scene;
    sc.st = { s1: 1, s2: 1, i1: Rot(s, "nand-imp1", 90, 206), i2: Rot(s, "nand-imp2", 310, 206),
      r1: Flow(s, "nand-r1", 5), r2: Flow(s, "nand-r2", 5), h: Flow(s, "nand-h", 14), q: $("#nand-q", s), bar: $("#nand-bar", s), lamp: $("#nand-l", s) };
  },
  update(sc, b, y) { sc.st.lamp.classList.toggle("on", !!y); },
  status(sc, b, y) {
    const n = b[0] + b[1];
    if (n === 0) return ["ok", "Sistema disponible", "Operan las dos bombas · F1 · F2 = 0"];
    if (n === 1) return ["warn", "Disponible en respaldo", `Falla en bomba ${b[0] ? 1 : 2}; sigue operando la bomba ${b[0] ? 2 : 1}`];
    return ["bad", "Sistema no disponible", "F1 · F2 = 1 → la salida NAND cae a 0"];
  },
  tick(sc, dt) {
    const s = sc.st, v = sc.vals;
    s.s1 = approach(s.s1, v.F1 ? 0 : 1, v.F1 ? 0.7 : 1.2, dt);
    s.s2 = approach(s.s2, v.F2 ? 0 : 1, v.F2 ? 0.7 : 1.2, dt);
    spin(s.i1, s.s1 * 4, dt); spin(s.i2, s.s2 * 4, dt);
    s.r1.tick(dt, s.s1 > 0.15 ? 1 : 0, 60 * s.s1 + 5);
    s.r2.tick(dt, s.s2 > 0.15 ? 1 : 0, 60 * s.s2 + 5);
    const q = (s.s1 + s.s2) / 2;
    s.h.tick(dt, q > 0.08 ? 1 : 0, 30 + 60 * q);
    s.q.textContent = Math.round(q * 100) + " %";
    s.bar.style.transform = `scaleX(${q.toFixed(3)})`;
    sc.level = q;
  }
};

/* ================= NOR · tablero de planta de tratamiento ================= */
SIMS.nor = {
  scene() {
    let ticks = "";
    for (let k = 0; k <= 8; k++) {
      const a = (-120 + k * 30) * Math.PI / 180;
      ticks += `M${f1(Math.sin(a) * 19)} ${f1(-Math.cos(a) * 19)}L${f1(Math.sin(a) * 23)} ${f1(-Math.cos(a) * 23)}`;
    }
    const ann = (x, i, l1, l2) => `<g class="ann" id="nor-ann${i}" data-st="off"><rect class="ann-b" x="${x}" y="152" width="128" height="58" rx="6"/><text class="ann-t" x="${x + 64}" y="177">${l1}</text><text class="ann-t" x="${x + 64}" y="193">${l2}</text></g>`;
    return `<svg class="scene m-nor" viewBox="0 0 480 300" role="img" aria-label="Tablero de planta de tratamiento con mímico, anunciador de alarmas y luz de listo">
    <rect class="panel-b" x="12" y="8" width="456" height="284" rx="14"/>
    <circle cx="26" cy="22" r="2.5" fill="#2B3C4D"/><circle cx="454" cy="22" r="2.5" fill="#2B3C4D"/><circle cx="26" cy="278" r="2.5" fill="#2B3C4D"/><circle cx="454" cy="278" r="2.5" fill="#2B3C4D"/>
    <text class="lbl" x="34" y="32">PTAR · TABLERO PRINCIPAL</text>
    <text class="lbl dim" x="446" y="32" text-anchor="end" id="nor-ack">SIN ALARMAS</text>
    <path class="pipe" d="M160 96H470"/><path class="pipe-in" id="nor-p" d="M160 96H470"/>
    <rect class="metal" x="34" y="48" width="126" height="80" rx="6"/>
    <defs><clipPath id="norClip"><rect x="38" y="52" width="118" height="72" rx="3"/></clipPath></defs>
    <g clip-path="url(#norClip)"><rect id="nor-water" x="38" y="52" width="118" height="72" fill="url(#gWater)" style="transform-box:fill-box;transform-origin:bottom"/></g>
    <text class="lbl" x="97" y="142" text-anchor="middle">TANQUE</text>
    <circle class="metal mot" cx="240" cy="96" r="24"/>${impeller(240, 96, 18, 6, "nor-imp")}
    <text class="lbl" x="240" y="142" text-anchor="middle">MOTOR</text>
    <g transform="translate(372 96)"><circle class="dial" r="28"/><path class="tick" d="${ticks}"/><path class="zone-r" d="M16.5 -9.5A19 19 0 0 1 16.5 9.5"/><path class="ndl big" id="nor-press" d="M0 0V-20"/><circle r="3" fill="#EEF3F8"/></g>
    <text class="lbl" x="372" y="142" text-anchor="middle">PRESIÓN</text>
    ${ann(34, 0, "NIVEL", "BAJO")}${ann(176, 1, "SOBRE-", "PRESIÓN")}${ann(318, 2, "FALLA", "MOTOR")}
    <rect class="metal" x="34" y="224" width="412" height="52" rx="10"/>
    ${lamp(66, 250, 14, "green", "nor-ready")}
    <text class="ready-t" x="94" y="255">LISTO PARA OPERAR</text>
  </svg>`;
  },
  scenarios: [["Todo normal", [0, 0, 0]], ["Sobrepresión", [0, 1, 0]], ["Falla múltiple", [1, 0, 1]], ["Reconocer", sc => SIMS.nor.action(sc, "ack")]],
  mount(sc) {
    const s = sc.scene;
    sc.st = { lvl: 0.75, pr: -40, m: 1, unack: new Set(), prev: [0, 0, 0], imp: Rot(s, "nor-imp", 240, 96), flow: Flow(s, "nor-p", 10),
      water: $("#nor-water", s), press: $("#nor-press", s), ready: $("#nor-ready", s), ack: $("#nor-ack", s), anns: [0, 1, 2].map(i => $("#nor-ann" + i, s)) };
  },
  paint(sc, b) {
    const s = sc.st;
    s.anns.forEach((a, i) => (a.dataset.st = !b[i] ? "off" : s.unack.has(i) ? "flash" : "on"));
    const n = s.unack.size;
    s.ack.textContent = b.some(Boolean) ? (n ? `${n} SIN RECONOCER` : "ALARMAS RECONOCIDAS") : "SIN ALARMAS";
  },
  update(sc, b, y, first) {
    const s = sc.st;
    b.forEach((v, i) => {
      if (v && !s.prev[i]) { s.unack.add(i); if (!first) sfx.alarm(); }
      if (!v) s.unack.delete(i);
    });
    s.prev = [...b];
    s.ready.classList.toggle("on", !!y);
    SIMS.nor.paint(sc, b);
  },
  action(sc, a) { if (a === "ack") { sc.st.unack.clear(); SIMS.nor.paint(sc, sc.bits()); sfx.click(); } },
  status(sc, b, y) {
    if (y) return ["ok", "Listo para operar", "A1 + A2 + A3 = 0 → ninguna alarma activa"];
    const act = sc.def.inputs.filter((_, i) => b[i]).map(i => i[1].toLowerCase());
    return ["bad", "No listo", "Alarma activa: " + act.join(", ")];
  },
  tick(sc, dt) {
    const s = sc.st, v = sc.vals;
    s.lvl = approach(s.lvl, v.A1 ? 0.16 : 0.74, 0.8, dt);
    s.water.style.transform = `scaleY(${s.lvl.toFixed(3)})`;
    s.pr = approach(s.pr, v.A2 ? 95 : -40 + Math.sin(NOW() * 2) * 4, 2, dt);
    s.press.setAttribute("transform", `rotate(${f1(s.pr)})`);
    s.m = approach(s.m, v.A3 ? 0 : 1, 0.9, dt);
    spin(s.imp, s.m * 3.5, dt);
    s.flow.tick(dt, s.m > 0.2 ? 1 : 0, 50 * s.m);
    sc.level = s.m;
  }
};

/* ================= XOR · nave con interruptores de 3 vías ================= */
SIMS.xor = {
  scene() {
    let truss = "";
    const top = x => (x <= 240 ? 112 - (x - 24) / 216 * 72 : 40 + (x - 240) / 216 * 72);
    for (let x = 78, k = 0; x < 456; x += 54, k++) {
      truss += `M${x} 112V${f1(top(x))}`;
      truss += k % 2 ? `M${x - 54} 112L${x} ${f1(top(x))}` : `M${x} ${f1(top(x))}L${x + 54} 112`;
    }
    return `<svg class="scene m-xor" viewBox="0 0 480 300" role="img" aria-label="Nave industrial con lámpara de techo e interruptores conmutados de tres vías en dos accesos">
    <path class="cone" d="M224 144L96 276H384L256 144Z"/>
    <ellipse class="spot" cx="240" cy="276" rx="150" ry="10"/>
    <path class="edge" d="M6 276H474"/>
    <path class="struct" d="M24 276V112L240 40L456 112V276M24 112H456"/>
    <path class="struct thin" d="${truss}"/>
    <rect class="door" x="32" y="200" width="46" height="76"/><rect class="door" x="402" y="200" width="46" height="76"/>
    <text class="lbl" x="55" y="192" text-anchor="middle">ACCESO 1</text><text class="lbl" x="425" y="192" text-anchor="middle">ACCESO 2</text>
    <g><rect class="fork" x="184" y="238" width="62" height="26" rx="4"/><path class="fork" d="M196 238V214H226L234 238"/><rect class="fork-y" x="250" y="206" width="5" height="58"/><path class="fork" d="M255 262H280" style="fill:none"/><circle class="fork" cx="200" cy="266" r="8"/><circle class="fork" cx="234" cy="266" r="8"/></g>
    <path class="x x-l" d="M24 160H100"/><text class="lbl" x="30" y="152">L</text>
    <path class="x x-t1" d="M140 146C220 146 260 174 340 174"/>
    <path class="x x-t2" d="M140 174C220 174 260 146 340 146"/>
    <path class="x x-out" d="M380 160H420V126H258"/>
    <path class="x" d="M240 112V124"/>
    <path class="lev lev1 l1u" d="M100 160L140 146"/><path class="lev lev1 l1d" d="M100 160L140 174"/>
    <path class="lev lev2 l2u" d="M380 160L340 146"/><path class="lev lev2 l2d" d="M380 160L340 174"/>
    <circle class="term" cx="100" cy="160" r="4.5"/><circle class="term" cx="140" cy="146" r="4.5"/><circle class="term" cx="140" cy="174" r="4.5"/>
    <circle class="term" cx="380" cy="160" r="4.5"/><circle class="term" cx="340" cy="146" r="4.5"/><circle class="term" cx="340" cy="174" r="4.5"/>
    <text class="lbl" x="120" y="198" text-anchor="middle">A</text><text class="lbl" x="360" y="198" text-anchor="middle">B</text>
    <path class="bell" d="M220 142Q222 122 240 122Q258 122 260 142Z"/>
    <ellipse class="bulb" cx="240" cy="143" rx="17" ry="4.5"/>
  </svg>`;
  },
  scenarios: [["Entra por acceso 1", sc => sc.toggle("A")], ["Sale por acceso 2", sc => sc.toggle("B")], ["Apagar todo", [0, 0]]],
  status(sc, b, y) {
    return y ? ["ok", "Lámpara encendida", "A ≠ B → A ⊕ B = 1 · la corriente cruza por un viajero"] : ["idle", "Lámpara apagada", "A = B → A ⊕ B = 0 · los viajeros no conectan"];
  },
  tick(sc) { sc.level = 0; }
};
