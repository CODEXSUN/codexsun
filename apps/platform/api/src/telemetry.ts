import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

export interface PlatformTelemetry {
  start(): void;
  stop(): Promise<void>;
}

class DisabledTelemetry implements PlatformTelemetry {
  start(): void {}

  async stop(): Promise<void> {}
}

class OtlpTelemetry implements PlatformTelemetry {
  private readonly provider: NodeTracerProvider;

  constructor(endpoint: string) {
    const exporter = new OTLPTraceExporter({ url: endpoint });
    this.provider = new NodeTracerProvider({
      spanProcessors: [new BatchSpanProcessor(exporter)],
    });
  }

  start(): void {
    this.provider.register();
  }

  stop(): Promise<void> {
    return this.provider.shutdown();
  }
}

/**
 * Enables OTLP trace export only when a collector endpoint is configured.
 * Instrumentation is manual: request spans are created by request observability.
 */
export function createPlatformTelemetry(endpoint?: string): PlatformTelemetry {
  return endpoint ? new OtlpTelemetry(endpoint) : new DisabledTelemetry();
}
