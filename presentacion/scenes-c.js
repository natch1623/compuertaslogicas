"use strict";
/* ================= XNOR · sincronización de generador ================= */
SIMS.xnor = {
  manual: false,
  scene() {
    let grid = "", ticks = "";
    for (let x = 54; x <= 296; x += 22) grid += `M${x} 24V236`;
    for (let k = 0; k < 12; k++) {
      const a = k * 30 * Math.PI / 180, r1 = k % 3 ? 50 : 46;
      ticks += `M${f1(396 + r1 * Math.sin(a))} ${f1(92 - r1 * Math.cos(a))}L${f1(396 + 56 * Math.sin(a))} ${f1(92 - 56 * Math.cos(a))}`;
    }
    return `<svg class="scene m-xnor" viewBox="0 0 480 300" role="img" aria-label="Osciloscopio con ondas del generador y la red, sincroscopio e interruptor 52G">
    <rect class="crt" x="12" y="12" width="298" height="236" rx="16"/>
    <rect class="scan" x="12" y="12" width="298" height="236" rx="16"/>
    <path class="grid" d="${grid}M54 90H296M54 158H296"/>
    <text class="lbl" x="26" y="58" style="fill:#7DD3FC">G</text><text class="lbl" x="26" y="126" style="fill:#B99AFF">R</text><text class="lbl" x="26" y="194" style="fill:#FFB020">Y</text>
    <path class="tr tr-g" id="xn-g"/><path class="tr tr-r" id="xn-r"/><path class="tr tr-y" id="xn-y"/>
    <path class="cursor" d="M296 24V236"/>
    <circle class="dial" cx="396" cy="92" r="62"/>
    <path class="tick" d="${ticks}"/>
    <path class="okarc" d="M383.5 36.6A56 56 0 0 1 408.5 36.6"/>
    <text class="lbl dim" x="346" y="170" text-anchor="middle">LENTO</text><text class="lbl dim" x="446" y="170" text-anchor="middle">RÁPIDO</text>
    <g transform="translate(396 92)"><path class="ptr" id="xn-ptr" d="M0 10V-50"/><circle r="4.5" fill="#EEF3F8"/></g>
    <text class="lbl" x="396" y="186" text-anchor="middle">SINCROSCOPIO</text>
    <text class="lbl" x="396" y="222" text-anchor="middle">52G</text>
    <path class="bk src" d="M326 244H372"/><path class="blade" d="M372 244H404"/><path class="bk" d="M406 244H466"/>
    <circle cx="372" cy="244" r="3.5" fill="#EEF3F8"/><circle cx="406" cy="244" r="3.5" fill="#EEF3F8"/>
    <text class="lbl dim" x="326" y="264">GEN</text><text class="lbl dim" x="466" y="264" text-anchor="end">RED</text>
    ${lamp(22, 276, 7, "green", "xn-perm")}<text class="lbl" x="36" y="280">PERMISO 25</text>
    <text class="lbl" id="xn-read" x="120" y="280"></text>
  </svg>`;
  },
  controls: () => `<div class="range"><label for="xn-f">Frecuencia del generador</label><input id="xn-f" type="range" min="59.5" max="60.5" step="0.01" value="60.15"><output id="xn-fo" for="xn-f">60.15 Hz</output></div>
    <button class="btn solid" data-act="close" id="xn-btn">Cerrar 52G</button>`,
  scenarios: [["Casi sincronizado", sc => SIMS.xnor.preset(sc, 60.04, -60)], ["Generador rápido", sc => SIMS.xnor.preset(sc, 60.4, 90)], ["Desconectar", sc => SIMS.xnor.open(sc)]],
  mount(sc) {
    const s = sc.scene, sec = sc.sec;
    sc.st = { phi: 60, t: 0, closed: false, msg: null, msgT: 0, f: $("#xn-f", sec), fo: $("#xn-fo", sec), btn: $("#xn-btn", sec),
      g: $("#xn-g", s), r: $("#xn-r", s), yy: $("#xn-y", s), ptr: $("#xn-ptr", s), perm: $("#xn-perm", s), read: $("#xn-read", s) };
    sc.st.f.addEventListener("input", () => (sc.st.fo.textContent = (+sc.st.f.value).toFixed(2) + " Hz"));
  },
  df: sc => +sc.st.f.value - 60,
  norm: p => ((p % 360) + 540) % 360 - 180,
  preset(sc, f, phi) { SIMS.xnor.open(sc); sc.st.f.value = f; sc.st.fo.textContent = f.toFixed(2) + " Hz"; sc.st.phi = phi; },
  open(sc) {
    const s = sc.st;
    s.closed = false; s.f.disabled = false; s.btn.textContent = "Cerrar 52G"; sc.scene.dataset.closed = 0;
  },
  permit(sc) { return Math.abs(SIMS.xnor.norm(sc.st.phi)) <= 12 && Math.abs(SIMS.xnor.df(sc)) <= 0.2; },
  action(sc, a) {
    if (a !== "close") return;
    const s = sc.st;
    if (s.closed) { SIMS.xnor.open(sc); sfx.clack(); return; }
    if (SIMS.xnor.permit(sc)) {
      s.closed = true; s.f.value = 60; s.f.disabled = true; s.fo.textContent = "60.00 Hz"; s.btn.textContent = "Abrir 52G";
      sc.scene.dataset.closed = 1; s.msg = null; sfx.clack(); sfx.ok();
    } else {
      s.msg = "¡Cierre fuera de fase! Golpe mecánico y sobrecorriente"; s.msgT = 2.8; sfx.bad();
      sc.stage.classList.remove("shake"); void sc.stage.offsetWidth; sc.stage.classList.add("shake");
    }
  },
  status(sc) {
    const s = sc.st;
    if (!s) return ["idle", "", ""];
    const ph = SIMS.xnor.norm(s.phi), df = SIMS.xnor.df(sc), coin = Math.round((1 - Math.abs(ph) / 180) * 100);
    if (s.msg) return ["bad", "Cierre rechazado", s.msg];
    if (s.closed) return ["ok", "En paralelo con la red", "G y R coinciden → la XNOR permanece en 1"];
    if (SIMS.xnor.permit(sc)) return ["ok", "Ventana de cierre", `Desfase ${Math.round(ph)}° · coincidencia ${coin} % · ¡cierra ahora!`];
    return ["warn", "Fuera de sincronismo", `Desfase ${Math.round(ph)}° · Δf ${df >= 0 ? "+" : ""}${df.toFixed(2)} Hz · coincidencia ${coin} %`];
  },
  tick(sc, dt) {
    const s = sc.st, F = 0.5, WIN = 4, X0 = 54, X1 = 296;
    s.t += dt;
    const df = SIMS.xnor.df(sc);
    if (s.closed) s.phi *= Math.exp(-4 * dt);
    else s.phi += 360 * df * dt;
    if (s.msgT > 0 && (s.msgT -= dt) <= 0) s.msg = null;
    const phNow = s.phi;
    const sq = (tt, ph) => (Math.sin(2 * Math.PI * F * tt + ph * Math.PI / 180) >= 0 ? 1 : 0);
    const at = x => s.t - (1 - (x - X0) / (X1 - X0)) * WIN;
    const phAt = tt => phNow - 360 * (s.closed ? 0 : df) * (s.t - tt);
    const trace = (fn, hi, lo) => {
      let prev = fn(X0), d = `M${X0} ${prev ? hi : lo}`;
      for (let x = X0 + 2; x <= X1; x += 2) { const v = fn(x); if (v !== prev) { d += `H${x}V${v ? hi : lo}`; prev = v; } }
      return d + `H${X1}`;
    };
    s.g.setAttribute("d", trace(x => sq(at(x), phAt(at(x))), 36, 76));
    s.r.setAttribute("d", trace(x => sq(at(x), 0), 104, 144));
    s.yy.setAttribute("d", trace(x => (sq(at(x), phAt(at(x))) === sq(at(x), 0) ? 1 : 0), 172, 212));
    const ph = SIMS.xnor.norm(phNow);
    s.ptr.setAttribute("transform", `rotate(${f1(ph)})`);
    s.perm.classList.toggle("on", s.closed || SIMS.xnor.permit(sc));
    s.read.textContent = `φ ${Math.round(ph)}°  ·  Δf ${df >= 0 ? "+" : ""}${df.toFixed(2)} Hz`;
    const G = sq(s.t, phNow), R = sq(s.t, 0);
    if (G !== sc.vals.G || R !== sc.vals.R) { sc.vals.G = G; sc.vals.R = R; sc.update(); }
    sc.setStatus(...SIMS.xnor.status(sc));
    sc.level = 0;
  }
};

