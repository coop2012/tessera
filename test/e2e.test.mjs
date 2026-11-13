// End-to-end run of the real page with Claude's side scripted (the sample capability only exists inside the Claude viewer).
// Covers: research with web lookup, inferred items + style, build/fix loop, visual review with renders, activity UI.
// Needs Chrome; set CHROME_PATH if it isn't at /usr/bin/google-chrome.
import { spawn } from "node:child_process";
const server = spawn("python3", ["-m", "http.server", "8765", "--directory", "dist"], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 800));
process.on("exit", () => server.kill());
import puppeteer from 'puppeteer-core';
import fs from 'fs';
const v1 = fs.readFileSync('library/cable_organizer.js','utf8'), v2 = fs.readFileSync('library/cable_organizer.js','utf8');
const b = await puppeteer.launch({executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p = await b.newPage(); await p.setViewport({width:1360,height:960});
const errs=[]; p.on('pageerror',e=>errs.push('pageerror '+e.message)); p.on('console',m=>{ if(m.type()==='error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); if(m.text().startsWith('[mock]')) console.log(m.text()); });
await p.evaluateOnNewDocument((v1, v2) => {
  const log = (...a) => console.log('[mock]', ...a), sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const think = async (opts, ms) => { await sleep(ms); };
  const stream = async (opts, text) => { for (let i = 1; i <= 4; i++) { opts.onText?.({ text: text.slice(0, (text.length * i) / 4), delta: '' }); await sleep(250); } };
  const spec = { title: "5-slot desk cable organizer",
    components: [
      { name: "Phone charging cable (USB-C / Lightning / micro-USB)", dims: "Jacket Ø3.0–4.5 mm; connector head ≥ 8 × 6 mm", source: "https://example-cable-specs.test/usb-c", basis: "Measured retail cables", inferred: true },
      { name: "Laptop USB-C power cable", dims: "Jacket Ø4.5–5.0 mm", source: "", basis: "100 W USB-C e-marked cables", inferred: true } ],
    requirements: ["5 cable positions at 18 mm pitch so heads sit side by side", "Seat Ø5.4 mm, throat 3.4 mm: holds 3–5 mm cables, heads can't pull through", "Heavy enough not to slide when a cable is pulled: pockets for steel washers + rubber feet"],
    style: { chosen: "Weighted desk-top block with keyhole slots", why: "Most popular style for desks; works without adhesive and holds the connector heads at the top edge.", alternatives: ["Desk-edge clip", "Adhesive-backed single clips", "Magnetic holder"], sources: ["https://www.printables.com/search/models?q=cable%20organizer"] },
    assumptions: ["Desk-top use; no edge clamp."], hardware: ["4 × 10 × 2 mm rubber feet", "2 × M20 steel washers (optional weight)"] };
  const sample = async () => ({ text: "x", truncated: false });
  sample.limits = async () => ({ maxPromptBytes: 262144, tools: { maxCount: 16 }, images: { maxCount: 8, maxInputBytes: 2e7, mediaTypes: ["image/png"] } });
  sample.json = async (input, opts) => {
    const tool = (n) => opts.tools.find((t) => t.name === n);
    if (input.includes("research step")) {
      log("research prompt lists the library:", input.includes("cable_organizer: 5-slot cable organizer"));
      log('research prompt asks for implied items:', input.includes('IMPLIED ITEMS'), '| style survey:', input.includes('printables.com'));
      await think(opts, 3000);
      await tool("web_search").execute({ query: "USB-C cable outer diameter mm" }, {});
      await think(opts, 2500);
      await tool("web_search").execute({ query: "printables cable organizer desk popular" }, {});
      await stream(opts, JSON.stringify(spec));
      return spec;
    }
    if (input.includes("expert mechanical designer")) {
      log('design prompt has requirements:', input.includes('REQUIREMENTS:'), '| style:', input.includes('CHOSEN STYLE'), '| reference models:', (input.match(/### .*?\((\w+)\)/g) || []).join(' '));
      await think(opts, 3000);
      await tool("run_cad").execute({ code: v1 }, {});
      await stream(opts, '{"code":"..."}');
      return { title: "5-slot desk cable organizer", summary: "Weighted desk block with five snap-in keyhole slots.", code: v1, design_notes: ["Keyhole slots hold cables by the jacket; heads rest on top."], print_notes: ["Print flat side down."], assumptions: [], hardware: [] };
    }
    if (input.includes("reviewing a 3D-printable model")) {
      await think(opts, 2500);
      await tool("run_cad").execute({ code: v2 }, {});
      return { issues_found: ["Square throats will shave the cable jacket — add V lead-ins", "Sharp top edge", "Light block will slide — add weight pockets and feet recesses", "No place to label cables"], code: v2, design_notes: ["V lead-ins guide cables into the 3.4 mm throat.", "Front label grooves under each slot."], print_notes: ["Print upright on its base, no supports.", "Pause at layer ~4 mm to drop in steel washers, or glue them later."], summary: "Weighted desk block with five snap-in slots for 3–5 mm cables, label grooves and pockets for weights and rubber feet." };
    }
    throw { code: "invalid_request", message: "unexpected" };
  };
  const mcp = { listTools: async () => ({ servers: [{ server: "host:claude_browser", tools: [] }] }), callTool: async (s, t) => ({ content: [], payload: t === 'get_page_text' ? 'USB-C cable OD 3.5–4.5 mm' : { ok: true } }) };
  window.claude = { use: async (n) => ({ sample, mcp }[n] ?? null) };
}, v1, v2);
await p.goto('http://localhost:8765/index.html');
await p.waitForFunction(()=>document.getElementById('overlay').hidden,{timeout:120000});
await p.$eval('#instructions', e=>e.value='make a 5 spot cable organizer');
await p.$eval('#parts', e=>e.value='');
await p.click('#designBtn');
await new Promise(r=>setTimeout(r,2000)); await p.screenshot({path:'test/out-activity.png'});
const snap = async () => p.evaluate(()=>({ stage: document.getElementById('actStage').textContent, detail: document.getElementById('actDetail').textContent, time: document.getElementById('actTime').textContent, steps: [...document.querySelectorAll('#actSteps li')].map(l=>l.textContent+':'+(l.className||'todo')).join(' ') }));
for (let i=0;i<8;i++){ console.log(JSON.stringify(await snap())); await new Promise(r=>setTimeout(r,1800)); }
await p.waitForFunction(()=>/Done in/.test(document.getElementById('log').innerText),{timeout:180000});
console.log('after:', JSON.stringify(await snap()), 'activity hidden soon');
await new Promise(r=>setTimeout(r,1500));
console.log('panel hidden:', await p.$eval('#activity', e=>e.hidden));
console.log('--- log ---\n'+await p.$eval('#log', e=>e.innerText));
await p.click('#saveBtn'); await p.waitForFunction(()=>document.getElementById('saveLabel').textContent==='Saved',{timeout:20000});
await p.evaluate(()=>location.hash='#library'); await new Promise(r=>setTimeout(r,600));
console.log('library shows saved design:', await p.$eval('#mineCards', e=>e.innerText.includes('5-slot desk cable organizer')), '| has thumbnail:', await p.$eval('#mineCards', e=>!!e.querySelector('img[src^="data:image"]')));
await p.evaluate(()=>location.hash='#studio');
await p.click('[data-tab="notes"]'); await p.screenshot({path:'test/out-result.png'});
console.log('errors:', errs); await b.close();
process.exitCode = errs.length ? 1 : 0;
server.kill();
