import assert from "node:assert/strict";
import type { DefaultCompanyRecord } from "@codexsun/core-api";
import { createApp } from "../../app.js";
import { env } from "../../env.js";
import { TenantRepository } from "./tenant.repository.js";
import type { Tenant, TenantSavePayload } from "./tenant.types.js";

const app = await createApp();
let headers: Record<string, string> | null = null;
let originalDefaultCompany: DefaultCompanyRecord | null = null;

try {
  const login = await request<{
    accessToken: string;
    tenantDbName: string;
    tenantId: string;
  }>("POST", "/auth/login", {
    corporateId: env.DEFAULT_TENANT_CORPORATE_ID,
    desk: "tenant",
    email: env.DEFAULT_TENANT_ADMIN_EMAIL,
    password: env.DEFAULT_TENANT_ADMIN_PASSWORD
  });
  headers = tenantHeaders(login.data);

  const runtime = await request<{
    defaultLandingApp: Tenant["defaultLandingApp"];
    tenant: Tenant | null;
  }>("GET", "/tenant/runtime", undefined, headers);
  assert.ok(runtime.data.tenant);
  const originalLandingApp = runtime.data.defaultLandingApp;
  const alternateLandingApp = selectAlternateLandingApp(runtime.data.tenant, originalLandingApp);

  const defaultCompany = await request<DefaultCompanyRecord | null>(
    "GET",
    "/core/organisation/default-company",
    undefined,
    headers
  );
  assert.ok(defaultCompany.data, "Default Company must be seeded.");
  originalDefaultCompany = defaultCompany.data;
  assert.equal(defaultCompany.data.landingApp, originalLandingApp);

  const landingDeskUpdate = await request<{ defaultLandingApp: Tenant["defaultLandingApp"] }>(
    "PUT",
    "/tenant/runtime/landing-app",
    { landingApp: alternateLandingApp },
    headers
  );
  assert.equal(landingDeskUpdate.data.defaultLandingApp, alternateLandingApp);

  const landingDeskMirror = await request<DefaultCompanyRecord>(
    "GET",
    "/core/organisation/default-company",
    undefined,
    headers
  );
  assert.equal(landingDeskMirror.data.landingApp, alternateLandingApp);
  const landingDeskTenant = await new TenantRepository().findByIdOrCode(login.data.tenantId);
  assert.equal(landingDeskTenant?.defaultLandingApp, alternateLandingApp);
  assert.equal(
    (landingDeskTenant?.payloadSettings.landing as { app?: string } | undefined)?.app,
    alternateLandingApp
  );

  const defaultCompanyUpdate = await request<DefaultCompanyRecord>(
    "PUT",
    "/tenant/runtime/default-company",
    {
      companyId: originalDefaultCompany.companyId,
      financialYearId: originalDefaultCompany.financialYearId,
      landingApp: originalLandingApp,
      status: originalDefaultCompany.status
    },
    headers
  );
  assert.equal(defaultCompanyUpdate.data.landingApp, originalLandingApp);

  const defaultCompanyMirror = await request<{ defaultLandingApp: Tenant["defaultLandingApp"] }>(
    "GET",
    "/tenant/runtime",
    undefined,
    headers
  );
  assert.equal(defaultCompanyMirror.data.defaultLandingApp, originalLandingApp);

  const appConnectionsUpdate = await request<Tenant>(
    "PUT",
    `/admin/tenants/${runtime.data.tenant.id}`,
    tenantPayload(runtime.data.tenant, alternateLandingApp)
  );
  assert.equal(appConnectionsUpdate.data.defaultLandingApp, alternateLandingApp);

  const appConnectionsDefaultCompany = await request<DefaultCompanyRecord>(
    "GET",
    "/core/organisation/default-company",
    undefined,
    headers
  );
  assert.equal(appConnectionsDefaultCompany.data.landingApp, alternateLandingApp);
  const appConnectionsRuntime = await request<{
    defaultLandingApp: Tenant["defaultLandingApp"];
  }>("GET", "/tenant/runtime", undefined, headers);
  assert.equal(appConnectionsRuntime.data.defaultLandingApp, alternateLandingApp);

  await request(
    "PUT",
    "/tenant/runtime/default-company",
    {
      companyId: originalDefaultCompany.companyId,
      financialYearId: originalDefaultCompany.financialYearId,
      landingApp: originalLandingApp,
      status: originalDefaultCompany.status
    },
    headers
  );

  console.info("Tenant landing synchronization E2E passed", {
    defaultLandingApp: originalLandingApp,
    synchronizedAreas: [
      "landing-desk",
      "default-company",
      "super-admin-app-connections",
      "tenant-runtime"
    ]
  });
} finally {
  if (headers && originalDefaultCompany) {
    await request(
      "PUT",
      "/tenant/runtime/default-company",
      {
        companyId: originalDefaultCompany.companyId,
        financialYearId: originalDefaultCompany.financialYearId,
        landingApp: originalDefaultCompany.landingApp,
        status: originalDefaultCompany.status
      },
      headers
    );
  }
  await app.close();
}

async function request<T = unknown>(
  method: "GET" | "POST" | "PUT",
  url: string,
  payload?: unknown,
  requestHeaders: Record<string, string> = {}
) {
  const response = await app.inject({
    headers: requestHeaders,
    method,
    ...(payload ? { payload } : {}),
    url
  });
  const body = response.json() as { data: T; error?: { message?: string }; success: boolean };
  assert.ok(
    response.statusCode >= 200 && response.statusCode < 300,
    body.error?.message ?? `Request failed with ${response.statusCode}.`
  );
  assert.equal(body.success, true);
  return body;
}

function tenantHeaders(input: { accessToken: string; tenantDbName: string; tenantId: string }) {
  return {
    authorization: `Bearer ${input.accessToken}`,
    "x-tenant-db": input.tenantDbName,
    "x-tenant-id": input.tenantId
  };
}

function selectAlternateLandingApp(
  tenant: Tenant,
  current: Tenant["defaultLandingApp"]
): Tenant["defaultLandingApp"] {
  const candidates: Array<[Tenant["defaultLandingApp"], string]> = [
    ["billing", "billing"],
    ["mail", "mail"],
    ["application", "platform.application"]
  ];
  const match = candidates.find(
    ([app, moduleKey]) =>
      app !== current &&
      (moduleKey === "platform.application" || tenant.enabledModuleKeys.includes(moduleKey))
  );
  assert.ok(match, "At least two tenant apps must be enabled for the synchronization E2E.");
  return match[0];
}

function tenantPayload(
  tenant: Tenant,
  defaultLandingApp: Tenant["defaultLandingApp"]
): TenantSavePayload {
  const landing = isRecord(tenant.payloadSettings.landing) ? tenant.payloadSettings.landing : {};
  return {
    corporateId: tenant.corporateId,
    dbHost: tenant.dbHost,
    dbName: tenant.dbName,
    dbPort: tenant.dbPort,
    dbSecretRef: tenant.dbSecretRef,
    dbType: tenant.dbType,
    dbUser: tenant.dbUser,
    defaultLandingApp,
    enabledModuleKeys: tenant.enabledModuleKeys,
    mobile: tenant.mobile,
    payloadSettings: {
      ...tenant.payloadSettings,
      landing: { ...landing, app: defaultLandingApp, mode: "tenant" }
    },
    primaryDomain: tenant.primaryDomain,
    slug: tenant.slug,
    status: tenant.status,
    tenantCode: tenant.tenantCode,
    tenantName: tenant.tenantName
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
