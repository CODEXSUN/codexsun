# Codeitz Agent Skills and Boundaries

Defines agent operational boundaries, module ownership, and execution guidelines for Codeitz.

## Boundaries and Ownership

- Work only inside `devkits/codeitz/` unless a public platform or framework contract requires a reviewed change.
- Keep product modules (`foundation`, `engineering`, `learning`, `skills`) owned by Codeitz.
- Use shared UI (`@codexsun/ui`), identity (`@codexsun/platform-core`), and platform contracts instead of copying them.

## Dependency Management

- Run dependency installation from the repository root only.
- Do not create app-local `node_modules`, `dist`, or `.turbo` folders inside `devkits/codeitz/`.

## Verification Standards

- Before completing any task, run both API and web host test suites:
  ```bash
  npm.cmd run test:codeitz
  ```
- Run layout and boundary checks before finishing:
  ```bash
  node tools/check-root-layout.mjs
  ```
