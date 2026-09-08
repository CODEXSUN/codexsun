# Safe Runtime Manifest Boundary

## Outcome

The framework now accepts module manifests as unknown runtime input and parses them through a strict Zod schema.

Malformed add-ons cannot cause property-access failures during registration. The parser reports missing fields, unknown fields, invalid values, and invalid lifecycle functions as typed composition issues.

## Authoritative references

- Owner README: [Framework](../../../packages/framework/README.md).
- Architecture: [Application and add-on extension standard](../../architecture/extension-standard.md).
- Framework plan: [Framework capability roadmap](../../architecture/framework-capability-roadmap.md).
- Local workflow: [Framework development skill](../../skills/framework-development.md).

## Ownership and boundaries

The framework owns manifest shape parsing and semantic validation. Zod is a framework dependency because parsing happens at the framework trust boundary.

Platform API owns database availability and future installed-module state. The framework does not import Kysely, MySQL2, Fastify, or application configuration.

Durable module state remains separate from API liveness. A MariaDB failure must affect readiness without preventing the liveness routes from starting.

## Binding properties

| Producer                  | Consumer            | Binding                    | Failure behavior               |
| ------------------------- | ------------------- | -------------------------- | ------------------------------ |
| External module or add-on | Manifest parser     | `unknown` runtime value    | Typed `ModuleCompositionError` |
| Manifest parser           | Semantic validator  | Parsed `FrameworkModule`   | Aggregated module issues       |
| Semantic validator        | Module registry     | Valid manifest             | Registration before lock       |
| Module registry           | Composition planner | Registered module snapshot | Immutable plan                 |

## Parallel work

The repository contained concurrent UI, Docs, and application changes. This work changed the framework package, its tests, package metadata, and framework documents only.

## Decisions

- Decision: Parse runtime input before the registry reads any manifest property.
- Decision: Reject unknown fields instead of silently removing them.
- Decision: Keep semantic version and duplicate checks in the semantic validator.
- Decision: Return every structural Zod issue from one parse attempt.
- Rejected alternative: Default missing arrays for old add-ons.
- Reason: Defaults can hide an outdated or incomplete add-on contract.
- Rejected alternative: Put database-backed installation state in the framework.
- Reason: Platform API owns MariaDB and degraded startup behavior.

## Verification

- Framework type check and build passed.
- Eleven framework tests passed.
- The parser test proved that missing and unknown fields return two typed issues without a runtime `TypeError`.
- The complete root check passed after the change.
- The root workspace-layout gate confirmed that npm did not create nested dependency folders.
- No database change was required.

## Follow-up work

- Design the Platform API module-state coordinator with degraded startup and readiness behavior.
- Add the MariaDB installation state and migration ledger after that runtime contract is approved.
