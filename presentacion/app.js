"use strict";
GATES.forEach(buildGate);

/* ============ portada: fila de compuertas con señales vivas ============ */
{
  const row = $("#gateRow");
  const kinds = ["and", "or", "not", "nand", "nor", "xor", "xnor"];
  row.innerHTML = kinds.map((k, i) => `<figure style="--gc:var(--c-${k});--sd:${i * 90}ms" data-k="${k}"><div class="gs">${gateSymbol(k, k === "not" ? [0] : [0, 0], GATE_FN[k](k === "not" ? [0] : [0, 0]), true)}</div><figcaption>${k.toUpperCase()}</figcaption></figure>`).join("");
  let t = 0, k = 0;
  scopes.cover = {
    tick(dt) {
      if ((t += dt) < 0.75) return;
      t = 0;
      const fig = row.children[k % 7], kind = kinds[k % 7];
      const ins = kind === "not" ? [Math.random() < .5 ? 1 : 0] : [Math.random() < .5 ? 1 : 0, Math.random() < .5 ? 1 : 0];
      $(".gs", fig).innerHTML = gateSymbol(kind, ins, GATE_FN[kind](ins));
      $$("figure", row).forEach(f => f.classList.toggle("flash", f === fig));
      k++;
    }
  };
}

/* ============ pregunta detonante: paros que se pueden presionar ============ */
{
  const box = $("#qDemo");
  const es = (x, i) => `<g class="es es${i}" data-q="${i}" style="cursor:pointer"><rect class="steel" x="${x - 4}" y="170" width="8" height="60"/><rect class="yel" x="${x - 26}" y="118" width="52" height="54" rx="7"/><g class="mush"><rect class="mush-s" x="${x - 9}" y="102" width="18" height="18"/><ellipse class="mush-h" cx="${x}" cy="102" rx="26" ry="11"/></g><text class="lbl" x="${x}" y="252" text-anchor="middle" style="font-size:12px">E${i + 1}</text></g>`;
  box.innerHTML = `<div class="stage" style="flex:none;overflow:visible" data-i0="0" data-i1="0" data-i2="0"><svg class="scene m-or" viewBox="0 0 360 270" role="img" aria-label="Tres paros de emergencia y una baliza de parada">
    <text class="lbl" x="180" y="18" text-anchor="middle" style="font-size:11px">BALIZA DE PARADA</text>
    ${lamp(180, 52, 20, "red", "q-beacon")}
    <path class="conduit" d="M180 76V88M60 88H300M60 88V100M180 88V100M300 88V100"/>
    ${es(60, 0)}${es(180, 1)}${es(300, 2)}
  </svg></div><p>Toca cualquier paro</p>`;
  const st = $(".stage", box), vals = [0, 0, 0];
  box.addEventListener("click", e => {
    const g = e.target.closest("[data-q]");
    if (!g) return;
    const i = +g.dataset.q;
    vals[i] ^= 1;
    st.dataset["i" + i] = vals[i];
    const on = vals.some(Boolean);
    const lampEl = $("#q-beacon", box);
    if (on !== lampEl.classList.contains("on")) sfx[on ? "alarm" : "click"]();
    lampEl.classList.toggle("on", on);
    $("p", box).textContent = on ? `Parada = ${vals.map((v, k) => `E${k + 1}`).join(" + ")} = 1` : "Toca cualquier paro";
  });
  $("#revealBtn").addEventListener("click", () => {
    const wrap = $("#answerBox");
    wrap.innerHTML = `<p class="answer">${gateSymbol("or", [1, 0], 1)}<span>Porque los paros actúan como una <b>OR</b>: basta que uno solo sea 1.</span></p>`;
    sfx.ok();
  });
}

/* ============ puente: minicircuitos con lámpara ============ */
[["b-and", { t: "s", c: [{ t: "no", v: "A" }, { t: "no", v: "B" }] }],
 ["b-or", { t: "p", c: [{ t: "no", v: "A" }, { t: "no", v: "B" }] }],
 ["b-not", { t: "s", c: [{ t: "nc", v: "A" }] }]].forEach(([id, tree]) => {
  const el = $(`[data-scope="${id}"]`), slot = $(".mini", el), vals = { A: 0, B: 0 };
  const sc = {
    update(o = {}) { slot.innerHTML = ladder(tree, vals, { coil: "Y", click: true, lamp: true, draw: o.draw }); },
    toggle(k) { vals[k] ^= 1; sfx.click(); sc.update(); }
  };
  scopes[id] = sc;
  sc.update();
});
scopes.bridge = { enter() { ["b-and", "b-or", "b-not"].forEach(id => scopes[id].update({ draw: true })); } };

