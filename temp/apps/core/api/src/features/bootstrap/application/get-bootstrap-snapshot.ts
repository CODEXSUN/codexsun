import type { BootstrapSnapshot } from '@shared/index'
import type { SystemOverviewRepository } from '../data/system-overview-repository'

export class GetBootstrapSnapshot {
  constructor(private readonly repository: SystemOverviewRepository) {}

  execute(): BootstrapSnapshot {
    return this.repository.getSnapshot()
  }
}
