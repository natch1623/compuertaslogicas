"use strict";
/* ============ capa de agua: burbujas, destellos y ondas ============ */
{
  const h = document.getElementById("hydro"), R = (a, b) => a + Math.random() * (b - a);
  const star = '<svg viewBox="0 0 20 20"><path d="M10 0C11 7 13 9 20 10C13 11 11 13 10 20C9 13 7 11 0 10C7 9 9 7 10 0Z"/></svg>';
  let html = "";
  for (let i = 0; i < 55; i++) {
    const s = i % 5 ? R(8, 40) : R(44, 90);
    html += `<i class="bub" style="left:${R(0, 100).toFixed(1)}%;width:${s.toFixed(0)}px;height:${s.toFixed(0)}px;--d:${R(14, 30).toFixed(1)}s;--dl:${R(-30, 0).toFixed(1)}s;--sw:${R(-40, 40).toFixed(0)}px;--o:${R(.45, .9).toFixed(2)}"></i>`;
  }
  for (let i = 0; i < 42; i++)
    html += `<i class="sparkle${i % 3 ? "" : " w"}" style="left:${R(2, 98).toFixed(1)}%;top:${R(4, 92).toFixed(1)}%;--s:${R(7, 24).toFixed(0)}px;--d:${R(2.5, 5.5).toFixed(1)}s;--dl:${R(-5, 0).toFixed(1)}s">${star}</i>`;
  const wave = c => `<svg viewBox="0 0 1440 120" preserveAspectRatio="none"><path fill="${c}" d="M0 60C120 20 240 20 360 60S600 100 720 60 960 20 1080 60 1320 100 1440 60 1680 20 1800 60 2040 100 2160 60 2400 20 2520 60 2760 100 2880 60V120H0Z" transform="scale(.5 1)"/></svg>`;
  html += `<div class="waves">${wave("rgba(127,178,255,.28)")}${wave("rgba(62,123,250,.18)")}</div>`;
  h.innerHTML = html;
}
GATES.forEach(buildGate);
const gateSlide = k => $$(".slide").indexOf($(`[data-gate="${k}"]`));
const KINDS = ["and", "or", "not", "nand", "nor", "xor", "xnor"];
const rnd = () => (Math.random() < .5 ? 1 : 0);

/* ============ portada: fila de compuertas con señales vivas ============ */
{
  const row = $("#gateRow");
  row.innerHTML = KINDS.map((k, i) => `<figure style="--gc:var(--c-${k});--sd:${i * 90}ms" data-k="${k}"><div class="gs">${gateSymbol(k, k === "not" ? [0] : [0, 0], GATE_FN[k](k === "not" ? [0] : [0, 0]), true)}</div><figcaption>${k.toUpperCase()}</figcaption></figure>`).join("");
  let t = 0, k = 0;
  scopes.cover = {
    tick(dt) {
      if ((t += dt) < 0.75) return;
      t = 0;
      const fig = row.children[k % 7], kind = KINDS[k % 7];
      const ins = kind === "not" ? [rnd()] : [rnd(), rnd()];
      $(".gs", fig).innerHTML = gateSymbol(kind, ins, GATE_FN[kind](ins));
      $$("figure", row).forEach(f => f.classList.toggle("flash", f === fig));
      k++;
    }
  };
}

/* ============ introducción: grupos de compuertas que llevan a su caso ============ */
{
  const sec = $('[data-scope="intro"]');
  $$(".g-items", sec).forEach(box => {
    box.innerHTML = box.dataset.ks.split(",").map(k => {
      const g = GATES.find(x => x.id === k);
      return `<button class="gi" style="--gc:var(--c-${k})" data-k="${k}"><div class="ps"></div><span><b>${k.toUpperCase()}</b><small>${g.title}</small></span></button>`;
    }).join("");
  });
  const items = $$(".gi", sec);
  const paint = (draw, random) => items.forEach((it, i) => {
    const k = it.dataset.k, ins = (k === "not" ? [0] : [0, 0]).map(() => (random ? rnd() : 0));
    $(".ps", it).innerHTML = gateSymbol(k, ins, GATE_FN[k](ins), draw);
    it.style.setProperty("--sd", i * 120 + "ms");
  });
  items.forEach(it => it.addEventListener("click", () => { sfx.click(); go(gateSlide(it.dataset.k)); }));
  let t = 0;
  scopes.intro = { enter() { t = -1.6; paint(true, false); }, tick(dt) { if ((t += dt) > 1.1) { t = 0; paint(false, true); } } };
  paint(true, false);
}

