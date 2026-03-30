# Repository Instructions

- Before adding or changing application UI, read `apps/ui/src/features/design-system/data/component-governance.ts` and use its project defaults for component names, aliases, and default variants.
- Treat `resolveProjectComponentName()` and the mapped `defaultExampleId` as the source of truth for generated or hand-written UI work. Example: `accordion` resolves to `contained`, not `box`.
- Reuse `apps/ui/src/features/design-system/data/form-blocks.ts` when building common forms or workflow sections before introducing new one-off compositions.
- If a project default changes, update the design-system governance data and keep the UI workspace pages in sync instead of scattering new names across feature code.
