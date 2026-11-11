/* Bit by Bit — simulation engine.
 * Pure logic, no DOM. Runs in the browser (window.LGE) and in Node (module.exports)
 * so every simulator in the course can be tested from the command line.
 *
 *   1. Gates and gate-level circuits (with feedback, so latches work)
 *   2. Boolean expression parser
 *   3. Breadboard simulator (nets, chips, LEDs, resistors, switches)
 *   4. LG-8, a tiny 8-bit computer
 */
(function (root) {
  'use strict';
  var E = {};

  /* ───────────────────────── 1. Gates ───────────────────────── */

  var xor = function (a) { return a.reduce(function (s, x) { return s ^ (x ? 1 : 0); }, 0); };
  E.GATES = {
    BUF: function (a) { return a[0] ? 1 : 0; },
    NOT: function (a) { return a[0] ? 0 : 1; },
    AND: function (a) { return a.every(Boolean) ? 1 : 0; },
    OR: function (a) { return a.some(Boolean) ? 1 : 0; },
    NAND: function (a) { return a.every(Boolean) ? 0 : 1; },
    NOR: function (a) { return a.some(Boolean) ? 0 : 1; },
    XOR: xor,
    XNOR: function (a) { return xor(a) ? 0 : 1; }
  };
  E.gate = function (type) {
    return E.GATES[type](Array.prototype.slice.call(arguments, 1));
  };

  /* A circuit is a list of nodes: inputs, gates and output lamps.
   * Values settle by repeated evaluation, and the previous state is kept,
   * which is exactly what lets a feedback loop remember. */
  function Circuit(def) {
    this.nodes = def.nodes.map(function (n) {
      var c = {};
      for (var k in n) c[k] = n[k];
      c.in = (n.in || []).map(function (s) { return typeof s === 'string' ? { s: s } : s; });
      return c;
    });
    this.v = {};
    this.stable = true;
    for (var i = 0; i < this.nodes.length; i++) this.v[this.nodes[i].id] = this.nodes[i].v ? 1 : 0;
    this.settle();
  }
  Circuit.prototype.settle = function () {
    for (var pass = 0; pass < 64; pass++) {
      var changed = false;
      for (var i = 0; i < this.nodes.length; i++) {
        var n = this.nodes[i];
        if (n.t === 'in') continue;
        var self = this;
        var ins = n.in.map(function (w) { return self.v[w.s]; });
        var nv = n.t === 'out' ? (ins[0] ? 1 : 0) : E.GATES[n.t](ins);
        if (nv !== this.v[n.id]) { this.v[n.id] = nv; changed = true; }
      }
      if (!changed) { this.stable = true; return true; }
    }
    this.stable = false;
    return false;
  };
  Circuit.prototype.set = function (id, val) { this.v[id] = val ? 1 : 0; return this.settle(); };
  Circuit.prototype.toggle = function (id) { return this.set(id, !this.v[id]); };
  Circuit.prototype.get = function (id) { return this.v[id]; };
  Circuit.prototype.inputs = function () { return this.nodes.filter(function (n) { return n.t === 'in'; }); };
  Circuit.prototype.outputs = function () { return this.nodes.filter(function (n) { return n.t === 'out'; }); };
  E.Circuit = Circuit;

  /* Truth table of a combinational circuit: one fresh circuit per row. */
  E.circuitTable = function (def, outIds) {
    var ins = def.nodes.filter(function (n) { return n.t === 'in'; });
    var rows = [];
    for (var k = 0; k < (1 << ins.length); k++) {
      var c = new Circuit(def);
      var inVals = ins.map(function (n, i) { return (k >> (ins.length - 1 - i)) & 1; });
      ins.forEach(function (n, i) { c.v[n.id] = inVals[i]; });
      c.settle();
      rows.push({ ins: inVals, outs: outIds.map(function (id) { return c.get(id); }) });
    }
    return rows;
  };

  /* ─────────────────── 2. Boolean expressions ─────────────────── */

  var KEYWORDS = ['NAND', 'XNOR', 'NOR', 'XOR', 'AND', 'NOT', 'OR'];
  function tokenize(src) {
    var s = String(src).toUpperCase(), out = [], i = 0;
    while (i < s.length) {
      var ch = s[i];
      if (/\s/.test(ch)) { i++; continue; }
      var kw = null;
      for (var k = 0; k < KEYWORDS.length; k++) {
        if (s.substr(i, KEYWORDS[k].length) === KEYWORDS[k]) { kw = KEYWORDS[k]; break; }
      }
      if (kw) { out.push({ t: 'op', v: kw }); i += kw.length; continue; }
      if (/[A-Z]/.test(ch)) { out.push({ t: 'var', v: ch }); i++; continue; }
      if (ch === '0' || ch === '1') { out.push({ t: 'const', v: +ch }); i++; continue; }
      var map = { '+': 'OR', '|': 'OR', '∨': 'OR', '·': 'AND', '*': 'AND', '&': 'AND', '.': 'AND', '∧': 'AND',
        '^': 'XOR', '⊕': 'XOR', '!': 'NOT', '~': 'NOT', '¬': 'NOT' };
      if (map[ch]) { out.push({ t: 'op', v: map[ch] }); i++; continue; }
      if (ch === '(' || ch === ')' || ch === "'" || ch === '’') { out.push({ t: ch === '’' ? "'" : ch }); i++; continue; }
      throw new Error('I do not understand the symbol "' + src[i] + '"');
    }
    return out;
  }

  /* Precedence, loosest to tightest: OR/NOR, XOR/XNOR, AND/NAND (also by juxtaposition: AB), NOT. */
  E.parseExpr = function (src) {
    var toks = tokenize(src), pos = 0, vars = {};
    function peek() { return toks[pos]; }
    function isOp(names) { var t = peek(); return t && t.t === 'op' && names.indexOf(t.v) >= 0 ? t.v : null; }
    function binary(next, names, fns) {
      return function () {
        var left = next();
        for (var op = isOp(names); op; op = isOp(names)) {
          pos++;
          left = (function (l, r, f) { return function (env) { return f(l(env), r(env)); }; })(left, next(), fns[op]);
        }
        return left;
      };
    }
    function primary() {
      var t = peek();
      if (!t) throw new Error('The expression ends too early');
      var node;
      if (t.t === 'var') { pos++; vars[t.v] = true; node = (function (name) { return function (env) { return env[name] ? 1 : 0; }; })(t.v); }
      else if (t.t === 'const') { pos++; node = (function (c) { return function () { return c; }; })(t.v); }
      else if (t.t === '(') {
        pos++; node = orLevel();
        if (!peek() || peek().t !== ')') throw new Error('A closing bracket ) is missing');
        pos++;
      } else throw new Error('Something is missing before "' + (t.v || t.t) + '"');
      while (peek() && peek().t === "'") { pos++; node = (function (n) { return function (env) { return n(env) ? 0 : 1; }; })(node); }
      return node;
    }
    function notLevel() {
      if (isOp(['NOT'])) { pos++; var inner = notLevel(); return function (env) { return inner(env) ? 0 : 1; }; }
      return primary();
    }
    function andLevel() {
      var left = notLevel();
      for (;;) {
        var t = peek(), op = isOp(['AND', 'NAND']);
        var implicit = !op && t && (t.t === 'var' || t.t === 'const' || t.t === '(' || (t.t === 'op' && t.v === 'NOT'));
        if (!op && !implicit) break;
        if (op) pos++;
        left = (function (l, r, nand) {
          return function (env) { var x = l(env) & r(env); return nand ? 1 - x : x; };
        })(left, notLevel(), op === 'NAND');
      }
      return left;
    }
    var xorLevel = binary(andLevel, ['XOR', 'XNOR'], {
      XOR: function (a, b) { return a ^ b; }, XNOR: function (a, b) { return 1 - (a ^ b); }
    });
    var orLevel = binary(xorLevel, ['OR', 'NOR'], {
      OR: function (a, b) { return a | b; }, NOR: function (a, b) { return 1 - (a | b); }
    });
    if (!toks.length) throw new Error('Type an expression first');
    var tree = orLevel();
    if (pos < toks.length) throw new Error('Unexpected "' + (toks[pos].v || toks[pos].t) + '"');
    return { vars: Object.keys(vars).sort(), eval: tree };
  };

  /* Output column of the truth table, as a string like "0110". First variable is the left-most column. */
  E.truthOf = function (src, vars) {
    var p = E.parseExpr(src);
    vars = vars || p.vars;
    var out = '';
    for (var k = 0; k < (1 << vars.length); k++) {
      var env = {};
      vars.forEach(function (v, i) { env[v] = (k >> (vars.length - 1 - i)) & 1; });
      out += p.eval(env);
    }
    return out;
  };

  /* ───────────────────── 3. Breadboard ───────────────────── */

  E.COLS = 30;
  E.OUT_PINS = ['D2', 'D3', 'D4', 'D5'];
  E.IN_PINS = ['D8', 'D9'];
  var QUAD = [[1, 2, 3], [4, 5, 6], [9, 10, 8], [12, 13, 11]];
  E.CHIPS = {
    '7400': { name: 'Quad NAND', gate: 'NAND', gates: QUAD },
    '7408': { name: 'Quad AND', gate: 'AND', gates: QUAD },
    '7432': { name: 'Quad OR', gate: 'OR', gates: QUAD },
    '7486': { name: 'Quad XOR', gate: 'XOR', gates: QUAD },
    '7402': { name: 'Quad NOR', gate: 'NOR', gates: [[2, 3, 1], [5, 6, 4], [8, 9, 10], [11, 12, 13]] },
    '7404': { name: 'Hex NOT', gate: 'NOT', gates: [[1, 2], [3, 4], [5, 6], [9, 8], [11, 10], [13, 12]] },
    '7474': { name: 'Dual D flip-flop', ff: [
      { clr: 1, d: 2, clk: 3, pre: 4, q: 5, qn: 6 },
      { clr: 13, d: 12, clk: 11, pre: 10, q: 9, qn: 8 }] }
  };

  var TOP = 'abcde', BOT = 'fghij';
  E.netOf = function (h) {
    if (h[0] === 'P') return h;
    var m = /^(tp|tm|bp|bm)(\d+)$/.exec(h);
    if (m) return m[1].toUpperCase();
    return (TOP.indexOf(h[0]) >= 0 ? 'T' : 'B') + h.slice(1);
  };
  E.validHole = function (h) {
    if (typeof h !== 'string') return false;
    if (h[0] === 'P') {
      var p = h.slice(2);
      return h[1] === ':' && (p === '5V' || p === 'GND' || E.OUT_PINS.indexOf(p) >= 0 || E.IN_PINS.indexOf(p) >= 0);
    }
    var m = /^(tp|tm|bp|bm|[a-j])(\d+)$/.exec(h);
    return !!m && +m[2] >= 1 && +m[2] <= E.COLS;
  };
  E.chipPinHole = function (part, pin) {
    return pin <= 7 ? 'f' + (part.col + pin - 1) : 'e' + (part.col + 14 - pin);
  };
  E.leads = function (part) {
    if (part.k !== 'chip') return [part.a, part.b];
    var out = [];
    for (var p = 1; p <= 14; p++) out.push(E.chipPinHole(part, p));
    return out;
  };

  function Board(state) {
    state = state || {};
    this.parts = (state.parts || []).map(function (p) { var c = {}; for (var k in p) c[k] = p[k]; return c; });
    this.pins = { D2: 0, D3: 0, D4: 0, D5: 0 };
    for (var k in (state.pins || {})) this.pins[k] = state.pins[k] ? 1 : 0;
    this.nextId = 1;
    for (var i = 0; i < this.parts.length; i++) {
      if (this.parts[i].id == null) this.parts[i].id = this.nextId;
      this.nextId = Math.max(this.nextId, this.parts[i].id) + 1;
    }
    this.rt = {}; // chip run-time state, keyed by part id
  }
  Board.prototype.toJSON = function () { return { parts: this.parts, pins: this.pins }; };
  Board.prototype.clone = function () {
    var b = new Board(JSON.parse(JSON.stringify(this.toJSON())));
    b.rt = JSON.parse(JSON.stringify(this.rt));
    return b;
  };
  Board.prototype.occupied = function () {
    var occ = {};
    this.parts.forEach(function (p) { E.leads(p).forEach(function (h) { occ[h] = p; }); });
    return occ;
  };
  Board.prototype.canPlace = function (part) {
    if (part.k === 'chip') {
      if (!E.CHIPS[part.type]) return { ok: false, why: 'Unknown chip.' };
      if (part.col < 1 || part.col > E.COLS - 6) return { ok: false, why: 'A chip needs 7 columns. Start it further left.' };
    } else {
      if (part.a === part.b) return { ok: false, why: 'Pick two different holes.' };
      if (part.k !== 'wire' && (part.a[0] === 'P' || part.b[0] === 'P')) {
        return { ok: false, why: 'Only wires plug into the controller board. Put parts on the breadboard.' };
      }
    }
    var holes = E.leads(part), occ = this.occupied();
    for (var i = 0; i < holes.length; i++) {
      if (!E.validHole(holes[i])) return { ok: false, why: 'That spot is off the board.' };
      if (occ[holes[i]]) return { ok: false, why: 'Hole ' + holes[i].replace('P:', '') + ' is already in use. One lead per hole.' };
    }
    return { ok: true };
  };
  Board.prototype.add = function (part) {
    var c = this.canPlace(part);
    if (!c.ok) return c;
    part.id = this.nextId++;
    this.parts.push(part);
    return { ok: true, part: part };
  };
  Board.prototype.remove = function (id) {
    this.parts = this.parts.filter(function (p) { return p.id !== id; });
    delete this.rt[id];
  };
  Board.prototype.chipLabel = function (part) {
    var chips = this.parts.filter(function (p) { return p.k === 'chip'; });
    return 'U' + (chips.indexOf(part) + 1);
  };

  Board.prototype.sim = function () {
    var self = this, parts = this.parts, uf = {};
    function find(x) {
      if (uf[x] === undefined) uf[x] = x;
      var r = x;
      while (uf[r] !== r) r = uf[r];
      while (uf[x] !== r) { var nx = uf[x]; uf[x] = r; x = nx; }
      return r;
    }
    function union(a, b) { a = find(a); b = find(b); if (a !== b) uf[a] = b; }
    var rootOf = function (hole) { return find(E.netOf(hole)); };

    ['P:5V', 'P:GND'].concat(E.OUT_PINS.map(function (p) { return 'P:' + p; }),
      E.IN_PINS.map(function (p) { return 'P:' + p; })).forEach(find);
    parts.forEach(function (p) {
      E.leads(p).forEach(function (h) { find(E.netOf(h)); });
      if (p.k === 'wire' || (p.k === 'sw' && p.on)) union(E.netOf(p.a), E.netOf(p.b));
    });
    var leadCount = {};
    parts.forEach(function (p) {
      E.leads(p).forEach(function (h) { var r = rootOf(h); leadCount[r] = (leadCount[r] || 0) + 1; });
    });
    var resEdges = parts.filter(function (p) { return p.k === 'res'; })
      .map(function (p) { return [rootOf(p.a), rootOf(p.b)]; });
    var roots = {};
    Object.keys(uf).forEach(function (k) { roots[find(k)] = true; });
    roots = Object.keys(roots);

    function resolve(drivers) {
      var lv = {};
      roots.forEach(function (r) {
        var d = drivers[r];
        if (!d) return;
        if (d.h.length && d.l.length) lv[r] = { v: null, strong: true, conflict: true, by: d.h.concat(d.l) };
        else lv[r] = { v: d.h.length ? 1 : 0, strong: true };
      });
      roots.forEach(function (r) {
        if (lv[r]) return;
        var seen = {}, queue = [r], hi = false, lo = false;
        seen[r] = true;
        while (queue.length) {
          var cur = queue.shift();
          resEdges.forEach(function (e) {
            var other = e[0] === cur ? e[1] : e[1] === cur ? e[0] : null;
            if (other === null || seen[other]) return;
            seen[other] = true;
            var d = lv[other];
            if (d && d.strong) { if (d.v === 1) hi = true; else if (d.v === 0) lo = true; }
            else queue.push(other);
          });
        }
        lv[r] = { v: hi && !lo ? 1 : lo && !hi ? 0 : null, strong: false, float: !hi && !lo };
      });
      return lv;
    }
    function fixedDrivers() {
      var d = {};
      function add(hole, v, label) {
        var r = rootOf(hole);
        d[r] = d[r] || { h: [], l: [] };
        d[r][v ? 'h' : 'l'].push(label);
      }
      add('P:5V', 1, '5V'); add('P:GND', 0, 'GND');
      E.OUT_PINS.forEach(function (p) { add('P:' + p, self.pins[p], p); });
      return { d: d, add: add };
    }

    var chips = parts.filter(function (p) { return p.k === 'chip'; });
    var base = resolve(fixedDrivers().d);
    var powered = {};
    chips.forEach(function (c) {
      var vcc = base[rootOf(E.chipPinHole(c, 14))], gnd = base[rootOf(E.chipPinHole(c, 7))];
      powered[c.id] = !!(vcc && gnd && vcc.strong && vcc.v === 1 && gnd.strong && gnd.v === 0);
      if (!powered[c.id]) delete self.rt[c.id]; // no power, no memory
      else if (!self.rt[c.id]) self.rt[c.id] = { out: {}, last: {} };
    });

    /* Gates are evaluated one at a time and the nets are re-solved after each change.
     * That ordering lets a cross-coupled pair (a latch) fall into one of its two stable
     * states instead of flip-flopping forever inside the simulator. */
    var lv = base, oscillating = true, floating = {};
    function recompute() {
      var fd = fixedDrivers();
      chips.forEach(function (c) {
        if (!powered[c.id]) return;
        var out = self.rt[c.id].out;
        Object.keys(out).forEach(function (pin) { fd.add(E.chipPinHole(c, +pin), out[pin], self.chipLabel(c) + ' pin ' + pin); });
      });
      lv = resolve(fd.d);
    }
    recompute();
    for (var iter = 0; iter < 60; iter++) {
      var changed = false;
      floating = {};
      chips.forEach(function (c) {
        if (!powered[c.id]) return;
        var spec = E.CHIPS[c.type], st = self.rt[c.id];
        function read(pin) { return lv[rootOf(E.chipPinHole(c, pin))] || { v: null, float: true }; }
        if (spec.gates) {
          spec.gates.forEach(function (g) {
            var outPin = g[g.length - 1], used = (leadCount[rootOf(E.chipPinHole(c, outPin))] || 0) > 1;
            var ins = g.slice(0, -1).map(function (pin) {
              var l = read(pin);
              if (l.v === null && used) floating[self.chipLabel(c) + ' pin ' + pin] = true;
              return l.v === 1 ? 1 : 0;
            });
            var v = E.GATES[spec.gate](ins);
            if (st.out[outPin] !== v) { st.out[outPin] = v; changed = true; recompute(); }
          });
        } else {
          spec.ff.forEach(function (f, i) {
            var pre = read(f.pre).v === 0, clr = read(f.clr).v === 0; // active low; unconnected = inactive
            var clk = read(f.clk).v === 1 ? 1 : 0, d = read(f.d).v === 1 ? 1 : 0;
            var q = st.out[f.q] === undefined ? 0 : st.out[f.q];
            if (pre) q = 1; else if (clr) q = 0; else if (clk && st.last[i] === 0) q = d;
            st.last[i] = clk;
            var qn = pre && clr ? 1 : 1 - q;
            if (st.out[f.q] !== q || st.out[f.qn] !== qn) { st.out[f.q] = q; st.out[f.qn] = qn; changed = true; recompute(); }
          });
        }
      });
      if (!changed) { oscillating = false; break; }
    }

    var errors = [], warnings = [];
    roots.forEach(function (r) {
      var l = lv[r];
      if (!l || !l.conflict) return;
      var by = l.by;
      if (by.indexOf('5V') >= 0 && by.indexOf('GND') >= 0) errors.push('Short circuit: +5V is connected straight to GND. Remove that connection.');
      else errors.push('Two outputs are fighting over one connection (' + by.join(' and ') + '). An output may only feed inputs.');
    });
    if (oscillating) warnings.push('This circuit never settles: a loop keeps flipping its own input.');
    chips.forEach(function (c) {
      if (!powered[c.id]) warnings.push(self.chipLabel(c) + ' (' + c.type + ') has no power. Connect pin 14 to + and pin 7 to −.');
    });
    var fl = Object.keys(floating);
    if (fl.length) warnings.push('Unconnected input: ' + fl.join(', ') + '. A floating input is unpredictable on a real chip, so connect it to a signal, + or −.');

    var leds = {}, level = function (hole) { return lv[rootOf(hole)] || { v: null, strong: false, float: true }; };
    parts.forEach(function (p) {
      if (p.k !== 'led') return;
      var a = level(p.a), b = level(p.b);
      var on = a.v === 1 && b.v === 0, blown = on && a.strong && b.strong;
      leds[p.id] = { lit: on && !blown, blown: blown, reversed: a.v === 0 && b.v === 1 };
      if (blown) warnings.push('An LED has no resistor in its path. On a real board it would burn out. Put a resistor in series with it.');
      else if (leds[p.id].reversed) warnings.push('An LED is in backwards. The + leg (anode) must be on the higher-voltage side.');
    });
    var pinsIn = {};
    E.IN_PINS.forEach(function (p) { pinsIn[p] = level('P:' + p); });
    var chipInfo = {};
    chips.forEach(function (c) { chipInfo[c.id] = { powered: powered[c.id], label: self.chipLabel(c) }; });
    return { level: level, leds: leds, chips: chipInfo, pinsIn: pinsIn, errors: errors, warnings: warnings, oscillating: oscillating };
  };
  E.Board = Board;

  /* For checking a build: drive the output pins through every combination and
   * record what each LED does. vec[ledId] is a string such as "0001". */
  E.ledVectors = function (board, pinNames) {
    var b = board.clone(), vec = {}, bad = false;
    for (var k = 0; k < (1 << pinNames.length); k++) {
      pinNames.forEach(function (p, i) { b.pins[p] = (k >> (pinNames.length - 1 - i)) & 1; });
      var r = b.sim();
      if (r.errors.length) bad = true;
      Object.keys(r.leds).forEach(function (id) {
        if (r.leds[id].blown) bad = true;
        vec[id] = (vec[id] || '') + (r.leds[id].lit ? '1' : '0');
      });
    }
    return { vec: vec, bad: bad };
  };
  /* Does some LED show each wanted pattern? Each pattern needs its own LED. */
  E.findLeds = function (vec, patterns) {
    var used = {}, ids = Object.keys(vec);
    return patterns.every(function (pat) {
      for (var i = 0; i < ids.length; i++) {
        if (!used[ids[i]] && vec[ids[i]] === pat) { used[ids[i]] = true; return true; }
      }
      return false;
    });
  };

  /* ───────────────────── 4. LG-8 computer ───────────────────── */

  E.OPS = [
    { op: 0x0, name: 'NOP', arg: false, text: 'Do nothing' },
    { op: 0x1, name: 'LDA', arg: true, text: 'Load the byte at an address into A' },
    { op: 0x2, name: 'ADD', arg: true, text: 'Add the byte at an address to A' },
    { op: 0x3, name: 'SUB', arg: true, text: 'Subtract the byte at an address from A' },
    { op: 0x4, name: 'STA', arg: true, text: 'Store A into memory at an address' },
    { op: 0x5, name: 'LDI', arg: true, text: 'Load a small number (0–15) straight into A' },
    { op: 0x6, name: 'JMP', arg: true, text: 'Jump: continue from another address' },
    { op: 0x7, name: 'JC', arg: true, text: 'Jump only if the last sum overflowed (carry)' },
    { op: 0x8, name: 'JZ', arg: true, text: 'Jump only if the last result was zero' },
    { op: 0xE, name: 'OUT', arg: false, text: 'Copy A to the display' },
    { op: 0xF, name: 'HLT', arg: false, text: 'Stop' }
  ];
  var OP_BY_NAME = {}, OP_BY_CODE = {};
  E.OPS.forEach(function (o) { OP_BY_NAME[o.name] = o; OP_BY_CODE[o.op] = o; });

  E.disasm = function (byte) {
    var o = OP_BY_CODE[byte >> 4];
    if (!o) return '?';
    return o.arg ? o.name + ' ' + (byte & 15) : o.name;
  };

  /* One instruction per line, placed from address 0 upward.
   * "14: 5" puts the number 5 at address 14. Text after ; is a comment. */
  E.assemble = function (src) {
    var mem = new Array(16).fill(0), errors = [], addr = 0;
    String(src).split('\n').forEach(function (raw, ln) {
      var line = raw.replace(/;.*/, '').trim().toUpperCase();
      if (!line) return;
      var m = /^(\d+)\s*:\s*(\d+)$/.exec(line);
      if (m) {
        if (+m[1] > 15 || +m[2] > 255) errors.push('Line ' + (ln + 1) + ': address must be 0–15 and value 0–255.');
        else mem[+m[1]] = +m[2];
        return;
      }
      m = /^([A-Z]+)(?:\s+(\d+))?$/.exec(line);
      var o = m && OP_BY_NAME[m[1]];
      if (!o) { errors.push('Line ' + (ln + 1) + ': "' + raw.trim() + '" is not an instruction.'); return; }
      if (o.arg && m[2] === undefined) { errors.push('Line ' + (ln + 1) + ': ' + o.name + ' needs a number 0–15.'); return; }
      if (m[2] !== undefined && +m[2] > 15) { errors.push('Line ' + (ln + 1) + ': the number must be 0–15.'); return; }
      if (addr > 15) { errors.push('Line ' + (ln + 1) + ': the program does not fit in 16 bytes.'); return; }
      mem[addr++] = (o.op << 4) | (o.arg ? +m[2] : 0);
    });
    return { mem: mem, errors: errors };
  };

  function CPU(mem) { this.load(mem || []); }
  CPU.prototype.load = function (mem) {
    this.mem = new Array(16).fill(0);
    for (var i = 0; i < 16; i++) this.mem[i] = (mem[i] || 0) & 255;
    this.reset();
  };
  CPU.prototype.reset = function () {
    this.pc = 0; this.ir = 0; this.a = 0; this.out = null;
    this.z = 0; this.c = 0; this.halted = false; this.phase = 'fetch'; this.steps = 0;
    this.touched = null;
  };
  /* One half-step: fetch, then execute. Returns a sentence describing what happened. */
  CPU.prototype.tick = function () {
    if (this.halted) return 'Halted. Press Reset to run again.';
    this.touched = null;
    if (this.phase === 'fetch') {
      this.fetchedFrom = this.pc;
      this.ir = this.mem[this.pc];
      this.pc = (this.pc + 1) & 15;
      this.phase = 'execute';
      return 'Fetch: copy the byte at address ' + this.fetchedFrom + ' into the instruction register, then add 1 to PC.';
    }
    this.phase = 'fetch';
    this.steps++;
    var op = this.ir >> 4, x = this.ir & 15, m = this.mem[x], r;
    switch (op) {
      case 0x1: this.a = m; this.touched = x; return 'Execute LDA ' + x + ': A becomes ' + m + '.';
      case 0x2: r = this.a + m; this.c = r > 255 ? 1 : 0; this.a = r & 255; this.z = this.a === 0 ? 1 : 0; this.touched = x;
        return 'Execute ADD ' + x + ': A + ' + m + ' = ' + this.a + (this.c ? ' (it overflowed, so carry = 1).' : '.');
      case 0x3: r = this.a - m; this.c = r >= 0 ? 1 : 0; this.a = r & 255; this.z = this.a === 0 ? 1 : 0; this.touched = x;
        return 'Execute SUB ' + x + ': A − ' + m + ' = ' + this.a + (this.z ? ' (zero flag = 1).' : '.');
      case 0x4: this.mem[x] = this.a; this.touched = x; return 'Execute STA ' + x + ': memory[' + x + '] becomes ' + this.a + '.';
      case 0x5: this.a = x; return 'Execute LDI ' + x + ': A becomes ' + x + '.';
      case 0x6: this.pc = x; return 'Execute JMP ' + x + ': PC becomes ' + x + '.';
      case 0x7: if (this.c) this.pc = x; return 'Execute JC ' + x + ': carry is ' + this.c + (this.c ? ', so jump.' : ', so carry on.');
      case 0x8: if (this.z) this.pc = x; return 'Execute JZ ' + x + ': zero flag is ' + this.z + (this.z ? ', so jump.' : ', so carry on.');
      case 0xE: this.out = this.a; return 'Execute OUT: the display shows ' + this.a + '.';
      case 0xF: this.halted = true; return 'Execute HLT: the computer stops.';
      default: return 'Execute NOP: nothing happens.';
    }
  };
  CPU.prototype.run = function (maxSteps) {
    var guard = (maxSteps || 2000) * 2;
    while (!this.halted && guard-- > 0) this.tick();
    return this.halted;
  };
  E.CPU = CPU;

  E.PROGRAMS = {
    add: { name: 'Add two numbers', src: 'LDA 14   ; A = first number\nADD 15   ; A = A + second number\nOUT      ; show A\nHLT\n14: 5\n15: 9' },
    count: { name: 'Count up forever', src: 'LDI 0\nOUT      ; show A\nADD 15   ; A = A + 1\nJMP 1    ; go back to OUT\n15: 1' },
    down: { name: 'Count down, then stop', src: 'LDA 14\nOUT\nSUB 15   ; A = A - 1\nJZ 5     ; reached zero? leave the loop\nJMP 1\nOUT\nHLT\n14: 5\n15: 1' },
    mul: { name: 'Multiply 3 × 4', src: 'LDA 13   ; running total\nADD 14   ; add 3 once more\nSTA 13\nLDA 15   ; how many adds are left\nSUB 12\nSTA 15\nJZ 8     ; none left? finish\nJMP 0\nLDA 13\nOUT\nHLT\n12: 1\n13: 0\n14: 3\n15: 4' }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = E;
  root.LGE = E;
})(typeof window !== 'undefined' ? window : globalThis);
