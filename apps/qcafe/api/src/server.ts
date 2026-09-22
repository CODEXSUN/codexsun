import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import { randomUUID } from "node:crypto";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { z } from "zod";
import {
  createPlatformRuntime,
  fastifyHelmetOptions,
  IdentityLoginRateLimitError,
  identityBrowserSessionIdSchema,
  identityErrorResponseSchema,
  identityLoginResponseSchema,
  loadEnabledAddonProviders,
  readApplicationDeployableProfile,
  identityLoginSchema,
  identityPasswordResetAcceptedSchema,
  identityPasswordResetConfirmationSchema,
  identityPasswordResetRequestSchema,
  LocalIdentityStore,
  registerIdentityManagementRoutes,
} from "@codexsun/platform-core";
import { readConfig } from "./config.js";
import { registerQcafeWorkspaceRoute } from "./modules/foundation/routes/qcafe-workspace-route.js";
import { createQcafeProviders } from "./qcafe-provider-catalog.js";
import { createQcafePersistence, prepareQcafePersistence } from "./modules/foundation/persistence/qcafe-persistence.js";
import { FoundationSetupRepository } from "./modules/foundation/repository/foundation-setup.repository.js";
import { FoundationSetupService } from "./modules/foundation/services/foundation-setup.service.js";
import { registerFoundationSetupRoutes } from "./modules/foundation/routes/foundation-setup-route.js";
import { ActivityRepository } from "./modules/foundation/repository/activity.repository.js";
import { MenuRepository } from "./modules/menu/repository/menu.repository.js";
import { MenuService } from "./modules/menu/services/menu.service.js";
import { MenuMediaService } from "./modules/menu/services/menu-media.service.js";
import { MenuAvailabilityService } from "./modules/menu/services/menu-availability.service.js";
import { MenuAvailabilityRepository } from "./modules/menu/repository/menu-availability.repository.js";
import { MenuCustomizationRepository } from "./modules/menu/repository/menu-customization.repository.js";
import { MenuCampaignRepository } from "./modules/menu/repository/menu-campaign.repository.js";
import { MenuSaleabilityRepository } from "./modules/menu/repository/menu-saleability.repository.js";
import { MenuCustomizationService } from "./modules/menu/services/menu-customization.service.js";
import { MenuCampaignService } from "./modules/menu/services/menu-campaign.service.js";
import { MenuSaleabilityService } from "./modules/menu/services/menu-saleability.service.js";
import { MenuMediaStorage } from "./modules/menu/persistence/menu-media.storage.js";
import { registerMenuRoutes } from "./modules/menu/routes/menu-route.js";
import { createQcafeLifecyclePlans } from "./qcafe-lifecycle-plans.js";
import type { Actor } from "@codexsun/platform-core";
import { SettingsRepository } from "./modules/settings/repository/settings.repository.js";
import { SettingsService } from "./modules/settings/services/settings.service.js";
import { registerSettingsRoutes } from "./modules/settings/routes/settings-route.js";
import { PosRepository } from "./modules/pos/repository/pos.repository.js";
import { PosService } from "./modules/pos/services/pos.service.js";
import { registerPosRoutes } from "./modules/pos/routes/pos-route.js";
import { KitchenRepository } from "./modules/kitchen/repository/kitchen.repository.js";
import { KitchenService } from "./modules/kitchen/services/kitchen.service.js";
import { registerKitchenRoutes } from "./modules/kitchen/routes/kitchen-route.js";
import { TableServiceRepository } from "./modules/booking/repository/table-service.repository.js";
import { TableServiceService } from "./modules/booking/services/table-service.service.js";
import { registerTableServiceRoutes } from "./modules/booking/routes/table-service-route.js";
import { BillingRepository } from "./modules/billing/repository/billing.repository.js";
import { BillingService } from "./modules/billing/services/billing.service.js";
import { registerBillingRoutes } from "./modules/billing/routes/billing-route.js";
import { GuestBookingRepository } from "./modules/booking/repository/guest-booking.repository.js";
import { GuestBookingService } from "./modules/booking/services/guest-booking.service.js";
import { registerGuestBookingRoutes } from "./modules/booking/routes/guest-booking-route.js";
import { EventSalesRepository } from "./modules/booking/repository/event-sales.repository.js";
import { EventSalesService } from "./modules/booking/services/event-sales.service.js";
import { registerEventSalesRoutes } from "./modules/booking/routes/event-sales-route.js";

