import { expect, test } from "@playwright/test";

test("shows the Platform workspace and enabled modules", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Workspace" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Enabled modules" })).toBeVisible();
});
