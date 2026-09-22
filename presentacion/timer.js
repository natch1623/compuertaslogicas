"use strict";
/* Cronómetro de la presentación: arranca al pasar a la diapositiva 2 */
const presTimer = (() => {
  const KEY = "compuertas-cronometro";
  const LIMITS = [30, 40, 45, 50, 60];
  const box = $("#timerbox"), pill = $("#tpill"), menu = $("#tmenu"), toast = $("#ttoast");
  let st = { started: false, acc: 0, runFrom: null, limit: 45, fired: [] };
  try { Object.assign(st, JSON.parse(localStorage.getItem(KEY)) || {}); } catch {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch {} };

  const elapsed = () => st.acc + (st.runFrom ? Date.now() - st.runFrom : 0);
  const fmt = ms => {
    const s = Math.floor(Math.abs(ms) / 1000), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = s % 60;
    return (h ? h + ":" + String(m).padStart(2, "0") : String(m).padStart(2, "0")) + ":" + String(ss).padStart(2, "0");
  };
  let toastT;
  const say = msg => {
    toast.textContent = msg;
    document.documentElement.style.setProperty("--tw", pill.offsetWidth + "px");
    toast.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove("show"), 5000);
    sfx.alarm();
  };

  function paint() {
    const e = elapsed(), lim = st.limit * 60000, p = e / lim;
    const state = !st.started ? "idle" : e > lim ? "over" : !st.runFrom ? "paused" : p >= 0.8 ? "warn" : "run";
    pill.dataset.state = state;
    box.dataset.state = state;
    $("#tnow").textContent = e > lim ? "+" + fmt(e - lim) : fmt(e);
    $("#tlim").textContent = "/ " + fmt(lim);
    $("#tbarI").style.transform = `scaleX(${Math.min(1, p).toFixed(4)})`;
    $("#tpause").textContent = st.runFrom || !st.started ? "Pausar" : "Reanudar";
    $("#tpause").disabled = !st.started;
    $("#timer").textContent = fmt(e) + " / " + fmt(lim);
    pill.setAttribute("aria-label", `Cronómetro: ${fmt(e)} de ${st.limit} minutos${state === "paused" ? ", en pausa" : ""}`);
    if (st.started && st.runFrom) {
      const left = lim - e;
      if (left <= 5 * 60000 && left > 60000 && !st.fired.includes(5)) { st.fired.push(5); save(); say("Quedan 5 minutos"); }
      if (left <= 60000 && left > 0 && !st.fired.includes(1)) { st.fired.push(1); save(); say("Queda 1 minuto"); }
      if (left <= 0 && !st.fired.includes(0)) { st.fired.push(0); save(); say(`Se cumplió el tiempo límite (${st.limit} min)`); }
    }
  }

  const start = () => { if (st.started) return; st.started = true; st.acc = 0; st.runFrom = Date.now(); st.fired = []; save(); paint(); };
  const pause = () => {
    if (!st.started) return;
    if (st.runFrom) { st.acc += Date.now() - st.runFrom; st.runFrom = null; }
    else st.runFrom = Date.now();
    save(); paint(); sfx.click();
  };
  const reset = () => { st.started = false; st.acc = 0; st.runFrom = null; st.fired = []; save(); paint(); sfx.click(); };
  const setLimit = m => {
    st.limit = m;
    const left = m * 60000 - elapsed();
    st.fired = [5, 1, 0].filter(k => left <= k * 60000);
    save(); paint(); sfx.click();
    $$("#tlims button").forEach(b => b.setAttribute("aria-pressed", +b.dataset.min === m));
    $("#tmin").value = m;
    $("#terr").textContent = "";
    $("#tmin").removeAttribute("aria-invalid");
  };

  $("#tlims").innerHTML = LIMITS.map(m => `<button data-min="${m}" aria-pressed="${m === st.limit}">${m}</button>`).join("");
  $("#tlims").addEventListener("click", e => { const b = e.target.closest("[data-min]"); if (b) setLimit(+b.dataset.min); });
  $("#tmin").value = st.limit;
  $("#tcustom").addEventListener("submit", e => {
    e.preventDefault();
    const inp = $("#tmin"), m = Number(inp.value);
    if (!inp.value.trim() || !Number.isInteger(m) || m < 1 || m > 240) {
      $("#terr").textContent = "Escribe minutos enteros entre 1 y 240.";
      inp.setAttribute("aria-invalid", "true");
      inp.focus();
      sfx.bad();
      return;
    }
    setLimit(m);
    inp.blur();
  });
  $("#tpause").addEventListener("click", pause);
  $("#treset").addEventListener("click", reset);
  const openMenu = open => {
    menu.classList.toggle("open", open);
    pill.setAttribute("aria-expanded", open);
  };
  pill.addEventListener("click", e => { e.stopPropagation(); openMenu(!menu.classList.contains("open")); });
  menu.addEventListener("click", e => e.stopPropagation());
  document.addEventListener("click", () => openMenu(false));
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") openMenu(false);
    if ((e.key === "t" || e.key === "T") && !e.altKey && !e.ctrlKey && !e.metaKey && !e.target.matches?.("input,textarea,select")) pause();
  });

  paint();
  setInterval(paint, 250);
  return { onSlide(n) { if (n >= 1) start(); } };
})();
