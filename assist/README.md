# Assist

`assist` is the repository guide for people and coding agents. It points to
the authoritative rule, owner, application, module, skill, and development
record for a change. It does not duplicate source-owned documentation.

## Start in this order

1. Read [AGENTS.md](../AGENTS.md) and [README.md](../README.md).
2. Read [architecture.md](architecture.md) and [governance/golden-rules.md](governance/golden-rules.md).
3. Use the [skill router](skills/README.md) to select every required skill.
4. Read the target application README, module README, catalog, and latest development record.
5. Inspect the affected source and run `git status --short` before editing.

## Find the right guidance

| Change                                            | Read first                                                                   | Then read                                                                                               |
| ------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Any module                                        | [module standard](architecture/module-standard.md)                           | [modular monolith skill](skills/modular-monolith.md), app catalog, module README                        |
| API, route, contract, or database                 | [application standard](architecture/application-standard.md)                 | [API skill](skills/api.md), [server runtime skill](skills/server-runtime.md)                            |
| React screen, navigation, shared UI, or Docs      | [web UI skill](skills/web-ui.md)                                             | [UI template skill](skills/ui-template-pages.md) for a shared UI page                                   |
| Framework or Platform Core                        | [framework roadmap](architecture/framework-capability-roadmap.md)            | [framework development skill](skills/framework-development.md)                                          |
| Add-on or extension point                         | [extension standard](architecture/extension-standard.md)                     | [deployment assembly skill](skills/deployment-assembly.md) when it ships                                |
| Profile, container, runtime holder, or deployment | [deployment assembly standard](architecture/deployment-assembly-standard.md) | [deployment assembly skill](skills/deployment-assembly.md), [.container guide](../.container/README.md) |
| Local server, health, shutdown, logs, or MariaDB  | [runtime foundation](architecture/runtime-foundation.md)                     | [server runtime skill](skills/server-runtime.md), [MariaDB guide](operations/mariadb-local.md)          |
| Version, changelog, commit, or GitHub push        | [versioning workflow](operations/versioning.md)                              | the current [changelog](documentation/CHANGELOG.md)                                                     |

## Repository map

| Area                     | Owner                               | Reference                                                           |
| ------------------------ | ----------------------------------- | ------------------------------------------------------------------- |
| Application runtimes     | `apps/<app>`                        | [application standard](architecture/application-standard.md)        |
| Module lifecycle         | `packages/framework`                | [framework roadmap](architecture/framework-capability-roadmap.md)   |
| Shared runtime contracts | `packages/platform-core`            | [runtime foundation](architecture/runtime-foundation.md)            |
| All reusable web UI      | `packages/ui`                       | [UI design system standard](architecture/ui-design-system.md)       |
| UI design system         | `packages/ui/src/design-system`     | [UI design system standard](architecture/ui-design-system.md)       |
| Deployment assembly      | `packages/runtime` and `.container` | [deployment standard](architecture/deployment-assembly-standard.md) |
| Repository documents     | `assist` and source-owned READMEs   | [Docs application](../apps/docs/README.md)                          |

## Catalogs and records

- [Stable release workflow](operations/stable-release-workflow.md) defines framework, identity, adoption, and E2E release gates through Zetro.

- [Application and module catalogs](modules/README.md) identify the source owner.
- [Development records](records/README.md) record completed decisions and verification.
- [Templates](templates) define new application, module, add-on, and record documents.
- [Changelog](documentation/CHANGELOG.md) records versioned release notes.

Update this index and the skill router when a new application, package, integration,
or repeatable workflow is added.
