import type { IdentityDevice, IdentityDeviceInput } from '@codexsun/platform-contracts'
import { randomBytes } from 'node:crypto'
import type { IdentityRepository } from '../../domain/identity.ports.js'
import { IdentityDeviceActivationError } from '../../domain/identity.errors.js'
import { hashIdentityToken } from '../../session/domain/session-token.js'
import type { IdentityDeviceDecision } from '../../domain/identity.types.js'
import type { StoredIdentityDevice } from '../domain/device.types.js'

export class IdentityDeviceService {
  constructor(
    private readonly repository: IdentityRepository,
    private readonly clock: () => Date,
  ) {}

  async verifyOrRegister(
    userId: string,
    input: IdentityDeviceInput,
    trustNewDevice = false,
  ): Promise<IdentityDeviceDecision> {
    const existing = await this.repository.findDevice(userId, input.deviceId)
    if (existing) return this.verifyExisting(existing, input.deviceToken)

    const deviceToken = randomBytes(32).toString('base64url')
    const now = this.clock()
    const candidate: StoredIdentityDevice = {
      activatedAt: null,
      activatedBy: null,
      clientType: input.clientType,
      deviceId: input.deviceId,
      deviceName: input.deviceName,
      firstSeenAt: now,
      lastSeenAt: now,
      status: 'pending',
      tokenHash: hashIdentityToken(deviceToken),
      userId,
    }
    const device = await this.repository.createDevice(candidate, trustNewDevice)
    if (device.status !== 'active') {
      throw new IdentityDeviceActivationError(
        'This device needs approval from a trusted device or super administrator.',
        deviceToken,
      )
    }
    return { device, deviceToken }
  }

  async activate(actorUserId: string, userId: string, deviceId: string): Promise<void> {
    await this.repository.updateDeviceStatus(userId, deviceId, 'active', actorUserId, this.clock())
  }

  list(userId: string) {
    return this.repository.listDevices(userId)
  }

  private async verifyExisting(
    device: StoredIdentityDevice,
    deviceToken: string | undefined,
  ): Promise<IdentityDeviceDecision> {
    if (
      !deviceToken ||
      hashIdentityToken(deviceToken) !== device.tokenHash ||
      device.status !== 'active'
    ) {
      throw new IdentityDeviceActivationError('This device is not activated.')
    }
    await this.repository.updateDeviceSeen(device.userId, device.deviceId, this.clock())
    return { device: { ...device, lastSeenAt: this.clock() } }
  }
}

export function publicDevice(device: StoredIdentityDevice): IdentityDevice {
  return {
    activatedAt: device.activatedAt?.toISOString() ?? null,
    clientType: device.clientType,
    deviceId: device.deviceId,
    deviceName: device.deviceName,
    firstSeenAt: device.firstSeenAt.toISOString(),
    lastSeenAt: device.lastSeenAt.toISOString(),
    status: device.status,
  }
}
