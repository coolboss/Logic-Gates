/* Part I — Information: the bit, binary, bytes, and how everything becomes numbers. */
(function () {
  'use strict';
  var LG = window.LG, W = LG.W, PART = 'Information';

  LG.chapter({
    id: 'start', part: PART, title: 'Start here',
    lead: 'Every photo, message, song and bank balance inside a machine is made of one thing: switches that are either on or off. This course begins with a single switch and ends with you wiring the building blocks of a computer by hand.',
    body: function () {
      var resume = LG.resume && LG.chapters.filter(function (c) { return c.id === LG.resume; })[0];
      return `
${resume ? '<p class="key"><b>Welcome back</b>You were last on sheet ' + resume.no + '. <a href="#' + resume.id + '">Continue with “' + resume.title + '”</a></p>' : ''}
${W('hero', { cap: 'Eight switches, four meanings' })}

<h2>Why this is worth knowing</h2>
<p>A phone seems to do a million different things. Underneath, it does one thing a million times: it flips switches according to a few simple rules. Once you have seen those rules, the machine stops being a mystery.</p>
<ul>
  <li><b>It explains everyday puzzles.</b> Why a file has a size. Why an unsaved document vanishes in a power cut. Why a “64 GB” phone shows less than 64. Why a counter can suddenly jump to a negative number.</li>
  <li><b>The same ideas repeat at every scale.</b> The logic inside a ₹100 calculator and inside a supercomputer is built from the same seven gates you will meet in Part II.</li>
  <li><b>It is a complete story.</b> There is no step where you have to accept magic. Each layer is built from the layer below it, and you will build every layer yourself.</li>
</ul>

<h2>What you will be able to do</h2>
<ul>
  <li>Read and write numbers in binary and hexadecimal, including negative numbers.</li>
  <li>Explain how text, colours, pictures and sound are stored as bits.</li>
  <li>Read a circuit diagram and work out what it does, gate by gate.</li>
  <li>Design a circuit that adds, and one that remembers.</li>
  <li>Explain why RAM forgets and a flash drive does not.</li>
  <li>Follow a processor through a program, one instruction at a time, and write small programs for it.</li>
  <li>Wire real logic chips on a breadboard: LEDs, gates, an adder and a memory cell.</li>
</ul>

<h2>The route</h2>
<ol class="roadmap">
  <li><b>Information</b><span>Bits, binary counting, bytes, and how everything becomes numbers.</span></li>
  <li><b>Logic</b><span>Switches, transistors, the seven gates, and the algebra that describes them.</span></li>
  <li><b>Arithmetic</b><span>Circuits that add, subtract, compare and choose.</span></li>
  <li><b>Memory</b><span>The loop that remembers, clocks, registers, RAM, and temporary versus permanent storage.</span></li>
  <li><b>The machine</b><span>A complete 8-bit computer that you can step through and program.</span></li>
  <li><b>Build it</b><span>A virtual breadboard with a controller board, chips, LEDs and wires.</span></li>
</ol>

<h2>How to use this course</h2>
<p>You need no background. If you can add two numbers and flip a light switch, you are ready.</p>
<ul>
  <li>Work through the sheets in order. Each one uses only what came before it.</li>
  <li>Every figure is live. Tap it, break it, see what happens. That is where the understanding comes from.</li>
  <li>Exercises have a blue edge. A finished exercise turns green, and your progress is kept in this browser.</li>
  <li>Stuck? Wrong answers cost nothing. Read the hint and try again.</li>
</ul>
<p>Try your first exercise now, using the same kind of switches as the figure at the top.</p>
${W('bitsq', { n: 8, value: 65, char: true, goal: { text: 'The switches below show the letter <b>A</b>, which is stored as the number 65. Change them so they show the letter <b>B</b>. (B comes straight after A.)', test: function (v) { return v === 66; }, why: 'B is 66: the switches worth 64 and 2. You have just written a letter in binary.' } })}
`;
    }
  });

  LG.chapter({
    id: 'bit', part: PART, title: 'The bit',
    lead: 'A bit is the smallest possible piece of information: one choice between two options. Everything else in this course is made of bits.',
    body: function () {
      return `
<h2>One choice between two</h2>
<p>Think of a light switch. It is on or it is off. There is no third position. If you tell me the position of the switch, you have told me exactly one bit of information.</p>
<p>The word <b>bit</b> is short for <i>binary digit</i>. “Binary” means “made of two”. We write the two possibilities as <code>0</code> and <code>1</code>, but they go by many names:</p>
<dl class="words">
  <dt>0</dt><dd>off · no · false · low · open switch · 0 volts</dd>
  <dt>1</dt><dd>on · yes · true · high · closed switch · 5 volts</dd>
</dl>
<p>These are all the same idea. Engineers pick whichever name fits the conversation. A bit does not care.</p>

<h2>Information is the answer to a yes/no question</h2>
<p>How much can you say with bits? Play this game and count the questions.</p>
${W('guess', { cap: 'Four questions are enough' })}
<p>Each answer cuts the possibilities in half: 16, then 8, then 4, then 2, then 1. Four halvings, four answers, four bits. Your number was sitting in those four answers all along.</p>
<div class="key"><b>Key idea</b>One bit answers one yes/no question. Each extra bit doubles the number of things you can tell apart.</div>

<h2>More bits, more possibilities</h2>
<p>One bit has 2 patterns: <code>0</code> and <code>1</code>. Add a second bit and each of those can be followed by a 0 or a 1, giving 4 patterns: <code>00 01 10 11</code>. A third bit doubles it again to 8.</p>
${W('combos', { cap: 'Drag the slider and watch the count double' })}
<p>The rule is: <b>n bits give 2<sup>n</sup> patterns</b> (2 multiplied by itself n times). The growth is explosive. Ten bits already give 1,024 patterns. Thirty-two bits give over four billion.</p>

<h2>Why only two states?</h2>
<p>We count in tens. Why do machines not use ten voltage levels, one for each digit? Because real wires are noisy. Nearby circuits, heat and imperfect parts all nudge a voltage up and down a little.</p>
${W('noise', { cap: 'The same message sent two ways, through the same noise' })}
<p>With ten levels packed between 0 and 5 volts, a small nudge turns a 7 into a 6 or an 8. With two levels, a 0 would have to be pushed more than halfway to 5 volts before it is mistaken for a 1. Two levels leave the widest possible safety margin.</p>
<p>There is a second benefit. Every gate you will meet in Part II cleans its signal: a slightly sagging 1 goes in, a full-strength 1 comes out. So errors do not pile up, even after a signal has passed through a billion gates.</p>
<div class="aside">Nothing is lost by choosing two. Any information that can be written with ten digits, or with an alphabet, can also be written with bits. It just takes more of them, and bits are extremely cheap.</div>

<h2>Where bits physically live</h2>
<p>A bit needs something physical with two clearly different states. Machines use many:</p>
<ul>
  <li><b>A voltage on a wire:</b> near 0 V or near 5 V (many modern chips use 3.3 V or less). This is what moves through gates.</li>
  <li><b>Charge in a tiny capacitor:</b> charged or empty. This is the RAM in a computer.</li>
  <li><b>Electrons trapped in an insulated pocket:</b> present or absent. This is a flash drive.</li>
  <li><b>A magnetised spot on a spinning disk:</b> pointing one way or the other. This is a hard disk.</li>
  <li><b>A flash of light in a glass fibre:</b> light or no light. This is the internet backbone.</li>
</ul>
<p>The physics differs. The idea is identical: two states, one bit.</p>

<h2>Check your understanding</h2>
${W('mcq', { q: 'How many different patterns can 5 bits make?', opts: ['10', '25', '32', '64'], a: 2, why: '2 × 2 × 2 × 2 × 2 = 32.', hints: ['That would be 5 × 2. Each new bit doubles the total, it does not add 2.', 'That is 5 × 5. Start from 2 and double once for each extra bit.', null, 'That is 6 bits. Count the doublings again.'] })}
${W('num', { q: 'The English alphabet has 26 letters. What is the smallest number of bits that can give every letter its own pattern?', a: '5', kb: 'numeric', why: '4 bits give only 16 patterns. 5 bits give 32, which is enough.', hint: 'Find the first power of two that is at least 26: 2, 4, 8, 16, 32 …' })}
${W('num', { q: 'A wall panel has 10 on/off switches. How many different on/off patterns can the whole panel show?', a: '1024', kb: 'numeric', why: '2 multiplied by itself 10 times is 1,024.', hint: 'Start at 2 and double it nine more times.' })}
${W('mcq', { q: 'There are 7 days in a week. How many yes/no questions do you need, at most, to find out which day someone is thinking of?', opts: ['2', '3', '4', '7'], a: 1, why: '3 questions can separate 8 possibilities, and 7 fits inside 8.', hints: ['2 questions separate only 4 possibilities.', null, '4 would work, but it is more than you need.', 'Asking “is it Monday? is it Tuesday? …” wastes questions. Halve the possibilities each time.'] })}
${W('mcq', { q: 'What is the main reason computers use two voltage levels instead of ten?', stack: true, opts: ['Two levels are much easier to tell apart when the signal is noisy', 'Ten levels would need ten wires', 'Numbers above 1 cannot be stored electrically', 'Binary arithmetic gives more accurate answers than decimal'], a: 0, why: 'A wide gap between the two levels makes mistakes very unlikely.' })}

<div class="recap"><h3>What you now know</h3><ul>
  <li>A bit is one choice between two states, written 0 and 1.</li>
  <li>n bits can form 2<sup>n</sup> different patterns.</li>
  <li>Two states are used because they survive noise best.</li>
  <li>Any physical thing with two clear states can hold a bit.</li>
</ul></div>`;
    }
  });

  LG.chapter({
    id: 'binary', part: PART, title: 'Counting in binary',
    lead: 'Counting with only 0 and 1 works exactly like the counting you learnt as a child. Only the value of each position changes.',
    body: function () {
      return `
<h2>How ordinary numbers really work</h2>
<p>Look closely at the number 407. It has three digits, and each digit’s value depends on its position:</p>
<p class="mono">407 = 4 × 100 + 0 × 10 + 7 × 1</p>
<p>Moving one place to the left makes a digit worth <b>ten times</b> more: ones, tens, hundreds, thousands. We have ten digits (0 to 9), so when a position passes 9 it rolls back to 0 and the position on its left goes up by one. This is the <b>decimal</b> system, also called base ten.</p>

<h2>The same idea with two digits</h2>
<p>Binary keeps every rule and changes one number. There are only two digits, 0 and 1, so moving one place to the left makes a digit worth <b>two times</b> more: ones, twos, fours, eights, sixteens.</p>
${W('bits', { n: 8, value: 5, cap: 'Each switch has a place value. The number is the sum of the switched-on values.' })}
<p>Switch on the 4 and the 1 and you have 5. Switch on everything and you have 255. Every whole number from 0 to 255 has exactly one pattern of these eight switches.</p>
<div class="key"><b>Key idea</b>The place values in binary are 1, 2, 4, 8, 16, 32, 64, 128 … Each is double the one to its right. A binary number is the sum of the place values that hold a 1.</div>

<h2>Counting upward</h2>
<p>A car’s distance meter rolls 0009 to 0010: the last wheel wraps to 0 and pushes its neighbour forward. Binary does the same, except each wheel has only two faces.</p>
${W('counter', { n: 4, cap: 'A four-bit counter' })}
<p>Watch the columns. The right-hand bit flips on every count. The next one flips every 2 counts, the next every 4, the next every 8. That steady halving of speed is the signature of binary, and you will see it again when we build a counter out of memory cells.</p>

<h2>Reading binary</h2>
<p>To turn binary into an ordinary number, write the place values above the bits and add up the ones that sit over a 1.</p>
<p class="mono">1 0 1 1 0 → 16 + 4 + 2 = 22</p>
${W('drill', { kind: 'bin2dec', goal: 5, q: 'Read these binary numbers. Get 5 right.', tip: 'Write 16, 8, 4, 2, 1 above the bits and add the ones above a 1.' })}

<h2>Writing binary</h2>
<p>Going the other way, there are two reliable methods.</p>
<h3>Method 1: take the biggest piece that fits</h3>
<p>To write 37: the largest place value that fits is 32, leaving 5. Then 4 fits, leaving 1. Then 1 fits. So 37 = 32 + 4 + 1 = <code>100101</code>.</p>
<h3>Method 2: keep halving</h3>
<p>Divide by 2 again and again, writing down each remainder. Read the remainders from the last to the first.</p>
${W('divide', { cap: 'Any number from 0 to 255, halved until nothing is left' })}
<p>Why does this work? Dividing by 2 asks “is this number odd?” The remainder is the answer, and it is exactly the right-most bit. Each further halving peels off the next bit.</p>
${W('setbits', { q: 'Switch on the right bits to make <b>100</b>.', n: 8, target: 100, why: '100 = 64 + 32 + 4, which is 01100100.' })}
${W('drill', { kind: 'dec2bin', goal: 5, q: 'Write these numbers in binary. Get 5 right.', tip: 'Take away the biggest place value that fits, then repeat with what is left.' })}

<h2>The largest number that fits</h2>
<p>With all n bits switched on, the value is one less than the next place value. Four bits reach 8 + 4 + 2 + 1 = 15, which is 16 − 1. In general the largest value in n bits is <b>2<sup>n</sup> − 1</b>. It is the count of patterns minus one, because one of the patterns is used for zero.</p>
${W('num', { q: 'What is the largest number that 6 bits can hold?', a: '63', kb: 'numeric', why: '2⁶ = 64 patterns, numbered 0 to 63.', hint: 'Add 32 + 16 + 8 + 4 + 2 + 1, or work out 64 − 1.' })}

<h2>Two handy shortcuts</h2>
<ul>
  <li><b>Odd or even?</b> Look at the right-most bit. If it is 1 the number is odd. Every other place value is even.</li>
  <li><b>Doubling.</b> Write a 0 on the right-hand end. Every bit moves to a place worth twice as much, so the number doubles: <code>101</code> is 5, <code>1010</code> is 10. The same trick in decimal multiplies by ten.</li>
</ul>
${W('mcq', { q: 'The binary number <code>1101</code> is 13. What is <code>11010</code>?', opts: ['14', '23', '26', '130'], a: 2, why: 'A 0 added on the right doubles the number: 13 × 2 = 26.', hints: ['That would be adding 1. A new 0 on the right shifts every bit to a place worth double.', 'Not 13 + 10. Every bit has moved one place left.', null, 'That is the decimal trick (×10). In binary the multiplier is 2.'] })}
${W('mcq', { q: 'Which of these binary numbers is odd?', opts: ['<code>1000</code>', '<code>0110</code>', '<code>1011</code>', '<code>1110</code>'], a: 2, why: 'Only a number ending in 1 has the 1s place switched on.' })}

<div class="recap"><h3>What you now know</h3><ul>
  <li>Binary is place-value counting where each place is worth double the one to its right.</li>
  <li>To read binary, add the place values that hold a 1.</li>
  <li>To write binary, subtract the biggest place values that fit, or halve and collect remainders.</li>
  <li>n bits hold the numbers 0 to 2<sup>n</sup> − 1.</li>
</ul></div>`;
    }
  });

  LG.chapter({
    id: 'bytes', part: PART, title: 'Bytes and hexadecimal',
    lead: 'Single bits are too small to handle one at a time. Machines group them, and the standard group is eight bits: the byte.',
    body: function () {
      var hexRows = '';
      for (var i = 0; i < 16; i++) hexRows += '<tr><td>' + i + '</td><td>' + LG.bin(i, 4) + '</td><td class="out one">' + LG.hex(i) + '</td></tr>';
      return `
<h2>Nibbles and bytes</h2>
<dl class="words">
  <dt>nibble</dt><dd>4 bits. 16 patterns, holding 0 to 15.</dd>
  <dt>byte</dt><dd>8 bits, or two nibbles. 256 patterns, holding 0 to 255.</dd>
</dl>
<p>Eight became the standard size in the 1960s, when IBM chose it for its System/360 computers. One byte is a convenient amount: enough to hold one letter of text, one brightness level, or one small number. Memory and file sizes have been measured in bytes ever since.</p>

<h2>Hexadecimal: a shorthand for bits</h2>
<p>Long rows of 0s and 1s are hard for people to read. Try copying <code>1101011010011110</code> without a mistake. So engineers use a shorthand. Split the bits into nibbles and write each nibble as a single symbol.</p>
<p>A nibble has 16 possible values, so we need 16 symbols. The digits 0 to 9 cover the first ten. The letters A to F cover ten to fifteen. This is <b>hexadecimal</b>, or hex: base sixteen.</p>
<div class="scrollx"><table class="tt"><tr><th>Decimal</th><th>Binary</th><th class="out">Hex</th></tr>${hexRows}</table></div>
${W('bits', { n: 8, value: 0x3C, hex: true, cap: 'One byte is always exactly two hex digits' })}
<p>Hex is still binary. It is only a tidier way to write it down. Each hex digit stands for exactly four bits, so converting is a matter of looking up each digit in the table. No arithmetic is needed.</p>
<p>In a two-digit hex number the left digit counts sixteens and the right digit counts ones: <code>3C</code> is 3 × 16 + 12 = 60.</p>
<div class="aside">You have already met hex. A web colour such as <code>#FF6600</code> is three bytes. Wi-Fi hardware addresses, error codes and memory addresses are usually shown in hex too. Programmers often write the prefix <code>0x</code> in front, as in <code>0x3C</code>, to make clear a number is hex.</div>
${W('drill', { kind: 'bin2hex', goal: 5, q: 'Give the hex digit for each nibble. Get 5 right.', tip: 'Work out the nibble as a number first. 10 to 15 become A to F.' })}
${W('drill', { kind: 'hex2dec', goal: 4, q: 'Convert these hex bytes to decimal. Get 4 right.', tip: 'Left digit × 16, plus the right digit. Remember A=10 … F=15.' })}

<h2>Thousands, millions, billions of bytes</h2>
<div class="scrollx"><table class="plain-table">
  <tr><th>Unit</th><th>Bytes</th><th>Roughly the size of</th></tr>
  <tr><td>1 byte</td><td class="mono">1</td><td>One letter of English text</td></tr>
  <tr><td>1 kilobyte (KB)</td><td class="mono">1,000</td><td>Half a page of plain text</td></tr>
  <tr><td>1 megabyte (MB)</td><td class="mono">1,000,000</td><td>A one-minute song, compressed</td></tr>
  <tr><td>1 gigabyte (GB)</td><td class="mono">1,000,000,000</td><td>Half an hour of high-definition video</td></tr>
  <tr><td>1 terabyte (TB)</td><td class="mono">1,000,000,000,000</td><td>A few hundred films</td></tr>
</table></div>
<p>There is a wrinkle. Because everything inside the machine is a power of two, engineers also count in steps of 1,024 (which is 2<sup>10</sup>) instead of 1,000. The proper names for those are kibibyte (KiB), mebibyte (MiB) and gibibyte (GiB), but many programs simply say KB, MB and GB for both.</p>
<p>This is why a “64 GB” phone appears smaller than promised. The maker counts 64 billion bytes. Some software then divides by 1,024 three times and reports about 59.6. Nothing is missing. The same bytes are being counted with a different ruler, and the system’s own files take a share as well.</p>

<h2>Bits or bytes? Check the letter</h2>
<p>Storage is measured in <b>bytes</b> (capital B). Connection speed is usually measured in <b>bits</b> per second (small b). A 100 Mbps line carries 100 million bits each second, which is 12.5 million bytes: 12.5 MB per second.</p>
${W('num', { q: 'A connection runs at 40 Mbps (megabits per second). How many megabytes does it carry each second?', a: '5', kb: 'decimal', why: '8 bits make a byte, and 40 ÷ 8 = 5 MB per second.', hint: 'Divide the bits by 8.' })}

<h2>Check your understanding</h2>
${W('num', { q: 'How many bits are there in 3 bytes?', a: '24', kb: 'numeric', why: '3 × 8 = 24.' })}
${W('num', { q: 'How many different values can a single byte hold?', a: '256', kb: 'numeric', why: '2⁸ = 256 patterns, used for 0 to 255.', hint: 'It is 2 multiplied by itself 8 times.' })}
${W('num', { q: 'What is hex <code>FF</code> in decimal?', a: '255', kb: 'numeric', why: 'F is 15, so FF = 15 × 16 + 15 = 255. It is a byte with every bit on.', hint: 'F is fifteen. Left digit × 16, plus the right digit.' })}
${W('num', { q: 'Write the byte <code>1010 0111</code> in hex.', a: 'A7', mono: true, why: '1010 is ten, written A. 0111 is 7.', hint: 'Convert each nibble separately.' })}
${W('mcq', { q: 'A file is 2 MB. About how many bytes is that?', opts: ['2 thousand', '2 million', '2 billion', '16 million'], a: 1, why: 'Mega means million.', hints: ['That would be 2 KB.', null, 'That would be 2 GB.', 'That is the number of bits, not bytes.'] })}

<div class="recap"><h3>What you now know</h3><ul>
  <li>A nibble is 4 bits and a byte is 8 bits.</li>
  <li>Hex writes each nibble as one symbol, 0–9 then A–F, so a byte is two hex digits.</li>
  <li>KB, MB, GB and TB step up by a thousand (or by 1,024, depending on who is counting).</li>
  <li>Storage is counted in bytes. Speed is usually counted in bits.</li>
</ul></div>`;
    }
  });

  LG.chapter({
    id: 'data', part: PART, title: 'Everything is numbers',
    lead: 'Bits can only hold numbers. Yet computers hold letters, pictures and music. The trick is always the same: agree on a code that turns the thing into numbers.',
    body: function () {
      return `
<h2>Text: one number for each character</h2>
<p>In the 1960s a committee wrote down a table giving every letter, digit and punctuation mark on an American keyboard a number from 0 to 127. That table is <b>ASCII</b>. Capital A is 65, B is 66, small a is 97, the digit “0” is 48, and a space is 32.</p>
${W('textbits', { cap: 'Type and see the bytes that are actually stored' })}
<p>Compare <code>A</code> (65) and <code>a</code> (97). They differ by 32, which is a single bit. Changing case flips one switch.</p>
<p>ASCII has room for 128 characters, which is fine for English and useless for most of the world. The modern replacement is <b>Unicode</b>, a far larger table with a number for every character in every script, from ગુજરાતી to 日本語 to emoji. The usual way to store Unicode is called <b>UTF-8</b>. It keeps the old ASCII codes at one byte each, and uses two, three or four bytes for everything else.</p>
${W('num', { q: 'A is 65 and B is 66. What number is stored for the letter <b>E</b>?', a: '69', kb: 'numeric', why: 'The letters run in order: A 65, B 66, C 67, D 68, E 69.' })}
${W('bitsq', { n: 8, value: 65, char: true, goal: { text: 'These switches show capital <b>A</b>. Turn it into a small <b>a</b> by changing a single switch.', test: function (v) { return v === 97; }, why: 'Small letters are exactly 32 above their capitals: 65 + 32 = 97.' } })}

<h2>Colour: three numbers</h2>
<p>A screen makes every colour by mixing red, green and blue light. Give each of the three a byte, 0 for none and 255 for full, and you can name over 16 million colours with 24 bits.</p>
${W('rgb', { cap: 'Mix a colour and read its three bytes' })}

<h2>Pictures: a grid of numbers</h2>
<p>A picture is a grid of tiny squares called <b>pixels</b>. Store a number for each pixel and you have stored the picture. In the simplest case each pixel is one bit: ink or no ink.</p>
${W('pixels', { cap: 'An 8 × 8 picture is 64 bits, which is 8 bytes' })}
<p>A phone photo works the same way with more of everything. Twelve million pixels, three bytes each, is 36 million bytes for one picture. Formats such as JPEG then squeeze this down, by spotting patterns and dropping detail the eye will not miss, to a few megabytes.</p>
${W('num', { q: 'A small icon is 100 pixels wide and 100 pixels tall. Each pixel uses 3 bytes (red, green, blue). How many bytes is the whole icon, before any compression?', a: '30000', kb: 'numeric', why: '100 × 100 = 10,000 pixels, times 3 bytes each.', hint: 'Count the pixels first, then multiply by 3.' })}

<h2>Sound: thousands of numbers each second</h2>
<p>Sound is air pressure wobbling very quickly. A microphone turns the wobble into a voltage. To store it, the machine measures that voltage at regular moments and writes down each measurement as a number. CD-quality sound takes 44,100 measurements every second, each stored in 16 bits, for each of two speakers.</p>
<p>That is about 10 megabytes for one minute of music. To play it back, the numbers are turned into voltages again and sent to a speaker.</p>

<h2>The big idea: bits have no meaning on their own</h2>
<p>Go back to the figure at the top of the first sheet. The byte <code>01000001</code> was a number, a letter, a shade of grey and a volume level, all at once. Which is it <i>really</i>?</p>
<p>None of them. It is eight switches. The meaning comes from whatever program reads them, and from the code that program expects. A music player treats a file’s bytes as sound levels. A photo viewer treats the same kind of bytes as colours. Open a song in a text editor and you will see pages of nonsense characters: the right bits, read with the wrong code.</p>
<div class="key"><b>Key idea</b>Data is bits plus an agreement about how to read them. Without the agreement, a bit pattern means nothing.</div>
${W('mcq', { q: 'A memory cell holds the byte <code>01000001</code>. What does it mean?', stack: true, opts: ['The letter A, always', 'The number 65, always', 'It depends on the code the reading program uses', 'Nothing can be said about it'], a: 2, why: 'The same bits are 65, or “A”, or a dark grey pixel, depending on how they are read.', hints: ['Only if the program reads it as ASCII text.', 'Only if the program reads it as a plain number.', null, 'We can say a lot, once we know which code is in use.'] })}

<h2>One more thing that is a number</h2>
<p>Instructions are numbers too. “Add these two values” and “jump back ten steps” are each stored as a pattern of bits, in the same memory as the data they work on. You will write such instructions yourself in Part V. First we need machinery that can act on bits, and that begins with a switch.</p>
${W('mcq', { q: 'An 8 × 8 picture uses one bit per pixel. How many bytes does it need?', opts: ['8', '16', '64', '512'], a: 0, why: '64 pixels are 64 bits, and 64 ÷ 8 = 8 bytes.', hints: [null, 'Count the pixels (8 × 8), then divide by 8 bits per byte.', 'That is the number of bits.', 'Divide by 8, do not multiply.'] })}
${W('mcq', { q: 'Why does a letter from a script such as Gujarati or Hindi take more than one byte in UTF-8?', stack: true, opts: ['One byte has only 256 patterns, far too few for every character in every script', 'Those letters are drawn with more ink', 'Older computers cannot display them', 'They are stored as small pictures'], a: 0, why: 'UTF-8 uses longer codes for characters beyond the first 128.' })}

<div class="recap"><h3>What you now know</h3><ul>
  <li>Text is stored as one number per character (ASCII, and now Unicode in UTF-8).</li>
  <li>A colour is three bytes: red, green, blue.</li>
  <li>A picture is a grid of pixel numbers. Sound is a long list of measurements.</li>
  <li>Bits mean nothing until a code says how to read them.</li>
</ul></div>`;
    }
  });
})();
