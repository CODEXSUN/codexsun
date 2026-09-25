# Notifyz Add-On

Central notification engine for in-app, email, push, task, system, and workflow notifications.

## Ownership

This package owns the notifyz provider, public definition, service entry point, frontend workspace entry point, and add-on documentation.

## Backend

The package exports `createAddonProvider()` and `createNotifyzService()`. The provider publishes the `notifyz.v1` contract and declared events. The current service is an in-memory foundation for local development. Persistence, external adapters, and application routes remain module-owned follow-up work.

## Frontend

The package exports `NotifyzWorkspace` from `./frontend`. The workspace uses the shared add-on runtime and can be composed by an application web host.

## Integration

Declared add-on dependencies: none.

## Verification

```powershell
npm run check --workspace @codexsun/addon-notifyz
npm run test --workspace @codexsun/addon-notifyz
```

