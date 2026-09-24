"use strict";
/* Los siete casos de la actividad. Cada uno con su aplicación, entradas, función,
   tabla de verdad (con el estado de cada fila), notas y escena simulada. */
const GATES = [
  { id: "and", name: "AND", plus: "OR", stages: ["and", "or"], color: "var(--c-and)", title: "Prensa industrial con bypass",
    lead: "La prensa solo baja con las dos manos fuera de la zona de peligro; el pedal de bypass permite operarla en mantenimiento.",
    expr: "Y = (A · B) + C", out: "Y", coil: "Motor", read: "A y B en serie, en paralelo con C", role: "AND protege al operador; OR habilita el bypass",
    positive: "1 = pulsador o pedal presionado / motor encendido",
    fn: ([a, b, c]) => (a && b) || c,
    inputs: [["A", "Mano izquierda", "pulsador A"], ["B", "Mano derecha", "pulsador B"], ["C", "Pedal de bypass", "técnico · C"]],
    estados: ["Seguro, apagado", "Bypass, motor ON", "Inseguro, apagado", "Bypass, motor ON", "Inseguro, apagado", "Bypass, motor ON", "Seguro, motor ON", "Ambos, motor ON"],
    tree: { t: "p", c: [{ t: "s", c: [{ t: "no", v: "A" }, { t: "no", v: "B" }] }, { t: "no", v: "C" }] },
    sumCond: "Ambas manos ocupadas, o pedal de bypass", sumApp: "Prensa industrial con bypass",
    others: [["Norma ISO 13851", "Los mandos bimanuales exigen además que ambos pulsadores se accionen casi simultáneamente; eso se agrega con un temporizador."],
             ["Referencias", "Floyd (2016), cap. 3; Tocci, Widmer y Moss (2007), cap. 3."]],
    notes: "La compuerta AND implementa el mando bimanual: basta que una mano suelte su pulsador para que Y = 0. En la práctica, las normas de mandos bimanuales (ISO 13851) exigen además que ambos pulsadores se accionen casi simultáneamente, lo que se agrega con un temporizador. Demostración: «Operación bimanual» y luego «Una mano libre»; el ariete sube y la prensa se detiene. Referencia: Floyd (2016), cap. 3; Tocci, Widmer y Moss (2007), cap. 3." },

  { id: "or", name: "OR", plus: "AND", stages: ["or", "and"], color: "var(--c-or)", title: "Alarma de intrusión con armado",
    lead: "La sirena suena si se vulnera puerta o ventana, pero solo cuando el usuario dejó el sistema armado.",
    expr: "Y = (A + B) · C", out: "Y", coil: "Sirena", read: "A y B en paralelo, en serie con C", role: "OR agrupa los accesos; AND exige el armado",
    positive: "1 = acceso vulnerado / llave activada / sirena encendida",
    fn: ([a, b, c]) => (a || b) && c,
    inputs: [["A", "Sensor de puerta", "contacto magnético"], ["B", "Sensor de ventana", "contacto magnético"], ["C", "Llave de armado", "armado · C"]],
    estados: ["Desarmado, OK", "Armado, OK", "Desarmado, abierto", "Armado, alarma ON", "Desarmado, abierto", "Armado, alarma ON", "Desarmado, abierto", "Armado, alarma ON"],
    tree: { t: "s", c: [{ t: "p", c: [{ t: "no", v: "A" }, { t: "no", v: "B" }] }, { t: "no", v: "C" }] },
    sumCond: "Puerta o ventana abierta con sistema armado", sumApp: "Alarma de intrusión",
    others: [["Varias zonas", "La OR agrupa las condiciones de disparo: cualquier sensor activo produce la alerta. Es la estructura típica de una alarma con múltiples zonas."],
             ["Referencias", "Floyd (2016), cap. 3; Mano y Ciletti (2013), cap. 2."]],
    notes: "La OR agrupa varias condiciones de disparo: cualquier sensor activo produce la alerta. Es la estructura típica de un sistema de alarma con múltiples zonas. Muestra primero «Ventana abierta, desarmado»: no suena, porque falta C. Luego gira la llave. Referencia: Floyd (2016), cap. 3; Mano y Ciletti (2013), cap. 2." },

  { id: "not", name: "NOT", stages: null, color: "var(--c-not)", title: "Iluminación automática nocturna",
    lead: "Las luces exteriores se encienden solas al oscurecer y se apagan de día, ahorrando energía.",
    expr: "Y = A′", out: "Y", coil: "Lámpara", lamp: true, read: "contacto NC", role: "La salida es el complemento de la entrada",
    positive: "Entrada 1 = hay luz solar · Salida 1 = lámpara encendida",
    fn: ([a]) => !a,
    inputs: [["A", "Sensor de luz (LDR)", "automático"]],
    estados: ["Lámpara ON", "Lámpara OFF"], rowLabels: ["0 (noche)", "1 (día)"],
    tree: { t: "s", c: [{ t: "nc", v: "A", label: "LDR" }] },
    sumCond: "A vale 0", sumApp: "Iluminación automática nocturna",
    others: [["Disparador Schmitt", "El LDR forma un divisor de tensión; un disparador Schmitt (histéresis) evita que la lámpara parpadee al atardecer."],
             ["Referencias", "Tocci, Widmer y Moss (2007), cap. 3; Kleitz (2009)."]],
    notes: "El inversor convierte «hay luz» en «apagar lámpara». Ojo con la interpretación de 0 y 1: en la entrada, 1 significa presencia de luz; en la salida, 1 significa lámpara encendida. En un circuito real, el LDR forma un divisor de tensión y se usa un disparador Schmitt para evitar parpadeo al atardecer: en la escena, la franja entre 30 y 60 lux es esa histéresis. Activa el ciclo automático o mueve la hora. Referencia: Tocci, Widmer y Moss (2007), cap. 3; Kleitz (2009)." },

  { id: "nand", name: "NAND", plus: "AND", stages: ["nand", "and"], color: "var(--c-nand)", title: "Llenado de tanque con panel",
    lead: "Los sensores cortan la bomba si el agua llega al límite; además la bomba solo opera con el panel manual encendido.",
    expr: "Y = (A · B)′ · C", out: "Y", coil: "Bomba", read: "A y B NC en paralelo, en serie con C", role: "NAND evita el rebose; AND exige el encendido",
    positive: "1 = agua al límite / panel encendido / bomba operando",
    fn: ([a, b, c]) => !(a && b) && c,
    inputs: [["A", "Sensor nivel 1", "automático"], ["B", "Sensor nivel 2", "automático"], ["C", "Panel de encendido", "manual · C"]],
    estados: ["Tanque vacío, apagado", "Tanque vacío, llenando", "Nivel bajo, apagado", "Nivel bajo, llenando", "Nivel bajo, apagado", "Nivel bajo, llenando", "Nivel peligro, apagado", "Nivel peligro, bloqueo"],
    tree: { t: "s", c: [{ t: "p", c: [{ t: "nc", v: "A" }, { t: "nc", v: "B" }] }, { t: "no", v: "C" }] },
    sumCond: "Panel encendido y sin riesgo de rebose", sumApp: "Llenado de tanque",
    others: [["¿Y si falla un sensor?", "Si un sensor queda en 0, la NAND nunca llega a 0 y la bomba no se detiene. Si la prioridad es la seguridad ante fallas, conviene que un solo sensor baste para detener (NOR)."],
             ["Compuerta universal", "Con NAND se puede construir cualquier otra función lógica. Mano y Ciletti (2013), cap. 2; Roth y Kinney (2014)."]],
    notes: "La NAND mantiene la bomba en marcha mientras no se confirme el nivel máximo con ambos sensores. Punto de discusión: si uno de los sensores falla y queda en 0, la bomba nunca se detiene. Demuéstralo con «Falla del sensor 2»: el tanque rebosa. Si la prioridad es la seguridad ante fallas, conviene que un solo sensor baste para detener (función NOR). La NAND además es una compuerta universal. Referencia: Mano y Ciletti (2013), cap. 2; Roth y Kinney (2014)." },

  { id: "nor", name: "NOR", plus: "XOR", stages: ["nor", "xor"], color: "var(--c-nor)", title: "Climatización invierno/verano",
    lead: "En invierno el clima no arranca con aberturas; en verano el switch estacional invierte la lógica y fuerza la extracción.",
    expr: "Y = (A + B)′ ⊕ C", out: "Y", coil: "Clima", read: "NOR y XOR en contactos", role: "NOR exige todo cerrado; XOR invierte en verano",
    positive: "1 = abierto / modo verano / equipo encendido",
    fn: ([a, b, c]) => !(a || b) !== !!c,
    inputs: [["A", "Ventana", "abierta = 1"], ["B", "Puerta", "abierta = 1"], ["C", "Modo verano", "switch estacional"]],
    estados: ["Invierno cerrado, ON", "Verano cerrado, OFF", "Invierno abierto, OFF", "Verano abierto, ON", "Invierno abierto, OFF", "Verano abierto, ON", "Invierno abierto, OFF", "Verano abierto, ON"],
    tree: { t: "p", c: [{ t: "s", c: [{ t: "nc", v: "A" }, { t: "nc", v: "B" }, { t: "nc", v: "C" }] }, { t: "s", c: [{ t: "p", c: [{ t: "no", v: "A" }, { t: "no", v: "B" }] }, { t: "no", v: "C" }] }] },
    sumCond: "Cerrado en invierno, o abierto en verano", sumApp: "Climatización bimodal",
    others: [["NOR, también universal", "La NOR es la negación de la OR: la calefacción solo opera cuando ninguna abertura está abierta. Igual que la NAND, sirve para construir cualquier función."],
             ["Referencias", "Floyd (2016), cap. 3; Mano y Ciletti (2013), cap. 2."]],
    notes: "La NOR es la negación de la OR: la calefacción solo opera cuando ninguna abertura está abierta. La XOR con C funciona como un inversor controlado: con C = 0 deja pasar la NOR tal cual y con C = 1 la invierte. Al igual que la NAND, la NOR es una compuerta universal, con la que se puede construir cualquier otra función. Referencia: Floyd (2016), cap. 3; Mano y Ciletti (2013), cap. 2." },

  { id: "xor", name: "XOR", stages: null, color: "var(--c-xor)", title: "Interruptor de escalera",
    lead: "Una misma luz se enciende o apaga desde dos lugares distintos, al inicio y al final de la escalera.",
    expr: "Y = A ⊕ B", out: "Y", coil: "Foco", lamp: true, read: "NA y NC cruzados", role: "Sale 1 si A y B son diferentes",
    positive: "Entrada 1 = interruptor arriba · Salida 1 = foco encendido",
    fn: ([a, b]) => a !== b,
    inputs: [["A", "Interruptor", "piso 1"], ["B", "Interruptor", "piso 2"]],
    estados: ["Foco apagado", "Foco encendido", "Foco encendido", "Foco apagado"],
    tree: { t: "p", c: [{ t: "s", c: [{ t: "no", v: "A" }, { t: "nc", v: "B" }] }, { t: "s", c: [{ t: "nc", v: "A" }, { t: "no", v: "B" }] }] },
    sumCond: "Las entradas son diferentes", sumApp: "Interruptor de escalera",
    others: [["Conmutadores de 3 vías", "En instalaciones eléctricas se usan dos conmutadores de tres vías unidos por dos viajeros: implementan físicamente la función XOR."],
             ["Referencias", "Tocci, Widmer y Moss (2007), cap. 4; Floyd (2016), cap. 3."]],
    notes: "Cambiar la posición de cualquiera de los dos interruptores invierte el estado del foco. En instalaciones eléctricas esto se realiza con dos conmutadores de tres vías, que implementan físicamente la función XOR. Sigue el camino encendido en el esquema: la corriente llega al foco por un viajero solo cuando A ≠ B. Referencia: Tocci, Widmer y Moss (2007), cap. 4; Floyd (2016), cap. 3." },

  { id: "xnor", name: "XNOR", plus: "NOR", stages: ["xnor", "nor"], color: "var(--c-xnor)", title: "Alarma de discrepancia",
    lead: "Compara sensor principal y respaldo: si no coinciden dispara la alarma, salvo que el operador pulse el reset.",
    expr: "Y = ((A ⊙ B) + C)′", out: "Y", coil: "Alarma", read: "A ⊕ B en serie con C NC", role: "XNOR compara; NOR dispara salvo reset",
    positive: "1 = alto nivel / botón accionado / alarma sonando",
    fn: ([a, b, c]) => !((a === b) || c),
    inputs: [["A", "Sensor principal", "alto nivel = 1"], ["B", "Sensor de respaldo", "alto nivel = 1"], ["C", "Botón reset", "silenciador · C"]],
    estados: ["Lecturas OK, silencio", "Lecturas OK, reset", "Discrepancia, ALARMA", "Discrepancia, reset", "Discrepancia, ALARMA", "Discrepancia, reset", "Lecturas OK, silencio", "Lecturas OK, reset"],
    tree: { t: "s", c: [{ t: "p", c: [{ t: "s", c: [{ t: "no", v: "A" }, { t: "nc", v: "B" }] }, { t: "s", c: [{ t: "nc", v: "A" }, { t: "no", v: "B" }] }] }, { t: "nc", v: "C" }] },
    sumCond: "Los sensores difieren y no hay reset", sumApp: "Alarma de discrepancia",
    others: [["Comparadores", "Encadenando varias XNOR con una AND se construyen comparadores de palabras completas, base de la verificación de datos en sistemas embebidos."],
             ["Referencias", "Mano y Ciletti (2013), cap. 4; Roth y Kinney (2014)."]],
    notes: "La XNOR funciona como detector de igualdad de un bit. Encadenando varias XNOR con una AND se construyen comparadores de palabras completas, base de la verificación de datos en sistemas embebidos. Referencia: Mano y Ciletti (2013), cap. 4; Roth y Kinney (2014)." }
];

