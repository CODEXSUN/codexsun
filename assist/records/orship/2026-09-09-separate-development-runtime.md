# Separate Orship Development Runtime

Repository version: `0.1.3`

## Outcome

The default development command now starts Platform, Docs, Zetro, and DevKit without Orship.

Orship starts separately with `npm.cmd run dev:orship`. The complete profile remains available through `npm.cmd run dev:all`.

## Runtime bindings

| Command                  | Profile or stack     | Applications                  |
| ------------------------ | -------------------- | ----------------------------- |
| `npm.cmd run dev`        | `main-development`   | Platform, Docs, Zetro, DevKit |
| `npm.cmd run dev:orship` | Orship focused stack | Orship API and web            |
| `npm.cmd run dev:all`    | `development`        | All registered applications   |

## Terminal behavior

All Windows process lookup, stop, build, and fallback helpers use hidden process windows. Child API and Vite processes already used hidden windows.

This removes repeated console-window flashes during preflight and controlled restarts.

Platform router values now live outside React route components. This removes the Fast Refresh invalidation that caused development page reloads.

Preflight uses the service marker to stop the owning watch-process tree. It does not stop a listener because its health route responds.

## Boundaries

- The complete `development` profile still contains every registered application.
- The new `main-development` profile changes local selection only.
- Orship remains registered in the shared catalog and available for customer profiles.
- Runtime logs remain under `storage/app/private/runtime/logs`.

## Verification

- Validate both development profiles.
- Run Runtime Holder and Windows service lifecycle tests.
- Start the default profile and confirm ports `6090` and `6091` remain unused.
- Start Orship separately and confirm both Orship health routes respond.
- Stop both holders and confirm all owned ports are released.

The main profile returned HTTP 200 from all eight selected components. Orship ports stayed free, and all ten development ports were free after shutdown.

The Platform database readiness error in the supplied log is separate. MariaDB requested the unsupported `auth_gssapi_client` authentication plugin.
