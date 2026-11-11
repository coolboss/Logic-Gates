/* Run with:  node tests/run.js
 * Checks the simulators that the lessons rely on. No dependencies. */
'use strict';
const E = require('../js/engine.js');
const CH = require('../js/challenges.js');
let pass = 0, fail = 0;
function ok(cond, name) { if (cond) pass++; else { fail++; console.log('  FAIL  ' + name); } }
function eq(a, b, name) { ok(JSON.stringify(a) === JSON.stringify(b), name + '  (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')'); }

console.log('Gates');
const tt = t => [[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => E.gate(t, a, b)).join('');
eq(tt('AND'), '0001', 'AND'); eq(tt('OR'), '0111', 'OR'); eq(tt('NAND'), '1110', 'NAND');
eq(tt('NOR'), '1000', 'NOR'); eq(tt('XOR'), '0110', 'XOR'); eq(tt('XNOR'), '1001', 'XNOR');
eq([E.gate('NOT', 0), E.gate('NOT', 1)], [1, 0], 'NOT');

console.log('Circuits');
const half = { nodes: [{ id: 'A', t: 'in' }, { id: 'B', t: 'in' }, { id: 's', t: 'XOR', in: ['A', 'B'] }, { id: 'c', t: 'AND', in: ['A', 'B'] },
  { id: 'S', t: 'out', in: ['s'] }, { id: 'C', t: 'out', in: ['c'] }] };
eq(E.circuitTable(half, ['C', 'S']).map(r => r.outs.join('')), ['00', '01', '01', '10'], 'half adder');
const sr = new E.Circuit({ nodes: [{ id: 'S', t: 'in' }, { id: 'R', t: 'in' }, { id: 'q', t: 'NOR', in: ['R', 'qn'] }, { id: 'qn', t: 'NOR', in: ['S', 'q'], v: 1 }] });
eq(sr.get('q'), 0, 'SR latch starts at 0');
sr.set('S', 1); sr.set('S', 0); eq(sr.get('q'), 1, 'SR latch remembers set');
sr.set('R', 1); sr.set('R', 0); eq(sr.get('q'), 0, 'SR latch remembers reset');
const ring = new E.Circuit({ nodes: [{ id: 'n', t: 'NOT', in: ['n'] }] });
ok(!ring.stable, 'a NOT gate feeding itself never settles');

console.log('Boolean expressions');
eq(E.truthOf('A AND B'), '0001', 'words');
eq(E.truthOf('A·B + !A·!B'), '1001', 'symbols');
eq(E.truthOf("AB' + A'B"), '0110', 'postfix NOT and juxtaposition');
eq(E.truthOf('!(A+B)'), E.truthOf('!A·!B'), 'De Morgan 1');
eq(E.truthOf('NOT (A AND B)'), E.truthOf('NOT A OR NOT B'), 'De Morgan 2');
eq(E.truthOf('A ^ B ^ C'), '01101001', 'three-way XOR');
eq(E.truthOf('A + B·C'), '00011111', 'AND binds tighter than OR');
eq(E.truthOf('A NAND B'), '1110', 'NAND keyword');
let threw = false; try { E.parseExpr('A + (B'); } catch (e) { threw = true; } ok(threw, 'missing bracket is reported');

console.log('Breadboard');
let b = new E.Board({ parts: [] });
ok(b.add({ k: 'wire', a: 'P:5V', b: 'tp1' }).ok, 'place wire');
ok(!b.add({ k: 'wire', a: 'tp1', b: 'a1' }).ok, 'one lead per hole');
ok(!b.add({ k: 'chip', type: '7408', col: 26 }).ok, 'chip must fit');
ok(!b.add({ k: 'led', a: 'P:D2', b: 'a3' }).ok, 'parts stay on the breadboard');
b = new E.Board({ parts: [{ k: 'wire', a: 'P:5V', b: 'a1' }, { k: 'wire', a: 'P:GND', b: 'b1' }] });
ok(b.sim().errors.length === 1, 'short circuit detected');
b = new E.Board({ parts: [{ k: 'wire', a: 'P:5V', b: 'a1' }, { k: 'led', a: 'b1', b: 'b2' }, { k: 'wire', a: 'a2', b: 'P:GND' }] });
let r = b.sim(); ok(r.leds[b.parts[1].id].blown, 'LED without resistor is flagged');
b = new E.Board({ parts: [{ k: 'wire', a: 'P:5V', b: 'a1' }, { k: 'res', a: 'b1', b: 'b2' }, { k: 'led', a: 'c3', b: 'c2' }, { k: 'wire', a: 'a3', b: 'P:GND' }] });
r = b.sim(); ok(r.leds[b.parts[2].id].reversed && !r.leds[b.parts[2].id].lit, 'backwards LED stays dark');
b = new E.Board({ parts: [{ k: 'chip', type: '7408', col: 10 }] });
ok(/no power/.test(b.sim().warnings.join(' ')), 'unpowered chip warns');
b = new E.Board({ parts: CH[3].solution() });
b.parts = b.parts.filter(p => !(p.k === 'wire' && p.a === 'P:D3'));
ok(/Unconnected input/.test(b.sim().warnings.join(' ')), 'floating input warns');
b = new E.Board({ parts: [{ k: 'wire', a: 'P:5V', b: 'tp1' }, { k: 'wire', a: 'P:GND', b: 'tm1' }, { k: 'chip', type: '7404', col: 5 },
  { k: 'wire', a: 'a5', b: 'tp5' }, { k: 'wire', a: 'j11', b: 'tm11' }, { k: 'wire', a: 'j5', b: 'j6' }] });
ok(b.sim().oscillating, 'inverter loop oscillates');

console.log('Lab challenges');
CH.forEach(ch => {
  const start = new E.Board({ parts: ch.setup(), pins: ch.pins });
  const occ = {}; let clash = false;
  const sol = new E.Board({ parts: [], pins: ch.pins });
  ch.solution().forEach(p => { if (!sol.add(Object.assign({}, p)).ok) clash = true; });
  ok(!clash, ch.id + ': solution parts fit on the board');
  ok(!ch.check(start).ok, ch.id + ': starting board does not pass');
  const res = ch.check(sol);
  ok(res.ok, ch.id + ': solution passes' + (res.msg ? ' — ' + res.msg : ''));
  const s = sol.sim();
  ok(!s.errors.length && !s.warnings.length, ch.id + ': solution has no warnings ' + JSON.stringify(s.warnings.concat(s.errors)));
});
// a wrong build must fail: OR chip where AND is wanted
b = new E.Board({ parts: CH[3].solution().map(p => p.k === 'chip' ? Object.assign({}, p, { type: '7432' }) : p) });
ok(!CH[3].check(b).ok, 'and: an OR chip is rejected');

console.log('LG-8 computer');
function runProg(key, max) { const a = E.assemble(E.PROGRAMS[key].src); const c = new E.CPU(a.mem); c.run(max); return { c, a }; }
let p = runProg('add'); eq(p.a.errors, [], 'add assembles'); eq(p.c.out, 14, '5 + 9 = 14'); ok(p.c.halted, 'add halts');
p = runProg('mul'); eq(p.c.out, 12, '3 × 4 = 12');
p = runProg('down'); eq(p.c.out, 0, 'countdown ends at 0'); ok(p.c.halted, 'countdown halts');
p = runProg('count', 40); ok(!p.c.halted && p.c.out > 5, 'count keeps going');
eq(E.assemble('LDA 14\nBOGUS\nADD').errors.length, 2, 'assembler reports bad lines');
eq(E.disasm(0x2F), 'ADD 15', 'disassemble');
const c = new E.CPU(E.assemble('LDA 14\nADD 15\nHLT\n14: 200\n15: 100').mem); c.run();
eq([c.a, c.c], [44, 1], 'overflow wraps and sets carry');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
