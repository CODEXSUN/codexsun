# Application UI Source Audit

Date: 2026-09-09

## Outcome

All seven browser applications were scanned for app-local primitive libraries, package-private UI
imports, and direct dependencies on external component frameworks. Shared visual building blocks
continue to enter applications through public `@codexsun/ui` exports.

## Findings

- Agent Crew, DevKit, Docs, Orship, Platform, UI, and Zetro have no app-local `components/ui`
  library and no imports from package-private `packages/ui/src` paths.
- No application web workspace imports or declares MUI, Ant Design, Bootstrap, Chakra, Mantine,
  Radix UI, Base UI, shadcn, Semantic UI, or class-variance-authority directly.
- `lucide-react` remains an allowed icon provider. UI Gallery also keeps `recharts` because the
  showcase renders the real shared Chart specimen.
- Tiptap remains Docs-owned editor infrastructure rather than a general design-system primitive.
- Agent Crew's handwritten buttons, form controls, cards, metrics, alert, and switches were
  replaced with public shared components and workspace blocks.

## Boundary

`tools/check-ui-design-system.mjs` now checks both source imports and every application web
manifest. It fails when an application adds an external component framework, imports private UI
source, creates an app-local primitive directory, adds a package-owned UI Gallery folder,
or removes the required UI application gallery.

## Verification

- `npm.cmd run check:ui-system`
- Focused type checks and builds for UI, Docs, Agent Crew, and the shared UI package.
- Application, module, workspace, file-length, formatting, and diff checks.
