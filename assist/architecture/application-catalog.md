# Application Catalog

## Purpose

This catalog records applications, add-ons, and deployment selections.

Do not add an application or add-on without a named owner, provider, public contract, and module register entry.

## Initial application hosts

| Host     | Role                                                                                                  | Client targets                    |
| -------- | ----------------------------------------------------------------------------------------------------- | --------------------------------- |
| Platform | Generic holder and platform-owned capabilities.                                                       | Web, desktop, mobile.             |
| Docs     | Hybrid Markdown, MDX, and database-indexed repository documentation.                                  | Web.                              |
| UIUX     | Dynamic visual gallery for published `packages/ui` registry entries. It consumes `packages/ui`.       | Web.                              |
| Zetro    | Governed AI agent application for planning, tasking, workers, review, test, and deployment workflows. | Web, desktop, mobile as required. |

The listed folders are scaffolds. A deployment must explicitly select an application before it becomes a delivered product.

## Application creation

Create a new application with `npm run app:create -- <id>`. The command creates
the API and web hosts, an application manifest, a development profile provider
selection, module foundation, route contract, API reference setup, tests, and
an MDI catalog entry.

Use `npm run app:sync` after a manual manifest change. Use
`npm run app:verify` before development or deployment.

## Application Boundaries

| Application | Must own                                                                                                        | Must not own                                                                             |
| ----------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Zetro       | Agent plans, task records, worker dispatch, review evidence, test and deployment orchestration.                 | Arbitrary unsandboxed execution, product business logic, or private application imports. |
| Docs        | Markdown and MDX source discovery, database index, article composition, links, backlinks, and graph metadata.   | The source authority of another application or unreviewed source rewrites.               |
| UIUX        | Registry gallery, variant previews, visual documentation, and temporary preview controls.                       | Shared component ownership or imports from another application.                          |

## Add-on rules

An add-on belongs in `packages/<addon>`. It owns its modules and publishes one public provider.

An application selects an add-on through its composition root. An add-on must not import an application.

Create a new add-on with `npm run addon:create -- <id>`. Its manifest must
declare a provider ID, dependencies, backward-compatible data lifecycle, and
retained data policy before it can be installed in a profile.

## Deployment catalog entry

Each deployment profile must record these fields:

- client identifier;
- selected applications and add-ons;
- enabled module providers;
- client targets;
- infrastructure dependencies;
- storage namespaces;
- data and migration requirements;
- verification checks;
- rollback procedure.

Use the [deployment profile template](../templates/deployment-profile.md) for each profile.
