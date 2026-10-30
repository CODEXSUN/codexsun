import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { createApiApp } from "@codexsun/framework/api";
import { createConnection } from "mysql2/promise";
import { env } from "../../apps/platform/api/src/env.js";
import { AuthService } from "../../apps/platform/api/src/auth/auth.service.js";
import { CredentialRecoveryService } from "../../apps/platform/api/src/modules/credential-recovery/credential-recovery.service.js";
import { registerAuthRoutes } from "../../apps/platform/api/src/auth/auth.routes.js";
import { AuthSessionRepository } from "../../apps/platform/api/src/auth/auth-session.repository.js";
import { AuthLoginAttemptRepository } from "../../apps/platform/api/src/auth/auth-login-attempt.repository.js";
import { TenantUserService } from "../../apps/platform/api/src/modules/tenant-user/tenant-user.service.js";
import { migrateTenantUsername } from "../../apps/platform/api/src/modules/tenant-user/tenant-user.migration.js";
import { hashPassword } from "../../apps/platform/api/src/auth/password-hash.js";
import { verifyAuthToken } from "../../apps/platform/api/src/auth/jwt.js";
import { TenantRepository } from "../../apps/platform/api/src/modules/tenant/tenant.repository.js";
import type { Tenant } from "../../apps/platform/api/src/modules/tenant/tenant.types.js";
import {
  getTenantDatabase,
  closeTenantDatabase
} from "../../apps/platform/api/src/database/tenant-database.js";
import { migrateTenantRuntimeModule } from "../../apps/platform/api/src/modules/tenant/tenant.migration.js";

