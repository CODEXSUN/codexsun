import {
  createDefaultBillingWorkspaceState,
  type BillingWorkspaceState,
} from '@billing-core/index'

export class BillingWorkspaceSeedRepository {
  readWorkspaceState(): BillingWorkspaceState {
    return createDefaultBillingWorkspaceState()
  }
}
