import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHmac } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { env } from "../../apps/platform/api/src/env.ts";
import { TconnectTestSession } from "./tconnect-test-session.ts";
import { BrowserPage } from "./tconnect-negotiation-browser.mjs";
import { checkPublicPages } from "./tconnect-public-browser.mjs";

const pause = (milliseconds) => new Promise((done) => setTimeout(done, milliseconds));
const publicOrigin = `http://127.0.0.1:${process.env.CODEXSUN_TCONNECT_WEB_PORT ?? 7040}`;
const platformOrigin = `http://127.0.0.1:${env.PLATFORM_WEB_PORT}`;
const admin = new TconnectTestSession();
const sellerSession = new TconnectTestSession();
const buyerSession = new TconnectTestSession();
const account = (kind) => ({
  email: `tconnect-browser-${kind}@example.invalid`,
  password: `Tc!${createHmac("sha256", env.JWT_SECRET).update(`codexsun:tconnect:browser:${kind}`).digest("hex")}`
});
const productName = "Browser journey cotton jersey sample";
const directory = resolve(`dist/.cache/codexsun-tconnect-accounts-${Date.now()}`);
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
let port;
let member;
let company;
let product;
let enquiryUuid;

try {
  await admin.login(env.DEFAULT_TENANT_ADMIN_EMAIL, env.DEFAULT_TENANT_ADMIN_PASSWORD);
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      port = Number((await readFile(`${directory}/DevToolsActivePort`, "utf8")).split("\n")[0]);
    } catch {}
    if (port) break;
    await pause(100);
  }
  assert(port, "Chrome must start");
  const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  control = await BrowserPage.connect(version.webSocketDebuggerUrl);
  await checkPublicPages(control, port, publicOrigin);
  const seller = await register("seller");
  member = (await admin.request("GET", "/tconnect/member")).data.find(
    (row) => row.email === account("seller").email
  );
  assert(member);
  assert.equal(
    (
      await admin.request("PUT", `/tconnect/member/${member.uuid}`, {
        membershipStatus: "rejected",
        status: "active"
      })
    ).status,
    200
  );
  await sellerSession.login(account("seller").email, account("seller").password);
  company = (await sellerSession.request("GET", "/tconnect/company")).data[0];
  const { uuid, ...companyInput } = company;
  assert.equal(
    (
      await sellerSession.request("PUT", `/tconnect/company/${uuid}`, {
        ...companyInput,
        status: "active"
      })
    ).status,
    200
  );
  const existing = (await sellerSession.request("GET", "/tconnect/product")).data.find(
    (row) => row.name === productName
  );
  const productInput = {
    companyUuid: uuid,
    name: productName,
    category: "Knitted Fabrics",
    description: "Fictional browser test product: cotton jersey for a local enquiry workflow.",
    price: 240,
    unit: "kg",
    minimumOrder: "100 kg",
    imageDataUrl: "",
    status: "active"
  };
  const saved = await sellerSession.request(
    existing ? "PUT" : "POST",
    `/tconnect/product${existing ? `/${existing.uuid}` : ""}`,
    productInput
  );
  assert.equal(saved.status, 200);
  product = { ...productInput, uuid: existing?.uuid ?? saved.data.uuid };
  await login(seller, "seller");
  const buyer = await register("buyer");
  await login(buyer, "buyer");
  await buyer.evaluate(
    `(()=>{const input=document.querySelector('[aria-label="Search products"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'no-product-zzzz');input.dispatchEvent(new Event('input',{bubbles:true}));})()`
  );
  await buyer.evaluate(
    `document.querySelector('[aria-label="Search products"]').form.requestSubmit()`
  );
  await buyer.waitFor(
    `document.body.innerText.includes('No matching products yet')`,
    "catalog empty state"
  );
  await buyer.evaluate(
    `(()=>{const input=document.querySelector('[aria-label="Search products"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(productName)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`
  );
  await buyer.evaluate(
    `document.querySelector('[aria-label="Search products"]').form.requestSubmit()`
  );
  await buyer.waitFor(
    `document.body.innerText.includes(${JSON.stringify(productName)})`,
    "searched product"
  );
  await buyer.clickText("Send enquiry");
  await buyer.waitFor(`document.querySelector('[name="phone"]')!==null`, "product enquiry form");
  await buyer.fill({ phone: "9999999999" });
  await buyer.evaluate(`document.querySelector('input[type="checkbox"][required]').click()`);
  await buyer.submitField("phone");
  await buyer.waitFor(`document.body.innerText.includes('Enquiry sent.')`, "saved product enquiry");
  await buyer.clickText("Sent enquiries");
  await buyer.waitFor(
    `document.body.innerText.includes(${JSON.stringify(productName)})`,
    "buyer sent enquiry"
  );
  await seller.clickText("Buyer enquiries");
  await seller.waitFor(
    `document.body.innerText.includes(${JSON.stringify(productName)})`,
    "recipient seller inbox"
  );
  await buyerSession.login(account("buyer").email, account("buyer").password);
  const sent = (await buyerSession.request("GET", "/tconnect/inquiry/sent")).data;
  enquiryUuid = sent.find(
    (row) => row.productUuid === product.uuid && row.status !== "closed"
  )?.uuid;
  assert(enquiryUuid, "Saved browser enquiry must link the chosen product");
  console.info(
    "BROWSER PASS: buyer and seller registration, duplicate account errors, signed-session login, product search, product enquiry, buyer tracking and recipient inbox."
  );
} finally {
  if (enquiryUuid)
    await sellerSession.request("PUT", `/tconnect/inquiry/${enquiryUuid}`, { status: "closed" });
  if (product) {
    const { uuid, ...input } = product;
    await sellerSession.request("PUT", `/tconnect/product/${uuid}`, {
      ...input,
      status: "inactive"
    });
  }
  if (company) {
    const { uuid, ...input } = company;
    await admin.request("PUT", `/tconnect/company/${uuid}`, { ...input, status: "inactive" });
  }
  if (member)
    await admin.request("PUT", `/tconnect/member/${member.uuid}`, {
      membershipStatus: "rejected",
      status: "inactive"
    });
  for (const session of [buyerSession, sellerSession, admin])
    await session.request("POST", "/auth/logout", { desk: "tenant" }).catch(() => {});
  if (control) {
    await control.send("Browser.close").catch(() => {});
    control.socket.close();
  } else browser.kill();
  console.info(
    "Browser fixtures retained privately; company, seller and product inactive, completed enquiry closed."
  );
}

