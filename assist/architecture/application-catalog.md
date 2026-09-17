# Application Catalog

## Purpose

This catalog records applications, add-ons, and deployment selections.

Do not add an application or add-on without a named owner, provider, public contract, and module register entry.

## Initial application hosts

| Host | Role | Client targets |
| --- | --- | --- |
| Platform | Generic holder and platform-owned capabilities. | Web, desktop, mobile. |
| Docs | Documentation product when a deployment selects it. | Web. |
| Orship | Independently owned application when a deployment selects it. | Web, desktop, mobile as required. |
| UIUX | UI and experience application. It consumes `packages/ui`. | Web. |
| Zetro | Independently owned application or add-on host. | Web, desktop, mobile as required. |

The listed folders are scaffolds. A deployment must explicitly select an application before it becomes a delivered product.

## Add-on rules

An add-on belongs in `packages/<addon>`. It owns its modules and publishes one public provider.

An application selects an add-on through its composition root. An add-on must not import an application.

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
