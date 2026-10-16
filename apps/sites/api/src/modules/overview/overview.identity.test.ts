import assert from "node:assert/strict";
import test from "node:test";
import Fastify, { type FastifyRequest } from "fastify";
import { authorizeSitesAction, registerSitesIdentity } from "./overview.identity.js";

test("missing identity fails closed and a denied action never grants access", async () => {
  const app = Fastify();
  const request = {} as FastifyRequest;
  await assert.rejects(
    authorizeSitesAction(app, request, "sites.site.runtime.start"),
    /not connected/
  );
  registerSitesIdentity(app, async () => ({
    actorEmail: "viewer@example.test",
    tenant: { code: "viewer", name: "Viewer" },
    authorize: async () => {
      throw new Error("Permission denied");
    }
  }));
  await assert.rejects(
    authorizeSitesAction(app, request, "sites.site.runtime.start"),
    /Permission denied/
  );
  await app.close();
});

test("identity stays bound to its host and permission is checked on every call", async () => {
  const first = Fastify();
  const second = Fastify();
  const permissions: string[] = [];
  registerSitesIdentity(first, async () => ({
    actorEmail: "admin@example.test",
    tenant: { code: "first", name: "First" },
    authorize: async (permission) => {
      permissions.push(permission);
    }
  }));
  const request = {} as FastifyRequest;
  await authorizeSitesAction(first, request, "sites.site.runtime.start");
  await authorizeSitesAction(first, request, "sites.site.runtime.start");
  assert.deepEqual(permissions, ["sites.site.runtime.start", "sites.site.runtime.start"]);
  await assert.rejects(
    authorizeSitesAction(second, request, "sites.site.runtime.start"),
    /not connected/
  );
  await first.close();
  await second.close();
});
