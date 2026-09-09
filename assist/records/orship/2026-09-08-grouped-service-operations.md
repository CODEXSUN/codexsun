# Grouped Service Operations

## Superseded workspace shape

Orship previously grouped each application's API and web components in one connected row. The selected service metrics and runtime logs used a full-width bottom inspector. The current service-desk implementation replaces this arrangement with application cards and a right-edge log rail.

## Authoritative references

- Application owner: [Orship](../../../apps/orship/README.md)
- Web module: [Orchestration web module](../../../apps/orship/web/src/modules/orchestration/README.md)
- Shared UI rules: [Web UI skill](../../skills/web-ui.md)

## Ownership and boundaries

The Orship web orchestration module owns the grouping and selection behavior. The API contract and runtime process behavior did not change.

## Binding properties

| Producer      | Consumer              | Binding                  | Property                   |
| ------------- | --------------------- | ------------------------ | -------------------------- |
| Orship API    | Grouped service table | Service snapshots        | `applicationId` and `kind` |
| Service table | Bottom inspector      | Selected service         | Stable service ID          |
| Log query     | Bottom inspector      | Runtime log tail         | Selected service ID        |
| Shared UI     | Orship web            | Table, button, and badge | `@codexsun/ui` workspace   |

## Parallel work

The repository contained active container, Docs, Zetro, and shared UI changes. This update changed only Orship-owned web files and its documentation bindings.

## Decisions

- Decision: show one numbered row for each application.
- Reason: API and web components now read as one deployable application group.
- Decision: keep service controls inside each service node.
- Reason: each component remains an independent process boundary.
- Decision: move the selected process details and logs below the table.
- Reason: the application grouping now receives the full workspace width.

## Verification

- Passed the Orship web type check and production build without warnings.
- Passed the Orship API type check and focused service tests.
- Browser checks confirmed five application rows, ten service selectors, 24 px row-edge padding, connected Platform API and web nodes, and bottom log placement.
- Browser selection moved the bottom inspector to `docs-web` without console warnings or errors.
- Database, desktop, and mobile checks do not apply.
