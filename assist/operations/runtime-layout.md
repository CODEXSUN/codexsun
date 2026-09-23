# Runtime Layout

## Purpose

This guide defines the root runtime folders that support all applications.

## Storage

`storage/` is the central file-storage root for the repository.

Use this namespace for application files:

```text
storage/apps/private/<application>/<module>/
storage/apps/public/<application>/<module>/
```

The owner module declares the file purpose, retention, access rules, and public delivery behavior. `StorageProvider.forModule()` creates and validates the namespace.

Do not store private files in a public path. Do not allow one application or module to read another namespace without a documented contract.

## Containers

`.container/` stores Dockerfiles, Compose definitions, container scripts, runtime catalogs, and local Docker verification scripts.

Keep source code in its owning application or package. Container files only build, configure, run, and verify that source.

## Runtime profiles

`core/registry/profiles/` stores repository runtime selections. External
deployment systems own environment-specific configuration and production
secrets.

Each profile must identify the selected applications, add-ons, infrastructure
dependencies, storage requirements, and verification checks.

## Required checks

1. Validate a storage path remains inside its application and module namespace.
2. Run local live checks for affected applications.
3. Run Docker checks from `.container/` before final acceptance.
4. Run the selected deployment profile checks before production deployment.
