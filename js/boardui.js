/* The virtual breadboard: a controller board with pins, a 30-column breadboard,
 * and parts you place by tapping holes. Drawing and interaction only;
 * the electrical behaviour lives in engine.js (LGE.Board). */
(function () {
  'use strict';
  var LG = window.LG, E = window.LGE, el = LG.el, btn = LG.btn;

  var P = 22, X0 = 34, W = 706, H = 520;
  var ROWY = { tp: 126, tm: 148, a: 186, b: 208, c: 230, d: 252, e: 274, f: 340, g: 362, h: 384, i: 406, j: 428, bp: 466, bm: 488 };
  var PINCOL = { '5V': 2, GND: 4, D2: 8, D3: 10, D4: 12, D5: 14, D8: 20, D9: 22 };
  var PINY = 72;
  var WIRE_COLORS = ['#D9A400', '#2E9E5B', '#2F6FDE', '#E0662A', '#8B5CF6', '#0FA3A3'];
  var LED_COLORS = ['red', 'green', 'yellow', 'blue'];
  var TOOLS = [['wire', 'Wire'], ['led', 'LED'], ['res', 'Resistor'], ['sw', 'Switch'], ['chip', 'Chip'], ['erase', 'Erase']];
  var TOOL_HELP = {
    wire: 'Wire: tap two holes to join them.',
    led: 'LED: tap the hole for the long + leg first, then the hole for the − leg.',
    res: 'Resistor: tap two holes. It works either way round.',
    sw: 'Switch: tap two holes. Tap the switch afterwards to open or close it.',
    chip: 'Chip: tap a hole in the column where pin 1 should sit. A chip covers 7 columns.',
    erase: 'Erase: tap a part or a wire to remove it.'
  };
  function X(c) { return X0 + (c - 1) * P; }
  function xy(h) {
    if (h[0] === 'P') return [X(PINCOL[h.slice(2)]), PINY];
    var m = /^(tp|tm|bp|bm|[a-j])(\d+)$/.exec(h);
    return [X(+m[2]), ROWY[m[1]]];
  }
  function allHoles() {
    var out = Object.keys(PINCOL).map(function (p) { return 'P:' + p; });
    Object.keys(ROWY).forEach(function (r) { for (var c = 1; c <= E.COLS; c++) out.push(r + c); });
    return out;
  }
  function pinNames(type) {
    var spec = E.CHIPS[type], names = {};
    names[7] = 'GND'; names[14] = '+5V';
    if (spec.gates) spec.gates.forEach(function (g, i) {
      g.slice(0, -1).forEach(function (pin, k) { names[pin] = (i + 1) + 'AB'[k]; });
      names[g[g.length - 1]] = (i + 1) + 'Y';
    });
    else spec.ff.forEach(function (f, i) {
      names[f.clr] = (i + 1) + 'CLR̄'; names[f.d] = (i + 1) + 'D'; names[f.clk] = (i + 1) + 'CLK';
      names[f.pre] = (i + 1) + 'PRĒ'; names[f.q] = (i + 1) + 'Q'; names[f.qn] = (i + 1) + 'Q̄';
    });
    return names;
  }
  function isOut(type, pin) {
    var spec = E.CHIPS[type];
    if (spec.gates) return spec.gates.some(function (g) { return g[g.length - 1] === pin; });
    return spec.ff.some(function (f) { return f.q === pin || f.qn === pin; });
  }
  function pinout(type) {
    var names = pinNames(type), spec = E.CHIPS[type], row = function (pins) {
      return '<div class="po-row">' + pins.map(function (p) {
        return '<span class="po' + (isOut(type, p) ? ' out' : p === 7 || p === 14 ? ' pwr' : '') + '"><i>' + p + '</i>' + names[p] + '</span>';
      }).join('') + '</div>';
    };
    return '<div class="pinout"><b>' + type + ' · ' + spec.name + '</b>' + row([14, 13, 12, 11, 10, 9, 8]) + '<div class="po-body">notch on the left · pin 1 bottom left</div>' + row([1, 2, 3, 4, 5, 6, 7]) +
      '<p class="hint-inline">' + (spec.gates ? 'Each gate: inputs A' + (spec.gate === 'NOT' ? '' : ' and B') + ' → output Y (shaded). ' : 'Each half stores D on the rising edge of CLK. CLR̄ and PRĒ may be left unconnected. ') + 'Pin 14 to +, pin 7 to −.</p></div>';
  }

  function Bench(host, o, ctx) {
    var board = new E.Board({}), tool = 'wire', chipType = '7408', pending = null, selChip = null, sketch = 'manual', timer = null, count = 0;
    var zoom = (window.innerWidth || 800) < 720 ? 1.2 : 1, last = null, self = this;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'bench-svg', role: 'img', 'aria-label': 'Breadboard and controller' });
    var gParts = el('g'), gSig = el('g', { class: 'sig' }), gTop = el('g'), gCtl = el('g');
    var status = el('p', { class: 'bench-status', 'aria-live': 'polite' }), issues = el('div', { class: 'bench-issues', 'aria-live': 'polite' }), info = el('div', { class: 'bench-info' });

    /* static artwork */
    (function () {
      var s = el('g');
      s.appendChild(el('rect', { class: 'ctl-board', x: 8, y: 6, width: W - 16, height: 86, rx: 10 }));
      s.appendChild(el('text', { class: 'ctl-title', x: 524, y: 36, text: 'CONTROLLER' }));
      s.appendChild(el('text', { class: 'ctl-sub', x: 524, y: 54, text: 'out D2–D5 · in D8, D9' }));
      s.appendChild(el('rect', { class: 'bb-body', x: 8, y: 104, width: W - 16, height: 406, rx: 10 }));
      s.appendChild(el('rect', { class: 'bb-gap', x: 8, y: 296, width: W - 16, height: 22 }));
      [['tp', 'plus'], ['tm', 'minus'], ['bp', 'plus'], ['bm', 'minus']].forEach(function (r) {
        var y = ROWY[r[0]] + (r[1] === 'plus' ? -11 : 11);
        s.appendChild(el('line', { class: 'rail-line ' + r[1], x1: X(1) - 8, x2: X(30) + 8, y1: y, y2: y }));
        s.appendChild(el('text', { class: 'rail-sign ' + r[1], x: 16, y: ROWY[r[0]] + 5, 'text-anchor': 'middle', text: r[1] === 'plus' ? '+' : '−' }));
        s.appendChild(el('text', { class: 'rail-sign ' + r[1], x: W - 16, y: ROWY[r[0]] + 5, 'text-anchor': 'middle', text: r[1] === 'plus' ? '+' : '−' }));
      });
      'abcdefghij'.split('').forEach(function (r) { s.appendChild(el('text', { class: 'bb-label', x: 17, y: ROWY[r] + 4, 'text-anchor': 'middle', text: r })); });
      for (var c = 1; c <= E.COLS; c++) if (c === 1 || c % 5 === 0) {
        s.appendChild(el('text', { class: 'bb-label', x: X(c), y: 170, 'text-anchor': 'middle', text: c }));
        s.appendChild(el('text', { class: 'bb-label', x: X(c), y: 449, 'text-anchor': 'middle', text: c }));
      }
      /* the hidden metal strips, shown by the X-ray toggle */
      var xr = el('g', { class: 'xray' });
      ['tp', 'tm', 'bp', 'bm'].forEach(function (r) { xr.appendChild(el('line', { x1: X(1), x2: X(30), y1: ROWY[r], y2: ROWY[r] })); });
      for (c = 1; c <= E.COLS; c++) {
        xr.appendChild(el('line', { x1: X(c), x2: X(c), y1: ROWY.a, y2: ROWY.e }));
        xr.appendChild(el('line', { x1: X(c), x2: X(c), y1: ROWY.f, y2: ROWY.j }));
      }
      s.appendChild(xr);
      allHoles().forEach(function (h) {
        var p = xy(h), pin = h[0] === 'P';
        s.appendChild(el(pin ? 'rect' : 'circle', pin ? { class: 'socket', x: p[0] - 7, y: p[1] - 7, width: 14, height: 14, rx: 2 } : { class: 'hole', cx: p[0], cy: p[1], r: 3.6 }));
      });
      svg.appendChild(s);
      svg.appendChild(gCtl); svg.appendChild(gSig);
      var hits = el('g');
      allHoles().forEach(function (h) { var p = xy(h); hits.appendChild(el('circle', { class: 'hit', 'data-hole': h, cx: p[0], cy: p[1], r: 11 })); });
      svg.appendChild(hits);
      svg.appendChild(gParts); svg.appendChild(gTop);
    })();

    /* toolbar */
    var toolBtns = {}, chipSel = el('select', { class: 'select', id: LG.uid('chip'), 'aria-label': 'Chip type' },
      Object.keys(E.CHIPS).map(function (t) { return el('option', { value: t, text: t + ' · ' + E.CHIPS[t].name }); }));
    chipSel.addEventListener('change', function () { chipType = chipSel.value; setTool('chip'); });
    var toolbar = el('div', { class: 'bench-tools', role: 'toolbar', 'aria-label': 'Parts' }, TOOLS.map(function (t) {
      return (toolBtns[t[0]] = el('button', { class: 'tool', type: 'button', text: t[1], onclick: function () { setTool(t[0]); } }));
    }).concat(chipSel));
    var skId = LG.uid('sk'), skSel = el('select', { class: 'select', id: skId }, [['manual', 'Manual: tap a pin to flip it'], ['blink', 'Blink: D2 on and off'], ['count', 'Count: D2–D5 in binary']].map(function (x) { return el('option', { value: x[0], text: x[1] }); }));
    skSel.addEventListener('change', function () { setSketch(skSel.value); });
    var xrId = LG.uid('xr'), xr = el('input', { type: 'checkbox', id: xrId }), sgId = LG.uid('sg'), sg = el('input', { type: 'checkbox', id: sgId, checked: true });
    xr.addEventListener('change', function () { svg.classList.toggle('show-xray', xr.checked); });
    sg.addEventListener('change', function () { svg.classList.toggle('hide-sig', !sg.checked); });
    var scroller = el('div', { class: 'bench-scroll' }, svg);
    function applyZoom() { svg.style.width = Math.round(W * zoom) + 'px'; }
    host.appendChild(el('div', { class: 'bench' }, [
      o.tools === false ? null : toolbar,
      el('div', { class: 'bench-opts' }, [
        el('label', { for: skId, text: 'Sketch' }), skSel,
        el('label', { class: 'check', for: sgId }, [sg, ' Show voltages']), el('label', { class: 'check', for: xrId }, [xr, ' X-ray']),
        btn('−', function () { zoom = Math.max(0.6, zoom - 0.2); applyZoom(); }, 'ghost sq'), btn('+', function () { zoom = Math.min(2, zoom + 0.2); applyZoom(); }, 'ghost sq')]),
      scroller, status, issues, info]));
    applyZoom();
    if (o.xray) { xr.checked = true; svg.classList.add('show-xray'); }

    function setTool(t) {
      tool = t; pending = null;
      Object.keys(toolBtns).forEach(function (k) { toolBtns[k].classList.toggle('on', k === t); });
      svg.classList.toggle('erase', t === 'erase');
      say(TOOL_HELP[t]); draw();
    }
    function say(msg, bad) { status.innerHTML = msg; status.classList.toggle('bad', !!bad); }
    function setSketch(s) {
      sketch = s; skSel.value = s; clearInterval(timer); timer = null; count = 0;
      if (s === 'manual') return;
      timer = setInterval(function () {
        count++;
        if (sketch === 'blink') board.pins.D2 = count & 1;
        else E.OUT_PINS.forEach(function (p, i) { board.pins[p] = (count >> i) & 1; });
        refresh(true);
      }, 600);
    }
    ctx.onCleanup(function () { clearInterval(timer); });

    function wireColor(a, b, n) {
      var nets = [E.netOf(a), E.netOf(b)];
      if (nets.some(function (x) { return x === 'TP' || x === 'BP' || x === 'P:5V'; })) return '#D23B30';
      if (nets.some(function (x) { return x === 'TM' || x === 'BM' || x === 'P:GND'; })) return '#2B3440';
      if (n == null) n = board.parts.filter(function (p) { return p.k === 'wire'; }).length;
      return WIRE_COLORS[n % WIRE_COLORS.length];
    }
    function place(part) {
      var r = board.add(part);
      if (!r.ok) { say(r.why, true); return false; }
      return true;
    }
    function onHole(h) {
      var occ = board.occupied();
      if (tool === 'erase') { if (occ[h]) { board.remove(occ[h].id); say('Removed.'); refresh(); } return; }
      if (tool === 'chip') {
        if (h[0] === 'P') return say('Tap a hole on the breadboard, not on the controller.', true);
        var col = +/\d+$/.exec(h)[0];
        if (place({ k: 'chip', type: chipType, col: col })) { say(chipType + ' placed. Remember its power: pin 14 to +, pin 7 to −.'); selChip = board.parts[board.parts.length - 1].id; refresh(); }
        return;
      }
      if (pending === null) {
        if (occ[h]) return say('That hole is already in use. Each hole takes one lead. Use another hole in the same strip.', true);
        if (tool !== 'wire' && h[0] === 'P') return say('Only wires plug into the controller. Put parts on the breadboard.', true);
        pending = h; say(tool === 'led' ? 'Now tap the hole for the − leg.' : 'Now tap the second hole.'); draw();
        return;
      }
      if (h === pending) { pending = null; say(TOOL_HELP[tool]); draw(); return; }
      var part = { k: tool, a: pending, b: h };
      if (tool === 'wire') part.color = wireColor(pending, h);
      if (tool === 'led') part.color = LED_COLORS[board.parts.filter(function (p) { return p.k === 'led'; }).length % 4];
      if (tool === 'sw') part.on = false;
      if (place(part)) { pending = null; say(TOOL_HELP[tool]); refresh(); }
    }
    function onPart(id) {
      var part = board.parts.filter(function (p) { return p.id === id; })[0];
      if (!part) return;
      if (tool === 'erase') { board.remove(id); if (selChip === id) selChip = null; say('Removed.'); refresh(); return; }
      if (part.k === 'sw') { part.on = !part.on; say('Switch ' + (part.on ? 'closed: current can pass.' : 'open: the path is broken.')); refresh(); }
      else if (part.k === 'chip') { selChip = selChip === id ? null : id; draw(); }
    }
    svg.addEventListener('keydown', function (e) {
      if ((e.key === ' ' || e.key === 'Enter') && e.target.closest && e.target.closest('[data-pin]')) { e.preventDefault(); e.target.closest('[data-pin]').dispatchEvent(new MouseEvent('click', { bubbles: true })); }
    });
    svg.addEventListener('click', function (e) {
      var t = e.target, pin = t.closest && t.closest('[data-pin]'), part = t.closest && t.closest('[data-part]');
      if (pin) {
        var p = pin.getAttribute('data-pin');
        if (sketch !== 'manual') setSketch('manual');
        board.pins[p] = board.pins[p] ? 0 : 1; say(p + ' is now ' + (board.pins[p] ? 'HIGH (5 V).' : 'LOW (0 V).')); refresh();
      } else if (part) onPart(+part.getAttribute('data-part'));
      else if (t.getAttribute && t.getAttribute('data-hole')) onHole(t.getAttribute('data-hole'));
    });

    function refresh(quiet) {
      last = board.sim();
      draw();
      if (o.onChange) o.onChange(board, last, !!quiet);
    }
    function draw() {
      var r = last || (last = board.sim());
      /* controller pins */
      gCtl.innerHTML = '';
      Object.keys(PINCOL).forEach(function (p) {
        var x = X(PINCOL[p]), isO = E.OUT_PINS.indexOf(p) >= 0, isI = E.IN_PINS.indexOf(p) >= 0;
        gCtl.appendChild(el('text', { class: 'pin-name', x: x, y: PINY - 14, 'text-anchor': 'middle', text: p }));
        if (isO) {
          var v = board.pins[p];
          gCtl.appendChild(el('g', { class: 'pin-btn' + (v ? ' on' : ''), 'data-pin': p, role: 'switch', 'aria-checked': v ? 'true' : 'false', 'aria-label': 'Pin ' + p, tabindex: '0' }, [
            el('rect', { x: x - 20, y: 14, width: 40, height: 28, rx: 6 }), el('text', { x: x, y: 33, 'text-anchor': 'middle', text: v ? 'HIGH' : 'LOW' })]));
        } else if (isI) {
          var l = r.pinsIn[p];
          gCtl.appendChild(el('g', { class: 'pin-read' + (l.v === 1 ? ' on' : '') }, [
            el('rect', { x: x - 20, y: 14, width: 40, height: 28, rx: 6 }), el('text', { x: x, y: 33, 'text-anchor': 'middle', text: l.v === 1 ? 'HIGH' : l.v === 0 ? 'LOW' : '?' })]));
        }
      });
      /* voltages */
      gSig.innerHTML = '';
      var occ = board.occupied(), live = {};
      Object.keys(occ).forEach(function (h) { live[E.netOf(h)] = true; });
      allHoles().forEach(function (h) {
        var l = r.level(h);
        if (l.v === null || l.conflict) return;
        if (h[0] !== 'P' && !/^(tp|tm|bp|bm)/.test(h) && !live[E.netOf(h)]) return;
        var p = xy(h);
        gSig.appendChild(el('circle', { class: l.v ? 'v1' : 'v0', cx: p[0], cy: p[1], r: 6.5 }));
      });
      /* parts: chips underneath, wires on top */
      gParts.innerHTML = '';
      var order = { chip: 0, res: 1, sw: 2, led: 3, wire: 4 };
      board.parts.slice().sort(function (a, b) { return order[a.k] - order[b.k]; }).forEach(function (p) { gParts.appendChild(drawPart(p, r)); });
      gTop.innerHTML = '';
      if (pending) { var pp = xy(pending); gTop.appendChild(el('circle', { class: 'pending', cx: pp[0], cy: pp[1], r: 10 })); }
      /* messages */
      issues.innerHTML = r.errors.map(function (m) { return '<p class="issue err">' + m + '</p>'; }).join('') +
        r.warnings.filter(function (m, i, a) { return a.indexOf(m) === i; }).map(function (m) { return '<p class="issue warn">' + m + '</p>'; }).join('');
      var chip = board.parts.filter(function (p) { return p.id === selChip; })[0];
      info.innerHTML = chip ? pinout(chip.type) : (board.parts.some(function (p) { return p.k === 'chip'; }) ? '<p class="hint-inline">Tap a chip to see its pin map.</p>' : '');
    }
    function drawPart(p, r) {
      var g = el('g', { class: 'part part-' + p.k, 'data-part': p.id });
      if (p.k === 'chip') {
        var x1 = X(p.col) - 9, x2 = X(p.col + 6) + 9, y1 = ROWY.e + 8, y2 = ROWY.f - 8, powered = r.chips[p.id] && r.chips[p.id].powered;
        for (var i = 0; i < 7; i++) {
          g.appendChild(el('rect', { class: 'leg', x: X(p.col + i) - 3, y: ROWY.e - 4, width: 6, height: 14 }));
          g.appendChild(el('rect', { class: 'leg', x: X(p.col + i) - 3, y: ROWY.f - 10, width: 6, height: 14 }));
        }
        g.appendChild(el('rect', { class: 'chip-body' + (p.id === selChip ? ' sel' : ''), x: x1, y: y1, width: x2 - x1, height: y2 - y1, rx: 4 }));
        g.appendChild(el('circle', { class: 'chip-notch', cx: x1 + 1, cy: (y1 + y2) / 2, r: 6 }));
        g.appendChild(el('circle', { class: 'chip-dot', cx: x1 + 13, cy: y2 - 9, r: 2.6 }));
        g.appendChild(el('text', { class: 'chip-text', x: (x1 + x2) / 2 + 4, y: (y1 + y2) / 2 + 1, 'text-anchor': 'middle', text: r.chips[p.id].label + '  ' + p.type + '  ' + (E.CHIPS[p.type].gate || 'D-FF') }));
        g.appendChild(el('circle', { class: 'chip-pwr' + (powered ? ' on' : ''), cx: x2 - 10, cy: y1 + 9, r: 3 }));
        g.appendChild(el('text', { class: 'chip-pin', x: x1 + 12, y: y1 + 12, 'text-anchor': 'middle', text: '14' }));
        g.appendChild(el('text', { class: 'chip-pin', x: x2 - 9, y: y2 - 5, 'text-anchor': 'middle', text: '7' }));
        g.appendChild(el('text', { class: 'chip-pin', x: x1 + 22, y: y2 - 5, 'text-anchor': 'middle', text: '1' }));
        return g;
      }
      var a = xy(p.a), b = xy(p.b), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      var ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
      if (p.k === 'wire') {
        var sag = Math.min(34, 6 + len * 0.1), d = 'M' + a[0] + ',' + a[1] + ' Q' + mx + ',' + (my + sag) + ' ' + b[0] + ',' + b[1];
        g.appendChild(el('path', { class: 'wire-shadow', d: d }));
        g.appendChild(el('path', { class: 'wire-body', d: d, stroke: p.color || '#2F6FDE' }));
        g.appendChild(el('circle', { class: 'wire-end', cx: a[0], cy: a[1], r: 4.2, fill: p.color })); g.appendChild(el('circle', { class: 'wire-end', cx: b[0], cy: b[1], r: 4.2, fill: p.color }));
        g.appendChild(el('path', { class: 'wire-hit', d: d }));
        return g;
      }
      g.appendChild(el('line', { class: 'lead', x1: a[0], y1: a[1], x2: b[0], y2: b[1] }));
      var body = el('g', { transform: 'translate(' + mx + ',' + my + ') rotate(' + ang + ')' });
      if (p.k === 'res') {
        body.appendChild(el('rect', { class: 'res-body', x: -17, y: -6.5, width: 34, height: 13, rx: 5 }));
        [['#C0392B', -10], ['#C0392B', -4], ['#6B4226', 2], ['#C9A227', 10]].forEach(function (s) { body.appendChild(el('rect', { x: s[1] - 1.5, y: -6.5, width: 3, height: 13, fill: s[0] })); });
      } else if (p.k === 'sw') {
        body.appendChild(el('rect', { class: 'sw-body' + (p.on ? ' on' : ''), x: -19, y: -10, width: 38, height: 20, rx: 5 }));
        body.appendChild(el('rect', { class: 'sw-knob', x: p.on ? 2 : -15, y: -6.5, width: 13, height: 13, rx: 3 }));
      } else {
        var st = r.leds[p.id] || {};
        g.classList.add('led-' + (p.color || 'red'));
        if (st.lit) g.classList.add('lit');
        if (st.blown) g.classList.add('blown');
        if (st.lit) body.appendChild(el('circle', { class: 'led-glow', r: 22 }));
        body.appendChild(el('circle', { class: 'led-dome', r: 10.5 }));
        body.appendChild(el('circle', { class: 'led-shine', cx: -3, cy: -3.5, r: 3 }));
        if (st.blown) body.appendChild(el('text', { class: 'led-x', y: 4.5, 'text-anchor': 'middle', text: '✕' }));
        g.appendChild(el('text', { class: 'led-plus', x: a[0], y: a[1] - 9, 'text-anchor': 'middle', text: '+' }));
      }
      g.appendChild(body);
      g.appendChild(el('circle', { class: 'lead-end', cx: a[0], cy: a[1], r: 3 })); g.appendChild(el('circle', { class: 'lead-end', cx: b[0], cy: b[1], r: 3 }));
      return g;
    }

    this.load = function (state) {
      board = new E.Board(state || {}); pending = null; selChip = null; last = null;
      var nw = 0, nl = 0;
      board.parts.forEach(function (p) {
        if (p.k === 'wire' && !p.color) p.color = wireColor(p.a, p.b, nw++);
        if (p.k === 'led' && !p.color) p.color = LED_COLORS[nl++ % 4];
      });
      setSketch('manual');
      refresh(true);
      setTool('wire');
    };
    this.board = function () { return board; };
    this.say = say;
    this.load(o.state);
  }

  /* A single board inside a lesson. */
  LG.widget('board', function (host, o, ctx) {
    var preset = typeof o.preset === 'string' ? E.PRESETS[o.preset]() : o.preset;
    var bench = new Bench(host, { state: preset, tools: o.tools, xray: o.xray }, ctx);
    host.appendChild(el('div', { class: 'ctrl' }, [btn('Start again', function () { bench.load(typeof o.preset === 'string' ? E.PRESETS[o.preset]() : o.preset); }, 'ghost')]));
  });

  /* The wiring lab: a list of challenges on one bench. */
  LG.widget('lab', function (host, o, ctx) {
    var CH = E.CHALLENGES, cur = null, bench, picker = el('div', { class: 'lab-picker', role: 'tablist' }), panel = el('div', { class: 'lab-panel' });
    var fb, ready = false, benchHost = el('div');
    host.appendChild(picker); host.appendChild(panel); host.appendChild(benchHost);
    var actions = el('div', { class: 'ctrl' }, [
      btn('Check my circuit', function () { verdict(true); }),
      btn('Start again', function () { if (cur) { bench.load(startState(cur)); save(); fb('', ''); } else { bench.load({}); save(); } }, 'ghost'),
      btn('Show a solution', function () { if (!cur) return; bench.load({ parts: cur.solution(), pins: cur.pins }); save(); fb('', 'This is one working layout. Study it, press Start again, and build your own.'); }, 'ghost')]);
    host.appendChild(actions);
    fb = LG.feedback(host);
    bench = new Bench(benchHost, { onChange: function (b, r, quiet) { if (!ready) return; save(); if (!quiet) verdict(false); } }, ctx);
    function key() { return 'lab.' + (cur ? cur.id : 'free'); }
    function save() { if (ready) LG.store.set(key(), bench.board().toJSON()); }
    function startState(ch) { return { parts: ch.setup(), pins: ch.pins }; }
    function verdict(loud) {
      if (!cur) { if (loud) fb('', 'Free build has nothing to check. Make anything you like.'); return; }
      var res = cur.check(bench.board());
      if (res.ok) { LG.markDone(ctx.ch.id + '/' + cur.id); fb('good', '<b>It works.</b> ' + cur.title + ' is complete.'); paintPicker(); }
      else if (loud) fb('bad', res.msg);
    }
    function paintPicker() {
      picker.innerHTML = '';
      CH.concat([null]).forEach(function (ch, i) {
        var isDone = ch && LG.isDone(ctx.ch.id + '/' + ch.id);
        picker.appendChild(el('button', { class: 'lab-tab' + (ch === cur ? ' on' : '') + (isDone ? ' done' : ''), type: 'button', role: 'tab', 'aria-selected': ch === cur ? 'true' : 'false',
          onclick: function () { choose(ch); } }, [el('span', { class: 'mono', text: ch ? (i + 1) : '∞' }), ch ? ch.title : 'Free build', isDone ? el('i', { text: ' ✓' }) : null]));
      });
    }
    function choose(ch) {
      cur = ch; LG.store.set('lab.current', ch ? ch.id : 'free');
      panel.innerHTML = ch
        ? '<div class="lab-head"><span class="chip">' + ch.level + '</span><h3>' + ch.title + '</h3></div><p class="lab-goal">' + ch.goal + '</p><details class="reveal"' + (ch.level === 'Start' ? ' open' : '') + '><summary>Step-by-step guide</summary><ol>' + ch.steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol></details>'
        : '<div class="lab-head"><span class="chip">Open</span><h3>Free build</h3></div><p class="lab-goal">An empty board. Build anything: a 4-bit adder, a traffic light, a bigger latch. Nothing here is checked.</p>';
      ready = false;
      bench.load(LG.store.get(key(), null) || (ch ? startState(ch) : { parts: [] }));
      ready = true;
      fb('', ''); paintPicker();
      if (ch && LG.isDone(ctx.ch.id + '/' + ch.id)) fb('good', 'You have already completed this one. Feel free to rebuild it.');
    }
    var want = LG.store.get('lab.current', CH[0].id);
    choose(CH.filter(function (c) { return c.id === want; })[0] || (want === 'free' ? null : CH[0]));
  }, function () { return E.CHALLENGES.map(function (c) { return c.id; }); });
})();
