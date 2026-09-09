# Orship Service Desk

Repository version: `0.1.3`

## Outcome

The Orship live-services workspace now uses application cards instead of a table. Each application card keeps its API and web processes together, displays scan-level status and ports, and opens as one clickable unit.

Selecting an application opens its combined show page. The show page has a standard tools header with list breadcrumb, back and forward controls, and refresh. It reports each component's PID, latency, memory, CPU time, uptime, health endpoint, and guarded controls. Runtime logs use API and web tabs when those independent logs are available, with refresh and copy applied to the selected log.

The show page uses a full-width tools header. Its project identity, component details, controls, and runtime logs sit below it in a separate centered container that uses 90% of the desktop workspace width, with visible space above and below the report. The runtime-log scroll rail sits at the container's right edge; narrower layouts use the whole available width.

Cloud settings is available from the bottom of the Orship sidebar. It saves a non-secret VPS target (host, SSH port and user, deployment path) and repository source (URL and branch) through a loopback-only Orship API. The private SSH key remains server-owned through `ORSHIP_CLOUD_SSH_KEY_PATH` and is represented only by a configured/not-configured status in the browser.

The Cloud deployment page is script-first. It generates copyable Linux commands for VPS prerequisite checks, source synchronization, Compose deployment, and health verification. The page never runs those commands; each must be manually verified before a later agent-driven automation capability is introduced.

Each application show page also has an Overview and Deployment console tab. Platform starts with a local Docker proof using the `platform-only` assembly: Verify, Pull, Prepare, and Deploy reveal exact copyable commands and the catalog, profile, generated Compose, and environment files involved. The console never executes Git or Docker; the operator manually verifies every command before automation is introduced. Deployment targets remain in the sidebar settings workspace for later VPS releases.

## Boundaries

- The existing Orship service and log API contracts are unchanged.
- The web module owns grouping, selection, visual metrics, and local log-copy feedback.
- Service start and stop behavior remains controlled by the API-provided `controllable` and `protected` flags.

## Verification

- Passed Orship web type check and production build with no warnings.
- Passed `git diff --check`.
- Browser-checked `http://127.0.0.1:6091`: a whole application card opened its combined report, both API and web component metrics were present, and the API/Web tabs switched between independent runtime logs.
