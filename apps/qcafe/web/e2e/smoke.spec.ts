import { expect, test } from "@playwright/test";

const browserSession = "55555555-5555-4555-8555-555555555555";

test("cashier sets a PIN on first setup and reaches full-screen POS", async ({ page, request }) => {
  const status = await request.get("/api/v1/qcafe/auth/pin");
  expect(status.ok()).toBeTruthy();
  expect((await status.json()).pinSet).toBe(false);

  await page.goto("/login");
  await expect(page.getByText("Create the first four-digit cashier PIN.")).toBeVisible();
  await page.keyboard.type("1234");
  await expect(page.getByText("Point of sale", { exact: false }).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Cashier", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Search items or scan…")).toBeVisible();
  await expect(page.getByText("Inventory", { exact: true })).toHaveCount(0);
});

test("wrong PIN fails and username login reaches the full desk", async ({ page, request }) => {
  const failed = await request.post("/api/v1/qcafe/auth/pin/login", {
    data: { pin: "9999" },
    headers: { "x-codexsun-browser-session": browserSession },
  });
  expect(failed.status()).toBe(401);

  await page.goto("/login");
  await expect(page.getByText("Enter your four-digit cashier PIN.")).toBeVisible();
  await page.getByText("Sign in with username", { exact: true }).click();
  await page.getByLabel("Username").fill(process.env.USER_LOGIN ?? "user");
  await page.getByLabel("Password", { exact: true }).fill(process.env.USER_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Bills today")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Restaurant overview" })).toBeVisible();
  await page.goto("/inventory");
  await expect(page.getByRole("heading", { name: "Inventory and stock" })).toBeVisible();
  await page.goto("/reports");
  await expect(page.getByRole("heading", { name: "Reports and alerts" })).toBeVisible();
  await expect(page.getByText("Dashboard alerts")).toBeVisible();
});
