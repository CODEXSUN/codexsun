import type { FastifyInstance, FastifyRequest } from "fastify";
import { AppError } from "@codexsun/framework/errors";
import { getCompanyForDatabase, getDefaultCompanyForDatabase } from "@codexsun/core-api";
import { registerMarketing, marketingBrandScope, type MarketingContext } from "@codexsun/marketing-api";
import { tenantAccessContext } from "./auth/tenant-access-context.js";
import { TenantRepository } from "./modules/tenant/tenant.repository.js";
import { EntitlementRepository } from "./modules/entitlement/entitlement.repository.js";

export async function marketingContext(request: FastifyRequest): Promise<MarketingContext> {
  if (!request.authContext) throw AppError.forbidden("An authenticated tenant session is required.");
  const access = tenantAccessContext(request);
  const tenant = await new TenantRepository().findByIdOrCode(access.tenantId);
  if (!tenant || tenant.status !== "active" || tenant.dbName !== access.tenantDatabase)
    throw AppError.forbidden("The tenant is unavailable.");
  const modules = await new EntitlementRepository().resolveTenantModuleKeys(tenant.id);
  if (!modules.includes("marketing")) throw AppError.forbidden("Marketing is not enabled for this tenant.");
  const settings = await access.database.selectFrom("app_module_settings").select("id")
    .where("module_key", "=", "marketing").where("enabled", "=", true).where("status", "=", "active").executeTakeFirst();
  if (!settings) throw AppError.forbidden("Marketing is not active.");
  const defaults = await getDefaultCompanyForDatabase(access.tenantDatabase);
  const companyId = defaults?.companyId;
  const company = companyId ? await getCompanyForDatabase(access.tenantDatabase, companyId) : null;
  if (!company || !companyId || company.status !== "active") throw AppError.validation("Select an active application default company.");
  let allBrands = false;
  try { await access.authorize("marketing.brand.record.manage-all"); allBrands = true; }
  catch (error) { if (!(error instanceof AppError) || error.code !== "FORBIDDEN") throw error; }
  const context: MarketingContext = { ...access, database: access.database as never, companyId, allBrands, allowedBrands: [] };
  context.allowedBrands = await marketingBrandScope(context);
  return context;
}

export function registerMarketingHost(app: FastifyInstance) {
  return registerMarketing(app, { context: marketingContext });
}
