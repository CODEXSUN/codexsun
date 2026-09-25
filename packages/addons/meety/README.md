# Meety Add-On

Meetings, agendas, participants, notes, decisions, action items, and meeting history.

## Ownership

This package owns the meety provider, public definition, service entry point, frontend workspace entry point, and add-on documentation.

## Backend

The package exports `createAddonProvider()` and `createMeetyService()`. The provider publishes the `meety.v1` contract and declared events. The current service is an in-memory foundation for local development. Persistence, external adapters, and application routes remain module-owned follow-up work.

## Frontend

The package exports `MeetyWorkspace` from `./frontend`. The workspace uses the shared add-on runtime and can be composed by an application web host.

## Integration

Declared add-on dependencies: calendy, notez, taskez.

## Verification

```powershell
npm run check --workspace @codexsun/addon-meety
npm run test --workspace @codexsun/addon-meety
```

