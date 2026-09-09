# Build and Observability Foundation

Date: 2026-09-09

## Outcome

The repository now uses Turbo for dependency-aware workspace tasks and Platform Core for a shared Fastify observability boundary. The runtime holder remains the only owner of local API and Vite processes.

## Build ownership

- Root `turbo.json` defines build, type-check, lint, and test relationships.
- Each build workspace declares one unique output below root `dist/apps` or `dist/packages`.
- Turbo stores cache data below `node_modules/.cache/turbo`.
- ESLint stores one cache per workspace below `node_modules/.cache/eslint`.
- TypeScript stores incremental metadata below `node_modules/.cache/tsbuildinfo`.
- `ci:affected` limits CI execution to workspaces changed from the detected Git base and their dependants. It excludes the root pseudo-workspace to prevent wrapper recursion.
- Remote caching stays disabled until local cache behavior is stable.

The root Turbo wrapper removes workspace replay-log folders after each run. It does not move process ownership away from the runtime holder.

Process markers keep both the service PID used by Orship and the preflight controller PID used during replacement. A new stack stops the existing controller tree, so an older supervisor cannot restart a replaced API or web listener.

## Observability ownership

`@codexsun/platform-core-api` owns the technical adapter. Each API composition root supplies its application name, component name, and version. Business modules do not create loggers or exporters.

The adapter provides:

- Pino development output and production JSON output;
- `LOG_LEVEL` control and secret or header redaction;
- consistent error serialization;
- validated request and correlation identifiers;
- trace and span identifiers in request logs;
- OpenTelemetry HTTP spans, request counts, and duration metrics;
- OTLP HTTP trace and metric exporters; and
- exporter shutdown during Fastify close.

The runtime holder captures component output below `storage/app/private/runtime/logs`. Orship reads those files through its API.

## Bindings

| Setting                               | Purpose                                                               |
| ------------------------------------- | --------------------------------------------------------------------- |
| `APP_ENV`                             | Selects the runtime environment field.                                |
| `CODEXSUN_VERSION`                    | Supplies the deployment version when the app does not provide one.    |
| `LOG_LEVEL`                           | Sets the Pino threshold.                                              |
| `LOG_PRETTY`                          | Enables readable local output. Production profiles set it to `false`. |
| `OTEL_SDK_DISABLED`                   | Disables exporters by default.                                        |
| `OTEL_EXPORTER_OTLP_ENDPOINT`         | Supplies the common OTLP HTTP collector base URL.                     |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`  | Overrides the trace signal URL.                                       |
| `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` | Overrides the metric signal URL.                                      |
| `OTEL_METRIC_EXPORT_INTERVAL`         | Sets the periodic metric export interval in milliseconds.             |

## Parallel development rule

Applications may add routes and modules in parallel because the shared adapter is bound only in each API composition root. An application may extend observability through a documented public Platform Core contract. It must not import another application's logger, runtime files, or private source.

## Verification

### Timing snapshot

| Root task   |                                                       Before Turbo |                                                          Cached repository run |
| ----------- | -----------------------------------------------------------------: | -----------------------------------------------------------------------------: |
| `typecheck` |                                                            43.99 s |                                            3.89 s with 20 of 21 workspace hits |
| `lint`      |                                                             5.43 s | 7.68 s including all 21 workspaces and root lint; Turbo workspaces took 3.33 s |
| `build`     | No successful baseline; existing UI errors stopped the 49.36 s run |                                            7.62 s with 20 of 21 workspace hits |

The cached values are a local development snapshot, not a CI benchmark. Concurrent Docs work invalidated one workspace cache entry during the measurement.

### Checks

- Passed shared observability tests, including a local OTLP receiver for traces and metrics.
- Passed the Turbo output ownership contract test.
- Passed focused API builds and type checks.
- Passed runtime-holder and process-lifecycle tests.
- Passed the complete repository check and production JavaScript chunk budget.
- Started and stopped the complete main development profile, verified central JSON logs and correlation headers, and confirmed all eight ports were released.

See the root changelog for the complete repository gate result.
