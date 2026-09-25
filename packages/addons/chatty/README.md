# Chatty Add-On

Real-time team communication with channels, direct messages, groups, mentions, and message history.

## Ownership

This package owns the chatty provider, public definition, service entry point, frontend workspace entry point, and add-on documentation.

## Backend

The package exports `createAddonProvider()` and `createChattyService()`. The provider publishes the `chatty.v1` contract and declared events. The current service is an in-memory foundation for local development. Persistence, external adapters, and application routes remain module-owned follow-up work.

## Frontend

The package exports `ChattyWorkspace` from `./frontend`. The workspace uses the shared add-on runtime and can be composed by an application web host.

## Integration

Declared add-on dependencies: notifyz.

## Verification

```powershell
npm run check --workspace @codexsun/addon-chatty
npm run test --workspace @codexsun/addon-chatty
```

