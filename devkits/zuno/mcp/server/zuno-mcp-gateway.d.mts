export function createZunoMcpGateway(options: {
  readonly appMode: "development" | "production";
  readonly auditPath: string;
  readonly repositoryRoot: string;
}): {
  handle(request: unknown, actor: { readonly id: string; readonly roles: readonly string[]; readonly permissions: readonly string[] }): Promise<unknown>;
};
