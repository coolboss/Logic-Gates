/* Live gate-level circuit diagrams.
 * A diagram is data (see LG.circuits below): inputs you can tap, gates, lamps and the wires between them.
 * Wires glow when they carry a 1, so you can watch a signal travel. */
(function () {
  'use strict';
  var LG = window.LG, E = window.LGE, el = LG.el;

  var SHAPES = {
    AND: 'M-24,-20 H0 A20,20 0 0 1 0,20 H-24 Z',
    OR: 'M-26,-20 C-8,-20 8,-16 22,0 C8,16 -8,20 -26,20 C-18,8 -18,-8 -26,-20 Z',
    NOT: 'M-20,-16 L14,0 L-20,16 Z'
  };
  var BASE = { AND: 'AND', NAND: 'AND', OR: 'OR', NOR: 'OR', XOR: 'OR', XNOR: 'OR', NOT: 'NOT', BUF: 'NOT' };
  var BUBBLE = { NAND: 25, NOR: 27, XNOR: 27, NOT: 19 };
  var TIP = { AND: 20, OR: 22, XOR: 22, BUF: 14 };

  function inPins(n) {
    var k = n.in.length, ys = k === 1 ? [0] : k === 2 ? [-10, 10] : [-13, 0, 13];
    if (n.t === 'out') return [[n.x - 13, n.y]];
    return ys.map(function (dy) { return [n.x - 34, n.y + dy]; });
  }
  function outPin(n) { return n.t === 'in' ? [n.x + 16, n.y] : [n.x + 34, n.y]; }

  LG.drawCircuit = function (def, onChange) {
    var c = new E.Circuit(def), byId = {};
    c.nodes.forEach(function (n) { byId[n.id] = n; });
    var svg = el('svg', { viewBox: '0 0 ' + def.w + ' ' + def.h, class: 'circuit', role: 'group', 'aria-label': def.label || 'Logic circuit' });
    var gWires = el('g'), gNodes = el('g'), wires = [], painters = [];
    svg.appendChild(gWires); svg.appendChild(gNodes);

    /* wires */
    var bySrc = {};
    c.nodes.forEach(function (n) {
      var pins = n.t === 'in' ? [] : inPins(n);
      n.in.forEach(function (w, k) {
        var s = outPin(byId[w.s]), t = pins[k], pts;
        if (w.via) pts = [s].concat(w.via, [t]);
        else {
          var mx = w.mx != null ? w.mx : Math.round((s[0] + t[0]) / 2);
          pts = s[1] === t[1] ? [s, t] : [s, [mx, s[1]], [mx, t[1]], t];
        }
        var rec = { src: w.s, pts: pts, auto: !w.via };
        (bySrc[w.s] = bySrc[w.s] || []).push(rec);
        wires.push(rec);
      });
    });
    wires.forEach(function (w) {
      w.path = el('path', { class: 'wire', d: 'M' + w.pts.map(function (p) { return p.join(','); }).join(' L') });
      gWires.appendChild(w.path);
    });
    /* junction dots where one source splits */
    var dots = (def.dots || []).map(function (d) { return { src: d[2], x: d[0], y: d[1] }; });
    Object.keys(bySrc).forEach(function (src) {
      var list = bySrc[src].filter(function (w) { return w.auto; });
      list.forEach(function (w) {
        if (w.pts.length < 4) return;
        var corner = w.pts[1], dir = Math.sign(w.pts[2][1] - corner[1]);
        var shared = list.some(function (o) {
          if (o === w) return false;
          if (o.pts.length < 4) return o.pts[1][0] > corner[0];
          return o.pts[1][0] > corner[0] || (o.pts[1][0] === corner[0] && Math.sign(o.pts[2][1] - o.pts[1][1]) !== dir);
        });
        if (shared) dots.push({ src: src, x: corner[0], y: corner[1] });
      });
    });
    dots.forEach(function (d) {
      d.node = el('circle', { class: 'wire-dot', cx: d.x, cy: d.y, r: 4 });
      gWires.appendChild(d.node);
    });

    /* nodes */
    c.nodes.forEach(function (n) {
      var g;
      if (n.t === 'in') {
        var txt = el('text', { class: 'pad-val', x: n.x, y: n.y + 6, 'text-anchor': 'middle' });
        g = el('g', { class: 'pad', tabindex: '0', role: 'switch', 'aria-label': 'Input ' + (n.label || n.id) }, [
          el('rect', { class: 'pad-hit', x: n.x - 24, y: n.y - 24, width: 48, height: 48 }),
          el('rect', { class: 'pad-box', x: n.x - 16, y: n.y - 16, width: 32, height: 32, rx: 7 }), txt,
          el('text', { class: 'c-label', x: n.x, y: n.y - 23, 'text-anchor': 'middle', text: n.label || n.id })]);
        var flip = function () { c.toggle(n.id); paint(); if (onChange) onChange(c); };
        g.addEventListener('click', flip);
        g.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } });
        painters.push(function () { txt.textContent = c.v[n.id]; g.setAttribute('aria-checked', c.v[n.id] ? 'true' : 'false'); });
      } else if (n.t === 'out') {
        g = el('g', { class: 'lamp' }, [
          el('circle', { class: 'lamp-glow', cx: n.x, cy: n.y, r: 20 }),
          el('circle', { class: 'lamp-body', cx: n.x, cy: n.y, r: 13 }),
          el('text', { class: 'lamp-val', x: n.x, y: n.y + 5, 'text-anchor': 'middle' }),
          el('text', { class: 'c-label', x: n.x, y: n.y - 23, 'text-anchor': 'middle', text: n.label || n.id })]);
        painters.push(function () { g.querySelector('.lamp-val').textContent = c.v[n.id]; });
      } else {
        var base = BASE[n.t], kids = [];
        inPins(n).forEach(function (p) { kids.push(el('line', { class: 'stub', x1: p[0], y1: p[1], x2: n.x - (base === 'OR' ? 19 : base === 'NOT' ? 20 : 24), y2: p[1] })); });
        var tip = BUBBLE[n.t] ? BUBBLE[n.t] + 5 : TIP[n.t];
        kids.push(el('line', { class: 'stub', x1: n.x + tip, y1: n.y, x2: n.x + 34, y2: n.y }));
        var body = el('g', { transform: 'translate(' + n.x + ',' + n.y + ')' }, [
          (n.t === 'XOR' || n.t === 'XNOR') ? el('path', { class: 'gate-extra', d: 'M-33,-20 C-25,-8 -25,8 -33,20' }) : null,
          el('path', { class: 'gate-body', d: SHAPES[base] }),
          BUBBLE[n.t] ? el('circle', { class: 'gate-body bubble', cx: BUBBLE[n.t], cy: 0, r: 5 }) : null,
          el('text', { class: 'gate-name', x: base === 'NOT' ? -9 : -3, y: 4, 'text-anchor': 'middle', text: n.t })]);
        kids.push(body);
        if (n.label) kids.push(el('text', { class: 'c-label small', x: n.x, y: n.y - 26, 'text-anchor': 'middle', text: n.label }));
        g = el('g', { class: 'gate' }, kids);
      }
      n.g = g;
      gNodes.appendChild(g);
    });
    (def.notes || []).forEach(function (t) {
      gNodes.appendChild(el('text', { class: 'c-note', x: t[0], y: t[1], 'text-anchor': t[3] || 'start', text: t[2] }));
    });

    function paint() {
      wires.forEach(function (w) { w.path.classList.toggle('on', !!c.v[w.src]); });
      dots.forEach(function (d) { d.node.classList.toggle('on', !!c.v[d.src]); });
      c.nodes.forEach(function (n) { n.g.classList.toggle('on', !!c.v[n.id]); });
      painters.forEach(function (f) { f(); });
    }
    paint();
    return { svg: svg, circuit: c, paint: paint };
  };

  /* widget: a circuit, optionally with its truth table and a live sentence */
  LG.widget('circuit', function (host, o) {
    var def = typeof o.c === 'string' ? LG.circuits[o.c] : o.c;
    var wrap = el('div', { class: 'circuit-wrap' });
    var say = o.say ? el('p', { class: 'live', 'aria-live': 'polite' }) : null;
    var table = null, rows = [];
    var view = LG.drawCircuit(def, update);
    /* small diagrams shrink to fit a phone; wide ones keep a readable size and scroll sideways */
    view.svg.style.minWidth = (def.w <= 440 ? 0 : 480) + 'px';
    view.svg.style.maxWidth = Math.round(def.w * 1.2) + 'px';
    wrap.appendChild(el('div', { class: 'scrollx grow', style: 'flex-basis:' + Math.min(def.w, 520) + 'px' }, view.svg));
    if (o.truth) {
      var outs = o.truth === true ? view.circuit.outputs().map(function (n) { return n.id; }) : o.truth;
      var ins = view.circuit.inputs();
      table = el('table', { class: 'tt' });
      table.appendChild(el('tr', {}, ins.map(function (n) { return el('th', { text: n.label || n.id }); })
        .concat(outs.map(function (id) { var n = view.circuit.nodes.filter(function (x) { return x.id === id; })[0]; return el('th', { class: 'out', text: n.label || id }); }))));
      E.circuitTable(def, outs).forEach(function (r) {
        var tr = el('tr', {}, r.ins.map(function (v) { return el('td', { text: v }); })
          .concat(r.outs.map(function (v) { return el('td', { class: 'out' + (v ? ' one' : ''), text: v }); })));
        rows.push({ key: r.ins.join(''), tr: tr });
        table.appendChild(tr);
      });
      wrap.appendChild(el('div', { class: 'scrollx' }, table));
    }
    host.appendChild(wrap);
    if (say) host.appendChild(say);
    if (o.hint !== false) host.appendChild(el('p', { class: 'hint-inline', text: o.hint || 'Tap the square inputs to flip them between 0 and 1.' }));
    function update(c) {
      var key = c.inputs().map(function (n) { return c.v[n.id]; }).join('');
      rows.forEach(function (r) { r.tr.classList.toggle('now', r.key === key); });
      if (say) say.innerHTML = c.stable ? o.say(c.v) : 'This circuit cannot settle: the loop keeps contradicting itself.';
    }
    update(view.circuit);
  });

  /* ── the diagrams ── */
  function single(t) {
    if (t === 'NOT') {
      return { w: 300, h: 110, nodes: [{ id: 'A', t: 'in', x: 44, y: 62 }, { id: 'g', t: 'NOT', x: 150, y: 62, in: ['A'] }, { id: 'Q', t: 'out', x: 252, y: 62, in: ['g'], label: 'Out' }] };
    }
    return { w: 300, h: 150, nodes: [
      { id: 'A', t: 'in', x: 44, y: 46 }, { id: 'B', t: 'in', x: 44, y: 116 },
      { id: 'g', t: t, x: 150, y: 81, in: [{ s: 'A', mx: 96 }, { s: 'B', mx: 96 }] },
      { id: 'Q', t: 'out', x: 252, y: 81, in: ['g'], label: 'Out' }] };
  }
  var C = LG.circuits = {};
  ['NOT', 'AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR'].forEach(function (t) { C[t] = single(t); });

  C.and3 = { w: 320, h: 190, nodes: [
    { id: 'A', t: 'in', x: 44, y: 46 }, { id: 'B', t: 'in', x: 44, y: 101 }, { id: 'C', t: 'in', x: 44, y: 156 },
    { id: 'g', t: 'AND', x: 170, y: 101, in: [{ s: 'A', mx: 110 }, 'B', { s: 'C', mx: 110 }] },
    { id: 'Q', t: 'out', x: 272, y: 101, in: ['g'], label: 'Out' }] };

  C.notFromNand = { w: 320, h: 110, nodes: [
    { id: 'A', t: 'in', x: 44, y: 62 },
    { id: 'g', t: 'NAND', x: 170, y: 62, in: [{ s: 'A', mx: 100 }, { s: 'A', mx: 100 }] },
    { id: 'Q', t: 'out', x: 272, y: 62, in: ['g'], label: 'NOT A' }] };

  C.andFromNand = { w: 420, h: 150, nodes: [
    { id: 'A', t: 'in', x: 44, y: 46 }, { id: 'B', t: 'in', x: 44, y: 116 },
    { id: 'g1', t: 'NAND', x: 150, y: 81, in: [{ s: 'A', mx: 96 }, { s: 'B', mx: 96 }] },
    { id: 'g2', t: 'NAND', x: 280, y: 81, in: [{ s: 'g1', mx: 220 }, { s: 'g1', mx: 220 }] },
    { id: 'Q', t: 'out', x: 376, y: 81, in: ['g2'], label: 'A AND B' }] };

  C.orFromNand = { w: 420, h: 170, nodes: [
    { id: 'A', t: 'in', x: 44, y: 50 }, { id: 'B', t: 'in', x: 44, y: 130 },
    { id: 'g1', t: 'NAND', x: 150, y: 50, in: [{ s: 'A', mx: 90 }, { s: 'A', mx: 90 }] },
    { id: 'g2', t: 'NAND', x: 150, y: 130, in: [{ s: 'B', mx: 90 }, { s: 'B', mx: 90 }] },
    { id: 'g3', t: 'NAND', x: 280, y: 90, in: [{ s: 'g1', mx: 215 }, { s: 'g2', mx: 215 }] },
    { id: 'Q', t: 'out', x: 376, y: 90, in: ['g3'], label: 'A OR B' }] };

  C.xorFromNand = { w: 540, h: 190, nodes: [
    { id: 'A', t: 'in', x: 44, y: 50 }, { id: 'B', t: 'in', x: 44, y: 150 },
    { id: 'g1', t: 'NAND', x: 160, y: 100, in: [{ s: 'A', mx: 92 }, { s: 'B', mx: 92 }] },
    { id: 'g2', t: 'NAND', x: 290, y: 60, in: ['A', { s: 'g1', mx: 222 }] },
    { id: 'g3', t: 'NAND', x: 290, y: 140, in: [{ s: 'g1', mx: 222 }, 'B'] },
    { id: 'g4', t: 'NAND', x: 410, y: 100, in: [{ s: 'g2', mx: 350 }, { s: 'g3', mx: 350 }] },
    { id: 'Q', t: 'out', x: 500, y: 100, in: ['g4'], label: 'A XOR B' }] };

  C.deMorgan1 = { w: 500, h: 300, nodes: [
    { id: 'A', t: 'in', x: 44, y: 50 }, { id: 'B', t: 'in', x: 44, y: 120 },
    { id: 'g1', t: 'NAND', x: 240, y: 60, in: [{ s: 'A', mx: 150 }, { s: 'B', mx: 170 }] },
    { id: 'P', t: 'out', x: 400, y: 60, in: ['g1'], label: 'NOT (A AND B)' },
    { id: 'n1', t: 'NOT', x: 150, y: 200, in: [{ s: 'A', via: [[80, 50], [80, 200]] }] },
    { id: 'n2', t: 'NOT', x: 150, y: 256, in: [{ s: 'B', via: [[100, 120], [100, 256]] }] },
    { id: 'g2', t: 'OR', x: 280, y: 228, in: [{ s: 'n1', mx: 215 }, { s: 'n2', mx: 215 }] },
    { id: 'Q', t: 'out', x: 400, y: 228, in: ['g2'], label: '(NOT A) OR (NOT B)' }],
    dots: [[80, 50, 'A'], [100, 120, 'B']] };

  C.half = { w: 360, h: 190, nodes: [
    { id: 'A', t: 'in', x: 44, y: 50 }, { id: 'B', t: 'in', x: 44, y: 150 },
    { id: 'x', t: 'XOR', x: 200, y: 60, in: ['A', { s: 'B', mx: 124 }] },
    { id: 'a', t: 'AND', x: 200, y: 140, in: [{ s: 'A', mx: 96 }, 'B'] },
    { id: 'S', t: 'out', x: 310, y: 60, in: ['x'], label: 'Sum' },
    { id: 'C', t: 'out', x: 310, y: 140, in: ['a'], label: 'Carry' }] };

  C.full = { w: 610, h: 290, nodes: [
    { id: 'A', t: 'in', x: 44, y: 44 }, { id: 'B', t: 'in', x: 44, y: 100 }, { id: 'Cin', t: 'in', x: 44, y: 184, label: 'Carry in' },
    { id: 'x1', t: 'XOR', x: 170, y: 72, in: [{ s: 'A', mx: 104 }, { s: 'B', mx: 120 }] },
    { id: 'x2', t: 'XOR', x: 340, y: 82, in: [{ s: 'x1', mx: 256 }, { s: 'Cin', mx: 278 }] },
    { id: 'a1', t: 'AND', x: 340, y: 160, in: [{ s: 'x1', mx: 256 }, { s: 'Cin', mx: 278 }] },
    { id: 'a2', t: 'AND', x: 340, y: 240, in: [{ s: 'A', mx: 82 }, { s: 'B', mx: 120 }] },
    { id: 'o', t: 'OR', x: 460, y: 200, in: [{ s: 'a1', mx: 400 }, { s: 'a2', mx: 400 }] },
    { id: 'S', t: 'out', x: 556, y: 82, in: ['x2'], label: 'Sum' },
    { id: 'C', t: 'out', x: 556, y: 200, in: ['o'], label: 'Carry out' }],
    dots: [[278, 170, 'Cin']] };

  C.mux = { w: 540, h: 210, nodes: [
    { id: 'D0', t: 'in', x: 44, y: 46, label: 'D0' }, { id: 'S', t: 'in', x: 44, y: 106, label: 'Select' }, { id: 'D1', t: 'in', x: 44, y: 176, label: 'D1' },
    { id: 'n', t: 'NOT', x: 160, y: 106, in: ['S'] },
    { id: 'a0', t: 'AND', x: 290, y: 56, in: ['D0', { s: 'n', mx: 226 }] },
    { id: 'a1', t: 'AND', x: 290, y: 166, in: [{ s: 'S', via: [[92, 106], [92, 156]] }, 'D1'] },
    { id: 'o', t: 'OR', x: 410, y: 111, in: [{ s: 'a0', mx: 350 }, { s: 'a1', mx: 350 }] },
    { id: 'Y', t: 'out', x: 500, y: 111, in: ['o'], label: 'Out' }],
    dots: [[92, 106, 'S']] };

  C.srLatch = { w: 380, h: 220, label: 'SR latch made of two NOR gates', nodes: [
    { id: 'R', t: 'in', x: 44, y: 50, label: 'Reset' }, { id: 'S', t: 'in', x: 44, y: 180, label: 'Set' },
    { id: 'q', t: 'NOR', x: 200, y: 60, in: ['R', { s: 'qn', via: [[262, 170], [262, 138], [140, 96], [140, 70]] }] },
    { id: 'qn', t: 'NOR', x: 200, y: 170, v: 1, in: [{ s: 'q', via: [[262, 60], [262, 92], [140, 134], [140, 160]] }, 'S'] },
    { id: 'Q', t: 'out', x: 330, y: 60, in: ['q'], label: 'Q' },
    { id: 'Qn', t: 'out', x: 330, y: 170, in: ['qn'], label: 'Q̄' }],
    dots: [[262, 60, 'q'], [262, 170, 'qn']] };

  C.dLatch = { w: 580, h: 240, label: 'Gated D latch made of NAND gates', nodes: [
    { id: 'D', t: 'in', x: 44, y: 56, label: 'Data' }, { id: 'EN', t: 'in', x: 44, y: 130, label: 'Enable' },
    { id: 'n', t: 'NOT', x: 140, y: 196, in: [{ s: 'D', via: [[84, 56], [84, 196]] }] },
    { id: 'g1', t: 'NAND', x: 250, y: 66, in: ['D', { s: 'EN', via: [[196, 130], [196, 76]] }] },
    { id: 'g2', t: 'NAND', x: 250, y: 186, in: [{ s: 'EN', via: [[196, 130], [196, 176]] }, 'n'] },
    { id: 'g3', t: 'NAND', x: 390, y: 76, in: ['g1', { s: 'g4', via: [[450, 176], [450, 146], [336, 112], [336, 86]] }] },
    { id: 'g4', t: 'NAND', x: 390, y: 176, v: 1, in: [{ s: 'g3', via: [[450, 76], [450, 106], [336, 140], [336, 166]] }, 'g2'] },
    { id: 'Q', t: 'out', x: 524, y: 76, in: ['g3'], label: 'Q' },
    { id: 'Qn', t: 'out', x: 524, y: 176, in: ['g4'], label: 'Q̄' }],
    dots: [[84, 56, 'D'], [196, 130, 'EN'], [450, 76, 'g3'], [450, 176, 'g4']] };
})();
