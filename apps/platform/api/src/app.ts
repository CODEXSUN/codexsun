import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import fastifyRateLimit from '@fastify/rate-limit'
import fastifySensible from '@fastify/sensible'
import fastifyStatic from '@fastify/static'
import fastifyUnderPressure from '@fastify/under-pressure'
import {
  ModuleLifecycleExecutor,
  ModuleRegistry,
  type ModuleCompositionPlan,
} from '@codexsun/framework'
import {
  DeclaredPlatformEventBus,
  PlatformDiagnosticRegistry,
  PlatformRequestContextStore,
  PlatformShutdownRegistry,
  type PlatformApiModule,
  type PlatformApiModuleContext,
} from '@codexsun/platform-core-api'
import {
  livenessDataSchema,
  readinessDataSchema,
  readinessErrorEnvelopeSchema,
  successEnvelopeSchema,
} from '@codexsun/platform-contracts'
import Fastify, { type FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { getProjectRoot, readEnvironment, type Environment } from './config.js'
import { createDatabase, type Database, type PlatformDatabase } from './database.js'
import { createResponseMeta, registerHttpLifecycle } from './http.js'
import { createLoggerOptions } from './logger.js'
import {
  KyselyModuleDataTransactionRunner,
  MariaDbModuleRuntimeLock,
  MariaDbModuleRuntimeRepository,
  ModuleRuntimeCoordinator,
  moduleRuntimeApiModule,
  moduleRuntimeMigrations,
} from './modules/module-runtime/index.js'
import { systemApiModule } from './modules/system/index.js'
import { runReadinessProbes, type ReadinessProbe } from './readiness.js'
import { createStorage, type StorageDirectories } from './storage.js'

const platformVersion = '0.1.0'

export interface PlatformApi {
  composition: ModuleCompositionPlan
  environment: Environment
  server: FastifyInstance
}

export interface PlatformApiOptions {
  clock?: () => Date
  createId?: () => string
  database?: PlatformDatabase
  environment?: Environment
  moduleRuntime?: boolean
  modules?: readonly PlatformApiModule<Database, Database>[]
  readinessProbes?: readonly ReadinessProbe[]
  storage?: StorageDirectories
}

export async function buildPlatformApi(options: PlatformApiOptions = {}): Promise<PlatformApi> {
  const environment = options.environment ?? readEnvironment()
  const storage = options.storage ?? (await createStorage(environment, getProjectRoot()))
  const database = options.database ?? createDatabase(environment)
  const modules = options.modules ?? [moduleRuntimeApiModule, systemApiModule]
  const server = createServer(environment, storage)
  const shutdown = new PlatformShutdownRegistry()
  const diagnostics = new PlatformDiagnosticRegistry()
  const requestContext = new PlatformRequestContextStore()
  const lifecycleAbort = new AbortController()
  const composition = createComposition(modules)
  const events = new DeclaredPlatformEventBus(
    composition.modules,
    undefined,
    options.clock ?? (() => new Date()),
  )
  const moduleRuntimeEnabled =
    options.moduleRuntime ??
    (environment.MODULE_RUNTIME_ENABLED === 'true' &&
      modules.some(({ manifest }) => manifest.id === 'module-runtime'))
  const moduleRuntime = moduleRuntimeEnabled
    ? createModuleRuntime(
        composition,
        modules,
        database,
        diagnostics,
        events,
        options.clock ?? (() => new Date()),
      )
    : undefined
  const lifecycle = new ModuleLifecycleExecutor(
    composition,
    (module) => ({
      moduleId: module.id,
      signal: lifecycleAbort.signal,
    }),
    ({ moduleId, phase, status }) => {
      diagnostics.report({
        code: `MODULE_${phase.toUpperCase()}_${status.toUpperCase()}`,
        level: status === 'failed' ? 'error' : 'info',
        message: `Module ${phase} ${status}.`,
        moduleId,
        timestamp: (options.clock ?? (() => new Date()))().toISOString(),
      })
    },
  )
  let runtimeStartup: Promise<void> | undefined

  registerHttpLifecycle(server, requestContext)
  await registerPlatformModules(
    server,
    modules,
    composition,
    (moduleId) =>
      createModuleContext(
        options,
        composition,
        diagnostics,
        events.forModule(moduleId),
        requestContext,
        shutdown,
        lifecycleAbort.signal,
      ),
    (moduleId) => moduleRuntime?.canServe(moduleId) ?? true,
  )
  const readinessProbes = [
    ...(options.readinessProbes ?? [
      { check: () => database.check(), name: 'database' },
      { check: () => storage.check(), name: 'storage' },
    ]),
    ...(moduleRuntime ? [{ check: () => moduleRuntime.check(), name: 'module-runtime' }] : []),
  ]
  registerHealthRoutes(server, readinessProbes, diagnostics, options.clock ?? (() => new Date()))
  server.addHook('onReady', async () => {
    if (!moduleRuntime) await lifecycle.activate()
  })
  server.addHook('onListen', () => {
    if (!moduleRuntime) return
    runtimeStartup = startModuleRuntime(moduleRuntime, lifecycle).catch((error: unknown) => {
      server.log.error({ err: error }, 'module runtime preparation failed')
    })
  })
  server.addHook('onClose', () =>
    closeResources(lifecycleAbort, lifecycle, moduleRuntime, runtimeStartup, shutdown, database),
  )

  return { composition, environment, server }
}

function createServer(environment: Environment, storage: StorageDirectories): FastifyInstance {
  const server = Fastify({
    bodyLimit: environment.BODY_LIMIT_BYTES,
    logger: createLoggerOptions(environment),
    requestIdHeader: 'x-request-id',
    trustProxy: false,
  })

  void server.register(fastifySensible)
  void server.register(fastifyHelmet)
  void server.register(fastifyCors, {
    credentials: true,
    origin: environment.PLATFORM_WEB_ORIGIN,
  })
  void server.register(fastifyRateLimit, {
    global: true,
    max: environment.RATE_LIMIT_MAX,
    timeWindow: '1 minute',
  })
  void server.register(fastifyUnderPressure, {
    exposeStatusRoute: false,
    maxEventLoopDelay: 1_000,
    maxEventLoopUtilization: 0.98,
  })
  void server.register(fastifyStatic, {
    dotfiles: 'deny',
    prefix: '/storage/',
    root: storage.publicDirectory,
  })
  return server
}

function createComposition(
  modules: readonly PlatformApiModule<Database, Database>[],
): ModuleCompositionPlan {
  const registry = new ModuleRegistry()
  for (const module of modules) registry.register(module.manifest)
  return registry.createCompositionPlan(platformVersion)
}

function createModuleContext(
  options: PlatformApiOptions,
  composition: ModuleCompositionPlan,
  diagnostics: PlatformDiagnosticRegistry,
  events: PlatformApiModuleContext['events'],
  requestContext: PlatformRequestContextStore,
  shutdown: PlatformShutdownRegistry,
  signal: AbortSignal,
): PlatformApiModuleContext {
  return {
    clock: options.clock ?? (() => new Date()),
    createId: options.createId ?? randomUUID,
    diagnostics,
    events,
    modules: composition.modules.map((module) => ({
      consumes: module.consumes,
      extensionPoints: module.extensionPoints,
      kind: module.kind,
      owner: module.owner,
      publicContracts: module.publicContracts,
      publishes: module.publishes,
      capabilities: module.capabilities,
      id: module.id,
      version: module.version,
    })),
    registerShutdown: (task) => shutdown.register(task),
    requestContext,
    signal,
  }
}

async function registerPlatformModules(
  server: FastifyInstance,
  modules: readonly PlatformApiModule<Database, Database>[],
  composition: ModuleCompositionPlan,
  createContext: (moduleId: string) => PlatformApiModuleContext,
  canServe: (moduleId: string) => boolean,
): Promise<void> {
  const modulesById = new Map(modules.map((module) => [module.manifest.id, module]))
  for (const manifest of composition.modules) {
    await server.register(async (moduleServer) => {
      moduleServer.addHook('preHandler', async (request, reply) => {
        if (canServe(manifest.id)) return
        await reply.status(503).send({
          success: false,
          error: {
            code: 'MODULE_NOT_ACTIVE',
            message: `Module "${manifest.id}" is not active.`,
          },
          meta: createResponseMeta(request),
        })
      })
      await moduleServer.register(
        modulesById.get(manifest.id)!.createPlugin(createContext(manifest.id)),
      )
    })
  }
}

function createModuleRuntime(
  composition: ModuleCompositionPlan,
  modules: readonly PlatformApiModule<Database, Database>[],
  database: PlatformDatabase,
  diagnostics: PlatformDiagnosticRegistry,
  events: DeclaredPlatformEventBus,
  clock: () => Date,
): ModuleRuntimeCoordinator<Database> {
  const repository = new MariaDbModuleRuntimeRepository(database.client)
  return new ModuleRuntimeCoordinator(
    composition,
    modules,
    repository,
    new KyselyModuleDataTransactionRunner(database.client),
    diagnostics,
    events.forModule('module-runtime'),
    clock,
    () => moduleRuntimeMigrations[0]!.up(database.client),
    new MariaDbModuleRuntimeLock(database.client),
  )
}

async function startModuleRuntime(
  moduleRuntime: ModuleRuntimeCoordinator<Database>,
  lifecycle: ModuleLifecycleExecutor,
): Promise<void> {
  const preparation = await moduleRuntime.prepare()
  await lifecycle.install(preparation.newModuleIds)
  await lifecycle.upgrade(preparation.previousVersions)
  await lifecycle.activate()
  await moduleRuntime.markActive()
}

function registerHealthRoutes(
  server: FastifyInstance,
  probes: readonly ReadinessProbe[],
  diagnostics: PlatformDiagnosticRegistry,
  clock: () => Date,
): void {
  const livenessResponse = z.toJSONSchema(successEnvelopeSchema(livenessDataSchema))
  const readinessResponse = z.toJSONSchema(successEnvelopeSchema(readinessDataSchema))
  const readinessFailure = z.toJSONSchema(readinessErrorEnvelopeSchema)

  server.get('/health', { schema: { response: { 200: livenessResponse } } }, async (request) => ({
    success: true,
    data: { service: 'platform-api', status: 'ok' },
    meta: createResponseMeta(request),
  }))

  server.get(
    '/health/live',
    { schema: { response: { 200: livenessResponse } } },
    async (request) => ({
      success: true,
      data: { service: 'platform-api', status: 'alive' },
      meta: createResponseMeta(request),
    }),
  )

  server.get(
    '/health/ready',
    { schema: { response: { 200: readinessResponse, 503: readinessFailure } } },
    async (request, reply) => {
      const components = await runReadinessProbes(probes)
      const ready = components.every(({ status }) => status === 'ready')
      const data = { components, status: ready ? ('ready' as const) : ('not-ready' as const) }

      if (ready) return { success: true, data, meta: createResponseMeta(request) }
      diagnostics.report({
        code: 'READINESS_CHECK_FAILED',
        correlationId: request.headers['x-correlation-id']?.toString(),
        details: { components },
        level: 'warn',
        message: 'A required service is not ready.',
        timestamp: clock().toISOString(),
      })
      request.log.warn({ components }, 'readiness check failed')
      return reply.status(503).send({
        success: false,
        data,
        error: { code: 'SERVICE_NOT_READY', message: 'A required service is not ready.' },
        meta: createResponseMeta(request),
      })
    },
  )
}

async function closeResources(
  lifecycleAbort: AbortController,
  lifecycle: ModuleLifecycleExecutor,
  moduleRuntime: ModuleRuntimeCoordinator<Database> | undefined,
  runtimeStartup: Promise<void> | undefined,
  shutdown: PlatformShutdownRegistry,
  database: PlatformDatabase,
): Promise<void> {
  lifecycleAbort.abort('platform shutdown')
  const failures: unknown[] = []
  for (const close of [
    () => runtimeStartup,
    () => lifecycle.deactivate(),
    () => moduleRuntime?.markDisabled(),
    () => shutdown.closeAll(),
    () => database.close(),
  ]) {
    try {
      await close()
    } catch (error) {
      failures.push(error)
    }
  }
  if (failures.length > 0) throw new AggregateError(failures, 'Platform resources failed to close.')
}