const swHTML = (k, label, sub) => `<button class="sw" data-toggle="${k}" aria-pressed="false"><span class="key">${k}</span><span class="txt">${label}<small>${sub}</small></span><span class="track" aria-hidden="true"></span></button>`;
const actHTML = (act, k, label, sub, pressed) => `<button class="sw" data-act="${act}" aria-pressed="${!!pressed}"><span class="key">${k}</span><span class="txt">${label}<small>${sub}</small></span><span class="track" aria-hidden="true"></span></button>`;
const scopes = {};

function makeStatus(el) {
  const b = $("b", el), sp = $("span", el);
  return (tone, label, reason) => {
    if (el.dataset.tone !== tone) {
      const dot = $("i", el);
      dot.classList.remove("ping"); void dot.offsetWidth; dot.classList.add("ping");
    }
    el.dataset.tone = tone;
    if (el.dataset.label !== label) {
      el.dataset.label = label;
      b.textContent = label;
      if (!REDUCED.matches) b.animate([{ opacity: 0.2, filter: "blur(4px)", transform: "translateY(4px)" }, { opacity: 1, filter: "blur(0)", transform: "none" }], { duration: 320, easing: "cubic-bezier(.23,1,.32,1)" });
    }
    if (sp.textContent !== reason) sp.textContent = reason;
  };
}

