/* Wiring-lab challenges: starting board, checker and a known-good solution for each.
 * The solutions are verified against the checkers by tests/run.js. */
(function (root) {
  'use strict';
  var E = root.LGE || require('./engine.js');

  var W = function (a, b) { return { k: 'wire', a: a, b: b }; };
  var R = function (a, b) { return { k: 'res', a: a, b: b }; };
  var L = function (a, b, color) { return { k: 'led', a: a, b: b, color: color || 'red' }; };
  var S = function (a, b) { return { k: 'sw', a: a, b: b, on: false }; };
  var C = function (type, col) { return { k: 'chip', type: type, col: col }; };
  /* Power already on all four rails, so a lesson can start at the interesting part. */
  var power = function () { return [W('P:5V', 'tp1'), W('P:GND', 'tm1'), W('tp30', 'bp30'), W('tm29', 'bm29')]; };

  function onlyChips(board, type) {
    return board.parts.every(function (p) { return p.k !== 'chip' || p.type === type; });
  }
  function rows(pins, vec) {
    var n = pins.length, out = [];
    for (var k = 0; k < vec.length; k++) {
      if (vec[k] === '1') out.push(pins.map(function (p, i) { return p + '=' + ((k >> (n - 1 - i)) & 1); }).join(' '));
    }
    return out.length ? out.join('; ') : 'never';
  }
  /* Standard checker for a combinational build: some LED must show each wanted pattern. */
  function truthCheck(pins, wanted, opts) {
    opts = opts || {};
    return function (board) {
      if (!board.parts.some(function (p) { return p.k === 'led'; })) return { ok: false, msg: 'Add an LED so the result can be seen.' };
      if (opts.only && !onlyChips(board, opts.only)) return { ok: false, msg: 'Use only ' + opts.only + ' chips for this one.' };
      if (opts.only && !board.parts.some(function (p) { return p.k === 'chip'; })) return { ok: false, msg: 'Place a ' + opts.only + ' chip first.' };
      var r = E.ledVectors(board, pins);
      if (r.bad) return { ok: false, msg: 'Fix the warning shown under the board first.' };
      if (E.findLeds(r.vec, wanted.map(function (w) { return w.vec; }))) return { ok: true };
      var ids = Object.keys(r.vec);
      var first = wanted[0];
      var seen = ids.length === 1 ? ' Your LED lights when: ' + rows(pins, r.vec[ids[0]]) + '.' : '';
      return { ok: false, msg: 'Not yet. ' + first.name + ' should light only when: ' + rows(pins, first.vec) + '.' + seen };
    };
  }

  var CH = [
    {
      id: 'led', level: 'Start', title: 'Light an LED',
      goal: 'Make a complete loop: +5V → resistor → LED → GND.',
      steps: [
        'Wire tool: tap <b>5V</b> on the controller, then any hole on the red <b>+</b> rail.',
        'Wire: tap <b>GND</b>, then any hole on the blue <b>−</b> rail.',
        'Resistor tool: tap a <b>+</b> rail hole, then a hole in a column below it (say a5).',
        'LED tool: tap a hole in that same column (b5) for the long + leg, then a hole in the next column (b6).',
        'Wire: from the second column (a6) to the <b>−</b> rail. The loop is closed and the LED lights.'
      ],
      setup: function () { return []; },
      check: function (b) {
        var r = b.sim();
        if (r.errors.length) return { ok: false, msg: r.errors[0] };
        var ids = Object.keys(r.leds);
        if (!ids.length) return { ok: false, msg: 'There is no LED on the board yet.' };
        if (ids.some(function (i) { return r.leds[i].blown; })) return { ok: false, msg: 'The LED needs a resistor in its path.' };
        if (ids.some(function (i) { return r.leds[i].lit; })) return { ok: true };
        return { ok: false, msg: 'The LED is dark. Trace the loop with your finger: 5V, resistor, LED +, LED −, GND. Where does it break?' };
      },
      solution: function () { return [W('P:5V', 'tp1'), W('P:GND', 'tm1'), R('tp5', 'a5'), L('b5', 'b6'), W('a6', 'tm6')]; }
    },
    {
      id: 'pin', level: 'Start', title: 'Let a pin control the LED',
      goal: 'The LED must follow pin D2: on when D2 is HIGH, off when it is LOW.',
      steps: [
        'Power is already on the rails.',
        'Wire <b>D2</b> to a free column. D2 now plays the role that 5V played before.',
        'From that column: resistor → LED → <b>−</b> rail, as in the first build.',
        'Tap the D2 button on the controller to flip it between HIGH and LOW.'
      ],
      setup: power,
      check: truthCheck(['D2'], [{ name: 'The LED', vec: '01' }]),
      solution: function () { return power().concat([W('P:D2', 'a10'), R('b10', 'b14'), L('c14', 'c15'), W('a15', 'tm15')]); }
    },
    {
      id: 'switch', level: 'Start', title: 'Add a switch',
      goal: 'Put a switch in the loop so that it turns the LED on and off.',
      steps: [
        'A switch is a gap in the wire that you can close.',
        'Build + rail → switch → resistor → LED → − rail.',
        'Tap the switch body to slide it.'
      ],
      setup: power,
      check: function (b) {
        var sws = b.parts.filter(function (p) { return p.k === 'sw'; });
        if (!sws.length) return { ok: false, msg: 'Place a switch first.' };
        for (var i = 0; i < sws.length; i++) {
          var c = b.clone(), s = c.parts.filter(function (p) { return p.id === sws[i].id; })[0];
          s.on = true; var on = c.sim();
          s.on = false; var off = c.sim();
          if (on.errors.length || off.errors.length) return { ok: false, msg: on.errors[0] || off.errors[0] };
          var ids = Object.keys(on.leds);
          if (ids.some(function (id) { return on.leds[id].blown; })) return { ok: false, msg: 'The LED needs a resistor in its path.' };
          if (ids.some(function (id) { return on.leds[id].lit && !off.leds[id].lit; })) return { ok: true };
        }
        return { ok: false, msg: 'The switch does not control an LED yet. The current must pass through the switch on its way to the LED.' };
      },
      solution: function () { return power().concat([S('tp6', 'a6'), R('b6', 'b10'), L('c10', 'c11'), W('a11', 'tm11')]); }
    },
    {
      id: 'and', level: 'Core', title: 'Your first chip: AND',
      goal: 'Use a 7408 so the LED lights only when D2 AND D3 are both HIGH.',
      steps: [
        'Chip tool: choose <b>7408</b> and tap a column. The chip sits across the middle gap.',
        'Power the chip: pin 14 (top left) to <b>+</b>, pin 7 (bottom right) to <b>−</b>. A chip without power does nothing.',
        'Wire <b>D2</b> to pin 1 and <b>D3</b> to pin 2. Tap the chip to see its pin map.',
        'Pin 3 is the output: resistor → LED → <b>−</b>.',
        'Try all four combinations of D2 and D3.'
      ],
      setup: power,
      check: truthCheck(['D2', 'D3'], [{ name: 'The LED', vec: '0001' }]),
      solution: function () {
        return power().concat([C('7408', 10), W('a10', 'tp10'), W('j16', 'bm16'), W('P:D2', 'j10'), W('P:D3', 'j11'),
          R('i12', 'i20'), L('h20', 'h21'), W('j21', 'bm21')]);
      }
    },
    {
      id: 'not', level: 'Core', title: 'NOT from a NAND',
      goal: 'With a 7400 (NAND) chip only, make the LED show the opposite of D2.',
      steps: [
        'Feed the same signal to both inputs of one NAND gate.',
        'Wire D2 to pin 1, then join pin 1 to pin 2 with a short wire.',
        'Pin 3 now gives NOT D2. Send it to the LED through a resistor.'
      ],
      setup: function () { return power().concat([C('7400', 10), W('a10', 'tp10'), W('j16', 'bm16')]); },
      check: truthCheck(['D2'], [{ name: 'The LED', vec: '10' }], { only: '7400' }),
      solution: function () {
        return power().concat([C('7400', 10), W('a10', 'tp10'), W('j16', 'bm16'), W('P:D2', 'j10'), W('i10', 'i11'),
          R('i12', 'i20'), L('h20', 'h21'), W('j21', 'bm21')]);
      }
    },
    {
      id: 'or', level: 'Core', title: 'OR from three NANDs',
      goal: 'With one 7400 only, light the LED when D2 OR D3 is HIGH.',
      steps: [
        'Recall: A OR B = (NOT A) NAND (NOT B).',
        'Gate 1 (pins 1, 2 → 3): both inputs from D2. That is NOT A.',
        'Gate 2 (pins 4, 5 → 6): both inputs from D3. That is NOT B.',
        'Gate 3 (pins 9, 10 → 8): inputs from pin 3 and pin 6. Pin 8 is the answer.'
      ],
      setup: function () { return power().concat([C('7400', 10), W('a10', 'tp10'), W('j16', 'bm16')]); },
      check: truthCheck(['D2', 'D3'], [{ name: 'The LED', vec: '0111' }], { only: '7400' }),
      solution: function () {
        return power().concat([C('7400', 10), W('a10', 'tp10'), W('j16', 'bm16'),
          W('P:D2', 'j10'), W('i10', 'i11'), W('P:D3', 'j13'), W('i13', 'i14'),
          W('h12', 'd15'), W('h15', 'd14'), R('c16', 'c22'), L('b22', 'b23'), W('a23', 'tm23')]);
      }
    },
    {
      id: 'xor', level: 'Stretch', title: 'XOR from four NANDs',
      goal: 'With one 7400 only, light the LED when D2 and D3 are different.',
      steps: [
        'Let N = A NAND B (gate 1).',
        'Gate 2: A NAND N. Gate 3: B NAND N.',
        'Gate 4: NAND the outputs of gates 2 and 3. That is A XOR B.',
        'A, B and N each go to two places. Use a spare hole in the same column as a junction.'
      ],
      setup: function () { return power().concat([C('7400', 10), W('a10', 'tp10'), W('j16', 'bm16')]); },
      check: truthCheck(['D2', 'D3'], [{ name: 'The LED', vec: '0110' }], { only: '7400' }),
      solution: function () {
        return power().concat([C('7400', 10), W('a10', 'tp10'), W('j16', 'bm16'),
          W('P:D2', 'j10'), W('i10', 'i13'), W('P:D3', 'j11'), W('h11', 'd14'),
          W('i12', 'i14'), W('h12', 'd15'), W('h15', 'd12'), W('c16', 'c11'),
          R('b13', 'b22'), L('c22', 'c23'), W('a23', 'tm23')]);
      }
    },
    {
      id: 'half', level: 'Core', title: 'Half adder',
      goal: 'Add two bits. One LED shows SUM (D2 XOR D3), another shows CARRY (D2 AND D3).',
      steps: [
        'The 7486 (XOR) and 7408 (AND) are placed and powered for you.',
        'Send D2 to pin 1 of both chips, and D3 to pin 2 of both chips.',
        'XOR pin 3 → resistor → SUM LED → −.',
        'AND pin 3 → resistor → CARRY LED → −.',
        'Check: 1 + 1 must show carry on, sum off. That is binary 10, which is two.'
      ],
      setup: function () {
        return power().concat([C('7486', 5), W('a5', 'tp5'), W('j11', 'bm11'), C('7408', 15), W('a15', 'tp15'), W('j21', 'bm21')]);
      },
      check: truthCheck(['D2', 'D3'], [{ name: 'The SUM LED', vec: '0110' }, { name: 'The CARRY LED', vec: '0001' }]),
      solution: function () {
        return power().concat([C('7486', 5), W('a5', 'tp5'), W('j11', 'bm11'), C('7408', 15), W('a15', 'tp15'), W('j21', 'bm21'),
          W('P:D2', 'j5'), W('i5', 'i15'), W('P:D3', 'j6'), W('i6', 'i16'),
          R('g7', 'g24'), L('h24', 'h25', 'green'), W('j25', 'bm25'),
          R('g17', 'g27'), L('h27', 'h28', 'red'), W('j28', 'bm28')]);
      }
    },
    {
      id: 'full', level: 'Stretch', title: 'Full adder',
      goal: 'Add three bits: D2 + D3 + D4 (carry-in). Show SUM and CARRY-OUT on two LEDs.',
      steps: [
        'SUM = (A XOR B) XOR Cin. Use two gates of the 7486.',
        'CARRY = (A AND B) OR ((A XOR B) AND Cin). Two AND gates, then one OR gate.',
        'All three chips are placed and powered. Wire one signal at a time and test as you go.'
      ],
      setup: function () {
        return power().concat([C('7486', 2), W('a2', 'tp2'), W('j8', 'bm8'), C('7408', 10), W('a10', 'tp10'), W('j16', 'bm16'),
          C('7432', 18), W('a18', 'tp18'), W('j24', 'bm24')]);
      },
      check: truthCheck(['D2', 'D3', 'D4'], [{ name: 'The SUM LED', vec: '01101001' }, { name: 'The CARRY LED', vec: '00010111' }]),
      solution: function () {
        return this.setup().concat([
          W('P:D2', 'j2'), W('i2', 'i10'), W('P:D3', 'j3'), W('i3', 'i11'),
          W('j4', 'j5'), W('P:D4', 'j6'), W('i4', 'i13'), W('i6', 'i14'),
          R('g7', 'g26'), L('h26', 'h27', 'green'), W('j27', 'bm27'),
          W('h12', 'h18'), W('h15', 'h19'),
          R('g20', 'g28'), L('h28', 'h29', 'red'), W('j29', 'bm28')]);
      }
    },
    {
      id: 'latch', level: 'Core', title: 'A circuit that remembers',
      goal: 'Build an SR latch from two NAND gates. A brief LOW on D2 must turn the LED on and keep it on. A brief LOW on D3 must turn it off.',
      pins: { D2: 1, D3: 1 },
      steps: [
        'D2 and D3 rest HIGH. In this latch a LOW is the active signal.',
        'Gate 1 (pins 1, 2 → 3): pin 1 from D2. Gate 2 (pins 4, 5 → 6): pin 5 from D3.',
        'Now cross the outputs back: pin 3 → pin 4, and pin 6 → pin 2. This loop is the memory.',
        'Pin 3 is Q. Send it to the LED through a resistor.',
        'Tap D2 LOW then HIGH again. The LED stays on with nothing holding it.'
      ],
      setup: function () { return power().concat([C('7400', 10), W('a10', 'tp10'), W('j16', 'bm16')]); },
      check: function (board) {
        if (!onlyChips(board, '7400')) return { ok: false, msg: 'Use only the 7400 for this one.' };
        var b = board.clone(), seq = [], bad = false;
        function step(d2, d3) {
          b.pins.D2 = d2; b.pins.D3 = d3;
          var r = b.sim();
          if (r.errors.length || r.oscillating) bad = true;
          return r.leds;
        }
        step(1, 1); step(0, 1); seq.push(step(1, 1));
        step(1, 0); seq.push(step(1, 1));
        step(0, 1); seq.push(step(1, 1));
        if (bad) return { ok: false, msg: 'Fix the warning shown under the board first.' };
        var ids = Object.keys(seq[0]);
        if (!ids.length) return { ok: false, msg: 'Add an LED on Q (pin 3) so the stored bit can be seen.' };
        var ok = ids.some(function (id) { return seq[0][id].lit && !seq[1][id].lit && seq[2][id].lit; });
        return ok ? { ok: true } : { ok: false, msg: 'The LED does not hold its state after D2 or D3 returns to HIGH. Check the two crossing wires: pin 3 → pin 4 and pin 6 → pin 2.' };
      },
      solution: function () {
        return power().concat([C('7400', 10), W('a10', 'tp10'), W('j16', 'bm16'),
          W('P:D2', 'j10'), W('P:D3', 'j14'), W('i12', 'i13'), W('h15', 'h11'),
          R('g12', 'g22'), L('h22', 'h23'), W('j23', 'bm23')]);
      }
    },
    {
      id: 'toggle', level: 'Stretch', title: 'A flip-flop that toggles',
      goal: 'Use a 7474 so that each LOW → HIGH tick on D2 flips the LED. The LED then blinks at half the speed of D2.',
      steps: [
        'One half of the 7474: pin 2 = D, pin 3 = CLK, pin 5 = Q, pin 6 = Q̄ (the opposite of Q).',
        'Wire D2 to CLK (pin 3).',
        'Wire Q̄ (pin 6) back to D (pin 2). At each tick the flip-flop stores the opposite of what it holds.',
        'LED on Q (pin 5). Tap D2 repeatedly, or run the Blink sketch.'
      ],
      setup: function () { return power().concat([C('7474', 10), W('a10', 'tp10'), W('j16', 'bm16')]); },
      check: function (board) {
        var b = board.clone(), seen = [], bad = false;
        b.pins.D2 = 0; b.sim();
        for (var i = 0; i < 4; i++) {
          b.pins.D2 = 1; var r = b.sim();
          if (r.errors.length) bad = true;
          seen.push(r.leds);
          b.pins.D2 = 0; b.sim();
        }
        if (bad) return { ok: false, msg: 'Fix the warning shown under the board first.' };
        var ids = Object.keys(seen[0]);
        if (!ids.length) return { ok: false, msg: 'Add an LED on Q (pin 5).' };
        var ok = ids.some(function (id) {
          return seen[0][id].lit !== seen[1][id].lit && seen[1][id].lit !== seen[2][id].lit && seen[2][id].lit !== seen[3][id].lit;
        });
        return ok ? { ok: true } : { ok: false, msg: 'The LED should flip on every rising tick of D2. Is Q̄ (pin 6) wired back to D (pin 2), and D2 to CLK (pin 3)?' };
      },
      solution: function () {
        return power().concat([C('7474', 10), W('a10', 'tp10'), W('j16', 'bm16'),
          W('P:D2', 'j12'), W('i15', 'i11'), R('g14', 'g22'), L('h22', 'h23'), W('j23', 'bm23')]);
      }
    },
    {
      id: 'count', level: 'Core', title: 'A 4-bit display',
      goal: 'Give each of D2, D3, D4 and D5 its own LED. Then run the Count sketch and watch binary counting on real wires.',
      steps: [
        'Four copies of the same build: pin → resistor → LED → −.',
        'Put the D5 LED on the left and D2 on the right, so the row reads like a binary number.',
        'Choose the <b>Count</b> sketch on the controller. D2 is the 1s place, D5 is the 8s place.'
      ],
      setup: power,
      check: truthCheck(['D5', 'D4', 'D3', 'D2'], [
        { name: 'The D5 LED', vec: '0000000011111111' }, { name: 'The D4 LED', vec: '0000111100001111' },
        { name: 'The D3 LED', vec: '0011001100110011' }, { name: 'The D2 LED', vec: '0101010101010101' }]),
      solution: function () {
        var p = power();
        [['D5', 6], ['D4', 11], ['D3', 16], ['D2', 21]].forEach(function (x) {
          var c = x[1];
          p.push(W('P:' + x[0], 'a' + c), R('b' + c, 'b' + (c + 2)), L('c' + (c + 2), 'c' + (c + 3)), W('a' + (c + 3), 'tm' + (c + 3)));
        });
        return p;
      }
    }
  ];

  /* Small pre-built boards used inside the lessons. */
  E.PRESETS = {
    empty: function () { return { parts: [] }; },
    powered: function () { return { parts: power() }; },
    led: function () { return { parts: CH[0].solution() }; },
    pin: function () { return { parts: CH[1].solution() }; },
    and: function () { return { parts: CH[3].solution() }; },
    latch: function () { return { parts: CH[9].solution(), pins: { D2: 1, D3: 1 } }; }
  };
  E.CHALLENGES = CH;
  if (typeof module !== 'undefined' && module.exports) module.exports = CH;
})(typeof window !== 'undefined' ? window : globalThis);
