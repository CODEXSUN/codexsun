import { type ModuleProvider, type ProviderRegistrationContext } from "@codexsun/framework";
import { actorSchema } from "@codexsun/platform-core";
import { JwtIdentityAuthenticator, type JwtIdentityAuthenticationConfig } from "./auth/jwt-identity-authenticator.js";
import { IdentityController } from "./controller/identity.controller.js";
import { SingleTenantPolicy, type SingleTenantConfiguration } from "./policy/single-tenant-policy.js";
import { InMemoryIdentityRepository } from "./repository/identity.repository.js";
import { IdentityService } from "./service/identity.service.js";

export class IdentityModuleProvider implements ModuleProvider {
  constructor(
    private readonly authentication: JwtIdentityAuthenticationConfig,
    private readonly singleTenant: SingleTenantConfiguration,
  ) {}

  readonly manifest = {
    id: "platform.identity",
    owner: "apps/platform/api/modules/identity",
    version: "1.0.6",
    dependencies: ["platform.core"],
    contracts: ["identity.actor.read", "identity.authorization", "identity.single-tenant-policy"],
  };

  register(context: ProviderRegistrationContext): void {
    const repository = new InMemoryIdentityRepository([platformOperator]);
    const service = new IdentityService(repository);
    context.provide("identity.service", service);
    context.provide("identity.controller", new IdentityController(service));
    context.provide("identity.authenticator", new JwtIdentityAuthenticator(this.authentication, service));
    context.provide("identity.single-tenant-policy", new SingleTenantPolicy(this.singleTenant));
  }
}

const platformOperator = actorSchema.parse({
  id: "platform.operator",
  kind: "service",
  roles: ["platform.operator"],
  permissions: ["platform.health.read"],
});
