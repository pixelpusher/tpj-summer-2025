
global notes = new seq('100hz', '200hz', '400hz', '600hz');
   
# prime | fan 10 | mov2 x:lp.cx y:60 speed:50 z:0.13 | unretract | turnto 0 | fan 10

global el = 0.35;
global maxZ = 5;
global ctr = 0;

lp.speed(notes.next());

global drawSpiral = async () => {

  if (lp.z > maxZ) {
    # bail
    info("FINISHED");
  }

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

//start it
lp.mainloop(drawSpiral);
