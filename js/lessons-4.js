/* Part IV — Memory: latches, clocks, registers, RAM, temporary and permanent storage. */
(function () {
  'use strict';
  var LG = window.LG, W = LG.W, PART = 'Memory';

  LG.chapter({
    id: 'latch', part: PART, title: 'The loop that remembers',
    lead: 'Every circuit so far forgets instantly. Change an input and the old output is gone. Memory begins with one strange idea: feed a gate’s output back into its own input.',
    body: function () {
      return `
<h2>Why we need something new</h2>
<p>In all our circuits, signals have flowed one way: inputs on the left, outputs on the right. Such a circuit is a pure calculation. It has no past. Ask it the same question and you get the same answer, every time.</p>
<p>A computer must also <i>hold</i> things: the number you just typed, the running total, the place it has reached in a program. Holding needs a circuit whose output depends on what happened <b>earlier</b>. The way to get that is to break the one-way rule and connect an output back to an input.</p>

<h2>The SR latch</h2>
<p>Take two NOR gates. Feed the output of each into one input of the other. Leave the two spare inputs for us: one called <b>Set</b>, one called <b>Reset</b>. The output we care about is <b>Q</b>. The other gate’s output is always its opposite, written Q̄ (“Q-bar”).</p>
${W('circuit', { c: 'srLatch', cap: 'Two NOR gates in a loop: one bit of memory', hint: 'Do this in order: tap Set to 1, tap Set back to 0, then look at Q.',
        say: function (v) {
          if (v.S && v.R) return '<b>Not allowed.</b> Set and Reset together force both outputs to 0, so Q̄ is no longer the opposite of Q. Release them and the latch falls one way or the other.';
          if (v.S) return '<b>Setting.</b> Set = 1 forces Q̄ to 0, and that lets Q rise to 1.';
          if (v.R) return '<b>Resetting.</b> Reset = 1 forces Q to 0.';
          return '<b>Holding.</b> Both inputs are 0 and nobody is telling the latch anything. It is remembering Q = ' + v.q + ' by itself.';
        } })}
<p>The important moment is the second step. You put Set back to 0, so the inputs are exactly as they were at the start, yet Q is now 1 where before it was 0. Same inputs, different output. The circuit is remembering which button you pressed last.</p>

<h2>Why it holds</h2>
<p>Follow the loop while both inputs are 0. Recall that a NOR gate gives 1 only when both of its inputs are 0.</p>
<ul>
  <li>Suppose Q is 1. That 1 goes into the lower gate, which must therefore give 0. So Q̄ = 0.</li>
  <li>That 0 goes into the upper gate together with Reset = 0. Both inputs are 0, so the upper gate gives 1. So Q = 1.</li>
</ul>
<p>We are back where we began. Q = 1 keeps itself at 1. Run the same argument starting from Q = 0 and you find that also keeps itself going. The loop has <b>two stable states</b> and will sit in either one for as long as it has power. It is like a seesaw: it rests with one end down or the other, never in between, and it stays where you leave it.</p>
<div class="key"><b>Key idea</b>Memory is feedback. A loop of gates with two stable states stores one bit.</div>

<h2>The latch’s table</h2>
<div class="scrollx"><table class="tt left"><tr><th>Set</th><th>Reset</th><th class="out">What Q does</th></tr>
<tr><td>0</td><td>0</td><td class="out">Stays as it was (remember)</td></tr>
<tr><td>1</td><td>0</td><td class="out one">Becomes 1</td></tr>
<tr><td>0</td><td>1</td><td class="out">Becomes 0</td></tr>
<tr><td>1</td><td>1</td><td class="out">Not allowed</td></tr></table></div>
<p>This is a new kind of table. The first row does not give a fixed output. It says “whatever it was before”. No truth table of pure gates could ever contain that row.</p>
<p>Why is 1,1 not allowed? It asks the latch to store 1 and 0 at once. Both outputs drop to 0, and when the inputs are released the two gates race to decide who wins. On a real chip the winner is unpredictable.</p>

<h2>From two gates to a memory chip</h2>
<p>This little loop is the ancestor of every memory cell. The fast memory inside a processor is built from millions of them: each bit is a pair of cross-connected inverters with two extra transistors for access, six transistors in all. That kind is called <b>static RAM</b>.</p>
<p>The same latch can be built from two NAND gates instead. It behaves the same way with the inputs upside-down: they rest at 1 and a brief 0 sets or resets. You will build that version from a real chip in the wiring lab.</p>

<h2>Check your understanding</h2>
${W('mcq', { q: 'An SR latch has Set = 0 and Reset = 0. What is Q?', stack: true, opts: ['0', '1', 'Whatever it was before', 'It keeps switching'], a: 2, why: 'With both inputs at 0 the loop holds its last state.' })}
${W('mcq', { q: 'Starting with Q = 0: Set is tapped on and off, then Reset is tapped on and off, then nothing. What is Q now?', opts: ['0', '1'], a: 0, why: 'Set made it 1, then Reset made it 0, and it has held 0 since.' })}
${W('mcq', { q: 'What gives the latch its memory?', stack: true, opts: ['A tiny battery inside each gate', 'The outputs are fed back to the inputs, making a loop that holds itself', 'NOR gates are slower than other gates', 'The Set input stays at 1'], a: 1, why: 'The feedback loop keeps regenerating its own state.' })}
${W('mcq', { q: 'Why should Set and Reset never both be 1?', stack: true, opts: ['The latch would overheat', 'It asks for 1 and 0 at the same time, and what follows is unpredictable', 'It erases every other latch', 'Nothing bad happens'], a: 1, why: 'Both outputs are forced to 0, and the final state after release is a race.' })}
${W('mcq', { q: 'The power to a latch is switched off and on again. What has happened to the stored bit?', stack: true, opts: ['It is still there', 'It is lost: the loop needs power to keep itself going', 'It has become 1', 'It has moved to the other gate'], a: 1, why: 'The gates were holding the bit by actively driving each other. No power, no loop.' })}

<div class="recap"><h3>What you now know</h3><ul>
  <li>Combinational circuits forget. Memory needs feedback.</li>
  <li>Two cross-connected gates have two stable states and so hold one bit.</li>
  <li>Set makes Q 1, Reset makes it 0, and with both at 0 the latch remembers.</li>
  <li>The bit lasts only while the power stays on.</li>
</ul></div>`;
    }
  });

  LG.chapter({
    id: 'clock', part: PART, title: 'Clocks and flip-flops',
    lead: 'A latch changes the moment its inputs change. In a machine with millions of parts, that is chaos. Computers march in step, to the beat of a clock.',
    body: function () {
      return `
<h2>A friendlier latch: the D latch</h2>
<p>The SR latch has two awkward inputs and a forbidden combination. A few more gates tidy it up. The <b>D latch</b> has one <b>Data</b> input, carrying the bit to store, and one <b>Enable</b> input that says when to store it.</p>
${W('circuit', { c: 'dLatch', cap: 'A gated D latch, made of NAND gates', hint: 'Set Data, then tap Enable on and off. Then change Data with Enable off.',
        say: function (v) { return v.EN ? '<b>Open.</b> Enable is 1, so Q follows Data. Right now Q = ' + v.Q + '.' : '<b>Closed.</b> Enable is 0. Data can change as much as it likes. Q stays at ' + v.Q + '.'; } })}
<p>The two gates on the left are doors, opened by Enable. The NOT gate makes sure the two doors always receive opposite bits, so the forbidden case can never arise. The two gates on the right are the cross-connected loop.</p>
<p>While Enable is 1 the latch is <b>transparent</b>: Data passes straight through to Q. When Enable drops to 0 the doors shut and the loop keeps the last value.</p>

<h2>The trouble with transparency</h2>
<p>Imagine thousands of latches, with outputs feeding through gates into other latches, and all of them open together. A change at one end would rush through everything in an uncontrolled wave. Some paths are longer than others, so signals arrive at different moments, and a latch might capture a half-finished result.</p>
<p>We need every memory element to take in its new value at one sharp instant, and then to ignore its input until the next one.</p>

<h2>The clock</h2>
<p>That instant is supplied by a <b>clock</b>: a signal that switches steadily between 0 and 1, forever. It carries no information. It only keeps time, like a conductor’s baton.</p>
<p>Clock speed is counted in ticks per second, called hertz (Hz). A clock in a simple circuit might tick once a second. A processor marked “3 GHz” ticks three billion times a second.</p>
<p>The moment the clock goes from 0 to 1 is the <b>rising edge</b>. That is the instant we will use.</p>

<h2>The D flip-flop</h2>
<p>A <b>flip-flop</b> is a memory element that copies D to Q only at the rising edge of the clock, and at no other time.</p>
<p>It is made from two D latches in a row, sharing a clock, with the first one’s Enable inverted. While the clock is 0 the first latch is open and the second is shut. At the rising edge they swap: the first shuts, freezing whatever D was at that instant, and the second opens to show it. There is never a moment when both are open, so a signal can advance by one stage per tick and no further. It works like the two doors of an airlock.</p>
${W('timing', { cap: 'A latch and a flip-flop given the same D and the same clock' })}
<p>Try this: raise the clock, then flip D a few times while it is high. The latch output (blue) copies every wobble. The flip-flop output (orange) stays calm. It changes only where a dotted line marks a rising edge.</p>
<div class="key"><b>Key idea</b>A flip-flop takes a snapshot of its input at each rising clock edge and holds it steady until the next.</div>

<h2>Why the whole machine uses edges</h2>
<p>With flip-flops, a computer works in steps. At a tick, every flip-flop takes its snapshot together. Then the gates between them have the rest of the cycle to work out their new results. At the next tick those results are captured, and so on.</p>
<p>This also tells you what limits a processor’s speed. The clock cannot tick faster than the slowest chain of gates between two flip-flops can settle. A long chain, like the carry in a ripple adder, means a slower clock.</p>

<h2>Check your understanding</h2>
${W('mcq', { q: 'A D latch has Enable = 0. Data changes from 0 to 1. What does Q do?', stack: true, opts: ['Follows Data to 1', 'Stays as it was', 'Becomes the opposite of Data', 'Switches rapidly'], a: 1, why: 'With Enable at 0 the doors are shut.' })}
${W('mcq', { q: 'When does a D flip-flop copy its D input to Q?', stack: true, opts: ['Whenever D changes', 'All the time the clock is 1', 'At the instant the clock rises from 0 to 1', 'When the clock is 0'], a: 2, why: 'Only the rising edge counts.' })}
${W('mcq', { q: 'The clock is high and steady. D goes from 0 to 1. Which output changes?', stack: true, opts: ['The latch only', 'The flip-flop only', 'Both', 'Neither'], a: 0, why: 'The latch is transparent while the clock is high. The flip-flop is waiting for the next rising edge.' })}
${W('num', { q: 'A clock runs at 2 Hz. How many rising edges does it produce in 5 seconds?', a: '10', kb: 'numeric', why: '2 ticks each second for 5 seconds.' })}
${W('mcq', { q: 'What sets the upper limit on a processor’s clock speed?', stack: true, opts: ['The size of its memory', 'The time signals need to pass through the gates between flip-flops', 'The number of programs running', 'The brightness of the screen'], a: 1, why: 'Every result must be ready before the next edge captures it.' })}

<div class="recap"><h3>What you now know</h3><ul>
  <li>A D latch stores its Data input while Enable is 1 and holds it when Enable is 0.</li>
  <li>A clock is a steady 0-1-0-1 signal that keeps the whole machine in step.</li>
  <li>A D flip-flop captures D only at the rising edge of the clock.</li>
  <li>The slowest path between flip-flops sets the fastest possible clock.</li>
</ul></div>`;
    }
  });

  LG.chapter({
    id: 'registers', part: PART, title: 'Registers and counters',
    lead: 'One flip-flop holds one bit. Put several side by side on the same clock and you have a place to keep a whole number.',
    body: function () {
      return `
<h2>The register</h2>
<p>A <b>register</b> is a row of flip-flops that share one clock. An 8-bit register is eight flip-flops and holds one byte. At each tick all of them capture their inputs together.</p>
<p>Usually we do not want a new value on <i>every</i> tick. So each flip-flop gets a small multiplexer in front of it. A control wire called <b>Load</b> chooses what goes in: the new data when Load is 1, or the flip-flop’s own present output when Load is 0, which simply stores the same bit again.</p>
${W('regs', { mode: 'load', cap: 'A 4-bit register with a Load control' })}
<p>Registers are the processor’s scratch paper: small, extremely fast, and right where the work happens. A typical processor has a few dozen of them.</p>

<h2>The shift register</h2>
<p>Connect the flip-flops in a chain instead, each one’s output feeding the next one’s input. At every tick each bit moves along by one place, and a new bit enters at the end.</p>
${W('regs', { mode: 'shift', cap: 'Bits march one place to the left on each tick' })}
<p>Two uses come up constantly:</p>
<ul>
  <li><b>Sending data down one wire.</b> A USB cable does not have a wire for every bit. The sender shifts the bits out one after another, and the receiver shifts them in and reassembles the byte.</li>
  <li><b>Fast multiplying and dividing by two.</b> You saw that adding a 0 on the right doubles a binary number. A shift register does exactly that in one tick.</li>
</ul>

<h2>The counter</h2>
<p>Take a register and wire its output through an adder that adds 1, then back into its own input. At each tick it stores “what I hold, plus one”.</p>
${W('regs', { mode: 'count', cap: 'A register that adds one to itself on each tick' })}
<p>This is feedback again, but tamed by the clock. Without the flip-flops the number would race upward as fast as the gates could go. With them it advances exactly one step per tick.</p>
<p>The most important counter in a computer is the <b>program counter</b>. It holds the address of the next instruction, and it normally steps forward by one each time. You will meet it in the next part.</p>

<h2>Machines with a state</h2>
<p>A register plus some gates is a general recipe. The register holds the machine’s current <b>state</b>. The gates look at the state (and any inputs) and work out the next state. The clock moves the machine from one to the next.</p>
<p>A traffic light is a good picture. Its state is one of green, amber or red: two bits. The “next state” logic says green goes to amber, amber to red, red to green. A counter decides how long each one lasts. Washing machines, lifts and vending machines are all built this way. So is a processor: it is a large machine of the same kind.</p>

<h2>Practice</h2>
${W('regsq', { mode: 'load', goal: { text: 'Store <b>1010</b> in the register. Then switch Load off, change D to <b>0101</b>, and tick the clock. Q must still read 1010.', test: function (s) { return s.q === 10 && s.d === 5 && s.pulses >= 2; }, why: 'With Load off, each flip-flop is fed its own output, so nothing changes.' } })}
${W('regsq', { mode: 'shift', goal: { text: 'Shift bits in until Q reads <b>1011</b>. The left-most bit goes in first.', test: function (s) { return s.q === 11; }, why: 'In order: 1, 0, 1, 1. Each tick pushed the earlier bits one place left.' } })}
${W('regsq', { mode: 'count', goal: { text: 'Tick the 4-bit counter until it <b>wraps round</b> from 1111 to 0000.', test: function (s) { return s.q === 0 && s.pulses >= 16; }, why: '1111 + 1 needs a fifth bit. The counter has only four, so it shows 0000.' } })}
${W('mcq', { q: 'How many flip-flops are in an 8-bit register?', opts: ['1', '4', '8', '256'], a: 2, why: 'One flip-flop per bit.' })}
${W('num', { q: 'A 4-bit counter starts at 0. What number does it show after 18 ticks?', a: '2', kb: 'numeric', why: 'It wraps after 16 ticks, then counts 2 more.', hint: 'It returns to 0 on the 16th tick.' })}
${W('mcq', { q: 'A register holds 0011 (three). It is shifted left once, with a 0 entering on the right. What does it hold?', opts: ['0001 (one)', '0110 (six)', '1100 (twelve)', '0011 (three)'], a: 1, why: 'Every bit moves to a place worth double.' })}

<div class="recap"><h3>What you now know</h3><ul>
  <li>A register is a row of flip-flops on one clock, holding a multi-bit value.</li>
  <li>A Load control decides whether a tick stores new data or keeps the old.</li>
  <li>A shift register moves bits along one place per tick.</li>
  <li>A counter is a register that feeds itself its own value plus one.</li>
</ul></div>`;
    }
  });

  LG.chapter({
    id: 'ram', part: PART, title: 'RAM: memory with addresses',
    lead: 'A computer needs billions of storage cells and a way to pick out any one of them. The answer is to give every cell a number: its address.',
    body: function () {
      return `
<h2>The plan</h2>
<p>Imagine a wall of numbered post boxes. To use one you need two things: its number, and either a letter to put in or a hand to take one out. Memory works the same way.</p>
<ul>
  <li>The cells are arranged in rows. Each row stores one small number.</li>
  <li>An <b>address</b> goes into a decoder (from the last part). The decoder switches on exactly one row.</li>
  <li>Only the switched-on row is connected to the shared <b>data</b> wires. All the others are cut off.</li>
  <li>A <b>write</b> signal decides the direction: store what is on the data wires, or leave the row alone and just show its contents.</li>
</ul>
${W('ram', { cap: 'An 8-row memory. Each row holds 4 bits.', init: [3, 0, 12, 0, 7, 0, 0, 1] })}
<p>Write a few values into different addresses. Go back to an earlier address and your value is still there. You have a memory you can use.</p>

<h2>Why it is called random access</h2>
<p>RAM stands for <b>random access memory</b>. “Random” here means “any, in any order”. Reaching address 7 takes exactly as long as reaching address 0, because the decoder goes straight to it. Older storage, such as magnetic tape, had to wind past everything in between.</p>

<h2>Address bits decide the size</h2>
<p>Each address bit doubles the number of cells that can be reached. This is the 2<sup>n</sup> rule once more.</p>
<div class="scrollx"><table class="plain-table">
  <tr><th>Address bits</th><th>Cells that can be reached</th><th>Seen in</th></tr>
  <tr><td>3</td><td class="mono">8</td><td>The figure above</td></tr>
  <tr><td>16</td><td class="mono">65,536</td><td>Home computers of the early 1980s</td></tr>
  <tr><td>32</td><td class="mono">4,294,967,296</td><td>PCs of the 2000s</td></tr>
  <tr><td>64</td><td class="mono">about 18 billion billion</td><td>Today’s computers and phones</td></tr>
</table></div>
<p>This explains an old annoyance. A 32-bit computer could not make use of more than 4 GB of memory, however much was fitted. It had run out of addresses.</p>

<h2>What a cell is made of</h2>
<p>There are two common kinds of RAM cell.</p>
<dl class="words">
  <dt>Static RAM</dt><dd>Each bit is a latch, as on the earlier sheet: six transistors. It is very fast and holds its value as long as power is on. It takes a lot of room, so it is used in small amounts inside the processor.</dd>
  <dt>Dynamic RAM</dt><dd>Each bit is one transistor and one tiny capacitor. A charged capacitor is a 1 and an empty one is a 0. It is far smaller and cheaper, so the gigabytes of memory in a laptop or phone are this kind.</dd>
</dl>
<p>Dynamic RAM has a weakness, and it leads straight to the next sheet: the charge leaks away.</p>

<h2>Practice</h2>
${W('ramq', { goal: { text: 'Store the value <b>9</b> at address <b>5</b>, and the value <b>6</b> at address <b>2</b>.', test: function (c) { return c[5] === 9 && c[2] === 6; }, why: 'Address 101 holds 1001, and address 010 holds 0110.' } })}
${W('ramq', { init: [0, 0, 0, 11, 0, 0, 0, 0], goal: { text: 'One row already holds a number. Find it, add 1 to it in your head, and store the answer at address <b>7</b>.', test: function (c) { return c[7] === 12; }, why: 'Address 3 held 11, so address 7 now holds 12. Read, compute, write: you just did by hand what a processor does all day.' } })}
${W('num', { q: 'A memory chip has 10 address wires. How many cells can it select?', a: '1024', kb: 'numeric', why: '2¹⁰ = 1,024.' })}
${W('num', { q: 'How many address bits are needed to reach 256 cells?', a: '8', kb: 'numeric', why: '2⁸ = 256.', hint: 'Double 2 until you reach 256, counting the steps.' })}
${W('mcq', { q: 'What is the decoder’s job inside a memory chip?', stack: true, opts: ['It stores the bits', 'It switches on exactly the one row named by the address', 'It refreshes the charge', 'It adds the address to the data'], a: 1, why: 'Address in, one selected row out.' })}
${W('mcq', { q: 'What does “random access” mean?', stack: true, opts: ['The memory returns random numbers', 'Cells are filled in a random order', 'Any cell can be reached directly, in the same time as any other', 'The address is chosen by chance'], a: 2, why: 'No winding through the cells in between.' })}

<div class="recap"><h3>What you now know</h3><ul>
  <li>Memory is many storage cells, each with a numbered address.</li>
  <li>A decoder turns the address into one selected row. A write signal stores the data there.</li>
  <li>n address bits reach 2<sup>n</sup> cells.</li>
  <li>Static RAM uses a latch per bit. Dynamic RAM uses a capacitor per bit.</li>
</ul></div>`;
    }
  });

  LG.chapter({
    id: 'storage', part: PART, title: 'Temporary and permanent memory',
    lead: 'Some memory forgets the instant the power goes. Some remembers for years with no power at all. A computer needs both kinds, and you now know enough to see why.',
    body: function () {
      return `
<h2>Two kinds of memory</h2>
<dl class="words">
  <dt>Temporary</dt><dd>Engineers say <b>volatile</b>. It holds data only while power is on. This is RAM: the computer’s working space.</dd>
  <dt>Permanent</dt><dd>Engineers say <b>non-volatile</b>. It keeps data with the power off. This is storage: a flash drive, an SSD, a hard disk, a memory card.</dd>
</dl>
${W('powercut', { cap: 'Working memory and storage in a power cut' })}
<p>Everyone has lived this figure. A document you are typing exists only in RAM until you save it. Saving copies it to storage. Cut the power before saving and the work is gone, because the place it lived has been wiped.</p>

<h2>Why RAM forgets</h2>
<p>A static RAM cell is a loop of gates. The loop holds its bit by constantly driving itself, and that takes power. No power, no loop.</p>
<p>A dynamic RAM cell is a capacitor, a microscopic bucket of electric charge. Its trouble is worse: the bucket leaks even while the power is on.</p>
${W('dram', { cap: 'Eight dynamic RAM cells. The dashed line is the level that separates 1 from 0.' })}
<p>Left alone, a 1 fades into a 0 within a fraction of a second. So the memory chip runs a housekeeping routine called <b>refresh</b>: it reads every cell and writes it back at full strength, typically every 64 thousandths of a second, for as long as the machine is on. This is the reason for the word “dynamic”.</p>
<p>It sounds wasteful. It is worth it because the cell is so small: one transistor and one capacitor against six transistors for a latch. Billions fit on a chip.</p>

<h2>Why flash remembers</h2>
<p>Flash memory, the kind in SSDs, phones and memory cards, stores each bit as electrons trapped in a place they cannot leave.</p>
${W('flashcell', { cap: 'One flash memory cell, seen from the side' })}
<p>The cell is a transistor with an extra piece inside it, the <b>floating gate</b>, wrapped in insulator on every side. A strong voltage can force electrons through the thin insulator onto the floating gate. Once there, they are stuck. With the power off they stay stuck for years.</p>
<p>To read the cell, the chip tries to switch the transistor on. Trapped electrons get in the way, so a charged cell does not conduct and reads as 0. An empty cell conducts and reads as 1.</p>
<p>Two consequences follow from the design:</p>
<ul>
  <li><b>Writing is slow and rough.</b> Forcing electrons through an insulator takes far longer than flipping a latch, and it damages the insulator slightly each time. A flash cell wears out after somewhere between a thousand and a hundred thousand erasures, depending on its type. Drives spread the wear around so that no one area takes it all.</li>
  <li><b>The name.</b> The most common kind is called <b>NAND flash</b>. Its cells are connected in a row, one after another, like the transistors in the NAND gate you saw in Part II.</li>
</ul>

<h2>Other permanent memory</h2>
<dl class="words">
  <dt>ROM</dt><dd><b>Read-only memory.</b> Its contents are fixed when it is made, or changed only rarely. It holds the first instructions a machine runs when it is switched on. Without it a computer would wake with empty RAM and no idea what to do.</dd>
  <dt>Hard disk</dt><dd>Bits are stored as tiny magnetised spots on a spinning metal platter, read by an arm that swings across it. Magnetism needs no power to persist. The moving parts make it slow.</dd>
</dl>

<h2>The memory ladder</h2>
<p>If flash keeps its data, why not use it for everything? Because every kind of memory trades speed against size and cost. Computers use several kinds together, arranged like a ladder.</p>
<div class="scrollx"><table class="plain-table">
  <tr><th>Kind</th><th>Made of</th><th>Typical time to reach</th><th>Typical amount</th><th>Keeps data without power?</th></tr>
  <tr><td>Registers</td><td>Flip-flops</td><td class="mono">under 1 ns</td><td>a few hundred bytes</td><td>No</td></tr>
  <tr><td>Cache</td><td>Static RAM</td><td class="mono">1–10 ns</td><td>megabytes</td><td>No</td></tr>
  <tr><td>Main memory</td><td>Dynamic RAM</td><td class="mono">about 100 ns</td><td>gigabytes</td><td>No</td></tr>
  <tr><td>SSD</td><td>Flash</td><td class="mono">about 0.1 ms</td><td>hundreds of gigabytes</td><td>Yes</td></tr>
  <tr><td>Hard disk</td><td>Magnetic platter</td><td class="mono">about 10 ms</td><td>terabytes</td><td>Yes</td></tr>
</table></div>
<p class="hint-inline">ns = a billionth of a second. ms = a thousandth of a second. The figures are rough, typical values.</p>
<p>The gaps are enormous. Stretch time so that reaching a register takes one second. On that scale main memory takes about two minutes, an SSD takes more than a day, and a hard disk takes about four months.</p>
<p>So a computer keeps what it is using right now in the small, fast memory at the top, and everything else in the large, slow, permanent storage at the bottom. Opening a program copies it from storage up into RAM. Saving a file copies it back down.</p>
<div class="key"><b>Key idea</b>Fast memory is small, costly and forgetful. Lasting memory is large, cheap and slow. A computer uses both, and moves data between them.</div>

<h2>Check your understanding</h2>
${W('mcq', { q: 'You are typing a letter and the power fails before you save. The letter is lost because it existed only in…', opts: ['RAM', 'the SSD', 'ROM', 'the screen'], a: 0, why: 'Unsaved work lives in RAM, and RAM is volatile.' })}
${W('mcq', { q: 'Why must dynamic RAM be refreshed many times a second?', stack: true, opts: ['Its capacitors slowly leak their charge', 'Its transistors wear out', 'The addresses change', 'To make room for new data'], a: 0, why: 'Each 1 is a small charge that drains away unless topped up.' })}
${W('mcq', { q: 'How does a flash cell keep its bit with the power off?', stack: true, opts: ['A small battery inside the chip', 'Electrons are trapped on a gate surrounded by insulator', 'A latch that never needs power', 'It is refreshed from the mains'], a: 1, why: 'The trapped charge has no path to escape.' })}
${W('mcq', { q: 'Why is flash not used as a computer’s main working memory?', stack: true, opts: ['It cannot store 1s', 'Writing to it is much slower, and each cell wears out', 'It loses data when warm', 'It has no addresses'], a: 1, why: 'Working memory is rewritten constantly, which flash handles badly.' })}
${W('mcq', { q: 'When a computer is switched on, its RAM is empty. Where do its very first instructions come from?', opts: ['The keyboard', 'A ROM or flash chip on the main board', 'The internet', 'The screen'], a: 1, why: 'A small permanent program starts the machine and loads the rest.' })}
${W('mcq', { q: 'Which list runs from fastest to slowest?', stack: true, opts: ['Hard disk, SSD, RAM, register', 'Register, RAM, SSD, hard disk', 'RAM, register, hard disk, SSD', 'SSD, RAM, register, hard disk'], a: 1, why: 'Each step down the ladder is slower and larger.' })}
${W('num', { q: 'How many transistors does one dynamic RAM cell use (alongside its capacitor)?', a: '1', kb: 'numeric', why: 'One transistor as the door, one capacitor as the bucket.' })}

<div class="recap"><h3>What you now know</h3><ul>
  <li>Volatile memory (RAM) loses its contents without power. Non-volatile memory (flash, disk, ROM) keeps them.</li>
  <li>Dynamic RAM stores charge that leaks, so it is refreshed continually.</li>
  <li>Flash traps electrons behind an insulator. It keeps data for years, writes slowly and wears out.</li>
  <li>Computers combine small fast memory with large slow storage.</li>
</ul></div>`;
    }
  });
})();
