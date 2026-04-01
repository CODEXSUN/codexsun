import {
  buildBillingWorkspaceSnapshot,
  type BillingWorkspaceResponse,
} from '@billing-core/index'
import { BillingAccountingRepository } from '../data/billing-accounting-repository'

export class BillingWorkspaceService {
  constructor(
    private readonly repository: BillingAccountingRepository,
  ) {}

  async getWorkspace(): Promise<BillingWorkspaceResponse> {
    return {
      workspace: buildBillingWorkspaceSnapshot(await this.repository.readWorkspaceState()),
    }
  }
}
