 
delay(true);
 
# start | interval '1/4b'
 
# temp 220 | bed 68

# sync
   
# prime

# bail 

# speed 'c4' | drawtime '4b' | turn 90 | speed 80 | up 0.2 

# mov2 x:lp.cx y:lp.cy z:0.13 speed:250

//----------- LET'S MAKE A MELODY TOGETHER -----------------------------------
global melody = new seq(uzu("c3 c4 [c5 a4] [c4 a5] c3 c4 [g5 e4] [g4 a5]", 2));

// LOWER?
melody.set(uzu("c2 c3 [c4 a3] [c3 a4] c2 c3 [g4 e3] [g3 a4]", 2));


let c = 0;
global el = 0.1;

lp.mainloop (async()=> {
  const [s,b] = melody.next();
  
  # speed s
  # drawtime b
  # elev el

  if (c++ % melody.length()) 
  {
    # turn 90
    c = 0;
  }
  
  updateGUI();
 });
 
global chorusNotes = [
    ['e5', '1/2b'], ['e5', '1/2b'], ['d#5', '1/2b'], ['e5', '1/4b'], ['d#5', '1/4b'], 
    ['e5', '1/2b'], ['f#5', '1/2b'], ['g#5', '1b'],
    ['e5', '1/2b'], ['d#5', '1/4b'], ['e5', '1/4b'], ['f#5', '1/2b'], ['g#5', '1b'],['e5', '1/2b'],
    ['e5', '1/2b'], ['e5', '1/2b'],
    ['e5', '1/4b'], ['d#5', '1/4b'], ['e5', '1/2b'], ['f#5', '1/2b'], ['g#5', '1b'],['e5', '1/2b'],
    ['d#5', '1/4b'], ['e5', '1/4b'], ['f#5', '1/2b'],
    ['e5','1/2b'], ['g#5', '1b'], ['f#5', '1/2b'], ['e5', '1b'],  ['e5','1b']  
];
 
global noteseq = new seq(chorusNotes);


 noteseq.set([
    ['e2', '3/4b'], ['d#2', '1/4b'], ['e2', '3/4b'], ['d#2', '1/4b'], ['f#2', '1b'], ['g#2', '3/4b'],  ['f#2', '1/4b'],
 
    ['e2', '3/4b'], ['g#2', '1/4b'], ['a2', '3/4b'], ['b2', '1/4b'], ['c#3', '1b'], ['e2', '3/4b'],  ['f#2', '1/4b'],
 ]);
 
 
noteseq.set( 
 [
    ['e3', '1b'], ['c#3', '1b'], [0,'1/4b'], ['e2', '1/2b'],  [0,'1/4b'], ['c#4', '1/4b'], ['g#2', '1/2b'], ['f#3', '1/2b'],
 ]);
 
 
 noteseq.set([
    ['e5', '3/4b'], ['d#4', '1/4b'],  ['e5', '1/2b'], ['d#4', '1/2b'], ['e4', '1/2b'], ['g#4', '3/4b'],
    ['e5', '1/4b'], ['d#4', '1/2b'], 
 ]); 
 

noteseq.set([
    ['a3', '3/4b'], ['f4', '1/4b'],  ['b2', '1/2b'], ['g3', '1/2b'] 
]);
  
 
  

// 
// ---------------------------- SHEPHARD'S SQUARE -------------------------------------
//

lp.mainloop(async ()=>{
  # turn 90.2 | elev 0.4
  # speed 'c4' | drawtime '2b'
  updateGUI();
})  
 
// 
// ---------------------------- BEAT CIRCLE ------------------------------------------
//

 
# mov2 x:lp.cx y:60 z:0.2 speed:80
   
# unretract | thick 0.2 | turnto 90
 
global bts = 16; 
let bt = 4;
global angle = 360/bts;
 
lp.mainloop(async() => {
  
  # speed melody.next() | elev (bts*0.005) | traveltime beats.next() 
  
  bt -= 1;
 
  if (bt == 0) {
    bt = bts;
 
 
    # turn angle
  }
 
  updateGUI();
});
  
// 
// ---------------------------- SAWTOOTH SPIRALS ------------------------------------------
//
global notes = new seq('100hz', '200hz', '400hz', '600hz');
 