/* ============ separadores: símbolos que se dibujan y laten ============ */
["p1", "p2"].forEach(id => {
  const sec = $(`[data-scope="${id}"]`), items = $$(".part-item", sec);
  const paint = (draw, rnd) => items.forEach((it, i) => {
    const k = it.dataset.k, ins = (k === "not" ? [0] : [0, 0]).map(() => (rnd ? (Math.random() < .5 ? 1 : 0) : 0));
    $(".ps", it).innerHTML = gateSymbol(k, ins, GATE_FN[k](ins), draw);
    it.style.setProperty("--sd", i * 140 + "ms");
  });
  let t = 0;
  scopes[id] = { enter() { t = -1.6; paint(true, false); }, tick(dt) { if ((t += dt) > 1.1) { t = 0; paint(false, true); } } };
  paint(true, false);
});

/* ============ caso integrador ============ */
{
  const sec = $('[data-scope="int"]'), stage = $("#intStage");
  $("#intScene").innerHTML = SIMS.int.scene();
  const scene = $(".scene", stage);
  const v = { S: 0, P: 0, T: 0, M: 0 };
  let step = 1, intView = 0;
  const orN = { t: "p", c: [{ t: "no", v: "S", label: "START" }, { t: "no", v: "M", label: "KM" }], note: "OR · paralelo" };
  const andN = { t: "s", c: [{ t: "nc", v: "P", label: "STOP" }, { t: "nc", v: "T", label: "F" }], note: "AND + NOT · NC en serie" };
  const STEPS = [
    ["El motor se enciende al presionar START <b>o</b> si ya estaba encendido.", `<span class="new">(S + M)</span>`],
    ["Debe mantenerse solo si <b>no</b> se presiona STOP y <b>no</b> hay sobrecarga.", `(S + M) · <span class="new">${ov("P")} · ${ov("T")}</span>`],
    ["Se unen ambas condiciones con AND.", `<span class="new">M =</span> (S + M) · ${ov("P")} · ${ov("T")}`],
    ["En el tablero: START en paralelo con el auxiliar KM (OR), en serie con STOP y el térmico, que son NC (AND + NOT).", `M = (S + M) · ${ov("P")} · ${ov("T")}`]
  ];
  const sc = {
    scene, stage, sec, vals: v, level: 0, setStatus: makeStatus($(".status", stage)),
    update(o = {}) {
      const prevM = v.M;
      v.M = (v.S || v.M) && !v.P && !v.T ? 1 : 0;
      if (prevM !== v.M) sfx.clack();
      scene.dataset.m = v.M; scene.dataset.t = v.T;
      if (intView) {
        const tree = step === 1 ? { t: "s", c: [orN] } : { t: "s", c: [orN, andN] };
        $("#intLadder").innerHTML = ladder(tree, v, { coil: "KM", notes: step === 4, draw: o.draw });
      } else {
        $("#intLadder").innerHTML = LG.int.draw(v, step);
      }
      $("#intViewLbl").textContent = intView ? `Ladder · ${step === 4 ? "lectura en el tablero" : "contactos y bobina"}` : "Diagrama de compuertas · la salida se realimenta";
      $("#resetLbl").textContent = v.T ? "disparado · toca para rearmar" : "sin disparo";
    },
    setStep(k) {
      step = k;
      const t = $("#stepText"), e = $("#stepEq");
      t.innerHTML = STEPS[k - 1][0]; e.innerHTML = STEPS[k - 1][1];
      [t, e].forEach(x => { x.classList.remove("swap"); void x.offsetWidth; x.classList.add("swap"); });
      $$(".step", sec).forEach(b => {
        const n = +b.dataset.step;
        n === k ? b.setAttribute("aria-current", "step") : b.removeAttribute("aria-current");
        b.classList.toggle("done", n < k);
      });
      $$(".steps .ln", sec).forEach((l, i) => l.classList.toggle("done", i + 1 < k));
      sc.update({ draw: true });
    },
    action(a) {
      if (a !== "reset") return;
      if (!v.T) return;
      if (sc.st.h > 0.55) { $("#resetLbl").textContent = `aún caliente: ${Math.round(sc.st.h * 100)} %`; sfx.bad(); return; }
      v.T = 0; sfx.click(); sc.update();
    },
    enter() { sc.update({ draw: true }); },
    tick(dt) { SIMS.int.tick(sc, dt); }
  };
  SIMS.int.mount(sc);
  scopes.int = sc;
  const load = $("#load");
  load.addEventListener("input", () => { sc.st.load = +load.value / 100; $("#loadOut").textContent = load.value + " %"; });
  $$(".step", sec).forEach(b => b.addEventListener("click", () => { sfx.click(); sc.setStep(+b.dataset.step); }));
  $$("[data-intview]", sec).forEach(b => b.addEventListener("click", () => {
    intView = +b.dataset.intview;
    $$("[data-intview]", sec).forEach(x => x.setAttribute("aria-pressed", x === b));
    sfx.click();
    sc.update({ draw: true });
  }));
  $$("[data-hold]", sec).forEach(b => {
    const k = b.dataset.hold;
    const down = e => { e.preventDefault(); if (b.classList.contains("down")) return; b.classList.add("down"); v[k] = 1; sfx.click(); sc.update(); };
    const up = () => { if (!b.classList.contains("down")) return; b.classList.remove("down"); v[k] = 0; sc.update(); };
    b.addEventListener("pointerdown", e => { b.setPointerCapture?.(e.pointerId); down(e); });
    ["pointerup", "pointercancel", "lostpointercapture", "blur"].forEach(ev => b.addEventListener(ev, up));
    b.addEventListener("keydown", e => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { down(e); e.stopPropagation(); } });
    b.addEventListener("keyup", e => { if (e.key === " " || e.key === "Enter") up(); });
    b.addEventListener("contextmenu", e => e.preventDefault());
  });
  sc.setStep(1);
}

