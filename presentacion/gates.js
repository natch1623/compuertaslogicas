"use strict";
const GATES = [
  { id: "and", name: "AND", kind: "Compuerta básica", color: "var(--c-and)", title: "Arranque con permisivos",
    lead: "Compresor industrial: el motor arranca solo si se cumplen todas las condiciones.",
    expr: "M = A · B · C", out: "M", coil: "M", read: "contactos en serie",
    inputs: [["A", "Arranque", "botón START", "botón START"], ["B", "Presión de aceite", "permisivo", "presión de aceite"], ["C", "Guarda", "cerrada", "guarda cerrada"]],
    tree: { t: "s", c: [{ t: "no", v: "A" }, { t: "no", v: "B" }, { t: "no", v: "C" }] },
    scenarios: [["Arranque normal", [1, 1, 1]], ["Sin presión de aceite", [1, 0, 1]], ["Guarda abierta", [1, 1, 0]]],
    others: [["Puente grúa", "Se mueve solo si el operador mantiene el botón de «hombre muerto» y el freno está liberado."],
             ["Transferencia de generador", "Se cierra el interruptor de carga solo con tensión correcta y frecuencia estable (60 Hz)."]],
    notes: "Usa «Arranque normal» y luego «Guarda abierta»: el motor pierde velocidad poco a poco (inercia), pero el contactor abre al instante. Muestra la barra de estado: dice exactamente qué permisivo falta. Tres permisivos en serie; basta uno en 0 para impedir el arranque." },
  { id: "or", name: "OR", kind: "Compuerta básica", color: "var(--c-or)", title: "Paros de emergencia distribuidos",
    lead: "Banda transportadora: se detiene si se activa cualquiera de sus paros de emergencia.",
    expr: "P = E1 + E2 + E3", out: "P", coil: "Parada", read: "contactos en paralelo",
    inputs: [["E1", "Paro E1", "zona de carga"], ["E2", "Paro E2", "tramo central"], ["E3", "Paro E3", "descarga"]],
    tree: { t: "p", c: [{ t: "no", v: "E1" }, { t: "no", v: "E2" }, { t: "no", v: "E3" }] },
    scenarios: [["Operación normal", [0, 0, 0]], ["Paro en descarga", [0, 0, 1]], ["Dos paros", [1, 1, 0]]],
    others: [["Autorretención", "El auxiliar del contactor va en paralelo con START: el motor sigue al soltar el botón."],
             ["Disparo de motor trifásico", "Se desconecta por sobrecorriente, falta de fase o sobretemperatura en los devanados."]],
    notes: "Basta un paro. Observa la torre de señalización: ámbar mientras la banda frena y rojo cuando está detenida. Abre el cronograma para ver que P sube en cuanto sube cualquier entrada. Dato de norma: IEC 60204-1 pide los paros de emergencia como contactos NC en serie (seguridad positiva); la lógica de parada es la misma OR." },
  { id: "not", name: "NOT", kind: "Compuerta básica", color: "var(--c-not)", title: "Bomba de llenado",
    lead: "La bomba funciona mientras el sensor de nivel alto NO está activo.",
    expr: `B = ${ov("LSH")}`, out: "B", coil: "Bomba", read: "contacto NC",
    inputs: [["LSH", "Sensor de nivel alto", "automático"]],
    tree: { t: "s", c: [{ t: "nc", v: "LSH" }] },
    others: [["Botón STOP", "Es un contacto NC: en reposo deja pasar corriente (1) y al presionarlo la corta (0)."],
             ["Relé térmico (95-96)", "Su contacto NC se abre cuando el motor se calienta y desenergiza el contactor."]],
    notes: "La simulación corre sola: la bomba llena, el flotador sube y el LSH abre el contacto NC. Abre el consumo. La franja ámbar es la histéresis del flotador (80 % dispara, 62 % rearma); pregunta qué pasaría sin ella: la bomba encendería y apagaría sin parar." },
  { id: "nand", name: "NAND", kind: "Compuerta compuesta", color: "var(--c-nand)", title: "Disponibilidad del bombeo",
    lead: "Dos bombas en paralelo: el sistema sigue disponible mientras al menos una opere.",
    expr: `D = ${ov("F1 · F2")}`, out: "D", coil: "Disp.", read: "NC en paralelo",
    inputs: [["F1", "Falla bomba 1", "protección del motor"], ["F2", "Falla bomba 2", "protección del motor"]],
    tree: { t: "p", c: [{ t: "nc", v: "F1" }, { t: "nc", v: "F2" }] },
    others: [["Cadena de seguridad de ascensor", "Cuando coinciden todas las condiciones de riesgo, la salida cae a 0 y activa el freno."],
             ["PLC y variadores", "Su electrónica interna usa sobre todo NAND: es universal y económica."]],
    notes: "Con una falla el caudal baja a 50 % pero la señal de disponible sigue en 1 (redundancia N+1). Solo con las dos fallas cae a 0. En Ladder, por De Morgan, la NAND son dos contactos NC en paralelo." },
  { id: "nor", name: "NOR", kind: "Compuerta compuesta", color: "var(--c-nor)", title: "Luz de sistema listo",
    lead: "Planta de tratamiento de agua: la luz verde enciende solo si ninguna alarma está activa.",
    expr: `L = ${ov("A1 + A2 + A3")}`, out: "L", coil: "Listo", read: "NC en serie",
    inputs: [["A1", "Nivel bajo", "LSL · tanque"], ["A2", "Sobrepresión", "PSH · descarga"], ["A3", "Falla de motor", "relé de protección"]],
    tree: { t: "s", c: [{ t: "nc", v: "A1" }, { t: "nc", v: "A2" }, { t: "nc", v: "A3" }] },
    others: [["Máquina CNC", "Habilita el husillo solo si ninguna puerta está abierta y ningún final de carrera está activado."],
             ["HVAC central", "El compresor arranca solo si no hay falla de alta ni de baja presión."]],
    notes: "Es un anunciador real: cada alarma nueva parpadea hasta que el operador la reconoce, y luego queda fija mientras siga activa. Reconocer no cambia la lógica: «listo» es la negación de «hay alguna alarma». Compara esta tabla con la de OR: la salida es exactamente la opuesta." },
  { id: "xor", name: "XOR", kind: "Compuerta compuesta", color: "var(--c-xor)", title: "Luz desde dos accesos",
    lead: "Nave industrial: cambiar cualquiera de los dos interruptores cambia el estado de la lámpara.",
    expr: "Y = A ⊕ B", out: "Y", coil: "Lámpara", read: "NA y NC cruzados",
    inputs: [["A", "Interruptor", "acceso 1"], ["B", "Interruptor", "acceso 2"]],
    tree: { t: "p", c: [{ t: "s", c: [{ t: "no", v: "A" }, { t: "nc", v: "B" }] }, { t: "s", c: [{ t: "nc", v: "A" }, { t: "no", v: "B" }] }] },
    others: [["Encoder incremental", "Una XOR sobre las señales en cuadratura A y B duplica la resolución de posición y velocidad."],
             ["Válvula motorizada", "Si la orden (abrir) difiere del final de carrera (cerrada), la XOR da 1 y dispara la alarma."]],
    notes: "Interruptores conmutados de 3 vías con los viajeros cruzados (la X del dibujo). Sigue el camino encendido: llega a la lámpara solo cuando A ≠ B. Si no se cruzan los viajeros, el mismo circuito sería XNOR: depende de cómo se defina el 1 de cada interruptor." },
  { id: "xnor", name: "XNOR", kind: "Compuerta compuesta", color: "var(--c-xnor)", title: "Sincronización con la red",
    lead: "Compara las ondas del generador y de la red: si coinciden, la salida permanece en 1.",
    expr: `Y = ${ov("G ⊕ R")}`, out: "Y", coil: "Sinc.", read: "igualdad",
    inputs: [["G", "Generador", "onda cuadrada"], ["R", "Red", "onda cuadrada"]],
    tree: { t: "p", c: [{ t: "s", c: [{ t: "no", v: "G" }, { t: "no", v: "R" }] }, { t: "s", c: [{ t: "nc", v: "G" }, { t: "nc", v: "R" }] }] },
    others: [["Finales de carrera redundantes", "Si ambos sensores coinciden la lectura es confiable; si difieren, uno está dañado."],
             ["Posicionamiento de elevador", "Compara bit a bit el piso solicitado con el actual y detiene la cabina cuando todos coinciden."]],
    notes: "Minijuego para la clase: acerca la frecuencia del generador a 60 Hz para que el sincroscopio gire lento, y pulsa «Cerrar 52G» cuando la aguja pase por la franja verde (desfase ≤ 12°). Si cierras fuera de fase, el cierre se rechaza. La traza Y muestra la XNOR: con más desfase aparecen más huecos en 0. La coincidencia en % es 1 − |φ|/180." }
];

