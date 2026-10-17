import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { BrowserPage, runNegotiationBrowserChecks } from "./tconnect-negotiation-browser.mjs";

assert.equal(
  process.env.CODEXSUN_TCONNECT_LIVE_CHECK,
  "1",
  "Explicit live verification flag required."
);
const publicOrigin = "https://tirupurconnect.com";
const platformOrigin = "https://codexsun.com";
const corporateId = "TIRUPURCONNECT";
const stamp = Date.now().toString(36);
const accounts = ["seller-a", "seller-b", "buyer"].map((kind) => ({
  kind,
  email: `tconnect-live-${stamp}-${kind}@example.invalid`,
  password: `Tc!${randomBytes(24).toString("base64url")}`
}));
class Session {
  cookie = "";
  slot = "";
  async request(method, path, body, expected = 200) {
    console.info(`LIVE step: ${method} ${path}`);
    const response = await fetch(`${platformOrigin}/api/platform${path}`, {
      method,
      headers: {
        Origin: platformOrigin,
        "Content-Type": "application/json",
        ...(this.cookie ? { Cookie: this.cookie, "x-codexsun-session-slot": this.slot } : {})
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(20000)
    });
    const result = await response.json();
    assert.equal(
      response.status,
      expected,
      `${method} ${path}: ${result.error?.message ?? response.status}`
    );
    if (path === "/auth/login" && response.ok) {
      this.cookie = response.headers
        .getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; ");
      this.slot = result.data.sessionSlot;
    }
    return result.data;
  }
  login(account) {
    return this.request("POST", "/auth/login", {
      desk: "tenant",
      corporateId,
      email: account.email,
      password: account.password
    });
  }
}
const sellers = [new Session(), new Session()];
const buyer = new Session();
const companies = [];
const products = [];
const conversations = [];
let requirementUuid;
let enquiryUuid;
const requirement = {
  title: `Live verification ${stamp} — DO NOT TRADE`,
  category: "Cotton jersey",
  description:
    "Test sourcing requirement for deployment verification only. No real order, supplier contact or purchase commitment.",
  quantity: "500 pieces",
  deliveryCity: "Tirupur",
  budget: 70000,
  status: "open"
};
try {
  const context = await (
    await fetch(`${publicOrigin}/api/platform/public/tconnect/registration`)
  ).json();
  assert.equal(
    context.data?.corporateId,
    corporateId,
    "Dedicated tenant must be connected before any live account is created."
  );
  await registerThroughBrowser();
  await sellers[0].login(accounts[0]);
  await sellers[1].login(accounts[1]);
  await buyer.login(accounts[2]);
  for (let index = 0; index < 2; index++) {
    const company = (await sellers[index].request("GET", "/tconnect/company"))[0];
    assert(company);
    const { uuid, ...input } = company;
    const saved = await sellers[index].request("PUT", `/tconnect/company/${uuid}`, {
      ...input,
      tagline: "Live deployment test — no real trading",
      description:
        "Fictional live deployment verification fixture. No business, product or certification claims. This profile will be unpublished after testing.",
      products: "Cotton jersey",
      status: "active"
    });
    companies.push(saved);
    products.push(
      await sellers[index].request("POST", "/tconnect/product", {
        companyUuid: uuid,
        name: `Live verification cotton jersey ${stamp} ${index}`,
        category: "Knitted Fabrics",
        description:
          "Fictional product used to verify the live sourcing workflow. This is not available for sale.",
        price: 125,
        unit: "piece",
        minimumOrder: "500 pieces",
        imageDataUrl: "",
        status: "active"
      })
    );
  }
  const catalog = await buyer.request("GET", `/tconnect/product/search?q=${stamp}`);
  assert.equal(catalog.length, 2);
  const publicCatalog = await (
    await fetch(`${publicOrigin}/api/platform/public/tconnect/product/search?q=${stamp}`)
  ).json();
  assert.equal(publicCatalog.data.length, 2);
  requirementUuid = (await buyer.request("POST", "/tconnect/requirement", requirement)).uuid;
  enquiryUuid = (
    await buyer.request("POST", "/tconnect/inquiry/buyer", {
      companyUuid: companies[0].uuid,
      productUuid: products[0].uuid,
      phone: "0000000000",
      requirement:
        "Live deployment enquiry verification only. Please do not treat this as a real order.",
      quantity: "500 pieces",
      consent: true
    })
  ).uuid;
  assert(
    (await buyer.request("GET", "/tconnect/inquiry/sent")).some((row) => row.uuid === enquiryUuid)
  );
  assert(
    (await sellers[0].request("GET", "/tconnect/inquiry")).some(
      (row) => row.uuid === enquiryUuid && row.canReply
    )
  );
  assert(
    !(await sellers[1].request("GET", "/tconnect/inquiry")).some((row) => row.uuid === enquiryUuid)
  );
  const quotes = [];
  const quoteInput = {
    quantity: 500,
    unit: "piece",
    unitPrice: 120.25,
    taxPercent: 5,
    shipping: 1000,
    deliveryDays: 12,
    validUntil: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    paymentTerms: "Test quotation only. No payment due.",
    notes: "Live verification fixture. No commercial commitment."
  };
  for (let index = 0; index < 2; index++) {
    const conversation = await sellers[index].request("POST", "/tconnect/conversation", {
      requirementUuid,
      inquiryUuid: null
    });
    conversations.push(conversation.uuid);
    const created = await sellers[index].request("POST", "/tconnect/quotation", {
      ...quoteInput,
      conversationUuid: conversation.uuid,
      ...(index ? { unitPrice: 125, shipping: 0 } : {})
    });
    quotes.push(
      (await sellers[index].request("GET", "/tconnect/quotation")).find(
        (row) => row.uuid === created.uuid
      )
    );
  }
  assert.equal(quotes[0].total, 64131.25);
  assert.equal(quotes[1].total, 65625);
  const offers = await buyer.request("GET", "/tconnect/quotation");
  assert(quotes.every((quote) => offers.some((row) => row.uuid === quote.uuid)));
  await sellers[1].request("GET", `/tconnect/conversation/${conversations[0]}`, undefined, 403);
  const enquiryConversation = await sellers[0].request("POST", "/tconnect/conversation", {
    requirementUuid: null,
    inquiryUuid: enquiryUuid
  });
  conversations.push(enquiryConversation.uuid);
  const enquiryQuote = await sellers[0].request("POST", "/tconnect/quotation", {
    ...quoteInput,
    conversationUuid: enquiryConversation.uuid
  });
  assert(
    (await buyer.request("GET", "/tconnect/quotation")).some(
      (row) => row.uuid === enquiryQuote.uuid && row.inquiryUuid === enquiryUuid
    )
  );
  await sellers[0].request("POST", `/tconnect/conversation/${enquiryConversation.uuid}/messages`, {
    body: "Live seller verification reply. No real order."
  });
  await buyer.request("POST", `/tconnect/conversation/${enquiryConversation.uuid}/messages`, {
    body: "Live buyer verification reply received. No real order."
  });
  const history = await sellers[0].request(
    "GET",
    `/tconnect/conversation/${enquiryConversation.uuid}/messages`
  );
  assert.equal(history.messages.length, 2);
  console.info(
    "LIVE API PASS: registrations, signed-session login, product search, buyer enquiry and recipient isolation, requirement/enquiry quotations, exact totals, comparison data and two-way messages."
  );
  await runNegotiationBrowserChecks({
    platformOrigin,
    corporateId,
    sellerEmail: accounts[0].email,
    sellerPassword: accounts[0].password,
    buyerEmail: accounts[2].email,
    buyerPassword: accounts[2].password,
    requirementTitle: requirement.title,
    quoteUuids: quotes.map((row) => row.uuid),
    sellerName: companies[0].name
  });
  console.info(
    "LIVE BROWSER PASS: seller/buyer login, seller quotation form, buyer comparison and private replies on codexsun.com."
  );
} finally {
  if (requirementUuid)
    await buyer
      .request("PUT", `/tconnect/requirement/${requirementUuid}`, {
        ...requirement,
        status: "closed"
      })
      .catch(() => {});
  if (enquiryUuid)
    await sellers[0]
      .request("PUT", `/tconnect/inquiry/${enquiryUuid}`, { status: "closed" })
      .catch(() => {});
  for (let index = 0; index < companies.length; index++) {
    const quotes = await sellers[index].request("GET", "/tconnect/quotation").catch(() => []);
    for (const quote of quotes.filter(
      (row) => conversations.includes(row.conversationUuid) && row.status === "sent"
    ))
      await sellers[index]
        .request("PUT", `/tconnect/quotation/${quote.uuid}/withdraw`, {})
        .catch(() => {});
    if (products[index]) {
      const { uuid, ...input } = products[index];
      await sellers[index]
        .request("PUT", `/tconnect/product/${uuid}`, { ...input, status: "inactive" })
        .catch(() => {});
    }
    const { uuid, ...input } = companies[index];
    await sellers[index]
      .request("PUT", `/tconnect/company/${uuid}`, { ...input, status: "inactive" })
      .catch(() => {});
  }
  for (const session of [...sellers, buyer])
    if (session.cookie)
      await session.request("POST", "/auth/logout", { desk: "tenant" }).catch(() => {});
  console.info(
    `Live fixture ${stamp}: test companies/products unpublished, requirement/enquiry closed and quotations withdrawn. Private account/history records retained.`
  );
}

async function registerThroughBrowser() {
  const directory = resolve(`dist/.cache/codexsun-tconnect-live-${stamp}`);
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
  let control;
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
    for (const account of accounts) {
      const isBuyer = account.kind === "buyer";
      const { targetId } = await control.send("Target.createTarget", {
        url: `${publicOrigin}/register${isBuyer ? "/buyer" : ""}`
      });
      const target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(
        (row) => row.id === targetId
      );
      const page = await BrowserPage.connect(target.webSocketDebuggerUrl);
      await page.send("Page.enable");
      await page.send("Emulation.setDeviceMetricsOverride", {
        width: 390,
        height: 1000,
        deviceScaleFactor: 1,
        mobile: true
      });
      await page.waitFor(
        "document.querySelector('[name=password]')!==null&&!document.querySelector('.tc-register-form button').disabled",
        "live registration form"
      );
      await page.fill({
        name: "Live Verification Only",
        email: account.email,
        password: account.password,
        companyName: `Live Verification ${account.kind} ${stamp}`,
        businessName: `Live Verification Buyer ${stamp}`,
        industry: "Textiles & Apparel",
        city: "Tirupur",
        phone: "0000000000"
      });
      await page.evaluate("document.querySelector('[name=consent]').click()");
      await page.submitField("password");
      await page.waitFor(
        "document.querySelector('.tc-registration-success')!==null",
        "live registration success"
      );
      assert(
        await page.evaluate(
          "document.querySelector('.tc-registration-success a').href.startsWith('https://codexsun.com/login')"
        )
      );
      assert(await page.evaluate("document.documentElement.scrollWidth<=innerWidth"));
      await page.screenshot(resolve(`dist/tconnect-live-registration-${account.kind}.png`));
      page.socket.close();
    }
    console.info(
      "LIVE BROWSER PASS: buyer and seller registration on tirupurconnect.com, mobile fit and codexsun.com sign-in links."
    );
  } finally {
    if (control) {
      await control.send("Browser.close").catch(() => {});
      control.socket.close();
    }
    chrome.kill();
  }
}