/* ================= Caso integrador · arranque directo (DOL) ================= */
SIMS.int = {
  scene() {
    let amp = "";
    for (let v = 0; v <= 8; v++) {
      const a = (-135 + v * 33.75) * Math.PI / 180;
      amp += `<path class="tick" d="M${f1(396 + 44 * Math.sin(a))} ${f1(96 - 44 * Math.cos(a))}L${f1(396 + 53 * Math.sin(a))} ${f1(96 - 53 * Math.cos(a))}"/><text class="num" x="${f1(396 + 34 * Math.sin(a))}" y="${f1(99 - 34 * Math.cos(a))}">${v}</text>`;
    }
    return `<svg class="scene m-int" viewBox="0 0 480 300" data-m="0" data-t="0" role="img" aria-label="Circuito de potencia: barras trifásicas, contactor KM, relé térmico, motor, amperímetro y barras de velocidad y temperatura">
    <ellipse class="shadow" cx="185" cy="290" rx="130" ry="7"/>
    <text class="lbl" x="16" y="14">L1 · L2 · L3 · 60 Hz</text>
    <path class="bus" d="M16 24H300M16 38H300M16 52H300"/><path class="bus-flow" id="int-bus" d="M16 24H300M16 38H300M16 52H300"/>
    <circle cx="150" cy="24" r="3" fill="#FFB020"/><circle cx="170" cy="38" r="3" fill="#FFB020"/><circle cx="190" cy="52" r="3" fill="#FFB020"/>
    <path class="live" d="M150 24V80M170 38V80M190 52V80"/>
    <rect class="metal" x="126" y="72" width="88" height="56" rx="6"/>
    <path class="pole-f" d="M150 80V90M170 80V90M190 80V90M150 108V128M170 108V128M190 108V128"/>
    <g class="km-mov"><path d="M150 90V108M170 90V108M190 90V108"/><rect class="armature" x="140" y="96" width="60" height="5" rx="2"/></g>
    <text class="lbl" x="222" y="96">KM</text><text class="lbl dim" x="222" y="108">contactor</text>
    <path class="cab" d="M150 128V140M170 128V140M190 128V140"/>
    <rect class="metal" x="126" y="140" width="88" height="44" rx="6"/>
    <path class="pole-f" d="M150 140V150M170 140V150M190 140V150M150 176V184M170 176V184M190 176V184"/>
    <rect class="trip" x="136" y="153" width="18" height="8" rx="2"/><text class="lbl dim" x="160" y="161">I&gt;</text>
    <rect class="bar-bg" x="136" y="166" width="68" height="6" rx="3"/><rect class="heat" id="int-heat" x="136" y="166" width="68" height="6" rx="3"/>
    <text class="lbl" x="222" y="160">F</text><text class="lbl dim" x="222" y="172">térmico</text>
    <path class="cab" id="int-cab" d="M150 184V198L166 208M170 184V208M190 184V198L174 208"/>
    <path class="cab-flow" id="int-cabf" d="M150 128V198L166 208M170 128V208M190 128V198L174 208"/>
    <rect class="steel" x="154" y="206" width="32" height="14" rx="3"/>
    <rect class="steel" x="112" y="278" width="30" height="8" rx="1"/><rect class="steel" x="202" y="278" width="30" height="8" rx="1"/>
    <rect class="steel" x="72" y="226" width="20" height="48" rx="7"/>
    <rect class="metal" x="90" y="218" width="160" height="62" rx="12"/>${fins(100, 242, 7, 224, 274)}
    <rect class="steel" x="250" y="244" width="30" height="10" rx="2"/>
    ${wheel(296, 249, 22, 4, "int-rot")}
    <text class="lbl" x="170" y="252" text-anchor="middle" style="fill:#EEF3F8">M 3~ · 7.5 kW</text>
    <circle class="dial" cx="396" cy="96" r="60"/>${amp}
    <path class="amp-red" d="M442.2 76.9A50 50 0 0 1 431.4 131.4"/>
    <text class="lbl dim" x="396" y="126" text-anchor="middle">× In</text>
    <g transform="translate(396 96)"><path class="ndl big" id="int-amp" d="M0 8V-46"/><circle r="4.5" fill="#EEF3F8"/></g>
    <text class="read" id="int-I" x="396" y="176" text-anchor="middle">0.0 × In</text>
    <text class="lbl" x="330" y="200">VELOCIDAD</text><text class="lbl" id="int-sv" x="462" y="200" text-anchor="end">0 %</text>
    <rect class="bar-bg" x="330" y="205" width="132" height="6" rx="3"/><rect class="bar" id="int-spd" x="330" y="205" width="132" height="6" rx="3" style="fill:#34E39A"/>
    <text class="lbl" x="330" y="228">TÉRMICO</text><text class="lbl" id="int-hv" x="462" y="228" text-anchor="end">0 %</text>
    <rect class="bar-bg" x="330" y="233" width="132" height="6" rx="3"/><rect class="heat" id="int-th" x="330" y="233" width="132" height="6" rx="3"/>
    ${lamp(340, 266, 8, "green", "int-lrun")}<text class="lbl" x="354" y="270">MARCHA</text>
    ${lamp(410, 266, 8, "amber", "int-ltrip")}<text class="lbl" x="424" y="270">DISPARO</text>
  </svg>`;
  },
  mount(sc) {
    const s = sc.scene;
    sc.st = { w: 0, I: 0, h: 0, load: 0.8, t: 0, rot: Rot(s, "int-rot", 296, 249),
      heat: $("#int-heat", s), th: $("#int-th", s), hv: $("#int-hv", s), spd: $("#int-spd", s), sv: $("#int-sv", s), amp: $("#int-amp", s), Iel: $("#int-I", s),
      bus: $("#int-bus", s), cabf: $("#int-cabf", s), lrun: $("#int-lrun", s), ltrip: $("#int-ltrip", s) };
  },
  status(sc) {
    const s = sc.st, v = sc.vals;
    if (v.T) return ["bad", "Disparo térmico", s.h > 0.55 ? `Contacto F (NC) abierto · bimetal al ${Math.round(s.h * 100)} %, espera a que enfríe` : "Ya enfrió: pulsa «Rearmar térmico»"];
    if (!v.M) return ["idle", "Motor detenido", "Mantén y suelta START: la autorretención lo mantiene en marcha"];
    if (s.I > 1.6) return ["warn", "Arrancando", `Corriente de arranque ${s.I.toFixed(1)} × In (arranque directo)`];
    if (s.load > 1.05) return ["warn", "Sobrecarga", `Carga ${Math.round(s.load * 100)} % · el bimetal se calienta (${Math.round(s.h * 100)} %)`];
    return ["ok", "En marcha", "Autorretención activa por el contacto auxiliar KM"];
  },
  tick(sc, dt) {
    const s = sc.st, v = sc.vals;
    s.t += dt;
    const target = v.M ? 1 - 0.03 * s.load : 0;
    s.w = approach(s.w, target, v.M ? 0.9 : 0.35, dt);
    const I = v.M ? Math.max(s.load * 0.9 + 0.1, 6.5 * (1 - s.w / Math.max(target, 0.01))) : 0;
    s.I = approach(s.I, I, 8, dt);
    const Ie = Math.min(s.I, 1.6);
    if (s.I > 1.05) s.h = Math.min(1, s.h + 0.12 * (Ie * Ie - 1.1) * dt);
    else s.h = Math.max(0, s.h - 0.05 * dt);
    if (s.h >= 1 && !v.T) { v.T = 1; sfx.clack(); sfx.alarm(); sc.update(); }
    spin(s.rot, s.w * 4, dt);
    s.amp.setAttribute("transform", `rotate(${f1(-135 + clamp(s.I, 0, 8) * 33.75)})`);
    s.Iel.textContent = s.I.toFixed(1) + " × In";
    s.spd.style.transform = `scaleX(${s.w.toFixed(3)})`; s.sv.textContent = Math.round(s.w * 100) + " %";
    const hs = `scaleX(${s.h.toFixed(3)})`;
    s.heat.style.transform = hs; s.th.style.transform = hs; s.hv.textContent = Math.round(s.h * 100) + " %";
    s.bus.style.strokeDashoffset = f1(-(s.t * 40) % 160);
    s.cabf.style.opacity = f1(clamp(s.I / 2, 0, 1));
    s.cabf.style.strokeDashoffset = f1(-(s.t * (20 + s.I * 18)) % 140);
    s.lrun.classList.toggle("on", !!v.M);
    s.ltrip.classList.toggle("on", !!v.T && Math.floor(s.t * 2) % 2 === 0);
    sc.setStatus(...SIMS.int.status(sc));
    sc.level = s.w;
  }
};
