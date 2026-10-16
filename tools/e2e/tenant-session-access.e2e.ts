import assert from "node:assert/strict";
import { createServer } from "node:net";
import { registerSyntheticSession } from "./auth-session-helper.js";
import { signAuthToken } from "../../apps/platform/api/src/auth/jwt.js";
import {
  authCookieName,
  encryptSessionCookie
} from "../../apps/platform/api/src/auth/session-cookie.js";

const port = await availablePort();
process.env.PLATFORM_API_PORT = String(port);

const { createApp } = await import("../../apps/platform/api/src/app.js");
const app = await createApp();

try {
  await app.listen({ host: "127.0.0.1", port });

  const applicationHost = new URL(process.env.PLATFORM_WEB_ORIGIN ?? "http://app.codexsun.test");
  const forgedHealth = await app.inject({
    headers: {
      authorization: "Bearer invalid-session",
      host: applicationHost.host,
      "x-tenant-id": "forged-tenant"
    },
    method: "GET",
    url: "/health"
  });
  assert.equal(forgedHealth.statusCode, 200, forgedHealth.body);
  assert.equal(forgedHealth.headers["x-tenant-id"], undefined);
  assert.equal(forgedHealth.json().meta.tenantId, undefined);
  const readiness = await app.inject({
    headers: { authorization: "Bearer invalid-session" },
    method: "GET",
    url: "/ready"
  });
  assert.equal(readiness.statusCode, 200, readiness.body);

  const bearer = signAuthToken({
    email: "revocation-e2e@example.test",
    loginHost: applicationHost.hostname,
    userId: "revocation-e2e",
    userType: "super_admin"
  });
  await registerSyntheticSession(bearer);
  const bearerHeaders = { authorization: `Bearer ${bearer}`, host: applicationHost.host };
  const activeBearer = await app.inject({
    headers: bearerHeaders,
    method: "GET",
    url: "/auth/session"
  });
  assert.equal(activeBearer.statusCode, 200, activeBearer.body);
  const logout = await app.inject({ headers: bearerHeaders, method: "POST", url: "/auth/logout" });
  assert.equal(logout.statusCode, 200, logout.body);
  const revokedBearer = await app.inject({
    headers: bearerHeaders,
    method: "GET",
    url: "/auth/session"
  });
  assert.equal(revokedBearer.statusCode, 401, revokedBearer.body);
  assert.equal(revokedBearer.json().error?.code, "AUTH_SESSION_EXPIRED");

  const loginResponse = await app.inject({
    headers: {
      host: applicationHost.host,
      origin: applicationHost.origin
    },
    method: "POST",
    url: "/auth/development/tenant-login"
  });
  assert.equal(loginResponse.statusCode, 200, loginResponse.body);

  const tenantSlot = loginResponse.json().data.sessionSlot as string;
  assert.match(tenantSlot, /^[0-9a-f]{32}$/u);
  const sessionCookie = loginResponse.cookies.find(
    (cookie) => cookie.name === authCookieName(tenantSlot) && cookie.value.length > 0
  );
  assert.ok(sessionCookie, "Development login did not issue a session cookie.");
  const tenantCookieHeader = `${sessionCookie.name}=${sessionCookie.value}`;

  const coreResponse = await app.inject({
    headers: {
      cookie: tenantCookieHeader,
      host: applicationHost.host,
      origin: applicationHost.origin,
      "x-codexsun-session-slot": tenantSlot
    },
    method: "GET",
    url: "/core/organisation/companies?search="
  });
  assert.equal(
    coreResponse.statusCode,
    200,
    `The tenant session was rejected by the composed Core API: ${coreResponse.body}`
  );
  const tenantSession = await app.inject({
    headers: {
      cookie: tenantCookieHeader,
      host: applicationHost.host,
      origin: applicationHost.origin,
      "x-codexsun-session-slot": tenantSlot
    },
    method: "GET",
    url: "/auth/session"
  });
  assert.equal(tenantSession.statusCode, 200, tenantSession.body);
  assert.equal(
    coreResponse.headers["x-tenant-id"],
    tenantSession.json().data.tenantId,
    "Tenant response metadata did not match the validated session."
  );

  const defaultCompanyResponse = await app.inject({
    headers: {
      cookie: tenantCookieHeader,
      host: applicationHost.host,
      origin: applicationHost.origin,
      "x-codexsun-session-slot": tenantSlot
    },
    method: "GET",
    url: "/core/organisation/default-company"
  });
  assert.equal(defaultCompanyResponse.statusCode, 200, defaultCompanyResponse.body);
  const defaultCompany = defaultCompanyResponse.json().data as {
    companyId: number;
    financialYearId: number;
  };
  assert.ok(
    defaultCompany.companyId > 0,
    "Default Company did not provide a persisted company ID."
  );
  assert.ok(
    defaultCompany.financialYearId > 0,
    "Default Company did not provide a persisted financial-year ID."
  );

  const scopedHeaders = {
    cookie: tenantCookieHeader,
    host: applicationHost.host,
    origin: applicationHost.origin,
    "x-codexsun-session-slot": tenantSlot,
    "x-company-id": String(defaultCompany.companyId),
    "x-financial-year-id": String(defaultCompany.financialYearId)
  };

  for (const path of [
    "/core/common/products/units",
    "/core/master/products",
    "/billing/quotations/lookups/units",
    "/billing/quotations/lookups/products",
    "/billing/sales/lookups/units",
    "/billing/sales/lookups/products",
    "/billing/purchases/lookups/units",
    "/billing/purchases/lookups/products",
    "/billing/export-sales/lookups/units",
    "/billing/export-sales/lookups/products"
  ]) {
    const response = await app.inject({
      headers: scopedHeaders,
      method: "GET",
      url: path
    });
    assert.equal(
      response.statusCode,
      200,
      `${path} failed through the composed API: ${response.body}`
    );
    const records = response.json().data as Array<{
      name?: string | null;
      unitId?: number | string;
    }>;
    assert.ok(Array.isArray(records), `${path} did not return a lookup collection.`);
    if (path.endsWith("/products")) {
      const productsWithoutUnits = records.filter(
        (record) => !Number.isInteger(Number(record.unitId)) || Number(record.unitId) <= 0
      );
      assert.deepEqual(
        productsWithoutUnits,
        [],
        `${path} returned products without persisted units: ${productsWithoutUnits
          .slice(0, 5)
          .map((record) => record.name)
          .join(", ")}`
      );
    }
  }

  const saToken = signAuthToken({
    email: "parallel-sa-e2e@example.test",
    loginHost: applicationHost.hostname,
    userId: "parallel-sa-e2e",
    userType: "super_admin"
  });
  await registerSyntheticSession(saToken);
  const staffToken = signAuthToken({
    email: "parallel-staff-e2e@example.test",
    loginHost: applicationHost.hostname,
    userId: "parallel-staff-e2e",
    userType: "staff"
  });
  await registerSyntheticSession(staffToken);
  const saSlot = "a".repeat(32);
  const staffSlot = "b".repeat(32);
  const parallelCookies = [
    tenantCookieHeader,
    `${authCookieName(saSlot)}=${encryptSessionCookie(saToken)}`,
    `${authCookieName(staffSlot)}=${encryptSessionCookie(staffToken)}`
  ].join("; ");
  const parallelHeaders = { cookie: parallelCookies, host: applicationHost.host };
  const saSession = await app.inject({
    headers: { ...parallelHeaders, "x-codexsun-session-slot": saSlot },
    method: "GET",
    url: "/auth/session"
  });
  assert.equal(saSession.statusCode, 200, saSession.body);
  assert.equal(saSession.json().data.userType, "super_admin");
  const staffSession = await app.inject({
    headers: { ...parallelHeaders, "x-codexsun-session-slot": staffSlot },
    method: "GET",
    url: "/auth/session"
  });
  assert.equal(staffSession.statusCode, 200, staffSession.body);
  assert.equal(staffSession.json().data.userType, "staff");
  const parallelTenantSession = await app.inject({
    headers: { ...parallelHeaders, "x-codexsun-session-slot": tenantSlot },
    method: "GET",
    url: "/auth/session"
  });
  assert.equal(parallelTenantSession.statusCode, 200, parallelTenantSession.body);
  assert.equal(parallelTenantSession.json().data.userType, "tenant");

  const secondTenantLogin = await app.inject({
    headers: {
      ...parallelHeaders,
      origin: applicationHost.origin,
      "x-codexsun-session-slot": tenantSlot
    },
    method: "POST",
    url: "/auth/development/tenant-login"
  });
  assert.equal(secondTenantLogin.statusCode, 200, secondTenantLogin.body);
  const secondTenantSlot = secondTenantLogin.json().data.sessionSlot as string;
  assert.notEqual(secondTenantSlot, tenantSlot);
  assert.ok(
    secondTenantLogin.cookies.some((cookie) => cookie.name === authCookieName(secondTenantSlot))
  );
  const firstTenantAfterLogin = await app.inject({
    headers: { ...parallelHeaders, "x-codexsun-session-slot": tenantSlot },
    method: "GET",
    url: "/auth/session"
  });
  assert.equal(firstTenantAfterLogin.statusCode, 200, firstTenantAfterLogin.body);

  const saLogout = await app.inject({
    headers: { ...parallelHeaders, "x-codexsun-session-slot": saSlot },
    method: "POST",
    url: "/auth/logout"
  });
  assert.equal(saLogout.statusCode, 200, saLogout.body);
  assert.ok(saLogout.cookies.some((cookie) => cookie.name === authCookieName(saSlot)));
  assert.ok(!saLogout.cookies.some((cookie) => cookie.name === authCookieName(tenantSlot)));
  const tenantAfterSaLogout = await app.inject({
    headers: { ...parallelHeaders, "x-codexsun-session-slot": tenantSlot },
    method: "GET",
    url: "/auth/session"
  });
  assert.equal(tenantAfterSaLogout.statusCode, 200, tenantAfterSaLogout.body);
  const staffAfterSaLogout = await app.inject({
    headers: { ...parallelHeaders, "x-codexsun-session-slot": staffSlot },
    method: "GET",
    url: "/auth/session"
  });
  assert.equal(staffAfterSaLogout.statusCode, 200, staffAfterSaLogout.body);

  console.log("Tenant, SA, and staff sessions stayed independent across the composed API.");
} finally {
  await app.close();
}

async function availablePort() {
  return new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Could not allocate an E2E API port.")));
        return;
      }
      server.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}
