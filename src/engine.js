// CAD engine: OpenCascade (via replicad) geometry + exports. Shared by the browser bundle and the Node test.
import * as R from "replicad";
import ocFactory from "replicad-opencascadejs";

let ready = null;

export function initEngine(wasmBinary) {
  if (!ready) {
    ready = ocFactory({
      instantiateWasm(imports, done) {
        WebAssembly.instantiate(wasmBinary, imports).then((r) => done(r.instance, r.module));
        return {};
      },
    }).then((oc) => {
      R.setOC(oc);
      return true;
    });
  }
  return ready;
}

const PALETTE = ["#2a2a2a", "#c8c8c6", "#77777a", "#e8e8e6", "#4d4d4f", "#a5a5a3"];

function normalize(out) {
  if (!out) throw new Error("main() returned nothing. Return a shape or an array of {name, shape, color, printable}.");
  const list = Array.isArray(out) ? out : [out];
  return list.map((p, i) => {
    const isShape = p && typeof p.mesh === "function";
    const part = isShape ? { shape: p } : p;
    if (!part || !part.shape || typeof part.shape.mesh !== "function") {
      throw new Error(`Item ${i} is not a 3D shape. Each item must be {name, shape, color?, printable?} where shape is a replicad solid.`);
    }
    return {
      name: String(part.name || `part_${i + 1}`).replace(/[^\w\- ]+/g, "").trim() || `part_${i + 1}`,
      shape: part.shape,
      color: part.color || PALETTE[i % PALETTE.length],
      printable: part.printable !== false,
      reference: part.printable === false,
    };
  });
}

/** Run model source. The code must define `function main(r, p)` (r = replicad, p = params). */
export function runModel(code, params = {}) {
  // eslint-disable-next-line no-new-func
  const factory = new Function("r", "p", `"use strict";\n${code}\n;if (typeof main !== "function") throw new Error("Define function main(r, p)."); return main;`);
  return runMain(factory(R, params), params);
}

/** Browser path: compile via new Function, or via a blob module when the page's CSP blocks eval. */
export async function compileModel(code) {
  const body = `${code}\n;if (typeof main !== "function") throw new Error("Define function main(r, p)."); return main;`;
  try {
    // eslint-disable-next-line no-new-func
    return new Function("r", "p", `"use strict";\n${body}`)();
  } catch (e) {
    if (!(e instanceof EvalError) && !/unsafe-eval|Content Security/i.test(String(e))) throw e;
    const url = URL.createObjectURL(new Blob([`export default (function(){${body}})();`], { type: "text/javascript" }));
    try { return (await import(/* @vite-ignore */ url)).default; } finally { URL.revokeObjectURL(url); }
  }
}

export function runMain(main, params = {}) {
  const t0 = Date.now();
  const parts = normalize(main(R, params));
  const report = parts.map((part) => {
    const bb = part.shape.boundingBox;
    const [[x0, y0, z0], [x1, y1, z1]] = bb.bounds;
    let volume = null;
    try { volume = R.measureVolume(part.shape); } catch { /* ignore */ }
    return {
      name: part.name,
      printable: part.printable,
      size_mm: [x1 - x0, y1 - y0, z1 - z0].map((v) => +v.toFixed(2)),
      min_mm: [x0, y0, z0].map((v) => +v.toFixed(2)),
      max_mm: [x1, y1, z1].map((v) => +v.toFixed(2)),
      volume_cm3: volume == null ? null : +(volume / 1000).toFixed(2),
    };
  });
  // Interference check between printable parts and reference parts (e.g. a board sitting inside a case)
  const clashes = [];
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      const a = report[i], b = report[j];
      const overlapBox = [0, 1, 2].every((k) => a.min_mm[k] < b.max_mm[k] - 0.01 && b.min_mm[k] < a.max_mm[k] - 0.01);
      if (!overlapBox) continue;
      try {
        const inter = parts[i].shape.clone().intersect(parts[j].shape.clone());
        const v = R.measureVolume(inter);
        if (v > 0.5) clashes.push({ between: [a.name, b.name], overlap_mm3: +v.toFixed(1) });
      } catch { /* boolean failed: skip */ }
    }
  }
  return { parts, report, clashes, ms: Date.now() - t0 };
}

export function meshPart(part, fine = false) {
  return part.shape.mesh({ tolerance: fine ? 0.02 : 0.08, angularTolerance: fine ? 8 : 20 });
}

export function stlBlob(part) {
  return part.shape.blobSTL({ tolerance: 0.02, angularTolerance: 8, binary: true });
}

export function stepBlob(parts) {
  return R.exportSTEP(parts.map((p) => ({ shape: p.shape.clone(), name: p.name, color: p.color })));
}

export { R };
