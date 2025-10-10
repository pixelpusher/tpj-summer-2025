import "./style.css";

import {
  presets,
  iterator,
  timeline,
  maxX,
  maxY,
  maxZ,
  minX,
  minY,
  minZ,
  onProgress,
  pi,
  cos,
  sin,
} from "gridlib";

import { LivePrinter } from "liveprinter-core";
import { makeVisualiser } from "vizlib";
(async () => {
  const lp = new LivePrinter();
  globalThis.lp = lp;
  const gcode = [];

  let printer = lp;
  let sides = 16;
  let points = sides;
  let circumference = "16b";
  let cx = printer.cx - 30;
  let cy = printer.cy - 60;
  let minz = 0.2;
  let layerThick = 0.22;
  let bpm = 125;
  let note = "g4";

  const visualiser = makeVisualiser(printer, "viz", {
    title: "gridlib",
    delay: 1,
  });

  document
    .getElementById("gcode-btn")
    .addEventListener("click", visualiser.downloadGCode);

  visualiser.setZoom(0.2);
  visualiser.setViewX(0.02);
  visualiser.setViewY(0.2);
  visualiser.closeFactor(110);

  printer.interval("1/2b");
  printer.bpm(bpm);

  let lastCall = performance.now();

  // get progress
  const progressListener = (event) => {
    const now = performance.now();
    const delta = now - lastCall;
    if (delta < 100) {
      return; // skip if called too soon
    }
    lastCall = now;
    switch (event.type) {
      case "shape":
        break;
      case "timeline":
        if (event.progress) {
          //console.log(`timeline progress at ${event.progress}`);
          document.getElementById("timeline-progress").innerText =
            event.progress;
        } else if (event.crossfade) {
          //console.log(`timeline CROSSFADE progress at ${event.crossfade}`);
          document.getElementById("timeline-fadeout").innerText =
            event.crossfade;
        }
        break;
    }
    // console.info(event);
  };

  onProgress(progressListener);

  //******** RUN THE MAIN LOOP************************************

  //console.table({ x: lp.x, y: lp.y, z: lp.z });

  //await printer.prime();

  await printer.mov2({ x: lp.cx, y: lp.cy, speed: 80, z: 0.13 });

  await printer.unretract();

  let iters = 0;

  async function drawSpiral() {

    lp.elev(0.1);

    const smallL = lp.n2mm(note, "1/2b", bpm);

    const steps = 50; // 64 steps to 2pi or a full rotation
    const baseAngle = pi / (steps / 2);

    const theta = 3 * pi / 7;

    const bigL = lp.n2mm(note, "3/2b", bpm);

    const bigL2 =
      bigL * (0.5 + 0.5 * cos(0.25 * iters / steps) + 0.5 * sin(0.5 * iters / steps));

    iters++;

    lp.turn(theta, true);
    await lp.draw(bigL2);

    lp.turn(-theta, true);
    await lp.draw(smallL);

    lp.turn(theta + pi, true);
    await lp.draw(bigL2 * 2);

    lp.turn(-theta - pi, true);
    await lp.draw(smallL);

    lp.turn(theta, true);
    await lp.draw(bigL2);

    lp.turn(-theta, true);

    lp.turn(baseAngle, true);

    await lp.draw(0.5 * smallL);
  }

  lp.mainloop(async () => {
    while (lp.z < 5) {
      lp.elev(0.1);

      await drawSpiral();
    }

    await printer.bail();
    console.log("FINISHED!");
  });
})();
