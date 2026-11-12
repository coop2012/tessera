// Recovery paths for long, multi-part briefs (the failure seen with a tape-dispenser brief):
//  A) Claude's tool loop ends with no answer (empty_completion) AFTER a successful build -> keep that build.
//  B) The tool loop ends before ANY build succeeded -> direct mode writes code, repairs from the build error.
//  C) "Retry the design" reuses the research instead of redoing it. Also checks the exploded view.
import { spawn } from "node:child_process";
import fs from "node:fs";
import puppeteer from "puppeteer-core";
const server = spawn("python3", ["-m", "http.server", "8766", "--directory", "dist"], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 800));
const tape = fs.readFileSync("test/models/tape_dispenser.js", "utf8");
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage(); await p.setViewport({ width: 1360, height: 960 });
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.text().startsWith("[mock]")) console.log(m.text()); });
await p.evaluateOnNewDocument((tape) => {
  const log = (...a) => console.log("[mock]", ...a);
  window.__mode = "A"; window.__calls = { research: 0, plan: 0, design: 0, direct: 0 };
  const sample = async (input) => {
    if (window.__failDirect) throw { code: "upstream_error", message: "connection dropped" };
    window.__calls.direct++;
    if (window.__calls.direct === 1) return { text: "```js\nfunction main(r){ return r.makeCube(4); }\n```", truncated: false };  // first try is broken
    log("direct mode got the build error in its repair prompt:", input.includes("makeCube"));
    return { text: "```js\n" + tape + "\n```", truncated: false };
  };
  sample.limits = async () => ({ tools: { maxCount: 16 }, images: { maxCount: 8 } });
  sample.json = async (input, opts) => {
    const tool = (n) => opts.tools?.find((t) => t.name === n);
    if (input.includes("research step")) { window.__calls.research++; return { title: "Desktop tape dispenser", components: [{ name: "Scotch Magic Tape 3/4in", dims: "19.05 wide, 25.4 core, 53 OD", source: "https://www.3m.com", basis: "", inferred: false }], requirements: ["roll rotates freely"], style: { chosen: "Weighted monolithic body", why: "stable" }, assumptions: [], hardware: [] }; }
    if (input.includes("planning a 3D-printable design")) { window.__calls.plan++; return { bodies: [{ name: "body" }, { name: "hub" }, { name: "guide_roller" }, { name: "blade_clamp" }], checks: [] }; }
    if (input.includes("expert mechanical designer")) {
      window.__calls.design++;
      log("design prompt has tool budget rule:", input.includes("TOOL BUDGET"), "| asks for no code:", input.includes("no code"));
      if (window.__mode === "A") { await tool("run_cad").execute({ code: tape }, {}); throw { code: "empty_completion", message: "Claude returned no text" }; }
      await tool("run_cad").execute({ code: "function main(r){ return r.nope(); }" }, {}).catch(() => {});
      throw { code: "empty_completion", message: "Claude returned no text" };
    }
    throw { code: "invalid_request", message: "unexpected" };
  };
  window.claude = { use: async (n) => ({ sample, mcp: null }[n] ?? null) };
}, tape);
await p.goto("http://localhost:8766/index.html");
await p.waitForFunction(() => document.getElementById("overlay").hidden, { timeout: 120000 });
await p.$eval("#review", (e) => (e.checked = false));
await p.$eval("#instructions", (e) => (e.value = "Design a fully functional desktop tape dispenser…"));
await p.$eval("#parts", (e) => (e.value = ""));
const waitDone = () => p.waitForFunction(() => !document.getElementById("designBtn").disabled && /Done in|Claude used up|still fails|connection dropped/.test(document.getElementById("log").innerText), { timeout: 180000 });
let ok = true;
// A
await p.click("#designBtn"); await waitDone();
let log = await p.$eval("#log", (e) => e.innerText);
const aOk = /keeping the last model that built/.test(log) && /Done in/.test(log) && (await p.$eval("#bodyRows", (e) => e.innerText)).includes("guide_roller");
console.log("A) empty answer after a good build ->", aOk ? "kept the model" : "FAILED"); ok &&= aOk;
// B
await p.evaluate(() => (window.__mode = "B"));
await p.click("#designBtn"); await waitDone();
log = await p.$eval("#log", (e) => e.innerText);
const bOk = /switching to direct mode/.test(log) && /Built on attempt 2/.test(log) && /Done in/.test(log);
console.log("B) no build before turns ran out ->", bOk ? "direct mode built it after one repair" : "FAILED\n" + log); ok &&= bOk;
// C: force a failure, then retry
await p.evaluate(() => { window.__mode = "B"; window.__failDirect = true; });   // design and direct mode both fail
await p.click("#designBtn"); await waitDone();
const researchBefore = await p.evaluate(() => window.__calls.research);
const hasRetry = !!(await p.$("#retryBtn"));
await p.evaluate(() => { window.__mode = "A"; window.__failDirect = false; });
if (hasRetry) { await p.click("#retryBtn"); await waitDone(); }
const researchAfter = await p.evaluate(() => window.__calls.research);
const cOk = hasRetry && researchAfter === researchBefore && /Done in/.test(await p.$eval("#log", (e) => e.innerText));
console.log("C) retry keeps research ->", cOk ? `yes (research calls stayed at ${researchAfter})` : "FAILED"); ok &&= cOk;
// exploded view
await p.click("#explodeBtn"); await new Promise((r) => setTimeout(r, 700));
await p.screenshot({ path: "test/out-exploded.png" });
await p.click("#explodeBtn"); await new Promise((r) => setTimeout(r, 700));
await p.screenshot({ path: "test/out-assembled.png" });
console.log("page errors:", errs.length ? errs : "none");
await b.close(); server.kill();
process.exit(ok && !errs.length ? 0 : 1);
