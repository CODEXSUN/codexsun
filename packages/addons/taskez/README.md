# Taskez Add-On

Structured task management with assignments, priorities, status, dependencies, and execution tracking.

## Ownership

This package owns the taskez provider, public definition, service entry point, frontend workspace entry point, and add-on documentation.

## Backend

The package exports `createAddonProvider()` and `createTaskezService()`. The provider publishes the `taskez.v1` contract and declared events. The current service is an in-memory foundation for local development. Persistence, external adapters, and application routes remain module-owned follow-up work.

## Frontend

The package exports `TaskezWorkspace` from `./frontend`. The workspace uses the shared add-on runtime and can be composed by an application web host.

## Integration

Declared add-on dependencies: notifyz, calendy, flowix.

## Verification

```powershell
npm run check --workspace @codexsun/addon-taskez
npm run test --workspace @codexsun/addon-taskez
```

