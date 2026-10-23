import { upgradeBrandIntegrity } from "./modules/brand/index.js";
import { consentModule, migrateConsent, seedConsent } from "./modules/consent/index.js";
import type { ConsentDependencies } from "./modules/consent/index.js";
import { upgradeCampaignIntegrity } from "./modules/campaign/index.js";
import { upgradeCaptureIntegrity } from "./modules/capture/index.js";
import { upgradeConnectionIntegrity } from "./modules/connection/index.js";
import { migrateCaptureLimits } from "./modules/capture/index.js";
import { migrateConnectionAuthorization } from "./modules/connection/index.js";
import { submissionModule, migrateSubmission, seedSubmission } from "./modules/submission/index.js";
import type { SubmissionDependencies } from "./modules/submission/index.js";
import type { FastifyInstance } from "fastify";
import { AppError } from "@codexsun/framework/errors";
import { runMigrationBatch } from "@codexsun/framework/db";
import type { Kysely } from "kysely";
import type { MarketingDatabase, MarketingDependencies, MarketingContext } from "./context.js";
import {
  brandModule,
  migrateBrand,
  seedBrand,
  lookupBrand,
  BrandService
} from "./modules/brand/index.js";
import {
  campaignModule,
  migrateCampaign,
  seedCampaign,
  lookupCampaign
} from "./modules/campaign/index.js";
import { captureModule, migrateCapture, seedCapture } from "./modules/capture/index.js";
import { connectionModule, migrateConnection, seedConnection } from "./modules/connection/index.js";
export type { MarketingDatabase, MarketingDependencies, MarketingContext } from "./context.js";
export const marketingApiModuleKeys = [
  brandModule.key,
  campaignModule.key,
  captureModule.key,
  connectionModule.key,
  submissionModule.key,
  consentModule.key
] as const;
export { BrandService } from "./modules/brand/index.js";
export const marketingMigrationBatch = {
  batch: 1,
  scope: "marketing",
  description: "Tenant Marketing foundation.",
  version: "1.1.45",
  steps: [
    {
      name: "marketing.foundation.v1",
      checksum: "marketing.foundation.v1",
      description: "Brands, campaigns, capture definitions, connections and activity.",
      version: 1,
      up: async (database: Kysely<MarketingDatabase>) => {
        await migrateBrand(database);
        await migrateCampaign(database);
        await migrateCapture(database);
        await migrateConnection(database);
      }
    },
    {
      name: "marketing.submission.v1",
      checksum: "marketing.submission.v1",
      description: "Durable Marketing submissions and CRM handoff.",
      version: 2,
      up: migrateSubmission
    },
    {
      name: "marketing.connection.authorization.v1",
      checksum: "marketing.connection.authorization.v1",
      description: "Tenant OAuth states and encrypted provider grants.",
      version: 3,
      up: migrateConnectionAuthorization
    },
    {
      name: "marketing.capture-public.v1",
      checksum: "marketing.capture-public.v1",
      description: "Public capture abuse limits.",
      version: 4,
      up: migrateCaptureLimits
    },
    {
      name: "marketing.integrity.v1",
      checksum: "marketing.integrity.v1",
      description: "Revision guards for Marketing records.",
      version: 5,
      up: async (database: Kysely<MarketingDatabase>) => {
        await upgradeBrandIntegrity(database);
        await upgradeCampaignIntegrity(database);
        await upgradeCaptureIntegrity(database);
        await upgradeConnectionIntegrity(database);
      }
    },
    {
      name: "marketing.consent.v1",
      checksum: "marketing.consent.v1",
      description: "Append-only promotional consent evidence.",
      version: 6,
      up: migrateConsent
    }
  ]
};
export function migrateMarketing(database: Kysely<MarketingDatabase>) {
  return runMigrationBatch(database, marketingMigrationBatch);
}
export async function seedMarketing(database: Kysely<MarketingDatabase>) {
  await seedBrand(database);
  await seedCampaign(database);
  await seedCapture(database);
  await seedConnection(database);
  await seedSubmission(database);
  await seedConsent(database);
}
export async function marketingBrandScope(context: MarketingContext) {
  return (await new BrandService(context).list("", 100000, 0)).map((row) => row.uuid);
}
export async function registerMarketing(
  app: FastifyInstance,
  deps: MarketingDependencies,
  submissions?: SubmissionDependencies,
  policies?: ConsentDependencies
) {
  if (policies) consentModule.register(app, deps, policies);
  const parent = async (context: MarketingContext, input: { brandUuid: string }) => {
    const brand = await lookupBrand(context, input.brandUuid);
    if (brand.status !== "active") throw AppError.validation("Select an active brand.");
  };
  if (submissions) submissionModule.register(app, deps.context, submissions);
  brandModule.register(app, deps, async () => {});
  campaignModule.register(app, deps, parent);
  connectionModule.register(app, deps, parent);
  captureModule.register(app, deps, async (context, input) => {
    await parent(context, input);
    const campaign = await lookupCampaign(context, input.campaignUuid);
    if (campaign.status !== "active" || campaign.brandUuid !== input.brandUuid)
      throw AppError.validation("Select an active campaign from this brand.");
  });
}

export { lookupCapture } from "./modules/capture/index.js";
export { lookupCampaign } from "./modules/campaign/index.js";
export {
  SubmissionService,
  processSubmissionHandoff,
  createSubmissionHandoffJob,
  pendingSubmissionHandoffs,
  submissionInputSchema
} from "./modules/submission/index.js";
export type {
  SubmissionDependencies,
  SubmissionInput,
  SubmissionRecord
} from "./modules/submission/index.js";

export { submissionRouting } from "./modules/submission/index.js";

export {
  registerConnectionAuthorization,
  GoogleChannelConnector
} from "./modules/connection/index.js";
export type { ConnectionAuthorization } from "./modules/connection/index.js";

export { lookupBrand } from "./modules/brand/index.js";

export { registerPublicCapture } from "./modules/capture/index.js";
export type { PublicCaptureDependencies, CaptureBinding } from "./modules/capture/index.js";

export {
  ConsentService,
  migrateConsent,
  seedConsent,
  consentInputSchema,
  eligibilityInputSchema
} from "./modules/consent/index.js";
export type {
  ConsentDependencies,
  ConsentInput,
  ConsentRecord,
  EligibilityInput,
  EligibilityResult
} from "./modules/consent/index.js";
