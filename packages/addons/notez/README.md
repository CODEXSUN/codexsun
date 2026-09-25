# Notez Add-On

Fast personal and team notes with rich text, organization, search, and linking.

## Ownership

This package owns the notez provider, public definition, service entry point, frontend workspace entry point, and add-on documentation.

## Backend

The package exports `createAddonProvider()` and `createNotezService()`. The provider publishes the `notez.v1` contract and declared events. The current service is an in-memory foundation for local development. Persistence, external adapters, and application routes remain module-owned follow-up work.

## Frontend

The package exports `NotezWorkspace` from `./frontend`. The workspace uses the shared add-on runtime and can be composed by an application web host.

## Integration

Declared add-on dependencies: wikiz, meety.

## Verification

```powershell
npm run check --workspace @codexsun/addon-notez
npm run test --workspace @codexsun/addon-notez
```

