/* Part III — Arithmetic: adders, negative numbers, multiplexers, decoders, the ALU. */
(function () {
  'use strict';
  var LG = window.LG, W = LG.W, PART = 'Arithmetic';

  LG.chapter({
    id: 'adders', part: PART, title: 'Adding with gates',
    lead: 'Addition is the first real job we give our gates. It needs only two ideas you already own: XOR and AND.',
    body: function () {
      return `
<h2>Adding binary by hand</h2>
<p>Adding in binary follows the school method: start at the right, add each column, carry when a column overflows. The only difference is how soon a column overflows. In decimal it happens after 9. In binary it happens after 1.</p>
<dl class="words">
  <dt>0 + 0</dt><dd>0</dd>
  <dt>0 + 1</dt><dd>1</dd>
  <dt>1 + 1</dt><dd>10 &nbsp;(that is two: write 0, carry 1)</dd>
  <dt>1 + 1 + 1</dt><dd>11 &nbsp;(that is three: write 1, carry 1)</dd>
</dl>
<p>That table is the whole of binary addition. Everything else is repetition.</p>
${W('adder', { n: 4, a: 5, b: 3, cap: 'Set A and B, then press the button to watch each column in turn' })}

<h2>One column, two bits: the half adder</h2>
<p>Look at the four rules for adding two bits. Each produces two results: a <b>sum</b> bit to write down and a <b>carry</b> bit to pass left.</p>
<div class="scrollx"><table class="tt"><tr><th>A</th><th>B</th><th class="out">Carry</th><th class="out">Sum</th></tr>
<tr><td>0</td><td>0</td><td class="out">0</td><td class="out">0</td></tr><tr><td>0</td><td>1</td><td class="out">0</td><td class="out one">1</td></tr>
<tr><td>1</td><td>0</td><td class="out">0</td><td class="out one">1</td></tr><tr><td>1</td><td>1</td><td class="out one">1</td><td class="out">0</td></tr></table></div>
<p>Read the two output columns as truth tables. You know both of them. The Sum column is <b>XOR</b>: 1 when the bits differ. The Carry column is <b>AND</b>: 1 only when both bits are 1.</p>
${W('circuit', { c: 'half', truth: ['C', 'S'], cap: 'The half adder: one XOR and one AND', say: function (v) { return v.A + ' + ' + v.B + ' = ' + (v.A + v.B) + ', which is <b>' + v.C + v.S + '</b> in binary (carry ' + v.C + ', sum ' + v.S + ').'; } })}
<p>Two gates, and a machine is doing arithmetic. Nothing in these gates “knows” what a number is. We chose the wiring so that the pattern of voltages matches the rules of addition.</p>

<h2>One column, three bits: the full adder</h2>
<p>A half adder is enough for the right-most column only. Every other column has a third bit arriving: the carry from the column on its right. A circuit that adds three bits is a <b>full adder</b>.</p>
${W('circuit', { c: 'full', truth: ['C', 'S'], cap: 'The full adder: two half adders and an OR', say: function (v) { var t = v.A + v.B + v.Cin; return v.A + ' + ' + v.B + ' + ' + v.Cin + ' = ' + t + ', which is <b>' + v.C + v.S + '</b> in binary.'; } })}
<p>It is built from two half adders. The first adds A and B. The second adds the carry-in to that result. If either half adder produced a carry, the OR gate passes it on. (They can never both carry at once.)</p>
<ul>
  <li><b>Sum</b> = A XOR B XOR Carry-in. It is 1 when an odd number of the three inputs are 1.</li>
  <li><b>Carry out</b> is 1 when at least two of the three inputs are 1. It is the “majority” circuit from the last sheet.</li>
</ul>

<h2>Chain them: the ripple-carry adder</h2>
<p>To add two 4-bit numbers, line up four full adders. Each one handles a column. The carry-out of each is wired to the carry-in of its left-hand neighbour. That is exactly what the figure at the top of this sheet does when you press its button.</p>
<p>The carry may have to travel the whole length of the chain, like a row of falling dominoes, before the left-most sum bit is right. This is why the design is called a <b>ripple-carry</b> adder. Each gate takes a tiny but real time to respond, so a long chain is slow. Fast processors add extra gates that work out the carries in advance. The answer is the same. It just arrives sooner.</p>

<h2>Overflow</h2>
<p>Four bits can hold 0 to 15. Ask a 4-bit adder for 9 + 9 and the true answer, 18, needs a fifth bit. The four result bits show 2, and the carry leaves the top of the adder with nowhere to go. That is <b>overflow</b>.</p>
<p>Real processors use 32 or 64 bits, so overflow is rarer. It still happens, and it has caused real failures: a counter that passes its largest value wraps round to zero and carries on.</p>

<h2>Counting the cost</h2>
<p>A full adder is 5 gates. Built from NAND gates alone it takes 9, and each NAND is 4 transistors. An 8-bit adder is therefore about 8 × 9 × 4 = 288 transistors. A processor that adds two 64-bit numbers in a fraction of a billionth of a second is doing nothing different. It has more columns and cleverer carries.</p>

<h2>Practice</h2>
${W('drill', { kind: 'addbin', goal: 5, q: 'Add these by hand, in binary. Get 5 right.', tip: 'Work from the right. 1 + 1 is 0 carry 1. 1 + 1 + 1 is 1 carry 1.' })}
${W('mcq', { q: 'In a half adder, which gate produces the carry?', opts: ['XOR', 'AND', 'OR', 'NOT'], a: 1, why: 'A carry happens only when both bits are 1.' })}
${W('truth', { q: 'Fill in the <b>carry-out</b> of a full adder.', inputs: ['A', 'B', 'Cin'], out: 'Carry', vec: '00010111', why: 'Carry is 1 whenever two or more inputs are 1.', hint: 'Count the 1s in each row. Two or three 1s make a carry.' })}
${W('truth', { q: 'Fill in the <b>sum</b> output of a full adder.', inputs: ['A', 'B', 'Cin'], out: 'Sum', vec: '01101001', why: 'Sum is 1 when one or all three of the inputs are 1: an odd count.', hint: 'Count the 1s in each row. An odd count gives 1.' })}
${W('adderq', { n: 4, a: 1, b: 1, goal: { text: 'Set A and B so that the adder computes <b>7 + 9</b>. Watch what happens to the result.', test: function (s) { return s.a === 7 && s.b === 9; }, why: '7 + 9 = 16, which needs five bits. The four result bits read 0000 and the carry falls off the end.' } })}
${W('adderq', { n: 4, a: 2, b: 1, goal: { text: 'Find an A and a B where a carry is passed out of <b>every one</b> of the four columns.', test: function (s) { return s.carries[1] && s.carries[2] && s.carries[3] && s.carries[4]; }, why: 'For example 1111 + 0001: the carry ripples through the whole chain.' } })}
${W('num', { q: 'How many full adders does it take to add two 16-bit numbers?', a: '16', kb: 'numeric', why: 'One per column. (The right-most could be a half adder, since nothing carries into it.)' })}

<div class="recap"><h3>What you now know</h3><ul>
  <li>Adding two bits gives a sum (XOR) and a carry (AND): the half adder.</li>
  <li>A full adder adds three bits, so it can accept a carry from its neighbour.</li>
  <li>A chain of full adders adds numbers of any width.</li>
  <li>When the answer needs more bits than the adder has, it overflows.</li>
</ul></div>`;
    }
  });

  LG.chapter({
    id: 'negative', part: PART, title: 'Negative numbers and subtraction',
    lead: 'Wires carry 0 and 1. There is no minus sign. Engineers found a way of writing negative numbers that lets the adder subtract without any new hardware.',
    body: function () {
      return `
<h2>A first attempt, and why it fails</h2>
<p>The obvious idea is to use the left-most bit as a sign: 0 for plus, 1 for minus, with the rest as the size. In four bits <code>0101</code> would be +5 and <code>1101</code> would be −5.</p>
<p>It has two problems. There are two zeros, <code>0000</code> and <code>1000</code> (“minus zero”), which wastes a pattern and confuses comparisons. Worse, our adder gives wrong answers with it: feed it +5 and −5 and it does not produce zero. We would need separate, more complicated hardware.</p>

<h2>Two’s complement: make the top bit negative</h2>
<p>The method every modern computer uses changes one thing. The left-most bit keeps its usual size but counts as <b>negative</b>. In four bits the place values become −8, 4, 2, 1.</p>
${W('bits', { n: 4, value: 13, signed: true, cap: 'Four bits with a negative top place' })}
<p>With the top bit off, nothing has changed: <code>0101</code> is still 5. With it on, you start at −8 and add back the rest: <code>1101</code> is −8 + 4 + 1 = −3. All ones, <code>1111</code>, is −8 + 7 = −1.</p>
<p>This scheme is called <b>two’s complement</b>. There is one zero. The top bit still tells you the sign at a glance. And, as you are about to see, the adder needs no changes at all.</p>

<h2>The number wheel</h2>
<p>Arrange the sixteen 4-bit patterns in a circle, in counting order. Stepping clockwise always adds one, all the way round.</p>
${W('wheel', { cap: 'The patterns count steadily. Only the reading changes at the top bit.' })}
<p>Step up from 0 and you pass 1, 2, 3 … 7. Step down from 0 and you pass −1, −2 … −8. The adder sees a plain counter. It has no idea whether we call <code>1111</code> “fifteen” or “minus one”, and it does not need to know.</p>
<p>The one place to be careful is the far side of the wheel, between +7 and −8. Crossing that boundary means the true answer is outside the range, which is overflow for signed numbers.</p>

<h2>How to negate a number</h2>
<p>To turn a number into its negative: <b>flip every bit, then add 1</b>.</p>
<p class="mono">&nbsp;5 = 0101<br>flip 1010<br>+ 1 &nbsp;1011 = −8 + 2 + 1 = −5 ✓</p>
<p>The same two steps take you back again: flip <code>1011</code> to <code>0100</code>, add 1, and you have <code>0101</code>.</p>
<div class="aside">Why does it work? A number plus its flipped self is always all ones, which is −1. So flipped = −number − 1, and adding 1 gives −number.</div>

<h2>Subtraction comes for free</h2>
<p>A − B is the same as A + (−B). And −B is “flip B, add 1”. So to subtract with an adder:</p>
<ol>
  <li>Pass every bit of B through a NOT gate.</li>
  <li>Feed a 1 into the carry-in of the right-most column. That is the “add 1”.</li>
</ol>
${W('adder', { n: 4, a: 6, b: 2, sub: true, cap: 'The same adder, subtracting. The dashed carry on the right is the extra 1.' })}
<p>Remember the switchable inverter from the XOR sheet? Put an XOR on each B bit, all controlled by one wire called “subtract”, and connect that same wire to the carry-in. With the wire at 0 the circuit adds. With it at 1 the circuit subtracts. One wire turns an adder into an adder-subtractor.</p>

<h2>How far the numbers reach</h2>
<div class="scrollx"><table class="plain-table">
  <tr><th>Bits</th><th>Unsigned range</th><th>Two’s complement range</th></tr>
  <tr><td>4</td><td class="mono">0 to 15</td><td class="mono">−8 to 7</td></tr>
  <tr><td>8</td><td class="mono">0 to 255</td><td class="mono">−128 to 127</td></tr>
  <tr><td>16</td><td class="mono">0 to 65,535</td><td class="mono">−32,768 to 32,767</td></tr>
  <tr><td>32</td><td class="mono">0 to 4,294,967,295</td><td class="mono">−2,147,483,648 to 2,147,483,647</td></tr>
</table></div>
<p>The negative side always reaches one further than the positive side, because zero uses up one of the patterns that start with 0.</p>
<p>That 32-bit limit has made the news. In 2014 a music video became the first to be watched more than 2,147,483,647 times, and YouTube had to rebuild its view counter with 64 bits to keep counting.</p>

<h2>Practice</h2>
${W('drill', { kind: 'twos', goal: 5, q: 'Read these 4-bit two’s complement numbers. All are negative. Get 5 right.', tip: 'Start from −8 and add the other place values that are on.' })}
${W('bitsq', { n: 4, value: 0, signed: true, goal: { text: 'Set the four bits to <b>−6</b>.', test: function (v) { return v === 10; }, why: '−8 + 2 = −6, which is 1010. Or: 6 is 0110, flip to 1001, add 1 to get 1010.' } })}
${W('num', { q: 'Write <b>−1</b> as an 8-bit two’s complement number.', a: '11111111', kb: 'numeric', why: 'All ones: −128 + 127 = −1. Adding 1 to it rolls every bit over to 0.', hint: 'Start from 00000001, flip every bit, then add 1.' })}
${W('num', { q: 'What is the most negative number an 8-bit two’s complement byte can hold?', a: '-128', why: 'Only the top bit on: 10000000.', hint: 'The top place is worth −128. Switch on nothing else.' })}
${W('mcq', { q: 'How do you negate a two’s complement number?', stack: true, opts: ['Flip the left-most bit only', 'Flip every bit', 'Flip every bit, then add 1', 'Subtract it from 1111'], a: 2, why: 'Flipping alone lands one short. The added 1 fixes it.' })}
${W('adderq', { n: 4, a: 0, b: 0, sub: true, goal: { text: 'Use the subtractor to work out <b>3 − 5</b>.', test: function (s) { return s.a === 3 && s.b === 5; }, why: 'The result is 1110, which reads as −8 + 4 + 2 = −2.' } })}
${W('mcq', { q: 'A 4-bit signed counter holds 0111 (+7) and one more is added. What does it show?', opts: ['+8', '0', '−8', '−1'], a: 2, why: '0111 + 1 = 1000, and in two’s complement that pattern means −8. This is signed overflow.' })}

<div class="recap"><h3>What you now know</h3><ul>
  <li>In two’s complement the top bit has a negative place value.</li>
  <li>To negate: flip every bit and add 1.</li>
  <li>Subtracting is adding the negative, so an adder with NOT gates on B and a carry-in of 1 subtracts.</li>
  <li>n bits hold −2<sup>n−1</sup> up to 2<sup>n−1</sup> − 1.</li>
</ul></div>`;
    }
  });

  LG.chapter({
    id: 'choosing', part: PART, title: 'Choosing, decoding and the ALU',
    lead: 'Arithmetic is half of computing. The other half is choosing: which data to use, which operation to perform, which memory cell to talk to.',
    body: function () {
      return `
<h2>The multiplexer: a switch for data</h2>
<p>A <b>multiplexer</b> (mux for short) has several data inputs, one output, and a <b>select</b> input that decides which data input reaches the output. Think of the points on a railway line: one lever chooses which track joins the main line.</p>
${W('circuit', { c: 'mux', truth: ['Y'], cap: 'A two-way multiplexer', say: function (v) { return 'Select is ' + v.S + ', so the output copies <b>D' + v.S + '</b> (' + v['D' + v.S] + '). The other input is ignored.'; } })}
<p>See how it works. Each AND gate is a door. A door passes its data only when its other input is 1. Select opens one door directly, and opens the other through a NOT gate, so exactly one door is ever open. The OR gate joins the two.</p>
<p>With two select bits a mux can choose among four inputs. With three, among eight. A mux is how a circuit says “if this, use that”.</p>

<h2>The decoder: one line out of many</h2>
<p>A <b>decoder</b> does the reverse job. It takes a binary number in and switches on exactly one of its output lines: the line with that number.</p>
${W('decoder', { n: 2, cap: 'A 2-to-4 decoder. The address picks the line.' })}
<p>Each output is an AND gate that recognises one particular pattern. Line 2 is wired to respond to A1 = 1 and A0 = 0, and to nothing else. Two address bits select among 4 lines, three among 8, and n bits among 2<sup>n</sup>.</p>
<p>Hold on to this one. A decoder is what will let a memory chip pick one cell out of billions.</p>

<h2>Comparing two numbers</h2>
<p>Are two bytes equal? Compare them bit by bit with XNOR gates (the “same?” gate), then AND all eight results. The answer is 1 only if every pair matched.</p>
<p>There is a second way, and it is the one processors use. Subtract one number from the other and look at the result. If every bit of the result is 0, the numbers were equal. If the result is negative, the first was smaller.</p>

<h2>The ALU: every operation in one box</h2>
<p>Now combine the pieces. Build an adder-subtractor. Beside it put a row of AND gates, a row of OR gates and a row of XOR gates, each working on A and B column by column. All of them calculate all the time. A multiplexer at the end chooses which result to let out, steered by a small number called the <b>operation code</b>.</p>
<p>This box is the <b>arithmetic logic unit</b>, or ALU. It is the part of a processor that does the actual computing.</p>
${W('alu', { cap: 'A 4-bit ALU. The operation code is just three more bits.' })}
<p>The ALU also reports a few facts about each result. These one-bit reports are called <b>flags</b>:</p>
<ul>
  <li><b>Zero</b>: every bit of the result is 0.</li>
  <li><b>Carry</b>: the addition overflowed out of the top.</li>
  <li><b>Negative</b>: the top bit of the result is 1.</li>
</ul>
<p>Flags look like a detail. They are how a computer makes decisions, as you will see in Part V.</p>
<div class="key"><b>Key idea</b>“What to do” is itself a number. Change the operation code and the same wires do a different job. This is the first hint of what a program is.</div>

<h2>Where we stand</h2>
<p>Everything built so far is <b>combinational</b> logic: the outputs depend only on the inputs at this moment. Change an input and the old answer is gone without a trace. An ALU can add, but it cannot remember what it added.</p>
<p>To build a computer we need circuits that hold on to a bit after the input has gone away. That is memory, and it is the subject of the next part.</p>

<h2>Practice</h2>
${W('mcq', { q: 'A two-way multiplexer has D0 = 1, D1 = 0 and Select = 1. What is its output?', opts: ['0', '1'], a: 0, why: 'Select = 1 chooses D1, which is 0.', hints: [null, 'Select = 1 picks D1, not D0.'] })}
${W('num', { q: 'A decoder has 4 address inputs. How many output lines does it have?', a: '16', kb: 'numeric', why: '2⁴ = 16, one line for each possible address.' })}
${W('num', { q: 'A multiplexer chooses among 8 data inputs. How many select bits does it need?', a: '3', kb: 'numeric', why: '3 bits can name 8 different inputs.', hint: 'How many bits give 8 patterns?' })}
${W('aluq', { goal: { text: 'Use the ALU to test whether two numbers are equal. Set both A and B to <b>1010</b>, then choose the operation that makes the Zero flag light up.', test: function (s) { return s.a === 10 && s.b === 10 && s.zero && (s.op === 'SUB' || s.op === 'XOR'); }, why: 'Equal numbers give a result of 0000, so Zero = 1. SUB and XOR both work.' } })}
${W('aluq', { goal: { text: 'Using <b>ADD</b>, choose A and B so that the Carry flag turns on.', test: function (s) { return s.op === 'ADD' && s.carry; }, why: 'Any two numbers that total more than 15 overflow four bits.' } })}
${W('mcq', { q: 'How does an ALU “choose” to add rather than AND?', stack: true, opts: ['Only the needed circuit is switched on', 'All the circuits compute, and a multiplexer lets one result through', 'The wires are reconnected for each operation', 'It tries each operation in turn'], a: 1, why: 'The operation code steers a multiplexer. No wire ever moves.' })}
${W('mcq', { q: 'In a 2-to-4 decoder with address 11, how many output lines are at 1?', opts: ['0', '1', '2', '4'], a: 1, why: 'A decoder always switches on exactly one line: here, line 3.' })}

<div class="recap"><h3>What you now know</h3><ul>
  <li>A multiplexer passes one of several inputs, chosen by select bits.</li>
  <li>A decoder turns a binary number into one active line.</li>
  <li>An ALU computes several operations at once and uses a multiplexer to pick one.</li>
  <li>Flags (zero, carry, negative) describe the result. All of this logic forgets instantly.</li>
</ul></div>`;
    }
  });
})();
