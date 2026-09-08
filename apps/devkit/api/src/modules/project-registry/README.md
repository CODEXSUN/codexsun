# DevKit Project Registry API Module

## Purpose

Owns the JSON-backed Project Registry: project, app, module group, module,
and unlimited submodule planning records. It also owns module-profile
specifications and explicit development-confirmation decisions.

## Identity and ownership

- Module ID: `devkit.project-registry.api`
- Version: `0.7.1`
- Storage: `storage/app/private/devkit/project-registry.json`
- Entity: `RegistryNode`, including its module-profile specifications.
- Routes: `GET /api/devkit/v1/project-registry`, `POST /api/devkit/v1/project-registry/nodes`, `PUT /api/devkit/v1/project-registry/nodes/:id`, `POST /api/devkit/v1/project-registry/nodes/:id/profile/:section`, and `POST /api/devkit/v1/project-registry/:id/confirm`.
- Database and migrations: intentionally absent; this first planning module owns a validated JSON store.

## Lifecycle

The first read creates an empty registry. Deactivation and uninstall preserve
the planning record. This version migrates legacy flat planning nodes into
apps, adds required profile fields, and preserves all existing record IDs.

## Hierarchy and profile

The allowed hierarchy is Project → App → Module Group → Submodule Group →
Module → Profile. A module is terminal and cannot contain a child. The API
rejects invalid parent-child combinations and migrates legacy submodule records
into the new group-or-module pattern while preserving record IDs.

Modules own `info`, `database`, `routes`, `files`, `actions`, `events`, and
`planning` profile entries. Each profile entry is an upsert by its stable entry
ID. The initial read safely migrates legacy registry data and upserts the
DevKit → Identity → Access control planning spine. It migrates the prior User
endpoint profile into the terminal User module, then removes that old endpoint
node. User, Role, Permission, User role, and Role permission are seeded as
complete, editable terminal module profiles.

## Development records

See [DevKit development records](../../../../../../assist/records/devkit/README.md).
