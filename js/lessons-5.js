/* Part V — The machine (a tiny computer) and Part VI — Build it (breadboard, wiring lab, review). */
(function () {
  'use strict';
  var LG = window.LG, W = LG.W, E = window.LGE;

  LG.chapter({
    id: 'computer', part: 'The machine', title: 'A tiny computer',
    lead: 'You now own every part: an ALU to calculate, registers to hold values, RAM to store them, and a clock to keep time. One more idea turns them into a computer.',
    body: function () {
      var ops = E.OPS.map(function (o) {
        return '<tr><td class="mono">' + LG.bin(o.op, 4) + '</td><td class="mono"><b>' + o.name + '</b>' + (o.arg ? ' n' : '') + '</td><td>' + o.text + '</td></tr>';
      }).join('');
      function failMsg(c, want) {
        if (!c.halted) return 'Your program never reaches HLT, so it never finishes. Add HLT after OUT.';
        if (c.out === null) return 'The program stopped without showing anything. Use OUT before HLT.';
        return 'The display shows ' + c.out + '. It should show ' + want + '.';
      }
      return `
<h2>The missing idea: the stored program</h2>
<p>The ALU does whatever its operation code says. So far a person chose that code. Now let a list of codes sit in memory, and let the machine read them one after another, by itself.</p>
<p>That is the <b>stored-program</b> idea, set out in 1945 in a report by John von Neumann and his colleagues. Instructions are numbers, kept in the same memory as the data. To make the machine do something else, you do not rewire it. You change the numbers.</p>

<h2>Meet LG-8</h2>
<p>LG-8 is a complete computer, small enough to see all of at once. It has:</p>
<dl class="words">
  <dt>Memory</dt><dd>16 bytes of RAM, at addresses 0 to 15. It holds both the program and its data.</dd>
  <dt>PC</dt><dd>The <b>program counter</b>: a 4-bit counter holding the address of the next instruction.</dd>
  <dt>IR</dt><dd>The <b>instruction register</b>: holds the instruction being carried out.</dd>
  <dt>A</dt><dd>The <b>accumulator</b>: an 8-bit register where results build up.</dd>
  <dt>ALU</dt><dd>Adds to or subtracts from A, and sets the Zero and Carry flags.</dd>
  <dt>Display</dt><dd>An output register, so we can see an answer.</dd>
</dl>
<p>Each instruction is one byte. The top four bits say <b>what to do</b> (the operation code). The bottom four bits say <b>where</b>: usually a memory address.</p>
<div class="scrollx"><table class="plain-table"><tr><th>Code</th><th>Written</th><th>What it does</th></tr>${ops}</table></div>
<p>So the byte <code>0010 1111</code> means “ADD 15”: add the byte at address 15 to A. Writing instructions as short words like ADD, in place of bit patterns, is called <b>assembly language</b>.</p>

<h2>Fetch, execute, repeat</h2>
<p>A processor does two things, over and over, for as long as it has power:</p>
<ol>
  <li><b>Fetch.</b> Copy the byte at the address in PC into IR. Add 1 to PC, so it points at the next instruction.</li>
  <li><b>Execute.</b> A decoder looks at the top four bits of IR and switches on the right paths: memory to ALU, ALU to A, and so on. The instruction is carried out.</li>
</ol>
<p>The program below adds two numbers. Press <b>Step</b> eight times and read the line under the buttons each time. The orange row in the memory table is the instruction being worked on.</p>
${W('cpu', { start: 'add', cap: 'LG-8, running a program held in its own memory', tasks: [
        { id: 'add20', text: 'Change the <b>data</b> in “Add two numbers” (the lines <code>14: 5</code> and <code>15: 9</code>) so that the display shows <b>20</b>. Leave the instructions alone.',
          test: function (c) { return c.halted && c.out === 20 ? true : failMsg(c, 20); }, why: 'Same program, different data, different answer. The instructions never changed.' },
        { id: 'sub', text: 'Write a program that works out <b>12 − 5</b> and shows the answer.',
          test: function (c, mem) { if (!mem.some(function (b) { return (b >> 4) === 3; })) return 'Use the SUB instruction for this one.'; return c.halted && c.out === 7 ? true : failMsg(c, 7); }, why: 'LDA the 12, SUB the 5, OUT, HLT, with 12 and 5 stored as data.' },
        { id: 'three', text: 'Write a program that adds three numbers, <b>10 + 20 + 30</b>, and shows 60.',
          test: function (c) { return c.halted && c.out === 60 ? true : failMsg(c, 60); }, why: 'One LDA and two ADDs, each pointing at a different data address.' },
        { id: 'loop', text: 'Load “Count down, then stop”. Change it so that it counts down from <b>9 in steps of 3</b> (9, 6, 3, 0) and then halts.',
          test: function (c, mem) { if (!mem.some(function (b) { return (b >> 4) === 8; })) return 'Keep the JZ instruction: the loop needs it to know when to stop.'; if (mem[14] !== 9 || mem[15] !== 3) return 'Put 9 at address 14 and 3 at address 15.'; return c.halted && c.out === 0 ? true : failMsg(c, 0); }, why: 'Only two data bytes changed. The loop ran three times and JZ let it out when A reached zero.' }] })}

<h2>Loops and decisions</h2>
<p>If PC only ever counted upward, a program would run straight through once and stop. Two kinds of instruction change that.</p>
<ul>
  <li><b>JMP</b> puts a new number into PC. The machine carries on from there. Jump backwards and you have a <b>loop</b>. Try the “Count up forever” example.</li>
  <li><b>JZ</b> jumps only if the Zero flag is set, and <b>JC</b> only if the Carry flag is set. Otherwise the machine carries straight on. This is a <b>decision</b>. Try “Count down, then stop” and watch JZ let the program out of its loop when A reaches 0.</li>
</ul>
<p>That is all a decision is inside a computer: a flag from the ALU, steering what goes into the program counter. Every “if” in every program ever written comes down to this.</p>
<p>The “Multiply” example has no multiply instruction to call on. It adds 3 to a running total, four times, counting down as it goes. Complicated abilities are built from simple instructions repeated.</p>

<h2>The same byte, two meanings</h2>
<p>Look at the memory table while a program runs. The column “as instruction” and the column “as number” show the same bytes read two ways. Address 14 in the first example holds 5. Read as an instruction, 5 is <code>0000 0101</code>, a NOP.</p>
<p>Which is it? Whichever the machine uses it as. If PC points at a byte, it is an instruction. If an instruction’s address points at it, it is data. This is the lesson of the first part again: bits mean nothing until something reads them.</p>

<h2>From LG-8 to the computer in your pocket</h2>
<p>A phone’s processor runs the same loop of fetch and execute. The differences are of scale:</p>
<div class="scrollx"><table class="plain-table">
  <tr><th></th><th>LG-8</th><th>A modern phone</th></tr>
  <tr><td>Register width</td><td>8 bits</td><td>64 bits</td></tr>
  <tr><td>Memory</td><td>16 bytes</td><td>several billion bytes</td></tr>
  <tr><td>Instructions per second</td><td>as fast as you can tap</td><td>billions, on several processors at once</td></tr>
  <tr><td>Kinds of instruction</td><td>11</td><td>hundreds</td></tr>
</table></div>
<p>Nobody writes large programs in assembly language. Programmers write in languages such as Python or C, and other programs translate that text into machine instructions. However many layers sit on top, at the bottom there are bytes in memory, a counter stepping through them, and gates doing as they are told.</p>

<h2>Check your understanding</h2>
${W('mcq', { q: 'What does the program counter (PC) hold?', stack: true, opts: ['The result of the last sum', 'The address of the next instruction', 'How many programs have run', 'The time of day'], a: 1, why: 'It points at where to fetch from next.' })}
${W('mcq', { q: 'What happens during “fetch”?', stack: true, opts: ['The ALU adds two numbers', 'The instruction at the address in PC is copied into IR, and PC moves on', 'A result is written to the display', 'Memory is cleared'], a: 1, why: 'Fetch brings in the instruction. Execute carries it out.' })}
${W('num', { q: 'The byte <code>0001 1110</code> is an LG-8 instruction. The top four bits, 0001, mean LDA. Which address does it load from?', a: '14', kb: 'numeric', why: 'The bottom four bits are 1110, which is 14.', hint: 'Read the bottom four bits as a number.' })}
${W('mcq', { q: 'How does a computer “decide” to do one thing or another?', stack: true, opts: ['It picks at random', 'A conditional jump looks at a flag and either changes PC or leaves it', 'The memory chooses', 'A person presses a key each time'], a: 1, why: 'A flag from the ALU steers the program counter.' })}
${W('mcq', { q: 'Instructions and data are kept in the same memory, as numbers. What is this idea called?', opts: ['The stored program', 'Random access', 'Two’s complement', 'Refresh'], a: 0, why: 'It is what lets one machine run any program.' })}

<div class="recap"><h3>What you now know</h3><ul>
  <li>A program is a list of numbers in memory. Each number is an instruction.</li>
  <li>The processor fetches the instruction PC points at, executes it, and repeats.</li>
  <li>Jumps change PC. Conditional jumps use flags, and that is how decisions are made.</li>
  <li>A real processor is this same machine, wider, larger and faster.</li>
</ul></div>`;
    }
  });

  LG.chapter({
    id: 'breadboard', part: 'Build it', title: 'Breadboard basics',
    lead: 'Time to leave diagrams and handle parts. A breadboard lets you build a circuit by pushing wires into holes. Nothing is soldered and everything can be changed.',
    body: function () {
      var chips = Object.keys(E.CHIPS).map(function (t) { return '<tr><td class="mono"><b>' + t + '</b></td><td>' + E.CHIPS[t].name + '</td><td>' + (E.CHIPS[t].gates ? E.CHIPS[t].gates.length + ' × ' + E.CHIPS[t].gate : '2 flip-flops') + '</td></tr>'; }).join('');
      return `
<h2>What is on the bench</h2>
<dl class="words">
  <dt>Controller</dt><dd>The green board at the top, modelled on an Arduino. It supplies power from two sockets, <b>5V</b> and <b>GND</b> (ground, 0 volts). It has four output pins, <b>D2 to D5</b>, that you can set HIGH (5 V, a 1) or LOW (0 V, a 0). Two input pins, <b>D8 and D9</b>, report the voltage on whatever is wired to them.</dd>
  <dt>Breadboard</dt><dd>The cream board full of holes. Metal strips under the plastic join certain holes together.</dd>
  <dt>Parts</dt><dd>Wires, LEDs, resistors, switches and logic chips.</dd>
</dl>
<p>On a real Arduino a short program, called a <b>sketch</b>, sets the pins. Here you can flip the pins by hand or choose a ready-made sketch.</p>

<h2>How the holes are joined</h2>
<p>This is the one thing you must know about a breadboard. The figure below starts with <b>X-ray</b> switched on, so you can see the metal strips.</p>
${W('board', { preset: 'powered', xray: true, cap: 'Power wired to the rails. The gold bars are the hidden metal strips.' })}
<ul>
  <li><b>The middle area</b> is in columns of five. In column 7, the holes a, b, c, d and e are all joined to each other. So are f, g, h, i and j. Push two leads into the same column strip and they are connected.</li>
  <li><b>The gap</b> across the middle separates the top five from the bottom five. Hole e7 is not joined to f7. Chips sit across this gap so that their two rows of legs stay apart.</li>
  <li><b>The rails</b> are the long rows marked + and −. Each rail is one strip running the whole length. They carry power to wherever it is needed.</li>
</ul>
<p>The coloured dots on the holes show the voltage: orange for 5 V, blue for 0 V. Untick “Show voltages” to hide them.</p>

<h2>A complete loop</h2>
<p>Current flows only round a closed loop, from + through the parts and back to −. Break the loop anywhere and everything in it stops.</p>
${W('board', { preset: 'led', cap: 'The simplest circuit: 5 V → resistor → LED → ground' })}
<p>Trace it: the red wire brings 5 V to the + rail. The resistor carries it down to column 5. The LED joins column 5 to column 6. A wire takes column 6 to the − rail, and the dark wire returns to GND.</p>
<dl class="words">
  <dt>LED</dt><dd>A light-emitting diode. Current passes through it in one direction only. The + leg (the longer one on a real LED) must face the higher voltage. Put it in backwards and it stays dark.</dd>
  <dt>Resistor</dt><dd>Limits how much current flows. An LED has almost no resistance of its own, so without a resistor far too much current flows and the LED burns out. With a 5 V supply, 220 Ω is a common choice.</dd>
</dl>
<p>Try it: choose <b>Erase</b>, remove the resistor, and put a wire in its place. The simulator warns you about what would happen on a real board.</p>

<h2>A pin in control</h2>
<p>Replace the fixed 5 V with an output pin and the controller can switch the LED.</p>
${W('board', { preset: 'pin', cap: 'Tap the D2 button, or choose the Blink sketch' })}
<p>On a real Arduino, this sketch blinks an LED on pin 2:</p>
<div class="scrollx"><pre class="code mono">void setup() {
  pinMode(2, OUTPUT);       // pin 2 will drive something
}
void loop() {               // repeats for ever
  digitalWrite(2, HIGH);    // 5 volts: LED on
  delay(600);               // wait 0.6 seconds
  digitalWrite(2, LOW);     // 0 volts: LED off
  delay(600);
}</pre></div>
<p>The Arduino is itself a small computer, like LG-8 but far more capable. It fetches and executes those instructions, and one of its registers is wired to the pin.</p>

<h2>Logic chips</h2>
<p>Gates are sold in small black packages with 14 legs. The classic family is the <b>7400 series</b>. Each chip holds several copies of one kind of gate.</p>
<div class="scrollx"><table class="plain-table"><tr><th>Chip</th><th>Name</th><th>Contains</th></tr>${chips}</table></div>
<p>Rules that apply to every chip here:</p>
<ul>
  <li><b>Find pin 1.</b> One end of the chip has a notch. With the notch on the left, pin 1 is at the bottom left. The numbers run along the bottom to pin 7, then back along the top from pin 8 to pin 14.</li>
  <li><b>Power it.</b> Pin 14 goes to + and pin 7 goes to −. A chip with no power does nothing. This is the most common mistake of all.</li>
  <li><b>Tap a chip</b> on the bench to see which pins are inputs and which are outputs.</li>
</ul>
${W('board', { preset: 'and', cap: 'A 7408 AND chip. The LED lights only when D2 and D3 are both HIGH.' })}
<p>Only one of the four AND gates in the chip is in use: pins 1 and 2 in, pin 3 out. Tap D2 and D3 and check all four rows of the AND truth table.</p>

<h2>When a circuit does not work</h2>
<p>Every builder’s circuits fail at first. Go through this list in order.</p>
<ol>
  <li><b>Is there power?</b> 5V to the + rail, GND to the − rail, and pins 14 and 7 of every chip connected.</li>
  <li><b>Is each loop closed?</b> Follow it with a finger from + to −.</li>
  <li><b>Is the LED the right way round,</b> and does it have a resistor?</li>
  <li><b>Is a part shorted out?</b> If both legs of a part are in the same column strip, the strip joins them and the part does nothing.</li>
  <li><b>Is any input left unconnected?</b> An input wired to nothing “floats”. On a real chip it picks up stray signals and behaves unpredictably.</li>
  <li><b>Are two outputs joined together?</b> They will fight. An output may feed many inputs, but never another output.</li>
</ol>

<div class="aside">If you would like to do this with real parts, the list is short: an Arduino Uno or a compatible board, a half-size breadboard, jumper wires, a handful of LEDs and 220 Ω resistors, and the chips 74HC00, 74HC08, 74HC32 and 74HC86. The whole circuit runs from a USB port at 5 volts, which is safe to touch.</div>

<h2>Check your understanding</h2>
${W('mcq', { q: 'A wire is pushed into hole a3. Which other holes is it now connected to?', stack: true, opts: ['b3, c3, d3 and e3', 'a1, a2, a4, a5 and the rest of row a', 'f3, g3, h3, i3 and j3', 'None'], a: 0, why: 'The strips in the middle area run down each column, five holes at a time.' })}
${W('mcq', { q: 'Are holes e5 and f5 connected to each other?', opts: ['Yes', 'No'], a: 1, why: 'The gap across the middle separates them.' })}
${W('mcq', { q: 'Both legs of a resistor are pushed into the same column strip. What happens?', stack: true, opts: ['It works normally', 'The strip joins its two legs, so current goes round it and it does nothing', 'It burns out', 'It doubles its resistance'], a: 1, why: 'A part must bridge two different strips to be in the circuit.' })}
${W('mcq', { q: 'Why does an LED need a resistor?', stack: true, opts: ['To make it brighter', 'To limit the current so the LED is not destroyed', 'To change its colour', 'To store charge'], a: 1, why: 'Without it, too much current flows.' })}
${W('mcq', { q: 'On a 7400-series chip, which two pins are the power connections?', opts: ['Pins 1 and 2', 'Pins 7 and 14', 'Pins 3 and 6', 'Pins 8 and 9'], a: 1, why: 'Pin 14 to +5 V, pin 7 to ground.' })}

<div class="recap"><h3>What you now know</h3><ul>
  <li>Breadboard holes are joined in columns of five. The rails run the full length.</li>
  <li>Current needs a closed loop. An LED needs the right direction and a resistor.</li>
  <li>A controller pin is a source of 1s and 0s that a program can set.</li>
  <li>Every chip needs power on pins 14 and 7.</li>
</ul></div>`;
    }
  });

  LG.chapter({
    id: 'lab', part: 'Build it', title: 'The wiring lab',
    lead: 'Twelve builds, from a single LED to a circuit that remembers. Each one is checked by simulating your own wiring, so there are many right answers.',
    body: function () {
      return `
<h2>How to work</h2>
<ul>
  <li><b>Pick a tool, then tap holes.</b> Wires, LEDs, resistors and switches each take two taps: one for each end. A chip takes one tap, for the column where pin 1 goes.</li>
  <li><b>One lead per hole.</b> To connect more things to the same point, use another hole in the same column strip. X-ray shows which holes share a strip.</li>
  <li><b>Erase</b> removes whatever you tap. <b>Start again</b> resets the build.</li>
  <li><b>On a phone,</b> slide the board sideways with one finger and use + and − to change its size.</li>
  <li>A build is marked complete as soon as it works. <b>Check my circuit</b> tells you what is wrong if it does not.</li>
</ul>
<p>Work through them in order the first time. The early ones teach the moves that the later ones rely on.</p>
${W('lab', {})}

<h2>Ideas for the free board</h2>
<ul>
  <li>A 2-bit adder: a half adder for the 1s column and a full adder for the 2s column.</li>
  <li>An equality tester: XNOR built from a 7486 and a 7404, lighting when D2 and D3 match.</li>
  <li>A two-way multiplexer: D4 chooses whether the LED follows D2 or D3.</li>
  <li>A 2-bit counter: two halves of a 7474, each wired to toggle, with the second clocked by the first.</li>
</ul>`;
    }
  });

  LG.chapter({
    id: 'review', part: 'Build it', title: 'Final review',
    lead: 'Twenty questions across the whole course. If you can answer these, you understand how a computer works, from the electrons upward.',
    body: function () {
      return `
<h2>Information</h2>
${W('num', { q: 'What is <code>101101</code> in decimal?', a: '45', kb: 'numeric', why: '32 + 8 + 4 + 1 = 45.', hint: 'Place values: 32, 16, 8, 4, 2, 1.' })}
${W('num', { q: 'Write <b>77</b> in binary.', a: '1001101', kb: 'numeric', why: '64 + 8 + 4 + 1 = 77.', hint: 'Take 64 first, then see what is left.' })}
${W('num', { q: 'Write the byte <code>1100 1001</code> in hex.', a: 'C9', why: '1100 is twelve (C) and 1001 is 9.' })}
${W('mcq', { q: 'How many different values can 12 bits represent?', opts: ['24', '144', '2,048', '4,096'], a: 3, why: '2¹² = 4,096.', hints: ['That is 12 × 2. Each bit doubles the count.', 'That is 12 × 12.', 'That is 11 bits.', null] })}

<h2>Logic</h2>
${W('mcq', { q: 'Which single gate gives 0 only when both of its inputs are 1?', opts: ['AND', 'OR', 'NAND', 'XOR'], a: 2, why: 'NAND is the opposite of AND.' })}
${W('truth', { q: 'Fill in the table for <code>(A + B)·!C</code>.', inputs: ['A', 'B', 'C'], vec: '00101010', why: 'It is 1 when A or B is 1, provided C is 0.', hint: 'Every row with C = 1 is 0. In the others, OR together A and B.' })}
${W('exprq', { q: 'Write an expression that is 1 only when A, B and C are <b>all the same</b> (all 0 or all 1).', vars: ['A', 'B', 'C'], vec: '10000001', why: 'One term for 0,0,0 and one for 1,1,1: !A·!B·!C + A·B·C.', hint: 'Two rows give 1. Write an AND term for each and OR them.' })}
${W('mcq', { q: 'By De Morgan’s law, <code>!(A·B)</code> equals…', opts: ['<code>!A·!B</code>', '<code>!A + !B</code>', '<code>A + B</code>', '<code>!(A + B)</code>'], a: 1, why: 'Break the bar, change the sign.' })}
${W('num', { q: 'What is the smallest number of NAND gates needed to build an XOR?', a: '4', kb: 'numeric', why: 'The four-gate circuit from the NAND sheet.' })}

<h2>Arithmetic</h2>
${W('num', { q: 'Add in binary: <code>0110 + 0111</code>', a: '1101', kb: 'numeric', why: '6 + 7 = 13 = 1101.' })}
${W('num', { q: 'In 8-bit two’s complement, which number is <code>11111100</code>?', a: '-4', why: 'Flip to 00000011, add 1 to get 4, so the original is −4. Or: −128 + 124.', hint: 'Negate it (flip, add 1) to find its size.' })}
${W('mcq', { q: 'An adder is turned into a subtractor by…', stack: true, opts: ['reversing the order of the bits', 'inverting every bit of B and feeding 1 into the first carry-in', 'removing the carry wires', 'swapping its XOR gates for AND gates'], a: 1, why: 'A − B = A + (NOT B) + 1.' })}
${W('mcq', { q: 'A multiplexer’s job is to…', stack: true, opts: ['add two numbers', 'pass one of several inputs to its output, chosen by select bits', 'store a bit', 'switch on one of many output lines'], a: 1, why: 'The last option describes a decoder.' })}

<h2>Memory</h2>
${W('mcq', { q: 'What is the essential ingredient that lets a circuit of gates remember?', opts: ['A clock', 'Feedback: an output wired back to an input', 'An XOR gate', 'A resistor'], a: 1, why: 'A loop with two stable states holds a bit.' })}
${W('mcq', { q: 'A D flip-flop has D = 1 and Q = 0. The clock is low and stays low. What is Q?', opts: ['0', '1'], a: 0, why: 'Nothing happens until a rising edge.' })}
${W('num', { q: 'A memory has 12 address bits and stores one byte at each address. How many bytes does it hold?', a: '4096', kb: 'numeric', why: '2¹² = 4,096 addresses, one byte each.' })}
${W('mcq', { q: 'Which pair is correctly matched?', stack: true, opts: ['Dynamic RAM: electrons trapped behind an insulator', 'Flash: a capacitor that needs refreshing', 'Dynamic RAM: a leaking capacitor that needs refreshing', 'Static RAM: a magnetised spot'], a: 2, why: 'Flash traps electrons. Static RAM is a latch. Hard disks are magnetic.' })}

<h2>The machine and the bench</h2>
${W('mcq', { q: 'In which order does a processor work?', stack: true, opts: ['Execute, then fetch', 'Fetch the instruction PC points to, execute it, repeat', 'Fetch every instruction first, then execute them all', 'Whichever is ready first'], a: 1, why: 'One instruction at a time, forever.' })}
${W('mcq', { q: 'A program must repeat ten times and then stop. Which kind of instruction lets it leave the loop?', opts: ['LDA', 'A conditional jump such as JZ', 'OUT', 'NOP'], a: 1, why: 'A jump that depends on a flag is how a program decides.' })}
${W('mcq', { q: 'You place a 7408 on a breadboard, wire its inputs and an LED, and nothing happens. What should you check first?', stack: true, opts: ['That pin 14 goes to + and pin 7 goes to −', 'That the chip is the newest model', 'That the wires are all the same colour', 'That the LED is blue'], a: 0, why: 'No power, no logic.' })}

<h2>Your result</h2>
${W('finish', {})}

<h2>Where to go next</h2>
<p>You have covered the ground of a first university course in digital logic. If you want to go further:</p>
<ul>
  <li><b>Build for real.</b> An Arduino starter kit contains everything used in the wiring lab, and the builds transfer directly.</li>
  <li><b>Nand to Tetris</b> (<a href="https://www.nand2tetris.org/">nand2tetris.org</a>) is a free course in which you build a complete computer, and then its software, starting from NAND gates.</li>
  <li><b>Ben Eater’s 8-bit computer</b> (<a href="https://eater.net/8bit">eater.net/8bit</a>) is a video series that builds a machine much like LG-8 on real breadboards.</li>
  <li><b>“Code” by Charles Petzold</b> is a book that tells this same story at length, with the history alongside.</li>
</ul>
<p>The next time a screen lights up in front of you, you will know what is underneath it: switches, a few rules for combining them, and a loop that remembers.</p>`;
    }
  });
})();
