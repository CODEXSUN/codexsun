export type ClientRuntimeProfile = "static" | "dynamic" | "dynamic-forms" | "dynamic-backoffice" | "custom";
export type WorkspaceStatus = "active" | "draft" | "archived";
export type EnvironmentName = "development" | "staging" | "production";
export type EnvironmentState = "planned" | "ready" | "degraded" | "offline";
export type DeploymentState = "queued" | "building" | "ready" | "failed" | "rolled-back";

export type SiteEnvironment = {
  id: string;
  clientSlug: string;
  name: EnvironmentName;
  state: EnvironmentState;
  publicOrigin: string;
  databaseName: string;
  imageTag: string;
  updatedAt: string;
};

export type SiteDeployment = {
  id: string;
  clientSlug: string;
  environment: EnvironmentName;
  releaseTag: string;
  sourceRef: string;
  state: DeploymentState;
  requestedAt: string;
  completedAt?: string;
  errorMessage?: string;
};

export type ClientWorkspace = {
  slug: string;
  name: string;
  description: string;
  status: WorkspaceStatus;
  runtimeProfile: ClientRuntimeProfile;
  sourceRef: string;
  designVersion: string;
  environments: SiteEnvironment[];
  latestDeployment?: SiteDeployment;
  updatedAt: string;
};
