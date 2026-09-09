import type { IdentityPortal } from '@codexsun/platform-contracts'
import type { IdentityRepository } from '../../domain/identity.ports.js'

export class IdentityRoleService {
  constructor(
    private readonly repository: IdentityRepository,
    private readonly createId: () => string,
  ) {}

  list(portal?: IdentityPortal) {
    return this.repository.listRoles(portal)
  }

  async create(name: string, portal: IdentityPortal, permissions: readonly string[]) {
    const role = { id: this.createId(), name: name.trim(), permissions, portal }
    await this.repository.createRole(role)
    return role
  }

  async setPermissions(roleId: string, permissions: readonly string[]): Promise<void> {
    await this.repository.replaceRolePermissions(roleId, permissions, this.createId)
  }

  async assignUserRoles(userId: string, roleIds: readonly string[]): Promise<void> {
    await this.repository.replaceUserRoles(userId, roleIds)
  }
}
