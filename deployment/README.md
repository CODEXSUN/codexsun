# Deployment

This folder owns deployment profiles and environment-specific deployment definitions.

Each deployment profile must name its applications, add-ons, infrastructure dependencies, storage requirements, environment variables, and verification checks.

Deployments select the required composition for one client. They must not change module ownership or contain reusable application code.

Read [the module architecture guide](../assist/architecture/module-architecture.md) and [runtime layout guide](../assist/operations/runtime-layout.md) before adding a profile.
