import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { BrowserPage } from "./tconnect-negotiation-browser.mjs";

export async function checkPublicPages(control, port, origin) {
  const { targetId } = await control.send("Target.createTarget", { url: origin });
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = await BrowserPage.connect(
    targets.find((target) => target.id === targetId).webSocketDebuggerUrl
  );
  await page.send("Page.enable");
  const routes = [
    "/",
    "/categories",
    "/companies",
    "/associations",
    "/community",
    "/register",
    "/register/buyer",
    "/login",
    "/contact",
    "/privacy",
    "/terms"
  ];
  let profile;
  let association;
  for (const width of [1440, 768, 390, 320]) {
    await page.send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: width < 500
    });
    await navigate(page, origin, "/");
    await page.waitFor(
      "document.querySelector('.tc-hero-photo')?.complete&&document.querySelector('.tc-hero-photo')?.naturalWidth>0",
      "hero image"
    );
    await checkWidth(page, `homepage ${width}`);
    await checkNetworkSections(page);
    for (const selector of [".tc-category-panel", ".tc-company"])
      await checkCardRows(page, selector);
    profile ??= await page.evaluate("document.querySelector('.tc-company')?.getAttribute('href')");
    association ??= await page.evaluate(
      "document.querySelector('.tc-association-stack a')?.getAttribute('href')"
    );
    if (width === 1440 || width === 390) {
      await page.screenshot(resolve(`dist/codexsun-tirupur-home-${width}.png`));
      const screenshot = await page.send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false
      });
      await writeFile(
        resolve(`dist/codexsun-tirupur-hero-${width}.png`),
        Buffer.from(screenshot.data, "base64")
      );
    }
    if (width === 1440 && profile) {
      await navigate(page, origin, profile);
      await checkWidth(page, "desktop business profile");
    }
    if (width < 500) {
      await page.evaluate("document.querySelector('.tc-mobile-toggle').click()");
      assert(
        await page.evaluate(
          "document.querySelector('.tc-mobile-toggle').getAttribute('aria-expanded')==='true'"
        )
      );
      await checkWidth(page, `mobile menu ${width}`);
      for (const route of [...routes.slice(1), profile, association].filter(Boolean)) {
        await navigate(page, origin, route);
        await checkWidth(page, `${route} at ${width}`);
        assert.equal(
          await page.evaluate("document.querySelectorAll('h1').length"),
          1,
          `${route} must have one page heading`
        );
      }
      await navigate(page, origin, profile);
      await page.evaluate(
        "[...document.querySelectorAll('button')].find(x=>x.innerText.includes('Send an enquiry')).click()"
      );
      await page.waitFor("document.querySelector('.tc-dialog')!==null", "mobile enquiry dialog");
      await checkWidth(page, `enquiry dialog ${width}`);
      assert(
        await page.evaluate(
          "document.querySelector('.tc-dialog').contains(document.activeElement)"
        ),
        "Dialog receives focus"
      );
      await page.send("Input.dispatchKeyEvent", {
        type: "keyDown",
        key: "Tab",
        code: "Tab",
        windowsVirtualKeyCode: 9,
        modifiers: 8
      });
      await page.send("Input.dispatchKeyEvent", {
        type: "keyUp",
        key: "Tab",
        code: "Tab",
        windowsVirtualKeyCode: 9,
        modifiers: 8
      });
      assert(
        await page.evaluate(
          "document.querySelector('.tc-dialog').contains(document.activeElement)"
        ),
        "Focus stays in dialog"
      );
      await page.send("Input.dispatchKeyEvent", {
        type: "keyDown",
        key: "Escape",
        code: "Escape",
        windowsVirtualKeyCode: 27
      });
      await page.waitFor("document.querySelector('.tc-dialog')===null", "Escape closes enquiry");
    }
    console.info(`BROWSER PASS: public layout at ${width}px, aligned image and card proportions`);
  }
  await navigate(page, origin, "/companies?category=Knitted%20Fabrics");
  assert(await page.evaluate("document.querySelector('select').value==='Knitted Fabrics'"));
  assert((await page.evaluate("document.querySelectorAll('.tc-company').length")) > 0);
  await navigate(page, origin, "/companies?q=zzzz-no-results");
  await page.waitFor(
    "document.body.innerText.includes('No matching businesses yet.')",
    "directory empty state"
  );
  await page.clickText("Clear filters");
  await page.waitFor(
    "document.querySelectorAll('.tc-company').length>0",
    "reset directory filters"
  );
  for (const filename of [
    "textile-hero.webp",
    "textile-collection.webp",
    "industry-collection.webp"
  ]) {
    const response = await fetch(`${origin}/textiles/${filename}`);
    assert(
      response.ok && response.headers.get("content-type")?.includes("image/"),
      `Image ${filename} must load`
    );
  }
  await page.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }]
  });
  await navigate(page, origin, "/");
  await page.waitFor(
    "[...document.querySelectorAll('.tc-network-figure')].every(el=>parseInt(el.querySelector('strong').textContent)===parseInt(el.getAttribute('aria-label')))",
    "reduced-motion final counts"
  );
  await control.send("Target.closeTarget", { targetId });
  page.socket.close();
}

