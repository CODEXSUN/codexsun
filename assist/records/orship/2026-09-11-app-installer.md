# Orship App Installer

Date: 2026-09-11

Orship now includes a complete app installation system that uses the shared prerequisites as a pre-stack for client applications.

## Features Added

### 1. Prerequisites Build & Apply from Frontend
- Added `/api/orship/v1/prerequisites/build` endpoint to trigger `setup-prerequisites.sh`
- Frontend "Build & Apply" button runs the verified setup script
- "Force Rebuild" option passes `--build` flag to docker compose
- Loopback-only access for security

### 2. App Installer Workspace
New `AppInstallerWorkspace` component at `/app-installer` with:
- **Application Selection**: Browse available applications from `.container/catalog.json`
- **Customer Configuration**: Customer ID, environment (development/production)
- **Addon Selection**: Choose addons specific to the selected application
- **Port Overrides**: Customize component ports (6000-6999 range)
- **Dependency Resolution**: Automatically includes required applications
- **Two-Step Flow**: Prepare installation → Deploy

### 3. API Endpoints
- `GET /api/orship/v1/applications` - List available applications with components and addons
- `POST /api/orship/v1/applications/install` - Generate deployment profile and Docker Compose
- `POST /api/orship/v1/applications/deploy` - Start the generated Docker assembly

### 4. Contracts Extended
New Zod schemas in `@codexsun/orship-contracts`:
- `availableApplicationsSchema` - Catalog view with components and addons
- `appInstallationRequestSchema` - Installation input (app, customer, addons, ports, env)
- `appInstallationResultSchema` - Installation output (success, profileId, composePath)
- `prerequisiteBuildRequestSchema` / `prerequisiteBuildResponseSchema` - Build trigger

### 5. AppInstallerService
Core service that:
- Reads catalog.json and resolves application dependencies
- Generates deployment profiles per customer
- Uses `@codexsun/runtime` DeploymentPlanner for compose generation
- Writes profile to `.container/profiles/` and compose to `dist/deployments/`
- Generates environment.env with all required variables

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      .container/catalog.json                  │
│  (Applications: platform, zitro, docs, devkit, agent-crew,  │
│   orship, uiux)                                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    AppInstallerService                        │
│  1. Select app + customer + addons + port overrides          │
│  2. Resolve dependencies (app.requires)                      │
│  3. Create DeploymentProfile                                 │
│  4. DeploymentPlanner.createPlan()                           │
│  5. renderDockerCompose()                                    │
│  6. Write profile + compose + environment.env                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              dist/deployments/client-{id}-{app}/             │
│  compose.yaml  +  environment.env                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│           docker compose --env-file environment.env          │
│           -f compose.yaml up -d --build                      │
│          (joins prerequisites network)                       │
└─────────────────────────────────────────────────────────────┘
```

## Verification

- All TypeScript builds pass (`npm run build`)
- All typechecks pass for modified packages (`npm run typecheck`)
- Contracts build and export new types
- Frontend builds with new workspace chunk (`app-installer.workspace-*.js`)
- API builds with new service and routes

## Usage

1. Start prerequisites: `bash ./.container/prerequisites/setup-prerequisites.sh`
2. Open Orship web at `http://127.0.0.1:6091`
3. Navigate to "App Installer" page
4. Select application, enter customer ID, choose addons
5. Click "Prepare Installation" → "Deploy"
6. Application containers start on the shared prerequisites network