/* ============ actividad ============ */
{
  const Q = [
    ["La luz verde de «sistema listo» enciende solo cuando no hay ninguna alarma.", "nor", "Es la negación de «hay alguna alarma»: una OR invertida."],
    ["Una lámpara de la nave se controla desde dos accesos distintos.", "xor", "Cambiar cualquiera de los dos interruptores cambia la salida."],
    ["El compresor arranca solo con START, presión de aceite correcta y la guarda cerrada.", "and", "Todas las condiciones deben valer 1 al mismo tiempo."],
    ["La señal «disponible» cae a 0 solo cuando fallan las dos bombas.", "nand", "Es una AND de las fallas, invertida."],
    ["El interruptor de sincronismo se habilita mientras las ondas del generador y la red coinciden.", "xnor", "La salida es 1 cuando ambas entradas son iguales."]
  ];
  const K = ["and", "or", "not", "nand", "nor", "xor", "xnor"];
  let qi = 0, score = 0;
  const res = [];
  const qEl = $("#quizQ"), opts = $("#opts"), fb = $("#feedback"), dots = $("#dots"), num = $("#qNum");
  const paintDots = () => (dots.innerHTML = Q.map((_, i) => `<i class="${res[i] === true ? "right" : res[i] === false ? "wrong" : i === qi ? "cur" : ""}"></i>`).join(""));
  const sparks = el => {
    if (REDUCED.matches) return;
    const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let i = 0; i < 18; i++) {
      const s = document.createElement("i");
      s.className = "spark";
      s.style.cssText = `left:${cx}px;top:${cy}px;background:${["#34E39A", "#FFB020", "#7DD3FC"][i % 3]}`;
      document.body.appendChild(s);
      const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 90;
      s.animate([{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(.2)`, opacity: 0 }],
        { duration: 700 + Math.random() * 300, easing: "cubic-bezier(.23,1,.32,1)" }).onfinish = () => s.remove();
    }
  };
  const render = () => {
    paintDots();
    if (qi >= Q.length) {
      num.textContent = "Resultado";
      qEl.textContent = score === Q.length ? "¡Pleno! Ya leen un tablero como un circuito lógico." : "Buen intento: revisen las que fallaron.";
      opts.innerHTML = "";
      fb.innerHTML = `<div class="score"><svg viewBox="0 0 120 120"><circle class="bg" cx="60" cy="60" r="52"/><circle class="fg" cx="60" cy="60" r="52"/></svg><b>${score}/${Q.length}</b><button class="btn" id="qRestart">Repetir actividad</button></div>`;
      requestAnimationFrame(() => requestAnimationFrame(() => ($(".score .fg").style.strokeDashoffset = 326.7 * (1 - score / Q.length))));
      $("#qRestart").addEventListener("click", () => { qi = 0; score = 0; res.length = 0; render(); });
      if (score >= 4) sfx.ok();
      return;
    }
    num.textContent = `${String(qi + 1).padStart(2, "0")} / ${String(Q.length).padStart(2, "0")}`;
    qEl.textContent = Q[qi][0];
    qEl.classList.remove("swap"); void qEl.offsetWidth; qEl.classList.add("swap");
    opts.innerHTML = K.map(k => `<button class="opt" style="--gc:var(--c-${k})" data-g="${k}">${gateSymbol(k, k === "not" ? [0] : [0, 0], 0)}${k.toUpperCase()}</button>`).join("");
    fb.innerHTML = "";
  };
  opts.addEventListener("click", e => {
    const b = e.target.closest(".opt");
    if (!b || b.disabled) return;
    const [, ans, why] = Q[qi], ok = b.dataset.g === ans;
    if (ok) { score++; sparks(b); sfx.ok(); } else sfx.bad();
    res[qi] = ok;
    $$(".opt", opts).forEach(o => {
      o.disabled = true;
      if (o.dataset.g === ans) {
        o.classList.add("right");
        const k = o.dataset.g, ins = k === "not" ? [0] : [1, 0];
        o.querySelector(".sym").outerHTML = gateSymbol(k, ins, GATE_FN[k](ins));
      } else o.classList.add(o === b ? "wrong" : "fade");
    });
    fb.innerHTML = `<p><span class="${ok ? "yes" : "no"}">${ok ? "Correcto." : `Es ${ans.toUpperCase()}.`}</span> ${why}</p><button class="btn solid" id="qNext">${qi === Q.length - 1 ? "Ver resultado" : "Siguiente situación"}</button>`;
    $("#qNext").addEventListener("click", () => { qi++; render(); });
    $("#qNext").focus({ preventScroll: true });
    paintDots();
  });
  render();
}

/* ============ clics en interruptores, contactos y acciones ============ */
document.addEventListener("click", e => {
  const t = e.target.closest("[data-toggle],[data-var],[data-act]");
  if (!t) return;
  const sc = scopes[t.closest("[data-scope]")?.dataset.scope];
  if (!sc) return;
  if (t.dataset.act) sc.action?.(t.dataset.act);
  else sc.toggle?.(t.dataset.toggle || t.dataset.var);
});
document.addEventListener("click", e => {
  if (e.target.closest(".ex,.pop")) return;
  $$(".pop.open").forEach(p => { p.classList.remove("open"); $$(".ex", p.parentNode).forEach(x => x.setAttribute("aria-expanded", "false")); });
});

/* ============ presentación ============ */
const slides = $$(".slide");
const total = slides.length;
let idx = -1, anim = null, navCount = 0;
$$(".split").forEach(splitText);
slides.forEach((s, i) => {
  s.inert = true;
  s.setAttribute("aria-roledescription", "diapositiva");
  $$("[data-a]", s).forEach((el, k) => el.style.setProperty("--i", k));
  if (!s.dataset.scope && s.classList.contains("s-bridge")) s.dataset.scope = "bridge";
  if (s.classList.contains("s-cover")) s.dataset.scope = "cover";
});
$("#segs").innerHTML = slides.map(() => "<i></i>").join("");
$("#overviewList").innerHTML = slides.map((s, i) => `<li style="--k:${i}"><button data-go="${i}" style="--gc:${s.style.getPropertyValue("--gc") || "var(--hot)"}"><span>${String(i + 1).padStart(2, "0")}</span>${s.dataset.title}</button></li>`).join("");

/* Transición entre diapositivas.
   Con View Transitions: las partes que existen en ambas diapositivas (etiqueta,
   nombre de la compuerta, historia, ficha, escenario, panel lógico, controles)
   viajan a su nueva posición; el resto de la escena se desliza como un panel.
   Sin soporte, se usa el deslizamiento con WAAPI. */
const CAN_VT = typeof document.startViewTransition === "function";
const VT_PARTS = [[".chip", "vt-chip"], [".g-name", "vt-name"], [".g-story", "vt-story"], [".g-card", "vt-card"],
  [".stage", "vt-stage"], [".logic", "vt-logic"], [".controls", "vt-controls"], [".g-more", "vt-more"]];
let vt = null;

function activate(n, from, to) {
  idx = n;
  $$(".pop.open").forEach(p => p.classList.remove("open"));
  to.inert = false;
  to.scrollTop = 0;
  to.classList.add("is-active");
  scopes[to.dataset.scope]?.enter?.();
  document.documentElement.style.setProperty("--gc", getComputedStyle(to).getPropertyValue("--gc"));
  $$("#segs i").forEach((s, i) => { s.className = i < n ? "past" : i === n ? "cur" : ""; });
  $("#dockNum").textContent = String(n + 1).padStart(2, "0");
  $("#dockTitle").textContent = to.dataset.title;
  $("#notesTitle").textContent = `Notas · ${String(n + 1).padStart(2, "0")} ${to.dataset.title}`;
  $("#notesText").textContent = to.dataset.notes || "";
  $("#btnPrev").disabled = n === 0;
  $("#btnNext").disabled = n === total - 1;
  $$("#overviewList button").forEach((b, i) => b.setAttribute("aria-current", i === n));
  document.documentElement.dataset.slide = n;
  history.replaceState(null, "", "#" + (n + 1));
  if (!from) return;
  from.classList.remove("is-active");
  from.inert = true;
  $$("[data-vt-shared]", from).forEach(e => e.removeAttribute("data-vt-shared"));
  if (++navCount > 2) $("#keys").classList.add("gone");
  if (typeof presTimer !== "undefined") presTimer.onSlide(n);
}

function railPulse() {
  $("#railPulse").animate([{ transform: "translateY(-140px)", opacity: 0 }, { opacity: 1, offset: .15 }, { opacity: 1, offset: .8 }, { transform: `translateY(${innerHeight}px)`, opacity: 0 }],
    { duration: 900, easing: "cubic-bezier(0.77, 0, 0.175, 1)" });
}

function go(n, instant) {
  n = clamp(n, 0, total - 1);
  if (n === idx) return;
  if (anim) anim.finish();
  vt?.skipTransition();
  const from = slides[idx], to = slides[n], dir = n > idx ? 1 : -1;
  const title = $("#dockTitle");

  if (from && !instant && !REDUCED.matches && CAN_VT) {
    const shared = VT_PARTS.filter(([s]) => $(s, from) && $(s, to));
    const root = document.documentElement;
    const type = to.dataset.trans || (shared.length >= 3 ? "quiet" : "push");
    root.dataset.vtt = type;
    root.dataset.vtd = dir;
    root.style.setProperty("--vtd", dir);
    root.style.setProperty("--irx", dir > 0 ? "3%" : "97%");
    shared.forEach(([s, name]) => ($(s, from).style.viewTransitionName = name));
    if (type === "blackout") sfx.clack(); else sfx.whoosh();
    if (type !== "blackout" && type !== "flash") railPulse();
    root.classList.add("vt-running");
    vt = document.startViewTransition(() => {
      shared.forEach(([s]) => ($(s, from).style.viewTransitionName = ""));
      activate(n, from, to);
      shared.forEach(([s, name]) => { const e = $(s, to); e.style.viewTransitionName = name; e.setAttribute("data-vt-shared", ""); });
    });
    const t = vt;
    t.finished.finally(() => {
      shared.forEach(([s]) => { const e = $(s, to); if (e) e.style.viewTransitionName = ""; });
      if (vt === t) { vt = null; document.documentElement.classList.remove("vt-running"); }
    });
    return;
  }

  activate(n, from, to);
  if (!from || instant) return;
  if (REDUCED.matches) {
    from.classList.add("is-out");
    const a = to.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: "ease-out" });
    anim = { finish() { a.finish(); } };
    a.onfinish = () => { from.classList.remove("is-out"); anim = null; };
    return;
  }
  from.classList.add("is-out");
  to.classList.add("moving");
  to.dataset.dir = dir;
  sfx.whoosh();
  railPulse();
  const E = "cubic-bezier(0.77, 0, 0.175, 1)", D = 850;
  const a1 = to.animate([{ transform: `translate3d(${dir * 100}%,0,0)` }, { transform: "translate3d(0,0,0)" }], { duration: D, easing: E });
  const a2 = from.animate([{ transform: "none", opacity: 1, filter: "brightness(1)" }, { transform: `translate3d(${-dir * 30}%,0,0) scale(.9)`, opacity: 0.25, filter: "brightness(.45)" }], { duration: D, easing: E });
  title.animate([{ opacity: 0, transform: `translateX(${dir * 12}px)`, filter: "blur(4px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }], { duration: 420, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
  let done = false;
  const finish = () => { if (done) return; done = true; from.classList.remove("is-out"); to.classList.remove("moving"); anim = null; };
  anim = { finish() { a1.finish(); a2.finish(); finish(); } };
  a1.onfinish = finish;
}
const next = () => go(idx + 1), prev = () => go(idx - 1);

function toggleOverview(force) {
  const o = $("#overview"), open = force ?? !o.classList.contains("open");
  o.classList.toggle("open", open);
  $("#btnOverview").setAttribute("aria-pressed", open);
  if (open) $(`[data-go="${idx}"]`)?.focus({ preventScroll: true });
}
function toggleNotes(force) {
  const o = $("#notes"), open = force ?? !o.classList.contains("open");
  o.classList.toggle("open", open);
  $("#btnNotes").setAttribute("aria-pressed", open);
}
function toggleSound() {
  const on = sfx.toggle();
  const b = $("#btnSound");
  b.setAttribute("aria-pressed", on);
  $(".wave", b).style.display = on ? "" : "none";
  $(".mute", b).style.display = on ? "none" : "";
}
function toggleFull() {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else document.documentElement.requestFullscreen?.().catch(() => {});
}
$("#overviewList").addEventListener("click", e => { const b = e.target.closest("[data-go]"); if (b) { toggleOverview(false); go(+b.dataset.go); } });
$("#btnNext").addEventListener("click", next);
$("#btnPrev").addEventListener("click", prev);
$("#btnNotes").addEventListener("click", () => toggleNotes());
$("#btnOverview").addEventListener("click", () => toggleOverview());
$("#btnSound").addEventListener("click", toggleSound);
$("#btnFull").addEventListener("click", toggleFull);

document.addEventListener("keydown", e => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const t = e.target, field = t.matches?.("input,textarea,select"), pressable = t.matches?.("button,a,[role=button],[role=tab]");
  const ovOpen = $("#overview").classList.contains("open");
  switch (e.key) {
    case "ArrowRight": case "PageDown": if (field || ovOpen) return; e.preventDefault(); next(); break;
    case "ArrowLeft": case "PageUp": if (field || ovOpen) return; e.preventDefault(); prev(); break;
    case " ": if (field || pressable || ovOpen) return; e.preventDefault(); e.shiftKey ? prev() : next(); break;
    case "Home": if (field) return; e.preventDefault(); go(0); break;
    case "End": if (field) return; e.preventDefault(); go(total - 1); break;
    case "n": case "N": if (!field) toggleNotes(); break;
    case "o": case "O": if (!field) toggleOverview(); break;
    case "s": case "S": if (!field) toggleSound(); break;
    case "f": case "F": if (!field) toggleFull(); break;
    case "Escape": toggleOverview(false); toggleNotes(false); break;
  }
});

/* deslizar en táctiles */
{
  let sx = 0, sy = 0, st = 0, on = false;
  const deck = $("#deck");
  deck.addEventListener("touchstart", e => {
    on = e.touches.length === 1 && !e.target.closest("input,[data-hold],.scene");
    if (!on) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = performance.now();
  }, { passive: true });
  deck.addEventListener("touchend", e => {
    if (!on) return;
    on = false;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    const fast = Math.abs(dx) / (performance.now() - st) > 0.5;
    if (Math.abs(dx) > Math.abs(dy) * 1.6 && (Math.abs(dx) > 70 || (fast && Math.abs(dx) > 30))) dx < 0 ? next() : prev();
  }, { passive: true });
}

/* ocultar el dock si el mouse está quieto */
{
  let tm;
  const dock = $("#dock");
  const wake = () => {
    document.body.classList.remove("idle");
    clearTimeout(tm);
    tm = setTimeout(() => {
      if (dock.matches(":hover") || dock.contains(document.activeElement) || $("#notes").classList.contains("open") || $("#overview").classList.contains("open")) return wake();
      if (matchMedia("(hover: hover) and (pointer: fine)").matches) document.body.classList.add("idle");
    }, 3500);
  };
  ["pointermove", "pointerdown", "keydown"].forEach(ev => addEventListener(ev, wake, { passive: true }));
  wake();
}

/* pantalla completa: la barra de abajo se retira y vuelve al bajar el mouse */
{
  const body = document.body, dock = $("#dock");
  const BAND = 120;                     /* franja sensible del borde inferior */
  const fine = () => matchMedia("(hover: hover) and (pointer: fine)").matches;
  /* el foco solo la retiene si se llegó con el teclado: tras un clic el botón
     conserva el foco y la barra se quedaba pegada al cambiar de diapositiva */
  const kb = () => { const a = document.activeElement; return dock.contains(a) && a.matches?.(":focus-visible"); };
  const held = () => dock.matches(":hover") || kb()
    || $("#notes").classList.contains("open") || $("#overview").classList.contains("open");
  let py = -1;                          /* última posición vertical del puntero */
  const near = () => body.classList.toggle("dock-near", (py > innerHeight - BAND && py >= 0) || held());
  addEventListener("pointermove", e => { py = e.clientY; if (body.classList.contains("fs")) near(); }, { passive: true });
  addEventListener("focusin", () => { if (body.classList.contains("fs") && held()) body.classList.add("dock-near"); });
  document.addEventListener("fullscreenchange", () => {
    const on = !!document.fullscreenElement && fine();
    body.classList.toggle("fs", on);
    on ? near() : body.classList.remove("dock-near");
    $("#btnFull").setAttribute("aria-pressed", !!document.fullscreenElement);
  });
}

/* bucle: solo simula la diapositiva visible */
{
  let last = performance.now();
  const loop = now => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const sc = scopes[slides[idx]?.dataset.scope];
    sc?.tick?.(dt);
    sfx.hum(sc?.level || 0);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

addEventListener("hashchange", () => go((parseInt(location.hash.slice(1), 10) || 1) - 1));
go((parseInt(location.hash.slice(1), 10) || 1) - 1, true);

/* la banda de la tabla se recoloca si cambia la tipografía o el tamaño */
(document.fonts?.ready || Promise.resolve()).then(() => GATES.forEach(g => scopes[g.id].placeRow()));
addEventListener("resize", () => GATES.forEach(g => scopes[g.id].placeRow()), { passive: true });

/* rótulos grabados: una placa detrás de cada nombre de componente centrado */
(document.fonts?.ready || Promise.resolve()).then(() => {
  $$(".scene text.lbl[text-anchor='middle']:not(.dim):not([id])").forEach(t => {
    if (t.closest(".gin") || t.classList.contains("warn-t") || t.classList.contains("ft")) return;
    t.classList.add("on-plate");
    const b = t.getBBox();
    if (!b.width) return t.classList.remove("on-plate");
    const r = document.createElementNS(SVGNS, "rect");
    r.setAttribute("class", "plate-t");
    r.setAttribute("x", f1(b.x - 5)); r.setAttribute("y", f1(b.y - 2.5));
    r.setAttribute("width", f1(b.width + 10)); r.setAttribute("height", f1(b.height + 5));
    r.setAttribute("rx", 2);
    t.before(r);
  });
});
