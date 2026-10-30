import { AppError } from "@codexsun/framework/errors";
import { DevicesRepository } from "./devices.repository.js";
import type { DeviceInput, DeviceRecord } from "./devices.types.js";
export class DevicesService {
  constructor(
    private readonly repository: DevicesRepository,
    private readonly actor: string
  ) {}
  list() {
    return this.repository.list(this.actor);
  }
  register(input: DeviceInput) {
    return this.repository.register(input, this.actor);
  }
  async heartbeat(uuid: string) {
    const record = await this.get(uuid);
    if (record.status !== "active")
      throw AppError.conflict("Inactive devices cannot send a heartbeat.");
    await this.repository.heartbeat(uuid, this.actor);
    return this.get(uuid);
  }
  async setStatus(uuid: string, status: DeviceRecord["status"]) {
    await this.get(uuid);
    await this.repository.setStatus(uuid, this.actor, status);
    return this.get(uuid);
  }
  private async get(uuid: string) {
    const record = await this.repository.get(uuid, this.actor);
    if (!record) throw AppError.notFound("Device was not found.");
    return record;
  }
}
