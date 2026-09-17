# Configuration Rules

## Configuration files

The repository uses two runtime configuration layers.

| File | Owner | Use |
| --- | --- | --- |
| `.env` | Repository root | Shared repository variables, infrastructure endpoints, and global defaults. |
| `apps/<app>/.app.env` | Application | Application credentials, ports, URLs, and application-specific overrides. |

Use `.env.example` and `apps/<app>/.app.env.example` for safe variable names and sample values. Never put live secrets in an example file.

## Required behavior

- Read every runtime value from `.env` or the owner app's `.app.env`.
- Do not hardcode credentials, ports, URLs, hostnames, feature flags, or deployment-specific values in source code.
- Validate loaded configuration with Zod before the application starts.
- The root `.env` provides shared defaults. An app `.app.env` provides only that application's overrides.
- Document every required variable in the owning application README.
- Keep `.env` and `.app.env` out of version control.

## Access boundaries

An application may read the root `.env` and its own `.app.env`. It must not read another application's `.app.env`.

Browser clients receive only explicitly safe public configuration. Server credentials, database URLs, queue URLs, and signing keys must remain server-side.

## Required checks

1. Check that required variables exist before startup.
2. Reject invalid ports, URLs, credentials, and storage paths at startup.
3. Search changed source for hardcoded configuration values.
4. Confirm `.env` and `.app.env` files remain ignored by Git.
