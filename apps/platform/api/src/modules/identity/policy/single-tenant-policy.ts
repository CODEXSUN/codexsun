export interface SingleTenantConfiguration {
  readonly deploymentName: string;
  readonly bootstrapAdminEmail: string;
}

export class SingleTenantPolicy {
  readonly mode = "single";

  constructor(readonly configuration: SingleTenantConfiguration) {}

  appliesToDeployment(deploymentName: string): boolean {
    return deploymentName === this.configuration.deploymentName;
  }
}
