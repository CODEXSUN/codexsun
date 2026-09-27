import { mkdir } from "node:fs/promises";
import { isAbsolute, normalize, relative, resolve, sep } from "node:path";
import { chromium, type Browser, type BrowserContext, type ConsoleMessage, type Page } from "playwright";

export type BrowserConsoleEntry = { type: string; text: string; location?: string };
export type BrowserNetworkEntry = { type: "request" | "response" | "failure"; method?: string; url: string; status?: number; error?: string };

type BrowserElementInspection = { selector: string; count: number; visible: boolean; text: string; html: string; attributes: Record<string, string> };

const MAX_ENTRIES = 100;
const MAX_TEXT = 8_000;

export class BrowserTools {
  private browser?: Browser;
  private context?: BrowserContext;
  private page?: Page;
  private readonly consoleEntries: BrowserConsoleEntry[] = [];
  private readonly networkEntries: BrowserNetworkEntry[] = [];

  constructor(private readonly root: string) {}

  capabilities() {
    return {
      root: normalize(resolve(this.root)),
      tools: ["browser.open", "browser.navigate", "browser.click", "browser.type", "browser.select", "browser.screenshot", "browser.console", "browser.network", "browser.inspect"] as const,
    };
  }

  async open(url?: string, headless = true) {
    if (!this.page) {
      this.browser = await chromium.launch({ headless });
      this.context = await this.browser.newContext();
      this.page = await this.context.newPage();
      this.attachObservers(this.page);
    }
    if (url) await this.navigate(url);
    return this.pageInfo();
  }

  async navigate(url: string) {
    const page = this.requirePage();
    assertWebUrl(url);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    return this.pageInfo();
  }

  async click(selector: string) {
    await this.requirePage().locator(selector).first().click({ timeout: 10_000 });
    return this.pageInfo();
  }

  async type(selector: string, text: string) {
    if (text.length > 20_000) throw new Error("Browser input must not exceed 20000 characters.");
    await this.requirePage().locator(selector).first().fill(text, { timeout: 10_000 });
    return { selector, length: text.length };
  }

  async select(selector: string, value: string) {
    const selected = await this.requirePage().locator(selector).first().selectOption(value, { timeout: 10_000 });
    return { selector, selected };
  }

  async screenshot(fileName = `browser-${Date.now()}.png`, fullPage = true) {
    const page = this.requirePage();
    const path = this.artifactPath(fileName);
    await mkdir(resolve(path, ".."), { recursive: true });
    await page.screenshot({ path, fullPage, type: "png" });
    return { path: relative(this.root, path).replaceAll(sep, "/"), url: page.url() };
  }

  console(clear = false) {
    const entries = [...this.consoleEntries];
    if (clear) this.consoleEntries.length = 0;
    return { entries };
  }

  network(clear = false) {
    const entries = [...this.networkEntries];
    if (clear) this.networkEntries.length = 0;
    return { entries };
  }

  async inspect(selector = "body"): Promise<{ url: string; title: string; elements: BrowserElementInspection[] }> {
    const page = this.requirePage();
    const locator = page.locator(selector);
    const count = await locator.count();
    const elements: BrowserElementInspection[] = [];
    for (let index = 0; index < Math.min(count, 20); index += 1) {
      const element = locator.nth(index);
      elements.push({
        selector,
        count,
        visible: await element.isVisible().catch(() => false),
        text: trim(await element.innerText().catch(() => "")),
        html: trim(await element.evaluate((node) => node.outerHTML).catch(() => "")),
        attributes: await element.evaluate((node) => Object.fromEntries([...node.attributes].map((attribute) => [attribute.name, attribute.value]))).catch(() => ({})),
      });
    }
    return { url: page.url(), title: await page.title(), elements };
  }

  async close(): Promise<void> {
    await this.browser?.close();
    this.browser = undefined;
    this.context = undefined;
    this.page = undefined;
  }

  private requirePage(): Page {
    if (!this.page) throw new Error("Browser is not open. Call browser.open first.");
    return this.page;
  }

  private pageInfo() {
    const page = this.requirePage();
    return { url: page.url(), title: page.url() === "about:blank" ? "" : undefined };
  }

  private artifactPath(fileName: string): string {
    const safeName = fileName.trim() || `browser-${Date.now()}.png`;
    if (isAbsolute(safeName) || safeName.includes("..")) throw new Error("Browser artifacts must use a relative file name.");
    const target = normalize(resolve(this.root, "dist", "codeloop", "browser", safeName));
    const relativeTarget = relative(resolve(this.root, "dist", "codeloop", "browser"), target);
    if (relativeTarget === ".." || relativeTarget.startsWith(`..${sep}`) || isAbsolute(relativeTarget)) throw new Error("Browser artifact path is outside the workspace boundary.");
    return target;
  }

  private attachObservers(page: Page): void {
    page.on("console", (message: ConsoleMessage) => pushBounded(this.consoleEntries, { type: message.type(), text: trim(message.text()), location: message.location().url }));
    page.on("request", (request) => pushBounded(this.networkEntries, { type: "request", method: request.method(), url: request.url() }));
    page.on("response", (response) => pushBounded(this.networkEntries, { type: "response", url: response.url(), status: response.status() }));
    page.on("requestfailed", (request) => pushBounded(this.networkEntries, { type: "failure", url: request.url(), error: request.failure()?.errorText }));
  }
}

function assertWebUrl(url: string): void {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error("Browser only supports http and https URLs.");
}

function trim(value: string): string { return value.length > MAX_TEXT ? `${value.slice(0, MAX_TEXT)}…` : value; }
function pushBounded<T>(entries: T[], entry: T): void { entries.push(entry); if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES); }
