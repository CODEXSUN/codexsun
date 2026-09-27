import assert from "node:assert/strict";
import test from "node:test";
import { BrowserTools } from "./browser-tools.js";

test("browser tools expose the complete controlled browser contract", () => {
  const tools = new BrowserTools(process.cwd());
  assert.deepEqual(tools.capabilities().tools, [
    "browser.open",
    "browser.navigate",
    "browser.click",
    "browser.type",
    "browser.select",
    "browser.screenshot",
    "browser.console",
    "browser.network",
    "browser.inspect",
  ]);
});

test("browser navigation requires an HTTP or HTTPS URL and an open session", async () => {
  const tools = new BrowserTools(process.cwd());
  await assert.rejects(tools.navigate("file:///package.json"), /Browser is not open/u);
  await assert.rejects(tools.open("javascript:alert(1)"), /http and https/u);
  await tools.close();
});
