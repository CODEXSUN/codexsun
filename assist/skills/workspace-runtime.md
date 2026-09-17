# Workspace Runtime Skill

## Purpose and Scope

Use this skill for CODEXSUN package changes, host startup, environment values,
build output, test output, and local runtime checks.

## Non-Negotiable Layout

- Use the root `node_modules` directory only.
- Use the root `dist` directory only.
- Keep the Turbo cache at `dist/.turbo` only.
- Write host output to `dist/<app>/<api|web|desktop|mobile>/`.
- Use one `tsconfig.json` for each app host. Do not add per-module TypeScript projects.

## Configuration and Startup

Read shared values from root `.env`. Read host-specific values from the host
`.app.env`. Validate runtime configuration before start. Do not hard-code ports,
URLs, credentials, or secret values.

Use `npm.cmd` in PowerShell. Use root preflight commands before starting a host.
Do not stop an occupied port until you confirm that this workspace owns it.

## Verification and Handover

Run the relevant workspace checks and focused tests after workspace-wide changes.
Use the direct root tools for version, line-ending, and layout validation.
Distinguish static checks from live API, browser, Docker, desktop, mobile, and
production evidence.

## Exclusions

Do not add nested dependency installs, build directories, local secrets, or
generated runtime state to source control. Do not claim a deployable result from
a typecheck or build alone.
