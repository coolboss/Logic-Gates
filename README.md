# Bit by Bit

**From a single switch to a working computer.** A free, interactive course in digital logic that runs in any browser. It assumes no background at all and ends with you wiring logic chips on a virtual breadboard.

No installation, no build step, no dependencies. Open `index.html` and start.

## What it covers

22 sheets in six parts, 152 exercises, every figure live.

| Part | Sheets | You learn |
|---|---|---|
| I · Information | Start here · The bit · Counting in binary · Bytes and hexadecimal · Everything is numbers | What a bit is and why there are only two states, binary and hex, how text, colour, pictures and sound become numbers |
| II · Logic | Switches and transistors · NOT, AND, OR · NAND, NOR, XOR, XNOR · NAND builds everything · Boolean algebra | How a transistor makes a gate, all seven gates, truth tables, universality of NAND, De Morgan, turning any truth table into a circuit |
| III · Arithmetic | Adding with gates · Negative numbers and subtraction · Choosing, decoding and the ALU | Half and full adders, ripple carry, overflow, two's complement, multiplexers, decoders, a 4-bit ALU with flags |
| IV · Memory | The loop that remembers · Clocks and flip-flops · Registers and counters · RAM · Temporary and permanent memory | The SR latch, D latch and D flip-flop, registers, shift registers, counters, addressed memory, why RAM forgets and flash does not |
| V · The machine | A tiny computer | LG-8, an 8-bit stored-program computer you can single-step and program in assembly |
| VI · Build it | Breadboard basics · The wiring lab · Final review | An Arduino-style controller, a 30-column breadboard, 7400-series chips, 12 checked builds from one LED to a memory cell |

## The interactives

- **Live circuit diagrams.** Tap an input and watch the 1s travel along the wires. Feedback loops really hold their state, so the latches are real latches.
- **Exercise types.** Multiple choice with targeted hints, typed answers, fill-in truth tables, set-the-bits, endless practice drills, and "write a Boolean expression" checked by a real parser.
- **The breadboard.** Place wires, LEDs, resistors, switches and seven kinds of chip by tapping holes. The simulator works out which holes are joined, powers the chips, and warns about the mistakes beginners actually make: no power to a chip, an LED without a resistor, an LED in backwards, a floating input, a short circuit, two outputs tied together.
- **LG-8.** 16 bytes of memory, a program counter, an accumulator, eleven instructions, and a small assembler. Step through fetch and execute, then write your own programs.
- **Progress** is kept in the browser. Nothing is sent anywhere.

## Run it

```
git clone https://github.com/coolboss/Logic-Gates.git
```

Then open `index.html`. It works straight from the file system, and on GitHub Pages with no configuration. Phones are supported: the breadboard scrolls sideways and has zoom buttons.

## How it is put together

```
index.html            page shell
css/app.css           all styling, light and dark themes
js/engine.js          the simulators: gates, circuits, Boolean parser, breadboard, LG-8 (no DOM)
js/challenges.js      wiring-lab builds: starting board, checker, known-good solution
js/app.js             chapters, navigation, progress, exercise types
js/circuit.js         circuit diagrams, drawn from data
js/widgets-a.js       interactives for Parts I and II
js/widgets-b.js       interactives for Parts III to V
js/boardui.js         the breadboard bench
js/lessons-1..5.js    the course text
tests/run.js          tests for the simulators
```

Plain HTML, CSS and JavaScript. The simulators in `engine.js` never touch the page, so they can be tested from the command line:

```
node tests/run.js
```

The tests check every gate, the latch behaviour, the expression parser, the breadboard's electrical rules and the LG-8 programs. They also load each wiring-lab solution and confirm that its own checker accepts it, so a "Show a solution" button can never show a build that fails.

## Adding to it

A lesson is a JavaScript template string. Drop an interactive into the text with `LG.W('type', options)`:

```js
${W('mcq', { q: 'How many patterns can 5 bits make?', opts: ['10', '25', '32', '64'], a: 2, why: '2 × 2 × 2 × 2 × 2 = 32.' })}
```

A new circuit diagram is a list of nodes in `js/circuit.js`. A new wiring-lab build is one object in `js/challenges.js` with `setup`, `check` and `solution`.

## History

This repository began as *Logic Gates Learning Lab*, a single-page introduction to the seven gates. Bit by Bit is a complete rebuild that keeps the same aim: simple mental models, real-life analogies, and understanding through doing.

## Licence

Free to use and share.
