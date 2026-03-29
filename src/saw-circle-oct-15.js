 
# start 
 
 
# temp 220 | bed 70 | thick 0.25 
 
 
# mov2 x:lp.cx y:35 speed:50 z:0.95 | prime 
 
global iters = (() => { 
  let i=0;  
 
  return () => i++; 
})();
 
 
global bpm = 120;

 
global notes = new seq('e4');
 
# fan 10
 

# prime
 
# mov2 x:lp.cx y:60 speed:50 z:0.9 | unretract | turnto 0 | fan 10
  
global el = 0.35;
 
  async function drawSpiral() {
    lp.elev(el);
    lp.bpm(bpm); 
    lp.speed(notes.next());
 
    const smallL = lp.t2mm("1b");
    const steps = 5 * 2; 
    const baseAngle = 2 * pi / steps;
    const theta = 3 * pi / 7;
    const bigL = lp.t2mm("7/4b");
    const bigL2 =
      bigL * (0.5 + 0.5 * cos(0.0125 * iters() / steps) + 0.5 * sin(0.025 * iters() / steps));
 
 
    lp.turn(theta, true);
    await lp.draw(smallL);
 
    lp.turn(-theta, true);
    await lp.draw(smallL);
    
    lp.turn(theta + pi, true);
    await lp.draw(bigL2);
 
    lp.turn(-theta - pi, true);
    await lp.draw(smallL);
 
    lp.turn(theta, true);
    await lp.draw(bigL2);
 
    lp.turn(-theta, true);
 
    await lp.draw(smallL);
    lp.turn(baseAngle, true);
 
    await lp.draw(smallL);
  }
 
 
  lp.mainloop(async () => {
    while (lp.z < maxZ) {
 
 
      await drawSpiral();
      updateGUI();
    }
 
    await printer.bail();
    console.log("FINISHED!");
  });