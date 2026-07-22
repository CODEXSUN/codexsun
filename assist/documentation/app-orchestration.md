# App Operations

App Operations is the Super Admin runtime-status and application-bundle surface for the composed
Platform application.

## Repository Apps

- Platform: API `7010`, web `7020`.
- Billing: active repository-owned API and Web bundle composed into Platform.
- Email: active repository-owned API and Web bundle composed from `@codexsun/mail`.

Core, Framework, and UI remain foundation packages rather than tenant-selectable applications.
Application repositories publish their own bundle manifests through public package exports. Platform
imports those manifests and adds them to App Operations; it does not copy repository business logic.

## Controls

- Refresh probes Platform API and Platform Web and records response time.
- Bundle cards report public-package connection and readiness, not fictional standalone process health.
- Process lifecycle is owned by the root `npm run dev` command or the deployment supervisor.
- The Super Admin screen does not start, stop, restart, or update repository processes.
