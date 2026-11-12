// CAD worker: owns OpenCascade, runs model code off the main thread, returns meshes + measurements.
import { initEngine, runMain, compileModel, stlBlob, stepBlob } from "./engine.js";

let parts = null;

function meshOf(part, size) {
  // Tolerance scales with model size so small parts stay crisp and large ones stay light.
  const tol = Math.min(0.15, Math.max(0.01, size / 2500));
  const m = part.shape.mesh({ tolerance: tol, angularTolerance: 10 });
  return {
    name: part.name, color: part.color, printable: part.printable, reference: part.reference,
    vertices: new Float32Array(m.vertices), normals: new Float32Array(m.normals), triangles: new Uint32Array(m.triangles),
  };
}

self.onmessage = async ({ data }) => {
  const { id, type } = data;
  try {
    if (type === "init") {
      await initEngine(data.wasm);
      self.postMessage({ id, ok: true });
    } else if (type === "run") {
      const main = await compileModel(data.code);
      const res = runMain(main, data.params || {});
      parts = res.parts;
      const span = Math.max(...res.report.map((r) => Math.max(...r.size_mm)), 10);
      const meshes = res.parts.map((p) => meshOf(p, span));
      const transfer = meshes.flatMap((m) => [m.vertices.buffer, m.normals.buffer, m.triangles.buffer]);
      self.postMessage({ id, ok: true, result: { report: res.report, clashes: res.clashes, ms: res.ms, meshes } }, transfer);
    } else if (type === "export") {
      if (!parts) throw new Error("Nothing built yet.");
      const stls = [];
      for (const p of parts.filter((x) => x.printable)) stls.push({ name: p.name, buf: await stlBlob(p).arrayBuffer() });
      const step = await stepBlob(parts).arrayBuffer();
      self.postMessage({ id, ok: true, result: { stls, step } }, [...stls.map((s) => s.buf), step]);
    }
  } catch (e) {
    self.postMessage({ id, ok: false, error: String(e?.message || e) });
  }
};
