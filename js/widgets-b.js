/* Interactives for Parts III to V: arithmetic, memory, and the LG-8 computer. */
(function () {
  'use strict';
  var LG = window.LG, E = window.LGE, el = LG.el, btn = LG.btn, labelled = LG.labelled;

  /* ── ripple-carry adder / subtractor ── */
  function mountAdder(host, o, ctx) {
    var g = LG.goal(host, o, ctx), n = o.n || 4, mask = (1 << n) - 1, sub = !!o.sub, shown = n, timer = null;
    var rowA = LG.bitRow({ n: n, value: o.a == null ? 5 : o.a, onChange: function () { shown = n; paint(); }, name: 'A bit' });
    var rowB = LG.bitRow({ n: n, value: o.b == null ? 3 : o.b, weights: false, onChange: function () { shown = n; paint(); }, name: 'B bit' });
    var grid = el('div', { class: 'addgrid' }), say = el('p', { class: 'live', 'aria-live': 'polite' });
    g.body.appendChild(el('div', { class: 'scrollx' }, [el('div', { class: 'adder' }, [labelled('A', rowA.el), labelled(sub ? 'B' : '+ B', rowB.el), grid])]));
    g.body.appendChild(el('div', { class: 'ctrl' }, [btn('Show it column by column', function () {
      clearInterval(timer); shown = 0; paint();
      timer = setInterval(function () { shown++; paint(); if (shown >= n) clearInterval(timer); }, 900);
    }, 'ghost')]));
    g.body.appendChild(say);
    ctx.onCleanup(function () { clearInterval(timer); });
    function signed(v) { return v & (1 << (n - 1)) ? v - (1 << n) : v; }
    function paint() {
      var a = rowA.get(), b = rowB.get(), bb = sub ? (~b) & mask : b, carry = sub ? 1 : 0, sum = 0, carries = [carry];
      for (var i = 0; i < n; i++) { var t = ((a >> i) & 1) + ((bb >> i) & 1) + carry; sum |= (t & 1) << i; carry = t >> 1; carries.push(carry); }
      var cell = function (v, cls) { return '<span class="ac ' + (cls || '') + '">' + v + '</span>'; }, html = '';
      if (sub) {
        html += '<div class="lrow"><span class="lrow-label">B flipped</span><div class="acrow"><span class="ac blank"></span>';
        for (i = n - 1; i >= 0; i--) html += cell((bb >> i) & 1);
        html += '</div></div>';
      }
      html += '<div class="lrow"><span class="lrow-label">Carries</span><div class="acrow">';
      for (i = n; i >= 0; i--) html += cell(i <= shown ? carries[i] : '·', 'carry' + (i <= shown && carries[i] ? ' one' : '') + (i === 0 && sub ? ' cin' : ''));
      html += '</div></div><div class="lrow total"><span class="lrow-label">Result</span><div class="acrow"><span class="ac blank"></span>';
      for (i = n - 1; i >= 0; i--) html += cell(i < shown ? (sum >> i) & 1 : '·', 'sum' + (i < shown && (sum >> i) & 1 ? ' one' : '') + (i === shown - 1 && shown < n ? ' now' : ''));
      grid.innerHTML = html + '</div></div>';
      if (shown < n) { say.innerHTML = shown === 0 ? 'Start at the right-most column.' : 'Column ' + shown + ': ' + ((a >> (shown - 1)) & 1) + ' + ' + ((bb >> (shown - 1)) & 1) + ' + carry ' + carries[shown - 1] + ' → write ' + ((sum >> (shown - 1)) & 1) + ', carry ' + carries[shown] + '.'; return; }
      if (sub) {
        var ok = signed(a) - signed(b) === signed(sum);
        say.innerHTML = 'Read as signed numbers: <b>' + signed(a) + ' − ' + signed(b) + ' = ' + signed(sum) + '</b>.' + (ok ? ' The adder subtracted, using only a row of NOT gates and a carry-in of 1.' : ' The true answer ' + (signed(a) - signed(b)) + ' does not fit in ' + n + ' signed bits, so this result has overflowed.');
      } else {
        say.innerHTML = '<b>' + a + ' + ' + b + ' = ' + (a + b) + '</b>.' + (carries[n] ? ' The answer needs a ' + (n + 1) + 'th bit. With only ' + n + ' result bits the adder would show ' + sum + ': that is <b>overflow</b>.' : '');
      }
      g.check({ a: a, b: b, sum: sum, carry: carries[n], carries: carries });
    }
    paint();
  }
  LG.widget('adder', mountAdder);
  LG.widget('adderq', mountAdder, true);

  /* ── two's complement number wheel ── */
  LG.widget('wheel', function (host) {
    var v = 0, svgBox = el('div', { class: 'wheel-box' }), say = el('p', { class: 'live', 'aria-live': 'polite' });
    host.appendChild(el('div', { class: 'two-col' }, [svgBox, el('div', {}, [
      el('div', { class: 'ctrl' }, [btn('− 1', function () { step(-1); }), btn('+ 1', function () { step(1); })]), say])]));
    function step(d) { var old = v; v = (v + d) & 15; paint(old, d); }
    function sg(x) { return x > 7 ? x - 16 : x; }
    function paint(old, d) {
      var svg = el('svg', { viewBox: '-150 -150 300 300', class: 'wheel' });
      for (var k = 0; k < 16; k++) {
        var ang = (k / 16) * 2 * Math.PI - Math.PI / 2, cx = Math.cos(ang), cy = Math.sin(ang);
        svg.appendChild(el('circle', { class: 'wh-dot' + (k === v ? ' on' : '') + (k > 7 ? ' neg' : ''), cx: cx * 92, cy: cy * 92, r: k === v ? 17 : 14 }));
        svg.appendChild(el('text', { class: 'wh-s' + (k === v ? ' on' : ''), x: cx * 92, y: cy * 92 + 5, 'text-anchor': 'middle', text: sg(k) }));
        svg.appendChild(el('text', { class: 'wh-b', x: cx * 130, y: cy * 130 + 4, 'text-anchor': 'middle', text: LG.bin(k, 4) }));
      }
      svg.appendChild(el('text', { class: 'wh-c', x: 0, y: -6, 'text-anchor': 'middle', text: LG.bin(v, 4) }));
      svg.appendChild(el('text', { class: 'wh-c2', x: 0, y: 18, 'text-anchor': 'middle', text: 'signed ' + sg(v) + ' · unsigned ' + v }));
      svgBox.innerHTML = ''; svgBox.appendChild(svg);
      if (old === undefined) say.innerHTML = 'Step around the wheel. The bit patterns simply count upward. Only our reading of them changes at the top bit.';
      else if (old === 7 && d === 1) say.innerHTML = '<b>Overflow.</b> 0111 (+7) plus one is 1000, which reads as −8. The 4-bit signed range has run out.';
      else if (old === 8 && d === -1) say.innerHTML = '<b>Overflow.</b> 1000 (−8) minus one wraps to 0111 (+7).';
      else if (old === 15 && d === 1) say.innerHTML = '1111 (−1) plus one rolls over to 0000. The carry out of the top is thrown away, and the answer, 0, is exactly right.';
      else say.innerHTML = LG.bin(old, 4) + ' ' + (d > 0 ? '+' : '−') + ' 1 = ' + LG.bin(v, 4) + ', read as ' + sg(v) + '.';
    }
    paint();
  });

  /* ── decoder: an address picks one line ── */
  LG.widget('decoder', function (host, o) {
    var n = o.n || 2, list = el('div', { class: 'declist' });
    var row = LG.bitRow({ n: n, value: 0, onChange: paint, weights: function (i) { return 'A' + i; }, name: 'Address bit' });
    host.appendChild(el('div', { class: 'two-col' }, [el('div', {}, [el('p', { class: 'hint-inline', text: 'Address in' }), row.el]), list]));
    function paint() {
      var v = row.get(), html = '';
      for (var k = 0; k < (1 << n); k++) {
        var expr = [];
        for (var i = n - 1; i >= 0; i--) expr.push(((k >> i) & 1 ? '' : '¬') + 'A' + i);
        html += '<div class="decline' + (k === v ? ' on' : '') + '"><span class="mono">' + expr.join(' · ') + '</span><b>Line ' + k + '</b><i>' + (k === v ? 1 : 0) + '</i></div>';
      }
      list.innerHTML = html;
    }
    paint();
  });

  /* ── mini ALU ── */
  var ALU_OPS = [
    { n: 'ADD', f: function (a, b) { return a + b; }, s: '+' }, { n: 'SUB', f: function (a, b) { return a + ((~b) & 15) + 1; }, s: '−' },
    { n: 'AND', f: function (a, b) { return a & b; }, s: 'AND' }, { n: 'OR', f: function (a, b) { return a | b; }, s: 'OR' },
    { n: 'XOR', f: function (a, b) { return a ^ b; }, s: 'XOR' }, { n: 'NOT A', f: function (a) { return (~a) & 15; }, s: '' }];
  function mountAlu(host, o, ctx) {
    var g = LG.goal(host, o, ctx), op = 0, res = LG.bitRow({ n: 4, readonly: true, weights: false }), flags = el('div', { class: 'flags' }), say = el('p', { class: 'live', 'aria-live': 'polite' });
    var rowA = LG.bitRow({ n: 4, value: 6, onChange: paint, name: 'A bit' }), rowB = LG.bitRow({ n: 4, value: 3, weights: false, onChange: paint, name: 'B bit' });
    var ops = el('div', { class: 'tabs' }, ALU_OPS.map(function (x, i) { return el('button', { class: 'tab', type: 'button', html: x.n + ' <code>' + LG.bin(i, 3) + '</code>', onclick: function () { op = i; paint(); } }); }));
    g.body.appendChild(el('p', { class: 'hint-inline', text: 'Operation (chosen by a 3-bit code):' }));
    g.body.appendChild(ops);
    g.body.appendChild(el('div', { class: 'scrollx' }, el('div', { class: 'adder' }, [labelled('A', rowA.el), labelled('B', rowB.el), labelled('Result', res.el)])));
    g.body.appendChild(flags); g.body.appendChild(say);
    function paint() {
      var a = rowA.get(), b = rowB.get(), raw = ALU_OPS[op].f(a, b), r = raw & 15, carry = op < 2 ? (raw >> 4) & 1 : 0;
      [].forEach.call(ops.children, function (t, i) { t.classList.toggle('on', i === op); });
      res.set(r);
      flags.innerHTML = [['Zero', r === 0], ['Carry', carry], ['Negative', r >> 3]].map(function (f) { return '<span class="flag' + (f[1] ? ' on' : '') + '">' + f[0] + ' <b>' + (f[1] ? 1 : 0) + '</b></span>'; }).join('');
      say.innerHTML = op === 5 ? 'NOT ' + LG.bin(a, 4) + ' = ' + LG.bin(r, 4) + '. Every bit flipped.' : op > 1 ? LG.bin(a, 4) + ' ' + ALU_OPS[op].s + ' ' + LG.bin(b, 4) + ' = ' + LG.bin(r, 4) + ', worked out one column at a time.'
        : a + ' ' + ALU_OPS[op].s + ' ' + b + ' = ' + (op === 0 ? a + b : a - b) + (op === 0 && carry ? ' (too big for 4 bits, so Carry = 1)' : '') + (op === 1 && a === b ? '. Equal numbers give zero: this is how a computer tests “is A equal to B?”' : '.');
      g.check({ a: a, b: b, op: ALU_OPS[op].n, r: r, zero: r === 0, carry: carry });
    }
    paint();
  }
  LG.widget('alu', mountAlu);
  LG.widget('aluq', mountAlu, true);

  /* ── latch vs flip-flop on a timing diagram ── */
  LG.widget('timing', function (host) {
    var D = 0, CLK = 0, QL = 0, QF = 0, hist = [], box = el('div', { class: 'scrollx' }), say = el('p', { class: 'live', 'aria-live': 'polite' });
    function sample(k) { for (var i = 0; i < (k || 2); i++) hist.push([D, CLK, QL, QF]); if (hist.length > 40) hist = hist.slice(-40); }
    function settle(rise) { if (CLK) QL = D; if (rise) QF = D; }
    host.appendChild(box);
    host.appendChild(el('div', { class: 'ctrl' }, [
      btn('Flip D', function () { D ^= 1; settle(false); sample(); paint(CLK ? 'D changed while the clock is high. The <b>latch</b> is transparent, so its Q followed at once. The <b>flip-flop</b> ignored it.' : 'D changed while the clock is low. Neither output moved: nothing is listening.'); }),
      btn('Flip CLK', function () { CLK ^= 1; settle(CLK === 1); sample(); paint(CLK ? 'Rising edge. This is the one instant when the <b>flip-flop</b> copies D (now ' + D + ').' : 'Clock fell. The latch closes and holds its value.'); }),
      btn('Reset', function () { D = CLK = QL = QF = 0; hist = []; sample(4); paint('Flip D and CLK in any order and compare the two Q lines.'); }, 'ghost')]));
    host.appendChild(say);
    function paint(msg) {
      var step = 16, rowH = 44, names = ['D', 'CLK', 'Q latch', 'Q flip-flop'], w = 92 + 40 * step, svg = el('svg', { viewBox: '0 0 ' + w + ' ' + (rowH * 4 + 10), class: 'timing', style: 'min-width:560px' });
      names.forEach(function (nm, r) {
        var y0 = r * rowH + 36, d = '', last = null;
        svg.appendChild(el('text', { class: 'tm-name', x: 4, y: y0 - 8, text: nm }));
        svg.appendChild(el('line', { class: 'plot-grid', x1: 92, x2: w, y1: y0, y2: y0 }));
        hist.forEach(function (s, i) {
          var y = y0 - s[r] * 24, x = 92 + i * step;
          d += (last === null ? 'M' + x + ',' + y : (last !== y ? ' V' + y : '')) + ' H' + (x + step);
          if (r === 1 && i > 0 && s[1] && !hist[i - 1][1]) svg.appendChild(el('line', { class: 'tm-edge', x1: x, x2: x, y1: 6, y2: rowH * 4 + 4 }));
          last = y;
        });
        svg.appendChild(el('path', { class: 'tm-wave r' + r, d: d }));
      });
      box.innerHTML = ''; box.appendChild(svg); box.scrollLeft = 1e4;
      say.innerHTML = msg + ' <span class="mono">D=' + D + ' CLK=' + CLK + ' latch=' + QL + ' flip-flop=' + QF + '</span>';
    }
    sample(4); paint('Flip D and CLK in any order and compare the two Q lines.');
  });

  /* ── registers: load, shift, count ── */
  function mountRegs(host, o, ctx) {
    var g = LG.goal(host, o, ctx), mode = o.mode || 'load', n = 4, q = 0, load = 1, ser = 1, timer = null, pulses = 0;
    var qRow = LG.bitRow({ n: n, readonly: true, weights: mode === 'count' ? undefined : false }), say = el('p', { class: 'live', 'aria-live': 'polite' });
    var dRow = LG.bitRow({ n: n, value: 9, weights: false, onChange: function () { paint('D changed, but Q has not. A register only looks at D when the clock ticks.'); }, name: 'D bit' });
    var kids = [];
    if (mode === 'load') kids.push(labelled('D (inputs)', dRow.el));
    kids.push(labelled(mode === 'load' ? 'Q (stored)' : 'Q', qRow.el));
    g.body.appendChild(el('div', { class: 'scrollx' }, el('div', { class: 'adder' }, kids)));
    var ctrl = [btn('Clock tick ↑', tick)];
    if (mode === 'load') {
      var lid = LG.uid('ld'), cb = el('input', { type: 'checkbox', id: lid, checked: true });
      cb.addEventListener('change', function () { load = cb.checked ? 1 : 0; paint(load ? 'Load is on: the next tick will copy D into Q.' : 'Load is off: ticks will pass and Q will keep its value.'); });
      ctrl.push(el('label', { class: 'check', for: lid }, [cb, ' Load enable']));
    }
    if (mode === 'shift') ctrl.push(btn('Serial in: 1', function (e) { ser ^= 1; e.target.textContent = 'Serial in: ' + ser; }, 'ghost'));
    if (mode === 'count') ctrl.push(btn('Auto', function (e) { if (timer) { clearInterval(timer); timer = null; e.target.textContent = 'Auto'; } else { timer = setInterval(tick, 500); e.target.textContent = 'Stop'; } }, 'ghost'));
    ctrl.push(btn('Clear', function () { q = 0; pulses = 0; paint('Cleared to 0000.'); }, 'ghost'));
    g.body.appendChild(el('div', { class: 'ctrl' }, ctrl)); g.body.appendChild(say);
    ctx.onCleanup(function () { clearInterval(timer); });
    function tick() {
      pulses++;
      if (mode === 'load') { if (load) { q = dRow.get(); paint('Tick. All four flip-flops copied their D input at the same instant. Q is now ' + LG.bin(q, 4) + '.'); } else paint('Tick, but Load is off. Q keeps ' + LG.bin(q, 4) + '.'); }
      else if (mode === 'shift') { q = ((q << 1) | ser) & 15; paint('Tick. Every bit moved one place left and a ' + ser + ' entered on the right.'); }
      else { q = (q + 1) & 15; paint('Tick ' + pulses + '. Q = ' + LG.bin(q, 4) + ' = ' + q + '.' + (q === 0 ? ' It wrapped round to zero.' : '')); }
    }
    function paint(msg) { qRow.set(q); say.innerHTML = msg; g.check({ q: q, d: dRow.get(), pulses: pulses }); }
    paint(mode === 'load' ? 'Set some D bits, then press Clock tick.' : mode === 'shift' ? 'Press Clock tick a few times. Change the serial input between ticks.' : 'Each tick adds one.');
  }
  LG.widget('regs', mountRegs);
  LG.widget('regsq', mountRegs, true);

  /* ── RAM: address, data, write ── */
  function mountRam(host, o, ctx) {
    var g = LG.goal(host, o, ctx), cells = [0, 0, 0, 0, 0, 0, 0, 0], grid = el('div', { class: 'ramgrid' }), say = el('p', { class: 'live', 'aria-live': 'polite' });
    (o.init || []).forEach(function (v, i) { cells[i] = v; });
    var addr = LG.bitRow({ n: 3, value: 0, onChange: function () { paint('The decoder switched on row ' + addr.get() + '. Its contents appear at Data out.'); }, weights: function (i) { return 'A' + i; }, name: 'Address bit' });
    var data = LG.bitRow({ n: 4, value: 0, onChange: function () { paint('Data in is waiting. Nothing is stored until you press Write.'); }, name: 'Data bit' });
    var outRow = LG.bitRow({ n: 4, readonly: true, weights: false });
    g.body.appendChild(el('div', { class: 'two-col ram' }, [
      el('div', {}, [labelled('Address', addr.el), labelled('Data in', data.el), el('div', { class: 'ctrl' }, [btn('Write', function () { cells[addr.get()] = data.get(); paint('Stored ' + LG.bin(data.get(), 4) + ' (' + data.get() + ') at address ' + addr.get() + '.'); })]), labelled('Data out', outRow.el)]),
      grid]));
    g.body.appendChild(say);
    function paint(msg) {
      var a = addr.get();
      grid.innerHTML = '<div class="ramhead"><span>Addr</span><span>Stored bits</span><span>Value</span></div>' + cells.map(function (v, i) {
        return '<div class="ramrow' + (i === a ? ' on' : '') + '"><span class="mono">' + LG.bin(i, 3) + '</span><span class="mono cells">' + LG.bin(v, 4).split('').map(function (b) { return '<i class="' + (b === '1' ? 'one' : '') + '">' + b + '</i>'; }).join('') + '</span><span class="mono">' + v + '</span></div>';
      }).join('');
      outRow.set(cells[a]); say.innerHTML = msg; g.check(cells);
    }
    paint('Choose an address, set Data in, press Write. Then visit other addresses and come back.');
  }
  LG.widget('ram', mountRam);
  LG.widget('ramq', mountRam, true);

  /* ── DRAM: leaky buckets that need refreshing ── */
  LG.widget('dram', function (host, o, ctx) {
    var pattern = [1, 0, 1, 1, 0, 0, 1, 0], charge = [], refresh = false, t = 0, box = el('div', { class: 'dram' }), say = el('p', { class: 'live', 'aria-live': 'polite' });
    var id = LG.uid('rf'), cb = el('input', { type: 'checkbox', id: id });
    cb.addEventListener('change', function () { refresh = cb.checked; });
    function write() { charge = pattern.map(function (b) { return b ? 100 : 0; }); t = 0; paint(); }
    host.appendChild(box);
    host.appendChild(el('div', { class: 'ctrl' }, [btn('Write 10110010 again', write), el('label', { class: 'check', for: id }, [cb, ' Refresh automatically'])]));
    host.appendChild(say);
    var timer = setInterval(function () {
      t++;
      charge = charge.map(function (c, i) { return Math.max(0, c - (3.2 + (i % 3) * 0.9)); });
      if (refresh && t % 8 === 0) charge = charge.map(function (c) { return c > 50 ? 100 : 0; });
      paint();
    }, 250);
    ctx.onCleanup(function () { clearInterval(timer); });
    function paint() {
      var wrong = 0;
      box.innerHTML = charge.map(function (c, i) {
        var read = c > 50 ? 1 : 0, bad = read !== pattern[i]; if (bad) wrong++;
        return '<div class="cap' + (bad ? ' err' : '') + '"><div class="cap-jar"><div class="cap-fill" style="height:' + c + '%"></div><div class="cap-line"></div></div><b class="mono">' + read + '</b></div>';
      }).join('');
      say.innerHTML = wrong ? '<b>' + wrong + ' bit' + (wrong > 1 ? 's have' : ' has') + ' been lost.</b> The charge leaked below the half-way line, so those cells now read 0.'
        : refresh ? 'Refresh is on: every couple of seconds each cell is read and topped back up before it can fade. Real memory does this thousands of times a second.' : 'Each 1 is a tiny charged capacitor, and it is leaking. Watch the levels fall toward the half-way line.';
    }
    write();
  });

  /* ── power cut: RAM forgets, storage keeps ── */
  LG.widget('powercut', function (host) {
    var ram = 'Dear diary, today I learnt', disk = '', power = true, id = LG.uid('pc');
    var input = el('input', { type: 'text', id: id, class: 'answer wide', maxlength: 60, autocomplete: 'off' }), diskBox = el('div', { class: 'store-box' }), say = el('p', { class: 'live', 'aria-live': 'polite' });
    var state = el('span', { class: 'flag on' });
    input.addEventListener('input', function () { ram = input.value; });
    var bSave = btn('Save to storage', function () { disk = ram; paint('Copied from RAM into flash storage. It is now safe from a power cut.'); });
    var bLoad = btn('Load from storage', function () { ram = disk; paint(disk ? 'Copied back from storage into RAM, ready to work on.' : 'Storage is empty. Nothing was ever saved.'); }, 'ghost');
    var bPower = btn('Cut the power', function () {
      if (power) { power = false; ram = ''; paint('Power lost. Every latch and capacitor in RAM let go of its bit at once. The trapped electrons in flash have nowhere to go, so storage is untouched.'); }
      else { power = true; paint('Power is back. RAM wakes up empty. Whatever was only in RAM is gone for good.'); }
    }, 'danger');
    host.appendChild(el('div', { class: 'two-col' }, [
      el('div', { class: 'mem-panel' }, [el('h4', { text: 'RAM · working memory' }), el('label', { for: id, class: 'hint-inline', text: 'Type here. This is your open, unsaved work.' }), input]),
      el('div', { class: 'mem-panel' }, [el('h4', { text: 'Flash · storage' }), el('p', { class: 'hint-inline', text: 'What is saved on the drive:' }), diskBox])]));
    host.appendChild(el('div', { class: 'ctrl' }, [bSave, bLoad, bPower, state])); host.appendChild(say);
    function paint(msg) {
      input.value = ram; input.disabled = !power; bSave.disabled = bLoad.disabled = !power;
      bPower.textContent = power ? 'Cut the power' : 'Turn power back on';
      state.textContent = power ? 'Power ON' : 'Power OFF'; state.classList.toggle('on', power);
      diskBox.textContent = disk || '(nothing saved yet)'; diskBox.classList.toggle('empty', !disk);
      say.innerHTML = msg;
    }
    paint('Type something, then cut the power without saving. Try again, but save first.');
  });

  /* ── flash cell: electrons trapped on a floating gate ── */
  LG.widget('flashcell', function (host) {
    var charged = false, power = true, box = el('div', { class: 'scrollx' }), say = el('p', { class: 'live', 'aria-live': 'polite' });
    host.appendChild(box);
    var bp = btn('Power off', function () { power = !power; bp.textContent = power ? 'Power off' : 'Power on'; paint(power ? 'Power is back, and the cell still holds its bit.' : 'No power at all. The electrons are sealed inside an insulator, so they stay exactly where they were.'); }, 'ghost');
    host.appendChild(el('div', { class: 'ctrl' }, [
      btn('Program (write 0)', function () { if (!power) return paint('No power: writing needs a high voltage.'); charged = true; paint('A high voltage forced electrons through the thin insulator onto the floating gate. They are now trapped.'); }),
      btn('Erase (back to 1)', function () { if (!power) return paint('No power: erasing needs a high voltage.'); charged = false; paint('A reverse voltage pulled the electrons back out. The cell is empty again.'); }), bp]));
    host.appendChild(say);
    function paint(msg) {
      var svg = el('svg', { viewBox: '0 0 420 230', class: 'schem', style: 'min-width:320px;max-width:480px' });
      var add = function (tag, a, kids) { svg.appendChild(el(tag, a, kids)); };
      add('rect', { class: 'fc-sub', x: 30, y: 150, width: 360, height: 60, rx: 6 });
      add('rect', { class: 'fc-sd', x: 50, y: 150, width: 90, height: 26, rx: 4 }); add('rect', { class: 'fc-sd', x: 280, y: 150, width: 90, height: 26, rx: 4 });
      add('text', { class: 'c-note', x: 95, y: 168, 'text-anchor': 'middle', text: 'source' }); add('text', { class: 'c-note', x: 325, y: 168, 'text-anchor': 'middle', text: 'drain' });
      add('rect', { class: 'fc-channel' + (!charged && power ? ' on' : ''), x: 140, y: 150, width: 140, height: 8 });
      add('rect', { class: 'fc-ox', x: 130, y: 84, width: 160, height: 66, rx: 4 });
      add('rect', { class: 'fc-fg', x: 145, y: 108, width: 130, height: 28, rx: 4 });
      add('rect', { class: 'fc-cg' + (power ? ' on' : ''), x: 145, y: 50, width: 130, height: 28, rx: 4 });
      add('text', { class: 'c-label', x: 210, y: 69, 'text-anchor': 'middle', text: 'control gate' });
      add('text', { class: 'c-note', x: 300, y: 126, text: 'floating gate' }); add('text', { class: 'c-note', x: 300, y: 100, text: 'insulator all round' });
      if (charged) for (var i = 0; i < 7; i++) add('circle', { class: 'fc-e', cx: 160 + i * 17, cy: 122, r: 5 });
      add('text', { class: 'c-label', x: 210, y: 30, 'text-anchor': 'middle', text: power ? 'Reads as ' + (charged ? '0' : '1') : 'Power off' });
      add('text', { class: 'c-note', x: 210, y: 200, 'text-anchor': 'middle', text: !power ? 'bit kept, waiting' : charged ? 'electrons block the channel: no current' : 'channel conducts: current flows' });
      box.innerHTML = ''; box.appendChild(svg); say.innerHTML = msg;
    }
    paint('Program the cell, then switch the power off and on again.');
  });

  /* ── LG-8: a whole computer you can single-step ── */
  LG.widget('cpu', function (host, o, ctx) {
    var cpu = new E.CPU([]), image = [], timer = null, id = LG.uid('cpu'), sel = LG.uid('cpusel');
    var ta = el('textarea', { id: id, class: 'code mono', rows: 12, spellcheck: 'false', autocapitalize: 'characters', autocomplete: 'off' });
    var presets = el('select', { id: sel, class: 'select' }, Object.keys(E.PROGRAMS).map(function (k) { return el('option', { value: k, text: E.PROGRAMS[k].name }); }));
    var err = el('div'), view = el('div', { class: 'cpu-view' }), say = el('p', { class: 'live', 'aria-live': 'polite' });
    presets.addEventListener('change', function () { ta.value = E.PROGRAMS[presets.value].src; load(); });
    var bRun = btn('Run', function () { if (timer) return stop(); bRun.textContent = 'Pause'; timer = setInterval(function () { tick(); if (cpu.halted) stop(); }, 350); }, 'ghost');
    function stop() { clearInterval(timer); timer = null; bRun.textContent = 'Run'; }
    function load() {
      stop();
      var r = E.assemble(ta.value);
      err.innerHTML = r.errors.length ? '<p class="fb bad">' + r.errors.join('<br>') + '</p>' : '';
      if (r.errors.length) return false;
      image = r.mem.slice(); cpu.load(image); paint('Program loaded into memory. Press Step to run one half-step at a time.');
      return true;
    }
    function tick() { paint(cpu.tick()); }
    host.appendChild(el('div', { class: 'cpu' }, [
      el('div', { class: 'cpu-left' }, [
        el('div', { class: 'ctrl' }, [el('label', { for: sel, text: 'Example' }), presets]),
        el('label', { for: id, class: 'hint-inline', text: 'Program (you can edit it):' }), ta,
        el('div', { class: 'ctrl' }, [btn('Load into memory', load)]), err]),
      el('div', { class: 'cpu-right' }, [view,
        el('div', { class: 'ctrl' }, [btn('Step', function () { stop(); tick(); }), bRun, btn('Reset', function () { stop(); cpu.load(image); paint('Reset. PC is back at 0 and memory is as loaded.'); }, 'ghost')]), say])]));
    ctx.onCleanup(stop);
    function paint(msg) {
      var regs = [['PC', 'next address', LG.bin(cpu.pc, 4), cpu.pc], ['IR', 'current instruction', LG.bin(cpu.ir, 8), E.disasm(cpu.ir)], ['A', 'accumulator', LG.bin(cpu.a, 8), cpu.a]];
      var html = '<div class="cpu-regs">' + regs.map(function (r) { return '<div class="reg"><span>' + r[0] + ' <i>' + r[1] + '</i></span><b class="mono">' + r[2] + '</b><em class="mono">' + r[3] + '</em></div>'; }).join('') +
        '<div class="reg out"><span>Display <i>OUT</i></span><b class="mono big">' + (cpu.out === null ? '–' : cpu.out) + '</b><em>' + (cpu.halted ? 'halted' : cpu.phase === 'fetch' ? 'next: fetch' : 'next: execute') + '</em></div>' +
        '<div class="flags"><span class="flag' + (cpu.z ? ' on' : '') + '">Zero <b>' + cpu.z + '</b></span><span class="flag' + (cpu.c ? ' on' : '') + '">Carry <b>' + cpu.c + '</b></span></div></div>';
      html += '<div class="cpu-mem"><div class="ramhead"><span>Addr</span><span>Byte</span><span>As instruction</span><span>As number</span></div>';
      for (var i = 0; i < 16; i++) {
        var cur = cpu.phase === 'fetch' ? i === cpu.pc && !cpu.halted : i === cpu.fetchedFrom;
        html += '<div class="ramrow' + (cur ? ' on' : '') + (i === cpu.touched ? ' touched' : '') + '"><span class="mono">' + i + '</span><span class="mono">' + LG.bin(cpu.mem[i], 8) + '</span><span class="mono">' + E.disasm(cpu.mem[i]) + '</span><span class="mono">' + cpu.mem[i] + '</span></div>';
      }
      view.innerHTML = html + '</div>'; say.innerHTML = msg;
    }
    /* tasks */
    (o.tasks || []).forEach(function (t, i) {
      var box = el('div', { class: 'w ex' }), fctx = { ch: ctx.ch, counter: ctx.counter, ex: [ctx.ex[i]] }, f = LG.exFrame(box, fctx);
      f.body.appendChild(el('p', { class: 'ex-q', html: t.text }));
      var fb;
      f.body.appendChild(el('div', { class: 'answer-row' }, [btn('Run my program and check', function () {
        if (!load()) return fb('bad', 'Fix the program errors first.');
        var c = new E.CPU(image); c.run(3000);
        var res = t.test(c, image);
        if (res === true) { fb('good', '<b>Correct.</b> ' + (t.why || '')); f.complete(); } else fb('bad', res);
      })]));
      fb = LG.feedback(f.body);
      host.appendChild(box);
    });
    ta.value = E.PROGRAMS[o.start || 'add'].src; presets.value = o.start || 'add'; load();
  }, function (o) { return (o.tasks || []).map(function (t) { return t.id; }); });

  /* ── finish line ── */
  LG.widget('finish', function (host) {
    var t = LG.totals(), pct = t.all ? Math.round(100 * t.done / t.all) : 0, parts = {}, order = [];
    LG.chapters.forEach(function (ch) { var p = LG.progress(ch); if (!parts[ch.part]) { parts[ch.part] = { d: 0, t: 0 }; order.push(ch.part); } parts[ch.part].d += p.done; parts[ch.part].t += p.total; });
    host.appendChild(el('div', { class: 'finish' }, [
      el('p', { class: 'finish-big', html: '<b>' + t.done + '</b> of ' + t.all + ' exercises complete <span>' + pct + '%</span>' }),
      el('div', { class: 'finish-parts' }, order.map(function (p) {
        var x = parts[p], w = x.t ? Math.round(100 * x.d / x.t) : 100;
        return el('div', { class: 'fp' }, [el('span', { text: p }), el('div', { class: 'bar' }, el('i', { style: 'width:' + w + '%' })), el('b', { class: 'mono', text: x.d + '/' + x.t })]);
      })),
      el('p', { class: 'hint-inline', text: pct === 100 ? 'Every exercise is done. You have gone from one switch to a working computer.' : 'Unfinished exercises are marked in the contents list. Progress is kept in this browser.' })]));
  });
})();