const swHTML = (k, label, sub) => `<button class="sw" data-toggle="${k}" aria-pressed="false"><span class="key">${k}</span><span class="txt">${label}<small>${sub}</small></span><span class="track" aria-hidden="true"></span></button>`;
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

function buildGate(g, gi) {
  const sec = $(`[data-gate="${g.id}"]`);
  const sim = SIMS[g.id];
  const num = String($$(".slide").indexOf(sec) + 1).padStart(2, "0");
  const keys = g.inputs.map(i => i[0]);
  const n = keys.length;
  const manual = sim.manual !== false;
  sec.style.setProperty("--gc", g.color);
  Object.assign(sec.dataset, { title: `${g.name} · ${g.title}`, notes: g.notes, scope: g.id });

  let rows = "";
  for (let r = 0; r < 1 << n; r++) {
    const bits = keys.map((_, i) => (r >> (n - 1 - i)) & 1);
    rows += `<tr style="--r:${r}">${bits.map(b => `<td>${b}</td>`).join("")}<td class="y">${GATE_FN[g.id](bits) ? 1 : 0}</td></tr>`;
  }
  const controls = sim.controls ? sim.controls(g) : g.inputs.map(([k, l, s]) => swHTML(k, l, s)).join("");
  const scen = sim.scenarios || g.scenarios || [];
  const play = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1L9 5L2 9Z"/></svg>';

  sec.innerHTML = `
    <div class="ghost abs" aria-hidden="true">${g.name}</div>
    <header class="g-head">
      <div class="g-title">
        <div><span class="chip" data-a><b>${num}</b>${g.kind}</span><h2 class="g-name" translate="no"><span class="split">${g.name}</span></h2></div>
        <div class="g-story" data-a><h3>${g.title}</h3><p>${g.lead}</p></div>
      </div>
      <div class="g-card glass corners" data-a><div class="sym-slot"></div><div><code translate="no">${g.expr}</code><small>Ladder: ${g.read}</small></div></div>
    </header>
    <div class="g-body${gi % 2 ? " mirror" : ""}">
      <div class="stage-col">
        <div class="stage glass corners" data-a="scale">
          <div class="hud-tl"><i></i>Simulación en vivo</div>
          <div class="scen">${scen.map((s, i) => `<button data-scen="${i}">${play}${s[0]}</button>`).join("")}</div>
          <div class="scene-wrap">${sim.scene()}</div>
          <div class="status" data-tone="idle"><i></i><b></b><span></span></div>
        </div>
        <div class="controls" data-a>${controls}</div>
      </div>
      <div class="logic glass" data-a="scale">
        <div class="logic-top">
          <div class="tabs" role="tablist" data-tab="0"><span class="ind"></span><button role="tab" aria-selected="true" data-tab="0">Tabla + compuertas</button><button role="tab" aria-selected="false" data-tab="1">Ladder + cronograma</button></div>
          <span class="lbl">salida ${g.out}</span>
        </div>
        <div class="view v0">
          <div class="tt-wrap">
            <span class="row-ind" aria-hidden="true"></span>
            <p class="lbl">Tabla de verdad</p>
            <table class="tt${manual ? " click" : ""}"><thead><tr>${keys.map(k => `<th>${k}</th>`).join("")}<th class="y">${g.out}</th></tr></thead><tbody>${rows}</tbody></table>
            <p class="tip">${manual ? "Toca una fila o una entrada." : "Entradas automáticas."}</p>
          </div>
          <div class="gates-wrap">
            <div class="eqbox" aria-live="polite"></div>
            <div class="gl-top"><p class="lbl">Diagrama de compuertas${manual ? " · toca las entradas" : ""}</p>${LG[g.id].modes ? `<div class="seg" role="group">${LG[g.id].modes.map((m, i) => `<button data-gview="${i}" aria-pressed="${!i}">${m}</button>`).join("")}</div>` : ""}</div>
            <div class="gates-slot"></div>
          </div>
        </div>
        <div class="view vc" hidden>
          <div class="ladder-wrap"><p class="lbl">Ladder · ${g.read}</p><div class="ladder-slot"></div></div>
          <div class="chrono-wrap"><p class="lbl">Cronograma · últimos 12 s</p><div class="chrono-slot"></div></div>
        </div>
      </div>
    </div>
    <footer class="g-more" data-a>
      <span class="lbl">También en</span>
      ${g.others.map((o, i) => `<button class="ex" data-ex="${i}" aria-expanded="false"><span>0${i + 1}</span>${o[0]}</button>`).join("")}
      <div class="pop" role="status"></div>
    </footer>`;

  const stage = $(".stage", sec);
  const sc = {
    def: g, sec, stage, keys, scene: $(".scene", sec), vals: Object.fromEntries(keys.map(k => [k, 0])),
    y: 0, level: 0, hist: [], tab: 0, gview: 0, setStatus: makeStatus($(".status", sec)),
    bits: () => keys.map(k => (sc.vals[k] ? 1 : 0)),
    update(opt = {}) {
      const b = sc.bits(), y = GATE_FN[g.id](b) ? 1 : 0, prev = sc.y, first = !sc.hist.length;
      sc.y = y;
      b.forEach((v, i) => (stage.dataset["i" + i] = v));
      stage.dataset.y = y;
      $(".sym-slot", sec).innerHTML = gateSymbol(g.id, b, y);
      const row = parseInt(b.join(""), 2);
      $$("tbody tr", sec).forEach((tr, i) => tr.classList.toggle("on", i === row));
      sc.placeRow(row);
      $(".ladder-slot", sec).innerHTML = ladder(g.tree, sc.vals, { coil: g.coil, click: manual, draw: opt.draw });
      $$("[data-toggle]", sec).forEach(bt => bt.setAttribute("aria-pressed", !!sc.vals[bt.dataset.toggle]));
      $(".eqbox", sec).innerHTML = LG[g.id].eq(sc.vals, y);
      $(".gates-slot", sec).innerHTML = LG[g.id].draw(sc.vals, sc.gview, manual);
      if (!first && prev !== y && g.id !== "xnor" && !REDUCED.matches) {
        const pop = [{ transform: "scale(1.28)" }, { transform: "scale(1)" }], o = { duration: 320, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" };
        $(".eqbox .res", sec)?.animate(pop, o);
        $(".gd .lampo", sec)?.animate(pop, o);
      }
      sim.update?.(sc, b, y, first);
      if (!sim.tick || !["xnor"].includes(g.id)) sc.setStatus(...sim.status(sc, b, y));
      if (!first && prev !== y && g.id !== "xnor") sfx.clack();
      sc.hist.push({ t: NOW(), v: [...b, y] });
      while (sc.hist.length > 2 && sc.hist[1].t < NOW() - 14) sc.hist.shift();
    },
    placeRow(row = parseInt(sc.bits().join(""), 2)) {
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
