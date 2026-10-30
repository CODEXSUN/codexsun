import assert from "node:assert/strict";
import test from "node:test";
import {
  appRootPage,
  appRootUrl,
  appMenuFor,
  enabledAppIds,
  defaultLandingApp,
  platformAppRegistry
} from "./app-registry";
for (const key of ["hrms", "docs", "himsx", "sites"] as const) {
  test(`${key} launcher, default landing and app-owned menu`, () => {
    assert.equal(platformAppRegistry.filter((a) => a.id === key).length, 1);
    assert.equal(enabledAppIds([key]).includes(key), true);
    assert.equal(enabledAppIds(["crm"]).includes(key), false);
    assert.equal(defaultLandingApp(key, [key]), key);
    assert.equal(defaultLandingApp(key, ["crm"]), "application");
    assert.equal(appRootPage(key), `${key}.overview`);
    assert.equal(appRootUrl(key), `/app/${key}/overview`);
    const selected: string[] = [];
    const menu = appMenuFor(key, `${key}.overview`, (page) => selected.push(page));
    assert.deepEqual(
      menu.items?.map((i) => i.title),
      key === "hrms"
        ? ["Overview", "Employees", "Attendance"]
        : key === "docs"
          ? ["Overview", "Developer Library", "Getting Started"]
          : key === "sites"
            ? ["Studio Dashboard", "Client Portfolios", "Guide"]
            : ["Overview", "Getting Started"]
    );
    menu.items?.find((item) => item.title === "Getting Started" || item.title === "Guide")?.onSelect?.();
    if (key !== "hrms") {
      assert.deepEqual(selected, [`${key}.guide`]);
    }
  });
}
