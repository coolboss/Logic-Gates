/* Interactives for Parts I and II: bits, binary, bytes, data, switches, transistors, Boolean algebra. */
(function () {
  'use strict';
  var LG = window.LG, E = window.LGE, el = LG.el;

  /* A row of tappable bits, most significant on the left. Used all over the course. */
  LG.bitRow = function (o) {
    var n = o.n, v = (o.value || 0) & ((1 << n) - 1), items = [];
    var row = el('div', { class: 'bitrow' + (o.small ? ' small' : '') });
    for (var i = n - 1; i >= 0; i--) (function (i) {
      var b = el('button', { class: 'bit', type: 'button', disabled: !!o.readonly, 'aria-label': (o.name || 'Bit') + ' ' + i,
        onclick: function () { v ^= (1 << i); paint(); if (o.onChange) o.onChange(v); } });
      var wt = o.weights === false ? null : el('span', { class: 'weight', text: typeof o.weights === 'function' ? o.weights(i) : (1 << i) });
      items.push({ i: i, b: b });
      row.appendChild(el('div', { class: 'bitcol' + (o.group4 && i % 4 === 3 && i !== n - 1 ? ' gap' : '') }, [wt, b]));
    })(i);
    function paint() { items.forEach(function (x) { var on = (v >> x.i) & 1; x.b.textContent = on; x.b.classList.toggle('on', !!on); }); }
    paint();
    return { el: row, get: function () { return v; }, set: function (x) { v = x & ((1 << n) - 1); paint(); } };
  };
  var labelled = function (label, node) { return el('div', { class: 'lrow' }, [el('span', { class: 'lrow-label', html: label }), node]); };
  var btn = function (text, fn, cls) { return el('button', { class: 'btn ' + (cls || ''), type: 'button', html: text, onclick: fn }); };
  LG.btn = btn; LG.labelled = labelled;
  var seq = 0;
  LG.uid = function (p) { return p + '-' + (++seq); };

  /* Widgets that can also be an exercise: pass goal: { text, test(state) }. */
  LG.goal = function (host, o, ctx) {
    if (!o.goal) return { body: host, check: function () {} };
    var f = LG.exFrame(host, ctx);
    f.body.appendChild(el('p', { class: 'ex-q', html: o.goal.text }));
    var inner = el('div');
    f.body.appendChild(inner);
    var say = LG.feedback(f.body);
    return { body: inner, check: function (state) { if (o.goal.test(state)) { say('good', '<b>Done.</b> ' + (o.goal.why || '')); f.complete(); } } };
  };

  /* ── hero: one byte, three meanings ── */
  LG.widget('hero', function (host) {
    var num = el('b', { class: 'mono' }), chr = el('b', { class: 'mono' }), sw = el('span', { class: 'swatch' }), note = el('b', { class: 'mono' });
    var row = LG.bitRow({ n: 8, value: 65, onChange: paint, group4: true });
    host.appendChild(el('div', { class: 'hero-demo' }, [
      el('div', { class: 'scrollx' }, row.el),
      el('div', { class: 'meanings' }, [
        el('div', {}, [el('span', { text: 'As a number' }), num]),
        el('div', {}, [el('span', { text: 'As a letter' }), chr]),
        el('div', {}, [el('span', { text: 'As a shade of grey' }), sw]),
        el('div', {}, [el('span', { text: 'As a sound level' }), note])]),
      el('p', { class: 'hint-inline', text: 'Tap any of the eight switches. The same pattern is read four different ways.' })]));
    function paint() {
      var v = row.get();
      num.textContent = v;
      chr.textContent = v >= 33 && v < 127 ? String.fromCharCode(v) : v === 32 ? 'space' : '(no printable letter)';
      sw.style.background = 'rgb(' + v + ',' + v + ',' + v + ')';
      note.textContent = Math.round(v / 255 * 100) + '% volume';
    }
    paint();
  });

  /* ── bits with place values ── */
  function mountBits(host, o, ctx) {
    var g = LG.goal(host, o, ctx), n = o.n || 8, out = el('div', { class: 'readouts' });
    var wt = o.signed ? function (i) { return i === n - 1 ? '−' + (1 << i) : (1 << i); } : o.weights;
    var row = LG.bitRow({ n: n, value: o.value || 0, onChange: paint, group4: o.hex || n > 4, weights: wt });
    g.body.appendChild(el('div', { class: 'scrollx' }, row.el));
    g.body.appendChild(out);
    function paint() {
      var v = row.get(), parts = [], html = '', total = v;
      for (var i = n - 1; i >= 0; i--) if ((v >> i) & 1) parts.push(o.signed && i === n - 1 ? '−' + (1 << i) : (1 << i));
      if (o.signed && (v >> (n - 1)) & 1) total = v - (1 << n);
      if (o.sum !== false) html += '<div><span>Add the switched-on values</span><b class="mono">' + (parts.length ? parts.join(' + ') : '0') + ' = ' + String(total).replace('-', '−') + '</b></div>';
      if (o.signed) html += '<div><span>Same bits read as unsigned</span><b class="mono">' + v + '</b></div>';
      if (o.hex) html += '<div><span>Hex</span><b class="mono">' + LG.hex(v, Math.ceil(n / 4)) + '</b></div>';
      if (o.char) html += '<div><span>Letter (ASCII)</span><b class="mono">' + (v >= 33 && v < 127 ? String.fromCharCode(v) : v === 32 ? 'space' : '·') + '</b></div>';
      out.innerHTML = html;
      g.check(v);
    }
    paint();
  }
  LG.widget('bits', mountBits);
  LG.widget('bitsq', mountBits, true);

  /* ── why two levels: noise ── */
  LG.widget('noise', function (host) {
    var W = 8, id = LG.uid('noise'), seedN = [];
    var digits = [7, 3, 9, 1, 4, 8, 2, 6], bitsMsg = [1, 0, 1, 1, 0, 0, 1, 0];
    function reseed() { seedN = []; for (var i = 0; i < W * 2; i++) seedN.push(Math.random() * 2 - 1); }
    reseed();
    var slider = el('input', { type: 'range', id: id, min: 0, max: 3, step: 0.05, value: 0.4 });
    var a = el('div'), b = el('div'), summary = el('p', { class: 'live', 'aria-live': 'polite' });
    slider.addEventListener('input', paint);
    host.appendChild(el('div', { class: 'ctrl' }, [el('label', { for: id, text: 'Electrical noise' }), slider, btn('New noise', function () { reseed(); paint(); }, 'ghost')]));
    host.appendChild(el('div', { class: 'two-col' }, [a, b]));
    host.appendChild(summary);
    function panel(node, title, sent, volts, decode, lines, offset) {
      var noise = +slider.value, wrong = 0, w = 300, h = 150, bw = w / W;
      var svg = el('svg', { viewBox: '0 0 ' + w + ' ' + (h + 44), class: 'plot' });
      lines.forEach(function (v) { var y = h - v / 5.5 * h; svg.appendChild(el('line', { class: 'plot-grid', x1: 0, x2: w, y1: y, y2: y })); });
      sent.forEach(function (s, i) {
        var v = Math.max(0, volts(s) + seedN[i + offset] * noise), got = decode(v), ok = got === s;
        if (!ok) wrong++;
        var bh = Math.min(h, v / 5.5 * h);
        svg.appendChild(el('rect', { class: 'plot-bar' + (ok ? '' : ' err'), x: i * bw + 5, y: h - bh, width: bw - 10, height: Math.max(1, bh), rx: 2 }));
        svg.appendChild(el('text', { class: 'plot-t', x: i * bw + bw / 2, y: h + 17, 'text-anchor': 'middle', text: s }));
        svg.appendChild(el('text', { class: 'plot-t ' + (ok ? 'ok' : 'err'), x: i * bw + bw / 2, y: h + 37, 'text-anchor': 'middle', text: got }));
      });
      node.innerHTML = '';
      node.appendChild(el('div', { class: 'plot-title', html: '<b>' + title + '</b><span>top row sent, bottom row received</span>' }));
      node.appendChild(svg);
      return wrong;
    }
    function paint() {
      var w10 = panel(a, 'Ten voltage levels', digits, function (d) { return d * 0.5 + 0.25; }, function (v) { return Math.max(0, Math.min(9, Math.floor(v / 0.5))); }, [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5], 0);
      var w2 = panel(b, 'Two voltage levels', bitsMsg, function (d) { return d ? 4.6 : 0.4; }, function (v) { return v > 2.5 ? 1 : 0; }, [2.5], W);
      summary.innerHTML = 'Ten levels: <b>' + w10 + ' of 8</b> symbols misread. Two levels: <b>' + w2 + ' of 8</b> misread.' +
        (w10 > 0 && w2 === 0 ? ' The gap between 0 and 1 is so wide that the same noise does no harm.' : '');
    }
    paint();
  });

  /* ── four yes/no questions find one of sixteen ── */
  LG.widget('guess', function (host) {
    var box = el('div', { class: 'guess' });
    host.appendChild(box);
    function start() {
      var lo = 0, hi = 15, bits = [];
      function ask() {
        box.innerHTML = '';
        var trail = el('div', { class: 'trail' }, [0, 1, 2, 3].map(function (i) { return el('span', { class: 'bit static' + (bits[i] ? ' on' : '') + (bits[i] === undefined ? ' empty' : ''), text: bits[i] === undefined ? '?' : bits[i] }); }));
        if (lo === hi) {
          box.appendChild(el('p', { class: 'guess-q', html: 'Your number is <b>' + lo + '</b>.' }));
          box.appendChild(trail);
          box.appendChild(el('p', { html: 'Your four answers, read as yes = 1 and no = 0, spell <code>' + bits.join('') + '</code>. That is ' + lo + ' written in binary. Four yes/no answers are four bits, and four bits can single out one of 16 things.' }));
          box.appendChild(btn('Play again', start));
          return;
        }
        var mid = Math.ceil((lo + hi) / 2);
        box.appendChild(el('p', { class: 'guess-q', html: 'Question ' + (bits.length + 1) + ' of 4: is your number <b>' + mid + ' or more</b>?' }));
        box.appendChild(el('div', { class: 'choices' }, [
          btn('Yes', function () { lo = mid; bits.push(1); ask(); }), btn('No', function () { hi = mid - 1; bits.push(0); ask(); })]));
        box.appendChild(trail);
        box.appendChild(el('p', { class: 'hint-inline', text: 'Still possible: ' + lo + ' to ' + hi + ' (' + (hi - lo + 1) + ' numbers).' }));
      }
      box.innerHTML = '';
      box.appendChild(el('p', { class: 'guess-q', html: 'Think of a whole number from <b>0 to 15</b>. Keep it in your head.' }));
      box.appendChild(btn('I have one', ask));
    }
    start();
  });

  /* ── n bits give 2^n patterns ── */
  LG.widget('combos', function (host) {
    var id = LG.uid('combos'), slider = el('input', { type: 'range', id: id, min: 1, max: 64, step: 1, value: 3 });
    var out = el('div', { class: 'combos-out' });
    slider.addEventListener('input', paint);
    host.appendChild(el('div', { class: 'ctrl' }, [el('label', { for: id, text: 'Number of bits' }), slider]));
    host.appendChild(out);
    function big(n) {
      var d = [1];
      for (var k = 0; k < n; k++) { var c = 0; for (var i = 0; i < d.length; i++) { var x = d[i] * 2 + c; d[i] = x % 10; c = x > 9 ? 1 : 0; } if (c) d.push(1); }
      return d.reverse().join('').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    function paint() {
      var n = +slider.value, html = '<p class="combos-n"><b>' + n + '</b> bit' + (n > 1 ? 's' : '') + ' → <b class="mono">' + big(n) + '</b> different patterns</p>';
      if (n <= 5) {
        html += '<div class="patterns">';
        for (var k = 0; k < (1 << n); k++) html += '<code>' + LG.bin(k, n) + '</code>';
        html += '</div>';
      } else {
        var facts = { 7: 'Enough for every key on an English keyboard. That is the original ASCII code.', 8: 'One byte. Enough for a brightness level, or one small number.',
          10: 'About a thousand. This is the “kilo” of computing.', 16: 'Enough for every sample level of CD-quality sound.', 24: 'Enough for 16.7 million colours, one per pixel on most screens.',
          32: 'About 4.3 billion. Old internet addresses (IPv4) are this size.', 64: 'More patterns than there are grains of sand on Earth. Modern processors work with numbers this size.' };
        var best = Object.keys(facts).map(Number).filter(function (k) { return k <= n; }).pop();
        html += '<p class="hint-inline">Too many to list. ' + (facts[n] || (best ? 'Past ' + best + ' bits. Every extra bit doubles the count again.' : 'Every extra bit doubles the count.')) + '</p>';
      }
      out.innerHTML = html;
    }
    paint();
  });

  /* ── binary counter ── */
  LG.widget('counter', function (host, o, ctx) {
    var n = o.n || 4, v = 0, timer = null, note = el('p', { class: 'live', 'aria-live': 'polite' }), dec = el('span', { class: 'bigval mono' });
    var row = LG.bitRow({ n: n, value: 0, readonly: true });
    var auto = btn('Auto', function () {
      if (timer) { clearInterval(timer); timer = null; auto.textContent = 'Auto'; } else { timer = setInterval(step, 700); auto.textContent = 'Stop'; }
    }, 'ghost');
    host.appendChild(el('div', { class: 'scrollx' }, row.el));
    host.appendChild(el('div', { class: 'ctrl' }, [btn('Count +1', step), auto, btn('Reset', function () { v = 0; row.set(0); paint(0); }, 'ghost'), dec]));
    host.appendChild(note);
    ctx.onCleanup(function () { clearInterval(timer); });
    function step() { var old = v; v = (v + 1) & ((1 << n) - 1); row.set(v); paint(old ^ v, old); }
    function paint(flipped, old) {
      dec.textContent = '= ' + v;
      var count = 0; for (var i = 0; i < n; i++) if ((flipped >> i) & 1) count++;
      [].forEach.call(row.el.querySelectorAll('.bit'), function (b, idx) { b.classList.toggle('flash', !!((flipped >> (n - 1 - idx)) & 1)); });
      note.innerHTML = !flipped ? 'Press Count. Watch which switches flip each time.'
        : v === 0 ? 'Every bit was 1, so they all rolled over to 0. With ' + n + ' bits the count wraps from ' + ((1 << n) - 1) + ' back to 0.'
        : count === 1 ? 'Only the right-most bit flipped.' : count + ' bits flipped: the right-most ' + (count - 1) + ' rolled from 1 to 0 and passed a carry to the next bit, like 0999 → 1000 on a car odometer.';
    }
    paint(0);
  });

  /* ── decimal to binary by repeated halving ── */
  LG.widget('divide', function (host) {
    var id = LG.uid('div'), input = el('input', { type: 'number', id: id, class: 'answer mono', min: 0, max: 255, value: 37, inputmode: 'numeric' });
    var out = el('div');
    input.addEventListener('input', paint);
    host.appendChild(el('div', { class: 'ctrl' }, [el('label', { for: id, text: 'A number from 0 to 255' }), input]));
    host.appendChild(out);
    function paint() {
      var n = Math.max(0, Math.min(255, Math.floor(+input.value || 0))), x = n, rows = '', bits = [];
      if (x === 0) bits = [0];
      while (x > 0) { rows += '<tr><td>' + x + ' ÷ 2</td><td>' + (x >> 1) + '</td><td class="out one">' + (x & 1) + '</td></tr>'; bits.unshift(x & 1); x >>= 1; }
      out.innerHTML = '<div class="scrollx"><table class="tt"><tr><th>Halve it</th><th>Result</th><th class="out">Remainder</th></tr>' + rows + '</table></div>' +
        '<p class="live">Read the remainders from the <b>bottom up</b>: ' + n + ' = <code>' + bits.join('') + '</code></p>';
    }
    paint();
  });

  /* ── text as bytes ── */
  LG.widget('textbits', function (host) {
    var id = LG.uid('txt'), input = el('input', { type: 'text', id: id, class: 'answer wide', value: 'Hi!', maxlength: 10, autocomplete: 'off' }), out = el('div');
    input.addEventListener('input', paint);
    host.appendChild(el('div', { class: 'ctrl' }, [el('label', { for: id, text: 'Type up to 10 characters' }), input]));
    host.appendChild(out);
    function bytesOf(ch) {
      try { return Array.prototype.slice.call(new TextEncoder().encode(ch)); } catch (e) { return [ch.charCodeAt(0) & 255]; }
    }
    function paint() {
      var chars = Array.from(input.value), total = 0, html = '<div class="scrollx"><table class="tt left"><tr><th>Character</th><th>Byte value</th><th>Hex</th><th class="out">Bits stored</th></tr>';
      chars.forEach(function (ch) {
        var bs = bytesOf(ch); total += bs.length;
        html += '<tr><td class="big">' + (ch === ' ' ? '(space)' : ch.replace(/</g, '&lt;')) + '</td><td class="mono">' + bs.join(' ') + '</td><td class="mono">' + bs.map(function (b) { return LG.hex(b, 2); }).join(' ') +
          '</td><td class="mono out">' + bs.map(function (b) { return LG.bin(b, 8); }).join(' ') + '</td></tr>';
      });
      out.innerHTML = html + '</table></div><p class="live">' + chars.length + ' character' + (chars.length === 1 ? '' : 's') + ' = ' + total + ' byte' + (total === 1 ? '' : 's') + ' = ' + total * 8 + ' bits.' +
        (total > chars.length ? ' Letters outside basic English need more than one byte each (the UTF-8 system). Try અ, अ or 😀.' : ' Try a capital and a small letter: they differ by exactly one bit.') + '</p>';
    }
    paint();
  });

  /* ── colour as three bytes ── */
  LG.widget('rgb', function (host) {
    var vals = [240, 100, 30], names = ['Red', 'Green', 'Blue'], sw = el('div', { class: 'rgb-swatch' }), out = el('div', { class: 'readouts' });
    var sliders = names.map(function (nm, i) {
      var id = LG.uid('rgb'), s = el('input', { type: 'range', id: id, min: 0, max: 255, value: vals[i] });
      s.addEventListener('input', function () { vals[i] = +s.value; paint(); });
      return el('div', { class: 'ctrl' }, [el('label', { for: id, text: nm }), s]);
    });
    host.appendChild(el('div', { class: 'two-col' }, [el('div', {}, sliders), sw]));
    host.appendChild(out);
    function paint() {
      sw.style.background = 'rgb(' + vals.join(',') + ')';
      out.innerHTML = '<div><span>Three bytes</span><b class="mono">' + vals.join(', ') + '</b></div><div><span>Hex colour code</span><b class="mono">#' + vals.map(function (v) { return LG.hex(v, 2); }).join('') +
        '</b></div><div><span>The 24 bits</span><b class="mono">' + vals.map(function (v) { return LG.bin(v, 8); }).join(' ') + '</b></div>';
    }
    paint();
  });

  /* ── a picture as bits ── */
  LG.widget('pixels', function (host) {
    var SHAPES = { Heart: [0x00, 0x66, 0xFF, 0xFF, 0xFF, 0x7E, 0x3C, 0x18], Smile: [0x3C, 0x42, 0xA5, 0x81, 0xA5, 0x99, 0x42, 0x3C], 'Letter A': [0x18, 0x3C, 0x66, 0x66, 0x7E, 0x66, 0x66, 0x00], Blank: [0, 0, 0, 0, 0, 0, 0, 0] };
    var rows = SHAPES.Heart.slice(), grid = el('div', { class: 'pxgrid', role: 'group', 'aria-label': 'Eight by eight picture' }), side = el('div', { class: 'pxbytes mono' });
    for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) (function (r, c) {
      grid.appendChild(el('button', { class: 'px', type: 'button', 'aria-label': 'Row ' + (r + 1) + ' column ' + (c + 1), onclick: function () { rows[r] ^= (0x80 >> c); paint(); } }));
    })(r, c);
    host.appendChild(el('div', { class: 'px-wrap' }, [grid, side]));
    host.appendChild(el('div', { class: 'ctrl' }, Object.keys(SHAPES).map(function (k) { return btn(k, function () { rows = SHAPES[k].slice(); paint(); }, 'ghost'); })));
    host.appendChild(el('p', { class: 'hint-inline', text: 'Tap squares to draw. Each row of 8 squares is one byte, so the whole picture is 8 bytes.' }));
    function paint() {
      [].forEach.call(grid.children, function (p, i) { p.classList.toggle('on', !!(rows[i >> 3] & (0x80 >> (i & 7)))); });
      side.innerHTML = rows.map(function (b) { return '<div>' + LG.bin(b, 8) + ' <span>' + LG.hex(b, 2) + '</span></div>'; }).join('');
    }
    paint();
  });

  /* ── switches in a row, switches side by side ── */
  LG.widget('switches', function (host, o) {
    var mode = o.mode || 'series', A = 0, B = 0, stage = el('div', { class: 'scrollx' }), say = el('p', { class: 'live', 'aria-live': 'polite' });
    var tabs = el('div', { class: 'tabs' }, [['series', 'In a row (series)'], ['parallel', 'Side by side (parallel)']].map(function (m) {
      return el('button', { class: 'tab', type: 'button', 'data-m': m[0], text: m[1], onclick: function () { mode = m[0]; paint(); } });
    }));
    if (!o.mode) host.appendChild(tabs);
    host.appendChild(stage); host.appendChild(say);
    function sw(x, y, on, name, flip) {
      var g = el('g', { class: 'sw-g', tabindex: '0', role: 'switch', 'aria-checked': on ? 'true' : 'false', 'aria-label': 'Switch ' + name }, [
        el('rect', { class: 'pad-hit', x: x - 8, y: y - 34, width: 66, height: 50 }),
        el('line', { class: 'sw-arm' + (on ? ' on' : ''), x1: x, y1: y, x2: on ? x + 50 : x + 44, y2: on ? y : y - 24 }),
        el('circle', { class: 'sw-end', cx: x, cy: y, r: 4.5 }), el('circle', { class: 'sw-end', cx: x + 50, cy: y, r: 4.5 }),
        el('text', { class: 'c-label', x: x + 25, y: y + 22, 'text-anchor': 'middle', text: name + (on ? ' closed' : ' open') })]);
      g.addEventListener('click', flip);
      g.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } });
      return g;
    }
    function paint() {
      [].forEach.call(tabs.children, function (t) { t.classList.toggle('on', t.getAttribute('data-m') === mode); });
      var lit = mode === 'series' ? A && B : A || B;
      var svg = el('svg', { viewBox: '0 0 440 200', class: 'schem', style: 'min-width:340px;max-width:520px' });
      var seg = function (d, on) { svg.appendChild(el('path', { class: 'wire' + (on ? ' on flow' : ''), d: d })); };
      if (mode === 'series') {
        seg('M40,84 V50 H110', lit); seg('M160,50 H220', lit); seg('M270,50 H370 V82', lit);
        svg.appendChild(sw(110, 50, A, 'A', function () { A = !A; paint(); })); svg.appendChild(sw(220, 50, B, 'B', function () { B = !B; paint(); }));
      } else {
        seg('M40,84 V60 H90', lit); seg('M90,60 V34 H130', lit && A); seg('M180,34 H230 V60', lit && A);
        seg('M90,60 V104 H130', lit && B); seg('M180,104 H230 V60', lit && B); seg('M230,60 H370 V82', lit);
        svg.appendChild(sw(130, 34, A, 'A', function () { A = !A; paint(); })); svg.appendChild(sw(130, 104, B, 'B', function () { B = !B; paint(); }));
      }
      seg('M370,118 V160 H40 V112', lit);
      svg.appendChild(el('g', { class: 'battery' }, [el('line', { x1: 26, y1: 84, x2: 54, y2: 84 }), el('line', { class: 'short', x1: 33, y1: 94, x2: 47, y2: 94 }),
        el('line', { x1: 26, y1: 104, x2: 54, y2: 104 }), el('line', { class: 'short', x1: 33, y1: 112, x2: 47, y2: 112 }),
        el('text', { class: 'c-label', x: 14, y: 80, 'text-anchor': 'middle', text: '+' }), el('text', { class: 'c-label', x: 40, y: 190, 'text-anchor': 'middle', text: 'Battery' })]));
      svg.appendChild(el('g', { class: 'lamp' + (lit ? ' on' : '') }, [el('circle', { class: 'lamp-glow', cx: 370, cy: 100, r: 30 }), el('circle', { class: 'lamp-body', cx: 370, cy: 100, r: 18 }),
        el('text', { class: 'lamp-val', x: 370, y: 105, 'text-anchor': 'middle', text: lit ? '1' : '0' }), el('text', { class: 'c-label', x: 410, y: 104, text: 'Lamp' })]));
      stage.innerHTML = ''; stage.appendChild(svg);
      say.innerHTML = mode === 'series'
        ? 'One path, two gaps. The lamp lights only when A <b>and</b> B are closed. Now: A=' + (+A) + ', B=' + (+B) + ' → lamp ' + (lit ? 'ON (1)' : 'off (0)') + '.'
        : 'Two paths. The lamp lights when A <b>or</b> B (or both) is closed. Now: A=' + (+A) + ', B=' + (+B) + ' → lamp ' + (lit ? 'ON (1)' : 'off (0)') + '.';
    }
    paint();
  });

  /* ── gates built from transistors ── */
  LG.widget('tgate', function (host, o) {
    var kind = o.kind || 'NOT', A = 0, B = 0, stage = el('div', { class: 'scrollx' }), say = el('p', { class: 'live', 'aria-live': 'polite' });
    host.appendChild(stage); host.appendChild(say);
    function pad(x, y, v, name, flip) {
      var g = el('g', { class: 'pad' + (v ? ' on' : ''), tabindex: '0', role: 'switch', 'aria-checked': v ? 'true' : 'false', 'aria-label': 'Input ' + name }, [
        el('rect', { class: 'pad-hit', x: x - 24, y: y - 24, width: 48, height: 48 }), el('rect', { class: 'pad-box', x: x - 16, y: y - 16, width: 32, height: 32, rx: 7 }),
        el('text', { class: 'pad-val', x: x, y: y + 6, 'text-anchor': 'middle', text: v ? 1 : 0 }), el('text', { class: 'c-label', x: x, y: y - 23, 'text-anchor': 'middle', text: name })]);
      g.addEventListener('click', flip);
      g.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } });
      return g;
    }
    function paint() {
      var svg = el('svg', { viewBox: '0 0 400 270', class: 'schem', style: 'min-width:320px;max-width:460px' });
      var low = kind === 'NOT' ? A : kind === 'NAND' ? A && B : A || B, out = low ? 0 : 1;
      var add = function (n) { svg.appendChild(n); return n; };
      var wire = function (d, on, flow) { add(el('path', { class: 'wire' + (on ? ' on' : '') + (flow ? ' flow' : ''), d: d })); };
      /* a transistor drawn as a switch that its input closes */
      function tr(x, y1, y2, on, padX, padY, flowing) {
        wire('M' + x + ',' + y1 + ' V' + (y1 + 8), flowing, flowing); wire('M' + x + ',' + (y2 - 8) + ' V' + y2, flowing, flowing);
        add(el('line', { class: 'sw-arm' + (on ? ' on' : ''), x1: x, y1: y2 - 8, x2: on ? x : x + (padX < x ? 16 : -16), y2: y1 + (on ? 8 : 12) }));
        add(el('circle', { class: 'sw-end', cx: x, cy: y1 + 8, r: 4 })); add(el('circle', { class: 'sw-end', cx: x, cy: y2 - 8, r: 4 }));
        var gx = x + (padX < x ? -20 : 20), my = (y1 + y2) / 2;
        add(el('line', { class: 'plate' + (on ? ' on' : ''), x1: gx, y1: y1 + 8, x2: gx, y2: y2 - 8 }));
        wire('M' + (padX + (padX < x ? 16 : -16)) + ',' + padY + ' H' + (padX < x ? gx - 26 : gx + 26) + ' V' + my + ' H' + gx, on);
      }
      add(el('text', { class: 'c-label', x: 200, y: 16, 'text-anchor': 'middle', text: '+5 V' }));
      wire('M200,22 V36', true, low); add(el('rect', { class: 'resistor', x: 191, y: 36, width: 18, height: 38, rx: 3 }));
      add(el('text', { class: 'c-note', x: 216, y: 59, text: 'resistor' }));
      wire('M200,74 V96', !!out, low);
      if (kind === 'NOT') { tr(200, 96, 160, A, 60, 128, low); wire('M200,160 V226', false, low); }
      else if (kind === 'NAND') { tr(200, 96, 150, A, 60, 123, low); tr(200, 150, 204, B, 60, 177, low); wire('M200,204 V226', false, low); }
      else {
        wire('M150,96 H250', !!out, false);
        tr(150, 96, 170, A, 50, 133, !!A); tr(250, 96, 170, B, 350, 133, !!B);
        wire('M150,170 V200 H250 V170', false, false); wire('M200,200 V226', false, low);
      }
      add(el('path', { class: 'ground', d: 'M184,226 H216 M190,233 H210 M196,240 H204' }));
      add(el('text', { class: 'c-label', x: 200, y: 258, 'text-anchor': 'middle', text: 'Ground (0 V)' }));
      if (kind === 'NOR') wire('M250,96 H300 V60 H322', !!out); else wire('M200,96 H322', !!out);
      var ly = kind === 'NOR' ? 60 : 96;
      add(el('g', { class: 'lamp' + (out ? ' on' : '') }, [el('circle', { class: 'lamp-glow', cx: 340, cy: ly, r: 24 }), el('circle', { class: 'lamp-body', cx: 340, cy: ly, r: 15 }),
        el('text', { class: 'lamp-val', x: 340, y: ly + 5, 'text-anchor': 'middle', text: out }), el('text', { class: 'c-label', x: 340, y: ly - 26, 'text-anchor': 'middle', text: 'Out' })]));
      if (kind === 'NOT') add(pad(60, 128, A, 'In', function () { A = !A; paint(); }));
      else if (kind === 'NAND') { add(pad(60, 123, A, 'A', function () { A = !A; paint(); })); add(pad(60, 177, B, 'B', function () { B = !B; paint(); })); }
      else { add(pad(50, 133, A, 'A', function () { A = !A; paint(); })); add(pad(350, 133, B, 'B', function () { B = !B; paint(); })); }
      stage.innerHTML = ''; stage.appendChild(svg);
      say.innerHTML = low
        ? 'There is a closed path to ground, so the output is dragged down to 0 V. <b>Out = 0.</b>'
        : 'No path to ground. The resistor holds the output up at 5 V. <b>Out = 1.</b>';
    }
    paint();
  });

  /* ── Boolean expression playground ── */
  LG.widget('exprlab', function (host, o) {
    var idA = LG.uid('ex'), idB = LG.uid('ex');
    var a = el('input', { id: idA, class: 'answer mono wide', type: 'text', value: o.a || '!(A·B)', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false' });
    var b = el('input', { id: idB, class: 'answer mono wide', type: 'text', value: o.b || '!A + !B', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false' });
    var out = el('div');
    a.addEventListener('input', paint); b.addEventListener('input', paint);
    host.appendChild(el('div', { class: 'ctrl' }, [el('label', { for: idA, text: 'Expression 1' }), a]));
    host.appendChild(el('div', { class: 'ctrl' }, [el('label', { for: idB, text: 'Expression 2' }), b]));
    if (o.presets) {
      host.appendChild(el('div', { class: 'ctrl' }, o.presets.map(function (p) { return btn(p[0], function () { a.value = p[1]; b.value = p[2]; paint(); }, 'ghost'); })));
    }
    host.appendChild(out);
    function paint() {
      var pa, pb;
      try { pa = E.parseExpr(a.value); } catch (e) { out.innerHTML = '<p class="fb bad">Expression 1: ' + e.message + '.</p>'; return; }
      try { pb = b.value.trim() ? E.parseExpr(b.value) : null; } catch (e) { out.innerHTML = '<p class="fb bad">Expression 2: ' + e.message + '.</p>'; return; }
      var vars = pa.vars.concat(pb ? pb.vars : []).filter(function (v, i, arr) { return arr.indexOf(v) === i; }).sort();
      if (vars.length > 4) { out.innerHTML = '<p class="fb bad">Use at most four different letters.</p>'; return; }
      var ta = E.truthOf(a.value, vars), tb = pb ? E.truthOf(b.value, vars) : null, same = tb === ta;
      var html = '<div class="scrollx"><table class="tt"><tr>' + vars.map(function (v) { return '<th>' + v + '</th>'; }).join('') + '<th class="out">Expr 1</th>' + (pb ? '<th class="out">Expr 2</th>' : '') + '</tr>';
      for (var k = 0; k < ta.length; k++) {
        var diff = pb && ta[k] !== tb[k];
        html += '<tr' + (diff ? ' class="differs"' : '') + '>' + vars.map(function (_, i) { return '<td>' + ((k >> (vars.length - 1 - i)) & 1) + '</td>'; }).join('') +
          '<td class="out' + (ta[k] === '1' ? ' one' : '') + '">' + ta[k] + '</td>' + (pb ? '<td class="out' + (tb[k] === '1' ? ' one' : '') + '">' + tb[k] + '</td>' : '') + '</tr>';
      }
      html += '</table></div>';
      if (pb) html += same ? '<p class="fb good"><b>Identical in every row.</b> These two expressions describe the same circuit behaviour.</p>' : '<p class="fb bad">They differ in the marked rows, so they are not the same function.</p>';
      out.innerHTML = html;
    }
    paint();
  });
})();
