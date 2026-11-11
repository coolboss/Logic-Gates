/* Bit by Bit — app shell: chapters, navigation, progress, and the exercise types.
 * Lessons call LG.W('type', options) inside their HTML to drop in an interactive. */
(function () {
  'use strict';
  var E = window.LGE;
  var LG = window.LG = { chapters: [], widgets: {}, specs: [], E: E };

  /* ── tiny DOM helpers ── */
  LG.el = function (tag, attrs, kids) {
    var svg = /^(svg|g|path|rect|circle|line|text|polyline|polygon|ellipse|defs|filter|feGaussianBlur|tspan|title)$/.test(tag);
    var n = svg ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
    for (var k in (attrs || {})) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'html') n.innerHTML = v;
      else if (k === 'text') n.textContent = v;
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    [].concat(kids == null ? [] : kids).forEach(function (c) {
      if (c == null || c === false) return;
      n.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
    });
    return n;
  };
  var el = LG.el;
  LG.bin = function (n, w) { var s = (n >>> 0).toString(2); while (s.length < w) s = '0' + s; return s; };
  LG.hex = function (n, w) { var s = n.toString(16).toUpperCase(); while (s.length < (w || 1)) s = '0' + s; return s; };
  LG.rand = function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };

  /* ── storage that never throws ── */
  var mem = {};
  LG.store = {
    get: function (k, d) { try { var v = localStorage.getItem('bitbybit.' + k); return v == null ? (k in mem ? mem[k] : d) : JSON.parse(v); } catch (e) { return k in mem ? mem[k] : d; } },
    set: function (k, v) { mem[k] = v; try { localStorage.setItem('bitbybit.' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };
  var done = LG.store.get('done', {});

  /* ── registry ── */
  LG.widget = function (name, mount, ex) { LG.widgets[name] = { mount: mount, ex: ex || null }; };
  LG.W = function (type, opts) {
    var i = LG.specs.push({ type: type, opts: opts || {} }) - 1;
    return '<div class="w w-' + type + '" data-wid="' + i + '"></div>';
  };
  LG.chapter = function (def) { LG.chapters.push(def); };

  /* Which exercises does a chapter contain? Worked out from its widgets, so the
   * contents list can show progress for chapters that are not on screen. */
  function plan(ch) {
    LG.specs = [];
    var html = ch.body(), n = 0, ids = [];
    var per = LG.specs.map(function (s) {
      var w = LG.widgets[s.type];
      if (!w) throw new Error('Unknown widget: ' + s.type);
      if (!w.ex) return [];
      var keys = typeof w.ex === 'function' ? w.ex(s.opts) : [s.opts.id || 'e' + (++n)];
      var mine = keys.map(function (k) { return ch.id + '/' + k; });
      ids = ids.concat(mine);
      return mine;
    });
    return { html: html, specs: LG.specs, per: per, ids: ids };
  }
  LG.progress = function (ch) {
    var d = ch.exIds.filter(function (id) { return done[id]; }).length;
    return { done: d, total: ch.exIds.length };
  };
  LG.isDone = function (id) { return !!done[id]; };
  LG.markDone = function (id) {
    if (done[id]) return;
    done[id] = true;
    LG.store.set('done', done);
    refreshToc();
  };

  /* ── exercise frame: title bar with number and a done chip ── */
  LG.exFrame = function (host, ctx, label) {
    var id = ctx.ex[0], no = ++ctx.counter.n;
    var chip = el('span', { class: 'chip' });
    var head = el('div', { class: 'ex-head' }, [
      el('span', { class: 'ex-no', text: (label || 'Exercise') + ' ' + ctx.ch.no + '.' + no }), chip]);
    var body = el('div', { class: 'ex-body' });
    host.classList.add('ex');
    host.appendChild(head); host.appendChild(body);
    function paint() {
      var d = LG.isDone(id);
      host.classList.toggle('is-done', d);
      chip.textContent = d ? 'Done' : 'To do';
    }
    paint();
    return { body: body, complete: function () { LG.markDone(id); paint(); }, isDone: function () { return LG.isDone(id); } };
  };
  LG.feedback = function (parent) {
    var box = el('div', { class: 'fb', role: 'status', 'aria-live': 'polite' });
    parent.appendChild(box);
    return function (kind, html) {
      box.className = 'fb ' + (kind || '');
      box.innerHTML = html || '';
      if (kind === 'bad') { box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); }
    };
  };

  /* ── multiple choice ── */
  LG.widget('mcq', function (host, o, ctx) {
    var f = LG.exFrame(host, ctx);
    f.body.appendChild(el('p', { class: 'ex-q', html: o.q }));
    var row = el('div', { class: 'choices' + (o.stack ? ' stack' : '') });
    f.body.appendChild(row);
    var say = LG.feedback(f.body);
    o.opts.forEach(function (text, i) {
      var b = el('button', { class: 'choice', type: 'button', html: text, onclick: function () {
        [].forEach.call(row.children, function (c) { c.classList.remove('right', 'wrong'); });
        if (i === o.a) { b.classList.add('right'); say('good', '<b>Correct.</b> ' + (o.why || '')); f.complete(); }
        else { b.classList.add('wrong'); say('bad', (o.hints && o.hints[i]) || 'Not that one. Read the question once more and try again.'); }
      } });
      row.appendChild(b);
    });
  }, true);

  /* ── typed answer ── */
  function norm(s) {
    s = String(s).toLowerCase().replace(/[\s_,]/g, '').replace(/^0[xb]/, '').replace(/−/g, '-');
    var neg = s[0] === '-'; if (neg) s = s.slice(1);
    s = s.replace(/^0+(?=.)/, '');
    return (neg ? '-' : '') + s;
  }
  LG.sameAnswer = function (given, wanted) {
    return [].concat(wanted).some(function (w) { return norm(given) === norm(w); });
  };
  var inputSeq = 0;
  LG.widget('num', function (host, o, ctx) {
    var f = LG.exFrame(host, ctx);
    var id = 'in-' + ctx.ch.id + '-' + (++inputSeq);
    f.body.appendChild(el('label', { class: 'ex-q', for: id, html: o.q }));
    var input = el('input', { id: id, class: 'answer' + (o.mono === false ? '' : ' mono'), type: 'text', autocomplete: 'off', autocapitalize: 'off',
      spellcheck: 'false', inputmode: o.kb || 'text', placeholder: o.ph || 'Your answer' });
    var say;
    function check() {
      if (!input.value.trim()) { say('bad', 'Type an answer first.'); return; }
      if (LG.sameAnswer(input.value, o.a)) { say('good', '<b>Correct.</b> ' + (o.why || '')); f.complete(); }
      else say('bad', o.hint || 'Not quite. Work it through step by step and try again.');
    }
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
    f.body.appendChild(el('div', { class: 'answer-row' }, [input, el('button', { class: 'btn', type: 'button', text: 'Check', onclick: check })]));
    say = LG.feedback(f.body);
    if (o.reveal) f.body.appendChild(el('details', { class: 'reveal' }, [el('summary', { text: 'Show the working' }), el('div', { html: o.reveal })]));
  }, true);

  /* ── fill in a truth table ── */
  LG.widget('truth', function (host, o, ctx) {
    var f = LG.exFrame(host, ctx);
    f.body.appendChild(el('p', { class: 'ex-q', html: o.q }));
    var n = o.inputs.length, rows = 1 << n, cells = [], vals = [];
    var want = o.vec || (function () {
      var s = '';
      for (var k = 0; k < rows; k++) s += o.fn.apply(null, o.inputs.map(function (_, i) { return (k >> (n - 1 - i)) & 1; }));
      return s;
    })();
    var table = el('table', { class: 'tt fill' });
    table.appendChild(el('tr', {}, o.inputs.map(function (x) { return el('th', { text: x }); }).concat(el('th', { class: 'out', html: o.out || 'Out' }))));
    for (var k = 0; k < rows; k++) (function (k) {
      var cell = el('button', { class: 'cellbtn', type: 'button', text: '?', 'aria-label': 'Output for row ' + (k + 1), onclick: function () {
        vals[k] = vals[k] === 1 ? 0 : vals[k] === 0 ? 1 : 0;
        cell.textContent = vals[k]; cell.className = 'cellbtn v' + vals[k];
      } });
      cells.push(cell);
      table.appendChild(el('tr', {}, o.inputs.map(function (_, i) { return el('td', { text: (k >> (n - 1 - i)) & 1 }); }).concat(el('td', { class: 'out' }, cell))));
    })(k);
    f.body.appendChild(el('div', { class: 'scrollx' }, table));
    var say;
    f.body.appendChild(el('div', { class: 'answer-row' }, [
      el('span', { class: 'hint-inline', text: 'Tap each ? to set 0 or 1.' }),
      el('button', { class: 'btn', type: 'button', text: 'Check', onclick: function () {
        var wrong = 0, blank = 0;
        cells.forEach(function (c, i) {
          c.classList.remove('wrong');
          if (vals[i] === undefined) blank++;
          else if (String(vals[i]) !== want[i]) { wrong++; c.classList.add('wrong'); }
        });
        if (blank) say('bad', 'Fill in every row first.');
        else if (wrong) say('bad', wrong + (wrong === 1 ? ' row is' : ' rows are') + ' wrong (marked). ' + (o.hint || ''));
        else { say('good', '<b>Correct.</b> ' + (o.why || '')); f.complete(); }
      } })]));
    say = LG.feedback(f.body);
  }, true);

  /* ── set the bits to make a number ── */
  LG.widget('setbits', function (host, o, ctx) {
    var f = LG.exFrame(host, ctx);
    f.body.appendChild(el('p', { class: 'ex-q', html: o.q }));
    var n = o.n || 8, v = 0, btns = [];
    var total = el('span', { class: 'bigval mono' });
    var row = el('div', { class: 'bitrow' });
    for (var i = n - 1; i >= 0; i--) (function (i) {
      var b = el('button', { class: 'bit', type: 'button', 'aria-label': 'Bit worth ' + (1 << i), onclick: function () { v ^= (1 << i); paint(); } });
      btns.push({ i: i, b: b });
      row.appendChild(el('div', { class: 'bitcol' }, [el('span', { class: 'weight', text: o.noWeights ? '' : (1 << i) }), b]));
    })(i);
    f.body.appendChild(el('div', { class: 'scrollx' }, row));
    f.body.appendChild(el('div', { class: 'answer-row' }, [el('span', { class: 'hint-inline', text: o.blind ? 'Your bits:' : 'Your number:' }), total]));
    var say = LG.feedback(f.body);
    function paint() {
      btns.forEach(function (x) { var on = (v >> x.i) & 1; x.b.textContent = on; x.b.classList.toggle('on', !!on); });
      total.textContent = o.blind ? LG.bin(v, n) : v;
      if (v === o.target) { say('good', '<b>Correct.</b> ' + (o.why || '')); f.complete(); }
      else say('', '');
    }
    paint();
  }, true);

  /* ── practice drills: endless random questions, done after `goal` correct ── */
  var pick = function (a) { return a[LG.rand(0, a.length - 1)]; };
  LG.drills = {
    bin2dec: function () { var n = LG.rand(1, 31), w = n > 15 ? 5 : 4; return { q: 'What is <code>' + LG.bin(n, w) + '</code> in decimal?', a: String(n), kb: 'numeric', why: LG.bin(n, w) + ' = ' + n }; },
    dec2bin: function () { var n = LG.rand(2, 31); return { q: 'Write <b>' + n + '</b> in binary.', a: n.toString(2), kb: 'numeric', why: n + ' = ' + n.toString(2) }; },
    bin2hex: function () { var n = LG.rand(0, 15); return { q: 'Which hex digit stands for <code>' + LG.bin(n, 4) + '</code>?', a: LG.hex(n), why: LG.bin(n, 4) + ' = ' + n + ' = hex ' + LG.hex(n) }; },
    hex2dec: function () { var n = LG.rand(16, 255); return { q: 'What is hex <code>' + LG.hex(n, 2) + '</code> in decimal?', a: String(n), kb: 'numeric', why: LG.hex(n, 2) + ' = ' + (n >> 4) + ' × 16 + ' + (n & 15) + ' = ' + n }; },
    gate: function (types) {
      var t = pick(types || ['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR']), a = LG.rand(0, 1), b = LG.rand(0, 1);
      return { q: '<code>' + a + ' ' + t + ' ' + b + '</code> = ?', a: String(E.gate(t, a, b)), choices: ['0', '1'], why: a + ' ' + t + ' ' + b + ' = ' + E.gate(t, a, b) };
    },
    basic: function () { return LG.drills.gate(['AND', 'OR']); },
    addbin: function () { var a = LG.rand(1, 7), b = LG.rand(1, 7); return { q: 'Add in binary: <code>' + LG.bin(a, 3) + ' + ' + LG.bin(b, 3) + '</code>', a: (a + b).toString(2), kb: 'numeric', why: a + ' + ' + b + ' = ' + (a + b) + ' = ' + (a + b).toString(2) }; },
    twos: function () { var n = LG.rand(-8, -1); return { q: 'In 4-bit two’s complement, which number is <code>' + LG.bin(n & 15, 4) + '</code>?', a: String(n), why: 'Top bit is 1, so it is negative: ' + (n & 15) + ' − 16 = ' + n }; }
  };
  LG.widget('drill', function (host, o, ctx) {
    var f = LG.exFrame(host, ctx, 'Practice');
    var goal = o.goal || 5, score = 0, cur;
    f.body.appendChild(el('p', { class: 'ex-q', html: o.q || 'Answer ' + goal + ' questions correctly.' }));
    var dots = el('div', { class: 'dots' }), stage = el('div', { class: 'drill-stage' });
    f.body.appendChild(dots); f.body.appendChild(stage);
    var say = LG.feedback(f.body);
    function paintDots() {
      dots.innerHTML = '';
      for (var i = 0; i < goal; i++) dots.appendChild(el('span', { class: 'dot' + (i < score ? ' on' : '') }));
      dots.appendChild(el('span', { class: 'dots-label', text: Math.min(score, goal) + ' of ' + goal }));
    }
    function answer(given) {
      if (LG.sameAnswer(given, cur.a)) {
        score++; paintDots();
        if (score >= goal) f.complete();
        say('good', '<b>Correct.</b> ' + cur.why + (score === goal ? ' Drill complete. Keep going if you like.' : ''));
        next();
      } else say('bad', 'Not quite. Try this one again.' + (o.tip ? ' ' + o.tip : ''));
    }
    function next() {
      cur = LG.drills[o.kind]();
      stage.innerHTML = '';
      stage.appendChild(el('p', { class: 'drill-q', html: cur.q }));
      if (cur.choices) {
        stage.appendChild(el('div', { class: 'choices' }, cur.choices.map(function (c) {
          return el('button', { class: 'choice mono', type: 'button', text: c, onclick: function () { answer(c); } });
        })));
      } else {
        var input = el('input', { class: 'answer mono', type: 'text', id: 'drill-' + ctx.ch.id + '-' + (++inputSeq), 'aria-label': 'Your answer', autocomplete: 'off', autocapitalize: 'off', inputmode: cur.kb || 'text', placeholder: 'Your answer' });
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') answer(input.value); });
        stage.appendChild(el('div', { class: 'answer-row' }, [input,
          el('button', { class: 'btn', type: 'button', text: 'Check', onclick: function () { answer(input.value); } }),
          el('button', { class: 'btn ghost', type: 'button', text: 'Skip', onclick: function () { say('', 'Answer: <code>' + cur.a + '</code>. ' + cur.why); next(); } })]));
      }
    }
    paintDots(); next();
  }, true);

  /* ── write a Boolean expression that matches a target ── */
  LG.widget('exprq', function (host, o, ctx) {
    var f = LG.exFrame(host, ctx);
    var id = 'expr-' + ctx.ch.id + '-' + (++inputSeq);
    f.body.appendChild(el('label', { class: 'ex-q', for: id, html: o.q }));
    var input = el('input', { id: id, class: 'answer mono wide', type: 'text', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: o.ph || 'e.g. A·B + !C' });
    var say;
    function check() {
      try {
        var p = E.parseExpr(input.value);
        var extra = p.vars.filter(function (v) { return o.vars.indexOf(v) < 0; });
        if (extra.length) { say('bad', 'Use only the inputs ' + o.vars.join(', ') + '.'); return; }
        if (o.ban && new RegExp(o.ban, 'i').test(input.value)) { say('bad', o.banMsg); return; }
        var got = E.truthOf(input.value, o.vars), want = o.vec || E.truthOf(o.same, o.vars);
        if (got === want) { say('good', '<b>Correct.</b> ' + (o.why || '')); f.complete(); }
        else say('bad', 'That gives the output column <code>' + got + '</code>, but the target is <code>' + want + '</code> (rows in counting order).' + (o.hint ? ' ' + o.hint : ''));
      } catch (e) { say('bad', e.message + '.'); }
    }
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
    f.body.appendChild(el('div', { class: 'answer-row' }, [input, el('button', { class: 'btn', type: 'button', text: 'Check', onclick: check })]));
    f.body.appendChild(el('p', { class: 'hint-inline', html: 'Write AND as <code>·</code> <code>*</code> <code>&amp;</code> or just <code>AB</code>, OR as <code>+</code>, NOT as <code>!</code> or a trailing <code>\'</code>, XOR as <code>^</code>. Words work too.' }));
    say = LG.feedback(f.body);
  }, true);

  /* ── rendering a chapter ── */
  var page, tocEl, cleanups = [], current = null;
  function render(ch) {
    cleanups.forEach(function (fn) { try { fn(); } catch (e) { /* ignore */ } });
    cleanups = [];
    var p = plan(ch), idx = LG.chapters.indexOf(ch), total = LG.chapters.length;
    var prev = LG.chapters[idx - 1], next = LG.chapters[idx + 1];
    page.innerHTML =
      '<header class="titleblock">' +
        '<div class="tb-row"><span>Part ' + ch.partNo + ' · ' + ch.part + '</span><span>Sheet ' + ch.no + ' of ' + total + '</span></div>' +
        '<h1>' + ch.title + '</h1>' +
        (ch.lead ? '<p class="lead">' + ch.lead + '</p>' : '') +
      '</header>' +
      '<div class="prose">' + p.html + '</div>' +
      '<nav class="pager" aria-label="Chapter">' +
        (prev ? '<a class="pg prev" href="#' + prev.id + '"><span>Previous</span><b>' + prev.title + '</b></a>' : '<span></span>') +
        (next ? '<a class="pg next" href="#' + next.id + '"><span>Next</span><b>' + next.title + '</b></a>' : '<span></span>') +
      '</nav>';
    var ctxBase = { ch: ch, counter: { n: 0 }, figs: { n: 0 } };
    [].forEach.call(page.querySelectorAll('[data-wid]'), function (host) {
      var i = +host.getAttribute('data-wid'), s = p.specs[i];
      var ctx = { ch: ch, counter: ctxBase.counter, ex: p.per[i], onCleanup: function (fn) { cleanups.push(fn); } };
      try {
        if (s.opts.cap && !LG.widgets[s.type].ex) {
          host.classList.add('fig');
          host.appendChild(el('div', { class: 'fig-cap', html: '<span>Fig ' + ch.no + '.' + (++ctxBase.figs.n) + '</span> ' + s.opts.cap }));
        }
        LG.widgets[s.type].mount(host, s.opts, ctx);
      } catch (e) {
        host.appendChild(el('p', { class: 'fb bad', text: 'This interactive failed to load: ' + e.message }));
        if (window.console) console.error(e);
      }
    });
    current = ch;
    LG.store.set('last', ch.id);
    document.title = ch.no === 1 ? 'Bit by Bit' : ch.title + ' · Bit by Bit';
    refreshToc();
    window.scrollTo(0, 0);
    var main = document.getElementById('main'); if (main) main.focus({ preventScroll: true });
  }

  function refreshToc() {
    if (!tocEl) return;
    var all = 0, got = 0;
    LG.chapters.forEach(function (ch) {
      var p = LG.progress(ch), a = tocEl.querySelector('[data-ch="' + ch.id + '"]');
      all += p.total; got += p.done;
      if (!a) return;
      a.classList.toggle('current', ch === current);
      if (ch === current) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      var st = a.querySelector('.st');
      st.textContent = !p.total ? '' : p.done === p.total ? '✓' : p.done + '/' + p.total;
      a.classList.toggle('complete', p.total > 0 && p.done === p.total);
    });
    var pct = all ? Math.round(100 * got / all) : 0;
    [].forEach.call(document.querySelectorAll('[data-progress]'), function (n) { n.textContent = got + ' of ' + all + ' exercises'; });
    [].forEach.call(document.querySelectorAll('[data-bar]'), function (n) { n.style.width = pct + '%'; });
  }
  LG.totals = function () {
    var all = 0, got = 0;
    LG.chapters.forEach(function (ch) { var p = LG.progress(ch); all += p.total; got += p.done; });
    return { all: all, done: got };
  };

  function buildToc() {
    var html = '', lastPart = null;
    LG.chapters.forEach(function (ch) {
      if (ch.part !== lastPart) {
        if (lastPart !== null) html += '</ol>';
        html += '<h2><span>Part ' + ch.partNo + '</span>' + ch.part + '</h2><ol>';
        lastPart = ch.part;
      }
      html += '<li><a href="#' + ch.id + '" data-ch="' + ch.id + '"><span class="no">' + (ch.no < 10 ? '0' : '') + ch.no + '</span><span class="tt-title">' + ch.title + '</span><span class="st"></span></a></li>';
    });
    tocEl.innerHTML = html + '</ol>';
  }

  function route() {
    var id = (location.hash || '').slice(1);
    var ch = LG.chapters.filter(function (c) { return c.id === id; })[0] || (id ? null : null);
    if (!ch) ch = LG.chapters[0];
    document.body.classList.remove('toc-open');
    render(ch);
  }

  LG.start = function () {
    page = document.getElementById('page');
    tocEl = document.getElementById('toc-list');
    var partNo = 0, lastPart = null;
    LG.chapters.forEach(function (ch, i) {
      if (ch.part !== lastPart) { partNo++; lastPart = ch.part; }
      ch.no = i + 1; ch.partNo = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][partNo - 1];
      ch.exIds = plan(ch).ids;
    });
    buildToc();
    document.getElementById('toc-toggle').addEventListener('click', function () { document.body.classList.toggle('toc-open'); });
    document.getElementById('scrim').addEventListener('click', function () { document.body.classList.remove('toc-open'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') document.body.classList.remove('toc-open'); });
    window.addEventListener('hashchange', route);
    if (!location.hash) {
      var last = LG.store.get('last', null);
      if (last && last !== LG.chapters[0].id) LG.resume = last;
    }
    route();
  };
})();