const config = readConfig();
const persistence = createQcafePersistence(config.persistence, createQcafeLifecyclePlans());
await prepareQcafePersistence(persistence, config.appMode);
const identity = new LocalIdentityStore(config);
await identity.initialize();
const providers = createQcafeProviders();
const profile = readApplicationDeployableProfile({
  applicationId: "qcafe",
  availableProviderIds: ["platform.core", ...providers.map((provider) => provider.manifest.id)],
});
const runtime = createPlatformRuntime(profile, [...providers, ...(await loadEnabledAddonProviders(profile))], {
  storageRoot: config.storageRoot,
});
runtime.start();
const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
await app.register(helmet, fastifyHelmetOptions);
await app.register(cors, {
  origin: process.env.QCAFE_WEB_ORIGIN,
  methods: ["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE"],
  allowedHeaders: [
    "Authorization",
    "Content-Type",
    "X-Codexsun-Browser-Session",
    "X-Codexsun-Auto-Login-Desk",
    "X-Correlation-Id",
  ],
});
await app.register(swagger, {
  openapi: { info: { title: "Q Cafe API", version: "1.0.0" }, openapi: "3.0.3" },
  transform: jsonSchemaTransform,
});
await app.register(swaggerUi, {
  routePrefix: "/api/internal/reference",
  uiHooks: {
    onRequest: (request, reply, done) => {
      if (request.headers.authorization !== `Bearer ${config.apiReferenceToken}`)
        return reply.code(401).send({ error: "Authentication required." });
      done();
    },
  },
});
app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);
  return reply.code(500).send({ error: "Internal server error.", code: "server.internal" });
});
app.post(
  "/api/v1/qcafe/auth/login",
  {
    schema: {
      body: identityLoginSchema,
      response: {
        200: identityLoginResponseSchema,
        400: identityErrorResponseSchema,
        401: identityErrorResponseSchema,
        429: identityErrorResponseSchema,
      },
    },
  },
  async (request, reply) => {
    const credentials = identityLoginSchema.safeParse(request.body);
    const browserSessionId = identityBrowserSessionIdSchema.safeParse(request.headers["x-codexsun-browser-session"]);
    if (!credentials.success) return reply.code(400).send({ error: "Invalid login request." });
    if (!browserSessionId.success) return reply.code(400).send({ error: "Invalid browser session." });
    let session;
    try {
      session = await identity.login(
        credentials.data.identifier,
        credentials.data.password,
        browserSessionId.data,
        "user",
      );
    } catch (error) {
      if (error instanceof IdentityLoginRateLimitError)
        return reply.code(429).send({ error: "Too many sign-in attempts. Try again later." });
      throw error;
    }
    if (!session) return reply.code(401).send({ error: "Invalid login." });
    return session;
  },
);
app.post(
  "/api/v1/qcafe/auth/:portal/login",
  {
    schema: {
      params: z.object({ portal: z.enum(["admin", "super-admin"]) }),
      body: identityLoginSchema,
      response: {
        200: identityLoginResponseSchema,
        400: identityErrorResponseSchema,
        401: identityErrorResponseSchema,
        429: identityErrorResponseSchema,
      },
    },
  },
  async (request, reply) => {
    const credentials = identityLoginSchema.safeParse(request.body);
    const portal = z.object({ portal: z.enum(["admin", "super-admin"]) }).safeParse(request.params);
    const browserSessionId = identityBrowserSessionIdSchema.safeParse(request.headers["x-codexsun-browser-session"]);
    if (!credentials.success || !portal.success || !browserSessionId.success)
      return reply.code(400).send({ error: "Invalid login request." });
    try {
      const session = await identity.login(
        credentials.data.identifier,
        credentials.data.password,
        browserSessionId.data,
        portal.data.portal,
      );
      return session ?? reply.code(401).send({ error: "Invalid login." });
    } catch (error) {
      if (error instanceof IdentityLoginRateLimitError)
        return reply.code(429).send({ error: "Too many sign-in attempts. Try again later." });
      throw error;
    }
  },
);
app.post("/api/v1/qcafe/auth/development-login", async (request, reply) => {
  const browserSessionId = identityBrowserSessionIdSchema.safeParse(request.headers["x-codexsun-browser-session"]);
  if (!config.autoLogin || !browserSessionId.success) return reply.code(404).send();
  const session = await identity.autoLogin(browserSessionId.data, request.headers["x-codexsun-auto-login-desk"]);
  return session ?? reply.code(401).send({ error: "Development login is unavailable." });
});
app.post(
  "/api/v1/qcafe/auth/password-reset/request",
  { schema: { body: identityPasswordResetRequestSchema, response: { 202: identityPasswordResetAcceptedSchema } } },
  async (request, reply) => {
    const requestBody = identityPasswordResetRequestSchema.safeParse(request.body);
    const reset = requestBody.success ? await identity.requestPasswordReset(requestBody.data.identifier) : undefined;
    return reply.code(202).send({
      message: "If the account exists, a reset request was created.",
      ...(config.exposeDevelopmentResetToken && reset ? { developmentToken: reset.token } : {}),
    });
  },
);
app.post(
  "/api/v1/qcafe/auth/password-reset/confirm",
  {
    schema: {
      body: identityPasswordResetConfirmationSchema,
      response: { 204: z.null(), 400: identityErrorResponseSchema },
    },
  },
  async (request, reply) => {
    const confirmation = identityPasswordResetConfirmationSchema.safeParse(request.body);
    if (!confirmation.success || !(await identity.resetPassword(confirmation.data.token, confirmation.data.password)))
      return reply.code(400).send({ error: "The reset token is invalid or expired." });
    return reply.code(204).send(null);
  },
);
const requestActors = new WeakMap<object, Actor>();
app.addHook("onRequest", async (request, reply) => {
  if (isPublicPath(request.url)) return;
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) {
    return reply.code(401).send({ error: "Authentication required." });
  }
  requestActors.set(request, actor);
});
app.post("/api/v1/qcafe/auth/logout", async (request, reply) => {
  const didLogout = identity.logout(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  return reply.code(didLogout ? 204 : 401).send(null);
});
registerIdentityManagementRoutes({ app, identity, prefix: "/api/v1/qcafe" });
const activity = new ActivityRepository(persistence.database());
const contextFor = (request: object & { headers: Record<string, unknown> }) => {
  const actor = requestActors.get(request);
  if (!actor) throw new Error("Authenticated command context is unavailable.");
  const supplied = request.headers["x-correlation-id"];
  const correlationId = typeof supplied === "string" && /^[0-9a-f-]{36}$/i.test(supplied) ? supplied : randomUUID();
  return { actorId: actor.id, correlationId };
};
const foundationSetup = new FoundationSetupService(
  new FoundationSetupRepository(persistence.database()),
  config.persistence,
  activity,
);
await registerFoundationSetupRoutes(app, foundationSetup, contextFor);
const menuRepository = new MenuRepository(persistence.database());
const menu = new MenuService(menuRepository, activity);
const menuMedia = new MenuMediaService(
  menuRepository,
  menu,
  runtime.engine.require<MenuMediaStorage>("qcafe.menu.media-storage"),
  activity,
);
const menuAvailability = new MenuAvailabilityService(
  new MenuAvailabilityRepository(persistence.database()),
  menu,
  activity,
);
const menuCustomization = new MenuCustomizationService(
  new MenuCustomizationRepository(persistence.database()),
  menu,
  activity,
);
const menuCampaigns = new MenuCampaignService(new MenuCampaignRepository(persistence.database()), menu, activity);
const menuSaleability = new MenuSaleabilityService(
  new MenuSaleabilityRepository(persistence.database()),
  menuAvailability,
  menuCampaigns,
);
await registerMenuRoutes(
  app,
  menu,
  menuMedia,
  menuAvailability,
  menuCustomization,
  menuCampaigns,
  menuSaleability,
  contextFor,
);
const settings = new SettingsService(new SettingsRepository(persistence.database()), activity, config.persistence, () =>
  persistence.verify(),
);
await registerSettingsRoutes(app, settings, contextFor);
const pos = new PosService(new PosRepository(persistence.database()), menu, menuSaleability, activity);
const kitchen = new KitchenService(new KitchenRepository(persistence.database()), pos, activity);
const billing = new BillingService(new BillingRepository(persistence.database()), pos, activity);
const tableService = new TableServiceService(
  new TableServiceRepository(persistence.database()),
  activity,
  async (orderId) => {
    const snapshot = await pos.snapshot(orderId);
    return Boolean(snapshot && ["cancelled", "fulfilled"].includes(snapshot.order.status));
  },
);
const guestBooking = new GuestBookingService(
  new GuestBookingRepository(persistence.database()),
  tableService,
  pos,
  activity,
);
const eventSales = new EventSalesService(new EventSalesRepository(persistence.database()), billing, activity);
await registerPosRoutes(
  app,
  pos,
  (orderId, context) => kitchen.fireOrder(orderId, context),
  (orderId) => kitchen.assertOrderReady(orderId),
  (orderId) => billing.assertOrderSettled(orderId),
  contextFor,
);
await registerKitchenRoutes(app, kitchen, contextFor);
await registerTableServiceRoutes(app, tableService, contextFor);
await registerBillingRoutes(app, billing, contextFor);
await registerGuestBookingRoutes(app, guestBooking, contextFor);
await registerEventSalesRoutes(app, eventSales, contextFor);
app.get(
  "/api/v1/qcafe/health",
  {
    schema: {
      response: { 200: z.object({ status: z.literal("ok"), providers: z.array(z.string()) }) },
      tags: ["System"],
    },
  },
  async () => ({ status: "ok" as const, providers: [...runtime.enabledProviderIds] }),
);
await registerQcafeWorkspaceRoute(app, [...runtime.enabledProviderIds]);
app.addHook("onClose", async () => {
  identity.close();
  runtime.stop();
  await persistence.destroy();
});
await app.listen({ host: config.host, port: config.port });

function isPublicPath(url: string): boolean {
  const path = new URL(url, "http://localhost").pathname;
  return (
    path === "/api/v1/qcafe/auth/login" ||
    path === "/api/v1/qcafe/auth/admin/login" ||
    path === "/api/v1/qcafe/auth/super-admin/login" ||
    path === "/api/v1/qcafe/auth/development-login" ||
    path === "/api/v1/qcafe/auth/password-reset/request" ||
    path === "/api/v1/qcafe/auth/password-reset/confirm" ||
    path.startsWith("/api/v1/qcafe/guest/qr/") ||
    path === "/api/v1/qcafe/health" ||
    path === "/api/internal/reference" ||
    path.startsWith("/api/internal/reference/")
  );
}
