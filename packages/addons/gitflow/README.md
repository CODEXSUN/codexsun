# Gitflow Add-On

Developer collaboration around repositories, branches, commits, issues, pull requests, and development workflows.

## Ownership

This package owns the gitflow provider, public definition, service entry point, frontend workspace entry point, and add-on documentation.

## Backend

The package exports `createAddonProvider()` and `createGitflowService()`. The provider publishes the `gitflow.v1` contract and declared events. The current service is an in-memory foundation for local development. Persistence, external adapters, and application routes remain module-owned follow-up work.

## Frontend

The package exports `GitflowWorkspace` from `./frontend`. The workspace uses the shared add-on runtime and can be composed by an application web host.

## Integration

Declared add-on dependencies: taskez, notifyz, flowix.

## Verification

```powershell
npm run check --workspace @codexsun/addon-gitflow
npm run test --workspace @codexsun/addon-gitflow
```

