import assert from "node:assert/strict";
import test from "node:test";
import { createAddonProvider, createGitflowService, definition, routes } from "../src/index.js";

test("declares the gitflow provider contract", () => {
  const provider = createAddonProvider();
  assert.equal(provider.manifest.id, "gitflow.provider");
  assert.deepEqual(provider.manifest.contracts, ["gitflow.v1"]);
  assert.equal(routes[0].contract, "gitflow.v1");
});

test("runs the gitflow purpose-specific backend action", () => {
  const record = createGitflowService().recordPullRequest({ authorId: "actor-1", repositoryId: "repo-1", title: "Fix" });
  assert.equal(record.status, "draft");
  assert.equal(record.repositoryId, "repo-1");
});
