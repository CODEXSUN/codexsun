import assert from "node:assert/strict";
import test, { mock } from "node:test";
import Fastify from "fastify";
import { registerStorageManagerRoutes } from "./storage-manager.routes.js";
import { TenantService } from "../tenant/tenant.service.js";

test("public Company branding uses the browser host and ignores a supplied forwarded host", async () => {
  let resolvedHost = "";
  const getCompany = mock.method(
    TenantService.prototype,
    "getPublicApplicationCompany",
    async (host: string) => {
      resolvedHost = host;
      return { company: null, domain: host, tenant: null };
    }
  );
  const app = Fastify();
  try {
    await registerStorageManagerRoutes(app);
    const response = await app.inject({
      headers: {
        host: "tenant.example:443",
        "x-forwarded-host": "another-tenant.example"
      },
      method: "GET",
      url: "/public/app-portal/company-logo/logo"
    });
    assert.equal(response.statusCode, 404);
    assert.equal(resolvedHost, "tenant.example");
  } finally {
    getCompany.mock.restore();
    await app.close();
  }
});