test(
  "verified custom-domain login selects its tenant without Corporate ID",
  { timeout: 60000 },
  async (suite) => {
    assert.equal(env.NODE_ENV, "development");
    assert.equal(env.CODEXSUN_TENANCY_MODE, "multi");
    const name = `codexsun_domain_login_e2e_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
    const domain = "app.domain-login.example.test";
    const tenant: Tenant = {
      id: 1,
      uuid: randomUUID().slice(0, 8),
      corporateId: "DOMAINTEST",
      tenantCode: "DOMAINTEST",
      tenantName: "Domain login fixture",
      slug: "domain-login-fixture",
      primaryDomain: domain,
      dbHost: env.DB_HOST,
      dbPort: env.DB_PORT,
      dbUser: env.DB_USER,
      dbName: name,
      dbSecretRef: "DB_PASSWORD",
      dbType: "mariadb",
      enabledModuleKeys: ["crm"],
      defaultLandingApp: "crm",
      mobile: null,
      payloadSettings: {},
      status: "active",
      storageRoot: "",
      storagePrivateRoot: "",
      storagePublicRoot: ""
    };
    const admin = await createConnection({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD
    });
    const app = await createApiApp({
      appName: "codexsun-domain-login-test",
      cookieSecret: "codexsun-login-fixture-secret",
      corsOrigins: [],
      environment: "development"
    });
    suite.after(async () => {
      await app.close();
      await closeTenantDatabase(tenant);
      assert.match(name, /^codexsun_domain_login_e2e_[a-f0-9]{16}$/);
      try {
        await admin.query(`DROP DATABASE IF EXISTS \`${name}\``);
      } finally {
        await admin.end();
      }
    });
    await admin.query(
      `CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    const database = getTenantDatabase(tenant);
    await migrateTenantRuntimeModule(database);
    const password = randomUUID();
    await database
      .insertInto("app_users")
      .values({
        uuid: "loginusr",
        name: "Domain user",
        email: "user@example.test",
        username: "domain.user",
        password_hash: hashPassword(password),
        role: "user",
        status: "active"
      })
      .execute();
    let mapped: Tenant | null = tenant;
    let domainLookups = 0;
    let remapDuringLogin = false;
    suite.mock.method(TenantRepository.prototype, "findByDomain", async (host: string) => {
      domainLookups++;
      if (host !== domain) return null;
      return remapDuringLogin && domainLookups === 2 ? { ...tenant, uuid: "changed0" } : mapped;
    });
    let corporateLookups = 0;
    suite.mock.method(
      TenantRepository.prototype,
      "findByCorporateId",
      async (corporateId: string) => {
        corporateLookups++;
        return corporateId === "DOMAINTEST" ? tenant : null;
      }
    );
    const sessions = suite.mock.method(
      AuthSessionRepository.prototype,
      "create",
      async () => undefined
    );
    const failures = new Map<string, number>();
    suite.mock.method(
      AuthLoginAttemptRepository.prototype,
      "isRateLimited",
      async (key: string) => (failures.get(key) ?? 0) >= 5
    );
    suite.mock.method(
      AuthLoginAttemptRepository.prototype,
      "recordFailure",
      async (key: string) => {
        failures.set(key, (failures.get(key) ?? 0) + 1);
      }
    );
    suite.mock.method(AuthLoginAttemptRepository.prototype, "clear", async (key: string) => {
      failures.delete(key);
    });
    await registerAuthRoutes(app);
    const custom = await app.inject({
      method: "GET",
      url: "/auth/tenant-context",
      headers: { host: domain }
    });
    assert.equal(custom.statusCode, 200);
    assert.equal(custom.json().data.corporateIdRequired, false);
    assert.equal(custom.json().data.mode, "custom_domain");
    assert.equal(custom.json().data.tenantName, tenant.tenantName);
    const shared = await app.inject({
      method: "GET",
      url: "/auth/tenant-context",
      headers: { host: "localhost" }
    });
    assert.equal(shared.json().data.corporateIdRequired, true);
    assert.equal(shared.json().data.mode, "shared_domain");
    const apex = await app.inject({
      method: "GET",
      url: "/auth/tenant-context",
      headers: { host: "codexsun.com" }
    });
    assert.equal(apex.json().data.corporateIdRequired, true);
    assert.equal(apex.json().data.mode, "shared_domain");
    const unknown = await app.inject({
      method: "GET",
      url: "/auth/tenant-context",
      headers: { host: "unknown.example.test" }
    });
    assert.equal(unknown.json().data.mode, "unknown");

    const auth = new AuthService();
    const input = { desk: "tenant", domain, email: "user@example.test", password };
    const result = await auth.login(input);
    assert.ok(result && "tenantId" in result);
    assert.equal(result.tenantId, tenant.uuid);
    assert.equal(result.corporateId, "DOMAINTEST");
    const claims = verifyAuthToken(result.accessToken)!;
    assert.equal(claims.tenantId, tenant.uuid);
    assert.equal(claims.tenantDbName, name);
    assert.equal(claims.tenantAccessMode, "custom_domain");
    assert.equal(claims.loginHost, domain);
    assert.equal(corporateLookups, 0, "Custom domains must never select by a client Corporate ID");
    assert.ok(await auth.login({ ...input, corporateId: " domaintest " }));
    assert.equal(await auth.login({ ...input, corporateId: "OTHER-TENANT" }), null);
    assert.equal(await auth.login({ ...input, password: "wrong-password" }), null);
    assert.equal(await auth.login({ ...input, domain: "unknown.example.test" }), null);
    mapped = null;
    assert.equal(
      await auth.login(input),
      null,
      "Unverified/inactive domain lookup cannot select a tenant"
    );
    mapped = { ...tenant, status: "suspended" };
    assert.equal(await auth.login(input), null);
    mapped = tenant;
    domainLookups = 0;
    remapDuringLogin = true;
    assert.equal(await auth.login(input), null, "A changed domain mapping must fail closed");
    remapDuringLogin = false;
    assert.equal(
      await auth.login({ ...input, domain: "localhost" }),
      null,
      "Shared login still requires Corporate ID"
    );
    assert.equal(
      await auth.login({ ...input, domain: "localhost", corporateId: "OTHER-TENANT" }),
      null
    );
    assert.ok(await auth.login({ ...input, domain: "localhost", corporateId: "DOMAINTEST" }));
    assert.equal(sessions.mock.callCount(), 3, "Only successful logins may create a session");
    const usernameLogin = await auth.login({
      desk: "tenant",
      domain,
      identifier: " DOMAIN.USER ",
      password
    });
    assert.ok(usernameLogin);
    assert.equal(
      usernameLogin.email,
      input.email,
      "Session actors remain canonical email identities"
    );
    assert.equal(
      await auth.login({ desk: "tenant", domain, identifier: "Domain user", password }),
      null,
      "Display names cannot select accounts"
    );
    assert.equal(
      await auth.login({ desk: "tenant", domain, identifier: "domain.user", password: "wrong" }),
      null
    );
    assert.equal(
      await auth.loginAttemptIdentity({ ...input, identifier: "domain.user" }),
      input.email
    );
    assert.equal(await auth.loginAttemptIdentity(input), input.email);
    const post = (payload: Record<string, unknown>, host = domain) =>
      app.inject({
        method: "POST",
        url: "/auth/login",
        headers: { host },
        payload: { desk: "tenant", password, ...payload }
      });
    for (const payload of [
      { identifier: "domain.user" },
      { identifier: input.email },
      { email: input.email }
    ]) {
      const response = await post(payload);
      assert.equal(response.statusCode, 200, response.body);
      assert.equal(response.json().data.email, input.email);
      assert.equal(response.json().data.tenantId, tenant.uuid);
      assert.ok(response.headers["set-cookie"]);
    }
    assert.equal((await post({ email: input.email, identifier: "domain.user" })).statusCode, 400);
    assert.equal((await post({})).statusCode, 400);
    assert.equal(
      (await post({ identifier: "domain.user", corporateId: "OTHER-TENANT" })).statusCode,
      401
    );
    assert.equal((await post({ identifier: "domain.user" }, "localhost")).statusCode, 400);
    assert.equal((await post({ identifier: "domain.user" }, "codexsun.com")).statusCode, 400);
    const apexLogin = await post(
      { identifier: "domain.user", corporateId: "DOMAINTEST" },
      "codexsun.com"
    );
    assert.equal(apexLogin.statusCode, 200, apexLogin.body);
    failures.clear();
    for (let i = 0; i < 5; i++) {
      const response = await post({
        identifier: i % 2 ? input.email : "domain.user",
        password: "wrong"
      });
      assert.equal(response.statusCode, 401, response.body);
    }
    assert.equal(failures.size, 1, "Username and email must share one failure counter");
    assert.equal((await post({ identifier: input.email })).statusCode, 429);
    assert.equal((await post({ identifier: "domain.user" })).statusCode, 429);
    failures.clear();
    suite.mock.method(TenantUserService.prototype, "audit", async () => {});
    const users = new TenantUserService({
      database,
      tenantId: tenant.uuid,
      actorEmail: input.email,
      authorize: async () => {}
    });
    const baseUser = {
      name: "Same display name",
      email: "second@example.test",
      password,
      status: "active" as const
    };
    const created = await users.create({ ...baseUser, username: " Second.User " });
    assert.equal(created.username, "second.user");
    await assert.rejects(
      users.create({ ...baseUser, email: "third@example.test", username: "SECOND.USER" }),
      /email or username already exists/
    );
    await assert.rejects(
      users.create({ ...baseUser, email: "third@example.test", username: "bad name" }),
      /Username must/
    );
    await assert.rejects(
      users.create({ ...baseUser, email: "third@example.test", username: "email@example.test" }),
      /Username must/
    );
    await users.update(String(created.id), { ...baseUser, name: "Renamed display" });
    assert.equal(
      (await users.get(String(created.id)))?.username,
      "second.user",
      "Old clients preserve existing usernames"
    );
    await users.update(String(created.id), { ...baseUser, username: null });
    assert.equal((await users.get(String(created.id)))?.username, null);
    assert.equal(await auth.login({ ...input, identifier: "second.user" }), null);
    assert.ok(await auth.login({ ...input, identifier: baseUser.email }));
    await database
      .updateTable("app_users")
      .set({ status: "suspended" })
      .where("email", "=", input.email)
      .execute();
    assert.equal(await auth.login({ ...input, identifier: "domain.user" }), null);
    assert.equal(await auth.login(input), null);
    await database
      .updateTable("app_users")
      .set({ status: "active" })
      .where("email", "=", input.email)
      .execute();
    await migrateTenantUsername(database);
    assert.equal(
      (await users.get(String(created.id)))?.username,
      null,
      "Username migration is repeatable"
    );
    // Resolve targets only: do not queue mail or create recovery tokens in this test.
    const recovery = new CredentialRecoveryService();
    const recoveryInput = { desk: "tenant" as const, domain, email: input.email };
    const target = await recovery["tenantTarget"](recoveryInput, input.email);
    assert.equal(target?.tenantId, tenant.uuid);
    assert.equal(target?.tenantDatabase, name);
    assert.equal(
      await recovery["tenantTarget"](
        { ...recoveryInput, corporateId: "OTHER-TENANT" },
        input.email
      ),
      null
    );
    assert.equal(
      await recovery["tenantTarget"](
        { ...recoveryInput, domain: "unknown.example.test", corporateId: "DOMAINTEST" },
        input.email
      ),
      null
    );
    assert.equal(
      await recovery["tenantTarget"]({ ...recoveryInput, domain: "localhost" }, input.email),
      null
    );
    assert.ok(
      await recovery["tenantTarget"](
        { ...recoveryInput, domain: "localhost", corporateId: "DOMAINTEST" },
        input.email
      )
    );
  }
);
