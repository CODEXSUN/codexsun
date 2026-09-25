# Calendy Add-On

Calendar, events, scheduling, availability, reminders, and meeting coordination.

## Ownership

This package owns the calendy provider, public definition, service entry point, frontend workspace entry point, and add-on documentation.

## Backend

The package exports `createAddonProvider()` and `createCalendyService()`. The provider publishes the `calendy.v1` contract and declared events. The current service is an in-memory foundation for local development. Persistence, external adapters, and application routes remain module-owned follow-up work.

## Frontend

The package exports `CalendyWorkspace` from `./frontend`. The workspace uses the shared add-on runtime and can be composed by an application web host.

## Integration

Declared add-on dependencies: notifyz, meety.

## Verification

```powershell
npm run check --workspace @codexsun/addon-calendy
npm run test --workspace @codexsun/addon-calendy
```