async function navigate(page, origin, route) {
  await page.send("Page.navigate", { url: `${origin}${route}` });
  await page.waitFor(
    `location.pathname===${JSON.stringify(route.split("?")[0])}&&document.querySelector('.tc-footer')!==null&&!document.body.innerText.includes('Opening your next connection')&&document.readyState==='complete'`,
    "loaded public page"
  );
  // Browser navigation can commit after the previous execution context answers once.
  await new Promise((done) => setTimeout(done, 150));
  await page.waitFor(
    "document.querySelector('.tc-footer')!==null&&!document.body.innerText.includes('Opening your next connection')",
    "public content"
  );
  const body = await page.evaluate("document.body.innerText");
  assert(!body.includes("We couldn’t load the network."), `API must load ${route}`);
  assert(!body.includes("Page not found"), `Route must exist ${route}`);
}

async function checkWidth(page, label) {
  assert(
    await page.evaluate("document.documentElement.scrollWidth<=innerWidth"),
    `${label}: horizontal overflow`
  );
}

async function checkCardRows(page, selector) {
  const rows = await page.evaluate(
    `(()=>{const rows={};for(const element of document.querySelectorAll(${JSON.stringify(selector)})){const box=element.getBoundingClientRect();const top=Math.round(box.top);(rows[top]??=[]).push(box.height);}return Object.values(rows);})()`
  );
  for (const heights of rows)
    assert(Math.max(...heights) - Math.min(...heights) < 2, `${selector}: unequal card heights`);
  if (selector === ".tc-category-panel") {
    assert(
      await page.evaluate(
        "[...document.querySelectorAll('.tc-category-visual')].every(el=>Math.abs(el.clientWidth-el.clientHeight)<2)"
      ),
      "Category imagery must remain square"
    );
  }
}

async function checkNetworkSections(page) {
  const expected = await page.evaluate(
    `(async()=>{const companies=(await(await fetch('/api/platform/public/tconnect/company')).json()).data;const associations=(await(await fetch('/api/platform/public/tconnect/association')).json()).data;return [companies.length,associations.length,new Set(companies.map(x=>x.industry)).size,new Set(companies.map(x=>x.city.trim()).filter(Boolean)).size];})()`
  );
  await page.evaluate(
    "document.querySelector('.tc-network-figures').scrollIntoView({block:'center'})"
  );
  await page.waitFor(
    "[...document.querySelectorAll('.tc-network-figure')].every(el=>parseInt(el.querySelector('strong').textContent)===parseInt(el.getAttribute('aria-label')))",
    "animated network counts"
  );
  assert.deepEqual(
    await page.evaluate(
      "[...document.querySelectorAll('.tc-network-figure strong')].map(el=>parseInt(el.textContent))"
    ),
    expected,
    "Counts must match the public API"
  );
  assert.equal(await page.evaluate("document.querySelectorAll('.tc-standard').length"), 4);
  await page.evaluate("document.querySelector('.tc-standards').scrollIntoView({block:'center'})");
  await page.waitFor(
    "document.querySelectorAll('.tc-standard-logo img').length===3&&[...document.querySelectorAll('.tc-standard-logo img')].every(img=>img.complete&&img.naturalWidth>0)",
    "standard logos"
  );
  assert.equal(await page.evaluate("document.querySelectorAll('.tc-iso-reference').length"), 1);
  assert(
    await page.evaluate(
      "new Set([...document.querySelectorAll('.tc-standard-logo')].map(el=>Math.round(el.getBoundingClientRect().height))).size===1"
    ),
    "Standard logo frames must have equal heights"
  );
  assert(
    await page.evaluate(
      "[...document.querySelectorAll('.tc-standard')].every(el=>['global-standards.org','textileexchange.org','www.oeko-tex.com','www.iso.org'].includes(new URL(el.href).hostname))"
    ),
    "Official standards resources"
  );
  assert(
    await page.evaluate(
      "document.querySelector('.tc-standards-note').textContent.includes('does not certify companies')"
    )
  );
  for (const selector of [".tc-enterprise-banner", ".tc-standard"])
    await checkCardRows(page, selector);
  assert(
    await page.evaluate(
      "[...document.querySelectorAll('.tc-enterprise-banner')].every(el=>el.getAttribute('href').startsWith('/companies/'))"
    )
  );
  await page.evaluate("window.scrollTo(0,0)");
}
