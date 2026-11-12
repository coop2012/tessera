// Builds dist/: the page, the three.js/viewer bundle, the CAD worker bundle and the gzipped OpenCascade kernel.
import { build } from "esbuild";
import fs from "node:fs";
import zlib from "node:zlib";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
fs.mkdirSync("dist", { recursive: true });

await build({ entryPoints: ["src/browser.js"], bundle: true, format: "esm", minify: true, outfile: "dist/cad.js" });
await build({ entryPoints: ["src/worker.js"], bundle: true, format: "esm", minify: true, external: ["node:module"], outfile: "dist/cad-worker.js" });

// The kernel is ~22 MB raw; served gzipped (as .wasm so static hosts serve it) and inflated in the browser.
const wasm = fs.readFileSync(require.resolve("replicad-opencascadejs/package.json").replace("package.json", "dist/replicad_single.wasm"));
fs.writeFileSync("dist/occt-gz.wasm", zlib.gzipSync(wasm, { level: 9 }));

// web/index.html is written for the claude.ai artifact host (which adds the document skeleton).
// For local/static hosting, wrap it in a full document.
const page = fs.readFileSync("web/index.html", "utf8");
fs.writeFileSync("dist/index.html", `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>\n${page}\n</body></html>\n`);
fs.copyFileSync("web/app.js", "dist/app.js");
console.log("dist/ ready:", fs.readdirSync("dist").map((f) => `${f} ${(fs.statSync(`dist/${f}`).size / 1024).toFixed(0)} KB`).join(", "));
