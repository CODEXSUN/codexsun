import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { BrowserPage } from "./tconnect-negotiation-browser.mjs";
import { checkDiscovery } from "./tconnect-public-browser.mjs";

const origin = "http://127.0.0.1:7040";
const directory = resolve(`dist/.cache/tconnect-discovery-${Date.now()}`);
await mkdir(directory, { recursive: true });
const browser = spawn(
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  [
    "--headless",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--user-data-dir=${directory}`,
    "--remote-debugging-port=0",
    "about:blank"
  ],
  { windowsHide: true, stdio: "ignore" }
);
let control;
let page;
try {
  let port;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      port = Number((await readFile(`${directory}/DevToolsActivePort`, "utf8")).split("\n")[0]);
    } catch {}
    if (port) break;
    await new Promise((done) => setTimeout(done, 100));
  }
  assert(port);
  const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  control = await BrowserPage.connect(version.webSocketDebuggerUrl);
  const { targetId } = await control.send("Target.createTarget", { url: "about:blank" });
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  page = await BrowserPage.connect(
    targets.find((target) => target.id === targetId).webSocketDebuggerUrl
  );
  page.socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown")
      console.error(
        "Public page runtime error:",
        message.params.exceptionDetails.exception?.description ??
          message.params.exceptionDetails.text
      );
  });
  await page.send("Runtime.enable");
  await page.send("Page.enable");
  await page.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 900,
    deviceScaleFactor: 1,
    mobile: true
  });
  const associations = await (
    await fetch(`${origin}/api/platform/public/tconnect/association`)
  ).json();
  assert(associations.data.length);
  await checkDiscovery(page, origin, `/associations/${associations.data[0].slug}`);
  const contact = await (await fetch(`${origin}/contact`)).text();
  assert(contact.includes("Contact Tirupur Connect | Tirupur Connect"));
  assert(contact.includes('rel="canonical" href="https://tirupurconnect.com/contact"'));
  console.info("BROWSER PASS: server-delivered page metadata and canonical URL");
} finally {
  if (control) await control.send("Browser.close").catch(() => {});
  page?.socket.close();
  control?.socket.close();
  browser.kill();
}