/* ============ cadena: pulsadores → compuerta → motor ============ */
{
  const v = { A: 0, B: 0 };
  let kind = "and";
  const pb = (x, k) => `<g class="pbx" data-pb="${k}"><rect class="metal" x="${x - 30}" y="40" width="60" height="62" rx="9"/><ellipse class="cap" cx="${x}" cy="66" rx="20" ry="9"/><rect class="steel" x="${x - 20}" y="72" width="40" height="8" rx="2"/><text x="${x}" y="30">${k}</text><text class="bit" x="${x}" y="130">0</text></g>`;
  $("#chIn").innerHTML = `<svg class="scene" style="height:auto" viewBox="0 0 200 150" role="img" aria-label="Dos pulsadores A y B">${pb(56, "A")}${pb(144, "B")}</svg>`;
  $("#chOut").innerHTML = `<svg class="scene" viewBox="0 0 200 150" role="img" aria-label="Motor con lámpara de marcha" style="height:auto">
    <rect class="steel" x="30" y="112" width="110" height="8" rx="2"/>
    <rect class="metal" x="34" y="56" width="100" height="56" rx="10"/>${fins(44, 124, 7, 62, 106)}
    <rect class="steel" x="134" y="78" width="16" height="12" rx="2"/>
    ${wheel(166, 84, 22, 4, "ch-rot")}
    ${lamp(58, 28, 9, "green", "ch-lamp")}<text class="lbl" x="74" y="32">MARCHA</text>
    <text class="yv" id="chY" x="100" y="144">Y = 0</text></svg>`;
  const rot = Rot($("#chOut"), "ch-rot", 166, 84);
  let w = 0;
  const sc = {
    update() {
      const ins = kind === "not" ? [v.A] : [v.A, v.B], y = GATE_FN[kind](ins) ? 1 : 0;
      $$("#chIn .pbx").forEach(g => {
        const k = g.dataset.pb, off = kind === "not" && k === "B";
        g.classList.toggle("on", !!v[k] && !off);
        g.style.opacity = off ? 0.25 : 1;
        $(".bit", g).textContent = v[k] && !off ? 1 : 0;
        $(".bit", g).classList.toggle("on", !!v[k] && !off);
      });
      const expr = kind === "and" ? "A · B" : kind === "or" ? "A + B" : "A′";
      $("#chGate").innerHTML = `<svg class="sym" viewBox="0 0 200 150" aria-hidden="true"><g transform="translate(20 10) scale(1.2)">${gateInner(kind, ins, y)}</g><text class="yv${y ? " on" : ""}" x="100" y="138">Y = ${expr} = ${y}</text></svg>`;
      $("#chA1").classList.toggle("on", ins.some(Boolean));
      $("#chA2").classList.toggle("on", !!y);
      $("#ch-lamp").classList.toggle("on", !!y);
      $("#chY").textContent = `Y = ${y}`;
      $("#chY").classList.toggle("on", !!y);
      sc.y = y;
    },
    enter() { sc.update(); },
    tick(dt) { w = approach(w, sc.y ? 3 : 0, sc.y ? 1.4 : 0.7, dt); spin(rot, w, dt); sc.level = w / 3; }
  };
  scopes.chain = sc;
  $("#chIn").addEventListener("click", e => {
    const g = e.target.closest("[data-pb]");
    if (!g || (kind === "not" && g.dataset.pb === "B")) return;
    v[g.dataset.pb] ^= 1; sfx.click();
    const prev = sc.y; sc.update(); if (prev !== sc.y) sfx.clack();
  });
  $$("[data-chg]").forEach(b => b.addEventListener("click", () => {
    kind = b.dataset.chg;
    $$("[data-chg]").forEach(x => x.setAttribute("aria-pressed", x === b));
    sfx.click(); sc.update();
  }));
  sc.update();
}

/* ============ resumen: una fila por caso ============ */
$("#sumBody").innerHTML = GATES.map((g, i) => `<tr style="--r:${i};--gc:${g.color}" data-goto="${g.id}" tabindex="0">
  <td><span class="gname">${gateSymbol(g.id, g.id === "not" ? [0] : [0, 0], 0)}${g.name}</span></td>
  <td><code>${g.expr}</code></td><td>${g.sumCond}</td><td>${g.sumApp}</td></tr>`).join("");
$$("#sumBody tr").forEach(tr => {
  const goTo = () => { sfx.click(); go(gateSlide(tr.dataset.goto)); };
  tr.addEventListener("click", goTo);
  tr.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); goTo(); } });
});

/* ============ conclusiones: pictogramas ============ */
{
  const cz = $$(".s-concl [data-cz]");
  cz[0].innerHTML = `<svg viewBox="0 0 170 74" aria-hidden="true"><text class="bit" x="16" y="44">0</text><text class="bit on" x="40" y="44">1</text><path d="M60 38H104M96 30L104 38L96 46" fill="none" stroke="#FFB020" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${lamp(134, 38, 14, "green", "cc-l")}</svg>`;
  cz[1].innerHTML = comboSymbol("and", "or", [1, 1, 0]);
  cz[2].innerHTML = `<svg viewBox="0 0 90 74" aria-hidden="true"><path d="M45 6L84 68H6Z" fill="rgba(240,70,78,.14)" stroke="#F0464E" stroke-width="3" stroke-linejoin="round"/><path d="M45 28V48M45 57V58" stroke="#F0464E" stroke-width="5" stroke-linecap="round"/></svg>`;
  $("#cc-l").classList.add("on");
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
