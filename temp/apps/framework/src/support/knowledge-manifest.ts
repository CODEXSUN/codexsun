export interface SupportKnowledgePath {
  path: string
  sourceType: 'documentation' | 'manifest' | 'route' | 'schema' | 'ui-flow' | 'application-logic'
  topic: string
  module: string
  notes: string
}

export interface SupportKnowledgeManifest {
  id: 'codexsun-support-knowledge'
  version: 1
  platform: string
  purpose: string
  localFirst: boolean
  integrationTarget: string
  allowedUseCases: string[]
  prohibitedSources: string[]
  excludedPaths: string[]
  recommendedPaths: SupportKnowledgePath[]
  riskAreas: string[]
  responseRules: string[]
}

const recommendedPaths: SupportKnowledgePath[] = [
  {
    path: 'README.md',
    sourceType: 'documentation',
    topic: 'platform-overview',
    module: 'platform',
    notes: 'Repository-level introduction and operator-facing context.',
  },
  {
    path: 'ASSIST/Documentation/ARCHITECTURE.md',
    sourceType: 'documentation',
    topic: 'architecture',
    module: 'platform',
    notes: 'Primary ownership and boundary reference for support-safe indexing.',
  },
  {
    path: 'ASSIST/Documentation/PROJECT_OVERVIEW.md',
    sourceType: 'documentation',
    topic: 'product-overview',
    module: 'platform',
    notes: 'High-level explanation of current app suite and product intent.',
  },
  {
    path: 'ASSIST/Documentation/SETUP_AND_RUN.md',
    sourceType: 'documentation',
    topic: 'operations',
    module: 'platform',
    notes: 'Useful for operator support, startup flow, and runtime expectations.',
  },
  {
    path: 'ASSIST/Documentation/SUPPORT_ASSISTANT_BOUNDARY.md',
    sourceType: 'documentation',
    topic: 'support-safety',
    module: 'platform',
    notes: 'Defines what a support assistant may and may not ingest.',
  },
  {
    path: 'apps/framework/src/manifest.ts',
    sourceType: 'manifest',
    topic: 'platform-manifest',
    module: 'framework',
    notes: 'Machine-oriented workspace and framework service metadata.',
  },
  {
    path: 'apps/core/api/src/app/http/router.ts',
    sourceType: 'route',
    topic: 'api-routes',
    module: 'core',
    notes: 'Current suite-host route map for support and workflow tracing.',
  },
  {
    path: 'apps/framework/src/runtime/config/environment.ts',
    sourceType: 'schema',
    topic: 'runtime-config',
    module: 'framework',
    notes: 'Environment keys and runtime URL behavior. Do not ingest secret values.',
  },
  {
    path: 'apps/core/shared/src/schemas',
    sourceType: 'schema',
    topic: 'shared-domain-contracts',
    module: 'core',
    notes: 'Shared domain contracts for support-friendly field explanations.',
  },
  {
    path: 'apps/ecommerce/web/src/features',
    sourceType: 'ui-flow',
    topic: 'erp-and-commerce-workflows',
    module: 'ecommerce',
    notes: 'Business-facing pages, forms, and workflow labels for support guidance.',
  },
  {
    path: 'apps/ecommerce/api/src/features',
    sourceType: 'application-logic',
    topic: 'commerce-operations',
    module: 'ecommerce',
    notes: 'Backend application logic useful for support root-cause hints.',
  },
  {
    path: 'apps/billing',
    sourceType: 'ui-flow',
    topic: 'billing-foundation',
    module: 'billing',
    notes: 'Billing workspace scaffolds and future ERP/accounting surfaces.',
  },
]

export function getSupportKnowledgeManifest(): SupportKnowledgeManifest {
  return {
    id: 'codexsun-support-knowledge',
    version: 1,
    platform: 'codexsun',
    purpose: 'Curated support-assistant ingestion contract for local-first RAG systems such as orekso.',
    localFirst: true,
    integrationTarget: 'orekso',
    allowedUseCases: [
      'Explain ERP and business workflows in business-user language.',
      'Explain fields, statuses, and likely next-step sequences.',
      'Point to relevant modules, routes, and business-safe source references.',
      'Support troubleshooting with explicit uncertainty when evidence is weak.',
    ],
    prohibitedSources: [
      'Runtime env files and secret values.',
      'Live customer data, backups, uploaded private media, and database dumps.',
      'Generated folders, dependency trees, and runtime caches.',
      'Direct mutation of codexsun data without an explicit reviewed API contract.',
    ],
    excludedPaths: [
      '.git/',
      'node_modules/',
      'dist/',
      'build/',
      '.next/',
      'coverage/',
      'tmp/',
      'storage/',
      '.env',
      '.env.*',
      'error.log',
      'package-lock.json',
    ],
    recommendedPaths,
    riskAreas: [
      'accounting',
      'inventory',
      'tax',
      'payments',
      'permissions',
      'customer-private data',
    ],
    responseRules: [
      'Differentiate documented behavior from inference.',
      'Prefer business-user wording over internal developer jargon when possible.',
      'Return source references for operational answers.',
      'State uncertainty clearly instead of hallucinating.',
    ],
  }
}
