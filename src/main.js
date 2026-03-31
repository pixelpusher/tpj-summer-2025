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
} from "gridlib";

import { LivePrinter } from "liveprinter-core";
import { makeVisualiser } from "vizlib";

document.addEventListener('onclick',
async () => {
  console.log("CLICK");
  const lp = new LivePrinter();
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

  // fast fun tiny with 2 rows, 8 gets medium size and crazy
  let presetG6 = presets.genP6({
    printer,
    loop: false,
    amtx: 0.2,
    amty: 0.23,
    minz: 0.12,
    grids: { cols: 4, rows: 8 },
    bpm,
    t: "1/2b",
    rowNote: "d4",
    colNote: "d4",
    beatHeight: "4b",
    layerThick,
  });

  let presetPoly2 = presets.genPoly2({
    printer,
    sides,
    circumference,N
    cx,
    cy,
    minz,
    layerThick,
    amtx: 0.25,
    amtr: 0.18,
    beatHeight: "6b",
    note,
    bpm,
  });

  let presetPoly1 = presets.genPoly1({
    printer,
    sides,
    circumference: "52b",
    cx,
    cy,
    minz: 0,
    layerThick,
    amtx: 0.2,
    amtr: 0.15,
    beatHeight: "5b",
    note,
    bpm,
  });

  const h = lp.n2mm(note, "6b", bpm);
  //const d = 0.25*lp.n2mm(note, circumference, bpm)/pi;
  const d=0;

  let presetGio = presets.makeGiacometti_1({
    printer,
    points:points/2,
    layerThick,
    cx: cx - lp.n2mm('g4', '1b', bpm),
    cy: cy - lp.n2mm('g4', '1/4b', bpm),
    note,
    t: "1/4b",
    bpm,
    minz: h,
    beatHeight: "1b",
  });

  let presetboxy = presets.makeBoxy({
    printer,
    amt: 0.35,
    points: 2,
    note: "g4",
    t: "3/2b",
    cx: cx - lp.n2mm('g4', '3b', bpm),
    cy: cy - lp.n2mm('g4', '1b', bpm),
    beatHeight: "2b",
    layerThick,
    loop: true,
    minz: 0.12,
    bpm,
  });

  let it1 = iterator(presetG6);
  it1.name = "presetG6";
  let it2 = iterator(presetPoly2);
  it2.name = "presetPoly2";
  let it3 = iterator(presetPoly1);
  it3.name = "presetPoly1";
  let it4 = iterator(presetGio);
  it4.name = "presetGio";
  let it5 = iterator(presetboxy);
  it5.name = "presetboxy";

  let currentit = it3;

  await printer.thick(0.18);

  //currentit.notes= ['e2','e2','e2','g#3','b3', 'g#3', 'c#2'];

  //currentit.notes = ['c3', 'b3', 'f#3','f#4','c2', 'b4']

  //currentit.notes = ["g4", "g4", "g5"];

  // let events = [
  //   { it: it3, layers: 40, fadeout: 32 },
  //   { it: it2, layers: 55, fadeout: 32 },
  //   { it: it5, layers: 40, fadeout: 32 },
  //   { it: it4, layers: null, fadeout: null },
  // ];


  let events = [
    { it: it3, layers: 30, fadeout: 20 },
    { it: it2, layers: 40, fadeout: 10 },
    { it: it5, layers: 70, fadeout: 20 },
    { it: it4, layers: null, fadeout: null },
  ];

  const itInfo = events.map((v, i) => {
    const it = v.it;
    const layerTime = (it.layertime * v.layers) / 1000;
    const fadeTime = (it.layertime * v.fadeout) / 1000;
    const layerHrs = Math.floor(layerTime / 3600);
    const layerMins = Math.floor(((layerTime - layerHrs * 3600) % 3600) / 60);
    const layerSecs = layerTime - layerHrs * 3600 - layerMins * 60;

    return {
      name: it.name,
      layers: v.layers,
      fadeout: v.fadeout,
      layerTime,
      fadeTime,
      layerHrs,
      layerMins,
      layerSecs,
    };
  });

  console.table(itInfo);

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

  //await printer.prime();

  //console.table({ x: lp.x, y: lp.y, z: lp.z });

  await printer.mov2({ x: lp.cx, y: lp.cy, speed: 80, z: 0.13 });

  //console.table({ x: lp.x, y: lp.y, z: lp.z });

  await printer.speed(50);
  await printer.mov2(currentit.next());

  //await printer.unretract();

  lp.mainloop(async () => {
    await timeline(events);
    console.log("FINISHED!");

    await printer.bail();
  });
});
