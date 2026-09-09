# Runtime Log Organization

Date: 2026-09-09

## Outcome

All root-managed application processes now use one readable console format and one central capture boundary. Production JSON remains unchanged. Orship continues to read concise component logs while complete diagnostic records and failure-only records remain available for investigation.

## Ownership and flow

1. Each API emits structured Pino records through Platform Core observability.
2. Each Vite or API process writes only to its standard output or error stream.
3. Root preflight normalizes the output, adds the component scope, and owns all local files.
4. The runtime holder forwards preflight output. It does not write a second copy.
5. Orship reads the concise `<component>.log` through its existing API boundary.

Applications and business modules do not write central runtime files directly.

## File contract

| Path                                                     | Content                                                             | Consumer                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------- |
| `storage/app/private/runtime/logs/<component>.log`       | Compact readable events                                             | Console and Orship                        |
| `storage/app/private/runtime/logs/<component>.jsonl`     | Complete structured or normalized events                            | Diagnostics and future collectors         |
| `storage/app/private/runtime/failures/<component>.jsonl` | Warning, error, detected failure, spawn, and unexpected-exit events | `npm.cmd run logs:failures` and operators |

Files rotate to `.previous` before component startup when their size reaches `RUNTIME_LOG_MAX_BYTES`. The default is 5 MiB.

## Noise controls

- Request-start events use debug level.
- Successful health checks use debug level.
- Successful application requests use info level.
- HTTP 500 responses use warning level.
- Request exceptions and runtime failures use error level.
- Repeated application, component, version, and environment fields remain in JSON but are omitted from each readable line.

## Failure scope

The capture boundary records structured warnings and errors, failure-like process output, child spawn failures, and unexpected exits. It preserves unrecognized output as normalized JSONL instead of discarding it. Browser-only exceptions are not accepted over an unauthenticated log endpoint; that needs a validated and rate-limited public contract before implementation.

## Verification

- Passed the runtime log formatter and three-file capture tests.
- Passed Platform Core API tests, type checking, and lint.
- Passed runtime-holder and Windows lifecycle tests.
- Passed the complete repository check, including boundaries, formatting, all workspace checks, the production chunk budget, and server lifecycle E2E tests.
- Left the ten active local services running; the new console format will load on their next normal restart.
