export type CodexsunSocketCredentials = {
  cookie: string;
  sessionSlot: string;
  host: string;
  origin?: string;
  bearer?: string;
};
export type CodexsunSocketIdentity = {
  tenantUuid: string;
  actorEmail: string;
  permissions: Record<string, boolean>;
};
export type AuthenticateCodexsunSocket = (
  credentials: CodexsunSocketCredentials
) => Promise<CodexsunSocketIdentity>;
export type CodexsunChange = {
  tenantUuid: string;
  actorEmail: string;
  resource: "requirements" | "devices";
  uuid: string;
  revision?: number;
  action: string;
};
