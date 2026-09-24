# Codeitz Task Execution Guide

Provides step-by-step guidance for planning, implementing, and verifying engineering changes in Codeitz.

## Execution Workflow

1. **Review Instructions & Boundaries**: Read `devkits/codeitz/agent/skills.md` and ensure working directory is `E:\codexsun\codexsun`.
2. **Contain Scope**: Keep all application code changes strictly inside `devkits/codeitz/`.
3. **Use Public Contracts**: Consume capabilities from `@codexsun/platform-core`, `@codexsun/framework`, and `@codexsun/ui`.
4. **Develop Locally**: Start hosts using `npm run dev:codeitz-api` and `npm run dev:codeitz-web`.
5. **Verify Thoroughly**: Execute application tests and root layout verification:
   ```bash
   npm.cmd run test:codeitz
   node tools/check-root-layout.mjs
   ```

## Guardrails

- Ensure all module providers define `owner` and declare `published` and `consumed` events.
- If a module introduces a `repository` directory, ensure a corresponding `service` directory is present.
- Every module must maintain an independent `README.md` and test suite.