const gateCard = (g, b, draw) => (g.stages ? comboSymbol(g.stages[0], g.stages[1], b, draw) : gateSymbol(g.id, b, g.fn(b) ? 1 : 0, draw));

function buildGate(g, gi) {
  const sec = $(`[data-gate="${g.id}"]`);
  const sim = SIMS[g.id];
  const num = String($$(".slide").indexOf(sec) + 1).padStart(2, "0");
  const keys = g.inputs.map(i => i[0]);
  const n = keys.length;
  const manual = sim.manual !== false;
  sec.style.setProperty("--gc", g.color);
  Object.assign(sec.dataset, { title: `${g.name}${g.plus ? " + " + g.plus : ""} · ${g.title}`, notes: g.notes, scope: g.id });

  let rows = "";
  for (let r = 0; r < 1 << n; r++) {
    const bits = keys.map((_, i) => (r >> (n - 1 - i)) & 1), y = g.fn(bits) ? 1 : 0;
    const cells = g.rowLabels ? `<td>${g.rowLabels[r]}</td>` : bits.map(b => `<td>${b}</td>`).join("");
    rows += `<tr style="--r:${r}"${y ? ' class="hi"' : ""}>${cells}<td class="y">${y}</td></tr>`;
  }
  const controls = sim.controls ? sim.controls(g) : g.inputs.map(([k, l, s]) => swHTML(k, l, s)).join("");
  const scen = sim.scenarios || [];
  const play = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1L9 5L2 9Z"/></svg>';
  const tip = sim.tip || (manual ? "Toca una fila o una entrada." : "Entradas automáticas.");

  sec.innerHTML = `
    <div class="ghost abs" aria-hidden="true">${g.name}</div>
    <header class="g-head">
      <div class="g-title">
        <div><span class="chip" data-a><b>${num}</b>Compuerta ${gi + 1} de 7</span><h2 class="g-name" translate="no"><span class="split">${g.name}</span>${g.plus ? `<span class="g-plus">+ ${g.plus}</span>` : ""}</h2></div>
        <div class="g-story" data-a><h3>${g.title}</h3><p>${g.lead}</p></div>
      </div>
      <div class="g-card glass corners" data-a><div class="sym-slot"></div><div><code translate="no">${g.expr}</code><small>${g.role}</small></div></div>
    </header>
    <div class="g-body${gi % 2 ? " mirror" : ""}">
      <div class="stage-col">
        <div class="stage glass corners" data-a="scale">
          <div class="hud-tl"><i></i>Esquema de la aplicación</div>
          <div class="scen">${scen.map((s, i) => `<button data-scen="${i}">${play}${s[0]}</button>`).join("")}</div>
          <div class="scene-wrap">${sim.scene()}</div>
          <div class="status" data-tone="idle"><i></i><b></b><span></span></div>
        </div>
        <div class="controls" data-a>${controls}</div>
      </div>
      <div class="logic glass" data-a="scale">
        <div class="logic-top">
          <p class="logic-title">Tabla de verdad y compuertas</p>
          <span class="lbl">salida ${g.out}</span>
        </div>
        <div class="view v0">
          <div class="tt-wrap">
            <span class="row-ind" aria-hidden="true"></span>
            <p class="lbl">Tabla de verdad</p>
            <table class="tt${manual ? " click" : ""}"><thead><tr>${keys.map(k => `<th>${k}</th>`).join("")}<th class="y">${g.out}</th></tr></thead><tbody>${rows}</tbody></table>
            <p class="tip">${tip}</p>
            <p class="tip hl-tip"><i></i>Salida en 1</p>
          </div>
          <div class="gates-wrap">
            <div class="eqbox" aria-live="polite"></div>
            <div class="gl-top"><p class="lbl">${g.stages ? "Sistema mixto de dos etapas" : "Diagrama de compuertas"}${manual ? " · toca las entradas" : ""}</p>${LG[g.id].modes ? `<div class="seg" role="group">${LG[g.id].modes.map((m, i) => `<button data-gview="${i}" aria-pressed="${!i}">${m}</button>`).join("")}</div>` : ""}</div>
            <div class="gates-slot"></div>
            <p class="pos-note">${g.positive}</p>
          </div>
        </div>
      </div>
    </div>
    <footer class="g-more" data-a>
      <span class="lbl">Más sobre este caso</span>
      ${g.others.map((o, i) => `<button class="ex" data-ex="${i}" aria-expanded="false"><span>0${i + 1}</span>${o[0]}</button>`).join("")}
      <div class="pop" role="status"></div>
    </footer>`;

  const stage = $(".stage", sec);
  const sc = {
    def: g, sec, stage, keys, scene: $(".scene", sec), vals: Object.fromEntries(keys.map(k => [k, 0])),
    y: 0, level: 0, hist: [], tab: 0, gview: 0, setStatus: makeStatus($(".status", sec)),
    bits: () => keys.map(k => (sc.vals[k] ? 1 : 0)),
    row: () => parseInt(sc.bits().join(""), 2),
    status() {
      const b = sc.bits(), [tone, reason, label] = sim.status(sc, b, sc.y);
      sc.setStatus(tone, label || g.estados[sc.row()], reason);
    },
    update(opt = {}) {
      const b = sc.bits(), y = g.fn(b) ? 1 : 0, prev = sc.y, first = !sc.hist.length;
      sc.y = y;
      b.forEach((v, i) => (stage.dataset["i" + i] = v));
      stage.dataset.y = y;
      $(".sym-slot", sec).innerHTML = gateCard(g, b, opt.draw);
      const row = sc.row();
      $$("tbody tr", sec).forEach((tr, i) => tr.classList.toggle("on", i === row));
      sc.placeRow(row);
      $$("[data-toggle]", sec).forEach(bt => bt.setAttribute("aria-pressed", !!sc.vals[bt.dataset.toggle]));
      $(".eqbox", sec).innerHTML = LG[g.id].eq(sc.vals, y);
      $(".gates-slot", sec).innerHTML = LG[g.id].draw(sc.vals, sc.gview, manual);
      if (!first && prev !== y && !REDUCED.matches) {
        const pop = [{ transform: "scale(1.28)" }, { transform: "scale(1)" }], o = { duration: 320, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" };
        $(".eqbox .res", sec)?.animate(pop, o);
        $(".gd .lampo", sec)?.animate(pop, o);
      }
      sim.update?.(sc, b, y, first, prev);
      sc.status();
      if (!first && prev !== y) sfx.clack();
      sc.hist.push({ t: NOW(), v: [...b, y] });
      while (sc.hist.length > 2 && sc.hist[1].t < NOW() - 14) sc.hist.shift();
    },
    placeRow(row = sc.row()) {
      const tbl = $(".tt", sec), tr = $$("tbody tr", sec)[row], ind = $(".row-ind", sec);
      if (!tr || !tr.offsetHeight) return;
      ind.style.width = tbl.offsetWidth + "px";
      ind.style.height = tr.offsetHeight + "px";
      ind.style.transform = `translate3d(${tbl.offsetLeft}px,${tbl.offsetTop + tr.offsetTop}px,0)`;
      requestAnimationFrame(() => ind.classList.add("ready"));
    },
    toggle(k) { if (!manual || !(k in sc.vals)) return; sc.vals[k] ^= 1; sfx.click(); sc.update(); },
    setRow(r) { if (!manual) return; keys.forEach((k, i) => (sc.vals[k] = (r >> (n - 1 - i)) & 1)); sfx.click(); sc.update(); },
    action(a) { sim.action?.(sc, a); },
    enter() { sc.update({ draw: true }); },
    tick(dt) {
      sim.tick?.(sc, dt);
      if (sc.tab === 1 && (sc.chronoT = (sc.chronoT || 0) + dt) > 1 / 15) {
        sc.chronoT = 0;
        $(".chrono-slot", sec).innerHTML = chronoSVG([...keys, g.out], sc.hist);
      }
    }
  };
  scopes[g.id] = sc;
  sim.mount?.(sc);

  /* escenarios: aplica entradas una a una para que se vea la secuencia */
  let seq = [];
  $$("[data-scen]", sec).forEach(bt => bt.addEventListener("click", () => {
    seq.forEach(clearTimeout); seq = [];
    const s = scen[+bt.dataset.scen][1];
    if (typeof s === "function") { s(sc); sfx.click(); return; }
    let d = 0;
    keys.forEach((k, i) => {
      if (sc.vals[k] !== s[i]) seq.push(setTimeout(() => { sc.vals[k] = s[i]; sfx.click(); sc.update(); }, (d++) * 220));
    });
  }));
  $$("tbody tr", sec).forEach((tr, i) => tr.addEventListener("click", () => sc.setRow(i)));
  $$(".tabs button", sec).forEach(bt => bt.addEventListener("click", () => {
    sc.tab = +bt.dataset.tab;
    $(".tabs", sec).dataset.tab = sc.tab;
    $$(".tabs button", sec).forEach(x => x.setAttribute("aria-selected", x === bt));
    $$(".view", sec).forEach((v, i) => { v.hidden = i !== sc.tab; v.classList.toggle("v-anim", i === sc.tab); });
    if (sc.tab === 0) sc.placeRow();
    if (sc.tab === 1) $(".chrono-slot", sec).innerHTML = chronoSVG([...keys, g.out], sc.hist);
    sfx.click();
  }));
  $$("[data-gview]", sec).forEach(bt => bt.addEventListener("click", () => {
    sc.gview = +bt.dataset.gview;
    $$("[data-gview]", sec).forEach(x => x.setAttribute("aria-pressed", x === bt));
    $(".gates-slot", sec).innerHTML = LG[g.id].draw(sc.vals, sc.gview, manual);
    $(".gates-slot svg", sec)?.classList.add("v-anim");
    sfx.click();
  }));
  const pop = $(".pop", sec);
  $$(".ex", sec).forEach(bt => bt.addEventListener("click", e => {
    e.stopPropagation();
    const open = bt.getAttribute("aria-expanded") !== "true";
    $$(".ex", sec).forEach(x => x.setAttribute("aria-expanded", "false"));
    pop.classList.remove("open");
    if (!open) return;
    const o = g.others[+bt.dataset.ex];
    bt.setAttribute("aria-expanded", "true");
    pop.innerHTML = `<b>${o[0]}</b><p>${o[1]}</p>`;
    pop.style.left = bt.offsetLeft + "px";
    pop.style.setProperty("--ox", "24px");
    requestAnimationFrame(() => pop.classList.add("open"));
  }));
  splitText($(".split", sec));
  sc.update();
}
