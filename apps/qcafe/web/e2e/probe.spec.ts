import { expect, test } from "@playwright/test";

test("probe otp internals", async ({ page }) => {
  const logs: string[] = [];
  page.on("console", (message) => {
    logs.push(`${message.type()}: ${message.text()}`);
  });
  await page.goto("/login");
  await expect(page.getByText("Create the first four-digit cashier PIN.")).toBeVisible();
  await page.keyboard.type("1234");
  await page.waitForTimeout(1500);
  const probe = await page.evaluate(() => {
    const input = document.querySelector('[data-slot="input-otp"] input') as HTMLInputElement | null;
    const slots = [...document.querySelectorAll('[data-slot="input-otp-slot"]')].map((slot) => slot.textContent);
    return { inputValue: input?.value ?? null, slots };
  });
  console.log("PROBE " + JSON.stringify(probe));
  console.log("LOGS " + JSON.stringify(logs.slice(0, 10)));
  expect(true).toBe(true);
});
