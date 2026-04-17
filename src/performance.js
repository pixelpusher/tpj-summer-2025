 
 # bail
 
delay(false);
 
let iters = 0;

const note = '400hz';
const bpm = 120;
 
# mov2 x:lp.cx y:60 z:0.2 speed:80
   
# unretract | thick 0.2 | turnto 90
 
  async function drawSpiral() {
 
    lp.bpm(bpm); 
    lp.speed(note);
 
    lp.elev(0.2);
 
    const smallL = lp.t2mm("1/2b");
    const steps = 8 * 4; 
    const baseAngle = 2 * pi / steps;
    const theta = 3 * pi / 7;
    const bigL = lp.t2mm("3/2b");
    const bigL2 =
      bigL * (0.5 + 0.5 * cos(0.125 * iters / steps) + 0.5 * sin(0.25 * iters / steps));
 
    iters++;
 
    // +
    lp.turn(theta, true);
    await lp.draw(smallL);
     //-
    lp.turn(-theta, true);
    //s
    await lp.draw(smallL);
    
    //+pi
    lp.turn(theta + pi, true);
    //b
    await lp.draw(bigL2);
    //-pi
    lp.turn(-theta - pi, true);
    //s
    await lp.draw(smallL);
 
    //+
    lp.turn(theta, true);
    //b
    await lp.draw(bigL2);
    
    //-
    lp.turn(-theta, true);
    //s
    await lp.draw(smallL);
    //a
    lp.turn(baseAngle, true);
    //s
    await lp.draw(smallL);
  }
 
 
  lp.mainloop(async () => {
    while (lp.z < 5) {
      lp.elev(0.1);
      await drawSpiral();
      updateGUI();
    }
 
    await printer.bail();
    console.log("FINISHED!");
  });