# Sys Work plan

Sys Work is a local machine tool. Its backend owns target discovery, age filtering, scan snapshots, path validation, and file removal. Its frontend owns review and confirmation. It does not join the Platform tenant runtime or use its database.

Keep the cleanup catalog narrow. Each cleanable source needs a known generated-file path, a clear UI explanation, and cleanup verification. Larger application or device data may appear as inventory-only rows; the backend must reject their IDs during cleanup. Preserve user data and active project files. The implementation removes eligible files only and reports skipped files. Add scheduling, history, and additional targets as separate changes after native verification.

Run typecheck, lint, build, unit tests, component-doc checks, and a local browser pass. Keep local process and disk effects separate from static build evidence.
