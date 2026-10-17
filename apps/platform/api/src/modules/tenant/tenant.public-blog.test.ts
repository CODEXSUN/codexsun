import assert from "node:assert/strict";
import test, { mock } from "node:test";
import Fastify from "fastify";
import { registerTenantRoutes } from "./tenant.routes.js";
import { TenantService, publicPortalForTenant } from "./tenant.service.js";
import { TenantRepository } from "./tenant.repository.js";
import type { Tenant } from "./tenant.types.js";
import { env } from "../../env.js";

function fixture(overrides: Partial<Tenant> = {}): Tenant {
  return {
    corporateId: "CODEXSUN",
    dbHost: "localhost",
    dbName: "fixture",
    dbPort: 3306,
    dbSecretRef: "fixture",
    dbType: "mariadb",
    dbUser: "fixture",
    enabledModuleKeys: ["blog"],
    defaultLandingApp: "application",
    id: 1,
    mobile: null,
    payloadSettings: {},
    primaryDomain: "codexsun.com",
    slug: "codexsun",
    status: "active",
    storagePrivateRoot: "private",
    storagePublicRoot: "public",
    storageRoot: "storage",
    tenantCode: "CODEXSUN",
    tenantName: "CODEXSUN",
    uuid: "fixture",
    ...overrides
  };
}

class BlogRepository extends TenantRepository {
  reads = 0;
  constructor(private readonly tenant: Tenant | null) {
    super();
  }
  override async findByCorporateId() {
    this.reads++;
    return this.tenant;
  }
}
class BlogService extends TenantService {
  constructor(
    repository: BlogRepository,
    private readonly mapped: Tenant | null
  ) {
    super(repository);
  }
  override async getPublicApplicationCompany(value: string) {
    return { company: null, domain: value, tenant: this.mapped };
  }
}

test("public Blog accepts an active Blog tenant without Ecommerce", async () => {
  const tenant = fixture();
  const service = new BlogService(new BlogRepository(null), tenant);
  assert.equal((await service.getPublicBlogTenant("codexsun.com")).tenantCode, "CODEXSUN");
});

test("public Blog rejects disabled, inactive and unmapped production tenants", async () => {
  const previous = env.NODE_ENV;
  env.NODE_ENV = "production";
  try {
    for (const tenant of [
      fixture({ enabledModuleKeys: [] }),
      fixture({ status: "inactive" }),
      null
    ]) {
      const repository = new BlogRepository(fixture());
      const service = new BlogService(repository, tenant);
      await assert.rejects(service.getPublicBlogTenant("unmapped.example"), /public Blog tenant/);
      assert.equal(repository.reads, 0);
    }
  } finally {
    env.NODE_ENV = previous;
  }
});

test("only development loopback may use the configured Blog tenant", async () => {
  const previous = env.NODE_ENV;
  const corporateId = env.DEFAULT_TENANT_CORPORATE_ID;
  env.NODE_ENV = "development";
  env.DEFAULT_TENANT_CORPORATE_ID = "CODEXSUN";
  try {
    const repository = new BlogRepository(fixture());
    const service = new BlogService(repository, null);
    assert.equal((await service.getPublicBlogTenant("127.0.0.1:7020")).tenantCode, "CODEXSUN");
    assert.equal(repository.reads, 1);
    await assert.rejects(service.getPublicBlogTenant("unmapped.example"), /public Blog tenant/);
    assert.equal(repository.reads, 1);
  } finally {
    env.NODE_ENV = previous;
    env.DEFAULT_TENANT_CORPORATE_ID = corporateId;
  }
});

test("public portal reports Blog availability without enabling the module", () => {
  assert.equal(publicPortalForTenant(fixture(), "codexsun.com").blogEnabled, true);
  assert.equal(
    publicPortalForTenant(fixture({ enabledModuleKeys: [] }), "codexsun.com").blogEnabled,
    false
  );
  assert.equal(publicPortalForTenant(null, "unknown.example").blogEnabled, false);
});


test("public portal HTTP contract preserves Blog availability and media path", async () => {
  const portal = publicPortalForTenant(fixture({ enabledModuleKeys: [] }), "codexsun.com");
  const getPortal = mock.method(TenantService.prototype, "getPublicPortal", async () => portal);
  const app = Fastify();
  try {
    await registerTenantRoutes(app);
    const response = await app.inject({ method: "GET", url: "/public/app-portal" });
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().data.blogEnabled, false);
    assert.equal(response.json().data.blogMediaPath, portal.blogMediaPath);
  } finally { getPortal.mock.restore(); await app.close(); }
});
