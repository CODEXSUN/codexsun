import type {
  CodexsunDevice,
  CodexsunDeviceKind,
  CodexsunDevicesGateway,
  CodexsunDevicesScope
} from "./devices.types";

export class CodexsunDevicesService {
  constructor(
    private readonly gateway: CodexsunDevicesGateway,
    private readonly scope: CodexsunDevicesScope
  ) {}

  async list(): Promise<CodexsunDevice[]> {
    await this.checkContext();
    return this.gateway.get<CodexsunDevice[]>("/codexsun/devices");
  }

  async register(deviceKey: string, kind: CodexsunDeviceKind): Promise<CodexsunDevice> {
    await this.checkContext();
    return this.gateway.post<CodexsunDevice>("/codexsun/devices", {
      deviceKey,
      kind,
      label: `${kind.charAt(0).toUpperCase()}${kind.slice(1)} portal`
    });
  }

  async heartbeat(uuid: string): Promise<void> {
    await this.checkContext();
    await this.gateway.post(`/codexsun/devices/${encodeURIComponent(uuid)}/heartbeat`, {});
  }

  private async checkContext(): Promise<void> {
    const context = await this.gateway.get<CodexsunDevicesScope>("/codexsun/context");
    if (
      context.tenantUuid !== this.scope.tenantUuid ||
      context.actorEmail.toLowerCase() !== this.scope.actorEmail.toLowerCase()
    ) {
      throw new Error("Account changed. Reopen Devices before continuing.");
    }
  }
}
