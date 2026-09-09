# Orship Operations Foundation

## Outcome

Orship now provides one live operations workspace for every component in the deployment catalog. It shows health, latency, process memory, CPU time, uptime, runtime logs, and local controls.

## Authoritative references

- Owner README: [Orship application](../../../apps/orship/README.md)
- Application catalog: [Orship modules](../../modules/orship.md)
- Architecture contract: [Deployment assembly standard](../../architecture/deployment-assembly-standard.md)
- Local skills: [API](../../skills/api.md), [web UI](../../skills/web-ui.md), and [deployment assembly](../../skills/deployment-assembly.md)

## Ownership and boundaries

The Orship API orchestration module owns observation and process actions. The Orship web module owns the operations screen.

The Runtime Holder owns complete-profile startup and shared log capture. Observed applications keep their own health, process, data, and shutdown behavior.

## Binding properties

| Producer           | Consumer   | Binding                             | Version or key                                    |
| ------------------ | ---------- | ----------------------------------- | ------------------------------------------------- |
| Deployment catalog | Orship API | Application and component discovery | Schema `1`                                        |
| Runtime Holder     | Orship API | Private component log files         | `storage/app/private/runtime/logs`                |
| Orship API         | Orship web | Service overview                    | `GET /api/orship/v1/services`                     |
| Orship API         | Orship web | Service log tail                    | `GET /api/orship/v1/services/:serviceId/logs`     |
| Orship API         | Orship web | Local start or stop                 | `POST /api/orship/v1/services/:serviceId/actions` |
| Orship web         | Shared UI  | MDI shell and primitives            | `@codexsun/ui` workspace `0.1.1`                  |

## Parallel work

The repository contains active Platform, Docs, DevKit, Zetro, and shared UI work. This change adds Orship-owned files and narrow shared catalog, preflight, runtime-log, and app-switcher bindings.

## Decisions

- Decision: protect the Orship API and web from self-stop actions.
- Reason: the control plane must remain available while it changes another service.
- Rejected alternative: allow the browser to stop its own API and lose action feedback.
- Decision: require loopback requests and verified repository process ownership.
- Reason: unauthenticated remote process control is unsafe.
- Rejected alternative: expose control actions on a public network before Identity permissions exist.

## Verification

- Passed focused contracts, API, and web type checks.
- Passed the Orship API and web production builds without warnings; the largest web chunk was below the 400 KB budget.
- Passed Orship service tests and Runtime Holder tests.
- Passed deployment catalog validation with five applications and ten components.
- Proved an owned Docs API stop and restart through the Orship action endpoint. The replacement process received a new process ID and exposed its central log tail.
- Proved the root Orship stack handles Ctrl+C, forwards IPC shutdown, releases ports `6090` and `6091`, and removes its process markers.
- Verified that Orship components are protected and legacy listeners without a root marker remain read-only.
- Browser QA confirmed the live operations workspace loads without console warnings or errors.
- Not run: Docker engine, remote deployment, authenticated production controls, and historical metric persistence.

## Follow-up work

Add Identity permission checks before remote control is allowed. Add historical metric persistence only when a real retention requirement exists.
