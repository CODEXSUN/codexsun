import { z } from "zod";

export const deploymentPermissionIds = [
  "providers.read", "providers.manage", "targets.read", "targets.manage", "applications.read", "applications.manage",
  "deployments.read", "deployments.create", "deployments.cancel", "deployments.rollback", "logs.read",
  "secrets.read-reference", "health.read",
] as const;

export type DeploymentPermission = typeof deploymentPermissionIds[number];
export type DeploymentProviderKind = "dokploy";
export type DeploymentSource = "docker" | "compose" | "git";
export type DeploymentOperation = "deploy" | "redeploy" | "stop" | "start" | "rollback";

export const deploymentProviderKindSchema = z.literal("dokploy");
export const deploymentSourceSchema = z.enum(["docker", "compose", "git"]);

export type ProviderRegistrationInput = {
  readonly name: string;
  readonly kind: DeploymentProviderKind;
  readonly baseUrl: string;
  readonly accessTokenReference: string;
};

export type ProviderSummary = ProviderRegistrationInput & { readonly id: string; readonly status: "registered" | "unavailable" | "ready" };
export type DeploymentTarget = { readonly id: string; readonly name: string; readonly address: string; readonly status: string; readonly production: boolean; readonly providerTargetId: string };
export type ApplicationSource = { readonly type: DeploymentSource; readonly repository?: string; readonly branch?: string; readonly image?: string; readonly composeFile?: string };
export type DeploymentApplication = { readonly id: string; readonly name: string; readonly source: ApplicationSource; readonly targetId: string; readonly providerApplicationId: string; readonly status: string };
export type EnvironmentVariable = { readonly name: string; readonly value?: string; readonly secretReference?: string };
export type DeploymentRecord = { readonly id: string; readonly providerDeploymentId?: string; readonly status: string; readonly operation: DeploymentOperation; readonly applicationId: string; readonly targetId: string; readonly message?: string };
export type DeploymentLog = { readonly timestamp?: string; readonly level?: string; readonly message: string };
export type HealthResult = { readonly status: "healthy" | "unhealthy" | "unknown"; readonly message: string; readonly checkedAt: string };

export interface DeploymentProvider {
  registerProvider(input: ProviderRegistrationInput): Promise<ProviderSummary>;
  listTargets(): Promise<DeploymentTarget[]>;
  testTarget(target: DeploymentTarget): Promise<HealthResult>;
  createApplication(input: { readonly name: string; readonly source: ApplicationSource; readonly target: DeploymentTarget }): Promise<DeploymentApplication>;
  updateApplication(application: DeploymentApplication, source: ApplicationSource): Promise<DeploymentApplication>;
  deleteApplication(application: DeploymentApplication): Promise<void>;
  deployApplication(application: DeploymentApplication): Promise<DeploymentRecord>;
  redeployApplication(application: DeploymentApplication): Promise<DeploymentRecord>;
  stopApplication(application: DeploymentApplication): Promise<DeploymentRecord>;
  startApplication(application: DeploymentApplication): Promise<DeploymentRecord>;
  rollbackApplication(application: DeploymentApplication, providerRollbackId: string): Promise<DeploymentRecord>;
  getDeploymentStatus(application: DeploymentApplication): Promise<DeploymentRecord[]>;
  getDeploymentLogs(application: DeploymentApplication, providerDeploymentId: string, tail: number): Promise<DeploymentLog[]>;
  setEnvironment(application: DeploymentApplication, variables: readonly EnvironmentVariable[]): Promise<void>;
  listServices(application: DeploymentApplication): Promise<readonly { readonly name: string; readonly status: string }[]>;
  healthCheck(): Promise<HealthResult>;
}

export class DeploymentProviderError extends Error {
  constructor(readonly code: string, message: string, readonly retryable: boolean, options?: ErrorOptions) {
    super(message, options);
    this.name = "DeploymentProviderError";
  }
}
