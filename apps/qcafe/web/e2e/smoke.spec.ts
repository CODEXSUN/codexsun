import { expect, test } from "@playwright/test";

test("operator signs in and reaches the Q Cafe desks", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Q Cafe" })).toBeVisible();
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Bills today")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Restaurant overview" })).toBeVisible();
});

test("new operations desks render from shared components", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Bills today")).toBeVisible({ timeout: 30_000 });
  await page.goto("/inventory");
  await expect(page.getByRole("heading", { name: "Inventory and stock" })).toBeVisible();
  await page.goto("/reports");
  await expect(page.getByRole("heading", { name: "Reports and alerts" })).toBeVisible();
  await expect(page.getByText("Dashboard alerts")).toBeVisible();
});
