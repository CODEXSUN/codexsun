# Repository Instructions

- Use `ASSIST/AI_RULES.md` as the canonical repository instruction source for this workspace.
- Before adding or changing application UI, read `apps/ui/src/design-system/data/project-defaults.ts` and use its project defaults for component names, aliases, and default variants.
- Treat `apps/ui/src/design-system/data/project-defaults.ts` as the canonical source of truth and `apps/ui/src/design-system/data/component-governance.tsx` as the derived docs-facing layer. Example: `accordion` resolves to `contained`, not `box`.
- Treat `apps/ui/src/registry` as the reusable design-system source. Component variants live under registry variant paths and multi-component compositions live under `apps/ui/src/registry/blocks` or `apps/ui/src/components/blocks`.
- Reuse `apps/ui/src/registry/blocks` and `apps/ui/src/components/blocks` when building common auth, form, or data workflows before introducing new one-off compositions.
- If a project default changes, update `apps/ui/src/design-system/data/project-defaults.ts` and keep the derived design-system governance pages in sync instead of scattering new names across feature code.
