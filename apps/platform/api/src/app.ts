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
  PlatformShutdownRegistry,
  type PlatformApiModule,
  type PlatformApiModuleContext,
} from '@codexsun/platform-core-api'
import Fastify, { type FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { getProjectRoot, readEnvironment, type Environment } from './config.js'
import { createDatabase, type PlatformDatabase } from './database.js'
import { createResponseMeta, registerHttpLifecycle } from './http.js'
import { createLoggerOptions } from './logger.js'
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
  modules?: readonly PlatformApiModule[]
  readinessProbes?: readonly ReadinessProbe[]
  storage?: StorageDirectories
}

export async function buildPlatformApi(options: PlatformApiOptions = {}): Promise<PlatformApi> {
  const environment = options.environment ?? readEnvironment()
  const storage = options.storage ?? (await createStorage(environment, getProjectRoot()))
  const database = options.database ?? createDatabase(environment)
  const modules = options.modules ?? [systemApiModule]
  const server = createServer(environment, storage)
  const shutdown = new PlatformShutdownRegistry()
  const lifecycleAbort = new AbortController()
  const composition = createComposition(modules)
  const context = createModuleContext(options, composition, shutdown, lifecycleAbort.signal)
  const lifecycle = new ModuleLifecycleExecutor(composition, (module) => ({
    moduleId: module.id,
    signal: lifecycleAbort.signal,
  }))

  await registerPlatformModules(server, modules, composition, context)
  registerHealthRoutes(
    server,
    options.readinessProbes ?? [
      { check: () => database.check(), name: 'database' },
      { check: () => storage.check(), name: 'storage' },
    ],
  )
  server.addHook('onReady', () => lifecycle.activate())
  server.addHook('onClose', () => closeResources(lifecycleAbort, lifecycle, shutdown, database))

  return { composition, environment, server }
}

function createServer(environment: Environment, storage: StorageDirectories): FastifyInstance {
  const server = Fastify({
    bodyLimit: environment.BODY_LIMIT_BYTES,
    logger: createLoggerOptions(environment),
    requestIdHeader: 'x-request-id',
    trustProxy: false,
  })

  registerHttpLifecycle(server)
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

function createComposition(modules: readonly PlatformApiModule[]): ModuleCompositionPlan {
  const registry = new ModuleRegistry()
  for (const module of modules) registry.register(module.manifest)
  return registry.createCompositionPlan(platformVersion)
}

function createModuleContext(
  options: PlatformApiOptions,
  composition: ModuleCompositionPlan,
  shutdown: PlatformShutdownRegistry,
  signal: AbortSignal,
): PlatformApiModuleContext {
  return {
    clock: options.clock ?? (() => new Date()),
    createId: options.createId ?? randomUUID,
    modules: composition.modules.map(({ capabilities, id, version }) => ({
      capabilities,
      id,
      version,
    })),
    registerShutdown: (task) => shutdown.register(task),
    signal,
  }
}

async function registerPlatformModules(
  server: FastifyInstance,
  modules: readonly PlatformApiModule[],
  composition: ModuleCompositionPlan,
  context: PlatformApiModuleContext,
): Promise<void> {
  const modulesById = new Map(modules.map((module) => [module.manifest.id, module]))
  for (const manifest of composition.modules) {
    await server.register(modulesById.get(manifest.id)!.createPlugin(context))
  }
}

function registerHealthRoutes(server: FastifyInstance, probes: readonly ReadinessProbe[]): void {
  server.get('/health', async (request) => ({
    success: true,
    data: { service: 'platform-api', status: 'ok' },
    meta: createResponseMeta(request),
  }))

  server.get('/health/live', async (request) => ({
    success: true,
    data: { service: 'platform-api', status: 'alive' },
    meta: createResponseMeta(request),
  }))

  server.get('/health/ready', async (request, reply) => {
    const components = await runReadinessProbes(probes)
    const ready = components.every(({ status }) => status === 'ready')
    const data = { components, status: ready ? ('ready' as const) : ('not-ready' as const) }

    if (ready) return { success: true, data, meta: createResponseMeta(request) }
    request.log.warn({ components }, 'readiness check failed')
    return reply.status(503).send({
      success: false,
      data,
      error: { code: 'SERVICE_NOT_READY', message: 'A required service is not ready.' },
      meta: createResponseMeta(request),
    })
  })
}

async function closeResources(
  lifecycleAbort: AbortController,
  lifecycle: ModuleLifecycleExecutor,
  shutdown: PlatformShutdownRegistry,
  database: PlatformDatabase,
): Promise<void> {
  lifecycleAbort.abort('platform shutdown')
  const failures: unknown[] = []
  for (const close of [
    () => lifecycle.deactivate(),
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
