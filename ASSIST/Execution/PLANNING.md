# Planning

## Current Batch

### Reference

`#12`

### Goal

Import the copied UI component set into the shared UI docs system, keep the implementation inside `apps/ui`, and extend the docs catalog, side menu, and templates overview without changing broader app boundaries.

### Scope

- `ASSIST/Execution`
- `ASSIST/Documentation/CHANGELOG.md`
- `eslint.config.js`
- `package.json`
- `apps/ui/src`
- `apps/ui/web`

### Canonical Decisions

- imported UI docs content must stay inside `apps/ui` and remain presentation-only
- the existing docs shell, catalog model, and component ownership stay intact; imported content adapts to the system instead of replacing it
- shared compatibility shims are allowed when they support docs-only imported content without leaking app-specific behavior into `apps/ui`
- docs entries should stay tied to real component demos and raw code templates so the catalog can be extracted later without content rewrites
- project-level component naming and default variant selection should live in source-controlled governance data so both docs and future agent work read the same defaults

### Execution Plan

1. read the imported `temp` component files and the existing `apps/ui` docs implementation
2. copy the imported docs demo sources into a docs-owned registry under `apps/ui`
3. add the missing shared UI primitives and compatibility shims required by the imported demos
4. generate the expanded docs catalog from the imported component metadata
5. add templates presentation, overview surfacing, and side-menu links in the docs shell
6. update ASSIST task, planning, and changelog entries for this batch
7. validate typecheck, lint, test, and build
8. add a governed UI workspace channel for component defaults, combined form blocks, and build-readiness coverage

### Validation Plan

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run test`
- Run `npm run build`

### Validation Status

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run build`
- [ ] `npm run test` (`tests/framework/runtime/config.test.ts` fails against local `.env` host values)

### Risks And Follow-Up

- the imported docs registry currently leans on compatibility shims and lint overrides because the temp package targets a slightly different primitive contract
- the resulting docs page now carries a very large component catalog, so future follow-up may need route splitting or lazy loading
- project defaults are currently source-controlled rather than browser-persisted, which keeps agent/code alignment correct but leaves in-browser editing for a later step
- the existing framework config test is environment-sensitive and still needs isolation from local `.env` state
