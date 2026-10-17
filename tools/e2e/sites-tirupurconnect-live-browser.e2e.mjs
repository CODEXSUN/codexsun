import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { BrowserPage } from "./tconnect-negotiation-browser.mjs";
assert.equal(
  process.env.CODEXSUN_SITES_LIVE_CHECK,
  "1",
  "Explicit live Sites verification flag required."
);
const credentials = JSON.parse(
  await readFile(resolve("dist/.secrets/sites-admin-check.json"), "utf8")
);
const directory = resolve(`dist/.cache/sites-live-publish-${Date.now()}`);
await mkdir(directory, { recursive: true });
const chrome = spawn(
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
let control, page;
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
  control = await BrowserPage.connect(
    (await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()).webSocketDebuggerUrl
  );
  const { targetId } = await control.send("Target.createTarget", {
    url: "https://codexsun.com/login?corporateId=TIRUPURCONNECT&returnTo=%2Fapp%2Fsites%2Foverview"
  });
  const target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(
    (item) => item.id === targetId
  );
  page = await BrowserPage.connect(target.webSocketDebuggerUrl);
  await page.send("Page.enable");
  page.socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (
      message.method === "Page.javascriptDialogOpening" &&
      message.params.message.startsWith("Publish these client details")
    )
      void page.send("Page.handleJavaScriptDialog", { accept: true });
  });
  await page.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false
  });
  await page.waitFor(
    "document.querySelector('input[type=password]')!==null && document.querySelector('[name=corporateId]')!==null && !document.querySelector('button[type=submit]').disabled",
    "Sites sign-in"
  );
  await page.fill({
    corporateId: "TIRUPURCONNECT",
    email: credentials.email,
    password: credentials.password
  });
  await page.evaluate("document.querySelector('button[type=submit]').click()");
  await page.waitFor(
    "location.pathname.startsWith('/app/sites')",
    "TIRUPURCONNECT Sites workspace"
  );
  await page.waitFor(
    "[...document.querySelectorAll('h3')].some(item=>item.textContent==='Tirupur Connect')",
    "Tirupur Connect client"
  );
  await page.evaluate(
    "(()=>{let node=[...document.querySelectorAll('h3')].find(item=>item.textContent==='Tirupur Connect');while(node&&!([...node.querySelectorAll('button')].some(button=>button.textContent.trim()==='Manage')))node=node.parentElement;if(!node)throw Error('Client Manage missing');[...node.querySelectorAll('button')].find(button=>button.textContent.trim()==='Manage').click();})()"
  );
  await page.waitFor(
    "document.body.innerText.includes('Last live version') && document.body.innerText.includes('Version ')",
    "live deployment status"
  );
  await page.clickText("Pages");
  await page.waitFor("[...document.querySelectorAll('button')].some(button=>button.textContent.trim()==='Hero')", "hero section control");
  await page.clickText("Hero");
  await page.waitFor(
    "[...document.querySelectorAll('label')].some(label=>label.textContent.startsWith('Eyebrow'))",
    "editable hero"
  );
  const before = await publicJson();
  const next = "TIRUPUR’S TEXTILE NETWORK · DEMONSTRATION";
  await page.evaluate(
    `(()=>{const input=[...document.querySelectorAll('label')].find(label=>label.textContent.startsWith('Eyebrow')).querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(next)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`
  );
  await page.clickText("Save draft");
  await page.waitFor("document.body.innerText.includes('Draft saved.')", "saved unpublished copy");
  assert.equal((await publicJson()).data.content.hero.eyebrow, before.data.content.hero.eyebrow);
  await page.clickText("Publish page");
  let after;
  for (let attempt = 0; attempt < 35; attempt++) {
    after = await publicJson();
    if (after.meta?.version > before.meta.version) break;
    await new Promise((done) => setTimeout(done, 1000));
  }
  assert(after.meta.version > before.meta.version);
  assert.equal(after.data.content.hero.eyebrow, next);
  await page.waitFor(
    `document.body.innerText.includes('Version ${after.meta.version}') && [...document.querySelectorAll('span')].some(span=>span.textContent==='live')`,
    "latest live version status"
  );
  await page.screenshot(resolve("dist/sites-tirupurconnect-live-publish-desktop.png"));
  await page.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: true
  });
  assert(
    await page.evaluate("document.documentElement.scrollWidth<=innerWidth"),
    "Sites publishing fits mobile"
  );
  await page.screenshot(resolve("dist/sites-tirupurconnect-live-publish-mobile.png"));
  console.info(
    `PASS live Sites browser: TIRUPURCONNECT login, client Manage, content edit, Save draft isolation, Publish button, version ${after.meta.version} live receipt, last-live status and mobile layout. No export or manual deployment used.`
  );
} finally {
  if (control) await control.send("Browser.close").catch(() => {});
  page?.socket.close();
  control?.socket.close();
  chrome.kill();
}
async function publicJson() {
  for (let attempt = 0; ; attempt++) {
    try {
      return await (
        await fetch("https://tirupurconnect.com/__sites-content", { cache: "no-store" })
      ).json();
    } catch (error) {
      if (attempt >= 2) throw error;
    }
  }
}
