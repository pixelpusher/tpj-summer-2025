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
import { initSound } from "./sound.js";
import { default as seq } from "./Sequence.js";

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

  let noteLength = "1/8b";
  let cx = printer.cx;
  let cy = printer.cy;
  let layerThick = 0.18;
  let bpm = 125;
  globalThis.notes = new seq(["g2", "a#4", "b3", "e3"]);
  globalThis.useTime = false;


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
  printer.speed(notes.next());

  let lastCall = performance.now();

  //******** RUN THE MAIN LOOP************************************

  const config = {};
  const math = create(all, config);

  const resolution = Math.PI / 90; // try 48 too
  const mint = 0;
  const maxt = 16 * Math.PI * 2;

  const scope = {
    r: 1,
    m: 0.35,
    n: 0.34,
    a: 11,
    b: maxt * 2,
  };

  //   const ftx =
  //     "((r-m) * cos(t) - m*sin(a*t) - n*0.1*cos(3*a*t))*(sin(t/b) - cos(t/b))";
  //   const fty =
  //     "((r-n) * sin(t) - n*cos(a*t) - m*0.1*sin(3*a*t))*(sin(t/b) + cos(t/b))";

  const ftx = "((r-m) * cos(t) - m*sin(a*t) - m*0.1*cos(3*a*t))";
  const fty = "((r-n) * sin(t) - n*cos(a*t) - n*0.1*sin(3*a*t))";

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

  console.log(notes.next());

 const r = lp.t2mm("48b")/Math.PI;
 console.log(`r=${r}`);

  await printer.to({
    x: printer.cx + r * fx.evaluate({ t: 0, ...scope }),
    y: printer.cy + r * fy.evaluate({ t: 0, ...scope }),
    z: layerThick,
    note: "g7",
  }).travel();

  //   await printer.unretract();

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

    let i = 0;

    while (i < tValues.length) {
        const t = tValues[i];
      const nn = notes.next();
      if (nn == '-' || nn == '0') {
        await printer.wait(noteLength);
        console.log(nn);

        continue;
      }
      

      printer.speed(nn);
      const pos = {
        x: printer.cx + 20 * fx.evaluate({ t, ...scope }),
        y: printer.cy + 20 * fy.evaluate({ t, ...scope }),
        z: Math.max(layerThick, (layerThick * t) / (Math.PI * 2) - layerThick),
        t: useTime ? ((t < 2 * maxt) ? "1/2b" : noteLength) : undefined, // first two layers slow
        note: useTime ? undefined : nn 
        
      };
      
      // get progress

      const now = performance.now();
      const delta = now - lastCall;

      //console.log(`timeline progress at ${event.progress}`);
      document.getElementById("points-txt").innerText = t;
      document.getElementById("progress-txt").innerText = (
        (100 * t) /
        (tValues.length - 1)
      ).toFixed(2);
      document.getElementById("time-txt").innerText =
        `${(printer.time / 1000).toFixed(2)} / ${hms(printer.time)}`;

      await printer.to(pos).draw();
      i++;
    }

    await printer.bail();
    console.log("FINISHED!");

  });
});
