# DevKit Project Registry Web Module

## Purpose

Owns the visual Project Registry drill-down, node upsert forms, and module
profile workspace. It presents one hierarchy level at a time, then opens a
profile for terminal modules.

The workspace is Tailwind-first. Its stylesheet contains only root-document
bootstrapping; layout and component presentation remain beside their markup.

## Identity and contracts

- Module ID: `devkit.project-registry.web`
- Version: `0.7.1`
- Route: DevKit web root
- API: consumes only `@codexsun/devkit-contracts` through DevKit v1 routes.

## User flows

- Drill down Project → App → Module Group → Submodule Group → Module → Profile.
- Open a group name to drill into its inner table. Open a module name directly
  to its profile.
- A module is the final planning level. It has no child-creation action and
  its menu exposes Profile and Edit only.
- Create or update an allowed child node from the current level.
- Open a module profile and upsert Database, Routes, Files, Actions, Events,
  and Planning specifications.
- User, Role, Permission, User role, and Role permission are direct terminal
  profiles in the Access control group. The User profile retains the migrated
  endpoint specifications. Its Info tab has module and registry panels plus
  editable seeded demo details; every specification tab is populated. Tab
  changes use a short, reduced-motion-safe fade and rise transition.
- Search, filter, hide table columns, paginate, return to a parent level, and
  recover from loading or API errors.
- Every DevKit table uses `@codexsun/ui/blocks/table`. Profile detail and
  specification tables use its compact section layout; only DevKit data,
  columns, and callbacks remain in this module.

## Development records

See [DevKit development records](../../../../../../assist/records/devkit/README.md).
