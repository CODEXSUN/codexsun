# Wikiz Add-On

Company knowledge base for structured documentation, procedures, guides, and internal knowledge.

## Ownership

This package owns the wikiz provider, public definition, service entry point, frontend workspace entry point, and add-on documentation.

## Backend

The package exports `createAddonProvider()` and `createWikizService()`. The provider publishes the `wikiz.v1` contract and declared events. The current service is an in-memory foundation for local development. Persistence, external adapters, and application routes remain module-owned follow-up work.

## Frontend

The package exports `WikizWorkspace` from `./frontend`. The workspace uses the shared add-on runtime and can be composed by an application web host.

## Integration

Declared add-on dependencies: none.

## Verification

```powershell
npm run check --workspace @codexsun/addon-wikiz
npm run test --workspace @codexsun/addon-wikiz
```

