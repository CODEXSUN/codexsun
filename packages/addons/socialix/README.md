# Socialix Add-On

Social media management for content creation, scheduling, publishing, campaigns, and analytics.

## Ownership

This package owns the socialix provider, public definition, service entry point, frontend workspace entry point, and add-on documentation.

## Backend

The package exports `createAddonProvider()` and `createSocialixService()`. The provider publishes the `socialix.v1` contract and declared events. The current service is an in-memory foundation for local development. Persistence, external adapters, and application routes remain module-owned follow-up work.

## Frontend

The package exports `SocialixWorkspace` from `./frontend`. The workspace uses the shared add-on runtime and can be composed by an application web host.

## Integration

Declared add-on dependencies: notifyz, flowix.

## Verification

```powershell
npm run check --workspace @codexsun/addon-socialix
npm run test --workspace @codexsun/addon-socialix
```

