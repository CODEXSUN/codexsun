# Zetro Tasks Web

## Contract

- Module ID: `zetro.tasks.web`
- Version: `0.1.0`
- Owner: Zetro web
- Flow: list, create, and advance Zetro tasks

The module owns its task types, API validation, API service, state hook, create form, task list, loading, empty, error, and success behavior. It depends only on the public Zetro Tasks API contract.

The task panel is a secondary workspace beside chat. A visible task can move from To do to In progress to Done. Chat replies can prefill and create a task through the module's public `createTask` callback; no private module file is imported.

There are no frontend migrations, settings, permissions, events, jobs, or persistence. The API owns records.

## Verification

Run the Zetro web typecheck and build. Verify empty, loading, API error, create, and status-change flows in the browser.

## Interface topology

The module owns the Tasks workspace topology. It identifies the summary banner,
task composer, and task list.

## Development records

Future changes must be recorded in the [Zetro development records](../../../../../../assist/records/zetro/README.md).

- [2026-09-08 Cross-app interface topology](../../../../../../assist/records/platform/2026-09-08-cross-app-interface-topology.md)
