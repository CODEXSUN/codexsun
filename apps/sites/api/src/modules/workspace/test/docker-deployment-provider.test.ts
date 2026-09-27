import assert from "node:assert/strict";
import test from "node:test";
import { renderClientCompose } from "../docker-deployment-provider.js";

test("renders client and environment isolated Docker resources", () => {
  const compose = renderClientCompose({
    repositoryRoot: "E:/codexsun/codexsun",
    deployment: {
      id: "00000000-0000-0000-0000-000000000001",
      clientSlug: "codexsun",
      environment: "staging",
      releaseTag: "codexsun-2026092701",
      sourceRef: "clients/codexsun/release-1",
      state: "queued",
      requestedAt: "2026-09-27T00:00:00.000Z",
    },
  });

  assert.match(compose, /name: sites-codexsun-staging/u);
  assert.match(compose, /SITES_CLIENT_SLUG: codexsun/u);
  assert.match(compose, /SITES_DATABASE_PATH: \/workspace\/storage\/apps\/codexsun\/private\/data\/staging\.sqlite/u);
  assert.match(compose, /sites-codexsun-staging-data/u);
  assert.match(compose, /sites\/codexsun-web:codexsun-2026092701/u);
  assert.match(compose, /VITE_SITES_CLIENT_SLUG: codexsun/u);
});
