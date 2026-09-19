import { expect, test } from "@playwright/test";

test("shows the shared MDI workspace shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("CODEXSUN Platform")).toBeVisible();
  await expect(page.getByRole("button", { name: "Toggle Sidebar" }).last()).toBeVisible();
  await expect(page.getByText("Platform modules are composed through declared providers.")).toBeVisible();
});