async function newPage(url) {
  const { targetId } = await control.send("Target.createTarget", { url });
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = await BrowserPage.connect(
    targets.find((target) => target.id === targetId).webSocketDebuggerUrl
  );
  await page.send("Page.enable");
  await page.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false
  });
  return page;
}

async function register(kind) {
  const path = kind === "buyer" ? "/register/buyer" : "/register";
  const page = await newPage(`${publicOrigin}${path}`);
  async function submit() {
    await page.waitFor(
      `document.querySelector('[name="password"]')!==null&&!document.querySelector('.tc-register-form button').disabled`,
      "ready registration form"
    );
    await page.fill({
      name: "Browser Journey Test",
      email: account(kind).email,
      password: account(kind).password,
      companyName: "Browser Textile Test Studio",
      businessName: "Browser Textile Test Sourcing",
      industry: "Textiles & Apparel",
      city: "Tirupur",
      phone: "9999999999"
    });
    await page.evaluate(`document.querySelector('[name="consent"]').click()`);
    await page.submitField("password");
    await page.waitFor(
      `document.querySelector('.tc-registration-success')!==null||document.querySelector('[role="alert"]')!==null`,
      "registration result"
    );
  }
  await submit();
  if (await page.evaluate(`document.querySelector('.tc-registration-success')!==null`)) {
    await page.send("Page.navigate", { url: `${publicOrigin}${path}` });
    await submit();
  }
  assert(
    await page.evaluate(`document.querySelector('[role="alert"]')!==null`),
    "Duplicate accounts must show an error"
  );
  assert(
    !(await page.evaluate(`document.querySelector('.tc-register-form button').disabled`)),
    "Registration must recover after a duplicate error"
  );
  assert(
    await page.evaluate(
      `document.querySelector('[role="alert"]').textContent.includes('already have an account')`
    ),
    "Duplicate registration must show account recovery guidance"
  );
  console.info(`BROWSER PASS: ${kind} registration form and duplicate-account error`);
  return page;
}

async function login(page, kind) {
  await page.send("Page.navigate", {
    url: `${platformOrigin}/login?app=tconnect${kind === "buyer" ? "&account=buyer" : ""}&corporateId=${encodeURIComponent(env.DEFAULT_TENANT_CORPORATE_ID)}`
  });
  await page.waitFor(
    `document.querySelector('input[type="password"]')!==null&&!document.body.innerText.includes('Checking this workspace')`,
    "login form"
  );
  await page.fill({
    corporateId: env.DEFAULT_TENANT_CORPORATE_ID,
    email: account(kind).email,
    password: "IncorrectBrowserPassword!"
  });
  await page.evaluate(`document.querySelector('button[type="submit"]').click()`);
  await page.waitFor(`document.querySelector('.form-error')!==null`, "invalid login error");
  assert(
    await page.evaluate(`location.pathname==='/login'`),
    "Wrong credentials must not enter the desk"
  );
  await page.fill({ corporateId: env.DEFAULT_TENANT_CORPORATE_ID, ...account(kind) });
  await page.evaluate(`document.querySelector('button[type="submit"]').click()`);
  await page.waitFor(
    `location.pathname==='/app/tconnect/${kind === "buyer" ? "buyer" : "member"}'&&document.body.innerText.includes(${JSON.stringify(kind === "buyer" ? "Discover products. Start a conversation." : "Your company & branding")})`,
    "authenticated desk"
  );
}
