import {
  registerCredentialRoutes,
  migrateCredential,
  seedCredentialPermissions
} from "./modules/credential/index.js";
import {
  registerMessageRoutes,
  migrateMessage,
  seedMessagePermissions
} from "./modules/message/index.js";
import {
  registerConversationRoutes,
  migrateConversation,
  seedConversationPermissions
} from "./modules/conversation/index.js";
import {
  registerQuotationRoutes,
  migrateQuotation,
  seedQuotationPermissions
} from "./modules/quotation/index.js";
import { registerBuyerRoutes, migrateBuyer, seedBuyerPermissions } from "./modules/buyer/index.js";
import {
  registerRequirementRoutes,
  migrateRequirement,
  seedRequirementPermissions
} from "./modules/requirement/index.js";
import { migrateBuyerInquiries } from "./modules/inquiry/index.js";
import {
  registerMemberRoutes,
  migrateMember,
  seedMemberPermissions
} from "./modules/member/index.js";
import {
  registerProductRoutes,
  migrateProduct,
  seedProductSamples
} from "./modules/product/index.js";
import { migrateCompanyBranding } from "./modules/company/index.js";
import type { FastifyInstance } from "fastify";
import type { Kysely } from "kysely";
import { runMigrationBatch } from "@codexsun/framework/db";
import type { ResolveTconnectContext, TconnectDatabase } from "./context.js";
import {
  registerAssociationRoutes,
  migrateAssociation,
  seedAssociationSamples
} from "./modules/association/index.js";
import {
  registerCompanyRoutes,
  migrateCompany,
  seedCompanySamples
} from "./modules/company/index.js";
import {
  registerCommunityRoutes,
  migrateCommunity,
  seedCommunitySamples
} from "./modules/community/index.js";
import {
  registerInquiryRoutes,
  migrateInquiry,
  seedTconnectPermissions
} from "./modules/inquiry/index.js";
export type { TconnectContext, ResolveTconnectContext, TconnectDatabase } from "./context.js";
export async function registerTconnect(app: FastifyInstance, resolve: ResolveTconnectContext) {
  await registerAssociationRoutes(app, resolve);
  await registerCompanyRoutes(app, resolve);
  await registerCommunityRoutes(app, resolve);
  await registerInquiryRoutes(app, resolve);
  await registerConversationRoutes(app, resolve);
  await registerMessageRoutes(app, resolve);
  await registerQuotationRoutes(app, resolve);
  await registerBuyerRoutes(app, resolve);
  await registerRequirementRoutes(app, resolve);
  await registerMemberRoutes(app, resolve);
  await registerProductRoutes(app, resolve);
  await registerCredentialRoutes(app, resolve);
}
export const tconnectTenantMigrations = [
  {
    name: "tconnect.credentials.v5",
    description: "Staff-reviewed company credentials and evidence."
  },
  {
    name: "tconnect.negotiation.v4",
    description: "Private buyer-seller conversations and immutable quotations."
  },
  { name: "tconnect.buyers.v3", description: "Buyer accounts, requirements and owned enquiries." },
  {
    name: "tconnect.directory.v1",
    description: "Install TConnect association, company, community, enquiry and audit tables."
  },
  {
    name: "tconnect.members.v2",
    description: "Member-owned accounts, company branding and product catalog."
  }
];
export async function migrateTconnect(database: Kysely<TconnectDatabase>) {
  return runMigrationBatch(database, {
    batch: 1,
    scope: "tconnect",
    description: "TConnect business network",
    version: "1.1.2",
    steps: [
      {
        name: "tconnect.directory.v1",
        description: "Install TConnect tables",
        checksum: "tconnect.directory.v1",
        version: 1,
        up: async (db) => {
          await migrateAssociation(db);
          await migrateCompany(db);
          await migrateCommunity(db);
          await migrateInquiry(db);
        }
      },
      {
        name: "tconnect.members.v2",
        description: "Member-owned accounts and products",
        checksum: "tconnect.members.v2",
        version: 2,
        up: async (db) => {
          await migrateCompanyBranding(db);
          await migrateMember(db);
          await migrateProduct(db);
        }
      },
      {
        name: "tconnect.buyers.v3",
        description: "Buyer accounts and requirements",
        checksum: "tconnect.buyers.v3",
        version: 3,
        up: async (db) => {
          await migrateBuyer(db);
          await migrateRequirement(db);
          await migrateBuyerInquiries(db);
        }
      },
      {
        name: "tconnect.negotiation.v4",
        description: "Private conversations and quotations",
        checksum: "tconnect.negotiation.v4",
        version: 4,
        up: async (db) => {
          await migrateConversation(db);
          await migrateMessage(db);
          await migrateQuotation(db);
        }
      },
      {
        name: "tconnect.credentials.v5",
        description: "Reviewed company credentials",
        checksum: "tconnect.credentials.v5",
        version: 5,
        up: migrateCredential
      }
    ]
  });
}
export async function seedTconnect(database: Kysely<TconnectDatabase>) {
  await seedTconnectPermissions(database);
  await seedCredentialPermissions(database);
  await seedMemberPermissions(database);
  await seedConversationPermissions(database);
  await seedMessagePermissions(database);
  await seedQuotationPermissions(database);
  await seedBuyerPermissions(database);
  await seedRequirementPermissions(database);
}
export async function seedTconnectDemo(database: Kysely<TconnectDatabase>) {
  await seedAssociationSamples(database);
  await seedCompanySamples(database);
  await seedCommunitySamples(database);
  await seedProductSamples(database);
}

export { resolveMemberScope } from "./modules/member/index.js";

export { resolveBuyerScope } from "./modules/buyer/index.js";
