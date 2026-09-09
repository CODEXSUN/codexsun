import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { defaultResource, resourceFromAttributes } from '@opentelemetry/resources'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { NodeSDK, type NodeSDKConfiguration } from '@opentelemetry/sdk-node'
import {
  resolvePlatformServiceIdentity,
  type PlatformServiceIdentity,
  type ResolvedPlatformServiceIdentity,
} from './logging.js'

export class PlatformTelemetry {
  private sdk?: NodeSDK
  private readonly identity: ResolvedPlatformServiceIdentity

  constructor(
    identity: PlatformServiceIdentity,
    private readonly source: NodeJS.ProcessEnv = process.env,
  ) {
    this.identity = resolvePlatformServiceIdentity(identity, source)
  }

  start(): boolean {
    if (this.sdk || isDisabled(this.source)) return false
    const traceEndpoint = resolveSignalEndpoint(this.source, 'traces')
    const metricEndpoint = resolveSignalEndpoint(this.source, 'metrics')
    if (!traceEndpoint && !metricEndpoint) return false

    const options: Partial<NodeSDKConfiguration> = {
      resource: defaultResource().merge(
        resourceFromAttributes({
          'codexsun.application': this.identity.application,
          'deployment.environment.name': this.identity.environment,
          'service.instance.id': String(process.pid),
          'service.name': this.source.OTEL_SERVICE_NAME ?? this.identity.component,
          'service.namespace': 'codexsun',
          'service.version': this.identity.version,
        }),
      ),
    }
    if (traceEndpoint) options.traceExporter = new OTLPTraceExporter({ url: traceEndpoint })
    else options.spanProcessors = []
    if (metricEndpoint) {
      options.metricReaders = [
        new PeriodicExportingMetricReader({
          exporter: new OTLPMetricExporter({ url: metricEndpoint }),
          exportIntervalMillis: readMetricInterval(this.source),
        }),
      ]
    }

    this.sdk = new NodeSDK(options)
    this.sdk.start()
    return true
  }

  async shutdown(): Promise<void> {
    const sdk = this.sdk
    this.sdk = undefined
    await sdk?.shutdown()
  }
}

function isDisabled(source: NodeJS.ProcessEnv): boolean {
  return source.OTEL_SDK_DISABLED?.toLowerCase() === 'true'
}

function resolveSignalEndpoint(
  source: NodeJS.ProcessEnv,
  signal: 'metrics' | 'traces',
): string | undefined {
  const signalEndpoint = source[`OTEL_EXPORTER_OTLP_${signal.toUpperCase()}_ENDPOINT`]
  if (signalEndpoint) return signalEndpoint
  const commonEndpoint = source.OTEL_EXPORTER_OTLP_ENDPOINT
  if (!commonEndpoint) return undefined
  return `${commonEndpoint.replace(/\/$/u, '')}/v1/${signal}`
}

function readMetricInterval(source: NodeJS.ProcessEnv): number {
  const parsed = Number(source.OTEL_METRIC_EXPORT_INTERVAL ?? 60_000)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60_000
}
