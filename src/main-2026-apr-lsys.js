import "./style.css";

// import {
//   presets,
//   iterator,
//   timeline,
//   maxX,
//   maxY,
//   maxZ,
//   minX,
//   minY,
//   minZ,
//   onProgress,
//   pi,
//   cos,
//   sin,
// } from "gridlib";

import { LivePrinter } from "liveprinter-core";
import { makeVisualiser } from "vizlib";
import { initSound } from "./sound.js";
import { default as seq } from "./Sequence.js";
import { test, parseStrudel as uzu } from "./strudel.js";

test();

function hms(ms) {
  const s = Math.floor(ms / 1000);
  const s_per_m = 60;
  const s_per_h = s_per_m * 60;
  const h = Math.floor(s / s_per_h);
  const h_s = h * s_per_h;
  const m_s = s - h_s;
  const m = Math.floor(m_s / s_per_m);
  const result = `${h}:${m}:${s - m * s_per_m}`;
  return result;
}

document.getElementById("start-btn").addEventListener("click", async () => {
  console.log(`6000ms = ${hms(6000)}; 60000ms = ${hms(60000)}`);
  
  const lp = new LivePrinter();
  globalThis.lp = lp;
  const gcode = [];
  
  const printer = lp;
  await initSound(printer);
  
  globalThis.noteLength = "1/4b";
  let cx = printer.cx;
  let cy = printer.cy;
  let layerThick = 0.18;
  let bpm = 125;
  //globalThis.notes = new seq(["c3", "g3", "a3", "b3", "c3", "g3", "-", "b3"]);
// let initPattern = uzu("c3 c4 c5 c4", 1);
 
 let initPattern = uzu("c3 c4 [c5 a4] [c4 a5] c3 c4 [g5 e4] [g4 a5]", 2);
 console.log(initPattern);

  globalThis.notes = new seq(initPattern);
  globalThis.useTime = false;
  
  
  // f minor
  // notes.set('c2','f3','c3', 'ab2', 'eb3','db3', 'g3','f2');
  
  const visualiser = makeVisualiser(printer, "viz", {
    title: "gridlib",
    delay: true,
  });
  
  document
  .getElementById("gcode-btn")
  .addEventListener("click", visualiser.downloadGCode);
  
  visualiser.setZoom(0.2);
  visualiser.setViewX(0.02);
  visualiser.setViewY(0.2);
  visualiser.closeFactor(110);
  
  printer.interval("1/8b");
  printer.bpm(bpm);
  
  let lastCall = performance.now();
  
  //******** RUN THE MAIN LOOP************************************
  
  //####------------------------ GOGOGOGOGO
  
  //console.table({ x: lp.x, y: lp.y, z: lp.z });
  
  //await printer.prime();
    
  // Define the L-System rules for a Hilbert Curve
  const hilbertAxiom = "L";
  const hilbertRules = {
    L: "-RF+LFL+FR-",
    R: "+LF-RFR-FL+",
  };
  
  const hilbert2Rules = {
    "L": "+RAF-LFAL-FAR+",
    "R": "-LF+RAAAFR+FL-",
    "A": "A"
  }
  
  const angleMap = {
    "+": 90,
    "-": -90,
  };
  
  /**
  * Iterates the L-system based on the axiom and rules.
  * @param {string} axiom - The starting string
  * @param {object} rules - The production rules
  * @param {number} iterations - How many times to expand the string
  * @returns {string} The final L-system instruction string
  */
  function iterateLSystem(instructions, rules, iterations = 1) {
    let currentString = instructions;
    
    for (let i = 0; i < iterations; i++) {
      let nextString = "";
      for (let char of currentString) {
        // Replace the character if a rule exists, otherwise keep it
        nextString += rules[char] || char;
      }
      currentString = nextString;
    }
    
    return currentString;
  }
  
  /**
  * Calculates the total length of the path that will be drawn based on the L-system instructions by counting the number of 'F' commands and multiplying by the length of each segment.
  * @param {String} instructions
  * @param {number} drawLength - The length of each line segment corresponding to an 'F' command
  * @return {number} Total length of the path to be drawn
  */
  function calcLSystemLength(instructions, drawLength) {
    const segmentCount = (instructions.match(/FA/g) || []).length; // Count 'F' commands
    return segmentCount * drawLength; // Total length = number of segments * length per segment
  }
  
  /**
  * Parses the final L-system string and executes printer commands.
  * @param {string} instructions - The expanded L-system string
  * @param {object} printer - The drawing object
  * @param {number} length - The distance to draw per 'F' command
  * @param {object} angleMap - Dictionary mapping symbols to bespoke angles
  */
  function drawLSystem(
    instructions,
    printer,
    length,
    angleMap = { "+": 90, "-": -90 },
  ) {
    for (let char of instructions.match(/[FA+-]/g)) {
      if (char.match(/[FA]/) ) {
        printer.draw(length);
      } else if (angleMap[char] !== undefined) {
        // Apply bespoke angles mapped to this character
        printer.turn(angleMap[char]);
      }
      // Characters 'A' and 'B' are ignored during the drawing phase,
      // as they are only used for the geometric substitution rules.
    }
  }
  
  // --- Execution & Configuration ---
  
  // Define the bespoke angles here.
  // A standard Hilbert curve uses exactly 90 and -90, but you can change these
  // to 85, 120, etc., to get distorted, non-orthogonal fractal patterns.
  // const angleMap = {
  //     "+": 60,
  //     "-": -60
  // };
  
  
  // const instructions = iterateLSystem(hilbertAxiom, hilbertRules, 5);
  
  const instructions = iterateLSystem(hilbertAxiom, hilbert2Rules, 5);

  printer.speed('c3');
  const segmentLength = printer.t2mm(noteLength);
  const segmentTime = printer.b2t(noteLength);
  
  console.log(
    `est length of curve (c3): ${calcLSystemLength(instructions, segmentLength)}mm`,
  );
  console.log(
    `est time of curve (c3): ${hms(calcLSystemLength(instructions, segmentTime))}`,
  );
  
  await printer
  .to({
    x: printer.maxx * 0.35,
    y: printer.maxy * 0.15,
    z: layerThick,
    note: "g7",
  })
  .travel();
  
  // printer.turnto(angleMap['+']);
  printer.turnto(45);
  
  // printer.turnto(60);
  
  let i = 0;
  const drawingCommands = instructions.match(/[FA+-]/g);

  //   await printer.unretract();

  lp.mainloop(async () => {
    
    if (i < drawingCommands.length) {
      const char = drawingCommands[i];
      switch (char) {
        case 'F':
        case 'A':
        const [note, duration] = notes.next();
        // console.log(nn);
        if (note == "-" || note == "0") {
          await printer.wait(duration);
          // console.log("done waiting");
          return;
        }
        
        printer.speed(note);
        
        await printer.drawtime(duration);
        break;
        
        case '+':
        case '-':
        if (angleMap[char] !== undefined) {
          // Apply bespoke angles mapped to this character
          await printer.turn(angleMap[char]);
        }
        break;
      }
      // Characters 'A' and 'B' are ignored during the drawing phase,
      // as they are only used for the geometric substitution rules.
      
      // get progress
      
      const now = performance.now();
      const delta = now - lastCall;
      
      //console.log(`timeline progress at ${event.progress}`);
      document.getElementById("points-txt").innerText = i;
      document.getElementById("progress-txt").innerText = (
        (100 * i) /
        (instructions.length - 1)
      ).toFixed(2);
      document.getElementById("time-txt").innerText =
      `${(printer.time / 1000).toFixed(2)} / ${hms(printer.time)}`;
      i++;
    } else {
      await printer.bail();
      console.log("FINISHED!");
    }
  });
});
