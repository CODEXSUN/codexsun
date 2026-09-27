import assert from "node:assert/strict";
import test from "node:test";
import { SitesWorkspaceStore } from "../workspace-store.js";

test("keeps client environments and deployments isolated", () => {
  const store = new SitesWorkspaceStore(":memory:");
  store.syncClient({ slug: "alpha", name: "Alpha", description: "Alpha workspace" });
  store.syncClient({ slug: "beta", name: "Beta", description: "Beta workspace" });

  const deployment = store.requestDeployment("alpha", "staging", "clients/alpha/release-1");
  assert.equal(deployment?.clientSlug, "alpha");
  assert.equal(deployment?.environment, "staging");
  assert.equal(
    store.findWorkspace("alpha")?.environments.find((environment) => environment.name === "staging")?.imageTag,
    deployment?.releaseTag,
  );
  assert.equal(store.findWorkspace("beta")?.latestDeployment, undefined);
  store.close();
});

test("syncing a client is repeat-safe", () => {
  const store = new SitesWorkspaceStore(":memory:");
  store.syncClient({ slug: "alpha", name: "Alpha", description: "First" });
  store.syncClient({ slug: "alpha", name: "Alpha updated", description: "Second" });

  const workspace = store.findWorkspace("alpha");
  assert.equal(workspace?.name, "Alpha updated");
  assert.equal(workspace?.environments.length, 3);
  store.close();
});