melody.set(['100hz', '1b'], ['200hz', '1b'], ['400hz', '1b'], ['600hz', '1b']); 
 
global bpm = 120;
global maxZ = 15;
global notes = new seq('e4');
 
# fan 10 
 
# prime
 
# bail false

updateGUI()

# mov2 x:lp.cx y:60 speed:50 z:0.13 | unretract | turnto 0 | fan 10

global el = 0.35;
global maxZ = 0.5;
global bpm = 120;
global ctr = 0;

lp.speed(melody.next()[0]);

# speed "100hz"

//------------- DEFINE IT -------------------------------
//
global drawSpiral = async () => {
  lp.elev(el);
  lp.bpm(bpm);
  // auto update, makes weird shapes
  // lp.speed(melody.next()[0]);

  const smallL = lp.t2mm("1b");
  const steps = 5 * 2; 
  const baseAngle = 2 * pi / steps;
  const theta = 3 * pi / 7;
  const bigL = lp.t2mm("7/4b");
  const bigL2 =
    bigL * (0.5 + 0.5 * cos(0.0125 * ctr / steps) + 0.5 * sin(0.025 * ctr / steps));

  lp.turn(theta, true);
  await lp.draw(smallL);
  updateGUI();

  lp.turn(-theta, true);
  await lp.draw(smallL);
  updateGUI();

  lp.turn(theta + pi, true);
  await lp.draw(bigL2);
  updateGUI();

  lp.turn(-theta - pi, true);
  await lp.draw(smallL);
  updateGUI();

  lp.turn(theta, true);
  await lp.draw(bigL2);
  updateGUI();

  lp.turn(-theta, true);
  updateGUI();

  await lp.draw(smallL);
  lp.turn(baseAngle, true);
  updateGUI();

  await lp.draw(smallL);
  updateGUI();

  ctr++;
};

//------------- RUN IT -------------------------------
//
lp.mainloop(async () => {
  if (lp.z < maxZ) {
    await drawSpiral();
    updateGUI();
  }
  else
  {
    # bail
    info("FINISHED");
  }
});


//
//--------------------- INFINITE CURVES---------------------

global melody = new seq (uzu("c3 c4 [c5 a4] [c4 a5] c3 c4 [g5 e4] [g4 a5]", 2));
    
// Define the L-System rules for a Hilbert Curve
global hilbertAxiom = "L";
global hilbertRules = {
  L: "-RF+LFL+FR-",
  R: "+LF-RFR-FL+",
};

global hilbert2Rules = {
  "L": "+RAF-LFAL-FAR+",
  "R": "-LF+RAAAFR+FL-",
  "A": "A"
};

global angleMap = {
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
global iterateLSystem = function(instructions, rules, iterations = 1) {
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
};


global drawCommand = async function ({command, note, angleMap, duration}) {
  switch (command) {
    case 'F':
    case 'A':
      info(`F or A ${note} : ${duration}`);
    if (note == "-" || note == "0") {
      await lp.wait(duration);
      // console.log("done waiting");
      return;
    }
    
    lp.speed(note);
    
    await lp.drawtime(duration);
    break;
    
    case '+':
    case '-':
      info('+ or -');
    if (angleMap[command] !== undefined) {
      // Apply bespoke angles mapped to this character
      await lp.turn(angleMap[command]);
    }
    break;
  }
};

// TEST
// let [note, duration] = melody.next();
// await drawCommand({"command":drawingCommands[5], note, angleMap, duration})
// console.log(drawingCommands.slice(0,20));

const instructions = iterateLSystem(hilbertAxiom, hilbert2Rules, 5);
global drawingCommands = instructions.match(/[FA+-]/g);

setViewXmm(1.2*lp.cx);
setViewYmm(lp.cy*1.1);
setZoom(0.1);
closeFactor(10);
resetScene();

# mov2 x:lp.maxx*0.6 y:lp.maxy*0.4 z:0.2 speed:40 | turnto 45

let i = 0;

lp.mainloop(async () => {
  if (i < drawingCommands.length) {
    let [note, duration] = melody.next();
    await drawCommand({"command":drawingCommands[i], note, angleMap, duration});
    i++;
  }
  else 
  {
    await lp.bail(); 
    console.log('DONE');
    info('FINISHED HILBERTISH');
  }  
});
