"use strict";
/* Vista «Compuertas»: diagrama lógico en vivo y ecuación booleana con sustitución */
const LG = {};
{
  const VW = 620, LX = 580;
  const B = v => (v ? 1 : 0);
  const vb = v => `<i class="${v ? "b1" : "b0"}">${B(v)}</i>`;
  const res = v => `<b class="res${v ? " on" : ""}">${B(v)}</b>`;
  const ovs = s => `<tspan style="text-decoration:overline">${s}</tspan>`;

  const place = (kind, x, y, ins, out, s = 1) => {
    const n = ins.length, ys = n === 1 ? [40] : n === 2 ? [25, 55] : [22, 40, 58];
    return {
      svg: `<g transform="translate(${x} ${y}) scale(${s})">${gateInner(kind, ins.map(B), B(out))}</g>`,
      pin: ys.map(yy => [x + 2 * s, y + yy * s]),
      out: [x + 132 * s, y + 40 * s]
    };
  };
  const wire = (p, q, hot, mx) => {
    const m = mx ?? (p[0] + q[0]) / 2;
    const d = Math.abs(p[1] - q[1]) < 0.5 ? `M${f1(p[0])} ${f1(p[1])}H${f1(q[0])}` : `M${f1(p[0])} ${f1(p[1])}H${f1(m)}V${f1(q[1])}H${f1(q[0])}`;
    return `<path class="w${hot ? " hot" : ""}" d="${d}"/>`;
  };
  const path = (d, hot) => `<path class="w${hot ? " hot" : ""}" d="${d}"/>`;
  const jn = (x, y, hot) => `<circle class="jn${hot ? " hot" : ""}" cx="${x}" cy="${y}" r="4.5"/>`;
  const net = (x, y, txt, on) => `<text class="net${on ? " on" : ""}" x="${x}" y="${y}">${txt}</text>`;
  const inNode = (name, v, y, click) =>
    `<g class="gin"${click ? ` data-var="${name}"` : ""}><rect class="hit" x="0" y="${f1(y - 20)}" width="64" height="40" rx="8"/><text x="6" y="${f1(y + 5)}">${name}</text><text class="bit${v ? " on" : ""}" x="${6 + name.length * 9.5 + 4}" y="${f1(y + 5)}">${B(v)}</text><circle class="pin${v ? " hot" : ""}" cx="58" cy="${f1(y)}" r="5.5"/></g>`;
  const outNode = (name, v, p) =>
    wire(p, [LX - 15, p[1]], v) + `<circle class="lampo${v ? " on" : ""}" cx="${LX}" cy="${f1(p[1])}" r="14"/><text class="gout" x="${LX}" y="${f1(p[1] + 36)}">${name} = ${B(v)}</text>`;
  const svg = (h, body) => `<svg class="gd" viewBox="0 0 ${VW} ${h}" aria-hidden="true">${body}</svg>`;

  /* símbolo único, 1 a 3 entradas */
  const symbol = (kind, names, v, out, click) => {
    const ins = names.map(n => B(v[n])), y = GATE_FN[kind](ins), n = names.length;
    const g = place(kind, 250, 45, ins, y, 1.5);
    const iy = n === 1 ? [g.pin[0][1]] : n === 2 ? [70, 150] : [45, 105, 165];
    let s = "";
    names.forEach((nm, i) => (s += wire([63.5, iy[i]], g.pin[i], ins[i], 170) + inNode(nm, ins[i], iy[i], click)));
    return svg(215, s + g.svg + outNode(out, y, g.out));
  };

  /* cascada de dos compuertas de 2 entradas (AND / OR de 3 entradas) */
  const cascade = (kind, names, v, out, click, sym) => {
    const [a, b, c] = names.map(n => B(v[n]));
    const ab = GATE_FN[kind]([a, b]), y = GATE_FN[kind]([ab, c]);
    const g1 = place(kind, 170, 25, [a, b], ab, 1.2), g2 = place(kind, 360, 95, [ab, c], y, 1.2);
    let s = wire([63.5, g1.pin[0][1]], g1.pin[0], a) + inNode(names[0], a, g1.pin[0][1], click)
      + wire([63.5, g1.pin[1][1]], g1.pin[1], b) + inNode(names[1], b, g1.pin[1][1], click)
      + wire([63.5, g2.pin[1][1]], g2.pin[1], c) + inNode(names[2], c, g2.pin[1][1], click)
      + wire(g1.out, g2.pin[0], ab, 340) + net(g1.out[0] + 8, g1.out[1] - 10, `${names[0]}${sym}${names[1]}`, ab);
    return svg(215, s + g1.svg + g2.svg + outNode(out, y, g2.out));
  };

  /* AND/OR seguido de NOT */
  const inverted = (base, names, v, out, click, sym) => {
    const ins = names.map(n => B(v[n])), mid = GATE_FN[base](ins), y = !mid, n = names.length;
    const g1 = place(base, 160, 55, ins, mid, 1.2), g2 = place("not", 350, 55, [mid], y, 1.2);
    const iy = n === 2 ? [80, 136] : [50, 103, 156];
    let s = "";
    names.forEach((nm, i) => (s += wire([63.5, iy[i]], g1.pin[i], ins[i], 120) + inNode(nm, ins[i], iy[i], click)));
    s += wire(g1.out, g2.pin[0], mid) + net(g1.out[0] + 2, g1.out[1] - 12, names.join(sym), mid);
    return svg(215, s + g1.svg + g2.svg + outNode(out, y, g2.out));
  };

  const modes2 = ["Símbolo", "2 entradas"];

  LG.and = {
    modes: modes2,
    eq: (v, y) => row("Ecuación", "M = A · B · C") + row("Agrupada", "M = (A · B) · C", "alt") + row("Ahora", `M = ${vb(v.A)} · ${vb(v.B)} · ${vb(v.C)} = ${res(y)}`, "live"),
    draw: (v, m, c) => (m ? cascade("and", ["A", "B", "C"], v, "M", c, "·") : symbol("and", ["A", "B", "C"], v, "M", c))
  };
  LG.or = {
    modes: modes2,
    eq: (v, y) => row("Ecuación", "P = E1 + E2 + E3") + row("Agrupada", "P = (E1 + E2) + E3", "alt") + row("Ahora", `P = ${vb(v.E1)} + ${vb(v.E2)} + ${vb(v.E3)} = ${res(y)}`, "live"),
    draw: (v, m, c) => (m ? cascade("or", ["E1", "E2", "E3"], v, "P", c, "+") : symbol("or", ["E1", "E2", "E3"], v, "P", c))
  };
  LG.not = {
    eq: (v, y) => row("Ecuación", `B = ${ov("LSH")}`) + row("Se lee", "B es la negación de LSH", "alt") + row("Ahora", `B = ${ov(vb(v.LSH))} = ${res(y)}`, "live"),
    draw: v => symbol("not", ["LSH"], v, "B", false)
  };
  LG.nand = {
    modes: ["Símbolo", "AND + NOT"],
    eq: (v, y) => row("Ecuación", `D = ${ov("F1 · F2")}`) + row("De Morgan", `D = ${ov("F1")} + ${ov("F2")}`, "alt")
      + row("Ahora", `D = ${ov(vb(v.F1) + " · " + vb(v.F2))} = ${ov(vb(v.F1 && v.F2))} = ${res(y)}`, "live"),
    draw: (v, m, c) => (m ? inverted("and", ["F1", "F2"], v, "D", c, "·") : symbol("nand", ["F1", "F2"], v, "D", c))
  };
  LG.nor = {
    modes: ["Símbolo", "OR + NOT"],
    eq: (v, y) => row("Ecuación", `L = ${ov("A1 + A2 + A3")}`) + row("De Morgan", `L = ${ov("A1")} · ${ov("A2")} · ${ov("A3")}`, "alt")
      + row("Ahora", `L = ${ov(vb(v.A1) + " + " + vb(v.A2) + " + " + vb(v.A3))} = ${ov(vb(v.A1 || v.A2 || v.A3))} = ${res(y)}`, "live"),
    draw: (v, m, c) => (m ? inverted("or", ["A1", "A2", "A3"], v, "L", c, "+") : symbol("nor", ["A1", "A2", "A3"], v, "L", c))
  };

  /* XOR con básicas: Y = A·B̅ + A̅·B */
  LG.xor = {
    modes: ["Símbolo", "Con básicas"],
    eq: (v, y) => {
      const a = B(v.A), b = B(v.B), t1 = a && !b, t2 = !a && b;
      return row("Ecuación", "Y = A ⊕ B") + row("Expandida", `Y = A · ${ov("B")} + ${ov("A")} · B`, "alt")
        + row("Ahora", `Y = ${vb(a)} · ${vb(!b)} + ${vb(!a)} · ${vb(b)} = ${vb(t1)} + ${vb(t2)} = ${res(y)}`, "live");
    },
    draw: (v, m, c) => {
      if (!m) return symbol("xor", ["A", "B"], v, "Y", c);
      const a = B(v.A), b = B(v.B), na = !a, nb = !b, t1 = a && nb, t2 = na && b, y = t1 || t2;
      const nB = place("not", 100, 50, [b], nb), nA = place("not", 100, 160, [a], na);
      const g1 = place("and", 250, 25, [a, nb], t1), g2 = place("and", 250, 175, [na, b], t2), o = place("or", 400, 100, [t1, t2], y);
      let s = path("M63.5 50H252", a) + jn(80, 50, a) + path("M80 50V200H102", a)
        + path("M63.5 250H200V230H252", b) + jn(95, 250, b) + path("M95 250V90H102", b)
        + wire(nB.out, g1.pin[1], nb, 242) + wire(nA.out, g2.pin[0], na, 242)
        + wire(g1.out, o.pin[0], t1) + wire(g2.out, o.pin[1], t2)
        + net(236, 116, `${ovs("B")}`, nb) + net(236, 226, `${ovs("A")}`, na)
        + net(386, 56, `A·${ovs("B")}`, t1) + net(386, 238, `${ovs("A")}·B`, t2)
        + inNode("A", a, 50, c) + inNode("B", b, 250, c);
      return svg(280, s + nB.svg + nA.svg + g1.svg + g2.svg + o.svg + outNode("Y", y, o.out));
    }
  };

  /* XNOR con básicas: Y = G·R + G̅·R̅ */
  LG.xnor = {
    modes: ["Símbolo", "Con básicas"],
    eq: (v, y) => {
      const g = B(v.G), r = B(v.R), t1 = g && r, t2 = !g && !r;
      return row("Ecuación", `Y = ${ov("G ⊕ R")}`) + row("Expandida", `Y = G · R + ${ov("G")} · ${ov("R")}`, "alt")
        + row("Ahora", `Y = ${vb(g)} · ${vb(r)} + ${vb(!g)} · ${vb(!r)} = ${vb(t1)} + ${vb(t2)} = ${res(y)}`, "live");
    },
    draw: (v, m, c) => {
      if (!m) return symbol("xnor", ["G", "R"], v, "Y", c);
      const g = B(v.G), r = B(v.R), ng = !g, nr = !r, t1 = g && r, t2 = ng && nr, y = t1 || t2;
      const nG = place("not", 110, 150, [g], ng), nR = place("not", 110, 235, [r], nr);
      const g1 = place("and", 260, 15, [g, r], t1), g2 = place("and", 260, 215, [ng, nr], t2), o = place("or", 410, 110, [t1, t2], y);
      let s = path("M63.5 40H262", g) + jn(80, 40, g) + path("M80 40V190H112", g)
        + path("M63.5 110H210V70H262", r) + jn(95, 110, r) + path("M95 110V275H112", r)
        + wire(nG.out, g2.pin[0], ng, 250) + wire(nR.out, g2.pin[1], nr, 250)
        + wire(g1.out, o.pin[0], t1) + wire(g2.out, o.pin[1], t2)
        + net(396, 46, "G·R", t1) + net(396, 282, `${ovs("G")}·${ovs("R")}`, t2)
        + inNode("G", g, 40, c) + inNode("R", r, 110, c);
      return svg(310, s + nG.svg + nR.svg + g1.svg + g2.svg + o.svg + outNode("Y", y, o.out));
    }
  };

  function row(label, code, cls = "") {
    return `<div class="eq-row ${cls}"><span class="lbl">${label}</span><code>${code}</code></div>`;
  }
}
