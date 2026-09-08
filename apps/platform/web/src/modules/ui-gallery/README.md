# UI Gallery Web Module

## Purpose

The UI Gallery module provides a runnable view of the shared UI package.

## Identity and version

- Module ID: `ui-gallery`
- Version: `1.0.0`
- Scope: `platform`
- Status: `active`

## Ownership

- The module owns the `/ui` route and its navigation contribution.
- `packages/ui` owns the gallery template, component inventory, previews, and topology feature.
- The module owns no entities, tables, settings, or browser storage.

## Public contracts

- UI template: `@codexsun/ui/templates/ui-gallery`.
- Interface topology: `@codexsun/ui/features/interface-topology`.
- Events published or consumed: None.

## Verification

- The Platform composition tests cover the route and navigation entry.
- Browser checks cover search, preview tabs, overlay controls, label selection, and clipboard copy.

## Development records

- [2026-09-08 Shared UI Gallery and Interface Topology](../../../../../../assist/records/platform/2026-09-08-ui-gallery.md)
