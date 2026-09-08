# Extensible Application and Add-on Foundation

## Outcome

The framework now composes versioned add-ons through named extension points without importing target runtime or business code.

Applications can grow through application modules, reusable add-ons, and technical adapters. The extension standard defines ownership, layout, compatibility, security, installation, removal, and scale rules.

## Authoritative references

- Architecture: [Application and add-on extension standard](../../architecture/extension-standard.md).
- Framework plan: [Framework capability roadmap](../../architecture/framework-capability-roadmap.md).
- Owner README: [Framework](../../../packages/framework/README.md).
- Module contract: [Module standard](../../architecture/module-standard.md).
- Local workflow: [Framework development skill](../../skills/framework-development.md).

## Ownership and boundaries

The framework owns extension declarations, validation, and deterministic resolution. It does not own executable API, web, desktop, mobile, database, queue, or business contributions.

An extension point owner defines the public target contract. An add-on owns its contribution and depends on the point owner. The application binds the resolved declaration to target-specific code.

Reusable business add-ons belong under `packages/addons` after their public contracts become stable. First implementations remain inside their application modules.

## Binding properties

| Producer           | Consumer                | Binding                         | Compatibility                   |
| ------------------ | ----------------------- | ------------------------------- | ------------------------------- |
| Point owner module | Add-on module           | Extension point ID              | Semantic point version          |
| Add-on module      | Composition plan        | Extension contribution          | Version range and integer order |
| Add-on module      | Point owner module      | Module dependency               | Semantic module range           |
| Composition plan   | Runtime adapter         | Resolved extension metadata     | Immutable stable order          |
| Runtime adapter    | Executable contribution | Target-specific public contract | Owned outside the kernel        |

## Parallel work

The repository contained concurrent UI Gallery and other application work. This change preserved those owners and changed only the generic framework, System manifest, and extension documentation.

## Decisions

- Decision: Model every add-on as a normal versioned framework module.
- Decision: Keep executable contribution values in target-specific public contracts.
- Decision: Require an add-on to depend on each extension point owner.
- Decision: Resolve contributions by point ID, integer order, and contribution ID.
- Decision: Reject invalid extension graphs before lifecycle installation or activation.
- Rejected alternative: Runtime filesystem scanning and decorator discovery.
- Rejected alternative: A global add-on service locator.
- Rejected alternative: Moving first-use application code into a shared add-on package.

## Verification

- Framework type check and build passed.
- Ten framework tests passed, including valid add-on resolution and aggregated invalid-binding rejection.
- The complete root check passed after the implementation.
- No database change was required.
- MariaDB, Redis, browser, desktop, and mobile behavior did not change.

## Follow-up work

- Add the first concrete extension point only with its first named add-on consumer.
- Implement durable installed-module state and the migration ledger before Identity.
