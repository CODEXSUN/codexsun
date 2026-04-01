import {
  bootstrapSnapshotSchema,
  deliveryChannels,
  productModules,
  type BootstrapSnapshot,
} from '@shared/index'

export class SystemOverviewRepository {
  getSnapshot(): BootstrapSnapshot {
    const snapshot: BootstrapSnapshot = {
      productName: 'codexsun',
      mission:
        'Build a production-oriented ERP, CRM, commerce, billing, and reporting platform on a shared TypeScript codebase.',
      channels: deliveryChannels,
      modules: productModules,
      engineeringRules: [
        'TypeScript everywhere.',
        'No silent failure paths.',
        'Accounting writes must be atomic and traceable.',
        'Never hard-delete financial transactions.',
        'Keep business logic out of UI components.',
        'Centralize shared domain types and validation schemas.',
      ],
    }

    return bootstrapSnapshotSchema.parse(snapshot)
  }
}
