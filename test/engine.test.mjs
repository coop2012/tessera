// Builds every model in test/models with the real OpenCascade kernel and checks for errors and overlaps.
import fs from "node:fs";
import { createRequire } from "node:module";
import { initEngine, runModel, stlBlob, stepBlob } from "../src/engine.js";

const require = createRequire(import.meta.url);
const wasmPath = require.resolve("replicad-opencascadejs/package.json").replace("package.json", "dist/replicad_single.wasm");
await initEngine(fs.readFileSync(wasmPath));

let failed = 0;
const only = process.argv[2];
for (const f of fs.readdirSync(new URL("../library", import.meta.url)).filter((x) => x.endsWith(".js") && (!only || x.includes(only)))) {
  const code = fs.readFileSync(new URL(`../library/${f}`, import.meta.url), "utf8");
  try {
    const res = runModel(code, { wall: 2, clearance: 0.3, bed: [256, 256, 256], nozzle: 0.4, material: "PETG" });
    const printable = res.parts.filter((p) => p.printable);
    for (const p of printable) if (!(stlBlob(p).size > 84)) throw new Error(`empty STL for ${p.name}`);
    if (!(stepBlob(res.parts).size > 1000)) throw new Error("empty STEP");
    if (res.clashes.length) throw new Error("overlaps: " + JSON.stringify(res.clashes));
    console.log(`ok   ${f.padEnd(26)} ${res.report.length} bodies, ${res.ms} ms  ${res.report.map((x) => x.name + ' ' + x.size_mm.join('x') + ' z' + x.min_mm[2]).join(' | ')}`);
  } catch (e) { failed++; console.log(`FAIL ${f}: ${e.message}`); }
}
process.exit(failed ? 1 : 0);
