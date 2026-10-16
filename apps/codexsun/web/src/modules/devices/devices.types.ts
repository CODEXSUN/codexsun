export type CodexsunDeviceKind = "web" | "desktop" | "mobile";
export type CodexsunDevice = {
  uuid: string;
  deviceKey: string;
  label: string;
  kind: CodexsunDeviceKind;
  lastSeenAt: string;
};
export type CodexsunDevicesGateway = {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
};
export type CodexsunDevicesScope = { tenantUuid: string; actorEmail: string };
