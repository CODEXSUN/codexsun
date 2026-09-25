# Mailer Add-On

Business email, inboxes, threads, templates, sending, and email automation.

## Ownership

This package owns the mailer provider, public definition, service entry point, frontend workspace entry point, and add-on documentation.

## Backend

The package exports `createAddonProvider()` and `createMailerService()`. The provider publishes the `mailer.v1` contract and declared events. The current service is an in-memory foundation for local development. Persistence, external adapters, and application routes remain module-owned follow-up work.

## Frontend

The package exports `MailerWorkspace` from `./frontend`. The workspace uses the shared add-on runtime and can be composed by an application web host.

## Integration

Declared add-on dependencies: notifyz.

## Verification

```powershell
npm run check --workspace @codexsun/addon-mailer
npm run test --workspace @codexsun/addon-mailer
```

