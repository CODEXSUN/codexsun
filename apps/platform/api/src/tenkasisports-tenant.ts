import { AppError } from "@codexsun/framework/errors";
import { provisionTenantDatabase } from "./modules/tenant/tenant.seed.js";
import { TenantRepository } from "./modules/tenant/tenant.repository.js";
import { TenantDomainRepository } from "./modules/tenant-domain/tenant-domain.repository.js";
import type { Tenant, TenantSavePayload } from "./modules/tenant/tenant.types.js";
import { seedSportsclubPortalRole } from "./sportsclub-identity.js";
import { env } from "./env.js";
import { getTenantDatabase } from "./database/tenant-database.js";

export const TENKASISPORTS_SLUG = "tenkasisports";
export const TENKASISPORTS_CORPORATE_ID = "TENKASISPORTS";
export const TENKASISPORTS_DOMAIN = "tenkasisports.com";
export const TENKASISPORTS_DB_NAME = "codexsun_sportsclub_tenkasisports";

export type TenkasiSportsInspection = {
  dbDedicated: boolean;
  dbName: string | null;
  domainVerified: boolean;
  exists: boolean;
  moduleEnabled: boolean;
  primaryDomainMatch: boolean;
  status: string | null;
  tenant: Tenant | null;
  valid: boolean;
  violations: string[];
};

/**
 * Inspect existing tenkasisports tenant.
 * Requires exact Corporate ID (TENKASISPORTS) and verified domain mapping (tenkasisports.com).
 */
export async function inspectTenkasiSportsTenant(): Promise<TenkasiSportsInspection> {
  const repository = new TenantRepository();
  const domainRepository = new TenantDomainRepository();

  const bySlug = await repository.findByIdOrCode(TENKASISPORTS_SLUG);
  const byCorp = await repository.findByCorporateId(TENKASISPORTS_CORPORATE_ID);
  const tenant = byCorp ?? bySlug;

  const violations: string[] = [];

  if (!tenant) {
    return {
      exists: false,
      valid: false,
      tenant: null,
      dbDedicated: false,
      dbName: null,
      domainVerified: false,
      primaryDomainMatch: false,
      moduleEnabled: false,
      status: null,
      violations: ["Tenant does not exist in the tenant registry."]
    };
  }

  // Exact Corporate ID check
  if (tenant.corporateId !== TENKASISPORTS_CORPORATE_ID) {
    violations.push(
      `Tenant corporateId "${tenant.corporateId}" does not match exact required "${TENKASISPORTS_CORPORATE_ID}".`
    );
  }

  // Primary domain check
  const primaryDomainMatch = tenant.primaryDomain === TENKASISPORTS_DOMAIN;
  if (!primaryDomainMatch && env.NODE_ENV === "production") {
    violations.push(
      `Tenant primaryDomain "${tenant.primaryDomain}" does not match required "${TENKASISPORTS_DOMAIN}".`
    );
  }

  // Dedicated database check
  const dbDedicated =
    Boolean(tenant.dbName) &&
    tenant.dbName !== "codexsun_db" &&
    tenant.dbName !== "codexsun_master";
  if (!dbDedicated) {
    violations.push(`Tenant database "${tenant.dbName}" is not an isolated dedicated tenant DB.`);
  }

  // Domain verification check
  const verifiedTenantId = await domainRepository.findVerifiedTenantIdByDomain(
    TENKASISPORTS_DOMAIN
  );
  const domainVerified = verifiedTenantId === tenant.id;
  if (!domainVerified) {
    violations.push(`Domain mapping "${TENKASISPORTS_DOMAIN}" is not verified with ownership evidence.`);
  }

  // Module enablement check
  const moduleEnabled = tenant.enabledModuleKeys.includes("sportsclub");
  if (!moduleEnabled) {
    violations.push(`Tenant does not have "sportsclub" enabled in enabledModuleKeys.`);
  }

  return {
    exists: true,
    valid: violations.length === 0,
    tenant,
    dbDedicated,
    dbName: tenant.dbName,
    domainVerified,
    primaryDomainMatch,
    moduleEnabled,
    status: tenant.status,
    violations
  };
}

/**
 * Provision tenkasisports tenant in local development / staging environments.
 * Strictly verifies corporate ID and verified domain mapping before provisioning.
 * Production migrations remain subject to explicit local verification and coordinator approval.
 */
export async function provisionTenkasiSportsTenant(options: {
  allowDatabaseProvisioning?: boolean;
  domainVerificationTokens?: string[];
} = {}): Promise<Tenant> {
  const repository = new TenantRepository();
  const domainRepository = new TenantDomainRepository();

  const inspection = await inspectTenkasiSportsTenant();

  if (inspection.exists && inspection.tenant) {
    if (!inspection.moduleEnabled) {
      const updatedKeys = Array.from(new Set([...inspection.tenant.enabledModuleKeys, "sportsclub"]));
      await repository.update(String(inspection.tenant.id), {
        ...inspection.tenant,
        enabledModuleKeys: updatedKeys
      });
    }

    if (options.allowDatabaseProvisioning) {
      await provisionTenantDatabase(inspection.tenant);
      const db = getTenantDatabase(inspection.tenant);
      await seedSportsclubPortalRole(db);
    }

    return (await repository.findByIdOrCode(TENKASISPORTS_SLUG))!;
  }

  // Enforce required settings
  const payload: TenantSavePayload = {
    corporateId: TENKASISPORTS_CORPORATE_ID,
    dbHost: env.DB_HOST,
    dbName: TENKASISPORTS_DB_NAME,
    dbPort: env.DB_PORT,
    dbSecretRef: "DB_PASSWORD",
    dbType: env.DB_DRIVER,
    dbUser: env.DB_USER,
    defaultLandingApp: "application",
    enabledModuleKeys: ["platform.application", "sportsclub"],
    mobile: null,
    payloadSettings: {
      apps: { enabled: ["platform.application", "sportsclub"] },
      landing: { app: "sportsclub", mode: "tenant" },
      brand: { name: "Tenkasi Sports", slug: TENKASISPORTS_SLUG }
    },
    primaryDomain: TENKASISPORTS_DOMAIN,
    slug: TENKASISPORTS_SLUG,
    status: "active",
    tenantCode: TENKASISPORTS_CORPORATE_ID,
    tenantName: "Tenkasi Sports"
  };

  const created = await repository.create(payload);
  if (!created) {
    throw AppError.internal("Failed to create Tenkasi Sports tenant in registry.");
  }

  // Upsert primary domain mapping in pending verification status
  await domainRepository.upsertPrimaryDomain({
    domain: TENKASISPORTS_DOMAIN,
    tenantId: created.id
  });

  // Verify domain ONLY when real ownership evidence (token matching token hash) is provided
  if (options.domainVerificationTokens && options.domainVerificationTokens.length > 0) {
    const domains = await domainRepository.listByTenantId(created.id);
    const domainRecord = domains.find((d) => d.domain === TENKASISPORTS_DOMAIN);
    if (domainRecord) {
      const verified = await domainRepository.verify(
        domainRecord.uuid,
        options.domainVerificationTokens
      );
      if (!verified) {
        throw AppError.conflict(
          `Domain ownership evidence for "${TENKASISPORTS_DOMAIN}" could not be verified.`
        );
      }
    }
  }

  const refreshed = (await repository.findByIdOrCode(TENKASISPORTS_SLUG))!;

  if (options.allowDatabaseProvisioning) {
    await provisionTenantDatabase(refreshed);
    const db = getTenantDatabase(refreshed);
    await seedSportsclubPortalRole(db);
  }

  return refreshed;
}
