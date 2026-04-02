import { expect, test } from "@playwright/test"

test("ui workspace separates components, blocks, and pages into dedicated lanes", async ({
  page,
}) => {
  await page.goto("/login?next=/dashboard/apps/ui")

  await page.getByLabel("Email").fill("sundar@sundar.com")
  await page.getByLabel("Password").fill("Kalarani1@@")
  await page.getByRole("button", { name: "Login" }).click()

  await expect(page).toHaveURL(/\/dashboard\/apps\/ui$/)
  await expect(page.getByText("Design system channels")).toBeVisible()
  await expect(page.getByRole("link", { name: /Components/i }).first()).toBeVisible()

  await page.goto("/dashboard/apps/ui/components")
  await expect(page.getByText("Component Design System")).toBeVisible()
  await expect(page.getByText("Governed component variants")).toBeVisible()

  await page.goto("/dashboard/apps/ui/blocks")
  await expect(page.getByText("Reusable application blocks")).toBeVisible()
  await expect(page.getByText("Filter Toolbar")).toBeVisible()

  await page.goto("/dashboard/apps/ui/pages")
  await expect(page.getByText("Full Page Design System")).toBeVisible()
  await expect(page.getByRole("link", { name: "Support Queue Page", exact: true })).toBeVisible()
  await expect(page.getByRole("link", { name: "Ledger Master Page", exact: true })).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Bulk Ledger Management Page", exact: true })
  ).toBeVisible()
  await expect(page.getByText("Docs Templates")).toBeVisible()

  await page.goto("/dashboard/apps/ui/pages-entry-common-list-01")
  await expect(page.getByText("Page Entry")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Support Queue Page" }).nth(1)).toBeVisible()
  await expect(page.getByText("Back to pages")).toBeVisible()
  await expect(page.getByLabel(/Open actions for/i).first()).toBeVisible()

  await page.goto("/dashboard/apps/ui/pages-entry-master-list-01")
  await expect(page.getByText("Page Entry")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Ledger Master Page" }).nth(1)).toBeVisible()
  await expect(page.getByText("Back to pages")).toBeVisible()
  await expect(page.getByLabel(/Open actions for/i).first()).toBeVisible()

  await page.goto("/dashboard/apps/ui/pages-entry-master-list-selectable-01")
  await expect(page.getByText("Page Entry")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Bulk Ledger Management Page" }).nth(1)).toBeVisible()
  await expect(page.getByLabel("Select all visible masters")).toBeVisible()
  await expect(page.getByText("Column visibility:")).toBeVisible()
  await expect(page.getByLabel(/Open actions for/i).first()).toBeVisible()
})
