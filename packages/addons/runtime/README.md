# Add-On Runtime

This package provides the shared provider, service, record, and frontend contracts for CODEXSUN business add-ons.

## Ownership

The package owns reusable add-on composition helpers. It does not own business data, routes, migrations, or product behavior.

## Use

Business add-ons define their own `AddonDefinition`, then use `createAddonProvider()` and `createAddonService()`. Frontends use `AddonWorkspace` as a small accessible workspace surface until an application composes a full product view.

## Verification

```powershell
npm run check --workspace @codexsun/addon-runtime
npm run test --workspace @codexsun/addon-runtime
```
