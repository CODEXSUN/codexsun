# Repository Instructions

- Before adding or changing application UI, read `apps/ui/src/features/design-system/data/project-defaults.ts` and use its project defaults for component names, aliases, and default variants.
- Treat `project-defaults.ts` as the canonical source of truth and `component-governance.tsx` as the derived docs-facing layer. Example: `accordion` resolves to `contained`, not `box`.
- Treat `apps/ui/src/features/component-registry` as the reusable design-system source. Component variants live under `registry/variants` and multi-component compositions live under `blocks`.
- Reuse `apps/ui/src/features/component-registry/blocks` when building common auth, form, or data workflows before introducing new one-off compositions.
- If a project default changes, update `project-defaults.ts` and keep the derived design-system governance pages in sync instead of scattering new names across feature code.
