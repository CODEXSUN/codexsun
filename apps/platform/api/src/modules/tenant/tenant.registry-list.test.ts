import assert from "node:assert/strict";
import test from "node:test";
import { TenantRepository } from "./tenant.repository.js";
import { TenantService } from "./tenant.service.js";
import type { Tenant } from "./tenant.types.js";

test("tenant list includes unconnected registry entries without accessing tenant data", async () => {
  const records: Tenant[] = ["inactive", "active"].map((status, index) => ({
    corporateId: `REGISTRY${index}`,
    dbHost: "",
    dbName: "",
    dbPort: 0,
    dbSecretRef: "",
    dbType: "mariadb",
    dbUser: "",
    defaultLandingApp: "billing",
    enabledModuleKeys: ["billing.sales", "platform.application"],
    id: index + 1,
    mobile: null,
    payloadSettings: {},
    primaryDomain: "",
    slug: `registry${index}`,
    status: status as Tenant["status"],
    storagePrivateRoot: "",
    storagePublicRoot: "",
    storageRoot: "",
    tenantCode: `REGISTRY${index}`,
    tenantName: `Registry ${index}`,
    uuid: `0000000${index}`
  }));
  class RegistryRepository extends TenantRepository {
    override async list() {
      return records;
    }
  }

  const service = new TenantService(new RegistryRepository());
  assert.strictEqual(await service.listTenants(), records);
});
