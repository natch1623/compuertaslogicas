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

  /* símbolo único, 1 a 2 entradas */
  const symbol = (kind, names, v, out, click) => {
    const ins = names.map(n => B(v[n])), y = GATE_FN[kind](ins), n = names.length;
    const g = place(kind, 250, 45, ins, y, 1.5);
    const iy = n === 1 ? [g.pin[0][1]] : [70, 150];
    let s = "";
    names.forEach((nm, i) => (s += wire([63.5, iy[i]], g.pin[i], ins[i], 170) + inNode(nm, ins[i], iy[i], click)));
    return svg(215, s + g.svg + outNode(out, y, g.out));
  };

  /* sistema mixto de dos etapas: X = k1(A, B) → Y = k2(X, C) */
  const twoStage = (k1, k2, v, click, netTxt) => {
    const a = B(v.A), b = B(v.B), c = B(v.C);
    const x = B(GATE_FN[k1]([a, b])), y = B(GATE_FN[k2]([x, c]));
    const g1 = place(k1, 170, 25, [a, b], x, 1.2), g2 = place(k2, 360, 95, [x, c], y, 1.2);
    let s = wire([63.5, g1.pin[0][1]], g1.pin[0], a) + inNode("A", a, g1.pin[0][1], click)
      + wire([63.5, g1.pin[1][1]], g1.pin[1], b) + inNode("B", b, g1.pin[1][1], click)
      + wire([63.5, g2.pin[1][1]], g2.pin[1], c) + inNode("C", c, g2.pin[1][1], click)
      + wire(g1.out, g2.pin[0], x, 340) + net(g1.out[0] + 8, g1.out[1] - 10, netTxt, x)
      + `<text class="stg" x="${f1(g1.out[0] - 80)}" y="14">etapa 1 · ${k1.toUpperCase()}</text>`
      + `<text class="stg" x="${f1(g2.out[0] - 80)}" y="84">etapa 2 · ${k2.toUpperCase()}</text>`;
    return svg(215, s + g1.svg + g2.svg + outNode("Y", y, g2.out));
  };

  /* ecuación: tres filas (expresión, por etapas, sustitución en vivo) */
  const mixed = (k1, k2, netTxt, expr, stages, live) => ({
    eq: (v, y) => {
      const a = B(v.A), b = B(v.B), c = B(v.C), x = B(GATE_FN[k1]([a, b]));
      return row("Ecuación", expr) + row("Por etapas", stages, "alt") + row("Ahora", live(vb(a), vb(b), vb(c), vb(x), res(y)), "live");
    },
    draw: (v, m, c) => twoStage(k1, k2, v, c, netTxt)
  });

  LG.and = mixed("and", "or", "A · B", "Y = (A · B) + C", "X = A · B  →  Y = X + C",
    (a, b, c, x, r) => `Y = (${a}·${b}) + ${c} = ${x} + ${c} = ${r}`);
  LG.or = mixed("or", "and", "A + B", "Y = (A + B) · C", "X = A + B  →  Y = X · C",
    (a, b, c, x, r) => `Y = (${a}+${b}) · ${c} = ${x} · ${c} = ${r}`);
  LG.nand = mixed("nand", "and", "(A · B)′", "Y = (A · B)′ · C", "X = (A · B)′  →  Y = X · C",
    (a, b, c, x, r) => `Y = (${a}·${b})′ · ${c} = ${x} · ${c} = ${r}`);
  LG.nor = mixed("nor", "xor", "(A + B)′", "Y = (A + B)′ ⊕ C", "X = (A + B)′  →  Y = X ⊕ C",
    (a, b, c, x, r) => `Y = (${a}+${b})′ ⊕ ${c} = ${x} ⊕ ${c} = ${r}`);
  LG.xnor = mixed("xnor", "nor", "A ⊙ B", "Y = ((A ⊙ B) + C)′", "X = A ⊙ B  →  Y = (X + C)′",
    (a, b, c, x, r) => `Y = ((${a}⊙${b}) + ${c})′ = (${x} + ${c})′ = ${r}`);

  LG.not = {
    eq: (v, y) => row("Ecuación", "Y = A′") + row("Se lee", "Y es el complemento de A", "alt") + row("Ahora", `Y = ${vb(v.A)}′ = ${res(y)}`, "live"),
    draw: v => symbol("not", ["A"], v, "Y", false)
  };

  /* XOR con básicas: Y = A·B′ + A′·B */
  LG.xor = {
    modes: ["Símbolo", "Con básicas"],
    eq: (v, y) => {
      const a = B(v.A), b = B(v.B), t1 = a && !b, t2 = !a && b;
      return row("Ecuación", "Y = A ⊕ B") + row("Expandida", "Y = A · B′ + A′ · B", "alt")
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

  function row(label, code, cls = "") {
    return `<div class="eq-row ${cls}"><span class="lbl">${label}</span><code>${code}</code></div>`;
  }
}

/* ficha: las dos etapas en miniatura */
function comboSymbol(k1, k2, ins, draw = false) {
  const [a, b, c] = ins, x = GATE_FN[k1]([a, b]) ? 1 : 0, y = GATE_FN[k2]([x, c]) ? 1 : 0;
  const pl = draw ? ' pathLength="1"' : "";
  return `<svg class="sym combo${draw ? " draw" : ""}" viewBox="0 0 232 92" aria-hidden="true">
    <g transform="translate(0 0) scale(.75)">${gateInner(k1, [a, b], x, draw)}</g>
    <path class="w${x ? " hot" : ""}"${pl} d="M99 30H110V40.8H121.5"/>
    <path class="w${c ? " hot" : ""}"${pl} d="M2 72H110V63.3H121.5"/>
    <g transform="translate(120 22) scale(.75)">${gateInner(k2, [x, c], y, draw)}</g>
  </svg>`;
}
