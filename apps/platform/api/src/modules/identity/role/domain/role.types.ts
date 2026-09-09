import type { IdentityPortal } from '@codexsun/platform-contracts'

export interface IdentityRoleRecord {
  id: string
  name: string
  permissions: readonly string[]
  portal: IdentityPortal
}
