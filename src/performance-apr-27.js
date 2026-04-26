 
delay(true);
 
# start | interval '1/4b'
 
# temp 220 | bed 68

# sync
   
# prime

# speed 'c4' | drawtime '4b' | turn 90 | speed 80 | up 0.2 

# mov2 x:lp.cx y:lp.cy z:0.13 speed:250

//
//
//----------- LET'S MAKE A MELODY TOGETHER -----------------------------------
//
global melody = new seq("c3 c4 [c5 a4] [c4 a5] c3 c4 [g5 e4] [g4 a5]", 8);

// LOWER?
melody.set("c2 c3 [c4 a3] [c3 a4] c2 c3 [g4 e3] [g3 a4]", 8);

let c = 0;
global el = 0.1;

lp.mainloop (async()=> {
  const [s,b] = melody.next();
  
  # speed s
  # drawtime b
  # elev el

  c++;
  
  if (c % melody.length == 0) 
  {
    # turn 90
    c = 0;
  }
  
  updateGUI();
 });
 

//
//----------------------------- AMBIENT POWER LOOPS --------------------------
//


global lit = iterator( 
  presets.makeTriLineTestSlower({
    printer,
    points: 16,
    amt: 0.075, // was 0.15
    note: "E2",
    t: "4b",
    beatHeight: "32b",
    layerThick: 0.2,
    minz: 0.13,
    loop: true,
    bpm: 120
  })
);

lit.notes = ['f3', 'g3', 'c3', 'd3'];

// e minor melodic-ish: e f# g a b c# d 

lit.notes = ['g3','f#3','c#3', 'd3'];

lit.notes = uzu('[e2!2 e3!2 e4!4]',1).map(v=>v[0]);

lit.notes = ['f#4','g4', 'a5'];

# interval '1/8b'

global progListener = ({type, it, note}) => {
  updateGUI();
  info(`playing ${note}`);
  if (it.done) {
    info('AMBIENT POWER DEPLETED');
  }
};
onProgress(progListener); 
offProgress(progListener);
lp.mainloop(async()=>step(lit));


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

global notes = new seq('100hz 200hz');
global el = 0.35; 
global maxZ = 5;
global ctr = 0;
global smallB = '1b';
global bigB = '2b';

// draw sawtooth spiral gear thing
//---------------------------------
global drawSpiral = async () => {
  if (lp.z > maxZ) {
    # bail
    info("FINISHED");
  }

  lp.elev(el);
  lp.speed(notes.next());

  // auto update, makes weird shapes

  const smallL = lp.t2mm(smallB);
  const steps = 8; 
  const baseAngle = 2 * pi / steps;
  const theta = 3 * pi / 7;
  const bigL = lp.t2mm(bigB);
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



//------------- RUN IT -----------

# prime | fan 10 | mov2 x:lp.cx y:60 speed:50 z:0.13 | unretract | turnto 0 | fan 10

setViewXmm(lp.cx);
setViewYmm(130);
setZoom(0.3);
closeFactor(40);
reset();

lp.mainloop(drawSpiral);


//
//--------------------- INFINITE CURVES---------------------

setViewXmm(1.2*lp.cx);
setViewYmm(lp.cy*1.1);
setZoom(0.1);
closeFactor(10);
reset();

global melody = new seq ("c3 c4 a4 c3 c4 g5 e4 a5", 1);

// C Mixolydian CDEFGAB♭C
melody.set("[c5 e5 a5 e5 d5 e5 a5 bb5]",1);

melody.set("[c5 e5 a5 e5 d5 e5 a5 bb5]",1);

// Fmin pent F - Ab - Bb - C - Eb
melody.set('[f4 ab4 f4 bb4 ab4 c4 ab4 eb4]',1);

melody.set('f4 ab4 f4 bb4 ab4 c4 ab4 eb4',1);

melody.set('eb4 ab4 bb4 g4 db4 ab4 f4 eb4',1);

melody.set('f4 ab4 db5 bb4 g4 e4 c4 bb3',1);

melody.set('f4 - db5 bb4 - e4 c4 bb3',1);

melody.set('f4 ab4 c4 bb4',1);

console.log(melody)

# thick 0.25 | down 0.05

melody.set("[c5 e3]",0.5);

// Define the L-System rules for a Hilbert Curve
global hilbertAxiom = "L";
global hilbertRules = {
  L: "-RF+LFL+FR-",
  R: "+LF-RFR-FL+",
};

global hilbert2Rules = {
  "L": "+RFF-LFFL-FFR+",
  "R": "-LF+RFFFFR+FL-",
  "F": "F"
};

global angleMap = {
  "+": 90,
  "-": -90,
};


delay(true);

global commandsIter = makeCommands(hilbertAxiom, hilbert2Rules, 4);

reset();

setViewYmm(lp.cy*1.3)

# bpm 125
# mov2 x:lp.maxx*0.35 y:lp.maxy*0.25 z:0.2 speed:40

# prime | mov2 x:lp.maxx*0.35 y:lp.maxy*0.25 z:0.2 speed:40 | turnto 90 | unretract

lp.mainloop(async () => drawCommands({commandsIter, melody, angleMap}));

# bail 