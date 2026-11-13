// Renders every library template in the real page (headless Chrome) and writes library/thumbs/<id>.png.
// Run after `npm run build`; then build again to copy the thumbnails into dist/.
import { spawn } from "node:child_process";
import fs from "node:fs";
import puppeteer from "puppeteer-core";

const catalog = JSON.parse(fs.readFileSync("library/catalog.json", "utf8"));
const server = spawn("python3", ["-m", "http.server", "8767", "--directory", "dist"], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 800));
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
  await page.goto("http://localhost:8767/index.html");
  await page.waitForFunction(() => document.getElementById("overlay").hidden, { timeout: 120000 });
  fs.mkdirSync("library/thumbs", { recursive: true });
  for (const t of catalog) {
    const url = await page.evaluate((id) => window.tessera.thumbnail(id), t.id);
    fs.writeFileSync(`library/thumbs/${t.id}.png`, Buffer.from(url.split(",")[1], "base64"));
    console.log("thumb", t.id);
  }
} finally { await browser.close(); server.kill(); }
