import type { CloudTarget, CloudTargetUpdate } from '@codexsun/orship-contracts'
import { CloudTargetStore } from '../infrastructure/cloud-target.store.js'

export class CloudTargetService {
  constructor(
    private readonly store: CloudTargetStore,
    private readonly sshKeyConfigured: boolean,
  ) {}

  async get(): Promise<CloudTarget> {
    return this.toTarget(await this.store.load())
  }

  async update(target: CloudTargetUpdate): Promise<CloudTarget> {
    await this.store.save(target)
    return this.toTarget(target)
  }

  private toTarget(target: CloudTargetUpdate | undefined): CloudTarget {
    return {
      configured: Boolean(target),
      localWorkspacePath: target?.localWorkspacePath ?? null,
      name: target?.name ?? null,
      repository: target?.repository ?? null,
      sshKeyConfigured: this.sshKeyConfigured,
      targetType: target?.targetType ?? null,
      vps: target?.vps ?? null,
    }
  }
}
