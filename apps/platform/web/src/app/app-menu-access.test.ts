import assert from "node:assert/strict";
import test from "node:test";
import { appMenuFor, appMenuItemsFor, enabledAppIds } from "./app-registry";

test("legacy Accounts entitlement remains visible in the tenant desk", () => {
  assert.equal(enabledAppIds(["accounts.accounting"]).includes("accounts"), true);
});

test("LogicX Schemes is shown only when Billing is enabled", () => {
  const select = () => {};
  const menu = (billingEnabled: boolean) =>
    appMenuItemsFor(
      "logicx-erp",
      "logicx-erp.overview",
      select,
      undefined,
      undefined,
      billingEnabled
    );
  const launcherMenu = (billingEnabled: boolean) =>
    appMenuFor("logicx-erp", "logicx-erp.overview", select, undefined, undefined, billingEnabled);

  assert.deepEqual(
    menu(false).map((item) => item.title),
    ["Overview"]
  );
  assert.deepEqual(
    menu(true).map((item) => item.title),
    ["Overview", "Schemes"]
  );
  assert.deepEqual(
    launcherMenu(false).items?.map((item) => item.title),
    ["Overview"]
  );
  assert.deepEqual(
    launcherMenu(true).items?.map((item) => item.title),
    ["Overview", "Schemes"]
  );
});

test("Frappe navigation groups import, export, and connection pages", () => {
  const selected: string[] = [];
  const menu = appMenuItemsFor("frappe", "frappe.activities", (page) => selected.push(page));

  assert.deepEqual(
    menu.map((item) => item.title),
    ["Overview", "Import", "Export", "Frappe"]
  );
  assert.equal(menu[1]?.isActive, true);
  assert.deepEqual(
    menu[1]?.items?.map((item) => item.title),
    ["Import contacts", "Import enquiries", "Import activities", "Import call logs"]
  );
  assert.deepEqual(
    menu[2]?.items?.map((item) => item.title),
    ["Export contacts", "Export enquiries", "Export activities", "Export call logs"]
  );
  assert.deepEqual(
    menu[3]?.items?.map((item) => item.title),
    ["Sync queue", "Frappe connection", "Frappe users", "User mapping"]
  );
  menu[2]?.items?.[1]?.onSelect?.();
  menu[3]?.items?.[1]?.onSelect?.();
  assert.deepEqual(selected, ["frappe.export.enquiries", "frappe.connection"]);
});
