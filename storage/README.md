# Central Storage

This folder is the central file-storage root for all CODEXSUN applications.

Use these namespaces:

```text
storage/apps/private/<application>/<module>/
storage/apps/public/<application>/<module>/
```

Applications must use a storage provider or adapter. Do not write unscoped files or access another module's namespace directly.

Keep runtime files out of Git. Store only this documentation and placeholder files in the repository.

Read [the runtime layout guide](../assist/operations/runtime-layout.md) before adding storage behavior.
