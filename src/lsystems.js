  global noteLength = "1/4b";
  
  let cx = printer.cx;
  let cy = printer.cy;
  lp.thick(0.18);
  lp.bpm(125);
   
 global melody = new seq (uzu("c3 c4 [c5 a4] [c4 a5] c3 c4 [g5 e4] [g4 a5]", 2));
    
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
  
  
  const commandsIter = instructions.match(/[FA+-]/g).values();

  //   await printer.unretract();

  lp.mainloop(async()=>drawCommands({commandsIter, melody, angleMap}));


/**
 * Draws the L-system instructions by iterating through the commands and executing the corresponding printer actions. It uses the melody to determine the speed of drawing and waiting times.
 * @param {object} params - The parameters for drawing
 * @param {Iterator} params.commandsIter - An Array iterator over the L-system commands
 * @param {seq} params.melody - A sequence of musical notes and durations [(note, duration), ...] that determines the speed and timing of drawing
 * @param {object} params.angleMap - A mapping of command characters (+-)to turn angles
 * @returns {Promise<void>} A promise that resolves when the command is executed
 */
global drawCommands = async function ({commandsIter, melody, angleMap}) {

  const nextCommand = commandsIter.next();
  if (nextCommand.done) {
    info('Finished all commands');
    
    printer.bail();

    return;
  }

  let [note, duration ] = melody.next();

  switch (nextCommand.value) {
    case 'F':
    case 'A':
      info('F or A');
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
      info('+ or_');
    if (angleMap[nextCommand.value] !== undefined) {
      // Apply bespoke angles mapped to this character
      await printer.turn(angleMap[nextCommand.value]);
    }
    break;
  }
}
