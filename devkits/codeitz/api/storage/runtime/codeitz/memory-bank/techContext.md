# Tech Context

## Tech Stack & Runtime
- Runtime: Node.js v22+ (native node:sqlite DatabaseSync enabled).
- Backend: Fastify v5 with fastify-type-provider-zod and strict contract validation.
- Frontend: React 19, TypeScript, TailwindCSS v4, Vite v7, Lucide Icons.
- Tooling: tsx test runner, tsc strict checking, Turborepo monorepo orchestration.

## Constraints & Requirements
- Windows OS path compatibility (handling backslashes and drive prefixes).
- Zero third-party SQLite bloat: rely entirely on native node:sqlite.
- Non-blocking async execution for long-running runners and streaming SSE feeds.
