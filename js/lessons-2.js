/* Part II — Logic: switches, transistors, the seven gates, NAND, Boolean algebra. */
(function () {
  'use strict';
  var LG = window.LG, W = LG.W, E = window.LGE, PART = 'Logic';

  LG.chapter({
    id: 'switches', part: PART, title: 'Switches and transistors',
    lead: 'Storing bits is not enough. A computer has to combine them. That job is done by switches, arranged so that one switch can flip another.',
    body: function () {
      return `
<h2>A bit as a voltage</h2>
<p>From here on, a bit is a voltage on a wire. A wire connected to the positive side of the supply, at 5 volts, carries a <b>1</b>. A wire connected to ground, at 0 volts, carries a <b>0</b>. (Many modern chips use 3.3 V or less for a 1. The idea is the same.)</p>
<p>In the figures a glowing orange wire is a 1 and a grey wire is a 0.</p>

<h2>Two switches already make logic</h2>
<p>Put a battery, a lamp and two switches in a loop. How the switches are arranged decides when the lamp lights.</p>
${W('switches', { cap: 'Tap the switches. Then change the arrangement.' })}
<ul>
  <li><b>In a row (series):</b> the current has one path with two gaps. Both must be closed. The lamp says “A <b>and</b> B”.</li>
  <li><b>Side by side (parallel):</b> the current has two paths. Either one will do. The lamp says “A <b>or</b> B”.</li>
</ul>
<p>The lamp is computing something from A and B. It is a tiny, real piece of logic, built from nothing but wire and switches.</p>

<h2>Writing down every case: the truth table</h2>
<p>Two switches can be set in four ways. A <b>truth table</b> lists every way, in counting order (00, 01, 10, 11), with the result beside it. A truth table is the complete description of a logic circuit: there is nothing else to know about it.</p>
${W('truth', { q: 'Fill in the lamp column for the switches <b>in a row</b>. Use 1 for closed and for lit.', inputs: ['A', 'B'], out: 'Lamp', vec: '0001', why: 'Only the last row, with both switches closed, completes the loop.', hint: 'In a row, a single open switch breaks the only path.' })}
${W('truth', { q: 'Now fill in the lamp column for the switches <b>side by side</b>.', inputs: ['A', 'B'], out: 'Lamp', vec: '0111', why: 'Any closed switch gives the current a path. Only “both open” is dark.', hint: 'Side by side, the lamp is dark only when no path exists.' })}

<h2>The missing piece: a switch worked by electricity</h2>
<p>These switches need fingers. A computer needs switches that are flipped by <i>other circuits</i>, so that the lamp of one stage can become the finger of the next. Three inventions did this job, each replacing the last:</p>
<ul>
  <li><b>The relay</b> (1830s): an electromagnet pulls a metal switch closed. It works, but it is slow, it clicks, and it wears out.</li>
  <li><b>The vacuum tube</b> (early 1900s): no moving parts, much faster, but hot, large and short-lived. Early computers used thousands and filled rooms.</li>
  <li><b>The transistor</b> (1947, Bell Labs): a switch made from a speck of silicon, with nothing that moves and almost nothing to wear out.</li>
</ul>
<p>A transistor has three connections. Two of them are the ends of the switch. The third is the control, called the <b>gate</b>. Put a 1 on the gate and the switch closes. Put a 0 on it and the switch opens. A chip the size of a fingernail now holds billions of them.</p>
<div class="key"><b>Key idea</b>A transistor is a switch whose finger is a voltage. That lets the output of one circuit control the next, and that is what makes large machines possible.</div>

<h2>One transistor makes an inverter</h2>
<p>Here is the simplest useful circuit. A resistor connects the output to +5 V. A transistor sits between the output and ground.</p>
${W('tgate', { kind: 'NOT', cap: 'Tap the input. The output does the opposite.' })}
<p>With the input at 0 the transistor is open. Nothing pulls the output down, so the resistor holds it up at 5 V: a 1. With the input at 1 the transistor closes and connects the output straight to ground: a 0. The circuit turns every bit into its opposite. It is called an <b>inverter</b>, or a NOT gate.</p>
<p>Notice something else. Whatever tired voltage arrives at the input, the output is either firmly connected to ground or firmly pulled up to 5 V. The signal comes out fresh. This is the clean-up effect promised in the chapter on bits.</p>

<h2>Two transistors make a decision</h2>
<p>Now use two transistors, exactly as we used two finger switches.</p>
${W('tgate', { kind: 'NAND', cap: 'Transistors in a row: the output drops only when A and B are both 1' })}
${W('tgate', { kind: 'NOR', cap: 'Transistors side by side: the output drops when A or B is 1' })}
<p>These are the series and parallel circuits again, with one twist: closing the path pulls the output <i>down</i>. So the answers come out upside-down. The first circuit gives “not (A and B)”, called <b>NAND</b>. The second gives “not (A or B)”, called <b>NOR</b>. You will meet both properly soon.</p>
<div class="aside">Real chips improve on this design. Instead of a resistor they use a second, mirror-image set of transistors to pull the output up. This style is called CMOS, and it uses almost no power while it sits still. The logic it performs is exactly what you see here.</div>

<h2>Check your understanding</h2>
${W('mcq', { q: 'In the inverter, why is the output 0 when the input is 1?', stack: true, opts: ['The transistor closes and connects the output to ground', 'The resistor stops working', 'The 5 V supply switches off', 'The input voltage is used up'], a: 0, why: 'A closed transistor is a direct path to 0 V, and it easily overpowers the resistor.' })}
${W('mcq', { q: 'Two transistors sit in a row between the output and ground. When is the output pulled down to 0?', stack: true, opts: ['When either transistor is on', 'Only when both transistors are on', 'When both are off', 'Never'], a: 1, why: 'Current needs an unbroken path, so both switches in the row must be closed.' })}
${W('mcq', { q: 'What can a transistor do that a wall switch cannot?', stack: true, opts: ['Carry electricity', 'Be flipped by a voltage from another circuit', 'Stay in the off position', 'Work without a battery'], a: 1, why: 'Electrical control is what lets circuits drive other circuits.' })}

<div class="recap"><h3>What you now know</h3><ul>
  <li>A 1 is a high voltage on a wire and a 0 is a low one.</li>
  <li>Switches in a row behave as AND. Switches side by side behave as OR.</li>
  <li>A truth table lists the output for every combination of inputs.</li>
  <li>A transistor is an electrically controlled switch. One makes a NOT. Two make a NAND or a NOR.</li>
</ul></div>`;
    }
  });

  LG.chapter({
    id: 'gates', part: PART, title: 'NOT, AND, OR',
    lead: 'Three small rule machines. From now on we stop drawing transistors and draw these instead.',
    body: function () {
      var alarm = { w: 440, h: 230, nodes: [
        { id: 'D', t: 'in', x: 50, y: 50, label: 'Door open' }, { id: 'Wn', t: 'in', x: 50, y: 120, label: 'Window open' }, { id: 'Ar', t: 'in', x: 50, y: 194, label: 'Alarm set' },
        { id: 'or', t: 'OR', x: 180, y: 85, in: [{ s: 'D', mx: 116 }, { s: 'Wn', mx: 116 }] },
        { id: 'and', t: 'AND', x: 300, y: 140, in: [{ s: 'or', mx: 240 }, { s: 'Ar', mx: 240 }] },
        { id: 'S', t: 'out', x: 394, y: 140, in: ['and'], label: 'Siren' }] };
      return `
<h2>What a gate is</h2>
<p>A <b>logic gate</b> is a small circuit with one or more inputs and one output. Bits go in. One bit comes out. The rule connecting them never changes.</p>
<p>Inside, a gate is a handful of transistors, like the ones on the last sheet. We no longer need to look inside. A gate has a symbol, a name, and a truth table, and the truth table tells you everything.</p>

<h2>NOT: the opposite</h2>
${W('circuit', { c: 'NOT', truth: true, cap: 'NOT has one input', say: function (v) { return 'In is ' + v.A + ', so Out is <b>' + v.Q + '</b>. NOT always gives the other value.'; } })}
<p>NOT flips its input. A 1 becomes 0 and a 0 becomes 1. The small circle on the tip of the symbol is the part that means “opposite”. Watch for that circle on other gates.</p>
<p>On paper, NOT A is written <code>¬A</code>, <code>!A</code>, <code>A'</code>, or A with a bar over it. They all mean the same.</p>
<p><i>Everyday NOT:</i> a fridge light is on when the door is <b>not</b> closed.</p>

<h2>AND: all of them</h2>
${W('circuit', { c: 'AND', truth: true, cap: 'AND is strict', say: function (v) { return 'A=' + v.A + ' and B=' + v.B + '. ' + (v.Q ? 'Both are 1, so Out is <b>1</b>.' : 'At least one is 0, so Out is <b>0</b>.'); } })}
<p>AND gives 1 only when every input is 1. A single 0 anywhere forces the output to 0.</p>
<p>On paper, A AND B is written <code>A·B</code> or just <code>AB</code>, like multiplication. The likeness is exact: 1 × 1 = 1, and anything times 0 is 0.</p>
<p><i>Everyday AND:</i> a microwave oven runs only if the door is closed <b>and</b> Start has been pressed.</p>

<h2>OR: any of them</h2>
${W('circuit', { c: 'OR', truth: true, cap: 'OR is generous', say: function (v) { return 'A=' + v.A + ' and B=' + v.B + '. ' + (v.Q ? 'At least one is 1, so Out is <b>1</b>.' : 'Both are 0, so Out is <b>0</b>.'); } })}
<p>OR gives 1 when at least one input is 1. Only “all zeros” gives 0.</p>
<p>On paper, A OR B is written <code>A+B</code>. Take care: in logic, <code>1+1</code> is 1, not 2. “Both” still counts as yes.</p>
<p><i>Everyday OR:</i> a doorbell rings if the front button <b>or</b> the back button is pressed. Pressing both also rings it.</p>

<h2>More than two inputs</h2>
<p>AND and OR can have any number of inputs. The rule stretches naturally: a 3-input AND needs all three to be 1. A 3-input OR needs any one of them.</p>
${W('circuit', { c: 'and3', truth: true, cap: 'A three-input AND has eight rows and a single 1' })}
<p>With n inputs a truth table has 2<sup>n</sup> rows. You have seen that number before: it is the number of patterns n bits can make.</p>

<h2>Gates feeding gates</h2>
<p>The output of a gate is an ordinary bit, so it can be the input of another gate. This is where it becomes useful. Here is a burglar alarm: the siren sounds if the door <b>or</b> the window is open, <b>and</b> the alarm has been set.</p>
${W('circuit', { c: alarm, truth: true, cap: 'Two gates, one small machine', say: function (v) { return (v.or ? 'Something is open' : 'Everything is shut') + (v.Ar ? ' and the alarm is set' : ' and the alarm is not set') + ', so the siren is <b>' + (v.S ? 'ON' : 'off') + '</b>.'; } })}
<p>To read any circuit, start at the inputs and move right. Work out each gate’s output from its inputs, write it on the wire, and carry on. The glowing wires in the figure are doing exactly that for you.</p>

<h2>Practice</h2>
${W('drill', { kind: 'basic', goal: 6, q: 'Work out each result. Get 6 right.' })}
${W('truth', { q: 'Fill in the table for a <b>3-input OR</b> gate.', inputs: ['A', 'B', 'C'], vec: '01111111', why: 'OR is 0 only in the single row where every input is 0.', hint: 'Find the one row where no input is 1.' })}
${W('truth', { q: 'A circuit computes <b>A AND (NOT B)</b>. Fill in its table.', inputs: ['A', 'B'], vec: '0010', why: 'It is 1 only when A is 1 and B is 0.', hint: 'First flip B in your head, then AND it with A.' })}
${W('mcq', { q: 'A lift moves only if its door is closed and a floor has been chosen. Which gate describes this?', opts: ['NOT', 'AND', 'OR'], a: 1, why: 'Both conditions must hold together.' })}
${W('mcq', { q: 'A 3-input AND gate has 8 rows in its truth table. In how many rows is the output 1?', opts: ['1', '3', '7', '8'], a: 0, why: 'Only the row 1-1-1 has every input at 1.', hints: [null, 'It is not one row per input. AND needs all of them at once.', 'That is the answer for OR.', 'Then the gate would always be on.'] })}
${W('mcq', { q: 'In the alarm circuit, the door is open, the window is shut, and the alarm is <b>not</b> set. What does the siren do?', opts: ['Sounds', 'Stays silent'], a: 1, why: 'The OR gate gives 1, but the AND gate also needs “alarm set” to be 1.' })}

<div class="recap"><h3>What you now know</h3><ul>
  <li>NOT flips a bit. AND needs every input to be 1. OR needs at least one.</li>
  <li>A small circle on a symbol means “opposite”.</li>
  <li>The output of one gate can feed another, and that is how larger behaviour is built.</li>
  <li>Read a circuit from left to right, one gate at a time.</li>
</ul></div>`;
    }
  });

  LG.chapter({
    id: 'more-gates', part: PART, title: 'NAND, NOR, XOR, XNOR',
    lead: 'Four more gates complete the set. Each is a small twist on AND or OR, and two of them will turn out to be the most important gates of all.',
    body: function () {
      var types = ['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR'], rows = '';
      [[0, 0], [0, 1], [1, 0], [1, 1]].forEach(function (r) {
        rows += '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td>' + types.map(function (t) { var v = E.gate(t, r[0], r[1]); return '<td class="out' + (v ? ' one' : '') + '">' + v + '</td>'; }).join('') + '</tr>';
      });
      return `
<h2>NAND: not all</h2>
<p>NAND is short for NOT-AND. Do an AND, then flip the answer. Its symbol is the AND shape with the “opposite” circle on its tip.</p>
${W('circuit', { c: 'NAND', truth: true, cap: 'NAND is 0 only when every input is 1', say: function (v) { return 'A AND B would be ' + (v.A & v.B) + '. Flip it: NAND gives <b>' + v.Q + '</b>.'; } })}
<p>A good way to hold it in mind: NAND is 1 unless <i>all</i> its inputs are 1.</p>

<h2>NOR: none</h2>
<p>NOR is NOT-OR. Do an OR, then flip the answer.</p>
${W('circuit', { c: 'NOR', truth: true, cap: 'NOR is 1 only when every input is 0', say: function (v) { return 'A OR B would be ' + (v.A | v.B) + '. Flip it: NOR gives <b>' + v.Q + '</b>.'; } })}
<p>NOR is 1 only when <i>none</i> of its inputs is 1.</p>

<h2>XOR: different</h2>
<p>XOR means “exclusive or”. It is the OR of everyday speech: tea or coffee, one or the other, but not both.</p>
${W('circuit', { c: 'XOR', truth: true, cap: 'XOR is 1 when the inputs differ', say: function (v) { return 'The inputs are ' + (v.A === v.B ? 'the same' : 'different') + ', so XOR gives <b>' + v.Q + '</b>.'; } })}
<p>Three ways to think about XOR, all correct:</p>
<ul>
  <li><b>A difference detector.</b> It is 1 exactly when A and B are not equal.</li>
  <li><b>A switchable inverter.</b> Hold B at 0 and the output copies A. Hold B at 1 and the output is NOT A. So B decides whether A gets flipped. We will use this trick to build a subtractor.</li>
  <li><b>A stairway light.</b> A light with a switch at the bottom and another at the top: flipping either switch changes the light. That wiring is an XOR.</li>
</ul>

<h2>XNOR: same</h2>
<p>XNOR is XOR with the answer flipped. It is 1 when the inputs are equal.</p>
${W('circuit', { c: 'XNOR', truth: true, cap: 'XNOR is an equality tester', say: function (v) { return 'The inputs are ' + (v.A === v.B ? 'the same' : 'different') + ', so XNOR gives <b>' + v.Q + '</b>.'; } })}

<h2>All of them, side by side</h2>
<div class="scrollx"><table class="tt"><tr><th>A</th><th>B</th>${types.map(function (t) { return '<th class="out">' + t + '</th>'; }).join('')}</tr>${rows}</table></div>
<dl class="words">
  <dt>AND</dt><dd>all inputs are 1</dd>
  <dt>OR</dt><dd>at least one input is 1</dd>
  <dt>NAND</dt><dd>not all inputs are 1</dd>
  <dt>NOR</dt><dd>no input is 1</dd>
  <dt>XOR</dt><dd>the inputs are different</dd>
  <dt>XNOR</dt><dd>the inputs are the same</dd>
  <dt>NOT</dt><dd>the opposite of its one input</dd>
</dl>
<p>Look at the columns in pairs. NAND is AND upside-down. NOR is OR upside-down. XNOR is XOR upside-down.</p>

<h2>Why bother with NAND and NOR?</h2>
<p>They look like awkward relatives of AND and OR. In silicon it is the other way round. On the last sheet, two transistors in a row gave us NAND directly. To get a plain AND you must add an inverter after it. In a modern chip a NAND costs 4 transistors and an AND costs 6. The “upside-down” gates are the natural ones, and the next sheet shows that NAND alone is enough to build anything.</p>

<h2>Practice</h2>
${W('drill', { kind: 'gate', goal: 8, q: 'All six two-input gates, mixed. Get 8 right.' })}
${W('truth', { q: 'Fill in the table for <b>XOR</b>.', inputs: ['A', 'B'], out: 'A XOR B', vec: '0110', why: '1 in the two rows where A and B differ.' })}
${W('truth', { q: 'Fill in the table for <b>NAND</b>.', inputs: ['A', 'B'], out: 'A NAND B', vec: '1110', why: 'The exact opposite of the AND column.' })}
${W('mcq', { q: 'Which gate answers the question “are these two bits equal?”', opts: ['XOR', 'XNOR', 'NAND', 'OR'], a: 1, why: 'XNOR is 1 for 0,0 and for 1,1.', hints: ['XOR is 1 when they are different. You want the opposite.', null, 'NAND is 1 for 0,1 as well.', 'OR is 1 for 0,1 as well.'] })}
${W('mcq', { q: 'One input of an XOR gate is held at 1. What does the gate do to its other input?', opts: ['Copies it', 'Flips it', 'Always gives 1', 'Always gives 0'], a: 1, why: 'With B = 1: 0 XOR 1 = 1 and 1 XOR 1 = 0. The output is NOT A.' })}
${W('num', { q: 'In how many of its four rows does a NOR gate give 1?', a: '1', kb: 'numeric', why: 'Only in the row where both inputs are 0.' })}

<div class="recap"><h3>What you now know</h3><ul>
  <li>NAND, NOR and XNOR are AND, OR and XOR with the output flipped.</li>
  <li>XOR is 1 when its inputs differ, and can act as an inverter you can switch on and off.</li>
  <li>XNOR tests whether two bits are equal.</li>
  <li>NAND and NOR are the cheapest gates to make from transistors.</li>
</ul></div>`;
    }
  });

  LG.chapter({
    id: 'nand', part: PART, title: 'NAND builds everything',
    lead: 'Give an engineer an endless supply of one kind of gate, NAND, and nothing else. They can still build every digital circuit that has ever been designed.',
    body: function () {
      return `
<h2>The claim</h2>
<p>A gate is called <b>universal</b> if every other gate can be built from copies of it. NAND is universal. So is NOR.</p>
<p>To prove it for NAND we only need to build three things: NOT, AND and OR. The next sheet shows that any truth table at all can be made from those three. So if NAND can make them, NAND can make anything.</p>

<h2>NOT from one NAND</h2>
<p>Join the two inputs of a NAND together, so both always carry the same bit. Then only two rows of its truth table can ever happen: 0,0 gives 1 and 1,1 gives 0. That is NOT.</p>
${W('circuit', { c: 'notFromNand', truth: true, cap: 'A NAND A = NOT A' })}

<h2>AND from two NANDs</h2>
<p>NAND is “AND, then flip”. Flip it once more and the two flips cancel. We just made a flipper, so use it.</p>
${W('circuit', { c: 'andFromNand', truth: true, cap: 'A NAND followed by a NAND-inverter is AND' })}

<h2>OR from three NANDs</h2>
<p>This one takes a moment of thought. OR is 0 only when both inputs are 0. NAND is 0 only when both inputs are 1. So if we flip both inputs first, a NAND behaves exactly like an OR.</p>
${W('circuit', { c: 'orFromNand', truth: true, cap: '(NOT A) NAND (NOT B) = A OR B' })}
<p>Check it with the worst case. A = 0 and B = 0: the two inverters give 1 and 1, and the last NAND turns “both 1” into 0. Every other case gives 1.</p>

<h2>XOR from four NANDs</h2>
<p>With NOT, AND and OR in hand, XOR could be assembled the long way. There is a neater circuit that uses only four gates.</p>
${W('circuit', { c: 'xorFromNand', truth: true, cap: 'Follow the glowing wires for each of the four input combinations' })}
<p>Trace it for A = 1, B = 1. The first gate sees two 1s and gives 0. That 0 forces both middle gates to 1. The last gate sees two 1s and gives 0. Correct: 1 XOR 1 is 0.</p>

<h2>NOR can do it too</h2>
<p>Everything on this sheet works equally well with NOR in place of NAND. The computer that guided the Apollo spacecraft to the Moon was built this way: its logic was made from about 5,600 three-input NOR gates and no other kind.</p>

<h2>Why this matters</h2>
<ul>
  <li><b>For factories.</b> A chip maker can perfect one tiny structure and then repeat it billions of times.</li>
  <li><b>For understanding.</b> If you trust a NAND gate, you can trust everything built from it. There is no deeper layer of mystery.</li>
  <li><b>For you.</b> In the wiring lab at the end of the course, you will build NOT, OR and XOR from a single real NAND chip.</li>
</ul>
<div class="key"><b>Key idea</b>NAND is enough. Every circuit in a computer, including its memory, can be built from NAND gates alone.</div>

<h2>Practice</h2>
${W('mcq', { q: 'What does <code>A NAND A</code> equal?', opts: ['A', 'NOT A', 'Always 0', 'Always 1'], a: 1, why: 'With both inputs the same, NAND gives 1 for 0 and 0 for 1.' })}
${W('num', { q: 'How many NAND gates does it take to make one AND gate?', a: '2', kb: 'numeric', why: 'One NAND, then a second NAND wired as an inverter.' })}
${W('num', { q: 'How many NAND gates does it take to make one OR gate?', a: '3', kb: 'numeric', why: 'Two inverters on the inputs, then one more NAND.' })}
${W('exprq', { q: 'Write <b>A OR B</b> using only the word <code>NAND</code> and brackets.', vars: ['A', 'B'], same: 'A+B', ph: 'e.g. (A NAND B) NAND A', ban: "[+|^!~'·*&.]|\\bOR\\b|\\bAND\\b|NOT|XOR|\\bNOR\\b", banMsg: 'Use only NAND and brackets for this one.', why: 'Flip both inputs with NAND-inverters, then NAND the results.', hint: 'Make NOT A as (A NAND A).' })}
${W('exprq', { q: 'Write <b>A AND B</b> using only <code>NAND</code> and brackets.', vars: ['A', 'B'], same: 'A·B', ph: 'NAND and brackets only', ban: "[+|^!~'·*&.]|\\bOR\\b|\\bAND\\b|NOT|XOR|\\bNOR\\b", banMsg: 'Use only NAND and brackets for this one.', why: 'NAND the pair, then NAND that result with itself to flip it.', hint: 'You need to flip (A NAND B). How do you make NOT from a NAND?' })}
${W('mcq', { q: 'In the four-NAND XOR circuit, A = 1 and B = 0. What comes out of the first (left-most) gate?', opts: ['0', '1'], a: 1, why: 'NAND gives 0 only for two 1s. Here the inputs are 1 and 0, so it gives 1.' })}

<div class="recap"><h3>What you now know</h3><ul>
  <li>A NAND with its inputs joined is a NOT.</li>
  <li>NAND then NOT is AND. NOT on both inputs then NAND is OR.</li>
  <li>Four NANDs make an XOR.</li>
  <li>NAND (or NOR) alone is enough to build any digital circuit.</li>
</ul></div>`;
    }
  });

  LG.chapter({
    id: 'boolean', part: PART, title: 'Boolean algebra',
    lead: 'A circuit can be written as a line of algebra. Then it can be checked, compared and simplified on paper before a single wire is connected.',
    body: function () {
      return `
<h2>Writing circuits as expressions</h2>
<p>In 1854 the English mathematician George Boole worked out an algebra for true and false. In 1937 a student named Claude Shannon noticed that it describes switching circuits exactly. Every gate became a symbol:</p>
<dl class="words">
  <dt>A·B or AB</dt><dd>A AND B</dd>
  <dt>A+B</dt><dd>A OR B</dd>
  <dt>!A or A'</dt><dd>NOT A (in print, also ¬A or a bar over the A)</dd>
  <dt>A^B</dt><dd>A XOR B (in print, also A⊕B)</dd>
</dl>
<p>The order of working is: NOT first, then AND, then OR. It mirrors ordinary arithmetic, where multiplying comes before adding. So <code>A + B·C</code> means A OR (B AND C). Use brackets when you want a different order.</p>
<p>The alarm from two sheets ago is simply <code>(D + W)·S</code>.</p>

<h2>A playground</h2>
<p>Type any expression and the page builds its truth table. Type two and it tells you whether they are the same function.</p>
${W('exprlab', { a: 'A·B + C', b: '', cap: 'Expression to truth table', presets: [['One expression', 'A·B + C', ''], ['Alarm', '(D+W)·S', ''], ['XOR spelt out', 'A^B', "A·!B + !A·B"], ['A wrong guess', '!(A·B)', '!A·!B']] })}

<h2>The laws</h2>
<p>Boolean algebra has rules, as ordinary algebra does. Each one can be checked by writing out its truth table, since a variable has only two possible values.</p>
<div class="scrollx"><table class="plain-table">
  <tr><th>Name</th><th>With AND</th><th>With OR</th></tr>
  <tr><td>Identity</td><td class="mono">A·1 = A</td><td class="mono">A+0 = A</td></tr>
  <tr><td>Annulment</td><td class="mono">A·0 = 0</td><td class="mono">A+1 = 1</td></tr>
  <tr><td>Repeat</td><td class="mono">A·A = A</td><td class="mono">A+A = A</td></tr>
  <tr><td>Opposites</td><td class="mono">A·!A = 0</td><td class="mono">A+!A = 1</td></tr>
  <tr><td>Double NOT</td><td class="mono" colspan="2">!!A = A</td></tr>
  <tr><td>Any order</td><td class="mono">A·B = B·A</td><td class="mono">A+B = B+A</td></tr>
  <tr><td>Sharing out</td><td class="mono">A·(B+C) = A·B + A·C</td><td class="mono">A+(B·C) = (A+B)·(A+C)</td></tr>
  <tr><td>Absorption</td><td class="mono">A·(A+B) = A</td><td class="mono">A + A·B = A</td></tr>
</table></div>
<p>Most of these feel familiar. Two do not happen in ordinary arithmetic: <code>A+A = A</code> (saying “yes” twice is still just yes) and the second sharing-out rule.</p>

<h2>De Morgan’s laws</h2>
<p>These two laws are the ones you will use most. They say what happens when a NOT is pushed through an AND or an OR.</p>
<p class="mono">!(A·B) = !A + !B<br>!(A+B) = !A · !B</p>
<p>In words: “not both” means “at least one is missing”. “Neither” means “this one is missing and that one is missing”. The memory aid is <b>break the bar, change the sign</b>: split the NOT across the two letters, and swap AND with OR.</p>
${W('circuit', { c: 'deMorgan1', cap: 'Two different circuits. Try all four inputs: the lamps always agree.', say: function (v) { return 'Top lamp ' + v.P + ', bottom lamp ' + v.Q + '. ' + (v.P === v.Q ? 'They agree.' : ''); } })}
${W('exprlab', { a: '!(A+B)', b: '!A·!B', cap: 'Check the second law yourself', presets: [['Law 1', '!(A·B)', '!A + !B'], ['Law 2', '!(A+B)', '!A·!B'], ['Three inputs', '!(A·B·C)', '!A + !B + !C'], ['Absorption', 'A + A·B', 'A']] })}
<p>De Morgan explains the OR-from-NANDs circuit on the last sheet. <code>!(!A · !B)</code> becomes <code>!!A + !!B</code>, which is <code>A + B</code>.</p>

<h2>From any truth table to a circuit</h2>
<p>Here is a recipe that turns <i>any</i> truth table into an expression. It is why NOT, AND and OR are enough for everything.</p>
<ol>
  <li>Find each row where the output is 1.</li>
  <li>For each such row, write an AND of all the inputs, with a NOT on every input that is 0 in that row. This term is 1 for that row and for no other.</li>
  <li>OR the terms together.</li>
</ol>
<p>Example: XOR has 1s in rows 0,1 and 1,0. Row 0,1 gives <code>!A·B</code>. Row 1,0 gives <code>A·!B</code>. So XOR = <code>!A·B + A·!B</code>.</p>
<div class="key"><b>Key idea</b>Any behaviour that can be written as a truth table can be built from NOT, AND and OR. And those three can be built from NAND.</div>

<h2>Simplifying saves gates</h2>
<p>The recipe always works, but it often gives more gates than necessary. The laws let you shrink the result.</p>
<p class="mono">A·B + A·!B<br>= A·(B + !B) &nbsp;&nbsp;sharing out, backwards<br>= A·1 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;opposites<br>= A &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;identity</p>
<p>Two AND gates, an OR gate and an inverter have been replaced by a plain wire. On a chip with billions of gates, this kind of saving is the difference between a product that works and one that overheats.</p>

<h2>Practice</h2>
${W('mcq', { q: 'With A = 1, B = 0, C = 0, what is <code>A + B·C</code>?', opts: ['0', '1'], a: 1, why: 'AND first: B·C = 0. Then A + 0 = 1.', hints: ['Do the AND before the OR. A is 1, and 1 OR anything is 1.', null] })}
${W('exprq', { q: 'A truth table has a 1 in just one row: A = 0, B = 1. Write an expression for it.', vars: ['A', 'B'], vec: '0100', why: 'NOT A AND B is 1 only in that row.', hint: 'Use the recipe: AND the inputs together, with a NOT on the one that is 0.' })}
${W('exprq', { q: 'Write <b>XNOR</b> (1 when A and B are equal) using only AND, OR and NOT.', vars: ['A', 'B'], vec: '1001', ban: 'XOR|XNOR|\\^|⊕', banMsg: 'Build it from AND, OR and NOT only.', why: 'One term for the row 0,0 and one for the row 1,1.', hint: 'Which two rows give 1? Write one AND term for each and OR them.' })}
${W('exprq', { q: 'Use De Morgan to rewrite <code>!(A+B)</code> with no brackets.', vars: ['A', 'B'], same: '!(A+B)', ban: '[()]', banMsg: 'No brackets this time.', why: 'Break the bar, change the sign.', hint: 'Give each letter its own NOT and swap the OR for an AND.' })}
${W('exprq', { q: 'Simplify <code>A·B + A·!B</code> as far as it will go.', vars: ['A', 'B'], same: 'A', ban: 'B', banMsg: 'It works, but the shortest form does not mention B at all.', why: 'B and NOT B cover every case, so only A matters.' })}
${W('truth', { q: 'Fill in the table for <code>A·B + C</code>.', inputs: ['A', 'B', 'C'], vec: '01010111', why: 'It is 1 whenever C is 1, and also when A and B are both 1.', hint: 'Mark every row with C = 1 first. Then add the rows with A = 1 and B = 1.' })}
${W('exprq', { q: 'Three judges vote A, B and C. Write an expression that is 1 when <b>at least two</b> of them vote 1.', vars: ['A', 'B', 'C'], vec: '00010111', why: 'Any pair agreeing is enough: A·B + A·C + B·C. This “majority” circuit returns in the next part as the carry of an adder.', hint: 'Which pairs could both be 1? OR those pairs together.' })}

<div class="recap"><h3>What you now know</h3><ul>
  <li>Circuits can be written with · for AND, + for OR and ! for NOT.</li>
  <li>De Morgan’s laws turn NOT-of-AND into OR-of-NOTs, and the other way round.</li>
  <li>Any truth table can be turned into an expression, one AND term per row that outputs 1.</li>
  <li>The laws let you shrink an expression, and fewer gates means a cheaper, faster circuit.</li>
</ul></div>`;
    }
  });
})();
