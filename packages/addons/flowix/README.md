# Flowix Add-On

Workflow automation engine connecting add-ons, events, actions, conditions, triggers, and automated processes.

## Ownership

This package owns the flowix provider, public definition, service entry point, frontend workspace entry point, and add-on documentation.

## Backend

The package exports `createAddonProvider()` and `createFlowixService()`. The provider publishes the `flowix.v1` contract and declared events. The current service is an in-memory foundation for local development. Persistence, external adapters, and application routes remain module-owned follow-up work.

## Frontend

The package exports `FlowixWorkspace` from `./frontend`. The workspace uses the shared add-on runtime and can be composed by an application web host.

## Integration

Declared add-on dependencies: mailer, chatty, taskez, calendy, notez, wikiz, notifyz, socialix, meety, gitflow.

## Verification

```powershell
npm run check --workspace @codexsun/addon-flowix
npm run test --workspace @codexsun/addon-flowix
```

