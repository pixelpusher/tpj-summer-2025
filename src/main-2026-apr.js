import { create, all } from "mathjs";

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

function hms(ms) {
  const s = Math.floor(ms / 1000);
  const s_per_m = 60;
  const s_per_h = s_per_m * 60;
  const h = Math.floor(s / s_per_h);
  const h_s = h * s_per_h;
  const m_s = s - h_s;
  const m = Math.floor(m_s / s_per_m);
  const result = `${h}:${m}:${s - m*s_per_m}`;
  return result;
}

(async () => {
  console.log(`6000ms = ${hms(6000)}; 60000ms = ${hms(60000)}`);

  const lp = new LivePrinter();
  globalThis.lp = lp;
  const gcode = [];

  let printer = lp;

  let noteLength = "1/8b";
  let cx = printer.cx;
  let cy = printer.cy;
  let layerThick = 0.18;
  let bpm = 125;
  let note = "g2";


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

  const config = {};
  const math = create(all, config);

  const resolution = 0.05;
  const mint = 0;
  const maxt = 16 * Math.PI * 2;

  const scope = {
    r: 1,
    m: 0.35,
    n: 0.34,
    a: 7,
    b: maxt * 2,
  };

  const ftx =
    "((r-m) * cos(t) - m*sin(a*t) - n*0.1*cos(3*a*t))*(sin(t/b) - cos(t/b))";
  const fty =
    "((r-n) * sin(t) - n*cos(a*t) - m*0.1*sin(3*a*t))*(sin(t/b) + cos(t/b))";

  //   const ftx = "((r-m) * cos(t) - m*sin(a*t) - n*0.1*cos(3*a*t))";
  //   const fty = "((r-n) * sin(t) - n*cos(a*t) - m*0.1*sin(3*a*t))";

  const fx = math.compile(ftx);
  const fy = math.compile(fty);

  const tValues = math.range(mint, maxt, resolution).toArray();

  // const vals = tValues.map(t => ({
  //     x: cx + fx.evaluate({t, ...scope}),
  //     y: cy + fy.evaluate({t, ...scope}),
  //     z: Math.max(layerThick, layerThick*t/(Math.PI*2) - layerThick)
  // }));

  //####------------------------ GOGOGOGOGO

  //console.table({ x: lp.x, y: lp.y, z: lp.z });

  //await printer.prime();

  await printer.moveto({
        x: printer.cx + 20 * fx.evaluate({ t:0, ...scope }),
        y: printer.cy + 20 * fy.evaluate({ t:0, ...scope }),
        z: layerThick
      });


  //   await printer.unretract();

  printer.speed(note);

  lp.mainloop(async () => {
    // await Promise.all(
    //   tValues.map(async (t) => {
    //     const pos = {
    //       x: printer.cx + 10 * fx.evaluate({ t, ...scope }),
    //       y: printer.cy + 10 * fy.evaluate({ t, ...scope }),
    //       z: Math.max(
    //         layerThick,
    //         (layerThick * t) / (t:'1/4b',Math.PI * 2) - layerThick,
    //       ),
    //     };
    //     console.table({ t, ...pos });
    //     await printer.extrudeto(pos);
    //     // await lp.draw();
    //   }),
    // );
    let pointIndex = 0;

    for (const t of tValues) {
      const pos = {
        x: printer.cx + 20 * fx.evaluate({ t, ...scope }),
        y: printer.cy + 20 * fy.evaluate({ t, ...scope }),
        z: Math.max(layerThick, (layerThick * t) / (Math.PI * 2) - layerThick),
        t: (t < 2*maxt) ? "1/2b" : noteLength // first two layers slow
      };
      //   console.table({ t, ...pos });
      printer.to(pos);
      // get progress

      const now = performance.now();
      const delta = now - lastCall;

      //console.log(`timeline progress at ${event.progress}`);
      document.getElementById("points-txt").innerText = pointIndex;
      document.getElementById("progress-txt").innerText = (
        (100 * pointIndex) /
        (tValues.length - 1)
      ).toFixed(2);
      document.getElementById("time-txt").innerText =
        `${(printer.time / 1000).toFixed(2)} / ${hms(printer.time)}`;

      await printer.draw();
      pointIndex++;
    }

    await printer.bail();
    console.log("FINISHED!");
  });
})();
